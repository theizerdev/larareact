<?php

namespace Database\Factories;

use App\Models\Empresa;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Empresa>
 */
class EmpresaFactory extends Factory
{
    protected $model = Empresa::class;

    public function definition(): array
    {
        return [
            'razon_social' => fake()->company(),
            'nombre_comercial' => fake()->company(),
            'documento' => fake()->unique()->numerify('RFC########'),
            'direccion' => fake()->address(),
            'latitud' => 19.9868,
            'longitud' => -102.2839,
            'zona_horaria' => 'America/Mexico_City',
            'telefono' => fake()->numerify('##########'),
            'email' => fake()->unique()->safeEmail(),
            'status' => true,
            'api_key' => Str::random(32),
            'whatsapp_api_key' => Str::random(32),
        ];
    }
}
