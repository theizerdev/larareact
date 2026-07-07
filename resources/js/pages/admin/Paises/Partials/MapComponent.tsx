import React from 'react';

// Definimos las props que recibirá nuestro componente de mapa
interface MapComponentProps {
    center: [number, number];
    zoom: number;
    style: React.CSSProperties;
    hasCoordinates: boolean;
    markerPosition: [number, number] | null;
    onLocationSelected: (lat: number, lng: number) => void;
}

// Este componente solo se renderiza en el cliente, por lo que importamos react-leaflet dinámicamente
const MapComponent: React.FC<MapComponentProps> = (props) => {
    const [LeafletComponents, setLeafletComponents] = React.useState<{
        MapContainer: any;
        TileLayer: any;
        Marker: any;
        useMapEvents: any;
    } | null>(null);

    // Cargamos los componentes de Leaflet solo cuando el componente se monta en el cliente
    React.useEffect(() => {
        import('react-leaflet').then(mod => {
            setLeafletComponents({
                MapContainer: mod.MapContainer,
                TileLayer: mod.TileLayer,
                Marker: mod.Marker,
                useMapEvents: mod.useMapEvents
            });
        });
    }, []);

    // Si aún no hemos cargado los componentes, mostramos un loading
    if (!LeafletComponents) {
        return <p className="text-slate-500">Cargando mapa...</p>;
    }

    // Extraemos los componentes cargados
    const { MapContainer, TileLayer, Marker, useMapEvents } = LeafletComponents;

    // Componente interno que maneja los eventos de clic en el mapa
    const MapClickHandler: React.FC<{ onLocationSelected: (lat: number, lng: number) => void }> = ({ onLocationSelected }) => {
        useMapEvents({
            click(e: any) {
                onLocationSelected(e.latlng.lat, e.latlng.lng);
            },
        });
        return null;
    };

    return (
        <MapContainer center={props.center} zoom={props.zoom} style={props.style}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {props.hasCoordinates && props.markerPosition && <Marker position={props.markerPosition} />}
            <MapClickHandler onLocationSelected={props.onLocationSelected} />
        </MapContainer>
    );
};

export default MapComponent;