<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Especialidad extends Model
{
    protected $table = 'especialidades';

    protected $fillable = [
        'rama_medica_id',
        'nombre',
        'slug',
        'codigo',
        'icono',
        'color',
        'descripcion',
        'costo_consulta_sugerido',
        'duracion_consulta_minutos',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'costo_consulta_sugerido' => 'decimal:2',
            'duracion_consulta_minutos' => 'integer',
            'status' => 'boolean',
        ];
    }

    public function ramaMedica(): BelongsTo
    {
        return $this->belongsTo(RamaMedica::class, 'rama_medica_id');
    }

    public function empresas(): BelongsToMany
    {
        return $this->belongsToMany(Empresa::class, 'empresa_especialidades', 'especialidad_id', 'empresa_id')
            ->withPivot('es_principal', 'status')
            ->withTimestamps();
    }

    public function plantillas(): HasMany
    {
        return $this->hasMany(PlantillaConsulta::class, 'especialidad_id');
    }
}
