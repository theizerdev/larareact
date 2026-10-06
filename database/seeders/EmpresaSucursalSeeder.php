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
        // 1. Crear o actualizar la empresa principal (genérica) con ID 1
        $empresa = Empresa::updateOrCreate([
            'id' => 1,
        ], [
            'razon_social' => 'Empresa Uno',
            'documento' => 'J-12345678-0',
            'direccion' => 'Av. Principal Empresa Uno',
            'telefono' => '+52 000 000 0000',
            'email' => 'contacto@empresa-uno.example.com',
            'status' => true,
        ]);

        // 2. Crear o actualizar la sucursal principal con ID 1
        Sucursal::updateOrCreate([
            'id' => 1,
        ], [
            'empresa_id' => $empresa->id,
            'nombre' => 'Sucursal Uno',
            'telefono' => '+52 000 000 0000',
            'direccion' => 'Sucursal Uno, Ciudad Genérica',
            'status' => true,
        ]);
    }
}
