<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CitaBloqueo extends Model
{
    use HasFactory, Multitenantable;

    protected $table = 'citas_bloqueos';

    protected $fillable = [
        'empresa_id',
        'medico_id',
        'titulo',
        'fecha_hora_inicio',
        'fecha_hora_fin',
        'motivo',
    ];

    protected $casts = [
        'fecha_hora_inicio' => 'datetime',
        'fecha_hora_fin' => 'datetime',
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
