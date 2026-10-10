<?php

namespace Tests\Feature;

use App\Models\BiotimeEmpleado;
use App\Models\BiotimeMarcaje;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Alta de empleados desde el padrón del reloj: sin ella, en empresas cuyo
 * padrón vive en BioTime ninguna checada llega a la nómina.
 */
class BioTimeCrearEmpleadosTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    private Sucursal $sucursal;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create([
            'razon_social' => 'Empresa de Prueba, S.A. de C.V.',
            'documento' => 'EDP-ALTA',
            'biotime_active' => true,
        ]);

        $this->sucursal = Sucursal::create(['nombre' => 'Planta', 'empresa_id' => $this->empresa->id, 'status' => true]);

        User::factory()->create(['empresa_id' => $this->empresa->id]);

        DB::table('biotime_departamentos')->insert(['empresa_id' => $this->empresa->id, 'biotime_id' => 2, 'dept_code' => '2', 'dept_name' => 'Producción', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('biotime_cargos')->insert(['empresa_id' => $this->empresa->id, 'biotime_id' => 3, 'position_code' => '3', 'position_name' => 'Montacargista', 'created_at' => now(), 'updated_at' => now()]);
    }

    public function test_crea_y_vincula_con_el_codigo_del_reloj(): void
    {
        $bio = $this->delReloj('180', 'LAURA PATRICIA', 'GÓMEZ HERRERA', ['dept_code' => '2', 'position_code' => '3', 'card_no' => '5002']);
        $checada = BiotimeMarcaje::create([
            'empresa_id' => $this->empresa->id,
            'biotime_id' => 1,
            'emp_code' => '180',
            'biotime_empleado_id' => $bio->id,
            'punch_time' => '2026-09-14 07:30:00',
            'punch_state' => '0',
        ]);

        $this->artisan('biotime:crear-empleados', ['--empresa' => $this->empresa->id])->assertSuccessful();

        $empleado = Empleado::withoutTenant()->where('documento_identidad', '180')->firstOrFail();
        $this->assertSame('LAURA PATRICIA', $empleado->nombres);
        $this->assertSame('5002', $empleado->tarjeta_acceso_1);
        $this->assertSame($this->sucursal->id, $empleado->sucursal_id);
        $this->assertSame('Producción', $empleado->departamento()->withoutGlobalScope('multitenancy')->value('nombre'));
        $this->assertNull($empleado->turno_laboral_id, 'Un turno supuesto inventaría retardos.');

        $this->assertSame($empleado->id, $bio->fresh()->empleado_id);
        $this->assertSame($empleado->id, $checada->fresh()->empleado_id, 'Las checadas ya espejadas deben seguir al vínculo.');
    }

    public function test_reejecutar_no_duplica(): void
    {
        $this->delReloj('21', 'Tomás', 'Aguirre Solano');

        $this->artisan('biotime:crear-empleados', ['--empresa' => $this->empresa->id])->assertSuccessful();
        $this->artisan('biotime:crear-empleados', ['--empresa' => $this->empresa->id])->assertSuccessful();

        $this->assertSame(1, Empleado::withoutTenant()->count());
    }

    public function test_omite_numeros_ya_ocupados_en_vez_de_cargarle_checadas_a_otro(): void
    {
        Empleado::create(['nombres' => 'Otra', 'apellidos' => 'Persona', 'documento_identidad' => '46', 'empresa_id' => $this->empresa->id, 'status' => true]);
        $bio = $this->delReloj('46', 'NORA ISABEL', 'TAPIA MORALES');

        $this->artisan('biotime:crear-empleados', ['--empresa' => $this->empresa->id])->assertFailed();

        $this->assertNull($bio->fresh()->empleado_id);
        $this->assertSame(1, Empleado::withoutTenant()->count());
    }

    public function test_dry_run_no_escribe(): void
    {
        $this->delReloj('2', 'RENATA', 'IBARRA CÓRDOVA');

        $this->artisan('biotime:crear-empleados', ['--empresa' => $this->empresa->id, '--dry-run' => true])->assertSuccessful();

        $this->assertSame(0, Empleado::withoutTenant()->count());
    }

    private function delReloj(string $empCode, string $nombres, string $apellidos, array $extra = []): BiotimeEmpleado
    {
        return BiotimeEmpleado::create([
            'empresa_id' => $this->empresa->id,
            'biotime_id' => (int) $empCode,
            'emp_code' => $empCode,
            'first_name' => $nombres,
            'last_name' => $apellidos,
            'link_status' => 'unmatched',
            ...$extra,
        ]);
    }
}
