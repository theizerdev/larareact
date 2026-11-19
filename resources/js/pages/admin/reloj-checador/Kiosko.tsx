import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { 
    Clock, 
    ShieldCheck, 
    UserCheck, 
    LogOut, 
    LogIn, 
    Utensils, 
    Coffee, 
    CheckCircle2, 
    AlertCircle, 
    Camera, 
    Delete, 
    ArrowLeft,
    QrCode,
    Scan,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    Sun,
    Moon,
    Laptop,
    Lock,
    X,
    Sparkles,
    SwitchCamera,
    AlertTriangle,
    MapPin,
    Check,
    ChevronRight,
    User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAppearance, initializeTheme } from '@/hooks/use-appearance';

interface Configuracion {
    requiere_foto_marcaje?: boolean;
    tolerancia_retardo_minutos?: number;
}

interface Props {
    configuracion?: Configuracion;
    zona_horaria?: string | null;
    sucursal_nombre?: string | null;
    empresa_razon_social?: string | null;
    empresa_nombre_comercial?: string | null;
    empresa_nombre?: string | null;
    empresa_logo?: string | null;
}

interface EmpleadoFound {
    id: number;
    nombre_completo: string;
    documento_identidad: string;
    foto_empleado?: string | null;
    departamento?: string;
    cargo?: string;
    turno?: string;
    ultimo_marcaje_tipo?: string | null;
}

/**
 * Emblema vectorial oficial de Smurfit Westrock
 */
export function SmurfitIcon({ className = "h-8 w-auto" }: { className?: string }) {
    return (
        <svg 
            viewBox="0 0 52 34" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className={className}
        >
            <rect 
                x="1.5" 
                y="1.5" 
                width="49" 
                height="31" 
                rx="15.5" 
                fill="#00182E" 
                stroke="#00B4D8" 
                strokeWidth="2.2" 
            />
            {/* 3 Ondas fluidas color cyan/turquesa */}
            <path 
                d="M11 11C15 11 17 9 21 9C25 9 27 11 31 11C35 11 37 9 41 9" 
                stroke="#00B4D8" 
                strokeWidth="2.4" 
                strokeLinecap="round" 
            />
            <path 
                d="M11 17C15 17 17 15 21 15C25 15 27 17 31 17C35 17 37 15 41 15" 
                stroke="#38BDF8" 
                strokeWidth="2.4" 
                strokeLinecap="round" 
            />
            <path 
                d="M11 23C15 23 17 21 21 21C25 21 27 23 31 23C35 23 37 21 41 21" 
                stroke="#0284C7" 
                strokeWidth="2.4" 
                strokeLinecap="round" 
            />
        </svg>
    );
}

/**
 * Componente unificado para desplegar la Razón Social y el Logo de la Empresa
 * tanto en el Navbar como en el Footer.
 */
export function CompanyBrand({
    logoUrl,
    razonSocial,
    variant = "navbar"
}: {
    logoUrl?: string | null;
    razonSocial: string;
    variant?: "navbar" | "footer";
}) {
    if (variant === "footer") {
        return (
            <div className="flex items-center gap-2">
                {logoUrl ? (
                    <img 
                        src={logoUrl} 
                        alt={razonSocial} 
                        className="h-4 sm:h-5 max-w-[80px] object-contain shrink-0" 
                    />
                ) : (
                    <SmurfitIcon className="h-4 w-auto shrink-0 drop-shadow-sm" />
                )}
                <span className="font-bold text-xs text-slate-700 dark:text-slate-200 tracking-tight">
                    {razonSocial}
                </span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            {logoUrl ? (
                <img 
                    src={logoUrl} 
                    alt={razonSocial} 
                    className="h-8 sm:h-9 max-h-9 max-w-[140px] object-contain shrink-0" 
                />
            ) : (
                <SmurfitIcon className="h-8 sm:h-8.5 w-auto shrink-0 drop-shadow-sm" />
            )}
            <div className="flex flex-col justify-center leading-tight text-left">
                <span className="font-black text-sm sm:text-base text-white tracking-tight">
                    {razonSocial}
                </span>
            </div>
        </div>
    );
}

export default function RelojChecadorKiosko({ 
    configuracion, 
    zona_horaria, 
    sucursal_nombre,
    empresa_razon_social,
    empresa_nombre_comercial,
    empresa_nombre,
    empresa_logo 
}: Props) {
    const { auth } = usePage().props as any;

    // Razón Social dinámica y Logo de la empresa
    const empresaRazonSocial = empresa_razon_social 
        || auth?.user?.empresa?.razon_social 
        || empresa_nombre 
        || 'Smurfit Westrock';

    const resolvedLogoUrl = empresa_logo 
        || (auth?.user?.empresa?.logo_mini ? `/storage/${auth.user.empresa.logo_mini}` : null)
        || (auth?.user?.empresa?.logo ? `/storage/${auth.user.empresa.logo}` : null);

    // Manejo de Temas (Claro / Oscuro / Equipo)
    const { appearance, resolvedAppearance, updateAppearance } = useAppearance();

    useEffect(() => {
        initializeTheme();
    }, []);

    // Vista Activa: 'menu' (Pantalla Principal Bienvenido) o 'checador' (Registro de Asistencia)
    const [currentView, setCurrentView] = useState<'menu' | 'checador'>('menu');

    // Reloj digital en tiempo real sincronizado a la zona horaria de la sucursal/empresa
    const tz = zona_horaria || 'America/Mexico_City';
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Estado del Sonido / Audio
    const [isAudioMuted, setIsAudioMuted] = useState(false);

    // Estado de Pantalla Completa (Fullscreen)
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
                setIsFullscreen(false);
            }
        }
    };

    // Alternar tema entre light, dark, system
    const cycleTheme = () => {
        if (appearance === 'light') {
            updateAppearance('dark');
        } else if (appearance === 'dark') {
            updateAppearance('system');
        } else {
            updateAppearance('light');
        }
    };

    // Estado del Numpad / Entrada
    const [documentInput, setDocumentInput] = useState('');
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [empleado, setEmpleado] = useState<EmpleadoFound | null>(null);
    const [sugerenciaMarcaje, setSugerenciaMarcaje] = useState<string>('entrada');
    const [tipoMarcajeSeleccionado, setTipoMarcajeSeleccionado] = useState<string>('entrada');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Geoubicación del Kiosko / Dispositivo
    const [gpsPosition, setGpsPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [gpsStatus, setGpsStatus] = useState<'obteniendo' | 'activo' | 'denegado' | 'no_soportado'>('obteniendo');

    useEffect(() => {
        if (!navigator.geolocation) {
            setGpsStatus('no_soportado');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGpsPosition({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
                setGpsStatus('activo');
            },
            (err) => {
                console.warn('Geolocalización no disponible:', err);
                setGpsStatus('denegado');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, []);

    // Cámara de evidencia de marcaje
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [cameraActive, setCameraActive] = useState(false);

    // Estado y refs para Escáner QR de Gafete por Cámara
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const qrVideoRef = useRef<HTMLVideoElement | null>(null);
    const qrStreamRef = useRef<MediaStream | null>(null);

    // Modales para Descansos e Incidentes
    const [isDescansoModalOpen, setIsDescansoModalOpen] = useState(false);
    const [selectedMinutosDescanso, setSelectedMinutosDescanso] = useState<number>(15);
    const [isIncidenteModalOpen, setIsIncidenteModalOpen] = useState(false);
    const [incidenteCausaInput, setIncidenteCausaInput] = useState<string>('');

    const inputRef = useRef<HTMLInputElement | null>(null);

    // Reproducir tono de confirmación tipo escáner pos
    const playBeepSound = () => {
        if (isAudioMuted) return;
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
        } catch (e) {
            // Audio no soportado o silenciado
        }
    };

    useEffect(() => {
        if (configuracion?.requiere_foto_marcaje && currentView === 'checador') {
            navigator.mediaDevices?.getUserMedia({ video: true })
                .then((stream) => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        setCameraActive(true);
                    }
                })
                .catch(() => setCameraActive(false));
        }
    }, [configuracion, currentView]);

    // Listener para Lectores Físicos (Pistolas USB/Bluetooth) con tecla Enter
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (currentView === 'checador' && e.key === 'Enter' && !qrModalOpen) {
                if (documentInput.trim()) {
                    handleSearch();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [documentInput, qrModalOpen, currentView]);

    // Cargar jsQR dinámicamente si el navegador no tiene BarcodeDetector nativo
    useEffect(() => {
        if (typeof window !== 'undefined' && !('BarcodeDetector' in window) && !(window as any).jsQR) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
            script.async = true;
            document.head.appendChild(script);
        }
    }, []);

    // Procesar texto escaneado por cámara
    const handleProcessScannedCode = (scannedText: string) => {
        let clean = scannedText.trim();
        if (clean.includes('/pase-digital/')) {
            const parts = clean.split('/pase-digital/');
            clean = parts[parts.length - 1];
        }
        stopQrCamera();
        setDocumentInput(clean);
        performSearch(clean);
    };

    const startQrCamera = (mode: 'environment' | 'user' = facingMode) => {
        setFacingMode(mode);
        setQrModalOpen(true);
    };

    const toggleCameraFacing = () => {
        const nextMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(nextMode);
    };

    const stopQrCamera = () => {
        setQrModalOpen(false);
    };

    // Efecto de cámara en vivo para lectura QR
    useEffect(() => {
        let animationFrameId: number;
        let active = true;

        if (qrModalOpen) {
            setErrorMessage(null);
            navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
            })
                .then((stream) => {
                    if (!active) {
                        stream.getTracks().forEach(t => t.stop());
                        return;
                    }
                    qrStreamRef.current = stream;
                    if (qrVideoRef.current) {
                        qrVideoRef.current.srcObject = stream;
                        qrVideoRef.current.setAttribute('playsinline', 'true');
                        qrVideoRef.current.play().catch(() => {});
                    }

                    const hasBarcodeDetector = 'BarcodeDetector' in window;
                    let detector: any = null;
                    if (hasBarcodeDetector) {
                        try {
                            detector = new (window as any).BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39', 'data_matrix', 'ean_13'] });
                        } catch (e) {
                            detector = null;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });

                    const scanFrame = async () => {
                        if (!active || !qrVideoRef.current) return;
                        const video = qrVideoRef.current;

                        if (video.readyState === video.HAVE_ENOUGH_DATA) {
                            if (detector) {
                                try {
                                    const barcodes = await detector.detect(video);
                                    if (barcodes && barcodes.length > 0) {
                                        const detectedRaw = barcodes[0].rawValue;
                                        if (detectedRaw) {
                                            playBeepSound();
                                            handleProcessScannedCode(detectedRaw);
                                            return;
                                        }
                                    }
                                } catch (err) {}
                            }

                            const jsQR = (window as any).jsQR;
                            if (jsQR && video.videoWidth > 0 && video.videoHeight > 0) {
                                canvas.width = video.videoWidth;
                                canvas.height = video.videoHeight;
                                if (ctx) {
                                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                                        inversionAttempts: 'dontInvert',
                                    });
                                    if (code && code.data) {
                                        playBeepSound();
                                        handleProcessScannedCode(code.data);
                                        return;
                                    }
                                }
                            }
                        }

                        if (active) {
                            animationFrameId = requestAnimationFrame(scanFrame);
                        }
                    };

                    animationFrameId = requestAnimationFrame(scanFrame);
                })
                .catch(() => {
                    setErrorMessage('No se pudo acceder a la cámara para escanear el gafete QR.');
                    setQrModalOpen(false);
                });
        }

        return () => {
            active = false;
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (qrStreamRef.current) {
                qrStreamRef.current.getTracks().forEach(t => t.stop());
                qrStreamRef.current = null;
            }
        };
    }, [qrModalOpen, facingMode]);

    const handleNumpadPress = (val: string) => {
        if (documentInput.length < 20) {
            setDocumentInput((prev) => prev + val);
        }
    };

    const handleNumpadDelete = () => {
        setDocumentInput((prev) => prev.slice(0, -1));
    };

    const handleNumpadClear = () => {
        setDocumentInput('');
        setEmpleado(null);
        setErrorMessage(null);
        if (inputRef.current) inputRef.current.focus();
    };

    const getCsrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') || '' : '';
    };

    // Función Central de Búsqueda
    const performSearch = async (queryValue: string) => {
        if (!queryValue.trim()) return;

        setLoadingSearch(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const response = await fetch('/admin/api/reloj-checador/buscar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ query: queryValue.trim() }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                playBeepSound();
                setEmpleado(data.empleado);
                setSugerenciaMarcaje(data.sugerencia_marcaje);
                setTipoMarcajeSeleccionado(data.sugerencia_marcaje);
            } else {
                setEmpleado(null);
                setErrorMessage(data.message || 'No se encontró ningún empleado activo con ese número o QR.');
            }
        } catch (err: any) {
            setEmpleado(null);
            setErrorMessage('No se encontró ningún empleado activo con ese número o QR.');
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        performSearch(documentInput);
    };

    // Registrar Marcaje
    const handleRegisterMarcaje = async (tipo: string, extraPayload: any = {}) => {
        if (!empleado) return;

        setLoadingSearch(true);
        setErrorMessage(null);

        let fotoBase64: string | null = null;
        if (configuracion?.requiere_foto_marcaje && videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth || 640;
            canvas.height = videoRef.current.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                fotoBase64 = canvas.toDataURL('image/jpeg');
            }
        }

        try {
            const response = await fetch('/admin/api/reloj-checador/registrar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    empleado_id: empleado.id,
                    tipo_marcaje: tipo,
                    fotografia_base64: fotoBase64,
                    latitud: gpsPosition?.lat ?? null,
                    longitud: gpsPosition?.lng ?? null,
                    ...extraPayload,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                playBeepSound();
                setSuccessMessage(`¡Marcaje de ${tipo.replace('_', ' ').toUpperCase()} registrado exitosamente para ${data.empleado_nombre}!`);
                setIsDescansoModalOpen(false);
                setIsIncidenteModalOpen(false);
                setTimeout(() => {
                    handleNumpadClear();
                    setSuccessMessage(null);
                }, 4000);
            } else {
                setErrorMessage(data.message || 'Error al registrar el marcaje.');
            }
        } catch (err: any) {
            setErrorMessage('Error al registrar el marcaje.');
        } finally {
            setLoadingSearch(false);
        }
    };

    // Formatear hora estilo imagen: "10:41:09 a.m."
    const formatTimeDetailed = (date: Date) => {
        return date.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: tz,
        }).toLowerCase();
    };

    // Formatear hora corta: "10:41 a.m."
    const formatTimeShort = (date: Date) => {
        return date.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: tz,
        }).toLowerCase();
    };

    // Formatear fecha capitalizada: "Jueves, 19 De Noviembre De 2026"
    const formatDateSpanish = (date: Date) => {
        try {
            const weekday = date.toLocaleDateString('es-MX', { weekday: 'long', timeZone: tz });
            const day = date.toLocaleDateString('es-MX', { day: 'numeric', timeZone: tz });
            const month = date.toLocaleDateString('es-MX', { month: 'long', timeZone: tz });
            const year = date.toLocaleDateString('es-MX', { year: 'numeric', timeZone: tz });

            const cap = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
            return `${cap(weekday)}, ${day} De ${cap(month)} De ${year}`;
        } catch (e) {
            return date.toLocaleDateString('es-MX');
        }
    };

    const companyDisplayName = empresa_nombre || 'Smurfit Westrock México';

    return (
        <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans select-none transition-colors duration-200">
            <Head title="Kiosko Reloj Checador - Smurfit Westrock" />

            {/* BARRA SUPERIOR (Idéntica en ambas vistas, soporte tema y zona horaria de sucursal) */}
            <header className="bg-[#070b14] border-b border-slate-800 text-white px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md shrink-0">
                {/* Lado Izquierdo: Logo Empresa + Razón Social + Título Kiosko Checador */}
                <div className="flex items-center gap-4 sm:gap-6">
                    <CompanyBrand logoUrl={resolvedLogoUrl} razonSocial={empresaRazonSocial} variant="navbar" />

                    <div className="hidden sm:block h-7 w-px bg-slate-800" />

                    <div>
                        <h1 className="text-base sm:text-lg font-black text-white tracking-wide leading-tight">
                            Kiosko Checador
                        </h1>
                        <p className="text-[11px] text-slate-400 font-medium leading-none">
                            Control de Asistencia por Numpad, QR Gafete & Pistola Lector
                        </p>
                    </div>
                </div>

                {/* Lado Derecho: Reloj Digital en Tiempo Real + Zona Horaria Sucursal + Botones de Control */}
                <div className="flex items-center gap-3 sm:gap-5">
                    {/* Hora y Zona Horaria Sucursal */}
                    <div className="text-right hidden sm:block">
                        <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-wider leading-tight">
                            {formatTimeDetailed(currentTime)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                            {formatDateSpanish(currentTime)} • <span className="text-slate-300 font-semibold">{tz}</span>
                        </div>
                    </div>

                    {/* Botón de Sonido (Mute / Unmute) */}
                    <button
                        type="button"
                        onClick={() => setIsAudioMuted(!isAudioMuted)}
                        title={isAudioMuted ? 'Activar Sonido' : 'Silenciar Sonido'}
                        className="p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors active:scale-95 shadow-sm"
                    >
                        {isAudioMuted ? (
                            <VolumeX className="w-4 h-4 text-rose-400" />
                        ) : (
                            <Volume2 className="w-4 h-4 text-emerald-400" />
                        )}
                    </button>

                    {/* Botón de Pantalla Completa (Fullscreen) */}
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        title={isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
                        className="p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors active:scale-95 shadow-sm hidden xs:flex"
                    >
                        {isFullscreen ? (
                            <Minimize className="w-4 h-4 text-slate-300" />
                        ) : (
                            <Maximize className="w-4 h-4 text-slate-300" />
                        )}
                    </button>

                    {/* Selector Rápido de Tema (Claro / Oscuro / Equipo) */}
                    <button
                        type="button"
                        onClick={cycleTheme}
                        title={`Tema actual: ${appearance === 'light' ? 'Claro' : appearance === 'dark' ? 'Oscuro' : 'Equipo'} (Clic para cambiar)`}
                        className="p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors active:scale-95 shadow-sm flex items-center gap-1.5"
                    >
                        {appearance === 'light' && <Sun className="w-4 h-4 text-amber-400" />}
                        {appearance === 'dark' && <Moon className="w-4 h-4 text-indigo-400" />}
                        {appearance === 'system' && <Laptop className="w-4 h-4 text-emerald-400" />}
                        <span className="text-[10px] font-semibold text-slate-400 hidden md:inline uppercase">
                            {appearance === 'light' ? 'Claro' : appearance === 'dark' ? 'Oscuro' : 'Equipo'}
                        </span>
                    </button>

                    {/* Botón Panel Admin */}
                    <Link href="/dashboard">
                        <Button 
                            variant="outline" 
                            className="h-10 px-3.5 border-amber-500/50 bg-slate-900/90 text-amber-400 hover:bg-slate-800 hover:text-amber-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Panel Admin</span>
                        </Button>
                    </Link>
                </div>
            </header>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 flex flex-col justify-center px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto">
                {/* VISTA 1: MENÚ PRINCIPAL (IMAGEN 1 - SOLO CON REGISTRO DE MARCAJES) */}
                {currentView === 'menu' && (
                    <div className="flex flex-col items-center justify-center my-auto py-6 space-y-8 animate-in fade-in zoom-in-95 duration-200">
                        {/* Píldora Superior Decorativa */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-medium shadow-sm">
                            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                            <span>Kiosko Reloj Checador • {empresaRazonSocial}</span>
                        </div>

                        {/* Encabezado Principal */}
                        <div className="text-center space-y-2 max-w-2xl mx-auto">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                                Bienvenido al Control de Asistencia
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-normal">
                                Seleccione la operación que desea realizar tocando una de las siguientes opciones:
                            </p>
                        </div>

                        {/* Tarjeta Única: REGISTRO DE MARCAJES (Conforme a la instrucción del usuario) */}
                        <div className="w-full max-w-md mx-auto">
                            <div 
                                onClick={() => {
                                    setCurrentView('checador');
                                    setTimeout(() => inputRef.current?.focus(), 150);
                                }}
                                className="group relative bg-white dark:bg-slate-900 border-2 border-emerald-400/90 dark:border-emerald-500/80 rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl hover:border-emerald-500 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden active:scale-[0.99]"
                            >
                                <div className="space-y-6">
                                    {/* Icono + Badge Superior */}
                                    <div className="flex items-center justify-between">
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                                            <Clock className="w-8 h-8" />
                                        </div>

                                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                            Asistencia Diaria
                                        </span>
                                    </div>

                                    {/* Título y Descripción */}
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                            Registro de Marcajes
                                        </h3>
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                                            Cheque su entrada, salida de turno, inicio de comida, descansos programados y horas extras de jornada.
                                        </p>
                                    </div>

                                    {/* Viñetas con Check verde */}
                                    <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                            </div>
                                            <span>Entrada y Salida de Turno</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                            </div>
                                            <span>Comedor (Alimentos) & Descansos</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                            </div>
                                            <span>Numpad Táctil, Lector USB y QR</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Botón / Enlace Inferior de Acción */}
                                <div className="mt-8 pt-4">
                                    <div className="w-full py-3.5 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs sm:text-sm flex items-center justify-between transition-colors border border-emerald-200/60 dark:border-emerald-800/60">
                                        <span className="tracking-wider">INGRESAR A CHECADOR</span>
                                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 dark:bg-emerald-400/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                            <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* VISTA 2: REGISTRO DE ASISTENCIA (IMAGEN 2 - DISEÑO COMPLETO CON SUB-BARRA Y 2 COLUMNAS) */}
                {currentView === 'checador' && (
                    <div className="space-y-6 my-auto py-2 animate-in fade-in zoom-in-95 duration-200">
                        {/* SUB-BARRA: Botón "Menú Principal" + Título "Registro de Asistencia" */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
                            <div className="flex items-center gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        handleNumpadClear();
                                        setCurrentView('menu');
                                    }}
                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Menú Principal</span>
                                </Button>

                                <div className="flex items-center gap-3">
                                    {/* Icono de Ondas Smurfit en caja redondeada */}
                                    <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center p-1.5 shadow-sm shrink-0">
                                        <svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                                            <rect x="1" y="1" width="46" height="30" rx="15" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-cyan-500" />
                                            <path d="M10 11C14 11 16 9 20 9C24 9 26 11 30 11C34 11 36 9 38 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-cyan-500" />
                                            <path d="M10 16C14 16 16 14 20 14C24 14 26 16 30 16C34 16 36 14 38 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-cyan-400" />
                                            <path d="M10 21C14 21 16 19 20 19C24 19 26 21 30 21C34 21 36 19 38 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-cyan-600" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                            Registro de Asistencia
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Ingrese su número de empleado, escanee su gafete QR o use la pistola lectora.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CUERPO: 2 COLUMNAS (IZQUIERDA: NUMPAD Y ENTRADA / DERECHA: CONFIRMACIÓN Y MARCAJE) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* COLUMNA IZQUIERDA: INPUT, CÁMARA QR Y NUMPAD */}
                            <div className="lg:col-span-6 space-y-4">
                                <Card className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md rounded-3xl overflow-hidden">
                                    <CardContent className="p-6 space-y-5">
                                        {/* Cabecera del Input */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">
                                                        Identificación del colaborador
                                                    </h4>
                                                    <p className="text-[11px] text-slate-400 leading-tight">
                                                        N° de empleado, documento o QR gafete
                                                    </p>
                                                </div>
                                            </div>

                                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                                                <Scan className="w-3.5 h-3.5" /> Lector USB listo
                                            </span>
                                        </div>

                                        {/* Campo de Entrada de Número / Código */}
                                        <div className="relative">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={documentInput}
                                                onChange={(e) => setDocumentInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                                                placeholder="Ingrese número o escanee código de barras/QR..."
                                                className="w-full text-center text-xl sm:text-2xl font-mono font-bold tracking-widest bg-white dark:bg-slate-950 border-2 border-indigo-400/80 dark:border-indigo-600 rounded-2xl py-3.5 px-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-950/60 transition-all"
                                                autoFocus
                                            />
                                        </div>

                                        {/* Botón de Escáner QR por Cámara */}
                                        <Button
                                            onClick={() => startQrCamera()}
                                            type="button"
                                            variant="outline"
                                            className="w-full h-11 border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 hover:bg-indigo-100/70 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                                            <span>ESCANEAR GAFETE QR (CÁMARA)</span>
                                        </Button>

                                        {/* Teclado Táctil (Numpad) */}
                                        <div className="grid grid-cols-3 gap-2.5 max-w-sm mx-auto pt-1">
                                            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                                                <button
                                                    key={num}
                                                    type="button"
                                                    onClick={() => handleNumpadPress(num)}
                                                    className="h-12 sm:h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xl sm:text-2xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 shadow-sm transition-all flex items-center justify-center"
                                                >
                                                    {num}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={handleNumpadClear}
                                                className="h-12 sm:h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/50 active:scale-95 transition-all flex items-center justify-center tracking-wider"
                                            >
                                                LIMPIAR
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleNumpadPress('0')}
                                                className="h-12 sm:h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xl sm:text-2xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 shadow-sm transition-all flex items-center justify-center"
                                            >
                                                0
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleNumpadDelete}
                                                className="h-12 sm:h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/50 active:scale-95 transition-all flex items-center justify-center"
                                            >
                                                <Delete className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Botón Verificar Empleado */}
                                        <Button
                                            onClick={() => handleSearch()}
                                            disabled={!documentInput.trim() || loadingSearch}
                                            className={`w-full h-12 rounded-xl text-sm font-bold tracking-wide transition-all ${
                                                !documentInput.trim() || loadingSearch
                                                    ? 'bg-indigo-300 dark:bg-indigo-950/60 text-white cursor-not-allowed shadow-none'
                                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 active:scale-[0.99] cursor-pointer'
                                            }`}
                                        >
                                            {loadingSearch ? 'VERIFICANDO EMPLEADO...' : 'VERIFICAR EMPLEADO'}
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Mensaje de Error si no se encuentra */}
                                {errorMessage && (
                                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs sm:text-sm flex items-center gap-3 animate-shake shadow-sm">
                                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}
                            </div>

                            {/* COLUMNA DERECHA: ESTADO EN ESPERA O PERFIL VERIFICADO + BOTONES DE ACCIÓN */}
                            <div className="lg:col-span-6 space-y-4">
                                {successMessage ? (
                                    <Card className="bg-emerald-50 dark:bg-emerald-950/90 border-2 border-emerald-500 p-8 rounded-3xl text-center space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
                                        <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto animate-bounce" />
                                        <h2 className="text-2xl font-black text-emerald-900 dark:text-white">
                                            {successMessage}
                                        </h2>
                                        <p className="text-emerald-700 dark:text-emerald-200 text-xs sm:text-sm">
                                            El sistema ha registrado el evento de asistencia y notificado al empleado.
                                        </p>
                                    </Card>
                                ) : empleado ? (
                                    <Card className="bg-white dark:bg-slate-900 border-2 border-emerald-500/50 shadow-xl rounded-3xl p-6 space-y-6">
                                        {/* Perfil del Empleado */}
                                        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                            <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center text-slate-600 dark:text-slate-400 font-black text-xl shadow-inner">
                                                {empleado.foto_empleado ? (
                                                    <img src={empleado.foto_empleado} alt={empleado.nombre_completo} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{empleado.nombre_completo.substring(0, 2).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 inline-block">
                                                    Empleado Verificado
                                                </span>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                                                    {empleado.nombre_completo}
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {empleado.cargo || 'Sin cargo'} • {empleado.departamento || 'Sin departamento'}
                                                </p>
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                                    Turno: {empleado.turno}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Botones de Registro de Marcaje */}
                                        <div className="space-y-3">
                                            <Label className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider block">
                                                Seleccione la acción a registrar:
                                            </Label>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {(() => {
                                                    const esDescansoActivo = sugerenciaMarcaje === 'descanso_fin' || empleado?.ultimo_marcaje_tipo === 'descanso_inicio';
                                                    const esIncidenteActivo = sugerenciaMarcaje === 'incidente_fin' || empleado?.ultimo_marcaje_tipo === 'incidente_inicio';

                                                    return (
                                                        <>
                                                            <Button
                                                                onClick={() => handleRegisterMarcaje('entrada', { tipo_entrada: 'normal' })}
                                                                disabled={loadingSearch}
                                                                className={`h-20 text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all ${
                                                                    sugerenciaMarcaje === 'entrada'
                                                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-emerald-500/30 shadow-lg'
                                                                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                                                                }`}
                                                            >
                                                                <LogIn className="w-5 h-5 text-emerald-500" />
                                                                <span>INICIO JORNADA</span>
                                                            </Button>

                                                            <Button
                                                                onClick={() => handleRegisterMarcaje('entrada_extraordinaria', { tipo_entrada: 'extraordinaria_doble' })}
                                                                disabled={loadingSearch}
                                                                className="h-20 text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all"
                                                            >
                                                                <Sparkles className="w-5 h-5 text-purple-200" />
                                                                <span>TIEMPO EXTRA</span>
                                                            </Button>

                                                            <Button
                                                                onClick={() => {
                                                                    if (esDescansoActivo) {
                                                                        handleRegisterMarcaje('descanso_fin');
                                                                    } else {
                                                                        setIsDescansoModalOpen(true);
                                                                    }
                                                                }}
                                                                disabled={loadingSearch}
                                                                className={`h-20 text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all ${
                                                                    esDescansoActivo
                                                                        ? 'bg-teal-600 hover:bg-teal-500 text-white ring-4 ring-teal-500/30 shadow-lg animate-pulse'
                                                                        : 'bg-teal-700 hover:bg-teal-600 text-white shadow-md'
                                                                }`}
                                                            >
                                                                <Coffee className="w-5 h-5 text-teal-200" />
                                                                <span>{esDescansoActivo ? 'FIN DESCANSO' : 'DESCANSO'}</span>
                                                            </Button>

                                                            <Button
                                                                onClick={() => handleRegisterMarcaje('salida_comida')}
                                                                disabled={loadingSearch}
                                                                className={`h-20 text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all ${
                                                                    sugerenciaMarcaje === 'salida_comida'
                                                                        ? 'bg-amber-600 hover:bg-amber-500 text-white ring-4 ring-amber-500/30 shadow-lg'
                                                                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                                                                }`}
                                                            >
                                                                <Utensils className="w-5 h-5 text-amber-500" />
                                                                <span>INICIO COMIDA</span>
                                                            </Button>

                                                            <Button
                                                                onClick={() => handleRegisterMarcaje('entrada_comida')}
                                                                disabled={loadingSearch}
                                                                className={`h-20 text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all ${
                                                                    sugerenciaMarcaje === 'entrada_comida'
                                                                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white ring-4 ring-indigo-500/30 shadow-lg'
                                                                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                                                                }`}
                                                            >
                                                                <LogIn className="w-5 h-5 text-indigo-500" />
                                                                <span>FIN COMIDA</span>
                                                            </Button>

                                                            <Button
                                                                onClick={() => {
                                                                    if (esIncidenteActivo) {
                                                                        handleRegisterMarcaje('incidente_fin');
                                                                    } else {
                                                                        setIsIncidenteModalOpen(true);
                                                                    }
                                                                }}
                                                                disabled={loadingSearch}
                                                                className={`h-20 text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all ${
                                                                    esIncidenteActivo
                                                                        ? 'bg-orange-600 hover:bg-orange-500 text-white ring-4 ring-orange-500/30 shadow-lg animate-pulse'
                                                                        : 'bg-orange-700 hover:bg-orange-600 text-white shadow-md'
                                                                }`}
                                                            >
                                                                <AlertTriangle className="w-5 h-5 text-orange-200" />
                                                                <span>{esIncidenteActivo ? 'FIN INCIDENTE' : 'INCIDENTE'}</span>
                                                            </Button>

                                                            <Button
                                                                onClick={() => handleRegisterMarcaje('salida')}
                                                                disabled={loadingSearch}
                                                                className={`col-span-2 sm:col-span-3 h-14 text-sm font-bold flex items-center justify-center gap-2 rounded-2xl transition-all ${
                                                                    sugerenciaMarcaje === 'salida'
                                                                        ? 'bg-rose-600 hover:bg-rose-500 text-white ring-4 ring-rose-500/30 shadow-lg'
                                                                        : 'bg-rose-700 hover:bg-rose-600 text-white shadow-md'
                                                                }`}
                                                            >
                                                                <LogOut className="w-5 h-5 text-white" />
                                                                <span>SALIDA JORNADA</span>
                                                            </Button>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </Card>
                                ) : (
                                    /* Estado en Espera (Idéntico a Imagen 2) */
                                    <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-8 sm:p-14 text-center flex flex-col items-center justify-center min-h-[380px] bg-white/70 dark:bg-slate-900/40 shadow-sm">
                                        <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mb-4">
                                            <UserCheck className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                                            En espera de ingreso de documento o lectura de QR...
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
                                            Al ingresar el número de empleado o acercar el QR del gafete a la cámara/lector, aparecerá el perfil con las opciones de marcaje.
                                        </p>
                                    </div>
                                )}

                                {/* Vista de Cámara de Evidencia si está configurada */}
                                {configuracion?.requiere_foto_marcaje && (
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                                            <Camera className="w-4 h-4 text-emerald-500" />
                                            <span className="font-medium">Cámara de Evidencia Activa</span>
                                        </div>
                                        <div className="w-16 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* PIE DE PÁGINA (ADAPTATIVO SEGÚN LA VISTA Y TEMA) */}
            <footer className="border-t border-slate-200/90 dark:border-slate-800/80 px-4 sm:px-8 py-3 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                {currentView === 'menu' ? (
                    /* Pie de Imagen 1 */
                    <>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Terminal táctil lista para interactuar.</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline">Hora oficial de planta: <strong className="font-bold text-slate-700 dark:text-slate-200">{formatTimeShort(currentTime)}</strong></span>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline">{tz}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <CompanyBrand logoUrl={resolvedLogoUrl} razonSocial={empresaRazonSocial} variant="footer" />
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                <span>Control de Asistencia & Horarios</span>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Pie de Imagen 2 */
                    <>
                        <div className="flex items-center gap-3">
                            <span>Sistema Kiosko Checador • Soporte Táctil, Pistola USB y QR Gafete</span>
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" /> En Línea (Planta)
                            </span>
                            {gpsStatus === 'activo' && gpsPosition && (
                                <span className="hidden md:flex text-[10px] items-center gap-1 text-slate-400 font-mono">
                                    <MapPin className="w-3 h-3 text-emerald-500" />
                                    {gpsPosition.lat.toFixed(4)}, {gpsPosition.lng.toFixed(4)}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2.5">
                            <CompanyBrand logoUrl={resolvedLogoUrl} razonSocial={empresaRazonSocial} variant="footer" />
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                <span>Control de Asistencia & Horarios</span>
                            </div>
                        </div>
                    </>
                )}
            </footer>

            {/* MODAL DE ESCÁNER QR POR CÁMARA */}
            {qrModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="relative max-w-xl w-full bg-slate-900 border border-emerald-500/40 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-5 text-center">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <Camera className="w-5 h-5 text-emerald-400 animate-pulse" />
                                <h3 className="text-sm font-extrabold text-white">
                                    Escáner QR de Cámara en Vivo
                                </h3>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={toggleCameraFacing}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border-slate-700 gap-1.5"
                                >
                                    <SwitchCamera className="w-4 h-4 text-emerald-400" />
                                    {facingMode === 'environment' ? 'Cámara Trasera' : 'Cámara Frontal'}
                                </Button>

                                <button
                                    type="button"
                                    onClick={stopQrCamera}
                                    className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="relative aspect-[4/3] w-full max-w-xl mx-auto bg-black rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-inner group">
                            <video
                                ref={qrVideoRef}
                                className="w-full h-full object-cover"
                                playsInline
                                muted
                                autoPlay
                            />

                            {/* Marco Láser Animado */}
                            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
                                <div className="flex justify-between">
                                    <div className="w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                                    <div className="w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                                </div>

                                <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse" />

                                <div className="flex justify-between">
                                    <div className="w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                                    <div className="w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                                </div>
                            </div>

                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center gap-2 shadow-lg w-11/12 justify-center text-center">
                                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-spin" />
                                <span>Escaneo 360° Activo: Acerque el QR a cualquier lugar de la pantalla</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL SELECCIÓN DE MINUTOS DE DESCANSO */}
            <Dialog open={isDescansoModalOpen} onOpenChange={setIsDescansoModalOpen}>
                <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-teal-500/40 text-slate-900 dark:text-white rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-teal-600 dark:text-teal-400">
                            <Coffee className="w-5 h-5 text-teal-500" />
                            Seleccionar Duración del Descanso
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                            Elija los minutos asignados para su pausa o descanso de jornada.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-3 gap-3">
                            {[5, 10, 15, 20, 30, 60].map((min) => (
                                <button
                                    key={min}
                                    type="button"
                                    onClick={() => setSelectedMinutosDescanso(min)}
                                    className={`p-4 rounded-2xl text-center border font-bold text-sm transition-all ${
                                        selectedMinutosDescanso === min
                                            ? 'bg-teal-600 border-teal-500 text-white shadow-lg ring-2 ring-teal-500/40'
                                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {min} min
                                </button>
                            ))}
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDescansoModalOpen(false)}
                                className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={() => handleRegisterMarcaje('descanso_inicio', { duracion_descanso_minutos: selectedMinutosDescanso })}
                                disabled={loadingSearch}
                                className="bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl"
                            >
                                Confirmar {selectedMinutosDescanso} min
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* MODAL REGISTRO DE INCIDENTES EN JORNADA */}
            <Dialog open={isIncidenteModalOpen} onOpenChange={setIsIncidenteModalOpen}>
                <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-amber-500/40 text-slate-900 dark:text-white rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Registro de Incidente en Jornada
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                            Seleccione o describa la causa del incidente que interrumpe la actividad.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-700 dark:text-slate-300">Causas Frecuentes:</Label>
                            <div className="flex flex-wrap gap-2">
                                {['Falla Eléctrica / Maquinaria', 'Falta de Insumos', 'Cita / Atención Médica', 'Trámite Administrativo', 'Capacitación'].map((causa) => (
                                    <button
                                        key={causa}
                                        type="button"
                                        onClick={() => setIncidenteCausaInput(causa)}
                                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-900/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-amber-200 transition-colors"
                                    >
                                        {causa}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-700 dark:text-slate-300">Causa o Detalle del Incidente:</Label>
                            <Input
                                value={incidenteCausaInput}
                                onChange={(e) => setIncidenteCausaInput(e.target.value)}
                                placeholder="Ej. Suspensión de energía en línea de empaque"
                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl"
                            />
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsIncidenteModalOpen(false)}
                                className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={() => handleRegisterMarcaje('incidente_inicio', { incidente_causa: incidenteCausaInput || 'Incidente General' })}
                                disabled={loadingSearch || !incidenteCausaInput.trim()}
                                className="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl"
                            >
                                Registrar Incidente
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
