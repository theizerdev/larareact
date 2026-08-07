<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrdenReparacionFoto extends Model
{
    use HasFactory;

    protected $table = 'orden_reparacion_fotos';

    protected $fillable = [
        'orden_id',
        'angulo',
        'url',
        'descripcion',
    ];

    public function orden()
    {
        return $this->belongsTo(OrdenReparacion::class, 'orden_id');
    }
}
