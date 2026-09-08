import { usePage } from '@inertiajs/react';
import { MapPin, ShieldAlert, Loader2 } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslate } from '@/hooks/use-translate';
import 'mapbox-gl/dist/mapbox-gl.css';
import { cn } from '@/lib/utils';

export interface MapAddressDetails {
    codigo_postal?: string;
    estado?: string;
    direccion?: string;
    ciudad?: string;
    pais?: string;
}

interface MapboxMapProps {
    lat: number;
    lng: number;
    zoom?: number;
    onChange?: (lat: number, lng: number, details?: MapAddressDetails) => void;
    markers?: Array<{ lat: number; lng: number; label?: string }>;
    interactive?: boolean;
    className?: string;
}

export default function MapboxMap({
    lat,
    lng,
    zoom = 9,
    onChange,
    markers = [],
    interactive = true,
    className
}: MapboxMapProps) {
    const { __ } = useTranslate();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markerRef = useRef<mapboxgl.Marker | null>(null);
    const staticMarkersRef = useRef<mapboxgl.Marker[]>([]);
    const [mapError, setMapError] = useState<string | null>(null);
    const [isReverseLoading, setIsReverseLoading] = useState(false);

    // Bandera para evitar loops de actualización cuando el usuario mueve el marcador
    const isLocalInteractionRef = useRef(false);
    const reverseAbortRef = useRef<AbortController | null>(null);
    const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Mantener la referencia de onChange actualizada sin disparar re-inicialización del mapa
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Obtener la clave de Mapbox desde las props globales de Inertia o directas de la página
    const props = usePage().props as any;
    const mapboxApiKey = props.mapbox_api_key || props.auth?.user?.empresa?.mapbox_api_key;
    const mapboxActive = props.mapbox_active !== undefined ? props.mapbox_active : props.auth?.user?.empresa?.mapbox_active;

    const fetchReverseGeocode = async (newLat: number, newLng: number): Promise<MapAddressDetails> => {
        if (!mapboxApiKey) return {};

        if (reverseAbortRef.current) {
            reverseAbortRef.current.abort();
        }
        const controller = new AbortController();
        reverseAbortRef.current = controller;

        try {
            setIsReverseLoading(true);
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${newLng},${newLat}.json?access_token=${mapboxApiKey}&language=es&limit=1`,
                { signal: controller.signal }
            );
            if (!response.ok) return {};
            const data = await response.json();
            const details: MapAddressDetails = {};
            if (data.features && data.features.length > 0) {
                details.direccion = data.features[0].place_name || '';
                for (const feature of data.features) {
                    if (feature.place_type.includes('postcode')) {
                        details.codigo_postal = feature.text;
                    }
                    if (feature.place_type.includes('region')) {
                        details.estado = feature.text;
                    }
                    if (feature.place_type.includes('place')) {
                        details.ciudad = feature.text;
                    }
                    if (feature.place_type.includes('country')) {
                        details.pais = feature.text;
                    }
                }
            }
            return details;
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                console.error('Error in reverse geocoding:', e);
            }
            return {};
        } finally {
            if (!controller.signal.aborted) {
                setIsReverseLoading(false);
            }
        }
    };

    const handleCoordinatesChange = (targetLat: number, targetLng: number) => {
        if (!onChangeRef.current) return;

        // 1. Notificar inmediatamente coordenadas para reactividad a 60 FPS sin esperar red
        isLocalInteractionRef.current = true;
        onChangeRef.current(targetLat, targetLng);

        // 2. Debounce de la geocodificación inversa
        if (reverseTimerRef.current) {
            clearTimeout(reverseTimerRef.current);
        }

        reverseTimerRef.current = setTimeout(async () => {
            const details = await fetchReverseGeocode(targetLat, targetLng);
            if (onChangeRef.current) {
                onChangeRef.current(targetLat, targetLng, details);
            }
            setTimeout(() => {
                isLocalInteractionRef.current = false;
            }, 300);
        }, 400);
    };

    // Efecto 1: Inicializar el mapa una sola vez
    useEffect(() => {
        if (!mapboxActive || !mapboxApiKey) {
            setMapError(__('Mapbox integration is not active or token is missing. Please configure it in Settings > Integrations.'));
            return;
        }

        mapboxgl.accessToken = mapboxApiKey;

        if (!mapContainerRef.current) {
            return;
        }

        const isDark = document.documentElement.classList.contains('dark');
        const mapStyle = isDark 
            ? 'mapbox://styles/mapbox/dark-v11' 
            : 'mapbox://styles/mapbox/streets-v12';

        let map: mapboxgl.Map | null = null;

        try {
            map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: mapStyle,
                center: [lng || 0, lat || 0],
                zoom: zoom,
                interactive: interactive,
            });

            mapRef.current = map;

            if (interactive) {
                map.addControl(new mapboxgl.NavigationControl(), 'top-right');
            }

            // Crear el marcador principal inicial
            if (lat !== undefined && lng !== undefined) {
                const marker = new mapboxgl.Marker({
                    draggable: interactive && !!onChangeRef.current,
                    color: '#6366f1'
                })
                .setLngLat([lng, lat])
                .addTo(map);

                markerRef.current = marker;

                if (interactive) {
                    marker.on('dragend', () => {
                        const lngLat = marker.getLngLat();
                        handleCoordinatesChange(lngLat.lat, lngLat.lng);
                    });

                    map.on('click', (e) => {
                        marker.setLngLat(e.lngLat);
                        handleCoordinatesChange(e.lngLat.lat, e.lngLat.lng);
                    });
                }
            }

        } catch (err: any) {
            console.error('Error initializing Mapbox:', err);
            setMapError(__('Failed to load Mapbox map. Please check your Access Token configuration.'));
        }

        return () => {
            if (reverseTimerRef.current) {
                clearTimeout(reverseTimerRef.current);
            }
            if (reverseAbortRef.current) {
                reverseAbortRef.current.abort();
            }
            if (mapRef.current) {
                try {
                    mapRef.current.remove();
                } catch (_) {}
                mapRef.current = null;
                markerRef.current = null;
            }
        };
    }, [mapboxApiKey, mapboxActive]);

    // Efecto 2: Actualizar marcadores estáticos sin recrear el mapa
    useEffect(() => {
        if (!mapRef.current) return;

        // Limpiar marcadores estáticos previos
        staticMarkersRef.current.forEach(m => m.remove());
        staticMarkersRef.current = [];

        markers.forEach((m) => {
            if (m.lat && m.lng && mapRef.current) {
                const el = document.createElement('div');
                el.className = 'w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-white shadow-lg cursor-pointer';
                el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

                const popup = m.label 
                    ? new mapboxgl.Popup({ offset: 25 }).setHTML(`<div class="p-1 font-sans text-xs font-semibold text-slate-800">${m.label}</div>`)
                    : undefined;

                const marker = new mapboxgl.Marker(el)
                    .setLngLat([m.lng, m.lat])
                    .setPopup(popup)
                    .addTo(mapRef.current);

                staticMarkersRef.current.push(marker);
            }
        });
    }, [markers]);

    // Efecto 3: Sincronizar coordenadas cuando cambian externamente (inputs, geocodificación directa)
    useEffect(() => {
        if (!mapRef.current || !markerRef.current || lat === undefined || lng === undefined) {
            return;
        }

        // Si el cambio proviene de la interacción directa del usuario en el mapa, ignoramos easeTo
        if (isLocalInteractionRef.current) {
            return;
        }

        const currentLngLat = markerRef.current.getLngLat();

        // Evitar ciclos de actualización si la diferencia es insignificante
        if (Math.abs(currentLngLat.lat - lat) > 0.0001 || Math.abs(currentLngLat.lng - lng) > 0.0001) {
            markerRef.current.setLngLat([lng, lat]);
            mapRef.current.easeTo({
                center: [lng, lat],
                essential: true,
                duration: 500,
            });
        }
    }, [lat, lng]);

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
        <div className={cn("relative w-full h-80 min-h-[320px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800", className)}>
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
            {isReverseLoading && (
                <div className="absolute top-2 left-2 z-10 bg-black/65 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md pointer-events-none">
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                    <span>{__('Resolving location details...')}</span>
                </div>
            )}
        </div>
    );
}
