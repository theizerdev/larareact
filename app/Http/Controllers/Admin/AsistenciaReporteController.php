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

        // Base query para calcular estadísticas globales
        $statsQuery = AsistenciaMarcaje::when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
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
            'total' => (clone $statsQuery)->count(),
            'entradas' => (clone $statsQuery)->where('tipo_marcaje', 'entrada')->count(),
            'descansos' => (clone $statsQuery)->whereIn('tipo_marcaje', ['salida_comida', 'entrada_comida', 'descanso_inicio', 'descanso_fin'])->count(),
            'salidas' => (clone $statsQuery)->where('tipo_marcaje', 'salida')->count(),
        ];

        // Obtener empleados agrupados que tienen marcajes en el filtro
        $empleadosQuery = Empleado::with(['departamento', 'cargo', 'turnoLaboral'])
            ->whereHas('marcajes', function ($q) use ($empresaId, $request) {
                $q->when($empresaId, fn ($sub) => $sub->where('empresa_id', $empresaId))
                  ->when($request->tipo_marcaje, fn ($sub, $t) => $sub->where('tipo_marcaje', $t))
                  ->when($request->origen, fn ($sub, $o) => $sub->where('origen', $o))
                  ->when($request->fecha_inicio, fn ($sub, $f) => $sub->whereDate('fecha_hora', '>=', $f))
                  ->when($request->fecha_fin, fn ($sub, $f) => $sub->whereDate('fecha_hora', '<=', $f));
            })
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->when($request->search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('nombres', 'like', "%{$search}%")
                        ->orWhere('apellidos', 'like', "%{$search}%")
                        ->orWhere('documento_identidad', 'like', "%{$search}%");
                });
            });

        $empleadosPaginados = $empleadosQuery->paginate($request->perPage ?? 15)->withQueryString();

        $now = Carbon::now();
        $configAsistencia = \App\Models\ConfiguracionAsistencia::where('empresa_id', $empresaId)->first();
        $minutosLeySilla = $configAsistencia?->ley_silla_descanso_minutos ?? 15;

        $empleadosPaginados->getCollection()->transform(function ($emp) use ($now, $minutosLeySilla, $request, $empresaId) {
            // Cargar historial de marcajes de este empleado ordenados cronológicamente
            $historialMarcajes = AsistenciaMarcaje::with('sucursal')
                ->where('empleado_id', $emp->id)
                ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
                ->when($request->tipo_marcaje, fn ($q, $t) => $q->where('tipo_marcaje', $t))
                ->when($request->origen, fn ($q, $o) => $q->where('origen', $o))
                ->when($request->fecha_inicio, fn ($q, $f) => $q->whereDate('fecha_hora', '>=', $f))
                ->when($request->fecha_fin, fn ($q, $f) => $q->whereDate('fecha_hora', '<=', $f))
                ->latest('fecha_hora')
                ->get()
                ->map(function ($m) {
                    $m->fecha_hora_iso = Carbon::parse($m->fecha_hora)->toIso8601String();
                    return $m;
                });

            $ultimoMarcaje = $historialMarcajes->first();

            $tiempoRestanteInfo = null;
            if ($ultimoMarcaje) {
                $esAlmuerzo = $ultimoMarcaje->tipo_marcaje === 'salida_comida';
                $esDescanso = $ultimoMarcaje->tipo_marcaje === 'descanso_inicio';

                if ($esAlmuerzo || $esDescanso) {
                    $nombreConcepto = $esAlmuerzo ? 'Almuerzo' : 'Descanso';
                    $limiteMinutos = $esAlmuerzo 
                        ? ($emp->turnoLaboral?->minutos_descanso ?? 60)
                        : $minutosLeySilla;

                    $tiposRegreso = $esAlmuerzo 
                        ? ['entrada_comida', 'descanso_fin', 'salida', 'entrada_extraordinaria']
                        : ['descanso_fin', 'entrada_comida', 'salida', 'entrada_extraordinaria'];

                    $regreso = AsistenciaMarcaje::where('empleado_id', $emp->id)
                        ->where('fecha_hora', '>', $ultimoMarcaje->fecha_hora)
                        ->whereDate('fecha_hora', Carbon::parse($ultimoMarcaje->fecha_hora)->toDateString())
                        ->whereIn('tipo_marcaje', $tiposRegreso)
                        ->orderBy('fecha_hora', 'asc')
                        ->first();

                    if ($regreso) {
                        $duracion = (int) round(Carbon::parse($ultimoMarcaje->fecha_hora)->diffInMinutes(Carbon::parse($regreso->fecha_hora)));
                        $tiempoRestanteInfo = [
                            'estado' => 'completado',
                            'concepto' => $nombreConcepto,
                            'texto' => "Duración: {$duracion} min",
                            'subtexto' => "Límite {$nombreConcepto}: {$limiteMinutos} min",
                            'minutos_restantes' => 0,
                            'limite_minutos' => $limiteMinutos,
                            'duracion_real' => $duracion,
                        ];
                    } else {
                        $transcurridos = (int) round(Carbon::parse($ultimoMarcaje->fecha_hora)->diffInMinutes($now));
                        $restantes = $limiteMinutos - $transcurridos;

                        if ($restantes > 0) {
                            $tiempoRestanteInfo = [
                                'estado' => 'en_curso',
                                'concepto' => $nombreConcepto,
                                'texto' => "{$restantes} min restantes",
                                'subtexto' => "{$nombreConcepto}: {$limiteMinutos} min permitidos",
                                'minutos_restantes' => $restantes,
                                'limite_minutos' => $limiteMinutos,
                                'transcurridos' => $transcurridos,
                            ];
                        } else {
                            $exceso = abs($restantes);
                            $tiempoRestanteInfo = [
                                'estado' => 'excedido',
                                'concepto' => $nombreConcepto,
                                'texto' => "Excedido por {$exceso} min",
                                'subtexto' => "Límite {$nombreConcepto}: {$limiteMinutos} min",
                                'minutos_restantes' => $restantes,
                                'limite_minutos' => $limiteMinutos,
                                'transcurridos' => $transcurridos,
                            ];
                        }
                    }
                } else {
                    $limiteAlmuerzo = $emp->turnoLaboral?->minutos_descanso ?? 60;
                    $tiempoRestanteInfo = [
                        'estado' => 'normal',
                        'concepto' => 'General',
                        'texto' => "Almuerzo: {$limiteAlmuerzo}m | Descanso: {$minutosLeySilla}m",
                        'subtexto' => null,
                        'minutos_restantes' => null,
                        'limite_minutos' => $limiteAlmuerzo,
                    ];
                }
            }

            $emp->ultimo_marcaje = $ultimoMarcaje;
            $emp->tiempo_restante_info = $tiempoRestanteInfo;
            $emp->historial_marcajes = $historialMarcajes;
            $emp->conteo_eventos = [
                'total' => $historialMarcajes->count(),
                'entradas' => $historialMarcajes->where('tipo_marcaje', 'entrada')->count(),
                'descansos' => $historialMarcajes->whereIn('tipo_marcaje', ['salida_comida', 'entrada_comida', 'descanso_inicio', 'descanso_fin'])->count(),
                'salidas' => $historialMarcajes->where('tipo_marcaje', 'salida')->count(),
            ];

            return $emp;
        });

        return Inertia::render('admin/asistencia/Bitacora', [
            'marcajes' => $empleadosPaginados,
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

        // Cargar resúmenes semanales procesados y adjuntar semáforo
        $resumenesSemanales = AsistenciaResumenSemanal::with(['empleado.departamento', 'empleado.cargo', 'empleado.turnoLaboral'])
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->where('periodo_inicio', '>=', $fechaInicio)
            ->where('periodo_fin', '<=', $fechaFin)
            ->get()
            ->map(function ($r) use ($calculoService) {
                $totalH = (float)($r->total_horas_ordinarias + $r->total_horas_extra_dobles + $r->total_horas_extra_triples);
                $r->semaforo = $calculoService->obtenerSemaforoSemanal($totalH);
                return $r;
            });

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
