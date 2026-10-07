import type { RefObject } from 'react';

/**
 * Conecta un MediaStream a un <video> aunque el elemento todavía no exista.
 *
 * Los formularios abren la cámara dentro de diálogos o secciones condicionales:
 * si el permiso se concede antes de que React monte el <video>, asignar
 * `srcObject` en ese momento no hace nada y la cámara "pide permiso pero no abre".
 * Esperamos (hasta ~3 s) a que el elemento exista y entonces lo reproducimos.
 */
export function attachStream(
    ref: RefObject<HTMLVideoElement | null>,
    stream: MediaStream,
    maxWaitMs = 3000,
): void {
    const started = performance.now();

    const tryAttach = () => {
        const video = ref.current;

        if (video) {
            video.muted = true;
            video.setAttribute('playsinline', 'true');
            if (video.srcObject !== stream) {
                video.srcObject = stream;
            }
            video.play().catch(() => {});
            return;
        }

        if (performance.now() - started < maxWaitMs) {
            requestAnimationFrame(tryAttach);
        }
    };

    tryAttach();
}
