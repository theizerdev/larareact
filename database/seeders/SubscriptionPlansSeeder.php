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
        SubscriptionPlan::updateOrCreate(
            ['nombre' => 'Plan Full'],
            [
                'descripcion' => 'Acceso completo a todos los módulos operativos del sistema (Ventas, Inventario, Caja, Clientes, Créditos, Servicios). Excluye monitoreo e integraciones.',
                'precio_3_meses' => 89.00,       // Ej: ~$29.66/mes
                'precio_6_meses' => 159.00,      // Ej: ~$26.50/mes (Ahorras ~10%)
                'precio_12_meses' => 288.00,     // Ej: ~$24.00/mes (Ahorras ~20%)
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
                    'creditos',
                    'metas_ventas',
                ],
                'activo' => true,
            ]
        );
    }
}
