<?php

namespace Database\Factories;

use App\Models\Pais;
use App\Models\Productor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Productor>
 */
class ProductorFactory extends Factory
{
    protected $model = Productor::class;

    public function definition(): array
    {
        return [
            'razon_social' => fake()->company(),
            'nombre_comercial' => fake()->company(),
            'documento_identidad' => fake()->unique()->numerify('DOC########'),
            'razon_social_rancho' => fake()->company(),
            'nombre_comercial_rancho' => fake()->company(),
            'telefono' => fake()->numerify('##########'),
            'direccion' => fake()->address(),
            'codigo_postal' => fake()->postcode(),
            'estado' => fake()->state(),
            'responsable' => fake()->name(),
            'pais_id' => Pais::factory(),
            'latitud' => 19.9868,
            'longitud' => -102.2839,
            'status' => 'activo',
        ];
    }
}
