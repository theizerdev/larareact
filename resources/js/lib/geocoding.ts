/**
 * Geocodificación (Incidencia 1 — Ubicación / Mapas).
 *
 * Provee geocodificación directa (texto → coordenadas) e inversa (coordenadas →
 * dirección estructurada) con:
 *   - `AbortSignal` + timeout duro (nunca cuelga el hilo ni deja fetch colgado).
 *   - Proveedor primario Mapbox Geocoding **v6** (el v5 `mapbox.places` está
 *     descontinuado y puede colgar/404). Fallback a Nominatim/OpenStreetMap.
 *   - Nunca lanza: ante cualquier fallo devuelve `null` y el llamador decide.
 *
 * No persiste nada por sí mismo: sólo resuelve datos para que el formulario los
 * incorpore al payload.
 */

export interface GeoAddress {
    lat: number;
    lng: number;
    direccion?: string;
    codigo_postal?: string;
    colonia?: string;
    ciudad?: string;
    estado?: string;
    pais?: string;
}

export interface GeoOptions {
    /** Token público de Mapbox. Si falta, se usa directamente Nominatim. */
    token?: string | null;
    /** Se combina con la señal interna de timeout. */
    signal?: AbortSignal;
    /** ISO 3166-1 alpha-2 (p. ej. "mx") para sesgar resultados. */
    country?: string;
    language?: string;
}

const TIMEOUT_MS = 8000;

/** Combina la señal del llamador con un timeout propio. */
function linkedSignal(external?: AbortSignal): { signal: AbortSignal; cleanup: () => void } {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(new DOMException('Geocoding timeout', 'TimeoutError')), TIMEOUT_MS);

    const onExternalAbort = () => ctrl.abort((external as { reason?: unknown })?.reason);

    if (external) {
        if (external.aborted) {
            ctrl.abort((external as { reason?: unknown }).reason);
        } else {
            external.addEventListener('abort', onExternalAbort, { once: true });
        }
    }

    return {
        signal: ctrl.signal,
        cleanup: () => {
            clearTimeout(timer);
            external?.removeEventListener('abort', onExternalAbort);
        },
    };
}

function toFiniteNumber(value: unknown): number | null {
    const n = typeof value === 'string' ? parseFloat(value) : (value as number);

    return Number.isFinite(n) ? n : null;
}

export function isValidLatLng(lat: unknown, lng: unknown): boolean {
    const la = toFiniteNumber(lat);
    const ln = toFiniteNumber(lng);

    return la !== null && ln !== null && la >= -90 && la <= 90 && ln >= -180 && ln <= 180;
}

// ─── Mapbox Geocoding v6 ─────────────────────────────────────────────────────

interface MapboxV6Context {
    address?: { name?: string };
    postcode?: { name?: string };
    neighborhood?: { name?: string };
    locality?: { name?: string };
    place?: { name?: string };
    region?: { name?: string };
    country?: { name?: string };
}

interface MapboxV6Feature {
    geometry?: { coordinates?: [number, number] };
    properties?: {
        full_address?: string;
        name?: string;
        context?: MapboxV6Context;
    };
}

function parseMapboxFeature(feature: MapboxV6Feature | undefined, fallbackLat?: number, fallbackLng?: number): GeoAddress | null {
    if (!feature) {
        return null;
    }

    const coords = feature.geometry?.coordinates;
    const lng = toFiniteNumber(coords?.[0]) ?? toFiniteNumber(fallbackLng);
    const lat = toFiniteNumber(coords?.[1]) ?? toFiniteNumber(fallbackLat);

    if (lat === null || lng === null) {
        return null;
    }

    const ctx = feature.properties?.context ?? {};

    return {
        lat,
        lng,
        direccion: feature.properties?.full_address || feature.properties?.name || undefined,
        codigo_postal: ctx.postcode?.name,
        colonia: ctx.neighborhood?.name || ctx.locality?.name,
        ciudad: ctx.place?.name || ctx.locality?.name,
        estado: ctx.region?.name,
        pais: ctx.country?.name,
    };
}

async function mapboxForward(query: string, opts: GeoOptions): Promise<GeoAddress | null> {
    if (!opts.token) {
        return null;
    }

    const { signal, cleanup } = linkedSignal(opts.signal);

    try {
        const params = new URLSearchParams({
            q: query,
            access_token: opts.token,
            limit: '1',
            language: opts.language ?? 'es',
        });

        if (opts.country) {
            params.set('country', opts.country);
        }

        const res = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`, { signal });

        if (!res.ok) {
            return null;
        }

        const data = (await res.json()) as { features?: MapboxV6Feature[] };

        return parseMapboxFeature(data.features?.[0]);
    } catch {
        return null;
    } finally {
        cleanup();
    }
}

async function mapboxReverse(lat: number, lng: number, opts: GeoOptions): Promise<GeoAddress | null> {
    if (!opts.token) {
        return null;
    }

    const { signal, cleanup } = linkedSignal(opts.signal);

    try {
        const params = new URLSearchParams({
            longitude: String(lng),
            latitude: String(lat),
            access_token: opts.token,
            limit: '1',
            language: opts.language ?? 'es',
        });

        const res = await fetch(`https://api.mapbox.com/search/geocode/v6/reverse?${params.toString()}`, { signal });

        if (!res.ok) {
            return null;
        }

        const data = (await res.json()) as { features?: MapboxV6Feature[] };

        return parseMapboxFeature(data.features?.[0], lat, lng);
    } catch {
        return null;
    } finally {
        cleanup();
    }
}

// ─── Nominatim / OpenStreetMap (fallback) ────────────────────────────────────

interface NominatimAddress {
    road?: string;
    house_number?: string;
    neighbourhood?: string;
    suburb?: string;
    quarter?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
}

interface NominatimResult {
    lat?: string;
    lon?: string;
    display_name?: string;
    address?: NominatimAddress;
}

function parseNominatim(result: NominatimResult | undefined, fallbackLat?: number, fallbackLng?: number): GeoAddress | null {
    if (!result) {
        return null;
    }

    const lat = toFiniteNumber(result.lat) ?? toFiniteNumber(fallbackLat);
    const lng = toFiniteNumber(result.lon) ?? toFiniteNumber(fallbackLng);

    if (lat === null || lng === null) {
        return null;
    }

    const a = result.address ?? {};

    return {
        lat,
        lng,
        direccion: result.display_name || undefined,
        codigo_postal: a.postcode,
        colonia: a.neighbourhood || a.suburb || a.quarter,
        ciudad: a.city || a.town || a.village || a.municipality || a.county,
        estado: a.state,
        pais: a.country,
    };
}

async function nominatimForward(query: string, opts: GeoOptions): Promise<GeoAddress | null> {
    const { signal, cleanup } = linkedSignal(opts.signal);

    try {
        const params = new URLSearchParams({
            q: query,
            format: 'jsonv2',
            addressdetails: '1',
            limit: '1',
            'accept-language': opts.language ?? 'es',
        });

        if (opts.country) {
            params.set('countrycodes', opts.country);
        }

        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
            signal,
            headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
            return null;
        }

        const data = (await res.json()) as NominatimResult[];

        return parseNominatim(Array.isArray(data) ? data[0] : undefined);
    } catch {
        return null;
    } finally {
        cleanup();
    }
}

async function nominatimReverse(lat: number, lng: number, opts: GeoOptions): Promise<GeoAddress | null> {
    const { signal, cleanup } = linkedSignal(opts.signal);

    try {
        const params = new URLSearchParams({
            lat: String(lat),
            lon: String(lng),
            format: 'jsonv2',
            addressdetails: '1',
            'accept-language': opts.language ?? 'es',
        });

        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
            signal,
            headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
            return null;
        }

        const data = (await res.json()) as NominatimResult;

        return parseNominatim(data, lat, lng);
    } catch {
        return null;
    } finally {
        cleanup();
    }
}

// ─── API pública ────────────────────────────────────────────────────────────

/** Texto → coordenadas + dirección estructurada. Devuelve `null` si no resuelve. */
export async function forwardGeocode(query: string, opts: GeoOptions = {}): Promise<GeoAddress | null> {
    const q = query.trim();

    if (q.length < 3) {
        return null;
    }

    if (opts.signal?.aborted) {
        return null;
    }

    return (await mapboxForward(q, opts)) ?? (await nominatimForward(q, opts));
}

/** Coordenadas → dirección estructurada. Devuelve `null` si no resuelve. */
export async function reverseGeocode(lat: number, lng: number, opts: GeoOptions = {}): Promise<GeoAddress | null> {
    if (!isValidLatLng(lat, lng)) {
        return null;
    }

    if (opts.signal?.aborted) {
        return null;
    }

    return (await mapboxReverse(lat, lng, opts)) ?? (await nominatimReverse(lat, lng, opts));
}
