<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'nomina.view' => ['slug' => 'Ver nómina', 'module' => 'nomina', 'sector' => 'administracion'],
            'nomina.create' => ['slug' => 'Generar nómina', 'module' => 'nomina', 'sector' => 'administracion'],
            'nomina.edit' => ['slug' => 'Editar detalles de nómina', 'module' => 'nomina', 'sector' => 'administracion'],
            'nomina.close' => ['slug' => 'Cerrar nómina', 'module' => 'nomina', 'sector' => 'administracion'],
            'nomina.pay' => ['slug' => 'Marcar pagos de nómina', 'module' => 'nomina', 'sector' => 'administracion'],
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

    public function down(): void
    {
        Permission::whereIn('name', [
            'nomina.view',
            'nomina.create',
            'nomina.edit',
            'nomina.close',
            'nomina.pay',
        ])->delete();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
};
