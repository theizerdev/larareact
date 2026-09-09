<?php

namespace Tests\Feature;

use App\Models\Departamento;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * Incidencia 2 — Integridad backend / falsos positivos (Sucursales).
 * SQLite en memoria; fallas simuladas con eventos de modelo.
 */
class SucursalCrudTest extends TestCase
{
    use RefreshDatabase;

    private function empresa(): Empresa
    {
        return Empresa::withoutTenant()->create([
            'razon_social' => 'ACME',
            'documento' => 'ACME-'.uniqid(),
            'status' => true,
        ]);
    }

    private function userWith(array $permissions, Empresa $empresa): User
    {
        foreach ($permissions as $name) {
            Permission::findOrCreate($name, 'web');
        }

        $user = User::factory()->create(['empresa_id' => $empresa->id, 'sucursal_id' => null]);
        $user->givePermissionTo($permissions);
        $user->refresh();

        return $user;
    }

    private function payload(Empresa $empresa, array $overrides = []): array
    {
        return array_merge([
            'empresa_id' => $empresa->id,
            'nombre' => 'Sucursal Purépero',
            'codigo_numeral' => '01',
            'direccion' => 'Av. Hidalgo 100',
            'ciudad' => 'Purépero',
            'estado' => 'Michoacán',
            'colonia' => 'Centro',
            'codigo_postal' => '58540',
            'latitud' => 19.9231,
            'longitud' => -102.0136,
            'status' => true,
        ], $overrides);
    }

    public function test_store_persists_structured_address_and_coordinates(): void
    {
        $empresa = $this->empresa();
        $user = $this->userWith(['sucursales.create'], $empresa);

        $response = $this->actingAs($user)->post('/admin/sucursales', $this->payload($empresa));

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('sucursales', [
            'empresa_id' => $empresa->id,
            'nombre' => 'Sucursal Purépero',
            'ciudad' => 'Purépero',
            'codigo_postal' => '58540',
        ]);
    }

    public function test_out_of_range_longitude_is_rejected_without_creating_a_row(): void
    {
        $empresa = $this->empresa();
        $user = $this->userWith(['sucursales.create'], $empresa);

        $response = $this->actingAs($user)->post('/admin/sucursales', $this->payload($empresa, [
            'longitud' => -5000,
        ]));

        $response->assertSessionHasErrors('longitud');
        $this->assertSame(0, Sucursal::withoutTenant()->count());
    }

    public function test_unknown_empresa_is_rejected(): void
    {
        $empresa = $this->empresa();
        $user = $this->userWith(['sucursales.create'], $empresa);

        $response = $this->actingAs($user)->post('/admin/sucursales', $this->payload($empresa, [
            'empresa_id' => 999999,
        ]));

        $response->assertSessionHasErrors('empresa_id');
        $this->assertSame(0, Sucursal::withoutTenant()->count());
    }

    public function test_failed_store_does_no_t_return_success_and_writes_nothing(): void
    {
        $empresa = $this->empresa();
        $user = $this->userWith(['sucursales.create'], $empresa);

        Sucursal::creating(function () {
            throw new \RuntimeException('simulated failure');
        });

        $response = $this->actingAs($user)->post('/admin/sucursales', $this->payload($empresa));

        $response->assertStatus(500);
        $this->assertSame(0, Sucursal::withoutTenant()->count());

        Sucursal::flushEventListeners();
    }

    public function test_destroy_cascades_atomically(): void
    {
        $empresa = $this->empresa();
        $user = $this->userWith(['sucursales.delete'], $empresa);
        $sucursal = Sucursal::withoutTenant()->create($this->payload($empresa));

        $departamento = Departamento::withoutTenant()->create([
            'nombre' => 'Producción',
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
            'user_id' => $user->id,
            'status' => 1,
        ]);

        $this->actingAs($user)
            ->delete("/admin/sucursales/{$sucursal->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('sucursales', ['id' => $sucursal->id]);
        $this->assertDatabaseMissing('departamentos', ['id' => $departamento->id]);
    }

    public function test_destroy_rolls_back_when_the_delete_fails(): void
    {
        $empresa = $this->empresa();
        $user = $this->userWith(['sucursales.delete'], $empresa);
        $sucursal = Sucursal::withoutTenant()->create($this->payload($empresa));

        $departamento = Departamento::withoutTenant()->create([
            'nombre' => 'Producción',
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
            'user_id' => $user->id,
            'status' => 1,
        ]);

        Sucursal::deleting(function () {
            throw new \RuntimeException('delete failure');
        });

        $response = $this->actingAs($user)->delete("/admin/sucursales/{$sucursal->id}");

        $response->assertStatus(500);
        $this->assertDatabaseHas('sucursales', ['id' => $sucursal->id]);
        $this->assertDatabaseHas('departamentos', ['id' => $departamento->id]);

        Sucursal::flushEventListeners();
    }

    public function test_update_persists_new_structured_fields(): void
    {
        $empresa = $this->empresa();
        $user = $this->userWith(['sucursales.edit'], $empresa);
        $sucursal = Sucursal::withoutTenant()->create($this->payload($empresa));

        $this->actingAs($user)
            ->put("/admin/sucursales/{$sucursal->id}", $this->payload($empresa, [
                'ciudad' => 'Tuxcueca',
                'codigo_postal' => '49570',
            ]))
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('sucursales', [
            'id' => $sucursal->id,
            'ciudad' => 'Tuxcueca',
            'codigo_postal' => '49570',
        ]);
    }
}
