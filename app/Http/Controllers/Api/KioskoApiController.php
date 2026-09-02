<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AsistenciaMarcaje;
use App\Models\AsistenciaResumenDiario;
use App\Models\ConfiguracionAsistencia;
use App\Models\Empleado;
use App\Models\Sucursal;
use App\Services\CalculoAsistenciaLftService;
use App\Services\NotificacionAsistenciaWhatsAppService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

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
    public function buscar(Request $request)
    {
        $request->validate([
            'query' => 'required|string',
        ]);

        $query = trim($request->input('query'));
        $user = $request->user();
        $empresaId = $user ? $user->empresa_id : null;

        $cleanQuery = preg_replace('/[^a-zA-Z0-9]/', '', $query);
        $isNumeric = ctype_digit($cleanQuery);
        $intVal = $isNumeric ? (int) $cleanQuery : null;
        $padded8 = $isNumeric ? sprintf('%08d', $intVal) : null;
        $padded6 = $isNumeric ? sprintf('%06d', $intVal) : null;

        $empleado = Empleado::with(['turnoLaboral', 'departamento', 'cargo'])
            ->where('status', true)
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->where(function ($q) use ($query, $cleanQuery, $isNumeric, $intVal, $padded8, $padded6) {
                $q->where('codigo_acceso', $query)
                    ->orWhere('codigo_acceso', $cleanQuery)
                    ->orWhere('documento_identidad', $query)
                    ->orWhere('documento_identidad', $cleanQuery)
                    ->orWhere('curp', $query)
                    ->orWhere('telefono', $query)
                    ->orWhere('id', $query);

                if ($isNumeric && $intVal > 0) {
                    $q->orWhere('codigo_acceso', $padded8)
                        ->orWhere('documento_identidad', $padded6)
                        ->orWhere('codigo_acceso', (string) $intVal)
                        ->orWhere('documento_identidad', (string) $intVal)
                        ->orWhere('codigo_acceso', 'like', "%{$cleanQuery}");
                }
            })
            ->first();

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
            ],
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
    public function registrar(Request $request, CalculoAsistenciaLftService $calculoService)
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

        // El scope de multitenancy aplica aquí: si el empleado es de otra empresa,
        // find() devuelve null aunque la regla exists lo haya dejado pasar.
        $empleado = Empleado::find($validated['empleado_id']);

        if (! $empleado) {
            return response()->json([
                'success' => false,
                'message' => 'Empleado no encontrado o inactivo.',
            ], 404);
        }

        // Autoservicio: si la cuenta autenticada está vinculada a un empleado,
        // solo puede registrar SUS PROPIOS marcajes (ignora empleado_id ajenos).
        // Las cuentas de operador/admin (sin empleado vinculado) pueden registrar
        // a cualquier empleado, como en el kiosko.
        $propioEmpleado = $request->user()?->empleado;
        if ($propioEmpleado) {
            $empleado = $propioEmpleado;
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

        // Guardar foto si se envió en base64 (Flutter puede mandarla como data URI)
        $fotoPath = null;
        if (! empty($validated['fotografia_base64'])) {
            $image = str_replace('data:image/png;base64,', '', $validated['fotografia_base64']);
            $image = str_replace('data:image/jpeg;base64,', '', $image);
            $image = str_replace(' ', '+', $image);
            $imageName = 'marcajes/'.time()."_{$empleado->id}.jpg";
            Storage::disk('public')->put($imageName, base64_decode($image));
            $fotoPath = $imageName;
        }

        $marcaje = AsistenciaMarcaje::create([
            'empresa_id' => $empleado->empresa_id,
            'sucursal_id' => $empleado->sucursal_id,
            'empleado_id' => $empleado->id,
            'tipo_marcaje' => $validated['tipo_marcaje'],
            'fecha_hora' => $now,
            'origen' => 'app',
            'fotografia_path' => $fotoPath,
            'latitud' => $validated['latitud'] ?? null,
            'longitud' => $validated['longitud'] ?? null,
            'observaciones' => $validated['observaciones'] ?? null,
            'incidente_causa' => $validated['incidente_causa'] ?? null,
            'duracion_descanso_minutos' => $validated['duracion_descanso_minutos'] ?? null,
            'tipo_entrada' => $validated['tipo_entrada'] ?? 'normal',
            'registrado_por_user_id' => $request->user()?->id,
        ]);

        // Recalcular asistencia del día automáticamente
        $calculoService->calcularHorasDiarias($empleado, $now->toDateString());

        // Enviar notificación instantánea por WhatsApp al empleado
        try {
            app(NotificacionAsistenciaWhatsAppService::class)->notificarMarcaje($empleado, $marcaje);
        } catch (\Exception $e) {
            Log::error('Error enviando WhatsApp marcaje: '.$e->getMessage());
        }

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
