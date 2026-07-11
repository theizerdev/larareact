<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\RetryFailedWhatsAppMessages;
use Carbon\Carbon;

class SetupWhatsAppAutoRetry extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'whatsapp:setup-auto-retry 
                            {--disable : Desactivar el reenvío automático}
                            {--days=7 : Número de días hacia atrás para buscar mensajes}
                            {--max-retries=3 : Máximo de reintentos por mensaje}
                            {--interval=hourly : Frecuencia del reenvío (hourly, daily, weekly)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Configurar el reenvío automático de mensajes de WhatsApp fallidos';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if ($this->option('disable')) {
            $this->info("Desactivando reenvío automático...");
            $this->warn("Para desactivar completamente, elimina la línea del crontab que contiene 'whatsapp:schedule-retry'");
            return Command::SUCCESS;
        }

        $days = $this->option('days');
        $maxRetries = $this->option('max-retries');
        $interval = $this->option('interval');

        $this->info("Configurando reenvío automático de mensajes fallidos de WhatsApp...");
        $this->info("Días: {$days}, Máximo de reintentos: {$maxRetries}");
        $this->info("Frecuencia: {$interval}");

        // Validar opciones
        if (!in_array($interval, ['hourly', 'daily', 'weekly'])) {
            $this->error("Frecuencia inválida. Use: hourly, daily, o weekly");
            return Command::FAILURE;
        }

        // Generar el comando cron
        $cronExpression = $this->generateCronExpression($interval);
        $command = "cd " . base_path() . " && php artisan whatsapp:schedule-retry --days={$days} --max-retries={$maxRetries}";

        $this->info("Comando a ejecutar: {$command}");
        $this->info("Expresión cron: {$cronExpression}");

        // Mostrar instrucciones
        $this->newLine();
        $this->info("Para activar el reenvío automático, agrega la siguiente línea a tu crontab:");
        $this->line("{$cronExpression} {$command}");
        $this->newLine();
        $this->info("Para editar tu crontab, ejecuta:");
        $this->line("crontab -e");
        $this->newLine();
        $this->warn("Nota: Asegúrate de que el servicio cron esté activo en tu servidor.");

        return Command::SUCCESS;
    }

    /**
     * Generar expresión cron basada en la frecuencia
     */
    private function generateCronExpression(string $interval): string
    {
        switch ($interval) {
            case 'hourly':
                return '0 * * * *'; // Cada hora en el minuto 0
            case 'daily':
                return '0 2 * * *'; // Diariamente a las 2 AM
            case 'weekly':
                return '0 2 * * 0'; // Semanalmente los domingos a las 2 AM
            default:
                return '0 * * * *'; // Por defecto: cada hora
        }
    }
}