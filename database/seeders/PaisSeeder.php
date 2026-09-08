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
        // Datos de países permitidos (México y Venezuela)
        $paises = [
            [
                'nombre' => 'México',
                'codigo_iso2' => 'MX',
                'codigo_iso3' => 'MEX',
                'codigo_telefonico' => '+52',
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
            [
                'nombre' => 'Venezuela',
                'codigo_iso2' => 'VE',
                'codigo_iso3' => 'VEN',
                'codigo_telefonico' => '+58',
                'moneda_principal' => 'VES',
                'idioma_principal' => 'es',
                'continente' => 'América del Sur',
                'zona_horaria' => 'America/Caracas',
                'formato_fecha' => 'dd/mm/yyyy',
                'formato_moneda' => 'Bs. 1.234,56',
                'impuesto_predeterminado' => 16.00,
                'separador_miles' => '.',
                'separador_decimales' => ',',
                'decimales_moneda' => 2,
                'activo' => true,
                'latitud' => 10.4806,
                'longitud' => -66.9036,
            ],
        ];

        // Insertar México y Venezuela únicamente si no existen
        foreach ($paises as $pais) {
            Pais::firstOrCreate(
                ['codigo_iso2' => $pais['codigo_iso2']],
                $pais
            );
        }

        $this->command->info('✅ Países procesados exitosamente (sólo México y Venezuela)');
        $this->command->info('📊 Total de países activos: '.Pais::count());
    }
}
