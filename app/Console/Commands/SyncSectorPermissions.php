<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;

class SyncSectorPermissions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'permissions:sync-sectors 
                            {--show : Mostrar permisos organizados por sectores}
                            {--migrate : Migrar permisos existentes a sectores}
                            {--reset : Resetear todos los sectores}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincronizar y organizar permisos por sectores';

    /**
     * Mapeo de permisos a sectores para migración
     */
    protected $sectorMapping = [
        'medico' => [
            'tipo-consultas', 'pacientes', 'medicos', 'citas',
            'especialidades', 'subespecialidades', 'medico-horarios',
        ],
        'administracion' => [
            'cajas', 'pagos', 'conceptos_pago', 'exchange-rates',
            'series', 'reglas mora', 'late-payment-rules',
        ],
        'configuracion' => [
            'empresas', 'sucursales', 'paises', 'users',
            'roles', 'permissions', 'regional-configuration', 'template-customization',
        ],
        'monitoreo' => [
            'active sessions', 'activity log', 'database export',
            'monitoreo', 'notifications', 'dashboard',
        ],
        'whatsapp' => [
            'whatsapp', 'whatsapp templates', 'whatsapp messages',
            'whatsapp statistics', 'whatsapp retry',
        ],
        'sistema' => [
            'system', 'api', 'jwt',
        ],
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if ($this->option('show')) {
            $this->showSectors();

            return;
        }

        if ($this->option('reset')) {
            $this->resetSectors();
            $this->info('✅ Sectores reseteados exitosamente');

            return;
        }

        if ($this->option('migrate')) {
            $this->migrateExistingPermissions();
            $this->info('✅ Permisos migrados a sectores exitosamente');

            return;
        }

        $this->info('🔄 Sincronizando permisos por sectores...');
        $this->syncSectors();
        $this->info('✅ Sincronización completada');
    }

    /**
     * Mostrar permisos organizados por sectores
     */
    protected function showSectors(): void
    {
        $this->info('📊 Permisos organizados por sectores:');
        $this->newLine();

        $sectors = Permission::whereNotNull('sector')
            ->select('sector', 'sector_name', \DB::raw('COUNT(*) as total'))
            ->groupBy('sector', 'sector_name')
            ->orderBy('sector')
            ->get();

        if ($sectors->isEmpty()) {
            $this->warn('⚠️ No hay permisos con sectores asignados');

            return;
        }

        $headers = ['Sector', 'Nombre', 'Total de Permisos'];
        $rows = $sectors->map(function ($sector) {
            return [
                $sector->sector,
                $sector->sector_name ?? $this->getSectorEmoji($sector->sector),
                $sector->total,
            ];
        });

        $this->table($headers, $rows);

        // Mostrar detalles por sector
        foreach ($sectors as $sector) {
            $this->newLine();
            $this->info("📋 {$sector->sector_name} ({$sector->sector}):");

            $permissions = Permission::where('sector', $sector->sector)
                ->select('name', 'module')
                ->orderBy('module')
                ->orderBy('name')
                ->get()
                ->groupBy('module');

            foreach ($permissions as $module => $modulePermissions) {
                $this->line("  📁 {$module}:");
                foreach ($modulePermissions as $permission) {
                    $this->line("    - {$permission->name}");
                }
            }
        }
    }

    /**
     * Migrar permisos existentes a sectores
     */
    protected function migrateExistingPermissions(): void
    {
        $this->info('🔄 Migrando permisos existentes a sectores...');

        $permissions = Permission::whereNull('sector')->get();
        $migrated = 0;

        foreach ($permissions as $permission) {
            $sector = $this->determineSector($permission->name);

            if ($sector) {
                $permission->update([
                    'sector' => $sector,
                    'sector_name' => $this->getSectorName($sector),
                ]);
                $migrated++;
            }
        }

        $this->info("✅ {$migrated} permisos migrados a sectores");
    }

    /**
     * Determinar el sector basado en el nombre del permiso
     */
    protected function determineSector(string $permissionName): ?string
    {
        foreach ($this->sectorMapping as $sector => $modules) {
            foreach ($modules as $module) {
                if (str_contains(strtolower($permissionName), $module)) {
                    return $sector;
                }
            }
        }

        // Lógica adicional para permisos específicos
        if (str_contains($permissionName, 'cita')) {
            return 'medico';
        }
        if (str_contains($permissionName, 'pago')) {
            return 'administracion';
        }
        if (str_contains($permissionName, 'user')) {
            return 'configuracion';
        }
        if (str_contains($permissionName, 'session')) {
            return 'monitoreo';
        }
        if (str_contains($permissionName, 'whatsapp')) {
            return 'comunicaciones';
        }

        return 'sistema'; // Por defecto
    }

    /**
     * Sincronizar sectores
     */
    protected function syncSectors(): void
    {
        // Aquí puedes agregar lógica adicional de sincronización
        $this->migrateExistingPermissions();
    }

    /**
     * Resetear sectores
     */
    protected function resetSectors(): void
    {
        Permission::whereNotNull('sector')->update([
            'sector' => null,
            'sector_name' => null,
        ]);
    }

    /**
     * Obtener nombre del sector con emoji
     */
    protected function getSectorName(string $sector): string
    {
        $names = [
            'medico' => '🏥 Médico',
            'administracion' => '💰 Administración',
            'configuracion' => '⚙️ Configuración',
            'monitoreo' => '📊 Monitoreo',
            'whatsapp' => '📱 WhatsApp',
            'comunicaciones' => '📢 Comunicaciones',
            'sistema' => '🔧 Sistema',
        ];

        return $names[$sector] ?? ucfirst($sector);
    }

    /**
     * Obtener emoji del sector
     */
    protected function getSectorEmoji(string $sector): string
    {
        $emojis = [
            'medico' => '🏥',
            'administracion' => '💰',
            'configuracion' => '⚙️',
            'monitoreo' => '📊',
            'whatsapp' => '📱',
            'comunicaciones' => '📢',
            'sistema' => '🔧',
        ];

        return $emojis[$sector] ?? '📋';
    }
}
