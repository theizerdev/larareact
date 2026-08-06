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
        // 0. Plan Prueba (7 días)
        SubscriptionPlan::updateOrCreate(
            ['nombre' => 'Plan Prueba'],
            [
                'descripcion' => 'Prueba gratuita de 7 días con acceso a módulos principales para evaluar el sistema.',
                'precio_3_meses' => 0.00,
                'precio_6_meses' => 0.00,
                'precio_12_meses' => 0.00,
                'precio_sucursal_extra_mensual' => 0.00,
                'sucursales_incluidas' => 1,
                'modulos_incluidos' => [
                    'ventas',
                    'cajas',
                    'inventarios',
                    'productos',
                    'clientes',
                ],
                'activo' => true,
            ]
        );

        // 1. Plan Básico
        SubscriptionPlan::updateOrCreate(
            ['nombre' => 'Plan Básico'],
            [
                'descripcion' => 'Ideal para emprendedores y pequeños negocios. Incluye Punto de Venta, Gestión de Productos, Inventario básico y Clientes.',
                'precio_3_meses' => 49.00,
                'precio_6_meses' => 89.00,
                'precio_12_meses' => 159.00,
                'precio_sucursal_extra_mensual' => 10.00,
                'sucursales_incluidas' => 1,
                'modulos_incluidos' => [
                    'ventas',
                    'cajas',
                    'inventarios',
                    'productos',
                    'clientes',
                ],
                'activo' => true,
            ]
        );

        // 2. Plan Profesional (Full Operativo)
        SubscriptionPlan::updateOrCreate(
            ['nombre' => 'Plan Profesional'],
            [
                'descripcion' => 'Control total operativo para comercios y talleres. Añade Servicios, Proveedores, Compras, Créditos y Cuentas por Cobrar.',
                'precio_3_meses' => 89.00,
                'precio_6_meses' => 159.00,
                'precio_12_meses' => 288.00,
                'precio_sucursal_extra_mensual' => 10.00,
                'sucursales_incluidas' => 1,
                'modulos_incluidos' => [
                    'ventas',
                    'cajas',
                    'inventarios',
                    'productos',
                    'servicios',
                    'clientes',
                    'proveedores',
                    'compras',
                    'creditos',
                    'metas_ventas',
                ],
                'activo' => true,
            ]
        );

        // 3. Plan Corporativo
        SubscriptionPlan::updateOrCreate(
            ['nombre' => 'Plan Corporativo'],
            [
                'descripcion' => 'Solución integral sin límites para empresas multi-sucursales. Incluye Integración de WhatsApp API, Sucursales ilimitadas y Reportes Financieros Avanzados.',
                'precio_3_meses' => 149.00,
                'precio_6_meses' => 269.00,
                'precio_12_meses' => 479.00,
                'precio_sucursal_extra_mensual' => 10.00,
                'sucursales_incluidas' => 2,
                'modulos_incluidos' => [
                    'ventas',
                    'cajas',
                    'inventarios',
                    'productos',
                    'servicios',
                    'clientes',
                    'proveedores',
                    'compras',
                    'creditos',
                    'metas_ventas',
                    'whatsapp_api',
                    'multi_sucursales',
                    'reportes_avanzados',
                ],
                'activo' => true,
            ]
        );
    }
}
