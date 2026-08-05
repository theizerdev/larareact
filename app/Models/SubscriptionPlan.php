<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $table = 'subscription_plans';

    protected $fillable = [
        'nombre',
        'descripcion',
        'precio_3_meses',
        'precio_6_meses',
        'precio_12_meses',
        'precio_sucursal_extra_mensual',
        'sucursales_incluidas',
        'modulos_incluidos',
        'activo',
    ];

    protected $casts = [
        'precio_3_meses' => 'float',
        'precio_6_meses' => 'float',
        'precio_12_meses' => 'float',
        'precio_sucursal_extra_mensual' => 'float',
        'sucursales_incluidas' => 'integer',
        'modulos_incluidos' => 'array',
        'activo' => 'boolean',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'plan_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SubscriptionPayment::class, 'plan_id');
    }

    /**
     * Calcula el precio total estimado para un número de meses y sucursales.
     */
    public function calcularPrecio(int $meses, int $totalSucursales = 1): float
    {
        $basePrice = match ($meses) {
            3 => $this->precio_3_meses,
            6 => $this->precio_6_meses,
            12 => $this->precio_12_meses,
            default => $this->precio_3_meses,
        };

        $sucursalesExtra = max(0, $totalSucursales - $this->sucursales_incluidas);
        $costoSucursalesExtra = $sucursalesExtra * $this->precio_sucursal_extra_mensual;

        return round($basePrice + $costoSucursalesExtra, 2);
    }
}
