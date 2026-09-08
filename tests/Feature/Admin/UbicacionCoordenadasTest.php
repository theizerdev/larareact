<?php

namespace Tests\Feature\Admin;

use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Productor;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * Módulo de ubicación: validación de coordenadas, persistencia del par
 * dirección + coordenadas y tipos serializados hacia el frontend.
 *
 * Todo se ejecuta contra SQLite en memoria. Las llamadas a proveedores de mapas
 * se interceptan con `Http::fake()`; no sale ninguna petición real ni se toca la
 * base de datos de producción.
 */
class UbicacionCoordenadasTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Red cortada por defecto: si algún código intentara llamar a un
        // proveedor externo durante las pruebas, saltaría aquí.
        Http::preventStrayRequests();
    }

    private function usuarioCon(string ...$permisos): User
    {
        foreach ($permisos as $permiso) {
            Permission::findOrCreate($permiso, 'web');
        }

        $user = User::factory()->create();
        $user->givePermissionTo($permisos);

        return $user;
    }

    private function payloadProductor(array $override = []): array
    {
        $pais = Pais::factory()->create();

        return array_merge([
            'razon_social' => 'Rancho Los Encinos SA',
            'nombre_comercial' => 'Los Encinos',
            'documento_identidad' => 'DOC-0001',
            'pais_id' => $pais->id,
            'direccion' => 'Carretera Zamora-Jacona Km 3',
            'codigo_postal' => '59600',
            'estado' => 'Michoacán',
            'status' => 'activo',
            'latitud' => 19.98680,
            'longitud' => -102.28390,
        ], $override);
    }

    // ── Persistencia del objeto de ubicación completo ────────────────────────

    #[Test]
    public function persiste_direccion_estructurada_y_coordenadas_juntas(): void
    {
        $user = $this->usuarioCon('productores.create');

        $this->actingAs($user)
            ->post('/admin/productores', $this->payloadProductor())
            ->assertSessionHasNoErrors();

        $productor = Productor::firstWhere('documento_identidad', 'DOC-0001');

        $this->assertNotNull($productor);
        $this->assertSame('Carretera Zamora-Jacona Km 3', $productor->direccion);
        $this->assertSame('59600', $productor->codigo_postal);
        $this->assertSame('Michoacán', $productor->estado);
        $this->assertEqualsWithDelta(19.98680, $productor->latitud, 0.00001);
        $this->assertEqualsWithDelta(-102.28390, $productor->longitud, 0.00001);
    }

    #[Test]
    public function acepta_un_registro_sin_coordenadas_por_retrocompatibilidad(): void
    {
        $user = $this->usuarioCon('productores.create');

        $this->actingAs($user)
            ->post('/admin/productores', $this->payloadProductor([
                'latitud' => null,
                'longitud' => null,
            ]))
            ->assertSessionHasNoErrors();

        $productor = Productor::firstWhere('documento_identidad', 'DOC-0001');

        $this->assertNotNull($productor);
        $this->assertNull($productor->latitud);
        $this->assertNull($productor->longitud);
    }

    #[Test]
    public function una_coordenada_vacia_se_guarda_como_null_y_no_como_error(): void
    {
        $user = $this->usuarioCon('productores.create');

        // El formulario envía cadena vacía al borrar el campo; `''` no es
        // `numeric`, así que sin normalizar devolvía un error de validación.
        $this->actingAs($user)
            ->post('/admin/productores', $this->payloadProductor([
                'latitud' => '',
                'longitud' => '',
            ]))
            ->assertSessionHasNoErrors();

        $this->assertNull(Productor::firstWhere('documento_identidad', 'DOC-0001')->latitud);
    }

    // ── Validación del par ───────────────────────────────────────────────────

    #[Test]
    public function rechaza_media_coordenada(): void
    {
        $user = $this->usuarioCon('productores.create');

        $this->actingAs($user)
            ->post('/admin/productores', $this->payloadProductor(['longitud' => null]))
            ->assertSessionHasErrors('longitud');

        $this->assertSame(0, Productor::count());
    }

    #[Test]
    public function rechaza_una_longitud_sin_latitud(): void
    {
        $user = $this->usuarioCon('productores.create');

        $this->actingAs($user)
            ->post('/admin/productores', $this->payloadProductor(['latitud' => null]))
            ->assertSessionHasErrors('latitud');

        $this->assertSame(0, Productor::count());
    }

    #[Test]
    public function rechaza_coordenadas_fuera_de_rango(): void
    {
        $user = $this->usuarioCon('productores.create');

        $this->actingAs($user)
            ->post('/admin/productores', $this->payloadProductor([
                'latitud' => 91.5,      // > 90
                'longitud' => -181.2,   // < -180
            ]))
            ->assertSessionHasErrors(['latitud', 'longitud']);

        $this->assertSame(0, Productor::count());
    }

    #[Test]
    public function rechaza_coordenadas_no_numericas(): void
    {
        $user = $this->usuarioCon('productores.create');

        $this->actingAs($user)
            ->post('/admin/productores', $this->payloadProductor([
                'latitud' => 'diecinueve',
                'longitud' => ['array', 'corrupto'],
            ]))
            ->assertSessionHasErrors(['latitud', 'longitud']);

        $this->assertSame(0, Productor::count());
    }

    #[Test]
    public function acepta_el_origen_de_coordenadas_como_valor_valido(): void
    {
        $user = $this->usuarioCon('productores.create');

        // 0,0 es una coordenada legítima. Un `if ($lat)` la trataría como
        // ausente; la validación debe aceptarla.
        $this->actingAs($user)
            ->post('/admin/productores', $this->payloadProductor([
                'latitud' => 0,
                'longitud' => 0,
            ]))
            ->assertSessionHasNoErrors();

        $productor = Productor::firstWhere('documento_identidad', 'DOC-0001');

        $this->assertSame(0.0, $productor->latitud);
        $this->assertSame(0.0, $productor->longitud);
    }

    // ── Tipos que llegan al frontend ─────────────────────────────────────────

    #[Test]
    public function las_coordenadas_se_serializan_como_numero_y_no_como_texto(): void
    {
        // El cast `decimal:8` devolvía "19.70000000" (string). En el frontend
        // eso rompía `.toFixed()` y llegaba a Mapbox como texto.
        $empresa = Empresa::factory()->create(['latitud' => 19.7, 'longitud' => -101.19]);
        $sucursal = Sucursal::factory()->create(['latitud' => 19.7, 'longitud' => -101.19]);
        $pais = Pais::factory()->create(['latitud' => 19.7, 'longitud' => -101.19]);
        $productor = Productor::factory()->create(['latitud' => 19.7, 'longitud' => -101.19]);

        foreach ([$empresa, $sucursal, $pais, $productor] as $modelo) {
            $json = $modelo->fresh()->toArray();

            $this->assertIsFloat($json['latitud'], $modelo::class.'::latitud debe ser float');
            $this->assertIsFloat($json['longitud'], $modelo::class.'::longitud debe ser float');
        }
    }

    #[Test]
    public function la_precision_decimal_se_conserva_al_guardar(): void
    {
        $user = $this->usuarioCon('productores.create');

        // El esquema es decimal(10,8) / decimal(11,8): 8 decimales.
        $this->actingAs($user)
            ->post('/admin/productores', $this->payloadProductor([
                'latitud' => 19.98675432,
                'longitud' => -102.28391234,
            ]))
            ->assertSessionHasNoErrors();

        $productor = Productor::firstWhere('documento_identidad', 'DOC-0001');

        $this->assertEqualsWithDelta(19.98675432, $productor->latitud, 0.00000001);
        $this->assertEqualsWithDelta(-102.28391234, $productor->longitud, 0.00000001);
    }

    // ── Actualización: las coordenadas del usuario prevalecen ────────────────

    #[Test]
    public function al_actualizar_prevalecen_las_coordenadas_enviadas(): void
    {
        $user = $this->usuarioCon('productores.edit');
        $productor = Productor::factory()->create([
            'latitud' => 19.0,
            'longitud' => -102.0,
        ]);

        $this->actingAs($user)
            ->put("/admin/productores/{$productor->id}", $this->payloadProductor([
                'documento_identidad' => $productor->documento_identidad,
                'latitud' => 20.123456,
                'longitud' => -103.654321,
            ]))
            ->assertSessionHasNoErrors();

        $productor->refresh();

        $this->assertEqualsWithDelta(20.123456, $productor->latitud, 0.00001);
        $this->assertEqualsWithDelta(-103.654321, $productor->longitud, 0.00001);
    }

    #[Test]
    public function una_actualizacion_fallida_no_altera_las_coordenadas_previas(): void
    {
        $user = $this->usuarioCon('productores.edit');
        $productor = Productor::factory()->create([
            'latitud' => 19.0,
            'longitud' => -102.0,
        ]);

        $this->actingAs($user)
            ->put("/admin/productores/{$productor->id}", $this->payloadProductor([
                'documento_identidad' => $productor->documento_identidad,
                'latitud' => 999,      // inválida: debe abortar toda la escritura
                'longitud' => -103.65,
            ]))
            ->assertSessionHasErrors('latitud');

        $productor->refresh();

        $this->assertEqualsWithDelta(19.0, $productor->latitud, 0.00001);
        $this->assertEqualsWithDelta(-102.0, $productor->longitud, 0.00001);
    }
}
