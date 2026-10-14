<?php

namespace Tests\Feature;

use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class EmpleadoAppMovilTest extends TestCase
{
    use RefreshDatabase;

    private function crearEscenario(bool $permiteAppMovil = false, int $intervalo = 15): array
    {
        $empresa = Empresa::create([
            'razon_social' => 'Smurfit Test',
            'documento' => 'DOC-TEST',
            'status' => true,
        ]);

        $sucursal = Sucursal::create([
            'nombre' => 'Planta Principal',
            'empresa_id' => $empresa->id,
            'status' => true,
        ]);

        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
            'status' => 'activo',
        ]);

        $empleado = new Empleado();
        $empleado->forceFill([
            'nombres' => 'Carlos',
            'apellidos' => 'González',
            'documento_identidad' => '889900',
            'codigo_acceso' => '889900',
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
            'user_id' => $user->id,
            'status' => true,
            'permite_app_movil' => $permiteAppMovil,
            'intervalo_geolocalizacion_minutos' => $intervalo,
        ])->save();

        return [$empresa, $sucursal, $user, $empleado];
    }

    public function test_empleado_guarda_campos_de_app_movil(): void
    {
        [$empresa, $sucursal, $user, $empleado] = $this->crearEscenario(true, 30);

        $this->assertTrue($empleado->permite_app_movil);
        $this->assertSame(30, $empleado->intervalo_geolocalizacion_minutos);

        $empleado->update([
            'permite_app_movil' => false,
            'intervalo_geolocalizacion_minutos' => 10,
        ]);

        $empleado->refresh();
        $this->assertFalse($empleado->permite_app_movil);
        $this->assertSame(10, $empleado->intervalo_geolocalizacion_minutos);
    }

    public function test_toggle_app_movil_cambia_estatus_correctamente(): void
    {
        [$empresa, $sucursal, $user, $empleado] = $this->crearEscenario(false, 15);

        $admin = User::factory()->create(['empresa_id' => $empresa->id]);
        $admin->givePermissionTo(Permission::firstOrCreate(['name' => 'empleados.edit', 'guard_name' => 'web']));

        $response = $this->actingAs($admin)
            ->patch("/admin/empleados/{$empleado->id}/toggle-app-movil");

        $response->assertRedirect();
        $empleado->refresh();
        $this->assertTrue($empleado->permite_app_movil);

        // Toggle de nuevo
        $this->actingAs($admin)
            ->patch("/admin/empleados/{$empleado->id}/toggle-app-movil");

        $empleado->refresh();
        $this->assertFalse($empleado->permite_app_movil);
    }

    public function test_login_empleado_bloquea_si_no_tiene_permiso_movil(): void
    {
        [$empresa, $sucursal, $user, $empleado] = $this->crearEscenario(false, 15);

        $response = $this->postJson('/api/login-empleado', [
            'codigo_acceso' => '889900',
        ]);

        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
            'message' => 'No tienes permiso para acceder a la aplicación móvil. Contacta a Recursos Humanos.',
        ]);
    }

    public function test_login_empleado_permite_acceso_si_tiene_permiso_movil_y_devuelve_intervalo(): void
    {
        [$empresa, $sucursal, $user, $empleado] = $this->crearEscenario(true, 20);

        $response = $this->postJson('/api/login-empleado', [
            'codigo_acceso' => '889900',
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'intervalo_geolocalizacion_minutos' => 20,
            'empleado' => [
                'permite_app_movil' => true,
                'intervalo_geolocalizacion_minutos' => 20,
            ],
        ]);
    }

    public function test_mi_empleado_bloquea_si_permite_app_movil_es_falso(): void
    {
        [$empresa, $sucursal, $user, $empleado] = $this->crearEscenario(false, 15);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/reloj-checador/mi-empleado');

        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
            'message' => 'No tienes permiso para utilizar la app móvil. Contacta a Recursos Humanos.',
        ]);
    }

    public function test_mi_empleado_devuelve_configuracion_movil_cuando_esta_habilitado(): void
    {
        [$empresa, $sucursal, $user, $empleado] = $this->crearEscenario(true, 45);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/reloj-checador/mi-empleado');

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'intervalo_geolocalizacion_minutos' => 45,
            'empleado' => [
                'permite_app_movil' => true,
                'intervalo_geolocalizacion_minutos' => 45,
            ],
        ]);
    }

    public function test_registrar_marcaje_movil_bloquea_si_permite_app_movil_es_falso(): void
    {
        [$empresa, $sucursal, $user, $empleado] = $this->crearEscenario(false, 15);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/reloj-checador/registrar', [
                'empleado_id' => $empleado->id,
                'tipo_marcaje' => 'entrada',
            ]);

        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
            'message' => 'No tienes permiso para registrar marcajes desde la app móvil.',
        ]);
    }
}
