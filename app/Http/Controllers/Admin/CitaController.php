<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cita;
use App\Models\Especialidad;
use App\Models\Medico;
use App\Models\Paciente;
use App\Models\Sucursal;
use App\Models\TipoAtencion;
use App\Services\CitaService;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CitaController extends Controller
{
    protected CitaService $citaService;
    protected WhatsAppService $whatsAppService;

    public function __construct(CitaService $citaService, WhatsAppService $whatsAppService)
    {
        $this->citaService = $citaService;
        $this->whatsAppService = $whatsAppService;
    }

    public function index(Request $request)
    {
        $query = Cita::with(['paciente', 'medico', 'especialidad', 'tipoAtencion', 'sucursal']);

        // Filtros de fecha para calendario y tabla
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('fecha_hora_inicio', [
                Carbon::parse($request->start_date)->startOfDay(),
                Carbon::parse($request->end_date)->endOfDay(),
            ]);
        } elseif ($request->filled('fecha')) {
            $query->whereDate('fecha_hora_inicio', $request->fecha);
        }

        if ($request->filled('medico_id') && $request->medico_id !== 'all') {
            $query->where('medico_id', $request->medico_id);
        }

        if ($request->filled('especialidad_id') && $request->especialidad_id !== 'all') {
            $query->where('especialidad_id', $request->especialidad_id);
        }

        if ($request->filled('tipo_atencion_id') && $request->tipo_atencion_id !== 'all') {
            $query->where('tipo_atencion_id', $request->tipo_atencion_id);
        }

        if ($request->filled('estado') && $request->estado !== 'all') {
            $query->where('estado', $request->estado);
        }


        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('codigo_cita', 'like', "%{$search}%")
                  ->orWhereHas('paciente', function ($qp) use ($search) {
                      $qp->where('nombres', 'like', "%{$search}%")
                         ->orWhere('apellidos', 'like', "%{$search}%")
                         ->orWhere('documento_identidad', 'like', "%{$search}%")
                         ->orWhere('nombre_mascota', 'like', "%{$search}%");
                  })
                  ->orWhereHas('medico', function ($qm) use ($search) {
                      $qm->where('nombres', 'like', "%{$search}%")
                         ->orWhere('apellidos', 'like', "%{$search}%");
                  });
            });
        }

        $citas = $query->orderBy('fecha_hora_inicio', 'asc')->get();

        // Formatear eventos de calendario para FullCalendar
        $eventosCalendario = $citas->map(function ($cita) {
            $nombrePaciente = $cita->paciente
                ? ($cita->paciente->tipo_paciente === 'animal'
                    ? "🐾 {$cita->paciente->nombre_mascota} ({$cita->paciente->tutor_nombre})"
                    : "👤 {$cita->paciente->nombres} {$cita->paciente->apellidos}")
                : 'Paciente N/A';

            $nombreMedico = $cita->medico
                ? "Dr(a). {$cita->medico->nombres} {$cita->medico->apellidos}"
                : 'Médico N/A';

            return [
                'id' => (string) $cita->id,
                'title' => "{$nombrePaciente} - {$nombreMedico}",
                'start' => $cita->fecha_hora_inicio->toIso8601String(),
                'end' => $cita->fecha_hora_fin->toIso8601String(),
                'backgroundColor' => $cita->color_estado,
                'borderColor' => $cita->color_estado,
                'textColor' => '#ffffff',
                'extendedProps' => [
                    'cita' => $cita,
                    'codigo_cita' => $cita->codigo_cita,
                    'estado' => $cita->estado,
                    'estado_formateado' => $cita->estado_formateado,
                    'paciente_id' => $cita->paciente_id,
                    'paciente_nombre' => $nombrePaciente,
                    'paciente_tipo' => $cita->paciente->tipo_paciente ?? 'humano',
                    'paciente_telefono' => $cita->paciente->telefono ?? $cita->paciente->tutor_telefono ?? '',
                    'medico_id' => $cita->medico_id,
                    'medico_nombre' => $nombreMedico,
                    'especialidad_id' => $cita->especialidad_id,
                    'especialidad' => $cita->especialidad->nombre ?? '',
                    'tipo_atencion_id' => $cita->tipo_atencion_id,
                    'tipo_atencion' => $cita->tipoAtencion->nombre ?? '',
                    'modalidad' => $cita->tipoAtencion->modalidad ?? 'presencial',
                    'duracion_minutos' => $cita->duracion_minutos,
                    'link_virtual' => $cita->link_virtual,
                    'motivo_consulta' => $cita->motivo_consulta,
                    'monto_estimado' => $cita->monto_estimado,
                    'recordatorio_enviado' => $cita->recordatorio_whatsapp_enviado,
                ],
            ];
        });

        // Estadísticas rápidas del día
        $hoy = Carbon::today();
        $estadisticas = [
            'citas_hoy' => Cita::whereDate('fecha_hora_inicio', $hoy)->count(),
            'confirmadas' => Cita::whereDate('fecha_hora_inicio', $hoy)->where('estado', 'confirmada_pagada')->count(),
            'en_sala_espera' => Cita::whereDate('fecha_hora_inicio', $hoy)->where('estado', 'en_sala_espera')->count(),
            'en_consulta' => Cita::whereDate('fecha_hora_inicio', $hoy)->where('estado', 'en_consulta')->count(),
            'atendidas' => Cita::whereDate('fecha_hora_inicio', $hoy)->where('estado', 'atendida')->count(),
            'canceladas' => Cita::whereDate('fecha_hora_inicio', $hoy)->where('estado', 'cancelada')->count(),
        ];

        return Inertia::render('admin/Citas/Index', [
            'citas' => $citas,
            'eventosCalendario' => $eventosCalendario,
            'medicos' => Medico::select('id', 'nombres', 'apellidos', 'codigo_medico', 'color_agenda', 'especialidad_principal_id')->where('status', true)->get(),
            'pacientes' => Paciente::select('id', 'codigo_paciente', 'nombres', 'apellidos', 'tipo_paciente', 'nombre_mascota', 'tutor_nombre', 'telefono', 'tutor_telefono')->where('status', true)->get(),
            'especialidades' => Especialidad::select('id', 'nombre')->where('status', true)->get(),
            'tiposAtencion' => TipoAtencion::select('id', 'nombre', 'duracion_estimada_minutos', 'requiere_link_virtual', 'costo_adicional_sugerido', 'modalidad')->where('status', true)->get(),
            'sucursales' => Sucursal::select('id', 'nombre')->get(),
            'estadisticas' => $estadisticas,
            'filters' => $request->only(['search', 'fecha', 'medico_id', 'especialidad_id', 'tipo_atencion_id', 'estado']),
        ]);
    }

    public function getSlots(Request $request)
    {
        $request->validate([
            'medico_id' => 'required|exists:medicos,id',
            'fecha' => 'required|date_format:Y-m-d',
            'duracion_minutos' => 'nullable|integer|min:5|max:240',
        ]);

        $duracion = (int) ($request->duracion_minutos ?? 30);
        $slots = $this->citaService->obtenerSlotsDisponibles(
            (int) $request->medico_id,
            $request->fecha,
            $duracion
        );

        return response()->json(['slots' => $slots]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'paciente_id' => 'required|exists:pacientes,id',
            'medico_id' => 'required|exists:medicos,id',
            'especialidad_id' => 'nullable|exists:especialidades,id',
            'tipo_atencion_id' => 'required|exists:tipos_atencion,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
            'fecha_hora_inicio' => 'required|date',
            'duracion_minutos' => 'nullable|integer|min:5',
            'motivo_consulta' => 'nullable|string|max:1000',
            'notas_recepcion' => 'nullable|string|max:1000',
            'monto_estimado' => 'nullable|numeric|min:0',
        ]);

        $tipoAtencion = TipoAtencion::findOrFail($validated['tipo_atencion_id']);
        $duracion = $validated['duracion_minutos'] ?? $tipoAtencion->duracion_estimada_minutos ?? 30;

        $inicio = Carbon::parse($validated['fecha_hora_inicio']);
        $fin = $inicio->copy()->addMinutes($duracion);

        // 1. Validar Anticipación Mínima (2 horas)
        $this->citaService->validarAnticipacionMinima($inicio);

        // 2. Validar Overbooking / Solapamiento
        $this->citaService->validarOverbooking((int) $validated['medico_id'], $inicio, $fin);

        // 3. Generar enlace virtual si corresponde
        $linkVirtual = $this->citaService->generarLinkVirtual($tipoAtencion);

        $cita = Cita::create([
            'paciente_id' => $validated['paciente_id'],
            'medico_id' => $validated['medico_id'],
            'especialidad_id' => $validated['especialidad_id'] ?? null,
            'tipo_atencion_id' => $validated['tipo_atencion_id'],
            'sucursal_id' => $validated['sucursal_id'] ?? null,
            'fecha_hora_inicio' => $inicio,
            'fecha_hora_fin' => $fin,
            'duracion_minutos' => $duracion,
            'buffer_descanso_minutos' => 10,
            'estado' => 'pendiente',
            'motivo_consulta' => $validated['motivo_consulta'] ?? null,
            'notas_recepcion' => $validated['notas_recepcion'] ?? null,
            'link_virtual' => $linkVirtual,
            'monto_estimado' => $validated['monto_estimado'] ?? $tipoAtencion->costo_adicional_sugerido ?? 0.00,
            'created_by' => Auth::id(),
        ]);

        // Enviar notificaciones WhatsApp automáticas al Paciente y al Doctor
        $this->enviarNotificacionesWhatsAppNuevaCita($cita);

        return back()->with('success', 'Cita médica registrada con éxito. Código: ' . $cita->codigo_cita);
    }

    public function update(Request $request, Cita $cita)
    {
        $validated = $request->validate([
            'paciente_id' => 'required|exists:pacientes,id',
            'medico_id' => 'required|exists:medicos,id',
            'especialidad_id' => 'nullable|exists:especialidades,id',
            'tipo_atencion_id' => 'required|exists:tipos_atencion,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
            'fecha_hora_inicio' => 'required|date',
            'duracion_minutos' => 'nullable|integer|min:5',
            'motivo_consulta' => 'nullable|string|max:1000',
            'notas_recepcion' => 'nullable|string|max:1000',
            'monto_estimado' => 'nullable|numeric|min:0',
        ]);

        $inicioNuevo = Carbon::parse($validated['fecha_hora_inicio']);
        $duracion = $validated['duracion_minutos'] ?? $cita->duracion_minutos;
        $finNuevo = $inicioNuevo->copy()->addMinutes($duracion);

        // Si se cambia la fecha u hora, verificar regla de cancelación/reagendamiento <24h y overbooking
        if (!$cita->fecha_hora_inicio->eq($inicioNuevo)) {
            $this->citaService->validarLimiteCancelacion($cita);
            $this->citaService->validarOverbooking((int) $validated['medico_id'], $inicioNuevo, $finNuevo, $cita->id);
        }

        $cita->update([
            'paciente_id' => $validated['paciente_id'],
            'medico_id' => $validated['medico_id'],
            'especialidad_id' => $validated['especialidad_id'] ?? null,
            'tipo_atencion_id' => $validated['tipo_atencion_id'],
            'sucursal_id' => $validated['sucursal_id'] ?? null,
            'fecha_hora_inicio' => $inicioNuevo,
            'fecha_hora_fin' => $finNuevo,
            'duracion_minutos' => $duracion,
            'motivo_consulta' => $validated['motivo_consulta'] ?? null,
            'notas_recepcion' => $validated['notas_recepcion'] ?? null,
            'monto_estimado' => $validated['monto_estimado'] ?? $cita->monto_estimado,
        ]);

        return back()->with('success', 'Cita médica actualizada correctamente.');
    }

    public function move(Request $request, Cita $cita)
    {
        $validated = $request->validate([
            'fecha_hora_inicio' => 'required|date',
            'fecha_hora_fin' => 'required|date|after:fecha_hora_inicio',
        ]);

        $inicioNuevo = Carbon::parse($validated['fecha_hora_inicio']);
        $finNuevo = Carbon::parse($validated['fecha_hora_fin']);
        $duracion = (int) $inicioNuevo->diffInMinutes($finNuevo);

        if ($duracion < 5) {
            $duracion = 5;
            $finNuevo = $inicioNuevo->copy()->addMinutes(5);
        }

        // Si cambia la hora de inicio, verificar límite de cancelación y overbooking
        if (!$cita->fecha_hora_inicio->eq($inicioNuevo)) {
            $this->citaService->validarLimiteCancelacion($cita);
            $this->citaService->validarOverbooking((int) $cita->medico_id, $inicioNuevo, $finNuevo, $cita->id);
        }

        $cita->update([
            'fecha_hora_inicio' => $inicioNuevo,
            'fecha_hora_fin' => $finNuevo,
            'duracion_minutos' => $duracion,
        ]);

        return back()->with('success', 'Horario de cita reprogramado exitosamente.');
    }

    public function updateEstado(Request $request, Cita $cita)
    {
        $validated = $request->validate([
            'estado' => 'required|in:pendiente,confirmada_pagada,en_sala_espera,en_consulta,atendida,cancelada,no_asistio',
            'motivo_cancelacion' => 'required_if:estado,cancelada|nullable|string|max:500',
        ]);

        $nuevoEstado = $validated['estado'];

        // Si se intenta cancelar, verificar límite de 24h
        if ($nuevoEstado === 'cancelada' && $cita->estado !== 'cancelada') {
            $this->citaService->validarLimiteCancelacion($cita);
            $cita->motivo_cancelacion = $validated['motivo_cancelacion'] ?? 'Cancelada por el usuario';
            $cita->cancelado_por_user_id = Auth::id();
        }

        // Trazabilidad de tiempos clínicos
        if ($nuevoEstado === 'confirmada_pagada' && !$cita->fecha_confirmacion) {
            $cita->fecha_confirmacion = now();
            $cita->estado_pago = 'pagado';
            $cita->monto_pagado = $cita->monto_estimado;
        }

        if ($nuevoEstado === 'en_sala_espera') {
            if (!$cita->fecha_llegada_sala_espera) {
                $cita->fecha_llegada_sala_espera = now();
            }
            // Iniciar ciclo de vida de la Consulta Médica en 'sala_de_espera'
            \App\Models\ConsultaMedica::firstOrCreate(
                ['cita_id' => $cita->id],
                [
                    'empresa_id' => $cita->empresa_id,
                    'paciente_id' => $cita->paciente_id,
                    'medico_id' => $cita->medico_id,
                    'especialidad_id' => $cita->especialidad_id,
                    'motivo_consulta' => $cita->motivo_consulta,
                    'estado' => 'sala_de_espera',
                ]
            );
        }

        if ($nuevoEstado === 'en_consulta') {
            if (!$cita->fecha_inicio_consulta) {
                $cita->fecha_inicio_consulta = now();
            }
            $consulta = \App\Models\ConsultaMedica::firstOrCreate(
                ['cita_id' => $cita->id],
                [
                    'empresa_id' => $cita->empresa_id,
                    'paciente_id' => $cita->paciente_id,
                    'medico_id' => $cita->medico_id,
                    'especialidad_id' => $cita->especialidad_id,
                    'motivo_consulta' => $cita->motivo_consulta,
                    'estado' => 'en_consultorio',
                ]
            );
            $consulta->update(['estado' => 'en_consultorio']);
        }

        if ($nuevoEstado === 'atendida') {
            if (!$cita->fecha_fin_consulta) {
                $cita->fecha_fin_consulta = now();
            }
            $consulta = \App\Models\ConsultaMedica::where('cita_id', $cita->id)->first();
            if ($consulta) {
                $consulta->update(['estado' => 'finalizada', 'finalizada_at' => now()]);
            }
        }

        $cita->estado = $nuevoEstado;
        $cita->save();

        return back()->with('success', 'Estado de la cita cambiado a: ' . $cita->estado_formateado);
    }


    public function destroy(Cita $cita)
    {
        $this->citaService->validarLimiteCancelacion($cita);
        $cita->delete();

        return back()->with('success', 'Registro de cita eliminado.');
    }

    public function sendWhatsAppRecordatorio(Cita $cita)
    {
        $paciente = $cita->paciente;
        $medico = $cita->medico;

        $telefono = $paciente->telefono ?? $paciente->tutor_telefono;
        if (!$telefono) {
            return back()->with('error', 'El paciente no tiene un número de teléfono registrado.');
        }

        $fechaFormateada = $cita->fecha_hora_inicio->format('d/m/Y h:i A');
        $mensaje = "🗓️ *RECORDATORIO DE CITA MÉDICA - SISMED*\n\n"
            . "Hola *{$paciente->nombres}*,\n"
            . "Le recordamos su próxima consulta médica:\n\n"
            . "📌 *Código:* {$cita->codigo_cita}\n"
            . "👨‍⚕️ *Médico:* Dr(a). {$medico->nombres} {$medico->apellidos}\n"
            . "🩺 *Tipo de Atención:* " . ($cita->tipoAtencion->nombre ?? 'Consulta') . "\n"
            . "⏰ *Fecha y Hora:* {$fechaFormateada}\n\n";

        if ($cita->link_virtual) {
            $mensaje .= "💻 *Enlace Virtual:* {$cita->link_virtual}\n\n";
        }

        $mensaje .= "Por favor confirme su asistencia respondiendo a este mensaje. ¡Le esperamos!";

        $this->whatsAppService->sendMessage($telefono, $mensaje);

        $cita->update([
            'recordatorio_whatsapp_enviado' => true,
            'fecha_envio_recordatorio' => now(),
        ]);

        return back()->with('success', 'Recordatorio de cita enviado exitosamente vía WhatsApp.');
    }

    /**
     * Envía notificaciones de confirmación de cita por WhatsApp al Paciente y al Médico Tratante.
     */
    private function enviarNotificacionesWhatsAppNuevaCita(Cita $cita): void
    {
        try {
            $cita->loadMissing(['paciente', 'medico', 'especialidad', 'tipoAtencion']);

            $paciente = $cita->paciente;
            $medico = $cita->medico;
            $fechaFormateada = Carbon::parse($cita->fecha_hora_inicio)->format('d/m/Y h:i A');

            // 1. Notificación al Paciente / Tutor
            $telefonoPaciente = $paciente->telefono ?? $paciente->tutor_telefono;
            if (!empty($telefonoPaciente)) {
                $nombrePaciente = $paciente->tipo_paciente === 'animal'
                    ? "🐾 {$paciente->nombre_mascota}"
                    : "{$paciente->nombres}";

                $mensajePaciente = "🗓️ *CONFIRMACIÓN DE CITA MÉDICA - SISMED*\n\n"
                    . "Hola *{$nombrePaciente}*,\n"
                    . "Su cita médica ha sido agendada con éxito.\n\n"
                    . "📌 *Código de Cita:* {$cita->codigo_cita}\n"
                    . "👨‍⚕️ *Médico:* Dr(a). {$medico->nombres} {$medico->apellidos}\n"
                    . "🩺 *Especialidad:* " . ($cita->especialidad->nombre ?? 'Medicina General') . "\n"
                    . "📋 *Atención:* " . ($cita->tipoAtencion->nombre ?? 'Consulta Médica') . "\n"
                    . "⏰ *Fecha y Hora:* {$fechaFormateada}\n";

                if (!empty($cita->link_virtual)) {
                    $mensajePaciente .= "💻 *Enlace Virtual:* {$cita->link_virtual}\n";
                }

                $mensajePaciente .= "\n¡Gracias por su confianza!";

                $this->whatsAppService->sendMessage($telefonoPaciente, $mensajePaciente);

                $cita->update([
                    'recordatorio_whatsapp_enviado' => true,
                    'fecha_envio_recordatorio' => now(),
                ]);
            }

            // 2. Notificación al Doctor / Médico Tratante
            $telefonoDoctor = $medico->telefono ?? $medico->telefono_whatsapp;
            if (!empty($telefonoDoctor)) {
                $infoPaciente = $paciente->tipo_paciente === 'animal'
                    ? "🐾 {$paciente->nombre_mascota} (Tutor: {$paciente->tutor_nombre})"
                    : "{$paciente->nombres} {$paciente->apellidos}";

                $mensajeDoctor = "🩺 *NUEVA CITA AGENDADA EN SU AGENDA*\n\n"
                    . "Estimado(a) *Dr(a). {$medico->nombres} {$medico->apellidos}*,\n"
                    . "Se ha registrado una nueva cita médica en su agenda:\n\n"
                    . "📌 *Código:* {$cita->codigo_cita}\n"
                    . "👤 *Paciente:* {$infoPaciente}\n"
                    . "📱 *Teléfono Paciente:* " . ($telefonoPaciente ?? 'No registrado') . "\n"
                    . "📋 *Atención:* " . ($cita->tipoAtencion->nombre ?? 'Consulta Médica') . "\n"
                    . "⏰ *Fecha y Hora:* {$fechaFormateada}\n";

                if (!empty($cita->motivo_consulta)) {
                    $mensajeDoctor .= "📝 *Motivo:* {$cita->motivo_consulta}\n";
                }

                if (!empty($cita->link_virtual)) {
                    $mensajeDoctor .= "💻 *Enlace Virtual:* {$cita->link_virtual}\n";
                }

                $mensajeDoctor .= "\nPor favor revise su agenda en el sistema SISMED.";

                $this->whatsAppService->sendMessage($telefonoDoctor, $mensajeDoctor);
            }
        } catch (\Exception $e) {
            Log::error('Error enviando notificaciones de creación de cita por WhatsApp: ' . $e->getMessage());
        }
    }
}
