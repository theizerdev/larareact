<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AsistenciaMarcaje;
use App\Models\AsistenciaResumenSemanal;
use App\Models\Empleado;
use App\Models\Sucursal;
use App\Models\VisitaAcceso;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Endpoints de solo lectura para las pantallas de la app móvil
 * (Dashboard, Empleados y Bitácora). El scope Multitenantable de cada
 * modelo se aplica automáticamente según la empresa del usuario autenticado.
 */
class MovilDataController extends Controller
{
    /**
     * Tarjetas de estadísticas del Dashboard.
     */
    public function dashboardStats(Request $request)
    {
        $hoy = Carbon::today();

        return response()->json([
            'empleados_total' => Empleado::count(),
            'accesos_hoy' => VisitaAcceso::where(function ($q) use ($hoy) {
                $q->whereDate('created_at', $hoy)
                    ->orWhereDate('fecha_ingreso', $hoy);
            })->count(),
            'activos_dentro' => VisitaAcceso::whereNull('fecha_salida')->count(),
            'sucursales' => Sucursal::count(),
            'marcajes_hoy' => AsistenciaMarcaje::whereDate('fecha_hora', $hoy)->count(),
        ]);
    }

    /**
     * Listado de empleados con búsqueda opcional.
     */
    public function empleados(Request $request)
    {
        $search = trim((string) $request->query('search', ''));

        $empleados = Empleado::with(['departamento', 'cargo'])
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('nombres', 'like', "%{$search}%")
                        ->orWhere('apellidos', 'like', "%{$search}%")
                        ->orWhere('codigo_acceso', 'like', "%{$search}%")
                        ->orWhere('documento_identidad', 'like', "%{$search}%");
                });
            })
            ->orderBy('nombres')
            ->limit(150)
            ->get()
            ->map(fn (Empleado $e) => [
                'id' => $e->id,
                'nombre_completo' => $e->nombre_completo,
                'documento_identidad' => $e->documento_identidad,
                'codigo_acceso' => $e->codigo_acceso ?: $e->documento_identidad,
                'departamento' => $e->departamento?->nombre,
                'cargo' => $e->cargo?->nombre,
                'foto_empleado' => $e->foto_empleado ? Storage::url($e->foto_empleado) : null,
                'status' => (bool) $e->status,
            ]);

        return response()->json([
            'data' => $empleados,
            'total' => $empleados->count(),
        ]);
    }

    /**
     * Bitácora de marcajes del día (con estadísticas rápidas).
     */
    public function bitacora(Request $request)
    {
        $fecha = $request->query('fecha')
            ? Carbon::parse($request->query('fecha'))
            : Carbon::today();

        $marcajes = AsistenciaMarcaje::with(['empleado.departamento'])
            ->whereDate('fecha_hora', $fecha)
            ->orderBy('fecha_hora', 'desc')
            ->limit(300)
            ->get();

        $entradas = ['entrada', 'entrada_comida', 'descanso_fin', 'incidente_fin', 'entrada_extraordinaria'];
        $salidas = ['salida', 'salida_comida'];
        $descansos = ['descanso_inicio', 'descanso_fin'];

        return response()->json([
            'stats' => [
                'total' => $marcajes->count(),
                'entradas' => $marcajes->whereIn('tipo_marcaje', $entradas)->count(),
                'salidas' => $marcajes->whereIn('tipo_marcaje', $salidas)->count(),
                'descansos' => $marcajes->whereIn('tipo_marcaje', $descansos)->count(),
            ],
            'marcajes' => $marcajes->map(fn (AsistenciaMarcaje $m) => [
                'id' => $m->id,
                'nombre' => $m->empleado?->nombre_completo ?? 'Empleado',
                'tipo' => $m->tipo_marcaje,
                'hora' => Carbon::parse($m->fecha_hora)->format('H:i:s'),
                'departamento' => $m->empleado?->departamento?->nombre ?? '—',
            ])->values(),
        ]);
    }

    /**
     * Detalle de un empleado.
     */
    public function empleadoDetalle($id)
    {
        $e = Empleado::with(['departamento', 'cargo', 'turnoLaboral'])->find($id);

        if (! $e) {
            return response()->json(['success' => false, 'message' => 'Empleado no encontrado.'], 404);
        }

        return response()->json([
            'id' => $e->id,
            'nombre_completo' => $e->nombre_completo,
            'documento_identidad' => $e->documento_identidad,
            'codigo_acceso' => $e->codigo_acceso,
            'curp' => $e->curp,
            'telefono' => $e->telefono,
            'correo' => $e->correo,
            'genero' => $e->genero,
            'departamento' => $e->departamento?->nombre,
            'cargo' => $e->cargo?->nombre,
            'turno' => $e->turnoLaboral?->nombre,
            'salario_diario' => $e->salario_diario,
            'foto_empleado' => $e->foto_empleado ? Storage::url($e->foto_empleado) : null,
            'status' => (bool) $e->status,
        ]);
    }

    /**
     * Marcajes recientes de un empleado.
     */
    public function empleadoMarcajes($id)
    {
        if (! Empleado::whereKey($id)->exists()) {
            return response()->json(['success' => false, 'message' => 'Empleado no encontrado.'], 404);
        }

        $marcajes = AsistenciaMarcaje::where('empleado_id', $id)
            ->orderBy('fecha_hora', 'desc')
            ->limit(50)
            ->get()
            ->map(fn (AsistenciaMarcaje $m) => [
                'id' => $m->id,
                'tipo' => $m->tipo_marcaje,
                'fecha' => Carbon::parse($m->fecha_hora)->format('d/m/Y'),
                'hora' => Carbon::parse($m->fecha_hora)->format('H:i:s'),
            ]);

        return response()->json(['data' => $marcajes]);
    }

    /**
     * Pre-nómina: resúmenes semanales del periodo más reciente.
     */
    public function nomina(Request $request)
    {
        $ultimo = AsistenciaResumenSemanal::orderBy('periodo_fin', 'desc')->first();

        if (! $ultimo) {
            return response()->json([
                'periodo' => null,
                'data' => [],
                'totales' => ['horas_ordinarias' => 0, 'horas_extra' => 0, 'monto_total' => 0],
            ]);
        }

        $resumenes = AsistenciaResumenSemanal::where('periodo_inicio', $ultimo->periodo_inicio)
            ->where('periodo_fin', $ultimo->periodo_fin)
            ->get();

        $empleados = Empleado::whereIn('id', $resumenes->pluck('empleado_id'))->get()->keyBy('id');

        return response()->json([
            'periodo' => [
                'inicio' => Carbon::parse($ultimo->periodo_inicio)->format('d/m/Y'),
                'fin' => Carbon::parse($ultimo->periodo_fin)->format('d/m/Y'),
            ],
            'data' => $resumenes->map(fn (AsistenciaResumenSemanal $r) => [
                'empleado' => optional($empleados->get($r->empleado_id))->nombre_completo ?? 'Empleado',
                'horas_ordinarias' => (float) $r->total_horas_ordinarias,
                'horas_extra' => (float) $r->total_horas_extra_dobles + (float) $r->total_horas_extra_triples,
                'monto_total' => (float) $r->monto_total_pagar,
            ])->values(),
            'totales' => [
                'horas_ordinarias' => (float) $resumenes->sum('total_horas_ordinarias'),
                'horas_extra' => (float) $resumenes->sum(fn ($r) => $r->total_horas_extra_dobles + $r->total_horas_extra_triples),
                'monto_total' => (float) $resumenes->sum('monto_total_pagar'),
            ],
        ]);
    }

    /**
     * Notificaciones del usuario autenticado.
     */
    public function notifications(Request $request)
    {
        $user = $request->user();

        $rows = DB::table('notifications')
            ->where('notifiable_type', get_class($user))
            ->where('notifiable_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'data' => $rows->map(function ($n) {
                $d = json_decode($n->data, true) ?: [];

                return [
                    'id' => $n->id,
                    'title' => $d['title'] ?? $d['titulo'] ?? 'Notificación',
                    'message' => $d['message'] ?? $d['mensaje'] ?? $d['body'] ?? '',
                    'read' => $n->read_at !== null,
                    'created_at' => Carbon::parse($n->created_at)->diffForHumans(),
                ];
            })->values(),
            'unread' => $rows->whereNull('read_at')->count(),
        ]);
    }

    public function markNotificationRead($id, Request $request)
    {
        DB::table('notifications')
            ->where('id', $id)
            ->where('notifiable_id', $request->user()->id)
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function markAllNotificationsRead(Request $request)
    {
        DB::table('notifications')
            ->where('notifiable_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    /**
     * Historial de accesos / garita (últimos registros).
     */
    public function accesos(Request $request)
    {
        $rows = VisitaAcceso::orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(fn (VisitaAcceso $v) => [
                'id' => $v->id,
                'nombre' => $v->visitante_nombre ?? $v->codigo_visitante ?? 'Visitante',
                'tipo' => $v->tipo_acceso,
                'fecha_ingreso' => $v->fecha_ingreso,
                'hora_ingreso' => $v->hora_ingreso,
                'dentro' => $v->fecha_salida === null,
                'status' => $v->status,
            ]);

        return response()->json(['data' => $rows]);
    }
}
