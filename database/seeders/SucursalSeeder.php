<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Sucursal;
use App\Models\Empresa;

class SucursalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $empresa = Empresa::first();

        if ($empresa) {
            Sucursal::firstOrCreate([
                'nombre' => 'Sucursal Principal'
            ], [
                'empresa_id' => $empresa->id,
                'direccion' => 'Planta Baja, Local 1',
                'telefono' => '+58 212 555 5556'
            ]);
        }
    }
}
