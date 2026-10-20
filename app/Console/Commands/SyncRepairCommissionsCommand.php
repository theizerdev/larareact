<?php

namespace App\Console\Commands;

use App\Services\CommissionService;
use Illuminate\Console\Command;

class SyncRepairCommissionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'comisiones:sync-taller {--empresa_id= : ID específico de la empresa a sincronizar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Vincula las órdenes de reparación con sus empleados técnicos y calcula comisiones retroactivas';

    /**
     * Execute the console command.
     */
    public function handle(CommissionService $commissionService): int
    {
        $this->info('🔧 Sincronizando órdenes de taller y calculando comisiones de técnicos...');

        $empresaId = $this->option('empresa_id') ? (int) $this->option('empresa_id') : null;
        if ($empresaId) {
            $this->line("🏢 Filtrando por Empresa ID: <comment>{$empresaId}</comment>");
        }

        $result = $commissionService->syncRepairCommissions($empresaId);

        $this->info('✅ Proceso de sincronización completado:');
        $this->line("   - Total órdenes analizadas: <comment>{$result['total']}</comment>");
        $this->line("   - Órdenes vinculadas a empleados técnicos: <comment>{$result['linked']}</comment>");
        $this->line("   - Comisiones de taller calculadas: <comment>{$result['calculated']}</comment>");

        return Command::SUCCESS;
    }
}
