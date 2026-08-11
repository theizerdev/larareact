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

        // Buscar todos los marcajes de salida_comida y descanso_inicio de hoy
        $salidasDescanso = AsistenciaMarcaje::with(['empleado.turnoLaboral', 'empleado.paisTelefono'])
            ->whereDate('fecha_hora', $today)
            ->whereIn('tipo_marcaje', ['salida_comida', 'descanso_inicio'])
            ->get();

        $alertados = 0;

        foreach ($salidasDescanso as $marcajeSalida) {
            $empleado = $marcajeSalida->empleado;
            if (! $empleado || ! $empleado->status) {
                continue;
            }

            // Verificar si el empleado ya registró su regreso DESPUÉS de este marcaje
            $yaRegreso = AsistenciaMarcaje::where('empleado_id', $empleado->id)
                ->where('fecha_hora', '>', $marcajeSalida->fecha_hora)
                ->whereDate('fecha_hora', $today)
                ->whereIn('tipo_marcaje', [
                    'entrada_comida',
                    'descanso_fin',
                    'salida',
                    'entrada_extraordinaria',
                ])
                ->exists();

            if ($yaRegreso) {
                continue; // El empleado ya regresó, no notificar
            }

            // Obtener el límite adecuado según el tipo de marcaje
            $esAlmuerzo = $marcajeSalida->tipo_marcaje === 'salida_comida';
            if ($esAlmuerzo) {
                $minutosDescansoPermitidos = $empleado->turnoLaboral?->minutos_descanso ?? 60;
            } else {
                $config = \App\Models\ConfiguracionAsistencia::where('empresa_id', $empleado->empresa_id)->first();
                $minutosDescansoPermitidos = $config?->ley_silla_descanso_minutos ?? 15;
            }

            // Calcular minutos transcurridos
            $minutosTranscurridos = Carbon::parse($marcajeSalida->fecha_hora)->diffInMinutes($now);

            // Solo actuar si excedió por más de 5 minutos de margen
            if ($minutosTranscurridos <= ($minutosDescansoPermitidos + 5)) {
                continue;
            }

            $minutosExcedidos = $minutosTranscurridos - $minutosDescansoPermitidos;

            // ── Deduplicación ────────────────────────────────────────────────
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

                $conceptoStr = $esAlmuerzo ? 'Almuerzo' : 'Descanso (Ley Silla)';
                $this->line("  → Notificado ({$conceptoStr}): {$empleado->nombre_completo} ({$minutosExcedidos} min excedidos)");
            }
        }

        $this->info("Verificación completada. Notificaciones enviadas: {$alertados}");

        return Command::SUCCESS;
    }
}
