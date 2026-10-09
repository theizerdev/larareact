<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\KycValidacion;
use App\Models\Proveedor;
use App\Models\ProveedorEmpleado;
use App\Models\Responsable;
use App\Models\Sucursal;
use App\Models\User;
use App\Models\VisitaTemporal;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Validaciones manuales: ningún alta ni pre-registro valida solo; la identidad
 * se valida al guardar sólo si el usuario lo pidió ("validar_identidad").
 * Sin red: cualquier llamada a un proveedor responde 500.
 */
class ValidacionesManualesTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    private User $admin;

    private int $pais;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Http::preventStrayRequests();
        Http::fake(['*' => Http::response(['error' => 'sin red en pruebas'], 500)]);

        $this->seed(PermissionSeeder::class);
        Role::findOrCreate('admin', 'web')->syncPermissions(Permission::pluck('name')->reject(fn ($p) => str_starts_with($p, 'roles.'))->all());
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        // Empresa con TODO activo: si algo se disparara solo, aquí se notaría.
        $this->empresa = Empresa::create(['razon_social' => 'Evolutel', 'documento' => 'EVO-1', 'status' => true]);
        $this->empresa->forceFill([
            'jaak_active' => true, 'jaak_api_key' => 'k', 'jaak_environment' => 'sandbox',
            'didit_active' => true, 'didit_api_key' => 'd',
            'truora_active' => true, 'truora_api_key' => 't',
        ])->save();
        $suc = Sucursal::create(['empresa_id' => $this->empresa->id, 'nombre' => 'Sede', 'status' => true]);
        $this->admin = User::factory()->create(['empresa_id' => $this->empresa->id, 'sucursal_id' => $suc->id]);
        $this->admin->assignRole('admin');
        $this->pais = DB::table('pais')->insertGetId(['nombre' => 'México', 'codigo_iso2' => 'MX', 'codigo_iso3' => 'MEX', 'codigo_telefonico' => '+52', 'activo' => 1, 'created_at' => now(), 'updated_at' => now()]);
    }

    private function img(string $n = 'a.jpg'): UploadedFile
    {
        return UploadedFile::fake()->image($n, 100, 100);
    }

    private function proveedor(array $extra = []): array
    {
        return $extra + [
            'razon_social' => 'Prov SA', 'nombre_comercial' => 'Prov', 'pais_id' => $this->pais, 'status' => 'activo',
            'responsable' => 'Ana Pérez', 'curp' => 'PEPA800101MDFRRN09', 'rfc' => 'PSA010101AB1',
            'foto' => $this->img(), 'documento_frontal' => $this->img('f.jpg'), 'tipo_documento' => 'ine',
        ];
    }

    private function responsable(array $extra = []): array
    {
        return $extra + [
            'nombres' => 'Luis', 'apellidos' => 'Gómez', 'empresa_id' => $this->empresa->id,
            'sucursal_id' => $this->admin->sucursal_id, 'user_id' => $this->admin->id, 'status' => 1,
            'curp' => 'GOLL800101HDFMRS01', 'foto' => $this->img(), 'documento_frontal' => $this->img('f.jpg'),
        ];
    }

    private function kyc(): int
    {
        return KycValidacion::withoutGlobalScopes()->count();
    }

    public function test_altas_with_photo_and_ine_do_not_validate_unless_asked(): void
    {
        $this->actingAs($this->admin)->post('/admin/proveedores', $this->proveedor())->assertSessionHasNoErrors();
        $this->actingAs($this->admin)->post('/admin/responsables', $this->responsable())->assertSessionHasNoErrors();

        $prov = Proveedor::firstOrFail();
        $this->actingAs($this->admin)->post("/admin/proveedores/{$prov->id}/empleados", [
            'nombres' => 'Eva', 'apellidos' => 'Ruiz', 'documento_identidad' => 'E1',
            'foto_carnet' => $this->img(), 'documento_frontal' => $this->img('f.jpg'),
        ], ['Accept' => 'application/json'])->assertCreated()->assertJsonPath('aviso_identidad', null);

        $this->assertSame(0, $this->kyc());
        $this->assertNull($prov->fresh()->kyc_estatus);
        Http::assertNothingSent();
    }

    public function test_asked_identity_runs_once_on_save_and_reports_it(): void
    {
        $this->actingAs($this->admin)->post('/admin/proveedores', $this->proveedor(['validar_identidad' => '1']))
            ->assertSessionHasNoErrors()
            ->assertSessionHas('notification.message', __('Validación de identidad iniciada: el resultado llega a Resultados de validaciones.'));

        $prov = Proveedor::firstOrFail();
        $kyc = KycValidacion::withoutGlobalScopes()->where('validable_id', $prov->id)->sole();
        $this->assertSame((new Proveedor)->getMorphClass(), $kyc->validable_type);
        $this->assertSame(KycValidacion::PROVEEDOR_JAAK, $kyc->proveedor);
        $this->assertSame('PEPA800101MDFRRN09', $kyc->curp_capturada);

        $this->actingAs($this->admin)->post("/admin/proveedores/{$prov->id}/empleados", [
            'nombres' => 'Eva', 'apellidos' => 'Ruiz', 'documento_identidad' => 'E1', 'validar_identidad' => '1',
            'foto_carnet' => $this->img(), 'documento_frontal' => $this->img('f.jpg'),
        ], ['Accept' => 'application/json'])->assertCreated()
            ->assertJsonPath('aviso_identidad', __('Validación de identidad iniciada: el resultado llega a Resultados de validaciones.'));

        $emp = ProveedorEmpleado::firstOrFail();
        $this->assertSame(1, KycValidacion::withoutGlobalScopes()->where('validable_type', $emp->getMorphClass())->where('validable_id', $emp->id)->count());
        // Pedir identidad no dispara RFC ni CURP (esos son sus propios botones).
        $this->assertSame(0, KycValidacion::withoutGlobalScopes()->whereNotNull('alcance')->count());
        $this->assertSame(2, $this->kyc());
    }

    public function test_asked_identity_without_photo_or_ine_explains_and_charges_nothing(): void
    {
        $this->actingAs($this->admin)->post('/admin/responsables', $this->responsable(['foto' => null, 'validar_identidad' => '1']))
            ->assertSessionHasNoErrors()
            ->assertSessionHas('notification.message', __('Responsible created successfully.').' '.__('No se validó la identidad: falta el INE (o pasaporte) o la foto.'));

        $this->assertSame(1, Responsable::count());
        $this->assertSame(0, $this->kyc());
        Http::assertNothingSent();
    }

    public function test_user_without_validation_permission_cannot_trigger_it(): void
    {
        $capturista = User::factory()->create(['empresa_id' => $this->empresa->id, 'sucursal_id' => $this->admin->sucursal_id]);
        $capturista->givePermissionTo(['proveedores.view', 'proveedores.create']);
        $this->assertFalse($capturista->can('validaciones.manage'));

        $this->actingAs($capturista)->post('/admin/proveedores', $this->proveedor(['validar_identidad' => '1']))
            ->assertSessionHasNoErrors()
            ->assertSessionHas('notification.message', __('No tienes permiso para validar.'));

        $this->assertSame(1, Proveedor::count());
        $this->assertSame(0, $this->kyc());
    }

    public function test_public_pre_registro_does_not_validate(): void
    {
        $pre = new \App\Models\VisitaTemporalPreRegistro;
        $pre->forceFill([
            'nombres' => 'Iván', 'apellidos' => 'Soto', 'telefono' => '5512345678', 'token' => 'tok-manual',
            'expires_at' => now()->addDay(), 'empresa_id' => $this->empresa->id, 'sucursal_id' => $this->admin->sucursal_id, 'status' => 'pendiente',
        ])->saveQuietly();

        $png = 'data:image/png;base64,'.base64_encode(UploadedFile::fake()->image('x.png', 20, 20)->getContent());

        $this->post('/preregistro-visita/tok-manual', [
            'documento_identidad' => 'V1', 'curp' => 'SOTI800101HDFTVN01',
            'fecha_ingreso' => now()->toDateString(), 'hora_ingreso' => '09:00',
            'fecha_salida' => now()->toDateString(), 'hora_salida' => '18:00',
            'foto_carnet' => $png, 'foto_documento' => $png,
        ])->assertSessionHasNoErrors();

        $visita = VisitaTemporal::withoutGlobalScopes()->firstOrFail();
        $this->assertNotNull($visita->foto_documento);
        $this->assertSame(0, $this->kyc());
        Http::assertNothingSent();
    }

    public function test_automatic_switch_restores_the_previous_behavior(): void
    {
        config(['validaciones.automaticas' => true]);

        // Antes, los colaboradores de proveedor validaban solos al darse de alta...
        $this->actingAs($this->admin)->post('/admin/proveedores', $this->proveedor())->assertSessionHasNoErrors();
        $prov = Proveedor::firstOrFail();
        $this->actingAs($this->admin)->post("/admin/proveedores/{$prov->id}/empleados", [
            'nombres' => 'Eva', 'apellidos' => 'Ruiz', 'documento_identidad' => 'E1',
            'foto_carnet' => $this->img(), 'documento_frontal' => $this->img('f.jpg'),
        ], ['Accept' => 'application/json'])->assertCreated();

        // ...y el proveedor nunca lo hizo: sigue igual.
        $this->assertSame(1, $this->kyc());
        $this->assertSame((new ProveedorEmpleado)->getMorphClass(), KycValidacion::withoutGlobalScopes()->sole()->validable_type);
    }
}
