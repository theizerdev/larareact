<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Espejo de GET /personnel/api/departments/ (solo lectura).
 */
class BiotimeDepartamento extends Model
{
    protected $table = 'biotime_departamentos';

    protected $fillable = [
        'empresa_id',
        'biotime_id',
        'dept_code',
        'dept_name',
        'parent_dept_code',
        'raw',
    ];

    protected function casts(): array
    {
        return [
            'raw' => 'array',
        ];
    }
}
