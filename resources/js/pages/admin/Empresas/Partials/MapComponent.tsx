import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapComponentProps {
    center: [number, number];
    zoom: number;
    style: React.CSSProperties;
    markerPosition: [number, number] | null;
    onLocationSelected: (lat: number, lng: number, address?: string, timezone?: string) => void;
}

type TileStyleKey = 'positron' | 'voyager' | 'dark_matter' | 'osm' | 'satellite';

interface TileStyleConfig {
    key: TileStyleKey;
    label: string;
    url: string;
    attribution: string;
    subdomains?: string;
    maxZoom?: number;
}

const TILE_STYLES: Record<TileStyleKey, TileStyleConfig> = {
    positron: {
        key: 'positron',
        label: 'Claro (Carto)',
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
    },
    voyager: {
        key: 'voyager',
        label: 'Voyager',
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
    },
    dark_matter: {
        key: 'dark_matter',
        label: 'Oscuro (Dark)',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
    },
    osm: {
        key: 'osm',
        label: 'OSM Estándar',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
    },
    satellite: {
        key: 'satellite',
        label: 'Satélite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19,
    },
};

const createCustomPinIcon = () =>
    L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
            <div style="position: relative; width: 34px; height: 42px; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; bottom: 2px; width: 14px; height: 6px; background: rgba(15, 23, 42, 0.25); border-radius: 9999px; filter: blur(2px);"></div>
                <svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 24 24" fill="#6d28d9" stroke="#ffffff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 6px rgba(109, 40, 217, 0.35));">
                    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3.2" fill="#ffffff"/>
                </svg>
            </div>
        `,
        iconSize: [34, 42],
        iconAnchor: [17, 40],
        popupAnchor: [0, -38],
    });

// Función helper para obtener la zona horaria IANA según coordenadas
export const getTimezoneFromCoords = async (lat: number, lng: number): Promise<string | null> => {
    try {
        const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`
        );
        if (res.ok) {
            const data = await res.json();
            if (data.timeZone?.ianaTimeId) {
                return data.timeZone.ianaTimeId;
            }
        }
    } catch (_) {
        // Fallback silencioso
    }

    // Regla de detección precisa para México basada en coordenadas (latitud y longitud)
    if (lat >= 14 && lat <= 33 && lng >= -118 && lng <= -86) {
        if (lng < -114.5 && lat >= 28) return 'America/Tijuana';          // Baja California (Noroeste UTC-8)
        if (lng >= -114.8 && lng <= -108.5 && lat >= 26.3) return 'America/Hermosillo'; // Sonora (UTC-7 sin DST)
        if (lng >= -108.5 && lng <= -104.5 && lat >= 30.5) return 'America/Ciudad_Juarez'; // Chihuahua Frontera
        if (lng < -104.5 && lat >= 21.5) return 'America/Mazatlan';       // Sinaloa, Nayarit, BCS (Pacífico UTC-7)
        if (lng > -88.2 && lat <= 21.6) return 'America/Cancun';          // Quintana Roo (Sureste UTC-5)
        return 'America/Mexico_City';                                     // Centro (UTC-6)
    }

    return null;
};

const EmpresaMapComponent: React.FC<MapComponentProps> = ({
    center,
    zoom,
    style,
    markerPosition,
    onLocationSelected,
}) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const onLocationSelectedRef = useRef(onLocationSelected);

    const [tileStyle, setTileStyle] = useState<TileStyleKey>('positron');
    const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

    useEffect(() => {
        onLocationSelectedRef.current = onLocationSelected;
    }, [onLocationSelected]);

    const handleLocationChange = async (newLat: number, newLng: number) => {
        const roundedLat = Number(newLat.toFixed(6));
        const roundedLng = Number(newLng.toFixed(6));

        const tz = await getTimezoneFromCoords(roundedLat, roundedLng);
        onLocationSelectedRef.current(roundedLat, roundedLng, undefined, tz || undefined);

        try {
            setIsGeocodingLoading(true);
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLng}&accept-language=es`,
                { headers: { 'Accept-Language': 'es' } }
            );

            if (res.ok) {
                const data = await res.json();
                const address = data.display_name ?? '';
                onLocationSelectedRef.current(roundedLat, roundedLng, address, tz || undefined);
            }
        } catch (_) {
            // Error silencioso
        } finally {
            setIsGeocodingLoading(false);
        }
    };

    // Inicializar instancia de Leaflet una sola vez al montar
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const initialCenter: [number, number] = markerPosition
            ? [markerPosition[0], markerPosition[1]]
            : center && center[0] && center[1]
            ? [center[0], center[1]]
            : [23.6345, -102.5528]; // Centro de México por defecto

        const map = L.map(mapContainerRef.current, {
            center: initialCenter,
            zoom: zoom || 14,
            zoomControl: false,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const defaultTile = TILE_STYLES[tileStyle];
        const layer = L.tileLayer(defaultTile.url, {
            attribution: defaultTile.attribution,
            subdomains: defaultTile.subdomains ?? 'abc',
            maxZoom: defaultTile.maxZoom ?? 19,
        }).addTo(map);

        tileLayerRef.current = layer;
        mapInstanceRef.current = map;

        // Si ya hay coordenadas iniciales, colocar el marcador
        if (markerPosition && markerPosition[0] && markerPosition[1]) {
            const marker = L.marker([markerPosition[0], markerPosition[1]], {
                draggable: true,
                icon: createCustomPinIcon(),
            }).addTo(map);

            marker.on('dragend', () => {
                const pos = marker.getLatLng();
                handleLocationChange(pos.lat, pos.lng);
            });

            markerRef.current = marker;
        }

        // Al hacer clic en el mapa, mover o crear el marcador
        map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng]);
            } else {
                const marker = L.marker([lat, lng], {
                    draggable: true,
                    icon: createCustomPinIcon(),
                }).addTo(map);

                marker.on('dragend', () => {
                    const pos = marker.getLatLng();
                    handleLocationChange(pos.lat, pos.lng);
                });

                markerRef.current = marker;
            }
            handleLocationChange(lat, lng);
        });

        // Asegurar renderizado completo dentro del modal/tab
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 150);

        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        resizeObserver.observe(mapContainerRef.current);

        return () => {
            clearTimeout(timer);
            resizeObserver.disconnect();
            map.remove();
            mapInstanceRef.current = null;
            tileLayerRef.current = null;
            markerRef.current = null;
        };
    }, []);

    // Cambiar el estilo del mapa dinámicamente cuando el usuario seleccione otro TileStyle
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (tileLayerRef.current) {
            map.removeLayer(tileLayerRef.current);
        }

        const cfg = TILE_STYLES[tileStyle];
        const newLayer = L.tileLayer(cfg.url, {
            attribution: cfg.attribution,
            subdomains: cfg.subdomains ?? 'abc',
            maxZoom: cfg.maxZoom ?? 19,
        }).addTo(map);

        tileLayerRef.current = newLayer;
    }, [tileStyle]);

    // Sincronizar posición del marcador cuando cambia desde inputs externos o geocodificación
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (markerPosition && markerPosition[0] && markerPosition[1]) {
            const [lat, lng] = markerPosition;

            if (markerRef.current) {
                const current = markerRef.current.getLatLng();
                if (Math.abs(current.lat - lat) > 0.00005 || Math.abs(current.lng - lng) > 0.00005) {
                    markerRef.current.setLatLng([lat, lng]);
                    map.setView([lat, lng], Math.max(map.getZoom(), 14), { animate: true });
                }
            } else {
                const marker = L.marker([lat, lng], {
                    draggable: true,
                    icon: createCustomPinIcon(),
                }).addTo(map);

                marker.on('dragend', () => {
                    const pos = marker.getLatLng();
                    handleLocationChange(pos.lat, pos.lng);
                });

                markerRef.current = marker;
                map.setView([lat, lng], 14, { animate: true });
            }
        }
    }, [markerPosition?.[0], markerPosition?.[1]]);

    return (
        <div className="relative w-full h-full select-none" style={{ minHeight: '340px', ...style }}>
            {/* Contenedor Leaflet */}
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Selector flotante de estilo de mapa (CartoDB Claro por defecto) */}
            <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 shadow-md border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                    <Layers className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    <span className="hidden sm:inline">Estilo:</span>
                </div>
                {(Object.values(TILE_STYLES) as TileStyleConfig[]).map((item) => {
                    const isActive = tileStyle === item.key;
                    return (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => setTileStyle(item.key)}
                            className={cn(
                                'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer',
                                isActive
                                    ? 'bg-violet-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            )}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {/* Indicador de geocodificación inversa */}
            {isGeocodingLoading && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/85 text-white px-3.5 py-1.5 rounded-full text-xs font-medium shadow-lg pointer-events-none flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-violet-400 animate-ping" />
                    Obteniendo dirección y zona horaria...
                </div>
            )}
        </div>
    );
};

export default EmpresaMapComponent;
