import React, { useCallback, useEffect, useRef, useState } from 'react';
import MapboxMap from '@/components/mapbox-map';
import type {MapAddressDetails} from '@/components/mapbox-map';
import { isValidCoordinate, toCoordinate } from '@/lib/geocoding';

interface MapComponentProps {
    center: [number, number];
    zoom: number;
    style: React.CSSProperties;
    markerPosition: [number, number] | [string, string] | null;
    onLocationSelected: (lat: number, lng: number, address?: string, timezone?: string) => void;
}

const TIMEZONE_TIMEOUT_MS = 6_000;

/**
 * Zona horaria IANA a partir de coordenadas.
 *
 * Con timeout y `AbortSignal`: si BigDataCloud no responde caemos a la regla
 * local para México en vez de dejar la interfaz esperando indefinidamente.
 */
export const getTimezoneFromCoords = async (lat: number, lng: number, signal?: AbortSignal): Promise<string | null> => {
    const controller = new AbortController();
    const onExternalAbort = () => controller.abort();

    if (signal) {
        if (signal.aborted) {
            return null;
        }

        signal.addEventListener('abort', onExternalAbort, { once: true });
    }

    const timer = setTimeout(() => controller.abort(), TIMEZONE_TIMEOUT_MS);

    try {
        const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`,
            { signal: controller.signal },
        );

        if (res.ok) {
            const data = await res.json();

            if (data?.timeZone?.ianaTimeId) {
                return data.timeZone.ianaTimeId;
            }
        }
    } catch {
        // Respaldo silencioso: seguimos con la regla local de abajo.
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onExternalAbort);
    }

    // Regla de detección precisa para México basada en coordenadas.
    if (lat >= 14 && lat <= 33 && lng >= -118 && lng <= -86) {
        if (lng < -114) {
return 'America/Tijuana';
}              // Baja California (Noroeste UTC-8)

        if (lng < -104 && lat > 22) {
return 'America/Mazatlan';
}  // Sinaloa, Nayarit, BCS (Pacífico UTC-7)

        if (lng > -88 && lat < 22) {
return 'America/Cancun';
}     // Quintana Roo (Sureste UTC-5)

        return 'America/Mexico_City';                          // Centro (UTC-6)
    }

    return null;
};

const EmpresaMapComponent: React.FC<MapComponentProps> = ({ markerPosition, zoom, onLocationSelected }) => {
    const [isResolvingTimezone, setIsResolvingTimezone] = useState(false);
    const timezoneAbortRef = useRef<AbortController | null>(null);

    // Efecto sin array de dependencias en lugar de asignar en el render: el
    // React Compiler prohíbe mutar refs durante el render.
    const onLocationSelectedRef = useRef(onLocationSelected);

    useEffect(() => {
        onLocationSelectedRef.current = onLocationSelected;
    });

    const lat = markerPosition ? toCoordinate(markerPosition[0]) : null;
    const lng = markerPosition ? toCoordinate(markerPosition[1]) : null;

    useEffect(() => {
        return () => timezoneAbortRef.current?.abort();
    }, []);

    /**
     * `MapboxMap` ya resuelve la dirección (una sola petición, cancelable) y
     * llama a esto dos veces: primero con las coordenadas y luego con la
     * dirección. Aquí sólo añadimos la zona horaria.
     *
     * Antes este componente lanzaba su propio `reverse` a Nominatim además del
     * de Mapbox y del de la página padre: hasta cinco peticiones encadenadas por
     * clic, en serie y sin cancelar. Ese era el origen del bloqueo.
     */
    const handleLocationChange = useCallback((newLat: number, newLng: number, details?: MapAddressDetails) => {
        if (!isValidCoordinate(newLat, newLng)) {
            return;
        }

        // Propagación inmediata: el formulario no espera a la red.
        onLocationSelectedRef.current(newLat, newLng, details?.direccion);

        // La zona horaria sólo se recalcula en la primera emisión (la que trae
        // las coordenadas), no en la segunda que ya sólo añade la dirección.
        if (details) {
            return;
        }

        timezoneAbortRef.current?.abort();
        const controller = new AbortController();
        timezoneAbortRef.current = controller;
        setIsResolvingTimezone(true);

        getTimezoneFromCoords(newLat, newLng, controller.signal)
            .then((tz) => {
                if (!controller.signal.aborted && tz) {
                    onLocationSelectedRef.current(newLat, newLng, undefined, tz);
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsResolvingTimezone(false);
                }
            });
    }, []);

    return (
        <div className="relative w-full h-full" style={{ minHeight: '320px' }}>
            <MapboxMap
                lat={lat}
                lng={lng}
                zoom={zoom}
                onChange={handleLocationChange}
                interactive={true}
                className="h-full w-full border-none rounded-none"
            />

            {isResolvingTimezone && (
                <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-white shadow-lg">
                    Obteniendo zona horaria...
                </div>
            )}
        </div>
    );
};

export default EmpresaMapComponent;
