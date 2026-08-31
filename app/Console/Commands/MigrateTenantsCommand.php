<?php

namespace App\Console\Commands;

use App\Services\Tenancy\TenantManager;
use Illuminate\Console\Command;

class MigrateTenantsCommand extends Command
{
    protected $signature = 'tenants:migrate {tenant? : ID de la empresa/tenant a migrar} {--all : Migrar todas las bases de datos de inquilinos}';

    protected $description = 'Ejecuta las migraciones pendientes en las bases de datos de inquilinos';

    public function handle(): int
    {
        $tenantId = $this->argument('tenant');
        $all = $this->option('all');

        if (! $tenantId && ! $all) {
            $this->error('Debes especificar un ID de tenant o usar --all.');
            $this->line('Ejemplos:');
            $this->line('  php artisan tenants:migrate 2');
            $this->line('  php artisan tenants:migrate --all');
            return Command::FAILURE;
        }

        if ($tenantId) {
            $this->info("Migrando base de datos del tenant {$tenantId}...");
            $exitCode = TenantManager::migrateTenant((int) $tenantId);
            if ($exitCode === 0) {
                $this->info("✓ Tenant {$tenantId} migrado correctamente.");
            } else {
                $this->error("✗ Error al migrar el tenant {$tenantId}.");
            }
            return $exitCode;
        }

        $this->info('Migrando todas las bases de datos de inquilinos existentes...');
        $results = TenantManager::migrateAllTenants();

        foreach ($results as $id => $code) {
            if ($code === 0) {
                $this->line("  ✓ Tenant {$id}: Migraciones al día.");
            } else {
                $this->error("  ✗ Tenant {$id}: Falló la migración.");
            }
        }

        $this->info('✓ Proceso de migración completado para todos los inquilinos.');
        return Command::SUCCESS;
    }
}
