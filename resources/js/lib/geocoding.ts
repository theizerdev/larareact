/**
 * Servicio de geocodificación centralizado.
 *
 * Motivo de existir: antes cada página resolvía la geocodificación por su
 * cuenta (Mapbox en `components/mapbox-map.tsx`, Nominatim en
 * `Empresas/Partials/MapComponent.tsx`, Nominatim otra vez en
 * `Proveedores/Index.tsx`, BigDataCloud para la zona horaria...). Un solo clic
 * en el mapa llegaba a disparar hasta 5 peticiones encadenadas a terceros, sin
 * cancelación ni timeout: de ahí el congelamiento y las escrituras fuera de
 * orden sobre el formulario.
 *
 * Reglas que garantiza este módulo:
 *  - Toda llamada a terceros tiene `try/catch`, timeout duro y `AbortSignal`.
 *  - Nunca lanza: ante cualquier fallo devuelve `null` y el llamador decide.
 *  - Deduplica por caché en memoria (mismo input -> misma respuesta).
 *  - Colapsa peticiones idénticas en vuelo (single-flight).
 *  - Normaliza Mapbox y Nominatim a una sola forma (`GeocodeResult`).
 */

/** Dirección estructurada + coordenadas, normalizada entre proveedores. */
export interface GeocodeResult {
    lat: number;
    lng: number;
    /** Dirección completa legible (una sola línea). */
    direccion: string;
    codigo_postal?: string;
    /** Estado / provincia / región. */
    estado?: string;
    ciudad?: string;
    /** Colonia / barrio / suburbio. */
    colonia?: string;
    pais?: string;
    /** ISO 3166-1 alfa-2 en mayúsculas, p. ej. "MX". */
    pais_iso2?: string;
    /** Proveedor que resolvió la consulta, útil para depurar en producción. */
    provider: 'mapbox' | 'nominatim';
}

/** Campos de dirección que alimentan la geocodificación progresiva. */
export interface AddressParts {
    pais?: string | null;
    estado?: string | null;
    ciudad?: string | null;
    colonia?: string | null;
    direccion?: string | null;
    codigo_postal?: string | null;
}

export interface GeocodeOptions {
    /** Token de Mapbox. Si falta, se usa Nominatim directamente. */
    mapboxToken?: string | null;
    /** Sesga los resultados a un país (ISO alfa-2), p. ej. "MX". */
    countryIso2?: string | null;
    signal?: AbortSignal;
    /** Timeout por proveedor. Por defecto 8 s. */
    timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 8_000;
const CACHE_MAX_ENTRIES = 200;

/** Redondeo a ~11 m: evita repetir la petición por micro-movimientos del pin. */
const COORD_CACHE_PRECISION = 4;

const cache = new Map<string, GeocodeResult | null>();
const inFlight = new Map<string, Promise<GeocodeResult | null>>();

function cacheGet(key: string): { hit: boolean; value: GeocodeResult | null } {
    if (!cache.has(key)) {
        return { hit: false, value: null };
    }

    // Reinsertar para que el orden del Map actúe como LRU.
    const value = cache.get(key) ?? null;
    cache.delete(key);
    cache.set(key, value);

    return { hit: true, value };
}

function cacheSet(key: string, value: GeocodeResult | null): void {
    cache.set(key, value);

    while (cache.size > CACHE_MAX_ENTRIES) {
        const oldest = cache.keys().next();

        if (oldest.done) {
            break;
        }

        cache.delete(oldest.value);
    }
}

/** Vacía la caché. Pensado para pruebas; no se usa en runtime. */
export function clearGeocodeCache(): void {
    cache.clear();
    inFlight.clear();
}

/**
 * `fetch` con timeout propio que respeta un `AbortSignal` externo.
 * Devuelve `null` en vez de lanzar: el llamador nunca tiene que envolver esto.
 */
async function safeFetchJson(url: string, signal?: AbortSignal, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<any | null> {
    const controller = new AbortController();
    const onExternalAbort = () => controller.abort();

    if (signal) {
        if (signal.aborted) {
            return null;
        }

        signal.addEventListener('abort', onExternalAbort, { once: true });
    }

    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch {
        // Abortos, timeouts, red caída, JSON corrupto: todos son "sin resultado".
        return null;
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onExternalAbort);
    }
}

/** `true` sólo para coordenadas finitas dentro del rango geográfico válido. */
export function isValidCoordinate(lat: unknown, lng: unknown): boolean {
    const latNum = typeof lat === 'string' ? Number(lat) : lat;
    const lngNum = typeof lng === 'string' ? Number(lng) : lng;

    return (
        typeof latNum === 'number' &&
        typeof lngNum === 'number' &&
        Number.isFinite(latNum) &&
        Number.isFinite(lngNum) &&
        latNum >= -90 &&
        latNum <= 90 &&
        lngNum >= -180 &&
        lngNum <= 180
    );
}

/**
 * Convierte a número las coordenadas que llegan del backend.
 *
 * Necesario porque el cast `decimal:8` de Eloquent serializa a *string*
 * ("19.70000000"), y pasar strings a Mapbox o a `.toFixed()` rompe el render.
 */
export function toCoordinate(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const num = typeof value === 'number' ? value : Number(value);

    return Number.isFinite(num) ? num : null;
}

// ── Normalizadores por proveedor ──────────────────────────────────────────────

function normalizeMapbox(feature: any, allFeatures: any[]): GeocodeResult | null {
    const center = feature?.center;

    if (!Array.isArray(center) || !isValidCoordinate(center[1], center[0])) {
        return null;
    }

    const result: GeocodeResult = {
        lat: Number(center[1]),
        lng: Number(center[0]),
        direccion: feature.place_name ?? '',
        provider: 'mapbox',
    };

    // El contexto del propio feature es más fiable que los features hermanos,
    // pero en geocodificación inversa Mapbox reparte los datos entre ambos.
    const candidates: any[] = [
        ...(Array.isArray(feature.context) ? feature.context : []),
        ...allFeatures,
    ];

    for (const item of candidates) {
        const types: string[] = item?.place_type ?? (typeof item?.id === 'string' ? [item.id.split('.')[0]] : []);
        const text: string | undefined = item?.text;

        if (!text) {
            continue;
        }

        if (types.includes('postcode') && !result.codigo_postal) {
            result.codigo_postal = text;
        }

        if (types.includes('region') && !result.estado) {
            result.estado = text;
        }

        if (types.includes('place') && !result.ciudad) {
            result.ciudad = text;
        }

        if ((types.includes('neighborhood') || types.includes('locality')) && !result.colonia) {
            result.colonia = text;
        }

        if (types.includes('country') && !result.pais) {
            result.pais = text;
            const iso = item?.properties?.short_code;

            if (typeof iso === 'string') {
                result.pais_iso2 = iso.toUpperCase();
            }
        }
    }

    return result;
}

function normalizeNominatim(item: any): GeocodeResult | null {
    if (!item || !isValidCoordinate(item.lat, item.lon)) {
        return null;
    }

    const addr = item.address ?? {};

    return {
        lat: Number(item.lat),
        lng: Number(item.lon),
        direccion: item.display_name ?? '',
        codigo_postal: addr.postcode,
        estado: addr.state ?? addr.region,
        ciudad: addr.city ?? addr.town ?? addr.village ?? addr.municipality,
        colonia: addr.neighbourhood ?? addr.suburb ?? addr.quarter,
        pais: addr.country,
        pais_iso2: typeof addr.country_code === 'string' ? addr.country_code.toUpperCase() : undefined,
        provider: 'nominatim',
    };
}

// ── Geocodificación directa: dirección -> coordenadas ─────────────────────────

/** Une los campos del formulario en una consulta única y estable. */
export function buildAddressQuery(parts: AddressParts): string {
    return [parts.direccion, parts.colonia, parts.ciudad, parts.codigo_postal, parts.estado, parts.pais]
        .map((part) => (part ?? '').toString().trim())
        .filter((part) => part.length > 0)
        .join(', ');
}

/**
 * Decide si una consulta tiene señal suficiente para justificar una petición.
 * Evita quemar cuota (y rate limit de Nominatim) mientras el usuario teclea.
 */
export function isQueryGeocodable(query: string): boolean {
    const trimmed = query.trim();

    return trimmed.length >= 5 && /[\p{L}\p{N}]/u.test(trimmed);
}

async function forwardMapbox(query: string, options: GeocodeOptions): Promise<GeocodeResult | null> {
    if (!options.mapboxToken) {
        return null;
    }

    const params = new URLSearchParams({
        access_token: options.mapboxToken,
        language: 'es',
        limit: '1',
    });

    if (options.countryIso2) {
        params.set('country', options.countryIso2.toLowerCase());
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`;
    const data = await safeFetchJson(url, options.signal, options.timeoutMs);
    const features: any[] = Array.isArray(data?.features) ? data.features : [];

    if (features.length === 0) {
        return null;
    }

    return normalizeMapbox(features[0], features);
}

async function forwardNominatim(query: string, options: GeocodeOptions): Promise<GeocodeResult | null> {
    const params = new URLSearchParams({
        q: query,
        format: 'jsonv2',
        addressdetails: '1',
        limit: '1',
        'accept-language': 'es',
    });

    if (options.countryIso2) {
        params.set('countrycodes', options.countryIso2.toLowerCase());
    }

    const data = await safeFetchJson(
        `https://nominatim.openstreetmap.org/search?${params}`,
        options.signal,
        options.timeoutMs,
    );

    return normalizeNominatim(Array.isArray(data) ? data[0] : null);
}

/**
 * Dirección -> coordenadas. Mapbox primero, Nominatim como respaldo.
 * Devuelve `null` si ningún proveedor resuelve (nunca lanza).
 */
export async function forwardGeocode(query: string, options: GeocodeOptions = {}): Promise<GeocodeResult | null> {
    const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ');

    if (!isQueryGeocodable(normalized)) {
        return null;
    }

    const key = `fwd:${options.countryIso2 ?? ''}:${normalized}`;
    const cached = cacheGet(key);

    if (cached.hit) {
        return cached.value;
    }

    const pending = inFlight.get(key);

    if (pending) {
        return pending;
    }

    const task = (async () => {
        const result = (await forwardMapbox(query, options)) ?? (await forwardNominatim(query, options));

        // Un aborto no es un "no hay resultado": no lo memorizamos, o el
        // siguiente intento con la misma consulta devolvería null para siempre.
        if (!options.signal?.aborted) {
            cacheSet(key, result);
        }

        return result;
    })().finally(() => {
        inFlight.delete(key);
    });

    inFlight.set(key, task);

    return task;
}

// ── Geocodificación inversa: coordenadas -> dirección ─────────────────────────

async function reverseMapbox(lat: number, lng: number, options: GeocodeOptions): Promise<GeocodeResult | null> {
    if (!options.mapboxToken) {
        return null;
    }

    const params = new URLSearchParams({
        access_token: options.mapboxToken,
        language: 'es',
    });

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?${params}`;
    const data = await safeFetchJson(url, options.signal, options.timeoutMs);
    const features: any[] = Array.isArray(data?.features) ? data.features : [];

    if (features.length === 0) {
        return null;
    }

    const normalized = normalizeMapbox(features[0], features);

    if (!normalized) {
        return null;
    }

    // Las coordenadas que manda el usuario mandan sobre el centroide devuelto.
    return { ...normalized, lat, lng };
}

async function reverseNominatim(lat: number, lng: number, options: GeocodeOptions): Promise<GeocodeResult | null> {
    const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        format: 'jsonv2',
        addressdetails: '1',
        'accept-language': 'es',
    });

    const data = await safeFetchJson(
        `https://nominatim.openstreetmap.org/reverse?${params}`,
        options.signal,
        options.timeoutMs,
    );

    const normalized = normalizeNominatim(data);

    return normalized ? { ...normalized, lat, lng } : null;
}

/**
 * Coordenadas -> dirección estructurada. Mapbox primero, Nominatim de respaldo.
 * Devuelve `null` si ningún proveedor resuelve (nunca lanza).
 */
export async function reverseGeocode(lat: number, lng: number, options: GeocodeOptions = {}): Promise<GeocodeResult | null> {
    if (!isValidCoordinate(lat, lng)) {
        return null;
    }

    const key = `rev:${lat.toFixed(COORD_CACHE_PRECISION)},${lng.toFixed(COORD_CACHE_PRECISION)}`;
    const cached = cacheGet(key);

    if (cached.hit) {
        return cached.value;
    }

    const pending = inFlight.get(key);

    if (pending) {
        return pending;
    }

    const task = (async () => {
        const result = (await reverseMapbox(lat, lng, options)) ?? (await reverseNominatim(lat, lng, options));

        if (!options.signal?.aborted) {
            cacheSet(key, result);
        }

        return result;
    })().finally(() => {
        inFlight.delete(key);
    });

    inFlight.set(key, task);

    return task;
}
