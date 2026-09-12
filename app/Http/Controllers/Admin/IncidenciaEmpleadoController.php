<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContpaqiTipoIncidencia;
use App\Models\Empleado;
use App\Models\IncidenciaEmpleado;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Captura de incidencias que la asistencia no puede deducir: vacaciones,
 * permisos, incapacidades y castigos.
 *
 * Sin esta pantalla el módulo de CONTPAQi exporta prenóminas incompletas y
 * marca como faltas injustificadas las ausencias que sí estaban autorizadas.
 */
class IncidenciaEmpleadoController extends Controller
{
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
        $datos = $this->validar($request);

        IncidenciaEmpleado::create([
            ...$datos,
            'empresa_id' => (int) $request->user()->empresa_id,
            'estado' => IncidenciaEmpleado::ESTADO_PENDIENTE,
            'capturado_por' => $request->user()->id,
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Incidencia capturada. Queda pendiente de aprobación.',
        ]);
    }

    public function update(Request $request, IncidenciaEmpleado $incidencia): RedirectResponse
    {
        $this->autorizarEmpresa($request, $incidencia);
        $this->exigirEditable($incidencia);

        $incidencia->update($this->validar($request, $incidencia));

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Incidencia actualizada.',
        ]);
    }

    public function destroy(Request $request, IncidenciaEmpleado $incidencia): RedirectResponse
    {
        $this->autorizarEmpresa($request, $incidencia);
        $this->exigirEditable($incidencia);

        $incidencia->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Incidencia eliminada.',
        ]);
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
        ]);

        $this->exigirSinTraslape($empresaId, $datos, $actual);

        return $datos;
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
