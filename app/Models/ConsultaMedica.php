<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ConsultaMedica extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'consultas_medicas';

    protected $fillable = [
        'empresa_id',
        'cita_id',
        'paciente_id',
        'medico_id',
        'especialidad_id',
        'motivo_consulta',
        'enfermedad_actual',
        'examen_fisico',
        'presion_arterial',
        'frecuencia_cardiaca',
        'temperatura',
        'peso_kg',
        'talla_cm',
        'imc',
        'spo2',
        'diagnostico_cie10_codigo',
        'diagnostico_cie10_nombre',
        'observaciones_diagnostico',
        'conclusion',
        'plan_tratamiento',
        'observaciones_adicionales',

        'estado',
        'finalizada_at',
    ];

    protected $casts = [
        'temperatura' => 'float',
        'peso_kg' => 'float',
        'talla_cm' => 'float',
        'imc' => 'float',
        'finalizada_at' => 'datetime',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function cita()
    {
        return $this->belongsTo(Cita::class);
    }

    public function paciente()
    {
        return $this->belongsTo(Paciente::class);
    }

    public function medico()
    {
        return $this->belongsTo(Medico::class);
    }

    public function especialidad()
    {
        return $this->belongsTo(Especialidad::class);
    }

    public function receta()
    {
        return $this->hasOne(RecetaMedica::class, 'consulta_id');
    }

    public function ordenEstudio()
    {
        return $this->hasOne(OrdenEstudio::class, 'consulta_id');
    }

    public function diagnosticosCie10()
    {
        return $this->hasMany(ConsultaDiagnosticoCie10::class, 'consulta_id');
    }

    public function reposo()
    {
        return $this->hasOne(ConsultaReposo::class, 'consulta_id');
    }
}


