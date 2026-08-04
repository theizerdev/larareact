<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompraPago extends Model
{
    use HasFactory;

    protected $table = 'compra_pagos';

    protected $fillable = [
        'compra_id',
        'proveedor_id',
        'user_id',
        'cash_register_id',
        'metodo_pago',
        'monto',
        'referencia',
        'notas',
    ];

    protected $casts = [
        'monto' => 'float',
    ];

    public function compra(): BelongsTo
    {
        return $this->belongsTo(Compra::class, 'compra_id');
    }

    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function cashRegister(): BelongsTo
    {
        return $this->belongsTo(CashRegister::class, 'cash_register_id');
    }
}
