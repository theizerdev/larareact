<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    /**
     * Seed the permissions grouped by module.
     */
    public function run(): void
    {
        $permissions = [
            // Sector: Seguridad
            'seguridad' => [
                // Módulo: Dashboard
                'dashboard.view' => 'Ver Dashboard',

                // Módulo: Usuarios
                'users.view' => 'Ver Usuarios',
                'users.create' => 'Crear Usuario',
                'users.edit' => 'Editar Usuario',
                'users.delete' => 'Eliminar Usuario',

                // Módulo: Roles
                'roles.view' => 'Ver Roles',
                'roles.create' => 'Crear Rol',
                'roles.edit' => 'Editar Rol',
                'roles.delete' => 'Eliminar Rol',
            ],

            // Sector: Configuración
            'configuracion' => [
                // Módulo: Países
                'paises.view' => 'Ver Países',
                'paises.create' => 'Crear País',
                'paises.edit' => 'Editar País',
                'paises.delete' => 'Eliminar País',

                // Módulo: Empresas
                'empresas.view' => 'Ver Empresas',
                'empresas.create' => 'Crear Empresa',
                'empresas.edit' => 'Editar Empresa',
                'empresas.delete' => 'Eliminar Empresa',

                // Módulo: Sucursales
                'sucursales.view' => 'Ver Sucursales',
                'sucursales.create' => 'Crear Sucursal',
                'sucursales.edit' => 'Editar Sucursal',
                'sucursales.delete' => 'Eliminar Sucursal',

                // Módulo: Integraciones
                'integrations.view' => 'Ver Integraciones',
                'integrations.edit' => 'Editar Integraciones',

                
            ],

            // Sector: Organización
            'organizacion' => [
                // Módulo: Departamentos
                'departamentos.view' => 'Ver Departamentos',
                'departamentos.create' => 'Crear Departamento',
                'departamentos.edit' => 'Editar Departamento',
                'departamentos.delete' => 'Eliminar Departamento',

                // Módulo: Cargos
                'cargos.view' => 'Ver Cargos',
                'cargos.create' => 'Crear Cargo',
                'cargos.edit' => 'Editar Cargo',
                'cargos.delete' => 'Eliminar Cargo',

                // Módulo: Responsables
                'responsables.view' => 'Ver Responsables',
                'responsables.create' => 'Crear Responsable',
                'responsables.edit' => 'Editar Responsable',
                'responsables.delete' => 'Eliminar Responsable',

                // Módulo: Empleados
                'empleados.view' => 'Ver Empleados',
                'empleados.create' => 'Crear Empleado',
                'empleados.edit' => 'Editar Empleado',
                'empleados.delete' => 'Eliminar Empleado',
                
                // Módulo: Proveedores
                'proveedores.view' => 'Ver Proveedores',
                'proveedores.create' => 'Crear Proveedor',
                'proveedores.edit' => 'Editar Proveedor',
                'proveedores.delete' => 'Eliminar Proveedor',
            ],
            // Sector: Monitoreo
            'monitoreo' => [
                // Módulo: Monitoreo
                'monitoreo.view' => 'Ver Monitoreo',
                'monitoreo.server' => 'Ver Stats del Servidor',
                'monitoreo.logins' => 'Ver Historial de Login',
                'monitoreo.activities' => 'Ver Actividades',
                'monitoreo.database' => 'Gestionar Base de Datos',
                'monitoreo.backup' => 'Crear Respaldo de BD',
                'monitoreo.import' => 'Importar Base de Datos',
            ],

        ];

        foreach ($permissions as $sector => $sectorPermissions) {
            foreach ($sectorPermissions as $permission => $slug) {
                // Determinar el módulo basado en el prefijo del permiso
                $module = match (true) {
                    str_starts_with($permission, 'dashboard.') => 'dashboard',
                    str_starts_with($permission, 'users.') => 'usuarios',
                    str_starts_with($permission, 'roles.') => 'roles',
                    str_starts_with($permission, 'paises.') => 'paises',
                    str_starts_with($permission, 'empresas.') => 'empresas',
                    str_starts_with($permission, 'sucursales.') => 'sucursales',
                    str_starts_with($permission, 'departamentos.') => 'departamentos',
                    str_starts_with($permission, 'cargos.') => 'cargos',
                    str_starts_with($permission, 'responsables.') => 'responsables',
                    str_starts_with($permission, 'empleados.') => 'empleados',
                    str_starts_with($permission, 'integrations.') => 'integraciones',
                    str_starts_with($permission, 'proveedores.') => 'proveedores',
                    str_starts_with($permission, 'monitoreo.') => 'monitoreo',

                    default => 'general',
                };

                Permission::updateOrCreate(
                    ['name' => $permission, 'guard_name' => 'web'],
                    [
                        'slug' => $slug,
                        'module' => $module,
                        'sector' => $sector,
                    ]
                );
            }
        }

        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
