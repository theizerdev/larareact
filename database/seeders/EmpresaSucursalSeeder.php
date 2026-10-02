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
        // 1. Crear o actualizar la empresa principal Driscoll's con ID 1
        $empresa = Empresa::updateOrCreate([
            'id' => 1,
        ], [
            'razon_social' => "Driscoll's, Inc.",
            'documento' => 'J-12345678-0',
            'direccion' => "Av. Principal Driscoll's",
            'telefono' => '+52 436 117 4564',
            'email' => 'contacto@driscolls.com',
            'status' => true,
        ]);

        // 2. Crear o actualizar la sucursal principal con ID 1
        Sucursal::updateOrCreate([
            'id' => 1,
        ], [
            'empresa_id' => $empresa->id,
            'nombre' => 'Cooler Purépero',
            'telefono' => '+52 436 117 4564',
            'direccion' => "Cooler Purépero, Michoacán",
            'status' => true,
        ]);
    }
}
