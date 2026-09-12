<?php

namespace Tests\Feature;

use App\Models\ContpaqiEmpleadoMapeo;
use App\Models\ContpaqiTipoIncidencia;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\IncidenciaEmpleado;
use App\Models\TurnoLaboral;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Comprueba que las pantallas responden y, sobre todo, que los permisos
 * separan de verdad quien mira de quien captura y de quien aprueba.
 *
 * Esa separación no es cosmética: una incidencia aprobada mueve dinero y tapa
 * faltas injustificadas, así que quien la captura no debe poder autorizarla.
 */
class ContpaqiPanelTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create([
            'razon_social' => 'Frigorífico de Prueba, S.A. de C.V.',
            'documento' => 'FDP-PANEL',
        ]);

        foreach ([
            'incidencias.view', 'incidencias.create', 'incidencias.edit',
            'incidencias.delete', 'incidencias.aprobar',
            'contpaqi.view', 'contpaqi.exportar', 'contpaqi.catalogo',
        ] as $nombre) {
            Permission::findOrCreate($nombre, 'web');
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }

    public function test_la_pantalla_de_prenomina_responde(): void
    {
        $this->actingAs($this->usuario(['contpaqi.view']))
            ->get('/admin/nomina/contpaqi')
            ->assertOk();
    }

    public function test_la_previsualizacion_llega_como_prop_cuando_se_pide_un_periodo(): void
    {
        $empleado = $this->empleadoConCodigo('180');

        IncidenciaEmpleado::create([
            'empresa_id' => $this->empresa->id,
            'empleado_id' => $empleado->id,
            'contpaqi_tipo_incidencia_id' => $this->tipo('VAC')->id,
            'fecha_inicio' => '2026-04-06',
            'fecha_fin' => '2026-04-08',
            'cantidad' => 3,
            'estado' => IncidenciaEmpleado::ESTADO_APROBADA,
        ]);

        $this->actingAs($this->usuario(['contpaqi.view']))
            ->get('/admin/nomina/contpaqi?desde=2026-04-06&hasta=2026-04-12')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/nomina/PrenominaContpaqi')
                ->where('previsualizacion.renglones.0.codigo_empleado', '180')
                ->where('previsualizacion.renglones.0.valores.VAC', 3)
            );
    }

    public function test_sin_permiso_de_exportar_no_se_puede_generar(): void
    {
        $this->actingAs($this->usuario(['contpaqi.view']))
            ->post('/admin/nomina/contpaqi/generar', ['desde' => '2026-04-06', 'hasta' => '2026-04-12'])
            ->assertForbidden();
    }

    public function test_la_pantalla_de_incidencias_responde(): void
    {
        $this->actingAs($this->usuario(['incidencias.view']))
            ->get('/admin/nomina/incidencias')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/nomina/Incidencias'));
    }

    public function test_quien_captura_no_puede_aprobar(): void
    {
        $usuario = $this->usuario(['incidencias.view', 'incidencias.create']);
        $empleado = $this->empleadoConCodigo('286');

        $this->actingAs($usuario)
            ->post('/admin/nomina/incidencias', [
                'empleado_id' => $empleado->id,
                'contpaqi_tipo_incidencia_id' => $this->tipo('VAC')->id,
                'fecha_inicio' => '2026-04-06',
                'fecha_fin' => '2026-04-08',
                'cantidad' => 3,
            ])
            ->assertRedirect();

        $incidencia = IncidenciaEmpleado::firstOrFail();
        $this->assertSame(IncidenciaEmpleado::ESTADO_PENDIENTE, $incidencia->estado);

        $this->actingAs($usuario)
            ->patch("/admin/nomina/incidencias/{$incidencia->id}/aprobar")
            ->assertForbidden();
    }

    public function test_no_se_puede_capturar_un_tipo_que_la_asistencia_ya_calcula(): void
    {
        $empleado = $this->empleadoConCodigo('320');

        // HE1 lo deriva la asistencia; capturarlo a mano pagaría dos veces.
        $this->actingAs($this->usuario(['incidencias.view', 'incidencias.create']))
            ->post('/admin/nomina/incidencias', [
                'empleado_id' => $empleado->id,
                'contpaqi_tipo_incidencia_id' => $this->tipo('HE1')->id,
                'fecha_inicio' => '2026-04-06',
                'fecha_fin' => '2026-04-06',
                'cantidad' => 3,
            ])
            ->assertSessionHasErrors('contpaqi_tipo_incidencia_id');
    }

    public function test_no_se_admite_la_misma_incidencia_dos_veces(): void
    {
        $usuario = $this->usuario(['incidencias.view', 'incidencias.create']);
        $empleado = $this->empleadoConCodigo('326');

        $datos = [
            'empleado_id' => $empleado->id,
            'contpaqi_tipo_incidencia_id' => $this->tipo('VAC')->id,
            'fecha_inicio' => '2026-04-06',
            'fecha_fin' => '2026-04-08',
            'cantidad' => 3,
        ];

        $this->actingAs($usuario)->post('/admin/nomina/incidencias', $datos)->assertRedirect();

        // Mismo empleado, mismo tipo, fechas traslapadas: doble captura.
        $this->actingAs($usuario)
            ->post('/admin/nomina/incidencias', [...$datos, 'fecha_inicio' => '2026-04-07', 'fecha_fin' => '2026-04-09'])
            ->assertSessionHasErrors('fecha_inicio');

        $this->assertSame(1, IncidenciaEmpleado::count());
    }

    public function test_el_mapeo_no_admite_dos_empleados_con_el_mismo_codigo(): void
    {
        $usuario = $this->usuario(['contpaqi.catalogo']);
        $this->empleadoConCodigo('431');

        $otro = Empleado::create([
            'nombres' => 'Otro',
            'apellidos' => 'Empleado',
            'documento_identidad' => 'DOC-OTRO',
            'empresa_id' => $this->empresa->id,
            'status' => true,
        ]);

        $this->actingAs($usuario)
            ->post('/admin/nomina/contpaqi/mapeos', ['empleado_id' => $otro->id, 'codigo_empleado' => '431'])
            ->assertSessionHasErrors('codigo_empleado');
    }

    /* ------------------------------------------------------------------ */

    /** @param  list<string>  $permisos */
    private function usuario(array $permisos): User
    {
        $usuario = User::factory()->create([
            'empresa_id' => $this->empresa->id,
            'sucursal_id' => null,
        ]);

        $usuario->givePermissionTo($permisos);

        return $usuario;
    }

    private function empleadoConCodigo(string $codigo): Empleado
    {
        $turno = TurnoLaboral::create([
            'empresa_id' => $this->empresa->id,
            'nombre' => "Turno {$codigo}",
            'hora_entrada' => '08:00:00',
            'hora_salida' => '17:00:00',
            'horas_diarias_ley' => 8.00,
            'dias_laborables' => [1, 2, 3, 4, 5],
        ]);

        $empleado = Empleado::create([
            'nombres' => 'Empleado',
            'apellidos' => $codigo,
            'documento_identidad' => "DOC-{$codigo}",
            'empresa_id' => $this->empresa->id,
            'turno_laboral_id' => $turno->id,
            'status' => true,
        ]);

        ContpaqiEmpleadoMapeo::create([
            'empresa_id' => $this->empresa->id,
            'empleado_id' => $empleado->id,
            'codigo_empleado' => $codigo,
            'activo' => true,
        ]);

        return $empleado;
    }

    private function tipo(string $mnemonico): ContpaqiTipoIncidencia
    {
        $semilla = collect(config('contpaqi.catalogo_semilla'))->firstWhere('mnemonico', $mnemonico);
        $derivados = collect(config('contpaqi.derivacion'))->filter()->values()->all();

        return ContpaqiTipoIncidencia::firstOrCreate(
            ['empresa_id' => $this->empresa->id, 'mnemonico' => $mnemonico],
            [
                'descripcion' => $semilla['descripcion'],
                'unidad' => $semilla['unidad'],
                'tipo_imss' => $semilla['tipo_imss'],
                'derecho_sueldo' => $semilla['derecho_sueldo'],
                'porcentaje_derecho' => $semilla['porcentaje_derecho'],
                'descuenta_septimo' => $semilla['descuenta_septimo'],
                'es_derivada' => in_array($mnemonico, $derivados, true),
                'activo' => true,
            ]
        );
    }
}
