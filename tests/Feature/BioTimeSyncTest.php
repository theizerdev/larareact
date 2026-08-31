<?php

namespace Tests\Feature;

use App\Models\BiotimeDispositivo;
use App\Models\BiotimeEmpleado;
use App\Models\BiotimeMarcaje;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Services\BioTimeSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BioTimeSyncTest extends TestCase
{
    use RefreshDatabase;

    private function empresa(): Empresa
    {
        return Empresa::create([
            'razon_social' => 'ACME',
            'documento' => 'ACME-1',
            'biotime_base_url' => 'http://biotime.test:8081',
            'biotime_username' => 'Sistemas',
            'biotime_password' => 'secret',
            'biotime_active' => true,
        ]);
    }

    private function fakeBioTime(): void
    {
        $envelope = fn (array $rows) => ['count' => count($rows), 'next' => null, 'previous' => null, 'msg' => '', 'code' => 0, 'data' => $rows];

        Http::fake([
            '*/jwt-api-token-auth/' => Http::response(['token' => 'faketoken-abc'], 200),

            '*/iclock/api/terminals/*' => Http::response($envelope([
                ['id' => 1, 'sn' => 'AEW1', 'alias' => 'Planta', 'ip_address' => '10.0.0.1', 'state' => 1, 'last_activity' => '2026-08-30 10:00:00', 'area' => ['area_name' => 'Ops']],
                ['id' => 2, 'sn' => 'CNT2', 'alias' => 'Frio', 'ip_address' => '10.0.0.2', 'state' => 0, 'last_activity' => null, 'area' => ['area_name' => 'Ops']],
            ])),

            '*/personnel/api/departments/*' => Http::response($envelope([
                ['id' => 1, 'dept_code' => 'D1', 'dept_name' => 'Producción', 'parent_dept' => null],
            ])),
            '*/personnel/api/areas/*' => Http::response($envelope([
                ['id' => 1, 'area_code' => 'A1', 'area_name' => 'Ops', 'parent_area' => null],
            ])),
            '*/personnel/api/positions/*' => Http::response($envelope([
                ['id' => 1, 'position_code' => 'P1', 'position_name' => 'Operario'],
            ])),

            '*/personnel/api/employees/*' => Http::response($envelope([
                ['id' => 10, 'emp_code' => '100', 'first_name' => 'Ana', 'last_name' => 'López', 'national' => 'LOPA900101HDF', 'department' => ['dept_code' => 'D1'], 'position' => ['position_code' => 'P1'], 'area' => [['area_name' => 'Ops']], 'hire_date' => '2025-01-10', 'card_no' => '555', 'enable_att' => true],
                ['id' => 11, 'emp_code' => '200', 'first_name' => 'Beto', 'last_name' => 'Ruiz', 'national' => 'ZZZ', 'department' => 1, 'position' => null, 'area' => [], 'hire_date' => null],
            ])),

            '*/iclock/api/transactions/*' => Http::response($envelope([
                ['id' => 5001, 'emp_code' => '100', 'punch_time' => '2026-08-20 08:00:00', 'punch_state' => '0', 'verify_type' => 1, 'terminal_sn' => 'AEW1', 'terminal_alias' => 'Planta', 'area_alias' => 'Ops', 'temperature' => 36.5],
                ['id' => 5002, 'emp_code' => '100', 'punch_time' => '2026-08-20 17:00:00', 'punch_state' => '1', 'verify_type' => 15, 'terminal_sn' => 'AEW1', 'terminal_alias' => 'Planta', 'area_alias' => 'Ops'],
            ])),
        ]);
    }

    public function test_full_sync_populates_mirror_tables(): void
    {
        $this->fakeBioTime();
        $empresa = $this->empresa();

        $summary = BioTimeSyncService::for($empresa)->sync($empresa, full: true);

        $this->assertTrue($summary['ok'], json_encode($summary['errors']));
        $this->assertDatabaseCount('biotime_dispositivos', 2);
        $this->assertDatabaseCount('biotime_departamentos', 1);
        $this->assertDatabaseCount('biotime_areas', 1);
        $this->assertDatabaseCount('biotime_cargos', 1);
        $this->assertDatabaseCount('biotime_empleados', 2);
        $this->assertDatabaseCount('biotime_marcajes', 2);

        $marcaje = BiotimeMarcaje::where('biotime_id', 5001)->first();
        $this->assertSame('Entrada', $marcaje->punch_state_label);
        $this->assertSame('Huella', $marcaje->verify_type_label);
        $this->assertSame('AEW1', $marcaje->dispositivo_sn);

        $empresa->refresh();
        $this->assertNotNull($empresa->biotime_last_sync_at);
        $this->assertSame(5002, (int) $empresa->biotime_last_transaction_id);
    }

    public function test_sync_is_idempotent(): void
    {
        $this->fakeBioTime();
        $empresa = $this->empresa();

        BioTimeSyncService::for($empresa)->sync($empresa, full: true);
        BioTimeSyncService::for($empresa->fresh())->sync($empresa->fresh(), full: true);

        $this->assertDatabaseCount('biotime_marcajes', 2);
        $this->assertDatabaseCount('biotime_empleados', 2);
        $this->assertDatabaseCount('biotime_dispositivos', 2);
        $this->assertSame(2, BiotimeMarcaje::distinct('biotime_id')->count('biotime_id'));
    }

    public function test_employees_auto_link_by_document(): void
    {
        $this->fakeBioTime();
        $empresa = $this->empresa();

        $empleado = Empleado::create([
            'nombres' => 'Ana',
            'apellidos' => 'López',
            'documento_identidad' => 'LOPA900101HDF',
            'empresa_id' => $empresa->id,
            'status' => true,
        ]);

        BioTimeSyncService::for($empresa)->sync($empresa, only: ['employees']);

        $bio = BiotimeEmpleado::where('emp_code', '100')->first();
        $this->assertSame($empleado->id, $bio->empleado_id);
        $this->assertSame('auto', $bio->link_status);

        // El que no casa queda sin vincular.
        $this->assertNull(BiotimeEmpleado::where('emp_code', '200')->first()->empleado_id);
    }

    public function test_transactions_resolve_employee_link(): void
    {
        $this->fakeBioTime();
        $empresa = $this->empresa();

        $empleado = Empleado::create([
            'nombres' => 'Ana', 'apellidos' => 'López', 'documento_identidad' => 'LOPA900101HDF',
            'empresa_id' => $empresa->id, 'status' => true,
        ]);

        BioTimeSyncService::for($empresa)->sync($empresa, only: ['employees', 'transactions'], full: true);

        $this->assertSame(
            $empleado->id,
            (int) BiotimeMarcaje::where('biotime_id', 5001)->first()->empleado_id,
        );
    }

    public function test_sync_never_throws_and_reports_errors_when_biotime_down(): void
    {
        Http::fake(['*' => Http::response('', 500)]);
        $empresa = $this->empresa();

        $summary = BioTimeSyncService::for($empresa)->sync($empresa, full: true);

        $this->assertFalse($summary['ok']);
        $this->assertNotEmpty($summary['errors']);
        $this->assertDatabaseCount('biotime_marcajes', 0);
    }

    public function test_transactions_are_always_windowed_never_unbounded(): void
    {
        $this->fakeBioTime();
        $empresa = $this->empresa();

        BioTimeSyncService::for($empresa)->sync($empresa, only: ['transactions'], full: true);

        Http::assertSent(function ($request) {
            if (! str_contains($request->url(), '/iclock/api/transactions/')) {
                return true;
            }

            return str_contains($request->url(), 'start_time=') && str_contains($request->url(), 'end_time=');
        });
    }
}
