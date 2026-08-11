<?php

namespace App\Services;

use App\Models\AsistenciaMarcaje;
use App\Models\AsistenciaResumenDiario;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Pais;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class NotificacionAsistenciaWhatsAppService
{
    /**
     * Envia notificación por WhatsApp según el tipo de marcaje registrado.
     */
    public function notificarMarcaje(Empleado $empleado, AsistenciaMarcaje $marcaje): bool
    {
        if (empty($empleado->telefono)) {
            return false;
        }

        try {
            $empresa = Empresa::find($empleado->empresa_id) ?: Empresa::first();
            $cleanPhone = preg_replace('/[^0-9]/', '', $empleado->telefono);
            if (strlen($cleanPhone) < 8) {
                return false;
            }

            $pais = $empleado->paisTelefono ?: Pais::find($empleado->pais_telefono_id);
            $prefix = $pais ? preg_replace('/[^0-9]/', '', $pais->codigo_telefonico) : '52';
            $fullPhone = $prefix . $cleanPhone;

            $horaFormatted = Carbon::parse($marcaje->fecha_hora)->format('H:i');
            $fechaFormatted = Carbon::parse($marcaje->fecha_hora)->format('d/m/Y');
            $origenNombre = ucfirst($marcaje->origen ?? 'kiosko');

            $ws = new WhatsAppService($empresa);

            switch ($marcaje->tipo_marcaje) {
                case 'entrada':
                    $mensaje = "🟢 *¡HOLA " . mb_strtoupper($empleado->nombres) . "!*\n\n";
                    $mensaje .= "Se ha registrado tu *Entrada* a las *{$horaFormatted} hrs* el día {$fechaFormatted} (Vía {$origenNombre}).\n\n";

                    // Obtener resumen diario para verificar si hubo retardo
                    $resumen = AsistenciaResumenDiario::where('empleado_id', $empleado->id)
                        ->where('fecha', Carbon::parse($marcaje->fecha_hora)->toDateString())
                        ->first();

                    if ($resumen && $resumen->estatus_asistencia === 'retardo') {
                        $minutos = round($resumen->minutos_retardo ?? 0);
                        $mensaje .= "⚠️ *Atención:* Tu entrada registró un retardo de *{$minutos} min*.\n\n";
                    }

                    $turnoNombre = $empleado->turnoLaboral?->nombre ?? 'Jornada Regular';
                    $mensaje .= "📋 *Turno:* {$turnoNombre}\n\n";
                    $mensaje .= "¡Te deseamos una excelente y productiva jornada laboral!";
                    break;

                case 'salida_comida':
                    $minutosDescanso = $empleado->turnoLaboral?->minutos_descanso ?? 30;
                    $horaRegreso = Carbon::parse($marcaje->fecha_hora)->addMinutes($minutosDescanso)->format('H:i');

                    $mensaje = "🍴 *¡TIEMPO DE ALMUERZO / DESCANSO!*\n\n";
                    $mensaje .= "Hola *{$empleado->nombres}*,\n";
                    $mensaje .= "Tu tiempo de descanso de *{$minutosDescanso} minutos* ha iniciado a las *{$horaFormatted} hrs*.\n\n";
                    $mensaje .= "⏰ *Hora límite de regreso:* *{$horaRegreso} hrs*.\n\n";
                    $mensaje .= "Recuerda registrar tu regreso en el Reloj Checador o Garita antes de tu hora límite. ¡Buen provecho!";
                    break;

                case 'entrada_comida':
                    $mensaje = "🟢 *¡REGRESO DE ALMUERZO REGISTRADO!*\n\n";
                    $mensaje .= "Hola *{$empleado->nombres}*,\n";
                    $mensaje .= "Se ha registrado tu *Regreso de Comida* a las *{$horaFormatted} hrs*.\n\n";
                    $mensaje .= "¡Bienvenido(a) de vuelta a tus actividades!";
                    break;

                case 'salida':
                    $mensaje = "🔴 *¡FIN DE JORNADA LABORAL!*\n\n";
                    $mensaje .= "Hola *{$empleado->nombres}*,\n";
                    $mensaje .= "Se ha registrado tu *Salida Final* a las *{$horaFormatted} hrs* el día {$fechaFormatted}.\n\n";

                    $resumen = AsistenciaResumenDiario::where('empleado_id', $empleado->id)
                        ->where('fecha', Carbon::parse($marcaje->fecha_hora)->toDateString())
                        ->first();

                    if ($resumen) {
                        $hOrd = number_format($resumen->horas_ordinarias, 1);
                        $hDob = number_format($resumen->horas_extra_dobles, 1);
                        $hTri = number_format($resumen->horas_extra_triples, 1);

                        $mensaje .= "📊 *Resumen del día:*\n";
                        $mensaje .= "• Horas Ordinarias: *{$hOrd}h*\n";
                        if ($hDob > 0) $mensaje .= "• Horas Extra Dobles: *{$hDob}h*\n";
                        if ($hTri > 0) $mensaje .= "• Horas Extra Triples: *{$hTri}h*\n";
                        $mensaje .= "\n";
                    }

                    $mensaje .= "¡Muchas gracias por tu esfuerzo de hoy! Que tengas un excelente descanso.";
                    break;

                default:
                    return false;
            }

            $ws->sendMessage($fullPhone, $mensaje, true);
            return true;
        } catch (\Exception $e) {
            Log::error("Error enviando notificación WhatsApp de asistencia para empleado ID {$empleado->id}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Envia alerta por WhatsApp cuando un empleado sobrepasa el tiempo de descanso.
     */
    public function notificarExcesoDescanso(Empleado $empleado, AsistenciaMarcaje $marcajeSalidaComida, int $minutosExcedidos): bool
    {
        if (empty($empleado->telefono)) {
            return false;
        }

        try {
            $empresa = Empresa::find($empleado->empresa_id) ?: Empresa::first();
            $cleanPhone = preg_replace('/[^0-9]/', '', $empleado->telefono);
            if (strlen($cleanPhone) < 8) {
                return false;
            }

            $pais = $empleado->paisTelefono ?: Pais::find($empleado->pais_telefono_id);
            $prefix = $pais ? preg_replace('/[^0-9]/', '', $pais->codigo_telefonico) : '52';
            $fullPhone = $prefix . $cleanPhone;

            $horaSalida = Carbon::parse($marcajeSalidaComida->fecha_hora)->format('H:i');

            $mensaje = "⚠️ *ALERTA DE DESCANSO EXCEDIDO*\n\n";
            $mensaje .= "Estimado(a) *{$empleado->nombres}*,\n";
            $mensaje .= "Iniciaste tu descanso a las *{$horaSalida} hrs* y has excedido el tiempo asignado por *{$minutosExcedidos} minutos*.\n\n";
            $mensaje .= "Por favor acude a registrar tu regreso inmediatamente en el Kiosko o Garita.";

            $ws = new WhatsAppService($empresa);
            $ws->sendMessage($fullPhone, $mensaje, true);
            return true;
        } catch (\Exception $e) {
            Log::error("Error enviando alerta exceso descanso a empleado ID {$empleado->id}: " . $e->getMessage());
            return false;
        }
    }
}
