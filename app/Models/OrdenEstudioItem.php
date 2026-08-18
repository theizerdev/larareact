<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrdenEstudioItem extends Model
{
    use HasFactory;

    protected $table = 'orden_estudio_items';

    protected $fillable = [
        'orden_estudio_id',
        'tipo_estudio',
        'nombre_estudio',
        'indicaciones',
    ];

    public function ordenEstudio(): BelongsTo
    {
        return $this->belongsTo(OrdenEstudio::class, 'orden_estudio_id');
    }
}
