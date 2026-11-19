import type { Auth } from '@/types';

export interface RoleUser {
    id: number;
    name: string;
    email?: string;
    initials: string;
}

export interface PermissionItem {
    id: number;
    name: string;
    slug: string;
    sector?: string;
    module?: string;
}

export interface SectorBreakdown {
    sector: string;
    label: string;
    count: number;
    total: number;
}

export interface RoleItem {
    id: number;
    name: string;
    users_count: number;
    permissions_count: number;
    coverage_percent: number;
    updated_at_human: string;
    created_at: string;
    users: RoleUser[];
    more_users_count: number;
    permissions: PermissionItem[];
    more_permissions_count: number;
    all_permissions: PermissionItem[];
    sector_breakdown: SectorBreakdown[];
    is_super_admin: boolean;
    is_system: boolean;
}

export interface GroupedPermissions {
    [sector: string]: {
        [module: string]: PermissionItem[];
    };
}

export interface SectorMetaEntry {
    label: string;
    description: string;
    order: number;
}

export interface SectorMeta {
    [sector: string]: SectorMetaEntry;
}

export interface ModuleMeta {
    [module: string]: string;
}

export interface SyncPendingCreateItem {
    name: string;
    slug: string;
    sector: string;
    module: string;
    source: string;
}

export interface SyncPendingUpdateItem {
    name: string;
    slug: string;
    current_slug: string | null;
    current_sector: string | null;
    target_sector: string;
    current_module: string | null;
    target_module: string;
    source: string;
}

export interface SyncObsoleteItem {
    id: number;
    name: string;
    slug: string;
    sector: string | null;
    module: string | null;
    roles_count: number;
}

export interface SyncStatus {
    to_create: SyncPendingCreateItem[];
    to_update: SyncPendingUpdateItem[];
    obsolete: SyncObsoleteItem[];
    pending_count: number;
    obsolete_count: number;
    in_sync: boolean;
    total_expected: number;
    total_in_db: number;
}

export interface RolesPageProps {
    auth: Auth;
    roles: RoleItem[];
    stats: {
        total: number;
        permissions_total: number;
        assigned_users: number;
        sectors_count: number;
        modules_count: number;
    };
    groupedPermissions: GroupedPermissions;
    sectorMeta: SectorMeta;
    moduleMeta: ModuleMeta;
    syncStatus: SyncStatus;
    filters: {
        search?: string;
        filter?: string;
        sortBy?: string;
        sortDir?: string;
    };
    can: {
        create: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export interface ActionBadgeMeta {
    label: string;
    className: string;
}

export function getActionBadgeMeta(permissionName: string): ActionBadgeMeta {
    const action = permissionName.split('.').slice(1).join('.');

    if (action === 'view' || action === 'bitacora' || action === 'nomina' || action === 'server' || action === 'logins' || action === 'activities') {
        return {
            label: action === 'view' ? 'Ver' : action === 'bitacora' ? 'Bitácora' : action === 'nomina' ? 'Nómina' : 'Consulta',
            className: 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60',
        };
    }

    if (action === 'create') {
        return {
            label: 'Crear',
            className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
        };
    }

    if (action === 'edit') {
        return {
            label: 'Editar',
            className: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
        };
    }

    if (action === 'delete') {
        return {
            label: 'Eliminar',
            className: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60',
        };
    }

    if (action === 'import') {
        return {
            label: 'Importar',
            className: 'bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800/60',
        };
    }

    if (action === 'manage' || action === 'configuracion' || action === 'database' || action === 'backup') {
        return {
            label: 'Gestionar',
            className: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60',
        };
    }

    if (action.includes('send')) {
        return {
            label: 'Enviar',
            className: 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800/60',
        };
    }

    if (action === 'kiosko') {
        return {
            label: 'Kiosko',
            className: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60',
        };
    }

    return {
        label: action ? action.replace(/[._-]/g, ' ') : 'Especial',
        className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    };
}
