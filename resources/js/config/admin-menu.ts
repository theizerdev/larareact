/**
 * Fuente única de nodos del menú lateral que el superadmin puede ocultar/mostrar
 * desde Configuración › Visibilidad del Menú.
 *
 * Las `key` deben coincidir exactamente con las usadas en
 * `admin-saas-layout.tsx` (grupo y subítems). `labelKey` es la misma cadena
 * que el layout pasa a `__()`, para reutilizar traducciones.
 *
 * Ocultar un nodo es puramente visual: no cambia permisos ni el acceso por URL.
 */
export interface AdminMenuNode {
    key: string;
    labelKey: string;
    /** key del grupo padre; ausente = es un grupo de primer nivel */
    parent?: string;
    /** Permisos (basta uno) que el layout exige para mostrar el ítem. Ausente = sin permiso propio. */
    permissions?: string[];
    /** Módulo de toda la plataforma: solo lo ve el Super Administrador, sin importar empresa ni rol. */
    platformOnly?: boolean;
}

export const ADMIN_MENU_NODES: AdminMenuNode[] = [
    // Organization
    { key: 'organization', labelKey: 'Organization' },
    { key: 'organization.branches', labelKey: 'Branches', parent: 'organization', permissions: ['sucursales.view'] },
    { key: 'organization.departments', labelKey: 'Departments', parent: 'organization', permissions: ['departamentos.view'] },
    { key: 'organization.positions', labelKey: 'Positions', parent: 'organization', permissions: ['cargos.view'] },
    { key: 'organization.responsibles', labelKey: 'Responsibles', parent: 'organization', permissions: ['responsables.view'] },
    { key: 'organization.employees', labelKey: 'Employees', parent: 'organization', permissions: ['empleados.view'] },
    { key: 'organization.suppliers', labelKey: 'Suppliers', parent: 'organization', permissions: ['proveedores.view'] },
    { key: 'organization.partners', labelKey: 'Commercial Partners', parent: 'organization', permissions: ['productores.view'] },

    // Visits
    { key: 'visits', labelKey: 'Visits' },
    { key: 'visits.temporary', labelKey: 'Temporary Visits', parent: 'visits', permissions: ['visitas_temporales.view'] },
    { key: 'visits.accesses', labelKey: 'Facility Accesses', parent: 'visits', permissions: ['visitas_temporales.view'] },
    { key: 'visits.gate', labelKey: 'Gate Control (QR Reader)', parent: 'visits', permissions: ['visitas_temporales.view'] },

    // Access Control
    { key: 'access_control', labelKey: 'Access Control' },
    { key: 'access_control.ivms_employees', labelKey: 'IVMS Employees', parent: 'access_control', permissions: ['control_acceso.view'] },
    { key: 'access_control.cards', labelKey: 'Access Cards', parent: 'access_control', permissions: ['control_acceso.view'] },
    { key: 'access_control.pedestrian_events', labelKey: 'Pedestrian Access Events', parent: 'access_control', permissions: ['control_acceso.view'] },
    { key: 'access_control.vehicles', labelKey: 'Vehicles', parent: 'access_control', permissions: ['control_acceso.view'] },
    { key: 'access_control.vehicle_events', labelKey: 'Vehicle Access Events', parent: 'access_control', permissions: ['control_acceso.view'] },

    // Reloj Checador
    { key: 'reloj_checador', labelKey: 'Reloj Checador' },
    { key: 'reloj_checador.kiosko', labelKey: 'Kiosko Checador', parent: 'reloj_checador', permissions: ['asistencia.kiosko', 'asistencia.view'] },
    { key: 'reloj_checador.nomina', labelKey: 'Pre-Nómina y Horas Extra', parent: 'reloj_checador', permissions: ['asistencia.nomina', 'asistencia.view'] },
    { key: 'reloj_checador.bitacora', labelKey: 'Bitácora de Marcajes', parent: 'reloj_checador', permissions: ['asistencia.bitacora', 'asistencia.view'] },
    { key: 'reloj_checador.configuracion', labelKey: 'Configuración y Turnos', parent: 'reloj_checador', permissions: ['asistencia.configuracion', 'asistencia.view'] },
    { key: 'reloj_checador.biotime', labelKey: 'BioTime PRO', parent: 'reloj_checador', permissions: ['biotime.view'] },

    // Settings
    { key: 'settings', labelKey: 'Settings' },
    { key: 'settings.companies', labelKey: 'Companies', parent: 'settings', permissions: ['empresas.view'] },
    { key: 'settings.countries', labelKey: 'Countries', parent: 'settings', permissions: ['paises.view'] },
    { key: 'settings.appearance', labelKey: 'Appearance', parent: 'settings', permissions: ['empresas.view'] },

    // Integrations
    { key: 'integrations', labelKey: 'Integrations' },
    { key: 'integrations.catalog', labelKey: 'Catalog', parent: 'integrations', permissions: ['integrations.view'] },
    { key: 'integrations.validations', labelKey: 'Validations', parent: 'integrations', permissions: ['jaak.view'] },
    { key: 'integrations.reloj_checador', labelKey: 'Reloj Checador', parent: 'integrations', permissions: ['integrations.view'] },
    { key: 'integrations.control_acceso', labelKey: 'Control de Acceso', parent: 'integrations', permissions: ['integrations.view'] },

    // Identity Validations
    { key: 'identity_validations', labelKey: 'Validation Results' },
    { key: 'identity_validations.list', labelKey: 'Identity', parent: 'identity_validations', permissions: ['validaciones.view'] },
    { key: 'identity_validations.documents', labelKey: 'Documents', parent: 'identity_validations', permissions: ['validaciones.view'] },

    // Security
    { key: 'security', labelKey: 'Security' },
    { key: 'security.users', labelKey: 'Users', parent: 'security', permissions: ['users.view'] },
    { key: 'security.roles', labelKey: 'Roles', parent: 'security', permissions: ['roles.view'] },

    // Monitoring
    { key: 'monitoring', labelKey: 'Monitoring' },
    { key: 'monitoring.database', labelKey: 'Database', parent: 'monitoring' },
    { key: 'monitoring.server', labelKey: 'Server', parent: 'monitoring' },
    { key: 'monitoring.sessions', labelKey: 'User Sessions', parent: 'monitoring' },
    { key: 'monitoring.activity', labelKey: 'System Activity', parent: 'monitoring' },
    { key: 'monitoring.logs', labelKey: 'System Logs', parent: 'monitoring' },
    { key: 'monitoring.queues', labelKey: 'Queue Monitor', parent: 'monitoring' },
    { key: 'monitoring.tasks', labelKey: 'Scheduled Tasks', parent: 'monitoring' },
];

export const ADMIN_MENU_GROUPS = ADMIN_MENU_NODES.filter((n) => !n.parent);
export const adminMenuChildren = (groupKey: string) =>
    ADMIN_MENU_NODES.filter((n) => n.parent === groupKey);
