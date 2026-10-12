<?php

namespace Tests\Unit;

use App\Models\Cargo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MultitenantableTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_is_super_admin_returns_true_for_super_admin_roles()
    {
        $superAdminRole = Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);
        $user = User::factory()->create();
        $user->assignRole($superAdminRole);

        $this->assertTrue($user->isSuperAdmin());
    }

    public function test_regular_user_is_not_super_admin()
    {
        $role = Role::firstOrCreate(['name' => 'operador', 'guard_name' => 'web']);
        $user = User::factory()->create();
        $user->assignRole($role);

        $this->assertFalse($user->isSuperAdmin());
    }

    public function test_auth_user_resolution_does_not_cause_infinite_recursion()
    {
        // Empresa/sucursal reales: con FK activas no se pueden referenciar ids inexistentes.
        \Illuminate\Support\Facades\DB::table('empresas')->insert([
            'id' => 10, 'razon_social' => 'E10', 'documento' => 'D10', 'created_at' => now(), 'updated_at' => now(),
        ]);
        \Illuminate\Support\Facades\DB::table('sucursales')->insert([
            'id' => 20, 'empresa_id' => 10, 'nombre' => 'S20', 'created_at' => now(), 'updated_at' => now(),
        ]);

        $role = Role::firstOrCreate(['name' => 'operador', 'guard_name' => 'web']);
        $user = User::factory()->create([
            'empresa_id' => 10,
            'sucursal_id' => 20,
        ]);
        $user->assignRole($role);

        $this->actingAs($user);

        // Debería obtener al usuario autenticado sin causar bucle recursivo / stack overflow
        $fetchedUser = auth()->user();
        $this->assertNotNull($fetchedUser);
        $this->assertEquals($user->id, $fetchedUser->id);
    }

    public function test_empresa_query_does_not_attempt_sucursal_id_filter()
    {
        \Illuminate\Support\Facades\DB::table('empresas')->insert([
            'id' => 1, 'razon_social' => 'E1', 'documento' => 'D1', 'created_at' => now(), 'updated_at' => now(),
        ]);
        \Illuminate\Support\Facades\DB::table('sucursales')->insert([
            'id' => 1, 'empresa_id' => 1, 'nombre' => 'S1', 'created_at' => now(), 'updated_at' => now(),
        ]);

        $role = Role::firstOrCreate(['name' => 'operador', 'guard_name' => 'web']);
        $user = User::factory()->create([
            'empresa_id' => 1,
            'sucursal_id' => 1,
        ]);
        $user->assignRole($role);

        $this->actingAs($user);

        $empresaQuerySql = \App\Models\Empresa::toRawSql();
        $this->assertStringNotContainsString('sucursal_id', $empresaQuerySql);
    }
}

