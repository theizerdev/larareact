import React from 'react';

interface MapComponentProps {
    center: [number, number];
    zoom: number;
    style: React.CSSProperties;
    markerPosition: [number, number] | null;
    onLocationSelected: (lat: number, lng: number, address?: string) => void;
}

/**
 * Componente de mapa Leaflet para registrar la ubicación de una empresa.
 * Carga react-leaflet dinámicamente (SSR-safe).
 * Al hacer clic en el mapa, actualiza lat/lng e intenta obtener la dirección via Nominatim.
 */
const EmpresaMapComponent: React.FC<MapComponentProps> = (props) => {
    const [LeafletComponents, setLeafletComponents] = React.useState<{
        MapContainer: any;
        TileLayer: any;
        Marker: any;
        useMapEvents: any;
        useMap: any;
    } | null>(null);
    const [isGeocodingLoading, setIsGeocodingLoading] = React.useState(false);

    React.useEffect(() => {
        import('react-leaflet').then((mod) => {
            setLeafletComponents({
                MapContainer: mod.MapContainer,
                TileLayer: mod.TileLayer,
                Marker: mod.Marker,
                useMapEvents: mod.useMapEvents,
                useMap: mod.useMap,
            });
        });
    }, []);

    if (!LeafletComponents) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-slate-500 text-sm">Cargando mapa...</p>
            </div>
        );
    }

    const { MapContainer, TileLayer, Marker, useMapEvents, useMap } = LeafletComponents;

    /**
     * Componente interno que sincroniza el centro del mapa cuando cambia el prop `center`.
     */
    const MapCenterSync: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
        const map = useMap();
        React.useEffect(() => {
            map.setView(center, zoom, { animate: true });
        }, [center[0], center[1], zoom]);
        return null;
    };

    /**
     * Componente interno que maneja los clics en el mapa.
     * Realiza geocoding inverso con OpenStreetMap Nominatim.
     */
    const MapClickHandler: React.FC<{
        onLocationSelected: (lat: number, lng: number, address?: string) => void;
        setGeocodingLoading: (v: boolean) => void;
    }> = ({ onLocationSelected, setGeocodingLoading }) => {
        useMapEvents({
            async click(e: any) {
                const { lat, lng } = e.latlng;
                // Notificar coordenadas inmediatamente
                onLocationSelected(lat, lng);
                // Intentar geocoding inverso
                try {
                    setGeocodingLoading(true);
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`,
                        { headers: { 'Accept-Language': 'es' } }
                    );
                    if (res.ok) {
                        const data = await res.json();
                        const address = data.display_name ?? '';
                        onLocationSelected(lat, lng, address);
                    }
                } catch (_) {
                    // Si falla el geocoding, no pasa nada — las coordenadas ya están
                } finally {
                    setGeocodingLoading(false);
                }
            },
        });
        return null;
    };

    return (
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            <MapContainer center={props.center} zoom={props.zoom} style={props.style}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <MapCenterSync center={props.center} zoom={props.zoom} />
                {props.markerPosition && <Marker position={props.markerPosition} />}
                <MapClickHandler
                    onLocationSelected={props.onLocationSelected}
                    setGeocodingLoading={setIsGeocodingLoading}
                />
            </MapContainer>
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
