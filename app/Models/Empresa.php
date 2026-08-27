<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Empresa extends Model
{
    use HasSpanishActivityLog, LogsActivity, Multitenantable;

    protected $table = 'empresas';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'pais_id',
        'razon_social',
        'nombre_comercial',
        'documento',
        'pais_telefono_id',
        'zona_horaria',
        'logo',
        'logo_mini',
        'logo_ticket_size',
        'direccion',
        'latitud',
        'longitud',
        'representante_legal',
        'curp_representante_legal',
        'telefono',
        'email',
        'status',
        'api_key',
        'whatsapp_api_key',
        'whatsapp_api_url',
        'whatsapp_instance',
        'whatsapp_rate_limit',
        'whatsapp_warmup_mode',
        'whatsapp_working_hours_enabled',
        'whatsapp_working_hours_start',
        'whatsapp_working_hours_end',
        'whatsapp_proxy_url',
        'whatsapp_active',
        'whatsapp_phone',
        'whatsapp_status',
        'whatsapp_last_connected',
        'mapbox_api_key',
        'mapbox_active',
        'google_maps_api_key',
        'google_maps_active',
        'control_acceso_base_url',
        'control_acceso_app_token',
        'control_acceso_user_token',
        'control_acceso_active',
        'jaak_api_key',
        'jaak_environment',
        'jaak_active',
         'paypal_active',
        'paypal_mode',
        'paypal_client_id',
        'paypal_client_secret',
        'mercadopago_active',
        'mercadopago_mode',
        'mercadopago_public_key',
        'mercadopago_access_token',
        'stripe_active',
        'stripe_mode',
        'stripe_publishable_key',
        'stripe_secret_key',
        'stripe_webhook_secret',
        'subscription_status',
        'trial_ends_at',
        'subscription_expires_at',
        'billing_cycle',
        'max_sucursales',
    ];

    protected $casts = [
        'whatsapp_warmup_mode' => 'boolean',
        'whatsapp_working_hours_enabled' => 'boolean',
        'whatsapp_active' => 'boolean',
    ];

      protected function casts(): array
    {
        return [
            'latitud' => 'decimal:8',
            'longitud' => 'decimal:8',
            'status' => 'boolean',
            'whatsapp_active' => 'boolean',
            'whatsapp_rate_limit' => 'integer',
            'whatsapp_last_connected' => 'datetime',
            'mapbox_active' => 'boolean',
            'google_maps_active' => 'boolean',
            'paypal_active' => 'boolean',
            'mercadopago_active' => 'boolean',
            'stripe_active' => 'boolean',
            'trial_ends_at' => 'datetime',
            'subscription_expires_at' => 'datetime',
            'max_sucursales' => 'integer',
        ];
    }

     protected $appends = [
        'dias_restantes_suscripcion',
        'estado_suscripcion_legible',
    ];

    /**
     * Get the pais that this empresa belongs to.
     */
    public function pais(): BelongsTo
    {
        return $this->belongsTo(Pais::class);
    }

    /**
     * Country used for telephone code (paisTelefono)
     */
    public function paisTelefono(): BelongsTo
    {
        return $this->belongsTo(Pais::class, 'pais_telefono_id');
    }

    public function sucursales(): HasMany
    {
        return $this->hasMany(Sucursal::class, 'empresa_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'empresa_id');
    }

    public function subscriptionPayments(): HasMany
    {
        return $this->hasMany(SubscriptionPayment::class, 'empresa_id');
    }

    /**
     * La Empresa ID 1 (Dueña del SaaS) está exenta de control de suscripción.
     */
    public function isExemptFromSubscription(): bool
    {
        return $this->id === 1;
    }

    /**
     * Obtiene el registro de suscripción más reciente desde la tabla 'subscriptions'.
     * Busca primero un registro activo o trial vigente; si no existe, toma el más reciente por ID.
     */
    public function getLatestSubscriptionRecord(): ?Subscription
    {
        $sub = $this->subscriptions()->whereIn('estado', ['active', 'trial'])->orderBy('fecha_vencimiento', 'desc')->first()
            ?? $this->subscriptions()->orderBy('id', 'desc')->first();

        if (! $sub && ! $this->isExemptFromSubscription()) {
            $fechaVencimiento = $this->subscription_expires_at ?? $this->trial_ends_at ?? $this->created_at?->copy()->addDays(7) ?? now();
            $isExpired = now()->gt($fechaVencimiento);
            $estado = $isExpired ? 'expired' : ($this->subscription_status ?: 'trial');

            $defaultPlan = SubscriptionPlan::getPlanRenovacionDefault();
            $sub = Subscription::create([
                'empresa_id' => $this->id,
                'plan_id' => $defaultPlan?->id,
                'nombre_plan' => $estado === 'trial' ? 'Prueba Gratuita' : ($defaultPlan?->nombre ?? 'Plan Mensual'),
                'ciclo_meses' => $estado === 'trial' ? 0 : 1,
                'max_sucursales' => $this->max_sucursales ?? 1,
                'monto_total' => 0.00,
                'fecha_inicio' => $this->created_at ?? now(),
                'fecha_vencimiento' => $fechaVencimiento,
                'estado' => $estado,
            ]);
        }

        if ($sub && ! $this->isExemptFromSubscription()) {
            // Auto-expirar la suscripción si la fecha de vencimiento ya transcurrió
            if ($sub->fecha_vencimiento && now()->gt($sub->fecha_vencimiento) && $sub->estado !== 'expired') {
                $sub->update(['estado' => 'expired']);
                $sub->estado = 'expired';
                if ($this->subscription_status !== 'expired') {
                    $this->update(['subscription_status' => 'expired']);
                }
            }

            // Normalizar nombres antiguos
            if (in_array($sub->nombre_plan, ['Plan Básico', 'Plan Profesional', 'Plan Corporativo', 'Plan Prueba (7 días)'])) {
                $nuevoNombre = Subscription::getNombrePlanByCiclo($sub->ciclo_meses);
                $sub->update(['nombre_plan' => $nuevoNombre]);
                $sub->nombre_plan = $nuevoNombre;
            }
        }

        return $sub;
    }

    /**
     * Comprueba si la empresa está en período de prueba gratis (7 días) leyendo la tabla subscriptions.
     */
    public function isOnTrial(): bool
    {
        if ($this->isExemptFromSubscription()) {
            return false;
        }

        $sub = $this->getLatestSubscriptionRecord();
        return $sub && $sub->estado === 'trial' && $sub->fecha_vencimiento && now()->lte($sub->fecha_vencimiento);
    }

    /**
     * Comprueba si la empresa tiene una suscripción activa o prueba vigente leyendo exclusivamente la tabla subscriptions.
     */
    public function hasActiveSubscription(): bool
    {
        if ($this->isExemptFromSubscription()) {
            return true;
        }

        $sub = $this->getLatestSubscriptionRecord();
        if ($sub && in_array($sub->estado, ['active', 'trial']) && $sub->fecha_vencimiento) {
            return now()->lte($sub->fecha_vencimiento);
        }

        return false;
    }

    /**
     * Comprueba si la suscripción o prueba ha caducado.
     */
    public function isSubscriptionExpired(): bool
    {
        return ! $this->hasActiveSubscription();
    }

    /**
     * Retorna los días restantes de prueba o suscripción activa basándose exclusivamente en la tabla subscriptions.
     */
    public function getDiasRestantesSuscripcionAttribute(): int
    {
        if ($this->isExemptFromSubscription()) {
            return 9999;
        }

        $sub = $this->getLatestSubscriptionRecord();
        if (! $sub || ! $sub->fecha_vencimiento || $sub->estado === 'expired' || now()->gt($sub->fecha_vencimiento)) {
            return 0;
        }

        $now = now();
        if ($now->gt($sub->fecha_vencimiento)) {
            return 0;
        }

        $days = (int) $now->diffInDays($sub->fecha_vencimiento, false);
        if ($days === 0 && $now->lt($sub->fecha_vencimiento)) {
            return 1;
        }

        return max(0, $days);
    }

    /**
     * Retorna el texto legible del estado de suscripción leyendo la tabla subscriptions.
     */
    public function getEstadoSuscripcionLegibleAttribute(): string
    {
        if ($this->isExemptFromSubscription()) {
            return 'Acceso Ilimitado';
        }

        $sub = $this->getLatestSubscriptionRecord();

        if ($sub && $sub->estado === 'trial' && $sub->fecha_vencimiento && now()->lte($sub->fecha_vencimiento)) {
            return 'Prueba Gratis (' . $this->dias_restantes_suscripcion . ' días restantes)';
        }

        if ($sub && $sub->estado === 'active' && $sub->fecha_vencimiento && now()->lte($sub->fecha_vencimiento)) {
            return 'Activo (' . $this->dias_restantes_suscripcion . ' días restantes)';
        }

        return 'Vencida';
    }

    /**
     * Generar un API key seguro.
     */
    public static function generateApiKey(): string
    {
        return bin2hex(random_bytes(32));
    }
   
}
