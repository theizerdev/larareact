import { router } from '@inertiajs/react';
import React from 'react';

/**
 * Sincroniza un objeto de filtros (ya limpiado con `cleanParams`) con la URL actual
 * vía Inertia, con debounce. Evita el round-trip redundante al montar la página
 * (los filtros iniciales ya vienen del server en `filters`/`items`).
 */
export function useFilterSync(filters: Record<string, any>, delay: number = 300) {
    const isFirstRun = React.useRef(true);
    const serialized = JSON.stringify(filters);

    React.useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;

            return;
        }

        const timer = setTimeout(() => {
            router.get(window.location.pathname, filters, { preserveState: true, preserveScroll: true });
        }, delay);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serialized, delay]);
}
