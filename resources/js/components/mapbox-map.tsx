import { usePage } from '@inertiajs/react';
import { ShieldAlert } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslate } from '@/hooks/use-translate';
import { isValidLatLng, reverseGeocode } from '@/lib/geocoding';
import 'mapbox-gl/dist/mapbox-gl.css';
import { cn } from '@/lib/utils';

export interface MapAddressDetails {
    codigo_postal?: string;
    estado?: string;
    direccion?: string;
    colonia?: string;
    ciudad?: string;
    pais?: string;
}

interface MapMarker {
    lat: number;
    lng: number;
    label?: string;
}

interface MapboxMapProps {
    lat: number;
    lng: number;
    zoom?: number;
    /**
     * Centro/zoom de respaldo cuando `lat`/`lng` aún no son coordenadas válidas
     * (p. ej. sin pin todavía). Evita que el mapa salte a [0,0].
     */
    center?: [number, number];
    onChange?: (lat: number, lng: number, details?: MapAddressDetails) => void;
    /** Se llama con `true` mientras se resuelve la geocodificación inversa. */
    onGeocodingChange?: (loading: boolean) => void;
    markers?: MapMarker[];
    interactive?: boolean;
    className?: string;
}

const EPSILON = 1e-6;

function toNum(value: unknown): number {
    return typeof value === 'string' ? parseFloat(value) : (value as number);
}

export default function MapboxMap({
    lat,
    lng,
    zoom = 9,
    center,
    onChange,
    onGeocodingChange,
    markers = [],
    interactive = true,
    className,
}: MapboxMapProps) {
    const { __ } = useTranslate();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markerRef = useRef<mapboxgl.Marker | null>(null);
    const staticMarkersRef = useRef<mapboxgl.Marker[]>([]);
    const geocodeAbortRef = useRef<AbortController | null>(null);
    const draggingRef = useRef(false);
    // Error de inicialización del motor de mapa (runtime). El de configuración
    // (token ausente/inactivo) se deriva abajo, sin setState en un efecto.
    const [engineError, setEngineError] = useState<string | null>(null);

    // Callbacks vía ref: los handlers del mapa siempre ven la versión actual sin
    // necesidad de re-crear el mapa (que era una de las causas del congelamiento).
    const onChangeRef = useRef(onChange);
    const onGeocodingChangeRef = useRef(onGeocodingChange);
    useEffect(() => {
        onChangeRef.current = onChange;
        onGeocodingChangeRef.current = onGeocodingChange;
    });

    const props = usePage().props as Record<string, unknown>;
    const auth = props.auth as
        | { user?: { empresa?: { mapbox_api_key?: string | null; mapbox_active?: boolean } } }
        | undefined;
    const mapboxApiKey = (props.mapbox_api_key as string | undefined) ?? auth?.user?.empresa?.mapbox_api_key ?? null;
    const mapboxActive =
        props.mapbox_active !== undefined ? Boolean(props.mapbox_active) : Boolean(auth?.user?.empresa?.mapbox_active);

    const configError =
        !mapboxActive || !mapboxApiKey
            ? __('Mapbox integration is not active or token is missing. Please configure it in Settings > Integrations.')
            : null;
    const mapError = configError ?? engineError;

    const latNum = toNum(lat);
    const lngNum = toNum(lng);
    const hasValidCoords = isValidLatLng(latNum, lngNum) && !(latNum === 0 && lngNum === 0);

    const initialCenter: [number, number] = useMemo(() => {
        if (hasValidCoords) {
            return [lngNum, latNum];
        }

        if (center && Number.isFinite(center[0]) && Number.isFinite(center[1])) {
            return [center[1], center[0]];
        }

        return [0, 0];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // sólo para el montaje inicial

    // Firma estable de los marcadores estáticos: sólo re-renderiza cuando cambian
    // de verdad, sin destruir el mapa.
    const markersSignature = useMemo(
        () =>
            markers
                .filter((m) => isValidLatLng(m.lat, m.lng))
                .map((m) => `${Number(m.lat).toFixed(6)},${Number(m.lng).toFixed(6)},${m.label ?? ''}`)
                .join('|'),
        [markers],
    );

    const runReverseGeocode = (targetLat: number, targetLng: number) => {
        geocodeAbortRef.current?.abort();
        const ctrl = new AbortController();
        geocodeAbortRef.current = ctrl;
        onGeocodingChangeRef.current?.(true);

        reverseGeocode(targetLat, targetLng, { token: mapboxApiKey, signal: ctrl.signal })
            .then((result) => {
                if (ctrl.signal.aborted || !result) {
                    return;
                }

                onChangeRef.current?.(targetLat, targetLng, {
                    direccion: result.direccion,
                    codigo_postal: result.codigo_postal,
                    estado: result.estado,
                    colonia: result.colonia,
                    ciudad: result.ciudad,
                    pais: result.pais,
                });
            })
            .catch(() => {
                /* nunca propaga: la geocodificación es best-effort */
            })
            .finally(() => {
                if (geocodeAbortRef.current === ctrl) {
                    onGeocodingChangeRef.current?.(false);
                }
            });
    };

    // ── Efecto 1: crear el mapa UNA sola vez ────────────────────────────────
    useEffect(() => {
        if (!mapboxActive || !mapboxApiKey || !mapContainerRef.current) {
            return;
        }

        mapboxgl.accessToken = mapboxApiKey;

        const isDark = document.documentElement.classList.contains('dark');
        const mapStyle = isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12';

        let map: mapboxgl.Map;

        try {
            map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: mapStyle,
                center: initialCenter,
                zoom,
                interactive,
            });
        } catch (err) {
            // Fallback si el constructor de Mapbox lanza (WebGL no disponible,
            // token corrupto...). Es un camino de error puntual, no un patrón de
            // sincronización de estado.
            console.error('Error initializing Mapbox:', err);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setEngineError(__('Failed to load Mapbox map. Please check your Access Token configuration.'));

            return;
        }

        mapRef.current = map;

        if (interactive) {
            map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        }

        const marker = new mapboxgl.Marker({ draggable: interactive && !!onChangeRef.current, color: '#6366f1' })
            .setLngLat(hasValidCoords ? [lngNum, latNum] : initialCenter)
            .addTo(map);
        markerRef.current = marker;

        // El pin (arrastre o clic) manda: primero se emiten las coordenadas de
        // forma SÍNCRONA (prevalecen por precisión); la dirección llega después,
        // sin bloquear.
        const commit = (mLat: number, mLng: number) => {
            if (!isValidLatLng(mLat, mLng)) {
                return;
            }

            onChangeRef.current?.(mLat, mLng);
            runReverseGeocode(mLat, mLng);
        };

        marker.on('dragstart', () => {
            draggingRef.current = true;
        });
        marker.on('dragend', () => {
            draggingRef.current = false;
            const { lat: mLat, lng: mLng } = marker.getLngLat();
            commit(mLat, mLng);
        });

        if (interactive) {
            map.on('click', (e) => {
                if (!onChangeRef.current) {
                    return;
                }

                marker.setLngLat(e.lngLat);
                commit(e.lngLat.lat, e.lngLat.lng);
            });
        }

        return () => {
            geocodeAbortRef.current?.abort();
            staticMarkersRef.current.forEach((m) => m.remove());
            staticMarkersRef.current = [];
            markerRef.current = null;
            map.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapboxApiKey, mapboxActive]);

    // ── Efecto 2: sincronizar el pin cuando las coordenadas cambian afuera ──
    // (lat/long manuales, geocodificación directa, edición de registro).
    useEffect(() => {
        const map = mapRef.current;
        const marker = markerRef.current;

        if (!map || !marker || draggingRef.current || !hasValidCoords) {
            return;
        }

        const current = marker.getLngLat();

        if (Math.abs(current.lat - latNum) > EPSILON || Math.abs(current.lng - lngNum) > EPSILON) {
            marker.setLngLat([lngNum, latNum]);
            map.easeTo({ center: [lngNum, latNum], essential: true });
        }
    }, [latNum, lngNum, hasValidCoords]);

    // ── Efecto 3: marcadores estáticos, sin recrear el mapa ─────────────────
    useEffect(() => {
        const map = mapRef.current;

        if (!map) {
            return;
        }

        staticMarkersRef.current.forEach((m) => m.remove());
        staticMarkersRef.current = [];

        markers
            .filter((m) => isValidLatLng(m.lat, m.lng))
            .forEach((m) => {
                const el = document.createElement('div');
                el.className =
                    'w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-white shadow-lg cursor-pointer';
                el.innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

                const mk = new mapboxgl.Marker(el).setLngLat([m.lng, m.lat]);

                if (m.label) {
                    mk.setPopup(
                        new mapboxgl.Popup({ offset: 25 }).setHTML(
                            `<div class="p-1 font-sans text-xs font-semibold text-slate-800">${m.label}</div>`,
                        ),
                    );
                }

                mk.addTo(map);
                staticMarkersRef.current.push(mk);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [markersSignature]);

    if (mapError) {
        return (
            <div className="flex h-80 min-h-[320px] w-full flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-muted-foreground dark:border-slate-800 dark:bg-slate-900/50">
                <ShieldAlert className="mb-2 h-10 w-10 text-red-500" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{__('Map Engine Error')}</p>
                <p className="mt-1 max-w-xs text-xs">{mapError}</p>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'relative h-80 min-h-[320px] w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800',
                className,
            )}
        >
            <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />
        </div>
    );
}
