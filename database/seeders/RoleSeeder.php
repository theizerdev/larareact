<?php

namespace Database\Seeders;

use App\Models\Empresa;
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
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $allPermissions = Permission::all();
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
            'inventario.view',
        ])->get();

        $vendedorPermissions = Permission::whereIn('name', [
            'dashboard.view',
            'pos.view',
            'pos.create',
            'ventas.view',
            'cajas.view',
            'clientes.view',
            'clientes.create',
            'productos.view',
            'reparaciones.view',
            'reparaciones.create',
        ])->get();

        // 1. Super Administrador (Empresa 1)
        $superAdmin = Role::firstOrCreate(
            ['name' => 'Super Administrador', 'guard_name' => 'web', 'empresa_id' => 1],
            []
        );
        $superAdmin->syncPermissions($allPermissions);

        // Crear roles para todas las empresas existentes (Empresa 1, Empresa 2, etc.)
        $empresas = Empresa::all();
        if ($empresas->isEmpty()) {
            $empresas = collect([(object)['id' => 1], (object)['id' => 2]]);
        }

        foreach ($empresas as $empresa) {
            $empresaId = $empresa->id;

            // Rol Administrador (Todos los permisos de la empresa)
            $adminRole = Role::firstOrCreate(
                ['name' => 'Administrador', 'guard_name' => 'web', 'empresa_id' => $empresaId],
                []
            );
            $adminRole->syncPermissions($allPermissions);

            // Rol Técnico (Permisos de Taller y Reparaciones)
            $tecnicoRole = Role::firstOrCreate(
                ['name' => 'Técnico', 'guard_name' => 'web', 'empresa_id' => $empresaId],
                []
            );
            $tecnicoRole->syncPermissions($tecnicoPermissions);

            // Rol Técnico de Reparaciones (Alias)
            $tecnicoRepRole = Role::firstOrCreate(
                ['name' => 'Técnico de Reparaciones', 'guard_name' => 'web', 'empresa_id' => $empresaId],
                []
            );
            $tecnicoRepRole->syncPermissions($tecnicoPermissions);

            // Rol Vendedor / Cajero
            $vendedorRole = Role::firstOrCreate(
                ['name' => 'Vendedor', 'guard_name' => 'web', 'empresa_id' => $empresaId],
                []
            );
            $vendedorRole->syncPermissions($vendedorPermissions);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
