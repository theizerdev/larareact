<?php

namespace Tests\Feature\Admin;

use App\Models\Pais;
use App\Models\Productor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * Efectos secundarios (WhatsApp) y borrado en cascada.
 *
 * El proveedor de WhatsApp se sustituye por `Http::fake()`: se simulan caída,
 * error y lentitud sin llamar a ningún servicio real. Base de datos en memoria.
 */
class EfectosSecundariosPostCommitTest extends TestCase
{
    use RefreshDatabase;

    private function usuarioCon(string ...$permisos): User
    {
        foreach ($permisos as $permiso) {
            Permission::findOrCreate($permiso, 'web');
        }

        $user = User::factory()->create();
        $user->givePermissionTo($permisos);

        return $user;
    }

    private function payloadConTelefono(): array
    {
        $pais = Pais::factory()->create();

        return [
            'razon_social' => 'Rancho El Sauce SA',
            'nombre_comercial' => 'El Sauce',
            'documento_identidad' => 'DOC-WA-001',
            'pais_id' => $pais->id,
            'pais_telefono_id' => $pais->id,
            'telefono' => '3511234567',
            'direccion' => 'Camino Real 45',
            'status' => 'activo',
            'latitud' => 19.9868,
            'longitud' => -102.2839,
        ];
    }

    #[Test]
    public function si_whatsapp_falla_el_productor_queda_guardado_igual(): void
    {
        $user = $this->usuarioCon('productores.create');

        // El proveedor devuelve 500: el alta no debe deshacerse por ello.
        Http::fake(['*' => Http::response('Gateway error', 500)]);

        $this->actingAs($user)
            ->post('/admin/productores', $this->payloadConTelefono())
            ->assertSessionHasNoErrors()
            ->assertSessionHas('notification.type', 'success');

        $this->assertDatabaseHas('productores', ['documento_identidad' => 'DOC-WA-001']);
    }

    #[Test]
    public function si_whatsapp_lanza_una_excepcion_el_alta_sigue_confirmada(): void
    {
        $user = $this->usuarioCon('productores.create');

        // Conexión rechazada: el escenario de red inestable.
        Http::fake(fn () => throw new ConnectionException('Connection timed out'));

        $this->actingAs($user)
            ->post('/admin/productores', $this->payloadConTelefono())
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('productores', ['documento_identidad' => 'DOC-WA-001']);
    }

    #[Test]
    public function el_envio_de_whatsapp_ocurre_fuera_de_la_transaccion(): void
    {
        $user = $this->usuarioCon('productores.create');

        $transaccionesAbiertasDuranteElEnvio = null;

        Http::fake(function () use (&$transaccionesAbiertasDuranteElEnvio) {
            // Si esto fuera > 0, una llamada HTTP externa estaría sosteniendo el
            // bloqueo de escritura de SQLite y bloquearía al resto de la app.
            $transaccionesAbiertasDuranteElEnvio = DB::transactionLevel();

            return Http::response(['ok' => true], 200);
        });

        $this->actingAs($user)->post('/admin/productores', $this->payloadConTelefono());

        $this->assertNotNull(
            $transaccionesAbiertasDuranteElEnvio,
            'No se registró ninguna llamada al proveedor de WhatsApp.',
        );

        // RefreshDatabase mantiene una transacción envolvente en las pruebas, así
        // que el nivel esperado es el de base, no cero.
        $this->assertSame(
            1,
            $transaccionesAbiertasDuranteElEnvio,
            'El envío de WhatsApp se ejecutó dentro de la transacción de escritura.',
        );
    }

    #[Test]
    public function un_productor_sin_telefono_no_dispara_ninguna_llamada_externa(): void
    {
        $user = $this->usuarioCon('productores.create');

        Http::preventStrayRequests();

        $payload = $this->payloadConTelefono();
        unset($payload['telefono']);

        $this->actingAs($user)
            ->post('/admin/productores', $payload)
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('productores', ['documento_identidad' => 'DOC-WA-001']);
    }

    // ── Borrado en cascada ───────────────────────────────────────────────────

    #[Test]
    public function eliminar_un_productor_arrastra_a_sus_dependientes(): void
    {
        $user = $this->usuarioCon('productores.delete');
        $productor = Productor::factory()->create();

        DB::table('productor_empleados')->insert([
            'productor_id' => $productor->id,
            'nombres' => 'Ana',
            'apellidos' => 'García',
            'documento_identidad' => 'EMP-0001',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($user)
            ->delete("/admin/productores/{$productor->id}")
            ->assertSessionHas('notification.type', 'success');

        $this->assertDatabaseMissing('productores', ['id' => $productor->id]);

        // Comportamiento documentado, no accidental: la FK está declarada
        // `cascadeOnDelete`, así que los colaboradores desaparecen con el
        // productor. Esta prueba fija el contrato para que un cambio de cascada
        // no pase inadvertido.
        $this->assertSame(
            0,
            DB::table('productor_empleados')->where('productor_id', $productor->id)->count(),
        );
    }

    #[Test]
    public function borrar_dos_veces_el_mismo_registro_no_produce_un_500(): void
    {
        $user = $this->usuarioCon('productores.delete');
        $productor = Productor::factory()->create();

        $this->actingAs($user)->delete("/admin/productores/{$productor->id}");

        // Doble clic o reenvío: el segundo intento debe ser 404, no un 500.
        $this->actingAs($user)
            ->delete("/admin/productores/{$productor->id}")
            ->assertNotFound();
    }
}
