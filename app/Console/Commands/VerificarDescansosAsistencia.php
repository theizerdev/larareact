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
        $now   = Carbon::now();

        // Buscar todos los marcajes de salida_comida de hoy
        $salidasComida = AsistenciaMarcaje::with(['empleado.turnoLaboral', 'empleado.paisTelefono'])
            ->whereDate('fecha_hora', $today)
            ->where('tipo_marcaje', 'salida_comida')
            ->get();

        $alertados = 0;

        foreach ($salidasComida as $marcajeSalida) {
            $empleado = $marcajeSalida->empleado;
            if (! $empleado || ! $empleado->status) {
                continue;
            }

            // Verificar si el empleado ya registró su regreso DESPUÉS de esta salida_comida.
            // Comparamos por fecha_hora (más confiable que por ID) e incluimos
            // todos los tipos que significan "ya regresó o terminó".
            $yaRegreso = AsistenciaMarcaje::where('empleado_id', $empleado->id)
                ->where('fecha_hora', '>', $marcajeSalida->fecha_hora)
                ->whereDate('fecha_hora', $today)
                ->whereIn('tipo_marcaje', [
                    'entrada_comida',        // Regreso estándar del descanso
                    'descanso_fin',          // Fin de descanso genérico
                    'salida',                // Ya terminó su jornada
                    'entrada_extraordinaria',
                ])
                ->exists();

            if ($yaRegreso) {
                continue; // El empleado ya regresó, no notificar
            }

            // Calcular minutos transcurridos desde salida_comida
            $minutosTranscurridos      = Carbon::parse($marcajeSalida->fecha_hora)->diffInMinutes($now);
            $minutosDescansoPermitidos = $empleado->turnoLaboral?->minutos_descanso ?? 30;

            // Solo actuar si excedió por más de 5 minutos de margen
            if ($minutosTranscurridos <= ($minutosDescansoPermitidos + 5)) {
                continue;
            }

            $minutosExcedidos = $minutosTranscurridos - $minutosDescansoPermitidos;

            // ── Deduplicación ────────────────────────────────────────────────
            // La clave incluye el ID del marcaje para que sea específica por evento.
            // Una vez notificado, no se vuelve a enviar hasta el día siguiente.
            $cacheKey = "alerta_descanso_excedido_{$marcajeSalida->id}";
            if (cache()->has($cacheKey)) {
                continue; // Ya fue notificado hoy
            }

            $enviado = $notifService->notificarExcesoDescanso($empleado, $marcajeSalida, $minutosExcedidos);

            if ($enviado) {
                // Guardar en caché hasta medianoche
                $ttl = max($now->secondsUntilEndOfDay(), 60);
                cache()->put($cacheKey, true, $ttl);
                $alertados++;

                $this->line("  → Notificado: {$empleado->nombre_completo} ({$minutosExcedidos} min excedidos)");
            }
        }

        $this->info("Verificación completada. Notificaciones enviadas: {$alertados}");

        return Command::SUCCESS;
    }
}
