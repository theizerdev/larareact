<?php

namespace Tests\Feature;

use App\Jobs\EnviarEmpleadoBioTime;
use App\Models\BiotimeDepartamento;
use App\Models\BiotimeEmpleado;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Services\BioTimeSyncService;
use App\Services\BioTimeWebService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Fotos en ambos sentidos con BioTime Cloud:
 * - Bajada: el sync copia la foto de perfil y la bio-foto, y se la pone al
 *   colaborador que no tiene foto.
 * - Subida: la API no recibe fotos, así que van por las importaciones de la
 *   interfaz web (sesión web + Importar foto / Importar bio-foto + Aprobar).
 */
class BioTimeFotosWebTest extends TestCase
{
    use RefreshDatabase;

    private const COMPANY_ID = 'e3bdebfe-4329-11f1-a11a-0a58a9feac02';

    private const CARPETA = 'e3bdebfe432911f1a11a0a58a9feac02';

    private const CSRF = 'tokenCSRFdePrueba0123456789';

    private Empresa $empresa;

    /** Archivos que "tiene" el BioTime falso, por ruta. */
    private array $fotos = [];

    /** Bio-fotos pendientes en el BioTime falso: id => [emp_code, archivo]. */
    private array $pendientes = [];

    /** Acciones recibidas por la interfaz web falsa. */
    private array $acciones = [];

    private bool $loginOk = true;

    private int $logins = 0;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create([
            'razon_social' => 'Empresa de Prueba', 'documento' => 'EP-1',
            'biotime_base_url' => 'https://bt.test', 'biotime_company' => 'acme',
            'biotime_username' => 'u@acme.test', 'biotime_password' => 'secreto', 'biotime_active' => true,
        ]);
        BiotimeDepartamento::create([
            'empresa_id' => $this->empresa->id, 'biotime_id' => 1, 'dept_code' => '1', 'dept_name' => 'Sistemas',
            'raw' => ['id' => 1, 'company' => ['id' => self::COMPANY_ID]],
        ]);

        $form = "<form><input type='hidden' name='csrfmiddlewaretoken' value='".self::CSRF."' /></form>";

        config(['biotime.web_fotos' => true]);

        Http::preventStrayRequests();
        Http::fake(function (Request $r) use ($form) {
            $path = parse_url($r->url(), PHP_URL_PATH);
            parse_str((string) parse_url($r->url(), PHP_URL_QUERY), $q);

            if (isset($this->fotos[$path])) {
                return Http::response($this->fotos[$path], 200, ['Content-Type' => 'image/jpeg']);
            }

            // --- Inicio de sesión web ---
            if ($path === '/login/' && $r->method() === 'GET') {
                return Http::response($form);
            }
            if ($path === '/accounts/check_company/') {
                return Http::response(json_encode(['ret' => 0, 'company_name' => 'acme', 'username' => 'u@acme.test', 'login_user' => 'user']), 200, ['Content-Type' => 'text/html']);
            }
            if ($path === '/accounts/redirect_check_company/') {
                return Http::response($form);
            }
            if ($path === '/login/' && $r->method() === 'POST') {
                $this->logins++;

                return Http::response(json_encode($this->loginOk ? ['ret' => 0] : ['ret' => -1, 'message' => 'mal']), 200, ['Content-Type' => 'text/plain']);
            }

            // --- Importaciones y aprobación ---
            if (in_array($path, ['/personnel/employee/action/', '/iclock/biophoto/action/'], true)) {
                if ($r->method() === 'GET') {
                    return Http::response($form);
                }

                $campos = [];
                foreach ($r->data() as $parte) {
                    $campos[$parte['name']][] = $parte['filename'] ?? $parte['contents'];
                }
                $this->acciones[] = [$path, $campos];

                if ($path === '/iclock/biophoto/action/' && isset($campos['bio_photo'])) {
                    $codigo = pathinfo($campos['bio_photo'][0], PATHINFO_FILENAME);
                    $this->pendientes[(string) (500 + count($this->pendientes))] = [$codigo, 'register/'.self::CARPETA.'/nueva-'.count($this->pendientes).'.jpg'];
                }
                if (isset($campos['state'])) {
                    foreach ($campos['id'] as $id) {
                        unset($this->pendientes[$id]);
                    }
                }

                return Http::response(['msg' => '', 'code' => 0]);
            }
            if ($path === '/iclock/biophoto/table/') {
                $filas = [];
                foreach ($this->pendientes as $id => [$codigo, $archivo]) {
                    if ($codigo === ($q['_p_employee__emp_code__exact'] ?? null)) {
                        $filas[] = ['id' => (string) $id, 'get_emp_code' => $codigo, 'bio_photo' => $archivo, 'approval_state' => 'Pendiente'];
                    }
                }

                return Http::response(['code' => 0, 'msg' => '', 'count' => count($filas), 'data' => $filas]);
            }

            return Http::response('<h1>Not Found</h1>', 404, ['Content-Type' => 'text/html']);
        });
    }

    private function jpg(int $lado = 300): string
    {
        ob_start();
        imagejpeg(imagecreatetruecolor($lado, $lado));

        return (string) ob_get_clean();
    }

    private function colaborador(array $extra = []): Empleado
    {
        return Empleado::withoutTenant()->create($extra + [
            'nombres' => 'Ana', 'apellidos' => 'López', 'documento_identidad' => '901',
            'empresa_id' => $this->empresa->id, 'status' => true,
        ]);
    }

    public function test_el_sync_baja_foto_de_perfil_y_bio_foto_y_se_la_pone_al_colaborador_sin_foto(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        Bus::fake();

        $perfil = $this->jpg(200);
        $rostro = $this->jpg(300);
        $this->fotos['/files/photo/'.self::CARPETA.'/901.jpg'] = $perfil;
        $this->fotos['/files/biophoto/'.self::CARPETA.'/901.jpg'] = $rostro;
        $this->fotos['/files/biophoto/'.self::CARPETA.'/902.jpg'] = $rostro;

        $ana = $this->colaborador();
        $luis = $this->colaborador(['nombres' => 'Luis', 'documento_identidad' => '902']);
        $conFoto = $this->colaborador(['nombres' => 'Eva', 'documento_identidad' => '903', 'foto_empleado' => '/storage/empleados/eva.jpg']);
        foreach ([[901, $ana], [902, $luis], [903, $conFoto]] as [$codigo, $e]) {
            BiotimeEmpleado::create(['empresa_id' => $this->empresa->id, 'biotime_id' => "uuid-{$codigo}", 'emp_code' => (string) $codigo, 'empleado_id' => $e->id]);
        }
        $this->fotos['/files/photo/'.self::CARPETA.'/903.jpg'] = $perfil;

        $r = BioTimeSyncService::for($this->empresa)->syncPhotos($this->empresa);

        $this->assertSame(['revisados' => 3, 'fotos' => 2, 'biofotos' => 2, 'nuevas' => 4, 'colaboradores' => 2, 'sin_respuesta' => 0], $r);

        $bio = BiotimeEmpleado::where('emp_code', '901')->first();
        $this->assertSame("biotime/fotos/{$this->empresa->id}/901.jpg", $bio->photo_path);
        $this->assertSame("biotime/biofotos/{$this->empresa->id}/901.jpg", $bio->biophoto_path);
        $this->assertNotNull($bio->photo_synced_at);

        // Ana recibe la de perfil; Luis, que sólo tiene bio-foto, recibe ésa.
        $fotoAna = $ana->fresh()->foto_empleado;
        $this->assertSame($perfil, Storage::disk('public')->get(str_replace('/storage/', '', $fotoAna)));
        $this->assertSame($rostro, Storage::disk('public')->get(str_replace('/storage/', '', $luis->fresh()->foto_empleado)));
        // Viene de BioTime: queda como ya exportada y no se programa un envío de vuelta.
        $this->assertSame($fotoAna, $bio->foto_exportada);
        Bus::assertNotDispatched(EnviarEmpleadoBioTime::class);
        // Una foto que ya existía en Hoshō no se toca.
        $this->assertSame('/storage/empleados/eva.jpg', $conFoto->fresh()->foto_empleado);

        // Segunda corrida: nada nuevo; si BioTime borra la foto, se borra la copia.
        unset($this->fotos['/files/biophoto/'.self::CARPETA.'/901.jpg']);
        $r2 = BioTimeSyncService::for($this->empresa)->syncPhotos($this->empresa);
        $this->assertSame(0, $r2['nuevas']);
        $this->assertSame(0, $r2['colaboradores']);
        $this->assertNull($bio->fresh()->biophoto_path);
        Storage::disk('local')->assertMissing("biotime/biofotos/{$this->empresa->id}/901.jpg");
        $this->assertSame($fotoAna, $ana->fresh()->foto_empleado);
    }

    public function test_la_subida_web_importa_foto_de_perfil_y_bio_foto_y_aprueba_solo_la_suya(): void
    {
        // Una bio-foto pendiente que subió otra persona para el mismo empleado: no se toca.
        $this->pendientes['77'] = ['901', 'register/'.self::CARPETA.'/ajena.jpg'];

        $web = new BioTimeWebService($this->empresa);
        $this->assertTrue($web->disponible());

        $this->assertSame(['success' => true, 'error' => null], $web->subirFotoPerfil('901', $this->jpg()));
        $r = $web->subirBioFoto('901', $this->jpg());

        $this->assertTrue($r['success']);
        $this->assertTrue($r['aprobada']);
        $this->assertSame(1, $this->logins, 'Una sola sesión web para las dos fotos.');

        [$perfil, $rostro, $aprobar] = $this->acciones;
        $this->assertSame('/personnel/employee/action/', $perfil[0]);
        $this->assertSame(['901.jpg'], $perfil[1]['bio_photo']);
        $this->assertSame(['1'], $perfil[1]['overwrite']);
        $this->assertSame([self::CSRF], $perfil[1]['csrfmiddlewaretoken']);
        $this->assertSame('/iclock/biophoto/action/', $rostro[0]);
        $this->assertSame(['901.jpg'], $rostro[1]['bio_photo']);
        $this->assertSame(['501'], $aprobar[1]['id']);
        $this->assertSame(['1'], $aprobar[1]['state']);
        $this->assertArrayHasKey('77', $this->pendientes);

        // La contraseña nunca viaja en claro en el inicio de sesión.
        Http::assertNotSent(fn (Request $q) => str_contains($q->body(), 'secreto') || str_contains($q->url(), 'secreto'));
    }

    public function test_si_la_sesion_web_falla_no_se_reintenta_enseguida_y_local_no_la_usa(): void
    {
        $this->loginOk = false;

        $r = (new BioTimeWebService($this->empresa))->subirFotoPerfil('901', $this->jpg());
        $this->assertFalse($r['success']);
        $this->assertSame([], $this->acciones);

        (new BioTimeWebService($this->empresa))->subirFotoPerfil('901', $this->jpg());
        $this->assertSame(1, $this->logins, 'Tras un rechazo no se vuelve a intentar el login enseguida.');

        // BioTime local (sin compañía) o con la vía apagada: no disponible.
        config(['biotime.web_fotos' => false]);
        $this->assertFalse((new BioTimeWebService($this->empresa))->disponible());
        config(['biotime.web_fotos' => true]);
        $this->empresa->update(['biotime_company' => null]);
        $this->assertFalse((new BioTimeWebService($this->empresa->fresh()))->disponible());
    }
}
