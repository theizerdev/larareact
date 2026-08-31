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
        $user = auth()->user();
        $isSuperAdmin = $user && (
            $user->id === 1 ||
            (method_exists($user, 'hasRole') && ($user->hasRole('Super Administrador') || $user->hasRole('super-admin') || $user->hasRole('Super Admin')))
        );

        $query = Permission::orderBy('sector')->orderBy('module')->orderBy('name');

        if (! $isSuperAdmin) {
            $query->where('sector', '!=', 'contabilidad')
                  ->where('module', '!=', 'contabilidad')
                  ->whereNotIn('name', [
                      'monitoreo.server',
                      'monitoreo.view',
                      'subscriptions.manage',
                  ]);
        }

        $permissions = $query->get();

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
        return match ($module) {
            'dashboard' => 'Dashboard',
            'usuarios' => 'Usuarios',
            'roles' => 'Roles',
            'empresas' => 'Empresas',
            'sucursales' => 'Sucursales',
            'suscripciones' => 'Suscripciones',

            default => ucfirst($module)
        };
    }
}
