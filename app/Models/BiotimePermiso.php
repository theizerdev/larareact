<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Espejo de GET /att/api/leaves/ (permisos e incidencias de BioTime).
 *
 * No justifica faltas ni toca el cálculo LFT: es sólo consulta.
 *
 * @property Carbon|null $start_time
 * @property Carbon|null $end_time
 * @property Carbon|null $apply_time
 * @property Carbon|null $audit_time
 * @property array<string,mixed>|null $raw
 */
class BiotimePermiso extends Model
{
    protected $table = 'biotime_permisos';

    protected $fillable = [
        'empresa_id',
        'biotime_id',
        'emp_code',
        'biotime_empleado_id',
        'empleado_id',
        'first_name',
        'last_name',
        'dept_name',
        'category',
        'start_time',
        'end_time',
        'apply_reason',
        'apply_time',
        'audit_status',
        'audit_reason',
        'audit_time',
        'last_approver',
        'raw',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'apply_time' => 'datetime',
            'audit_time' => 'datetime',
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
}
