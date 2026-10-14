<?php

namespace Tests\Feature;

use App\Models\BiotimeCalendario;
use App\Models\BiotimeEmpleado;
use App\Models\BiotimeHorario;
use App\Models\BiotimePermiso;
use App\Models\BiotimeTurno;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\User;
use App\Services\BioTimeSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * Espejo de /att/api/ de BioTime: horarios, turnos, calendarios y permisos.
 * Las respuestas simuladas copian el formato real de un BioTime 8 local.
 */
class BioTimeAsistenciaSyncTest extends TestCase
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

    private function envelope(array $rows, ?int $count = null): array
    {
        return ['count' => $count ?? count($rows), 'next' => null, 'previous' => null, 'msg' => '', 'code' => 0, 'data' => $rows];
    }

    /**
     * @param  array<int,array<string,mixed>>|null  $schedules  null = el endpoint no existe (404)
     */
    private function fakeBioTime(array $shifts, ?array $schedules, array $leaves = [], ?int $leavesCount = null): void
    {
        // Http::fake() acumula y el primer patrón que coincide gana: se parte
        // de un cliente limpio para que un segundo fake sí reemplace al primero.
        Http::swap(new Factory);

        Http::fake([
            '*/jwt-api-token-auth/' => Http::response(['token' => 'faketoken-abc'], 200),
            '*/att/api/timeintervals/*' => Http::response($this->envelope([
                ['id' => 3, 'alias' => 'L-V 9:00-18:00', 'use_mode' => 'Normal', 'in_time' => '09:00:00', 'out_time' => '18:00:00', 'duration' => 540, 'cross_day' => 0, 'break_time_duration' => null, 'work_time_duration' => 540, 'work_day' => 1, 'work_type' => 0, 'in_required' => 'Sí', 'out_required' => 'No', 'multiple_punch' => 'No', 'func_key' => 'No'],
                ['id' => 9, 'alias' => 'Vig 7 - 19', 'use_mode' => 'Normal', 'in_time' => '19:00:00', 'out_time' => '07:00:00', 'duration' => 720, 'cross_day' => 1, 'break_time_duration' => 60, 'work_time_duration' => 660, 'in_required' => 'Yes', 'out_required' => 'Yes'],
            ])),
            '*/att/api/attshifts/*' => Http::response($this->envelope($shifts)),
            '*/att/api/attschedules/*' => $schedules === null
                ? Http::response(['detail' => 'Not found.'], 404)
                : Http::response($this->envelope($schedules)),
            '*/att/api/leaves/*' => Http::response($this->envelope($leaves, $leavesCount)),
        ]);
    }

    private function turnos(): array
    {
        return [
            ['id' => 1, 'alias' => 'MTTO', 'shift_timetable' => 'L-V 8:00 - 16:30,S 8:00-13:30', 'cycle_unit' => 'Semana', 'shift_cycle' => 1, 'auto_shift' => true],
            ['id' => 12, 'alias' => 'Monitoreo LT', 'shift_timetable' => 'Vig 7 - 19', 'cycle_unit' => 'Semana', 'shift_cycle' => 3, 'auto_shift' => true],
        ];
    }

    public function test_sincroniza_horarios_turnos_calendarios_y_permisos(): void
    {
        $empresa = $this->empresa();
        $empleado = Empleado::create(['nombres' => 'Ana', 'apellidos' => 'López', 'documento_identidad' => 'X1', 'empresa_id' => $empresa->id]);
        $bio = BiotimeEmpleado::create(['empresa_id' => $empresa->id, 'biotime_id' => '10', 'emp_code' => '100', 'first_name' => 'Ana', 'empleado_id' => $empleado->id, 'link_status' => 'auto']);

        $this->fakeBioTime($this->turnos(), [
            ['id' => 1, 'start_date' => '2026-04-01', 'end_date' => '2040-04-30', 'employee' => 10, 'shift' => 12],
            ['id' => 2, 'start_date' => '2026-04-01', 'end_date' => '2040-04-30', 'employee' => 99, 'shift' => 1],
        ], [
            ['id' => 7, 'get_emp_code' => '100', 'get_emp_first_name' => 'Ana', 'get_emp_last_name' => 'López', 'get_emp_dept' => 'Producción', 'category' => 'Vacaciones', 'start_time' => '2026-10-01 09:00:00', 'end_time' => '2026-10-03 18:00:00', 'apply_reason' => 'Viaje', 'apply_time' => '2026-09-20 10:00:00', 'audit_status' => 'Aprobar', 'audit_reason' => 'Ok', 'audit_time' => '2026-09-21 10:00:00', 'last_approver' => 'rh'],
        ]);

        $summary = BioTimeSyncService::for($empresa)->sync($empresa, only: ['attendance']);

        $this->assertTrue($summary['ok'], json_encode($summary['errors']));
        $this->assertSame(2, $summary['parts']['attendance']['horarios']);
        $this->assertSame(2, $summary['parts']['attendance']['turnos']);
        $this->assertSame(2, $summary['parts']['attendance']['calendarios']);
        $this->assertSame(1, $summary['parts']['attendance']['permisos']);

        $horario = BiotimeHorario::where('biotime_id', '3')->first();
        $this->assertTrue($horario->in_required);   // "Sí"
        $this->assertFalse($horario->out_required); // "No"
        $this->assertFalse($horario->cross_day);
        $this->assertTrue(BiotimeHorario::where('biotime_id', '9')->first()->cross_day);

        $mtto = BiotimeTurno::where('biotime_id', '1')->first();
        $this->assertSame(['L-V 8:00 - 16:30', 'S 8:00-13:30'], $mtto->horariosAlias());

        // `employee` es el id interno de BioTime, no el emp_code.
        $cal = BiotimeCalendario::where('biotime_id', '1')->first();
        $this->assertSame($bio->id, $cal->biotime_empleado_id);
        $this->assertSame($empleado->id, $cal->empleado_id);
        $this->assertSame('Monitoreo LT', $cal->turno->alias);
        $this->assertSame('2040-04-30', $cal->end_date->toDateString());

        // Empleado que aún no está en el espejo: se guarda sin vínculo.
        $huerfano = BiotimeCalendario::where('biotime_id', '2')->first();
        $this->assertNull($huerfano->biotime_empleado_id);
        $this->assertSame('99', $huerfano->employee_biotime_id);

        $permiso = BiotimePermiso::first();
        $this->assertSame('100', $permiso->emp_code);
        $this->assertSame($empleado->id, $permiso->empleado_id);
        $this->assertSame('Vacaciones', $permiso->category);
        $this->assertSame('2026-10-03 18:00:00', $permiso->end_time->toDateTimeString());
    }

    public function test_resincronizar_no_duplica_y_borra_lo_que_ya_no_existe_en_biotime(): void
    {
        $empresa = $this->empresa();
        $calendarios = [
            ['id' => 1, 'start_date' => '2026-04-01', 'end_date' => '2040-04-30', 'employee' => 10, 'shift' => 12],
            ['id' => 2, 'start_date' => '2026-04-01', 'end_date' => '2040-04-30', 'employee' => 11, 'shift' => 1],
        ];

        $this->fakeBioTime($this->turnos(), $calendarios);
        BioTimeSyncService::for($empresa)->sync($empresa, only: ['attendance']);
        $this->assertDatabaseCount('biotime_turnos', 2);
        $this->assertDatabaseCount('biotime_calendarios', 2);

        // En BioTime se borraron el turno 12 y el calendario 1.
        $this->fakeBioTime([$this->turnos()[0]], [$calendarios[1]]);
        $summary = BioTimeSyncService::for($empresa)->sync($empresa, only: ['attendance']);

        $this->assertTrue($summary['ok'], json_encode($summary['errors']));
        $this->assertSame(1, $summary['parts']['attendance']['turnos_eliminados']);
        $this->assertSame(1, $summary['parts']['attendance']['calendarios_eliminados']);
        $this->assertDatabaseCount('biotime_horarios', 2);
        $this->assertDatabaseCount('biotime_turnos', 1);
        $this->assertDatabaseCount('biotime_calendarios', 1);
    }

    public function test_bio_time_cloud_sin_calendarios_y_con_demasiados_permisos_no_falla(): void
    {
        $empresa = $this->empresa();
        config(['biotime.leaves_max' => 100]);

        // BioTime Cloud: attschedules responde 404 y leaves trae los permisos
        // de todas las empresas de la nube.
        $this->fakeBioTime($this->turnos(), null, [['id' => 1, 'get_emp_code' => 'X']], leavesCount: 126491);

        $summary = BioTimeSyncService::for($empresa)->sync($empresa, only: ['attendance']);

        $this->assertTrue($summary['ok'], json_encode($summary['errors']));
        $this->assertSame('no disponible', $summary['parts']['attendance']['calendarios']);
        $this->assertStringStartsWith('omitido', $summary['parts']['attendance']['permisos']);
        $this->assertDatabaseCount('biotime_turnos', 2);
        $this->assertDatabaseCount('biotime_permisos', 0);

        // Sólo se pidió el total de permisos (page_size=1), nunca el listado.
        Http::assertNotSent(fn ($request) => str_contains($request->url(), '/att/api/leaves/')
            && ! str_contains($request->url(), 'page_size=1'));
    }

    public function test_error_de_bio_time_marca_la_parte_como_fallida(): void
    {
        $empresa = $this->empresa();
        Http::fake([
            '*/jwt-api-token-auth/' => Http::response(['token' => 'faketoken-abc'], 200),
            '*/att/api/*' => Http::response('boom', 500),
        ]);

        $summary = BioTimeSyncService::for($empresa)->sync($empresa, only: ['attendance']);

        $this->assertFalse($summary['ok']);
        $this->assertStringContainsString('[attendance]', $summary['errors'][0]);
    }

    public function test_pantallas_de_turnos_y_permisos(): void
    {
        $empresa = $this->empresa();
        $otra = Empresa::create(['razon_social' => 'Otra', 'documento' => 'OTRA-1']);
        BiotimeTurno::create(['empresa_id' => $empresa->id, 'biotime_id' => '1', 'alias' => 'MTTO', 'shift_timetable' => 'A,B']);
        BiotimeTurno::create(['empresa_id' => $otra->id, 'biotime_id' => '1', 'alias' => 'De otra empresa']);
        BiotimePermiso::create(['empresa_id' => $empresa->id, 'biotime_id' => '7', 'emp_code' => '100', 'category' => 'Vacaciones', 'start_time' => '2026-10-01 09:00:00', 'end_time' => '2026-10-03 18:00:00']);

        $sinPermiso = User::factory()->create(['empresa_id' => $empresa->id]);
        $this->actingAs($sinPermiso)->get('/admin/biotime/turnos')->assertForbidden();
        $this->actingAs($sinPermiso)->get('/admin/biotime/permisos')->assertForbidden();

        Permission::findOrCreate('biotime.view', 'web');
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $user->givePermissionTo('biotime.view');

        $this->actingAs($user)->get('/admin/biotime/turnos')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/biotime/Turnos')
                ->has('turnos', 1)
                ->where('turnos.0.alias', 'MTTO')
                ->where('turnos.0.horarios', ['A', 'B']));

        $this->actingAs($user)->get('/admin/biotime/permisos?fecha_inicio=2026-10-02&fecha_fin=2026-10-02')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/biotime/Permisos')
                ->where('stats.total', 1)
                ->where('categorias', ['Vacaciones']));

        // Un permiso que terminó antes del rango no aparece.
        $this->actingAs($user)->get('/admin/biotime/permisos?fecha_inicio=2026-10-05')
            ->assertInertia(fn (Assert $page) => $page->where('stats.total', 0));
    }
}
