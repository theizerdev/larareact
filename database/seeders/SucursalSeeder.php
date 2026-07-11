<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Sucursal;
use Illuminate\Database\Seeder;

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
                'nombre' => 'Sucursal Principal',
            ], [
                'empresa_id' => $empresa->id,
                'direccion' => 'Planta Baja, Local 1',
                'telefono' => '+58 212 555 5556',
            ]);
        }
    }
}
