<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\KycValidacion;
use App\Models\OperacionValidacion;
use App\Models\Prevalidacion;
use App\Models\Productor;
use App\Models\Proveedor;
use App\Models\Responsable;
use App\Models\Sucursal;
use App\Models\User;
use App\Services\Validaciones\ValidacionRapida;
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
 * Validaciones sin foto: RFC de la empresa (TRUORA, check type=company) y
 * nombre + CURP de la persona (DIDIT → RENAPO), desde el formulario de alta y
 * desde el submenú Validar. Las respuestas de las APIs siguen la forma que
 * documentan TRUORA y DIDIT.
 */
class ValidacionRapidaTest extends TestCase
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
        Http::preventStrayRequests(); // ninguna prueba sale a internet
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
            'truora_active' => true, 'truora_api_key' => 'tk-123', 'truora_score_minimo' => 0.8,
            'didit_active' => true, 'didit_api_key' => 'dk-123',
        ])->save();
    }

    /** Respuesta de POST /v3/database-validation/ para mex_curp, como la documenta DIDIT. */
    private function renapo(string $codigo, array $fuente = []): array
    {
        return [
            'request_id' => 'req-1',
            'database_validation' => [
                'status' => $codigo === 'MATCH' ? 'Approved' : 'Declined',
                'issuing_state' => 'MEX',
                'match_type' => $codigo === 'MATCH' ? 'full_match' : 'no_match',
                'validations' => [[
                    'service_id' => 'mex_curp',
                    'service_name' => 'Mexico - CURP verification',
                    'outcome_code' => $codigo,
                    'source_data' => $fuente,
                    'validation' => ['identification_number' => $codigo === 'MATCH' ? 'full_match' : 'no_match'],
                ]],
            ],
        ];
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

    // ------------------------------------------------------------------
    // Formulario de alta: CURP + nombre (DIDIT → RENAPO)
    // ------------------------------------------------------------------

    public function test_curp_matching_renapo_name_is_approved_and_request_follows_didit_contract(): void
    {
        $this->activar();
        Http::fake(['verification.didit.me/v3/database-validation/' => Http::response($this->renapo('MATCH', [
            'full_name' => 'ROBERTO MARCELINO GARCIA RUBIO', 'curp_status' => 'AN',
        ]), 200)]);

        $this->actingAs($this->admin)->postJson('/admin/validaciones/previa/curp', [
            'curp' => strtolower(self::CURP), 'nombre' => '  Roberto Marcelino  García Rubio ', 'entidad' => 'proveedor',
        ])->assertOk()->assertJson(['estatus' => 'aprobado', 'finalizada' => true]);

        Http::assertSent(fn ($r) => $r->method() === 'POST'
            && $r->hasHeader('x-api-key', 'dk-123')
            && $r['issuing_state'] === 'MEX'
            && $r['services'] === ['mex_curp']
            && $r['personal_number'] === self::CURP
            && str_starts_with($r['vendor_data'], 'hosho:previa:'));

        $pre = Prevalidacion::withoutGlobalScopes()->firstOrFail();
        $this->assertSame($this->empresa->id, $pre->empresa_id);
        $this->assertSame('didit', $pre->proveedor);
    }

    public function test_curp_with_other_name_is_rejected_and_partial_name_goes_to_review(): void
    {
        $this->activar();
        Http::fake(['*' => Http::response($this->renapo('MATCH', ['first_name' => 'MARIA', 'last_name' => 'GARCIA RUBIO']), 200)]);

        $this->actingAs($this->admin)->postJson('/admin/validaciones/previa/curp', ['curp' => self::CURP, 'nombre' => 'Roberto García Rubio'])
            ->assertOk()->assertJson(['estatus' => 'rechazado'])
            ->assertJsonPath('observaciones', fn ($o) => str_contains($o, 'NO corresponde') && str_contains($o, 'MARIA GARCIA RUBIO'));

        // Sólo falta el segundo apellido: revisión, no rechazo.
        $this->assertSame('parcial', ValidacionRapida::compararNombres('María García', 'MARIA GARCIA RUBIO'));
        $this->assertSame('igual', ValidacionRapida::compararNombres('José de la Cruz Pérez', 'JOSE CRUZ PEREZ'));
        $this->assertSame('distinto', ValidacionRapida::compararNombres('Juan Pérez López', 'MARIA PEREZ LOPEZ'));
    }

    public function test_curp_not_found_deceased_and_registry_down(): void
    {
        $this->activar();
        Http::fake(['*' => Http::sequence()
            ->push($this->renapo('DOCUMENT_NOT_FOUND'), 200)
            ->push($this->renapo('MATCH', ['full_name' => 'ROBERTO GARCIA', 'curp_status' => 'BD']), 200)
            ->push(['validation_errors' => [['code' => 'empty_provider_response', 'retryable' => true]]], 502)]);

        $this->actingAs($this->admin)->postJson('/admin/validaciones/previa/curp', ['curp' => self::CURP, 'nombre' => 'Roberto García'])
            ->assertJson(['estatus' => 'rechazado', 'observaciones' => 'La CURP no existe en RENAPO.']);

        Prevalidacion::query()->update(['created_at' => now()->subHour()]); // que no reutilice la anterior
        $this->actingAs($this->admin)->postJson('/admin/validaciones/previa/curp', ['curp' => self::CURP, 'nombre' => 'Roberto García'])
            ->assertJson(['estatus' => 'rechazado'])->assertJsonPath('observaciones', fn ($o) => str_contains($o, 'defunción'));

        Prevalidacion::query()->update(['created_at' => now()->subHour()]);
        $this->actingAs($this->admin)->postJson('/admin/validaciones/previa/curp', ['curp' => self::CURP, 'nombre' => 'Roberto García'])
            ->assertJson(['estatus' => 'error'])->assertJsonPath('error_detalle', fn ($e) => str_contains($e, 'RENAPO no respondió'));
    }

    public function test_double_click_reuses_the_same_query_and_does_not_charge_twice(): void
    {
        $this->activar();
        Http::fake(['*' => Http::response($this->renapo('MATCH', ['full_name' => 'ROBERTO GARCIA']), 200)]);

        $a = $this->actingAs($this->admin)->postJson('/admin/validaciones/previa/curp', ['curp' => self::CURP, 'nombre' => 'Roberto García'])->json('id');
        $b = $this->actingAs($this->admin)->postJson('/admin/validaciones/previa/curp', ['curp' => self::CURP, 'nombre' => 'roberto garcia'])->json('id');

        $this->assertSame($a, $b);
        Http::assertSentCount(1);

        // Probar otro nombre y regresar al primero no vuelve a cobrar el primero.
        $this->actingAs($this->admin)->postJson('/admin/validaciones/previa/curp', ['curp' => self::CURP, 'nombre' => 'Pedro Gómez'])->assertOk();
        $c = $this->actingAs($this->admin)->postJson('/admin/validaciones/previa/curp', ['curp' => self::CURP, 'nombre' => 'Roberto García'])->json('id');
        $this->assertSame($a, $c);
        Http::assertSentCount(2);
    }

    public function test_bad_format_and_inactive_provider_are_explained_without_calling_apis(): void
    {
        Http::fake();

        $this->actingAs($this->admin)->postJson('/admin/validaciones/previa/curp', ['curp' => 'XXXX', 'nombre' => 'Roberto García'])
            ->assertStatus(422)->assertJsonPath('message', fn ($m) => str_contains($m, 'CURP'));
        $this->actingAs($this->admin)->postJson('/admin/validaciones/previa/curp', ['curp' => self::CURP, 'nombre' => 'Roberto García'])
            ->assertStatus(422)->assertJsonPath('message', fn ($m) => str_contains($m, 'DIDIT no está activo'));
        $this->actingAs($this->admin)->postJson('/admin/validaciones/previa/rfc', ['rfc' => 'ABC'])
            ->assertStatus(422)->assertJsonPath('message', fn ($m) => str_contains($m, 'RFC'));
        $this->actingAs($this->admin)->postJson('/admin/validaciones/previa/rfc', ['rfc' => self::RFC])
            ->assertStatus(422)->assertJsonPath('message', fn ($m) => str_contains($m, 'TRUORA no está activo'));

        Http::assertNothingSent();
        $this->assertSame(0, Prevalidacion::withoutGlobalScopes()->count());
    }

    // ------------------------------------------------------------------
    // Formulario de alta: RFC (TRUORA, check de empresa)
    // ------------------------------------------------------------------

    public function test_rfc_opens_a_company_check_and_polling_returns_the_verdict(): void
    {
        $this->activar();
        Http::fake([
            'api.checks.truora.com/v1/checks' => Http::response(['check' => ['check_id' => 'CHKEMP', 'status' => 'not_started', 'score' => -1, 'type' => 'company']], 200),
            'api.checks.truora.com/v1/checks/CHKEMP/details' => Http::response(['details' => []], 200),
            'api.checks.truora.com/v1/checks/CHKEMP' => Http::sequence()
                ->push(['check' => ['check_id' => 'CHKEMP', 'status' => 'in_progress', 'score' => -1]], 200)
                ->push(['check' => ['check_id' => 'CHKEMP', 'status' => 'completed', 'score' => 0.93]], 200),
        ]);

        $id = $this->actingAs($this->admin)->postJson('/admin/validaciones/previa/rfc', [
            'rfc' => ' cve-010203-ab1 ', 'razon_social' => 'Comercializadora Vertimex SA de CV', 'entidad' => 'proveedor',
        ])->assertOk()->assertJson(['estatus' => 'pendiente', 'finalizada' => false])->json('id');

        Http::assertSent(fn ($r) => $r->method() === 'POST' && $r->url() === 'https://api.checks.truora.com/v1/checks'
            && $r->hasHeader('Truora-API-Key', 'tk-123')
            && str_contains($r->header('Content-Type')[0], 'application/x-www-form-urlencoded')
            && $r['type'] === 'company' && $r['country'] === 'MX' && $r['tax_id'] === self::RFC
            && $r['company_name'] === 'Comercializadora Vertimex SA de CV' && $r['user_authorized'] === 'true');

        \Illuminate\Support\Facades\Cache::flush(); // el freno de 10 s entre consultas
        $this->actingAs($this->admin)->getJson("/admin/validaciones/previa/{$id}")
            ->assertOk()->assertJson(['estatus' => 'aprobado', 'finalizada' => true, 'score' => 0.93]);
    }

    public function test_prevalidation_of_another_company_is_not_visible(): void
    {
        $otra = Empresa::create(['razon_social' => 'Otra', 'documento' => 'O-1', 'status' => true]);
        $pre = Prevalidacion::withoutGlobalScopes()->create([
            'empresa_id' => $otra->id, 'tipo' => 'rfc', 'proveedor' => 'truora', 'dato' => self::RFC, 'estatus' => 'pendiente',
        ]);

        $this->actingAs($this->admin)->getJson("/admin/validaciones/previa/{$pre->id}")->assertNotFound();
        // Tampoco puede elegir otra empresa en el formulario.
        $this->activar();
        $this->actingAs($this->admin)->postJson('/admin/validaciones/previa/rfc', ['rfc' => self::RFC, 'empresa_id' => $otra->id])
            ->assertStatus(422)->assertJsonPath('message', fn ($m) => str_contains($m, 'empresa'));
    }

    public function test_user_without_permission_cannot_validate(): void
    {
        $user = User::factory()->create(['empresa_id' => $this->empresa->id]);
        $this->actingAs($user)->postJson('/admin/validaciones/previa/curp', ['curp' => self::CURP, 'nombre' => 'Roberto García'])->assertForbidden();
    }

    // ------------------------------------------------------------------
    // Al guardar: la validación del formulario pasa al registro y a su folio
    // ------------------------------------------------------------------

    public function test_saving_the_proveedor_attaches_form_validations_to_its_folio(): void
    {
        $this->activar();
        Http::fake([
            'verification.didit.me/*' => Http::response($this->renapo('MATCH', ['full_name' => 'ANA PEREZ GOMEZ']), 200),
            'api.checks.truora.com/v1/checks' => Http::response(['check' => ['check_id' => 'CHKP1', 'status' => 'not_started']], 200),
            'api.checks.truora.com/v1/checks/CHKP1/details' => Http::response([], 200),
            // Al abrirla y al guardar sigue en curso; al abrir Resultados ya terminó.
            'api.checks.truora.com/v1/checks/CHKP1' => Http::sequence()
                ->push(['check' => ['check_id' => 'CHKP1', 'status' => 'in_progress']], 200)
                ->push(['check' => ['check_id' => 'CHKP1', 'status' => 'in_progress']], 200)
                ->push(['check' => ['check_id' => 'CHKP1', 'status' => 'completed', 'score' => 0.5]], 200),
        ]);
        $curp = 'PEGA800101MDFRMN05';

        $this->actingAs($this->admin)->postJson('/admin/validaciones/previa/rfc', ['rfc' => self::RFC, 'razon_social' => 'Prov SA'])->assertOk();
        $this->actingAs($this->admin)->postJson('/admin/validaciones/previa/curp', ['curp' => $curp, 'nombre' => 'Ana Pérez Gómez'])->assertOk();

        $this->actingAs($this->admin)->post('/admin/proveedores', [
            'razon_social' => 'Prov SA', 'nombre_comercial' => 'Prov', 'pais_id' => $this->pais, 'status' => 'activo',
            'rfc' => self::RFC, 'responsable' => 'Ana Pérez Gómez', 'curp' => $curp,
        ])->assertSessionHasNoErrors();

        $prov = Proveedor::firstOrFail();
        $filas = KycValidacion::withoutGlobalScopes()->where('validable_id', $prov->id)->orderBy('id')->get();

        $this->assertCount(2, $filas);
        $empresa = $filas->firstWhere('alcance', KycValidacion::ALCANCE_EMPRESA);
        $persona = $filas->firstWhere('alcance', KycValidacion::ALCANCE_CURP);
        $this->assertSame(['truora', 'CHKP1', 'pendiente', self::RFC], [$empresa->proveedor, $empresa->truora_check_id, $empresa->estatus, $empresa->dato_consultado]);
        $this->assertSame(['didit', 'aprobado', $curp], [$persona->proveedor, $persona->estatus, $persona->curp_capturada]);
        $this->assertTrue($persona->curp_valida);

        // Mismo folio PRV, y la prevalidación queda consumida.
        $this->assertNotNull($empresa->operacion_id);
        $this->assertSame($empresa->operacion_id, $persona->operacion_id);
        $this->assertStringStartsWith('PRV-', OperacionValidacion::withoutGlobalScopes()->find($empresa->operacion_id)->folio);
        $this->assertSame(0, Prevalidacion::withoutGlobalScopes()->whereNull('kyc_validacion_id')->count());
        $this->assertSame('pendiente', $prov->fresh()->kyc_estatus); // la de TRUORA sigue en curso

        // Resultados de validaciones muestra ambas con su alcance y sincroniza la pendiente.
        $this->actingAs($this->admin)->get('/admin/validaciones')->assertOk()
            ->assertInertia(fn ($p) => $p->where('validaciones.data.0.alcance', 'empresa_rfc')
                ->where('validaciones.data.0.persona_nombre', 'Prov SA')
                ->where('validaciones.data.0.estatus', 'revision'));
        $this->assertSame('revision', $prov->fresh()->kyc_estatus);
    }

    public function test_form_validation_with_other_data_is_not_attached(): void
    {
        $this->activar();
        Http::fake(['*' => Http::response($this->renapo('MATCH', ['full_name' => 'LUIS GOMEZ']), 200)]);

        $this->actingAs($this->admin)->postJson('/admin/validaciones/previa/curp', ['curp' => 'GOLL800101HDFMRS01', 'nombre' => 'Luis Gómez'])->assertOk();

        // Se guardó con otro nombre: la validación no le corresponde.
        $this->actingAs($this->admin)->post('/admin/responsables', [
            'nombres' => 'Pedro', 'apellidos' => 'Gómez', 'empresa_id' => $this->empresa->id,
            'sucursal_id' => $this->admin->sucursal_id, 'user_id' => $this->admin->id, 'status' => 1, 'curp' => 'GOLL800101HDFMRS01',
        ])->assertSessionHasNoErrors();
        $this->assertSame(0, KycValidacion::withoutGlobalScopes()->count());

        // Con el mismo nombre (otra captura del mismo responsable) sí.
        $this->actingAs($this->admin)->post('/admin/responsables', [
            'nombres' => 'Luis', 'apellidos' => 'Gómez', 'empresa_id' => $this->empresa->id,
            'sucursal_id' => $this->admin->sucursal_id, 'user_id' => $this->admin->id, 'status' => 1, 'curp' => 'GOLL800101HDFMRS01',
        ])->assertSessionHasNoErrors();
        $kyc = KycValidacion::withoutGlobalScopes()->sole();
        $this->assertSame((new Responsable)->getMorphClass(), $kyc->validable_type);
        $this->assertSame('aprobado', Responsable::where('nombres', 'Luis')->value('kyc_estatus'));
    }

    // ------------------------------------------------------------------
    // Submenú Validar de un registro ya guardado
    // ------------------------------------------------------------------

    public function test_submenu_rfc_and_curp_on_saved_socio(): void
    {
        $this->activar();
        Http::fake([
            'api.checks.truora.com/v1/checks' => Http::response(['check' => ['check_id' => 'CHKS', 'status' => 'not_started']], 200),
            'verification.didit.me/*' => Http::response($this->renapo('MATCH', ['full_name' => 'ROBERTO MARCELINO GARCIA RUBIO']), 200),
        ]);
        $p = $this->socio();

        $this->actingAs($this->admin)->post("/admin/validaciones/validar/socio-comercial/{$p->id}", ['rapida' => 'rfc'])
            ->assertSessionHas('notification.type', 'success');
        $rfc = KycValidacion::withoutGlobalScopes()->where('alcance', KycValidacion::ALCANCE_EMPRESA)->sole();
        $this->assertSame('CHKS', $rfc->truora_check_id); // el job corre al terminar la respuesta
        Http::assertSent(fn ($r) => $r->url() === 'https://api.checks.truora.com/v1/checks' && $r['type'] === 'company' && $r['tax_id'] === self::RFC);

        $this->actingAs($this->admin)->post("/admin/validaciones/validar/socio-comercial/{$p->id}", ['rapida' => 'curp'])
            ->assertSessionHas('notification.type', 'success')
            ->assertSessionHas('notification.message', fn ($m) => str_contains($m, 'RENAPO'));
        $curp = KycValidacion::withoutGlobalScopes()->where('alcance', KycValidacion::ALCANCE_CURP)->sole();
        $this->assertSame('aprobado', $curp->estatus);

        // Ni JaaK ni prueba de vida: sólo estas dos.
        $this->assertSame(2, KycValidacion::withoutGlobalScopes()->count());
    }

    public function test_submenu_explains_missing_data_and_rfc_only_for_companies(): void
    {
        $this->activar();
        Http::fake();
        $p = $this->socio(['rfc' => null, 'curp' => null]);

        $this->actingAs($this->admin)->post("/admin/validaciones/validar/socio-comercial/{$p->id}", ['rapida' => 'rfc'])
            ->assertSessionHas('notification.message', fn ($m) => str_contains($m, 'RFC válido'));
        $this->actingAs($this->admin)->post("/admin/validaciones/validar/socio-comercial/{$p->id}", ['rapida' => 'curp'])
            ->assertSessionHas('notification.message', fn ($m) => str_contains($m, 'responsable'));

        $r = new Responsable;
        $r->forceFill(['nombres' => 'Luis', 'apellidos' => 'Gómez', 'empresa_id' => $this->empresa->id, 'sucursal_id' => $this->admin->sucursal_id, 'user_id' => $this->admin->id, 'status' => 1, 'curp' => self::CURP])->saveQuietly();
        $this->actingAs($this->admin)->post("/admin/validaciones/validar/responsable/{$r->id}", ['rapida' => 'rfc'])
            ->assertSessionHas('notification.message', fn ($m) => str_contains($m, 'Sólo proveedores y socios'));

        Http::assertNothingSent();
        $this->assertSame(0, KycValidacion::withoutGlobalScopes()->count());
    }

    public function test_rerun_from_results_repeats_the_same_kind_of_check_in_the_same_folio(): void
    {
        $this->activar();
        Http::fake(['verification.didit.me/*' => Http::response($this->renapo('DOCUMENT_NOT_FOUND'), 200)]);
        $p = $this->socio();

        $this->actingAs($this->admin)->post("/admin/validaciones/validar/socio-comercial/{$p->id}", ['rapida' => 'curp']);
        $primera = KycValidacion::withoutGlobalScopes()->sole();
        $this->assertSame('rechazado', $primera->estatus);

        $this->actingAs($this->admin)->post("/admin/validaciones/{$primera->id}/reprocesar")->assertSessionHas('notification');

        $filas = KycValidacion::withoutGlobalScopes()->orderBy('id')->get();
        $this->assertCount(2, $filas);
        $this->assertSame([KycValidacion::ALCANCE_CURP, 'didit', $primera->operacion_id], [$filas[1]->alcance, $filas[1]->proveedor, $filas[1]->operacion_id]);
        $this->assertNull($filas[1]->didit_session_id); // no abrió una prueba de vida
    }
}
