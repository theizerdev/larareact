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
     * Garantizar que los planes por defecto (Básico, Profesional, Corporativo) existan en la BD.
     */
    public static function ensureDefaultPlansExist(): void
    {
        // Asegurar que todos los planes activos posean la estructura de precios oficial ($89, $159, $288)
        self::query()->update([
            'precio_3_meses' => 89.00,
            'precio_6_meses' => 159.00,
            'precio_12_meses' => 288.00,
            'precio_sucursal_extra_mensual' => 10.00,
        ]);

        self::updateOrCreate(
            ['nombre' => 'Plan Full'],
            [
                'descripcion' => 'Acceso completo a todos los módulos operativos del sistema. Control total para tu comercio.',
                'precio_3_meses' => 89.00,
                'precio_6_meses' => 159.00,
                'precio_12_meses' => 288.00,
                'precio_sucursal_extra_mensual' => 10.00,
                'sucursales_incluidas' => 1,
                'modulos_incluidos' => ['ventas', 'cajas', 'inventarios', 'productos', 'servicios', 'clientes', 'proveedores', 'compras', 'creditos', 'metas_ventas', 'multi_sucursales'],
                'activo' => true,
            ]
        );
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
            3 => ($this->precio_3_meses > 0 ? $this->precio_3_meses : 89.00),
            6 => ($this->precio_6_meses > 0 ? $this->precio_6_meses : 159.00),
            12 => ($this->precio_12_meses > 0 ? $this->precio_12_meses : 288.00),
            default => ($this->precio_3_meses > 0 ? $this->precio_3_meses : 89.00),
        };

        $precioExtra = $this->precio_sucursal_extra_mensual > 0 ? $this->precio_sucursal_extra_mensual : 10.00;
        $sucursalesExtra = max(0, $totalSucursales - ($this->sucursales_incluidas ?: 1));
        $costoSucursalesExtra = $sucursalesExtra * $precioExtra * $meses;

        return round($basePrice + $costoSucursalesExtra, 2);
    }
}
