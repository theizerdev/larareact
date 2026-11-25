<?php

namespace Tests\Feature\Api;

use App\Console\Commands\SmurfitRoles;
use App\Models\AsistenciaMarcaje;
use App\Models\Empleado;
use App\Models\EmpleadoUbicacion;
use App\Models\Empresa;
use App\Models\User;
use App\Services\UbicacionJornadaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Matriz de perfiles (Responsable de zona, Gerente RRHH, Colaborador) con su
 * alcance por Legacy, y ubicaciÃ³n del colaborador durante su jornada.
 */
class PerfilesYUbicacionTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create(['razon_social' => 'Smurfit Westrock', 'documento' => 'DOC-PERFILES', 'status' => true]);

        foreach (array_unique(array_merge(...array_values(SmurfitRoles::ROLES))) as $permiso) {
            Permission::firstOrCreate(['name' => $permiso, 'guard_name' => 'web']);
        }
        $this->artisan('smurfit:roles')->assertSuccessful();
    }

    private function cuenta(string $rol, ?string $legacy = null): User
    {
        $user = User::factory()->create(['empresa_id' => $this->empresa->id, 'status' => 'activo', 'legacy' => $legacy]);
        $user->assignRole($rol);

        return $user;
    }

    private function empleado(array $datos = []): Empleado
    {
        $empleado = new Empleado;
        $empleado->forceFill($datos + [
            'nombres' => 'Ana',
            'apellidos' => 'Rostro',
            'documento_identidad' => 'SW-'.Str::random(6),
            'empresa_id' => $this->empresa->id,
            'status' => true,
            'permite_app_movil' => true,
        ])->save();

        return $empleado;
    }

    private function marcaje(Empleado $empleado, string $tipo, $fechaHora): AsistenciaMarcaje
    {
        $m = new AsistenciaMarcaje;
        $m->forceFill([
            'empresa_id' => $empleado->empresa_id,
            'empleado_id' => $empleado->id,
            'tipo_marcaje' => $tipo,
            'fecha_hora' => $fechaHora,
            'origen' => 'app',
        ])->save();

        return $m;
    }

    private function punto(array $extra = []): array
    {
        return $extra + [
            'uuid_cliente' => (string) Str::uuid(),
            'latitud' => 20.6736,
            'longitud' => -103.344,
            'precision_metros' => 12.5,
            'fecha_hora_dispositivo' => now()->toIso8601String(),
        ];
    }

    public function test_el_comando_crea_los_roles_de_la_matriz(): void
    {
        $zona = $this->cuenta(SmurfitRoles::RESPONSABLE_ZONA);
        $rrhh = $this->cuenta(SmurfitRoles::GERENTE_RRHH);
        $colaborador = $this->cuenta(SmurfitRoles::COLABORADOR);

        // Kiosko, Dashboard, Empleados y BitÃ¡coras.
        $this->assertTrue($zona->can('asistencia.kiosko') && $zona->can('dashboard.view')
            && $zona->can('empleados.view') && $zona->can('asistencia.bitacora'));
        // Kiosko y BitÃ¡coras.
        $this->assertTrue($rrhh->can('asistencia.kiosko') && $rrhh->can('asistencia.bitacora'));
        $this->assertFalse($rrhh->can('dashboard.view') || $rrhh->can('empleados.view'));
        // Su propio kiosko y bitÃ¡cora no piden permisos.
        $this->assertCount(0, $colaborador->getAllPermissions());

        // Idempotente.
        $this->artisan('smurfit:roles')->assertSuccessful();
        $this->assertSame(1, Role::where('name', SmurfitRoles::GERENTE_RRHH)->count());
    }

    public function test_el_responsable_de_zona_solo_ve_su_legacy(): void
    {
        $zona = $this->cuenta(SmurfitRoles::RESPONSABLE_ZONA, 'Norte');
        $norte = $this->empleado(['nombres' => 'Nora', 'legacy' => 'Norte']);
        $sur = $this->empleado(['nombres' => 'Sergio', 'legacy' => 'Sur']);
        // Su propio colaborador es de otro Legacy y aun asÃ­ lo ve.
        $propio = $this->empleado(['nombres' => 'Zoe', 'legacy' => 'Centro', 'user_id' => $zona->id]);
        $this->marcaje($norte, 'entrada', now());
        $this->marcaje($sur, 'entrada', now());

        $ids = collect($this->actingAs($zona, 'sanctum')->getJson('/api/empleados')->assertOk()->json('data'))->pluck('id');
        $this->assertEqualsCanonicalizing([$norte->id, $propio->id], $ids->all());

        $this->actingAs($zona, 'sanctum')->getJson("/api/empleados/{$sur->id}")->assertNotFound();

        $this->actingAs($zona, 'sanctum')->getJson('/api/asistencia/bitacora')
            ->assertOk()
            ->assertJsonPath('stats.total', 1)
            ->assertJsonPath('marcajes.0.nombre', $norte->nombre_completo);

        $this->actingAs($zona, 'sanctum')->getJson('/api/dashboard/resumen')
            ->assertOk()
            ->assertJsonPath('empleados_total', 2)
            ->assertJsonPath('marcajes_hoy', 1);

        // El kiosko tampoco encuentra a los de otro Legacy.
        $this->actingAs($zona, 'sanctum')->postJson('/api/reloj-checador/buscar', ['query' => $sur->documento_identidad])
            ->assertNotFound();
        $this->actingAs($zona, 'sanctum')->postJson('/api/reloj-checador/buscar', ['query' => $norte->documento_identidad])
            ->assertOk();
    }

    public function test_sin_legacy_el_usuario_ve_toda_su_empresa(): void
    {
        $zona = $this->cuenta(SmurfitRoles::RESPONSABLE_ZONA);
        $this->empleado(['legacy' => 'Norte']);
        $this->empleado(['legacy' => 'Sur']);

        $this->actingAs($zona, 'sanctum')->getJson('/api/empleados')->assertOk()->assertJsonPath('total', 2);
    }

    public function test_el_gerente_rrhh_tiene_kiosko_y_bitacora_de_su_legacy(): void
    {
        $rrhh = $this->cuenta(SmurfitRoles::GERENTE_RRHH, 'Norte');
        $norte = $this->empleado(['legacy' => 'Norte']);
        $sur = $this->empleado(['legacy' => 'Sur']);
        $this->marcaje($norte, 'entrada', now());
        $this->marcaje($sur, 'entrada', now());

        $this->actingAs($rrhh, 'sanctum')->getJson('/api/dashboard/resumen')->assertForbidden();
        $this->actingAs($rrhh, 'sanctum')->getJson('/api/empleados')->assertForbidden();
        $this->actingAs($rrhh, 'sanctum')->getJson('/api/asistencia/bitacora')->assertOk()->assertJsonPath('stats.total', 1);

        // Marca en el kiosko a los de su Legacy, no a los demÃ¡s.
        $this->actingAs($rrhh, 'sanctum')
            ->postJson('/api/reloj-checador/registrar', ['empleado_id' => $norte->id, 'tipo_marcaje' => 'salida'])
            ->assertOk();
        $this->actingAs($rrhh, 'sanctum')
            ->postJson('/api/reloj-checador/registrar', ['empleado_id' => $sur->id, 'tipo_marcaje' => 'salida'])
            ->assertNotFound();

        $this->actingAs($rrhh, 'sanctum')->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('legacy', 'Norte')
            ->assertJsonPath('roles.0', SmurfitRoles::GERENTE_RRHH);
    }

    public function test_quien_solo_ve_un_legacy_no_asigna_otro(): void
    {
        $admin = User::factory()->create(['empresa_id' => $this->empresa->id, 'status' => 'activo', 'legacy' => 'Norte']);
        $admin->givePermissionTo(Permission::firstOrCreate(['name' => 'users.create', 'guard_name' => 'web']));

        $this->actingAs($admin)
            ->post('/admin/usuarios', [
                'name' => 'Otra zona',
                'email' => 'otra@sw.com',
                'password' => 'Una-Contrasena-Larga-2026!',
                'status' => 'activo',
                'legacy' => 'Sur',
            ])
            ->assertSessionHasErrors('legacy');

        $this->assertDatabaseMissing('users', ['email' => 'otra@sw.com']);
    }

    public function test_la_ubicacion_solo_se_guarda_durante_la_jornada(): void
    {
        $colaborador = $this->cuenta(SmurfitRoles::COLABORADOR);
        $empleado = $this->empleado(['user_id' => $colaborador->id, 'intervalo_geolocalizacion_minutos' => 15]);
        $enviar = fn (array $puntos) => $this->actingAs($colaborador, 'sanctum')
            ->postJson('/api/reloj-checador/ubicaciones', ['puntos' => $puntos]);

        // Antes de la entrada: nada.
        $enviar([$this->punto()])
            ->assertOk()
            ->assertJsonPath('guardados', 0)
            ->assertJsonPath('fuera_de_jornada', 1)
            ->assertJsonPath('jornada_abierta', false);

        $this->travel(1)->minutes();
        $entrada = $this->marcaje($empleado, 'entrada', now()->subSecond());
        $this->actingAs($colaborador, 'sanctum')->getJson('/api/reloj-checador/ubicaciones/estado')
            ->assertOk()
            ->assertJsonPath('jornada_abierta', true)
            ->assertJsonPath('intervalo_minutos', 15);

        // Durante: se guarda, y reenviar el mismo punto no lo duplica.
        $punto = $this->punto();
        $enviar([$punto, $this->punto()])->assertOk()->assertJsonPath('guardados', 2)->assertJsonPath('jornada_abierta', true);
        $enviar([$punto])->assertOk()->assertJsonPath('guardados', 0)->assertJsonPath('duplicados', 1);
        $this->assertSame($entrada->id, EmpleadoUbicacion::where('uuid_cliente', $punto['uuid_cliente'])->value('asistencia_marcaje_id'));

        // La comida no cierra la jornada; la salida sÃ­.
        $this->travel(15)->minutes();
        $this->marcaje($empleado, 'salida_comida', now()->subSecond());
        $enviar([$this->punto()])->assertOk()->assertJsonPath('guardados', 1);
        $this->travel(15)->minutes();
        $this->marcaje($empleado, 'salida', now()->subSecond());
        $enviar([$this->punto()])
            ->assertOk()
            ->assertJsonPath('guardados', 0)
            ->assertJsonPath('fuera_de_jornada', 1)
            ->assertJsonPath('jornada_abierta', false);

        $this->assertSame(3, EmpleadoUbicacion::count());
    }

    public function test_los_puntos_sin_conexion_cuentan_por_su_hora(): void
    {
        $colaborador = $this->cuenta(SmurfitRoles::COLABORADOR);
        $empleado = $this->empleado(['user_id' => $colaborador->id]);
        $this->marcaje($empleado, 'entrada', now()->subHours(3));
        $this->marcaje($empleado, 'salida', now()->subHour());

        $this->actingAs($colaborador, 'sanctum')
            ->postJson('/api/reloj-checador/ubicaciones', ['puntos' => [
                // Tomado en la jornada, enviado despuÃ©s de la salida.
                $this->punto(['fecha_hora_dispositivo' => now()->subHours(2)->toIso8601String()]),
                // Fuera de jornada.
                $this->punto(['fecha_hora_dispositivo' => now()->subMinutes(30)->toIso8601String()]),
                // Hora del telÃ©fono en el futuro.
                $this->punto(['fecha_hora_dispositivo' => now()->addHour()->toIso8601String()]),
            ]])
            ->assertOk()
            ->assertJsonPath('guardados', 1)
            ->assertJsonPath('fuera_de_jornada', 2);
    }

    public function test_el_kiosko_compartido_no_envia_ubicaciones(): void
    {
        $kiosko = $this->cuenta(SmurfitRoles::GERENTE_RRHH);

        $this->actingAs($kiosko, 'sanctum')
            ->postJson('/api/reloj-checador/ubicaciones', ['puntos' => [$this->punto()]])
            ->assertForbidden();
    }

    public function test_el_recorrido_respeta_el_legacy(): void
    {
        $colaborador = $this->cuenta(SmurfitRoles::COLABORADOR);
        $empleado = $this->empleado(['user_id' => $colaborador->id, 'legacy' => 'Sur']);
        $this->marcaje($empleado, 'entrada', now()->subMinute());
        $this->actingAs($colaborador, 'sanctum')
            ->postJson('/api/reloj-checador/ubicaciones', ['puntos' => [$this->punto()]])
            ->assertJsonPath('guardados', 1);

        $sur = $this->cuenta(SmurfitRoles::RESPONSABLE_ZONA, 'Sur');
        $this->actingAs($sur, 'sanctum')->getJson("/api/empleados/{$empleado->id}/ubicaciones")
            ->assertOk()
            ->assertJsonCount(1, 'ubicaciones')
            ->assertJsonPath('ubicaciones.0.latitud', 20.6736);

        $norte = $this->cuenta(SmurfitRoles::RESPONSABLE_ZONA, 'Norte');
        $this->actingAs($norte, 'sanctum')->getJson("/api/empleados/{$empleado->id}/ubicaciones")->assertNotFound();
    }

    public function test_el_token_de_ubicacion_sobrevive_al_cierre_de_sesion_y_solo_sirve_para_ubicar(): void
    {
        $colaborador = $this->cuenta(SmurfitRoles::COLABORADOR);
        $empleado = $this->empleado(['user_id' => $colaborador->id]);
        $sesion = $colaborador->createToken('movil_app')->plainTextToken;
        $con = function (string $token) {
            $this->app['auth']->forgetGuards();

            return $this->withToken($token);
        };

        // Sin jornada no hay monitoreo.
        $con($sesion)->postJson('/api/reloj-checador/ubicaciones/sesion')->assertStatus(409);

        $this->marcaje($empleado, 'entrada', now()->subMinute());
        $respuesta = $con($sesion)->postJson('/api/reloj-checador/ubicaciones/sesion')
            ->assertOk()
            ->assertJsonPath('jornada_abierta', true)
            ->assertJsonPath('intervalo_minutos', 15);
        $ubicacion = $respuesta->json('token');
        $this->assertNotEmpty($respuesta->json('expira_en'));

        // La app cierra la sesión tras marcar y el siguiente login borra los
        // tokens movil_app: el de ubicación sigue sirviendo.
        $con($sesion)->postJson('/api/logout')->assertOk();
        $colaborador->tokens()->where('name', 'movil_app')->delete();

        $con($ubicacion)->postJson('/api/reloj-checador/ubicaciones', ['puntos' => [$this->punto()]])
            ->assertOk()
            ->assertJsonPath('guardados', 1);
        $con($ubicacion)->getJson('/api/reloj-checador/ubicaciones/estado')->assertOk();

        // Para nada más: ni datos, ni marcar, ni renovarse.
        $con($ubicacion)->getJson('/api/user')->assertForbidden();
        $con($ubicacion)->postJson('/api/reloj-checador/registrar', ['empleado_id' => $empleado->id, 'tipo_marcaje' => 'salida'])
            ->assertForbidden();
        $con($ubicacion)->postJson('/api/reloj-checador/ubicaciones/sesion')->assertForbidden();

        // Al terminar la jornada la app lo revoca.
        $con($ubicacion)->deleteJson('/api/reloj-checador/ubicaciones/sesion')->assertOk();
        $con($ubicacion)->getJson('/api/reloj-checador/ubicaciones/estado')->assertUnauthorized();
    }

    public function test_el_token_de_ubicacion_caduca(): void
    {
        $colaborador = $this->cuenta(SmurfitRoles::COLABORADOR);
        $empleado = $this->empleado(['user_id' => $colaborador->id]);
        $this->marcaje($empleado, 'entrada', now()->subMinute());

        $ubicacion = $this->actingAs($colaborador, 'sanctum')
            ->postJson('/api/reloj-checador/ubicaciones/sesion')->assertOk()->json('token');

        $this->travel(UbicacionJornadaService::VIGENCIA_TOKEN_HORAS + 1)->hours();
        $this->app['auth']->forgetGuards();
        $this->withToken($ubicacion)->getJson('/api/reloj-checador/ubicaciones/estado')->assertUnauthorized();
    }
}
