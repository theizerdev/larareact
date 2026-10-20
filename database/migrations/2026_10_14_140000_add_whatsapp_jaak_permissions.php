<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'whatsapp.view' => ['slug' => 'Ver WhatsApp', 'module' => 'integraciones', 'sector' => 'configuracion'],
            'whatsapp.manage' => ['slug' => 'Gestionar WhatsApp', 'module' => 'integraciones', 'sector' => 'configuracion'],
            'jaak.view' => ['slug' => 'Ver Validaciones JAAK', 'module' => 'integraciones', 'sector' => 'configuracion'],
            'jaak.manage' => ['slug' => 'Gestionar Validaciones JAAK', 'module' => 'integraciones', 'sector' => 'configuracion'],
        ];

        foreach ($permissions as $name => $meta) {
            Permission::updateOrCreate(
                ['name' => $name, 'guard_name' => 'web'],
                [
                    'slug' => $meta['slug'],
                    'module' => $meta['module'],
                    'sector' => $meta['sector'],
                ]
            );
        }

        $roleNames = ['Super Administrador', 'super-admin', 'Super Admin', 'Administrador'];
        $roles = Role::whereIn('name', $roleNames)->get();
        foreach ($roles as $role) {
            $role->givePermissionTo(array_keys($permissions));
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Permission::whereIn('name', [
            'whatsapp.view',
            'whatsapp.manage',
            'jaak.view',
            'jaak.manage',
        ])->delete();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
};
