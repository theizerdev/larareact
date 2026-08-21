import React from 'react';
import MapboxMap from '@/components/mapbox-map';

interface MapComponentProps {
    center: [number, number];
    zoom: number;
    style: React.CSSProperties;
    hasCoordinates: boolean;
    markerPosition: [number, number] | null;
    onLocationSelected: (lat: number, lng: number) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({
    markerPosition,
    zoom,
    onLocationSelected
}) => {
    const lat = markerPosition ? markerPosition[0] : 0;
    const lng = markerPosition ? markerPosition[1] : 0;

    return (
        <div className="w-full h-80 min-h-[320px] rounded-lg overflow-hidden border">
            <MapboxMap
                lat={lat}
                lng={lng}
                zoom={zoom}
                onChange={onLocationSelected}
                interactive={true}
            />
        </div>
    );
};

export default MapComponent;