<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Sucursal;
use Illuminate\Database\Seeder;

class EmpresaSucursalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Crear o actualizar la empresa demo con ID 1
        $empresa = Empresa::updateOrCreate([
            'id' => 1,
        ], [
            'razon_social' => 'Empresa Demo',
            'documento' => 'DEMO-000000',
            'direccion' => 'Dirección de ejemplo 123',
            'telefono' => '+52 55 0000 0000',
            'email' => 'demo@empresademo.com',
            'logo' => '/image/logo/aliados/360-global-it-logo.png',
            'logo_mini' => '/image/logo/aliados/360-global-it-logo.png',
            'status' => true,
        ]);

        // 2. Crear o actualizar la sucursal principal con ID 1
        Sucursal::updateOrCreate([
            'id' => 1,
        ], [
            'empresa_id' => $empresa->id,
            'nombre' => 'Sucursal Principal',
            'telefono' => '+52 55 0000 0000',
            'direccion' => 'Dirección de ejemplo 123',
            'status' => true,
        ]);
    }
}
