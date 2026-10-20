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
            'empleados.view' => ['slug' => 'Ver empleados', 'module' => 'empleados', 'sector' => 'administracion'],
            'empleados.create' => ['slug' => 'Crear empleados', 'module' => 'empleados', 'sector' => 'administracion'],
            'empleados.edit' => ['slug' => 'Editar empleados', 'module' => 'empleados', 'sector' => 'administracion'],
            'empleados.delete' => ['slug' => 'Eliminar empleados', 'module' => 'empleados', 'sector' => 'administracion'],

            'comisiones.view' => ['slug' => 'Ver comisiones de ventas', 'module' => 'comisiones', 'sector' => 'administracion'],
            'comisiones.pay' => ['slug' => 'Pagar y liquidar comisiones', 'module' => 'comisiones', 'sector' => 'administracion'],
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
            'empleados.view',
            'empleados.create',
            'empleados.edit',
            'empleados.delete',
            'comisiones.view',
            'comisiones.pay',
        ])->delete();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
};
