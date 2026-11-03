<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RelojCedulaActividadCatalogo extends Model
{
    use HasFactory;

    protected $table = 'reloj_cedula_actividades_catalogo';

    protected $fillable = [
        'etapa_num',
        'etapa_nombre',
        'sub_etapa_letra',
        'sub_etapa_nombre',
        'orden',
        'numero_actividad',
        'descripcion',
        'tipo',
        'responsable_default',
        'valida_default',
        'fecha_compromiso_default',
        'entregable_evidencia',
        'observaciones_default',
        'activo',
    ];

    protected $casts = [
        'etapa_num' => 'integer',
        'orden' => 'integer',
        'numero_actividad' => 'integer',
        'activo' => 'boolean',
    ];

    public function items()
    {
        return $this->hasMany(RelojBiometricoCedulaItem::class, 'catalogo_actividad_id');
    }
}

