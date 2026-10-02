<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Espejo de GET /personnel/api/areas/ (solo lectura).
 */
class BiotimeArea extends Model
{
    protected $table = 'biotime_areas';

    protected $fillable = [
        'empresa_id',
        'biotime_id',
        'area_code',
        'area_name',
        'parent_area_code',
        'raw',
    ];

    protected function casts(): array
    {
        return [
            'raw' => 'array',
        ];
    }
}
