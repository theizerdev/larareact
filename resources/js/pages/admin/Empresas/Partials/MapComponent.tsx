import React, { useState } from 'react';
import LeafletMap from '@/components/leaflet-map';

interface MapComponentProps {
    center?: [number, number];
    zoom?: number;
    style?: React.CSSProperties;
    markerPosition?: [number, number] | null;
    onLocationSelected: (lat: number, lng: number, address?: string) => void;
}

const EmpresaMapComponent: React.FC<MapComponentProps> = ({
    markerPosition,
    zoom = 12,
    onLocationSelected
}) => {
    const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

    const lat = markerPosition ? markerPosition[0] : 0;
    const lng = markerPosition ? markerPosition[1] : 0;

    const handleLocationChange = async (newLat: number, newLng: number) => {
        // 1. Actualizar inmediatamente latitud y longitud en el formulario
        onLocationSelected(newLat, newLng);

        // 2. Obtener dirección por geocodificación inversa
        try {
            setIsGeocodingLoading(true);
            let address = '';

            // Intento 1: Nominatim OpenStreetMap
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLat}&lon=${newLng}&zoom=18&addressdetails=1`,
                    { headers: { 'Accept-Language': 'es' } }
                );
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.display_name) {
                        address = data.display_name;
                    }
                }
            } catch (_) {
                // Fallback silencioso
            }

            // Intento 2: BigDataCloud API (gratuita, sin CORS restriction)
            if (!address) {
                try {
                    const res2 = await fetch(
                        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${newLat}&longitude=${newLng}&localityLanguage=es`
                    );
                    if (res2.ok) {
                        const data2 = await res2.json();
                        const parts = [
                            data2.locality || data2.city,
                            data2.principalSubdivision || data2.state,
                            data2.countryName
                        ].filter(Boolean);

                        if (parts.length > 0) {
                            address = parts.join(', ');
                        }
                    }
                } catch (_) {
                    // Fallback silencioso
                }
            }

            // Si se obtuvo una dirección, actualizar el campo de dirección en el formulario
            if (address) {
                onLocationSelected(newLat, newLng, address);
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
        } finally {
            setIsGeocodingLoading(false);
        }
    };

    return (
        <div className="relative w-full h-full" style={{ minHeight: '320px' }}>
            <LeafletMap
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
                        bottom: 12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1000,
                        background: 'rgba(15, 23, 42, 0.85)',
                        color: '#fff',
                        padding: '6px 16px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        pointerEvents: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    Obteniendo dirección automáticamente...
                </div>
            )}
        </div>
    );
};

export default EmpresaMapComponent;
