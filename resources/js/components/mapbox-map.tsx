import React, { useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { MapPin, ShieldAlert } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapboxMapProps {
    lat: number;
    lng: number;
    zoom?: number;
    onChange?: (lat: number, lng: number) => void;
    markers?: Array<{ lat: number; lng: number; label?: string }>;
    interactive?: boolean;
}

export default function MapboxMap({
    lat,
    lng,
    zoom = 9,
    onChange,
    markers = [],
    interactive = true
}: MapboxMapProps) {
    const { __ } = useTranslate();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markerRef = useRef<mapboxgl.Marker | null>(null);
    const [mapError, setMapError] = useState<string | null>(null);

    // Obtener la clave de Mapbox desde las props globales de Inertia
    const { auth } = usePage().props as any;
    const mapboxApiKey = auth?.user?.empresa?.mapbox_api_key;
    const mapboxActive = auth?.user?.empresa?.mapbox_active;

    useEffect(() => {
        if (!mapboxActive || !mapboxApiKey) {
            setMapError(__('Mapbox integration is not active or token is missing. Please configure it in Settings > Integrations.'));
            return;
        }

        mapboxgl.accessToken = mapboxApiKey;

        if (!mapContainerRef.current) return;

        // Detectar si el tema oscuro está activo
        const isDark = document.documentElement.classList.contains('dark');
        const mapStyle = isDark 
            ? 'mapbox://styles/mapbox/dark-v11' 
            : 'mapbox://styles/mapbox/streets-v12';

        try {
            // Inicializar mapa
            const map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: mapStyle,
                center: [lng || 0, lat || 0],
                zoom: zoom,
                interactive: interactive,
            });

            mapRef.current = map;

            // Añadir controles de navegación
            if (interactive) {
                map.addControl(new mapboxgl.NavigationControl(), 'top-right');
            }

            // Añadir marcador principal (arrastrable si onChange está definido)
            if (lat !== undefined && lng !== undefined) {
                const marker = new mapboxgl.Marker({
                    draggable: interactive && !!onChange,
                    color: '#6366f1' // Color indigo
                })
                .setLngLat([lng, lat])
                .addTo(map);

                markerRef.current = marker;

                if (interactive && onChange) {
                    marker.on('dragend', () => {
                        const lngLat = marker.getLngLat();
                        onChange(lngLat.lat, lngLat.lng);
                    });

                    // Clic en el mapa para mover el marcador
                    map.on('click', (e) => {
                        marker.setLngLat(e.lngLat);
                        onChange(e.lngLat.lat, e.lngLat.lng);
                    });
                }
            }

            // Añadir otros marcadores estáticos (ej: listado de países/sucursales)
            markers.forEach((m) => {
                if (m.lat && m.lng) {
                    const el = document.createElement('div');
                    el.className = 'w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-white shadow-lg cursor-pointer';
                    el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

                    const popup = m.label 
                        ? new mapboxgl.Popup({ offset: 25 }).setHTML(`<div class="p-1 font-sans text-xs font-semibold text-slate-800">${m.label}</div>`)
                        : undefined;

                    new mapboxgl.Marker(el)
                        .setLngLat([m.lng, m.lat])
                        .setPopup(popup)
                        .addTo(map);
                }
            });

        } catch (err: any) {
            console.error('Error initializing Mapbox:', err);
            setMapError(__('Failed to load Mapbox map. Please check your Access Token configuration.'));
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
            }
        };
    }, [lat, lng, mapboxApiKey, mapboxActive, markers]);

    if (mapError) {
        return (
            <div className="w-full h-80 min-h-[320px] rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <ShieldAlert className="h-10 w-10 text-red-500 mb-2" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{__('Map Engine Error')}</p>
                <p className="text-xs max-w-xs mt-1">{mapError}</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-80 min-h-[320px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
        </div>
    );
}
