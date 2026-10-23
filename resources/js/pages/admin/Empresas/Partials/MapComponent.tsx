import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, LocateFixed, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { notifyError, notifySuccess } from '@/utils/notifications';

interface MapComponentProps {
    center: [number, number];
    zoom: number;
    style: React.CSSProperties;
    markerPosition: [number, number] | null;
    onLocationSelected: (lat: number, lng: number, address?: string, timezone?: string) => void;
}

type TileStyleKey =
    | 'carto_light'
    | 'esri_streets'
    | 'osm_standard'
    | 'carto_dark'
    | 'esri_dark'
    | 'esri_satellite'
    | 'esri_topo';

interface TileStyleConfig {
    key: TileStyleKey;
    label: string;
    url: string;
    attribution: string;
    subdomains: string;
    maxZoom: number;
}

const TILE_STYLES: Record<TileStyleKey, TileStyleConfig> = {
    osm_standard: {
        key: 'osm_standard',
        label: 'OpenStreetMap',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abc',
        maxZoom: 19,
    },
    carto_light: {
        key: 'carto_light',
        label: 'Claro (Carto)',
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
    },
    esri_streets: {
        key: 'esri_streets',
        label: 'Calles HD',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Sources: Esri, HERE, DeLorme, USGS, Intermap',
        subdomains: '',
        maxZoom: 19,
    },
    carto_dark: {
        key: 'carto_dark',
        label: 'Oscuro (Carto)',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
    },
    esri_dark: {
        key: 'esri_dark',
        label: 'Oscuro NOC',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        subdomains: '',
        maxZoom: 16,
    },
    esri_satellite: {
        key: 'esri_satellite',
        label: 'Satélite HD',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye',
        subdomains: '',
        maxZoom: 18,
    },
    esri_topo: {
        key: 'esri_topo',
        label: 'Topográfico',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Sources: Esri, USGS, NOAA',
        subdomains: '',
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

/**
 * Determina la zona horaria IANA oficial de México a partir del objeto `address` de Nominatim.
 */
const resolveMexicanTimezoneFromAddress = (addr?: Record<string, any>): string | null => {
    if (!addr) return null;
    const country = String(addr.country_code || '').toLowerCase();
    if (country && country !== 'mx') return null;

    const state = String(addr.state || '').toLowerCase();
    const city = String(addr.city || addr.town || addr.municipality || addr.county || '').toLowerCase();

    if (state.includes('baja california sur') || state.includes('sinaloa') || state.includes('nayarit')) {
        return 'America/Mazatlan';
    }
    if (state.includes('baja california')) {
        return 'America/Tijuana';
    }
    if (state.includes('sonora')) {
        return 'America/Hermosillo';
    }
    if (state.includes('quintana roo')) {
        return 'America/Cancun';
    }
    if (state.includes('chihuahua')) {
        if (
            city.includes('juárez') ||
            city.includes('juarez') ||
            city.includes('ascensión') ||
            city.includes('ascension') ||
            city.includes('janos') ||
            city.includes('ojinaga') ||
            city.includes('guadalupe') ||
            city.includes('praxedis')
        ) {
            return 'America/Ciudad_Juarez';
        }
        return 'America/Chihuahua';
    }
    if (state.includes('nuevo león') || state.includes('nuevo leon') || state.includes('coahuila')) {
        return 'America/Monterrey';
    }
    if (state) {
        return 'America/Mexico_City';
    }

    return null;
};

/**
 * Obtiene automáticamente la zona horaria IANA exacta según coordenadas (lat, lng).
 */
export const getTimezoneFromCoords = async (
    lat: number,
    lng: number,
    nominatimAddress?: Record<string, any>
): Promise<string | null> => {
    const mxByState = resolveMexicanTimezoneFromAddress(nominatimAddress);
    if (mxByState) {
        return mxByState;
    }

    try {
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&timezone=auto&forecast_days=1`
        );
        if (res.ok) {
            const data = await res.json();
            if (data.timezone && typeof data.timezone === 'string' && data.timezone !== 'GMT') {
                return data.timezone;
            }
        }
    } catch (_) {
        // Continúa al siguiente método
    }

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
        // Fallback por cuadrantes geográficos
    }

    if (lat >= 14 && lat <= 33 && lng >= -118 && lng <= -86) {
        if (lng < -114.5 && lat >= 28) return 'America/Tijuana';
        if (lng >= -114.8 && lng <= -108.5 && lat >= 26.3) return 'America/Hermosillo';
        if (lng >= -108.5 && lng <= -104.5 && lat >= 30.5) return 'America/Ciudad_Juarez';
        if (lng < -104.5 && lat >= 21.5) return 'America/Mazatlan';
        if (lng > -88.2 && lat <= 21.6) return 'America/Cancun';
        return 'America/Mexico_City';
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

    const [tileStyle, setTileStyle] = useState<TileStyleKey>('osm_standard');
    const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
    const [isLocatingDevice, setIsLocatingDevice] = useState(false);

    useEffect(() => {
        onLocationSelectedRef.current = onLocationSelected;
    }, [onLocationSelected]);

    const handleLocationChange = async (newLat: number, newLng: number) => {
        const roundedLat = Number(newLat.toFixed(6));
        const roundedLng = Number(newLng.toFixed(6));

        const quickTz = await getTimezoneFromCoords(roundedLat, roundedLng);
        onLocationSelectedRef.current(roundedLat, roundedLng, undefined, quickTz || undefined);

        try {
            setIsGeocodingLoading(true);
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLng}&accept-language=es`,
                { headers: { 'Accept-Language': 'es' } }
            );

            if (res.ok) {
                const data = await res.json();
                const address = data.display_name ?? '';
                const exactTz = (await getTimezoneFromCoords(roundedLat, roundedLng, data.address)) || quickTz;
                onLocationSelectedRef.current(roundedLat, roundedLng, address, exactTz || undefined);
            }
        } catch (_) {
            // Error silencioso
        } finally {
            setIsGeocodingLoading(false);
        }
    };

    const placeOrMoveMarker = (lat: number, lng: number, panZoom?: number) => {
        const map = mapInstanceRef.current;
        if (!map) return;

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

        if (panZoom) {
            map.setView([lat, lng], panZoom, { animate: true });
        }
    };

    // Obtener la ubicación actual del dispositivo mediante GPS / navegador
    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            notifyError('Tu navegador no soporta geolocalización.');
            return;
        }

        setIsLocatingDevice(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                placeOrMoveMarker(latitude, longitude, 16);
                await handleLocationChange(latitude, longitude);
                setIsLocatingDevice(false);
                notifySuccess('Ubicación actual y zona horaria detectadas automáticamente.');
            },
            (err) => {
                setIsLocatingDevice(false);
                if (err.code === err.PERMISSION_DENIED) {
                    notifyError('Permiso de ubicación denegado. Actívalo en el navegador para usar tu ubicación actual.');
                } else {
                    notifyError('No fue posible obtener la ubicación actual del dispositivo.');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    // Inicializar instancia de Leaflet una sola vez al montar (mismo patrón que botserver)
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const initialCenter: [number, number] = markerPosition
            ? [markerPosition[0], markerPosition[1]]
            : center && center[0] && center[1]
            ? [center[0], center[1]]
            : [23.6345, -102.5528];

        const map = L.map(mapContainerRef.current, {
            center: initialCenter,
            zoom: zoom || 14,
            minZoom: 2,
            maxZoom: 20,
            zoomControl: false,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const defaultTile = TILE_STYLES[tileStyle];
        const layer = L.tileLayer(defaultTile.url, {
            attribution: defaultTile.attribution,
            subdomains: defaultTile.subdomains,
            maxZoom: defaultTile.maxZoom,
        }).addTo(map);

        tileLayerRef.current = layer;
        mapInstanceRef.current = map;

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

        map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            placeOrMoveMarker(lat, lng);
            handleLocationChange(lat, lng);
        });

        const t1 = setTimeout(() => map.invalidateSize(), 100);
        const t2 = setTimeout(() => map.invalidateSize(), 300);

        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        resizeObserver.observe(mapContainerRef.current);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            resizeObserver.disconnect();
            map.remove();
            mapInstanceRef.current = null;
            tileLayerRef.current = null;
            markerRef.current = null;
        };
    }, []);

    // Cambiar el estilo del mapa dinámicamente
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (tileLayerRef.current) {
            map.removeLayer(tileLayerRef.current);
        }

        const cfg = TILE_STYLES[tileStyle];
        const newLayer = L.tileLayer(cfg.url, {
            attribution: cfg.attribution,
            subdomains: cfg.subdomains,
            maxZoom: cfg.maxZoom,
        }).addTo(map);

        newLayer.bringToBack();
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
                placeOrMoveMarker(lat, lng, 14);
            }
        }
    }, [markerPosition?.[0], markerPosition?.[1]]);

    return (
        <div
            className="relative w-full h-[480px] bg-slate-100 dark:bg-slate-950 overflow-hidden select-none"
            style={{ height: '480px', width: '100%', ...style }}
        >
            {/* Contenedor DOM de Leaflet con dimensiones explícitas */}
            <div
                ref={mapContainerRef}
                className="w-full h-full z-10"
                style={{ width: '100%', height: style?.height || '480px' }}
            />

            {/* Botón flotante: Usar mi ubicación actual */}
            <div className="absolute top-3 left-3 z-20">
                <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocatingDevice}
                    title="Obtener mi ubicación actual y zona horaria"
                    className="flex items-center gap-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 shadow-lg border border-slate-200/80 dark:border-slate-700/80 hover:bg-violet-50 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-60"
                >
                    {isLocatingDevice ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
                    ) : (
                        <LocateFixed className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    )}
                    <span>{isLocatingDevice ? 'Ubicando...' : 'Mi ubicación actual'}</span>
                </button>
            </div>

            {/* Selector flotante de estilo de mapa (CartoDB Claro por defecto + Capas de botserver) */}
            <div className="absolute top-3 right-3 z-20 flex flex-wrap items-center gap-1 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 shadow-lg border border-slate-200/80 dark:border-slate-700/80 max-w-[70%] justify-end">
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
                                'px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer',
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

            {/* Indicador de geocodificación inversa y zona horaria */}
            {(isGeocodingLoading || isLocatingDevice) && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-slate-900/85 text-white px-3.5 py-1.5 rounded-full text-xs font-medium shadow-lg pointer-events-none flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-violet-400 animate-ping" />
                    {isLocatingDevice
                        ? 'Obteniendo coordenadas GPS del dispositivo...'
                        : 'Detectando dirección y zona horaria automáticamente...'}
                </div>
            )}
        </div>
    );
};

export default EmpresaMapComponent;
