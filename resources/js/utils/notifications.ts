/**
 * Módulo de Notificaciones Reutilizable con Sonner (Toast)
 *
 * Este módulo encapsula las notificaciones de Sonner para mostrar alertas
 * de una manera consistente y no intrusiva en toda la aplicación.
 */
import { toast } from 'sonner';

/**
 * Dispara una notificación de éxito.
 * @param {string} title - El mensaje a mostrar.
 */
export function notifySuccess(title: string) {
    toast.success(title);
}

/**
 * Dispara una notificación de error.
 * @param {string} title - El mensaje a mostrar.
 */
export function notifyError(title: string) {
    toast.error(title);
}

/**
 * Dispara una notificación de advertencia.
 * @param {string} title - El mensaje a mostrar.
 */
export function notifyWarning(title: string) {
    toast.warning(title);
}

/**
 * Dispara una notificación de información.
 * @param {string} title - El mensaje a mostrar.
 */
export function notifyInfo(title: string) {
    toast.info(title);
}