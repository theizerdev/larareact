<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class TurnoLaboral extends Model
{
    use HasFactory, HasSpanishActivityLog, LogsActivity, Multitenantable;

    protected $table = 'turnos_laborales';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'nombre',
                'tipo_jornada',
                'hora_entrada',
                'hora_salida',
                'horas_diarias_ley',
                'minutos_descanso',
                'descanso_pagado',
                'dias_laborables',
                'status',
            ])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'nombre',
        'tipo_jornada',
        'hora_entrada',
        'hora_salida',
        'horas_diarias_ley',
        'minutos_descanso',
        'descanso_pagado',
        'dias_laborables',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'boolean',
            'descanso_pagado' => 'boolean',
            'dias_laborables' => 'array',
            'horas_diarias_ley' => 'decimal:2',
            'minutos_descanso' => 'integer',
        ];
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function empleados(): HasMany
    {
        return $this->hasMany(Empleado::class, 'turno_laboral_id');
    }
}
