<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RamaMedica extends Model
{
    protected $table = 'ramas_medicas';

    protected $fillable = [
        'nombre',
        'slug',
        'icono',
        'descripcion',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'boolean',
        ];
    }

    public function especialidades(): HasMany
    {
        return $this->hasMany(Especialidad::class, 'rama_medica_id');
    }
}
