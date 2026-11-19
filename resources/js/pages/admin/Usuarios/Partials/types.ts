import type { Auth } from '@/types';
import type { Paginated } from '@/types/app';

export interface Pais {
    id: number;
    nombre: string;
    codigo_iso2?: string | null;
    codigo_telefonico?: string | null;
}

export interface Role {
    id: number;
    name: string;
}

export interface Empresa {
    id: number;
    razon_social: string;
}

export interface Sucursal {
    id: number;
    nombre: string;
    empresa_id: number;
}

export interface UserItem {
    id: number;
    name: string;
    email: string;
    username?: string | null;
    telefono?: string | null;
    pais_telefono_id?: number | null;
    status: 'activo' | 'inactivo' | 'suspendido';
    empresa_id?: number | null;
    sucursal_id?: number | null;
    empresa?: Empresa | null;
    sucursal?: Sucursal | null;
    roles: Role[];
    pais_telefono?: Pais | null;
    is_locked?: boolean;
    lockout_remaining_minutes?: number;
    days_remaining?: number | null;
    is_expired?: boolean;
    is_super_admin?: boolean;
    created_at_human?: string | null;
}

export interface UserFormState {
    name: string;
    username: string;
    email: string;
    password: string;
    telefono: string;
    pais_telefono_id: string | number;
    status: 'activo' | 'inactivo' | 'suspendido';
    empresa_id: string | number;
    sucursal_id: string | number;
    roles: string[];
}

export interface UsersPageProps {
    auth: Auth;
    users: Paginated<UserItem>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
        suspendidos: number;
        bloqueados: number;
    };
    roles: Role[];
    empresas: Empresa[];
    sucursales: Sucursal[];
    paises: Pais[];
    filters: {
        search?: string;
        status?: string;
        role?: string;
        empresa_id?: string;
        perPage?: string;
        sortBy?: string;
        sortDir?: string;
    };
    soxPolicies?: {
        minLength: number;
        historyLimit: number;
        expireDays: number;
    };
    can: {
        create: boolean;
        edit: boolean;
        delete: boolean;
        sox: boolean;
        sox_manage: boolean;
    };
}

const AVATAR_GRADIENTS = [
    'from-indigo-500 to-violet-600',
    'from-sky-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-purple-500 to-fuchsia-600',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-indigo-600',
    'from-violet-500 to-indigo-600',
    'from-teal-500 to-emerald-600',
] as const;

const SUPER_ADMIN_ROLE_NAMES = new Set([
    'super administrador',
    'super-admin',
    'super admin',
    'super_admin',
]);

export function isPrivilegedRoleName(name: string): boolean {
    return SUPER_ADMIN_ROLE_NAMES.has(name.trim().toLowerCase());
}

/**
 * Obtiene iniciales de Nombre y Apellido (soporte Unicode).
 * - "Juan Pérez" -> "JP"
 * - "Juan Carlos Pérez" -> "JP"
 * - "Administrador" -> "AD"
 */
export function getUserInitials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/u).filter(Boolean);

    if (parts.length === 0) {
        return 'U';
    }

    if (parts.length === 1) {
        return Array.from(parts[0]).slice(0, 2).join('').toUpperCase();
    }

    const firstInitial = Array.from(parts[0])[0] ?? '';
    const lastInitial = Array.from(parts[parts.length - 1])[0] ?? '';

    return `${firstInitial}${lastInitial}`.toUpperCase();
}

export function getAvatarGradient(seed: string, isSuperAdmin?: boolean): string {
    if (isSuperAdmin) {
        return 'from-amber-500 to-orange-600';
    }

    const clean = seed.trim().toLowerCase();
    let hash = 0;

    for (let i = 0; i < clean.length; i++) {
        hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
    }

    return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}
