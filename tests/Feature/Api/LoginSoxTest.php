<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * La app móvil respeta la política SOX del login web: bloqueo por intentos
 * fallidos y contraseñas nuevas sin repetir el historial.
 */
class LoginSoxTest extends TestCase
{
    use RefreshDatabase;

    public function test_entra_con_correo_y_contrasena(): void
    {
        $user = User::factory()->create(['email' => 'ana@smurfit.test']);

        $this->postJson('/api/login', ['email' => 'Ana@Smurfit.test', 'password' => 'password'])
            ->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure(['token', 'user' => ['id', 'roles', 'permissions']]);

        $this->assertSame(1, $user->tokens()->where('name', 'movil_app')->count());
    }

    public function test_contrasena_incorrecta_suma_un_intento_fallido(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'otra'])
            ->assertUnauthorized()
            ->assertJson(['message' => 'Credenciales incorrectas']);

        $this->assertSame(1, $user->fresh()->failed_login_attempts);
    }

    public function test_al_llegar_al_limite_bloquea_la_cuenta(): void
    {
        $user = User::factory()->create(['failed_login_attempts' => 4]);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'otra'])
            ->assertStatus(423);

        $this->assertTrue($user->fresh()->isLocked());
    }

    public function test_cuenta_bloqueada_no_entra_ni_con_la_contrasena_correcta(): void
    {
        $user = User::factory()->create(['locked_until' => now()->addMinutes(10)]);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])
            ->assertStatus(423);

        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_entrar_reinicia_el_contador_de_intentos(): void
    {
        $user = User::factory()->create(['failed_login_attempts' => 3]);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])
            ->assertOk();

        $this->assertSame(0, $user->fresh()->failed_login_attempts);
    }

    public function test_cambiar_contrasena_la_guarda_en_el_historial(): void
    {
        $user = User::factory()->create();
        $nueva = 'Smurfit-Movil-2026!';

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/user/password', [
                'current_password' => 'password',
                'new_password' => $nueva,
                'new_password_confirmation' => $nueva,
            ])
            ->assertOk();

        $this->assertTrue(Hash::check($nueva, $user->fresh()->password));
        $this->assertSame(1, $user->passwordHistories()->count());
    }

    public function test_cambiar_contrasena_rechaza_una_debil(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/user/password', [
                'current_password' => 'password',
                'new_password' => 'abc123',
                'new_password_confirmation' => 'abc123',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('new_password');
    }
}
