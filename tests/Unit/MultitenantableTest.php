<?php

namespace Tests\Unit;

use App\Models\Cargo;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MultitenantableTest extends TestCase
{
    use RefreshDatabase;

    /** Crea empresa + sucursal reales para satisfacer los FK de users.empresa_id / sucursal_id. */
    private function tenant(): array
    {
        $empresa = Empresa::create([
            'razon_social' => 'Tenant '.uniqid(),
            'documento' => 'T-'.uniqid(),
            'status' => true,
        ]);

        $sucursal = Sucursal::create([
            'nombre' => 'Sucursal '.uniqid(),
            'empresa_id' => $empresa->id,
            'status' => true,
        ]);

        return [$empresa, $sucursal];
    }

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
        $role = Role::firstOrCreate(['name' => 'operador', 'guard_name' => 'web']);
        [$empresa, $sucursal] = $this->tenant();
        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
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
        $role = Role::firstOrCreate(['name' => 'operador', 'guard_name' => 'web']);
        [$empresa, $sucursal] = $this->tenant();
        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
        ]);
        $user->assignRole($role);

        $this->actingAs($user);

        $empresaQuerySql = \App\Models\Empresa::toRawSql();
        $this->assertStringNotContainsString('sucursal_id', $empresaQuerySql);
    }
}

