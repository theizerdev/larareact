import React from 'react';
import MapboxMap from '@/components/mapbox-map';

interface Pais {
    id: number;
    nombre: string;
    latitud: number | null;
    longitud: number | null;
}

interface PaisesMapProps {
    paises: Pais[];
}

export function PaisesMap({ paises }: PaisesMapProps) {
    const paisesConCoordenadas = paises.filter(
        (p) => p.latitud !== null && p.longitud !== null,
    );

    const markers = paisesConCoordenadas.map(p => ({
        lat: Number(p.latitud),
        lng: Number(p.longitud),
        label: p.nombre
    }));

    return (
        <div className="rounded-lg border overflow-hidden h-96">
            <MapboxMap 
                lat={20} 
                lng={0} 
                zoom={2} 
                interactive={true} 
                markers={markers} 
            />
        </div>
    );
}