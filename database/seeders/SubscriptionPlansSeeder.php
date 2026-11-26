<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use App\Models\WhatsAppPricingSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class SubscriptionPlansSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (Schema::hasTable('whatsapp_pricing_settings')) {
            WhatsAppPricingSetting::current();
        }
        // Desactivar cualquier plan antiguo que no corresponda a los planes oficiales
        SubscriptionPlan::whereNotIn('nombre', ['Plan Prueba', 'Plan Mensual', 'Plan Anual'])
            ->update(['activo' => false]);

        // 0. Plan Prueba (7 Días Gratis - inactivo mientras dure el lanzamiento anual)
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
                'ciclo_meses' => 0,
                'max_suscripciones' => null,
                'fecha_expiracion' => null,
                'precio_3_meses' => 0.00,
                'precio_6_meses' => 0.00,
                'precio_12_meses' => 0.00,
                'precio_sucursal_extra_mensual' => 84.72,
                'costo_por_mensaje_usd' => 0.0050,
                'mensajes_incluidos_mes' => 500,
                'max_mensajes_acumulados' => 1000,
                'min_compra_mensajes' => 100,
                'sucursales_incluidas' => 1,
                'modulos_incluidos' => ['todos'],
                'activo' => true,
            ]
        );

        // 1. Plan Anual de Lanzamiento ($1,000 MXN / año - máximo 5 negocios mexicanos)
        SubscriptionPlan::updateOrCreate(
            ['nombre' => 'Plan Anual'],
            [
                'descripcion' => 'Buscamos 5 negocios mexicanos que quieran ser nuestros primeros usuarios y participar en la evolución del sistema con sus ideas y sugerencias.',
                'precio_regular_mensual' => 83.33,
                'precio_promocional_mensual' => 83.33,
                'tiene_promocion' => true,
                'meses_duracion_promocion' => 12,
                'badge_promocion' => '🔥 PRECIO EXCLUSIVO DE LANZAMIENTO',
                'destacado' => true,
                'orden' => 1,
                'ciclo_meses' => 12,
                'max_suscripciones' => 5,
                'fecha_expiracion' => null,
                'precio_3_meses' => 1000.00,
                'precio_6_meses' => 1000.00,
                'precio_12_meses' => 1000.00,
                'precio_sucursal_extra_mensual' => 84.72,
                'costo_por_mensaje_usd' => 0.0050,
                'mensajes_incluidos_mes' => 500,
                'max_mensajes_acumulados' => 1000,
                'min_compra_mensajes' => 100,
                'sucursales_incluidas' => 1,
                'modulos_incluidos' => ['todos'],
                'activo' => true,
            ]
        );

        // 2. Plan Mensual Estándar ($149 MXN / mes)
        SubscriptionPlan::updateOrCreate(
            ['nombre' => 'Plan Mensual'],
            [
                'descripcion' => 'Acceso completo a todos los módulos operativos de FixSale. Incluye 1 sucursal. Sucursal adicional: $84.72 MXN ($5 USD)/mes.',
                'precio_regular_mensual' => 149.00,
                'precio_promocional_mensual' => 149.00,
                'tiene_promocion' => false,
                'meses_duracion_promocion' => 0,
                'badge_promocion' => null,
                'destacado' => false,
                'orden' => 2,
                'ciclo_meses' => 1,
                'max_suscripciones' => null,
                'fecha_expiracion' => null,
                'precio_3_meses' => 149.00,
                'precio_6_meses' => 149.00,
                'precio_12_meses' => 149.00,
                'precio_sucursal_extra_mensual' => 84.72,
                'costo_por_mensaje_usd' => 0.0050,
                'mensajes_incluidos_mes' => 500,
                'max_mensajes_acumulados' => 1000,
                'min_compra_mensajes' => 100,
                'sucursales_incluidas' => 1,
                'modulos_incluidos' => ['todos'],
                'activo' => true,
            ]
        );
    }
}
