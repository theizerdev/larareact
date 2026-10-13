<?php

namespace Tests\Feature\Api;

use App\Models\Empleado;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Acceso de la app móvil con sólo el número de empleado (sin contraseña).
 */
class LoginEmpleadoTest extends TestCase
{
    use RefreshDatabase;

    private function crearEmpleado(array $atributos = []): Empleado
    {
        return Empleado::create(array_merge([
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
            'documento_identidad' => '000123',
            'codigo_acceso' => '00000123',
            'status' => true,
        ], $atributos));
    }

    public function test_trabajador_entra_con_su_numero_de_empleado(): void
    {
        $user = User::factory()->create();
        $this->crearEmpleado(['user_id' => $user->id]);

        $response = $this->postJson('/api/login-empleado', [
            'codigo_acceso' => '00000123',
        ]);

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure(['token', 'user' => ['id', 'roles', 'permissions']]);

        $this->assertSame($user->id, $response->json('user.id'));
        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'movil_app',
        ]);
    }

    public function test_acepta_el_numero_sin_ceros_a_la_izquierda(): void
    {
        $user = User::factory()->create();
        $this->crearEmpleado(['user_id' => $user->id]);

        // En el gafete va "00000123" pero en piso teclean "123".
        $this->postJson('/api/login-empleado', ['codigo_acceso' => '123'])
            ->assertOk()
            ->assertJson(['success' => true]);
    }

    public function test_el_token_anterior_se_revoca_para_dejar_una_sola_sesion(): void
    {
        $user = User::factory()->create();
        $this->crearEmpleado(['user_id' => $user->id]);

        $primero = $this->postJson('/api/login-empleado', ['codigo_acceso' => '123'])
            ->json('token');
        $segundo = $this->postJson('/api/login-empleado', ['codigo_acceso' => '123'])
            ->json('token');

        $this->assertNotSame($primero, $segundo);
        $this->assertSame(1, $user->tokens()->where('name', 'movil_app')->count());
    }

    public function test_numero_inexistente_es_rechazado(): void
    {
        $this->postJson('/api/login-empleado', ['codigo_acceso' => '999999'])
            ->assertStatus(401)
            ->assertJson(['success' => false]);
    }

    public function test_empleado_dado_de_baja_no_puede_entrar(): void
    {
        $user = User::factory()->create();
        $this->crearEmpleado(['user_id' => $user->id, 'status' => false]);

        $this->postJson('/api/login-empleado', ['codigo_acceso' => '00000123'])
            ->assertStatus(401);
    }

    public function test_empleado_sin_cuenta_vinculada_recibe_mensaje_accionable(): void
    {
        $this->crearEmpleado(['user_id' => null]);

        $this->postJson('/api/login-empleado', ['codigo_acceso' => '00000123'])
            ->assertStatus(403)
            ->assertJsonFragment(['message' => 'Tu número no está vinculado a una cuenta de acceso. Contacta a Recursos Humanos.']);
    }

    /**
     * Contención clave del acceso sin contraseña: filtrar el número de un
     * administrador no debe entregar el panel completo.
     */
    public function test_cuenta_administrativa_no_puede_entrar_solo_con_el_numero(): void
    {
        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $user = User::factory()->create();
        $user->assignRole('admin');
        $this->crearEmpleado(['user_id' => $user->id]);

        $this->postJson('/api/login-empleado', ['codigo_acceso' => '00000123'])
            ->assertStatus(403);

        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_usuario_inactivo_no_puede_entrar(): void
    {
        $user = User::factory()->create(['status' => 'inactivo']);
        $this->crearEmpleado(['user_id' => $user->id]);

        $this->postJson('/api/login-empleado', ['codigo_acceso' => '00000123'])
            ->assertStatus(403);
    }

    public function test_el_numero_es_obligatorio(): void
    {
        $this->postJson('/api/login-empleado', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('codigo_acceso');
    }
}
