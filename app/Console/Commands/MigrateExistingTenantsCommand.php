<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Services\Tenancy\TenantManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MigrateExistingTenantsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenants:migrate-data {empresa_id? : ID de la empresa a migrar} {--all : Migrar todas las empresas existentes} {--paid-only : Migrar únicamente empresas con plan activo/pagado}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate data of existing companies from landlord central DB to dedicated tenant databases without data loss';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $targetId = $this->argument('empresa_id');
        $all = $this->option('all');
        $paidOnly = $this->option('paid-only');

        $query = DB::connection('landlord')->table('empresas');

        if ($targetId) {
            $query->where('id', $targetId);
        } elseif ($paidOnly) {
            $query->where('subscription_status', 'active');
        } elseif (! $all) {
            $this->info('Indica el ID de una empresa o usa --all / --paid-only.');
            $this->line('Ejemplos:');
            $this->line('  php artisan tenants:migrate-data 2');
            $this->line('  php artisan tenants:migrate-data --all');
            $this->line('  php artisan tenants:migrate-data --paid-only');
            return Command::INVALID;
        }

        $empresas = $query->get();

        if ($empresas->isEmpty()) {
            $this->error('No se encontraron empresas para migrar con los criterios especificados.');
            return Command::FAILURE;
        }

        $this->info("Iniciando migración para {$empresas->count()} empresa(s)...");

        foreach ($empresas as $empresa) {
            $this->migrateEmpresa($empresa);
        }

        $this->newLine();
        $this->info('✓ Proceso de migración de datos completado exitosamente.');

        return Command::SUCCESS;
    }

    /**
     * Migrate all data for a single company into its dedicated database.
     */
    protected function migrateEmpresa(object $empresa): void
    {
        $empresaId = (int) $empresa->id;
        $dbName = TenantManager::getDatabaseName($empresaId);

        $this->newLine();
        $this->alert("Migrando Empresa ID: {$empresaId} ({$empresa->razon_social}) -> Base de datos: {$dbName}");

        // 1. Crear BD física si no existe
        if (! TenantManager::databaseExists($empresaId)) {
            $this->line('1. Creando base de datos...');
            TenantManager::createTenantDatabase($empresaId);
            $this->info('   ✓ Base de datos física creada.');
        } else {
            $this->line('1. La base de datos física ya existe.');
        }

        // 2. Ejecutar migraciones tenant
        $this->line('2. Ejecutando migraciones de inquilino...');
        TenantManager::migrateTenant($empresaId);
        $this->info('   ✓ Esquema de tablas creado y actualizado.');

        // 3. Copiar datos tabla por tabla manteniendo integridad
        $this->line('3. Transfiriendo datos desde la base central...');

        TenantManager::executeInTenant($empresaId, function () use ($empresaId) {
            // Desactivar restricciones de clave foránea temporalmente durante la carga
            DB::statement('SET FOREIGN_KEY_CHECKS = 0;');

            // Mapeo y copia de tablas
            $this->copyTableDirect('sucursales', ['empresa_id' => $empresaId]);
            
            // Permisos y Roles
            $this->copyPermissionsAndRoles($empresaId);

            // Catálogo
            $this->copyTableDirect('categorias', ['empresa_id' => $empresaId]);
            $this->copyTableDirect('marcas', ['empresa_id' => $empresaId]);
            $this->copyTableDirect('familias', ['empresa_id' => $empresaId]);
            $this->copyTableDirect('modelos', ['empresa_id' => $empresaId]);
            $this->copyTableDirect('servicios', ['empresa_id' => $empresaId]);
            $this->copyTableDirect('productos', ['empresa_id' => $empresaId]);

            // Cajas y Ventas
            $this->copyTableDirect('cash_registers', ['empresa_id' => $empresaId]);
            $this->copyTableDirect('cash_movements', ['empresa_id' => $empresaId]);
            $this->copyTableDirect('sales', ['empresa_id' => $empresaId]);
            $this->copySaleRelatedTables($empresaId);
            $this->copyTableDirect('held_sales', ['empresa_id' => $empresaId]);
            $this->copyTableDirect('sales_goals', ['empresa_id' => $empresaId]);
            $this->copyTableDirect('inventory_movements', ['empresa_id' => $empresaId]);

            // Clientes y Créditos
            $this->copyTableDirect('clientes', ['empresa_id' => $empresaId]);
            $this->copyTableDirect('credit_policies', ['empresa_id' => $empresaId]);
            $this->copyTableDirect('credit_logs', ['empresa_id' => $empresaId]);

            // Proveedores y Compras
            $this->copyTableDirect('proveedores', ['empresa_id' => $empresaId]);
            $this->copyTableDirect('cierres_mensuales', ['empresa_id' => $empresaId]);
            $this->copyTableDirect('compras', ['empresa_id' => $empresaId]);
            $this->copyCompraRelatedTables($empresaId);

            // Reparaciones
            $this->copyTableDirect('reparacion_checklist_items', ['empresa_id' => $empresaId]);
            $this->copyTableDirect('ordenes_reparacion', ['empresa_id' => $empresaId]);
            $this->copyReparacionRelatedTables($empresaId);

            // Contabilidad y Nóminas
            $this->copyTableDirect('cuentas_contables', ['empresa_id' => $empresaId]);
            $this->copyTableDirect('asientos_contables', ['empresa_id' => $empresaId]);
            $this->copyAsientoRelatedTables($empresaId);
            $this->copyTableDirect('configuraciones_contables', ['empresa_id' => $empresaId]);
            $this->copyTableDirect('nominas', ['empresa_id' => $empresaId]);
            $this->copyNominaRelatedTables($empresaId);

            // WhatsApp y Logs
            $this->copyTableDirect('whatsapp_templates', ['empresa_id' => $empresaId]);
            $this->copyTableDirect('activity_log', ['empresa_id' => $empresaId]);

            // Reactivar restricciones de clave foránea
            DB::statement('SET FOREIGN_KEY_CHECKS = 1;');
        });

        // 4. Actualizar estado de la empresa en la base central
        DB::connection('landlord')
            ->table('empresas')
            ->where('id', $empresaId)
            ->update([
                'db_name' => $dbName,
                'db_status' => 'ready',
            ]);

        $this->info("   ✓ Empresa ID {$empresaId} migrada a {$dbName} exitosamente.");
    }

    /**
     * Insert or update a row in tenant table filtering out columns that do not exist in the tenant schema.
     */
    protected function insertFilteredRow(string $table, array $data, array $matchKeys = ['id']): void
    {
        $columns = Schema::getColumnListing($table);
        $filtered = array_intersect_key($data, array_flip($columns));
        $match = array_intersect_key($data, array_flip($matchKeys));

        if (empty($match) && isset($filtered['id'])) {
            $match = ['id' => $filtered['id']];
        }

        DB::table($table)->updateOrInsert($match, $filtered);
    }

    /**
     * Copy table records directly based on conditions.
     */
    protected function copyTableDirect(string $table, array $where = []): void
    {
        if (! Schema::connection('landlord')->hasTable($table) || ! Schema::hasTable($table)) {
            return;
        }

        $query = DB::connection('landlord')->table($table);
        foreach ($where as $col => $val) {
            if (Schema::connection('landlord')->hasColumn($table, $col)) {
                $query->where($col, $val);
            }
        }

        $records = $query->get();

        if ($records->isNotEmpty()) {
            foreach ($records as $record) {
                $this->insertFilteredRow($table, (array) $record);
            }
            $this->line("   - {$table}: {$records->count()} registros copiados.");
        }
    }

    /**
     * Copy Spatie permissions and roles for this tenant.
     */
    protected function copyPermissionsAndRoles(int $empresaId): void
    {
        // 1. Permisos globales
        $permissions = DB::connection('landlord')->table('permissions')->get();
        foreach ($permissions as $p) {
            $this->insertFilteredRow('permissions', (array) $p);
        }

        // 2. Roles del tenant
        $roles = DB::connection('landlord')->table('roles')->where('empresa_id', $empresaId)->get();
        $roleIds = $roles->pluck('id')->toArray();

        foreach ($roles as $r) {
            $this->insertFilteredRow('roles', (array) $r);
        }

        // 3. Relaciones role_has_permissions
        if (! empty($roleIds)) {
            $rolePerms = DB::connection('landlord')->table('role_has_permissions')->whereIn('role_id', $roleIds)->get();
            foreach ($rolePerms as $rp) {
                $data = (array) $rp;
                $this->insertFilteredRow('role_has_permissions', $data, ['permission_id', 'role_id']);
            }

            // 4. Relaciones model_has_roles
            $modelRoles = DB::connection('landlord')->table('model_has_roles')
                ->where('empresa_id', $empresaId)
                ->orWhereIn('role_id', $roleIds)
                ->get();

            foreach ($modelRoles as $mr) {
                $data = (array) $mr;
                if (! isset($data['empresa_id'])) {
                    $data['empresa_id'] = $empresaId;
                }
                $this->insertFilteredRow('model_has_roles', $data, ['role_id', 'model_type', 'model_id', 'empresa_id']);
            }
        }
    }

    /**
     * Copy sale items and payments.
     */
    protected function copySaleRelatedTables(int $empresaId): void
    {
        $saleIds = DB::connection('landlord')->table('sales')->where('empresa_id', $empresaId)->pluck('id')->toArray();

        if (! empty($saleIds)) {
            $items = DB::connection('landlord')->table('sale_items')->whereIn('sale_id', $saleIds)->get();
            foreach ($items as $item) {
                $this->insertFilteredRow('sale_items', (array) $item);
            }

            $payments = DB::connection('landlord')->table('sale_payments')->whereIn('sale_id', $saleIds)->get();
            foreach ($payments as $payment) {
                $this->insertFilteredRow('sale_payments', (array) $payment);
            }

            $creditPayments = DB::connection('landlord')->table('credit_payments')->whereIn('sale_id', $saleIds)->get();
            foreach ($creditPayments as $cp) {
                $this->insertFilteredRow('credit_payments', (array) $cp);
            }
        }
    }

    /**
     * Copy purchase items and payments.
     */
    protected function copyCompraRelatedTables(int $empresaId): void
    {
        $compraIds = DB::connection('landlord')->table('compras')->where('empresa_id', $empresaId)->pluck('id')->toArray();

        if (! empty($compraIds)) {
            $items = DB::connection('landlord')->table('compra_items')->whereIn('compra_id', $compraIds)->get();
            foreach ($items as $item) {
                $this->insertFilteredRow('compra_items', (array) $item);
            }

            $pagos = DB::connection('landlord')->table('compra_pagos')->whereIn('compra_id', $compraIds)->get();
            foreach ($pagos as $pago) {
                $this->insertFilteredRow('compra_pagos', (array) $pago);
            }
        }
    }

    /**
     * Copy repair items, history, photos.
     */
    protected function copyReparacionRelatedTables(int $empresaId): void
    {
        $ordenIds = DB::connection('landlord')->table('ordenes_reparacion')->where('empresa_id', $empresaId)->pluck('id')->toArray();

        if (! empty($ordenIds)) {
            $items = DB::connection('landlord')->table('orden_reparacion_items')->whereIn('orden_id', $ordenIds)->get();
            foreach ($items as $item) {
                $this->insertFilteredRow('orden_reparacion_items', (array) $item);
            }

            $historial = DB::connection('landlord')->table('orden_reparacion_historial')->whereIn('orden_id', $ordenIds)->get();
            foreach ($historial as $h) {
                $this->insertFilteredRow('orden_reparacion_historial', (array) $h);
            }

            $fotos = DB::connection('landlord')->table('orden_reparacion_fotos')->whereIn('orden_id', $ordenIds)->get();
            foreach ($fotos as $f) {
                $this->insertFilteredRow('orden_reparacion_fotos', (array) $f);
            }
        }
    }

    /**
     * Copy accounting entry details (apuntes contables).
     */
    protected function copyAsientoRelatedTables(int $empresaId): void
    {
        $asientoIds = DB::connection('landlord')->table('asientos_contables')->where('empresa_id', $empresaId)->pluck('id')->toArray();

        if (! empty($asientoIds)) {
            $apuntes = DB::connection('landlord')->table('apuntes_contables')->whereIn('asiento_id', $asientoIds)->get();
            foreach ($apuntes as $apunte) {
                $this->insertFilteredRow('apuntes_contables', (array) $apunte);
            }
        }
    }

    /**
     * Copy payroll details (nomina detalles).
     */
    protected function copyNominaRelatedTables(int $empresaId): void
    {
        $nominaIds = DB::connection('landlord')->table('nominas')->where('empresa_id', $empresaId)->pluck('id')->toArray();

        if (! empty($nominaIds)) {
            $detalles = DB::connection('landlord')->table('nomina_detalles')->whereIn('nomina_id', $nominaIds)->get();
            foreach ($detalles as $detalle) {
                $this->insertFilteredRow('nomina_detalles', (array) $detalle, ['nomina_id', 'user_id']);
            }
        }
    }
}
