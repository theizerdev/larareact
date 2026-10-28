<?php

namespace Tests\Feature\Api;

use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * Enrolamiento biométrico desde la app: mismas validaciones que el kiosko web
 * y cada cuenta sólo puede enrolar a quien le corresponde.
 */
class EnrolamientoAppTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    private User $user;

    private Empleado $empleado;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->empresa = Empresa::create(['razon_social' => 'Smurfit Test', 'documento' => 'DOC-ENRAPP', 'status' => true]);
        $this->user = User::factory()->create(['empresa_id' => $this->empresa->id, 'status' => 'activo']);
        $this->empleado = $this->crearEmpleado('900', $this->user->id);
    }

    private function crearEmpleado(string $numero, ?int $userId = null, ?int $empresaId = null): Empleado
    {
        $empleado = new Empleado;
        $empleado->forceFill([
            'nombres' => 'Ana', 'apellidos' => 'Rostro '.$numero,
            'documento_identidad' => $numero, 'codigo_acceso' => $numero,
            'empresa_id' => $empresaId ?? $this->empresa->id, 'user_id' => $userId,
            'status' => true, 'permite_app_movil' => true,
        ])->save();

        return $empleado;
    }

    private function fotoDataUri(): string
    {
        $img = imagecreatetruecolor(4, 4);
        ob_start();
        imagejpeg($img);

        return 'data:image/jpeg;base64,'.base64_encode((string) ob_get_clean());
    }

    private function datos(array $extra = []): array
    {
        return $extra + [
            'aviso_privacidad' => true,
            'foto_empleado' => $this->fotoDataUri(),
            'foto_empleado_2' => $this->fotoDataUri(),
            'genero' => 'F',
            'fecha_nacimiento' => '1990-05-20',
        ];
    }

    public function test_mi_empleado_indica_si_falta_enrolar(): void
    {
        $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/reloj-checador/mi-empleado')
            ->assertOk()
            ->assertJsonPath('empleado.enrolado', false)
            ->assertJsonPath('empleado.nombres', 'Ana')
            ->assertJsonPath('empleado.empresa_nombre', 'Smurfit Test');
    }

    public function test_el_empleado_se_enrola_a_si_mismo(): void
    {
        $otro = $this->crearEmpleado('901');

        $this->actingAs($this->user, 'sanctum')
            // Un empleado_id ajeno se ignora: sólo se enrola a sí mismo.
            ->postJson('/api/reloj-checador/enrolar', $this->datos(['empleado_id' => $otro->id]))
            ->assertOk()
            ->assertJsonPath('empleado.id', $this->empleado->id)
            ->assertJsonPath('empleado.enrolado', true)
            ->assertJsonPath('empleado.genero', 'F');

        $this->empleado->refresh();
        $this->assertNotNull($this->empleado->enrolado_en);
        $this->assertSame('1990-05-20', $this->empleado->fecha_nacimiento->format('Y-m-d'));
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $this->empleado->foto_empleado));
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $this->empleado->foto_empleado_2));
        $this->assertNull($otro->fresh()->enrolado_en);
    }

    public function test_exige_aviso_y_las_dos_fotos(): void
    {
        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/reloj-checador/enrolar', $this->datos([
                'aviso_privacidad' => false,
                'foto_empleado_2' => '',
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['aviso_privacidad', 'foto_empleado_2']);

        $this->assertNull($this->empleado->fresh()->enrolado_en);
    }

    public function test_sin_permiso_de_app_movil_no_se_enrola(): void
    {
        $this->empleado->forceFill(['permite_app_movil' => false])->save();

        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/reloj-checador/enrolar', $this->datos())
            ->assertForbidden();
    }

    public function test_el_kiosko_enrola_a_otros_con_permiso(): void
    {
        $kiosko = User::factory()->create(['empresa_id' => $this->empresa->id, 'status' => 'activo']);
        $kiosko->givePermissionTo(Permission::firstOrCreate(['name' => 'asistencia.kiosko', 'guard_name' => 'web']));

        $this->actingAs($kiosko, 'sanctum')
            ->postJson('/api/reloj-checador/enrolar', $this->datos(['empleado_id' => $this->empleado->id]))
            ->assertOk()
            ->assertJsonPath('empleado.id', $this->empleado->id);

        $this->assertNotNull($this->empleado->fresh()->enrolado_en);
    }

    public function test_sin_permiso_no_enrola_a_otros(): void
    {
        $cuenta = User::factory()->create(['empresa_id' => $this->empresa->id, 'status' => 'activo']);

        $this->actingAs($cuenta, 'sanctum')
            ->postJson('/api/reloj-checador/enrolar', $this->datos(['empleado_id' => $this->empleado->id]))
            ->assertForbidden();

        $this->assertNull($this->empleado->fresh()->enrolado_en);
    }

    public function test_el_kiosko_no_enrola_empleados_de_otra_empresa(): void
    {
        $otraEmpresa = Empresa::create(['razon_social' => 'Otra', 'documento' => 'DOC-OTRA', 'status' => true]);
        $ajeno = $this->crearEmpleado('902', null, $otraEmpresa->id);
        $kiosko = User::factory()->create(['empresa_id' => $this->empresa->id, 'status' => 'activo']);
        $kiosko->givePermissionTo(Permission::firstOrCreate(['name' => 'asistencia.kiosko', 'guard_name' => 'web']));

        $this->actingAs($kiosko, 'sanctum')
            ->postJson('/api/reloj-checador/enrolar', $this->datos(['empleado_id' => $ajeno->id]))
            ->assertNotFound();
    }
}
