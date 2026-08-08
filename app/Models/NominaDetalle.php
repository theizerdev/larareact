<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NominaDetalle extends Model
{
    use HasFactory, Multitenantable;

    protected $table = 'nomina_detalles';

    protected $fillable = [
        'nomina_id',
        'user_id',
        'rol_nombre',
        'sueldo_base_snapshot',
        'bonos',
        'descuentos',
        'comision_reparaciones',
        'monto_pagado_reparaciones_periodo',
        'reparaciones_reparadas_periodo',
        'total_neto',
        'estado_pago',
        'fecha_pago',
        'observaciones',
    ];

    protected $casts = [
        'sueldo_base_snapshot' => 'float',
        'bonos' => 'float',
        'descuentos' => 'float',
        'comision_reparaciones' => 'float',
        'monto_pagado_reparaciones_periodo' => 'float',
        'reparaciones_reparadas_periodo' => 'integer',
        'total_neto' => 'float',
        'fecha_pago' => 'datetime',
    ];

    public function nomina(): BelongsTo
    {
        return $this->belongsTo(Nomina::class, 'nomina_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
