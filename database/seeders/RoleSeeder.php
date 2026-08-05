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

        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
