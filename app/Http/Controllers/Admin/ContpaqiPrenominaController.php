<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContpaqiEmpleadoMapeo;
use App\Models\ContpaqiExportacion;
use App\Models\ContpaqiTipoIncidencia;
use App\Models\Empleado;
use App\Models\Empresa;
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
    public function index(Request $request, ContpaqiExportService $servicio): Response
    {
        $empresa = $this->empresaDe($request);
        [$desde, $hasta] = $this->periodoDe($request);

        $previsualizacion = null;

        if ($request->filled('desde') && $request->filled('hasta')) {
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
            ->with('generadaPor:id,name')
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
            'catalogo' => ContpaqiTipoIncidencia::query()
                ->paraEmpresa($empresa->id)
                ->orderBy('id')
                ->get(['id', 'mnemonico', 'descripcion', 'unidad', 'tipo_imss', 'es_derivada', 'activo']),
            'puedeExportar' => $request->user()->can('contpaqi.exportar'),

            // El layout de columnas todavía no está confirmado contra un
            // CONTPAQi real; la pantalla lo dice en vez de dejar que alguien
            // asuma que el archivo ya está validado.
            'layoutConfirmado' => (bool) config('contpaqi.layout_confirmado', false),
        ]);
    }

    public function generar(Request $request, ContpaqiExportService $servicio): RedirectResponse
    {
        $empresa = $this->empresaDe($request);
        [$desde, $hasta] = $this->periodoDe($request, exigir: true);

        $numeroPeriodo = $request->validate([
            'numero_periodo' => ['nullable', 'integer', 'min:1', 'max:400'],
        ])['numero_periodo'] ?? null;

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
     * Período a exportar. Por defecto, la semana completa anterior a hoy: la
     * prenómina se cierra cuando la semana terminó, no a media semana.
     *
     * @return array{CarbonImmutable, CarbonImmutable}
     */
    private function periodoDe(Request $request, bool $exigir = false): array
    {
        if ($exigir) {
            $request->validate([
                'desde' => ['required', 'date'],
                'hasta' => ['required', 'date', 'after_or_equal:desde'],
            ]);
        }

        $inicioSemana = (int) config('contpaqi.dia_inicio_semana', 1);

        $desde = $request->filled('desde')
            ? CarbonImmutable::parse((string) $request->string('desde'))->startOfDay()
            : CarbonImmutable::now()->subWeek()->startOfWeek($inicioSemana)->startOfDay();

        $hasta = $request->filled('hasta')
            ? CarbonImmutable::parse((string) $request->string('hasta'))->endOfDay()
            : $desde->addDays(6)->endOfDay();

        return [$desde, $hasta];
    }
}
