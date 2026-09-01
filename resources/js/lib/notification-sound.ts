/**
 * Reproductor del sonido de notificación.
 *
 * Reutiliza un único elemento <audio> para no recrearlo en cada aviso. La
 * reproducción puede fallar silenciosamente si el navegador aún no registró
 * una interacción del usuario (política de autoplay); en ese caso no pasa nada.
 */
const SOUND_URL = '/sounds/notification.wav';

let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
        return null;
    }

    if (!audio) {
        audio = new Audio(SOUND_URL);
        audio.preload = 'auto';
    }

    return audio;
}

/**
 * Reproduce el sonido de notificación.
 *
 * @param volume Volumen entre 0 y 1 (por defecto 0.5).
 */
export function playNotificationSound(volume = 0.5): void {
    const el = getAudio();

    if (!el) {
        return;
    }

    try {
        el.volume = Math.min(1, Math.max(0, volume));
        el.currentTime = 0;
        const played = el.play();

        if (played && typeof played.catch === 'function') {
            played.catch(() => {
                /* autoplay bloqueado: se ignora */
            });
        }
    } catch {
        /* elemento de audio no disponible: se ignora */
    }
}

/**
 * Fuerza la carga del audio tras una interacción del usuario para que el primer
 * aviso real suene sin retraso.
 */
export function primeNotificationSound(): void {
    const el = getAudio();

    if (!el) {
        return;
    }

    try {
        el.load();
    } catch {
        /* se ignora */
    }
}
