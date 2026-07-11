<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\RetryFailedWhatsAppMessages;
use Carbon\Carbon;

class DevRetryWhatsApp extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'whatsapp:dev-retry 
                            {--days=7 : Número de días hacia atrás para buscar mensajes}
                            {--max-retries=3 : Máximo de reintentos por mensaje}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reenviar mensajes de WhatsApp fallidos (modo desarrollo - sin verificar servicio)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = $this->option('days');
        $maxRetries = $this->option('max-retries');

        $this->info("🚀 Modo DESARROLLO - Reenviando mensajes fallidos de WhatsApp...");
        $this->info("📅 Días: {$days}, 🔢 Máximo de reintentos: {$maxRetries}");
        $this->warn("⚠️  Advertencia: No se verifica el estado del servicio de WhatsApp");

        try {
            // Despachar el job directamente sin verificar el servicio
            RetryFailedWhatsAppMessages::dispatch($days, $maxRetries);
            
            $this->info("✅ Job de reenvío despachado exitosamente");
            $this->info("⏳ Los mensajes fallidos serán procesados en segundo plano");
            
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error("❌ Error al despachar el job: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}