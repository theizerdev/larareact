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
}

export const ADMIN_MENU_NODES: AdminMenuNode[] = [
    // Organization
    { key: 'organization', labelKey: 'Organization' },
    { key: 'organization.branches', labelKey: 'Branches', parent: 'organization' },
    { key: 'organization.departments', labelKey: 'Departments', parent: 'organization' },
    { key: 'organization.positions', labelKey: 'Positions', parent: 'organization' },
    { key: 'organization.responsibles', labelKey: 'Responsibles', parent: 'organization' },
    { key: 'organization.employees', labelKey: 'Employees', parent: 'organization' },
    { key: 'organization.suppliers', labelKey: 'Suppliers', parent: 'organization' },
    { key: 'organization.partners', labelKey: 'Commercial Partners', parent: 'organization' },

    // Visits
    { key: 'visits', labelKey: 'Visits' },
    { key: 'visits.temporary', labelKey: 'Temporary Visits', parent: 'visits' },
    { key: 'visits.accesses', labelKey: 'Facility Accesses', parent: 'visits' },
    { key: 'visits.gate', labelKey: 'Gate Control (QR Reader)', parent: 'visits' },

    // Access Control
    { key: 'access_control', labelKey: 'Access Control' },
    { key: 'access_control.ivms_employees', labelKey: 'IVMS Employees', parent: 'access_control' },
    { key: 'access_control.cards', labelKey: 'Access Cards', parent: 'access_control' },
    { key: 'access_control.pedestrian_events', labelKey: 'Pedestrian Access Events', parent: 'access_control' },
    { key: 'access_control.vehicles', labelKey: 'Vehicles', parent: 'access_control' },
    { key: 'access_control.vehicle_events', labelKey: 'Vehicle Access Events', parent: 'access_control' },

    // Reloj Checador
    { key: 'reloj_checador', labelKey: 'Reloj Checador' },
    { key: 'reloj_checador.kiosko', labelKey: 'Kiosko Checador', parent: 'reloj_checador' },
    { key: 'reloj_checador.nomina', labelKey: 'Pre-Nómina y Horas Extra', parent: 'reloj_checador' },
    { key: 'reloj_checador.bitacora', labelKey: 'Bitácora de Marcajes', parent: 'reloj_checador' },
    { key: 'reloj_checador.configuracion', labelKey: 'Configuración y Turnos', parent: 'reloj_checador' },
    { key: 'reloj_checador.biotime', labelKey: 'BioTime PRO', parent: 'reloj_checador' },

    // Settings
    { key: 'settings', labelKey: 'Settings' },
    { key: 'settings.companies', labelKey: 'Companies', parent: 'settings' },
    { key: 'settings.countries', labelKey: 'Countries', parent: 'settings' },
    { key: 'settings.appearance', labelKey: 'Appearance', parent: 'settings' },

    // Integrations
    { key: 'integrations', labelKey: 'Integrations' },
    { key: 'integrations.catalog', labelKey: 'Catalog', parent: 'integrations' },
    { key: 'integrations.validations', labelKey: 'Validations', parent: 'integrations' },
    { key: 'integrations.reloj_checador', labelKey: 'Reloj Checador', parent: 'integrations' },
    { key: 'integrations.control_acceso', labelKey: 'Control de Acceso', parent: 'integrations' },

    // Security
    { key: 'security', labelKey: 'Security' },
    { key: 'security.users', labelKey: 'Users', parent: 'security' },
    { key: 'security.roles', labelKey: 'Roles', parent: 'security' },

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
