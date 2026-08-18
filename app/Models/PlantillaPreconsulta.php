<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PlantillaPreconsulta extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'plantillas_preconsulta';

    protected $fillable = [
        'empresa_id',
        'especialidad_id',
        'tipo_atencion_id',
        'titulo',
        'descripcion',
        'preguntas',
        'is_active',
    ];

    protected $casts = [
        'preguntas' => 'array',
        'is_active' => 'boolean',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function especialidad()
    {
        return $this->belongsTo(Especialidad::class);
    }

    public function tipoAtencion()
    {
        return $this->belongsTo(TipoAtencion::class);
    }

    public function citaPreconsultas()
    {
        return $this->hasMany(CitaPreconsulta::class, 'plantilla_id');
    }
}
