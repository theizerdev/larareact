<?php

namespace App\Console\Commands;

use App\Models\ExchangeRate;
use App\Services\ExchangeRateService;
use Illuminate\Console\Command;

class UpdateExchangeRates extends Command
{
    protected $signature = 'exchange-rates:update';

    protected $description = 'Actualizar las tasas de cambio manualmente';

    public function handle()
    {
        $this->info('Actualizando tasas de cambio...');

        $service = new ExchangeRateService;
        $result = $service->fetchAndStoreRates();

        if ($result) {
            $todayRate = ExchangeRate::getTodayRate();
            $this->info('✓ Tasas actualizadas exitosamente');
            $this->info('USD: '.$todayRate->usd_rate);
            $this->info('EUR: '.$todayRate->eur_rate);
            $this->info('Fuente: '.$todayRate->source);
        } else {
            $this->error('✗ Error al actualizar las tasas');
        }
    }
}
