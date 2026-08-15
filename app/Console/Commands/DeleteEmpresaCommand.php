<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DeleteEmpresaCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'empresa:delete {empresa_id : ID de la empresa a eliminar} {--force : Forzar eliminación sin confirmación}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Elimina de forma segura y completa una empresa, su instancia de WhatsApp y todos sus datos vinculados, ajustando la secuencia AUTO_INCREMENT';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $companyId = (int) $this->argument('empresa_id');
        $force = $this->option('force');

        $empresa = Empresa::find($companyId);

        if (! $empresa) {
            $this->error("❌ No se encontró la empresa con ID {$companyId}.");
            return Command::FAILURE;
        }

        if ($companyId === 1 && ! $force) {
            $this->alert("⚠️ ADVERTENCIA: Está intentando eliminar la Empresa ID 1 (Empresa Principal SaaS).");
            if (! $this->confirm('¿Está ABSOLUTAMENTE SEGURO de eliminar la empresa principal? Esta acción es irreversible.')) {
                $this->info('Operación cancelada.');
                return Command::SUCCESS;
            }
        }

        if (! $force && ! $this->confirm("¿Está seguro de eliminar la empresa '{$empresa->razon_social}' (ID {$companyId}) y TODOS sus datos vinculados?")) {
            $this->info('Operación cancelada.');
            return Command::SUCCESS;
        }

        $this->info("🚀 Iniciando proceso de eliminación de la empresa '{$empresa->razon_social}' (ID {$companyId})...");

        // 1. Desconectar y eliminar la instancia en el motor de WhatsApp
        try {
            $this->line(" 📱 Desconectando instancia de WhatsApp ('{$empresa->whatsapp_instance}')...");
            $wsService = WhatsAppService::forCompany($empresa);
            $wsRes = $wsService->disconnect();
            if ($wsRes && isset($wsRes['message'])) {
                $this->info("    ✅ WhatsApp Engine: {$wsRes['message']}");
            } else {
                $this->warn("    ⚠️ No se pudo confirmar eliminación en el motor WhatsApp o no existía sesión activa.");
            }
        } catch (\Throwable $e) {
            $this->warn("    ⚠️ Error al conectar con el servidor de WhatsApp: " . $e->getMessage());
        }

        // 2. Transacción de eliminación de datos relacionales en Base de Datos
        $deletedCounts = [];

        try {
            DB::transaction(function () use ($companyId, &$deletedCounts) {
                // Obtener IDs de usuarios y roles asociados a la empresa
                $userIds = DB::table('users')->where('empresa_id', $companyId)->pluck('id')->toArray();
                $roleIds = DB::table('roles')->where('empresa_id', $companyId)->pluck('id')->toArray();

                // Eliminar relaciones Spatie Permissions & Roles
                if (! empty($userIds)) {
                    $deletedCounts['model_has_roles'] = DB::table('model_has_roles')->whereIn('model_id', $userIds)->delete();
                    $deletedCounts['model_has_permissions'] = DB::table('model_has_permissions')->whereIn('model_id', $userIds)->delete();
                    $deletedCounts['activity_log (por usuario)'] = DB::table('activity_log')
                        ->whereIn('causer_id', $userIds)
                        ->orWhereIn('subject_id', $userIds)
                        ->delete();
                }

                if (! empty($roleIds)) {
                    $deletedCounts['role_has_permissions'] = DB::table('role_has_permissions')->whereIn('role_id', $roleIds)->delete();
                    $deletedCounts['roles'] = DB::table('roles')->whereIn('id', $roleIds)->delete();
                }

                // Buscar todas las tablas con columna empresa_id y eliminar sus registros
                $tables = DB::select('SHOW TABLES');
                $dbName = DB::getDatabaseName();
                $key = 'Tables_in_' . $dbName;

                foreach ($tables as $tableObj) {
                    $tableName = $tableObj->$key;
                    if ($tableName === 'empresas') {
                        continue;
                    }

                    if (Schema::hasColumn($tableName, 'empresa_id')) {
                        $count = DB::table($tableName)->where('empresa_id', $companyId)->delete();
                        if ($count > 0) {
                            $deletedCounts[$tableName] = ($deletedCounts[$tableName] ?? 0) + $count;
                        }
                    }
                }

                // Eliminar registro de la tabla empresas
                $deletedCounts['empresas'] = DB::table('empresas')->where('id', $companyId)->delete();
            });

            $this->info(" ✅ Datos relacionales eliminados correctamente de la base de datos.");
        } catch (\Throwable $e) {
            $this->error(" ❌ Error en la eliminación en BD: " . $e->getMessage());
            return Command::FAILURE;
        }

        // 3. Ajustar secuencias de AUTO_INCREMENT para mantener la numeración correlativa limpia (1, 2, 3...)
        $this->info(" 🔄 Reajustando secuencias AUTO_INCREMENT en las tablas afectadas...");
        $sequenceTables = ['empresas', 'users', 'sucursales', 'subscriptions', 'roles', 'activity_log', 'productos', 'clientes', 'proveedores', 'ventas', 'compras', 'cajas'];
        $seqResults = [];

        foreach ($sequenceTables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'id')) {
                $maxId = DB::table($table)->max('id') ?? 0;
                $nextId = $maxId + 1;
                DB::statement("ALTER TABLE `{$table}` AUTO_INCREMENT = {$nextId}");
                $seqResults[] = [$table, $maxId, $nextId];
            }
        }

        // 4. Limpiar caché de permisos
        try {
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        } catch (\Throwable $e) {
            // Ignorar si no está cargado el paquete
        }

        // Resumen final en consola
        $this->newLine();
        $this->info("📊 RESUMEN DE ELIMINACIÓN Y REAJUSTE SECTORIAL:");
        
        $tableData = [];
        foreach ($deletedCounts as $tbl => $cnt) {
            $tableData[] = [$tbl, $cnt];
        }
        $this->table(['Tabla', 'Registros Eliminados'], $tableData);

        $this->newLine();
        $this->info("🔢 ESTADO DE SECUENCIAS AUTO_INCREMENT:");
        $this->table(['Tabla', 'Último ID Existente', 'Próximo ID (AUTO_INCREMENT)'], $seqResults);

        $this->newLine();
        $this->info("✨ Empresa ID {$companyId} eliminada exitosamente. La base de datos y secuencias están 100% optimizadas.");

        return Command::SUCCESS;
    }
}
