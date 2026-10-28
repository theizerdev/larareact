<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AsistenciaMarcaje;
use App\Models\AsistenciaResumenDiario;
use App\Models\ConfiguracionAsistencia;
use App\Models\Departamento;
use App\Models\Empleado;
use App\Models\Sucursal;
use App\Services\AccessCodeService;
use App\Services\CalculoAsistenciaLftService;
use App\Services\EmpleadoEnrolamientoService;
use App\Services\RegistroMarcajeService;
use Carbon\Carbon;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

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

        // Zona horaria: Sucursal -> Empresa -> País -> App Config -> America/Mexico_City.
        // La sucursal es la del empleado de la cuenta (autoservicio), como las
        // opciones de comida de abajo; si no tiene, la de la cuenta.
        $empresa = $user ? $user->empresa : null;
        $sucursalId = $user?->empleado?->sucursal_id ?? $user?->sucursal_id;
        $sucursal = $sucursalId ? Sucursal::find($sucursalId) : null;

        $zonaHoraria = $sucursal?->zona_horaria
            ?? $empresa?->zona_horaria
            ?? $empresa?->pais?->zona_horaria
            ?? config('app.timezone')
            ?? 'America/Mexico_City';

        $payload = $configuracion ? $configuracion->toArray() : [];
        $payload['zona_horaria'] = $zonaHoraria;
        // Las mismas que ve el kiosko web en INICIO COMIDA (reemplaza la lista
        // cruda de la configuración). Las del comedor del propio empleado
        // cuando la cuenta es de autoservicio.
        $payload['opciones_comida'] = ConfiguracionAsistencia::obtenerOpcionesParaKiosko(
            $empresaId,
            $user?->empleado?->sucursal_id ?? $user?->sucursal_id,
            $zonaHoraria,
        );

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
                'foto_empleado' => Empleado::urlFoto($empleado->foto_empleado),
                'ultimo_marcaje_tipo' => $ultimoMarcaje?->tipo_marcaje,
                ...$this->datosEnrolamiento($empleado),
            ],
            'ultimo_marcaje' => $ultimoMarcaje ? [
                'tipo' => $ultimoMarcaje->tipo_marcaje,
                'hora' => Carbon::parse($ultimoMarcaje->fecha_hora_local)->format('H:i:s'),
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
                'foto_empleado' => Empleado::urlFoto($empleado->foto_empleado),
                'ultimo_marcaje_tipo' => $ultimoMarcaje?->tipo_marcaje,
                'permite_app_movil' => (bool) $empleado->permite_app_movil,
                'intervalo_geolocalizacion_minutos' => $empleado->intervalo_geolocalizacion_minutos ?? 15,
                ...$this->datosEnrolamiento($empleado),
            ],
            'intervalo_geolocalizacion_minutos' => $empleado->intervalo_geolocalizacion_minutos ?? 15,
            'ultimo_marcaje' => $ultimoMarcaje ? [
                'tipo' => $ultimoMarcaje->tipo_marcaje,
                'hora' => Carbon::parse($ultimoMarcaje->fecha_hora_local)->format('H:i:s'),
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
            // INICIO COMIDA, igual que el kiosko web. La app manda el id de la
            // opción en `opcion_comida_id` (nunca se lee como índice) y el
            // índice sólo para la configuración anterior sin modelos, en
            // `comida_opcion`. `comida_nombre` sólo sirve para anotar una
            // opción que ya no existe al llegar desde la cola.
            'opcion_comida_id' => 'nullable|integer',
            'comida_opcion' => 'nullable',
            'no_adquirio_alimento' => 'nullable|boolean',
            'comida_nombre' => 'nullable|string|max:120',
            // Evidencia de la app (ver RegistroMarcajeService).
            'uuid_cliente' => 'nullable|uuid',
            'fecha_hora_dispositivo' => 'nullable|date',
            'enviado_desde_cola' => 'nullable|boolean',
            'precision_metros' => 'nullable|numeric|min:0|max:9999999',
            'ubicacion_simulada' => 'nullable|boolean',
            'ubicacion_estado' => 'nullable|string|in:'.implode(',', array_keys(RegistroMarcajeService::ESTADOS_UBICACION)),
            'ubicacion_fecha_hora' => 'nullable|date',
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

        // Reenvío del mismo marcaje (la app no recibió la respuesta y lo mandó
        // otra vez, quizá horas después desde su cola sin conexión), o doble
        // toque: se responde con el ya registrado, sin duplicarlo ni recalcular
        // ni reenviar el WhatsApp.
        $uuid = $validated['uuid_cliente'] ?? null;
        $duplicado = $registro->porUuidCliente($empleado, $uuid)
            ?? $registro->duplicadoReciente($empleado, $validated['tipo_marcaje']);

        if ($duplicado) {
            return $this->respuestaMarcaje($empleado, $duplicado);
        }

        $config = ConfiguracionAsistencia::where('empresa_id', $empleado->empresa_id)->first();
        $desdeCola = (bool) ($validated['enviado_desde_cola'] ?? false);

        $lat = $validated['latitud'] ?? null;
        $lon = $validated['longitud'] ?? null;

        // Lo capturado sin conexión se acepta aunque la regla haya cambiado
        // después: el marcaje ya ocurrió y rechazarlo sólo lo perdería.
        if ($config?->requiere_ubicacion_marcaje && ($lat === null || $lon === null) && ! $desdeCola) {
            return response()->json([
                'success' => false,
                'message' => 'Tu empresa exige la ubicación para registrar el marcaje. Activa el GPS e inténtalo de nuevo.',
            ], 422);
        }

        // Comida antes de guardar la foto, para no dejarla huérfana si se rechaza.
        $comida = null;
        $notaComida = null;
        $noAdquirio = ! empty($validated['no_adquirio_alimento']);
        $opcionId = $validated['opcion_comida_id'] ?? null;
        if ($validated['tipo_marcaje'] === 'salida_comida' && ($noAdquirio || $opcionId !== null || isset($validated['comida_opcion']))) {
            $comida = $opcionId !== null && ! $noAdquirio
                ? $registro->comidaPorId($empleado, $opcionId, incluirInactivas: $desdeCola)
                : $registro->resolverComida($empleado, $validated['comida_opcion'] ?? null, $noAdquirio);

            if (! $comida && ! $desdeCola) {
                return response()->json([
                    'success' => false,
                    'message' => 'El tipo de comida seleccionado ya no existe. Elige otro.',
                ], 422);
            }

            if (! $comida) {
                // Elegida sin conexión y borrada después: el marcaje ya ocurrió,
                // así que se registra sin comida y RH ve qué se eligió.
                $nombre = $validated['comida_nombre'] ?? null;
                $notaComida = 'La comida elegida sin conexión'.($nombre ? " ({$nombre})" : '').' ya no existe.';
            } elseif (! empty($comida['sin_consumo'])) {
                $notaComida = 'El empleado no adquirió alimento de las opciones disponibles';
            }
        }

        [$fechaHora, $notaHora] = $registro->horaDeMarcaje($validated['fecha_hora_dispositivo'] ?? null, $desdeCola);

        // Aplicar redondeo si está configurado en ConfiguracionAsistencia
        if ($config && $config->redondeo_marcaje_minutos > 0) {
            $minutos = $config->redondeo_marcaje_minutos;
            $remainder = $fechaHora->minute % $minutos;

            if ($remainder >= ($minutos / 2)) {
                $fechaHora->addMinutes($minutos - $remainder)->second(0);
            } else {
                $fechaHora->subMinutes($remainder)->second(0);
            }
        }

        // Flutter puede mandarla como data URI; sólo se guarda si es una imagen real.
        $fotoPath = $registro->guardarFoto($validated['fotografia_base64'] ?? null, $empleado->id);

        $geoloc = ($lat && $lon) ? "{$lat}, {$lon}" : null;

        // Lo que RH debe revisar queda en observaciones, que la bitácora ya muestra.
        $estadoUbicacion = $validated['ubicacion_estado'] ?? null;
        $sinUbicacion = RegistroMarcajeService::ESTADOS_UBICACION[$estadoUbicacion] ?? null;
        $observaciones = $registro->anotarObservaciones($validated['observaciones'] ?? null, [
            $notaComida,
            $notaHora,
            ! empty($validated['ubicacion_simulada']) ? 'Ubicación simulada (GPS falso) detectada por la app.' : null,
            $sinUbicacion && $lat === null ? "Sin ubicación: {$sinUbicacion}." : null,
        ]);

        $tz = $fechaHora->getTimezone();

        try {
            $marcaje = AsistenciaMarcaje::create([
                'empresa_id' => $empleado->empresa_id,
                'sucursal_id' => $empleado->sucursal_id,
                'empleado_id' => $empleado->id,
                'tipo_marcaje' => $validated['tipo_marcaje'],
                'fecha_hora' => $fechaHora,
                'origen' => 'app',
                'fotografia_path' => $fotoPath,
                'latitud' => $lat,
                'longitud' => $lon,
                'geolocalizacion' => $geoloc,
                'observaciones' => $observaciones,
                'incidente_causa' => $validated['incidente_causa'] ?? null,
                'duracion_descanso_minutos' => $validated['duracion_descanso_minutos'] ?? null,
                ...$registro->atributosComida($comida),
                'tipo_entrada' => $validated['tipo_entrada'] ?? 'normal',
                'registrado_por_user_id' => $request->user()?->id,
                'uuid_cliente' => $uuid,
                'fecha_hora_dispositivo' => isset($validated['fecha_hora_dispositivo'])
                    ? Carbon::parse($validated['fecha_hora_dispositivo'])->setTimezone($tz)
                    : null,
                'enviado_desde_cola' => $desdeCola,
                'precision_metros' => $validated['precision_metros'] ?? null,
                'ubicacion_simulada' => $validated['ubicacion_simulada'] ?? null,
                'ubicacion_estado' => $estadoUbicacion,
                'ubicacion_fecha_hora' => isset($validated['ubicacion_fecha_hora'])
                    ? Carbon::parse($validated['ubicacion_fecha_hora'])->setTimezone($tz)
                    : null,
            ]);
        } catch (UniqueConstraintViolationException $e) {
            // Dos envíos simultáneos del mismo uuid: ganó el otro.
            if ($fotoPath) {
                Storage::disk('public')->delete($fotoPath);
            }
            $existente = $registro->porUuidCliente($empleado, $uuid);
            if (! $existente) {
                throw $e;
            }

            return $this->respuestaMarcaje($empleado, $existente);
        }

        // Recalcular la asistencia del día del marcaje (puede ser de ayer si
        // llegó tarde desde la cola sin conexión).
        $calculoService->calcularHorasDiarias($empleado, $fechaHora->toDateString());

        // WhatsApp al empleado, fuera de la petición (ver RegistroMarcajeService).
        $registro->notificarEnCola($empleado, $marcaje);

        return $this->respuestaMarcaje($empleado, $marcaje);
    }

    /**
     * Enrolamiento biométrico desde la app, igual que en el kiosko web: dos
     * fotos frontales, sexo y fecha de nacimiento, con el aviso de privacidad
     * aceptado; EmpleadoEnrolamientoService las guarda y sincroniza con
     * BioTime. Una cuenta vinculada a un empleado sólo se enrola a sí misma;
     * enrolar a otros exige los permisos del kiosko web.
     */
    public function enrolar(Request $request, EmpleadoEnrolamientoService $enrolamiento)
    {
        $request->validate(['empleado_id' => 'nullable|integer']);

        $user = $request->user();
        $propioEmpleado = $user->empleado;

        if ($propioEmpleado) {
            if (! $propioEmpleado->status || ! $propioEmpleado->permite_app_movil) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permiso para utilizar la app móvil. Contacta a Recursos Humanos.',
                ], 403);
            }
            $empleado = $propioEmpleado;
        } else {
            if (! $user->canAny(['asistencia.kiosko', 'asistencia.view', 'empleados.edit'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permiso para enrolar a otros empleados.',
                ], 403);
            }

            $empleado = Empleado::where('id', $request->integer('empleado_id'))
                ->when($user->empresa_id, fn ($q) => $q->where('empresa_id', $user->empresa_id))
                ->first();

            if (! $empleado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Empleado no encontrado o no pertenece a tu empresa.',
                ], 404);
            }
        }

        $empleado = $enrolamiento->guardar($empleado, $request->only([
            'aviso_privacidad', 'foto_empleado', 'foto_empleado_2', 'genero', 'fecha_nacimiento',
        ]));

        activity('empleados')
            ->causedBy($user)
            ->performedOn($empleado)
            ->log("Se completó el enrolamiento biométrico de {$empleado->nombre_completo} desde la app móvil.");

        return response()->json([
            'success' => true,
            'message' => 'Enrolamiento completado.',
            'empleado' => [
                'id' => $empleado->id,
                'foto_empleado' => Empleado::urlFoto($empleado->foto_empleado),
                ...$this->datosEnrolamiento($empleado),
            ],
        ]);
    }

    /**
     * Enlace público de enrolamiento (C2 · QR-Link) para que el empleado se
     * enrole desde su propio teléfono: la app lo muestra como QR o lo copia
     * para mandarlo por WhatsApp. Genera uno nuevo cada vez.
     */
    public function generarEnlaceEnrolamiento(Request $request, EmpleadoEnrolamientoService $enrolamiento)
    {
        $request->validate(['empleado_id' => 'required|integer']);

        $user = $request->user();
        $empleado = Empleado::where('id', $request->integer('empleado_id'))
            ->where('status', true)
            ->when($user->empresa_id, fn ($q) => $q->where('empresa_id', $user->empresa_id))
            ->first();

        if (! $empleado) {
            return response()->json([
                'success' => false,
                'message' => 'Empleado no encontrado o no pertenece a tu empresa.',
            ], 404);
        }

        $enlace = $enrolamiento->generarEnlace($empleado);

        activity('empleados')
            ->causedBy($user)
            ->performedOn($empleado)
            ->log("Se generó el enlace de enrolamiento de {$empleado->nombre_completo} desde la app móvil.");

        return response()->json([
            'success' => true,
            'enlace' => $enlace,
            'expira_en' => $empleado->enrolamiento_token_expires_at->toIso8601String(),
        ]);
    }

    /**
     * Lo que muestra la app al abrir un enlace de enrolamiento: el empleado
     * al que pertenece, para la bienvenida y los datos ya capturados.
     */
    public function enlaceEnrolamiento(string $token)
    {
        $empleado = $this->empleadoDelEnlace($token);
        if (! $empleado instanceof Empleado) {
            return $empleado;
        }

        return response()->json([
            'success' => true,
            'empleado' => $this->empleadoParaApp($empleado),
            'expira_en' => $empleado->enrolamiento_token_expires_at?->toIso8601String(),
        ]);
    }

    /**
     * Enrolamiento con el enlace, sin sesión: mismas validaciones que la
     * página pública del web y que enrolar().
     */
    public function enrolarConEnlace(Request $request, string $token, EmpleadoEnrolamientoService $enrolamiento)
    {
        $empleado = $this->empleadoDelEnlace($token);
        if (! $empleado instanceof Empleado) {
            return $empleado;
        }

        $empleado = $enrolamiento->guardar($empleado, $request->only([
            'aviso_privacidad', 'foto_empleado', 'foto_empleado_2', 'genero', 'fecha_nacimiento',
        ]));

        activity('empleados')
            ->performedOn($empleado)
            ->log("Se completó el enrolamiento biométrico de {$empleado->nombre_completo} desde la app móvil con el enlace de enrolamiento.");

        return response()->json([
            'success' => true,
            'message' => 'Enrolamiento completado.',
            'empleado' => [
                'id' => $empleado->id,
                'foto_empleado' => Empleado::urlFoto($empleado->foto_empleado),
                ...$this->datosEnrolamiento($empleado),
            ],
        ]);
    }

    /**
     * Áreas para el alta de un empleado desde la app.
     */
    public function departamentos()
    {
        return response()->json([
            'success' => true,
            'departamentos' => Departamento::where('status', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre']),
        ]);
    }

    /**
     * Alta del empleado que todavía no está en el sistema (B · Sin datos), con
     * lo mínimo para enrolarlo enseguida: número, nombre y área. El número es
     * obligatorio y no puede ser de otro empleado.
     */
    public function altaEmpleado(Request $request)
    {
        $data = $request->validate([
            'numero' => 'required|string|max:50',
            'nombres' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'departamento_id' => 'nullable|integer',
        ], [
            'numero.required' => 'Capture el número de empleado.',
            'nombres.required' => 'Capture el nombre.',
            'apellidos.required' => 'Capture los apellidos.',
        ]);

        $user = $request->user();
        $numero = trim($data['numero']);

        // Sin el scope de empresa: documento_identidad es único en toda la tabla.
        $existe = Empleado::withoutTenant()
            ->where(fn ($q) => $q->where('documento_identidad', $numero)->orWhere('codigo_acceso', $numero))
            ->exists();
        if ($existe) {
            throw ValidationException::withMessages([
                'numero' => 'Ya existe un empleado con ese número. Búsquelo en el kiosko para enrolarlo.',
            ]);
        }

        // El scope de empresa deja fuera las áreas ajenas.
        if (! empty($data['departamento_id']) && ! Departamento::whereKey($data['departamento_id'])->exists()) {
            throw ValidationException::withMessages(['departamento_id' => 'El área no es válida.']);
        }

        $empleado = AccessCodeService::createWithRetry(fn () => Empleado::create([
            'nombres' => trim($data['nombres']),
            'apellidos' => trim($data['apellidos']),
            'documento_identidad' => $numero,
            'departamento_id' => $data['departamento_id'] ?? null,
            'empresa_id' => $user->empresa_id,
            'sucursal_id' => $user->sucursal_id,
            'status' => true,
        ]));

        activity('empleados')
            ->causedBy($user)
            ->performedOn($empleado)
            ->log("Se dio de alta a {$empleado->nombre_completo} desde la app móvil para enrolarlo.");

        return response()->json([
            'success' => true,
            'message' => 'Empleado dado de alta.',
            'empleado' => $this->empleadoParaApp($empleado->fresh()),
        ], 201);
    }

    /**
     * Empleado activo dueño del token, o la respuesta de error si el enlace
     * no existe o ya venció.
     */
    private function empleadoDelEnlace(string $token): Empleado|JsonResponse
    {
        $empleado = Empleado::withoutTenant()
            ->where('enrolamiento_token', $token)
            ->where('status', true)
            ->first();

        if (! $empleado) {
            return response()->json([
                'success' => false,
                'message' => 'El enlace de enrolamiento no existe o ya no es válido.',
            ], 404);
        }

        if ($empleado->enrolamiento_token_expires_at?->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Este enlace de enrolamiento ha expirado. Solicite uno nuevo a Recursos Humanos.',
            ], 410);
        }

        return $empleado;
    }

    /**
     * El empleado con la forma de buscar(), sin el último marcaje.
     */
    private function empleadoParaApp(Empleado $empleado): array
    {
        $empleado->loadMissing(['turnoLaboral', 'departamento', 'cargo', 'empresa']);

        return [
            'id' => $empleado->id,
            'nombre_completo' => $empleado->nombre_completo,
            'documento_identidad' => $empleado->documento_identidad,
            'codigo_acceso' => $empleado->codigo_acceso,
            'numero_empleado' => $empleado->codigo_acceso,
            'departamento' => $empleado->departamento?->nombre,
            'cargo' => $empleado->cargo?->nombre,
            'turno' => $empleado->turnoLaboral?->nombre ?? 'Sin turno asignado',
            'foto_empleado' => Empleado::urlFoto($empleado->foto_empleado),
            ...$this->datosEnrolamiento($empleado),
        ];
    }

    /**
     * Lo que el kiosko web muestra sobre el enrolamiento biométrico: para
     * avisar a quien falta y precargar los datos ya capturados.
     */
    private function datosEnrolamiento(Empleado $empleado): array
    {
        return [
            'nombres' => $empleado->nombres,
            'enrolado' => ! empty($empleado->enrolado_en),
            'enrolado_en' => $empleado->enrolado_en?->toIso8601String(),
            'genero' => $empleado->genero,
            'fecha_nacimiento' => $empleado->fecha_nacimiento?->format('Y-m-d'),
            'empresa_nombre' => $empleado->empresa?->razon_social ?? $empleado->empresa?->nombre_comercial,
        ];
    }

    private function respuestaMarcaje(Empleado $empleado, AsistenciaMarcaje $marcaje)
    {
        return response()->json([
            'success' => true,
            'message' => 'Marcaje registrado con éxito.',
            'empleado_nombre' => $empleado->nombre_completo,
            'marcaje' => [
                'tipo_marcaje' => $marcaje->tipo_marcaje,
                'hora' => Carbon::parse($marcaje->fecha_hora_local)->format('H:i:s'),
                'fecha' => Carbon::parse($marcaje->fecha_hora_local)->format('d/m/Y'),
                'comida_tipo' => $marcaje->comida_tipo,
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
            ->with(['sucursal:id,zona_horaria', 'empresa:id,zona_horaria'])
            ->get()
            ->map(fn (AsistenciaMarcaje $m) => [
                'tipo' => $m->tipo_marcaje,
                // En la zona de la planta del marcaje, como los reportes web.
                'fecha' => Carbon::parse($m->fecha_hora_local)->format('d/m/Y'),
                'hora' => Carbon::parse($m->fecha_hora_local)->format('H:i:s'),
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
