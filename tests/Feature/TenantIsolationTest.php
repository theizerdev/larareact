<?php

namespace Tests\Feature;

use App\Models\Departamento;
use App\Models\DiaFestivo;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\TipoServicio;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Separación por empresa: lo que un usuario de una empresa NO puede hacer con la
 * otra, y lo que cada quien sí debe seguir pudiendo hacer.
 *
 * Mismo reparto de permisos que producción: super-admin todo, admin todo menos
 * roles, operador sólo dashboard y usuarios, viewer sólo lectura.
 */
class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $innovacion;

    private Empresa $driscolls;

    private Sucursal $sucI;

    private Sucursal $sucI2;

    private Sucursal $sucD;

    /** Quien "registra" los departamentos de prueba (user_id es obligatorio). */
    private User $creador;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);
        $todos = Permission::pluck('name');
        Role::findOrCreate('super-admin', 'web')->syncPermissions($todos->all());
        Role::findOrCreate('admin', 'web')->syncPermissions($todos->reject(fn ($p) => str_starts_with($p, 'roles.'))->all());
        Role::findOrCreate('operador', 'web')->syncPermissions(['dashboard.view', 'users.view', 'users.edit']);
        Role::findOrCreate('viewer', 'web')->syncPermissions($todos->filter(fn ($p) => str_ends_with($p, '.view'))->all());
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->innovacion = Empresa::create(['razon_social' => 'Innovación', 'documento' => 'INN-1', 'status' => true]);
        $this->driscolls = Empresa::create(['razon_social' => "Driscoll's", 'documento' => 'DRI-1', 'status' => true]);
        $this->sucI = Sucursal::create(['empresa_id' => $this->innovacion->id, 'nombre' => 'Occidente', 'status' => true]);
        $this->sucI2 = Sucursal::create(['empresa_id' => $this->innovacion->id, 'nombre' => 'Sureste', 'status' => true]);
        $this->sucD = Sucursal::create(['empresa_id' => $this->driscolls->id, 'nombre' => 'Cooler', 'status' => true]);
        $this->creador = User::factory()->create(['empresa_id' => $this->innovacion->id, 'sucursal_id' => $this->sucI->id]);
    }

    private function usuario(string $rol, ?Empresa $e = null, ?Sucursal $s = null, array $extra = []): User
    {
        $u = User::factory()->create(['empresa_id' => $e?->id, 'sucursal_id' => $s?->id] + $extra);
        $u->assignRole($rol);

        return $u;
    }

    private function adminI(): User
    {
        return $this->usuario('admin', $this->innovacion, $this->sucI);
    }

    private function superadmin(): User
    {
        // En producción el superadmin pertenece a Innovación.
        return $this->usuario('super-admin', $this->innovacion, $this->sucI);
    }

    private function departamento(Empresa $e, Sucursal $s, string $nombre = 'Empaque'): int
    {
        return DB::table('departamentos')->insertGetId([
            'nombre' => $nombre, 'empresa_id' => $e->id, 'sucursal_id' => $s->id,
            'user_id' => $this->creador->id, 'status' => 1, 'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    // ── Acceso: quién entra ──────────────────────────────────────────────

    public function test_user_without_company_is_sent_to_login(): void
    {
        $u = $this->usuario('admin');

        $this->actingAs($u)->get('/dashboard')->assertRedirect('/login')
            ->assertSessionHas('status', __('Your user has no company assigned. Contact your administrator.'));
        $this->assertGuest();
    }

    public function test_a_user_without_company_with_a_real_session_is_told_why(): void
    {
        // Como en el navegador: el usuario viene de la sesión (no de actingAs). El scope lo
        // oculta de esa búsqueda, y antes quedaba fuera del panel sin ningún aviso.
        $u = $this->usuario('admin');

        $this->withSession([Auth::guard('web')->getName() => $u->id])->get('/dashboard')
            ->assertRedirect('/login')
            ->assertSessionHas('status', __('Your user has no company assigned. Contact your administrator.'));
    }

    public function test_inactive_and_suspended_users_are_sent_to_login(): void
    {
        foreach (['inactivo', 'suspendido'] as $status) {
            $u = $this->usuario('admin', $this->innovacion, $this->sucI, ['status' => $status]);

            $this->actingAs($u)->get('/dashboard')->assertRedirect('/login');
            $this->assertGuest();
        }
    }

    public function test_user_of_an_inactive_company_is_sent_to_login_but_the_other_company_keeps_working(): void
    {
        $this->driscolls->update(['status' => false]);
        $hugo = $this->usuario('admin', $this->driscolls, $this->sucD);
        $this->actingAs($hugo)->get('/dashboard')->assertRedirect('/login');
        $this->assertGuest();

        $this->actingAs($this->adminI())->get('/dashboard')->assertOk();
    }

    public function test_public_registration_is_disabled(): void
    {
        $this->get('/register')->assertNotFound();
        $this->post('/register', ['name' => 'X', 'email' => 'x@x.test', 'password' => 'Password-123', 'password_confirmation' => 'Password-123'])->assertNotFound();
        $this->assertDatabaseMissing('users', ['email' => 'x@x.test']);
    }

    // ── El filtro por empresa y sucursal (trait Multitenantable) ─────────

    public function test_a_user_only_sees_records_of_their_company_and_branch(): void
    {
        $this->departamento($this->innovacion, $this->sucI);
        $this->departamento($this->innovacion, $this->sucI2);
        $this->departamento($this->driscolls, $this->sucD);

        $this->actingAs($this->adminI());
        $this->assertSame(1, Departamento::count());
        $this->assertSame([$this->sucI->id], Departamento::pluck('sucursal_id')->all());
        $this->assertSame([$this->innovacion->id], Empresa::pluck('id')->all());
        $this->assertSame([$this->sucI->id], Sucursal::pluck('id')->all());
    }

    public function test_company_wide_catalogs_ignore_the_branch_but_not_the_company(): void
    {
        foreach ([[$this->innovacion, $this->sucI], [$this->innovacion, $this->sucI2], [$this->driscolls, $this->sucD]] as [$e, $s]) {
            DB::table('tipo_servicios')->insert(['nombre' => "TS {$e->id}-{$s->id}", 'empresa_id' => $e->id, 'sucursal_id' => $s->id, 'status' => 1, 'created_at' => now(), 'updated_at' => now()]);
        }

        $this->actingAs($this->adminI());
        $this->assertSame(2, TipoServicio::count(), 've los de las dos sucursales de su empresa, no los de la otra empresa');
    }

    public function test_new_records_inherit_the_company_and_branch_of_the_user(): void
    {
        $this->actingAs($this->adminI());

        $ts = TipoServicio::create(['nombre' => 'Nuevo', 'status' => true]);

        $this->assertSame($this->innovacion->id, $ts->empresa_id);
        $this->assertSame($this->sucI->id, $ts->sucursal_id);
    }

    public function test_a_branch_of_another_company_is_never_assigned_to_a_new_record(): void
    {
        // dato inconsistente: usuario de Innovación apuntando a una sucursal de Driscoll's
        $u = $this->usuario('admin', $this->innovacion, $this->sucD);
        $this->actingAs($u);

        $festivo = DiaFestivo::create(['fecha' => '2026-12-25', 'descripcion' => 'Navidad']);

        $this->assertSame($this->innovacion->id, $festivo->empresa_id);
        $this->assertNull($festivo->sucursal_id);
    }

    public function test_a_normal_user_without_company_sees_nothing(): void
    {
        $this->departamento($this->innovacion, $this->sucI);
        $this->actingAs($this->usuario('operador'));

        $this->assertSame(0, Departamento::count());
        $this->assertSame(0, Empresa::count());
        $this->assertSame(0, User::count());
    }

    // ── Acceso cruzado por URL ───────────────────────────────────────────

    public function test_records_of_the_other_company_are_not_found_and_stay_untouched(): void
    {
        $depD = $this->departamento($this->driscolls, $this->sucD);
        $hugo = $this->usuario('admin', $this->driscolls, $this->sucD);
        $admin = $this->adminI();

        $ataques = [
            ['put', "/admin/departamentos/{$depD}"],
            ['delete', "/admin/departamentos/{$depD}"],
            ['put', "/admin/sucursales/{$this->sucD->id}"],
            ['delete', "/admin/sucursales/{$this->sucD->id}"],
            ['patch', "/admin/sucursales/{$this->sucD->id}/toggle-status"],
            ['put', "/admin/usuarios/{$hugo->id}"],
            ['delete', "/admin/usuarios/{$hugo->id}"],
            ['patch', "/admin/usuarios/{$hugo->id}/toggle-status"],
            ['put', "/admin/empresas/{$this->driscolls->id}"],
        ];
        foreach ($ataques as [$metodo, $url]) {
            $this->actingAs($admin)->{$metodo}($url, ['name' => 'X'])->assertNotFound();
        }

        $this->assertDatabaseHas('departamentos', ['id' => $depD, 'empresa_id' => $this->driscolls->id]);
        $this->assertDatabaseHas('sucursales', ['id' => $this->sucD->id, 'empresa_id' => $this->driscolls->id, 'status' => 1]);
        $this->assertDatabaseHas('users', ['id' => $hugo->id, 'status' => 'activo']);
        $this->assertSame("Driscoll's", Empresa::withoutTenant()->find($this->driscolls->id)->razon_social);
    }

    public function test_a_user_in_another_branch_of_the_same_company_cannot_touch_the_record(): void
    {
        $dep = $this->departamento($this->innovacion, $this->sucI2);

        $this->actingAs($this->adminI())->delete("/admin/departamentos/{$dep}")->assertNotFound();
        $this->assertDatabaseHas('departamentos', ['id' => $dep]);
    }

    // ── Escrituras cruzadas ──────────────────────────────────────────────

    public function test_an_admin_cannot_create_or_move_a_branch_into_another_company(): void
    {
        $admin = $this->adminI();

        $this->actingAs($admin)->post('/admin/sucursales', ['empresa_id' => $this->driscolls->id, 'nombre' => 'Infiltrada', 'status' => true])
            ->assertSessionHasErrors('empresa_id');
        $this->assertDatabaseMissing('sucursales', ['nombre' => 'Infiltrada']);

        $this->actingAs($admin)->put("/admin/sucursales/{$this->sucI->id}", ['empresa_id' => $this->driscolls->id, 'nombre' => 'Occidente', 'status' => true])
            ->assertSessionHasErrors('empresa_id');
        $this->assertSame($this->innovacion->id, Sucursal::withoutTenant()->find($this->sucI->id)->empresa_id);

        $this->actingAs($admin)->post('/admin/sucursales', ['empresa_id' => $this->innovacion->id, 'nombre' => 'Legítima', 'status' => true])
            ->assertSessionHasNoErrors();
        $this->assertDatabaseHas('sucursales', ['nombre' => 'Legítima', 'empresa_id' => $this->innovacion->id]);
    }

    public function test_an_admin_cannot_create_users_in_another_company(): void
    {
        $this->actingAs($this->adminI())->post('/admin/usuarios', [
            'name' => 'Intruso', 'email' => 'intruso@x.test', 'password' => 'Password-123', 'status' => 'activo',
            'empresa_id' => $this->driscolls->id, 'sucursal_id' => $this->sucD->id, 'roles' => ['admin'],
        ])->assertSessionHasErrors('empresa_id');

        $this->assertDatabaseMissing('users', ['email' => 'intruso@x.test']);
    }

    public function test_a_new_user_created_by_an_admin_lands_in_the_admins_company_and_branch(): void
    {
        $this->actingAs($this->adminI())->post('/admin/usuarios', [
            'name' => 'Nuevo', 'email' => 'nuevo@x.test', 'password' => 'Password-123', 'status' => 'activo', 'roles' => ['operador'],
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('users', ['email' => 'nuevo@x.test', 'empresa_id' => $this->innovacion->id, 'sucursal_id' => $this->sucI->id]);
    }

    public function test_an_admin_cannot_deactivate_their_own_company(): void
    {
        $this->actingAs($this->adminI())->put("/admin/empresas/{$this->innovacion->id}", [
            'razon_social' => 'Innovación', 'documento' => 'INN-1', 'status' => false,
        ]);
        $this->assertTrue((bool) Empresa::withoutTenant()->find($this->innovacion->id)->status);

        $this->actingAs($this->superadmin())->patch("/admin/empresas/{$this->driscolls->id}/toggle-status");
        $this->assertFalse((bool) Empresa::withoutTenant()->find($this->driscolls->id)->status);
    }

    // ── El superadmin y la jerarquía de usuarios ─────────────────────────

    public function test_an_admin_cannot_see_or_touch_the_superadmin(): void
    {
        $sa = $this->superadmin();
        $admin = $this->adminI();
        $correo = $sa->email;

        $this->actingAs($admin)->put("/admin/usuarios/{$sa->id}", ['name' => 'PWNED', 'email' => 'pwn@x.test', 'status' => 'activo', 'password' => 'Hacked-12345'])->assertForbidden();
        $this->actingAs($admin)->put("/admin/usuarios/{$sa->id}", ['name' => $sa->name, 'email' => $correo, 'status' => 'activo', 'roles' => ['admin']])->assertForbidden();
        $this->actingAs($admin)->patch("/admin/usuarios/{$sa->id}/toggle-status")->assertForbidden();
        $this->actingAs($admin)->delete("/admin/usuarios/{$sa->id}")->assertForbidden();

        $fresh = User::withoutTenant()->find($sa->id);
        $this->assertSame($correo, $fresh->email);
        $this->assertSame('activo', $fresh->status);
        $this->assertTrue($fresh->hasRole('super-admin'));

        $ids = collect($this->actingAs($admin)->get('/admin/usuarios?perPage=100')->viewData('page')['props']['users']['data'])->pluck('id');
        $this->assertFalse($ids->contains($sa->id), 'el superadmin no aparece en la lista de un admin');
        $this->assertTrue($ids->contains($admin->id));
    }

    public function test_an_admin_cannot_assign_the_super_admin_role(): void
    {
        $this->actingAs($this->adminI())->post('/admin/usuarios', [
            'name' => 'Otro', 'email' => 'otro@x.test', 'password' => 'Password-123', 'status' => 'activo', 'roles' => ['super-admin'],
        ])->assertSessionHasErrors('roles');

        $this->assertDatabaseMissing('users', ['email' => 'otro@x.test']);
    }

    public function test_an_operator_cannot_escalate_to_admin_or_change_an_admins_password(): void
    {
        $op = $this->usuario('operador', $this->innovacion, $this->sucI);
        $admin = $this->adminI();
        $hash = $admin->password;

        $this->actingAs($op)->put("/admin/usuarios/{$op->id}", ['name' => $op->name, 'email' => $op->email, 'status' => 'activo', 'roles' => ['admin']])
            ->assertSessionHasErrors('roles');
        $this->assertFalse($op->fresh()->hasRole('admin'));

        $this->actingAs($op)->put("/admin/usuarios/{$admin->id}", ['name' => $admin->name, 'email' => $admin->email, 'status' => 'activo', 'password' => 'Hacked-12345'])->assertForbidden();
        $this->assertSame($hash, $admin->fresh()->password);
    }

    public function test_an_admin_can_still_manage_the_users_of_their_company(): void
    {
        $admin = $this->adminI();
        $op = $this->usuario('operador', $this->innovacion, $this->sucI);
        $par = $this->adminI();

        $this->actingAs($admin)->put("/admin/usuarios/{$op->id}", ['name' => 'Renombrado', 'email' => $op->email, 'status' => 'activo', 'roles' => ['viewer']])->assertSessionHasNoErrors();
        $this->assertSame('Renombrado', $op->fresh()->name);
        $this->assertTrue($op->fresh()->hasRole('viewer'));

        $this->actingAs($admin)->put("/admin/usuarios/{$par->id}", ['name' => 'Otro admin', 'email' => $par->email, 'status' => 'activo', 'roles' => ['admin']])->assertSessionHasNoErrors();
        $this->assertSame('Otro admin', $par->fresh()->name);

        $this->actingAs($admin)->patch("/admin/usuarios/{$op->id}/toggle-status");
        $this->assertSame('inactivo', $op->fresh()->status);

        $this->actingAs($admin)->delete("/admin/usuarios/{$op->id}");
        $this->assertDatabaseMissing('users', ['id' => $op->id]);
    }

    public function test_nobody_can_deactivate_or_delete_their_own_user(): void
    {
        foreach ([$this->adminI(), $this->superadmin()] as $u) {
            $this->actingAs($u)->patch("/admin/usuarios/{$u->id}/toggle-status");
            $this->actingAs($u)->put("/admin/usuarios/{$u->id}", ['name' => $u->name, 'email' => $u->email, 'status' => 'inactivo', 'roles' => $u->getRoleNames()->all()]);
            $this->actingAs($u)->delete("/admin/usuarios/{$u->id}");

            $this->assertDatabaseHas('users', ['id' => $u->id, 'status' => 'activo']);
        }
    }

    public function test_the_superadmin_keeps_all_their_powers(): void
    {
        $sa = $this->superadmin();
        $admin = $this->adminI();

        $this->actingAs($sa)->post('/admin/sucursales', ['empresa_id' => $this->driscolls->id, 'nombre' => 'Creada por SA', 'status' => true])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('sucursales', ['nombre' => 'Creada por SA', 'empresa_id' => $this->driscolls->id]);

        $this->actingAs($sa)->put("/admin/usuarios/{$admin->id}", ['name' => 'Editado por SA', 'email' => $admin->email, 'status' => 'activo', 'roles' => ['admin']])->assertSessionHasNoErrors();
        $this->assertSame('Editado por SA', $admin->fresh()->name);

        $this->actingAs($sa)->post('/admin/usuarios', [
            'name' => 'Otro SA', 'email' => 'otrosa@x.test', 'password' => 'Password-123', 'status' => 'activo',
            'empresa_id' => $this->driscolls->id, 'sucursal_id' => $this->sucD->id, 'roles' => ['super-admin'],
        ])->assertSessionHasNoErrors();
        $this->assertTrue(User::withoutTenant()->where('email', 'otrosa@x.test')->first()->hasRole('super-admin'));

        $ids = collect($this->actingAs($sa)->get('/admin/usuarios?perPage=100')->viewData('page')['props']['users']['data'])->pluck('id');
        $this->assertTrue($ids->contains($sa->id) && $ids->contains($admin->id));
    }

    // ── Catálogos y módulos de toda la plataforma ────────────────────────

    public function test_countries_are_only_editable_by_the_superadmin(): void
    {
        $pais = DB::table('pais')->insertGetId(['nombre' => 'México', 'codigo_iso2' => 'MX', 'codigo_iso3' => 'MEX', 'codigo_telefonico' => '+52', 'activo' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $payload = ['nombre' => 'Editado', 'codigo_iso2' => 'MX', 'codigo_iso3' => 'MEX', 'codigo_telefonico' => '+52', 'activo' => true];

        $this->actingAs($this->adminI())->put("/admin/paises/{$pais}", $payload)->assertForbidden();
        $this->actingAs($this->adminI())->post('/admin/paises', $payload)->assertForbidden();
        $this->assertDatabaseHas('pais', ['id' => $pais, 'nombre' => 'México']);
        $this->actingAs($this->adminI())->get('/admin/paises')->assertOk();   // verlos sigue permitido

        $this->actingAs($this->superadmin())->put("/admin/paises/{$pais}", $payload)->assertSessionHasNoErrors();
        $this->assertDatabaseHas('pais', ['id' => $pais, 'nombre' => 'Editado']);
    }

    public function test_platform_monitoring_is_only_for_the_superadmin(): void
    {
        $this->actingAs($this->adminI())->get('/admin/monitoring/activity')->assertForbidden();
        $this->actingAs($this->adminI())->delete('/admin/monitoring/activity/clear')->assertForbidden();
        $this->actingAs($this->superadmin())->get('/admin/monitoring/activity')->assertOk();
    }

    public function test_admins_and_viewers_do_not_get_platform_permissions_in_the_menu(): void
    {
        $perms = $this->actingAs($this->adminI())->get('/dashboard')->viewData('page')['props']['auth']['user']['permissions'];

        foreach (['paises.create', 'paises.edit', 'paises.delete'] as $p) {
            $this->assertNotContains($p, $perms);
        }
        $this->assertEmpty(array_filter($perms, fn ($n) => str_starts_with($n, 'monitoreo.')));
        $this->assertContains('paises.view', $perms);
    }

    public function test_viewers_can_read_but_not_write(): void
    {
        $viewer = $this->usuario('viewer', $this->innovacion, $this->sucI);

        $this->actingAs($viewer)->get('/admin/empleados')->assertOk();
        $this->actingAs($viewer)->post('/admin/sucursales', ['empresa_id' => $this->innovacion->id, 'nombre' => 'X'])->assertForbidden();
    }

    // ── Selector "Ver como empresa" del superadmin ───────────────────────

    public function test_the_superadmin_selector_scopes_the_view_and_never_saves_the_borrowed_company(): void
    {
        $sa = $this->superadmin();
        $this->departamento($this->innovacion, $this->sucI);
        $this->departamento($this->driscolls, $this->sucD);

        $this->actingAs($sa);
        $this->assertSame(2, Departamento::count(), '"Todas" ve las dos empresas');

        $this->withSession(['empresa_activa_id' => $this->driscolls->id])->get('/dashboard')->assertOk();
        $this->assertSame([$this->driscolls->id], Departamento::pluck('empresa_id')->unique()->values()->all());
        $this->assertSame($this->driscolls->id, $sa->empresa_id, 'prestada en memoria');

        $sa->name = 'Cambio de nombre';
        $sa->save();
        $real = User::withoutTenant()->find($sa->id);
        $this->assertSame($this->innovacion->id, $real->empresa_id, 'la empresa guardada no cambia');
        $this->assertSame($this->sucI->id, $real->sucursal_id);
    }

    public function test_only_the_superadmin_can_use_the_selector_and_bad_values_do_not_break_it(): void
    {
        $this->actingAs($this->adminI())->post('/empresa-activa', ['empresa_id' => $this->driscolls->id])->assertForbidden();

        foreach ([99999, 'abc', [1, 2], '1; DROP TABLE empresas', -1, 0, ''] as $valor) {
            $this->actingAs($this->superadmin())->post('/empresa-activa', ['empresa_id' => $valor]);
            $this->assertLessThan(500, $this->actingAs($this->superadmin())->post('/empresa-activa', ['empresa_id' => $valor])->getStatusCode());
        }
        $this->assertTrue(\Schema::hasTable('empresas'));

        // una empresa que ya no existe en la sesión no revienta nada
        $this->actingAs($this->superadmin())->withSession(['empresa_activa_id' => 12345])->get('/dashboard')->assertOk();
    }
}
