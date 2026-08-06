<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Pais;
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
            ->logOnly(['razon_social', 'nombre_comercial', 'documento', 'status', 'telefono', 'email'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'pais_id',
        'razon_social',
        'nombre_comercial',
        'documento',
        'pais_telefono_id',
        'logo',
        'logo_mini',
        'direccion',
        'latitud',
        'longitud',
        'representante_legal',
        'telefono',
        'email',
        'status',
        'api_key',
        'whatsapp_api_key',
        'whatsapp_api_url',
        'whatsapp_instance',
        'whatsapp_rate_limit',
        'whatsapp_active',
        'whatsapp_phone',
        'whatsapp_status',
        'whatsapp_last_connected',
        'valor_dolar',
        'mapbox_api_key',
        'mapbox_active',
        'google_maps_api_key',
        'google_maps_active',
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

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class, 'empresa_id');
    }

    public function subscriptionPayments()
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
     * Si la empresa no tiene un registro previo en 'subscriptions', crea uno automáticamente.
     */
    public function getLatestSubscriptionRecord(): ?Subscription
    {
        $sub = $this->subscriptions()->orderBy('id', 'desc')->first();

        if (! $sub && ! $this->isExemptFromSubscription()) {
            $estado = $this->subscription_status ?: 'trial';
            $fechaVencimiento = match ($estado) {
                'trial' => $this->trial_ends_at ?? now()->addDays(7),
                'active' => $this->subscription_expires_at ?? now()->addYear(),
                default => $this->subscription_expires_at ?? $this->trial_ends_at ?? now()->addDays(7),
            };

            $sub = Subscription::create([
                'empresa_id' => $this->id,
                'plan_id' => SubscriptionPlan::getPlanRenovacionDefault()?->id,
                'nombre_plan' => $estado === 'trial' ? 'Plan Prueba (7 días)' : 'Plan Profesional',
                'ciclo_meses' => $estado === 'trial' ? 0 : 12,
                'max_sucursales' => $this->max_sucursales ?? 1,
                'monto_total' => 0.00,
                'fecha_inicio' => $this->created_at ?? now(),
                'fecha_vencimiento' => $fechaVencimiento,
                'estado' => $estado,
            ]);
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
        if ($sub && $sub->estado === 'trial' && $sub->fecha_vencimiento) {
            return now()->lte($sub->fecha_vencimiento);
        }

        if ($this->subscription_status === 'trial' && $this->trial_ends_at) {
            return now()->lte($this->trial_ends_at);
        }

        return false;
    }

    /**
     * Comprueba si la empresa tiene una suscripción activa o prueba vigente leyendo la tabla subscriptions.
     */
    public function hasActiveSubscription(): bool
    {
        if ($this->isExemptFromSubscription()) {
            return true;
        }

        $sub = $this->getLatestSubscriptionRecord();
        if ($sub) {
            if (in_array($sub->estado, ['active', 'trial']) && $sub->fecha_vencimiento) {
                return now()->lte($sub->fecha_vencimiento);
            }
            return false;
        }

        if ($this->isOnTrial()) {
            return true;
        }

        if ($this->subscription_status === 'active' && $this->subscription_expires_at) {
            return now()->lte($this->subscription_expires_at);
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
     * Retorna los días restantes de prueba o suscripción activa basándose en la tabla subscriptions.
     */
    public function getDiasRestantesSuscripcionAttribute(): int
    {
        if ($this->isExemptFromSubscription()) {
            return 9999;
        }

        $sub = $this->getLatestSubscriptionRecord();
        $fechaVencimiento = $sub?->fecha_vencimiento;

        if (! $fechaVencimiento) {
            $fechaVencimiento = match ($this->subscription_status) {
                'trial' => $this->trial_ends_at,
                'active' => $this->subscription_expires_at,
                default => null,
            };
        }

        if (! $fechaVencimiento) {
            return 0;
        }

        if (now()->gt($fechaVencimiento)) {
            return 0;
        }

        return (int) ceil(now()->diffInDays($fechaVencimiento, false));
    }

    /**
     * Retorna el texto legible del estado de suscripción.
     */
    public function getEstadoSuscripcionLegibleAttribute(): string
    {
        if ($this->isExemptFromSubscription()) {
            return 'Acceso Ilimitado';
        }

        if ($this->isOnTrial()) {
            return 'Prueba Gratis (' . $this->dias_restantes_suscripcion . ' días restantes)';
        }

        if ($this->hasActiveSubscription()) {
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

