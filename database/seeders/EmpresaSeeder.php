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
    }
}
