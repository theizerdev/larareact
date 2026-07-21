import { Head, router } from '@inertiajs/react';
import {
    Navigation,
    ArrowLeft,
    Play,
    Square,
    Compass,
    Volume2,
    VolumeX,
    Loader2,
    MapPin,
    AlertCircle,
    Gauge,
    Clock,
    Flag
} from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import React, { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/hooks/use-translate';
import 'mapbox-gl/dist/mapbox-gl.css';

interface PageProps {
    mapbox_api_key: string | null;
    mapbox_active: boolean;
    google_maps_api_key: string | null;
    google_maps_active: boolean;
}

interface GuidanceStep {
    instruction: string;
    distance: number;
    type: string;
}

export default function NavigationScreen({
    mapbox_api_key,
    mapbox_active,
    google_maps_api_key,
    google_maps_active
}: PageProps) {
    const { __ } = useTranslate();
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);

    // Coordinate inputs passed as URL parameters
    const [params, setParams] = useState<{
        originLng: number;
        originLat: number;
        destLng: number;
        destLat: number;
        profile: string;
    } | null>(null);

    // Navigation state variables
    const [loading, setLoading] = useState(true);
    const [routeCoords, setRouteCoords] = useState<number[][]>([]);
    const [steps, setSteps] = useState<GuidanceStep[]>([]);

    const [nextInstruction, setNextInstruction] = useState<string>('');
    const [nextStepType, setNextStepType] = useState<string>('');
    const [remainingDistance, setRemainingDistance] = useState<number | null>(null); // in meters
    const [remainingDuration, setRemainingDuration] = useState<number | null>(null); // in seconds

    // GPS & Simulation Tracking states
    const [simulating, setSimulating] = useState(false);
    const [activeGps, setActiveGps] = useState(false);
    const [speed, setSpeed] = useState(0); // km/h
    const [muted, setMuted] = useState(false);
    const [eta, setEta] = useState<string>('--:--');

    const vehicleMarker = useRef<mapboxgl.Marker | null>(null);
    const gpsWatchId = useRef<number | null>(null);
    const simIndexRef = useRef<number>(0);
    const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Parse parameters from query URL string
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const oLng = parseFloat(urlParams.get('origin_lng') || '0');
        const oLat = parseFloat(urlParams.get('origin_lat') || '0');
        const dLng = parseFloat(urlParams.get('dest_lng') || '0');
        const dLat = parseFloat(urlParams.get('dest_lat') || '0');
        const prof = urlParams.get('profile') || 'driving';

        if (oLng && oLat && dLng && dLat) {
            setParams({
                originLng: oLng,
                originLat: oLat,
                destLng: dLng,
                destLat: dLat,
                profile: prof
            });
        } else {
            Swal.fire({
                title: __('Missing Coordinates'),
                text: __('Could not find active start or destination parameters to start navigation.'),
                icon: 'error'
            }).then(() => {
                router.visit('/admin/integrations/map');
            });
        }
    }, []);

    // Calculate Bearing Formula
    const calculateBearing = (start: number[], end: number[]) => {
        const lat1 = start[1] * Math.PI / 180;
        const lat2 = end[1] * Math.PI / 180;
        const lon1 = start[0] * Math.PI / 180;
        const lon2 = end[0] * Math.PI / 180;

        const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

        const bearing = Math.atan2(y, x) * 180 / Math.PI;

        return (bearing + 360) % 360;
    };

    // Calculate Distance between points (Haversine in meters)
    const calculateDistance = (p1: number[], p2: number[]) => {
        const R = 6371000; // Earth radius in meters
        const dLat = (p2[1] - p1[1]) * Math.PI / 180;
        const dLon = (p2[0] - p1[0]) * Math.PI / 180;
        const lat1 = p1[1] * Math.PI / 180;
        const lat2 = p2[1] * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    const calculatePathDistance = (path: number[][]) => {
        let d = 0;

        for (let i = 0; i < path.length - 1; i++) {
            d += calculateDistance(path[i], path[i + 1]);
        }

        return d;
    };

    // Fetch Route Coordinates & Navigation steps
    useEffect(() => {
        if (!params || !mapbox_api_key) {
return;
}

        const loadRouteData = async () => {
            setLoading(true);

            // If Google Maps is active, use Google's Directions Service if available via Script
            if (google_maps_active && (window as any).google?.maps?.places) {
                try {
                    const google = (window as any).google;
                    let travelMode = google.maps.TravelMode.DRIVING;

                    if (params.profile === 'walking') {
travelMode = google.maps.TravelMode.WALKING;
} else if (params.profile === 'cycling') {
travelMode = google.maps.TravelMode.BICYCLING;
}

                    const directionsService = new google.maps.DirectionsService();
                    directionsService.route({
                        origin: new google.maps.LatLng(params.originLat, params.originLng),
                        destination: new google.maps.LatLng(params.destLat, params.destLng),
                        travelMode: travelMode
                    }, (response: any, status: any) => {
                        if (status === google.maps.DirectionsStatus.OK && response && response.routes[0]) {
                            const leg = response.routes[0].legs[0];

                            setRemainingDistance(leg.distance ? leg.distance.value : 0);
                            setRemainingDuration(leg.duration ? leg.duration.value : 0);

                            // Format guidance steps
                            const stepsList = (leg.steps || []).map((s: any) => ({
                                instruction: (s.instructions || '').replace(/<[^>]*>/g, ''),
                                distance: s.distance ? s.distance.value : 0,
                                type: s.maneuver || 'straight'
                            }));
                            setSteps(stepsList);

                            if (stepsList.length > 0) {
                                setNextInstruction(stepsList[0].instruction);
                                setNextStepType(stepsList[0].type);
                            }

                            // Decode polyline overview path coordinates
                            const decodedCoords = response.routes[0].overview_path.map((p: any) => [p.lng(), p.lat()]);
                            setRouteCoords(decodedCoords);
                            initializeMap(decodedCoords);
                        } else {
                            fetchMapboxRoute(); // Fallback to Mapbox on Google error
                        }
                    });

                    return;
                } catch (err) {
                    console.error('Google Directions navigation load error:', err);
                }
            }

            // Mapbox Directions fallback
            await fetchMapboxRoute();
        };

        const fetchMapboxRoute = async () => {
            try {
                const mapboxProfile = `mapbox/${params.profile}`;
                const url = `https://api.mapbox.com/directions/v5/${mapboxProfile}/${params.originLng},${params.originLat};${params.destLng},${params.destLat}?geometries=geojson&steps=true&language=es&access_token=${mapbox_api_key}`;
                const res = await fetch(url);
                const data = await res.json();

                if (!data.routes || data.routes.length === 0) {
                    Swal.fire({
                        title: __('Routing Error'),
                        text: __('Could not calculate routing paths.'),
                        icon: 'error'
                    });

                    return;
                }

                const route = data.routes[0];
                setRemainingDistance(route.distance);
                setRemainingDuration(route.duration);

                const coords = route.geometry.coordinates;
                setRouteCoords(coords);

                if (route.legs && route.legs[0]) {
                    const stepsList = (route.legs[0].steps || []).map((s: any) => ({
                        instruction: s.maneuver.instruction,
                        distance: s.distance,
                        type: s.maneuver.type
                    }));
                    setSteps(stepsList);

                    if (stepsList.length > 0) {
                        setNextInstruction(stepsList[0].instruction);
                        setNextStepType(stepsList[0].type);
                    }
                }

                initializeMap(coords);
            } catch (err) {
                console.error('Error fetching Mapbox route data:', err);
            }
        };

        loadRouteData();
    }, [params]);

    // Format ETA
    useEffect(() => {
        if (remainingDuration === null) {
return;
}

        const now = new Date();
        now.setSeconds(now.getSeconds() + remainingDuration);

        let hrs = now.getHours();
        const mins = now.getMinutes().toString().padStart(2, '0');
        const ampm = hrs >= 12 ? 'PM' : 'AM';
        hrs = hrs % 12;
        hrs = hrs ? hrs : 12; // 0 should be 12
        setEta(`${hrs}:${mins} ${ampm}`);
    }, [remainingDuration]);

    // Initialize Mapbox canvas
    const initializeMap = (coordinates: number[][]) => {
        if (!mapContainer.current || !mapbox_api_key) {
return;
}

        mapboxgl.accessToken = mapbox_api_key;

        // Use standard satellite streets layout for high-fidelity cockpit navigation feel
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11', // Premium dark navigation theme
            center: coordinates[0] as [number, number],
            zoom: 17,
            pitch: 60, // 3D navigation cockpit angle
            bearing: calculateBearing(coordinates[0], coordinates[1] || coordinates[0]),
            interactive: true
        });

        map.current.on('load', () => {
            // Draw visual route line overlay
            map.current?.addSource('route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: coordinates
                    }
                }
            });

            // Glowing Navigation path styling
            map.current?.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#10b981', // Glowing emerald line
                    'line-width': 7,
                    'line-opacity': 0.85
                }
            });

            // Add starting pulsing location marker (Outer container for positioning, Inner container for visual animation)
            const markerEl = document.createElement('div');

            const pulseEl = document.createElement('div');
            pulseEl.className = 'navigation-pulsing-marker';
            pulseEl.style.width = '24px';
            pulseEl.style.height = '24px';
            pulseEl.style.borderRadius = '50%';
            pulseEl.style.backgroundColor = '#3b82f6';
            pulseEl.style.border = '3px solid white';
            pulseEl.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.8)';
            pulseEl.style.animation = 'pulse 1.5s infinite';

            markerEl.appendChild(pulseEl);

            vehicleMarker.current = new mapboxgl.Marker({ element: markerEl })
                .setLngLat(coordinates[0] as [number, number])
                .addTo(map.current!);

            setLoading(false);
        });
    };

    // Clean interval on unmount
    useEffect(() => {
        return () => {
            if (simIntervalRef.current) {
clearInterval(simIntervalRef.current);
}

            if (gpsWatchId.current !== null) {
navigator.geolocation.clearWatch(gpsWatchId.current);
}
        };
    }, []);

    // Speech synthesis for voice cues instruction
    const speakInstruction = (text: string) => {
        if (muted) {
return;
}

        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);

            // Match browser system/application active language
            const htmlLang = document.documentElement.lang;
            const navLang = navigator.language;
            let speakLang = 'es-ES';

            if (htmlLang?.startsWith('en') || navLang?.startsWith('en')) {
                speakLang = 'en-US';
            }

            utterance.lang = speakLang;

            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error('Speech synthesis error:', e);
        }
    };

    // Trigger voice cue on guidance step instruction change
    useEffect(() => {
        if (nextInstruction) {
            speakInstruction(nextInstruction);
        }
    }, [nextInstruction, muted]);

    // Handle simulation animate logic
    const startSimulation = () => {
        if (simIntervalRef.current) {
clearInterval(simIntervalRef.current);
}

        if (gpsWatchId.current !== null) {
            navigator.geolocation.clearWatch(gpsWatchId.current);
            gpsWatchId.current = null;
            setActiveGps(false);
        }

        setSimulating(true);
        simIndexRef.current = 0;
        setSpeed(50); // simulated speed in km/h

        simIntervalRef.current = setInterval(() => {
            if (routeCoords.length === 0) {
return;
}

            const idx = simIndexRef.current;

            if (idx >= routeCoords.length - 1) {
                // Arrived at destination
                clearInterval(simIntervalRef.current!);
                simIntervalRef.current = null;
                setSimulating(false);
                setSpeed(0);
                speakInstruction(__('Has llegado a tu destino.'));
                Swal.fire({
                    title: __('Arrived!'),
                    text: __('You have reached your destination.'),
                    icon: 'success',
                    timer: 3000
                });

                return;
            }

            const currentPos = routeCoords[idx];
            const nextPos = routeCoords[idx + 1];

            // Heading bearing angle
            const bearing = calculateBearing(currentPos, nextPos);

            // Move vehicle marker
            if (vehicleMarker.current) {
                vehicleMarker.current.setLngLat(nextPos as [number, number]);
            }

            // Animate map view camera
            if (map.current) {
                map.current.easeTo({
                    center: nextPos as [number, number],
                    bearing: bearing,
                    pitch: 60,
                    zoom: 18,
                    duration: 400
                });
            }

            // Estimate metrics left
            const remainingCoords = routeCoords.slice(idx);
            const distLeft = calculatePathDistance(remainingCoords);
            const speedMps = 50 / 3.6; // 50 km/h in meters per second
            const durLeft = Math.round(distLeft / speedMps);

            setRemainingDistance(distLeft);
            setRemainingDuration(durLeft);

            // Find current turn directions instruction step depending on metrics left
            // Standard estimate based on progress along the path coordinates
            const progress = idx / routeCoords.length;
            const stepIdx = Math.min(
                Math.floor(progress * steps.length),
                steps.length - 1
            );

            if (steps[stepIdx]) {
                setNextInstruction(steps[stepIdx].instruction);
                setNextStepType(steps[stepIdx].type);
            }

            simIndexRef.current += 1;
        }, 500);
    };

    const stopSimulation = () => {
        if (simIntervalRef.current) {
            clearInterval(simIntervalRef.current);
            simIntervalRef.current = null;
        }

        setSimulating(false);
        setSpeed(0);
    };

    // Real-Time GPS Geolocation Watch Position
    const toggleGpsTracking = () => {
        if (activeGps) {
            if (gpsWatchId.current !== null) {
                navigator.geolocation.clearWatch(gpsWatchId.current);
                gpsWatchId.current = null;
            }

            setActiveGps(false);
            setSpeed(0);

            return;
        }

        if (simulating) {
            stopSimulation();
        }

        if (!navigator.geolocation) {
            Swal.fire({
                title: __('Unsupported'),
                text: __('Geolocation is not supported by your browser.'),
                icon: 'warning',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true
            });

            return;
        }

        setActiveGps(true);
        gpsWatchId.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { longitude, latitude, heading, speed: gpsSpeed } = pos.coords;
                const gpsCoords: [number, number] = [longitude, latitude];

                // Convert speed from m/s to km/h
                setSpeed(gpsSpeed ? Math.round(gpsSpeed * 3.6) : 0);

                if (vehicleMarker.current) {
                    vehicleMarker.current.setLngLat(gpsCoords);
                }

                if (map.current) {
                    map.current.easeTo({
                        center: gpsCoords,
                        pitch: 60,
                        bearing: heading !== null ? heading : map.current.getBearing(),
                        zoom: 17,
                        duration: 500
                    });
                }

                // Dynamically find closest coordinate indices to calculate remaining metrics
                if (routeCoords.length > 0) {
                    let minDistance = Infinity;
                    let closestIdx = 0;

                    routeCoords.forEach((coord, index) => {
                        const dist = calculateDistance(gpsCoords, coord);

                        if (dist < minDistance) {
                            minDistance = dist;
                            closestIdx = index;
                        }
                    });

                    // Distance from current GPS position to end of route path
                    const remainingPath = routeCoords.slice(closestIdx);
                    const distLeft = calculateDistance(gpsCoords, routeCoords[closestIdx]) + calculatePathDistance(remainingPath);
                    setRemainingDistance(distLeft);

                    // Simple ETA estimate
                    const currentSpeedKmh = gpsSpeed ? gpsSpeed * 3.6 : 30; // fallback to 30 km/h
                    const durLeft = Math.round(distLeft / (currentSpeedKmh / 3.6));
                    setRemainingDuration(durLeft);
                }
            },
            (error) => {
                console.error('GPS Watch error:', error);
                setActiveGps(false);
                Swal.fire({
                    title: __('GPS Offline'),
                    text: __('Unable to determine your GPS location. Ensure location permission is granted and HTTPS is active.'),
                    icon: 'warning',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 5000,
                    timerProgressBar: true
                });
            },
            {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 5000
            }
        );
    };

    // Helper formats
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

    const getDirectionIcon = (type: string) => {
        const lowerType = type.toLowerCase();

        if (lowerType.includes('arrive')) {
return <Flag className="h-6 w-6 text-rose-500 fill-rose-100" />;
}

        if (lowerType.includes('left')) {
return <Navigation className="h-6 w-6 text-emerald-400 -rotate-90" />;
}

        if (lowerType.includes('right')) {
return <Navigation className="h-6 w-6 text-emerald-400 rotate-90" />;
}

        return <Navigation className="h-6 w-6 text-emerald-400" />;
    };

    return (
        <>
            <Head title={__('Real-Time Navigation')} />
            <div className="w-screen h-screen relative bg-slate-950 text-slate-100 overflow-hidden select-none">

                {/* Back and Controls Header Overlay */}
                <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
                    <Button
                        onClick={() => router.visit('/admin/integrations/map')}
                        className="bg-slate-900/90 hover:bg-slate-800 text-slate-100 shadow-xl border border-slate-800 rounded-full h-11 px-4 pointer-events-auto flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {__('Exit')}
                    </Button>

                    <Button
                        onClick={() => setMuted(!muted)}
                        className="bg-slate-900/90 hover:bg-slate-800 text-slate-100 shadow-xl border border-slate-800 rounded-full h-11 w-11 p-0 pointer-events-auto flex items-center justify-center"
                    >
                        {muted ? <VolumeX className="h-5 w-5 text-rose-400 animate-pulse" /> : <Volume2 className="h-5 w-5 text-emerald-400" />}
                    </Button>
                </div>

                {/* Main Map Background Canvas */}
                <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

                {/* Next Step Turn guidance Banner HUD Overlay */}
                {nextInstruction && !loading && (
                    <div className="absolute top-20 left-4 right-4 z-40 bg-emerald-950/95 text-slate-100 border border-emerald-900/50 shadow-2xl rounded-xl p-4 flex gap-4 max-w-xl mx-auto backdrop-blur-md">
                        <div className="bg-emerald-900/80 p-3 rounded-lg flex items-center justify-center shrink-0 border border-emerald-800">
                            {getDirectionIcon(nextStepType)}
                        </div>
                        <div className="flex-1 space-y-1 self-center">
                            <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold font-sans">
                                {remainingDistance !== null && remainingDistance > 20 ? __('Next instruction') : __('Arriving soon')}
                            </p>
                            <p className="text-base font-bold leading-normal font-sans tracking-wide">
                                {nextInstruction}
                            </p>
                        </div>
                    </div>
                )}

                {/* Loading overlay panel */}
                {loading && (
                    <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                        <p className="text-sm font-semibold tracking-wider text-slate-400">{__('Initializing 3D navigation map...')}</p>
                    </div>
                )}

                {/* Bottom Stats & Navigation controls overlay */}
                {!loading && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4 space-y-4">

                        {/* Simulation / GPS active alerts banner */}
                        {(simulating || activeGps) && (
                            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-center flex items-center justify-center gap-2 text-xs shadow-lg max-w-xs mx-auto backdrop-blur-sm animate-bounce">
                                <span className={`h-2.5 w-2.5 rounded-full ${simulating ? 'bg-amber-500' : 'bg-blue-500'} animate-pulse`} />
                                <span className="font-semibold text-slate-300">
                                    {simulating ? __('Simulating driving navigation') : __('Real-time GPS positioning tracking')}
                                </span>
                            </div>
                        )}

                        {/* Navigation cockpit HUD panel */}
                        <div className="bg-slate-900/95 border border-slate-800 shadow-2xl rounded-2xl p-5 flex flex-col lg:flex-row items-stretch gap-5 backdrop-blur-md">

                            {/* Speedometer panel */}
                            <div className="bg-slate-800/40 border border-slate-850 p-3 px-5 rounded-xl flex items-center gap-3.5 shrink-0 justify-center">
                                <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                                    <Gauge className="h-6 w-6" />
                                </div>
                                <div className="text-left">
                                    <p className="text-2xl font-black text-white font-mono tracking-tight">{speed} <span className="text-xs font-semibold text-slate-400 font-sans">km/h</span></p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{__('Speed')}</p>
                                </div>
                            </div>

                            {/* Core time and ETA stats */}
                            <div className="flex-1 grid grid-cols-3 gap-3">
                                {/* Time Left Card */}
                                <div className="bg-slate-800/40 border border-slate-850 p-3 px-4 rounded-xl flex items-center gap-3 justify-center">
                                    <Clock className="h-5 w-5 text-indigo-400 shrink-0" />
                                    <div className="text-left min-w-0">
                                        <p className="text-lg font-bold text-white tracking-tight truncate">{remainingDuration !== null ? formatDuration(remainingDuration) : '--'}</p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{__('Time left')}</p>
                                    </div>
                                </div>

                                {/* Distance Left Card */}
                                <div className="bg-slate-800/40 border border-slate-850 p-3 px-4 rounded-xl flex items-center gap-3 justify-center">
                                    <Flag className="h-5 w-5 text-indigo-400 shrink-0" />
                                    <div className="text-left min-w-0">
                                        <p className="text-lg font-bold text-white tracking-tight truncate">{remainingDistance !== null ? formatDistance(remainingDistance) : '--'}</p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{__('Distance left')}</p>
                                    </div>
                                </div>

                                {/* ETA Card */}
                                <div className="bg-slate-800/40 border border-slate-850 p-3 px-4 rounded-xl flex items-center gap-3 justify-center">
                                    <Compass className="h-5 w-5 text-emerald-400 shrink-0" />
                                    <div className="text-left min-w-0">
                                        <p className="text-lg font-bold text-emerald-400 tracking-tight truncate">{eta}</p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{__('ETA')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Controller Buttons actions */}
                            <div className="flex gap-2 shrink-0 lg:self-center">
                                {simulating ? (
                                    <Button
                                        onClick={stopSimulation}
                                        className="flex-1 lg:flex-none bg-amber-600 hover:bg-amber-700 text-white font-bold h-11 px-4 gap-2 shadow-lg"
                                    >
                                        <Square className="h-4 w-4 fill-white" />
                                        {__('Stop')}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={startSimulation}
                                        className="flex-1 lg:flex-none bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold h-11 px-4 gap-2 shadow-lg"
                                    >
                                        <Play className="h-4 w-4 fill-amber-400 text-amber-400" />
                                        {__('Simulate')}
                                    </Button>
                                )}

                                <Button
                                    onClick={toggleGpsTracking}
                                    className={`flex-1 lg:flex-none font-bold h-11 px-4 gap-2 shadow-lg ${activeGps
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                                        }`}
                                >
                                    <Compass className={`h-4 w-4 ${activeGps ? 'animate-spin' : ''}`} />
                                    {activeGps ? __('GPS Off') : __('GPS Tracking')}
                                </Button>
                            </div>

                        </div>
                    </div>
                )}
            </div>
            {/* Pulsing visual CSS Keyframes */}
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                }
                .navigation-pulsing-marker {
                    animation: pulse 1.8s infinite;
                }
            `}</style>
        </>
    );
}
