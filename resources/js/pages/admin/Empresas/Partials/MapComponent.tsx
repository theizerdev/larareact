import React, { useState } from 'react';
import MapboxMap from '@/components/mapbox-map';

interface MapComponentProps {
    center: [number, number];
    zoom: number;
    style: React.CSSProperties;
    markerPosition: [number, number] | null;
    onLocationSelected: (lat: number, lng: number, address?: string) => void;
}

const EmpresaMapComponent: React.FC<MapComponentProps> = ({
    markerPosition,
    zoom,
    onLocationSelected
}) => {
    const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

    const lat = markerPosition ? markerPosition[0] : 0;
    const lng = markerPosition ? markerPosition[1] : 0;

    const handleLocationChange = async (newLat: number, newLng: number) => {
        onLocationSelected(newLat, newLng);

        try {
            setIsGeocodingLoading(true);
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&accept-language=es`,
                { headers: { 'Accept-Language': 'es' } }
            );

            if (res.ok) {
                const data = await res.json();
                const address = data.display_name ?? '';
                onLocationSelected(newLat, newLng, address);
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
                    Obteniendo dirección...
                </div>
            )}
        </div>
    );
};

export default EmpresaMapComponent;
