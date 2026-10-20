<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ComisionPago extends Model
{
    use HasFactory, Multitenantable, HasSpanishActivityLog;

    protected $table = 'comision_pagos';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'empleado_id',
        'user_id',
        'cash_register_id',
        'codigo_recibo',
        'monto_total',
        'total_ventas_base',
        'cantidad_ventas',
        'total_reparaciones_base',
        'cantidad_reparaciones',
        'metodo_pago',
        'fecha_pago',
        'periodo_desde',
        'periodo_hasta',
        'notas',
    ];

    protected $casts = [
        'monto_total' => 'float',
        'total_ventas_base' => 'float',
        'cantidad_ventas' => 'integer',
        'total_reparaciones_base' => 'float',
        'cantidad_reparaciones' => 'integer',
        'fecha_pago' => 'datetime',
        'periodo_desde' => 'date',
        'periodo_hasta' => 'date',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class); // Quien realizó el pago
    }

    public function cashRegister(): BelongsTo
    {
        return $this->belongsTo(CashRegister::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class, 'comision_pago_id');
    }

    public function reparaciones(): HasMany
    {
        return $this->hasMany(OrdenReparacion::class, 'comision_pago_id');
    }
}
