<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecetaMedicamento extends Model
{
    use HasFactory;

    protected $table = 'receta_medicamentos';

    protected $fillable = [
        'receta_id',
        'medicamento_nombre',
        'dosis',
        'via_administracion',
        'frecuencia',
        'duracion_dias',
        'instrucciones',
    ];

    public function receta()
    {
        return $this->belongsTo(RecetaMedica::class, 'receta_id');
    }
}
