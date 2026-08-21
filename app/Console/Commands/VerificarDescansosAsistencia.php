<?php

namespace App\Console\Commands;

use App\Models\AsistenciaMarcaje;
use App\Models\Empleado;
use App\Notifications\DescansoExcedidoNotification;
use App\Services\NotificacionAsistenciaWhatsAppService;
use App\Services\NotificationDispatcher;
use Carbon\Carbon;
use Illuminate\Console\Command;

class VerificarDescansosAsistencia extends Command
{
    /**
     * El nombre y firma del comando de consola.
     */
    protected $signature = 'asistencia:verificar-descansos 
                            {--force : Ignorar la caché de deduplicación y forzar el procesamiento}
                            {--margen=0 : Margen de tolerancia en minutos adicionales (por defecto 0 min)}';

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
        $isForce = $this->option('force');
        $margen = (int) ($this->option('margen') ?? 0);

        $this->info("Iniciando verificación de descansos y almuerzos en tiempo real (" . $now->format('Y-m-d H:i:s') . ")...");
        if ($isForce) {
            $this->warn("Modo --force activado: Se ignorará el historial de caché previa.");
        }

        // Buscar marcajes de hoy que iniciaron descanso o almuerzo
        $salidasDescanso = AsistenciaMarcaje::with(['empleado.turnoLaboral', 'empleado.paisTelefono'])
            ->whereDate('fecha_hora', $today)
            ->whereIn('tipo_marcaje', ['salida_comida', 'descanso_inicio'])
            ->orderBy('fecha_hora', 'asc')
            ->get();

        if ($salidasDescanso->isEmpty()) {
            $this->comment("No hay marcajes de inicio de descanso ni almuerzo registrados el día de hoy.");
            return Command::SUCCESS;
        }

        $alertados = 0;
        $evaluados = 0;

        foreach ($salidasDescanso as $marcajeSalida) {
            $empleado = $marcajeSalida->empleado;
            if (! $empleado || ! $empleado->status) {
                continue;
            }

            $evaluados++;
            $esAlmuerzo = $marcajeSalida->tipo_marcaje === 'salida_comida';
            $conceptoStr = $esAlmuerzo ? 'Almuerzo' : 'Descanso Ley Silla';

            // Definir qué tipo de marcaje se considera "regreso"
            $tiposRegreso = $esAlmuerzo
                ? ['entrada_comida', 'salida']
                : ['descanso_fin', 'salida'];

            // Verificar si el empleado ya registró su regreso posterior a este evento
            $regreso = AsistenciaMarcaje::where('empleado_id', $empleado->id)
                ->where('fecha_hora', '>', $marcajeSalida->fecha_hora)
                ->whereIn('tipo_marcaje', $tiposRegreso)
                ->orderBy('fecha_hora', 'asc')
                ->first();

            if ($regreso) {
                $duracionReal = (int) round(Carbon::parse($marcajeSalida->fecha_hora)->diffInMinutes(Carbon::parse($regreso->fecha_hora)));
                $this->line("• [COMPLETADO] Empleado #{$empleado->id} ({$empleado->nombre_completo}) - {$conceptoStr}: Duración {$duracionReal} min (Regresó a las {$regreso->fecha_hora}).");
                continue;
            }

            // Obtener el límite adecuado según el tipo de marcaje
            if ($esAlmuerzo) {
                $minutosDescansoPermitidos = $empleado->turnoLaboral?->minutos_descanso ?? 60;
            } else {
                $config = \App\Models\ConfiguracionAsistencia::where('empresa_id', $empleado->empresa_id)->first();
                $minutosDescansoPermitidos = $config?->ley_silla_descanso_minutos ?? 15;
            }

            // Calcular minutos transcurridos en tiempo real
            $minutosTranscurridos = (int) round(Carbon::parse($marcajeSalida->fecha_hora)->diffInMinutes($now));

            // Verificar si excedió el tiempo límite + margen
            $limiteConMargen = $minutosDescansoPermitidos + $margen;

            if ($minutosTranscurridos <= $limiteConMargen) {
                $restantes = $minutosDescansoPermitidos - $minutosTranscurridos;
                $this->line("• [EN CURSO] Empleado #{$empleado->id} ({$empleado->nombre_completo}) - {$conceptoStr}: Transcurridos {$minutosTranscurridos}m / Límite {$minutosDescansoPermitidos}m ({$restantes}m restantes).");
                continue;
            }

            $minutosExcedidos = $minutosTranscurridos - $minutosDescansoPermitidos;

            // Deduplicación por Caché
            $cacheKey = "alerta_descanso_excedido_{$marcajeSalida->id}";
            if (cache()->has($cacheKey) && ! $isForce) {
                $this->warn("• [EXCEDIDO - YA ALERTADO] Empleado #{$empleado->id} ({$empleado->nombre_completo}) - Excedido por {$minutosExcedidos} min (Notificación previa almacenada en caché).");
                continue;
            }

            // Alerta in-app a supervisores (independiente del envío por WhatsApp al empleado)
            $appCacheKey = "alerta_descanso_excedido_inapp_{$marcajeSalida->id}";
            if (! cache()->has($appCacheKey) || $isForce) {
                NotificationDispatcher::notifyPermission(
                    ['asistencia.bitacora', 'asistencia.configuracion'],
                    $empleado->empresa_id,
                    new DescansoExcedidoNotification($empleado->nombre_completo, $conceptoStr, $minutosExcedidos),
                );
                cache()->put($appCacheKey, true, max($now->secondsUntilEndOfDay(), 60));
            }

            // Enviar notificación por WhatsApp
            $this->comment("• [EXCEDIDO - NOTIFICANDO...] Empleado #{$empleado->id} ({$empleado->nombre_completo}) - Excedido por {$minutosExcedidos} min (Límite: {$minutosDescansoPermitidos}m).");

            $enviado = $notifService->notificarExcesoDescanso($empleado, $marcajeSalida, $minutosExcedidos);

            if ($enviado) {
                // Guardar en caché hasta medianoche
                $ttl = max($now->secondsUntilEndOfDay(), 60);
                cache()->put($cacheKey, true, $ttl);
                $alertados++;

                $this->info("  ↳ Notificación enviada con éxito vía WhatsApp a {$empleado->nombre_completo}.");
            } else {
                $this->error("  ↳ Error o WhatsApp desactivado/sin plantilla al notificar a {$empleado->nombre_completo}.");
            }
        }

        $this->info("\nVerificación de descansos finalizada. Marcajes evaluados: {$evaluados} | Notificaciones enviadas hoy: {$alertados}");

        // -------------------------------------------------------------------------
        // FASE 2: Verificar empleados próximos a finalizar su jornada laboral (1-20 min antes)
        // -------------------------------------------------------------------------
        $this->info("\nIniciando verificación de próximo fin de jornada laboral...");

        $empleadosActivosHoy = AsistenciaMarcaje::with(['empleado.turnoLaboral', 'empleado.paisTelefono'])
            ->whereDate('fecha_hora', $today)
            ->whereIn('tipo_marcaje', ['entrada', 'entrada_extraordinaria', 'entrada_comida', 'descanso_fin'])
            ->get()
            ->pluck('empleado')
            ->filter(fn ($emp) => $emp && $emp->status && $emp->turnoLaboral && ! empty($emp->turnoLaboral->hora_salida))
            ->unique('id');

        $avisoFinJornadaEnviados = 0;

        foreach ($empleadosActivosHoy as $empleado) {
            // Verificar si el empleado ya registró salida definitiva hoy
            $yaMarcoSalida = AsistenciaMarcaje::where('empleado_id', $empleado->id)
                ->whereDate('fecha_hora', $today)
                ->where('tipo_marcaje', 'salida')
                ->exists();

            if ($yaMarcoSalida) {
                continue;
            }

            $horaSalidaStr = substr($empleado->turnoLaboral->hora_salida, 0, 5); // ej '17:00'
            $horaSalidaCarbon = Carbon::parse($today->toDateString() . ' ' . $horaSalidaStr);

            // Ajuste para turnos nocturnos que cruzan medianoche
            if ($horaSalidaCarbon->isBefore(Carbon::parse($today->toDateString() . ' ' . substr($empleado->turnoLaboral->hora_entrada, 0, 5)))) {
                if ($now->hour >= 12) {
                    $horaSalidaCarbon->addDay();
                }
            }

            // Minutos que faltan para la salida de la jornada
            $minutosRestantesSalida = (int) round($now->diffInMinutes($horaSalidaCarbon, false));

            // Notificar cuando falten entre 1 y 20 minutos para la salida
            if ($minutosRestantesSalida > 0 && $minutosRestantesSalida <= 20) {
                $cacheKeyFin = "alerta_fin_jornada_{$empleado->id}_{$today->toDateString()}";
                if (cache()->has($cacheKeyFin) && ! $isForce) {
                    $this->warn("• [FIN JORNADA - YA ALERTADO] Empleado #{$empleado->id} ({$empleado->nombre_completo}) - Notificación de fin de jornada previa almacenada en caché.");
                    continue;
                }

                $this->comment("• [FIN JORNADA - NOTIFICANDO...] Empleado #{$empleado->id} ({$empleado->nombre_completo}) - Salida a las {$horaSalidaStr} hrs (Faltan {$minutosRestantesSalida}m).");

                $enviado = $notifService->notificarProximoFinJornada($empleado, $horaSalidaStr, $minutosRestantesSalida);

                if ($enviado) {
                    $ttl = max($now->secondsUntilEndOfDay(), 60);
                    cache()->put($cacheKeyFin, true, $ttl);
                    $avisoFinJornadaEnviados++;
                    $this->info("  ↳ Notificación de aviso fin de jornada enviada con éxito a {$empleado->nombre_completo}.");
                } else {
                    $this->error("  ↳ Error enviando WhatsApp fin de jornada a {$empleado->nombre_completo}.");
                }
            }
        }

        $this->info("\nProceso global de asistencia finalizado. Avisos fin de jornada enviados: {$avisoFinJornadaEnviados}");

        return Command::SUCCESS;
    }
}
