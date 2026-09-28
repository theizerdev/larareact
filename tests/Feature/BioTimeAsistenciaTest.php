<?php

namespace Tests\Feature;

use App\Models\AsistenciaMarcaje;
use App\Models\AsistenciaResumenDiario;
use App\Models\BiotimeEmpleado;
use App\Models\BiotimeMarcaje;
use App\Models\ContpaqiEmpleadoMapeo;
use App\Models\ContpaqiExportacion;
use App\Models\ContpaqiTipoIncidencia;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\TurnoLaboral;
use App\Models\User;
use App\Services\BioTimeAsistenciaService;
use App\Services\Contpaqi\ContpaqiExportService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * El puente reloj → asistencia → nómina: que una checada de BioTime termine
 * como día trabajado en la prenómina de CONTPAQi, sin duplicarse, siguiendo
 * los cambios de vínculo y sin tocar nóminas ya pagadas.
 */
class BioTimeAsistenciaTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    private TurnoLaboral $turno;

    private int $siguienteId = 1;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create([
            'razon_social' => 'Empacadora de Prueba, S.A. de C.V.',
            'documento' => 'EDP-RELOJ',
            'biotime_base_url' => 'http://biotime.test:8081',
            'biotime_username' => 'Sistemas',
            'biotime_password' => 'secret',
            'biotime_active' => true,
        ]);

        $this->turno = TurnoLaboral::create([
            'empresa_id' => $this->empresa->id,
            'nombre' => 'Diurno lunes a viernes',
            'hora_entrada' => '08:00:00',
            'hora_salida' => '17:00:00',
            'horas_diarias_ley' => 8.00,
            'dias_laborables' => [1, 2, 3, 4, 5],
        ]);

        foreach (['contpaqi.view', 'contpaqi.exportar'] as $nombre) {
            Permission::findOrCreate($nombre, 'web');
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        foreach (config('contpaqi.catalogo_semilla', []) as $fila) {
            ContpaqiTipoIncidencia::create([
                'empresa_id' => $this->empresa->id,
                'mnemonico' => $fila['mnemonico'],
                'descripcion' => $fila['descripcion'],
                'unidad' => $fila['unidad'],
                'tipo_imss' => $fila['tipo_imss'],
                'derecho_sueldo' => $fila['derecho_sueldo'],
                'porcentaje_derecho' => $fila['porcentaje_derecho'],
                'descuenta_septimo' => $fila['descuenta_septimo'],
                'es_derivada' => false,
                'activo' => true,
            ]);
        }
    }

    public function test_las_checadas_del_reloj_llegan_a_la_prenomina_como_dias_trabajados(): void
    {
        $empleado = $this->empleado('100');
        $bio = $this->vincularAlReloj($empleado, '100');

        // Lunes 6 a viernes 10 de abril, 8:00 a 17:00 con comida de una hora.
        foreach (['06', '07', '08', '09', '10'] as $dia) {
            $this->checada($bio, "2026-04-{$dia} 08:00:00", '0');
            $this->checada($bio, "2026-04-{$dia} 13:00:00", '2');
            $this->checada($bio, "2026-04-{$dia} 14:00:00", '3');
            $this->checada($bio, "2026-04-{$dia} 17:00:00", '1');
        }

        $r = $this->servicio()->importar($this->empresa);

        $this->assertSame(5, $r['dias']);
        $this->assertSame(20, $r['marcajes']);

        $resumen = AsistenciaResumenDiario::where('empleado_id', $empleado->id)->whereDate('fecha', '2026-04-06')->first();
        $this->assertEquals(8.00, (float) $resumen->horas_ordinarias);
        $this->assertEquals(60, $resumen->minutos_descanso_reales);

        $prenomina = app(ContpaqiExportService::class)->previsualizar(
            $this->empresa,
            CarbonImmutable::parse('2026-04-06'),
            CarbonImmutable::parse('2026-04-12')->endOfDay(),
        );

        $valores = $prenomina['renglones'][0]['valores'];
        $this->assertEquals(5, $valores['TRAB']);
        $this->assertArrayNotHasKey('FINJ', $valores, 'Con las checadas del reloj no debe haber faltas.');
    }

    public function test_reimportar_no_duplica_checadas(): void
    {
        $empleado = $this->empleado('100');
        $bio = $this->vincularAlReloj($empleado, '100');
        $this->checada($bio, '2026-04-06 08:00:00', '0');
        $this->checada($bio, '2026-04-06 17:00:00', '1');

        $this->servicio()->importar($this->empresa);
        $segunda = $this->servicio()->importar($this->empresa);
        $forzada = $this->servicio()->importar($this->empresa, forzar: true);

        $this->assertSame(0, $segunda['dias'], 'Sin cambios en el espejo no hay días sucios.');
        $this->assertSame(1, $forzada['dias']);
        $this->assertSame(2, AsistenciaMarcaje::where('origen', 'biotime')->count());
        $this->assertSame(1, AsistenciaResumenDiario::count());
    }

    public function test_un_reloj_sin_teclas_de_estado_se_clasifica_por_orden(): void
    {
        $empleado = $this->empleado('100');
        $bio = $this->vincularAlReloj($empleado, '100');

        // Todo llega como "0" (entrada), con un rebote a los 30 segundos.
        $this->checada($bio, '2026-04-06 07:58:00', '0');
        $this->checada($bio, '2026-04-06 07:58:30', '0');
        $this->checada($bio, '2026-04-06 13:00:00', '0');
        $this->checada($bio, '2026-04-06 13:45:00', '0');
        $this->checada($bio, '2026-04-06 18:00:00', '0');

        $this->servicio()->importar($this->empresa);

        $tipos = AsistenciaMarcaje::orderBy('fecha_hora')->orderBy('id')->pluck('tipo_marcaje')->all();
        $this->assertSame(['entrada', 'duplicado', 'salida_comida', 'entrada_comida', 'salida'], $tipos);

        // 7:58 a 18:00 son 10h02m, menos 45 de comida: 8h ordinarias y 1.28 extra.
        $resumen = AsistenciaResumenDiario::first();
        $this->assertEquals(8.00, (float) $resumen->horas_ordinarias);
        $this->assertEquals(1.28, (float) $resumen->horas_extra_diarias);
    }

    public function test_una_checada_nueva_reclasifica_el_dia_completo(): void
    {
        $empleado = $this->empleado('100');
        $bio = $this->vincularAlReloj($empleado, '100');
        $this->checada($bio, '2026-04-06 08:00:00', '0');
        $this->checada($bio, '2026-04-06 13:00:00', '0');

        $this->servicio()->importar($this->empresa);
        $this->assertSame(['entrada', 'salida'], AsistenciaMarcaje::orderBy('fecha_hora')->pluck('tipo_marcaje')->all());

        $this->checada($bio, '2026-04-06 14:00:00', '0');
        $this->checada($bio, '2026-04-06 17:00:00', '0');
        $this->servicio()->importar($this->empresa);

        $this->assertSame(
            ['entrada', 'salida_comida', 'entrada_comida', 'salida'],
            AsistenciaMarcaje::orderBy('fecha_hora')->pluck('tipo_marcaje')->all()
        );
        $this->assertEquals(8.00, (float) AsistenciaResumenDiario::first()->horas_ordinarias);
    }

    public function test_corregir_el_vinculo_mueve_las_checadas_al_empleado_correcto(): void
    {
        $equivocado = $this->empleado('100');
        $correcto = $this->empleado('200');
        $bio = $this->vincularAlReloj($equivocado, '100');
        $this->checada($bio, '2026-04-06 08:00:00', '0');
        $this->checada($bio, '2026-04-06 17:00:00', '1');

        $this->servicio()->importar($this->empresa);
        $this->assertEquals(8.00, (float) AsistenciaResumenDiario::where('empleado_id', $equivocado->id)->first()->horas_ordinarias);

        // Como lo hace BioTimeController::vincular.
        $bio->update(['empleado_id' => $correcto->id, 'link_status' => 'manual']);
        BiotimeMarcaje::where('biotime_empleado_id', $bio->id)->update(['empleado_id' => $correcto->id]);

        $r = $this->servicio()->importar($this->empresa);

        $this->assertSame(2, $r['dias'], 'Se recalcula el día del que salen y el día al que llegan.');
        $this->assertSame(0, AsistenciaMarcaje::where('empleado_id', $equivocado->id)->count());
        $this->assertSame(2, AsistenciaMarcaje::where('empleado_id', $correcto->id)->count());
        $this->assertEquals(0, (float) AsistenciaResumenDiario::where('empleado_id', $equivocado->id)->first()->horas_ordinarias);
        $this->assertEquals(8.00, (float) AsistenciaResumenDiario::where('empleado_id', $correcto->id)->first()->horas_ordinarias);
    }

    public function test_desvincular_quita_las_checadas_de_asistencia(): void
    {
        $empleado = $this->empleado('100');
        $bio = $this->vincularAlReloj($empleado, '100');
        $this->checada($bio, '2026-04-06 08:00:00', '0');
        $this->checada($bio, '2026-04-06 17:00:00', '1');
        $this->servicio()->importar($this->empresa);

        $bio->update(['empleado_id' => null, 'link_status' => 'unmatched']);
        BiotimeMarcaje::where('biotime_empleado_id', $bio->id)->update(['empleado_id' => null]);
        $this->servicio()->importar($this->empresa);

        $this->assertSame(0, AsistenciaMarcaje::count());
        $this->assertEquals(0, (float) AsistenciaResumenDiario::first()->horas_ordinarias);
    }

    public function test_no_toca_dias_de_un_periodo_ya_cerrado(): void
    {
        $empleado = $this->empleado('100');
        $bio = $this->vincularAlReloj($empleado, '100');

        ContpaqiExportacion::create([
            'empresa_id' => $this->empresa->id,
            'periodo_inicio' => '2026-04-06',
            'periodo_fin' => '2026-04-12',
            'estado' => ContpaqiExportacion::ESTADO_CERRADA,
            'lote_uuid' => (string) Str::uuid(),
            'cerrada_at' => now(),
        ]);

        // Una checada que BioTime subió tarde, después de pagar la nómina.
        $this->checada($bio, '2026-04-08 08:00:00', '0');
        $this->checada($bio, '2026-04-13 08:00:00', '0');

        $r = $this->servicio()->importar($this->empresa);

        $this->assertSame(1, $r['bloqueados']);
        $this->assertSame(1, $r['dias']);
        $this->assertNull(AsistenciaResumenDiario::whereDate('fecha', '2026-04-08')->first());
    }

    public function test_el_recalculo_desde_el_panel_no_depende_de_la_sucursal_del_usuario(): void
    {
        $sucursalEmpleado = Sucursal::create(['nombre' => 'Planta', 'empresa_id' => $this->empresa->id, 'status' => true]);
        $sucursalUsuario = Sucursal::create(['nombre' => 'Oficinas', 'empresa_id' => $this->empresa->id, 'status' => true]);

        $empleado = $this->empleado('100', ['sucursal_id' => $sucursalEmpleado->id]);
        $bio = $this->vincularAlReloj($empleado, '100');
        $this->checada($bio, '2026-04-06 08:00:00', '0');
        $this->servicio()->importar($this->empresa);

        $this->checada($bio, '2026-04-06 17:00:00', '1');

        Http::fake([
            '*/jwt-api-token-auth/' => Http::response(['token' => 't'], 200),
            '*/iclock/api/transactions/*' => Http::response(['count' => 0, 'next' => null, 'data' => []]),
        ]);

        $usuario = $this->usuario(['contpaqi.view', 'contpaqi.exportar'], ['sucursal_id' => $sucursalUsuario->id]);

        $this->actingAs($usuario)
            ->post('/admin/nomina/contpaqi/sincronizar-reloj', ['desde' => '2026-04-06', 'hasta' => '2026-04-12'])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('notification.type', 'success');

        $resumenes = AsistenciaResumenDiario::withoutTenant()->where('empleado_id', $empleado->id)->get();
        $this->assertCount(1, $resumenes, 'El usuario de otra sucursal no debe duplicar el resumen.');
        $this->assertEquals(8.00, (float) $resumenes->first()->horas_ordinarias);
        $this->assertSame($sucursalEmpleado->id, $resumenes->first()->sucursal_id);
    }

    public function test_el_panel_avisa_de_empleados_de_nomina_sin_checadas_y_codigos_sin_vincular(): void
    {
        $conReloj = $this->empleado('100');
        $sinVincular = $this->empleado('200');
        $bio = $this->vincularAlReloj($conReloj, '100');
        $this->checada($bio, '2026-04-06 08:00:00', '0');
        $this->servicio()->importar($this->empresa);

        $huerfano = BiotimeEmpleado::create(['empresa_id' => $this->empresa->id, 'biotime_id' => 77, 'emp_code' => '777', 'link_status' => 'unmatched']);
        $this->checada($huerfano, '2026-04-07 08:00:00', '0');

        $this->actingAs($this->usuario(['contpaqi.view']))
            ->get('/admin/nomina/contpaqi?desde=2026-04-06&hasta=2026-04-12')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('relojChecador.conectado', true)
                ->where('relojChecador.checadas_sin_vincular', 1)
                ->where('relojChecador.codigos_sin_vincular', 1)
                ->where('relojChecador.dias_por_importar', 0)
                ->where('relojChecador.empleados_sin_checadas_total', 1)
                ->where('relojChecador.empleados_sin_checadas.0.id', $sinVincular->id)
                ->where('relojChecador.empleados_sin_checadas.0.vinculado_reloj', false)
            );
    }

    /* ------------------------------------------------------------------ */
    /*  Andamiaje */
    /* ------------------------------------------------------------------ */

    private function servicio(): BioTimeAsistenciaService
    {
        return app(BioTimeAsistenciaService::class);
    }

    private function empleado(string $codigo, array $extra = []): Empleado
    {
        $empleado = Empleado::create([
            'nombres' => 'Empleado',
            'apellidos' => $codigo,
            'documento_identidad' => "DOC-{$codigo}",
            'empresa_id' => $this->empresa->id,
            'turno_laboral_id' => $this->turno->id,
            'status' => true,
            ...$extra,
        ]);

        ContpaqiEmpleadoMapeo::create([
            'empresa_id' => $this->empresa->id,
            'empleado_id' => $empleado->id,
            'codigo_empleado' => $codigo,
            'activo' => true,
        ]);

        return $empleado;
    }

    private function vincularAlReloj(Empleado $empleado, string $empCode): BiotimeEmpleado
    {
        return BiotimeEmpleado::create([
            'empresa_id' => $this->empresa->id,
            'biotime_id' => (int) $empCode,
            'emp_code' => $empCode,
            'empleado_id' => $empleado->id,
            'link_status' => 'auto',
        ]);
    }

    private function checada(BiotimeEmpleado $bio, string $hora, string $estado): BiotimeMarcaje
    {
        return BiotimeMarcaje::create([
            'empresa_id' => $this->empresa->id,
            'biotime_id' => $this->siguienteId++,
            'emp_code' => $bio->emp_code,
            'biotime_empleado_id' => $bio->id,
            'empleado_id' => $bio->empleado_id,
            'dispositivo_sn' => 'AEW1',
            'dispositivo_alias' => 'Planta',
            'punch_time' => $hora,
            'punch_state' => $estado,
        ]);
    }

    private function usuario(array $permisos, array $extra = []): User
    {
        $usuario = User::factory()->create([
            'empresa_id' => $this->empresa->id,
            'sucursal_id' => null,
            ...$extra,
        ]);

        $usuario->givePermissionTo($permisos);

        return $usuario;
    }
}
