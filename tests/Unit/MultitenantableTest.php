<?php

namespace Tests\Unit;

use App\Models\Empresa;
use App\Models\Sucursal;
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
        $empresa = Empresa::create(['razon_social' => 'Clínica Demo A', 'documento' => 'J-12345678-0', 'status' => 1]);
        $sucursal = Sucursal::create(['empresa_id' => $empresa->id, 'nombre' => 'Sucursal Principal', 'status' => 1]);

        $role = Role::firstOrCreate(['name' => 'operador', 'guard_name' => 'web']);
        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
        ]);
        $user->assignRole($role);

        $this->actingAs($user);

        // Debería obtener al usuario autenticado sin causar bucle recursivo
        $fetchedUser = auth()->user();
        $this->assertNotNull($fetchedUser);
        $this->assertEquals($user->id, $fetchedUser->id);
    }

    public function test_empresa_query_does_not_attempt_sucursal_id_filter()
    {
        $empresa = Empresa::create(['razon_social' => 'Clínica Demo B', 'documento' => 'J-87654321-0', 'status' => 1]);
        $sucursal = Sucursal::create(['empresa_id' => $empresa->id, 'nombre' => 'Sucursal Norte', 'status' => 1]);

        $role = Role::firstOrCreate(['name' => 'operador', 'guard_name' => 'web']);
        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
        ]);
        $user->assignRole($role);

        $this->actingAs($user);

        $empresaQuerySql = Empresa::toRawSql();
        $this->assertStringNotContainsString('sucursal_id', $empresaQuerySql);
    }
}
