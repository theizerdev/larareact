<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RelojBiometricoCedulaItem extends Model
{
    use HasFactory;

    protected $table = 'reloj_biometrico_cedula_items';

    protected $fillable = [
        'reloj_biometrico_cedula_id',
        'catalogo_actividad_id',
        'etapa_num',
        'sub_etapa_letra',
        'numero_actividad',
        'estado',
        'responsable',
        'valida',
        'fecha_compromiso',
        'fecha_realizada',
        'evidencia_path',
        'evidencia_tipo',
        'observaciones',
        'validado_por_usuario_id',
        'validado_at',
    ];

    protected $casts = [
        'etapa_num' => 'integer',
        'numero_actividad' => 'integer',
        'validado_at' => 'datetime',
    ];

    public function cedula()
    {
        return $this->belongsTo(RelojBiometricoCedula::class, 'reloj_biometrico_cedula_id');
    }

    public function catalogo()
    {
        return $this->belongsTo(RelojCedulaActividadCatalogo::class, 'catalogo_actividad_id');
    }

    public function validadoPor()
    {
        return $this->belongsTo(User::class, 'validado_por_usuario_id');
    }
}

