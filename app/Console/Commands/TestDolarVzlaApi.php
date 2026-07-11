<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ExchangeRateService;
use Carbon\Carbon;

class TestDolarVzlaApi extends Command
{
    protected $signature = 'test:dolarvzla {year?} {month?}';
    protected $description = 'Test DolarVzla API for historical data. Uso: test:dolarvzla [año] [mes]';

    public function handle()
    {
        $year = $this->argument('year') ?? now()->year;
        $month = $this->argument('month') ?? now()->month;
        
        $date = Carbon::create($year, $month, 1);
        $monthName = $date->locale('es')->translatedFormat('F Y');
        
        $this->info("Testing DolarVzla API for {$monthName} ({$year}/{$month})...");
        $this->newLine();
        
        $service = new ExchangeRateService();
        $updated = $service->backfillMonthBCV((int)$year, (int)$month);
        
        if ($updated > 0) {
            $this->info("✓ Successfully backfilled {$updated} days");
            
            // Mostrar muestra de tasas
            $this->newLine();
            $this->info("Muestra de tasas rellenadas:");
            $rates = \App\Models\ExchangeRate::whereYear('date', $year)
                ->whereMonth('date', $month)
                ->orderBy('date')
                ->take(5)
                ->get(['date', 'usd_rate', 'source']);
            
            foreach ($rates as $rate) {
                $this->line("  {$rate->date->format('d/m/Y')}: {$rate->usd_rate} Bs. ({$rate->source})");
            }
            
            if ($updated > 5) {
                $this->line("  ... y " . ($updated - 5) . " días más");
            }
        } else {
            $this->error("✗ Failed to backfill data");
        }
        
        return 0;
    }
}
