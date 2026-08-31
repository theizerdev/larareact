<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Empresa extends Model
{
    use HasSpanishActivityLog, LogsActivity, Multitenantable;

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
        'nombre_comercial',
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
