<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\KycValidacion;
use App\Models\Productor;
use App\Models\Sucursal;
use App\Models\User;
use App\Models\ValidacionRegla;
use App\Services\TruoraService;
use App\Services\Validaciones\TruoraSincronizador;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/** Verificación de antecedentes (background check) con TRUORA. */
class TruoraAntecedentesTest extends TestCase
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

    private function activarTruora(float $minimo = 0.8): void
    {
        $this->empresa->forceFill(['truora_active' => true, 'truora_api_key' => 'tk-123', 'truora_score_minimo' => $minimo])->save();
    }

    private function socio(?string $curp = 'PUMR731118HDFLRN08'): Productor
    {
        DB::table('pais')->insertOrIgnore(['nombre' => 'México', 'codigo_iso2' => 'MX', 'codigo_iso3' => 'MEX', 'codigo_telefonico' => '+52', 'activo' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $pais = DB::table('pais')->where('codigo_iso3', 'MEX')->value('id');
        $p = new Productor;
        $p->forceFill([
            'empresa_id' => $this->empresa->id, 'sucursal_id' => $this->admin->sucursal_id, 'razon_social' => 'Agro', 'nombre_comercial' => 'Agro',
            'pais_id' => $pais, 'documento_identidad' => 'D'.uniqid(), 'status' => 'activo', 'responsable' => 'René', 'curp' => $curp,
        ])->saveQuietly();

        return $p;
    }

    private function validacion(Productor $p, array $extra = []): KycValidacion
    {
        return KycValidacion::create($extra + [
            'validable_type' => $p->getMorphClass(), 'validable_id' => $p->id, 'empresa_id' => $p->empresa_id,
            'proveedor' => KycValidacion::PROVEEDOR_TRUORA, 'curp_capturada' => $p->curp, 'pais_documento' => 'MEX',
            'jaak_environment' => 'n/a', 'estatus' => KycValidacion::ESTATUS_PENDIENTE,
        ]);
    }

    public function test_it_creates_the_check_as_form_with_api_key_header(): void
    {
        $this->activarTruora();
        Http::fake(['api.checks.truora.com/v1/checks' => Http::response(['check' => ['check_id' => 'CHK123', 'status' => 'not_started', 'score' => -1]], 200)]);

        $val = $this->validacion($this->socio());
        $this->assertTrue(TruoraSincronizador::iniciar($val));

        $this->assertSame('CHK123', $val->fresh()->truora_check_id);
        Http::assertSent(function ($r) {
            return $r->method() === 'POST'
                && $r->hasHeader('Truora-API-Key', 'tk-123')
                && str_contains($r->header('Content-Type')[0], 'application/x-www-form-urlencoded')
                && $r['national_id'] === 'PUMR731118HDFLRN08'
                && $r['country'] === 'MX' && $r['type'] === 'person' && $r['user_authorized'] === 'true';
        });
    }

    public function test_missing_curp_or_api_failure_leaves_an_error_not_an_exception(): void
    {
        $this->activarTruora();
        $sinCurp = $this->validacion($this->socio(null), ['curp_capturada' => null]);
        $this->assertFalse(TruoraSincronizador::iniciar($sinCurp));
        $this->assertSame('error', $sinCurp->fresh()->estatus);
        $this->assertStringContainsString('CURP', $sinCurp->fresh()->error_detalle);

        Http::fake(['*' => Http::response(['message' => 'invalid key'], 401)]);
        $val = $this->validacion($this->socio());
        $this->assertFalse(TruoraSincronizador::iniciar($val));
        $this->assertSame('error', $val->fresh()->estatus);
    }

    public function test_completed_check_is_approved_above_minimum_and_goes_to_review_below(): void
    {
        $this->activarTruora(0.8);
        $alto = $this->validacion($this->socio(), ['truora_check_id' => 'CHKA']);
        $bajo = $this->validacion($this->socio(), ['truora_check_id' => 'CHKB']);

        Http::fake([
            '*/v1/checks/CHKA/details' => Http::response(['details' => []], 200),
            '*/v1/checks/CHKB/details' => Http::response(['details' => [['name' => 'x']]], 200),
            '*/v1/checks/CHKA' => Http::response(['check' => ['check_id' => 'CHKA', 'status' => 'completed', 'score' => 1]], 200),
            '*/v1/checks/CHKB' => Http::response(['check' => ['check_id' => 'CHKB', 'status' => 'completed', 'score' => 0.4]], 200),
        ]);

        $this->assertTrue(TruoraSincronizador::sincronizar($alto));
        $this->assertTrue(TruoraSincronizador::sincronizar($bajo));

        $this->assertSame('aprobado', $alto->fresh()->estatus);
        $this->assertFalse($alto->fresh()->en_listas);
        $this->assertSame('revision', $bajo->fresh()->estatus); // nunca se rechaza solo
        $this->assertTrue($bajo->fresh()->en_listas);
        $this->assertSame('revision', $bajo->fresh()->validable->kyc_estatus);
    }

    public function test_check_in_progress_stays_pending(): void
    {
        $this->activarTruora();
        $val = $this->validacion($this->socio(), ['truora_check_id' => 'CHKP']);
        Http::fake(['*/v1/checks/CHKP' => Http::response(['check' => ['status' => 'in_progress', 'score' => -1]], 200)]);

        $this->assertFalse(TruoraSincronizador::sincronizar($val));
        $this->assertSame('pendiente', $val->fresh()->estatus);
    }

    public function test_webhook_only_resyncs_known_checks_by_asking_the_api(): void
    {
        $this->activarTruora();
        $val = $this->validacion($this->socio(), ['truora_check_id' => 'CHKW']);
        Http::fake([
            '*/v1/checks/CHKW/details' => Http::response([], 200),
            '*/v1/checks/CHKW' => Http::response(['check' => ['status' => 'completed', 'score' => 0.95]], 200),
        ]);

        // El score que "manda" el webhook se ignora: manda lo que diga la API.
        $this->postJson('/webhooks/truora', ['check_id' => 'CHKW', 'score' => 0.0])->assertOk();
        $this->assertSame('aprobado', $val->fresh()->estatus);

        $this->postJson('/webhooks/truora', ['check_id' => 'DESCONOCIDO'])->assertOk();
        $this->postJson('/webhooks/truora', ['check_id' => ['x']])->assertOk();
    }

    public function test_connection_test_distinguishes_bad_key(): void
    {
        $this->activarTruora();
        Http::fake(['*' => Http::sequence()->push([], 200)->push(['message' => 'forbidden'], 403)]);
        $this->assertTrue((new TruoraService($this->empresa))->testConnection()['success']);
        $this->assertFalse((new TruoraService($this->empresa))->testConnection()['success']);
    }

    public function test_background_button_runs_only_truora_and_needs_the_curp(): void
    {
        $this->activarTruora();
        Http::fake(['*/v1/checks' => Http::response(['check' => ['check_id' => 'CHKBTN', 'status' => 'not_started']], 200)]);
        $sin = $this->socio(null);

        $this->actingAs($this->admin)->post("/admin/validaciones/validar/socio-comercial/{$sin->id}", ['antecedentes' => 1])
            ->assertSessionHas('notification.type', 'error');

        $p = $this->socio();
        $this->actingAs($this->admin)->post("/admin/validaciones/validar/socio-comercial/{$p->id}", ['antecedentes' => 1])
            ->assertSessionHas('notification.type', 'success');

        $filas = KycValidacion::withoutGlobalScopes()->where('validable_id', $p->id)->get();
        $this->assertCount(1, $filas);                       // sin foto ni documento: solo antecedentes, nada de JaaK/Didit
        $this->assertSame('truora', $filas[0]->proveedor);
        $this->assertSame('CHKBTN', $filas[0]->truora_check_id);
    }

    public function test_rule_runs_background_check_on_normal_validation_and_is_saved_from_integrations(): void
    {
        $this->activarTruora();
        $this->empresa->forceFill(['jaak_active' => false])->save();
        Http::fake(['*/v1/checks' => Http::response(['check' => ['check_id' => 'CHKR']], 200)]);

        $regla = ['entidad' => 'socios', 'kyc_activo' => false, 'didit_antifraude' => false, 'antecedentes_activo' => true,
            'firma_activa' => false, 'firma_obligatoria' => false, 'firma_valida_identidad' => false];
        $this->actingAs($this->admin)->put('/admin/integrations/validaciones/reglas', ['reglas' => [$regla]])->assertSessionHasNoErrors();
        $this->assertTrue(ValidacionRegla::para($this->empresa->id, 'socios')->antecedentes_activo);

        Storage::disk('public')->put('x/f.jpg', 'img');
        $p = $this->socio();
        $p->forceFill(['foto' => 'x/f.jpg', 'documento_frontal' => 'x/f.jpg'])->saveQuietly();
        $this->actingAs($this->admin)->post("/admin/validaciones/validar/socio-comercial/{$p->id}")
            ->assertSessionHas('notification.type', 'success');

        $this->assertSame(['truora'], KycValidacion::withoutGlobalScopes()->where('validable_id', $p->id)->pluck('proveedor')->all());
    }

    public function test_integration_settings_are_saved_encrypted_and_validated(): void
    {
        $this->actingAs($this->admin)->put('/admin/integrations/truora', ['truora_active' => true, 'truora_api_key' => ''])
            ->assertSessionHasErrors('truora_api_key');
        $this->actingAs($this->admin)->put('/admin/integrations/truora', ['truora_active' => true, 'truora_api_key' => 'k1', 'truora_score_minimo' => 2])
            ->assertSessionHasErrors('truora_score_minimo');

        $this->actingAs($this->admin)->put('/admin/integrations/truora', ['truora_active' => true, 'truora_api_key' => 'k1', 'truora_score_minimo' => 0.9])
            ->assertSessionHasNoErrors();

        $this->assertNotSame('k1', DB::table('empresas')->where('id', $this->empresa->id)->value('truora_api_key'));
        $this->assertSame('k1', $this->empresa->fresh()->truora_api_key);
    }
}
