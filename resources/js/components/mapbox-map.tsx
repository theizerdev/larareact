import { usePage } from '@inertiajs/react';
import { Loader2, ShieldAlert } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslate } from '@/hooks/use-translate';
import 'mapbox-gl/dist/mapbox-gl.css';
import { isValidCoordinate, reverseGeocode, toCoordinate } from '@/lib/geocoding';
import { cn } from '@/lib/utils';

export interface MapAddressDetails {
    codigo_postal?: string;
    estado?: string;
    direccion?: string;
    ciudad?: string;
    colonia?: string;
    pais_iso2?: string;
}

interface MapboxMapProps {
    /** Acepta string porque el cast `decimal:8` de Eloquent serializa así. */
    lat: number | string | null;
    lng: number | string | null;
    zoom?: number;
    onChange?: (lat: number, lng: number, details?: MapAddressDetails) => void;
    markers?: Array<{ lat: number | string; lng: number | string; label?: string }>;
    interactive?: boolean;
    className?: string;
    /**
     * Si es `false`, el componente sólo emite coordenadas y deja la
     * geocodificación inversa a quien lo use (p. ej. `useLocationSync`).
     * Por defecto `true` para no romper a los consumidores existentes.
     */
    resolveAddress?: boolean;
}

/** Centro neutro cuando no hay coordenadas válidas todavía. */
const FALLBACK_CENTER: [number, number] = [-102.2839, 19.9868];

/** Umbral de ~11 m: por debajo no se reposiciona el mapa (evita bucles). */
const SYNC_EPSILON = 0.0001;

export default function MapboxMap({
    lat,
    lng,
    zoom = 9,
    onChange,
    markers = [],
    interactive = true,
    className,
    resolveAddress = true,
}: MapboxMapProps) {
    const { __ } = useTranslate();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markerRef = useRef<mapboxgl.Marker | null>(null);
    const staticMarkersRef = useRef<mapboxgl.Marker[]>([]);
    const geocodeAbortRef = useRef<AbortController | null>(null);
    // Fallo de inicialización del SDK (asíncrono e impredecible): sí necesita
    // estado. La falta de configuración, en cambio, se conoce en el render y se
    // deriva más abajo, sin `setState` dentro de un efecto.
    const [initError, setInitError] = useState<string | null>(null);
    const [isResolving, setIsResolving] = useState(false);

    const props = usePage().props as any;
    const mapboxApiKey: string | undefined = props.mapbox_api_key || props.auth?.user?.empresa?.mapbox_api_key;
    const mapboxActive = props.mapbox_active !== undefined ? props.mapbox_active : props.auth?.user?.empresa?.mapbox_active;

    const isConfigured = Boolean(mapboxActive && mapboxApiKey);

    const mapError = ! isConfigured
        ? __('Mapbox integration is not active or token is missing. Please configure it in Settings > Integrations.')
        : initError;

    // Las coordenadas pueden llegar como string desde el backend; normalizarlas
    // aquí evita que Mapbox reciba tipos que no entiende y que `.toFixed()`
    // reviente el render del formulario.
    const numericLat = toCoordinate(lat);
    const numericLng = toCoordinate(lng);
    const hasCoordinates = isValidCoordinate(numericLat, numericLng);

    // Los handlers viven en refs para que el efecto de inicialización NO dependa
    // de ellos. Antes se recreaba el mapa (contexto WebGL incluido) o, peor, se
    // quedaba con el `onChange` del primer render.
    //
    // La sincronización va en un efecto sin array de dependencias, no en el
    // cuerpo del render: mutar una ref durante el render está prohibido con el
    // React Compiler, que este proyecto tiene activo. Los listeners del mapa
    // sólo se ejecutan tras el commit, así que siempre leen el valor vigente.
    const onChangeRef = useRef(onChange);
    const resolveAddressRef = useRef(resolveAddress);
    const mapboxApiKeyRef = useRef(mapboxApiKey);

    useEffect(() => {
        onChangeRef.current = onChange;
        resolveAddressRef.current = resolveAddress;
        mapboxApiKeyRef.current = mapboxApiKey;
    });

    /**
     * Emite las coordenadas de inmediato y resuelve la dirección después.
     *
     * El orden importa: el pin y el formulario quedan sincronizados en el mismo
     * frame, y la petición de red va detrás sin bloquear nada. Antes se hacía
     * `await` de la geocodificación antes de avisar al formulario, así que cada
     * clic dejaba la interfaz sin responder hasta que contestara el proveedor.
     */
    const emitChange = useCallback((nextLat: number, nextLng: number) => {
        if (!isValidCoordinate(nextLat, nextLng)) {
            return;
        }

        onChangeRef.current?.(nextLat, nextLng);

        if (!resolveAddressRef.current) {
            return;
        }

        // Sólo la última interacción puede escribir: cancelar la anterior evita
        // que una respuesta lenta pise una posición más reciente.
        geocodeAbortRef.current?.abort();
        const controller = new AbortController();
        geocodeAbortRef.current = controller;
        setIsResolving(true);

        reverseGeocode(nextLat, nextLng, {
            mapboxToken: mapboxApiKeyRef.current,
            signal: controller.signal,
        })
            .then((result) => {
                if (controller.signal.aborted || !result) {
                    return;
                }

                onChangeRef.current?.(nextLat, nextLng, {
                    direccion: result.direccion || undefined,
                    codigo_postal: result.codigo_postal,
                    estado: result.estado,
                    ciudad: result.ciudad,
                    colonia: result.colonia,
                    pais_iso2: result.pais_iso2,
                });
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsResolving(false);
                }
            });
    }, []);

    // ── Efecto 1: crear el mapa una sola vez por token ───────────────────────
    useEffect(() => {
        if (!isConfigured || !mapContainerRef.current) {
            return;
        }

        mapboxgl.accessToken = mapboxApiKey as string;

        const isDark = document.documentElement.classList.contains('dark');
        const mapStyle = isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12';

        let map: mapboxgl.Map;

        try {
            map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: mapStyle,
                center: hasCoordinates ? [numericLng as number, numericLat as number] : FALLBACK_CENTER,
                zoom,
                interactive,
                // El contenedor puede montarse oculto (pestaña Radix, diálogo
                // animándose). Sin esto, Mapbox mide 0x0 y el mapa queda en gris.
                trackResize: true,
            });
        } catch (err) {
            console.error('Error initializing Mapbox:', err);
            // El SDK acaba de fallar: reportar ese resultado externo es
            // justamente para lo que existe el efecto, aunque la regla no pueda
            // distinguirlo de un render en cascada.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setInitError(__('Failed to load Mapbox map. Please check your Access Token configuration.'));

            return;
        }

        mapRef.current = map;
        map.on('error', (e) => console.error('Mapbox runtime error:', e?.error ?? e));

        if (interactive) {
            map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        }

        const marker = new mapboxgl.Marker({
            draggable: interactive && !!onChangeRef.current,
            color: '#6366f1',
        })
            .setLngLat(hasCoordinates ? [numericLng as number, numericLat as number] : FALLBACK_CENTER)
            .addTo(map);

        markerRef.current = marker;

        // Los listeners leen de las refs, así que nunca quedan obsoletos aunque
        // el padre vuelva a renderizar con otro `onChange`.
        const handleDragEnd = () => {
            const lngLat = marker.getLngLat();
            emitChange(lngLat.lat, lngLat.lng);
        };

        const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
            if (!onChangeRef.current) {
                return;
            }

            marker.setLngLat(e.lngLat);
            emitChange(e.lngLat.lat, e.lngLat.lng);
        };

        marker.on('dragend', handleDragEnd);
        map.on('click', handleMapClick);

        // Recalcular el tamaño en cuanto el contenedor deja de estar oculto o
        // cambia de caja. Es lo que arregla el mapa "congelado" al abrirlo desde
        // una pestaña inactiva.
        const observer = new ResizeObserver(() => {
            if (mapContainerRef.current && mapContainerRef.current.offsetWidth > 0) {
                map.resize();
            }
        });
        observer.observe(mapContainerRef.current);

        return () => {
            observer.disconnect();
            geocodeAbortRef.current?.abort();
            marker.off('dragend', handleDragEnd);
            map.off('click', handleMapClick);
            staticMarkersRef.current.forEach((m) => m.remove());
            staticMarkersRef.current = [];
            marker.remove();
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
        // `markers`, `zoom`, `lat`, `lng` y `onChange` quedan fuera a propósito:
        // se aplican en los efectos siguientes sin destruir el contexto WebGL.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConfigured, mapboxApiKey, interactive, emitChange]);

    // ── Efecto 2: mover el pin cuando cambian las coordenadas externas ───────
    useEffect(() => {
        const map = mapRef.current;
        const marker = markerRef.current;

        if (!map || !marker || !hasCoordinates) {
            return;
        }

        const current = marker.getLngLat();
        const moved =
            Math.abs(current.lat - (numericLat as number)) > SYNC_EPSILON ||
            Math.abs(current.lng - (numericLng as number)) > SYNC_EPSILON;

        if (!moved) {
            return;
        }

        marker.setLngLat([numericLng as number, numericLat as number]);
        map.easeTo({ center: [numericLng as number, numericLat as number], essential: true });
    }, [numericLat, numericLng, hasCoordinates]);

    // ── Efecto 3: marcadores estáticos, sin recrear el mapa ──────────────────
    useEffect(() => {
        const map = mapRef.current;

        if (!map) {
            return;
        }

        staticMarkersRef.current.forEach((m) => m.remove());
        staticMarkersRef.current = [];

        markers.forEach((m) => {
            const mLat = toCoordinate(m.lat);
            const mLng = toCoordinate(m.lng);

            if (!isValidCoordinate(mLat, mLng)) {
                return;
            }

            const el = document.createElement('div');
            el.className =
                'w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-white shadow-lg cursor-pointer';
            el.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

            const staticMarker = new mapboxgl.Marker(el).setLngLat([mLng as number, mLat as number]);

            if (m.label) {
                // `textContent` en vez de `setHTML`: la etiqueta viene de datos de
                // usuario y no debe poder inyectar marcado en el popup.
                const content = document.createElement('div');
                content.className = 'p-1 font-sans text-xs font-semibold text-slate-800';
                content.textContent = m.label;
                staticMarker.setPopup(new mapboxgl.Popup({ offset: 25 }).setDOMContent(content));
            }

            staticMarker.addTo(map);
            staticMarkersRef.current.push(staticMarker);
        });
        // Se compara por contenido para no recrear marcadores en cada render
        // cuando el padre pasa un array literal nuevo con los mismos datos.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(markers)]);

    // ── Efecto 4: zoom controlado desde el padre ─────────────────────────────
    useEffect(() => {
        const map = mapRef.current;

        if (!map || typeof zoom !== 'number' || !Number.isFinite(zoom)) {
            return;
        }

        if (Math.abs(map.getZoom() - zoom) > 0.5) {
            map.easeTo({ zoom, essential: true });
        }
    }, [zoom]);

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
        <div
            className={cn(
                'relative w-full h-80 min-h-[320px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800',
                className,
            )}
        >
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

            {isResolving && (
                <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-white shadow-lg">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {__('Resolving address...')}
                </div>
            )}
        </div>
    );
}
