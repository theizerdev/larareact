<?php

namespace App\Console\Commands;

use App\Models\AsistenciaMarcaje;
use App\Models\Empleado;
use App\Services\NotificacionAsistenciaWhatsAppService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class VerificarDescansosAsistencia extends Command
{
    /**
     * El nombre y firma del comando de consola.
     */
    protected $signature = 'asistencia:verificar-descansos';

    /**
     * Descripción del comando.
     */
    protected $description = 'Verifica el tiempo de descanso de los empleados y notifica por WhatsApp si han excedido su límite.';

    /**
     * Ejecuta el comando de consola.
     */
    public function handle(NotificacionAsistenciaWhatsAppService $notifService): int
    {
        $today = Carbon::today();
        $now = Carbon::now();

        // Buscar todos los marcajes de salida_comida de hoy
        $salidasComida = AsistenciaMarcaje::with(['empleado.turnoLaboral', 'empleado.paisTelefono'])
            ->whereDate('fecha_hora', $today)
            ->where('tipo_marcaje', 'salida_comida')
            ->get();

        $alertados = 0;

        foreach ($salidasComida as $marcajeSalida) {
            $empleado = $marcajeSalida->empleado;
            if (!$empleado || !$empleado->status) {
                continue;
            }

            // Verificar si el empleado ya registró entrada_comida o salida posterior a este marcaje
            $marcajePosterior = AsistenciaMarcaje::where('empleado_id', $empleado->id)
                ->whereDate('fecha_hora', $today)
                ->where('id', '>', $marcajeSalida->id)
                ->whereIn('tipo_marcaje', ['entrada_comida', 'salida'])
                ->exists();

            if ($marcajePosterior) {
                continue; // El empleado ya regresó o terminó su jornada
            }

            // Calcular minutos transcurridos
            $minutosTranscurridos = Carbon::parse($marcajeSalida->fecha_hora)->diffInMinutes($now);
            $minutosDescansoPermitidos = $empleado->turnoLaboral?->minutos_descanso ?? 30;

            // Si ha excedido por más de 5 minutos el tiempo permitido
            if ($minutosTranscurridos > ($minutosDescansoPermitidos + 5)) {
                $minutosExcedidos = $minutosTranscurridos - $minutosDescansoPermitidos;

                // Evitar notificar múltiples veces agregando una bandera temporal o verificando logs
                $enviado = $notifService->notificarExcesoDescanso($empleado, $marcajeSalida, $minutosExcedidos);
                if ($enviado) {
                    $alertados++;
                }
            }
        }

        $this->info("Verificación de descansos completada. Notificaciones enviadas: {$alertados}");
        return Command::SUCCESS;
    }
}
