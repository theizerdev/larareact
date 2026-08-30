<?php

namespace App\Services\Tenancy;

use App\Models\Empresa;
use Closure;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TenantManager
{
    protected static ?int $currentTenantId = null;
    protected static ?Empresa $currentTenant = null;
    protected static ?string $previousDefaultConnection = null;

    /**
     * Get the database name for a specific tenant ID.
     */
    public static function getDatabaseName(int|string $tenantId): string
    {
        return 'fixsale_tenant_' . $tenantId;
    }

    /**
     * Get the currently active tenant ID.
     */
    public static function currentTenantId(): ?int
    {
        return self::$currentTenantId;
    }

    /**
     * Get the currently active tenant Empresa model.
     */
    public static function currentTenant(): ?Empresa
    {
        if (! self::$currentTenant && self::$currentTenantId) {
            self::$currentTenant = DB::connection('landlord')
                ->table('empresas')
                ->where('id', self::$currentTenantId)
                ->first();
        }

        return self::$currentTenant;
    }

    /**
     * Switch active database connection and context to the given tenant.
     */
    public static function switchTo(Empresa|int|string $tenant): void
    {
        $tenantId = $tenant instanceof Empresa ? $tenant->id : (int) $tenant;
        $dbName = self::getDatabaseName($tenantId);

        // Store original default connection if not already stored
        if (self::$previousDefaultConnection === null) {
            self::$previousDefaultConnection = Config::get('database.default', 'mysql');
        }

        // Configure tenant database connection
        Config::set('database.connections.tenant.database', $dbName);
        DB::purge('tenant');
        DB::reconnect('tenant');
        DB::setDefaultConnection('tenant');

        self::$currentTenantId = $tenantId;
        self::$currentTenant = $tenant instanceof Empresa ? $tenant : null;

        // Set Spatie permission team context if function exists
        if (function_exists('setPermissionsTeamId')) {
            setPermissionsTeamId($tenantId);
        }
    }

    /**
     * Switch back to the central (landlord) database connection.
     */
    public static function switchBackToLandlord(): void
    {
        $landlordConnection = self::$previousDefaultConnection ?: 'mysql';
        
        DB::setDefaultConnection($landlordConnection);
        self::$currentTenantId = null;
        self::$currentTenant = null;

        if (function_exists('setPermissionsTeamId')) {
            setPermissionsTeamId(null);
        }
    }

    /**
     * Execute a callback in the context of a specific tenant and restore state afterwards.
     */
    public static function executeInTenant(Empresa|int|string $tenant, Closure $callback): mixed
    {
        $previousTenantId = self::$currentTenantId;
        $previousConnection = DB::getDefaultConnection();

        try {
            self::switchTo($tenant);
            return $callback();
        } finally {
            if ($previousTenantId !== null) {
                self::switchTo($previousTenantId);
            } else {
                DB::setDefaultConnection($previousConnection);
                self::$currentTenantId = null;
                self::$currentTenant = null;
            }
        }
    }

    /**
     * Check if a tenant database physically exists in MySQL.
     */
    public static function databaseExists(int|string $tenantId): bool
    {
        $dbName = self::getDatabaseName($tenantId);
        $result = DB::connection('landlord')->select(
            "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?",
            [$dbName]
        );

        return ! empty($result);
    }

    /**
     * Physically create a tenant database in MySQL.
     */
    public static function createTenantDatabase(int|string $tenantId): bool
    {
        $dbName = self::getDatabaseName($tenantId);

        try {
            DB::connection('landlord')->statement(
                "CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            );
            return true;
        } catch (\Throwable $e) {
            Log::error("Error al crear base de datos para tenant {$tenantId}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Drop a tenant database physically from MySQL.
     */
    public static function dropTenantDatabase(int|string $tenantId): bool
    {
        $dbName = self::getDatabaseName($tenantId);

        try {
            DB::purge('tenant');
            DB::connection('landlord')->statement("DROP DATABASE IF EXISTS `{$dbName}`;");
            return true;
        } catch (\Throwable $e) {
            Log::error("Error al eliminar base de datos para tenant {$tenantId}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Run tenant migrations on the tenant database.
     */
    public static function migrateTenant(int|string $tenantId): int
    {
        $tenantId = (int) $tenantId;

        // Ensure database exists before migrating
        if (! self::databaseExists($tenantId)) {
            self::createTenantDatabase($tenantId);
        }

        return self::executeInTenant($tenantId, function () {
            return Artisan::call('migrate', [
                '--database' => 'tenant',
                '--path' => 'database/migrations/tenant',
                '--force' => true,
            ]);
        });
    }

    /**
     * Run tenant seeder on the tenant database.
     */
    public static function seedTenant(int|string $tenantId, ?array $empresaData = []): void
    {
        $tenantId = (int) $tenantId;

        self::executeInTenant($tenantId, function () use ($tenantId, $empresaData) {
            $seeder = new \Database\Seeders\TenantSeeder();
            $seeder->run($tenantId, $empresaData);
        });
    }

    /**
     * Fully provision a new tenant database: create DB, run migrations and seed defaults.
     */
    public static function provisionTenant(int|string $tenantId, ?array $empresaData = []): bool
    {
        $tenantId = (int) $tenantId;

        self::createTenantDatabase($tenantId);
        self::migrateTenant($tenantId);
        self::seedTenant($tenantId, $empresaData);

        return true;
    }
}
