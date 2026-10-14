<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Espejo de GET /att/api/timeintervals/ (horario: hora de entrada/salida y
 * duración de la jornada). Independiente de turnos_laborales.
 *
 * @property array<string,mixed>|null $raw
 */
class BiotimeHorario extends Model
{
    protected $table = 'biotime_horarios';

    protected $fillable = [
        'empresa_id',
        'biotime_id',
        'alias',
        'use_mode',
        'in_time',
        'out_time',
        'duration',
        'work_time_duration',
        'break_time_duration',
        'cross_day',
        'in_required',
        'out_required',
        'raw',
    ];

    protected function casts(): array
    {
        return [
            'cross_day' => 'boolean',
            'in_required' => 'boolean',
            'out_required' => 'boolean',
            'raw' => 'array',
        ];
    }
}
