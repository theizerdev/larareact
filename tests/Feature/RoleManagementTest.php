<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\PermissionSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RoleManagementTest extends TestCase
{
    use RefreshDatabase;

    private function adminUser(array $extraPermissions = []): User
    {
        $perms = array_unique(array_merge([
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
        ], $extraPermissions));

        $user = User::factory()->create();
        foreach ($perms as $perm) {
            Permission::firstOrCreate([
                'name' => $perm,
                'guard_name' => 'web',
            ]);
        }
        $user->givePermissionTo($perms);

        return $user;
    }

    public function test_roles_index_renders_expected_props_and_sync_status(): void
    {
        $user = $this->adminUser();
        $role = Role::create(['name' => 'Operador Planta', 'guard_name' => 'web']);
        $role->givePermissionTo('roles.view');

        $this->actingAs($user)
            ->get('/admin/roles')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Roles/Index')
                ->has('roles')
                ->has('stats.total')
                ->has('stats.permissions_total')
                ->has('stats.assigned_users')
                ->has('stats.sectors_count')
                ->has('stats.modules_count')
                ->has('groupedPermissions')
                ->has('sectorMeta')
                ->has('moduleMeta')
                ->has('syncStatus.pending_count')
                ->where('can.create', true)
                ->where('can.edit', true)
                ->where('can.delete', true)
            );
    }

    public function test_roles_index_supports_search_filter_and_sort(): void
    {
        $user = $this->adminUser();
        $withUser = Role::create(['name' => 'Supervisor Alfa', 'guard_name' => 'web']);
        $withoutUser = Role::create(['name' => 'Auditor Beta', 'guard_name' => 'web']);
        $withUser->givePermissionTo('roles.view');
        $user->assignRole($withUser);

        $this->actingAs($user)
            ->get('/admin/roles?search=Auditor&filter=without_users&sortBy=name&sortDir=asc')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Roles/Index')
                ->has('roles', 1)
                ->where('roles.0.id', $withoutUser->id)
            );
    }

    public function test_can_create_update_duplicate_and_delete_role(): void
    {
        $user = $this->adminUser();

        // Create
        $this->actingAs($user)
            ->post('/admin/roles', [
                'name' => 'Coordinador Seguridad',
                'permissions' => ['roles.view', 'roles.create'],
            ])
            ->assertRedirect();

        $created = Role::where('name', 'Coordinador Seguridad')->firstOrFail();
        $this->assertTrue($created->hasPermissionTo('roles.view'));
        $this->assertTrue($created->hasPermissionTo('roles.create'));

        // Update
        $this->actingAs($user)
            ->put("/admin/roles/{$created->id}", [
                'name' => 'Coordinador Senior',
                'permissions' => ['roles.view'],
            ])
            ->assertRedirect();

        $created->refresh();
        $this->assertSame('Coordinador Senior', $created->name);
        $this->assertFalse($created->hasPermissionTo('roles.create'));

        // Duplicate twice
        $this->actingAs($user)
            ->post("/admin/roles/{$created->id}/duplicate")
            ->assertRedirect();

        $copy1 = Role::where('name', 'Coordinador Senior (Copia)')->firstOrFail();
        $this->assertTrue($copy1->hasPermissionTo('roles.view'));

        $this->actingAs($user)
            ->post("/admin/roles/{$created->id}/duplicate")
            ->assertRedirect();

        $this->assertDatabaseHas('roles', ['name' => 'Coordinador Senior (Copia 2)']);

        // Delete
        $this->actingAs($user)
            ->delete("/admin/roles/{$copy1->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('roles', ['id' => $copy1->id]);
    }

    public function test_sync_permissions_creates_updates_syncs_super_admin_and_optionally_prunes_obsolete(): void
    {
        $user = $this->adminUser();
        $superAdmin = Role::create(['name' => 'super-admin', 'guard_name' => 'web']);

        // Permiso existente con sector antiguo y un permiso obsoleto
        Permission::firstOrCreate(
            ['name' => 'empleados.import', 'guard_name' => 'web'],
            ['slug' => 'Old slug', 'sector' => 'importacion', 'module' => 'empleados']
        );
        $obsolete = Permission::create([
            'name' => 'legacy.obsolete_perm',
            'guard_name' => 'web',
            'slug' => 'Permiso Obsoleto',
            'sector' => 'sistema',
            'module' => 'general',
        ]);
        $superAdmin->givePermissionTo($obsolete);

        // Sincronizar sin podar obsoletos
        $this->actingAs($user)
            ->post('/admin/roles/sync-permissions', [
                'sync_super_admin' => true,
                'prune_obsolete' => false,
            ])
            ->assertRedirect()
            ->assertSessionHas('notification.type', 'success');

        $this->assertDatabaseHas('permissions', [
            'name' => 'sox.view',
            'sector' => 'seguridad',
            'module' => 'sox',
        ]);
        $this->assertDatabaseHas('permissions', [
            'name' => 'empleados.import',
            'sector' => 'organizacion',
            'module' => 'empleados',
        ]);
        $this->assertDatabaseHas('permissions', ['name' => 'legacy.obsolete_perm']);
        $this->assertTrue($superAdmin->fresh()->hasPermissionTo('sox.view'));

        // Ahora podando obsoletos
        $this->actingAs($user)
            ->post('/admin/roles/sync-permissions', [
                'sync_super_admin' => true,
                'prune_obsolete' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseMissing('permissions', ['name' => 'legacy.obsolete_perm']);

        $status = app(PermissionSyncService::class)->inspect();
        $this->assertTrue($status['in_sync']);
        $this->assertSame(0, $status['pending_count']);
        $this->assertSame(0, $status['obsolete_count']);
    }

    public function test_super_admin_cannot_be_deleted_and_duplicating_super_admin_uses_safe_name(): void
    {
        $user = $this->adminUser();
        $superAdmin = Role::create(['name' => 'super-admin', 'guard_name' => 'web']);

        $this->actingAs($user)
            ->delete("/admin/roles/{$superAdmin->id}")
            ->assertSessionHasErrors('error');

        $this->assertDatabaseHas('roles', ['id' => $superAdmin->id]);

        $this->actingAs($user)
            ->post("/admin/roles/{$superAdmin->id}/duplicate")
            ->assertRedirect();

        $this->assertDatabaseHas('roles', ['name' => 'super-admin (Copia)']);
    }
}
