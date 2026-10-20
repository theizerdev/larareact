<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Espejo de GET /att/api/attschedules/ (qué turno tiene asignado cada
 * empleado y en qué rango de fechas).
 *
 * @property Carbon|null $start_date
 * @property Carbon|null $end_date
 * @property array<string,mixed>|null $raw
 */
class BiotimeCalendario extends Model
{
    protected $table = 'biotime_calendarios';

    protected $fillable = [
        'empresa_id',
        'biotime_id',
        'employee_biotime_id',
        'shift_biotime_id',
        'biotime_empleado_id',
        'empleado_id',
        'biotime_turno_id',
        'start_date',
        'end_date',
        'raw',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'raw' => 'array',
        ];
    }

    /** @return BelongsTo<BiotimeEmpleado, $this> */
    public function biotimeEmpleado(): BelongsTo
    {
        return $this->belongsTo(BiotimeEmpleado::class, 'biotime_empleado_id');
    }

    /** @return BelongsTo<Empleado, $this> */
    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    /** @return BelongsTo<BiotimeTurno, $this> */
    public function turno(): BelongsTo
    {
        return $this->belongsTo(BiotimeTurno::class, 'biotime_turno_id');
    }
}
