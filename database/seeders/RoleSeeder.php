<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    /**
     * Seed the roles and assign permissions.
     */
    public function run(): void
    {
        // Super-admin: all permissions (bypassed via Gate::before)
        $superAdmin = Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);
        $superAdmin->syncPermissions(Permission::all());

        // Admin: all except roles/groups management
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->syncPermissions(
            Permission::where('module', '!=', 'roles')
                ->where('module', '!=', 'groups')
                ->get()
        );

        // Editor: view all + edit content
        $operador = Role::firstOrCreate(['name' => 'operador', 'guard_name' => 'web']);
        $operador->syncPermissions(
            Permission::whereIn('name', [
                'dashboard.view',
                'users.view',
                'users.edit',
            ])->get()
        );

        // Editor: view all + edit content
        $encargado = Role::firstOrCreate(['name' => 'encargado', 'guard_name' => 'web']);
        $encargado->syncPermissions(
            Permission::whereIn('name', [
                'dashboard.view',
                'users.view',
                'users.edit',
            ])->get()
        );

        // Viewer: only view permissions
        $viewer = Role::firstOrCreate(['name' => 'viewer', 'guard_name' => 'web']);
        $viewer->syncPermissions(
            Permission::where('name', 'like', '%.view')->get()
        );

        // Cliente: storefront customers
        $cliente = Role::firstOrCreate(['name' => 'cliente', 'guard_name' => 'web']);

        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
