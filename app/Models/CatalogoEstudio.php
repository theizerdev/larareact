<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatalogoEstudio extends Model
{
    use HasFactory;

    protected $table = 'catalogo_estudios';

    protected $fillable = [
        'empresa_id',
        'especialidad_id',
        'tipo_estudio',
        'nombre_estudio',
        'indicaciones_predeterminadas',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function especialidad(): BelongsTo
    {
        return $this->belongsTo(Especialidad::class, 'especialidad_id');
    }
}
