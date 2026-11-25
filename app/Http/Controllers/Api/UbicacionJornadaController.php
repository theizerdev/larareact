<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Empleado;
use App\Models\EmpleadoUbicacion;
use App\Services\UbicacionJornadaService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Ubicación del colaborador durante su jornada (app móvil), cada 15 minutos o
 * el intervalo de geolocalización que tenga en el web.
 */
class UbicacionJornadaController extends Controller
{
    /**
     * La app manda sus puntos (varios si estuvo sin conexión). Sólo los del
     * propio colaborador de la cuenta: el kiosko compartido no rastrea a nadie.
     */
    public function registrar(Request $request, UbicacionJornadaService $ubicaciones): JsonResponse
    {
        $validated = $request->validate([
            'puntos' => 'required|array|min:1|max:'.UbicacionJornadaService::MAX_PUNTOS,
            'puntos.*.uuid_cliente' => 'required|uuid',
            'puntos.*.latitud' => 'required|numeric|between:-90,90',
            'puntos.*.longitud' => 'required|numeric|between:-180,180',
            'puntos.*.precision_metros' => 'nullable|numeric|min:0|max:9999999',
            'puntos.*.ubicacion_simulada' => 'nullable|boolean',
            'puntos.*.fecha_hora_dispositivo' => 'required|date',
        ]);

        $user = $request->user();
        $empleado = $user->empleado;

        if (! $empleado || ! $empleado->status || ! $empleado->permite_app_movil) {
            return response()->json([
                'success' => false,
                'message' => 'Tu cuenta no está ligada a un colaborador activo con la app móvil.',
            ], 403);
        }

        $resultado = $ubicaciones->registrar($empleado, $user, $validated['puntos']);

        return response()->json([
            'success' => true,
            ...$resultado,
            'jornada_abierta' => $ubicaciones->jornadaAbierta($empleado),
            'intervalo_minutos' => $ubicaciones->intervaloMinutos($empleado),
        ]);
    }

    /**
     * Abre el monitoreo de la jornada: entrega el token de ubicación que la
     * app guarda para seguir enviando después de cerrar la sesión. Pide la
     * sesión normal (no se renueva con el propio token de ubicación) y una
     * jornada abierta.
     */
    public function iniciarSesion(Request $request, UbicacionJornadaService $ubicaciones): JsonResponse
    {
        $user = $request->user();
        $empleado = $user->empleado;

        if (! $empleado || ! $empleado->status || ! $empleado->permite_app_movil) {
            return response()->json([
                'success' => false,
                'message' => 'Tu cuenta no está ligada a un colaborador activo con la app móvil.',
            ], 403);
        }

        if (! $ubicaciones->jornadaAbierta($empleado)) {
            return response()->json([
                'success' => false,
                'jornada_abierta' => false,
                'message' => 'No hay una jornada abierta: la ubicación se registra de la entrada a la salida.',
            ], 409);
        }

        $sesion = $ubicaciones->emitirToken($user);

        return response()->json([
            'success' => true,
            'jornada_abierta' => true,
            'token' => $sesion['token'],
            'expira_en' => $sesion['expira_en']->toIso8601String(),
            'intervalo_minutos' => $ubicaciones->intervaloMinutos($empleado),
        ]);
    }

    /** La app terminó el monitoreo (salida): el token de ubicación deja de servir. */
    public function cerrarSesion(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();

        if ($token instanceof PersonalAccessToken && $token->name === UbicacionJornadaService::TOKEN) {
            $token->delete();
        }

        return response()->json(['success' => true]);
    }

    /** ¿Hay jornada abierta? La app lo pregunta al abrir para reanudar o no el monitoreo. */
    public function estado(Request $request, UbicacionJornadaService $ubicaciones): JsonResponse
    {
        $empleado = $request->user()->empleado;

        return response()->json([
            'success' => true,
            'jornada_abierta' => $empleado ? $ubicaciones->jornadaAbierta($empleado) : false,
            'intervalo_minutos' => $empleado ? $ubicaciones->intervaloMinutos($empleado) : UbicacionJornadaService::INTERVALO_MINUTOS,
        ]);
    }

    /** Recorrido de un colaborador en un día (por defecto hoy), para quien ve Empleados. */
    public function delEmpleado(Request $request, int $id): JsonResponse
    {
        $request->validate(['fecha' => 'nullable|date_format:Y-m-d']);

        // Los scopes de empresa, sede y Legacy aplican: uno ajeno da 404.
        $empleado = Empleado::find($id);

        if (! $empleado) {
            return response()->json(['success' => false, 'message' => 'Empleado no encontrado.'], 404);
        }

        $fecha = $request->filled('fecha') ? Carbon::parse($request->input('fecha')) : Carbon::today();

        $puntos = EmpleadoUbicacion::where('empleado_id', $empleado->id)
            ->whereBetween('fecha_hora', [$fecha->copy()->startOfDay(), $fecha->copy()->endOfDay()])
            ->orderBy('fecha_hora')
            ->get();

        return response()->json([
            'success' => true,
            'fecha' => $fecha->toDateString(),
            'ubicaciones' => $puntos->map(fn (EmpleadoUbicacion $u) => [
                'id' => $u->id,
                'latitud' => (float) $u->latitud,
                'longitud' => (float) $u->longitud,
                'precision_metros' => $u->precision_metros !== null ? (float) $u->precision_metros : null,
                'ubicacion_simulada' => $u->ubicacion_simulada,
                'fecha_hora' => $u->fecha_hora->toIso8601String(),
            ])->values(),
        ]);
    }
}
