<?php

namespace Tests\Feature\Api;

use App\Models\AsistenciaMarcaje;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * La app muestra el mismo semáforo de tiempo que la Bitácora web: lo que
 * queda de comida o descanso, y "excedido" cuando se pasa.
 */
class SemaforoTiempoAppTest extends TestCase
{
    use RefreshDatabase;

    private Empleado $empleado;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
        $this->travelTo(Carbon::parse('2026-10-22 14:00:00'));

        $empresa = Empresa::create(['razon_social' => 'Smurfit Test', 'documento' => 'DOC-SEMAPP', 'status' => true]);
        $user = User::factory()->create(['empresa_id' => $empresa->id, 'status' => 'activo']);
        $this->empleado = new Empleado;
        $this->empleado->forceFill([
            'nombres' => 'Ana', 'apellidos' => 'Semáforo',
            'documento_identidad' => '700', 'codigo_acceso' => '00000700',
            'empresa_id' => $empresa->id, 'user_id' => $user->id,
            'status' => true, 'permite_app_movil' => true,
        ])->save();

        $this->actingAs($user, 'sanctum');
    }

    private function marco(string $tipo, int $haceMinutos): void
    {
        AsistenciaMarcaje::create([
            'empresa_id' => $this->empleado->empresa_id,
            'empleado_id' => $this->empleado->id,
            'tipo_marcaje' => $tipo,
            'fecha_hora' => now()->subMinutes($haceMinutos),
            'origen' => 'app',
        ]);
    }

    public function test_comida_en_curso(): void
    {
        $this->marco('salida_comida', 20);

        $this->getJson('/api/reloj-checador/mi-empleado')
            ->assertOk()
            ->assertJsonPath('tiempo.estado', 'en_curso')
            ->assertJsonPath('tiempo.concepto', 'Almuerzo')
            ->assertJsonPath('tiempo.limite_minutos', 60)
            ->assertJsonPath('tiempo.minutos_restantes', 40)
            ->assertJsonPath('tiempo.desde', now()->subMinutes(20)->toIso8601String());
    }

    public function test_comida_excedida(): void
    {
        $this->marco('salida_comida', 75);

        $this->getJson('/api/reloj-checador/mi-empleado')
            ->assertOk()
            ->assertJsonPath('tiempo.estado', 'excedido')
            ->assertJsonPath('tiempo.texto', 'Excedido por 15 min');
    }

    public function test_sin_marcajes_hoy_no_hay_semaforo(): void
    {
        $this->getJson('/api/reloj-checador/mi-empleado')
            ->assertOk()
            ->assertJsonPath('tiempo', null);
    }

    public function test_la_bitacora_web_muestra_el_mismo_semaforo(): void
    {
        $this->marco('salida_comida', 75);
        $user = $this->empleado->user;
        $user->givePermissionTo(Permission::firstOrCreate(['name' => 'asistencia.bitacora', 'guard_name' => 'web']));

        $this->actingAs($user)->get('/admin/asistencia/bitacora')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('marcajes.data.0.tiempo_restante_info.estado', 'excedido')
                ->where('marcajes.data.0.tiempo_restante_info.texto', 'Excedido por 15 min')
                ->where('marcajes.data.0.tiempo_restante_info.limite_minutos', 60)
                ->etc());
    }

    public function test_la_bitacora_movil_lleva_el_semaforo_en_el_ultimo_marcaje(): void
    {
        $this->marco('entrada', 120);
        $this->marco('descanso_inicio', 20);
        $user = $this->empleado->user;
        $user->givePermissionTo(Permission::firstOrCreate(['name' => 'asistencia.bitacora', 'guard_name' => 'web']));

        $this->actingAs($user, 'sanctum')->getJson('/api/asistencia/bitacora')
            ->assertOk()
            ->assertJsonPath('marcajes.0.tipo', 'descanso_inicio')
            ->assertJsonPath('marcajes.0.tiempo.estado', 'excedido')
            ->assertJsonPath('marcajes.0.tiempo.concepto', 'Descanso')
            ->assertJsonPath('marcajes.0.tiempo.limite_minutos', 15) // sin configuración: 15 min
            ->assertJsonPath('marcajes.1.tiempo', null);
    }
}
