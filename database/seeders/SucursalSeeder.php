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
        $empresa = Empresa::first();
        if (!$empresa) {
            return;
        }

        $pais = Pais::where('codigo_iso2', 'VE')->first()
            ?? Pais::where('codigo_iso2', 'CL')->first()
            ?? Pais::first();

        Sucursal::updateOrCreate([
            'id' => 1,
        ], [
            'empresa_id' => $empresa->id,
            'nombre' => 'Sucursal Principal',
            'pais_telefono_id' => $pais?->id,
            'telefono' => '4121234567',
            'direccion' => 'Av. Francisco de Miranda, Caracas, Venezuela',
            'latitud' => 10.4806,
            'longitud' => -66.9036,
            'status' => true,
        ]);
    }
}
