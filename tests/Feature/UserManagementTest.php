<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    private function adminWithPermissions(array $permissions): User
    {
        $user = User::factory()->create(['status' => 'activo']);
        foreach ($permissions as $perm) {
            Permission::firstOrCreate([
                'name' => $perm,
                'guard_name' => 'web',
            ]);
        }
        $user->givePermissionTo($permissions);

        return $user;
    }

    public function test_users_index_returns_expected_props_sox_stats_and_permissions(): void
    {
        $admin = $this->adminWithPermissions(['users.view', 'users.create', 'users.edit', 'users.delete']);
        $superRole = Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
        $superUser = User::factory()->create([
            'name' => 'Carlos Mendoza',
            'status' => 'activo',
        ]);
        $superUser->assignRole($superRole);

        User::factory()->create([
            'name' => 'Ana Suspendida',
            'status' => 'suspendido',
            'locked_until' => now()->addMinutes(30),
        ]);

        $this->actingAs($admin)
            ->get('/admin/usuarios')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Usuarios/Index')
                ->has('users.data', 3)
                ->where('stats.total', 3)
                ->where('stats.activos', 2)
                ->where('stats.suspendidos', 1)
                ->where('stats.bloqueados', 1)
                ->has('soxPolicies.minLength')
                ->where('can.create', true)
                ->where('can.edit', true)
                ->where('can.delete', true)
                ->where('can.sox', true)
                ->where('can.sox_manage', true)
            );
    }

    public function test_users_index_supports_filters_and_sorting(): void
    {
        $admin = $this->adminWithPermissions(['users.view']);
        $empresa = Empresa::create([
            'razon_social' => 'Empresa Norte',
            'documento' => 'NOR123456',
            'status' => true,
        ]);
        $sucursal = Sucursal::create([
            'empresa_id' => $empresa->id,
            'nombre' => 'Planta Norte',
            'status' => true,
        ]);
        $role = Role::create(['name' => 'operador', 'guard_name' => 'web']);

        $zulu = User::factory()->create([
            'name' => 'Zulma Torres',
            'status' => 'activo',
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
        ]);
        $alfa = User::factory()->create([
            'name' => 'Alberto Gómez',
            'status' => 'activo',
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
        ]);
        $zulu->assignRole($role);
        $alfa->assignRole($role);

        User::factory()->create([
            'name' => 'Inactivo Fuera',
            'status' => 'inactivo',
        ]);

        $url = "/admin/usuarios?status=activo&role=operador&empresa_id={$empresa->id}&sortBy=name&sortDir=asc";

        $this->actingAs($admin)
            ->get($url)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Usuarios/Index')
                ->has('users.data', 2)
                ->where('users.data.0.name', 'Alberto Gómez')
                ->where('users.data.1.name', 'Zulma Torres')
            );
    }

    public function test_users_index_marks_super_admin_and_locked_flags(): void
    {
        $superRole = Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
        $perm = Permission::firstOrCreate(['name' => 'users.view', 'guard_name' => 'web']);
        $superRole->givePermissionTo($perm);

        $superUser = User::factory()->create([
            'name' => 'Laura Vega',
            'status' => 'activo',
            'locked_until' => now()->addMinutes(15),
        ]);
        $superUser->assignRole($superRole);

        $this->actingAs($superUser)
            ->get('/admin/usuarios?search=Laura')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Usuarios/Index')
                ->has('users.data', 1)
                ->where('users.data.0.is_super_admin', true)
                ->where('users.data.0.is_locked', true)
            );
    }
}
