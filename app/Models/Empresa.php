<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Empresa extends Model
{
    use HasSpanishActivityLog, LogsActivity, Multitenantable;

    protected $table = 'empresas';

    protected static function booted(): void
    {
        // Toda empresa tiene liga de acceso (/e/{slug}); si no se captura, se
        // genera del nombre.
        static::saving(function (Empresa $empresa) {
            if (! $empresa->slug) {
                $base = Str::slug($empresa->nombre_comercial ?: $empresa->razon_social) ?: 'empresa';
                $slug = $base;
                for ($i = 2; static::withoutTenant()->where('slug', $slug)->whereKeyNot($empresa->getKey())->exists(); $i++) {
                    $slug = "{$base}-{$i}";
                }
                $empresa->slug = $slug;
            }
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['razon_social', 'documento', 'status', 'telefono', 'email'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    /**
     * Llaves y tokens de integraciones: nunca se mandan al navegador al
     * serializar la empresa (p. ej. como relación en Sucursales). Las pantallas
     * de Integraciones los leen por nombre y deciden qué mostrar.
     */
    protected $hidden = [
        'api_key',
        'whatsapp_api_key',
        'mapbox_api_key',
        'google_maps_api_key',
        'control_acceso_app_token',
        'control_acceso_user_token',
        'jaak_api_key',
        'zapsign_api_token',
        'didit_api_key',
        'didit_webhook_secret',
        'zapsign_webhook_secret',
        'biotime_password',
    ];

    protected $fillable = [
        'pais_id',
        'razon_social',
        'nombre_comercial',
        'slug',
        'documento',
        'pais_telefono_id',
        'zona_horaria',
        'logo',
        'logo_mini',
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
        'zapsign_api_token',
        'zapsign_environment',
        'zapsign_active',
        'didit_api_key',
        'didit_workflow_id',
        'didit_active',
        'didit_webhook_secret',
        'zapsign_webhook_secret',
        'biotime_base_url',
        'biotime_username',
        'biotime_password',
        'biotime_active',
        'biotime_last_sync_at',
        'biotime_last_transaction_id',
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
            'control_acceso_active' => 'boolean',
            'jaak_api_key' => 'encrypted',
            'jaak_active' => 'boolean',
            'zapsign_api_token' => 'encrypted',
            'zapsign_active' => 'boolean',
            'didit_api_key' => 'encrypted',
            'didit_webhook_secret' => 'encrypted',
            'zapsign_webhook_secret' => 'encrypted',
            'didit_active' => 'boolean',
            'biotime_password' => 'encrypted',
            'biotime_active' => 'boolean',
            'biotime_last_sync_at' => 'datetime',
            'biotime_last_transaction_id' => 'integer',
        ];
    }

    /**
     * Get the pais that this empresa belongs to.
     */
    public function pais(): BelongsTo
    {
        return $this->belongsTo(Pais::class);
    }
}
