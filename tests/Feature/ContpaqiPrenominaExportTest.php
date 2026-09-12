<?php

namespace Tests\Feature;

use App\Models\AsistenciaResumenDiario;
use App\Models\ContpaqiEmpleadoMapeo;
use App\Models\ContpaqiExportacion;
use App\Models\ContpaqiExportacionDetalle;
use App\Models\ContpaqiTipoIncidencia;
use App\Models\DiaFestivo;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\IncidenciaEmpleado;
use App\Models\TurnoLaboral;
use App\Services\Contpaqi\ContpaqiExportService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * El período de prueba es el mismo que se ve en el CONTPAQi del cliente:
 * "15 - Semanal del lunes, 6 de abril de 2026 al domingo, 12 de abril de 2026".
 */
class ContpaqiPrenominaExportTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    private TurnoLaboral $turno;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create([
            'razon_social' => 'Frigorífico de Prueba, S.A. de C.V.',
            'documento' => 'FDP-1',
        ]);

        $this->turno = TurnoLaboral::create([
            'empresa_id' => $this->empresa->id,
            'nombre' => 'Diurno lunes a viernes',
            'hora_entrada' => '08:00:00',
            'hora_salida' => '17:00:00',
            'horas_diarias_ley' => 8.00,
            'dias_laborables' => [1, 2, 3, 4, 5],
        ]);

        $this->sembrarCatalogo();
    }

    /* ------------------------------------------------------------------ */
    /*  Derivación desde la asistencia */
    /* ------------------------------------------------------------------ */

    public function test_deriva_dias_trabajados_horas_extra_con_regla_3x3_y_retardos(): void
    {
        $empleado = $this->empleado('Ana', 'Ruiz', '180');

        // Lunes a viernes de jornada completa. Las horas extra suman 11, que
        // con la regla 3x3 se parten en 9 dobles y 2 triples.
        $extras = ['2026-04-06' => 3.0, '2026-04-07' => 3.0, '2026-04-08' => 3.0, '2026-04-09' => 2.0, '2026-04-10' => 0.0];

        foreach ($extras as $fecha => $extra) {
            $this->resumen($empleado, $fecha, [
                'horas_ordinarias' => 8.00,
                'horas_extra_diarias' => $extra,
                'minutos_retraso' => $fecha === '2026-04-06' ? 30 : 0,
            ]);
        }

        $valores = $this->valoresDe($empleado);

        $this->assertSame(5.0, $valores['TRAB']);
        $this->assertSame(9.0, $valores['HE1'], 'Las primeras 9 horas extra del período van al doble.');
        $this->assertSame(2.0, $valores['HE2'], 'El excedente de 9 horas va al triple.');
        $this->assertSame(0.5, $valores['RET'], 'El catálogo mide los retardos en horas, no en minutos.');
    }

    public function test_un_dia_trabajado_cae_en_una_sola_categoria(): void
    {
        $empleado = $this->empleado('Beto', 'Lara', '286');

        // Jueves declarado festivo oficial, y sábado de descanso semanal.
        DiaFestivo::create([
            'empresa_id' => $this->empresa->id,
            'fecha' => '2026-04-09',
            'descripcion' => 'Jueves Santo',
            'es_oficial_lft' => true,
        ]);

        $this->resumen($empleado, '2026-04-06', ['horas_ordinarias' => 8.00]);
        $this->resumen($empleado, '2026-04-09', ['horas_ordinarias' => 8.00]);
        $this->resumen($empleado, '2026-04-11', ['horas_ordinarias' => 8.00, 'es_dia_descanso' => true]);

        $valores = $this->valoresDe($empleado);

        $this->assertSame(1.0, $valores['TRAB'], 'Sólo el lunes es un día trabajado normal.');
        $this->assertSame(1.0, $valores['DDOL'], 'El festivo oficial trabajado va a DDOL.');
        $this->assertSame(1.0, $valores['DDL'], 'El día de descanso trabajado va a DDL.');
        $this->assertSame(3.0, array_sum([$valores['TRAB'], $valores['DDOL'], $valores['DDL']]),
            'Tres días trabajados producen tres unidades en total, no más.');
    }

    public function test_el_festivo_no_oficial_se_separa_del_obligatorio(): void
    {
        $empleado = $this->empleado('Carla', 'Mena', '320');

        DiaFestivo::create([
            'empresa_id' => $this->empresa->id,
            'fecha' => '2026-04-07',
            'descripcion' => 'Aniversario de la empresa',
            'es_oficial_lft' => false,
        ]);

        $this->resumen($empleado, '2026-04-07', ['horas_ordinarias' => 8.00]);

        $valores = $this->valoresDe($empleado);

        $this->assertSame(1.0, $valores['DFT']);
        $this->assertArrayNotHasKey('DDOL', $valores);
    }

    /* ------------------------------------------------------------------ */
    /*  Faltas: la derivación que descuenta dinero */
    /* ------------------------------------------------------------------ */

    public function test_deriva_falta_injustificada_en_dia_laborable_sin_marcajes(): void
    {
        $empleado = $this->empleado('Dora', 'Pinto', '326');

        // Trabajó lunes y martes; miércoles, jueves y viernes no aparece.
        $this->resumen($empleado, '2026-04-06', ['horas_ordinarias' => 8.00]);
        $this->resumen($empleado, '2026-04-07', ['horas_ordinarias' => 8.00]);

        $valores = $this->valoresDe($empleado);

        $this->assertSame(2.0, $valores['TRAB']);
        $this->assertSame(3.0, $valores['FINJ']);
    }

    public function test_una_incidencia_aprobada_impide_que_el_dia_se_marque_como_falta(): void
    {
        $empleado = $this->empleado('Elsa', 'Vera', '341');

        $this->incidencia($empleado, 'VAC', '2026-04-08', '2026-04-10', 3, IncidenciaEmpleado::ESTADO_APROBADA);

        $this->resumen($empleado, '2026-04-06', ['horas_ordinarias' => 8.00]);
        $this->resumen($empleado, '2026-04-07', ['horas_ordinarias' => 8.00]);

        $valores = $this->valoresDe($empleado);

        $this->assertArrayNotHasKey('FINJ', $valores, 'Quien está de vacaciones no falta.');
        $this->assertSame(3.0, $valores['VAC']);
    }

    public function test_una_incidencia_sin_aprobar_no_tapa_la_falta(): void
    {
        $empleado = $this->empleado('Fito', 'Cano', '345');

        // Capturada pero nadie la autorizó: la ausencia sigue siendo real.
        $this->incidencia($empleado, 'PSS', '2026-04-06', '2026-04-10', 5, IncidenciaEmpleado::ESTADO_PENDIENTE);

        $valores = $this->valoresDe($empleado);

        $this->assertSame(5.0, $valores['FINJ']);
        $this->assertArrayNotHasKey('PSS', $valores);
    }

    public function test_los_dias_no_laborables_del_turno_nunca_son_falta(): void
    {
        $empleado = $this->empleado('Gina', 'Soto', '370');

        // Sin un solo marcaje en toda la semana: cinco faltas, no siete. El
        // sábado y el domingo no eran laborables para su turno.
        $valores = $this->valoresDe($empleado);

        $this->assertSame(5.0, $valores['FINJ']);
    }

    /* ------------------------------------------------------------------ */
    /*  Incidencias capturadas */
    /* ------------------------------------------------------------------ */

    public function test_una_incidencia_que_cruza_el_periodo_se_prorratea_por_dias_cubiertos(): void
    {
        $empleado = $this->empleado('Hugo', 'Neri', '371');

        // Incapacidad de 8 días naturales (09 al 16 de abril); sólo 4 caen
        // dentro del período que termina el domingo 12.
        $this->incidencia($empleado, 'ENFG', '2026-04-09', '2026-04-16', 8, IncidenciaEmpleado::ESTADO_APROBADA);

        $valores = $this->valoresDe($empleado);

        $this->assertSame(4.0, $valores['ENFG']);
    }

    public function test_una_incidencia_que_cabe_completa_no_se_prorratea(): void
    {
        $empleado = $this->empleado('Iris', 'Gil', '413');

        // Medio día de permiso: la cantidad capturada se respeta tal cual.
        $this->incidencia($empleado, 'PCS', '2026-04-08', '2026-04-08', 0.5, IncidenciaEmpleado::ESTADO_APROBADA);

        $valores = $this->valoresDe($empleado);

        $this->assertSame(0.5, $valores['PCS']);
    }

    /* ------------------------------------------------------------------ */
    /*  Identidad: quién entra al archivo y quién no */
    /* ------------------------------------------------------------------ */

    public function test_un_empleado_sin_mapeo_se_omite_con_su_motivo(): void
    {
        $empleado = Empleado::create([
            'nombres' => 'Joel',
            'apellidos' => 'Cruz',
            'documento_identidad' => 'SIN-MAPEO-1',
            'empresa_id' => $this->empresa->id,
            'turno_laboral_id' => $this->turno->id,
            'status' => true,
        ]);

        $this->resumen($empleado, '2026-04-06', ['horas_ordinarias' => 8.00]);

        $resultado = $this->previsualizar();

        $this->assertSame([], $resultado['renglones']);
        $this->assertCount(1, $resultado['omitidos']);
        $this->assertSame($empleado->id, $resultado['omitidos'][0]['empleado_id']);
        $this->assertSame(
            ContpaqiExportacionDetalle::MOTIVO_SIN_MAPEO,
            $resultado['omitidos'][0]['motivo']
        );
    }

    public function test_un_mapeo_desactivado_omite_al_empleado(): void
    {
        $empleado = $this->empleado('Kena', 'Ríos', '431', activo: false);
        $this->resumen($empleado, '2026-04-06', ['horas_ordinarias' => 8.00]);

        $resultado = $this->previsualizar();

        $this->assertSame([], $resultado['renglones']);
        $this->assertSame(
            ContpaqiExportacionDetalle::MOTIVO_MAPEO_INACTIVO,
            $resultado['omitidos'][0]['motivo']
        );
    }

    public function test_un_empleado_sin_movimientos_no_ocupa_un_renglon(): void
    {
        // Turno sin días laborables: no trabaja, pero tampoco falta.
        $turnoVacio = TurnoLaboral::create([
            'empresa_id' => $this->empresa->id,
            'nombre' => 'Sin jornada asignada',
            'hora_entrada' => '08:00:00',
            'hora_salida' => '17:00:00',
            'horas_diarias_ley' => 8.00,
            'dias_laborables' => [],
        ]);

        $empleado = $this->empleado('Luis', 'Paz', '448');
        $empleado->update(['turno_laboral_id' => $turnoVacio->id]);

        $resultado = $this->previsualizar();

        $this->assertSame([], $resultado['renglones']);
        $this->assertSame(
            ContpaqiExportacionDetalle::MOTIVO_SIN_MOVIMIENTOS,
            $resultado['omitidos'][0]['motivo']
        );
    }

    /* ------------------------------------------------------------------ */
    /*  Exportación completa */
    /* ------------------------------------------------------------------ */

    public function test_la_exportacion_escribe_el_archivo_y_deja_constancia(): void
    {
        Storage::fake('local');

        $conMovimientos = $this->empleado('Mara', 'Solis', '464');
        $this->resumen($conMovimientos, '2026-04-06', ['horas_ordinarias' => 8.00, 'horas_extra_diarias' => 2.00]);

        $sinMapeo = Empleado::create([
            'nombres' => 'Noe',
            'apellidos' => 'Duarte',
            'documento_identidad' => 'SIN-MAPEO-2',
            'empresa_id' => $this->empresa->id,
            'turno_laboral_id' => $this->turno->id,
            'status' => true,
        ]);
        $this->resumen($sinMapeo, '2026-04-06', ['horas_ordinarias' => 8.00]);

        [$desde, $hasta] = $this->periodo();

        $exportacion = app(ContpaqiExportService::class)->exportar($this->empresa, $desde, $hasta, numeroPeriodo: 15);

        $this->assertSame(ContpaqiExportacion::ESTADO_GENERADA, $exportacion->estado);
        $this->assertSame(15, $exportacion->numero_periodo);
        $this->assertSame(1, $exportacion->empleados_exportados);
        $this->assertSame(1, $exportacion->empleados_omitidos);
        $this->assertTrue($exportacion->tieneArchivo());

        Storage::disk('local')->assertExists($exportacion->ruta_archivo);

        // El detalle guarda tanto lo que salió como lo que no, y por qué.
        $this->assertDatabaseHas('contpaqi_exportacion_detalles', [
            'contpaqi_exportacion_id' => $exportacion->id,
            'codigo_empleado' => '464',
            'estado' => ContpaqiExportacionDetalle::ESTADO_EXPORTADO,
        ]);

        $this->assertDatabaseHas('contpaqi_exportacion_detalles', [
            'contpaqi_exportacion_id' => $exportacion->id,
            'empleado_id' => $sinMapeo->id,
            'estado' => ContpaqiExportacionDetalle::ESTADO_OMITIDO,
            'motivo' => ContpaqiExportacionDetalle::MOTIVO_SIN_MAPEO,
        ]);
    }

    public function test_las_columnas_del_archivo_son_solo_las_que_se_usaron(): void
    {
        Storage::fake('local');

        $empleado = $this->empleado('Olga', 'Fierro', '465');
        $this->resumen($empleado, '2026-04-06', ['horas_ordinarias' => 8.00]);
        $this->resumen($empleado, '2026-04-07', ['horas_ordinarias' => 8.00]);
        $this->resumen($empleado, '2026-04-08', ['horas_ordinarias' => 8.00]);
        $this->resumen($empleado, '2026-04-09', ['horas_ordinarias' => 8.00]);
        $this->resumen($empleado, '2026-04-10', ['horas_ordinarias' => 8.00]);

        [$desde, $hasta] = $this->periodo();
        $exportacion = app(ContpaqiExportService::class)->exportar($this->empresa, $desde, $hasta);

        // Semana perfecta: sólo días trabajados. Ni horas extra ni retardos ni
        // los otros 18 mnemónicos del catálogo tienen por qué aparecer.
        $this->assertSame(['TRAB'], $exportacion->columnas);
    }

    public function test_la_exportacion_marca_como_aplicadas_las_incidencias_del_periodo(): void
    {
        Storage::fake('local');

        $empleado = $this->empleado('Pia', 'Rojo', '466');
        $incidencia = $this->incidencia($empleado, 'VAC', '2026-04-06', '2026-04-08', 3, IncidenciaEmpleado::ESTADO_APROBADA);

        [$desde, $hasta] = $this->periodo();
        app(ContpaqiExportService::class)->exportar($this->empresa, $desde, $hasta);

        $this->assertSame(IncidenciaEmpleado::ESTADO_APLICADA, $incidencia->fresh()->estado);
    }

    public function test_regenerar_el_periodo_produce_los_mismos_valores(): void
    {
        Storage::fake('local');

        $empleado = $this->empleado('Raul', 'Vega', '467');
        $this->incidencia($empleado, 'VAC', '2026-04-06', '2026-04-08', 3, IncidenciaEmpleado::ESTADO_APROBADA);

        [$desde, $hasta] = $this->periodo();
        $servicio = app(ContpaqiExportService::class);

        $primera = $servicio->exportar($this->empresa, $desde, $hasta);
        $segunda = $servicio->exportar($this->empresa, $desde, $hasta);

        // La primera corrida dejó la incidencia en 'aplicada'. Si ese estado
        // sacara la incidencia del cálculo, el segundo archivo contradiría al
        // primero y nadie sabría cuál importar.
        $this->assertSame(
            $primera->detalles->firstWhere('codigo_empleado', '467')->valores,
            $segunda->detalles->firstWhere('codigo_empleado', '467')->valores,
        );
    }

    public function test_el_modulo_desactivado_se_niega_a_exportar(): void
    {
        config(['contpaqi.enabled' => false]);

        [$desde, $hasta] = $this->periodo();

        $this->expectExceptionMessage('El módulo de CONTPAQi está desactivado');

        app(ContpaqiExportService::class)->exportar($this->empresa, $desde, $hasta);
    }

    /* ------------------------------------------------------------------ */
    /*  Andamiaje */
    /* ------------------------------------------------------------------ */

    /** @return array{CarbonImmutable, CarbonImmutable} */
    private function periodo(): array
    {
        return [
            CarbonImmutable::parse('2026-04-06')->startOfDay(),
            CarbonImmutable::parse('2026-04-12')->endOfDay(),
        ];
    }

    /** @return array<string, mixed> */
    private function previsualizar(): array
    {
        [$desde, $hasta] = $this->periodo();

        return app(ContpaqiExportService::class)->previsualizar($this->empresa, $desde, $hasta);
    }

    /** @return array<string, float> */
    private function valoresDe(Empleado $empleado): array
    {
        $resultado = $this->previsualizar();

        foreach ($resultado['renglones'] as $renglon) {
            if (($renglon['empleado_id'] ?? null) === $empleado->id) {
                return $renglon['valores'];
            }
        }

        $this->fail("El empleado {$empleado->id} no salió en la previsualización.");
    }

    private function empleado(string $nombres, string $apellidos, string $codigo, bool $activo = true): Empleado
    {
        $empleado = Empleado::create([
            'nombres' => $nombres,
            'apellidos' => $apellidos,
            'documento_identidad' => "DOC-{$codigo}",
            'empresa_id' => $this->empresa->id,
            'turno_laboral_id' => $this->turno->id,
            'status' => true,
        ]);

        ContpaqiEmpleadoMapeo::create([
            'empresa_id' => $this->empresa->id,
            'empleado_id' => $empleado->id,
            'codigo_empleado' => $codigo,
            'activo' => $activo,
        ]);

        return $empleado;
    }

    /** @param  array<string, mixed>  $datos */
    private function resumen(Empleado $empleado, string $fecha, array $datos = []): AsistenciaResumenDiario
    {
        return AsistenciaResumenDiario::create(array_merge([
            'empresa_id' => $this->empresa->id,
            'empleado_id' => $empleado->id,
            'turno_laboral_id' => $this->turno->id,
            'fecha' => $fecha,
            'horas_ordinarias' => 0.00,
            'horas_extra_diarias' => 0.00,
            'minutos_retraso' => 0,
            'es_festivo' => false,
            'aplica_prima_dominical' => false,
            'es_dia_descanso' => false,
            'estado' => 'aprobado',
        ], $datos));
    }

    private function incidencia(
        Empleado $empleado,
        string $mnemonico,
        string $inicio,
        string $fin,
        float $cantidad,
        string $estado,
    ): IncidenciaEmpleado {
        $tipo = ContpaqiTipoIncidencia::where('empresa_id', $this->empresa->id)
            ->where('mnemonico', $mnemonico)
            ->firstOrFail();

        return IncidenciaEmpleado::create([
            'empresa_id' => $this->empresa->id,
            'empleado_id' => $empleado->id,
            'contpaqi_tipo_incidencia_id' => $tipo->id,
            'fecha_inicio' => $inicio,
            'fecha_fin' => $fin,
            'cantidad' => $cantidad,
            'estado' => $estado,
        ]);
    }

    private function sembrarCatalogo(): void
    {
        $derivados = collect(config('contpaqi.derivacion', []))->filter()->values()->all();

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
                'es_derivada' => in_array($fila['mnemonico'], $derivados, true),
                'activo' => true,
            ]);
        }
    }
}
