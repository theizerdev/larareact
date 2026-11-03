<?php

namespace Tests\Feature;

use App\Models\BiotimeDispositivo;
use App\Models\BiotimeEmpleado;
use App\Models\BiotimeMarcaje;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use App\Services\BioTimeEmpleadoProvisioner;
use App\Services\BioTimeSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * Un reloj eliminado en Hoshō no vuelve con el sync, deja de bajar sus
 * marcajes y a los empleados de las áreas que se quedan sin reloj.
 */
class BioTimeDispositivoExcluidoTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create([
            'razon_social' => 'ACME', 'documento' => 'ACME-1', 'status' => true,
            'biotime_base_url' => 'http://biotime.test:8081', 'biotime_username' => 'u', 'biotime_password' => 'p',
            'biotime_active' => true,
        ]);
        Sucursal::create(['nombre' => 'Planta', 'empresa_id' => $this->empresa->id, 'status' => true]);
        User::factory()->create(['empresa_id' => $this->empresa->id]);
    }

    /** Planta (AEW1) y Frío (CNT2), cada uno en su área; Bodega comparte área con Planta si se pide. */
    private function fakeBioTime(bool $bodegaEnPlanta = false): void
    {
        $env = fn (array $rows) => ['count' => count($rows), 'next' => null, 'previous' => null, 'msg' => '', 'code' => 0, 'data' => $rows];

        $terminales = [
            ['id' => 1, 'sn' => 'AEW1', 'alias' => 'Planta', 'state' => 1, 'area' => ['area_name' => 'Planta']],
            ['id' => 2, 'sn' => 'CNT2', 'alias' => 'Frio', 'state' => 1, 'area' => ['area_name' => 'Frio']],
        ];
        if ($bodegaEnPlanta) {
            $terminales[] = ['id' => 3, 'sn' => 'BDG3', 'alias' => 'Bodega', 'state' => 1, 'area' => ['area_name' => 'Planta']];
        }

        Http::fake([
            '*/jwt-api-token-auth/' => Http::response(['token' => 't']),
            '*/iclock/api/terminals/*' => Http::response($env($terminales)),
            '*/personnel/api/departments/*' => Http::response($env([])),
            '*/personnel/api/areas/*' => Http::response($env([])),
            '*/personnel/api/positions/*' => Http::response($env([])),
            '*/personnel/api/employees/*' => Http::response($env([
                ['id' => 10, 'emp_code' => '100', 'first_name' => 'Ana', 'area' => [['area_name' => 'Planta']]],
                ['id' => 11, 'emp_code' => '200', 'first_name' => 'Beto', 'area' => [['area_name' => 'Frio']]],
                ['id' => 12, 'emp_code' => '300', 'first_name' => 'Caro', 'area' => [['area_name' => 'Planta'], ['area_name' => 'Frio']]],
                ['id' => 13, 'emp_code' => '400', 'first_name' => 'Dani', 'area' => []],
            ])),
            '*/iclock/api/transactions/*' => Http::response($env([
                ['id' => 5001, 'emp_code' => '200', 'punch_time' => '2026-10-20 08:00:00', 'punch_state' => '0', 'terminal_sn' => 'AEW1'],
                ['id' => 5002, 'emp_code' => '200', 'punch_time' => '2026-10-20 17:00:00', 'punch_state' => '1', 'terminal_sn' => 'CNT2'],
            ])),
            '*/att/api/*' => Http::response($env([])),
        ]);
    }

    private function sync(array $only = []): array
    {
        $this->empresa->refresh();
        $r = BioTimeSyncService::for($this->empresa)->sync($this->empresa, $only, full: true);
        $this->assertTrue($r['ok'], json_encode($r['errors']));

        return $r;
    }

    private function excluir(string $sn): void
    {
        BiotimeDispositivo::where('empresa_id', $this->empresa->id)->where('sn', $sn)->update(['excluido_at' => now()]);
    }

    private function admin(): User
    {
        Permission::findOrCreate('biotime.manage', 'web');
        $user = User::factory()->create(['empresa_id' => $this->empresa->id]);
        $user->givePermissionTo('biotime.manage');

        return $user->refresh();
    }

    public function test_el_reloj_eliminado_no_vuelve_ni_baja_marcajes_ni_empleados_de_su_area(): void
    {
        $this->fakeBioTime();
        $this->sync(['terminals']);
        $this->excluir('AEW1');

        $r = $this->sync();

        $this->assertNotNull(BiotimeDispositivo::where('sn', 'AEW1')->value('excluido_at'));
        $this->assertSame(['5002'], BiotimeMarcaje::pluck('biotime_id')->map(fn ($id) => (string) $id)->all());
        // El fake devuelve las mismas filas en cada ventana de 30 días.
        $this->assertGreaterThan(0, $r['parts']['transactions']['omitidos_reloj_eliminado']);

        // Ana sólo estaba en Planta; Caro también está en Frío y Dani no tiene área.
        $this->assertEqualsCanonicalizing(['200', '300', '400'], BiotimeEmpleado::pluck('emp_code')->all());
        $this->assertSame(1, $r['parts']['employees']['sin_reloj']);
        $this->assertFalse(Empleado::withoutTenant()->where('documento_identidad', '100')->exists());
    }

    public function test_si_el_area_conserva_otro_reloj_sus_empleados_se_siguen_cargando(): void
    {
        $this->fakeBioTime(bodegaEnPlanta: true);
        $this->sync(['terminals']);
        $this->excluir('AEW1');

        $this->sync(['employees']);

        $this->assertTrue(BiotimeEmpleado::where('emp_code', '100')->exists());
    }

    public function test_el_espejo_viejo_de_un_area_sin_reloj_no_se_da_de_alta(): void
    {
        BiotimeDispositivo::create(['empresa_id' => $this->empresa->id, 'biotime_id' => 1, 'sn' => 'AEW1', 'area_name' => 'Planta', 'excluido_at' => now()]);
        BiotimeDispositivo::create(['empresa_id' => $this->empresa->id, 'biotime_id' => 2, 'sn' => 'CNT2', 'area_name' => 'Frio']);
        foreach (['100' => 'Planta', '200' => 'Frio'] as $codigo => $area) {
            BiotimeEmpleado::create([
                'empresa_id' => $this->empresa->id, 'biotime_id' => $codigo, 'emp_code' => $codigo,
                'first_name' => "Persona {$codigo}", 'area_names' => [$area], 'link_status' => 'unmatched',
            ]);
        }

        app(BioTimeEmpleadoProvisioner::class)->sincronizar($this->empresa);

        $this->assertFalse(Empleado::withoutTenant()->where('documento_identidad', '100')->exists());
        $this->assertTrue(Empleado::withoutTenant()->where('documento_identidad', '200')->exists());
    }

    public function test_eliminar_y_restaurar_desde_la_pantalla(): void
    {
        $this->fakeBioTime();
        $this->sync();
        $user = $this->admin();
        $reloj = BiotimeDispositivo::where('sn', 'AEW1')->firstOrFail();
        $this->assertSame(1, BiotimeMarcaje::where('dispositivo_sn', 'AEW1')->count());

        $this->actingAs($user)
            ->delete("/admin/biotime/dispositivos/{$reloj->id}", ['borrar_marcajes' => true])
            ->assertRedirect();

        $this->assertNotNull($reloj->fresh()->excluido_at);
        $this->assertSame(0, BiotimeMarcaje::where('dispositivo_sn', 'AEW1')->count());
        $this->assertSame(1, BiotimeMarcaje::where('dispositivo_sn', 'CNT2')->count());

        $this->actingAs($user)
            ->patch("/admin/biotime/dispositivos/{$reloj->id}/restaurar")
            ->assertRedirect();

        $this->assertNull($reloj->fresh()->excluido_at);
    }

    public function test_eliminar_sin_borrar_marcajes_los_conserva(): void
    {
        $this->fakeBioTime();
        $this->sync();
        $reloj = BiotimeDispositivo::where('sn', 'AEW1')->firstOrFail();

        $this->actingAs($this->admin())->delete("/admin/biotime/dispositivos/{$reloj->id}")->assertRedirect();

        $this->assertNotNull($reloj->fresh()->excluido_at);
        $this->assertSame(1, BiotimeMarcaje::where('dispositivo_sn', 'AEW1')->count());
    }

    public function test_no_se_puede_eliminar_el_reloj_de_otra_empresa(): void
    {
        $otra = Empresa::create(['razon_social' => 'Otra', 'documento' => 'OT-1', 'status' => true]);
        $ajeno = BiotimeDispositivo::create(['empresa_id' => $otra->id, 'biotime_id' => 9, 'sn' => 'X9']);

        $this->actingAs($this->admin())->delete("/admin/biotime/dispositivos/{$ajeno->id}")->assertForbidden();

        $this->assertNull($ajeno->fresh()->excluido_at);
    }

    public function test_solo_quien_administra_biotime_puede_eliminar(): void
    {
        $reloj = BiotimeDispositivo::create(['empresa_id' => $this->empresa->id, 'biotime_id' => 1, 'sn' => 'AEW1']);
        Permission::findOrCreate('biotime.view', 'web');
        $user = User::factory()->create(['empresa_id' => $this->empresa->id]);
        $user->givePermissionTo('biotime.view');

        $this->actingAs($user->refresh())->delete("/admin/biotime/dispositivos/{$reloj->id}")->assertForbidden();
    }
}
