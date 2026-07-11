<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ExchangeRateService;

class FetchExchangeRates extends Command
{
    protected $signature = 'exchange:fetch';
    protected $description = 'Fetch exchange rates from BCV';

    public function handle(ExchangeRateService $service)
    {
        $this->info('Fetching exchange rates...');
        
        try {
            $success = $service->fetchAndStoreRates();
            
            if ($success) {
                $rate = $service->getLatestRate();
                $this->info("Exchange rates fetched successfully. USD: {$rate}");
            } else {
                $this->error('Failed to fetch exchange rates');
            }
            
            return $success ? 0 : 1;
        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return 1;
        }
    }
}
