<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Pais;
use Illuminate\Database\Seeder;

class EmpresaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pais = Pais::where('codigo_iso2', 'VE')->first()
            ?? Pais::where('codigo_iso2', 'CL')->first()
            ?? Pais::first();

        Empresa::updateOrCreate([
            'id' => 1,
        ], [
            'pais_id' => $pais?->id,
            'pais_telefono_id' => $pais?->id,
            'razon_social' => 'Servitec C.A.',
            'documento' => 'J-12345678-9',
            'direccion' => 'Av. Francisco de Miranda, Caracas, Venezuela',
            'latitud' => 10.4806,
            'longitud' => -66.9036,
            'representante_legal' => 'Juan Pérez',
            'telefono' => '4121234567',
            'email' => 'contacto@servitec.com',
            'status' => true,
            'api_key' => Empresa::generateApiKey(),
            'whatsapp_active' => false,
            'mapbox_active' => false,
            'google_maps_active' => false,
        ]);
    }
}
