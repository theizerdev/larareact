<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlansSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Desactivar cualquier plan antiguo que no corresponda a los 4 oficiales
        SubscriptionPlan::whereNotIn('nombre', ['Plan Prueba', 'Plan Trimestral', 'Plan Semestral', 'Plan Anual'])
            ->update(['activo' => false]);

        // 0. Plan Prueba (7 Días Gratis)
        SubscriptionPlan::updateOrCreate(
            ['nombre' => 'Plan Prueba'],
            [
                'descripcion' => '7 días de acceso completo para evaluar todas las herramientas de tu negocio sin tarjeta de crédito.',
                'precio_regular_mensual' => 0.00,
                'precio_promocional_mensual' => 0.00,
                'tiene_promocion' => false,
                'meses_duracion_promocion' => 0,
                'badge_promocion' => 'Prueba Gratuita',
                'destacado' => false,
                'orden' => 0,
                'precio_3_meses' => 0.00,
                'precio_6_meses' => 0.00,
                'precio_12_meses' => 0.00,
                'precio_sucursal_extra_mensual' => 10.00,
                'sucursales_incluidas' => 1,
                'modulos_incluidos' => ['todos'],
                'activo' => true,
            ]
        );

        // 1. Plan Trimestral (3 Meses)
        SubscriptionPlan::updateOrCreate(
            ['nombre' => 'Plan Trimestral'],
            [
                'descripcion' => 'Control total para tu comercio. Precio promocional de bienvenida por tiempo limitado.',
                'precio_regular_mensual' => 499.00,
                'precio_promocional_mensual' => 299.00,
                'tiene_promocion' => true,
                'meses_duracion_promocion' => 3,
                'badge_promocion' => '40% DTO Primer Trimestre',
                'destacado' => false,
                'orden' => 1,
                'precio_3_meses' => 897.00,
                'precio_6_meses' => 1794.00,
                'precio_12_meses' => 3588.00,
                'precio_sucursal_extra_mensual' => 20.00,
                'sucursales_incluidas' => 1,
                'modulos_incluidos' => ['todos'],
                'activo' => true,
            ]
        );

        // 2. Plan Semestral (6 Meses - Más Vendido)
        SubscriptionPlan::updateOrCreate(
            ['nombre' => 'Plan Semestral'],
            [
                'descripcion' => 'El equilibrio perfecto para acelerar tu negocio con ahorro garantizado.',
                'precio_regular_mensual' => 499.00,
                'precio_promocional_mensual' => 249.00,
                'tiene_promocion' => true,
                'meses_duracion_promocion' => 6,
                'badge_promocion' => 'Más Popular - 50% OFF',
                'destacado' => true,
                'orden' => 2,
                'precio_3_meses' => 897.00,
                'precio_6_meses' => 1494.00,
                'precio_12_meses' => 2988.00,
                'precio_sucursal_extra_mensual' => 20.00,
                'sucursales_incluidas' => 1,
                'modulos_incluidos' => ['todos'],
                'activo' => true,
            ]
        );

        // 3. Plan Anual (12 Meses - Mejor Precio)
        SubscriptionPlan::updateOrCreate(
            ['nombre' => 'Plan Anual'],
            [
                'descripcion' => 'Máximo ahorro y soporte continuo. Incluye 2 sucursales completas sin costo extra.',
                'precio_regular_mensual' => 499.00,
                'precio_promocional_mensual' => 199.00,
                'tiene_promocion' => true,
                'meses_duracion_promocion' => 12,
                'badge_promocion' => 'Mejor Valor - 60% OFF',
                'destacado' => false,
                'orden' => 3,
                'precio_3_meses' => 897.00,
                'precio_6_meses' => 1494.00,
                'precio_12_meses' => 2388.00,
                'precio_sucursal_extra_mensual' => 20.00,
                'sucursales_incluidas' => 2,
                'modulos_incluidos' => ['todos'],
                'activo' => true,
            ]
        );
    }
}
