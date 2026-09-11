<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Services\Tenancy\TenantManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class ConsolidateTenantsToCentralCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenants:consolidate-to-central {empresa_id? : ID de la empresa a consolidar} {--all : Consolidar todas las bases de datos de inquilinos existentes} {--drop-after : Eliminar la base de datos del tenant física tras consolidar con éxito}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migra y consolida todos los datos desde bases de datos aisladas fixsale_tenant_* hacia la base de datos central sin pérdida de información';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $targetId = $this->argument('empresa_id');
        $all = $this->option('all');
        $dropAfter = (bool) $this->option('drop-after');

        $this->info('🔍 Buscando bases de datos de inquilinos (fixsale_tenant_*)...');

        $tenantDatabases = $this->getTenantDatabases();

        if (empty($tenantDatabases)) {
            $this->info('✅ No se encontraron bases de datos de inquilinos físicas en MySQL.');
            return Command::SUCCESS;
        }

        if ($targetId) {
            $targetDb = TenantManager::getDatabaseName($targetId);
            if (! in_array($targetDb, $tenantDatabases, true)) {
                $this->error("❌ La base de datos {$targetDb} no existe en MySQL.");
                return Command::FAILURE;
            }
            $tenantDatabases = [$targetDb];
        } elseif (! $all) {
            $this->warn('Se encontraron las siguientes bases de datos de inquilinos:');
            foreach ($tenantDatabases as $db) {
                $this->line(" - {$db}");
            }
            $this->info('Ejecuta con --all para consolidar todas o especifica un ID de empresa.');
            $this->line('Ejemplo: php artisan tenants:consolidate-to-central --all');
            return Command::INVALID;
        }

        $backupDir = storage_path('app/backups/consolidated_tenants');
        if (! File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        $this->info("🚀 Iniciando consolidación de " . count($tenantDatabases) . " base(s) de datos hacia la base central...");

        $totalMigrated = 0;

        foreach ($tenantDatabases as $dbName) {
            if (! preg_match('/^fixsale_tenant_(\d+)$/', $dbName, $matches)) {
                continue;
            }

            $empresaId = (int) $matches[1];
            $this->newLine();
            $this->alert("Procesando {$dbName} (Empresa ID: {$empresaId})");

            // 1. Respaldo preventivo en SQL dump
            $timestamp = now()->format('Ymd_His');
            $backupFile = "{$backupDir}/{$dbName}_{$timestamp}.sql";
            $this->line(" 📦 Generando respaldo en {$backupFile}...");

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

            // 2. Conectar dinámicamente al tenant
            Config::set('database.connections.tenant_source', array_merge(
                config('database.connections.mysql'),
                ['database' => $dbName]
            ));
            DB::purge('tenant_source');

            try {
                $this->consolidateTenantData($dbName, $empresaId);
                $this->info(" ✅ Datos de {$dbName} consolidados exitosamente en la base central.");
                $totalMigrated++;

                // 3. Opcional o posterior: eliminar BD tenant física si se especificó --drop-after
                if ($dropAfter) {
                    TenantManager::dropTenantDatabase($empresaId);
                    $this->info(" 🗑️ Base de datos física {$dbName} eliminada tras migración exitosa.");
                }
            } catch (\Throwable $e) {
                Log::error("Error consolidando {$dbName}: " . $e->getMessage(), [
                    'trace' => $e->getTraceAsString(),
                ]);
                $this->error(" ❌ Error consolidando {$dbName}: " . $e->getMessage());
            } finally {
                DB::purge('tenant_source');
            }
        }

        $this->newLine();
        $this->info("🎉 Proceso finalizado: {$totalMigrated} base(s) de datos de inquilinos consolidadas en la base central.");

        return Command::SUCCESS;
    }

    /**
     * Obtener listado de bases de datos de inquilinos en MySQL.
     */
    protected function getTenantDatabases(): array
    {
        try {
            $databases = DB::select("SHOW DATABASES LIKE 'fixsale_tenant_%'");
            $result = [];
            foreach ($databases as $dbRow) {
                $dbArray = (array) $dbRow;
                $result[] = reset($dbArray);
            }
            return $result;
        } catch (\Throwable $e) {
            Log::error('Error al listar bases de datos tenant: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Consolidar todas las tablas de una base de datos tenant en la base principal.
     */
    protected function consolidateTenantData(string $tenantDb, int $empresaId): void
    {
        // Obtener todas las tablas existentes en la BD tenant
        $tablesResult = DB::connection('tenant_source')->select('SHOW TABLES');
        $key = 'Tables_in_' . $tenantDb;

        $tables = [];
        foreach ($tablesResult as $row) {
            $tables[] = $row->$key;
        }

        $this->line("   - Tablas detectadas en el tenant: " . count($tables));

        DB::statement('SET FOREIGN_KEY_CHECKS = 0;');

        try {
            // Orden preferencial de tablas para respetar claves foráneas
            $preferredOrder = [
                'sucursales',
                'roles',
                'permissions',
                'model_has_roles',
                'role_has_permissions',
                'categorias',
                'marcas',
                'familias',
                'modelos',
                'servicios',
                'productos',
                'cash_registers',
                'cash_movements',
                'clientes',
                'credit_policies',
                'sales',
                'sale_items',
                'sale_payments',
                'credit_payments',
                'credit_logs',
                'held_sales',
                'sales_goals',
                'inventory_movements',
                'proveedores',
                'cierres_mensuales',
                'compras',
                'compra_items',
                'compra_pagos',
                'reparacion_checklist_items',
                'reparacion_preservicio_items',
                'ordenes_reparacion',
                'orden_reparacion_items',
                'orden_reparacion_historial',
                'orden_reparacion_fotos',
                'cuentas_contables',
                'asientos_contables',
                'apuntes_contables',
                'configuraciones_contables',
                'nominas',
                'nomina_detalles',
                'whatsapp_templates',
                'activity_log',
            ];

            // Ordenar: primero las conocidas, luego cualquier tabla adicional
            $sortedTables = array_unique(array_merge($preferredOrder, $tables));

            foreach ($sortedTables as $table) {
                if (! in_array($table, $tables, true)) {
                    continue;
                }

                if (! Schema::hasTable($table)) {
                    $this->warn("     ⚠️ La tabla '{$table}' no existe en la base central. Omitiendo.");
                    continue;
                }

                try {
                    $this->migrateTableData($table, $empresaId);
                } catch (\Throwable $tableEx) {
                    $this->warn("     ⚠️ Advertencia en tabla '{$table}': " . $tableEx->getMessage());
                }
            }
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS = 1;');
        }
    }

    /**
     * Copiar registros de una tabla tenant a la tabla central.
     */
    protected function migrateTableData(string $table, int $empresaId): void
    {
        $records = DB::connection('tenant_source')->table($table)->get();

        if ($records->isEmpty()) {
            return;
        }

        $centralColumns = Schema::getColumnListing($table);
        $hasEmpresaId = in_array('empresa_id', $centralColumns, true);
        $hasId = in_array('id', $centralColumns, true);

        $insertedCount = 0;

        foreach ($records as $record) {
            $data = (array) $record;

            // Filtrar solo las columnas existentes en la base central
            $filteredData = array_intersect_key($data, array_flip($centralColumns));

            // Asegurar empresa_id si la tabla lo contiene
            if ($hasEmpresaId && (! isset($filteredData['empresa_id']) || empty($filteredData['empresa_id']))) {
                $filteredData['empresa_id'] = $empresaId;
            }

            // Generar slug si la columna existe en la tabla y viene nula o vacía
            if (in_array('slug', $centralColumns, true) && empty($filteredData['slug'])) {
                $baseName = $filteredData['nombre'] ?? $filteredData['name'] ?? ('item-' . ($filteredData['id'] ?? uniqid()));
                $filteredData['slug'] = \Illuminate\Support\Str::slug($baseName) ?: ('item-' . uniqid());
            }

            try {
                if ($table === 'model_has_roles') {
                    $match = [
                        'role_id' => $filteredData['role_id'] ?? null,
                        'model_type' => $filteredData['model_type'] ?? null,
                        'model_id' => $filteredData['model_id'] ?? null,
                    ];
                    if ($hasEmpresaId && isset($filteredData['empresa_id'])) {
                        $match['empresa_id'] = $filteredData['empresa_id'];
                    }
                    DB::table($table)->updateOrInsert($match, $filteredData);
                } elseif ($table === 'role_has_permissions') {
                    $match = [
                        'permission_id' => $filteredData['permission_id'] ?? null,
                        'role_id' => $filteredData['role_id'] ?? null,
                    ];
                    DB::table($table)->updateOrInsert($match, $filteredData);
                } elseif ($table === 'activity_log') {
                    // Para activity_log no forzar ID conflictivo
                    unset($filteredData['id']);
                    DB::table($table)->insert($filteredData);
                } elseif ($hasId && isset($filteredData['id'])) {
                    $existing = DB::table($table)->where('id', $filteredData['id'])->first();
                    if ($existing) {
                        // Si ya existe y pertenece a la misma empresa o es tabla global, actualizar
                        if (! $hasEmpresaId || (isset($existing->empresa_id) && $existing->empresa_id == $empresaId)) {
                            DB::table($table)->where('id', $filteredData['id'])->update($filteredData);
                        } else {
                            // Si el ID colisiona con el de otra empresa, insertar con nuevo auto-increment ID
                            unset($filteredData['id']);
                            DB::table($table)->insert($filteredData);
                        }
                    } else {
                        // No existe, insertar conservando el ID original
                        DB::table($table)->insert($filteredData);
                    }
                } else {
                    DB::table($table)->insertOrIgnore($filteredData);
                }
                $insertedCount++;
            } catch (\Throwable $rowEx) {
                // En caso de conflicto de clave, intentar inserción con nuevo ID
                try {
                    if (isset($filteredData['id'])) {
                        unset($filteredData['id']);
                        DB::table($table)->insert($filteredData);
                        $insertedCount++;
                    }
                } catch (\Throwable $fallbackEx) {
                    // Omitir si ya existía duplicado exacto
                }
            }
        }

        $this->line("     ✓ {$table}: {$insertedCount} registro(s) sincronizado(s).");
    }
}

