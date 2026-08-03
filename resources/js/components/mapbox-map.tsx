import React from 'react';
import LeafletMap, { LeafletMapProps } from './leaflet-map';

export default function MapboxMap(props: LeafletMapProps) {
    return <LeafletMap {...props} />;
}
