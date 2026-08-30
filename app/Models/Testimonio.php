<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Testimonio extends Model
{
    use HasFactory;

    protected $connection = 'landlord';

    protected $table = 'testimonios';

    protected $fillable = [
        'nombre_cliente',
        'empresa_cargo',
        'ubicacion',
        'avatar',
        'comentario',
        'calificacion',
        'metrica_destacada',
        'destacado',
        'activo',
        'orden',
    ];

    protected $casts = [
        'calificacion' => 'integer',
        'destacado' => 'boolean',
        'activo' => 'boolean',
        'orden' => 'integer',
    ];
}
