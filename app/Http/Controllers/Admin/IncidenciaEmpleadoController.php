<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AsistenciaResumenDiario;
use App\Models\ContpaqiTipoIncidencia;
use App\Models\Empleado;
use App\Models\IncidenciaEmpleado;
use App\Notifications\IncidenciaCapturadaNotification;
use App\Services\NotificationDispatcher;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Captura de incidencias que la asistencia no puede deducir: vacaciones,
 * permisos, incapacidades y castigos.
 *
 * Sin esta pantalla el módulo de CONTPAQi exporta prenóminas incompletas y
 * marca como faltas injustificadas las ausencias que sí estaban autorizadas.
 */
class IncidenciaEmpleadoController extends Controller
{
    /**
     * Dónde viven los justificantes dentro del disco. Un subdirectorio por
     * empresa para que un respaldo o una baja de cliente sea un solo rm.
     */
    private const DIRECTORIO_JUSTIFICANTES = 'contpaqi/justificantes';

    public function index(Request $request): Response
    {
        $empresaId = (int) $request->user()->empresa_id;

        $desde = $request->filled('desde')
            ? CarbonImmutable::parse((string) $request->string('desde'))
            : CarbonImmutable::now()->startOfMonth();

        $hasta = $request->filled('hasta')
            ? CarbonImmutable::parse((string) $request->string('hasta'))
            : CarbonImmutable::now()->endOfMonth();

        $incidencias = IncidenciaEmpleado::query()
            ->select(['id', 'empleado_id', 'contpaqi_tipo_incidencia_id', 'fecha_inicio', 'fecha_fin', 'cantidad', 'estado', 'folio', 'motivo', 'documento', 'aprobado_por', 'empresa_id'])
            ->with(['empleado:id,nombres,apellidos', 'tipo:id,mnemonico,descripcion,unidad', 'aprobadaPor:id,name'])
            ->paraEmpresa($empresaId)
            ->enRango($desde, $hasta)
            ->when($request->filled('estado'), fn ($q) => $q->where('estado', $request->string('estado')))
            ->when($request->filled('empleado_id'), fn ($q) => $q->where('empleado_id', $request->integer('empleado_id')))
            ->orderByDesc('fecha_inicio')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('admin/nomina/Incidencias', [
            'incidencias' => $incidencias,
            'tipos' => ContpaqiTipoIncidencia::query()
                ->paraEmpresa($empresaId)
                ->capturables()
                ->orderBy('descripcion')
                ->get(['id', 'mnemonico', 'descripcion', 'unidad', 'tipo_imss']),
            'empleados' => Empleado::query()
                ->where('empresa_id', $empresaId)
                ->where('status', true)
                ->orderBy('nombres')
                ->get(['id', 'nombres', 'apellidos']),
            'filtros' => [
                'desde' => $desde->toDateString(),
                'hasta' => $hasta->toDateString(),
                'estado' => $request->string('estado')->toString() ?: null,
                'empleado_id' => $request->integer('empleado_id') ?: null,
            ],
            'puedeAprobar' => $request->user()->can('incidencias.aprobar'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $empresaId = (int) $request->user()->empresa_id;
        $datos = $this->validar($request);

        $incidencia = IncidenciaEmpleado::create([
            ...$datos,
            'empresa_id' => $empresaId,
            'estado' => IncidenciaEmpleado::ESTADO_PENDIENTE,
            'capturado_por' => $request->user()->id,
            'documento' => $this->guardarJustificante($request, $empresaId),
        ]);

        $incidencia->load(['empleado:id,nombres,apellidos', 'tipo:id,descripcion']);

        // Se avisa a quien puede aprobar, menos a quien capturó: si tiene los
        // dos permisos ya sabe que la incidencia existe.
        NotificationDispatcher::notifyPermission(
            'incidencias.aprobar',
            $empresaId,
            new IncidenciaCapturadaNotification(
                $incidencia,
                trim("{$incidencia->empleado?->nombres} {$incidencia->empleado?->apellidos}"),
                (string) $incidencia->tipo?->descripcion,
            ),
            excludeUserIds: [$request->user()->id],
        );

        return back()->with('notification', $this->avisoTrasGuardar(
            $incidencia,
            'Incidencia capturada. Queda pendiente de aprobación.',
        ));
    }

    public function update(Request $request, IncidenciaEmpleado $incidencia): RedirectResponse
    {
        $this->autorizarEmpresa($request, $incidencia);
        $this->exigirEditable($incidencia);

        $datos = $this->validar($request, $incidencia);

        if ($request->hasFile('documento')) {
            $this->borrarJustificante($incidencia);
            $datos['documento'] = $this->guardarJustificante($request, $incidencia->empresa_id);
        }

        /*
         * Editar una incidencia aprobada la devuelve a pendiente. Lo que se
         * aprobó fueron unas fechas y una cantidad concretas; si cambian, la
         * aprobación ya no respalda nada. Sin esto, alguien podía capturar un
         * día, conseguir el visto bueno y luego estirarlo a quince sin que
         * nadie volviera a mirarlo.
         */
        $reabre = $incidencia->estado === IncidenciaEmpleado::ESTADO_APROBADA
            && $this->cambiaLoAprobado($incidencia, $datos);

        if ($reabre) {
            $datos['estado'] = IncidenciaEmpleado::ESTADO_PENDIENTE;
            $datos['aprobado_por'] = null;
            $datos['aprobado_at'] = null;
        }

        $incidencia->update($datos);

        return back()->with('notification', $this->avisoTrasGuardar(
            $incidencia->fresh(),
            $reabre
                ? 'Incidencia actualizada. Como cambiaron fechas o cantidad, vuelve a quedar pendiente de aprobación.'
                : 'Incidencia actualizada.',
        ));
    }

    public function destroy(Request $request, IncidenciaEmpleado $incidencia): RedirectResponse
    {
        $this->autorizarEmpresa($request, $incidencia);
        $this->exigirEditable($incidencia);

        $this->borrarJustificante($incidencia);
        $incidencia->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Incidencia eliminada.',
        ]);
    }

    public function justificante(Request $request, IncidenciaEmpleado $incidencia): StreamedResponse
    {
        $this->autorizarEmpresa($request, $incidencia);

        abort_if(blank($incidencia->documento), 404, 'Esta incidencia no tiene justificante.');

        $disco = Storage::disk(config('contpaqi.disco', 'local'));

        abort_unless($disco->exists($incidencia->documento), 404, 'El justificante ya no está en el disco.');

        $extension = pathinfo($incidencia->documento, PATHINFO_EXTENSION);
        $nombre = sprintf(
            'justificante-%s-%s.%s',
            $incidencia->id,
            $incidencia->fecha_inicio->format('Ymd'),
            $extension,
        );

        return $disco->download($incidencia->documento, $nombre);
    }

    public function aprobar(Request $request, IncidenciaEmpleado $incidencia): RedirectResponse
    {
        $this->autorizarEmpresa($request, $incidencia);

        if ($incidencia->estado === IncidenciaEmpleado::ESTADO_APLICADA) {
            throw ValidationException::withMessages([
                'estado' => 'La incidencia ya viajó en un archivo de prenómina y no se puede volver a aprobar.',
            ]);
        }

        $incidencia->update([
            'estado' => IncidenciaEmpleado::ESTADO_APROBADA,
            'aprobado_por' => $request->user()->id,
            'aprobado_at' => now(),
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Incidencia aprobada. Entrará en la siguiente prenómina.',
        ]);
    }

    public function rechazar(Request $request, IncidenciaEmpleado $incidencia): RedirectResponse
    {
        $this->autorizarEmpresa($request, $incidencia);

        if ($incidencia->estado === IncidenciaEmpleado::ESTADO_APLICADA) {
            throw ValidationException::withMessages([
                'estado' => 'La incidencia ya se exportó; rechazarla ahora no la quitaría del archivo que ya se entregó.',
            ]);
        }

        $incidencia->update([
            'estado' => IncidenciaEmpleado::ESTADO_RECHAZADA,
            'aprobado_por' => $request->user()->id,
            'aprobado_at' => now(),
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Incidencia rechazada.',
        ]);
    }

    /** @return array<string, mixed> */
    private function validar(Request $request, ?IncidenciaEmpleado $actual = null): array
    {
        $empresaId = (int) $request->user()->empresa_id;

        $datos = $request->validate([
            'empleado_id' => [
                'required',
                Rule::exists('empleados', 'id')->where('empresa_id', $empresaId),
            ],
            'contpaqi_tipo_incidencia_id' => [
                'required',
                /*
                 * El tipo tiene que ser de la misma empresa y capturable: los
                 * derivados los calcula la asistencia y capturarlos a mano
                 * duplicaría el pago.
                 *
                 * Las condiciones van en un closure y no como ->where(col, bool)
                 * encadenados. Esa forma serializa la regla a texto y convierte
                 * el booleano en la cadena '0', que MySQL equipara con 0 pero
                 * SQLite no —por afinidad de tipos—, así que la validación
                 * pasaba en producción y rechazaba todo en las pruebas. Con el
                 * closure los valores se enlazan como parámetros reales.
                 */
                Rule::exists('contpaqi_tipos_incidencia', 'id')->where(
                    fn ($query) => $query
                        ->where('empresa_id', $empresaId)
                        ->where('activo', true)
                        ->where('es_derivada', false)
                ),
            ],
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin' => ['required', 'date', 'after_or_equal:fecha_inicio'],
            'cantidad' => ['required', 'numeric', 'min:0.01', 'max:999999'],
            'folio' => ['nullable', 'string', 'max:60'],
            'motivo' => ['nullable', 'string', 'max:2000'],

            // El justificante: la incapacidad del IMSS, el oficio del permiso.
            // PDF o foto; 5 MB alcanzan para un escaneo y frenan que alguien
            // suba el video de la fiesta por error.
            'documento' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        // El archivo se guarda aparte; lo que va al modelo es su ruta.
        unset($datos['documento']);

        $this->exigirSinTraslape($empresaId, $datos, $actual);

        return $datos;
    }

    /** Ruta dentro del disco, o null si no se subió nada. */
    private function guardarJustificante(Request $request, int $empresaId): ?string
    {
        $archivo = $request->file('documento');

        if (! $archivo instanceof UploadedFile) {
            return null;
        }

        $ruta = $archivo->store(
            self::DIRECTORIO_JUSTIFICANTES.'/'.$empresaId,
            config('contpaqi.disco', 'local'),
        );

        return $ruta === false ? null : $ruta;
    }

    private function borrarJustificante(IncidenciaEmpleado $incidencia): void
    {
        if (blank($incidencia->documento)) {
            return;
        }

        Storage::disk(config('contpaqi.disco', 'local'))->delete($incidencia->documento);
    }

    /**
     * ¿La edición toca lo que el aprobador revisó?
     *
     * Fechas, cantidad, tipo o empleado sí; el folio y el motivo no: corregir
     * un número de oficio mal tecleado no cambia lo que se pagará.
     *
     * @param  array<string, mixed>  $datos
     */
    private function cambiaLoAprobado(IncidenciaEmpleado $incidencia, array $datos): bool
    {
        return (int) $datos['empleado_id'] !== (int) $incidencia->empleado_id
            || (int) $datos['contpaqi_tipo_incidencia_id'] !== (int) $incidencia->contpaqi_tipo_incidencia_id
            || CarbonImmutable::parse($datos['fecha_inicio'])->toDateString() !== $incidencia->fecha_inicio->toDateString()
            || CarbonImmutable::parse($datos['fecha_fin'])->toDateString() !== $incidencia->fecha_fin->toDateString()
            || abs((float) $datos['cantidad'] - (float) $incidencia->cantidad) > 0.001;
    }

    /**
     * El mensaje de confirmación, con una advertencia si la asistencia
     * contradice lo capturado.
     *
     * Unas vacaciones en días donde el empleado sí checó casi siempre son un
     * error de fechas. No se bloquea porque a veces es legítimo —un permiso
     * de medio día con marcaje de entrada—, pero quien captura tiene que
     * verlo antes de que lo apruebe alguien más.
     *
     * @return array{type: string, message: string}
     */
    private function avisoTrasGuardar(IncidenciaEmpleado $incidencia, string $mensaje): array
    {
        $diasConMarcaje = AsistenciaResumenDiario::query()
            ->where('empleado_id', $incidencia->empleado_id)
            ->whereBetween('fecha', [$incidencia->fecha_inicio->toDateString(), $incidencia->fecha_fin->toDateString()])
            ->where('horas_ordinarias', '>', 0)
            ->count();

        if ($diasConMarcaje === 0) {
            return ['type' => 'success', 'message' => $mensaje];
        }

        return [
            'type' => 'warning',
            'message' => sprintf(
                '%s Ojo: el empleado tiene marcajes de asistencia en %d de esos días; revisa que las fechas sean correctas.',
                $mensaje,
                $diasConMarcaje,
            ),
        ];
    }

    /**
     * Dos incidencias del mismo tipo sobre las mismas fechas casi siempre son
     * una doble captura, y en la prenómina se suman: unas vacaciones
     * capturadas dos veces salen como el doble de días pagados.
     *
     * Se compara sólo contra el mismo tipo a propósito. Traslapes entre tipos
     * distintos sí son legítimos —una incapacidad que empieza durante unas
     * vacaciones, por ejemplo— y bloquearlos estorbaría más de lo que ayuda.
     *
     * @param  array<string, mixed>  $datos
     */
    private function exigirSinTraslape(int $empresaId, array $datos, ?IncidenciaEmpleado $actual): void
    {
        $existe = IncidenciaEmpleado::query()
            ->paraEmpresa($empresaId)
            ->where('empleado_id', $datos['empleado_id'])
            ->where('contpaqi_tipo_incidencia_id', $datos['contpaqi_tipo_incidencia_id'])
            ->whereNot('estado', IncidenciaEmpleado::ESTADO_RECHAZADA)
            ->when($actual, fn ($q) => $q->whereKeyNot($actual->id))
            ->enRango($datos['fecha_inicio'], $datos['fecha_fin'])
            ->exists();

        if ($existe) {
            throw ValidationException::withMessages([
                'fecha_inicio' => 'Ya hay una incidencia de este tipo para el empleado en esas fechas.',
            ]);
        }
    }

    /**
     * Una incidencia ya exportada no se toca: el archivo que la contenía ya
     * salió rumbo a CONTPAQi y editarla aquí sólo lograría que el sistema y la
     * nómina real digan cosas distintas.
     */
    private function exigirEditable(IncidenciaEmpleado $incidencia): void
    {
        if ($incidencia->estado === IncidenciaEmpleado::ESTADO_APLICADA) {
            throw ValidationException::withMessages([
                'estado' => 'La incidencia ya se exportó a CONTPAQi y no se puede modificar.',
            ]);
        }
    }

    private function autorizarEmpresa(Request $request, IncidenciaEmpleado $incidencia): void
    {
        abort_unless(
            $incidencia->empresa_id === (int) $request->user()->empresa_id,
            403,
            'La incidencia pertenece a otra empresa.'
        );
    }
}
