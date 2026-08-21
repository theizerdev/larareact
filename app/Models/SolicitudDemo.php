<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SolicitudDemo extends Model
{
    use HasFactory;

    protected $table = 'solicitudes_demo';

    protected $fillable = [
        'nombre',
        'empresa',
        'correo',
        'telefono',
        'sitios_acceso',
        'area_interes',
        'mensaje',
        'acepta_contacto',
        'locale',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'acepta_contacto' => 'boolean',
        ];
    }
}
