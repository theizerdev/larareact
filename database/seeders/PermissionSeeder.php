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
                // Nuevos permisos WhatsApp
                'whatsapp.view' => 'Ver configuración de WhatsApp',
                'whatsapp.manage' => 'Gestionar configuración WhatsApp',
                'whatsapp.send' => 'Enviar mensajes WhatsApp',
                // Nuevos permisos JAAK (Validaciones / KYC)
                'jaak.view' => 'Ver configuración de JAAK',
                'jaak.manage' => 'Gestionar configuración JAAK',
                // Permisos para envío de carnet por WhatsApp
                'proveedores.send-carnet-whatsapp' => 'Enviar carnet por WhatsApp a Proveedor',
                'productores.send-carnet-whatsapp' => 'Enviar carnet por WhatsApp a Productor',

                
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
                'empleados.import' => 'Importar Empleados desde Excel',
                
                // Módulo: Proveedores
                'proveedores.view' => 'Ver Proveedores',
                'proveedores.create' => 'Crear Proveedor',
                'proveedores.edit' => 'Editar Proveedor',
                'proveedores.delete' => 'Eliminar Proveedor',

                // Módulo: Productores
                'productores.view' => 'Ver Productores',
                'productores.create' => 'Crear Productor',
                'productores.edit' => 'Editar Productor',
                'productores.delete' => 'Eliminar Productor',
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

            // Sector: Visitas
            'visitas' => [
                // Módulo: Visitas Temporales
                'visitas_temporales.view' => 'Ver Visitas Temporales',
                'visitas_temporales.create' => 'Crear Visita Temporal',
                'visitas_temporales.edit' => 'Editar Visita Temporal',
                'visitas_temporales.delete' => 'Eliminar Visita Temporal',
            ],

            // Sector: Importación
            'importacion' => [
                // Módulo: Empleados
                'empleados.import' => 'Importar Empleados desde Excel',
            ],

            // Sector: Control de Acceso (datos del ivms vía middleware)
            'control_acceso' => [
                'control_acceso.view' => 'Ver Control de Acceso',
            ],

            // Sector: Salud & Gestión Médica Adaptativa
            'salud' => [
                // Módulo: Especialidades
                'especialidades.view' => 'Ver Especialidades y Ramas Médicas',
                'especialidades.create' => 'Crear Especialidad / Rama',
                'especialidades.edit' => 'Configurar Especialidades por Clínica',
                'especialidades.delete' => 'Eliminar Especialidad',

                // Módulo: Pacientes
                'pacientes.view' => 'Ver Pacientes',
                'pacientes.create' => 'Crear Paciente',
                'pacientes.edit' => 'Editar Paciente',
                'pacientes.delete' => 'Eliminar Paciente',

                // Módulo: Médicos
                'medicos.view' => 'Ver Médicos / Especialistas',
                'medicos.create' => 'Crear Médico',
                'medicos.edit' => 'Editar Médico',
                'medicos.delete' => 'Eliminar Médico',

                // Módulo: Citas Médicas
                'citas.view' => 'Ver Citas Médicas',
                'citas.create' => 'Agendar Cita Médica',
                'citas.edit' => 'Editar Cita Médica',
                'citas.delete' => 'Cancelar Cita Médica',

                // Módulo: Expedientes Clínicos
                'expedientes.view' => 'Ver Expedientes Clínicos',
                'expedientes.create' => 'Crear Consulta Clínica',
                'expedientes.edit' => 'Editar Consulta Clínica',
                'expedientes.delete' => 'Eliminar Registro Clínico',

                // Módulo: Recetas
                'recetas.view' => 'Ver Recetas Médicas',
                'recetas.create' => 'Emitir Receta Médica',
                'recetas.send_whatsapp' => 'Enviar Receta por WhatsApp',

                // Módulo: Tipos de Atención
                'tipos_atencion.view' => 'Ver Tipos de Atención',
                'tipos_atencion.create' => 'Crear Tipo de Atención',
                'tipos_atencion.edit' => 'Editar Tipo de Atención',
                'tipos_atencion.delete' => 'Eliminar Tipo de Atención',

                // Módulo: Citas Médicas
                'citas.view' => 'Ver Agenda de Citas',
                'citas.create' => 'Agendar Cita',
                'citas.edit' => 'Editar Cita',
                'citas.delete' => 'Eliminar Cita',
                'citas.cambiar_estado' => 'Cambiar Estado de Cita',
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
                    str_starts_with($permission, 'especialidades.') => 'especialidades',
                    str_starts_with($permission, 'pacientes.') => 'pacientes',
                    str_starts_with($permission, 'medicos.') => 'medicos',
                    str_starts_with($permission, 'tipos_atencion.') => 'tipos_atencion',
                    str_starts_with($permission, 'citas.') => 'citas',
                    str_starts_with($permission, 'expedientes.') => 'expedientes',
                    str_starts_with($permission, 'recetas.') => 'recetas',

                    str_starts_with($permission, 'departamentos.') => 'departamentos',
                    str_starts_with($permission, 'cargos.') => 'cargos',
                    str_starts_with($permission, 'responsables.') => 'responsables',
                    str_starts_with($permission, 'empleados.') => 'empleados',
                    str_starts_with($permission, 'integrations.') => 'integraciones',
                    str_starts_with($permission, 'whatsapp.') => 'integraciones',
                    str_starts_with($permission, 'jaak.') => 'integraciones',
                    str_starts_with($permission, 'proveedores.') => 'proveedores',
                    str_starts_with($permission, 'productores.') => 'productores',
                    str_starts_with($permission, 'monitoreo.') => 'monitoreo',
                    str_starts_with($permission, 'visitas_temporales.') => 'visitas_temporales',
                    str_starts_with($permission, 'control_acceso.') => 'control_acceso',
                    str_starts_with($permission, 'asistencia.') => 'asistencia',

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
