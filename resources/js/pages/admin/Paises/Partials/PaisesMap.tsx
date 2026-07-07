
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- Corrección para el ícono de Leaflet en React ---
// Por defecto, React no maneja bien los íconos de Leaflet.
// Esta sección importa los íconos manualmente y los reasigna
// para que Webpack los procese correctamente.
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});
// --- Fin de la corrección ---

// Reutilizamos la interfaz definida en la página principal
interface Pais {
    id: number;
    nombre: string;
    latitud: number | null;
    longitud: number | null;
}

interface PaisesMapProps {
    paises: Pais[];
}

/**
 * Renderiza un mapa de Leaflet con marcadores para cada país que tenga coordenadas.
 *
 * @param {PaisesMapProps} props
 * @returns {JSX.Element}
 */
export function PaisesMap({ paises }: PaisesMapProps) {
    // Filtramos solo los países que tienen coordenadas válidas
    const paisesConCoordenadas = paises.filter(
        (p) => p.latitud !== null && p.longitud !== null,
    );

    return (
        <div className="rounded-lg border overflow-hidden h-96">
            <MapContainer
                center={[20, 0]} // Centro inicial del mapa (lat, lon)
                zoom={2} // Zoom inicial
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                {/* Capa de teselas del mapa (usamos OpenStreetMap) */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Marcadores para cada país con coordenadas */}
                {paisesConCoordenadas.map((pais) => (
                    <Marker
                        key={pais.id}
                        position={[pais.latitud!, pais.longitud!]}
                    >
                        <Popup>
                            <strong>{pais.nombre}</strong>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}