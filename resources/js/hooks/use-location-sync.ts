import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebouncedValueWithPending } from '@/hooks/use-debounced-value';
import type {
    AddressParts,
    GeocodeResult} from '@/lib/geocoding';
import {
    buildAddressQuery,
    forwardGeocode,
    isQueryGeocodable,
    isValidCoordinate,
    reverseGeocode,
} from '@/lib/geocoding';

/** De dónde provienen las coordenadas actuales. Define la precedencia. */
export type CoordinateSource = 'initial' | 'geocoded' | 'manual';

export interface LocationPatch {
    latitud?: number;
    longitud?: number;
    direccion?: string;
    codigo_postal?: string;
    estado?: string;
    ciudad?: string;
    colonia?: string;
}

export interface UseLocationSyncOptions {
    /** Campos de dirección tal como están hoy en el formulario. */
    address: AddressParts;
    /** Coordenadas actuales del formulario (`null` si aún no hay). */
    lat: number | null;
    lng: number | null;
    /**
     * Aplica al formulario el resultado de la geocodificación.
     * Debe ser estable o usar el actualizador funcional de `setData`.
     */
    onResolved: (patch: LocationPatch) => void;
    mapboxToken?: string | null;
    /** Sesga los resultados al país seleccionado (ISO alfa-2). */
    countryIso2?: string | null;
    /** Apagar cuando el modal/pestaña está cerrado, para no geocodificar de fondo. */
    enabled?: boolean;
    debounceMs?: number;
}

export type GeocodeStatus = 'idle' | 'typing' | 'searching' | 'resolved' | 'not_found' | 'error';

export interface UseLocationSyncReturn {
    status: GeocodeStatus;
    /** `true` mientras hay una petición en vuelo o un debounce pendiente. */
    isBusy: boolean;
    /** Último resultado aplicado; útil para mostrar la fuente al usuario. */
    lastResult: GeocodeResult | null;
    /** Origen de las coordenadas actuales; `manual` bloquea el autocompletado. */
    coordinateSource: CoordinateSource;
    /**
     * Registra coordenadas puestas por el usuario (arrastre del pin, clic en el
     * mapa o campos lat/lng). Tienen precedencia: quedan tal cual y disparan
     * geocodificación inversa para rellenar la dirección.
     */
    setManualCoordinates: (lat: number, lng: number, prefill?: Partial<GeocodeResult> | null) => void;
    /** Devuelve el control al autocompletado por dirección. */
    releaseManualCoordinates: () => void;
}

/**
 * Sincronización bidireccional entre los campos de dirección y el mapa.
 *
 * Dirección -> mapa: al teclear, tras el debounce, se geocodifica y se aproxima
 * el pin. Nunca bloquea la interfaz y se cancela si el usuario sigue escribiendo.
 *
 * Mapa -> dirección: al mover el pin o escribir lat/lng, esas coordenadas
 * prevalecen (son más precisas) y la dirección se rellena por geocodificación
 * inversa sin volver a tocar las coordenadas.
 */
export function useLocationSync({
    address,
    lat,
    lng,
    onResolved,
    mapboxToken,
    countryIso2,
    enabled = true,
    debounceMs = 700,
}: UseLocationSyncOptions): UseLocationSyncReturn {
    const [status, setStatus] = useState<GeocodeStatus>('idle');
    const [lastResult, setLastResult] = useState<GeocodeResult | null>(null);
    // Un registro que ya trae coordenadas guardadas arranca como 'manual': se
    // respetan hasta que el usuario edite la dirección a propósito. Así una
    // edición cualquiera no reubica un pin que alguien colocó a mano.
    const [coordinateSource, setCoordinateSource] = useState<CoordinateSource>(
        isValidCoordinate(lat, lng) ? 'manual' : 'initial',
    );

    // Refs para que los efectos no dependan de callbacks recreados en cada
    // render (era la fuente de los closures obsoletos del mapa anterior).
    //
    // Se sincronizan en un efecto sin array de dependencias: mutar refs durante
    // el render está prohibido con el React Compiler, activo en este proyecto.
    const onResolvedRef = useRef(onResolved);
    const coordinateSourceRef = useRef<CoordinateSource>(coordinateSource);

    useEffect(() => {
        onResolvedRef.current = onResolved;
        coordinateSourceRef.current = coordinateSource;
    });

    const forwardAbortRef = useRef<AbortController | null>(null);
    const reverseAbortRef = useRef<AbortController | null>(null);

    /** Última coordenada ya resuelta en inverso; evita repetir la petición. */
    const lastReverseKeyRef = useRef<string | null>(null);

    // Se desestructura antes del memo: `address` es un objeto literal nuevo en
    // cada render, así que depender de él anularía la memoización y relanzaría
    // la geocodificación en cada pulsación.
    const { pais, estado, ciudad, colonia, direccion, codigo_postal: codigoPostal } = address;

    const query = useMemo(
        () => buildAddressQuery({ pais, estado, ciudad, colonia, direccion, codigo_postal: codigoPostal }),
        [pais, estado, ciudad, colonia, direccion, codigoPostal],
    );

    const [debouncedQuery, isTyping] = useDebouncedValueWithPending(query, debounceMs);

    // Cancelar todo al desmontar: sin esto, una respuesta tardía escribía sobre
    // un formulario ya cerrado o reabierto con otro registro.
    useEffect(() => {
        return () => {
            forwardAbortRef.current?.abort();
            reverseAbortRef.current?.abort();
        };
    }, []);

    // ── Dirección -> coordenadas (geocodificación progresiva) ────────────────
    useEffect(() => {
        if (!enabled) {
            return;
        }

        // Precedencia: si el usuario fijó el pin o tecleó lat/lng, no lo movemos.
        if (coordinateSourceRef.current === 'manual') {
            return;
        }

        // Sin señal suficiente no se consulta nada; el estado expuesto se deriva
        // más abajo, así no hace falta un `setState` en el cuerpo del efecto.
        if (!isQueryGeocodable(debouncedQuery)) {
            return;
        }

        // Cancela la búsqueda anterior: sólo la última consulta puede escribir.
        forwardAbortRef.current?.abort();
        const controller = new AbortController();
        forwardAbortRef.current = controller;

        let cancelled = false;

        // Todo el trabajo (incluido marcar "buscando") va dentro de esta función
        // asíncrona, no en el cuerpo síncrono del efecto: así no se encadenan
        // renders, que es lo que `react-hooks/set-state-in-effect` previene.
        void (async () => {
            setStatus('searching');

            try {
                const result = await forwardGeocode(debouncedQuery, {
                    mapboxToken,
                    countryIso2,
                    signal: controller.signal,
                });

                if (cancelled || controller.signal.aborted) {
                    return;
                }

                // El usuario pudo fijar el pin mientras la petición estaba en
                // vuelo; en ese caso su elección manda y esto se descarta.
                if (coordinateSourceRef.current === 'manual') {
                    return;
                }

                if (!result) {
                    setStatus('not_found');

                    return;
                }

                setLastResult(result);
                setStatus('resolved');
                setCoordinateSource('geocoded');

                // Sólo movemos el pin. Los campos de dirección son del usuario:
                // sobrescribirlos mientras teclea le borraría lo escrito.
                lastReverseKeyRef.current = `${result.lat.toFixed(4)},${result.lng.toFixed(4)}`;
                onResolvedRef.current({ latitud: result.lat, longitud: result.lng });
            } catch {
                if (!cancelled) {
                    setStatus('error');
                }
            }
        })();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [debouncedQuery, enabled, mapboxToken, countryIso2]);

    // ── Coordenadas -> dirección (inversa, sin tocar el pin) ─────────────────
    const runReverse = useCallback(
        (nextLat: number, nextLng: number) => {
            const key = `${nextLat.toFixed(4)},${nextLng.toFixed(4)}`;

            if (lastReverseKeyRef.current === key) {
                return;
            }

            lastReverseKeyRef.current = key;

            reverseAbortRef.current?.abort();
            const controller = new AbortController();
            reverseAbortRef.current = controller;

            setStatus('searching');

            reverseGeocode(nextLat, nextLng, {
                mapboxToken,
                signal: controller.signal,
            })
                .then((result) => {
                    if (controller.signal.aborted) {
                        return;
                    }

                    if (!result) {
                        setStatus('not_found');

                        return;
                    }

                    setLastResult(result);
                    setStatus('resolved');

                    // Las coordenadas del usuario mandan: se reenvían sin cambiar
                    // para que el payload quede coherente con el pin en pantalla.
                    const patch: LocationPatch = { latitud: nextLat, longitud: nextLng };

                    if (result.direccion) {
                        patch.direccion = result.direccion;
                    }

                    if (result.codigo_postal) {
                        patch.codigo_postal = result.codigo_postal;
                    }

                    if (result.estado) {
                        patch.estado = result.estado;
                    }

                    if (result.ciudad) {
                        patch.ciudad = result.ciudad;
                    }

                    if (result.colonia) {
                        patch.colonia = result.colonia;
                    }

                    onResolvedRef.current(patch);
                })
                .catch(() => setStatus('error'));
        },
        [mapboxToken],
    );

    const setManualCoordinates = useCallback(
        (nextLat: number, nextLng: number, prefill?: Partial<GeocodeResult> | null) => {
            if (!isValidCoordinate(nextLat, nextLng)) {
                return;
            }

            // Cancela cualquier autocompletado en vuelo: el usuario ya decidió.
            forwardAbortRef.current?.abort();
            setCoordinateSource('manual');
            coordinateSourceRef.current = 'manual';

            // Escritura optimista: el pin y el payload quedan sincronizados en el
            // acto, sin esperar a la red. Ahí estaba el "congelamiento" percibido.
            const patch: LocationPatch = { latitud: nextLat, longitud: nextLng };

            if (prefill?.direccion) {
                patch.direccion = prefill.direccion;
            }

            if (prefill?.codigo_postal) {
                patch.codigo_postal = prefill.codigo_postal;
            }

            if (prefill?.estado) {
                patch.estado = prefill.estado;
            }

            onResolvedRef.current(patch);

            if (!prefill?.direccion) {
                runReverse(nextLat, nextLng);
            } else {
                lastReverseKeyRef.current = `${nextLat.toFixed(4)},${nextLng.toFixed(4)}`;
                setStatus('resolved');
            }
        },
        [runReverse],
    );

    const releaseManualCoordinates = useCallback(() => {
        setCoordinateSource('geocoded');
        coordinateSourceRef.current = 'geocoded';
    }, []);

    // El estado visible se deriva del render en lugar de guardarse aparte: así
    // no hay `setState` dentro de efectos ni renders encadenados, y nunca queda
    // un estado obsoleto cuando la consulta deja de ser geocodificable.
    const exposedStatus: GeocodeStatus = isTyping
        ? 'typing'
        : ! isQueryGeocodable(debouncedQuery) && coordinateSource !== 'manual'
          ? 'idle'
          : status;

    return {
        status: exposedStatus,
        isBusy: isTyping || status === 'searching',
        lastResult,
        coordinateSource,
        setManualCoordinates,
        releaseManualCoordinates,
    };
}
