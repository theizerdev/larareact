import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { forwardGeocode, reverseGeocode  } from '@/lib/geocoding';
import type {GeoAddress} from '@/lib/geocoding';

/**
 * Hook de geocodificación con debounce (Incidencia 1 — Ubicación / Mapas).
 *
 * - Debounce configurable: escribir en los campos de dirección no dispara una
 *   petición por tecla.
 * - Cada llamada aborta la anterior (AbortController) => sin condiciones de
 *   carrera ni resultados obsoletos pisando datos nuevos.
 * - Nunca bloquea el hilo ni lanza: entrega el resultado por callback.
 * - `loading` para pintar estados de carga; se limpia todo al desmontar.
 *
 * El token de Mapbox se toma de las props compartidas de Inertia (config por
 * empresa). Si no hay token, `lib/geocoding` cae a Nominatim/OpenStreetMap.
 */

interface UseGeocodingOptions {
    debounceMs?: number;
    /** ISO 3166-1 alpha-2 para sesgar resultados (p. ej. "mx"). */
    country?: string;
}

type ResultHandler = (result: GeoAddress | null) => void;

export function useGeocoding(options: UseGeocodingOptions = {}) {
    const { debounceMs = 600, country } = options;

    const props = usePage().props as Record<string, unknown>;
    const auth = props.auth as { user?: { empresa?: { mapbox_api_key?: string | null; mapbox_active?: boolean } } } | undefined;
    const token = (props.mapbox_api_key as string | undefined) ?? auth?.user?.empresa?.mapbox_api_key ?? null;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;

            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            abortRef.current?.abort();
        };
    }, []);

    const cancel = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        abortRef.current?.abort();
        abortRef.current = null;

        if (mountedRef.current) {
            setLoading(false);
        }
    }, []);

    const run = useCallback(
        (task: (signal: AbortSignal) => Promise<GeoAddress | null>, onResult: ResultHandler, immediate: boolean) => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            const fire = () => {
                abortRef.current?.abort();
                const ctrl = new AbortController();
                abortRef.current = ctrl;

                if (mountedRef.current) {
                    setLoading(true);
                    setError(null);
                }

                task(ctrl.signal)
                    .then((result) => {
                        if (ctrl.signal.aborted || !mountedRef.current) {
                            return;
                        }

                        if (!result) {
                            setError('no-result');
                        }

                        onResult(result);
                    })
                    .catch(() => {
                        if (!ctrl.signal.aborted && mountedRef.current) {
                            setError('error');
                            onResult(null);
                        }
                    })
                    .finally(() => {
                        if (abortRef.current === ctrl && mountedRef.current) {
                            setLoading(false);
                        }
                    });
            };

            if (immediate) {
                fire();
            } else {
                timerRef.current = setTimeout(fire, debounceMs);
            }
        },
        [debounceMs],
    );

    /** Texto → ubicación. Debounced salvo que `immediate` sea true. */
    const geocode = useCallback(
        (query: string, onResult: ResultHandler, immediate = false) => {
            run((signal) => forwardGeocode(query, { token, country, signal }), onResult, immediate);
        },
        [run, token, country],
    );

    /** Coordenadas → dirección estructurada. Inmediata por defecto (el pin ya se movió). */
    const reverse = useCallback(
        (lat: number, lng: number, onResult: ResultHandler, immediate = true) => {
            run((signal) => reverseGeocode(lat, lng, { token, signal }), onResult, immediate);
        },
        [run, token],
    );

    return { geocode, reverse, cancel, loading, error, hasToken: !!token };
}
