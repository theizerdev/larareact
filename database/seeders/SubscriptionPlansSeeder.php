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
                'descripcion' => '7 días de acceso completo para evaluar todas las herramientas de tu negocio.',
                'precio_3_meses' => 0.00,
                'precio_6_meses' => 0.00,
                'precio_12_meses' => 0.00,
                'precio_sucursal_extra_mensual' => 10.00,
                'sucursales_incluidas' => 1,
                'modulos_incluidos' => ['todos'],
                'activo' => true,
            ]
        );

        // 1. Plan Trimestral (3 MESES — $897 MXN -> $299/mes)
        SubscriptionPlan::updateOrCreate(
            ['nombre' => 'Plan Trimestral'],
            [
                'descripcion' => 'Ideal para emprendedores y comercios que buscan flexibilidad de pago.',
                'precio_3_meses' => 897.00,
                'precio_6_meses' => 0.00,
                'precio_12_meses' => 0.00,
                'precio_sucursal_extra_mensual' => 10.00,
                'sucursales_incluidas' => 1,
                'modulos_incluidos' => ['todos'],
                'activo' => true,
            ]
        );

        // 2. Plan Semestral (6 MESES — $1,494 MXN -> $249/mes)
        SubscriptionPlan::updateOrCreate(
            ['nombre' => 'Plan Semestral'],
            [
                'descripcion' => 'Control operativo total para comercios en crecimiento con ahorro mensual.',
                'precio_3_meses' => 0.00,
                'precio_6_meses' => 1494.00,
                'precio_12_meses' => 0.00,
                'precio_sucursal_extra_mensual' => 10.00,
                'sucursales_incluidas' => 1,
                'modulos_incluidos' => ['todos'],
                'activo' => true,
            ]
        );

        // 3. Plan Anual (12 MESES — $2,388 MXN -> $199/mes)
        SubscriptionPlan::updateOrCreate(
            ['nombre' => 'Plan Anual'],
            [
                'descripcion' => 'La opción con mejor precio del mercado para empresas consolidadas.',
                'precio_3_meses' => 0.00,
                'precio_6_meses' => 0.00,
                'precio_12_meses' => 2388.00,
                'precio_sucursal_extra_mensual' => 10.00,
                'sucursales_incluidas' => 2,
                'modulos_incluidos' => ['todos'],
                'activo' => true,
            ]
        );
    }
}
