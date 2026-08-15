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
     * Garantizar que únicamente los 4 planes oficiales (Prueba, Trimestral, Semestral, Anual) estén activos.
     */
    public static function ensureDefaultPlansExist(): void
    {
        self::whereNotIn('nombre', ['Plan Prueba', 'Plan Trimestral', 'Plan Semestral', 'Plan Anual'])
            ->update(['activo' => false]);

        (new \Database\Seeders\SubscriptionPlansSeeder())->run();
    }

    /**
     * Obtener el plan de renovación por defecto (plan de pago activo).
     */
    public static function getPlanRenovacionDefault(): ?self
    {
        self::ensureDefaultPlansExist();

        return self::where('activo', true)
            ->where('precio_3_meses', '>', 0)
            ->first()
            ?? self::where('nombre', '!=', 'Plan Prueba')->first()
            ?? self::first();
    }

    /**
     * Calcula el precio total estimado para un número de meses y sucursales.
     */
    public function calcularPrecio(int $meses, int $totalSucursales = 1): float
    {
        $basePrice = match ($meses) {
            3 => ($this->precio_3_meses > 0 ? $this->precio_3_meses : 897.00),
            6 => ($this->precio_6_meses > 0 ? $this->precio_6_meses : 1494.00),
            12 => ($this->precio_12_meses > 0 ? $this->precio_12_meses : 2388.00),
            default => ($this->precio_3_meses > 0 ? $this->precio_3_meses : 897.00),
        };

        $precioExtra = $this->precio_sucursal_extra_mensual > 0 ? $this->precio_sucursal_extra_mensual : 10.00;
        $sucursalesExtra = max(0, $totalSucursales - ($this->sucursales_incluidas ?: 1));
        $costoSucursalesExtra = $sucursalesExtra * $precioExtra;

        return round($basePrice + $costoSucursalesExtra, 2);
    }
}
