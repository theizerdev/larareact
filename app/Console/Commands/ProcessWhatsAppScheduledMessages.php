<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\ProcessScheduledWhatsAppMessages;
use Carbon\Carbon;

class ProcessWhatsAppScheduledMessages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'whatsapp:process-scheduled 
                            {--force : Forzar el procesamiento sin verificar horarios}
                            {--delay=0 : Minutos de retraso para el procesamiento}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Procesar mensajes de WhatsApp programados para envío';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando procesamiento de mensajes programados de WhatsApp...');
        
        $delay = (int) $this->option('delay');
        $force = $this->option('force');
        
        if ($delay > 0) {
            $this->info("Procesamiento retrasado por {$delay} minutos");
            sleep($delay * 60);
        }

        try {
            // Despachar el job
            if ($force) {
                ProcessScheduledWhatsAppMessages::dispatchNow();
                $this->info('Mensajes procesados exitosamente (forzado)');
            } else {
                ProcessScheduledWhatsAppMessages::dispatch();
                $this->info('Job despachado exitosamente');
            }

            $this->info('Procesamiento de mensajes programados completado');
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Error al procesar mensajes: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}