<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AsistenciaMarcaje;
use App\Models\AsistenciaResumenDiario;
use App\Models\ConfiguracionAsistencia;
use App\Models\Empleado;
use App\Models\Sucursal;
use App\Services\CalculoAsistenciaLftService;
use App\Services\RegistroMarcajeService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class KioskoApiController extends Controller
{
    /**
     * Obtener configuración de asistencia de la empresa del usuario autenticado.
     *
     * Devuelve los campos de configuración en la raíz (formato que ya consume la
     * app móvil) más la zona horaria resuelta igual que el kiosko web.
     */
    public function configuracion(Request $request)
    {
        $user = $request->user();
        $empresaId = $user ? $user->empresa_id : null;

        $configuracion = ConfiguracionAsistencia::where('empresa_id', $empresaId)->first();

        // Zona horaria: Sucursal -> Empresa -> País -> App Config -> America/Mexico_City
        $empresa = $user ? $user->empresa : null;
        $sucursal = ($user && ! empty($user->sucursal_id)) ? Sucursal::find($user->sucursal_id) : null;

        $zonaHoraria = $sucursal?->zona_horaria
            ?? $empresa?->zona_horaria
            ?? $empresa?->pais?->zona_horaria
            ?? config('app.timezone')
            ?? 'America/Mexico_City';

        $payload = $configuracion ? $configuracion->toArray() : [];
        $payload['zona_horaria'] = $zonaHoraria;

        return response()->json($payload);
    }

    /**
     * Buscar empleado por documento, código de acceso, CURP o teléfono
     * y sugerir el siguiente tipo de marcaje.
     */
    public function buscar(Request $request, RegistroMarcajeService $registro)
    {
        $request->validate([
            'query' => 'required|string',
        ]);

        $user = $request->user();
        $empleado = $registro->buscarEmpleado($request->input('query'), $user ? $user->empresa_id : null);

        if (! $empleado) {
            return response()->json([
                'success' => false,
                'message' => 'Empleado no encontrado o inactivo.',
            ], 404);
        }

        // Obtener el último marcaje del día de hoy
        $ultimoMarcaje = AsistenciaMarcaje::where('empleado_id', $empleado->id)
            ->whereDate('fecha_hora', Carbon::today())
            ->latest('fecha_hora')
            ->first();

        // Sugerir el siguiente marcaje lógico
        $siguienteMarcaje = 'entrada';
        if ($ultimoMarcaje) {
            switch ($ultimoMarcaje->tipo_marcaje) {
                case 'entrada':
                    $siguienteMarcaje = 'salida_comida';
                    break;
                case 'salida_comida':
                    $siguienteMarcaje = 'entrada_comida';
                    break;
                case 'entrada_comida':
                    $siguienteMarcaje = 'salida';
                    break;
                case 'descanso_inicio':
                    $siguienteMarcaje = 'descanso_fin';
                    break;
                case 'descanso_fin':
                    $siguienteMarcaje = 'descanso_inicio';
                    break;
                case 'incidente_inicio':
                    $siguienteMarcaje = 'incidente_fin';
                    break;
                case 'incidente_fin':
                    $siguienteMarcaje = 'salida';
                    break;
                case 'salida':
                    $siguienteMarcaje = 'entrada';
                    break;
            }
        }

        return response()->json([
            'success' => true,
            'empleado' => [
                'id' => $empleado->id,
                'nombre_completo' => $empleado->nombre_completo,
                'documento_identidad' => $empleado->codigo_acceso ?: $empleado->documento_identidad,
                'codigo_acceso' => $empleado->codigo_acceso ?: $empleado->documento_identidad,
                'numero_empleado' => $empleado->codigo_acceso,
                'departamento' => $empleado->departamento?->nombre,
                'cargo' => $empleado->cargo?->nombre,
                'turno' => $empleado->turnoLaboral?->nombre ?? 'Sin turno asignado',
                'foto_empleado' => $empleado->foto_empleado ? asset('storage/'.$empleado->foto_empleado) : null,
                'ultimo_marcaje_tipo' => $ultimoMarcaje?->tipo_marcaje,
            ],
            'ultimo_marcaje' => $ultimoMarcaje ? [
                'tipo' => $ultimoMarcaje->tipo_marcaje,
                'hora' => Carbon::parse($ultimoMarcaje->fecha_hora)->format('H:i:s'),
            ] : null,
            'sugerencia_marcaje' => $siguienteMarcaje,
        ]);
    }

    /**
     * Autoservicio: devuelve el empleado vinculado a la cuenta autenticada
     * (empleados.user_id), con la misma forma que buscar(). 404 si la cuenta
     * no corresponde a un empleado.
     */
    public function miEmpleado(Request $request)
    {
        $user = $request->user();

        $empleado = Empleado::with(['turnoLaboral', 'departamento', 'cargo'])
            ->where('user_id', $user->id)
            ->where('status', true)
            ->first();

        if (! $empleado) {
            return response()->json([
                'success' => false,
                'message' => 'Tu cuenta no está vinculada a un empleado.',
            ], 404);
        }

        if (! $empleado->permite_app_movil) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para utilizar la app móvil. Contacta a Recursos Humanos.',
                'permite_app_movil' => false,
            ], 403);
        }

        $ultimoMarcaje = AsistenciaMarcaje::where('empleado_id', $empleado->id)
            ->whereDate('fecha_hora', Carbon::today())
            ->latest('fecha_hora')
            ->first();

        $siguienteMarcaje = 'entrada';
        if ($ultimoMarcaje) {
            switch ($ultimoMarcaje->tipo_marcaje) {
                case 'entrada': $siguienteMarcaje = 'salida_comida'; break;
                case 'salida_comida': $siguienteMarcaje = 'entrada_comida'; break;
                case 'entrada_comida': $siguienteMarcaje = 'salida'; break;
                case 'descanso_inicio': $siguienteMarcaje = 'descanso_fin'; break;
                case 'descanso_fin': $siguienteMarcaje = 'descanso_inicio'; break;
                case 'incidente_inicio': $siguienteMarcaje = 'incidente_fin'; break;
                case 'incidente_fin': $siguienteMarcaje = 'salida'; break;
                case 'salida': $siguienteMarcaje = 'entrada'; break;
            }
        }

        return response()->json([
            'success' => true,
            'empleado' => [
                'id' => $empleado->id,
                'nombre_completo' => $empleado->nombre_completo,
                'documento_identidad' => $empleado->codigo_acceso ?: $empleado->documento_identidad,
                'codigo_acceso' => $empleado->codigo_acceso ?: $empleado->documento_identidad,
                'numero_empleado' => $empleado->codigo_acceso,
                'departamento' => $empleado->departamento?->nombre,
                'cargo' => $empleado->cargo?->nombre,
                'turno' => $empleado->turnoLaboral?->nombre ?? 'Sin turno asignado',
                'foto_empleado' => $empleado->foto_empleado ? asset('storage/'.$empleado->foto_empleado) : null,
                'ultimo_marcaje_tipo' => $ultimoMarcaje?->tipo_marcaje,
                'permite_app_movil' => (bool) $empleado->permite_app_movil,
                'intervalo_geolocalizacion_minutos' => $empleado->intervalo_geolocalizacion_minutos ?? 15,
            ],
            'intervalo_geolocalizacion_minutos' => $empleado->intervalo_geolocalizacion_minutos ?? 15,
            'ultimo_marcaje' => $ultimoMarcaje ? [
                'tipo' => $ultimoMarcaje->tipo_marcaje,
                'hora' => Carbon::parse($ultimoMarcaje->fecha_hora)->format('H:i:s'),
            ] : null,
            'sugerencia_marcaje' => $siguienteMarcaje,
        ]);
    }

    /**
     * Registrar un marcaje enviado desde la app móvil.
     */
    public function registrar(Request $request, CalculoAsistenciaLftService $calculoService, RegistroMarcajeService $registro)
    {
        $validated = $request->validate([
            'empleado_id' => 'required|exists:empleados,id',
            'tipo_marcaje' => 'required|in:entrada,salida_comida,entrada_comida,salida,descanso_inicio,descanso_fin,incidente_inicio,incidente_fin,entrada_extraordinaria',
            'fotografia_base64' => 'nullable|string',
            'latitud' => 'nullable|numeric',
            'longitud' => 'nullable|numeric',
            'observaciones' => 'nullable|string|max:255',
            'incidente_causa' => 'nullable|string|max:255',
            'duracion_descanso_minutos' => 'nullable|integer|min:1|max:120',
            'tipo_entrada' => 'nullable|string|in:normal,extraordinaria_doble,extraordinaria_triple',
        ]);

        // Autoservicio: una cuenta vinculada a un empleado solo registra SUS
        // PROPIOS marcajes (ignora empleado_id ajenos) y solo si sigue activo.
        // Registrar a otros es lo que hace el kiosko y exige su permiso, igual
        // que en el web: antes cualquier cuenta sin empleado vinculado podía
        // marcarle entrada o salida a cualquier compañero.
        $user = $request->user();
        $propioEmpleado = $user->empleado;

        if ($propioEmpleado) {
            if (! $propioEmpleado->status) {
                return response()->json([
                    'success' => false,
                    'message' => 'Empleado no encontrado o inactivo.',
                ], 404);
            }
            if (! $propioEmpleado->permite_app_movil) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permiso para registrar marcajes desde la app móvil.',
                ], 403);
            }
            $empleado = $propioEmpleado;
        } else {
            if (! $user->can('asistencia.kiosko')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permiso para registrar marcajes de otros empleados.',
                ], 403);
            }

            // El scope de multitenancy aplica aquí: si el empleado es de otra empresa,
            // find() devuelve null aunque la regla exists lo haya dejado pasar.
            $empleado = Empleado::find($validated['empleado_id']);

            if (! $empleado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Empleado no encontrado o inactivo.',
                ], 404);
            }
        }

        // Doble toque / reintento de la app: se responde con el marcaje ya
        // registrado, sin duplicarlo ni recalcular ni reenviar el WhatsApp.
        $duplicado = $registro->duplicadoReciente($empleado, $validated['tipo_marcaje']);

        if ($duplicado) {
            return response()->json([
                'success' => true,
                'message' => 'Marcaje registrado con éxito.',
                'empleado_nombre' => $empleado->nombre_completo,
                'marcaje' => [
                    'tipo_marcaje' => $duplicado->tipo_marcaje,
                    'hora' => $duplicado->fecha_hora->format('H:i:s'),
                    'fecha' => $duplicado->fecha_hora->format('d/m/Y'),
                ],
            ]);
        }

        $now = Carbon::now();

        // Aplicar redondeo si está configurado en ConfiguracionAsistencia
        $config = ConfiguracionAsistencia::where('empresa_id', $empleado->empresa_id)->first();
        if ($config && $config->redondeo_marcaje_minutos > 0) {
            $minutos = $config->redondeo_marcaje_minutos;
            $remainder = $now->minute % $minutos;

            if ($remainder >= ($minutos / 2)) {
                $now->addMinutes($minutos - $remainder)->second(0);
            } else {
                $now->subMinutes($remainder)->second(0);
            }
        }

        // Flutter puede mandarla como data URI; sólo se guarda si es una imagen real.
        $fotoPath = $registro->guardarFoto($validated['fotografia_base64'] ?? null, $empleado->id);

        $lat = $validated['latitud'] ?? null;
        $lon = $validated['longitud'] ?? null;
        $geoloc = ($lat && $lon) ? "{$lat}, {$lon}" : null;

        $marcaje = AsistenciaMarcaje::create([
            'empresa_id' => $empleado->empresa_id,
            'sucursal_id' => $empleado->sucursal_id,
            'empleado_id' => $empleado->id,
            'tipo_marcaje' => $validated['tipo_marcaje'],
            'fecha_hora' => $now,
            'origen' => 'app',
            'fotografia_path' => $fotoPath,
            'latitud' => $lat,
            'longitud' => $lon,
            'geolocalizacion' => $geoloc,
            'observaciones' => $validated['observaciones'] ?? null,
            'incidente_causa' => $validated['incidente_causa'] ?? null,
            'duracion_descanso_minutos' => $validated['duracion_descanso_minutos'] ?? null,
            'tipo_entrada' => $validated['tipo_entrada'] ?? 'normal',
            'registrado_por_user_id' => $request->user()?->id,
        ]);

        // Recalcular asistencia del día automáticamente
        $calculoService->calcularHorasDiarias($empleado, $now->toDateString());

        // WhatsApp al empleado, fuera de la petición (ver RegistroMarcajeService).
        $registro->notificarEnCola($empleado, $marcaje);

        return response()->json([
            'success' => true,
            'message' => 'Marcaje registrado con éxito.',
            'empleado_nombre' => $empleado->nombre_completo,
            'marcaje' => [
                'tipo_marcaje' => $marcaje->tipo_marcaje,
                'hora' => $marcaje->fecha_hora->format('H:i:s'),
                'fecha' => $marcaje->fecha_hora->format('d/m/Y'),
            ],
        ]);
    }

    /**
     * Historial de asistencia del empleado vinculado al usuario (autoservicio):
     * sus marcajes recientes + resumen de la semana en curso.
     */
    public function miHistorial(Request $request)
    {
        $empleado = Empleado::where('user_id', $request->user()->id)->first();

        if (! $empleado) {
            return response()->json([
                'success' => false,
                'message' => 'Tu cuenta no está vinculada a un empleado.',
            ], 404);
        }

        $desde = Carbon::today()->subDays(14);

        $marcajes = AsistenciaMarcaje::where('empleado_id', $empleado->id)
            ->where('fecha_hora', '>=', $desde)
            ->orderBy('fecha_hora', 'desc')
            ->limit(100)
            ->get()
            ->map(fn (AsistenciaMarcaje $m) => [
                'tipo' => $m->tipo_marcaje,
                'fecha' => Carbon::parse($m->fecha_hora)->format('d/m/Y'),
                'hora' => Carbon::parse($m->fecha_hora)->format('H:i:s'),
            ]);

        $resumen = AsistenciaResumenDiario::where('empleado_id', $empleado->id)
            ->where('fecha', '>=', Carbon::now()->startOfWeek())
            ->get();

        return response()->json([
            'empleado' => ['nombre_completo' => $empleado->nombre_completo],
            'resumen_semana' => [
                'horas_ordinarias' => (float) $resumen->sum('horas_ordinarias'),
                'horas_extra' => (float) $resumen->sum('horas_extra_diarias'),
                'dias_asistidos' => $resumen->count(),
            ],
            'marcajes' => $marcajes,
        ]);
    }
}
