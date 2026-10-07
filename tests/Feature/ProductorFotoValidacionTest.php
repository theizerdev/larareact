<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\KycValidacion;
use App\Models\OperacionValidacion;
use App\Models\Productor;
use App\Models\ProductorEmpleado;
use App\Models\Sucursal;
use App\Models\User;
use App\Models\ValidacionRegla;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Socio comercial: foto (subir, cambiar, quitar) y datos de identidad que
 * alimentan las validaciones (JaaK / Didit / ZapSign).
 */
class ProductorFotoValidacionTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    private Sucursal $sucursal;

    private int $pais;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        $this->seed(PermissionSeeder::class);
        Role::findOrCreate('admin', 'web')->syncPermissions(Permission::pluck('name')->reject(fn ($p) => str_starts_with($p, 'roles.'))->all());
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->empresa = Empresa::create(['razon_social' => 'Evolutel', 'documento' => 'EVO-1', 'status' => true]);
        $this->sucursal = Sucursal::create(['empresa_id' => $this->empresa->id, 'nombre' => 'Sede', 'status' => true]);
        $this->pais = DB::table('pais')->insertGetId(['nombre' => 'México', 'codigo_iso2' => 'MX', 'codigo_iso3' => 'MEX', 'codigo_telefonico' => '+52', 'activo' => 1, 'created_at' => now(), 'updated_at' => now()]);
    }

    private function admin(?Empresa $e = null): User
    {
        $e ??= $this->empresa;
        $suc = $e->is($this->empresa) ? $this->sucursal : Sucursal::create(['empresa_id' => $e->id, 'nombre' => 'Otra', 'status' => true]);
        $u = User::factory()->create(['empresa_id' => $e->id, 'sucursal_id' => $suc->id]);
        $u->assignRole('admin');

        return $u;
    }

    private function datos(array $extra = []): array
    {
        // $extra va primero: con `+` gana la clave de la izquierda.
        return $extra + [
            'razon_social' => 'Agro SA', 'nombre_comercial' => 'Agro', 'pais_id' => $this->pais,
            'status' => 'activo', 'responsable' => 'René Pulido', 'curp' => 'PUMR731118HDFLRN08',
        ];
    }

    private function imagen(string $nombre = 'a.jpg'): UploadedFile
    {
        return UploadedFile::fake()->image($nombre, 200, 200);
    }

    public function test_it_creates_with_photo_and_documents(): void
    {
        $this->actingAs($this->admin())->post('/admin/socios-comerciales', $this->datos([
            'correo' => 'rene@agro.mx', 'foto' => $this->imagen(), 'documento_frontal' => $this->imagen('f.jpg'), 'documento_reverso' => $this->imagen('r.jpg'),
        ]))->assertRedirect()->assertSessionHasNoErrors();

        $p = Productor::firstOrFail();
        $this->assertSame('rene@agro.mx', $p->correo);
        foreach (['foto', 'documento_frontal', 'documento_reverso'] as $campo) {
            $this->assertNotEmpty($p->{$campo});
            Storage::disk('public')->assertExists($p->{$campo});
        }
        // Campos que son solo del formulario no llegan al modelo
        $this->assertNull($p->kyc_estatus);
    }

    public function test_it_creates_without_photo_as_before(): void
    {
        $this->actingAs($this->admin())->post('/admin/socios-comerciales', $this->datos())->assertSessionHasNoErrors();

        $this->assertNull(Productor::firstOrFail()->foto);
        $this->assertSame(0, KycValidacion::withoutGlobalScopes()->count());
    }

    public function test_update_replaces_the_old_photo_and_can_remove_it(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post('/admin/socios-comerciales', $this->datos(['foto' => $this->imagen()]));
        $p = Productor::firstOrFail();
        $vieja = $p->foto;

        // Cambiar (PUT por POST con _method, como lo manda el formulario)
        $this->actingAs($admin)->post("/admin/socios-comerciales/{$p->id}", $this->datos(['_method' => 'put', 'foto' => $this->imagen('b.jpg')]))
            ->assertSessionHasNoErrors();
        $p->refresh();
        $this->assertNotSame($vieja, $p->foto);
        Storage::disk('public')->assertMissing($vieja);
        Storage::disk('public')->assertExists($p->foto);

        // Sin archivo nuevo, se conserva
        $conservada = $p->foto;
        $this->actingAs($admin)->post("/admin/socios-comerciales/{$p->id}", $this->datos(['_method' => 'put', 'nombre_comercial' => 'Agro 2']));
        $this->assertSame($conservada, $p->fresh()->foto);

        // Quitar
        $this->actingAs($admin)->post("/admin/socios-comerciales/{$p->id}", $this->datos(['_method' => 'put', 'quitar_foto' => '1']));
        $this->assertNull($p->fresh()->foto);
        Storage::disk('public')->assertMissing($conservada);
    }

    public function test_only_real_images_are_accepted(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->post('/admin/socios-comerciales', $this->datos(['foto' => UploadedFile::fake()->create('x.pdf', 10, 'application/pdf')]))
            ->assertSessionHasErrors('foto');
        $this->actingAs($admin)->post('/admin/socios-comerciales', $this->datos(['foto' => UploadedFile::fake()->createWithContent('x.svg', '<svg onload="alert(1)"/>')]))
            ->assertSessionHasErrors('foto');
        $this->actingAs($admin)->post('/admin/socios-comerciales', $this->datos(['foto' => UploadedFile::fake()->image('big.jpg')->size(9000)]))
            ->assertSessionHasErrors('foto');
        $this->actingAs($admin)->post('/admin/socios-comerciales', $this->datos(['correo' => 'no-es-correo']))
            ->assertSessionHasErrors('correo');
        $this->assertSame(0, Productor::count());
    }

    public function test_an_admin_cannot_touch_the_partner_of_another_company(): void
    {
        $ajena = Empresa::create(['razon_social' => 'Otra', 'documento' => 'OTR-1', 'status' => true]);
        $suc = Sucursal::create(['empresa_id' => $ajena->id, 'nombre' => 'X', 'status' => true]);
        $p = Productor::withoutGlobalScopes()->create($this->datos(['empresa_id' => $ajena->id, 'sucursal_id' => $suc->id, 'documento_identidad' => 'X1']));

        $this->actingAs($this->admin())->post("/admin/socios-comerciales/{$p->id}", $this->datos(['_method' => 'put', 'foto' => $this->imagen()]))
            ->assertNotFound();
        $this->assertNull($p->fresh()->foto);
    }

    public function test_validations_start_with_photo_and_document_and_open_a_folio(): void
    {
        $this->empresa->forceFill(['jaak_active' => true, 'jaak_api_key' => 'k', 'jaak_environment' => 'sandbox'])->save();
        $admin = $this->admin();

        // Sin documento no se lanza nada (no hay con qué validar)
        $this->actingAs($admin)->post('/admin/socios-comerciales', $this->datos(['foto' => $this->imagen()]));
        $this->assertSame(0, KycValidacion::withoutGlobalScopes()->count());

        $this->actingAs($admin)->post('/admin/socios-comerciales', $this->datos([
            'razon_social' => 'Agro 2', 'documento_identidad' => 'D2',
            'foto' => $this->imagen(), 'documento_frontal' => $this->imagen('f.jpg'), 'tipo_documento' => 'ine',
        ]));

        $p = Productor::where('razon_social', 'Agro 2')->firstOrFail();
        $kyc = KycValidacion::withoutGlobalScopes()->where('validable_id', $p->id)->firstOrFail();
        $this->assertSame((new Productor)->getMorphClass(), $kyc->validable_type);
        $this->assertSame('PUMR731118HDFLRN08', $kyc->curp_capturada);
        $this->assertSame($p->empresa_id, $kyc->empresa_id);
        // El job corre tras la respuesta; sin red en la prueba termina en 'error', en producción en el resultado real.
        $this->assertContains($p->fresh()->kyc_estatus, ['pendiente', 'error']);
        $this->assertStringStartsWith('SOC-', OperacionValidacion::withoutGlobalScopes()->findOrFail($kyc->operacion_id)->folio);
    }

    public function test_follow_up_applies_to_the_partner_but_not_to_its_collaborators(): void
    {
        $regla = new ValidacionRegla(['entidad' => 'socios']);

        $this->assertTrue($regla->conSeguimiento());
        $this->assertTrue($regla->seguimientoPara(new Productor));
        $this->assertFalse($regla->seguimientoPara(new ProductorEmpleado));
        $this->assertTrue((new ValidacionRegla(['entidad' => 'colaboradores']))->seguimientoPara(new \App\Models\Empleado));
        $this->assertFalse((new ValidacionRegla(['entidad' => 'proveedores']))->seguimientoPara(new \App\Models\Proveedor));
    }
}
