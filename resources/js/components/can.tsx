import React from 'react';
import { usePermission } from '@/hooks/use-permission';

export interface CanProps {
    /**
     * Permiso o lista de permisos requeridos (ej: 'users.create' o ['users.create', 'users.edit']).
     */
    permission?: string | string[];

    /**
     * Rol o lista de roles requeridos (ej: 'admin' o ['admin', 'operador']).
     */
    role?: string | string[];

    /**
     * Si es true y se pasa un arreglo, exige tener TODOS los permisos/roles especificados.
     * Por defecto es false (basta con tener al menos uno).
     */
    requireAll?: boolean;

    /**
     * Elemento a renderizar si el usuario NO cumple la condición (por defecto null).
     */
    fallback?: React.ReactNode;

    /**
     * Elementos protegidos a renderizar si el usuario tiene acceso.
     */
    children: React.ReactNode;
}

/**
 * Componente envoltorio para RBAC en la interfaz React.
 * Muestra el contenido protegido únicamente si el usuario autenticado
 * posee el permiso o rol indicado (o si es Super Administrador).
 *
 * @example
 * <Can permission="users.create">
 *     <Button onClick={openCreateModal}>Crear Usuario</Button>
 * </Can>
 */
export const Can: React.FC<CanProps> = ({
    permission,
    role,
    requireAll = false,
    fallback = null,
    children,
}) => {
    const { can, hasRole } = usePermission();

    // Si se especifica un permiso y no lo cumple
    if (permission && !can(permission, { requireAll })) {
        return <>{fallback}</>;
    }

    // Si se especifica un rol y no lo cumple
    if (role && !hasRole(role, { requireAll })) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

export default Can;
