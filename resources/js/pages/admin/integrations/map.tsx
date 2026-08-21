import { Head, router } from '@inertiajs/react';
import {
    Map as MapIcon,
    RefreshCw,
    LocateFixed,
    Route,
    ArrowUpDown,
    Car,
    Footprints,
    Bike,
    Trash2,
    Loader2,
    MapPin,
    Navigation,
    Compass,
    AlertCircle,
    ChevronRight,
    Menu,
    Info,
    ArrowLeft
} from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslate } from '@/hooks/use-translate';
import 'mapbox-gl/dist/mapbox-gl.css';

interface PageProps {
    mapbox_api_key: string | null;
    mapbox_active: boolean;
    google_maps_api_key: string | null;
    google_maps_active: boolean;
}

interface Suggestion {
    id: string;
    place_name: string;
    center: [number, number];
}

interface RouteStep {
    maneuver: {
        instruction: string;
        type: string;
    };
    distance: number;
    duration: number;
}

export default function MapboxIntegration({
    mapbox_api_key,
    mapbox_active,
    google_maps_api_key,
    google_maps_active
}: PageProps) {
    const { __ } = useTranslate();
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);

    // References for elements on the map
    const originMarker = useRef<mapboxgl.Marker | null>(null);
    const destMarker = useRef<mapboxgl.Marker | null>(null);

    // Google Maps Script Load State
    const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false);

    // Input values
    const [originQuery, setOriginQuery] = useState('');
    const [destQuery, setDestQuery] = useState('');

    // Suggestions
    const [originSuggestions, setOriginSuggestions] = useState<Suggestion[]>([]);
    const [destSuggestions, setDestSuggestions] = useState<Suggestion[]>([]);

    // Selected coordinates: [lng, lat]
    const [originCoord, setOriginCoord] = useState<[number, number] | null>(null);
    const [destCoord, setDestCoord] = useState<[number, number] | null>(null);

    // Focus state to show autocomplete dropdowns
    const [activeInput, setActiveInput] = useState<'origin' | 'destination' | null>(null);

    // Profiles
    const [profile, setProfile] = useState<'driving' | 'walking' | 'cycling'>('driving');

    // Loading states
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [loadingRoute, setLoadingRoute] = useState(false);

    // Mapbox Search Box v1 Session Token
    const mapboxSessionToken = useRef<string>('');

    useEffect(() => {
        mapboxSessionToken.current = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);

            return v.toString(16);
        });
    }, []);

    // Route calculation results
    const [routeDistance, setRouteDistance] = useState<number | null>(null); // in meters
    const [routeDuration, setRouteDuration] = useState<number | null>(null); // in seconds
    const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Settings'), href: '#' },
        { title: __('Integrations'), href: '/admin/integrations' },
        { title: __('Mapbox Navigation'), href: '/admin/integrations/mapbox' }
    ];

    // Load Google Maps API script if active
    useEffect(() => {
        if (!google_maps_active || !google_maps_api_key) {
return;
}

        const google = (window as any).google;

        if (google?.maps?.places) {
            setIsGoogleScriptLoaded(true);

            return;
        }

        const scriptId = 'google-maps-places-script';

        if (document.getElementById(scriptId)) {
return;
}

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${google_maps_api_key}&libraries=places&language=es&region=VE`;
        script.async = true;
        script.defer = true;
        script.onload = () => setIsGoogleScriptLoaded(true);
        document.head.appendChild(script);
    }, [google_maps_active, google_maps_api_key]);

    // Initialize Mapbox centered in Caracas, Venezuela by default
    useEffect(() => {
        if (!mapbox_api_key || !mapContainer.current || map.current) {
return;
}

        mapboxgl.accessToken = mapbox_api_key;

        const isDark = document.documentElement.classList.contains('dark');
        const mapStyle = isDark
            ? 'mapbox://styles/mapbox/dark-v11'
            : 'mapbox://styles/mapbox/streets-v12';

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: mapStyle,
            center: [-66.9036, 10.4806], // Center in Caracas, Venezuela
            zoom: 12
        });

        // Add default controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true
        }), 'top-right');

        // Cleanup
        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [mapbox_api_key]);

    // Handle styling changes for dark mode dynamically
    useEffect(() => {
        if (!map.current) {
return;
}

        const handleStyleChange = () => {
            const isDark = document.documentElement.classList.contains('dark');
            const styleUrl = isDark
                ? 'mapbox://styles/mapbox/dark-v11'
                : 'mapbox://styles/mapbox/streets-v12';
            map.current?.setStyle(styleUrl);

            // Re-render route layer once the new style loads
            map.current?.once('style.load', () => {
                if (originCoord && destCoord) {
                    calculateRoute();
                }
            });
        };

        const observer = new MutationObserver(handleStyleChange);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, [originCoord, destCoord]);

    // Autocomplete Search fetch logic
    const fetchSuggestions = async (query: string, type: 'origin' | 'destination') => {
        if (query.trim().length < 3) {
            if (type === 'origin') {
setOriginSuggestions([]);
} else {
setDestSuggestions([]);
}

            return;
        }

        // Use Google Autocomplete if enabled and script is loaded, merged with Nominatim
        if (google_maps_active && isGoogleScriptLoaded) {
            setLoadingSuggestions(true);

            try {
                // Fetch OSM in parallel
                const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=ve&limit=3&accept-language=es`;
                const osmPromise = fetch(nominatimUrl).then(res => res.json()).catch(() => []);

                const googlePromise = new Promise<any[]>((resolve) => {
                    const google = (window as any).google;
                    const service = new google.maps.places.AutocompleteService();
                    service.getPlacePredictions({
                        input: query,
                        componentRestrictions: { country: 've' }, // limit to Venezuela addresses
                        language: 'es'
                    }, (predictions: any[], status: any) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                            resolve(predictions.map(p => ({
                                id: p.place_id,
                                place_name: p.description,
                                center: [0, 0] as [number, number] // coordinates fetched on selection
                            })));
                        } else {
                            resolve([]);
                        }
                    });
                });

                const [googleResults, osmResults] = await Promise.all([googlePromise, osmPromise]);
                const formattedOsm = (osmResults || []).map((item: any) => ({
                    id: `osm-${item.place_id}`,
                    place_name: `[OSM] ${item.display_name}`,
                    center: [parseFloat(item.lon), parseFloat(item.lat)] as [number, number]
                }));

                const merged = [...googleResults, ...formattedOsm];

                if (type === 'origin') {
setOriginSuggestions(merged);
} else {
setDestSuggestions(merged);
}
            } catch (err) {
                console.error('Google Autocomplete Error:', err);
            } finally {
                setLoadingSuggestions(false);
            }

            return;
        }

        // Mapbox Search Box v1 fallback merged with Nominatim
        if (!mapbox_api_key) {
return;
}

        setLoadingSuggestions(true);

        try {
            const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=ve&limit=3&accept-language=es`;
            const osmPromise = fetch(nominatimUrl).then(res => res.json()).catch(() => []);

            const mapboxUrl = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${mapbox_api_key}&session_token=${mapboxSessionToken.current}&country=ve&language=es&limit=5`;
            const mapboxPromise = fetch(mapboxUrl).then(res => res.json()).catch(() => ({ suggestions: [] }));

            const [mapboxData, osmResults] = await Promise.all([mapboxPromise, osmPromise]);

            const mapboxResults = (mapboxData.suggestions || []).map((s: any) => ({
                id: s.mapbox_id,
                place_name: s.full_address ? `${s.name}, ${s.full_address}` : s.name,
                center: [0, 0] as [number, number]
            }));

            const formattedOsm = (osmResults || []).map((item: any) => ({
                id: `osm-${item.place_id}`,
                place_name: `[OSM] ${item.display_name}`,
                center: [parseFloat(item.lon), parseFloat(item.lat)] as [number, number]
            }));

            const merged = [...mapboxResults, ...formattedOsm];

            if (type === 'origin') {
setOriginSuggestions(merged);
} else {
setDestSuggestions(merged);
}
        } catch (err) {
            console.error('Error fetching Mapbox/OSM suggestions:', err);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    // Debounce autocompleting suggestions
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeInput === 'origin') {
fetchSuggestions(originQuery, 'origin');
}
        }, 400);

        return () => clearTimeout(timer);
    }, [originQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeInput === 'destination') {
fetchSuggestions(destQuery, 'destination');
}
        }, 400);

        return () => clearTimeout(timer);
    }, [destQuery]);

    // Handle marker positioning on coords changes
    useEffect(() => {
        if (!map.current) {
return;
}

        // Origin Marker
        if (originCoord) {
            if (!originMarker.current) {
                originMarker.current = new mapboxgl.Marker({ color: '#6366f1', draggable: false })
                    .setLngLat(originCoord)
                    .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<p class="text-xs font-semibold px-2">${__('Origin')}</p>`))
                    .addTo(map.current);
            } else {
                originMarker.current.setLngLat(originCoord);
            }
        } else {
            if (originMarker.current) {
                originMarker.current.remove();
                originMarker.current = null;
            }
        }

        // Destination Marker
        if (destCoord) {
            if (!destMarker.current) {
                destMarker.current = new mapboxgl.Marker({ color: '#ef4444', draggable: false })
                    .setLngLat(destCoord)
                    .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<p class="text-xs font-semibold px-2">${__('Destination')}</p>`))
                    .addTo(map.current);
            } else {
                destMarker.current.setLngLat(destCoord);
            }
        } else {
            if (destMarker.current) {
                destMarker.current.remove();
                destMarker.current = null;
            }
        }

        // Trigger route drawing if both coords exist
        if (originCoord && destCoord) {
            calculateRoute();
        } else {
            clearRouteLayer();
        }
    }, [originCoord, destCoord, profile]);

    // Clear route visual lines from map
    const clearRouteLayer = () => {
        if (!map.current) {
return;
}

        if (map.current.getLayer('route')) {
            map.current.removeLayer('route');
        }

        if (map.current.getSource('route')) {
            map.current.removeSource('route');
        }

        setRouteDistance(null);
        setRouteDuration(null);
        setRouteSteps([]);
    };

    // Calculate and draw route using selected API
    const calculateRoute = async () => {
        if (!originCoord || !destCoord || !map.current) {
return;
}

        // Check Google Directions first if active
        if (google_maps_active && isGoogleScriptLoaded) {
            setLoadingRoute(true);

            try {
                const google = (window as any).google;
                let travelMode = google.maps.TravelMode.DRIVING;

                if (profile === 'walking') {
travelMode = google.maps.TravelMode.WALKING;
} else if (profile === 'cycling') {
travelMode = google.maps.TravelMode.BICYCLING;
}

                const directionsService = new google.maps.DirectionsService();
                directionsService.route({
                    origin: new google.maps.LatLng(originCoord[1], originCoord[0]),
                    destination: new google.maps.LatLng(destCoord[1], destCoord[0]),
                    travelMode: travelMode,
                    provideRouteAlternatives: true
                }, (response: any, status: any) => {
                    setLoadingRoute(false);

                    if (status === google.maps.DirectionsStatus.OK && response && response.routes[0]) {
                        const route = response.routes[0];
                        const leg = route.legs[0];

                        setRouteDistance(leg.distance ? leg.distance.value : 0); // meters
                        setRouteDuration(leg.duration ? leg.duration.value : 0); // seconds

                        // Parse instructions removing HTML formatting tags
                        const steps = (leg.steps || []).map((s: any) => ({
                            maneuver: {
                                instruction: (s.instructions || '').replace(/<[^>]*>/g, ''),
                                type: s.maneuver || ''
                            },
                            distance: s.distance ? s.distance.value : 0,
                            duration: s.duration ? s.duration.value : 0
                        }));
                        setRouteSteps(steps);

                        // Decode polyline overview path to array of LngLat
                        const pathCoords = route.overview_path.map((p: any) => [p.lng(), p.lat()]);
                        drawRouteLine(pathCoords);
                    } else {
                        console.error('Google Directions API status:', status);
                        Swal.fire({
                            title: __('No Route Found'),
                            text: __('Google Directions API was unable to calculate routes.'),
                            icon: 'warning',
                            timer: 3000,
                            showConfirmButton: false
                        });
                        clearRouteLayer();
                    }
                });
            } catch (err) {
                console.error('Google Directions service error:', err);
                setLoadingRoute(false);
            }

            return;
        }

        // Mapbox routing fallback
        if (!mapbox_api_key) {
return;
}

        setLoadingRoute(true);

        try {
            const mapboxProfile = `mapbox/${profile}`;
            const url = `https://api.mapbox.com/directions/v5/${mapboxProfile}/${originCoord[0]},${originCoord[1]};${destCoord[0]},${destCoord[1]}?geometries=geojson&steps=true&language=es&access_token=${mapbox_api_key}`;

            const res = await fetch(url);
            const data = await res.json();

            if (!data.routes || data.routes.length === 0) {
                Swal.fire({
                    title: __('No Route Found'),
                    text: __('Unable to find a valid route between these locations.'),
                    icon: 'warning',
                    timer: 3000,
                    showConfirmButton: false
                });
                clearRouteLayer();

                return;
            }

            const route = data.routes[0];
            setRouteDistance(route.distance);
            setRouteDuration(route.duration);

            if (route.legs && route.legs[0]) {
                setRouteSteps(route.legs[0].steps || []);
            }

            drawRouteLine(route.geometry.coordinates);

        } catch (err) {
            console.error('Error calculating Mapbox route:', err);
            Swal.fire({
                title: __('Routing Error'),
                text: __('An error occurred while calculating Mapbox directions.'),
                icon: 'error',
                timer: 3000,
                showConfirmButton: false
            });
        } finally {
            setLoadingRoute(false);
        }
    };

    // Draw lines inside Mapbox GL Map
    const drawRouteLine = (coordinates: number[][]) => {
        if (!map.current) {
return;
}

        const geojson = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: coordinates
            }
        };

        if (map.current.getSource('route')) {
            const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
            source.setData(geojson as any);
        } else {
            map.current.addSource('route', {
                type: 'geojson',
                data: geojson as any
            });

            map.current.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#6366f1',
                    'line-width': 5,
                    'line-opacity': 0.8
                }
            });
        }

        // Adjust bounds
        const bounds = new mapboxgl.LngLatBounds();
        coordinates.forEach(coord => bounds.extend(coord as [number, number]));
        map.current.fitBounds(bounds, {
            padding: 70,
            maxZoom: 15
        });
    };

    // Handle suggestion clicks
    const handleSelectSuggestion = async (item: Suggestion, type: 'origin' | 'destination') => {
        // Fetch coordinates from Google Geocoder if it's a Google prediction
        if (google_maps_active && isGoogleScriptLoaded && item.center[0] === 0) {
            setLoadingRoute(true);

            try {
                const google = (window as any).google;
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ placeId: item.id }, (results: any[], status: any) => {
                    setLoadingRoute(false);

                    if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                        const lat = results[0].geometry.location.lat();
                        const lng = results[0].geometry.location.lng();

                        if (type === 'origin') {
                            setOriginQuery(item.place_name);
                            setOriginCoord([lng, lat]);
                        } else {
                            setDestQuery(item.place_name);
                            setDestCoord([lng, lat]);
                        }
                    }
                });
            } catch (err) {
                console.error('Google Geocoding error:', err);
                setLoadingRoute(false);
            }

            setActiveInput(null);

            return;
        }

        // Fetch coordinates from Mapbox Retrieve if it's a Mapbox prediction without coordinates
        if (!google_maps_active && item.center[0] === 0) {
            setLoadingRoute(true);

            try {
                const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${item.id}?access_token=${mapbox_api_key}&session_token=${mapboxSessionToken.current}`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.features && data.features[0]) {
                    const coords = data.features[0].geometry.coordinates; // [lng, lat]

                    if (type === 'origin') {
                        setOriginQuery(item.place_name);
                        setOriginCoord(coords);
                    } else {
                        setDestQuery(item.place_name);
                        setDestCoord(coords);
                    }
                }
            } catch (err) {
                console.error('Mapbox Search Box retrieve error:', err);
            } finally {
                setLoadingRoute(false);
            }

            setActiveInput(null);

            return;
        }

        // Fallback for suggestions that already have coordinates
        if (type === 'origin') {
            setOriginQuery(item.place_name);
            setOriginCoord(item.center);
        } else {
            setDestQuery(item.place_name);
            setDestCoord(item.center);
        }

        setActiveInput(null);
    };

    // Swap Origin and Destination
    const swapLocations = () => {
        const tempQuery = originQuery;
        const tempCoord = originCoord;

        setOriginQuery(destQuery);
        setOriginCoord(destCoord);

        setDestQuery(tempQuery);
        setDestCoord(tempCoord);
    };

    // Reset Route
    const resetDirections = () => {
        setOriginQuery('');
        setOriginCoord(null);
        setOriginSuggestions([]);

        setDestQuery('');
        setDestCoord(null);
        setDestSuggestions([]);

        setActiveInput(null);
        clearRouteLayer();

        // Center map back in Caracas
        map.current?.flyTo({
            center: [-66.9036, 10.4806],
            zoom: 12
        });
    };

    // Set Origin to current GPS coordinates
    const useCurrentLocation = () => {
        if (!navigator.geolocation) {
            Swal.fire({
                title: __('Unavailable'),
                text: __('Geolocation is not supported by your browser.'),
                icon: 'warning',
                timer: 3000,
                showConfirmButton: false
            });

            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { longitude, latitude } = position.coords;
                setOriginCoord([longitude, latitude]);
                setOriginQuery(`${latitude.toFixed(5)}, ${longitude.toFixed(5)} (${__('My Location')})`);
                setActiveInput(null);

                map.current?.flyTo({
                    center: [longitude, latitude],
                    zoom: 14
                });
            },
            (error) => {
                Swal.fire({
                    title: __('GPS Error'),
                    text: __('Unable to detect your current location.'),
                    icon: 'error',
                    timer: 3000,
                    showConfirmButton: false
                });
            }
        );
    };

    // Formatter helpers
    const formatDistance = (meters: number) => {
        if (meters < 1000) {
return `${meters.toFixed(0)} m`;
}

        return `${(meters / 1000).toFixed(1)} km`;
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.round(seconds / 60);

        if (mins < 60) {
return `${mins} min`;
}

        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;

        return `${hrs} h ${remMins} min`;
    };

    // Get Lucide icon based on turn instruction keywords
    const getStepIcon = (type: string) => {
        const lowerType = type.toLowerCase();

        if (lowerType.includes('arrive')) {
return <MapPin className="h-4 w-4 text-rose-500 fill-rose-100 dark:fill-rose-950" />;
}

        if (lowerType.includes('depart')) {
return <MapPin className="h-4 w-4 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />;
}

        if (lowerType.includes('left')) {
return <Navigation className="h-4 w-4 text-indigo-500 -rotate-90" />;
}

        if (lowerType.includes('right')) {
return <Navigation className="h-4 w-4 text-indigo-500 rotate-90" />;
}

        return <ChevronRight className="h-4 w-4 text-slate-400" />;
    };

    // Handle map clicks when an input is active
    useEffect(() => {
        if (!map.current) {
return;
}

        const handleMapClick = async (e: mapboxgl.MapMouseEvent) => {
            if (!activeInput) {
return;
}

            const { lng, lat } = e.lngLat;

            // Set temporary coordinate first
            if (activeInput === 'origin') {
                setOriginCoord([lng, lat]);
            } else if (activeInput === 'destination') {
                setDestCoord([lng, lat]);
            }

            setLoadingRoute(true);
            let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

            try {
                if (google_maps_active && isGoogleScriptLoaded) {
                    // Google Reverse Geocoding
                    const google = (window as any).google;
                    const geocoder = new google.maps.Geocoder();
                    const results = await new Promise<any>((resolve) => {
                        geocoder.geocode({ location: { lat, lng } }, (res: any[] | null, status: any) => {
                            if (status === 'OK' && res && res[0]) {
resolve(res[0]);
} else {
resolve(null);
}
                        });
                    });

                    if (results) {
                        address = results.formatted_address;
                    }
                } else {
                    // Mapbox Reverse Geocoding
                    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapbox_api_key}&language=es`;
                    const res = await fetch(url);
                    const data = await res.json();

                    if (data.features && data.features[0]) {
                        address = data.features[0].place_name;
                    } else {
                        // Nominatim Reverse Geocoding fallback
                        const osmUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`;
                        const resOsm = await fetch(osmUrl, {
                            headers: { 'User-Agent': 'Larareact-Routing-App/1.0' }
                        });
                        const dataOsm = await resOsm.json();

                        if (dataOsm && dataOsm.display_name) {
                            address = dataOsm.display_name;
                        }
                    }
                }
            } catch (err) {
                console.error('Reverse geocoding error:', err);
            } finally {
                setLoadingRoute(false);
            }

            if (activeInput === 'origin') {
                setOriginQuery(address);
            } else if (activeInput === 'destination') {
                setDestQuery(address);
            }

            // Auto close input focus after selecting
            setActiveInput(null);
        };

        map.current.on('click', handleMapClick);

        return () => {
            map.current?.off('click', handleMapClick);
        };
    }, [activeInput, google_maps_active, isGoogleScriptLoaded, mapbox_api_key]);

    // Handle clicks outside dropdown suggestions to close them
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // Prevent closing autocomplete active states when clicking on search boxes, map canvas, or controls
            if (
                target.closest('.search-box-container') ||
                target.closest('.mapboxgl-canvas') ||
                target.closest('.mapboxgl-ctrl')
            ) {
                return;
            }

            setActiveInput(null);
        };
        document.addEventListener('mousedown', handleOutsideClick);

        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // Check if at least one engine is active
    const isEngineActive = mapbox_active && mapbox_api_key;

    if (!isEngineActive) {
        return (
            <>
                <Head title={__('Mapbox Navigation')} />
                <div className="space-y-6">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>{__('Integration Incomplete')}</CardTitle>
                            <CardDescription>
                                {__('Please make sure you have Mapbox integration enabled and configured with a valid access token in Settings > Integrations to render the map visual container.')}
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button onClick={() => router.visit('/admin/integrations')}>
                                {__('Go to Settings')}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={__('Mapbox Navigation')} />
            <div className="w-screen h-screen relative overflow-hidden bg-slate-100 dark:bg-slate-950 select-none">
                
                {/* Background Map Container */}
                <div ref={mapContainer} className="absolute inset-0 w-full h-full z-0" />

                {/* Floating Control Sidebar */}
                <div className="absolute top-4 left-4 bottom-4 z-10 w-[420px] max-w-[calc(100vw-32px)] flex flex-col h-full pointer-events-none">
                    <Card className="flex-1 shadow-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col h-full overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl pointer-events-auto">

                        {/* Control Box Headers & Inputs */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-4 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Route className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
                                        {__('Route Planner')}
                                    </CardTitle>
                                    <CardDescription className="text-[10px]">
                                        {google_maps_active && isGoogleScriptLoaded
                                            ? __('Planning routes inside Venezuela using high-accuracy Google Maps Places.')
                                            : __('Search address suggestions and plan routes inside Venezuela.')}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {google_maps_active && isGoogleScriptLoaded && (
                                        <span className="text-[9px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Google</span>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => router.visit('/admin/integrations')}
                                        className="h-8 w-8 text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-200 rounded-full"
                                        title={__('Exit')}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Mode profiles */}
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                <button
                                    onClick={() => setProfile('driving')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${profile === 'driving'
                                        ? 'bg-white dark:bg-slate-950 text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    <Car className="h-3.5 w-3.5" />
                                    {__('Driving')}
                                </button>
                                <button
                                    onClick={() => setProfile('cycling')}
                                    className={`flex-1 flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${profile === 'cycling'
                                        ? 'bg-white dark:bg-slate-950 text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    <Bike className="h-3.5 w-3.5" />
                                    {__('Cycling')}
                                </button>
                                <button
                                    onClick={() => setProfile('walking')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${profile === 'walking'
                                        ? 'bg-white dark:bg-slate-950 text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    <Footprints className="h-3.5 w-3.5" />
                                    {__('Walking')}
                                </button>
                            </div>

                            {/* Search Fields & Inputs */}
                            <div className="space-y-3 relative">
                                {/* Origin Input */}
                                <div className="space-y-1 relative search-box-container">
                                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">{__('Start Point')}</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-indigo-500" />
                                        <Input
                                            type="text"
                                            placeholder={__('Search starting location in Venezuela...')}
                                            value={originQuery}
                                            onChange={(e) => {
                                                setOriginQuery(e.target.value);

                                                if (e.target.value === '') {
setOriginCoord(null);
}
                                            }}
                                            onFocus={() => setActiveInput('origin')}
                                            className="pl-9 pr-8 py-2 text-sm bg-white dark:bg-slate-950"
                                        />
                                        {loadingSuggestions && activeInput === 'origin' && (
                                            <Loader2 className="absolute right-3 top-3 h-3.5 w-3.5 animate-spin text-slate-400" />
                                        )}
                                    </div>
                                    {/* Dropdown Suggestions */}
                                    {activeInput === 'origin' && originSuggestions.length > 0 && (
                                        <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg">
                                            {originSuggestions.map((item) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => handleSelectSuggestion(item, 'origin')}
                                                    className="w-full text-left px-3.5 py-2.5 text-xs border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors last:border-b-0 text-slate-700 dark:text-slate-300 font-medium"
                                                >
                                                    {item.place_name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {activeInput === 'origin' && (
                                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse mt-1">
                                            💡 {__('Click anywhere on the map to pin starting location')}
                                        </p>
                                    )}
                                </div>

                                {/* Swap Buttons Overlay */}
                                <div className="absolute right-2 top-[34px] z-10 flex flex-col gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        type="button"
                                        onClick={swapLocations}
                                        className="h-7 w-7 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                                        title={__('Swap Locations')}
                                    >
                                        <ArrowUpDown className="h-3 w-3 text-slate-600 dark:text-slate-300" />
                                    </Button>
                                </div>

                                {/* Destination Input */}
                                <div className="space-y-1 relative search-box-container">
                                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">{__('End Point')}</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-rose-500" />
                                        <Input
                                            type="text"
                                            placeholder={__('Search destination in Venezuela...')}
                                            value={destQuery}
                                            onChange={(e) => {
                                                setDestQuery(e.target.value);

                                                if (e.target.value === '') {
setDestCoord(null);
}
                                            }}
                                            onFocus={() => setActiveInput('destination')}
                                            className="pl-9 pr-8 py-2 text-sm bg-white dark:bg-slate-950"
                                        />
                                        {loadingSuggestions && activeInput === 'destination' && (
                                            <Loader2 className="absolute right-3 top-3 h-3.5 w-3.5 animate-spin text-slate-400" />
                                        )}
                                    </div>
                                    {/* Dropdown Suggestions */}
                                    {activeInput === 'destination' && destSuggestions.length > 0 && (
                                        <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg">
                                            {destSuggestions.map((item) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => handleSelectSuggestion(item, 'destination')}
                                                    className="w-full text-left px-3.5 py-2.5 text-xs border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors last:border-b-0 text-slate-700 dark:text-slate-300 font-medium"
                                                >
                                                    {item.place_name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {activeInput === 'destination' && (
                                        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold animate-pulse mt-1">
                                            💡 {__('Click anywhere on the map to pin destination')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Option Quick Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={useCurrentLocation}
                                    className="flex-1 text-xs gap-1.5 h-8 border-slate-200 dark:border-slate-850"
                                >
                                    <LocateFixed className="h-3.5 w-3.5 text-indigo-600" />
                                    {__('Locate Me')}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={resetDirections}
                                    className="flex-1 text-xs gap-1.5 h-8 border-slate-200 dark:border-slate-850"
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                    {__('Reset')}
                                </Button>
                            </div>
                        </div>

                        {/* Directions Output / Step List */}
                        <div className="flex-1 overflow-y-auto p-4 select-none">
                            {loadingRoute ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 space-y-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                    <p className="text-xs font-semibold text-slate-500">{__('Calculating route...')}</p>
                                </div>
                            ) : originCoord && destCoord && routeDistance !== null && routeDuration !== null ? (
                                <div className="space-y-4">
                                    {/* Stats Card */}
                                    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950/50 p-3.5 rounded-lg flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">{__('Distance')}</p>
                                            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatDistance(routeDistance)}</p>
                                        </div>
                                        <div className="h-8 w-px bg-indigo-100 dark:bg-indigo-950" />
                                        <div className="space-y-0.5 text-right">
                                            <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">{__('Estimated Time')}</p>
                                            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatDuration(routeDuration)}</p>
                                        </div>
                                    </div>

                                    {/* Navigation Button */}
                                    <Button
                                        onClick={() => {
                                            router.visit(`/admin/integrations/map/navigation?origin_lng=${originCoord[0]}&origin_lat=${originCoord[1]}&dest_lng=${destCoord[0]}&dest_lat=${destCoord[1]}&profile=${profile}`);
                                        }}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold py-2.5 shadow-md flex items-center justify-center gap-2 rounded-lg transition-all"
                                    >
                                        <Navigation className="h-5 w-5 animate-pulse" />
                                        {__('Start Navigation')}
                                    </Button>

                                    {/* Steps Header */}
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Menu className="h-3.5 w-3.5" />
                                            {__('Directions steps')}
                                        </h3>

                                        {/* Step Rows */}
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-850 rounded-lg overflow-hidden bg-slate-50/25 dark:bg-slate-900/20">
                                            {routeSteps.map((step, idx) => (
                                                <div key={idx} className="p-3 text-xs flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                    <div className="shrink-0 flex items-center justify-center bg-white dark:bg-slate-800 h-7 w-7 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
                                                        {getStepIcon(step.maneuver.type)}
                                                    </div>
                                                    <div className="flex-1 space-y-0.5 self-center">
                                                        <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                                            {step.maneuver.instruction}
                                                        </p>
                                                        {step.distance > 0 && (
                                                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                                                {__('in')} {formatDistance(step.distance)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-24 text-center px-6">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-full mb-3 border border-slate-100 dark:border-slate-850">
                                        <Info className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{__('No Route Active')}</p>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mt-1 leading-normal">
                                        {__('Enter starting and destination addresses in Venezuela to calculate route, distance, and turn-by-turn directions.')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}