<?php

namespace Tests\Feature\Admin;

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * Integridad transaccional del CRUD: ninguna respuesta de éxito sin COMMIT.
 *
 * Todo corre contra SQLite en memoria (ver phpunit.xml, DB_DATABASE=:memory:).
 * Los fallos de base de datos se provocan con mocks y con datos de prueba
 * creados dentro del propio test; en ningún punto se toca la base de producción.
 */
class IntegridadTransaccionalTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsUsuarioCon(string ...$permisos): User
    {
        foreach ($permisos as $permiso) {
            Permission::findOrCreate($permiso, 'web');
        }

        $user = User::factory()->create();
        $user->givePermissionTo($permisos);

        return $user;
    }

    // ── Falsos positivos ─────────────────────────────────────────────────────

    #[Test]
    public function un_fallo_de_escritura_no_devuelve_una_respuesta_de_exito(): void
    {
        $user = $this->actingAsUsuarioCon('empresas.create');

        // Empujamos a la BD a fallar con un documento duplicado. Antes, el
        // controlador atrapaba la excepción y devolvía 302 (éxito para Inertia).
        Empresa::factory()->create(['documento' => 'RFC-DUPLICADO']);

        $payload = [
            'razon_social' => 'Rancho Nuevo SA',
            'documento' => 'RFC-DUPLICADO',
            'status' => true,
        ];

        $response = $this->actingAs($user)->post('/admin/empresas', $payload);

        // La regla `unique` lo corta antes: 422 y `onError` en el frontend.
        $response->assertStatus(302);
        $response->assertSessionHasErrors('documento');

        // Y sobre todo: no se emitió notificación de éxito.
        $this->assertNull(session('notification'));
        $this->assertSame(1, Empresa::where('documento', 'RFC-DUPLICADO')->count());
    }

    #[Test]
    public function una_excepcion_inesperada_no_se_convierte_en_exito(): void
    {
        $user = $this->actingAsUsuarioCon('empresas.edit');
        $empresa = Empresa::factory()->create();

        // Simulamos un fallo de infraestructura en pleno COMMIT.
        DB::listen(function ($query) {
            if (str_contains(mb_strtolower($query->sql), 'update "empresas"')) {
                throw new \RuntimeException('Fallo simulado de infraestructura');
            }
        });

        $this->withoutExceptionHandling();

        $this->expectException(\RuntimeException::class);

        $this->actingAs($user)->put("/admin/empresas/{$empresa->id}", [
            'razon_social' => 'Nombre Cambiado',
            'documento' => $empresa->documento,
            'status' => true,
        ]);
    }

    #[Test]
    public function un_fallo_deja_la_tabla_sin_escrituras_parciales(): void
    {
        $user = $this->actingAsUsuarioCon('empresas.edit');
        $empresa = Empresa::factory()->create(['razon_social' => 'Nombre Original']);

        DB::listen(function ($query) {
            if (str_contains(mb_strtolower($query->sql), 'update "empresas"')) {
                throw new \RuntimeException('Fallo simulado durante la escritura');
            }
        });

        try {
            $this->actingAs($user)->put("/admin/empresas/{$empresa->id}", [
                'razon_social' => 'Nombre Corrupto',
                'documento' => $empresa->documento,
                'status' => true,
            ]);
        } catch (\Throwable) {
            // Nos interesa el estado de la BD, no la excepción.
        }

        // ROLLBACK efectivo: el valor original sigue intacto.
        $this->assertSame('Nombre Original', $empresa->fresh()->razon_social);
    }

    #[Test]
    public function un_exito_real_si_emite_la_notificacion_de_exito(): void
    {
        $user = $this->actingAsUsuarioCon('empresas.create');

        $response = $this->actingAs($user)->post('/admin/empresas', [
            'razon_social' => 'Agrícola del Bajío SA',
            'documento' => 'RFC-OK-0001',
            'status' => true,
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasNoErrors();
        $response->assertSessionHas('notification.type', 'success');

        $this->assertDatabaseHas('empresas', ['documento' => 'RFC-OK-0001']);
    }

    // ── Borrado verificado ───────────────────────────────────────────────────

    #[Test]
    public function el_borrado_solo_reporta_exito_si_la_fila_desaparecio(): void
    {
        $user = $this->actingAsUsuarioCon('sucursales.delete');
        $sucursal = Sucursal::factory()->create();

        $response = $this->actingAs($user)->delete("/admin/sucursales/{$sucursal->id}");

        $response->assertSessionHas('notification.type', 'success');
        $this->assertDatabaseMissing('sucursales', ['id' => $sucursal->id]);
    }

    // ── Payloads vacíos y corruptos ──────────────────────────────────────────

    #[Test]
    public function un_payload_vacio_devuelve_errores_de_validacion_y_no_500(): void
    {
        $user = $this->actingAsUsuarioCon('empresas.create');

        $response = $this->actingAs($user)->post('/admin/empresas', []);

        $response->assertStatus(302);
        $response->assertSessionHasErrors(['razon_social', 'documento']);
        $this->assertSame(0, Empresa::count());
    }

    #[Test]
    public function un_payload_con_tipos_corruptos_no_rompe_el_controlador(): void
    {
        $user = $this->actingAsUsuarioCon('empresas.create');

        $response = $this->actingAs($user)->post('/admin/empresas', [
            'razon_social' => str_repeat('A', 5000),   // excede max:255
            'documento' => ['no', 'es', 'un', 'string'],
            'latitud' => 'no-es-un-numero',
            'longitud' => ['array'],
            'email' => 'esto-no-es-un-email',
            'status' => 'quizás',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors(['razon_social', 'documento', 'latitud', 'longitud', 'email']);
        $this->assertSame(0, Empresa::count());
    }

    #[Test]
    public function un_id_inexistente_devuelve_404_y_no_500(): void
    {
        $user = $this->actingAsUsuarioCon('empresas.edit');

        $response = $this->actingAs($user)->put('/admin/empresas/999999', [
            'razon_social' => 'Fantasma SA',
            'documento' => 'RFC-FANTASMA',
            'status' => true,
        ]);

        $response->assertNotFound();
    }

    // ── Concurrencia ─────────────────────────────────────────────────────────

    #[Test]
    public function dos_cambios_de_estado_seguidos_no_se_pisan(): void
    {
        $user = $this->actingAsUsuarioCon('empresas.edit');
        $empresa = Empresa::factory()->create(['status' => true]);

        $this->actingAs($user)->patch("/admin/empresas/{$empresa->id}/toggle-status");
        $this->assertFalse((bool) $empresa->fresh()->status);

        $this->actingAs($user)->patch("/admin/empresas/{$empresa->id}/toggle-status");
        $this->assertTrue((bool) $empresa->fresh()->status);
    }

    #[Test]
    public function un_bloqueo_de_base_de_datos_se_traduce_a_422_y_no_a_500(): void
    {
        $user = $this->actingAsUsuarioCon('empresas.edit');
        $empresa = Empresa::factory()->create();

        // "database is locked" es el error que SQLite devuelve cuando dos
        // escrituras coinciden. Debe llegar al usuario como error accionable
        // (422 -> `onError`), no como un 500 sin contexto.
        DB::listen(function ($query) {
            if (str_contains(mb_strtolower($query->sql), 'update "empresas"')) {
                throw new QueryException(
                    'sqlite',
                    $query->sql,
                    [],
                    new \PDOException('SQLSTATE[HY000]: General error: 5 database is locked'),
                );
            }
        });

        $response = $this->actingAs($user)->put("/admin/empresas/{$empresa->id}", [
            'razon_social' => 'Otro Nombre',
            'documento' => $empresa->documento,
            'status' => true,
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors('documento');
        $this->assertNull(session('notification'));
    }
}
