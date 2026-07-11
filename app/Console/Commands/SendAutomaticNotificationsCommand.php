<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\SendAutomaticNotifications;

class SendAutomaticNotificationsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:send-automatic';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Enviar notificaciones automáticas de cumpleaños y vencimientos';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Enviando notificaciones automáticas...');
        
        // Despachar el job
        SendAutomaticNotifications::dispatch();
        
        $this->info('Notificaciones automáticas enviadas correctamente.');
    }
}