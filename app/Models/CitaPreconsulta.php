<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CitaPreconsulta extends Model
{
    use HasFactory;

    protected $table = 'cita_preconsultas';

    protected $fillable = [
        'cita_id',
        'plantilla_id',
        'token',
        'respuestas',
        'completado',
        'completado_at',
        'ip_origen',
    ];

    protected $casts = [
        'respuestas' => 'array',
        'completado' => 'boolean',
        'completado_at' => 'datetime',
    ];

    public function cita()
    {
        return $this->belongsTo(Cita::class);
    }

    public function plantilla()
    {
        return $this->belongsTo(PlantillaPreconsulta::class, 'plantilla_id');
    }
}
