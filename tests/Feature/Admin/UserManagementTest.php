<?php

namespace Tests\Feature\Admin;

use App\Models\Empresa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_access_users_index(): void
    {
        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('Super Administrador');

        $response = $this->actingAs($superAdmin)->get(route('admin.usuarios.index'));

        $response->assertStatus(200);
    }

    public function test_user_creation_associates_correct_empresa(): void
    {
        $empresa = Empresa::factory()->create();
        $adminUser = User::factory()->create([
            'empresa_id' => $empresa->id,
        ]);
        $adminUser->assignRole('Administrador');

        $userData = [
            'name' => 'Nuevo Usuario Test',
            'email' => 'testuser@example.com',
            'password' => 'Password123!',
            'sueldo_base' => '1050.50',
            'status' => 'activo',
            'empresa_id' => $empresa->id,
        ];

        $response = $this->actingAs($adminUser)->post(route('admin.usuarios.store'), $userData);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'email' => 'testuser@example.com',
            'empresa_id' => $empresa->id,
            'sueldo_base' => '1050.50',
        ]);
    }
}
