<?php

namespace Tests\Feature;

use App\Models\AsistenciaResumenDiario;
use App\Models\ContpaqiEmpleadoMapeo;
use App\Models\ContpaqiExportacion;
use App\Models\ContpaqiTipoIncidencia;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\IncidenciaEmpleado;
use App\Models\TurnoLaboral;
use App\Models\User;
use App\Notifications\IncidenciaCapturadaNotification;
use App\Services\Contpaqi\ContpaqiExportService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Los controles que cierran el ciclo de la prenómina: que una aprobación no
 * sobreviva a una edición, que nadie genere sin ver las pendientes, que las
 * pendientes no se olviden, que un período pagado no se vuelva a generar, que
 * el justificante viaje con la incidencia y que el calendario sea de cada
 * empresa.
 */
class ContpaqiControlesTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    private TurnoLaboral $turno;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create([
            'razon_social' => 'Frigorífico de Prueba, S.A. de C.V.',
            'documento' => 'FDP-CTRL',
        ]);

        $this->turno = TurnoLaboral::create([
            'empresa_id' => $this->empresa->id,
            'nombre' => 'Diurno lunes a viernes',
            'hora_entrada' => '08:00:00',
            'hora_salida' => '17:00:00',
            'horas_diarias_ley' => 8.00,
            'dias_laborables' => [1, 2, 3, 4, 5],
        ]);

        foreach ([
            'incidencias.view', 'incidencias.create', 'incidencias.edit',
            'incidencias.delete', 'incidencias.aprobar',
            'contpaqi.view', 'contpaqi.exportar', 'contpaqi.catalogo',
        ] as $nombre) {
            Permission::findOrCreate($nombre, 'web');
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->sembrarCatalogo();
    }

    /* ------------------------------------------------------------------ */
    /*  Editar una aprobada la devuelve a pendiente */
    /* ------------------------------------------------------------------ */

    public function test_editar_fechas_o_cantidad_de_una_aprobada_la_regresa_a_pendiente(): void
    {
        $empleado = $this->empleado('180');
        $aprobador = $this->usuario(['incidencias.aprobar']);

        $incidencia = $this->incidencia($empleado, 'VAC', '2026-04-06', '2026-04-06', 1, [
            'estado' => IncidenciaEmpleado::ESTADO_APROBADA,
            'aprobado_por' => $aprobador->id,
            'aprobado_at' => now(),
        ]);

        $this->actingAs($this->usuario(['incidencias.edit']))
            ->put("/admin/nomina/incidencias/{$incidencia->id}", [
                'empleado_id' => $empleado->id,
                'contpaqi_tipo_incidencia_id' => $incidencia->contpaqi_tipo_incidencia_id,
                'fecha_inicio' => '2026-04-06',
                'fecha_fin' => '2026-04-20',
                'cantidad' => 15,
            ])
            ->assertSessionHasNoErrors();

        $incidencia->refresh();

        $this->assertSame(IncidenciaEmpleado::ESTADO_PENDIENTE, $incidencia->estado, 'Un día aprobado no puede convertirse en quince sin volver a revisarse.');
        $this->assertNull($incidencia->aprobado_por);
        $this->assertNull($incidencia->aprobado_at);
    }

    public function test_corregir_solo_el_folio_no_reabre_la_aprobacion(): void
    {
        $empleado = $this->empleado('181');
        $aprobador = $this->usuario(['incidencias.aprobar']);

        $incidencia = $this->incidencia($empleado, 'VAC', '2026-04-06', '2026-04-08', 3, [
            'estado' => IncidenciaEmpleado::ESTADO_APROBADA,
            'aprobado_por' => $aprobador->id,
            'aprobado_at' => now(),
            'folio' => 'OF-001',
        ]);

        $this->actingAs($this->usuario(['incidencias.edit']))
            ->put("/admin/nomina/incidencias/{$incidencia->id}", [
                'empleado_id' => $empleado->id,
                'contpaqi_tipo_incidencia_id' => $incidencia->contpaqi_tipo_incidencia_id,
                'fecha_inicio' => '2026-04-06',
                'fecha_fin' => '2026-04-08',
                'cantidad' => 3,
                'folio' => 'OF-0001',
            ])
            ->assertSessionHasNoErrors();

        $incidencia->refresh();

        $this->assertSame(IncidenciaEmpleado::ESTADO_APROBADA, $incidencia->estado, 'Un número de oficio mal tecleado no cambia lo que se paga.');
        $this->assertSame($aprobador->id, $incidencia->aprobado_por);
        $this->assertSame('OF-0001', $incidencia->folio);
    }

    /* ------------------------------------------------------------------ */
    /*  Generar avisa de las pendientes */
    /* ------------------------------------------------------------------ */

    public function test_generar_con_pendientes_exige_confirmacion(): void
    {
        $empleado = $this->empleado('182');
        $this->incidencia($empleado, 'VAC', '2026-04-07', '2026-04-07', 1);

        $usuario = $this->usuario(['contpaqi.exportar']);

        $this->actingAs($usuario)
            ->post('/admin/nomina/contpaqi/generar', ['desde' => '2026-04-06', 'hasta' => '2026-04-12'])
            ->assertSessionHasErrors('confirmar_pendientes');

        $this->assertSame(0, ContpaqiExportacion::count(), 'Sin confirmación no se genera nada.');

        Storage::fake('local');

        $this->actingAs($usuario)
            ->post('/admin/nomina/contpaqi/generar', [
                'desde' => '2026-04-06',
                'hasta' => '2026-04-12',
                'confirmar_pendientes' => true,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame(1, ContpaqiExportacion::count(), 'Confirmando, la pendiente se queda fuera y el archivo sale.');
    }

    public function test_la_pantalla_cuenta_las_pendientes_del_periodo(): void
    {
        $empleado = $this->empleado('183');
        $this->incidencia($empleado, 'VAC', '2026-04-07', '2026-04-07', 1);
        $this->incidencia($empleado, 'PCS', '2026-04-09', '2026-04-09', 1);
        $this->incidencia($empleado, 'PSS', '2026-05-04', '2026-05-04', 1); // fuera del período

        $this->actingAs($this->usuario(['contpaqi.view']))
            ->get('/admin/nomina/contpaqi?desde=2026-04-06&hasta=2026-04-12')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('incidenciasPendientes', 2));
    }

    /* ------------------------------------------------------------------ */
    /*  Capturar avisa a quien aprueba */
    /* ------------------------------------------------------------------ */

    public function test_capturar_notifica_a_los_aprobadores_pero_no_a_quien_captura(): void
    {
        Notification::fake();

        $empleado = $this->empleado('184');
        $aprobadorA = $this->usuario(['incidencias.aprobar']);
        $aprobadorB = $this->usuario(['incidencias.aprobar']);
        $soloMira = $this->usuario(['incidencias.view']);
        $captura = $this->usuario(['incidencias.create', 'incidencias.aprobar']);

        $this->actingAs($captura)
            ->post('/admin/nomina/incidencias', [
                'empleado_id' => $empleado->id,
                'contpaqi_tipo_incidencia_id' => $this->tipo('VAC')->id,
                'fecha_inicio' => '2026-04-06',
                'fecha_fin' => '2026-04-08',
                'cantidad' => 3,
            ])
            ->assertSessionHasNoErrors();

        Notification::assertSentTo([$aprobadorA, $aprobadorB], IncidenciaCapturadaNotification::class);
        Notification::assertNotSentTo($soloMira, IncidenciaCapturadaNotification::class);
        Notification::assertNotSentTo($captura, IncidenciaCapturadaNotification::class);
    }

    /* ------------------------------------------------------------------ */
    /*  Cierre del período */
    /* ------------------------------------------------------------------ */

    public function test_cerrar_una_exportacion_bloquea_volver_a_generar_el_periodo(): void
    {
        Storage::fake('local');

        $empleado = $this->empleado('185');
        $this->incidencia($empleado, 'VAC', '2026-04-07', '2026-04-07', 1, ['estado' => IncidenciaEmpleado::ESTADO_APROBADA]);

        $usuario = $this->usuario(['contpaqi.exportar']);
        $servicio = app(ContpaqiExportService::class);

        $exportacion = $servicio->exportar(
            $this->empresa,
            CarbonImmutable::parse('2026-04-06'),
            CarbonImmutable::parse('2026-04-12')->endOfDay(),
            15,
            $usuario,
        );

        $this->actingAs($usuario)
            ->patch("/admin/nomina/contpaqi/{$exportacion->id}/cerrar")
            ->assertSessionHasNoErrors();

        $exportacion->refresh();

        $this->assertSame(ContpaqiExportacion::ESTADO_CERRADA, $exportacion->estado);
        $this->assertSame($usuario->id, $exportacion->cerrada_por);
        $this->assertNotNull($exportacion->cerrada_at);
        $this->assertTrue($exportacion->tieneArchivo(), 'Cerrada sigue siendo descargable: es el archivo definitivo.');

        // El mismo período y uno que sólo lo traslapa: los dos deben rebotar.
        foreach ([['2026-04-06', '2026-04-12'], ['2026-04-10', '2026-04-16']] as [$desde, $hasta]) {
            $this->actingAs($usuario)
                ->post('/admin/nomina/contpaqi/generar', ['desde' => $desde, 'hasta' => $hasta])
                ->assertSessionHasErrors('desde');
        }

        $this->assertSame(1, ContpaqiExportacion::count(), 'Ni siquiera queda un intento en estado error: se rechaza antes de crear la bitácora.');
    }

    public function test_una_exportacion_fallida_no_se_puede_cerrar(): void
    {
        $fallida = ContpaqiExportacion::create([
            'empresa_id' => $this->empresa->id,
            'lote_uuid' => (string) \Illuminate\Support\Str::uuid(),
            'periodo_inicio' => '2026-04-06',
            'periodo_fin' => '2026-04-12',
            'estado' => ContpaqiExportacion::ESTADO_ERROR,
            'mensaje_error' => 'disco lleno',
        ]);

        $this->actingAs($this->usuario(['contpaqi.exportar']))
            ->patch("/admin/nomina/contpaqi/{$fallida->id}/cerrar")
            ->assertSessionHasErrors('estado');

        $this->assertSame(ContpaqiExportacion::ESTADO_ERROR, $fallida->fresh()->estado);
    }

    public function test_cerrar_requiere_permiso_de_exportar(): void
    {
        $exportacion = ContpaqiExportacion::create([
            'empresa_id' => $this->empresa->id,
            'lote_uuid' => (string) \Illuminate\Support\Str::uuid(),
            'periodo_inicio' => '2026-04-06',
            'periodo_fin' => '2026-04-12',
            'estado' => ContpaqiExportacion::ESTADO_GENERADA,
            'ruta_archivo' => 'contpaqi/prenomina/x.xlsx',
            'nombre_archivo' => 'x.xlsx',
        ]);

        $this->actingAs($this->usuario(['contpaqi.view']))
            ->patch("/admin/nomina/contpaqi/{$exportacion->id}/cerrar")
            ->assertForbidden();
    }

    /* ------------------------------------------------------------------ */
    /*  Justificante */
    /* ------------------------------------------------------------------ */

    public function test_el_justificante_se_guarda_y_se_puede_descargar(): void
    {
        Storage::fake('local');

        $empleado = $this->empleado('186');
        $usuario = $this->usuario(['incidencias.create', 'incidencias.view']);

        $this->actingAs($usuario)
            ->post('/admin/nomina/incidencias', [
                'empleado_id' => $empleado->id,
                'contpaqi_tipo_incidencia_id' => $this->tipo('INC')->id,
                'fecha_inicio' => '2026-04-06',
                'fecha_fin' => '2026-04-08',
                'cantidad' => 3,
                'folio' => 'IMSS-123',
                'documento' => UploadedFile::fake()->create('incapacidad.pdf', 120, 'application/pdf'),
            ])
            ->assertSessionHasNoErrors();

        $incidencia = IncidenciaEmpleado::sole();

        $this->assertNotNull($incidencia->documento);
        $this->assertStringStartsWith("contpaqi/justificantes/{$this->empresa->id}/", $incidencia->documento);
        Storage::disk('local')->assertExists($incidencia->documento);

        $this->actingAs($usuario)
            ->get("/admin/nomina/incidencias/{$incidencia->id}/justificante")
            ->assertOk()
            ->assertDownload("justificante-{$incidencia->id}-20260406.pdf");
    }

    public function test_solo_se_admiten_pdf_e_imagenes_como_justificante(): void
    {
        Storage::fake('local');

        $empleado = $this->empleado('187');

        $this->actingAs($this->usuario(['incidencias.create']))
            ->post('/admin/nomina/incidencias', [
                'empleado_id' => $empleado->id,
                'contpaqi_tipo_incidencia_id' => $this->tipo('VAC')->id,
                'fecha_inicio' => '2026-04-06',
                'fecha_fin' => '2026-04-08',
                'cantidad' => 3,
                'documento' => UploadedFile::fake()->create('macro.xlsm', 10, 'application/vnd.ms-excel.sheet.macroEnabled.12'),
            ])
            ->assertSessionHasErrors('documento');

        $this->assertSame(0, IncidenciaEmpleado::count());
    }

    public function test_eliminar_la_incidencia_borra_su_justificante(): void
    {
        Storage::fake('local');

        $empleado = $this->empleado('188');
        $ruta = Storage::disk('local')->putFile("contpaqi/justificantes/{$this->empresa->id}", UploadedFile::fake()->create('oficio.pdf', 10, 'application/pdf'));

        $incidencia = $this->incidencia($empleado, 'PCS', '2026-04-06', '2026-04-06', 1, ['documento' => $ruta]);

        Storage::disk('local')->assertExists($ruta);

        $this->actingAs($this->usuario(['incidencias.delete']))
            ->delete("/admin/nomina/incidencias/{$incidencia->id}")
            ->assertSessionHasNoErrors();

        Storage::disk('local')->assertMissing($ruta);
    }

    /* ------------------------------------------------------------------ */
    /*  Cruce con la asistencia */
    /* ------------------------------------------------------------------ */

    public function test_capturar_sobre_dias_con_marcaje_advierte_sin_bloquear(): void
    {
        $empleado = $this->empleado('189');

        // Lunes y martes checó jornada completa; miércoles no vino.
        $this->resumen($empleado, '2026-04-06', ['horas_ordinarias' => 8.00]);
        $this->resumen($empleado, '2026-04-07', ['horas_ordinarias' => 8.00]);

        $respuesta = $this->actingAs($this->usuario(['incidencias.create']))
            ->post('/admin/nomina/incidencias', [
                'empleado_id' => $empleado->id,
                'contpaqi_tipo_incidencia_id' => $this->tipo('VAC')->id,
                'fecha_inicio' => '2026-04-06',
                'fecha_fin' => '2026-04-08',
                'cantidad' => 3,
            ]);

        $respuesta->assertSessionHasNoErrors();
        $this->assertSame(1, IncidenciaEmpleado::count(), 'Se guarda: un permiso de medio día con marcaje es legítimo.');

        $aviso = session('notification');

        $this->assertSame('warning', $aviso['type']);
        $this->assertStringContainsString('marcajes de asistencia en 2 de esos días', $aviso['message']);
    }

    public function test_capturar_sin_marcajes_confirma_sin_advertencia(): void
    {
        $empleado = $this->empleado('190');

        $this->actingAs($this->usuario(['incidencias.create']))
            ->post('/admin/nomina/incidencias', [
                'empleado_id' => $empleado->id,
                'contpaqi_tipo_incidencia_id' => $this->tipo('VAC')->id,
                'fecha_inicio' => '2026-04-06',
                'fecha_fin' => '2026-04-08',
                'cantidad' => 3,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame('success', session('notification')['type']);
    }

    /* ------------------------------------------------------------------ */
    /*  Calendario por empresa */
    /* ------------------------------------------------------------------ */

    public function test_el_calendario_se_guarda_por_empresa(): void
    {
        $this->actingAs($this->usuario(['contpaqi.catalogo']))
            ->put('/admin/nomina/contpaqi/configuracion', [
                'periodicidad' => 'quincenal',
                'dia_inicio_semana' => 7,
            ])
            ->assertSessionHasNoErrors();

        $this->empresa->refresh();

        $this->assertSame('quincenal', $this->empresa->contpaqi_periodicidad);
        $this->assertSame(7, $this->empresa->contpaqi_dia_inicio_semana);

        $this->actingAs($this->usuario(['contpaqi.catalogo']))
            ->put('/admin/nomina/contpaqi/configuracion', ['periodicidad' => 'mensual', 'dia_inicio_semana' => 1])
            ->assertSessionHasErrors('periodicidad');
    }

    public function test_el_periodo_anterior_respeta_la_periodicidad(): void
    {
        // Semanal, corte en lunes: el jueves 16 de abril de 2026 la semana
        // anterior completa es del lunes 6 al domingo 12.
        [$desde, $hasta] = $this->empresa->contpaqiPeriodoAnterior(CarbonImmutable::parse('2026-04-16'));
        $this->assertSame('2026-04-06', $desde->toDateString());
        $this->assertSame('2026-04-12', $hasta->toDateString());

        // Semanal con corte en domingo: del domingo 5 al sábado 11.
        $this->empresa->update(['contpaqi_dia_inicio_semana' => 7]);
        [$desde, $hasta] = $this->empresa->fresh()->contpaqiPeriodoAnterior(CarbonImmutable::parse('2026-04-16'));
        $this->assertSame('2026-04-05', $desde->toDateString());
        $this->assertSame('2026-04-11', $hasta->toDateString());

        // Quincenal, el 16: la primera quincena del mes, del 1 al 15.
        $this->empresa->update(['contpaqi_periodicidad' => 'quincenal']);
        [$desde, $hasta] = $this->empresa->fresh()->contpaqiPeriodoAnterior(CarbonImmutable::parse('2026-04-16'));
        $this->assertSame('2026-04-01', $desde->toDateString());
        $this->assertSame('2026-04-15', $hasta->toDateString());

        // Quincenal, el 3: la segunda quincena del mes anterior, del 16 al
        // último día, que en marzo es 31 y en febrero sería 28.
        [$desde, $hasta] = $this->empresa->fresh()->contpaqiPeriodoAnterior(CarbonImmutable::parse('2026-04-03'));
        $this->assertSame('2026-03-16', $desde->toDateString());
        $this->assertSame('2026-03-31', $hasta->toDateString());

        [$desde, $hasta] = $this->empresa->fresh()->contpaqiPeriodoAnterior(CarbonImmutable::parse('2026-03-03'));
        $this->assertSame('2026-02-16', $desde->toDateString());
        $this->assertSame('2026-02-28', $hasta->toDateString());
    }

    public function test_en_una_quincena_el_tope_de_horas_dobles_se_corta_por_semana(): void
    {
        $this->empresa->update(['contpaqi_periodicidad' => 'quincenal', 'contpaqi_dia_inicio_semana' => 1]);
        $empleado = $this->empleado('191');

        // Dos semanas con 12 horas extra cada una: 4 diarias de lunes a
        // miércoles. Con tope semanal son 9 dobles + 3 triples por semana; si
        // el tope se aplicara al período completo saldrían 9 dobles y 15
        // triples, y al empleado le pagarían de más.
        foreach (['2026-04-06', '2026-04-07', '2026-04-08', '2026-04-13', '2026-04-14', '2026-04-15'] as $fecha) {
            $this->resumen($empleado, $fecha, ['horas_ordinarias' => 8.00, 'horas_extra_diarias' => 4.00]);
        }

        $resultado = app(ContpaqiExportService::class)->previsualizar(
            $this->empresa->fresh(),
            CarbonImmutable::parse('2026-04-06'),
            CarbonImmutable::parse('2026-04-19')->endOfDay(),
        );

        $valores = collect($resultado['renglones'])->firstWhere('empleado_id', $empleado->id)['valores'];

        $this->assertSame(18.0, $valores['HE1'], '9 horas dobles por cada una de las dos semanas.');
        $this->assertSame(6.0, $valores['HE2'], '3 horas triples por cada semana, no 15 por el período.');
    }

    /* ------------------------------------------------------------------ */
    /*  Dashboard */
    /* ------------------------------------------------------------------ */

    public function test_el_dashboard_resume_nomina_solo_cuando_el_modulo_esta_publicado(): void
    {
        Permission::findOrCreate('dashboard.view', 'web');
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $empleado = $this->empleado('192');
        Empleado::create([
            'nombres' => 'Sin', 'apellidos' => 'Código', 'documento_identidad' => 'DOC-SC',
            'empresa_id' => $this->empresa->id, 'turno_laboral_id' => $this->turno->id, 'status' => true,
        ]);
        $this->incidencia($empleado, 'VAC', '2026-04-07', '2026-04-07', 1);

        $usuario = $this->usuario(['dashboard.view']);

        config(['contpaqi.modulo_visible' => false]);

        $this->actingAs($usuario)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('moduleStats.nomina', null)->where('nominaVisible', false));

        config(['contpaqi.modulo_visible' => true]);

        $this->actingAs($usuario)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('nominaVisible', true)
                ->where('moduleStats.nomina.pendientes', 1)
                ->where('moduleStats.nomina.sin_mapeo', 1)
                ->where('moduleStats.nomina.ultima', null));
    }

    /* ------------------------------------------------------------------ */
    /*  Andamiaje */
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

    private function empleado(string $codigo): Empleado
    {
        $empleado = Empleado::create([
            'nombres' => 'Empleado',
            'apellidos' => $codigo,
            'documento_identidad' => "DOC-{$codigo}",
            'empresa_id' => $this->empresa->id,
            'turno_laboral_id' => $this->turno->id,
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

    /** @param  array<string, mixed>  $extra */
    private function incidencia(Empleado $empleado, string $mnemonico, string $desde, string $hasta, float $cantidad, array $extra = []): IncidenciaEmpleado
    {
        return IncidenciaEmpleado::create(array_merge([
            'empresa_id' => $this->empresa->id,
            'empleado_id' => $empleado->id,
            'contpaqi_tipo_incidencia_id' => $this->tipo($mnemonico)->id,
            'fecha_inicio' => $desde,
            'fecha_fin' => $hasta,
            'cantidad' => $cantidad,
            'estado' => IncidenciaEmpleado::ESTADO_PENDIENTE,
        ], $extra));
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

    private function tipo(string $mnemonico): ContpaqiTipoIncidencia
    {
        return ContpaqiTipoIncidencia::query()
            ->where('empresa_id', $this->empresa->id)
            ->where('mnemonico', $mnemonico)
            ->firstOrFail();
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
