<?php

namespace App\Console\Commands;

use App\Services\Tenancy\TenantManager;
use Database\Seeders\EquiposInicialSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SeedTenantEquiposCommand extends Command
{
    protected $signature = 'tenant:seed-equipos {tenant=1 : ID de la empresa/tenant a sembrar}';

    protected $description = 'Ejecuta EquiposInicialSeeder en la base de datos de un tenant específico';

    public function handle(): int
    {
        $tenantId = (int) $this->argument('tenant');
        $dbName = TenantManager::getDatabaseName($tenantId);

        $this->info("Iniciando EquiposInicialSeeder en {$dbName}...");

        try {
            TenantManager::executeInTenant($tenantId, function () use ($tenantId) {
                $seeder = new EquiposInicialSeeder();
                $seeder->run();
            });

            $this->info("✓ EquiposInicialSeeder ejecutado exitosamente en {$dbName}.");

            // Mostrar resumen
            $conn = DB::connection('tenant');
            $cats = $conn->table('categorias')->where('empresa_id', $tenantId)->count();
            $marcas = $conn->table('marcas')->where('empresa_id', $tenantId)->count();
            $familias = $conn->table('familias')->where('empresa_id', $tenantId)->count();
            $modelos = $conn->table('modelos')->where('empresa_id', $tenantId)->count();
            $productos = $conn->table('productos')->where('empresa_id', $tenantId)->count();

            $this->table(
                ['Tabla', 'Registros'],
                [
                    ['Categorías', $cats],
                    ['Marcas', $marcas],
                    ['Familias', $familias],
                    ['Modelos', $modelos],
                    ['Productos / Variantes', $productos],
                ]
            );

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error("✗ Error al ejecutar el seeder: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
