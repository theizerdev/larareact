<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrdenReparacionHistorial extends Model
{
    use HasFactory;

    protected $table = 'orden_reparacion_historial';

    protected $fillable = [
        'orden_id',
        'user_id',
        'estado_anterior',
        'estado_nuevo',
        'comentario',
    ];

    public function orden(): BelongsTo
    {
        return $this->belongsTo(OrdenReparacion::class, 'orden_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
