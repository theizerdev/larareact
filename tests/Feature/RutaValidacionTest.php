<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\KycValidacion;
use App\Models\Productor;
use App\Models\Responsable;
use App\Models\Sucursal;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Caminos de validación (A: datos + INE, B: datos sin INE, C: pasaporte,
 * D: sin datos) según lo que tenga el registro. Sin salir a internet.
 */
class RutaValidacionTest extends TestCase
{
    use RefreshDatabase;

    private const RFC = 'CVE010203AB1';

    private const CURP = 'MAGR800101HDFRRB09';

    private Empresa $empresa;

    private User $admin;

    private int $pais;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Http::preventStrayRequests();
        $this->seed(PermissionSeeder::class);
        Role::findOrCreate('admin', 'web')->syncPermissions(Permission::pluck('name')->reject(fn ($p) => str_starts_with($p, 'roles.'))->all());
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->empresa = Empresa::create(['razon_social' => 'Evolutel', 'documento' => 'EVO-1', 'status' => true]);
        $suc = Sucursal::create(['empresa_id' => $this->empresa->id, 'nombre' => 'Sede', 'status' => true]);
        $this->admin = User::factory()->create(['empresa_id' => $this->empresa->id, 'sucursal_id' => $suc->id]);
        $this->admin->assignRole('admin');
        $this->pais = DB::table('pais')->insertGetId(['nombre' => 'México', 'codigo_iso2' => 'MX', 'codigo_iso3' => 'MEX', 'codigo_telefonico' => '+52', 'activo' => 1, 'created_at' => now(), 'updated_at' => now()]);
    }

    private function activar(): void
    {
        $this->empresa->forceFill([
            'truora_active' => true, 'truora_api_key' => 'tk-123',
            'didit_active' => true, 'didit_api_key' => 'dk-123', 'didit_workflow_id' => 'wf-1',
        ])->save();
    }

    private function socio(array $extra = []): Productor
    {
        $p = new Productor;
        $p->forceFill($extra + [
            'empresa_id' => $this->empresa->id, 'sucursal_id' => $this->admin->sucursal_id, 'razon_social' => 'Comercializadora Vertimex SA de CV',
            'nombre_comercial' => 'Vertimex', 'pais_id' => $this->pais, 'documento_identidad' => 'D'.uniqid(), 'status' => 'activo',
            'responsable' => 'Roberto Marcelino García Rubio', 'curp' => self::CURP, 'rfc' => self::RFC,
        ]);
        $p->saveQuietly();

        return $p;
    }

    private function responsable(array $extra = []): Responsable
    {
        $r = new Responsable;
        $r->forceFill($extra + [
            'empresa_id' => $this->empresa->id, 'sucursal_id' => $this->admin->sucursal_id, 'nombres' => 'Roberto Marcelino', 'apellidos' => 'García Rubio',
            'documento_identidad' => 'R'.uniqid(), 'user_id' => $this->admin->id,
        ]);
        $r->saveQuietly();

        return $r;
    }

    private function ruta(string $tipo, $registro): array
    {
        return $this->actingAs($this->admin)->getJson("/admin/validaciones/ruta/{$tipo}/{$registro->id}")->assertOk()->json();
    }

    public function test_route_a_data_plus_ine_runs_company_curp_and_full_identity(): void
    {
        $this->activar();
        $plan = $this->ruta('socio-comercial', $this->socio(['documento_frontal' => 'x/ine.jpg', 'foto' => 'x/foto.jpg']));

        $this->assertSame('A', $plan['ruta']);
        $this->assertSame(['rfc', 'curp', 'kyc'], array_column($plan['pasos'], 'clave'));
        $this->assertSame([], $plan['faltantes']);
    }

    public function test_route_b_data_without_ine_only_checks_renapo_and_asks_for_the_documents(): void
    {
        $this->activar();
        $plan = $this->ruta('responsable', $this->responsable(['curp' => self::CURP]));

        $this->assertSame('B', $plan['ruta']);
        $this->assertSame(['curp'], array_column($plan['pasos'], 'clave'));
        $this->assertSame([__('el INE y la foto')], $plan['faltantes']);

        $soloFoto = $this->ruta('responsable', $this->responsable(['curp' => self::CURP, 'documento_frontal' => 'x/ine.jpg']));
        $this->assertSame([__('la foto')], $soloFoto['faltantes']);
    }

    public function test_route_c_passport_skips_curp_and_route_d_without_data_asks_for_documents(): void
    {
        $this->activar();

        $pasaporte = $this->ruta('responsable', $this->responsable(['tipo_documento' => 'pasaporte', 'curp' => self::CURP]));
        $this->assertSame('C', $pasaporte['ruta']);
        $this->assertSame(['solicitar'], array_column($pasaporte['pasos'], 'clave'));

        $conPasaporte = $this->ruta('responsable', $this->responsable(['tipo_documento' => 'pasaporte', 'documento_frontal' => 'x/p.jpg', 'foto' => 'x/f.jpg']));
        $this->assertSame(['kyc'], array_column($conPasaporte['pasos'], 'clave'));

        $vacio = $this->ruta('responsable', $this->responsable());
        $this->assertSame('D', $vacio['ruta']);
        $this->assertSame(['solicitar'], array_column($vacio['pasos'], 'clave'));

        $conIne = $this->ruta('responsable', $this->responsable(['documento_frontal' => 'x/ine.jpg', 'foto' => 'x/f.jpg']));
        $this->assertSame('D', $conIne['ruta']);
        $this->assertSame(['kyc'], array_column($conIne['pasos'], 'clave'));
    }

    public function test_inactive_providers_are_dropped_with_a_notice(): void
    {
        $plan = $this->ruta('socio-comercial', $this->socio());

        $this->assertSame([], $plan['pasos']);
        $this->assertCount(2, $plan['avisos']);
    }

    public function test_auto_route_b_calls_truora_and_didit_once_each_and_never_jaak(): void
    {
        $this->activar();
        Http::fake([
            'api.checks.truora.com/v1/checks' => Http::response(['check' => ['check_id' => 'CHK1', 'status' => 'not_started']], 200),
            'api.checks.truora.com/*' => Http::response([], 200),
            'verification.didit.me/v3/database-validation/' => Http::response(['database_validation' => ['validations' => [[
                'outcome_code' => 'MATCH', 'source_data' => ['full_name' => 'ROBERTO MARCELINO GARCIA RUBIO', 'curp_status' => 'AN'],
            ]]]], 200),
        ]);
        $socio = $this->socio();

        $this->actingAs($this->admin)->from('/x')->post("/admin/validaciones/validar/socio-comercial/{$socio->id}", ['ruta' => 'auto'])
            ->assertRedirect('/x')
            ->assertSessionHas('notification', fn ($n) => str_contains($n['message'], __('Ruta :ruta (:titulo).', ['ruta' => 'B', 'titulo' => __('Datos sin INE')])) && str_contains($n['message'], 'RENAPO') && str_contains($n['message'], __('el INE y la foto')));

        $filas = KycValidacion::withoutGlobalScopes()->orderBy('id')->get();
        $this->assertEqualsCanonicalizing(['empresa_rfc', 'curp_renapo'], $filas->pluck('alcance')->all());
        $this->assertSame(1, $filas->where('alcance', 'curp_renapo')->where('estatus', 'aprobado')->count());
        Http::assertSent(fn ($r) => $r->url() === 'https://api.checks.truora.com/v1/checks' && $r['type'] === 'company');
        Http::assertSent(fn ($r) => str_contains($r->url(), 'database-validation') && $r['personal_number'] === self::CURP);
        Http::assertNotSent(fn ($r) => str_contains($r->url(), 'jaak'));
    }

    public function test_auto_route_d_without_documents_only_opens_the_didit_link(): void
    {
        $this->activar();
        Http::fake(['verification.didit.me/v3/session/' => Http::response(['session_id' => 'S1', 'url' => 'https://verify.didit.me/s/S1', 'status' => 'Not Started'], 201)]);
        $r = $this->responsable();

        $this->actingAs($this->admin)->from('/x')->post("/admin/validaciones/validar/responsable/{$r->id}", ['ruta' => 'auto'])
            ->assertSessionHas('notification', fn ($n) => str_contains($n['message'], __('Ruta :ruta (:titulo).', ['ruta' => 'D', 'titulo' => __('Sin datos: pedir INE y foto')])));

        $filas = KycValidacion::withoutGlobalScopes()->get();
        $this->assertCount(1, $filas);
        $this->assertSame('didit', $filas->first()->proveedor);
        $this->assertSame('https://verify.didit.me/s/S1', $filas->first()->didit_url);
        Http::assertSentCount(1);
    }

    public function test_route_endpoint_is_scoped_to_the_company_and_needs_permission(): void
    {
        $otra = Empresa::create(['razon_social' => 'Otra', 'documento' => 'OTR-1', 'status' => true]);
        $ajeno = new Responsable;
        $sucOtra = Sucursal::create(['empresa_id' => $otra->id, 'nombre' => 'Otra sede', 'status' => true]);
        $ajeno->forceFill(['empresa_id' => $otra->id, 'sucursal_id' => $sucOtra->id, 'nombres' => 'A', 'apellidos' => 'B', 'documento_identidad' => 'Z1', 'user_id' => $this->admin->id])->saveQuietly();

        $this->actingAs($this->admin)->getJson("/admin/validaciones/ruta/responsable/{$ajeno->id}")->assertNotFound();

        $sinPermiso = User::factory()->create(['empresa_id' => $this->empresa->id, 'sucursal_id' => $this->admin->sucursal_id]);
        $this->actingAs($sinPermiso)->getJson('/admin/validaciones/ruta/responsable/'.$this->responsable()->id)->assertForbidden();
    }
}
