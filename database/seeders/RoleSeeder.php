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

        // Médico / Especialista
        $medico = Role::firstOrCreate(['name' => 'medico', 'guard_name' => 'web']);
        $medico->syncPermissions(
            Permission::whereIn('name', [
                'dashboard.view',
                'pacientes.view',
                'pacientes.create',
                'pacientes.edit',
                'tipos_atencion.view',
                'citas.view',
                'citas.create',
                'citas.edit',
                'citas.cambiar_estado',
                'expedientes.view',
                'expedientes.create',
                'expedientes.edit',
                'recetas.view',
                'recetas.create',
                'recetas.send_whatsapp',
            ])->get()
        );

        // Recepción / Atención al cliente
        $recepcionista = Role::firstOrCreate(['name' => 'recepcionista', 'guard_name' => 'web']);
        $recepcionista->syncPermissions(
            Permission::whereIn('name', [
                'dashboard.view',
                'pacientes.view',
                'pacientes.create',
                'pacientes.edit',
                'tipos_atencion.view',
                'tipos_atencion.create',
                'tipos_atencion.edit',
                'citas.view',
                'citas.create',
                'citas.edit',
                'citas.delete',
                'citas.cambiar_estado',
            ])->get()
        );


        // Cliente: storefront / paciente
        $cliente = Role::firstOrCreate(['name' => 'cliente', 'guard_name' => 'web']);

        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
