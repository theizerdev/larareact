<?php

namespace App\Traits;

use Spatie\Permission\Models\Permission;

trait PermissionOrganizer
{
    /**
     * Get permissions grouped by sector and module
     */
    public function getPermissionsBySector()
    {
        $permissions = Permission::orderBy('sector')->orderBy('module')->orderBy('name')->get();
        
        return $permissions->groupBy('sector')->map(function ($sectorPermissions) {
            return $sectorPermissions->groupBy('module');
        });
    }

    /**
     * Get all unique sectors from permissions
     */
    public function getSectors()
    {
        return Permission::distinct()->pluck('sector')->filter()->values();
    }

    /**
     * Get all unique modules from permissions
     */
    public function getModules()
    {
        return Permission::distinct()->pluck('module')->filter()->values();
    }

    /**
     * Get module display name
     */
    public function getModuleDisplayName(string $module): string
    {
        return match($module) {
            'dashboard' => 'Dashboard',
            'usuarios' => 'Usuarios',
            'roles' => 'Roles',
            'grupos' => 'Grupos',
            default => ucfirst($module)
        };
    }
}