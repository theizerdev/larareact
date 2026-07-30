<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Empresa extends Model
{
    use HasSpanishActivityLog, LogsActivity;

    protected $table = 'empresas';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['razon_social', 'documento', 'status', 'telefono', 'email'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'pais_id',
        'razon_social',
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
     * Comprueba si la empresa está en período de prueba gratis (7 días).
     */
    public function isOnTrial(): bool
    {
        if ($this->isExemptFromSubscription()) {
            return false;
        }

        if ($this->subscription_status === 'trial' && $this->trial_ends_at) {
            return now()->lte($this->trial_ends_at);
        }

        return false;
    }

    /**
     * Comprueba si la empresa tiene una suscripción activa o prueba vigente.
     */
    public function hasActiveSubscription(): bool
    {
        if ($this->isExemptFromSubscription()) {
            return true;
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
     * Retorna los días restantes de prueba o suscripción activa.
     */
    public function getDiasRestantesSuscripcionAttribute(): int
    {
        if ($this->isExemptFromSubscription()) {
            return 9999;
        }

        $fechaVencimiento = match ($this->subscription_status) {
            'trial' => $this->trial_ends_at,
            'active' => $this->subscription_expires_at,
            default => null,
        };

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

