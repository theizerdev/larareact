import React, { useState } from 'react';
import MapboxMap from '@/components/mapbox-map';

interface MapComponentProps {
    center: [number, number];
    zoom: number;
    style: React.CSSProperties;
    markerPosition: [number, number] | null;
    onLocationSelected: (lat: number, lng: number, address?: string, timezone?: string) => void;
}

// Función helper para obtener la zona horaria IANA según coordenadas
export const getTimezoneFromCoords = async (lat: number, lng: number): Promise<string | null> => {
    try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`);
        if (res.ok) {
            const data = await res.json();
            if (data.timeZone?.ianaTimeId) {
                return data.timeZone.ianaTimeId;
            }
        }
    } catch (_) {
        // Fallback silencioso
    }

    // Regla de detección precisa para México basada en coordenadas (latitud y longitud)
    if (lat >= 14 && lat <= 33 && lng >= -118 && lng <= -86) {
        if (lng < -114) return 'America/Tijuana';             // Baja California (Noroeste UTC-8)
        if (lng < -104 && lat > 22) return 'America/Mazatlan'; // Sinaloa, Nayarit, BCS (Pacífico UTC-7)
        if (lng > -88 && lat < 22) return 'America/Cancun';   // Quintana Roo (Sureste UTC-5)
        return 'America/Mexico_City';                          // Centro (UTC-6)
    }

    return null;
};

const EmpresaMapComponent: React.FC<MapComponentProps> = ({
    markerPosition,
    zoom,
    onLocationSelected
}) => {
    const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

    const lat = markerPosition ? markerPosition[0] : 0;
    const lng = markerPosition ? markerPosition[1] : 0;

    const handleLocationChange = async (newLat: number, newLng: number) => {
        const tz = await getTimezoneFromCoords(newLat, newLng);
        onLocationSelected(newLat, newLng, undefined, tz || undefined);

        try {
            setIsGeocodingLoading(true);
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&accept-language=es`,
                { headers: { 'Accept-Language': 'es' } }
            );

            if (res.ok) {
                const data = await res.json();
                const address = data.display_name ?? '';
                onLocationSelected(newLat, newLng, address, tz || undefined);
            }
        } catch (_) {
            // Error silencioso
        } finally {
            setIsGeocodingLoading(false);
        }
    };

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
            {isGeocodingLoading && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1000,
                        background: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        pointerEvents: 'none',
                    }}
                >
                    Obteniendo ubicación y zona horaria...
                </div>
            )}
        </div>
    );
};

export default EmpresaMapComponent;
