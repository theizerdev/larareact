<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AsistenciaMarcaje;
use App\Models\AsistenciaResumenDiario;
use App\Models\AsistenciaResumenSemanal;
use App\Models\Empleado;

use App\Services\CalculoAsistenciaLftService;
use App\Services\RegionalConfigurationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AsistenciaReporteController extends Controller
{
    /**
     * Muestra la bitácora general de marcajes del reloj checador.
     */
    public function bitacoraMarcajes(Request $request)
    {
        $user = $request->user();
        if ($user && $user->empresa) {
            RegionalConfigurationService::setRegionalConfiguration($user->empresa);
        }

        $empresaId = $user->empresa_id;

        $query = AsistenciaMarcaje::with(['empleado.departamento', 'empleado.cargo', 'sucursal'])
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->when($request->search, function ($q, $search) {
                $q->whereHas('empleado', function ($sub) use ($search) {
                    $sub->where('nombres', 'like', "%{$search}%")
                        ->orWhere('apellidos', 'like', "%{$search}%")
                        ->orWhere('documento_identidad', 'like', "%{$search}%");
                });
            })
            ->when($request->tipo_marcaje, fn ($q, $t) => $q->where('tipo_marcaje', $t))
            ->when($request->origen, fn ($q, $o) => $q->where('origen', $o))
            ->when($request->fecha_inicio, fn ($q, $f) => $q->whereDate('fecha_hora', '>=', $f))
            ->when($request->fecha_fin, fn ($q, $f) => $q->whereDate('fecha_hora', '<=', $f));

        $stats = [
            'total' => (clone $query)->count(),
            'entradas' => (clone $query)->where('tipo_marcaje', 'entrada')->count(),
            'descansos' => (clone $query)->whereIn('tipo_marcaje', ['salida_comida', 'entrada_comida'])->count(),
            'salidas' => (clone $query)->where('tipo_marcaje', 'salida')->count(),
        ];

        $marcajes = $query->latest('fecha_hora')->paginate($request->perPage ?? 15)->withQueryString();

        return Inertia::render('admin/asistencia/Bitacora', [
            'marcajes' => $marcajes,
            'stats' => $stats,
            'filters' => $request->only('search', 'tipo_marcaje', 'origen', 'fecha_inicio', 'fecha_fin', 'perPage'),
        ]);
    }

    /**
     * Muestra la consola de Pre-Nómina y Cálculo de Horas a Pagar (LFT).
     */
    public function calculoNomina(Request $request, CalculoAsistenciaLftService $calculoService)
    {
        $user = $request->user();
        $empresaId = $user->empresa_id;

        $fechaInicio = $request->input('fecha_inicio', Carbon::now()->startOfWeek()->toDateString());
        $fechaFin = $request->input('fecha_fin', Carbon::now()->endOfWeek()->toDateString());

        // Obtener empleados activos
        $empleados = Empleado::with(['departamento', 'turnoLaboral'])
            ->where('status', true)
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->get();

        // Procesar resúmenes semanales para cada empleado en el período si es requerido
        if ($request->boolean('procesar')) {
            foreach ($empleados as $emp) {
                $calculoService->procesarResumenSemanal($emp, $fechaInicio, $fechaFin);
            }
        }

        // Cargar resúmenes semanales procesados
        $resumenesSemanales = AsistenciaResumenSemanal::with(['empleado.departamento', 'empleado.cargo', 'empleado.turnoLaboral'])
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->where('periodo_inicio', '>=', $fechaInicio)
            ->where('periodo_fin', '<=', $fechaFin)
            ->get();

        // Tarjetas estadísticas consolidadas
        $stats = [
            'total_empleados' => $empleados->count(),
            'total_horas_ordinarias' => $resumenesSemanales->sum('total_horas_ordinarias'),
            'total_horas_dobles' => $resumenesSemanales->sum('total_horas_extra_dobles'),
            'total_horas_triples' => $resumenesSemanales->sum('total_horas_extra_triples'),
            'monto_total_nomina' => $resumenesSemanales->sum('monto_total_pagar'),
        ];

        return Inertia::render('admin/asistencia/CalculoNomina', [
            'resumenesSemanales' => $resumenesSemanales,
            'stats' => $stats,
            'filters' => [
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin,
            ],
        ]);
    }
}
