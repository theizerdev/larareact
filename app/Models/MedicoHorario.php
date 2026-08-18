<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicoHorario extends Model
{
    use HasFactory, Multitenantable;

    protected $table = 'medico_horarios';

    protected $fillable = [
        'empresa_id',
        'medico_id',
        'dia_semana',
        'hora_inicio',
        'hora_fin',
        'hora_inicio_almuerzo',
        'hora_fin_almuerzo',
        'buffer_minutos',
        'activo',
    ];

    protected $casts = [
        'dia_semana' => 'integer',
        'buffer_minutos' => 'integer',
        'activo' => 'boolean',
    ];

    public function medico()
    {
        return $this->belongsTo(Medico::class, 'medico_id');
    }

    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }
}
