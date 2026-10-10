import { usePage } from '@inertiajs/react';

/**
 * Módulos encendidos en esta instancia (config/modulos.php, compartido por
 * HandleInertiaRequests). Un módulo apagado no debe pintarse: sus rutas ya
 * responden 404 en el servidor.
 */
export function useModulos() {
    const modulos = ((usePage().props as any)?.modulos || {}) as Record<string, boolean>;

    return (modulo: string) => modulos[modulo] === true;
}
