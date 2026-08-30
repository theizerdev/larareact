<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Services\Tenancy\TenantManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class PruneExpiredTenantsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenants:prune-expired {--dry-run : Simulate the pruning process without deleting databases} {--days=7 : Grace days past trial expiration before pruning}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Archive and drop isolated tenant databases for expired trial companies';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $graceDays = (int) $this->option('days');

        $cutoffDate = now()->subDays($graceDays);

        $this->info("Buscando empresas con período de prueba vencido antes de: {$cutoffDate->toDateTimeString()} (Gracia: {$graceDays} días)...");

        // Buscar en la base landlord empresas en prueba vencidas
        $expiredEmpresas = DB::connection('landlord')
            ->table('empresas')
            ->where(function ($q) {
                $q->where('subscription_status', 'trial')
                  ->orWhere('subscription_status', 'expired');
            })
            ->whereNotNull('trial_ends_at')
            ->where('trial_ends_at', '<', $cutoffDate)
            ->where(function ($q) {
                $q->whereNull('db_status')
                  ->orWhere('db_status', '!=', 'archived');
            })
            ->get();

        if ($expiredEmpresas->isEmpty()) {
            $this->info('No se encontraron bases de datos de inquilinos para depurar.');
            return Command::SUCCESS;
        }

        $this->warn("Se encontraron {$expiredEmpresas->count()} empresas para depurar.");

        $backupDir = storage_path('app/backups/tenants');
        if (! File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        foreach ($expiredEmpresas as $empresa) {
            $dbName = TenantManager::getDatabaseName($empresa->id);
            $this->line("Procesando Empresa ID: {$empresa->id} ({$empresa->razon_social}) - Base de datos: {$dbName}");

            if (! TenantManager::databaseExists($empresa->id)) {
                $this->warn(" - La base de datos {$dbName} ya no existe físicamente. Marcando como archivada.");
                if (! $dryRun) {
                    DB::connection('landlord')
                        ->table('empresas')
                        ->where('id', $empresa->id)
                        ->update(['status' => false, 'subscription_status' => 'expired']);
                }
                continue;
            }

            if ($dryRun) {
                $this->info(" [DRY-RUN] Se respaldaría y eliminaría la base de datos {$dbName}.");
                continue;
            }

            try {
                // 1. Generar respaldo comprimido (.sql.gz)
                $timestamp = now()->format('Ymd_His');
                $backupFile = "{$backupDir}/tenant_{$empresa->id}_{$timestamp}.sql";

                $dbHost = config('database.connections.mysql.host', '127.0.0.1');
                $dbPort = config('database.connections.mysql.port', '3306');
                $dbUser = config('database.connections.mysql.username', 'root');
                $dbPass = config('database.connections.mysql.password', '');

                $passArg = !empty($dbPass) ? "-p" . escapeshellarg($dbPass) : '';
                $dumpCmd = sprintf(
                    "mysqldump -h %s -P %s -u %s %s %s > %s 2>/dev/null && gzip -f %s",
                    escapeshellarg($dbHost),
                    escapeshellarg($dbPort),
                    escapeshellarg($dbUser),
                    $passArg,
                    escapeshellarg($dbName),
                    escapeshellarg($backupFile),
                    escapeshellarg($backupFile)
                );

                @exec($dumpCmd);

                // 2. Eliminar la base de datos MySQL físicamente
                TenantManager::dropTenantDatabase($empresa->id);

                // 3. Actualizar estado en la base central
                DB::connection('landlord')
                    ->table('empresas')
                    ->where('id', $empresa->id)
                    ->update([
                        'status' => false,
                        'subscription_status' => 'expired',
                    ]);

                Log::info("Tenant {$empresa->id} ({$dbName}) purgado y archivado exitosamente.");
                $this->info(" ✓ Base de datos {$dbName} respaldada y eliminada.");
            } catch (\Throwable $e) {
                Log::error("Error al purgar tenant {$empresa->id}: " . $e->getMessage());
                $this->error(" ✗ Error al purgar {$dbName}: " . $e->getMessage());
            }
        }

        $this->info('Proceso de purga de inquilinos finalizado.');
        return Command::SUCCESS;
    }
}
