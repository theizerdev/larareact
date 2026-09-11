<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Services\Tenancy\TenantManager;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class PruneExpiredTenantsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenants:prune-expired 
                            {--dry-run : Simular el proceso de purga sin eliminar datos ni bases de datos} 
                            {--days=10 : Días de gracia transcurridos desde el vencimiento antes de la purga}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Respalda y elimina de forma definitiva empresas cuyos planes o períodos de prueba lleven al menos 10 días vencidos';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $graceDays = (int) $this->option('days');

        $cutoffDate = now()->subDays($graceDays);

        $this->info("🔍 Buscando empresas con suscripción o prueba vencida antes de: {$cutoffDate->toDateTimeString()} (Gracia: {$graceDays} días)...");

        $allEmpresas = Empresa::withoutGlobalScopes()
            ->where('id', '!=', 1)
            ->with(['subscriptions'])
            ->get();

        $expiredEmpresas = collect();
        $inGracePeriodEmpresas = collect();

        foreach ($allEmpresas as $empresa) {
            if ($empresa->isExemptFromSubscription()) {
                continue;
            }

            $sub = $empresa->getLatestSubscriptionRecord();
            $fechaVencimiento = $sub?->fecha_vencimiento
                ?? $empresa->subscription_expires_at
                ?? $empresa->trial_ends_at;

            if (! $fechaVencimiento) {
                continue;
            }

            // Si ya venció
            if (now()->gt($fechaVencimiento)) {
                $diasVencida = (int) $fechaVencimiento->diffInDays(now());

                if ($fechaVencimiento->lte($cutoffDate)) {
                    $empresa->dias_vencida = $diasVencida;
                    $empresa->fecha_vencimiento_real = $fechaVencimiento;
                    $expiredEmpresas->push($empresa);
                } else {
                    $diasRestantesGracia = $graceDays - $diasVencida;
                    $empresa->dias_vencida = $diasVencida;
                    $empresa->dias_restantes_gracia = $diasRestantesGracia;
                    $empresa->fecha_vencimiento_real = $fechaVencimiento;
                    $inGracePeriodEmpresas->push($empresa);
                }
            }
        }

        if ($inGracePeriodEmpresas->isNotEmpty()) {
            $this->newLine();
            $this->warn("⏳ Empresas vencidas actualmente en período de gracia (menos de {$graceDays} días vencidas):");
            $graceRows = $inGracePeriodEmpresas->map(fn ($e) => [
                $e->id,
                $e->razon_social,
                $e->fecha_vencimiento_real->format('d/m/Y'),
                "{$e->dias_vencida} día(s) vencida",
                "Le quedan {$e->dias_restantes_gracia} día(s) de gracia antes de ser eliminada",
            ])->toArray();
            $this->table(['ID', 'Empresa', 'Vencimiento', 'Tiempo Vencida', 'Estado de Gracia'], $graceRows);
        }

        if ($expiredEmpresas->isEmpty()) {
            $this->info('✅ No se encontraron empresas vencidas para depurar.');
            return Command::SUCCESS;
        }

        $this->warn("⚠️  Se encontraron {$expiredEmpresas->count()} empresas para depurar.");

        $backupDir = storage_path('app/backups/expired_companies');
        if (! File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        foreach ($expiredEmpresas as $empresa) {
            $this->line("👉 Procesando Empresa ID: {$empresa->id} ({$empresa->razon_social})");

            if ($dryRun) {
                $this->info("   [DRY-RUN] Se respaldarían y eliminarían todos los datos de la Empresa ID {$empresa->id}.");
                continue;
            }

            try {
                // 1. Generar respaldo de datos en JSON antes de eliminar
                $timestamp = now()->format('Ymd_His');
                $backupFile = "{$backupDir}/empresa_{$empresa->id}_{$timestamp}.json";
                $backupData = [
                    'empresa' => (array) $empresa,
                    'users' => DB::table('users')->where('empresa_id', $empresa->id)->get()->toArray(),
                    'sucursales' => DB::table('sucursales')->where('empresa_id', $empresa->id)->get()->toArray(),
                    'subscriptions' => Schema::hasTable('subscriptions') 
                        ? DB::table('subscriptions')->where('empresa_id', $empresa->id)->get()->toArray() 
                        : [],
                    'pruned_at' => now()->toDateTimeString(),
                    'reason' => "Vencimiento tras {$graceDays} días de gracia",
                ];
                File::put($backupFile, json_encode($backupData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

                // 2. Desconectar y liberar instancia de WhatsApp
                try {
                    $empresaModel = Empresa::withoutGlobalScopes()->find($empresa->id);
                    if ($empresaModel && $empresaModel->whatsapp_instance) {
                        $wsService = WhatsAppService::forCompany($empresaModel);
                        $wsService->disconnect();
                    }
                } catch (\Throwable $we) {
                    Log::warning("No se pudo desconectar WhatsApp para la empresa {$empresa->id}: " . $we->getMessage());
                }

                // Desactivar logging de actividad durante la eliminación
                if (function_exists('activity')) {
                    activity()->disableLogging();
                }

                // 3. Eliminar relaciones y registros en base de datos
                DB::statement('SET FOREIGN_KEY_CHECKS=0;');

                DB::transaction(function () use ($empresa) {
                    $companyId = $empresa->id;
                    $userIds = DB::table('users')->where('empresa_id', $companyId)->pluck('id')->toArray();
                    $roleIds = DB::table('roles')->where('empresa_id', $companyId)->pluck('id')->toArray();

                    if (! empty($userIds)) {
                        DB::table('model_has_roles')->whereIn('model_id', $userIds)->delete();
                        DB::table('model_has_permissions')->whereIn('model_id', $userIds)->delete();
                        if (Schema::hasTable('activity_log')) {
                            DB::table('activity_log')
                                ->whereIn('causer_id', $userIds)
                                ->orWhereIn('subject_id', $userIds)
                                ->orWhere('empresa_id', $companyId)
                                ->delete();
                        }
                    }

                    if (! empty($roleIds)) {
                        DB::table('role_has_permissions')->whereIn('role_id', $roleIds)->delete();
                        DB::table('roles')->whereIn('id', $roleIds)->delete();
                    }

                    // Tablas dependientes con empresa_id
                    $tables = DB::select('SHOW TABLES');
                    $dbName = DB::getDatabaseName();
                    $key = 'Tables_in_' . $dbName;

                    foreach ($tables as $tableObj) {
                        $tableName = $tableObj->$key;
                        if ($tableName === 'empresas') {
                            continue;
                        }

                        if (Schema::hasColumn($tableName, 'empresa_id')) {
                            DB::table($tableName)->where('empresa_id', $companyId)->delete();
                        }
                    }

                    // Eliminar registro de la empresa
                    DB::table('empresas')->where('id', $companyId)->delete();
                });

                // 4. Si existía alguna base de datos tenant física, eliminarla también
                try {
                    if (TenantManager::databaseExists($empresa->id)) {
                        TenantManager::dropTenantDatabase($empresa->id);
                    }
                } catch (\Throwable $te) {
                    Log::warning("No se pudo eliminar BD tenant física {$empresa->id}: " . $te->getMessage());
                }

                Log::info("Empresa {$empresa->id} ({$empresa->razon_social}) eliminada y depurada tras {$graceDays} días vencida.");
                $this->info("   ✅ Empresa ID {$empresa->id} respaldada y eliminada completamente.");
            } catch (\Throwable $e) {
                Log::error("Error al depurar empresa {$empresa->id}: " . $e->getMessage());
                $this->error("   ❌ Error al depurar Empresa ID {$empresa->id}: " . $e->getMessage());
            } finally {
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            }
        }

        // Limpiar caché de permisos
        try {
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        } catch (\Throwable $e) {
            // Ignorar
        }

        $this->info('🎉 Proceso de purga de clientes vencidos finalizado.');
        return Command::SUCCESS;
    }
}
