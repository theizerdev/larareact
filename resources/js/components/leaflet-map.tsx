import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Satellite, Sun, Moon, Compass, MapPin, Loader2, Navigation, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTimezoneFromCoordinates } from '@/hooks/use-location-geocoding';

export interface LeafletAddressDetails {
    codigo_postal?: string;
    estado?: string;
    direccion?: string;
    ciudad?: string;
    pais?: string;
    zona_horaria?: string;
}

interface LeafletMapProps {
    lat: number | string | null | undefined;
    lng: number | string | null | undefined;
    zoom?: number;
    onChange?: (lat: number, lng: number, details?: LeafletAddressDetails) => void;
    interactive?: boolean;
    className?: string;
    style?: React.CSSProperties;
    showStyleSwitcher?: boolean;
}

// Funciones helper para garantizar que las coordenadas siempre sean números seguros
const safeCoord = (val: any, fallback: number = 0): number => {
    if (val === null || val === undefined || val === '') return fallback;
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    return isNaN(num) ? fallback : num;
};

const formatCoord = (val: any): string => {
    const num = safeCoord(val, 0);
    return num.toFixed(5);
};

// Estilos de capas de mosaicos (tiles) disponibles
const TILE_LAYERS = {
    osm: {
        id: 'osm',
        name: 'Calles (OSM)',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        },
        icon: Sun,
    },
    satellite: {
        id: 'satellite',
        name: 'Satélite HD',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        options: {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        },
        icon: Satellite,
    },
    dark: {
        id: 'dark',
        name: 'Modo Oscuro',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        options: {
            maxZoom: 19,
            subdomains: 'abcd',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        },
        icon: Moon,
    },
    light: {
        id: 'light',
        name: 'Modo Claro',
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        options: {
            maxZoom: 19,
            subdomains: 'abcd',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        },
        icon: Layers,
    },
};

// Crear icono HTML SVG estilizado para evitar problemas de 404 en imágenes png de Leaflet
const createCustomPinIcon = () => {
    return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
            <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; width: 14px; height: 14px; background: rgba(16, 185, 129, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; bottom: 0; left: 11px;"></div>
                <div style="position: relative; width: 32px; height: 32px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35)); transition: transform 0.2s ease;">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13401 2 5 5.13401 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13401 15.866 2 12 2Z" fill="#10B981" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="12" cy="9" r="3" fill="#FFFFFF"/>
                    </svg>
                </div>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 34],
        popupAnchor: [0, -32],
    });
};

export default function LeafletMap({
    lat,
    lng,
    zoom = 14,
    onChange,
    interactive = true,
    className = 'h-full w-full',
    style = {},
    showStyleSwitcher = true,
}: LeafletMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    const [currentStyle, setCurrentStyle] = useState<keyof typeof TILE_LAYERS>('osm');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isReverseLoading, setIsReverseLoading] = useState(false);
    const [currentAddress, setCurrentAddress] = useState<string>('');
    const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number }>({
        lat: safeCoord(lat, 19.9213),
        lng: safeCoord(lng, -102.0152),
    });

    const isInternalUpdateRef = useRef(false);
    const reverseAbortRef = useRef<AbortController | null>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // Función de geocodificación reversa usando Nominatim OSM
    const fetchReverseGeocode = useCallback(async (newLat: number, newLng: number) => {
        if (reverseAbortRef.current) {
            reverseAbortRef.current.abort();
        }
        const controller = new AbortController();
        reverseAbortRef.current = controller;

        try {
            setIsReverseLoading(true);
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLat}&lon=${newLng}&addressdetails=1`,
                {
                    headers: { 'Accept-Language': 'es' },
                    signal: controller.signal,
                }
            );

            if (!res.ok) return null;
            const data = await res.json();
            const addr = data.address || {};

            const road = addr.road || addr.pedestrian || addr.street || '';
            const houseNumber = addr.house_number ? ` #${addr.house_number}` : '';
            const suburb = addr.suburb || addr.neighbourhood || addr.quarter || '';
            const city = addr.city || addr.town || addr.village || addr.municipality || '';
            const state = addr.state || '';
            const postcode = addr.postcode || '';
            const country = addr.country || '';

            const parts = [
                `${road}${houseNumber}`.trim(),
                suburb,
                city,
                state,
                country,
            ].filter(Boolean);

            const formattedAddress = parts.join(', ') || data.display_name || '';
            const timezone = await getTimezoneFromCoordinates(newLat, newLng);

            const details: LeafletAddressDetails = {
                direccion: formattedAddress,
                ciudad: city,
                estado: state,
                codigo_postal: postcode,
                pais: country,
                zona_horaria: timezone || undefined,
            };

            setCurrentAddress(formattedAddress);
            return details;
        } catch (_) {
            return null;
        } finally {
            setIsReverseLoading(false);
        }
    }, []);

    // Inicializar el mapa Leaflet
    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return;

        const initialLat = safeCoord(lat, 19.9213);
        const initialLng = safeCoord(lng, -102.0152);
        const hasCoords = lat !== null && lat !== undefined && lat !== '' && lng !== null && lng !== undefined && lng !== '';
        const initialZoom = hasCoords ? zoom : 5;

        const map = L.map(mapContainerRef.current, {
            center: [initialLat, initialLng],
            zoom: initialZoom,
            zoomControl: false,
        });

        // Controles de zoom abajo a la derecha
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Capa de mosaicos inicial
        const tileConfig = TILE_LAYERS[currentStyle];
        const tileLayer = L.tileLayer(tileConfig.url, tileConfig.options).addTo(map);
        tileLayerRef.current = tileLayer;

        // Crear marcador interactivo
        const customIcon = createCustomPinIcon();
        const marker = L.marker([initialLat, initialLng], {
            icon: customIcon,
            draggable: interactive,
            riseOnHover: true,
        }).addTo(map);

        markerRef.current = marker;
        mapInstanceRef.current = map;

        // Evento de arrastre de marcador
        marker.on('dragend', async () => {
            const pos = marker.getLatLng();
            const validLat = safeCoord(pos.lat, initialLat);
            const validLng = safeCoord(pos.lng, initialLng);

            isInternalUpdateRef.current = true;
            setPinCoords({ lat: validLat, lng: validLng });

            const details = await fetchReverseGeocode(validLat, validLng);
            if (onChangeRef.current) {
                onChangeRef.current(validLat, validLng, details || undefined);
            }
        });

        // Evento de clic en mapa
        if (interactive) {
            map.on('click', async (e: L.LeafletMouseEvent) => {
                const clickLat = safeCoord(e.latlng.lat, initialLat);
                const clickLng = safeCoord(e.latlng.lng, initialLng);

                isInternalUpdateRef.current = true;
                marker.setLatLng([clickLat, clickLng]);
                setPinCoords({ lat: clickLat, lng: clickLng });

                const details = await fetchReverseGeocode(clickLat, clickLng);
                if (onChangeRef.current) {
                    onChangeRef.current(clickLat, clickLng, details || undefined);
                }
            });
        }

        // Invalidate size para ajustar renderizado en modales
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 200);

        return () => {
            clearTimeout(timer);
            map.remove();
            mapInstanceRef.current = null;
            markerRef.current = null;
            tileLayerRef.current = null;
        };
    }, []);

    // Cambiar capa de estilo
    const handleStyleChange = (styleKey: keyof typeof TILE_LAYERS) => {
        if (!mapInstanceRef.current || styleKey === currentStyle) return;

        if (tileLayerRef.current) {
            mapInstanceRef.current.removeLayer(tileLayerRef.current);
        }

        const newConfig = TILE_LAYERS[styleKey];
        const newLayer = L.tileLayer(newConfig.url, newConfig.options).addTo(mapInstanceRef.current);
        tileLayerRef.current = newLayer;
        setCurrentStyle(styleKey);
        setIsMenuOpen(false);
    };

    // Actualizar posición del marcador cuando cambian props externas
    useEffect(() => {
        if (!mapInstanceRef.current || !markerRef.current) return;
        if (lat === null || lat === undefined || lat === '' || lng === null || lng === undefined || lng === '') return;

        const numLat = safeCoord(lat, 0);
        const numLng = safeCoord(lng, 0);
        if (numLat === 0 && numLng === 0) return;

        if (isInternalUpdateRef.current) {
            isInternalUpdateRef.current = false;
            return;
        }

        const currentPos = markerRef.current.getLatLng();
        const diffLat = Math.abs(currentPos.lat - numLat);
        const diffLng = Math.abs(currentPos.lng - numLng);

        if (diffLat > 0.0001 || diffLng > 0.0001) {
            markerRef.current.setLatLng([numLat, numLng]);
            mapInstanceRef.current.panTo([numLat, numLng]);
            setPinCoords({ lat: numLat, lng: numLng });
        }
    }, [lat, lng]);

    // Resize observer para garantizar que no haya tiles grises al redimensionar modal
    useEffect(() => {
        if (!mapContainerRef.current || !mapInstanceRef.current) return;

        const observer = new ResizeObserver(() => {
            mapInstanceRef.current?.invalidateSize();
        });

        observer.observe(mapContainerRef.current);
        return () => observer.disconnect();
    }, []);

    // Centrar en ubicación actual
    const handleLocateMe = () => {
        if (!navigator.geolocation || !mapInstanceRef.current) return;

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const userLat = safeCoord(pos.coords.latitude, 19.9213);
                const userLng = safeCoord(pos.coords.longitude, -102.0152);

                if (markerRef.current && mapInstanceRef.current) {
                    markerRef.current.setLatLng([userLat, userLng]);
                    mapInstanceRef.current.setView([userLat, userLng], 15);
                    setPinCoords({ lat: userLat, lng: userLng });

                    const details = await fetchReverseGeocode(userLat, userLng);
                    if (onChangeRef.current) {
                        onChangeRef.current(userLat, userLng, details || undefined);
                    }
                }
            },
            (err) => console.warn('Geolocation error:', err),
            { enableHighAccuracy: true, timeout: 5000 }
        );
    };

    return (
        <div className={cn('relative w-full h-full overflow-hidden select-none', className)} style={style}>
            {/* Contenedor DOM de Leaflet */}
            <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '380px' }} />

            {/* Badge flotante de coordenadas e información */}
            <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1 max-w-[280px] pointer-events-none">
                <div className="backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 truncate">
                        {formatCoord(pinCoords?.lat)}, {formatCoord(pinCoords?.lng)}
                    </div>
                    {isReverseLoading && (
                        <Loader2 className="w-3 h-3 text-emerald-600 animate-spin ml-auto" />
                    )}
                </div>
                {currentAddress && (
                    <div className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-slate-600 dark:text-slate-400 shadow-sm truncate">
                        {currentAddress}
                    </div>
                )}
            </div>

            {/* Botonera flotante superior derecha: Estilos de mapa y GPS */}
            <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5">
                {/* Botón Mi Ubicación */}
                <button
                    type="button"
                    onClick={handleLocateMe}
                    title="Centrar en mi ubicación actual"
                    className="h-9 w-9 rounded-xl backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-lg text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                >
                    <Navigation className="w-4 h-4" />
                </button>

                {/* Selector de Estilo de Mapa (Satélite, Calles, etc) */}
                {showStyleSwitcher && (
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            title="Cambiar vista de mapa"
                            className="h-9 px-3 rounded-xl backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-lg text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                        >
                            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="hidden sm:inline">{TILE_LAYERS[currentStyle].name}</span>
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 mt-1.5 w-44 rounded-2xl backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xl p-1.5 flex flex-col gap-1 z-[1100] animate-in fade-in zoom-in-95 duration-150">
                                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Vistas de Mapa
                                </div>
                                {Object.entries(TILE_LAYERS).map(([key, styleObj]) => {
                                    const IconComponent = styleObj.icon;
                                    const isSelected = key === currentStyle;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => handleStyleChange(key as keyof typeof TILE_LAYERS)}
                                            className={cn(
                                                'w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer',
                                                isSelected
                                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                            )}
                                        >
                                            <IconComponent className={cn('w-4 h-4', isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')} />
                                            <span>{styleObj.name}</span>
                                            {isSelected && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-auto" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
