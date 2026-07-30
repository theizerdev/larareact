<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryMovement extends Model
{
    use HasFactory, Multitenantable;

    protected $table = 'inventory_movements';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'producto_id',
        'user_id',
        'tipo',
        'motivo',
        'cantidad',
        'stock_anterior',
        'stock_nuevo',
        'referencia',
        'costo_unitario',
        'notas',
    ];

    protected $casts = [
        'cantidad' => 'float',
        'stock_anterior' => 'float',
        'stock_nuevo' => 'float',
        'costo_unitario' => 'float',
    ];

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }
}
