<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Sucursal;
use Illuminate\Database\Seeder;

class SucursalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $paisVe = Pais::where('codigo_iso2', 'VE')->first() ?? Pais::first();
        $paisCl = Pais::where('codigo_iso2', 'CL')->first() ?? $paisVe;

        // Sucursal 1 - Empresa 1
        Sucursal::updateOrCreate([
            'id' => 1,
        ], [
            'empresa_id' => 1,
            'nombre' => 'Ciudad de México',
            'pais_telefono_id' => $paisVe?->id,
            'telefono' => '4121234567',
            'direccion' => 'Av. Francisco de Miranda, Caracas, Venezuela',
            'latitud' => 10.4806,
            'longitud' => -66.9036,
            'status' => true,
        ]);
       
    }
}
