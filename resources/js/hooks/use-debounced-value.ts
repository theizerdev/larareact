import { useEffect, useState } from 'react';

/**
 * Devuelve `value` retrasado `delay` ms. El temporizador se reinicia en cada
 * cambio, así que mientras el usuario teclea no se emite ningún valor nuevo.
 *
 * Se usa para no disparar una petición de geocodificación por pulsación.
 */
export function useDebouncedValue<T>(value: T, delay = 600): T {
    const [debounced, setDebounced] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}

/**
 * Igual que `useDebouncedValue`, pero expone además si hay un cambio pendiente
 * de emitirse. Sirve para pintar el estado de carga desde la primera tecla y no
 * sólo cuando arranca la petición.
 */
export function useDebouncedValueWithPending<T>(value: T, delay = 600): [T, boolean] {
    const debounced = useDebouncedValue(value, delay);

    // "Pendiente" es exactamente "el valor actual aún no es el confirmado", así
    // que se deriva en el render. Guardarlo en su propio estado obligaba a
    // llamar a `setState` dentro de un efecto y provocaba renders en cascada.
    return [debounced, !Object.is(value, debounced)];
}
