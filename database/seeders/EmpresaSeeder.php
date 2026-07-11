<?php

namespace Database\Seeders;

use App\Models\Empresa;
use Illuminate\Database\Seeder;

class EmpresaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Empresa::firstOrCreate([
            'razon_social' => 'Empresa Principal C.A.',
        ], [
            'documento' => 'J-12345678-9',
            'direccion' => 'Av. Principal con Calle Secundaria, Edificio Central, Caracas',
            'telefono' => '+58 212 555 5555',
            'email' => 'contacto@empresaprincipal.com',
            'pais_id' => 20,
            'pais_telefono_id' => 20,
        ]);
    }
}
