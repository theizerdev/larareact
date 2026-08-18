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
        ];
    }

    /**
     * Get the pais that this empresa belongs to.
     */
    public function pais(): BelongsTo
    {
        return $this->belongsTo(Pais::class);
    }

    /**
     * Get the pais_telefono that this empresa belongs to.
     */
    public function paisTelefono(): BelongsTo
    {
        return $this->belongsTo(Pais::class, 'pais_telefono_id');
    }

    /**
     * Especialidades médicas habilitadas para esta clínica/empresa.
     */
    public function especialidades()
    {
        return $this->belongsToMany(Especialidad::class, 'empresa_especialidades', 'empresa_id', 'especialidad_id')
            ->withPivot('es_principal', 'status')
            ->withTimestamps();
    }

    /**
     * Especialidad médica principal de la clínica/empresa.
     */
    public function especialidadPrincipal()
    {
        return $this->belongsToMany(Especialidad::class, 'empresa_especialidades', 'empresa_id', 'especialidad_id')
            ->wherePivot('es_principal', true)
            ->limit(1);
    }
}
