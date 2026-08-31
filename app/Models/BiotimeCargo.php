<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Espejo de GET /personnel/api/positions/ (solo lectura).
 */
class BiotimeCargo extends Model
{
    protected $table = 'biotime_cargos';

    protected $fillable = [
        'empresa_id',
        'biotime_id',
        'position_code',
        'position_name',
        'raw',
    ];

    protected function casts(): array
    {
        return [
            'raw' => 'array',
        ];
    }
}
