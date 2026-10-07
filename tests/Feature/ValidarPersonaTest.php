<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\KycValidacion;
use App\Models\Productor;
use App\Models\Sucursal;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/** Botón "Validar" de los listados. */
class ValidarPersonaTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        $this->seed(PermissionSeeder::class);
        Role::findOrCreate('admin', 'web')->syncPermissions(Permission::pluck('name')->reject(fn ($p) => str_starts_with($p, 'roles.'))->all());
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->empresa = Empresa::create(['razon_social' => 'Evolutel', 'documento' => 'EVO-1', 'status' => true]);
        $suc = Sucursal::create(['empresa_id' => $this->empresa->id, 'nombre' => 'Sede', 'status' => true]);
        $this->admin = User::factory()->create(['empresa_id' => $this->empresa->id, 'sucursal_id' => $suc->id]);
        $this->admin->assignRole('admin');
    }

    private function socio(array $extra = []): Productor
    {
        $pais = DB::table('pais')->insertGetId(['nombre' => 'México', 'codigo_iso2' => 'MX', 'codigo_iso3' => 'MEX', 'codigo_telefonico' => '+52', 'activo' => 1, 'created_at' => now(), 'updated_at' => now()]);

        $p = new Productor;
        $p->forceFill($extra + [
            'empresa_id' => $this->empresa->id, 'sucursal_id' => $this->admin->sucursal_id, 'razon_social' => 'Agro', 'nombre_comercial' => 'Agro', 'pais_id' => $pais,
            'documento_identidad' => 'D'.uniqid(), 'status' => 'activo', 'responsable' => 'René', 'curp' => 'PUMR731118HDFLRN08',
        ]);
        $p->saveQuietly();

        return $p;
    }

    public function test_it_reports_missing_evidence(): void
    {
        $p = $this->socio();

        $this->actingAs($this->admin)->post("/admin/validaciones/validar/socio-comercial/{$p->id}")
            ->assertRedirect()->assertSessionHas('notification.type', 'error');
        $this->assertSame(0, KycValidacion::withoutGlobalScopes()->count());
    }

    public function test_it_reports_when_company_has_no_validations(): void
    {
        Storage::disk('public')->put('x/f.jpg', 'img');
        $p = $this->socio(['foto' => 'x/f.jpg', 'documento_frontal' => 'x/f.jpg']);

        $this->actingAs($this->admin)->post("/admin/validaciones/validar/socio-comercial/{$p->id}")
            ->assertSessionHas('notification.type', 'error');
        $this->assertSame(0, KycValidacion::withoutGlobalScopes()->count());
    }

    public function test_it_starts_validation_with_stored_data_and_blocks_duplicates(): void
    {
        $this->empresa->forceFill(['jaak_active' => true, 'jaak_api_key' => 'k', 'jaak_environment' => 'sandbox'])->save();
        Storage::disk('public')->put('x/f.jpg', 'img');
        $p = $this->socio(['foto' => 'x/f.jpg', 'documento_frontal' => 'x/f.jpg']);

        $this->actingAs($this->admin)->post("/admin/validaciones/validar/socio-comercial/{$p->id}")
            ->assertSessionHas('notification.type', 'success');

        $kyc = KycValidacion::withoutGlobalScopes()->where('validable_id', $p->id)->firstOrFail();
        $this->assertSame('PUMR731118HDFLRN08', $kyc->curp_capturada);

        // Segundo clic con la primera aún en curso (sin red el job termina en error, así que se simula): no duplica
        $kyc->forceFill(['estatus' => KycValidacion::ESTATUS_PENDIENTE])->save();
        $this->actingAs($this->admin)->post("/admin/validaciones/validar/socio-comercial/{$p->id}")
            ->assertSessionHas('notification.type', 'error');
        $this->assertSame(1, KycValidacion::withoutGlobalScopes()->count());
    }

    public function test_other_company_gets_404_and_unknown_type_404(): void
    {
        $otra = Empresa::create(['razon_social' => 'Otra', 'documento' => 'O-1', 'status' => true]);
        $p = $this->socio(['empresa_id' => $otra->id]);

        $this->actingAs($this->admin)->post("/admin/validaciones/validar/socio-comercial/{$p->id}")->assertNotFound();
        $this->actingAs($this->admin)->post('/admin/validaciones/validar/nada/1')->assertNotFound();
    }

    public function test_responsable_and_proveedor_store_evidence_and_can_be_validated(): void
    {
        $this->empresa->forceFill(['jaak_active' => true, 'jaak_api_key' => 'k', 'jaak_environment' => 'sandbox'])->save();
        $pais = DB::table('pais')->insertGetId(['nombre' => 'México', 'codigo_iso2' => 'MX', 'codigo_iso3' => 'MEX', 'codigo_telefonico' => '+52', 'activo' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $img = fn (string $n) => \Illuminate\Http\UploadedFile::fake()->image($n, 100, 100);

        $this->actingAs($this->admin)->post('/admin/proveedores', [
            'razon_social' => 'Prov SA', 'nombre_comercial' => 'Prov', 'pais_id' => $pais, 'status' => 'activo',
            'responsable' => 'Ana Pérez', 'curp' => 'PEPA800101MDFRRN09',
            'foto' => $img('a.jpg'), 'documento_frontal' => $img('f.jpg'), 'tipo_documento' => 'ine',
        ])->assertSessionHasNoErrors();

        $prov = \App\Models\Proveedor::firstOrFail();
        Storage::disk('public')->assertExists($prov->foto);

        $this->actingAs($this->admin)->post("/admin/validaciones/validar/proveedor/{$prov->id}")
            ->assertSessionHas('notification.type', 'success');
        $kyc = KycValidacion::withoutGlobalScopes()->where('validable_id', $prov->id)->firstOrFail();
        $this->assertSame('PEPA800101MDFRRN09', $kyc->curp_capturada);
        $this->assertSame((new \App\Models\Proveedor)->getMorphClass(), $kyc->validable_type);

        $this->actingAs($this->admin)->post('/admin/responsables', [
            'nombres' => 'Luis', 'apellidos' => 'Gómez', 'empresa_id' => $this->empresa->id,
            'sucursal_id' => $this->admin->sucursal_id, 'user_id' => $this->admin->id, 'status' => 1,
            'curp' => 'GOLL800101HDFMRS01', 'foto' => $img('a.jpg'), 'documento_frontal' => $img('f.jpg'),
        ])->assertSessionHasNoErrors();

        $resp = \App\Models\Responsable::firstOrFail();
        Storage::disk('public')->assertExists($resp->documento_frontal);

        $this->actingAs($this->admin)->post("/admin/validaciones/validar/responsable/{$resp->id}")
            ->assertSessionHas('notification.type', 'success');
        $this->assertSame(2, KycValidacion::withoutGlobalScopes()->count());
    }
}
