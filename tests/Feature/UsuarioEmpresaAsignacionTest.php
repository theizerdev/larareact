<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Un usuario sin empresa_id ve todas las empresas, así que dejar la empresa
 * vacía al editar no puede ser la puerta para que un admin de empresa vuelva
 * global a otro usuario.
 */
class UsuarioEmpresaAsignacionTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    private Empresa $otraEmpresa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create(['razon_social' => 'Frigorífico de Prueba', 'documento' => 'USR-EMP-1']);
        $this->otraEmpresa = Empresa::create(['razon_social' => 'Otra Empresa', 'documento' => 'USR-EMP-2']);

        Permission::findOrCreate('users.edit', 'web');
        Role::findOrCreate('super-admin', 'web');
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }

    public function test_admin_de_empresa_no_puede_dejar_sin_empresa_a_un_usuario(): void
    {
        $objetivo = User::factory()->create(['empresa_id' => $this->empresa->id]);

        $this->actingAs($this->adminDeEmpresa())
            ->put("/admin/usuarios/{$objetivo->id}", $this->datos($objetivo, ['empresa_id' => '']))
            ->assertSessionHasNoErrors();

        $this->assertSame($this->empresa->id, $objetivo->fresh()->empresa_id);
    }

    public function test_admin_de_empresa_no_puede_mover_un_usuario_a_otra_empresa(): void
    {
        $objetivo = User::factory()->create(['empresa_id' => $this->empresa->id]);

        $this->actingAs($this->adminDeEmpresa())
            ->put("/admin/usuarios/{$objetivo->id}", $this->datos($objetivo, ['empresa_id' => $this->otraEmpresa->id]))
            ->assertSessionHasErrors('empresa_id');

        $this->assertSame($this->empresa->id, $objetivo->fresh()->empresa_id);
    }

    public function test_super_admin_si_puede_dejar_un_usuario_global(): void
    {
        $objetivo = User::factory()->create(['empresa_id' => $this->empresa->id]);
        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super-admin');
        $superAdmin->givePermissionTo('users.edit');

        $this->actingAs($superAdmin)
            ->put("/admin/usuarios/{$objetivo->id}", $this->datos($objetivo, ['empresa_id' => '']))
            ->assertSessionHasNoErrors();

        $this->assertNull($objetivo->fresh()->empresa_id);
    }

    private function adminDeEmpresa(): User
    {
        $admin = User::factory()->create(['empresa_id' => $this->empresa->id]);
        $admin->givePermissionTo('users.edit');

        return $admin;
    }

    private function datos(User $usuario, array $cambios): array
    {
        return array_merge([
            'name' => $usuario->name,
            'email' => $usuario->email,
            'status' => 'activo',
        ], $cambios);
    }
}
