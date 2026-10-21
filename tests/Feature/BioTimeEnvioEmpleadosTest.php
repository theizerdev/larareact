<?php

namespace Tests\Feature;

use App\Models\BiotimeArea;
use App\Models\BiotimeCargo;
use App\Models\BiotimeDepartamento;
use App\Models\BiotimeEmpleado;
use App\Models\Cargo;
use App\Models\Departamento;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use App\Services\BioTimeFotoService;
use App\Services\BioTimeSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Lo que se crea o edita en Colaboradores llega a BioTime, sólo en las
 * empresas que lo activaron y sin rebotar lo que el propio sync trae.
 */
class BioTimeEnvioEmpleadosTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    private Departamento $produccion;

    private Cargo $montacargista;

    /** Empleados que "tiene" el BioTime falso, por emp_code. */
    private array $reloj = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create([
            'razon_social' => 'Empresa de Prueba', 'documento' => 'EP-1',
            'biotime_base_url' => 'http://biotime.test:8081', 'biotime_username' => 'u', 'biotime_password' => 'p',
            'biotime_active' => true, 'biotime_push' => true, 'biotime_push_area_id' => 5,
        ]);
        $sucursal = Sucursal::create(['nombre' => 'Planta', 'empresa_id' => $this->empresa->id, 'status' => true]);
        $user = User::factory()->create(['empresa_id' => $this->empresa->id]);

        BiotimeArea::create(['empresa_id' => $this->empresa->id, 'biotime_id' => 5, 'area_code' => 'A5', 'area_name' => 'Planta Norte']);
        BiotimeDepartamento::create(['empresa_id' => $this->empresa->id, 'biotime_id' => 1, 'dept_code' => '1', 'dept_name' => 'Department']);
        BiotimeDepartamento::create(['empresa_id' => $this->empresa->id, 'biotime_id' => 3, 'dept_code' => 'D3', 'dept_name' => 'Producción']);
        BiotimeCargo::create(['empresa_id' => $this->empresa->id, 'biotime_id' => 7, 'position_code' => 'P7', 'position_name' => 'Montacargista']);

        $this->produccion = Departamento::withoutTenant()->create(['nombre' => 'producción', 'empresa_id' => $this->empresa->id, 'sucursal_id' => $sucursal->id, 'user_id' => $user->id, 'status' => true]);
        $this->montacargista = Cargo::withoutTenant()->create(['nombre' => 'Montacargista', 'departamento_id' => $this->produccion->id, 'empresa_id' => $this->empresa->id, 'sucursal_id' => $sucursal->id, 'user_id' => $user->id, 'status' => true]);

        $this->fakeBioTime();
    }

    /** BioTime falso con estado: el POST agrega al empleado y el PATCH lo modifica. */
    private function fakeBioTime(array $respuestaAlta = []): void
    {
        $env = fn (array $rows) => ['count' => count($rows), 'next' => null, 'previous' => null, 'msg' => '', 'code' => 0, 'data' => array_values($rows)];

        Http::swap(new \Illuminate\Http\Client\Factory());
        Http::preventStrayRequests();
        Http::fake(function (Request $r) use ($env, $respuestaAlta) {
            $path = parse_url($r->url(), PHP_URL_PATH);

            if (str_ends_with($path, '/jwt-api-token-auth/')) {
                return Http::response(['token' => 't']);
            }

            if ($path === '/personnel/api/employees/' && $r->method() === 'GET') {
                parse_str((string) parse_url($r->url(), PHP_URL_QUERY), $q);

                return Http::response($env(isset($q['emp_code']) ? array_filter($this->reloj, fn ($e) => $e['emp_code'] === $q['emp_code']) : $this->reloj));
            }

            if ($path === '/personnel/api/employees/' && $r->method() === 'POST') {
                if ($respuestaAlta) {
                    return Http::response($respuestaAlta['body'], $respuestaAlta['status']);
                }
                $e = $r->data() + ['id' => 100 + count($this->reloj)];
                // El listado devuelve department / position como objeto.
                $e['department'] = ['id' => $e['department'], 'dept_code' => $e['department'] === 3 ? 'D3' : '1'];
                if (isset($e['position'])) {
                    $e['position'] = ['id' => $e['position'], 'position_code' => 'P'.$e['position']];
                }
                $this->reloj[$e['emp_code']] = $e;

                return Http::response($e, 201);
            }

            if (preg_match('#^/personnel/api/employees/(\d+)/$#', $path, $m) && $r->method() === 'PATCH') {
                foreach ($this->reloj as $code => $e) {
                    if ((string) $e['id'] === $m[1]) {
                        $this->reloj[$code] = $r->data() + $e;
                    }
                }

                return Http::response(['id' => (int) $m[1]] + $r->data());
            }

            return Http::response($env([]));
        });
    }

    private function escrituras(): array
    {
        return array_values(array_filter(
            Http::recorded()->all(),
            fn ($par) => in_array($par[0]->method(), ['POST', 'PATCH'], true) && str_contains($par[0]->url(), '/personnel/api/employees/'),
        ));
    }

    private function colaborador(array $extra = []): Empleado
    {
        return Empleado::withoutTenant()->create($extra + [
            'nombres' => 'Ana', 'apellidos' => 'López', 'documento_identidad' => '901',
            'telefono' => '5551112222', 'correo' => 'ana@example.com', 'genero' => 'F',
            'fecha_ingreso' => '2026-10-01', 'departamento_id' => $this->produccion->id, 'cargo_id' => $this->montacargista->id,
            'empresa_id' => $this->empresa->id, 'status' => true,
        ]);
    }

    public function test_apagado_no_escribe_en_biotime(): void
    {
        $this->empresa->update(['biotime_push' => false]);

        $this->colaborador();

        Http::assertNothingSent();
    }

    public function test_alta_en_la_web_da_de_alta_en_biotime_con_area_departamento_y_cargo(): void
    {
        $empleado = $this->colaborador();

        $alta = $this->escrituras();
        $this->assertCount(1, $alta);
        $this->assertSame('POST', $alta[0][0]->method());
        $this->assertSame([
            'first_name' => 'Ana', 'last_name' => 'López', 'mobile' => '5551112222', 'email' => 'ana@example.com',
            'gender' => 'F', 'hire_date' => '2026-10-01', 'emp_code' => '901', 'department' => 3, 'area' => [5], 'position' => 7,
        ], $alta[0][0]->data());

        $bio = BiotimeEmpleado::where('emp_code', '901')->first();
        $this->assertSame($empleado->id, (int) $bio->empleado_id);
        $this->assertSame('D3', $bio->dept_code);
        $this->assertNotNull($empleado->fresh()->biotime_pushed_at);
        $this->assertNull($empleado->fresh()->biotime_push_error);
    }

    public function test_si_ya_existe_en_biotime_se_vincula_y_solo_manda_lo_distinto(): void
    {
        $this->reloj['901'] = ['id' => 10, 'emp_code' => '901', 'first_name' => 'Ana', 'last_name' => 'Lopez', 'mobile' => '5551112222', 'email' => 'ana@example.com', 'gender' => 'F', 'hire_date' => '2026-10-01', 'department' => ['dept_code' => 'D3'], 'position' => ['position_code' => 'P7']];

        $empleado = $this->colaborador();

        $escrituras = $this->escrituras();
        $this->assertCount(1, $escrituras);
        $this->assertSame('PATCH', $escrituras[0][0]->method());
        $this->assertStringEndsWith('/personnel/api/employees/10/', $escrituras[0][0]->url());
        $this->assertSame(['last_name' => 'López'], $escrituras[0][0]->data());
        $this->assertSame($empleado->id, (int) BiotimeEmpleado::where('emp_code', '901')->value('empleado_id'));
    }

    public function test_editar_manda_solo_lo_que_cambio_y_un_campo_ajeno_no_escribe(): void
    {
        $empleado = $this->colaborador();
        $antes = count($this->escrituras());

        $empleado->update(['motivo_registro' => 'Reingreso']);
        $this->assertCount($antes, $this->escrituras());

        $empleado->update(['telefono' => '5559998888', 'apellidos' => 'López Ruiz']);
        $ultimas = array_slice($this->escrituras(), $antes);
        $this->assertCount(1, $ultimas);
        $this->assertSame('PATCH', $ultimas[0][0]->method());
        $this->assertSame(['last_name' => 'López Ruiz', 'mobile' => '5559998888'], $ultimas[0][0]->data());
        $this->assertSame('5559998888', BiotimeEmpleado::where('emp_code', '901')->value('mobile'));
    }

    public function test_fecha_de_nacimiento_viaja_como_birthday(): void
    {
        $empleado = $this->colaborador();
        $antes = count($this->escrituras());

        $empleado->update(['fecha_nacimiento' => '1990-05-17']);

        $ultimas = array_slice($this->escrituras(), $antes);
        $this->assertCount(1, $ultimas);
        $this->assertSame(['birthday' => '1990-05-17'], $ultimas[0][0]->data());
    }

    public function test_un_campo_vacio_en_la_web_no_borra_el_dato_de_biotime(): void
    {
        $empleado = $this->colaborador();
        $antes = count($this->escrituras());

        $empleado->update(['telefono' => null]);

        $this->assertCount($antes, $this->escrituras());
    }

    public function test_lo_que_trae_el_sync_no_rebota_a_biotime(): void
    {
        $this->empresa->update(['biotime_auto_alta' => true]);
        $this->reloj['100'] = ['id' => 10, 'emp_code' => '100', 'first_name' => 'Luis', 'last_name' => 'Pérez', 'gender' => 'M', 'department' => ['dept_code' => 'D3'], 'mobile' => '5550001111'];

        $r = BioTimeSyncService::for($this->empresa->fresh())->sync($this->empresa->fresh(), only: ['employees']);
        $this->assertTrue($r['ok'], json_encode($r['errors']));
        $this->assertSame(1, Empleado::withoutTenant()->where('documento_identidad', '100')->count());

        $this->reloj['100']['mobile'] = '5550002222';
        BioTimeSyncService::for($this->empresa->fresh())->sync($this->empresa->fresh(), only: ['employees']);
        $this->assertSame('5550002222', Empleado::withoutTenant()->where('documento_identidad', '100')->value('telefono'));

        $this->assertSame([], $this->escrituras());
    }

    public function test_numero_no_numerico_no_se_envia_y_queda_el_motivo(): void
    {
        $empleado = $this->colaborador(['documento_identidad' => 'LOPA900101']);

        $this->assertSame([], $this->escrituras());
        $this->assertStringContainsString('LOPA900101', $empleado->fresh()->biotime_push_error);
    }

    public function test_rechazo_de_biotime_queda_en_el_colaborador(): void
    {
        $this->fakeBioTime(['status' => 400, 'body' => ['card_no' => ['Esta tarjeta ya existe.']]]);

        $empleado = $this->colaborador(['tarjeta_acceso_1' => '777']);

        $this->assertStringContainsString('HTTP 400', $empleado->fresh()->biotime_push_error);
        $this->assertStringContainsString('tarjeta ya existe', $empleado->fresh()->biotime_push_error);
        $this->assertNull(BiotimeEmpleado::where('emp_code', '901')->first());
    }

    public function test_sin_area_configurada_no_da_de_alta(): void
    {
        $this->empresa->update(['biotime_push_area_id' => null]);

        $empleado = $this->colaborador();

        $this->assertSame([], $this->escrituras());
        $this->assertStringContainsString('área', $empleado->fresh()->biotime_push_error);
    }

    public function test_foto_queda_en_jpg_de_hasta_25_kb(): void
    {
        // Ruido: la imagen más difícil de comprimir.
        $img = imagecreatetruecolor(1600, 1200);
        for ($i = 0; $i < 40000; $i++) {
            imagefilledrectangle($img, $x = random_int(0, 1590), $y = random_int(0, 1190), $x + 10, $y + 10, random_int(0, 0xFFFFFF));
        }
        ob_start();
        imagepng($img);
        $png = ob_get_clean();

        $jpg = app(BioTimeFotoService::class)->preparar($png);

        $this->assertNotNull($jpg);
        $this->assertStringStartsWith("\xFF\xD8", $jpg);
        $this->assertLessThanOrEqual(25 * 1024, strlen($jpg));
        [$ancho, $alto] = getimagesizefromstring($jpg);
        $this->assertGreaterThanOrEqual(200, min($ancho, $alto));
        $this->assertNull(app(BioTimeFotoService::class)->preparar('no soy una imagen'));
    }

    public function test_zip_de_bio_photos_usa_el_numero_de_empleado(): void
    {
        Storage::fake('public');
        $img = imagecreatetruecolor(800, 1000);
        ob_start();
        imagejpeg($img);
        Storage::disk('public')->put('empleados/ana.jpg', ob_get_clean());

        $empleado = $this->colaborador(['foto_empleado' => '/storage/empleados/ana.jpg']);
        $destino = tempnam(sys_get_temp_dir(), 'zip');

        $r = app(BioTimeFotoService::class)->exportarZip($this->empresa, $destino);

        $this->assertSame(1, $r['fotos']);
        $zip = new \ZipArchive();
        $zip->open($destino);
        $this->assertNotFalse($zip->locateName('901.jpg'));
        $this->assertLessThanOrEqual(25 * 1024, $zip->statName('901.jpg')['size']);
        $zip->close();
        @unlink($destino);
        $this->assertNotNull($empleado);
    }

    public function test_zip_de_pendientes_solo_trae_fotos_nuevas_o_cambiadas(): void
    {
        Storage::fake('public');
        $img = imagecreatetruecolor(800, 1000);
        ob_start();
        imagejpeg($img);
        $jpg = ob_get_clean();
        Storage::disk('public')->put('empleados/ana.jpg', $jpg);
        Storage::disk('public')->put('empleados/ana-nueva.jpg', $jpg);

        $empleado = $this->colaborador(['foto_empleado' => '/storage/empleados/ana.jpg']);
        $fotos = app(BioTimeFotoService::class);
        $destino = tempnam(sys_get_temp_dir(), 'zip');

        $this->assertSame(1, $fotos->pendientes($this->empresa));
        $this->assertSame(1, $fotos->exportarZip($this->empresa, $destino, soloPendientes: true)['fotos']);
        $this->assertSame(0, $fotos->pendientes($this->empresa));
        $this->assertSame(0, $fotos->exportarZip($this->empresa, $destino, soloPendientes: true)['fotos']);
        // "Todas" sigue trayendo las ya exportadas.
        $this->assertSame(1, $fotos->exportarZip($this->empresa, $destino)['fotos']);

        // Al subir otra foto cambia la ruta y vuelve a quedar pendiente.
        $empleado->update(['foto_empleado' => '/storage/empleados/ana-nueva.jpg']);
        $this->assertSame(1, $fotos->pendientes($this->empresa));
        $this->assertSame(1, $fotos->exportarZip($this->empresa, $destino, soloPendientes: true)['fotos']);
        @unlink($destino);
    }
}
