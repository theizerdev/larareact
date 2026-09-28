<?php

namespace Tests\Feature\Api;

use App\Models\Empleado;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Comando que da cuenta de acceso a los empleados para que puedan entrar con
 * su número desde la app móvil.
 */
class VincularUsuariosEmpleadosTest extends TestCase
{
    use RefreshDatabase;

    private function empleado(array $atributos = []): Empleado
    {
        static $n = 0;
        $n++;

        return Empleado::create(array_merge([
            'nombres' => 'Rene',
            'apellidos' => 'Pulido Martínez',
            'documento_identidad' => str_pad((string) (101000 + $n), 6, '0', STR_PAD_LEFT),
            'codigo_acceso' => str_pad((string) (10100000 + $n), 8, '0', STR_PAD_LEFT),
            'status' => true,
        ], $atributos));
    }

    public function test_sin_aplicar_no_escribe_nada(): void
    {
        $empleado = $this->empleado();

        $this->artisan('empleados:vincular-usuarios')->assertSuccessful();

        $this->assertNull($empleado->fresh()->user_id);
        $this->assertSame(0, User::count());
    }

    public function test_con_aplicar_crea_la_cuenta_y_la_vincula(): void
    {
        $empleado = $this->empleado(['correo' => null]);

        $this->artisan('empleados:vincular-usuarios --aplicar')->assertSuccessful();

        $empleado->refresh();
        $this->assertNotNull($empleado->user_id);
        $this->assertSame('Rene Pulido Martínez', $empleado->user->name);
        $this->assertSame("emp{$empleado->codigo_acceso}@shigoto.local", $empleado->user->email);
        $this->assertSame('activo', $empleado->user->status);
    }

    /**
     * Lo que impide que el número del gafete abra el panel administrativo.
     */
    public function test_las_cuentas_creadas_no_tienen_ningun_rol(): void
    {
        $empleado = $this->empleado();

        $this->artisan('empleados:vincular-usuarios --aplicar')->assertSuccessful();

        $this->assertCount(0, $empleado->fresh()->user->getRoleNames());
    }

    public function test_reutiliza_el_usuario_que_ya_tiene_el_correo_del_empleado(): void
    {
        $user = User::factory()->create(['email' => 'rene@empresa.com']);
        $empleado = $this->empleado(['correo' => 'rene@empresa.com']);

        $this->artisan('empleados:vincular-usuarios --aplicar')->assertSuccessful();

        $this->assertSame($user->id, $empleado->fresh()->user_id);
        $this->assertSame(1, User::count(), 'No debe duplicar la cuenta existente');
    }

    /**
     * Dos empleados apuntando al mismo user_id romperían /mi-empleado, que
     * resuelve al empleado desde la cuenta autenticada.
     */
    public function test_no_reutiliza_un_usuario_ya_tomado_por_otro_empleado(): void
    {
        $user = User::factory()->create(['email' => 'compartido@empresa.com']);
        $this->empleado(['correo' => 'compartido@empresa.com', 'user_id' => $user->id]);
        $segundo = $this->empleado(['correo' => 'compartido@empresa.com']);

        $this->artisan('empleados:vincular-usuarios --aplicar')->assertSuccessful();

        $segundo->refresh();
        $this->assertNotNull($segundo->user_id);
        $this->assertNotSame($user->id, $segundo->user_id);
    }

    public function test_omite_empleados_inactivos_salvo_que_se_pidan(): void
    {
        $inactivo = $this->empleado(['status' => false]);

        $this->artisan('empleados:vincular-usuarios --aplicar')->assertSuccessful();
        $this->assertNull($inactivo->fresh()->user_id);

        $this->artisan('empleados:vincular-usuarios --aplicar --incluir-inactivos')->assertSuccessful();
        $this->assertNotNull($inactivo->fresh()->user_id);
    }

    public function test_es_idempotente(): void
    {
        $this->empleado();

        $this->artisan('empleados:vincular-usuarios --aplicar')->assertSuccessful();
        $this->artisan('empleados:vincular-usuarios --aplicar')->assertSuccessful();

        $this->assertSame(1, User::count());
    }

    /**
     * Cierra el círculo: tras correr el comando, el número del gafete entra.
     */
    public function test_despues_de_vincular_el_numero_ya_permite_entrar(): void
    {
        $empleado = $this->empleado();

        $this->postJson('/api/login-empleado', ['codigo_acceso' => $empleado->documento_identidad])
            ->assertStatus(403);

        $this->artisan('empleados:vincular-usuarios --aplicar')->assertSuccessful();

        $this->postJson('/api/login-empleado', ['codigo_acceso' => $empleado->documento_identidad])
            ->assertOk()
            ->assertJson(['success' => true]);
    }
}
