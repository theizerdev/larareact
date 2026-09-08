<?php

namespace Database\Factories;

use App\Models\Empresa;
use App\Models\Sucursal;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Sucursal>
 */
class SucursalFactory extends Factory
{
    protected $model = Sucursal::class;

    public function definition(): array
    {
        return [
            'empresa_id' => Empresa::factory(),
            'nombre' => fake()->city(),
            'codigo_numeral' => (string) fake()->numberBetween(10, 99),
            'telefono' => fake()->numerify('##########'),
            'direccion' => fake()->address(),
            'latitud' => 19.9868,
            'longitud' => -102.2839,
            'zona_horaria' => 'America/Mexico_City',
            'status' => true,
        ];
    }
}
