<?php

namespace Tests\Feature;

use App\Models\BiotimeEmpleado;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use App\Services\BioTimeEmpleadoPusher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * El espejo de BioTime apunta a un id que allá ya no existe (borrado o dado de
 * alta de nuevo). Antes el enrolamiento fallaba para siempre con "No Employee
 * matches the given query"; ahora se vuelve a vincular o a dar de alta.
 */
class BioTimeEspejoVencidoTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    private Empleado $empleado;

    /** PATCH que recibió BioTime, por id. */
    private array $patches = [];

    private bool $creado = false;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();

        $this->empresa = Empresa::create([
            'razon_social' => 'Empresa de Prueba', 'documento' => 'EP-VENCIDO',
            'biotime_base_url' => 'http://biotime.test:8081', 'biotime_username' => 'u', 'biotime_password' => 'p',
            'biotime_active' => true, 'biotime_push' => true,
        ]);
        $sucursal = Sucursal::create(['nombre' => 'Planta', 'empresa_id' => $this->empresa->id, 'status' => true]);
        User::factory()->create(['empresa_id' => $this->empresa->id]);
        DB::table('biotime_departamentos')->insert(['empresa_id' => $this->empresa->id, 'biotime_id' => 2, 'dept_code' => '2', 'dept_name' => 'Producción', 'created_at' => now(), 'updated_at' => now()]);

        $this->empleado = new Empleado;
        $this->empleado->forceFill([
            'nombres' => 'Raúl', 'apellidos' => 'Enrolado', 'documento_identidad' => '100',
            'empresa_id' => $this->empresa->id, 'sucursal_id' => $sucursal->id, 'status' => true,
            'genero' => 'M', 'fecha_nacimiento' => '2005-06-13',
        ])->save();

        $espejo = new BiotimeEmpleado;
        $espejo->forceFill([
            'empresa_id' => $this->empresa->id, 'biotime_id' => 99, 'emp_code' => '100',
            'first_name' => 'Raúl', 'last_name' => 'Enrolado', 'empleado_id' => $this->empleado->id,
        ])->save();
    }

    /** BioTime sin el id 99; [$vigente] es lo que hay con el número 100. */
    private function reloj(?array $vigente): void
    {
        $env = fn (array $rows) => ['count' => count($rows), 'next' => null, 'previous' => null, 'msg' => '', 'code' => 0, 'data' => $rows];

        Http::fake(function (Request $request) use ($vigente, $env) {
            $url = $request->url();
            if (str_contains($url, 'jwt-api-token-auth')) {
                return Http::response(['token' => 't']);
            }
            if (! str_contains($url, '/personnel/api/employees/')) {
                return Http::response([]); // foto
            }

            $nuevo = ['id' => 120, 'emp_code' => '100', 'first_name' => 'Raúl', 'last_name' => 'Enrolado'];
            if ($request->method() === 'PATCH') {
                preg_match('#/employees/(\d+)/#', $url, $m);
                $this->patches[] = (int) $m[1];

                return $m[1] === '99'
                    ? Http::response(['detail' => 'No Employee matches the given query.'], 406)
                    : Http::response(['id' => (int) $m[1], 'emp_code' => '100']);
            }
            if ($request->method() === 'POST') {
                $this->creado = true;

                return Http::response($nuevo, 201);
            }

            return Http::response($env($this->creado ? [$nuevo] : ($vigente ? [$vigente] : [])));
        });
    }

    public function test_si_lo_borraron_en_biotime_lo_vuelve_a_dar_de_alta(): void
    {
        $this->reloj(null);

        $r = app(BioTimeEmpleadoPusher::class)->enviar($this->empleado);

        $this->assertTrue($r['ok'], $r['mensaje']);
        $this->assertSame('creado', $r['accion']);
        $this->assertTrue($this->creado);
        $espejos = BiotimeEmpleado::withoutGlobalScopes()->where('emp_code', '100')->get();
        $this->assertCount(1, $espejos);
        $this->assertSame(120, (int) $espejos->first()->biotime_id);
        $this->assertSame($this->empleado->id, (int) $espejos->first()->empleado_id);
    }

    public function test_si_lo_dieron_de_alta_de_nuevo_usa_el_id_vigente(): void
    {
        $this->reloj(['id' => 150, 'emp_code' => '100', 'first_name' => 'Raúl', 'last_name' => 'Enrolado']);

        $r = app(BioTimeEmpleadoPusher::class)->enviar($this->empleado);

        $this->assertTrue($r['ok'], $r['mensaje']);
        $this->assertSame('actualizado', $r['accion']);
        $this->assertFalse($this->creado, 'No debe duplicarlo en BioTime.');
        $this->assertSame([99, 150], $this->patches);
        $this->assertSame(150, (int) BiotimeEmpleado::withoutGlobalScopes()->where('emp_code', '100')->value('biotime_id'));
    }

    public function test_otros_rechazos_de_biotime_siguen_siendo_error(): void
    {
        Http::fake([
            '*/jwt-api-token-auth/' => Http::response(['token' => 't']),
            '*/personnel/api/employees/*' => Http::response(['message' => 'Mobile number already registered'], 406),
        ]);

        $r = app(BioTimeEmpleadoPusher::class)->enviar($this->empleado);

        $this->assertFalse($r['ok']);
        $this->assertStringContainsString('Mobile number already registered', $r['mensaje']);
    }
}
