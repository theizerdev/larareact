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

        $this->info("\nVerificación finalizada. Marcajes evaluados: {$evaluados} | Notificaciones enviadas hoy: {$alertados}");

        return Command::SUCCESS;
    }
}
