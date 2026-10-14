<?php

namespace Tests\Feature;

use App\Models\AsistenciaMarcaje;
use App\Models\ConfiguracionSox;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\User;
use App\Services\NotificacionAsistenciaWhatsAppService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Regresión de la auditoría de seguridad del 2026-10-14 (API móvil, permisos
 * de escritura, monitoreo, SSO y secretos de integraciones).
 * Cada test afirma el comportamiento SEGURO; si alguno falla, volvió un defecto.
 */
class AuditoriaPermisosApiTest extends TestCase
{
    use RefreshDatabase;

    private const STRONG = 'Xk9#mP2$vL7@qR4!';

    private function perm(string $name): Permission
    {
        return Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
    }

    private function userWith(array $permissions = [], array $attrs = []): User
    {
        $u = User::factory()->create($attrs);
        foreach ($permissions as $p) {
            $u->givePermissionTo($this->perm($p));
        }

        return $u;
    }

    private function empleado(array $attrs): Empleado
    {
        $e = new Empleado();
        $e->forceFill($attrs + ['status' => true])->save();

        return $e;
    }

    /** Trabajador del reloj: cuenta sin rol vinculada a su empleado. */
    private function trabajador(): array
    {
        $user = User::factory()->create();
        $empleado = $this->empleado([
            'nombres' => 'Trabajador', 'apellidos' => 'Piso',
            'documento_identidad' => '10', 'codigo_acceso' => '00000010',
            'user_id' => $user->id,
        ]);

        return [$user, $empleado];
    }

    // ── API móvil: el token por número de empleado no abre datos ajenos ─────

    public function test_token_por_numero_de_empleado_no_lee_datos_de_otros(): void
    {
        $this->trabajador();
        $otro = $this->empleado([
            'nombres' => 'Otra', 'apellidos' => 'Persona', 'documento_identidad' => '11',
            'codigo_acceso' => '00000011', 'curp' => 'XAXX010101HDFXXX01', 'salario_diario' => 950,
        ]);

        $token = $this->postJson('/api/login-empleado', ['codigo_acceso' => '10'])
            ->assertOk()->json('token');
        $h = ['Authorization' => "Bearer {$token}"];

        foreach ([
            '/api/dashboard/resumen',
            '/api/empleados',
            "/api/empleados/{$otro->id}",
            "/api/empleados/{$otro->id}/marcajes",
            '/api/asistencia/bitacora',
            '/api/asistencia/nomina',
            '/api/accesos',
        ] as $ruta) {
            $this->getJson($ruta, $h)->assertForbidden();
        }

        $this->postJson('/api/reloj-checador/buscar', ['query' => '11'], $h)->assertForbidden();
    }

    public function test_el_trabajador_conserva_su_autoservicio(): void
    {
        [$user] = $this->trabajador();
        $this->actingAs($user, 'sanctum');

        foreach ([
            '/api/user',
            '/api/reloj-checador/configuracion',
            '/api/reloj-checador/mi-empleado',
            '/api/reloj-checador/mi-historial',
            '/api/notifications',
        ] as $ruta) {
            $this->getJson($ruta)->assertOk();
        }
    }

    public function test_usuario_con_permisos_web_si_ve_las_pantallas_de_admin_en_la_app(): void
    {
        $u = $this->userWith(['dashboard.view', 'empleados.view', 'asistencia.view', 'visitas_temporales.view']);
        $e = $this->empleado(['nombres' => 'A', 'apellidos' => 'B', 'documento_identidad' => '77']);
        $this->actingAs($u, 'sanctum');

        foreach ([
            '/api/dashboard/resumen',
            '/api/empleados',
            "/api/empleados/{$e->id}",
            "/api/empleados/{$e->id}/marcajes",
            '/api/asistencia/bitacora',
            '/api/asistencia/nomina',
            '/api/accesos',
        ] as $ruta) {
            $this->getJson($ruta)->assertOk();
        }
    }

    public function test_bitacora_movil_con_fecha_invalida_no_da_500(): void
    {
        $this->actingAs($this->userWith(['asistencia.view']), 'sanctum');

        $this->getJson('/api/asistencia/bitacora?fecha=no-es-fecha')->assertStatus(422);
    }

    public function test_cuenta_sin_empleado_ni_permiso_no_registra_marcajes_por_la_app(): void
    {
        $e = $this->empleado(['nombres' => 'V', 'apellidos' => 'X', 'documento_identidad' => '55']);
        $this->actingAs(User::factory()->create(), 'sanctum');

        $this->postJson('/api/reloj-checador/registrar', ['empleado_id' => $e->id, 'tipo_marcaje' => 'entrada'])
            ->assertForbidden();

        $this->assertSame(0, AsistenciaMarcaje::count());
    }

    public function test_app_no_duplica_un_marcaje_enviado_dos_veces(): void
    {
        [$user, $empleado] = $this->trabajador();
        $this->actingAs($user, 'sanctum');
        $payload = ['empleado_id' => $empleado->id, 'tipo_marcaje' => 'entrada'];

        $this->postJson('/api/reloj-checador/registrar', $payload)->assertOk();
        $this->postJson('/api/reloj-checador/registrar', $payload)->assertOk()->assertJson(['success' => true]);

        $this->assertSame(1, AsistenciaMarcaje::where('empleado_id', $empleado->id)->count());
    }

    public function test_app_no_guarda_en_disco_bytes_que_no_son_una_imagen(): void
    {
        Storage::fake('public');
        [$user, $empleado] = $this->trabajador();
        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/reloj-checador/registrar', [
            'empleado_id' => $empleado->id,
            'tipo_marcaje' => 'entrada',
            'fotografia_base64' => base64_encode('<?php echo "pwned"; ?>'),
        ])->assertOk();

        $this->assertSame([], Storage::disk('public')->allFiles('marcajes'));
        $this->assertNull(AsistenciaMarcaje::first()->fotografia_path);
    }

    public function test_los_tokens_de_la_app_caducan(): void
    {
        $this->assertNotNull(config('sanctum.expiration'));
        $this->assertGreaterThan(0, (int) config('sanctum.expiration'));
    }

    public function test_cuenta_desactivada_pierde_el_acceso_con_su_token(): void
    {
        [$user] = $this->trabajador();
        $token = $user->createToken('movil_app')->plainTextToken;
        $user->update(['status' => 'inactivo']);

        $this->getJson('/api/user', ['Authorization' => "Bearer {$token}"])->assertUnauthorized();
    }

    public function test_login_de_la_app_tiene_limite_de_intentos_por_minuto(): void
    {
        $u = User::factory()->create(['email' => 'limite@example.com']);
        ConfiguracionSox::current(null)->update(['max_failed_attempts' => 10]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', ['email' => 'limite@example.com', 'password' => 'mala'])->assertStatus(401);
        }

        $this->postJson('/api/login', ['email' => 'limite@example.com', 'password' => 'mala'])->assertStatus(429);
    }

    // ── Usuarios: users.edit no escala privilegios ───────────────────────────

    public function test_users_edit_no_puede_cambiar_la_contrasena_del_super_admin(): void
    {
        Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
        $super = User::factory()->create(['email' => 'root@example.com']);
        $super->assignRole('super-admin');
        $hashAntes = $super->password;

        $operador = $this->userWith(['users.edit']);

        // Sin el campo roles: así no lo frenaba la guarda que impide asignar super-admin.
        $this->actingAs($operador)->put("/admin/usuarios/{$super->id}", [
            'name' => $super->name, 'email' => 'root@example.com', 'status' => 'activo',
            'password' => self::STRONG,
        ])->assertForbidden();

        $this->assertSame($hashAntes, $super->fresh()->password);

        $this->actingAs($operador)->patch("/admin/usuarios/{$super->id}/toggle-status")->assertForbidden();
        $this->assertSame('activo', $super->fresh()->status);
    }

    public function test_users_edit_no_puede_otorgar_un_rol_con_permisos_que_no_tiene(): void
    {
        $admin = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->syncPermissions([$this->perm('users.edit'), $this->perm('integrations.edit'), $this->perm('monitoreo.view')]);
        $operador = $this->userWith(['users.edit']);

        $this->actingAs($operador)->put("/admin/usuarios/{$operador->id}", [
            'name' => $operador->name, 'email' => $operador->email, 'status' => 'activo', 'roles' => ['admin'],
        ])->assertSessionHasErrors('roles');

        $this->assertFalse($operador->fresh()->hasRole('admin'));
    }

    public function test_quien_tiene_los_permisos_de_un_rol_si_puede_otorgarlo(): void
    {
        $viewer = Role::create(['name' => 'viewer', 'guard_name' => 'web']);
        $viewer->syncPermissions([$this->perm('empleados.view')]);
        $admin = $this->userWith(['users.edit', 'empleados.view']);
        $target = User::factory()->create();

        $this->actingAs($admin)->put("/admin/usuarios/{$target->id}", [
            'name' => $target->name, 'email' => $target->email, 'status' => 'activo', 'roles' => ['viewer'],
        ])->assertSessionHasNoErrors();

        $this->assertTrue($target->fresh()->hasRole('viewer'));
    }

    public function test_no_se_asigna_un_rol_por_id_saltando_las_guardas(): void
    {
        // Spatie resuelve un entero como id de rol: roles: [1] (JSON, como
        // envía Inertia) asignaba super-admin sin pasar por la guarda de nombres.
        $super = Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
        $operador = $this->userWith(['users.edit']);

        $this->actingAs($operador)->putJson("/admin/usuarios/{$operador->id}", [
            'name' => $operador->name, 'email' => $operador->email, 'status' => 'activo', 'roles' => [$super->id],
        ])->assertStatus(422);

        $this->assertFalse($operador->fresh()->isSuperAdmin());
    }

    public function test_users_edit_no_puede_reconfigurar_el_sso_corporativo(): void
    {
        $operador = $this->userWith(['users.view', 'users.edit']);
        $payload = [
            'min_password_length' => 15, 'password_history_limit' => 8, 'password_expires_days' => 90,
            'max_failed_attempts' => 5, 'lockout_minutes' => 15,
            'sso_azure_enabled' => true, 'azure_tenant_id' => 'tenant-del-atacante', 'azure_client_id' => 'cliente-del-atacante',
        ];

        $this->actingAs($operador)->put('/admin/seguridad/sox/settings', $payload)->assertSessionHasErrors();

        $cfg = ConfiguracionSox::current(null)->fresh();
        $this->assertFalse((bool) $cfg->sso_azure_enabled);
        $this->assertNull($cfg->azure_tenant_id);
    }

    public function test_users_edit_puede_seguir_ajustando_la_politica_de_contrasenas(): void
    {
        $operador = $this->userWith(['users.view', 'users.edit']);

        $this->actingAs($operador)->put('/admin/seguridad/sox/settings', [
            'min_password_length' => 16, 'password_history_limit' => 8, 'password_expires_days' => 90,
            'max_failed_attempts' => 5, 'lockout_minutes' => 15, 'sso_azure_enabled' => false,
        ])->assertSessionHasNoErrors();

        $this->assertSame(16, (int) ConfiguracionSox::current(null)->fresh()->min_password_length);
    }

    // ── Monitoreo: ver no es borrar ──────────────────────────────────────────

    public function test_solo_ver_monitoreo_no_permite_borrar_bitacora_ni_cerrar_sesiones(): void
    {
        $viewer = $this->userWith(['monitoreo.view']);
        activity('auth')->log('evento auditable');
        DB::table('sessions')->insert(['id' => 'sesion-de-otro', 'user_id' => 999, 'payload' => '', 'last_activity' => time()]);

        $this->actingAs($viewer)->delete('/admin/monitoring/activity/clear')->assertForbidden();
        $this->actingAs($viewer)->delete('/admin/monitoring/sessions/sesion-de-otro')->assertForbidden();
        $this->actingAs($viewer)->delete('/admin/monitoring/logs/clear')->assertForbidden();
        $this->actingAs($viewer)->post('/admin/monitoring/queues/retry-all')->assertForbidden();
        $this->actingAs($viewer)->delete('/admin/monitoring/queues/clear-all')->assertForbidden();
        $this->actingAs($viewer)->post('/admin/monitoring/tasks/run', ['command' => 'artisan biotime:sync'])->assertForbidden();

        $this->assertTrue(DB::table('activity_log')->where('description', 'evento auditable')->exists());
        $this->assertTrue(DB::table('sessions')->where('id', 'sesion-de-otro')->exists());
    }

    public function test_vaciar_la_bitacora_deja_constancia_de_quien_lo_hizo(): void
    {
        $auditor = $this->userWith(['monitoreo.view', 'monitoreo.activities']);
        activity('auth')->log('evento auditable');

        $this->actingAs($auditor)->delete('/admin/monitoring/activity/clear')->assertRedirect();

        $this->assertFalse(DB::table('activity_log')->where('description', 'evento auditable')->exists());
        $this->assertTrue(DB::table('activity_log')->where('event', 'activity_log_cleared')->where('causer_id', $auditor->id)->exists());
    }

    // ── Kiosko web: registrar marcajes exige su permiso ──────────────────────

    public function test_kiosko_web_no_registra_marcajes_sin_permiso_de_kiosko(): void
    {
        $e = $this->empleado(['nombres' => 'K', 'apellidos' => 'Z', 'documento_identidad' => '66']);
        $payload = ['empleado_id' => $e->id, 'tipo_marcaje' => 'entrada'];

        $this->actingAs(User::factory()->create())->postJson('/admin/api/reloj-checador/registrar', $payload)->assertForbidden();
        $this->actingAs($this->userWith(['asistencia.view']))->postJson('/admin/api/reloj-checador/registrar', $payload)->assertForbidden();
        $this->assertSame(0, AsistenciaMarcaje::count());

        $this->actingAs($this->userWith(['asistencia.kiosko']))->postJson('/admin/api/reloj-checador/registrar', $payload)->assertOk();
        $this->assertSame(1, AsistenciaMarcaje::count());
    }

    // ── WhatsApp: el token de la empresa no viaja a quien sólo ve ────────────

    public function test_whatsapp_no_envia_el_token_de_la_empresa_a_quien_solo_ve(): void
    {
        Http::fake(['*' => Http::response(['status' => 'open', 'token' => 'TOKEN-EN-VIVO', 'qrDataUrl' => 'data:image/png;base64,QR'])]);
        $empresa = Empresa::create(['razon_social' => 'Emp WA', 'documento' => 'WA-1']);
        $empresa->forceFill(['whatsapp_api_key' => 'SECRETO-WA'])->save();

        $viewer = $this->userWith(['whatsapp.view'], ['empresa_id' => $empresa->id]);
        $this->actingAs($viewer)->get('/admin/integrations/whatsapp')
            ->assertInertia(fn (Assert $page) => $page
                ->where('whatsapp_api_key', null)
                ->where('live_status.token', null)
                ->where('live_status.qrCode', null)
                ->missing('live_status.raw'));

        $estado = $this->actingAs($viewer)->getJson('/admin/integrations/whatsapp/status')->assertOk();
        $this->assertStringNotContainsString('TOKEN-EN-VIVO', $estado->getContent());

        // Quien gestiona la integración sí lo recibe (el valor guardado, que la
        // vista sincroniza con el token vigente de la pasarela).
        $gestor = $this->userWith(['whatsapp.view', 'whatsapp.manage'], ['empresa_id' => $empresa->id]);
        $this->actingAs($gestor)->get('/admin/integrations/whatsapp')
            ->assertInertia(fn (Assert $page) => $page
                ->where('whatsapp_api_key', $empresa->fresh()->whatsapp_api_key)
                ->where('live_status.token', 'TOKEN-EN-VIVO'));
    }

    // ── WhatsApp: teléfonos que ya traen la lada (+52...) ────────────────────

    public function test_telefono_con_lada_internacional_no_se_duplica(): void
    {
        Http::fake(['*' => Http::response(['ok' => true])]);
        $empresa = Empresa::create(['razon_social' => 'Emp Tel', 'documento' => 'TEL-1']);
        $e = $this->empleado([
            'nombres' => 'Bio', 'apellidos' => 'Time', 'documento_identidad' => '12',
            'telefono' => '+529616836778', 'empresa_id' => $empresa->id,
        ]);
        $m = AsistenciaMarcaje::create(['empleado_id' => $e->id, 'empresa_id' => $empresa->id, 'tipo_marcaje' => 'descanso_fin', 'fecha_hora' => now(), 'origen' => 'kiosko']);

        app(NotificacionAsistenciaWhatsAppService::class)->notificarMarcaje($e, $m);

        Http::assertSent(fn ($request) => $request['to'] === '5219616836778');
    }
}
