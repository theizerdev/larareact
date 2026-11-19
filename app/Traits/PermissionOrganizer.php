<?php

namespace App\Traits;

use App\Services\PermissionSyncService;
use Spatie\Permission\Models\Permission;

trait PermissionOrganizer
{
    /**
     * Get permissions grouped by sector (ordered) and module.
     */
    public function getPermissionsBySector()
    {
        $syncService = app(PermissionSyncService::class);
        $sectorMeta = $syncService->sectorMeta();

        $permissions = Permission::where('guard_name', 'web')
            ->orderBy('module')
            ->orderBy('id')
            ->get()
            ->map(fn (Permission $permission) => [
                'id' => $permission->id,
                'name' => $permission->name,
                'slug' => $permission->slug ?: $permission->name,
                'sector' => $permission->sector ?: 'sistema',
                'module' => $permission->module ?: 'general',
            ]);

        $grouped = $permissions->groupBy('sector')->map(function ($sectorPermissions) {
            return $sectorPermissions->groupBy('module')->map(fn ($modulePerms) => $modulePerms->values());
        });

        return $grouped->sortBy(function ($_, $sectorKey) use ($sectorMeta) {
            return sprintf('%03d_%s', $sectorMeta[$sectorKey]['order'] ?? 500, $sectorKey);
        });
    }

    /**
     * Get all unique sectors from permissions.
     */
    public function getSectors()
    {
        return Permission::distinct()->pluck('sector')->filter()->values();
    }

    /**
     * Get all unique modules from permissions.
     */
    public function getModules()
    {
        return Permission::distinct()->pluck('module')->filter()->values();
    }

    /**
     * Get module display name.
     */
    public function getModuleDisplayName(string $module): string
    {
        $moduleMeta = app(PermissionSyncService::class)->moduleMeta();

        return $moduleMeta[$module] ?? ucfirst(str_replace('_', ' ', $module));
    }
}
