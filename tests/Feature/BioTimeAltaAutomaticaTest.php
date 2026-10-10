<?php

namespace Tests\Feature;

use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use App\Services\BioTimeSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * El sync del reloj da de alta y mantiene al día a los empleados sin
 * intervención manual, pero sólo en empresas que lo activaron.
 */
class BioTimeAltaAutomaticaTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create([
            'razon_social' => 'Empresa de Prueba', 'documento' => 'EP-1',
            'biotime_base_url' => 'http://biotime.test:8081', 'biotime_username' => 'u', 'biotime_password' => 'p',
            'biotime_active' => true,
        ]);
        Sucursal::create(['nombre' => 'Planta', 'empresa_id' => $this->empresa->id, 'status' => true]);
        User::factory()->create(['empresa_id' => $this->empresa->id]);
    }

    private function reloj(array $empleados): void
    {
        $env = fn (array $rows) => ['count' => count($rows), 'next' => null, 'previous' => null, 'msg' => '', 'code' => 0, 'data' => $rows];
        Http::swap(new \Illuminate\Http\Client\Factory());

        Http::fake([
            '*/jwt-api-token-auth/' => Http::response(['token' => 't']),
            '*/iclock/api/terminals/*' => Http::response($env([])),
            '*/personnel/api/departments/*' => Http::response($env([['id' => 1, 'dept_code' => 'D1', 'dept_name' => 'Producción']])),
            '*/personnel/api/areas/*' => Http::response($env([])),
            '*/personnel/api/positions/*' => Http::response($env([['id' => 1, 'position_code' => 'P1', 'position_name' => 'Montacargista']])),
            '*/personnel/api/employees/*' => Http::response($env($empleados)),
            '*/iclock/api/transactions/*' => Http::response($env([])),
        ]);
    }

    private function ana(array $extra = []): array
    {
        return $extra + [
            'id' => 10, 'emp_code' => '100', 'first_name' => 'Ana', 'last_name' => 'López', 'gender' => 'F',
            'department' => ['dept_code' => 'D1'], 'position' => ['position_code' => 'P1'], 'hire_date' => '2021-06-24',
            'card_no' => '777', 'mobile' => '5551112222',
        ];
    }

    private function sync(): void
    {
        $this->empresa->refresh();
        $r = BioTimeSyncService::for($this->empresa)->sync($this->empresa);
        $this->assertTrue($r['ok'], json_encode($r['errors']));
    }

    public function test_apagado_por_defecto_no_crea_empleados(): void
    {
        $this->reloj([$this->ana()]);
        $this->sync();

        $this->assertSame(0, Empleado::withoutTenant()->count());
    }

    public function test_crea_al_nuevo_y_cada_sync_trae_sus_cambios_sin_pisar_ediciones_manuales(): void
    {
        $this->empresa->update(['biotime_auto_alta' => true]);

        $this->reloj([$this->ana()]);
        $this->sync();

        $e = Empleado::withoutTenant()->where('documento_identidad', '100')->firstOrFail();
        $this->assertSame('Ana', $e->nombres);
        $this->assertSame('F', $e->genero);
        $this->assertSame('2021-06-24', $e->fecha_ingreso->toDateString());
        $this->assertSame('Producción', $e->departamento()->withoutGlobalScope('multitenancy')->value('nombre'));
        $this->assertSame('Montacargista', $e->cargo()->withoutGlobalScope('multitenancy')->value('nombre'));
        $this->assertNull($e->turno_laboral_id);

        // Alguien corrige a mano el correo y el teléfono; BioTime cambia sólo el apellido.
        $e->update(['correo' => 'ana@ejemplo.test', 'telefono' => '999']);
        $this->reloj([$this->ana(['last_name' => 'López Ruiz'])]);
        $this->sync();

        $e->refresh();
        $this->assertSame('López Ruiz', $e->apellidos, 'Lo que cambia en el reloj llega solo.');
        $this->assertSame('999', $e->telefono, 'Lo editado a mano y sin cambio en el reloj se respeta.');
        $this->assertSame('ana@ejemplo.test', $e->correo);

        // Un sync sin cambios no duplica ni modifica nada.
        $this->sync();
        $this->assertSame(1, Empleado::withoutTenant()->count());

        // Alta de una persona nueva en el reloj.
        $this->reloj([$this->ana(['last_name' => 'López Ruiz']), $this->ana(['id' => 11, 'emp_code' => '101', 'first_name' => 'Beto', 'card_no' => '888', 'mobile' => null])]);
        $this->sync();
        $this->assertSame(2, Empleado::withoutTenant()->count());
    }

    public function test_rellena_lo_vacio_de_empleados_ya_vinculados_y_no_toca_otras_empresas(): void
    {
        $this->empresa->update(['biotime_auto_alta' => true]);
        $sucursal = Sucursal::withoutTenant()->where('empresa_id', $this->empresa->id)->first();
        $existente = Empleado::create([
            'nombres' => 'Ana', 'apellidos' => 'López', 'documento_identidad' => '100',
            'empresa_id' => $this->empresa->id, 'sucursal_id' => $sucursal->id, 'status' => true,
        ]);

        $otra = Empresa::create(['razon_social' => 'Otra', 'documento' => 'OT-1']);
        $ajeno = Empleado::create(['nombres' => 'X', 'apellidos' => 'Y', 'documento_identidad' => '555', 'empresa_id' => $otra->id, 'status' => true]);

        $this->reloj([$this->ana()]);
        $this->sync();

        $existente->refresh();
        $this->assertSame('F', $existente->genero);
        $this->assertNotNull($existente->cargo_id);
        $this->assertSame(1, Empleado::withoutTenant()->where('empresa_id', $this->empresa->id)->count());
        $this->assertSame(1, Empleado::withoutTenant()->where('empresa_id', $otra->id)->count());
        $this->assertNull($ajeno->fresh()->genero);
    }
}
