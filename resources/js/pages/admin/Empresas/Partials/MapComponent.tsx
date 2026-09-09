import React, { useCallback, useState } from 'react';
import MapboxMap from '@/components/mapbox-map';
import type {MapAddressDetails} from '@/components/mapbox-map';

export interface LocationDetails {
    direccion?: string;
    codigo_postal?: string;
    colonia?: string;
    ciudad?: string;
    estado?: string;
    pais?: string;
    timezone?: string;
}

interface MapComponentProps {
    center: [number, number];
    zoom: number;
    style: React.CSSProperties;
    markerPosition: [number, number] | null;
    onLocationSelected: (
        lat: number,
        lng: number,
        address?: string,
        timezone?: string,
        details?: LocationDetails,
    ) => void;
}

// Zona horaria IANA a partir de coordenadas. Best-effort con timeout y fallback
// determinista para México; nunca lanza.
export const getTimezoneFromCoords = async (lat: number, lng: number): Promise<string | null> => {
    try {
        const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`,
            { signal: AbortSignal.timeout(6000) },
        );

        if (res.ok) {
            const data = await res.json();

            if (data.timeZone?.ianaTimeId) {
                return data.timeZone.ianaTimeId;
            }
        }
    } catch {
        // Fallback silencioso
    }

    // Detección aproximada para México según longitud/latitud.
    if (lat >= 14 && lat <= 33 && lng >= -118 && lng <= -86) {
        if (lng < -114) {
return 'America/Tijuana';
}

        if (lng < -104 && lat > 22) {
return 'America/Mazatlan';
}

        if (lng > -88 && lat < 22) {
return 'America/Cancun';
}

        return 'America/Mexico_City';
    }

    return null;
};

const EmpresaMapComponent: React.FC<MapComponentProps> = ({ center, markerPosition, zoom, onLocationSelected }) => {
    const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

    const lat = markerPosition ? Number(markerPosition[0]) : 0;
    const lng = markerPosition ? Number(markerPosition[1]) : 0;

    // El pin/clic dispara `onChange` dos veces: (1) coordenadas inmediatas —
    // prevalecen por precisión — y (2) dirección estructurada ya resuelta.
    const handleChange = useCallback(
        (newLat: number, newLng: number, details?: MapAddressDetails) => {
            if (!details) {
                onLocationSelected(newLat, newLng);
                getTimezoneFromCoords(newLat, newLng).then((tz) => {
                    if (tz) {
                        onLocationSelected(newLat, newLng, undefined, tz);
                    }
                });

                return;
            }

            onLocationSelected(newLat, newLng, details.direccion, undefined, {
                direccion: details.direccion,
                codigo_postal: details.codigo_postal,
                colonia: details.colonia,
                ciudad: details.ciudad,
                estado: details.estado,
                pais: details.pais,
            });
        },
        [onLocationSelected],
    );

    return (
        <div className="relative h-full w-full" style={{ minHeight: '320px' }}>
            <MapboxMap
                lat={lat}
                lng={lng}
                center={center}
                zoom={zoom}
                onChange={handleChange}
                onGeocodingChange={setIsGeocodingLoading}
                interactive={true}
                className="h-full w-full rounded-none border-none"
            />
            {isGeocodingLoading && (
                <div className="pointer-events-none absolute bottom-2 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                    Obteniendo ubicación y zona horaria...
                </div>
            )}
        </div>
    );
};

export default EmpresaMapComponent;
