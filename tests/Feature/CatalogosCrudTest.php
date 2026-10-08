<?php

namespace Tests\Feature;

use App\Models\Cargo;
use App\Models\Departamento;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Productor;
use App\Models\Proveedor;
use App\Models\Responsable;
use App\Models\Sucursal;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Recorrido completo (listar, crear, editar, activar/desactivar y borrar) de los
 * catálogos que se muestran en una demo, como lo haría un admin de una empresa.
 *
 * Cada paso verifica el efecto REAL en la base de datos: lo que se rompía era que
 * la pantalla dijera "guardado" sin que se hubiera guardado nada (o un 500).
 */
class CatalogosCrudTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    private Sucursal $sucursal;

    private User $admin;

    private Pais $pais;

    protected function setUp(): void
    {
        parent::setUp();

        // Ninguna prueba debe salir a internet (WhatsApp, etc.).
        Http::fake();

        $this->seed(PermissionSeeder::class);
        Role::findOrCreate('admin', 'web')->syncPermissions(Permission::pluck('name')->all());
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->pais = Pais::create(['nombre' => 'México', 'codigo_iso2' => 'MX', 'codigo_iso3' => 'MEX', 'codigo_telefonico' => '+52', 'activo' => true]);
        $this->empresa = Empresa::create(['razon_social' => 'Empresa Uno', 'documento' => 'E-1', 'status' => true]);
        $this->sucursal = Sucursal::create(['empresa_id' => $this->empresa->id, 'nombre' => 'Matriz', 'status' => true]);

        $this->admin = User::factory()->create(['empresa_id' => $this->empresa->id, 'sucursal_id' => $this->sucursal->id]);
        $this->admin->assignRole('admin');
        $this->actingAs($this->admin);
    }

    private function tenant(array $extra = []): array
    {
        return $extra + [
            'empresa_id' => $this->empresa->id,
            'sucursal_id' => $this->sucursal->id,
            'user_id' => $this->admin->id,
        ];
    }

    private function departamento(string $nombre = 'Operaciones'): Departamento
    {
        return Departamento::create($this->tenant(['nombre' => $nombre, 'status' => true]));
    }

    public function test_todas_las_pantallas_cargan_sin_error(): void
    {
        foreach (['sucursales', 'departamentos', 'cargos', 'responsables', 'empleados', 'proveedores', 'socios-comerciales'] as $modulo) {
            $this->get("/admin/{$modulo}")->assertOk();
        }
    }

    public function test_la_direccion_anterior_de_socios_comerciales_redirige_a_la_nueva(): void
    {
        $this->get('/admin/productores')->assertRedirect('/admin/socios-comerciales');
    }

    public function test_un_admin_atado_a_una_sucursal_no_puede_crear_otra_y_se_le_explica(): void
    {
        // Antes se guardaba pero desaparecía de su vista: parecía que "no guardó".
        $this->post('/admin/sucursales', ['empresa_id' => $this->empresa->id, 'nombre' => 'Fantasma', 'status' => true])
            ->assertSessionHasErrors('nombre');
        $this->assertDatabaseMissing('sucursales', ['nombre' => 'Fantasma']);
    }

    public function test_sucursales(): void
    {
        // Administrador de toda la empresa (sin sucursal fija): ve y gestiona todas sus sucursales.
        $this->admin->forceFill(['sucursal_id' => null])->save();
        $this->actingAs($this->admin->fresh());

        $this->post('/admin/sucursales', ['empresa_id' => $this->empresa->id, 'nombre' => 'Planta Norte', 'codigo_numeral' => '02', 'status' => true])
            ->assertSessionHasNoErrors();
        $suc = Sucursal::withoutTenant()->where('nombre', 'Planta Norte')->firstOrFail();

        $this->put("/admin/sucursales/{$suc->id}", ['empresa_id' => $this->empresa->id, 'nombre' => 'Planta Norte 2', 'status' => true])
            ->assertSessionHasNoErrors();
        $this->assertSame('Planta Norte 2', $suc->fresh()->nombre);

        $this->patch("/admin/sucursales/{$suc->id}/toggle-status")->assertSessionHasNoErrors();
        $this->assertFalse((bool) $suc->fresh()->status);

        $this->delete("/admin/sucursales/{$suc->id}")->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('sucursales', ['id' => $suc->id]);
    }

    public function test_departamentos(): void
    {
        $this->post('/admin/departamentos', $this->tenant(['nombre' => 'Calidad', 'status' => 1]))->assertSessionHasNoErrors();
        $dep = Departamento::withoutTenant()->where('nombre', 'Calidad')->firstOrFail();

        $this->put("/admin/departamentos/{$dep->id}", $this->tenant(['nombre' => 'Calidad Total', 'status' => 1]))->assertSessionHasNoErrors();
        $this->assertSame('Calidad Total', $dep->fresh()->nombre);

        $this->patch("/admin/departamentos/{$dep->id}/toggle-status")->assertSessionHasNoErrors();
        $this->assertFalse((bool) $dep->fresh()->status);

        $this->delete("/admin/departamentos/{$dep->id}")->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('departamentos', ['id' => $dep->id]);
    }

    public function test_cargos(): void
    {
        $dep = $this->departamento();

        $this->post('/admin/cargos', $this->tenant(['nombre' => 'Supervisor', 'departamento_id' => $dep->id, 'status' => 1]))->assertSessionHasNoErrors();
        $cargo = Cargo::withoutTenant()->where('nombre', 'Supervisor')->firstOrFail();

        $this->put("/admin/cargos/{$cargo->id}", $this->tenant(['nombre' => 'Supervisor Senior', 'departamento_id' => $dep->id, 'status' => 1]))->assertSessionHasNoErrors();
        $this->assertSame('Supervisor Senior', $cargo->fresh()->nombre);

        $this->patch("/admin/cargos/{$cargo->id}/toggle-status")->assertSessionHasNoErrors();
        $this->assertFalse((bool) $cargo->fresh()->status);

        $this->delete("/admin/cargos/{$cargo->id}")->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('cargos', ['id' => $cargo->id]);
    }

    public function test_responsables(): void
    {
        $dep = $this->departamento();

        $this->post('/admin/responsables', $this->tenant(['nombres' => 'Ana', 'apellidos' => 'Pérez', 'departamento_id' => $dep->id, 'status' => 1]))->assertSessionHasNoErrors();
        $resp = Responsable::withoutTenant()->where('nombres', 'Ana')->firstOrFail();

        $this->put("/admin/responsables/{$resp->id}", $this->tenant(['nombres' => 'Ana María', 'apellidos' => 'Pérez', 'departamento_id' => $dep->id, 'status' => 1]))->assertSessionHasNoErrors();
        $this->assertSame('Ana María', $resp->fresh()->nombres);

        $this->patch("/admin/responsables/{$resp->id}/toggle-status")->assertSessionHasNoErrors();
        $this->assertFalse((bool) $resp->fresh()->status);

        $this->delete("/admin/responsables/{$resp->id}")->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('responsables', ['id' => $resp->id]);
    }

    public function test_empleados_con_vehiculos(): void
    {
        $dep = $this->departamento();
        $vehiculo = ['tipo_vehiculo' => 'Automóvil', 'marca' => 'Nissan', 'modelo' => 'Versa', 'year' => 2020, 'placa' => 'ABC123'];

        $this->post('/admin/empleados', $this->tenant([
            'nombres' => 'Luis', 'apellidos' => 'Gómez', 'documento_identidad' => 'DOC-1',
            'departamento_id' => $dep->id, 'status' => 1, 'vehiculos' => [$vehiculo],
        ]))->assertSessionHasNoErrors();

        $emp = Empleado::withoutTenant()->where('documento_identidad', 'DOC-1')->firstOrFail();
        $this->assertSame(1, $emp->vehiculos()->count(), 'el vehículo debe guardarse junto con el empleado');

        // Editar sustituye los vehículos; si algo fallara, no deben perderse los anteriores.
        $this->put("/admin/empleados/{$emp->id}", $this->tenant([
            'nombres' => 'Luis Ángel', 'apellidos' => 'Gómez', 'documento_identidad' => 'DOC-1',
            'departamento_id' => $dep->id, 'status' => 1,
            'vehiculos' => [$vehiculo, ['placa' => 'XYZ789'] + $vehiculo],
        ]))->assertSessionHasNoErrors();
        $this->assertSame('Luis Ángel', $emp->fresh()->nombres);
        $this->assertSame(2, $emp->vehiculos()->count());

        $this->patch("/admin/empleados/{$emp->id}/toggle-status")->assertSessionHasNoErrors();
        $this->assertFalse((bool) $emp->fresh()->status);

        $this->delete("/admin/empleados/{$emp->id}")->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('empleados', ['id' => $emp->id]);
        $this->assertSame(0, \App\Models\EmpleadoVehiculo::withoutTenant()->where('empleado_id', $emp->id)->count());
    }

    public function test_un_empleado_con_vehiculo_invalido_no_deja_registros_a_medias(): void
    {
        $dep = $this->departamento();

        // Falta 'marca' en el vehículo: el empleado NO debe quedar creado sin su vehículo.
        $this->post('/admin/empleados', $this->tenant([
            'nombres' => 'Roto', 'apellidos' => 'Prueba', 'documento_identidad' => 'DOC-ROTO',
            'departamento_id' => $dep->id, 'status' => 1,
            'vehiculos' => [['tipo_vehiculo' => 'Automóvil', 'modelo' => 'X', 'year' => 2020, 'placa' => 'P1']],
        ]));

        $this->assertDatabaseMissing('empleados', ['documento_identidad' => 'DOC-ROTO']);
    }

    public function test_proveedores(): void
    {
        $payload = $this->tenant([
            'razon_social' => 'Proveedor SA', 'nombre_comercial' => 'Proveedor', 'documento_identidad' => 'PRV-1',
            'pais_id' => $this->pais->id, 'status' => 'activo',
        ]);

        $this->post('/admin/proveedores', $payload)->assertSessionHasNoErrors();
        $prv = Proveedor::withoutTenant()->where('documento_identidad', 'PRV-1')->firstOrFail();

        $this->put("/admin/proveedores/{$prv->id}", ['nombre_comercial' => 'Proveedor Nuevo'] + $payload)->assertSessionHasNoErrors();
        $this->assertSame('Proveedor Nuevo', $prv->fresh()->nombre_comercial);

        $this->patch("/admin/proveedores/{$prv->id}/toggle-status", ['status' => 'suspendido'])->assertSessionHasNoErrors();
        $this->assertSame('suspendido', $prv->fresh()->status);

        $this->delete("/admin/proveedores/{$prv->id}")->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('proveedores', ['id' => $prv->id]);
    }

    /** PNG de 1x1 como data-URL, como la manda el navegador. */
    private function imagen(): string
    {
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    }

    private function fotosSocio(): array
    {
        return [
            'foto_empresa' => $this->imagen(),
            'foto_responsable' => $this->imagen(),
            'ine_responsable_frente' => $this->imagen(),
            'ine_responsable_reverso' => $this->imagen(),
        ];
    }

    public function test_socio_comercial_exige_fotos_y_ine_del_responsable_y_las_guarda(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');
        $base = $this->tenant([
            'razon_social' => 'Socio Fotos SA', 'nombre_comercial' => 'Fotos', 'documento_identidad' => 'SOC-F',
            'pais_id' => $this->pais->id, 'status' => 'activo',
        ]);

        $this->post('/admin/socios-comerciales', $base)
            ->assertSessionHasErrors(['foto_empresa', 'foto_responsable', 'ine_responsable_frente', 'ine_responsable_reverso']);
        $this->post('/admin/socios-comerciales', ['foto_empresa' => 'data:image/png;base64,AAAA'] + $this->fotosSocio() + $base)
            ->assertSessionHasErrors(['foto_empresa']);
        $this->assertDatabaseMissing('productores', ['documento_identidad' => 'SOC-F']);

        $this->post('/admin/socios-comerciales', $this->fotosSocio() + $base)->assertSessionHasNoErrors();
        $soc = Productor::withoutTenant()->where('documento_identidad', 'SOC-F')->firstOrFail();
        foreach (array_keys($this->fotosSocio()) as $campo) {
            $this->assertStringStartsWith('/storage/socios-comerciales/', $soc->{$campo});
            \Illuminate\Support\Facades\Storage::disk('public')->assertExists(substr($soc->{$campo}, strlen('/storage/')));
        }

        // Editar sin mandar fotos nuevas conserva las que ya tiene, aunque el formulario las reenvíe como ruta.
        $conservada = $soc->foto_empresa;
        $this->put("/admin/socios-comerciales/{$soc->id}", ['foto_empresa' => $conservada, 'nombre_comercial' => 'Otro'] + $base)->assertSessionHasNoErrors();
        $this->assertSame($conservada, $soc->fresh()->foto_empresa);

        // Reemplazar una foto borra la anterior del disco.
        $vieja = $soc->fresh()->foto_responsable;
        $this->put("/admin/socios-comerciales/{$soc->id}", ['foto_responsable' => $this->imagen()] + $base)->assertSessionHasNoErrors();
        $nueva = $soc->fresh()->foto_responsable;
        $this->assertNotSame($vieja, $nueva);
        \Illuminate\Support\Facades\Storage::disk('public')->assertMissing(substr($vieja, strlen('/storage/')));
        \Illuminate\Support\Facades\Storage::disk('public')->assertExists(substr($nueva, strlen('/storage/')));

        // Una ruta ajena no se acepta como imagen.
        $this->put("/admin/socios-comerciales/{$soc->id}", ['foto_empresa' => '/storage/otra/cosa.jpg'] + $base)->assertSessionHasErrors(['foto_empresa']);

        $this->delete("/admin/socios-comerciales/{$soc->id}")->assertSessionHasNoErrors();
        \Illuminate\Support\Facades\Storage::disk('public')->assertMissing(substr($nueva, strlen('/storage/')));
    }

    public function test_socios_comerciales(): void
    {
        $payload = $this->fotosSocio() + $this->tenant([
            'razon_social' => 'Socio SA', 'nombre_comercial' => 'Socio', 'documento_identidad' => 'SOC-1',
            'pais_id' => $this->pais->id, 'status' => 'activo',
        ]);

        $this->post('/admin/socios-comerciales', $payload)->assertSessionHasNoErrors();
        $soc = Productor::withoutTenant()->where('documento_identidad', 'SOC-1')->firstOrFail();
        // Las columnas heredadas *_rancho se mantienen iguales a los datos del socio.
        $this->assertSame('Socio SA', $soc->razon_social_rancho);

        $this->put("/admin/socios-comerciales/{$soc->id}", ['nombre_comercial' => 'Socio Nuevo'] + $payload)->assertSessionHasNoErrors();
        $this->assertSame('Socio Nuevo', $soc->fresh()->nombre_comercial);
        $this->assertSame('Socio Nuevo', $soc->fresh()->nombre_comercial_rancho);

        $this->patch("/admin/socios-comerciales/{$soc->id}/toggle-status", ['status' => 'suspendido'])->assertSessionHasNoErrors();
        $this->assertSame('suspendido', $soc->fresh()->status);

        $this->delete("/admin/socios-comerciales/{$soc->id}")->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('productores', ['id' => $soc->id]);
    }

    public function test_datos_invalidos_devuelven_errores_de_validacion_no_un_500(): void
    {
        $this->post('/admin/proveedores', $this->tenant(['status' => 'activo']))->assertSessionHasErrors(['razon_social', 'nombre_comercial', 'pais_id']);
        $this->post('/admin/socios-comerciales', $this->tenant(['status' => 'activo']))->assertSessionHasErrors(['razon_social', 'nombre_comercial', 'pais_id', 'foto_empresa']);
        $this->post('/admin/departamentos', $this->tenant())->assertSessionHasErrors(['nombre']);
        $this->post('/admin/cargos', $this->tenant(['nombre' => 'X']))->assertSessionHasErrors(['departamento_id']);
        $this->post('/admin/responsables', $this->tenant())->assertSessionHasErrors(['nombres', 'apellidos']);
        $this->post('/admin/empleados', $this->tenant())->assertSessionHasErrors(['nombres', 'apellidos', 'departamento_id']);
        $this->post('/admin/sucursales', ['empresa_id' => $this->empresa->id])->assertSessionHasErrors(['nombre']);
    }

    public function test_pre_registro_por_whatsapp_que_falla_no_se_reporta_como_enviado(): void
    {
        // WhatsApp responde error: no debe quedar invitación huérfana ni un falso éxito.
        Http::fake(['*' => Http::response(['error' => 'down'], 500)]);

        $this->post('/admin/socios-comerciales/pre-registro', [
            'razon_social' => 'Socio SA', 'nombre_comercial' => 'Socio', 'pais_telefono_id' => $this->pais->id, 'telefono' => '5512345678',
        ])->assertSessionHasErrors('telefono');
        $this->assertDatabaseCount('productor_pre_registros', 0);

        $this->post('/admin/proveedores/pre-registro', [
            'nombre_comercial' => 'Prov', 'pais_telefono_id' => $this->pais->id, 'telefono' => '5512345678',
        ])->assertSessionHasErrors('telefono');
        $this->assertDatabaseCount('proveedor_pre_registros', 0);
    }

    public function test_el_pre_registro_publico_de_socio_comercial_ya_no_pide_campos_de_rancho(): void
    {
        $token = bin2hex(random_bytes(8));
        \App\Models\ProductorPreRegistro::create($this->tenant([
            'razon_social_rancho' => 'Socio SA', 'nombre_comercial_rancho' => 'Socio', 'pais_telefono_id' => $this->pais->id,
            'telefono' => '5512345678', 'token' => $token, 'expires_at' => now()->addHour(), 'status' => 'pendiente',
        ]));

        $this->get("/preregistro-productor/{$token}")->assertOk();

        $this->postJson("/preregistro-productor/{$token}", [
            'razon_social' => 'Socio SA', 'nombre_comercial' => 'Socio', 'responsable' => 'Juan', 'pais_telefono_id' => $this->pais->id,
            'telefono' => '5512345678', 'pais_id' => $this->pais->id,
            'empleados' => [['nombres' => 'Pedro', 'apellidos' => 'Ruiz', 'documento_identidad' => 'E-100']],
        ])->assertOk()->assertJson(['success' => true]);

        $this->assertDatabaseHas('productores', ['razon_social' => 'Socio SA', 'status' => 'en_revision']);
    }
}
