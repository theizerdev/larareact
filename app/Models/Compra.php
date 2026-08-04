<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Compra extends Model
{
    use HasFactory, Multitenantable;

    protected $table = 'compras';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'proveedor_id',
        'user_id',
        'cierre_mensual_id',
        'usar_fondo_mes',
        'codigo_compra',
        'numero_factura',
        'numero_control',
        'tipo_pago',
        'fecha_emision',
        'fecha_vencimiento',
        'status',
        'subtotal',
        'impuesto',
        'descuento',
        'total',
        'monto_pagado',
        'saldo_pendiente',
        'notas',
    ];

    protected $casts = [
        'fecha_emision' => 'date',
        'fecha_vencimiento' => 'date',
        'usar_fondo_mes' => 'boolean',
        'subtotal' => 'float',
        'impuesto' => 'float',
        'descuento' => 'float',
        'total' => 'float',
        'monto_pagado' => 'float',
        'saldo_pendiente' => 'float',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function cierreMensual(): BelongsTo
    {
        return $this->belongsTo(CierreMensual::class, 'cierre_mensual_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(CompraItem::class, 'compra_id');
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(CompraPago::class, 'compra_id');
    }
}
