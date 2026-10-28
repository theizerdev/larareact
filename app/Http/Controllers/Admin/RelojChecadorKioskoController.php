<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AsistenciaMarcaje;
use App\Models\ConfiguracionAsistencia;
use App\Models\Empleado;
use App\Services\CalculoAsistenciaLftService;
use App\Services\EmpleadoEnrolamientoService;
use App\Services\RegistroMarcajeService;
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
        $empresaId = $user?->empresa_id ?? \App\Models\Empresa::value('id');

        $configuracion = ConfiguracionAsistencia::where('empresa_id', $empresaId)->first()
            ?? ConfiguracionAsistencia::first();

        // Obtener la zona horaria (Sucursal -> Empresa -> País -> App Config -> America/Mexico_City)
        $empresa = $user ? $user->empresa : ($empresaId ? \App\Models\Empresa::find($empresaId) : \App\Models\Empresa::first());
        $sucursal = ($user && !empty($user->sucursal_id))
            ? \App\Models\Sucursal::find($user->sucursal_id)
            : ($configuracion?->sucursal_id ? \App\Models\Sucursal::find($configuracion->sucursal_id) : null);

        $zonaHoraria = $sucursal?->zona_horaria
            ?? $empresa?->zona_horaria
            ?? $empresa?->pais?->zona_horaria
            ?? config('app.timezone')
            ?? 'America/Mexico_City';

        return Inertia::render('admin/reloj-checador/Kiosko', [
            'configuracion' => $configuracion,
            'zona_horaria'  => $zonaHoraria,
            'opciones_comida' => ConfiguracionAsistencia::obtenerOpcionesParaKiosko($empresa?->id, $sucursal?->id, $zonaHoraria),
            'empresa' => $empresa ? [
                'id' => $empresa->id,
                'razon_social' => $empresa->razon_social,
                'nombre_comercial' => $empresa->nombre_comercial,
                'logo' => $empresa->logo,
                'logo_mini' => $empresa->logo_mini,
            ] : null,
        ]);
    }

    /**
     * Busca al empleado por documento de identidad o teléfono y sugiere el siguiente tipo de marcaje.
     */
    public function buscarEmpleado(Request $request)
    {
        $user = $request->user();
        if ($user && ! $user->can('asistencia.kiosko') && ! $user->can('asistencia.view')) {
            abort(403, 'No tiene permiso para buscar empleados en el reloj checador.');
        }

        $request->validate([
            'query' => 'required|string',
        ]);

        $empresaId = $user?->empresa_id ?? \App\Models\Empresa::value('id');
        $empleado = app(RegistroMarcajeService::class)->buscarEmpleado($request->input('query'), $empresaId);

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
                    $yaComio = AsistenciaMarcaje::where('empleado_id', $empleado->id)
                        ->whereDate('fecha_hora', Carbon::today())
                        ->where('tipo_marcaje', 'salida_comida')
                        ->exists();
                    $siguienteMarcaje = $yaComio ? 'salida' : 'salida_comida';
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

        $minutosDescanso = $empleado->turnoLaboral?->minutos_descanso ?? 30;

        $marcajesHoy = AsistenciaMarcaje::where('empleado_id', $empleado->id)
            ->whereDate('fecha_hora', Carbon::today())
            ->orderBy('fecha_hora', 'asc')
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'tipo' => $m->tipo_marcaje,
                'tipo_nombre' => self::formatearTipoMarcaje($m->tipo_marcaje),
                'hora' => $m->fecha_hora->format('H:i'),
                'comida_tipo' => $m->comida_tipo,
            ]);

        $estaEnrolado = !empty($empleado->enrolado_en);

        return response()->json([
            'success' => true,
            'empleado' => [
                'id' => $empleado->id,
                'nombre_completo' => $empleado->nombre_completo,
                'nombres' => $empleado->nombres,
                'apellidos' => $empleado->apellidos,
                'documento_identidad' => $empleado->codigo_acceso ?: $empleado->documento_identidad,
                'numero' => $empleado->documento_identidad,
                'codigo_acceso' => $empleado->codigo_acceso ?: $empleado->documento_identidad,
                'foto_empleado' => Empleado::urlFoto($empleado->foto_empleado),
                'departamento' => $empleado->departamento?->nombre,
                'area' => $empleado->departamento?->nombre,
                'cargo' => $empleado->cargo?->nombre,
                'turno' => $empleado->turnoLaboral?->nombre ?? 'Sin turno asignado',
                'minutos_descanso' => $minutosDescanso,
                'ultimo_marcaje_tipo' => $ultimoMarcaje?->tipo_marcaje,
                'enrolado' => $estaEnrolado,
                'enrolado_en' => $empleado->enrolado_en?->toIso8601String(),
                'genero' => $empleado->genero,
                'fecha_nacimiento' => $empleado->fecha_nacimiento?->format('Y-m-d'),
                'empresa_nombre' => $empleado->empresa?->razon_social ?? $empleado->empresa?->nombre_comercial ?? 'Smurfit Westrock',
            ],
            'marcajes_hoy' => $marcajesHoy,
            'ultimo_marcaje' => $ultimoMarcaje ? [
                'tipo' => $ultimoMarcaje->tipo_marcaje,
                'tipo_nombre' => self::formatearTipoMarcaje($ultimoMarcaje->tipo_marcaje),
                'hora' => $ultimoMarcaje->fecha_hora->format('H:i:s'),
            ] : null,
            'sugerencia_marcaje' => $siguienteMarcaje,
            'sugerencia_nombre' => self::formatearTipoMarcaje($siguienteMarcaje),
        ]);
    }

    /**
     * Registra una marca de reloj (Entrada, Salida Comida, Regreso Comida, Salida Final).
     */
    public function registrarMarcaje(Request $request, CalculoAsistenciaLftService $calculoService)
    {
        $user = $request->user();
        if ($user && ! $user->can('asistencia.kiosko')) {
            abort(403, 'No tiene permiso para registrar marcajes en el reloj checador.');
        }
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
            'comida_opcion' => 'nullable',
            'no_adquirio_alimento' => 'nullable|boolean',
            'fecha_hora_local' => 'nullable|string',
        ]);

        $empleado = Empleado::findOrFail($validated['empleado_id']);
        $registro = app(RegistroMarcajeService::class);
        $duplicado = $registro->duplicadoReciente($empleado, $validated['tipo_marcaje']);

        $minutosDescanso = $empleado->turnoLaboral?->minutos_descanso ?? 30;

        if ($duplicado) {
            $horaRegresoEstimada = ($duplicado->tipo_marcaje === 'salida_comida')
                ? Carbon::parse($duplicado->fecha_hora)->addMinutes($minutosDescanso)->format('h:i A')
                : null;

            return response()->json([
                'success' => true,
                'message' => 'Marcaje registrado con éxito.',
                'marcaje' => [
                    'tipo_marcaje' => $duplicado->tipo_marcaje,
                    'tipo_nombre' => self::formatearTipoMarcaje($duplicado->tipo_marcaje),
                    'hora' => $duplicado->fecha_hora->format('H:i:s'),
                    'fecha' => $duplicado->fecha_hora->format('d/m/Y'),
                    'minutos_descanso' => $minutosDescanso,
                    'hora_regreso_estimada' => $horaRegresoEstimada,
                ],
                'empleado_nombre' => $empleado->nombre_completo,
            ]);
        }

        $now = Carbon::now();
        if (!empty($validated['fecha_hora_local'])) {
            try {
                $parsedLocal = Carbon::parse($validated['fecha_hora_local']);
                if ($parsedLocal->diffInHours(Carbon::now()) <= 48) {
                    $now = $parsedLocal;
                }
            } catch (\Exception $e) {}
        }

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

        // Tipo de comida: el nombre y el costo se toman de la configuración, no
        // del navegador, y quedan fijos en el marcaje (ver RegistroMarcajeService).
        // Antes de guardar la foto, para no dejarla huérfana si se rechaza.
        $comida = null;
        $noAdquirio = ! empty($validated['no_adquirio_alimento']);
        if ($validated['tipo_marcaje'] === 'salida_comida' && ($noAdquirio || isset($validated['comida_opcion']))) {
            $comida = $registro->resolverComida($empleado, $validated['comida_opcion'] ?? null, $noAdquirio);

            if (! $comida) {
                return response()->json(['success' => false, 'message' => 'El tipo de comida seleccionado ya no existe.'], 422);
            }
            if (! empty($comida['sin_consumo'])) {
                $validated['observaciones'] = $registro->anotarObservaciones(
                    $validated['observaciones'] ?? null,
                    ['El empleado no adquirió alimento de las opciones disponibles'],
                );
            }
        }

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
            'origen' => 'kiosko',
            'fotografia_path' => $fotoPath,
            'latitud' => $lat,
            'longitud' => $lon,
            'geolocalizacion' => $geoloc,
            'observaciones' => $validated['observaciones'] ?? null,
            'incidente_causa' => $validated['incidente_causa'] ?? null,
            'duracion_descanso_minutos' => $validated['duracion_descanso_minutos'] ?? null,
            ...$registro->atributosComida($comida),
            'tipo_entrada' => $validated['tipo_entrada'] ?? 'normal',
            'registrado_por_user_id' => $request->user()?->id,
        ]);

        // Recalcular asistencia del día automáticamente
        $calculoService->calcularHorasDiarias($empleado, $now->toDateString());

        // WhatsApp al empleado, fuera de la petición (ver RegistroMarcajeService).
        $registro->notificarEnCola($empleado, $marcaje);

        $horaRegresoEstimada = ($marcaje->tipo_marcaje === 'salida_comida')
            ? Carbon::parse($marcaje->fecha_hora)->addMinutes($minutosDescanso)->format('h:i A')
            : null;

        return response()->json([
            'success' => true,
            'message' => 'Marcaje registrado con éxito.',
            'marcaje' => [
                'tipo_marcaje' => $marcaje->tipo_marcaje,
                'tipo_nombre' => self::formatearTipoMarcaje($marcaje->tipo_marcaje),
                'hora' => $marcaje->fecha_hora->format('H:i:s'),
                'fecha' => $marcaje->fecha_hora->format('d/m/Y'),
                'minutos_descanso' => $minutosDescanso,
                'hora_regreso_estimada' => $horaRegresoEstimada,
            ],
            'empleado_nombre' => $empleado->nombre_completo,
        ]);
    }

    /**
     * Devuelve una etiqueta clara y comprensible para el empleado y el quiosco.
     */
    public static function formatearTipoMarcaje(?string $tipo): string
    {
        return match ($tipo) {
            'entrada' => 'Inicio de Jornada',
            'salida_comida' => 'Inicio de Comida',
            'entrada_comida' => 'Fin de Comida',
            'salida' => 'Salida de Jornada',
            'descanso_inicio' => 'Inicio de Descanso',
            'descanso_fin' => 'Fin de Descanso',
            'incidente_inicio' => 'Inicio de Incidente',
            'incidente_fin' => 'Fin de Incidente',
            'entrada_extraordinaria' => 'Tiempo Extra',
            default => $tipo ? str_replace('_', ' ', ucfirst($tipo)) : '',
        };
    }

    /**
     * Enrola al colaborador directamente desde el Kiosko y lo sincroniza con BioTime.
     */
    public function enrolarEmpleado(Request $request, EmpleadoEnrolamientoService $enrolamientoService)
    {
        $user = $request->user();
        if ($user && ! $user->can('asistencia.kiosko') && ! $user->can('asistencia.view') && ! $user->can('empleados.edit')) {
            abort(403, 'No tiene permiso para enrolar colaboradores en el reloj checador.');
        }

        $request->validate([
            'empleado_id' => 'required|integer|exists:empleados,id',
            'aviso_privacidad' => 'accepted',
            'foto_empleado' => 'required|string',
            'foto_empleado_2' => 'required|string',
            'genero' => 'required|in:M,F',
            'fecha_nacimiento' => 'required|date|before:-14 years|after:1900-01-01',
        ], [
            'aviso_privacidad.accepted' => 'Debe aceptar el aviso de privacidad.',
            'foto_empleado.required' => 'Falta la primera foto frontal.',
            'foto_empleado_2.required' => 'Falta la segunda foto frontal.',
            'genero.required' => 'Seleccione el sexo.',
            'fecha_nacimiento.required' => 'Capture la fecha de nacimiento.',
            'fecha_nacimiento.before' => 'La fecha de nacimiento no es válida.',
            'fecha_nacimiento.after' => 'La fecha de nacimiento no es válida.',
        ]);

        $user = $request->user();
        $empresaId = $user?->empresa_id ?? \App\Models\Empresa::value('id');
        $empleado = Empleado::where('id', $request->input('empleado_id'))
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->first();

        if (! $empleado) {
            return response()->json([
                'success' => false,
                'message' => 'Colaborador no encontrado o no pertenece a su empresa.',
            ], 404);
        }

        try {
            $empleado = $enrolamientoService->guardar($empleado, $request->all());
        } catch (\Illuminate\Validation\ValidationException $e) {
            $primerError = collect($e->errors())->flatten()->first() ?: $e->getMessage();
            return response()->json([
                'success' => false,
                'message' => $primerError,
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar el enrolamiento: ' . $e->getMessage(),
            ], 500);
        }

        activity('empleados')
            ->causedBy($user)
            ->performedOn($empleado)
            ->log("Se completó el enrolamiento biométrico de {$empleado->nombre_completo} desde el Kiosko.");

        return response()->json([
            'success' => true,
            'message' => 'Enrolamiento biométrico completado y sincronizado con BioTime exitosamente.',
            'empleado' => [
                'id' => $empleado->id,
                'nombre_completo' => $empleado->nombre_completo,
                'nombres' => $empleado->nombres,
                'apellidos' => $empleado->apellidos,
                'documento_identidad' => $empleado->codigo_acceso ?: $empleado->documento_identidad,
                'numero' => $empleado->documento_identidad,
                'codigo_acceso' => $empleado->codigo_acceso ?: $empleado->documento_identidad,
                'foto_empleado' => Empleado::urlFoto($empleado->foto_empleado),
                'departamento' => $empleado->departamento?->nombre,
                'area' => $empleado->departamento?->nombre,
                'cargo' => $empleado->cargo?->nombre,
                'turno' => $empleado->turnoLaboral?->nombre ?? 'Sin turno asignado',
                'enrolado' => true,
                'enrolado_en' => $empleado->enrolado_en?->toIso8601String(),
                'genero' => $empleado->genero,
                'fecha_nacimiento' => $empleado->fecha_nacimiento?->format('Y-m-d'),
                'empresa_nombre' => $empleado->empresa?->razon_social ?? $empleado->empresa?->nombre_comercial ?? 'Smurfit Westrock',
            ],
        ]);
    }
}
