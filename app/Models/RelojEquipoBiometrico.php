<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class RelojEquipoBiometrico extends Model
{
    use HasSpanishActivityLog, LogsActivity, Multitenantable;

    protected $table = 'reloj_equipos_biometricos';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'empresa_id',
                'reloj_ubicacion_id',
                'legacy',
                'localidad_nombre',
                'numero_localidad',
                'ubicacion_fisica',
                'actual_no_serie',
                'actual_ip',
                'actual_instalado',
                'nuevo_marca',
                'nuevo_modelo',
                'nuevo_no_serie',
                'nuevo_ip',
                'nuevo_mac_address',
                'nuevo_instalado',
                'activo',
            ])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'empresa_id',
        'reloj_ubicacion_id',
        'legacy',
        'localidad_nombre',
        'numero_localidad',
        'ubicacion_fisica',
        'actual_no_serie',
        'actual_ip',
        'actual_mascara',
        'actual_gateway',
        'actual_instalado',
        'actual_comentario',
        'nuevo_marca',
        'nuevo_modelo',
        'nuevo_no_serie',
        'nuevo_ip',
        'nuevo_mascara',
        'nuevo_gateway',
        'nuevo_instalado',
        'nuevo_comentario',
        'nuevo_mac_address',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'numero_localidad' => 'integer',
            'actual_instalado' => 'boolean',
            'nuevo_instalado' => 'boolean',
            'activo' => 'boolean',
        ];
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function ubicacion(): BelongsTo
    {
        return $this->belongsTo(RelojUbicacion::class, 'reloj_ubicacion_id');
    }
}

