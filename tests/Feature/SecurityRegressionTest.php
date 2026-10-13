<?php

namespace Tests\Feature;

use App\Models\ConfiguracionSox;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Regresión de las correcciones del Baseline de Seguridad y Cumplimiento SOX 404.
 * Cada test afirma el comportamiento SEGURO; si alguno falla, volvió un defecto.
 */
class SecurityRegressionTest extends TestCase
{
    use RefreshDatabase;

    private const STRONG = 'Xk9#mP2$vL7@qR4!';

    private function perm(string $name): Permission
    {
        return Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
    }

    private function empresa(string $doc): Empresa
    {
        return Empresa::create([
            'razon_social' => "Emp $doc",
            'documento' => $doc,
            'status' => true,
        ]);
    }

    private function userWith(array $permissions = [], array $attrs = []): User
    {
        $u = User::factory()->create($attrs);
        foreach ($permissions as $p) {
            $u->givePermissionTo($this->perm($p));
        }

        return $u;
    }

    // ── Registro público ────────────────────────────────────────────────────────

    public function test_registro_publico_esta_deshabilitado_por_defecto(): void
    {
        $this->get('/register')->assertNotFound();

        $this->post('/register', [
            'name' => 'Intruso',
            'email' => 'intruso@example.com',
            'password' => self::STRONG,
            'password_confirmation' => self::STRONG,
        ])->assertNotFound();

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'intruso@example.com']);
    }

    // ── Consola SOX ─────────────────────────────────────────────────────────────

    public function test_consola_sox_exige_permiso_y_no_expone_el_secreto(): void
    {
        ConfiguracionSox::current(null)->update(['azure_client_secret' => 'TOP-SECRET-VALUE']);

        $sinPermiso = User::factory()->create();
        $this->actingAs($sinPermiso)->get('/admin/seguridad/sox')->assertForbidden();

        $admin = $this->userWith(['users.view']);
        $this->actingAs($admin)->get('/admin/seguridad/sox')->assertOk()->assertInertia(
            fn (Assert $p) => $p->where('config.azure_client_secret_configured', true)->missing('config.azure_client_secret')
        );
    }

    public function test_sox_no_permite_a_usuarios_sin_permiso_desbloquear_ni_forzar_reset(): void
    {
        $victim = User::factory()->create(['locked_until' => now()->addHour(), 'failed_login_attempts' => 5]);
        $attacker = User::factory()->create();

        $this->actingAs($attacker)->post("/admin/seguridad/sox/users/{$victim->id}/unlock")->assertForbidden();
        $this->actingAs($attacker)->post("/admin/seguridad/sox/users/{$victim->id}/force-reset")->assertForbidden();
        $this->actingAs($attacker)->put('/admin/seguridad/sox/settings', [])->assertForbidden();

        $this->assertNotNull($victim->fresh()->locked_until);
        $this->assertFalse($victim->fresh()->isPasswordExpired());
    }

    public function test_sox_actualizar_no_registra_el_secreto_y_vacio_conserva_el_actual(): void
    {
        $admin = $this->userWith(['users.edit']);
        $base = [
            'min_password_length' => 15,
            'password_history_limit' => 8,
            'password_expires_days' => 90,
            'max_failed_attempts' => 5,
            'lockout_minutes' => 15,
        ];

        $this->actingAs($admin)->put('/admin/seguridad/sox/settings', $base + ['azure_client_secret' => 'NUEVO-SECRETO'])
            ->assertSessionHasNoErrors();
        $this->assertSame('NUEVO-SECRETO', ConfiguracionSox::current(null)->azure_client_secret);
        $this->assertStringNotContainsString('NUEVO-SECRETO', (string) DB::table('activity_log')->where('event', 'sox_settings_updated')->value('properties'));

        // El formulario ya no recibe el secreto: enviarlo vacío no debe borrarlo.
        $this->actingAs($admin)->put('/admin/seguridad/sox/settings', $base + ['azure_client_secret' => ''])
            ->assertSessionHasNoErrors();
        $this->assertSame('NUEVO-SECRETO', ConfiguracionSox::current(null)->azure_client_secret);
    }

    public function test_forzar_renovacion_respeta_una_vigencia_mayor_a_100_dias(): void
    {
        ConfiguracionSox::current(null)->update(['password_expires_days' => 365]);
        $admin = $this->userWith(['users.edit']);
        $target = User::factory()->create();

        $this->actingAs($admin)->post("/admin/seguridad/sox/users/{$target->id}/force-reset")->assertRedirect();

        $this->assertTrue($target->fresh()->isPasswordExpired());
    }

    // ── Monitoreo de Tareas ─────────────────────────────────────────────────────

    public function test_ejecutar_tarea_rechaza_comandos_que_no_estan_programados(): void
    {
        $u = $this->userWith(['monitoreo.view']);

        $this->actingAs($u)->post('/admin/monitoring/tasks/run', ['command' => 'artisan about --only=environment'])->assertRedirect();

        $this->assertSame('error', session('notification.type'));
        $this->assertStringNotContainsString('Application Name', (string) session('notification.message'));
    }

    // ── Cuentas desactivadas ────────────────────────────────────────────────────

    public function test_usuario_inactivo_no_puede_iniciar_sesion(): void
    {
        $u = User::factory()->create(['email' => 'baja@example.com', 'password' => self::STRONG]);
        DB::table('users')->where('id', $u->id)->update(['status' => 'inactivo']);

        $this->post('/login', ['email' => 'baja@example.com', 'password' => self::STRONG]);

        $this->assertGuest();
    }

    public function test_usuario_activo_sigue_pudiendo_iniciar_sesion(): void
    {
        $u = User::factory()->create(['email' => 'ok@example.com', 'password' => self::STRONG]);
        DB::table('users')->where('id', $u->id)->update(['status' => 'activo']);

        $this->post('/login', ['email' => 'ok@example.com', 'password' => self::STRONG]);

        $this->assertAuthenticatedAs($u);
    }

    public function test_sesion_abierta_se_cierra_al_desactivar_al_usuario(): void
    {
        $u = $this->userWith(['dashboard.view']);
        $this->actingAs($u)->get('/dashboard')->assertOk();

        DB::table('users')->where('id', $u->id)->update(['status' => 'suspendido']);

        // Cada petición real recarga al usuario desde la BD; aquí se simula igual.
        $this->actingAs(User::find($u->id))->get('/dashboard')->assertRedirect(route('login'));
        $this->assertGuest();
    }

    // ── SSO Entra ID ────────────────────────────────────────────────────────────

    private function fakeEntra(string $mail): void
    {
        Http::fake([
            'login.microsoftonline.com/*' => Http::response(['access_token' => 'x'], 200),
            'graph.microsoft.com/*' => Http::response(['mail' => $mail, 'displayName' => 'Alguien'], 200),
        ]);
    }

    private function configureSso(): void
    {
        ConfiguracionSox::current(null)->update([
            'sso_azure_enabled' => true,
            'azure_tenant_id' => 'tenant-guid',
            'azure_client_id' => 'client-id',
            'azure_client_secret' => 'secreto',
        ]);
    }

    public function test_sso_rechaza_state_distinto_al_emitido(): void
    {
        $this->configureSso();
        User::factory()->create(['email' => 'admin@corp.com']);
        $this->fakeEntra('admin@corp.com');

        $this->withSession(['azure_sso_state' => 'ESPERADO'])->get('/auth/sso/azure/callback?code=abc&state=OTRO');

        $this->assertGuest();
        Http::assertNothingSent();
    }

    public function test_sso_sin_configurar_no_usa_el_tenant_common(): void
    {
        User::factory()->create(['email' => 'admin@corp.com']);
        $this->fakeEntra('admin@corp.com');

        $this->withSession(['azure_sso_state' => 'OK'])->get('/auth/sso/azure/callback?code=abc&state=OK');

        $this->assertGuest();
        Http::assertNothingSent();
    }

    public function test_sso_rechaza_usuario_inactivo_y_no_crea_cuentas(): void
    {
        $this->configureSso();
        $inactivo = User::factory()->create(['email' => 'baja@corp.com']);
        DB::table('users')->where('id', $inactivo->id)->update(['status' => 'inactivo']);
        $this->fakeEntra('baja@corp.com');

        $this->withSession(['azure_sso_state' => 'OK'])->get('/auth/sso/azure/callback?code=abc&state=OK');
        $this->assertGuest();

        $this->fakeEntra('desconocido@corp.com');
        $this->withSession(['azure_sso_state' => 'OK'])->get('/auth/sso/azure/callback?code=abc&state=OK');
        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'desconocido@corp.com']);
    }

    public function test_sso_configurado_permite_entrar_a_un_usuario_activo_existente(): void
    {
        $this->configureSso();
        $u = User::factory()->create(['email' => 'activo@corp.com']);
        $this->fakeEntra('activo@corp.com');

        $this->withSession(['azure_sso_state' => 'OK'])->get('/auth/sso/azure/callback?code=abc&state=OK');

        $this->assertAuthenticatedAs($u);
    }

    // ── Usuarios y roles ────────────────────────────────────────────────────────

    public function test_admin_de_tenant_no_puede_dejar_a_un_usuario_sin_empresa(): void
    {
        $e = $this->empresa('DOC-A');
        $admin = $this->userWith(['users.edit'], ['empresa_id' => $e->id]);
        $target = User::factory()->create(['empresa_id' => $e->id, 'email' => 't@example.com']);

        $this->actingAs($admin)->put("/admin/usuarios/{$target->id}", [
            'name' => 'T',
            'email' => 't@example.com',
            'status' => 'activo',
            'empresa_id' => null,
            'sucursal_id' => null,
            'roles' => [],
        ]);

        $this->assertSame($e->id, $target->fresh()->empresa_id);
    }

    public function test_no_se_puede_asignar_el_rol_super_admin_con_otra_capitalizacion(): void
    {
        Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
        $e = $this->empresa('DOC-B');
        $admin = $this->userWith(['users.edit'], ['empresa_id' => $e->id]);

        $this->actingAs($admin)->put("/admin/usuarios/{$admin->id}", [
            'name' => $admin->name,
            'email' => $admin->email,
            'status' => 'activo',
            'roles' => ['SUPER-ADMIN'],
        ])->assertSessionHasErrors('roles');

        $this->assertFalse($admin->fresh()->isSuperAdmin());
    }

    public function test_roles_create_no_permite_crear_alias_de_super_admin(): void
    {
        $u = $this->userWith(['roles.create']);

        foreach (['Super Admin', 'super_admin', 'SUPER ADMINISTRADOR', 'Super Administrador'] as $nombre) {
            $this->actingAs($u)->post('/admin/roles', ['name' => $nombre, 'permissions' => []]);
            $this->assertDatabaseMissing('roles', ['name' => $nombre]);
        }
    }

    public function test_actualizar_rol_super_admin_sin_permissions_no_lo_vacia(): void
    {
        $this->perm('x.view');
        $role = Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
        $role->syncPermissions(Permission::all());
        $antes = $role->permissions()->count();

        $u = $this->userWith(['roles.edit']);
        $this->actingAs($u)->put("/admin/roles/{$role->id}", ['name' => 'super-admin']);

        $this->assertSame($antes, $role->fresh()->permissions()->count());
    }

    public function test_empresa_no_serializa_credenciales(): void
    {
        $e = $this->empresa('DOC-F');
        $e->whatsapp_api_key = 'K1';
        $e->save();

        // Atributos adicionales en memoria para comprobar que $hidden los excluye al serializar
        $e->setAttribute('biotime_password', 'P1');
        $e->setAttribute('jaak_api_key', 'J1');
        $e->setAttribute('mapbox_access_token', 'MAP1');
        $e->setAttribute('google_maps_api_key', 'GOOG1');

        $arr = $e->toArray();

        foreach (['api_key', 'whatsapp_api_key', 'biotime_password', 'jaak_api_key', 'zapsign_api_token', 'didit_api_key', 'mapbox_access_token', 'google_maps_api_key'] as $campo) {
            $this->assertArrayNotHasKey($campo, $arr);
        }
        $this->assertSame('K1', $e->fresh()->whatsapp_api_key);
    }

    // ── Recuperación por OTP ────────────────────────────────────────────────────

    private function otpUser(): array
    {
        $pais = Pais::create(['nombre' => 'México', 'codigo_iso2' => 'MX', 'codigo_iso3' => 'MEX', 'codigo_telefonico' => '+52']);
        $user = User::factory()->create(['pais_telefono_id' => $pais->id, 'telefono' => '5551234567']);

        return [$pais, $user];
    }

    public function test_otp_no_se_escribe_en_el_log(): void
    {
        [$pais, $user] = $this->otpUser();
        Http::fake();

        $mensajes = [];
        Log::listen(function ($event) use (&$mensajes) {
            $mensajes[] = (string) $event->message;
        });

        $this->post('/forgot-password/send-otp', ['pais_telefono_id' => $pais->id, 'telefono' => '5551234567']);

        $otp = Cache::get("otp_{$user->id}");
        $this->assertNotNull($otp);
        $this->assertMatchesRegularExpression('/^\d{6}$/', $otp);
        foreach ($mensajes as $m) {
            $this->assertStringNotContainsString($otp, $m);
        }
    }

    public function test_otp_se_invalida_tras_demasiados_intentos_fallidos(): void
    {
        [$pais, $user] = $this->otpUser();
        Cache::put("otp_{$user->id}", '123456', now()->addMinutes(10));
        $datos = ['pais_telefono_id' => $pais->id, 'telefono' => '5551234567'];

        for ($i = 0; $i < 5; $i++) {
            $this->post('/forgot-password/verify-otp', $datos + ['otp' => '000000'])->assertSessionHasErrors('otp');
        }

        // Con el código correcto ya no sirve: hay que pedir uno nuevo.
        $this->post('/forgot-password/verify-otp', $datos + ['otp' => '123456'])->assertSessionHasErrors('otp');
        $this->assertNull(session('otp_verified_phone'));
        $this->assertNull(Cache::get("otp_{$user->id}"));
    }

    public function test_restablecer_con_otp_aplica_la_politica_de_contrasena(): void
    {
        [$pais, $user] = $this->otpUser();
        Http::fake();
        $datos = ['pais_telefono_id' => $pais->id, 'telefono' => '5551234567'];
        $sesion = [
            'otp_verified_phone' => '5551234567',
            'otp_verified_pais_id' => $pais->id,
            'otp_verified_at' => now()->toIso8601String(),
        ];

        // Contraseña débil (menos de 15 caracteres / sin símbolos): se rechaza.
        $this->withSession($sesion)->post('/forgot-password/reset', $datos + [
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertSessionHasErrors('password');

        // Contraseña válida: se aplica y queda registrada en historial.
        $this->withSession($sesion)->post('/forgot-password/reset', $datos + [
            'password' => self::STRONG,
            'password_confirmation' => self::STRONG,
        ])->assertRedirect(route('login'));

        $this->assertTrue(\Illuminate\Support\Facades\Hash::check(self::STRONG, $user->fresh()->password));
        $this->assertDatabaseHas('password_histories', ['user_id' => $user->id]);
    }

    public function test_verificacion_otp_caducada_no_permite_restablecer(): void
    {
        [$pais, $user] = $this->otpUser();
        $datos = ['pais_telefono_id' => $pais->id, 'telefono' => '5551234567'];

        $this->withSession([
            'otp_verified_phone' => '5551234567',
            'otp_verified_pais_id' => $pais->id,
            'otp_verified_at' => now()->subMinutes(11)->toIso8601String(),
        ])->post('/forgot-password/reset', $datos + [
            'password' => self::STRONG,
            'password_confirmation' => self::STRONG,
        ])->assertSessionHasErrors('telefono');

        $this->assertFalse(\Illuminate\Support\Facades\Hash::check(self::STRONG, $user->fresh()->password));
    }

    public function test_cabeceras_http_de_seguridad_estan_presentes(): void
    {
        $response = $this->get('/login');

        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-XSS-Protection', '1; mode=block');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
        $response->assertHeader('Content-Security-Policy', "frame-ancestors 'self'");
    }

    public function test_sox_permisos_especificos_permiten_acceso_y_gestion(): void
    {
        $this->perm('sox.view');
        $this->perm('sox.manage');

        $auditor = $this->userWith(['sox.view']);
        $this->actingAs($auditor)->get('/admin/seguridad/sox')->assertOk();

        // No puede editar configuraciones solo con sox.view
        $this->actingAs($auditor)->put('/admin/seguridad/sox/settings', [
            'min_password_length' => 16,
            'password_history_limit' => 5,
            'password_expires_days' => 90,
            'max_failed_attempts' => 5,
            'lockout_minutes' => 30,
        ])->assertForbidden();

        // Con sox.manage puede editar configuraciones
        $gestor = $this->userWith(['sox.manage']);
        $this->actingAs($gestor)->put('/admin/seguridad/sox/settings', [
            'min_password_length' => 16,
            'password_history_limit' => 5,
            'password_expires_days' => 90,
            'max_failed_attempts' => 5,
            'lockout_minutes' => 30,
        ])->assertRedirect();
    }

    public function test_comando_auditoria_sox_ejecuta_correctamente(): void
    {
        $exitCode = \Illuminate\Support\Facades\Artisan::call('sox:audit-users');
        $this->assertSame(0, $exitCode);

        $this->assertDatabaseHas('activity_log', [
            'event' => 'sox_scheduled_audit',
        ]);
    }

    public function test_login_y_logout_se_registran_en_activity_log(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt(self::STRONG),
            'status' => true,
        ]);

        // Disparar evento Login explícito y verificar bitácora
        event(new \Illuminate\Auth\Events\Login('web', $user, false));

        $this->assertDatabaseHas('activity_log', [
            'log_name' => 'auth',
            'event' => 'login',
            'causer_id' => $user->id,
        ]);

        // Disparar evento Logout explícito y verificar bitácora
        event(new \Illuminate\Auth\Events\Logout('web', $user));

        $this->assertDatabaseHas('activity_log', [
            'log_name' => 'auth',
            'event' => 'logout',
            'causer_id' => $user->id,
        ]);
    }

    public function test_monitoreo_actividades_permite_acceso_y_exportacion(): void
    {
        $this->perm('monitoreo.activities');

        $admin = $this->userWith(['monitoreo.activities']);

        $response = $this->actingAs($admin)->get('/admin/monitoring/activity');
        $response->assertOk()->assertInertia(fn ($page) => $page->component('admin/monitoring/activity/index'));

        $export = $this->actingAs($admin)->get('/admin/monitoring/activity/export');
        $export->assertOk();
        $this->assertTrue(str_contains($export->headers->get('content-type') ?? '', 'text/csv'));
    }
}
