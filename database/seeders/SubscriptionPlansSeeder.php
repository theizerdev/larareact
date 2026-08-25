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
        // Desactivar cualquier plan antiguo que no corresponda al plan único oficial
        SubscriptionPlan::whereNotIn('nombre', ['Plan Prueba', 'Plan Mensual'])
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
                'precio_sucursal_extra_mensual' => 84.72,
                'sucursales_incluidas' => 1,
                'modulos_incluidos' => ['todos'],
                'activo' => true,
            ]
        );

        // 1. Plan Mensual Único ($149 MXN / mes)
        SubscriptionPlan::updateOrCreate(
            ['nombre' => 'Plan Mensual'],
            [
                'descripcion' => 'Acceso completo a todos los módulos operativos de FixSale. Incluye 1 sucursal. Sucursal adicional: $84.72 MXN ($5 USD)/mes.',
                'precio_regular_mensual' => 149.00,
                'precio_promocional_mensual' => 149.00,
                'tiene_promocion' => false,
                'meses_duracion_promocion' => 0,
                'badge_promocion' => null,
                'destacado' => true,
                'orden' => 1,
                'precio_3_meses' => 149.00,
                'precio_6_meses' => 149.00,
                'precio_12_meses' => 149.00,
                'precio_sucursal_extra_mensual' => 84.72,
                'sucursales_incluidas' => 1,
                'modulos_incluidos' => ['todos'],
                'activo' => true,
            ]
        );
    }
}
