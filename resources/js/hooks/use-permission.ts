import { usePage } from '@inertiajs/react';
import type { Auth } from '@/types';

interface PermissionOptions {
    requireAll?: boolean;
}

/**
 * Hook para control de acceso basado en roles y permisos (RBAC).
 * Lee los permisos y roles compartidos por HandleInertiaRequests.
 */
export function usePermission() {
    const page = usePage();
    const auth = (page.props as unknown as { auth?: Auth })?.auth;
    const user = auth?.user;

    const permissions: string[] = (user?.permissions as string[]) || [];
    const roles: string[] = (user?.roles as string[]) || [];
    const isSuperAdmin: boolean = user?.is_super_admin === true;

    /**
     * Verifica si el usuario tiene un permiso específico o una lista de permisos.
     * Por defecto con un arreglo, basta con tener AL MENOS UNO (OR).
     * Si requireAll es true, exige tener TODOS los permisos (AND).
     * El Super Admin siempre retorna true.
     */
    const can = (permission: string | string[], options?: PermissionOptions): boolean => {
        if (isSuperAdmin) {
            return true;
        }

        if (Array.isArray(permission)) {
            if (permission.length === 0) return true;
            if (options?.requireAll) {
                return permission.every((p) => permissions.includes(p));
            }
            return permission.some((p) => permissions.includes(p));
        }

        return permissions.includes(permission);
    };

    /**
     * Verifica si el usuario tiene un rol específico o una lista de roles.
     * Por defecto con un arreglo, basta con tener AL MENOS UNO (OR).
     * El Super Admin siempre retorna true.
     */
    const hasRole = (role: string | string[], options?: PermissionOptions): boolean => {
        if (isSuperAdmin) {
            return true;
        }

        const normalizedRoles = roles.map((r) => r.toLowerCase().trim());

        if (Array.isArray(role)) {
            if (role.length === 0) return true;
            if (options?.requireAll) {
                return role.every((r) => normalizedRoles.includes(r.toLowerCase().trim()));
            }
            return role.some((r) => normalizedRoles.includes(r.toLowerCase().trim()));
        }

        return normalizedRoles.includes(role.toLowerCase().trim());
    };

    return {
        can,
        hasRole,
        isSuperAdmin,
        permissions,
        roles,
    };
}
