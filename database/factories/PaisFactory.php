<?php

namespace Database\Factories;

use App\Models\Pais;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pais>
 */
class PaisFactory extends Factory
{
    protected $model = Pais::class;

    public function definition(): array
    {
        return [
            'nombre' => fake()->unique()->country(),
            'codigo_iso2' => fake()->unique()->lexify('??'),
            'codigo_iso3' => fake()->unique()->lexify('???'),
            'codigo_telefonico' => '+52',
            'moneda_principal' => 'MXN',
            'idioma_principal' => 'es',
            'continente' => 'America',
            'latitud' => 19.9868,
            'longitud' => -102.2839,
            'zona_horaria' => 'America/Mexico_City',
            'activo' => true,
        ];
    }
}
