<?php

namespace Database\Seeders;

use App\Models\Pais;
use Illuminate\Database\Seeder;

class PaisSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Datos de países latinoamericanos
        $paisesLatinoamericanos = [
                        [
                'nombre' => 'México',
                'codigo_iso2' => 'MX',
                'codigo_iso3' => 'MEX',
                'codigo_telefonico' => '+521',
                'moneda_principal' => 'MXN',
                'idioma_principal' => 'es',
                'continente' => 'América del Norte',
                'zona_horaria' => 'America/Mexico_City',
                'formato_fecha' => 'dd/mm/yyyy',
                'formato_moneda' => '$1.234,56',
                'impuesto_predeterminado' => 16.00,
                'separador_miles' => ',',
                'separador_decimales' => '.',
                'decimales_moneda' => 2,
                'activo' => true,
                'latitud' => 19.4326,
                'longitud' => -99.1332,
            ],
        ];

        // Insertar o actualizar los países
        foreach ($paisesLatinoamericanos as $pais) {
            Pais::updateOrCreate(
                ['codigo_iso2' => $pais['codigo_iso2']], // Buscar por código ISO2
                $pais // Datos a actualizar o crear
            );
        }

        $this->command->info('✅ Países latinoamericanos procesados exitosamente');
        $this->command->info('📊 Total de países procesados: '.count($paisesLatinoamericanos));
    }
}
