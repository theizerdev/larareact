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
        // Desactivar cualquier plan antiguo que no corresponda a los 4 planes oficiales mensuales
        SubscriptionPlan::whereNotIn('nombre', ['Plan Prueba', 'Plan Básico', 'Plan Profesional', 'Plan Empresarial'])
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

        // 1. Plan Básico
        SubscriptionPlan::updateOrCreate(
            ['nombre' => 'Plan Básico'],
            [
                'descripcion' => 'Ideal para pequeños comercios y emprendedores que inician su digitalización.',
                'precio_regular_mensual' => 399.00,
                'precio_promocional_mensual' => 299.00,
                'tiene_promocion' => true,
                'meses_duracion_promocion' => 1,
                'badge_promocion' => '25% DTO Bienvenida',
                'destacado' => false,
                'orden' => 1,
                'precio_3_meses' => 299.00,
                'precio_6_meses' => 299.00,
                'precio_12_meses' => 299.00,
                'precio_sucursal_extra_mensual' => 20.00,
                'sucursales_incluidas' => 1,
                'modulos_incluidos' => ['pos', 'inventario', 'reparaciones'],
                'activo' => true,
            ]
        );

        // 2. Plan Profesional (Más Vendido)
        SubscriptionPlan::updateOrCreate(
            ['nombre' => 'Plan Profesional'],
            [
                'descripcion' => 'Control operativo total, reportes avanzados y automatización completa para tu negocio.',
                'precio_regular_mensual' => 599.00,
                'precio_promocional_mensual' => 499.00,
                'tiene_promocion' => true,
                'meses_duracion_promocion' => 1,
                'badge_promocion' => 'Más Popular',
                'destacado' => true,
                'orden' => 2,
                'precio_3_meses' => 499.00,
                'precio_6_meses' => 499.00,
                'precio_12_meses' => 499.00,
                'precio_sucursal_extra_mensual' => 20.00,
                'sucursales_incluidas' => 1,
                'modulos_incluidos' => ['todos'],
                'activo' => true,
            ]
        );

        // 3. Plan Empresarial (Máxima Capacidad)
        SubscriptionPlan::updateOrCreate(
            ['nombre' => 'Plan Empresarial'],
            [
                'descripcion' => 'Para empresas consolidadas y cadenas. Incluye 2 sucursales completas y soporte prioritario.',
                'precio_regular_mensual' => 999.00,
                'precio_promocional_mensual' => 799.00,
                'tiene_promocion' => true,
                'meses_duracion_promocion' => 1,
                'badge_promocion' => 'Corporativo',
                'destacado' => false,
                'orden' => 3,
                'precio_3_meses' => 799.00,
                'precio_6_meses' => 799.00,
                'precio_12_meses' => 799.00,
                'precio_sucursal_extra_mensual' => 20.00,
                'sucursales_incluidas' => 2,
                'modulos_incluidos' => ['todos'],
                'activo' => true,
            ]
        );
    }
}
