<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlantillaConsulta extends Model
{
    protected $table = 'plantillas_consultas';

    protected $fillable = [
        'especialidad_id',
        'nombre',
        'descripcion',
        'estructura_json',
        'es_sistema',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'estructura_json' => 'array',
            'es_sistema' => 'boolean',
            'status' => 'boolean',
        ];
    }

    public function especialidad(): BelongsTo
    {
        return $this->belongsTo(Especialidad::class, 'especialidad_id');
    }
}
