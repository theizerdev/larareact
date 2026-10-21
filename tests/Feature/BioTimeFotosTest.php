<?php

namespace Tests\Feature;

use App\Models\BiotimeDepartamento;
use App\Models\BiotimeEmpleado;
use App\Models\Empresa;
use App\Models\User;
use App\Services\BioTimeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * Foto de perfil de BioTime: BioTime Cloud la guarda en la carpeta de la
 * compañía (/files/photo/<company id sin guiones>/<emp_code>.jpg). La raíz
 * /files/photo/<emp_code>.jpg es compartida entre compañías y no se usa.
 */
class BioTimeFotosTest extends TestCase
{
    use RefreshDatabase;

    private const COMPANY_ID = 'e3bdebfe-4329-11f1-a11a-0a58a9feac02';

    private const CARPETA = 'e3bdebfe432911f1a11a0a58a9feac02';

    private Empresa $empresa;

    /** Fotos que "tiene" el BioTime falso, por ruta. */
    private array $fotos = [];

    private bool $caido = false;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create([
            'razon_social' => 'Empresa de Prueba', 'documento' => 'EP-1',
            'biotime_base_url' => 'https://bt.test', 'biotime_company' => 'acme',
            'biotime_username' => 'u@acme.test', 'biotime_password' => 'p', 'biotime_active' => true,
        ]);

        Http::preventStrayRequests();
        Http::fake(function (Request $r) {
            $path = parse_url($r->url(), PHP_URL_PATH);

            if ($this->caido) {
                throw new \Illuminate\Http\Client\ConnectionException('timeout');
            }
            if (str_ends_with($path, '/jwt-api-token-auth/')) {
                return Http::response(['token' => 't']);
            }
            if ($path === '/personnel/api/departments/') {
                return Http::response(['count' => 1, 'next' => null, 'data' => [['id' => 1, 'company' => ['id' => self::COMPANY_ID]]]]);
            }
            if (isset($this->fotos[$path])) {
                return Http::response($this->fotos[$path], 200, ['Content-Type' => 'image/jpeg']);
            }

            return Http::response('<h1>Not Found</h1>', 404, ['Content-Type' => 'text/html']);
        });
    }

    private function conEspejo(): void
    {
        BiotimeDepartamento::create([
            'empresa_id' => $this->empresa->id, 'biotime_id' => 1, 'dept_code' => '1', 'dept_name' => 'Sistemas',
            'raw' => ['id' => 1, 'company' => ['id' => self::COMPANY_ID]],
        ]);
    }

    public function test_cloud_usa_la_carpeta_de_la_compania_y_no_la_raiz_compartida(): void
    {
        $this->conEspejo();
        $this->fotos['/files/photo/1181.jpg'] = 'foto-de-otra-compania';
        $this->fotos['/files/photo/'.self::CARPETA.'/1181.jpg'] = 'foto-propia';

        $r = (new BioTimeService($this->empresa))->getEmployeePhoto('1181');

        $this->assertTrue($r['success']);
        $this->assertSame('foto-propia', $r['body']);

        $this->fotos['/files/photo/02.jpg'] = 'foto-de-otra-compania';
        $sinFoto = (new BioTimeService($this->empresa))->getEmployeePhoto('02');
        $this->assertFalse($sinFoto['success']);
        $this->assertSame(404, $sinFoto['status']);

        Http::assertNotSent(fn (Request $r) => parse_url($r->url(), PHP_URL_PATH) === '/files/photo/1181.jpg');
        // Las fotos se sirven sin token: no hace falta iniciar sesión.
        Http::assertNotSent(fn (Request $r) => str_ends_with($r->url(), '/jwt-api-token-auth/'));
    }

    public function test_sin_espejo_pide_el_id_de_compania_a_biotime(): void
    {
        $this->fotos['/files/photo/'.self::CARPETA.'/7.jpg'] = 'jpg';

        $this->assertSame(self::CARPETA, (new BioTimeService($this->empresa))->carpetaFotos());
        $this->assertTrue((new BioTimeService($this->empresa))->getEmployeePhoto('7')['success']);
    }

    public function test_biotime_local_sin_compania_usa_la_raiz(): void
    {
        $this->empresa->update(['biotime_company' => null]);
        $this->fotos['/files/photo/7.jpg'] = 'jpg';

        $this->assertTrue((new BioTimeService($this->empresa))->getEmployeePhoto('7')['success']);
    }

    public function test_la_foto_se_guarda_en_disco_privado_por_empresa(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        $this->conEspejo();
        $this->fotos['/files/photo/'.self::CARPETA.'/1181.jpg'] = 'foto-propia';

        Permission::findOrCreate('biotime.view', 'web');
        $user = User::factory()->create(['empresa_id' => $this->empresa->id]);
        $user->givePermissionTo('biotime.view');
        $bio = BiotimeEmpleado::create(['empresa_id' => $this->empresa->id, 'biotime_id' => 'uuid-1', 'emp_code' => '1181', 'first_name' => 'F']);
        $sinFoto = BiotimeEmpleado::create(['empresa_id' => $this->empresa->id, 'biotime_id' => 'uuid-2', 'emp_code' => '02', 'first_name' => 'R']);

        $this->actingAs($user)->get("/admin/biotime/empleados/{$bio->id}/foto")
            ->assertOk()
            ->assertHeader('Content-Type', 'image/jpeg');
        Storage::disk('local')->assertExists("biotime/fotos/{$this->empresa->id}/1181.jpg");
        $this->assertSame([], Storage::disk('public')->allFiles());

        // Sin foto en BioTime: 404 y no se vuelve a consultar en cada vista.
        $this->actingAs($user)->get("/admin/biotime/empleados/{$sinFoto->id}/foto")->assertNotFound();
        $this->actingAs($user)->get("/admin/biotime/empleados/{$sinFoto->id}/foto")->assertNotFound();
        Http::assertSentCount(2);

        // Con BioTime caído se sirve la última copia aunque sea vieja.
        touch(Storage::disk('local')->path("biotime/fotos/{$this->empresa->id}/1181.jpg"), now()->subHours(2)->getTimestamp());
        $this->caido = true;
        $this->actingAs($user)->get("/admin/biotime/empleados/{$bio->id}/foto")->assertOk();
    }

    public function test_otra_empresa_no_ve_la_foto(): void
    {
        $otra = Empresa::create(['razon_social' => 'Otra', 'documento' => 'OT-1']);
        Permission::findOrCreate('biotime.view', 'web');
        $user = User::factory()->create(['empresa_id' => $otra->id]);
        $user->givePermissionTo('biotime.view');
        $bio = BiotimeEmpleado::create(['empresa_id' => $this->empresa->id, 'biotime_id' => 'uuid-1', 'emp_code' => '1181', 'first_name' => 'F']);

        $this->actingAs($user)->get("/admin/biotime/empleados/{$bio->id}/foto")->assertForbidden();
        Http::assertNothingSent();
    }
}
