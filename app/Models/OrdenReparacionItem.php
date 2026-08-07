<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrdenReparacionItem extends Model
{
    use HasFactory;

    protected $table = 'orden_reparacion_items';

    protected $fillable = [
        'orden_id',
        'producto_id',
        'servicio_id',
        'descripcion',
        'cantidad',
        'precio_costo',
        'precio_venta',
        'subtotal',
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'precio_costo' => 'decimal:2',
        'precio_venta' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function orden(): BelongsTo
    {
        return $this->belongsTo(OrdenReparacion::class, 'orden_id');
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function servicio(): BelongsTo
    {
        return $this->belongsTo(Servicio::class, 'servicio_id');
    }
}
