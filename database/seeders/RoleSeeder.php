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
        // Super-admin: all permissions for empresa_id 1
        $superAdmin = Role::firstOrCreate(
            ['name' => 'Super Administrador', 'guard_name' => 'web', 'empresa_id' => 1],
            []
        );
        $superAdmin->syncPermissions(Permission::all());

        // Rol Técnico de Reparaciones
        $tecnicoRole = Role::firstOrCreate(
            ['name' => 'Técnico de Reparaciones', 'guard_name' => 'web', 'empresa_id' => 1],
            []
        );
        $tecnicoPermissions = Permission::whereIn('name', [
            'dashboard.view',
            'reparaciones.view',
            'reparaciones.create',
            'reparaciones.edit',
            'reparaciones.assign_repuesto',
            'reparaciones.change_status',
            'productos.view',
            'clientes.view',
            'servicios.view',
        ])->get();
        $tecnicoRole->syncPermissions($tecnicoPermissions);

        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
