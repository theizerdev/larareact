<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\RegionalConfigurationService;
use App\Models\Empresa;
use App\Models\Pais;

class TestRegionalConfiguration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:regional-configuration {empresa_id?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Probar la configuración regional del sistema';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== Prueba de Configuración Regional ===');

        // Obtener configuración actual
        $config = RegionalConfigurationService::getCurrentConfiguration();

        $this->info('Configuración actual:');
        $this->table(
            ['Configuración', 'Valor'],
            [
                ['Moneda', $config['currency'] ?? 'No definida'],
                ['Zona Horaria', $config['timezone'] ?? 'No definida'],
                ['Formato de Fecha', $config['date_format'] ?? 'No definido'],
                ['Formato de Moneda', $config['currency_format'] ?? 'No definido'],
                ['Símbolo de Moneda', $config['currency_symbol'] ?? 'No definido'],
                ['Idioma', $config['locale'] ?? 'No definido'],
            ]
        );

        // Si se proporciona un ID de empresa, probar con esa empresa
        $empresaId = $this->argument('empresa_id');
        if ($empresaId) {
            $empresa = Empresa::with('pais')->find($empresaId);
            if ($empresa) {
                $this->info("\nProbando con empresa: {$empresa->razon_social}");
                RegionalConfigurationService::setRegionalConfiguration($empresa);

                $newConfig = RegionalConfigurationService::getCurrentConfiguration();
                $this->info('Nueva configuración:');
                $this->table(
                    ['Configuración', 'Valor'],
                    [
                        ['Moneda', $newConfig['currency'] ?? 'No definida'],
                        ['Zona Horaria', $newConfig['timezone'] ?? 'No definida'],
                        ['Formato de Fecha', $newConfig['date_format'] ?? 'No definido'],
                        ['Formato de Moneda', $newConfig['currency_format'] ?? 'No definido'],
                        ['Símbolo de Moneda', $newConfig['currency_symbol'] ?? 'No definido'],
                        ['Idioma', $newConfig['locale'] ?? 'No definido'],
                    ]
                );
            } else {
                $this->error("Empresa con ID {$empresaId} no encontrada");
            }
        }

        // Probar formateo de dinero
        $this->info("\n=== Prueba de Formateo ===");
        $amount = 1234.56;
        $this->info("Monto original: {$amount}");
        $this->info("Monto formateado: " . RegionalConfigurationService::formatMoney($amount));

        // Probar formateo de fecha
        $date = now();
        $this->info("Fecha actual: {$date}");
        $this->info("Fecha formateada: " . RegionalConfigurationService::formatDate($date));

        $this->info("\n✅ Prueba de configuración regional completada");

        return Command::SUCCESS;
    }
}
