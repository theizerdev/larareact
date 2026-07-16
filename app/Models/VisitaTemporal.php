<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class VisitaTemporal extends Model
{
    use HasFactory, HasSpanishActivityLog, LogsActivity;

    protected $table = 'visitas_temporales';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'nombres', 
                'apellidos', 
                'documento_identidad', 
                'telefono', 
                'responsable_id', 
                'motivo_visita', 
                'fecha_ingreso', 
                'hora_ingreso', 
                'fecha_salida', 
                'hora_salida', 
                'status'
            ])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn(string $eventName) => static::getSpanishDescription($eventName));
    }


    protected $fillable = [
        'nombres',
        'apellidos',
        'documento_identidad',
        'pais_telefono_id',
        'telefono',
        'empleado_id',
        'responsable_id',
        'motivo_visita',
        'fecha_ingreso',
        'hora_ingreso',
        'fecha_salida',
        'hora_salida',
        'foto_carnet',
        'foto_documento',
        'empresa_id',
        'sucursal_id',
        'status',
    ];

    protected $casts = [
        'fecha_ingreso' => 'date:Y-m-d',
        'fecha_salida' => 'date:Y-m-d',
    ];

    public function paisTelefono(): BelongsTo
    {
        return $this->belongsTo(Pais::class, 'pais_telefono_id');
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Responsable::class, 'responsable_id');
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    /** Nombre completo del visitante */
    public function getNombreCompletoAttribute(): string
    {
        return "{$this->nombres} {$this->apellidos}";
    }
}
