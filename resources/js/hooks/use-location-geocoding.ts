import { useCallback, useRef, useState } from 'react';

export interface StructuredAddress {
    pais?: string;
    estado?: string;
    ciudad?: string;
    colonia?: string;
    direccion?: string;
    codigo_postal?: string;
}

export interface GeocodeResult {
    lat: number;
    lng: number;
    direccion?: string;
    estado?: string;
    codigo_postal?: string;
    ciudad?: string;
    pais?: string;
    zona_horaria?: string;
}

interface UseLocationGeocodingOptions {
    mapboxApiKey?: string | null;
    debounceMs?: number;
}

/**
 * Función helper para inferir la zona horaria según coordenadas.
 * Incluye fallback matemático para husos horarios de México.
 */
export const getTimezoneFromCoordinates = async (lat: number, lng: number): Promise<string | null> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`,
            { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data.timeZone?.ianaTimeId) {
                return data.timeZone.ianaTimeId;
            }
        }
    } catch (_) {
        // Fallback silencioso a aproximación regional
    }

    // Reglas para México basadas en coordenadas
    if (lat >= 14 && lat <= 33 && lng >= -118 && lng <= -86) {
        if (lng < -114) return 'America/Tijuana';
        if (lng < -104 && lat > 22) return 'America/Mazatlan';
        if (lng > -88 && lat < 22) return 'America/Cancun';
        return 'America/Mexico_City';
    }

    return null;
};

/**
 * Hook reutilizable para geocodificación progresiva (texto -> mapa) y reversa (mapa -> texto).
 * Garantiza manejo asíncrono no bloqueante con debounce y cancelación de peticiones con AbortController.
 */
export function useLocationGeocoding(options: UseLocationGeocodingOptions = {}) {
    const { mapboxApiKey, debounceMs = 650 } = options;
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
    const [geocodingError, setGeocodingError] = useState<string | null>(null);

    const forwardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const forwardAbortRef = useRef<AbortController | null>(null);

    const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reverseAbortRef = useRef<AbortController | null>(null);

    const cancelPending = useCallback(() => {
        if (forwardTimerRef.current) {
            clearTimeout(forwardTimerRef.current);
            forwardTimerRef.current = null;
        }
        if (forwardAbortRef.current) {
            forwardAbortRef.current.abort();
            forwardAbortRef.current = null;
        }
        if (reverseTimerRef.current) {
            clearTimeout(reverseTimerRef.current);
            reverseTimerRef.current = null;
        }
        if (reverseAbortRef.current) {
            reverseAbortRef.current.abort();
            reverseAbortRef.current = null;
        }
        setIsGeocoding(false);
        setIsReverseGeocoding(false);
    }, []);

    /**
     * Construye un query textual estructurado a partir de los campos del formulario.
     */
    const buildQueryString = useCallback((data: StructuredAddress | string): string => {
        if (typeof data === 'string') {
            return data.trim();
        }

        const parts: string[] = [];
        if (data.direccion?.trim()) parts.push(data.direccion.trim());
        if (data.colonia?.trim()) parts.push(data.colonia.trim());
        if (data.ciudad?.trim()) parts.push(data.ciudad.trim());
        if (data.codigo_postal?.trim()) parts.push(data.codigo_postal.trim());
        if (data.estado?.trim()) parts.push(data.estado.trim());
        if (data.pais?.trim()) parts.push(data.pais.trim());

        return parts.join(', ');
    }, []);

    /**
     * Geocodificación directa (Forward Geocoding): Convierte dirección en coordenadas.
     */
    const forwardGeocode = useCallback(
        (address: StructuredAddress | string): Promise<GeocodeResult | null> => {
            const query = buildQueryString(address);
            if (!query || query.length < 3) {
                return Promise.resolve(null);
            }

            if (forwardTimerRef.current) {
                clearTimeout(forwardTimerRef.current);
            }
            if (forwardAbortRef.current) {
                forwardAbortRef.current.abort();
            }

            const abortController = new AbortController();
            forwardAbortRef.current = abortController;

            return new Promise<GeocodeResult | null>((resolve) => {
                forwardTimerRef.current = setTimeout(async () => {
                    setIsGeocoding(true);
                    setGeocodingError(null);

                    try {
                        let result: GeocodeResult | null = null;

                        // 1. Intentar con Mapbox si se cuenta con API Key
                        if (mapboxApiKey) {
                            try {
                                const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                                    query
                                )}.json?access_token=${mapboxApiKey}&language=es&limit=1`;

                                const response = await fetch(mapboxUrl, {
                                    signal: abortController.signal,
                                });

                                if (response.ok) {
                                    const data = await response.json();
                                    if (data.features && data.features.length > 0) {
                                        const feature = data.features[0];
                                        const [lng, lat] = feature.center;
                                        result = {
                                            lat,
                                            lng,
                                            direccion: feature.place_name,
                                        };
                                    }
                                }
                            } catch (e: any) {
                                if (e.name === 'AbortError') return;
                                // Fallback a Nominatim si Mapbox falla
                            }
                        }

                        // 2. Fallback a Nominatim si Mapbox no arrojó resultados
                        if (!result && !abortController.signal.aborted) {
                            try {
                                const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                                    query
                                )}&limit=1&addressdetails=1&accept-language=es`;

                                const response = await fetch(osmUrl, {
                                    headers: { 'Accept-Language': 'es' },
                                    signal: abortController.signal,
                                });

                                if (response.ok) {
                                    const data = await response.json();
                                    if (data && data.length > 0) {
                                        const first = data[0];
                                        result = {
                                            lat: parseFloat(first.lat),
                                            lng: parseFloat(first.lon),
                                            direccion: first.display_name,
                                            estado: first.address?.state,
                                            codigo_postal: first.address?.postcode,
                                            ciudad: first.address?.city || first.address?.town || first.address?.village,
                                            pais: first.address?.country,
                                        };
                                    }
                                }
                            } catch (e: any) {
                                if (e.name === 'AbortError') return;
                            }
                        }

                        if (result) {
                            const tz = await getTimezoneFromCoordinates(result.lat, result.lng);
                            result.zona_horaria = tz || undefined;
                        }

                        setIsGeocoding(false);
                        resolve(result);
                    } catch (err: any) {
                        if (err.name !== 'AbortError') {
                            setGeocodingError('Error al resolver la dirección.');
                            setIsGeocoding(false);
                        }
                        resolve(null);
                    }
                }, debounceMs);
            });
        },
        [mapboxApiKey, debounceMs, buildQueryString]
    );

    /**
     * Geocodificación inversa (Reverse Geocoding): Convierte coordenadas en dirección estructurada.
     */
    const reverseGeocode = useCallback(
        (lat: number, lng: number): Promise<GeocodeResult | null> => {
            if (reverseTimerRef.current) {
                clearTimeout(reverseTimerRef.current);
            }
            if (reverseAbortRef.current) {
                reverseAbortRef.current.abort();
            }

            const abortController = new AbortController();
            reverseAbortRef.current = abortController;

            return new Promise<GeocodeResult | null>((resolve) => {
                reverseTimerRef.current = setTimeout(async () => {
                    setIsReverseGeocoding(true);

                    try {
                        let result: GeocodeResult = { lat, lng };

                        // 1. Intentar con Mapbox si existe API Key
                        if (mapboxApiKey) {
                            try {
                                const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxApiKey}&language=es&limit=1`;
                                const response = await fetch(mapboxUrl, {
                                    signal: abortController.signal,
                                });

                                if (response.ok) {
                                    const data = await response.json();
                                    if (data.features && data.features.length > 0) {
                                        result.direccion = data.features[0].place_name || '';
                                        for (const f of data.features) {
                                            if (f.place_type.includes('postcode')) {
                                                result.codigo_postal = f.text;
                                            }
                                            if (f.place_type.includes('region')) {
                                                result.estado = f.text;
                                            }
                                            if (f.place_type.includes('place')) {
                                                result.ciudad = f.text;
                                            }
                                            if (f.place_type.includes('country')) {
                                                result.pais = f.text;
                                            }
                                        }
                                    }
                                }
                            } catch (e: any) {
                                if (e.name === 'AbortError') return;
                            }
                        }

                        // 2. Fallback con Nominatim si no tenemos dirección
                        if (!result.direccion && !abortController.signal.aborted) {
                            try {
                                const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`;
                                const response = await fetch(osmUrl, {
                                    headers: { 'Accept-Language': 'es' },
                                    signal: abortController.signal,
                                });

                                if (response.ok) {
                                    const data = await response.json();
                                    result.direccion = data.display_name ?? '';
                                    if (data.address) {
                                        result.codigo_postal = data.address.postcode;
                                        result.estado = data.address.state;
                                        result.ciudad = data.address.city || data.address.town || data.address.village;
                                        result.pais = data.address.country;
                                    }
                                }
                            } catch (e: any) {
                                if (e.name === 'AbortError') return;
                            }
                        }

                        // Obtener zona horaria
                        const tz = await getTimezoneFromCoordinates(lat, lng);
                        result.zona_horaria = tz || undefined;

                        setIsReverseGeocoding(false);
                        resolve(result);
                    } catch (err: any) {
                        if (err.name !== 'AbortError') {
                            setIsReverseGeocoding(false);
                        }
                        resolve(null);
                    }
                }, 350); // Debounce de 350ms al soltar el marcador
            });
        },
        [mapboxApiKey]
    );

    return {
        forwardGeocode,
        reverseGeocode,
        cancelPending,
        isGeocoding,
        isReverseGeocoding,
        geocodingError,
    };
}
