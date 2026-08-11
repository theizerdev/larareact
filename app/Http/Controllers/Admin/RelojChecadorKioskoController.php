<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AsistenciaMarcaje;
use App\Models\ConfiguracionAsistencia;
use App\Models\Empleado;
use App\Services\CalculoAsistenciaLftService;
use App\Services\NotificacionAsistenciaWhatsAppService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class RelojChecadorKioskoController extends Controller
{
    /**
     * Muestra la interfaz táctil del Kiosko Reloj Checador.
     */
    public function kioskoView(Request $request)
    {
        $user = $request->user();
        $empresaId = $user ? $user->empresa_id : null;

        $configuracion = ConfiguracionAsistencia::where('empresa_id', $empresaId)->first();

        // Obtener la zona horaria de la empresa
        $zonaHoraria = null;
        if ($user && $user->empresa) {
            $zonaHoraria = $user->empresa->zona_horaria;
        }

        return Inertia::render('admin/reloj-checador/Kiosko', [
            'configuracion' => $configuracion,
            'zona_horaria'  => $zonaHoraria,
        ]);
    }

    /**
     * Busca al empleado por documento de identidad o teléfono y sugiere el siguiente tipo de marcaje.
     */
    public function buscarEmpleado(Request $request)
    {
        $request->validate([
            'query' => 'required|string',
        ]);

        $query = trim($request->input('query'));
        $user = $request->user();
        $empresaId = $user ? $user->empresa_id : null;

        $empleado = Empleado::with(['turnoLaboral', 'departamento', 'cargo'])
            ->where('status', true)
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->where(function ($q) use ($query) {
                $q->where('documento_identidad', $query)
                    ->orWhere('curp', $query)
                    ->orWhere('telefono', $query)
                    ->orWhere('id', $query);
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
                'documento_identidad' => $empleado->documento_identidad,
                'foto_empleado' => $empleado->foto_empleado ? Storage::url($empleado->foto_empleado) : null,
                'departamento' => $empleado->departamento?->nombre,
                'cargo' => $empleado->cargo?->nombre,
                'turno' => $empleado->turnoLaboral?->nombre ?? 'Sin turno asignado',
                'ultimo_marcaje_tipo' => $ultimoMarcaje?->tipo_marcaje,
            ],
            'ultimo_marcaje' => $ultimoMarcaje ? [
                'tipo' => $ultimoMarcaje->tipo_marcaje,
                'hora' => $ultimoMarcaje->fecha_hora->format('H:i:s'),
            ] : null,
            'sugerencia_marcaje' => $siguienteMarcaje,
        ]);
    }

    /**
     * Registra una marca de reloj (Entrada, Salida Comida, Regreso Comida, Salida Final).
     */
    public function registrarMarcaje(Request $request, CalculoAsistenciaLftService $calculoService)
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

        $empleado = Empleado::findOrFail($validated['empleado_id']);
        $now = Carbon::now();

        // Aplicar redondeo si está configurado en ConfiguracionAsistencia
        $config = ConfiguracionAsistencia::where('empresa_id', $empleado->empresa_id)->first();
        if ($config && $config->redondeo_marcaje_minutos > 0) {
            $minutos = $config->redondeo_marcaje_minutos;
            $minute = $now->minute;
            $remainder = $minute % $minutos;

            if ($remainder >= ($minutos / 2)) {
                $now->addMinutes($minutos - $remainder)->second(0);
            } else {
                $now->subMinutes($remainder)->second(0);
            }
        }

        // Guardar foto si se envió en base64
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
            'origen' => 'kiosko',
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
            \Illuminate\Support\Facades\Log::error("Error enviando WhatsApp marcaje: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Marcaje registrado con éxito.',
            'marcaje' => [
                'tipo_marcaje' => $marcaje->tipo_marcaje,
                'hora' => $marcaje->fecha_hora->format('H:i:s'),
                'fecha' => $marcaje->fecha_hora->format('d/m/Y'),
            ],
            'empleado_nombre' => $empleado->nombre_completo,
        ]);
    }
}
