<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class SucursalManagementTest extends TestCase
{
    use RefreshDatabase;

    private function adminUser(): User
    {
        Permission::firstOrCreate(['name' => 'sucursales.view', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'sucursales.create', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'sucursales.edit', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'sucursales.delete', 'guard_name' => 'web']);

        $empresa = Empresa::create([
            'razon_social' => 'Empresa Test',
            'documento' => 'J-12345678-0',
            'status' => true,
        ]);

        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'status' => true,
        ]);

        $user->givePermissionTo(['sucursales.view', 'sucursales.create', 'sucursales.edit', 'sucursales.delete']);

        return $user;
    }

    public function test_can_create_sucursal_with_zona_horaria_and_coordinates(): void
    {
        $user = $this->adminUser();

        $response = $this->actingAs($user)->post('/admin/sucursales', [
            'empresa_id' => $user->empresa_id,
            'nombre' => 'Sucursal Principal',
            'telefono' => '+58 212 555 1234',
            'direccion' => 'Av. Principal, Caracas',
            'latitud' => 10.4806,
            'longitud' => -66.9036,
            'zona_horaria' => 'America/Caracas',
            'status' => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('sucursales', [
            'nombre' => 'Sucursal Principal',
            'zona_horaria' => 'America/Caracas',
            'status' => true,
        ]);
    }

    public function test_can_update_sucursal_including_zona_horaria_and_status(): void
    {
        $user = $this->adminUser();

        $sucursal = Sucursal::create([
            'empresa_id' => $user->empresa_id,
            'nombre' => 'Sucursal Antigua',
            'telefono' => '123456',
            'direccion' => 'Calle 1',
            'status' => true,
        ]);

        $response = $this->actingAs($user)->put("/admin/sucursales/{$sucursal->id}", [
            'empresa_id' => $user->empresa_id,
            'nombre' => 'Sucursal Actualizada',
            'telefono' => '654321',
            'direccion' => 'Calle Nueva 2',
            'latitud' => 10.5000,
            'longitud' => -66.9100,
            'zona_horaria' => 'America/Caracas',
            'status' => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('sucursales', [
            'id' => $sucursal->id,
            'nombre' => 'Sucursal Actualizada',
            'zona_horaria' => 'America/Caracas',
        ]);
    }

    public function test_can_toggle_sucursal_status(): void
    {
        $user = $this->adminUser();

        $sucursal = Sucursal::create([
            'empresa_id' => $user->empresa_id,
            'nombre' => 'Sucursal Activa',
            'status' => true,
        ]);

        $response = $this->actingAs($user)->patch("/admin/sucursales/{$sucursal->id}/toggle-status");
        $response->assertRedirect();

        $this->assertFalse((bool) $sucursal->fresh()->status);
    }
}
