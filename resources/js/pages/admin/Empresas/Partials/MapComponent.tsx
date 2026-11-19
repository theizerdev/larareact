import React, { useCallback, useRef } from 'react';
import LeafletMap, { LeafletAddressDetails } from '@/components/leaflet-map';
import { getTimezoneFromCoordinates } from '@/hooks/use-location-geocoding';

interface MapComponentProps {
    center?: [number | string | null | undefined, number | string | null | undefined];
    zoom?: number;
    style?: React.CSSProperties;
    markerPosition: [number | string | null | undefined, number | string | null | undefined] | null;
    onLocationSelected: (lat: number, lng: number, address?: string, timezone?: string) => void;
}

// Re-exportar para retrocompatibilidad
export const getTimezoneFromCoords = getTimezoneFromCoordinates;

const safeCoord = (val: any, fallback: number = 0): number => {
    if (val === null || val === undefined || val === '') return fallback;
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    return isNaN(num) ? fallback : num;
};

const EmpresaMapComponent: React.FC<MapComponentProps> = ({
    markerPosition,
    center,
    zoom = 13,
    onLocationSelected,
}) => {
    const rawLat = markerPosition ? markerPosition[0] : (center ? center[0] : null);
    const rawLng = markerPosition ? markerPosition[1] : (center ? center[1] : null);

    const lat = safeCoord(rawLat, 19.9213);
    const lng = safeCoord(rawLng, -102.0152);

    const onLocationSelectedRef = useRef(onLocationSelected);
    onLocationSelectedRef.current = onLocationSelected;

    const handleMapChange = useCallback(async (newLat: number, newLng: number, details?: LeafletAddressDetails) => {
        const tz = details?.zona_horaria || (await getTimezoneFromCoordinates(newLat, newLng));

        onLocationSelectedRef.current(
            newLat,
            newLng,
            details?.direccion || undefined,
            tz || undefined
        );
    }, []);

    return (
        <div className="relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden">
            <LeafletMap
                lat={lat}
                lng={lng}
                zoom={zoom}
                onChange={handleMapChange}
                interactive={true}
                className="h-full w-full rounded-2xl"
            />
        </div>
    );
};

export default EmpresaMapComponent;
