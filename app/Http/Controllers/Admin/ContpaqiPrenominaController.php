<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContpaqiEmpleadoMapeo;
use App\Models\ContpaqiExportacion;
use App\Models\ContpaqiTipoIncidencia;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Services\BioTimeAsistenciaService;
use App\Services\BioTimeSyncService;
use App\Services\Contpaqi\ContpaqiExportService;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

/**
 * Panel de la prenómina de CONTPAQi: previsualizar el período, generar el
 * archivo, revisar el histórico y mantener el mapeo de códigos de empleado.
 */
class ContpaqiPrenominaController extends Controller
{
    /**
     * Panel principal.
     *
     * Cuando la URL trae ?desde y ?hasta se calcula además la previsualización
     * del período. Va en el GET y no en un POST con flash a propósito: así el
     * resultado sobrevive a un refresco y la URL del período se puede compartir
     * con quien tenga que revisarlo antes de generar.
     */
    public function index(Request $request, ContpaqiExportService $servicio, BioTimeAsistenciaService $reloj): Response
    {
        $empresa = $this->empresaDe($request);
        [$desde, $hasta] = $this->periodoDe($request, $empresa);

        $previsualizacion = null;
        $incidenciasPendientes = 0;
        $cerrada = null;
        $relojChecador = null;

        if ($request->filled('desde') && $request->filled('hasta')) {
            $incidenciasPendientes = $servicio->incidenciasPendientes($empresa, $desde, $hasta);
            $cerrada = $servicio->cerradaQueTraslapa($empresa, $desde, $hasta);
            $relojChecador = $reloj->diagnostico($empresa, $desde, $hasta);

            try {
                $resultado = $servicio->previsualizar($empresa, $desde, $hasta);

                $previsualizacion = [
                    'columnas' => $resultado['tipos']->map(fn ($t) => [
                        'mnemonico' => $t->mnemonico,
                        'descripcion' => $t->descripcion,
                        'unidad' => $t->unidad,
                    ])->values()->all(),
                    'renglones' => $resultado['renglones'],
                    'omitidos' => $resultado['omitidos'],
                ];
            } catch (Throwable $e) {
                $previsualizacion = ['error' => $e->getMessage()];
            }
        }

        $exportaciones = ContpaqiExportacion::query()
            ->with(['generadaPor:id,name', 'cerradaPor:id,name'])
            ->paraEmpresa($empresa->id)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        $sinMapeo = Empleado::query()
            ->where('empresa_id', $empresa->id)
            ->where('status', true)
            ->whereNotIn('id', ContpaqiEmpleadoMapeo::query()
                ->paraEmpresa($empresa->id)
                ->select('empleado_id'))
            ->count();

        return Inertia::render('admin/nomina/PrenominaContpaqi', [
            'empresa' => ['id' => $empresa->id, 'razon_social' => $empresa->razon_social],
            'periodo' => ['desde' => $desde->toDateString(), 'hasta' => $hasta->toDateString()],
            'previsualizacion' => $previsualizacion,
            'exportaciones' => $exportaciones,
            'empleadosSinMapeo' => $sinMapeo,
            'incidenciasPendientes' => $incidenciasPendientes,
            'relojChecador' => $relojChecador,
            'periodoCerrado' => $cerrada === null ? null : [
                'id' => $cerrada->id,
                'periodo_inicio' => $cerrada->periodo_inicio->toDateString(),
                'periodo_fin' => $cerrada->periodo_fin->toDateString(),
                'nombre_archivo' => $cerrada->nombre_archivo,
                'cerrada_at' => $cerrada->cerrada_at?->toDateTimeString(),
            ],
            'configuracion' => [
                'periodicidad' => $empresa->contpaqiPeriodicidad(),
                'dia_inicio_semana' => $empresa->contpaqiDiaInicioSemana(),
            ],
            'catalogo' => ContpaqiTipoIncidencia::query()
                ->paraEmpresa($empresa->id)
                ->orderBy('id')
                ->get(['id', 'mnemonico', 'descripcion', 'unidad', 'tipo_imss', 'es_derivada', 'activo']),
            'puedeExportar' => $request->user()->can('contpaqi.exportar'),
            'puedeConfigurar' => $request->user()->can('contpaqi.catalogo'),

            // El layout de columnas todavía no está confirmado contra un
            // CONTPAQi real; la pantalla lo dice en vez de dejar que alguien
            // asuma que el archivo ya está validado.
            'layoutConfirmado' => (bool) config('contpaqi.layout_confirmado', false),
        ]);
    }

    public function generar(Request $request, ContpaqiExportService $servicio): RedirectResponse
    {
        $empresa = $this->empresaDe($request);
        [$desde, $hasta] = $this->periodoDe($request, $empresa, exigir: true);

        $validado = $request->validate([
            'numero_periodo' => ['nullable', 'integer', 'min:1', 'max:400'],
            'confirmar_pendientes' => ['nullable', 'boolean'],
        ]);

        $numeroPeriodo = $validado['numero_periodo'] ?? null;

        /*
         * Con incidencias sin aprobar en el período, generar exige confirmación
         * explícita. No se bloquea del todo: a veces la pendiente es un error
         * que nadie va a aprobar y la nómina no puede esperar. Pero tiene que
         * ser una decisión, no algo que pasó porque nadie miró.
         */
        $pendientes = $servicio->incidenciasPendientes($empresa, $desde, $hasta);

        if ($pendientes > 0 && ! ($validado['confirmar_pendientes'] ?? false)) {
            throw ValidationException::withMessages([
                'confirmar_pendientes' => $pendientes === 1
                    ? 'Hay 1 incidencia pendiente de aprobar en este período y no saldrá en el archivo. Apruébala o recházala antes, o confirma que quieres generar sin ella.'
                    : "Hay {$pendientes} incidencias pendientes de aprobar en este período y no saldrán en el archivo. Apruébalas o recházalas antes, o confirma que quieres generar sin ellas.",
            ]);
        }

        try {
            $exportacion = $servicio->exportar($empresa, $desde, $hasta, $numeroPeriodo, $request->user());
        } catch (Throwable $e) {
            throw ValidationException::withMessages(['desde' => 'No se pudo generar la prenómina: '.$e->getMessage()]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => sprintf(
                'Prenómina generada: %d empleados, %d omitidos.',
                $exportacion->empleados_exportados,
                $exportacion->empleados_omitidos,
            ),
        ]);
    }

    /**
     * Trae del reloj las checadas más recientes y las pasa a asistencia antes
     * de previsualizar.
     *
     * El scheduler ya lo hace cada pocos minutos; esto existe para quien va a
     * cerrar la nómina y no quiere esperar a la siguiente corrida ni dudar de
     * si la última checada del viernes alcanzó a entrar.
     */
    public function sincronizarReloj(Request $request, BioTimeAsistenciaService $reloj): RedirectResponse
    {
        $empresa = $this->empresaDe($request);
        [$desde, $hasta] = $this->periodoDe($request, $empresa, exigir: true);

        if (! $empresa->biotime_active || blank($empresa->biotime_base_url)) {
            throw ValidationException::withMessages(['reloj' => 'Esta empresa no tiene el reloj BioTime conectado.']);
        }

        if (! config('biotime.asistencia.alimentar', true)) {
            throw ValidationException::withMessages(['reloj' => 'Las checadas del reloj están desactivadas para nómina (BIOTIME_ALIMENTAR_ASISTENCIA).']);
        }

        // Sólo la parte de marcajes: es incremental desde la última corrida y
        // no se queda esperando el catálogo completo de empleados.
        $sync = BioTimeSyncService::for($empresa)->sync($empresa, ['transactions']);

        $importacion = $reloj->importar($empresa, $desde, $hasta);

        $mensaje = sprintf(
            'Reloj sincronizado: %d días recalculados con %d checadas.',
            $importacion['dias'],
            $importacion['marcajes'],
        );

        if ($importacion['bloqueados'] > 0) {
            $mensaje .= sprintf(' %d días no se tocaron por estar en un período ya cerrado.', $importacion['bloqueados']);
        }

        $problemas = [...$sync['errors'], ...$importacion['errores']];

        return back()->with('notification', [
            'type' => $problemas === [] ? 'success' : 'warning',
            'message' => $problemas === [] ? $mensaje : $mensaje.' Hubo errores: '.implode(' · ', array_slice($problemas, 0, 3)),
        ]);
    }

    public function descargar(Request $request, ContpaqiExportacion $exportacion): StreamedResponse
    {
        abort_unless(
            $exportacion->empresa_id === $this->empresaDe($request)->id,
            403,
            'La exportación pertenece a otra empresa.'
        );

        abort_unless($exportacion->tieneArchivo(), 404, 'Esta exportación no tiene archivo.');

        $disco = Storage::disk($exportacion->disco ?? config('contpaqi.disco', 'local'));

        abort_unless($disco->exists($exportacion->ruta_archivo), 404, 'El archivo ya no está en el disco.');

        // Deja constancia de que alguien se lo llevó. Es la diferencia entre
        // "se generó" y "se usó", y ayuda a saber cuál de tres archivos del
        // mismo período fue el que realmente se importó.
        if ($exportacion->estado === ContpaqiExportacion::ESTADO_GENERADA) {
            $exportacion->update(['estado' => ContpaqiExportacion::ESTADO_DESCARGADA]);
        }

        return $disco->download($exportacion->ruta_archivo, $exportacion->nombre_archivo);
    }

    /**
     * Cierra el período: contabilidad confirma que este archivo es el que se
     * importó en CONTPAQi y con el que se pagó.
     */
    public function cerrar(Request $request, ContpaqiExportacion $exportacion, ContpaqiExportService $servicio): RedirectResponse
    {
        abort_unless(
            $exportacion->empresa_id === $this->empresaDe($request)->id,
            403,
            'La exportación pertenece a otra empresa.'
        );

        try {
            $servicio->cerrar($exportacion, $request->user());
        } catch (Throwable $e) {
            throw ValidationException::withMessages(['estado' => $e->getMessage()]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => sprintf(
                'Período del %s al %s cerrado. Ya no se pueden generar más archivos para esas fechas.',
                $exportacion->periodo_inicio->format('d/m/Y'),
                $exportacion->periodo_fin->format('d/m/Y'),
            ),
        ]);
    }

    /**
     * Calendario de nómina de la empresa: semanal o quincenal, y qué día
     * corta la semana.
     */
    public function configuracion(Request $request): RedirectResponse
    {
        $empresa = $this->empresaDe($request);

        $datos = $request->validate([
            'periodicidad' => ['required', Rule::in([Empresa::PERIODICIDAD_SEMANAL, Empresa::PERIODICIDAD_QUINCENAL])],
            'dia_inicio_semana' => ['required', 'integer', 'min:1', 'max:7'],
        ]);

        $empresa->update([
            'contpaqi_periodicidad' => $datos['periodicidad'],
            'contpaqi_dia_inicio_semana' => $datos['dia_inicio_semana'],
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Calendario de nómina guardado. El período propuesto se ajusta en la siguiente carga.',
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  Mapeo de códigos de empleado */
    /* ------------------------------------------------------------------ */

    public function mapeos(Request $request): Response
    {
        $empresa = $this->empresaDe($request);

        return Inertia::render('admin/nomina/MapeoContpaqi', [
            'empresa' => ['id' => $empresa->id, 'razon_social' => $empresa->razon_social],
            'mapeos' => ContpaqiEmpleadoMapeo::query()
                ->with('empleado:id,nombres,apellidos,documento_identidad')
                ->paraEmpresa($empresa->id)
                ->orderBy('codigo_empleado')
                ->get(),
            'empleadosSinMapeo' => Empleado::query()
                ->where('empresa_id', $empresa->id)
                ->where('status', true)
                ->whereNotIn('id', ContpaqiEmpleadoMapeo::query()
                    ->paraEmpresa($empresa->id)
                    ->select('empleado_id'))
                ->orderBy('nombres')
                ->get(['id', 'nombres', 'apellidos', 'documento_identidad']),
        ]);
    }

    public function guardarMapeo(Request $request): RedirectResponse
    {
        $empresa = $this->empresaDe($request);

        $datos = $request->validate([
            'empleado_id' => [
                'required',
                Rule::exists('empleados', 'id')->where('empresa_id', $empresa->id),
                Rule::unique('contpaqi_empleado_mapeos', 'empleado_id')->where('empresa_id', $empresa->id),
            ],
            'codigo_empleado' => [
                'required', 'string', 'max:30',
                Rule::unique('contpaqi_empleado_mapeos', 'codigo_empleado')->where('empresa_id', $empresa->id),
            ],
            'nombre_contpaqi' => ['nullable', 'string', 'max:255'],
            'notas' => ['nullable', 'string', 'max:2000'],
        ]);

        ContpaqiEmpleadoMapeo::create([...$datos, 'empresa_id' => $empresa->id, 'activo' => true]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Mapeo guardado.',
        ]);
    }

    public function actualizarMapeo(Request $request, ContpaqiEmpleadoMapeo $mapeo): RedirectResponse
    {
        $empresa = $this->empresaDe($request);

        abort_unless($mapeo->empresa_id === $empresa->id, 403, 'El mapeo pertenece a otra empresa.');

        $datos = $request->validate([
            'codigo_empleado' => [
                'required', 'string', 'max:30',
                Rule::unique('contpaqi_empleado_mapeos', 'codigo_empleado')
                    ->where('empresa_id', $empresa->id)
                    ->ignore($mapeo->id),
            ],
            'nombre_contpaqi' => ['nullable', 'string', 'max:255'],
            'activo' => ['required', 'boolean'],
            'notas' => ['nullable', 'string', 'max:2000'],
        ]);

        $mapeo->update($datos);

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Mapeo actualizado.',
        ]);
    }

    public function eliminarMapeo(Request $request, ContpaqiEmpleadoMapeo $mapeo): RedirectResponse
    {
        abort_unless($mapeo->empresa_id === $this->empresaDe($request)->id, 403, 'El mapeo pertenece a otra empresa.');

        $mapeo->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Mapeo eliminado. El empleado dejará de salir en la prenómina.',
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  Andamiaje */
    /* ------------------------------------------------------------------ */

    /**
     * La empresa sobre la que se trabaja.
     *
     * Se exige explícita en vez de adivinarla porque exportar la nómina de la
     * razón social equivocada es un problema fiscal. Un Super Administrador
     * sin empresa asignada tiene que elegir una con ?empresa_id=.
     */
    private function empresaDe(Request $request): Empresa
    {
        $empresaId = $request->integer('empresa_id') ?: $request->user()->empresa_id;

        abort_if(
            blank($empresaId),
            422,
            'Tu usuario no tiene empresa asignada. Indica una con el parámetro empresa_id.'
        );

        $empresa = Empresa::withoutGlobalScopes()->find($empresaId);

        abort_if($empresa === null, 404, 'La empresa indicada no existe.');

        // Un usuario con empresa asignada no puede salirse de ella por query
        // string; sólo quien no tiene ninguna (Super Administrador) elige.
        abort_if(
            filled($request->user()->empresa_id) && (int) $request->user()->empresa_id !== $empresa->id,
            403,
            'No puedes operar sobre otra empresa.'
        );

        return $empresa;
    }

    /**
     * Período a exportar. Por defecto, el último completo según el calendario
     * de la empresa: la prenómina se cierra cuando el período terminó, no a
     * la mitad.
     *
     * @return array{CarbonImmutable, CarbonImmutable}
     */
    private function periodoDe(Request $request, Empresa $empresa, bool $exigir = false): array
    {
        if ($exigir) {
            $request->validate([
                'desde' => ['required', 'date'],
                'hasta' => ['required', 'date', 'after_or_equal:desde'],
            ]);
        }

        [$desdeDefault, $hastaDefault] = $empresa->contpaqiPeriodoAnterior();

        $desde = $request->filled('desde')
            ? CarbonImmutable::parse((string) $request->string('desde'))->startOfDay()
            : $desdeDefault;

        $hasta = $request->filled('hasta')
            ? CarbonImmutable::parse((string) $request->string('hasta'))->endOfDay()
            : ($request->filled('desde') ? $desde->addDays(6)->endOfDay() : $hastaDefault);

        return [$desde, $hasta];
    }
}
