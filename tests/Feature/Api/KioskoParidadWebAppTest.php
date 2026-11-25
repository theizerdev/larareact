<?php

namespace Tests\Feature\Api;

use App\Models\Empleado;
use App\Models\EmpleadoEnrolamientoCedula;
use App\Models\EmpleadoEnrolamientoLog;
use App\Models\Empresa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * La API de la app responde igual que el kiosko web: comida sólo al iniciar,
 * números de empleado unificados, búsqueda por filtros para enrolar y cédula
 * de enrolamiento con su auditoría.
 */
class KioskoParidadWebAppTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    private User $kiosko;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->empresa = Empresa::create(['razon_social' => 'Smurfit Westrock', 'documento' => 'DOC-PARIDAD', 'status' => true]);
        $this->kiosko = User::factory()->create(['empresa_id' => $this->empresa->id, 'status' => 'activo']);
        $this->kiosko->givePermissionTo(Permission::firstOrCreate(['name' => 'asistencia.kiosko', 'guard_name' => 'web']));
    }

    private function crearEmpleado(array $datos = [], ?int $empresaId = null): Empleado
    {
        $empleado = new Empleado;
        $empleado->forceFill($datos + [
            'nombres' => 'Ana',
            'apellidos' => 'Rostro',
            'documento_identidad' => 'SW-100',
            'empresa_id' => $empresaId ?? $this->empresa->id,
            'status' => true,
            'permite_app_movil' => true,
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

    private function datosEnrolamiento(array $extra = []): array
    {
        return $extra + [
            'aviso_privacidad' => true,
            'foto_empleado' => $this->fotoDataUri(),
            'foto_empleado_2' => $this->fotoDataUri(),
            'genero' => 'F',
            'fecha_nacimiento' => '1990-05-20',
        ];
    }

    public function test_tras_iniciar_la_comida_se_sugiere_la_salida(): void
    {
        $cuenta = User::factory()->create(['empresa_id' => $this->empresa->id, 'status' => 'activo']);
        $empleado = $this->crearEmpleado(['user_id' => $cuenta->id]);

        foreach (['entrada', 'salida_comida'] as $tipo) {
            $this->actingAs($cuenta, 'sanctum')
                ->postJson('/api/reloj-checador/registrar', ['empleado_id' => $empleado->id, 'tipo_marcaje' => $tipo])
                ->assertOk();
            $this->travel(2)->minutes();
        }

        // Sin menú de comida: el inicio se registra directo y ya no hay "fin de comida".
        $this->actingAs($cuenta, 'sanctum')
            ->getJson('/api/reloj-checador/mi-empleado')
            ->assertOk()
            ->assertJsonPath('ultimo_marcaje.tipo', 'salida_comida')
            ->assertJsonPath('sugerencia_marcaje', 'salida');
    }

    public function test_buscar_devuelve_los_numeros_unificados_del_web(): void
    {
        $this->crearEmpleado([
            'codigo_nuevo' => 'SW-200',
            'documento_identidad' => null,
            'codigo_anterior' => 'ANT-9',
            'legacy' => 'Norte',
        ]);

        $this->actingAs($this->kiosko, 'sanctum')
            ->postJson('/api/reloj-checador/buscar', ['query' => 'ANT-9'])
            ->assertOk()
            ->assertJsonPath('empleado.codigo_nuevo', 'SW-200')
            ->assertJsonPath('empleado.documento_identidad', 'SW-200')
            ->assertJsonPath('empleado.codigo_anterior', 'ANT-9')
            ->assertJsonPath('empleado.legacy', 'Norte')
            ->assertJsonPath('empleado.apellidos', 'Rostro')
            ->assertJsonPath('sugerencia_marcaje', 'entrada');
    }

    public function test_busca_a_quien_enrolar_con_los_filtros_del_web(): void
    {
        $this->crearEmpleado(['nombres' => 'María José', 'apellidos' => 'López', 'documento_identidad' => 'SW-301', 'correo' => 'mj@sw.com']);
        $this->crearEmpleado(['nombres' => 'Pedro', 'apellidos' => 'López', 'documento_identidad' => 'SW-302', 'codigo_anterior' => 'ANT-302']);
        $this->crearEmpleado(['nombres' => 'Inactivo', 'apellidos' => 'López', 'documento_identidad' => 'SW-303', 'status' => false]);
        $otraEmpresa = Empresa::create(['razon_social' => 'Otra', 'documento' => 'DOC-OTRA', 'status' => true]);
        $this->crearEmpleado(['nombres' => 'Ajeno', 'apellidos' => 'López', 'documento_identidad' => 'SW-304'], $otraEmpresa->id);

        $buscar = fn (array $filtros) => $this->actingAs($this->kiosko, 'sanctum')
            ->postJson('/api/reloj-checador/buscar-enrolamiento', $filtros);

        // Sólo activos de la propia empresa.
        $buscar(['apellidos' => 'lópez'])->assertOk()->assertJsonCount(2, 'empleados');
        // Filtros combinados, sin distinguir mayúsculas.
        $buscar(['nombres' => 'maría', 'apellidos' => 'LÓPEZ'])
            ->assertOk()
            ->assertJsonCount(1, 'empleados')
            ->assertJsonPath('empleados.0.correo', 'mj@sw.com')
            ->assertJsonPath('empleados.0.enrolado', false);
        // El número busca también el anterior.
        $buscar(['numero' => 'ANT-302'])->assertOk()->assertJsonPath('empleados.0.nombres', 'Pedro');
        $buscar(['correo' => 'MJ@SW'])->assertOk()->assertJsonCount(1, 'empleados');
        $buscar([])->assertStatus(422)->assertJsonPath('success', false);
    }

    public function test_sin_permiso_no_busca_a_quien_enrolar(): void
    {
        $cuenta = User::factory()->create(['empresa_id' => $this->empresa->id, 'status' => 'activo']);

        $this->actingAs($cuenta, 'sanctum')
            ->postJson('/api/reloj-checador/buscar-enrolamiento', ['apellidos' => 'Rostro'])
            ->assertForbidden();
    }

    public function test_aviso_de_privacidad_y_enrolamiento_generan_la_cedula(): void
    {
        $empleado = $this->crearEmpleado(['legacy' => 'Norte']);

        $cedulaUuid = $this->actingAs($this->kiosko, 'sanctum')
            ->postJson('/api/reloj-checador/enrolamiento/accion', [
                'empleado_id' => $empleado->id,
                'accion' => 'aviso_privacidad',
                'latitud' => 20.67,
                'longitud' => -103.35,
            ])
            ->assertOk()
            ->assertJsonPath('log.accion', 'aviso_privacidad')
            ->json('cedula_uuid');

        $respuesta = $this->actingAs($this->kiosko, 'sanctum')
            ->postJson('/api/reloj-checador/enrolar', $this->datosEnrolamiento([
                'empleado_id' => $empleado->id,
                'cedula_uuid' => $cedulaUuid,
            ]))
            ->assertOk()
            ->assertJsonPath('empleado.enrolado', true)
            ->assertJsonPath('cedula.uuid', $cedulaUuid)
            ->assertJsonPath('cedula.estado', EmpleadoEnrolamientoCedula::ESTADO_COMPLETADO);

        $this->assertNotEmpty($respuesta->json('cedula.sello_digital'));

        // Una sola cédula, con el aviso y el enrolamiento en su bitácora.
        $cedula = EmpleadoEnrolamientoCedula::where('empleado_id', $empleado->id)->sole();
        $this->assertSame('app', $cedula->origen);
        $this->assertSame('Norte', $cedula->codigo_legacy);
        $this->assertEqualsCanonicalizing(
            [EmpleadoEnrolamientoLog::ACCION_AVISO_PRIVACIDAD, EmpleadoEnrolamientoLog::ACCION_ENROLAMIENTO],
            $cedula->logs()->pluck('accion')->all(),
        );
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $cedula->pdf_path));
    }

    public function test_sin_aviso_previo_el_enrolamiento_lo_registra(): void
    {
        $empleado = $this->crearEmpleado();

        $this->actingAs($this->kiosko, 'sanctum')
            ->postJson('/api/reloj-checador/enrolar', $this->datosEnrolamiento(['empleado_id' => $empleado->id]))
            ->assertOk()
            ->assertJsonPath('cedula.estado', EmpleadoEnrolamientoCedula::ESTADO_COMPLETADO);

        $cedula = EmpleadoEnrolamientoCedula::where('empleado_id', $empleado->id)->sole();
        $this->assertNotNull($cedula->aviso_privacidad_aceptado_en);
    }

    public function test_la_accion_respeta_quien_puede_enrolar(): void
    {
        $empleado = $this->crearEmpleado();
        $cuenta = User::factory()->create(['empresa_id' => $this->empresa->id, 'status' => 'activo']);

        $this->actingAs($cuenta, 'sanctum')
            ->postJson('/api/reloj-checador/enrolamiento/accion', [
                'empleado_id' => $empleado->id,
                'accion' => 'aviso_privacidad',
            ])
            ->assertForbidden();

        $this->assertSame(0, EmpleadoEnrolamientoLog::count());
    }

    public function test_el_enlace_de_enrolamiento_genera_la_cedula_publica(): void
    {
        $empleado = $this->crearEmpleado();
        $empleado->forceFill([
            'enrolamiento_token' => str_repeat('a', 48),
            'enrolamiento_token_expires_at' => now()->addDay(),
        ])->save();

        $this->postJson('/api/enrolamiento/'.str_repeat('a', 48), $this->datosEnrolamiento())
            ->assertOk()
            ->assertJsonPath('cedula.estado', EmpleadoEnrolamientoCedula::ESTADO_COMPLETADO);

        $this->assertSame('publico', EmpleadoEnrolamientoCedula::where('empleado_id', $empleado->id)->sole()->origen);
    }
}
