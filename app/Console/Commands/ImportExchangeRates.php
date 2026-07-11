<?php

namespace App\Console\Commands;

use App\Models\ExchangeRate;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ImportExchangeRates extends Command
{
    protected $signature = 'tasas:importar {archivo}';
    protected $description = 'Importar tasas de cambio desde archivo CSV';

    public function handle()
    {
        $archivo = $this->argument('archivo');
        
        if (!file_exists($archivo)) {
            $this->error("Archivo no encontrado: {$archivo}");
            return 1;
        }
        
        $handle = fopen($archivo, 'r');
        $header = fgetcsv($handle); // Saltar encabezado
        
        $imported = 0;
        $skipped = 0;
        
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < 3) continue;
            
            [$fecha, $usd, $eur] = $row;
            
            try {
                $date = Carbon::parse($fecha);
                
                $existing = ExchangeRate::where('date', $date->toDateString())->first();
                
                if ($existing) {
                    $skipped++;
                    continue;
                }
                
                ExchangeRate::create([
                    'date' => $date->toDateString(),
                    'usd_rate' => (float) $usd,
                    'eur_rate' => (float) $eur,
                    'source' => 'Importado CSV',
                    'fetch_time' => '14:00:00',
                    'raw_data' => [
                        'imported' => true,
                        'imported_at' => now()->toISOString(),
                        'imported_by' => 'CLI',
                    ],
                ]);
                
                $imported++;
                
            } catch (\Exception $e) {
                $this->warn("Error en fila: {$fecha} - " . $e->getMessage());
            }
        }
        
        fclose($handle);
        
        $this->info("✓ Importadas: {$imported} tasas");
        $this->info("⊘ Omitidas (ya existen): {$skipped}");
        
        return 0;
    }
}
