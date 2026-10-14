<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Espejo de GET /att/api/attshifts/ (turno: horarios asignados a los días de
 * la semana). Independiente de turnos_laborales.
 *
 * @property array<string,mixed>|null $raw
 */
class BiotimeTurno extends Model
{
    protected $table = 'biotime_turnos';

    protected $fillable = [
        'empresa_id',
        'biotime_id',
        'alias',
        'shift_timetable',
        'cycle_unit',
        'shift_cycle',
        'auto_shift',
        'raw',
    ];

    protected function casts(): array
    {
        return [
            'auto_shift' => 'boolean',
            'raw' => 'array',
        ];
    }

    /** @return HasMany<BiotimeCalendario, $this> */
    public function calendarios(): HasMany
    {
        return $this->hasMany(BiotimeCalendario::class, 'biotime_turno_id');
    }

    /**
     * Alias de los horarios del turno. BioTime los manda en una sola cadena
     * separada por comas ("L-V 8:00 - 16:30,S 8:00-13:30").
     *
     * @return array<int,string>
     */
    public function horariosAlias(): array
    {
        return array_values(array_filter(array_map('trim', explode(',', (string) $this->shift_timetable))));
    }
}
