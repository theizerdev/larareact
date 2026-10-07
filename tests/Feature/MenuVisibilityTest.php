<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\User;
use App\Services\MenuVisibilityService;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Visibilidad del menú en dos niveles: empresa (lo contratado) y rol (segmentación).
 */
class MenuVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $evolutel;

    private Empresa $otra;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);
        Cache::flush();
        $todos = \Spatie\Permission\Models\Permission::pluck('name')->all();
        Role::findOrCreate('super-admin', 'web')->syncPermissions($todos);
        Role::findOrCreate('admin', 'web')->syncPermissions($todos);
        Role::findOrCreate('operador', 'web')->syncPermissions(['dashboard.view']);
        Role::findOrCreate('viewer', 'web')->syncPermissions(['dashboard.view']);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->evolutel = Empresa::create(['razon_social' => 'Evolutel', 'documento' => 'EVO-1', 'status' => true]);
        $this->otra = Empresa::create(['razon_social' => 'Otra', 'documento' => 'OTR-1', 'status' => true]);
    }

    private function usuario(string $rol, Empresa $e): User
    {
        $u = User::factory()->create(['empresa_id' => $e->id]);
        $u->assignRole($rol);

        return $u->fresh();
    }

    public function test_without_settings_everything_is_visible(): void
    {
        $this->assertEquals([], MenuVisibilityService::hiddenFor($this->usuario('admin', $this->evolutel)));
    }

    public function test_company_level_hides_for_all_its_users_and_only_them(): void
    {
        MenuVisibilityService::syncEmpresa($this->evolutel->id, ['monitoring', 'integrations.catalog']);

        $this->assertEquals(['monitoring' => false, 'integrations.catalog' => false],
            MenuVisibilityService::hiddenFor($this->usuario('admin', $this->evolutel)));
        $this->assertEquals(['monitoring' => false, 'integrations.catalog' => false],
            MenuVisibilityService::hiddenFor($this->usuario('viewer', $this->evolutel)));
        $this->assertEquals([], MenuVisibilityService::hiddenFor($this->usuario('admin', $this->otra)));
    }

    public function test_role_level_hides_within_the_company_ceiling(): void
    {
        MenuVisibilityService::syncEmpresa($this->evolutel->id, ['monitoring']);
        MenuVisibilityService::syncRole(Role::findByName('viewer')->id, ['security']);

        $this->assertEquals(['monitoring' => false, 'security' => false],
            MenuVisibilityService::hiddenFor($this->usuario('viewer', $this->evolutel)));
        $this->assertEquals(['monitoring' => false],
            MenuVisibilityService::hiddenFor($this->usuario('admin', $this->evolutel)));
        // El rol aplica igual en otra empresa
        $this->assertEquals(['security' => false],
            MenuVisibilityService::hiddenFor($this->usuario('viewer', $this->otra)));
    }

    public function test_with_several_roles_only_what_all_hide_is_hidden(): void
    {
        MenuVisibilityService::syncRole(Role::findByName('viewer')->id, ['security', 'visits']);
        MenuVisibilityService::syncRole(Role::findByName('operador')->id, ['security']);

        $u = $this->usuario('viewer', $this->evolutel);
        $u->assignRole('operador');

        $this->assertEquals(['security' => false], MenuVisibilityService::hiddenFor($u->fresh()));
    }

    public function test_super_admin_is_never_hidden_anything(): void
    {
        MenuVisibilityService::syncEmpresa($this->evolutel->id, ['security', 'monitoring']);

        $this->assertEquals([], MenuVisibilityService::hiddenFor($this->usuario('super-admin', $this->evolutel)));
    }

    public function test_saving_replaces_previous_values_and_busts_the_cache(): void
    {
        MenuVisibilityService::syncEmpresa($this->evolutel->id, ['security']);
        $this->assertEquals(['security'], MenuVisibilityService::empresaKeys($this->evolutel->id));

        MenuVisibilityService::syncEmpresa($this->evolutel->id, []);
        $this->assertEquals([], MenuVisibilityService::empresaKeys($this->evolutel->id));
    }

    public function test_only_super_admin_can_open_and_save(): void
    {
        $admin = $this->usuario('admin', $this->evolutel);
        $super = $this->usuario('super-admin', $this->evolutel);

        $this->actingAs($admin)->get('/admin/seguridad/menu-visibilidad')->assertForbidden();
        $this->actingAs($admin)->put("/admin/seguridad/menu-visibilidad/empresa/{$this->otra->id}", ['hidden' => ['security']])->assertForbidden();
        $this->actingAs($admin)->put('/admin/seguridad/menu-visibilidad/rol/'.Role::findByName('viewer')->id, ['hidden' => ['security']])->assertForbidden();
        $this->assertEquals([], MenuVisibilityService::empresaKeys($this->otra->id));

        $this->actingAs($super)->get('/admin/seguridad/menu-visibilidad')->assertOk();
        $this->actingAs($super)->put("/admin/seguridad/menu-visibilidad/empresa/{$this->otra->id}", ['hidden' => ['security', 'monitoring.logs']])->assertRedirect();
        $this->assertEqualsCanonicalizing(['security', 'monitoring.logs'], MenuVisibilityService::empresaKeys($this->otra->id));
    }

    public function test_validation_and_super_role_are_protected(): void
    {
        $super = $this->usuario('super-admin', $this->evolutel);

        $this->actingAs($super)->put("/admin/seguridad/menu-visibilidad/empresa/{$this->otra->id}", ['hidden' => ['<script>']])
            ->assertSessionHasErrors('hidden.0');
        $this->actingAs($super)->put("/admin/seguridad/menu-visibilidad/empresa/{$this->otra->id}", [])
            ->assertSessionHasErrors('hidden');
        $this->actingAs($super)->put('/admin/seguridad/menu-visibilidad/rol/'.Role::findByName('super-admin')->id, ['hidden' => ['security']])
            ->assertStatus(422);
        $this->actingAs($super)->put('/admin/seguridad/menu-visibilidad/empresa/999999', ['hidden' => []])->assertNotFound();
    }

    public function test_old_url_redirects(): void
    {
        $this->actingAs($this->usuario('super-admin', $this->evolutel))
            ->get('/admin/configuracion/menu-visibilidad')->assertRedirect('/admin/seguridad/menu-visibilidad');
    }
}
