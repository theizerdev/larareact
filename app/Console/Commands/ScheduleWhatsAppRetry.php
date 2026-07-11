<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\RetryFailedWhatsAppMessages;
use App\Services\WhatsAppService;
use Carbon\Carbon;

class ScheduleWhatsAppRetry extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'whatsapp:schedule-retry 
                            {--days=7 : Número de días hacia atrás para buscar mensajes}
                            {--max-retries=3 : Máximo de reintentos por mensaje}
                            {--force : Forzar el reenvío sin verificar el estado del servicio}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Programar el reenvío automático de mensajes de WhatsApp fallidos';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = $this->option('days');
        $maxRetries = $this->option('max-retries');
        $force = $this->option('force');

        $this->info("Programando reenvío de mensajes fallidos de WhatsApp...");
        $this->info("Días: {$days}, Máximo de reintentos: {$maxRetries}");

        // Verificar el estado del servicio de WhatsApp
        if (!$force) {
            $this->info("Verificando estado del servicio de WhatsApp...");
            
            $whatsAppService = app(WhatsAppService::class);
            $connectionTest = $whatsAppService->testConnection();

            if (!$connectionTest['success']) {
                $this->error("Servicio de WhatsApp no disponible: " . ($connectionTest['message'] ?? 'Error desconocido'));
                $this->error("Use --force para programar el reenvío de todos modos");
                return Command::FAILURE;
            }

            $this->info("Servicio de WhatsApp disponible ✓");
        }

        try {
            // Despachar el job
            RetryFailedWhatsAppMessages::dispatch($days, $maxRetries);
            
            $this->info("Job de reenvío programado exitosamente");
            $this->info("Los mensajes fallidos serán procesados en segundo plano");
            
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Error al programar el job: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}