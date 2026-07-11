<?php

namespace App\Console;

use App\Jobs\ProcessAppointmentConfirmations;
use App\Models\WhatsAppMessage;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        Commands\SendAccessNotificationJob::class,
        Commands\SendAutomaticNotificationsCommand::class,
        Commands\FetchExchangeRates::class,
        Commands\ProcessWhatsAppScheduledMessages::class,
        Commands\RetryFailedWhatsAppMessages::class,
        Commands\ScheduleWhatsAppRetry::class,
        Commands\SetupWhatsAppAutoRetry::class,
        Commands\WhatsAppRetryStatus::class,
        Commands\DevRetryWhatsApp::class, // Comando de desarrollo
        Commands\TestStudentWhatsAppNotification::class, // Comando de prueba para notificaciones de estudiantes
        Commands\ProcesarRecordatoriosCitas::class, // Procesar recordatorios de citas médicas
        Commands\TestRecordatoriosCitas::class, // Comando de prueba para recordatorios
        Commands\VerificarRecordatoriosCitas::class, // Verificar estado de recordatorios
        Commands\ProcessConfirmationsCommand::class, // Procesar confirmaciones de citas
        Commands\ProcessDilatacionConsultas::class,
    ];

    /**
     * Define the application's command schedule.
     *
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        $schedule->command('notifications:send-automatic')->dailyAt('08:00');

        // Obtener tasas de cambio del BCV dos veces al día
        $schedule->command('exchange:fetch')
            ->dailyAt('10:00')
            ->timezone('America/Caracas');

        $schedule->command('exchange:fetch')
            ->dailyAt('14:00')
            ->timezone('America/Caracas');

        // Procesar mensajes programados de WhatsApp cada minuto
        $schedule->command('whatsapp:process-scheduled')
            ->everyMinute()
            ->timezone('America/Caracas')
            ->withoutOverlapping()
            ->onOneServer();

        // Reenvío automático de mensajes fallidos cada hora
        $schedule->command('whatsapp:schedule-retry')
            ->hourly()
            ->timezone('America/Caracas')
            ->withoutOverlapping()
            ->onOneServer()
            ->when(function () {
                // Solo ejecutar si hay mensajes fallidos para reenviar
                return WhatsAppMessage::where('direction', 'outbound')
                    ->retryable()
                    ->exists();
            });

        // Procesar recordatorios de citas cada 15 minutos
        if (auth()->check()) {
            $schedule->command('citas:procesar-recordatorios')
                ->everyFifteenMinutes()
                ->timezone(auth()->user()->empresa->pais->zona_horaria)
                ->withoutOverlapping()
                ->onOneServer();
        } else {
            $schedule->command('citas:procesar-recordatorios')
                ->everyFifteenMinutes()
                ->timezone('America/Caracas')
                ->withoutOverlapping()
                ->onOneServer();
        }

        // Procesar confirmaciones cada hora
        $schedule->command('confirmations:process --type=all')
            ->hourly()
            ->withoutOverlapping()
            ->appendOutputTo(storage_path('logs/confirmations.log'));

        // Enviar recordatorios de citas
        $schedule->job(new ProcessAppointmentConfirmations)
            ->dailyAt('08:00')
            ->withoutOverlapping();

        $schedule->command('citas:update-estados')
            ->everyFiveMinutes()
            ->withoutOverlapping()
            ->onOneServer();

        $schedule->command('consultas:procesar-dilataciones')
            ->everyMinute()
            ->withoutOverlapping()
            ->onOneServer();
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
