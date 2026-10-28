<?php

namespace Tests\Feature\Api;

use App\Models\Departamento;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * Enrolamiento desde la app con el enlace/QR que manda RH (C2) y alta del
 * empleado que aún no está en el sistema (B).
 */
class EnrolamientoEnlaceAltaAppTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    private Empleado $empleado;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->empresa = Empresa::create(['razon_social' => 'Smurfit Test', 'documento' => 'DOC-ENLACE', 'status' => true]);
        $this->empleado = $this->crearEmpleado('900');
    }

    private function crearEmpleado(string $numero, ?int $empresaId = null): Empleado
    {
        $empleado = new Empleado;
        $empleado->forceFill([
            'nombres' => 'Ana', 'apellidos' => 'Rostro '.$numero,
            'documento_identidad' => $numero, 'codigo_acceso' => $numero,
            'empresa_id' => $empresaId ?? $this->empresa->id,
            'status' => true, 'permite_app_movil' => true,
        ])->save();

        return $empleado;
    }

    private function crearArea(string $nombre, int $empresaId): Departamento
    {
        $sucursal = Sucursal::create(['nombre' => 'Planta', 'empresa_id' => $empresaId, 'status' => true]);
        $area = new Departamento;
        $area->forceFill([
            'nombre' => $nombre, 'empresa_id' => $empresaId, 'sucursal_id' => $sucursal->id,
            'user_id' => User::factory()->create(['empresa_id' => $empresaId])->id, 'status' => 1,
        ])->save();

        return $area;
    }

    private function usuarioCon(string ...$permisos): User
    {
        $user = User::factory()->create(['empresa_id' => $this->empresa->id, 'status' => 'activo']);
        foreach ($permisos as $permiso) {
            $user->givePermissionTo(Permission::firstOrCreate(['name' => $permiso, 'guard_name' => 'web']));
        }

        return $user;
    }

    private function datos(): array
    {
        $img = imagecreatetruecolor(4, 4);
        ob_start();
        imagejpeg($img);
        $foto = 'data:image/jpeg;base64,'.base64_encode((string) ob_get_clean());

        return [
            'aviso_privacidad' => true,
            'foto_empleado' => $foto,
            'foto_empleado_2' => $foto,
            'genero' => 'F',
            'fecha_nacimiento' => '1990-05-20',
        ];
    }

    private function generarToken(): string
    {
        $enlace = $this->actingAs($this->usuarioCon('empleados.edit'), 'sanctum')
            ->postJson('/api/reloj-checador/enlace-enrolamiento', ['empleado_id' => $this->empleado->id])
            ->assertOk()
            ->json('enlace');

        $this->app['auth']->forgetGuards();

        return basename(parse_url($enlace, PHP_URL_PATH));
    }

    // ── C2 · Enlace / QR ─────────────────────────────────────────────────────

    public function test_rh_genera_el_enlace_y_el_empleado_se_enrola_sin_sesion(): void
    {
        $token = $this->generarToken();
        $this->assertSame($token, $this->empleado->fresh()->enrolamiento_token);

        $this->getJson("/api/enrolamiento/{$token}")
            ->assertOk()
            ->assertJsonPath('empleado.id', $this->empleado->id)
            ->assertJsonPath('empleado.documento_identidad', '900')
            ->assertJsonPath('empleado.enrolado', false)
            ->assertJsonPath('empleado.empresa_nombre', 'Smurfit Test');

        $this->postJson("/api/enrolamiento/{$token}", $this->datos())
            ->assertOk()
            ->assertJsonPath('empleado.enrolado', true);

        $this->assertNotNull($this->empleado->fresh()->enrolado_en);
    }

    public function test_generar_enlace_exige_permiso(): void
    {
        $this->actingAs($this->usuarioCon('asistencia.kiosko'), 'sanctum')
            ->postJson('/api/reloj-checador/enlace-enrolamiento', ['empleado_id' => $this->empleado->id])
            ->assertForbidden();
    }

    public function test_no_genera_enlace_de_empleados_de_otra_empresa(): void
    {
        $otra = Empresa::create(['razon_social' => 'Otra', 'documento' => 'DOC-OTRA2', 'status' => true]);
        $ajeno = $this->crearEmpleado('950', $otra->id);

        $this->actingAs($this->usuarioCon('empleados.edit'), 'sanctum')
            ->postJson('/api/reloj-checador/enlace-enrolamiento', ['empleado_id' => $ajeno->id])
            ->assertNotFound();
        $this->assertNull($ajeno->fresh()->enrolamiento_token);
    }

    public function test_enlace_invalido_o_vencido(): void
    {
        $this->getJson('/api/enrolamiento/no-existe')->assertNotFound();

        $token = $this->generarToken();
        $this->empleado->forceFill(['enrolamiento_token_expires_at' => now()->subMinute()])->save();

        $this->getJson("/api/enrolamiento/{$token}")->assertStatus(410);
        $this->postJson("/api/enrolamiento/{$token}", $this->datos())->assertStatus(410);
        $this->assertNull($this->empleado->fresh()->enrolado_en);
    }

    public function test_un_enlace_nuevo_invalida_el_anterior(): void
    {
        $viejo = $this->generarToken();
        $nuevo = $this->generarToken();

        $this->assertNotSame($viejo, $nuevo);
        $this->getJson("/api/enrolamiento/{$viejo}")->assertNotFound();
        $this->getJson("/api/enrolamiento/{$nuevo}")->assertOk();
    }

    public function test_enrolar_con_enlace_valida_los_datos(): void
    {
        $token = $this->generarToken();

        $this->postJson("/api/enrolamiento/{$token}", ['aviso_privacidad' => false] + $this->datos())
            ->assertStatus(422)
            ->assertJsonValidationErrors(['aviso_privacidad']);
    }

    // ── B · Alta sin datos ───────────────────────────────────────────────────

    public function test_alta_de_empleado_para_enrolarlo(): void
    {
        $area = $this->crearArea('Corrugadora', $this->empresa->id);
        $user = $this->usuarioCon('empleados.create', 'asistencia.kiosko');

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/reloj-checador/departamentos')
            ->assertOk()
            ->assertJsonPath('departamentos.0.nombre', 'Corrugadora');

        $id = $this->actingAs($user, 'sanctum')
            ->postJson('/api/reloj-checador/empleados', [
                'numero' => ' 12345 ',
                'nombres' => 'Luis',
                'apellidos' => 'Nuevo',
                'departamento_id' => $area->id,
            ])
            ->assertCreated()
            ->assertJsonPath('empleado.documento_identidad', '12345')
            ->assertJsonPath('empleado.departamento', 'Corrugadora')
            ->assertJsonPath('empleado.enrolado', false)
            ->json('empleado.id');

        $nuevo = Empleado::find($id);
        $this->assertSame($this->empresa->id, $nuevo->empresa_id);
        $this->assertNotEmpty($nuevo->codigo_acceso);

        // Y el kiosko ya lo puede enrolar.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/reloj-checador/enrolar', ['empleado_id' => $id] + $this->datos())
            ->assertOk();
        $this->assertNotNull($nuevo->fresh()->enrolado_en);
    }

    public function test_alta_exige_numero_y_que_no_se_repita(): void
    {
        $user = $this->usuarioCon('empleados.create');

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/reloj-checador/empleados', ['nombres' => 'Luis', 'apellidos' => 'Nuevo'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['numero']);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/reloj-checador/empleados', ['numero' => '900', 'nombres' => 'Luis', 'apellidos' => 'Nuevo'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['numero']);

        $this->assertSame(1, Empleado::withoutTenant()->count());
    }

    public function test_alta_exige_permiso(): void
    {
        $this->actingAs($this->usuarioCon('asistencia.kiosko'), 'sanctum')
            ->postJson('/api/reloj-checador/empleados', ['numero' => '777', 'nombres' => 'Luis', 'apellidos' => 'Nuevo'])
            ->assertForbidden();
    }

    public function test_alta_no_acepta_areas_de_otra_empresa(): void
    {
        $otra = Empresa::create(['razon_social' => 'Otra', 'documento' => 'DOC-OTRA3', 'status' => true]);
        $areaAjena = $this->crearArea('Ajena', $otra->id);

        $this->actingAs($this->usuarioCon('empleados.create'), 'sanctum')
            ->postJson('/api/reloj-checador/empleados', [
                'numero' => '777', 'nombres' => 'Luis', 'apellidos' => 'Nuevo', 'departamento_id' => $areaAjena->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['departamento_id']);
    }
}
