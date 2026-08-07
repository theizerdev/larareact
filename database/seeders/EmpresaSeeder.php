<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class EmpresaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $paisVe = Pais::where('codigo_iso2', 'VE')->first() ?? Pais::first();
        $paisCl = Pais::where('codigo_iso2', 'CL')->first() ?? $paisVe;

        // 1. Empresa Principal (Caracas, Venezuela)
        $empresa1 = Empresa::updateOrCreate([
            'id' => 1,
        ], [
            'pais_id' => $paisVe?->id,
            'pais_telefono_id' => $paisVe?->id,
            'razon_social' => 'Fix Sale Venezuela',
            'documento' => 'J-12345678-9',
            'direccion' => 'Av. Francisco de Miranda, Caracas, Venezuela',
            'latitud' => 10.4806,
            'longitud' => -66.9036,
            'representante_legal' => 'Juan Pérez',
            'telefono' => '4121234567',
            'email' => 'contacto@fixsale.com',
            'status' => true,
            'api_key' => Empresa::generateApiKey(),
            'subscription_status' => 'active',
            'subscription_expires_at' => now()->addYear(),
            'whatsapp_active' => false,
            'mapbox_active' => false,
            'google_maps_active' => false,
        ]);

        // 2. Empresa Sucursal en Plan de Prueba de 7 Días (Santiago, Chile)
        $trialExpiresAt = now()->addDays(7);
        $empresa2 = Empresa::updateOrCreate([
            'id' => 2,
        ], [
            'pais_id' => $paisCl?->id,
            'pais_telefono_id' => $paisCl?->id,
            'razon_social' => 'Fix Sale Chile (Sucursal)',
            'documento' => '76123456-7',
            'direccion' => 'Av. Providencia 1234, Santiago, Chile',
            'latitud' => -33.4489,
            'longitud' => -70.6693,
            'representante_legal' => 'Carlos Mendoza',
            'telefono' => '912345678',
            'email' => 'chile@fixsale.com',
            'status' => true,
            'api_key' => Empresa::generateApiKey(),
            'subscription_status' => 'trial',
            'subscription_expires_at' => $trialExpiresAt,
            'whatsapp_active' => false,
            'mapbox_active' => false,
            'google_maps_active' => false,
        ]);

        // Obtener o crear el Plan Prueba (7 Días)
        $planPrueba = SubscriptionPlan::firstOrCreate(
            ['nombre' => 'Plan Prueba'],
            [
                'descripcion' => 'Prueba gratuita de 7 días con acceso a módulos principales.',
                'precio_3_meses' => 0.00,
                'precio_6_meses' => 0.00,
                'precio_12_meses' => 0.00,
                'precio_sucursal_extra_mensual' => 0.00,
                'sucursales_incluidas' => 1,
                'modulos_incluidos' => ['ventas', 'cajas', 'inventarios', 'productos', 'clientes', 'reparaciones'],
                'activo' => true,
            ]
        );

        // Crear la suscripción de prueba para la Empresa 2
        Subscription::updateOrCreate(
            [
                'empresa_id' => $empresa2->id,
                'estado' => 'trial',
            ],
            [
                'plan_id' => $planPrueba->id,
                'nombre_plan' => 'Plan Prueba (7 Días)',
                'ciclo_meses' => 0,
                'max_sucursales' => 1,
                'monto_total' => 0.00,
                'fecha_inicio' => now(),
                'fecha_vencimiento' => $trialExpiresAt,
                'estado' => 'trial',
            ]
        );
    }
}
