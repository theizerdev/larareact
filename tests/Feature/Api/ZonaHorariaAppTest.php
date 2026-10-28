<?php

namespace Tests\Feature\Api;

use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * La app muestra las horas de la planta (zona de la sucursal), como el kiosko
 * web y los reportes, no las del servidor.
 */
class ZonaHorariaAppTest extends TestCase
{
    use RefreshDatabase;

    private Empleado $empleado;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
        // 15:00 en CDMX (UTC-6) son las 14:00 en Tijuana (UTC-7 en octubre).
        $this->travelTo(Carbon::parse('2026-10-22 15:00:00', 'America/Mexico_City'));

        $empresa = Empresa::create(['razon_social' => 'Smurfit Test', 'documento' => 'DOC-TZAPP', 'status' => true]);
        $sucursal = Sucursal::create([
            'nombre' => 'Planta Tijuana', 'empresa_id' => $empresa->id,
            'zona_horaria' => 'America/Tijuana', 'status' => true,
        ]);
        // Cuenta de autoservicio sin sucursal: manda la del empleado.
        $user = User::factory()->create(['empresa_id' => $empresa->id, 'status' => 'activo']);
        $this->empleado = new Empleado;
        $this->empleado->forceFill([
            'nombres' => 'Luis', 'apellidos' => 'Frontera',
            'documento_identidad' => '900', 'codigo_acceso' => '00000900',
            'empresa_id' => $empresa->id, 'sucursal_id' => $sucursal->id, 'user_id' => $user->id,
            'status' => true, 'permite_app_movil' => true,
        ])->save();

        $this->actingAs($user, 'sanctum');
    }

    public function test_la_configuracion_trae_la_zona_de_la_sucursal_del_empleado(): void
    {
        $this->getJson('/api/reloj-checador/configuracion')
            ->assertOk()
            ->assertJsonPath('zona_horaria', 'America/Tijuana');
    }

    public function test_las_horas_de_los_marcajes_son_las_de_la_planta(): void
    {
        $this->postJson('/api/reloj-checador/registrar', [
            'empleado_id' => $this->empleado->id,
            'tipo_marcaje' => 'entrada',
        ])->assertOk()
            ->assertJsonPath('marcaje.hora', '14:00:00')
            ->assertJsonPath('marcaje.fecha', '22/10/2026');

        $this->getJson('/api/reloj-checador/mi-empleado')
            ->assertOk()
            ->assertJsonPath('ultimo_marcaje.hora', '14:00:00');

        $this->getJson('/api/reloj-checador/mi-historial')
            ->assertOk()
            ->assertJsonPath('marcajes.0.hora', '14:00:00');

        // Pantallas de supervisión (Empleados y Bitácora).
        foreach (['empleados.view', 'asistencia.bitacora'] as $permiso) {
            $this->empleado->user->givePermissionTo(Permission::firstOrCreate(['name' => $permiso, 'guard_name' => 'web']));
        }

        $this->getJson("/api/empleados/{$this->empleado->id}/marcajes")
            ->assertOk()
            ->assertJsonPath('data.0.hora', '14:00:00');

        $this->getJson('/api/asistencia/bitacora')
            ->assertOk()
            ->assertJsonPath('marcajes.0.hora', '14:00:00');
    }
}
