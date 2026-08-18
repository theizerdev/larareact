<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecetaMedica extends Model
{
    use HasFactory;

    protected $table = 'recetas_medicas';

    protected $fillable = [
        'consulta_id',
        'paciente_id',
        'medico_id',
        'codigo_receta',
        'indicaciones_generales',
        'vigencia_dias',
    ];

    protected static function booted(): void
    {
        static::creating(function ($receta) {
            if (empty($receta->codigo_receta)) {
                $year = date('Y');
                $count = static::whereYear('created_at', $year)->count() + 1;
                $receta->codigo_receta = sprintf('REC-%s-%05d', $year, $count);
            }
        });
    }

    public function consulta()
    {
        return $this->belongsTo(ConsultaMedica::class, 'consulta_id');
    }

    public function paciente()
    {
        return $this->belongsTo(Paciente::class);
    }

    public function medico()
    {
        return $this->belongsTo(Medico::class);
    }

    public function medicamentos()
    {
        return $this->hasMany(RecetaMedicamento::class, 'receta_id');
    }
}
