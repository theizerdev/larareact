import React, { useCallback, useRef } from 'react';
import MapboxMap, { MapAddressDetails } from '@/components/mapbox-map';
import { getTimezoneFromCoordinates } from '@/hooks/use-location-geocoding';

interface MapComponentProps {
    center?: [number, number];
    zoom?: number;
    style?: React.CSSProperties;
    markerPosition: [number, number] | null;
    onLocationSelected: (lat: number, lng: number, address?: string, timezone?: string) => void;
}

// Re-exportar para retrocompatibilidad
export const getTimezoneFromCoords = getTimezoneFromCoordinates;

const EmpresaMapComponent: React.FC<MapComponentProps> = ({
    markerPosition,
    zoom = 9,
    onLocationSelected
}) => {
    const lat = markerPosition ? markerPosition[0] : 0;
    const lng = markerPosition ? markerPosition[1] : 0;

    const onLocationSelectedRef = useRef(onLocationSelected);
    onLocationSelectedRef.current = onLocationSelected;

    const handleMapChange = useCallback(async (newLat: number, newLng: number, details?: MapAddressDetails) => {
        // Obtener zona horaria según coordenadas
        const tz = await getTimezoneFromCoordinates(newLat, newLng);

        // Notificar coordenadas, dirección y zona horaria
        onLocationSelectedRef.current(
            newLat,
            newLng,
            details?.direccion || undefined,
            tz || undefined
        );
    }, []);

    return (
        <div className="relative w-full h-full" style={{ minHeight: '320px' }}>
            <MapboxMap
                lat={lat}
                lng={lng}
                zoom={zoom}
                onChange={handleMapChange}
                interactive={true}
                className="h-full w-full border-none rounded-none"
            />
        </div>
    );
};

export default EmpresaMapComponent;
