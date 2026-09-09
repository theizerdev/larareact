<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * Incidencia 2 — Integridad backend / falsos positivos.
 *
 * Estas pruebas corren SIEMPRE contra SQLite en memoria (phpunit.xml), nunca
 * contra la base de datos real. Las fallas se simulan con eventos de modelo, no
 * tocando datos de producción.
 */
class EmpresaCrudTest extends TestCase
{
    use RefreshDatabase;

    private function userWith(array $permissions): User
    {
        foreach ($permissions as $name) {
            Permission::findOrCreate($name, 'web');
        }

        $user = User::factory()->create(['empresa_id' => null]);
        $user->givePermissionTo($permissions);
        $user->refresh();

        return $user;
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'razon_social' => 'ACME S.A. de C.V.',
            'documento' => 'ACME010101AAA',
            'status' => true,
            'direccion' => 'Carretera Zamora-Jacona Km 3',
            'ciudad' => 'Zamora',
            'estado' => 'Michoacán',
            'colonia' => 'Centro',
            'codigo_postal' => '59600',
            'latitud' => 19.9857,
            'longitud' => -102.2833,
        ], $overrides);
    }

    public function test_store_persists_structured_address_and_coordinates(): void
    {
        $user = $this->userWith(['empresas.create']);

        $response = $this->actingAs($user)->post('/admin/empresas', $this->validPayload());

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('empresas', [
            'documento' => 'ACME010101AAA',
            'ciudad' => 'Zamora',
            'colonia' => 'Centro',
            'codigo_postal' => '59600',
            'estado' => 'Michoacán',
        ]);

        $empresa = Empresa::withoutTenant()->first();
        $this->assertEqualsWithDelta(19.9857, (float) $empresa->latitud, 0.0001);
        $this->assertIsFloat($empresa->latitud, 'Las coordenadas deben serializarse como número, no string.');
    }

    public function test_duplicate_documento_is_rejected_without_creating_a_row(): void
    {
        $user = $this->userWith(['empresas.create']);
        Empresa::withoutTenant()->create($this->validPayload(['razon_social' => 'Existing']));

        $response = $this->actingAs($user)->post('/admin/empresas', $this->validPayload());

        $response->assertSessionHasErrors('documento');
        $this->assertSame(1, Empresa::withoutTenant()->count());
    }

    public function test_out_of_range_latitude_is_rejected_before_touching_the_database(): void
    {
        $user = $this->userWith(['empresas.create']);

        $response = $this->actingAs($user)->post('/admin/empresas', $this->validPayload([
            'latitud' => 999,
            'longitud' => -102.2833,
        ]));

        $response->assertSessionHasErrors('latitud');
        $this->assertSame(0, Empresa::withoutTenant()->count());
    }

    public function test_half_a_coordinate_pair_is_rejected(): void
    {
        $user = $this->userWith(['empresas.create']);

        $response = $this->actingAs($user)->post('/admin/empresas', $this->validPayload([
            'latitud' => 19.98,
            'longitud' => null,
        ]));

        $response->assertSessionHasErrors('longitud');
        $this->assertSame(0, Empresa::withoutTenant()->count());
    }

    public function test_a_failed_write_does_no_t_return_a_success_response(): void
    {
        $user = $this->userWith(['empresas.create']);

        // Simula un fallo de persistencia (disco lleno, lock, columna, etc.).
        Empresa::creating(function () {
            throw new \RuntimeException('simulated storage failure');
        });

        $response = $this->actingAs($user)->post('/admin/empresas', $this->validPayload());

        // Antes: el try/catch devolvía back() => Inertia lo tomaba como éxito.
        // Ahora: 500 semántico y CERO filas escritas (transacción revertida).
        $response->assertStatus(500);
        $this->assertSame(0, Empresa::withoutTenant()->count());

        Empresa::flushEventListeners();
    }

    public function test_update_is_atomic_a_mid_transaction_failure_rolls_back(): void
    {
        $user = $this->userWith(['empresas.edit']);
        $empresa = Empresa::withoutTenant()->create($this->validPayload(['razon_social' => 'Original']));

        Empresa::updated(function () {
            throw new \RuntimeException('post-update failure');
        });

        $response = $this->actingAs($user)->put("/admin/empresas/{$empresa->id}", $this->validPayload([
            'razon_social' => 'Changed Name',
        ]));

        $response->assertStatus(500);
        $this->assertSame('Original', $empresa->fresh()->razon_social);

        Empresa::flushEventListeners();
    }

    public function test_toggle_status_persists(): void
    {
        $user = $this->userWith(['empresas.edit']);
        $empresa = Empresa::withoutTenant()->create($this->validPayload(['status' => true]));

        $this->actingAs($user)
            ->patch("/admin/empresas/{$empresa->id}/toggle-status")
            ->assertRedirect();

        $this->assertFalse((bool) $empresa->fresh()->status);
    }

    public function test_create_requires_permission(): void
    {
        $user = User::factory()->create(['empresa_id' => null]);

        $this->actingAs($user)
            ->post('/admin/empresas', $this->validPayload())
            ->assertForbidden();

        $this->assertSame(0, Empresa::withoutTenant()->count());
    }
}
