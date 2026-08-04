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
        // Super-admin: all permissions
        $superAdmin = Role::firstOrCreate(['name' => 'Super Administrador', 'guard_name' => 'web']);
        $superAdmin->syncPermissions(Permission::all());

        // Admin: all except roles management and SaaS global subscription management
        $admin = Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
        $admin->syncPermissions(
            Permission::where('module', '!=', 'roles')
                ->where('name', '!=', 'subscriptions.manage')
                ->get()
        );

        // Encargado: Full operational and administration permissions
        $encargado = Role::firstOrCreate(['name' => 'encargado', 'guard_name' => 'web']);
        $encargado->syncPermissions(
            Permission::whereIn('sector', ['equipos', 'inventario', 'punto_de_venta', 'administracion'])
                ->orWhereIn('name', [
                    'dashboard.view',
                    'users.view',
                    'users.create',
                    'users.edit',
                    'paises.view',
                    'empresas.view',
                    'sucursales.view',
                    'credit_config.view',
                ])->get()
        );

        // Operador: Technical & Operational access (Equipos, Productos, Inventario, Servicios, Clientes)
        $operador = Role::firstOrCreate(['name' => 'operador', 'guard_name' => 'web']);
        $operador->syncPermissions(
            Permission::whereIn('name', [
                'dashboard.view',
                'categorias.view',
                'marcas.view',
                'familias.view',
                'modelos.view',
                'productos.view',
                'productos.create',
                'productos.edit',
                'inventario.view',
                'servicios.view',
                'servicios.create',
                'servicios.edit',
                'clientes.view',
                'clientes.create',
                'ventas.view',
            ])->get()
        );

        // Cajero: POS Cash Register, Terminal & Customer management
        $cajero = Role::firstOrCreate(['name' => 'Cajero', 'guard_name' => 'web']);
        $cajero->syncPermissions(
            Permission::whereIn('name', [
                'dashboard.view',
                'ventas.terminal',
                'ventas.view',
                'cajas.view',
                'cajas.create',
                'cajas.edit',
                'cajas.close',
                'servicios.view',
                'productos.view',
                'clientes.view',
                'clientes.create',
                'clientes.edit',
                'clientes.abono',
            ])->get()
        );

        // Viewer: Read-only access across all modules
        $viewer = Role::firstOrCreate(['name' => 'viewer', 'guard_name' => 'web']);
        $viewer->syncPermissions(
            Permission::where('name', 'like', '%.view')->get()
        );

        // Cliente: Storefront customer role
        $cliente = Role::firstOrCreate(['name' => 'cliente', 'guard_name' => 'web']);

        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
