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

                // Módulo: Configuración de Créditos
                'credit_config.view' => 'Ver Configuración de Créditos',
                'credit_config.edit' => 'Editar Configuración de Créditos',

                // Módulo: Suscripciones
                'subscriptions.view' => 'Ver Suscripciones',
                'subscriptions.manage' => 'Gestionar Suscripciones',
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

            // Sector: Equipos
            'equipos' => [
                // Módulo: Categorías
                'categorias.view' => 'Ver Categorías',
                'categorias.create' => 'Crear Categorías',
                'categorias.edit' => 'Editar Categorías',
                'categorias.delete' => 'Eliminar Categorías',

                // Módulo: Marcas
                'marcas.view' => 'Ver Marcas',
                'marcas.create' => 'Crear Marcas',
                'marcas.edit' => 'Editar Marcas',
                'marcas.delete' => 'Eliminar Marcas',

                // Módulo: Familias
                'familias.view' => 'Ver Familias',
                'familias.create' => 'Crear Familias',
                'familias.edit' => 'Editar Familias',
                'familias.delete' => 'Eliminar Familias',

                // Módulo: Modelos
                'modelos.view' => 'Ver Modelos',
                'modelos.create' => 'Crear Modelos',
                'modelos.edit' => 'Editar Modelos',
                'modelos.delete' => 'Eliminar Modelos',

               
               
            ],

            // Sector: Punto de Venta
            'punto_de_venta' => [
                // Módulo: Flujo de Caja
                'cajas.view' => 'Ver Cajas',
                'cajas.create' => 'Aperturar Cajas',
                'cajas.edit' => 'Registrar Movimientos',
                'cajas.close' => 'Cerrar Cajas',

                // Módulo: Servicios
                'servicios.view' => 'Ver Servicios',
                'servicios.create' => 'Crear Servicios',
                'servicios.edit' => 'Editar Servicios',
                'servicios.delete' => 'Eliminar Servicios',

                // Módulo: Ventas / Terminal POS
                'ventas.terminal' => 'Acceder a Terminal POS',
                'ventas.view' => 'Ver Historial de Ventas',
                'ventas.anular' => 'Anular Ventas',

                // Módulo: Metas de Ventas
                'metas.view' => 'Ver Metas de Ventas',
                'metas.edit' => 'Gestionar Metas de Ventas',

                // Módulo: Clientes / Cuentas por Cobrar
                'clientes.view' => 'Ver Clientes',
                'clientes.create' => 'Crear Clientes',
                'clientes.edit' => 'Editar Clientes',
                'clientes.delete' => 'Eliminar Clientes',
                'clientes.abono' => 'Registrar Abonos de Crédito',

                // Módulo: Proveedores
                'proveedores.view' => 'Ver Proveedores',
                'proveedores.create' => 'Crear Proveedores',
                'proveedores.edit' => 'Editar Proveedores',
                'proveedores.delete' => 'Eliminar Proveedores',
            ],

            // Sector: Inventario
            'inventario' => [
                 // Módulo: Productos
                'productos.view' => 'Ver Productos',
                'productos.create' => 'Crear Productos',
                'productos.edit' => 'Editar Productos',
                'productos.delete' => 'Eliminar Productos',
                'inventario.view' => 'Ver Inventario y Kardex',
                'inventario.adjust' => 'Realizar Ajustes de Stock (Entradas/Salidas)',
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
                    str_starts_with($permission, 'integrations.') => 'integraciones',
                    str_starts_with($permission, 'credit_config.') => 'configuracion_credito',
                    str_starts_with($permission, 'subscriptions.') => 'suscripciones',
                    str_starts_with($permission, 'monitoreo.') => 'monitoreo',
                    str_starts_with($permission, 'categorias.') => 'categorias',
                    str_starts_with($permission, 'marcas.') => 'marcas',
                    str_starts_with($permission, 'familias.') => 'familias',
                    str_starts_with($permission, 'modelos.') => 'modelos',
                    str_starts_with($permission, 'productos.') => 'productos',
                    str_starts_with($permission, 'cajas.') => 'cajas',
                    str_starts_with($permission, 'servicios.') => 'servicios',
                    str_starts_with($permission, 'ventas.') => 'ventas',
                    str_starts_with($permission, 'clientes.') => 'clientes',
                    str_starts_with($permission, 'proveedores.') => 'proveedores',
                    str_starts_with($permission, 'metas.') => 'metas',
                    str_starts_with($permission, 'inventario.') => 'inventario',

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
