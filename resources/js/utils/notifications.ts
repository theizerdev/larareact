/**
 * Módulo de Notificaciones Reutilizable con SweetAlert2
 *
 * Este módulo encapsula la configuración de SweetAlert2 para mostrar notificaciones
 * de una manera consistente en toda la aplicación.
 */
import Swal from 'sweetalert2';

/**
 * @description
 * Configuración base para las notificaciones.
 * Se utiliza un estilo personalizado y se oculta el botón de confirmación
 * para alertas que son puramente informativas.
 */
const Alert = Swal.mixin({
    buttonsStyling: false, // Opcional: si usas clases de Tailwind/Bootstrap para estilizar
    customClass: {
        confirmButton: 'btn btn-primary', // Ejemplo de clases personalizadas
        cancelButton: 'btn btn-danger',
    },
});

/**
 * Dispara una notificación de éxito.
 * @param {string} title - El mensaje a mostrar.
 */
export function notifySuccess(title: string) {
    Alert.fire({
        icon: 'success',
        title: title,
        showConfirmButton: false,
        timer: 2000, // Cierra automáticamente después de 2 segundos
    });
}

/**
 * Dispara una notificación de error.
 * @param {string} title - El mensaje a mostrar.
 */
export function notifyError(title: string) {
    Alert.fire({
        icon: 'error',
        title: title,
    });
}

/**
 * Dispara una notificación de advertencia.
 * @param {string} title - El mensaje a mostrar.
 */
export function notifyWarning(title: string) {
    Alert.fire({
        icon: 'warning',
        title: title,
    });
}

/**
 * Dispara una notificación de información.
 * @param {string} title - El mensaje a mostrar.
 */
export function notifyInfo(title: string) {
    Alert.fire({
        icon: 'info',
        title: title,
    });
}