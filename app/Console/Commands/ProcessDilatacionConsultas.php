<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\DilatacionService;

class ProcessDilatacionConsultas extends Command
{
    protected $signature = 'consultas:procesar-dilataciones';
    protected $description = 'Procesa consultas en estado en_gotas y marca como dilatado cuando el tiempo de espera de la gota aplicada ha finalizado.';

    public function handle(DilatacionService $service)
    {
        $processed = $service->processPendingDilataciones();

        $this->info("Dilataciones procesadas: {$processed}");

        return Command::SUCCESS;
    }
}
