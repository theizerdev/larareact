<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_a_successful_response()
    {
        // Con el landing comercial apagado (instancia de cliente), la raíz
        // lleva al login.
        $this->get(route('home'))->assertRedirect(route('login'));

        config(['modulos.landing' => true]);
        $this->get(route('home'))->assertOk();
    }
}
