<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'reparaciones.view' => ['slug' => 'Ver Ordenes de Reparación', 'module' => 'reparaciones', 'sector' => 'punto_de_venta'],
            'reparaciones.create' => ['slug' => 'Recepcionar Equipos', 'module' => 'reparaciones', 'sector' => 'punto_de_venta'],
            'reparaciones.edit' => ['slug' => 'Editar / Diagnosticar Reparaciones', 'module' => 'reparaciones', 'sector' => 'punto_de_venta'],
            'reparaciones.delete' => ['slug' => 'Eliminar Ordenes de Reparación', 'module' => 'reparaciones', 'sector' => 'punto_de_venta'],
            'reparaciones.assign_repuesto' => ['slug' => 'Asignar Repuestos de Inventario', 'module' => 'reparaciones', 'sector' => 'punto_de_venta'],
            'reparaciones.change_status' => ['slug' => 'Cambiar Estado de Reparación', 'module' => 'reparaciones', 'sector' => 'punto_de_venta'],
        ];

        $createdPermissions = [];
        foreach ($permissions as $name => $meta) {
            $createdPermissions[] = Permission::updateOrCreate(
                ['name' => $name, 'guard_name' => 'web'],
                [
                    'slug' => $meta['slug'],
                    'module' => $meta['module'],
                    'sector' => $meta['sector'],
                ]
            );
        }

        // Dar permisos a Super Administrador (empresa 1)
        $superAdmin = Role::where('name', 'Super Administrador')->first();
        if ($superAdmin) {
            $superAdmin->givePermissionTo(array_keys($permissions));
        }

        // Crear Rol Técnico de Reparaciones
        $tecnicoRole = Role::firstOrCreate(
            ['name' => 'Técnico de Reparaciones', 'guard_name' => 'web', 'empresa_id' => 1]
        );

        $tecnicoPerms = [
            'dashboard.view',
            'reparaciones.view',
            'reparaciones.create',
            'reparaciones.edit',
            'reparaciones.assign_repuesto',
            'reparaciones.change_status',
            'productos.view',
            'clientes.view',
            'servicios.view',
        ];

        $tecnicoRole->syncPermissions(
            Permission::whereIn('name', $tecnicoPerms)->get()
        );

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }

    public function down(): void
    {
        Permission::whereIn('name', [
            'reparaciones.view',
            'reparaciones.create',
            'reparaciones.edit',
            'reparaciones.delete',
            'reparaciones.assign_repuesto',
            'reparaciones.change_status',
        ])->delete();

        Role::where('name', 'Técnico de Reparaciones')->delete();
    }
};
