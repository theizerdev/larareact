import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';

// Fix Leaflet default marker icon in Vite
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

export interface LeafletMapProps {
    lat: number;
    lng: number;
    zoom?: number;
    onChange?: (lat: number, lng: number) => void;
    markers?: Array<{ lat: number; lng: number; label?: string }>;
    interactive?: boolean;
    className?: string;
}

export default function LeafletMap({
    lat,
    lng,
    zoom = 12,
    onChange,
    markers = [],
    interactive = true,
    className
}: LeafletMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const mainMarkerRef = useRef<L.Marker | null>(null);
    const extraMarkersRef = useRef<L.Marker[]>([]);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Valid fallback coordinates
        const initialLat = Number.isFinite(lat) && lat !== 0 ? lat : 10.4806; // Default Caracas if 0
        const initialLng = Number.isFinite(lng) && lng !== 0 ? lng : -66.9036;

        // Initialize Leaflet Map
        const map = L.map(mapContainerRef.current, {
            center: [initialLat, initialLng],
            zoom: zoom,
            dragging: interactive,
            touchZoom: interactive,
            doubleClickZoom: interactive,
            scrollWheelZoom: interactive,
            boxZoom: interactive,
            keyboard: interactive,
            zoomControl: false
        });

        if (interactive) {
            L.control.zoom({ position: 'topright' }).addTo(map);
        }

        // Determine dark vs light tile layer
        const isDark = document.documentElement.classList.contains('dark');
        const tileUrl = isDark
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        const attribution = isDark
            ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

        L.tileLayer(tileUrl, {
            maxZoom: 19,
            attribution
        }).addTo(map);

        mapInstanceRef.current = map;

        // Add main marker if lat/lng are provided
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            const mainMarker = L.marker([lat, lng], {
                draggable: interactive && !!onChange
            }).addTo(map);

            if (interactive && onChange) {
                mainMarker.on('dragend', () => {
                    const pos = mainMarker.getLatLng();
                    onChange(pos.lat, pos.lng);
                });

                map.on('click', (e: L.LeafletMouseEvent) => {
                    mainMarker.setLatLng(e.latlng);
                    onChange(e.latlng.lat, e.latlng.lng);
                });
            }

            mainMarkerRef.current = mainMarker;
        }

        // Add additional markers if provided
        markers.forEach((m) => {
            if (Number.isFinite(m.lat) && Number.isFinite(m.lng)) {
                const marker = L.marker([m.lat, m.lng]).addTo(map);
                if (m.label) {
                    marker.bindPopup(`<div style="font-size:12px; font-weight:600;">${m.label}</div>`);
                }
                extraMarkersRef.current.push(marker);
            }
        });

        // Resize fix after render
        setTimeout(() => {
            map.invalidateSize();
        }, 200);

        return () => {
            map.remove();
            mapInstanceRef.current = null;
            mainMarkerRef.current = null;
            extraMarkersRef.current = [];
        };
    }, []);

    // Update main marker & map center on prop change
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            if (mainMarkerRef.current) {
                const currentPos = mainMarkerRef.current.getLatLng();
                if (Math.abs(currentPos.lat - lat) > 0.0001 || Math.abs(currentPos.lng - lng) > 0.0001) {
                    mainMarkerRef.current.setLatLng([lat, lng]);
                    mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom(), { animate: true });
                }
            } else {
                const mainMarker = L.marker([lat, lng], {
                    draggable: interactive && !!onChange
                }).addTo(mapInstanceRef.current);

                if (interactive && onChange) {
                    mainMarker.on('dragend', () => {
                        const pos = mainMarker.getLatLng();
                        onChange(pos.lat, pos.lng);
                    });
                }
                mainMarkerRef.current = mainMarker;
                mapInstanceRef.current.setView([lat, lng], zoom);
            }
        }
    }, [lat, lng, zoom, interactive, onChange]);

    // Update extra markers when markers array changes
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        // Clear previous extra markers
        extraMarkersRef.current.forEach(m => m.remove());
        extraMarkersRef.current = [];

        // Add new extra markers
        markers.forEach((m) => {
            if (Number.isFinite(m.lat) && Number.isFinite(m.lng)) {
                const marker = L.marker([m.lat, m.lng]).addTo(mapInstanceRef.current!);
                if (m.label) {
                    marker.bindPopup(`<div style="font-size:12px; font-weight:600;">${m.label}</div>`);
                }
                extraMarkersRef.current.push(marker);
            }
        });
    }, [markers]);

    return (
        <div className={cn("relative w-full h-80 min-h-[320px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 z-0", className)}>
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />
        </div>
    );
}
