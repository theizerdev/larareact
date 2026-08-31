<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Espejo de GET /personnel/api/employees/ (solo lectura) más el vínculo
 * suave (empleado_id) hacia el empleado de Shigoto.
 */
class BiotimeEmpleado extends Model
{
    protected $table = 'biotime_empleados';

    protected $fillable = [
        'empresa_id',
        'biotime_id',
        'emp_code',
        'first_name',
        'last_name',
        'nickname',
        'card_no',
        'dept_code',
        'position_code',
        'area_names',
        'hire_date',
        'gender',
        'birthday',
        'mobile',
        'email',
        'national',
        'internal_emp_num',
        'payroll_num',
        'enable_att',
        'photo_path',
        'photo_synced_at',
        'empleado_id',
        'link_status',
        'raw',
    ];

    protected function casts(): array
    {
        return [
            'area_names' => 'array',
            'raw' => 'array',
            'hire_date' => 'date',
            'birthday' => 'date',
            'photo_synced_at' => 'datetime',
            'enable_att' => 'boolean',
        ];
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function marcajes(): HasMany
    {
        return $this->hasMany(BiotimeMarcaje::class, 'biotime_empleado_id');
    }

    public function getNombreCompletoAttribute(): string
    {
        return trim(($this->first_name ?? '').' '.($this->last_name ?? ''));
    }
}
