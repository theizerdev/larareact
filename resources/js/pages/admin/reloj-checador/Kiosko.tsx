import React, { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
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
    X,
    Sparkles,
    SwitchCamera,
    AlertTriangle,
    MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import LanguageToggle from '@/components/language-toggle';
import { useTranslate } from '@/hooks/use-translate';

interface Configuracion {
    requiere_foto_marcaje?: boolean;
    tolerancia_retardo_minutos?: number;
}

interface Props {
    configuracion?: Configuracion;
    zona_horaria?: string | null;
}

interface EmpleadoFound {
    id: number;
    nombre_completo: string;
    documento_identidad: string;
    foto_empleado?: string | null;
    departamento?: string;
    cargo?: string;
    turno?: string;
}

export default function RelojChecadorKiosko({ configuracion, zona_horaria }: Props) {
    const { __, currentLocale, isRtl } = useTranslate();

    // Reloj digital en tiempo real (usa la zona horaria de la empresa/sucursal o America/Mexico_City por defecto)
    const tz = zona_horaria || 'America/Mexico_City';
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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
    const [qrScanning, setQrScanning] = useState(false);
    const [qrDetectedNotice, setQrDetectedNotice] = useState<string | null>(null);

    // Modales para Descansos e Incidentes
    const [isDescansoModalOpen, setIsDescansoModalOpen] = useState(false);
    const [selectedMinutosDescanso, setSelectedMinutosDescanso] = useState<number>(15);
    const [isIncidenteModalOpen, setIsIncidenteModalOpen] = useState(false);
    const [incidenteCausaInput, setIncidenteCausaInput] = useState<string>('');

    const inputRef = useRef<HTMLInputElement | null>(null);

    // Reproducir tono de confirmación tipo escáner pos
    const playBeepSound = () => {
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
        if (configuracion?.requiere_foto_marcaje) {
            if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then((stream) => {
                        if (videoRef.current) {
                            videoRef.current.srcObject = stream;
                            setCameraActive(true);
                        }
                    })
                    .catch(() => setCameraActive(false));
            } else {
                setCameraActive(false);
            }
        }
    }, [configuracion]);

    // Listener para Lectores Físicos (Pistolas USB/Bluetooth) con tecla Enter
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !qrModalOpen) {
                if (documentInput.trim()) {
                    handleSearch();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [documentInput, qrModalOpen]);

    // Cargar jsQR dinámicamente si el navegador no tiene BarcodeDetector nativo (idéntico a Garita Control)
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

    // Efecto de cámara en vivo (Escaneo Omnidireccional 360° con BarcodeDetector + jsQR)
    useEffect(() => {
        let animationFrameId: number;
        let active = true;

        if (qrModalOpen) {
            setErrorMessage(null);
            if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
                setErrorMessage(__('No se pudo acceder a la cámara o el dispositivo no soporta captura de video (requiere HTTPS).'));
                setQrModalOpen(false);
                return;
            }

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
                            // 1. Detección por BarcodeDetector (si disponible) en todo el campo visual
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

                            // 2. Detección por jsQR en 100% del cuadro de imagen (Escaneo omnidireccional 360°)
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
                .catch((err) => {
                    setErrorMessage(__('No se pudo acceder a la cámara para escanear el gafete QR.'));
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
                setErrorMessage(data.message || __('No se encontró ningún empleado activo con ese número o QR.'));
            }
        } catch (err: any) {
            setEmpleado(null);
            setErrorMessage(__('No se encontró ningún empleado activo con ese número o QR.'));
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        performSearch(documentInput);
    };

    const getTipoMarcajeLabel = (tipo: string) => {
        switch (tipo) {
            case 'entrada': return __('INICIO JORNADA');
            case 'entrada_extraordinaria': return __('TIEMPO EXTRA');
            case 'descanso_inicio': return __('DESCANSO');
            case 'descanso_fin': return __('FIN DESCANSO');
            case 'salida_comida': return __('INICIO COMIDA');
            case 'entrada_comida': return __('FIN COMIDA');
            case 'incidente_inicio': return __('INCIDENTE');
            case 'incidente_fin': return __('FIN INCIDENTE');
            case 'salida': return __('SALIDA JORNADA');
            default: return tipo.replace('_', ' ').toUpperCase();
        }
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
                const tipoLabel = getTipoMarcajeLabel(tipo);
                setSuccessMessage(
                    __('¡Marcaje de :tipo registrado exitosamente para :nombre!', {
                        tipo: tipoLabel,
                        nombre: data.empleado_nombre || empleado.nombre_completo,
                    })
                );
                setIsDescansoModalOpen(false);
                setIsIncidenteModalOpen(false);
                setTimeout(() => {
                    handleNumpadClear();
                    setSuccessMessage(null);
                }, 4000);
            } else {
                setErrorMessage(data.message || __('Error al registrar el marcaje.'));
            }
        } catch (err: any) {
            setErrorMessage(__('Error al registrar el marcaje.'));
        } finally {
            setLoadingSearch(false);
        }
    };

    const isArabic = isRtl || currentLocale === 'ar';
    const localeCode = isArabic ? 'ar-u-nu-latn' : 'es-MX';

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString(localeCode, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: tz,
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString(localeCode, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: tz,
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 md:p-8 font-sans select-none">
            <Head title={__('Kiosko Reloj Checador - Escáner QR Gafete')} />

            {/* BARRA SUPERIOR */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-600/20 rounded-2xl border border-emerald-500/30 text-emerald-400">
                        <Clock className="w-8 h-8 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-wide">{__('RELOJ CHECADOR DIGITAL')}</h1>
                        <p className="text-xs text-slate-400">{__('Control de Asistencia por Numpad, QR Gafete & Pistola Lector')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right rtl:text-left hidden sm:block">
                        <div className="text-2xl font-black text-emerald-400 font-mono tracking-wider"><span dir="ltr">{formatTime(currentTime)}</span></div>
                        <div className="text-xs text-slate-400">
                            <span>{formatDate(currentTime)}</span> • <span dir="ltr">{tz}</span>
                        </div>
                    </div>

                    <LanguageToggle />

                    <Link href="/admin/dashboard">
                        <Button variant="outline" className="border-slate-800 bg-slate-900 text-slate-300 hover:text-white">
                            <ArrowLeft className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 rtl:rotate-180" />
                            {__('Panel Admin')}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* CONTENIDO CENTRAL */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-4 items-center">
                {/* COLUMNA IZQUIERDA: INPUT, QR SCANNER Y NUMPAD */}
                <div className="lg:col-span-6 space-y-6">
                    <Card className="bg-slate-900/80 border-slate-800 shadow-2xl backdrop-blur-xl">
                        <CardContent className="p-6 space-y-6">
                            <div className="text-center space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider block">
                                        {__('N° de Empleado, Documento o QR Gafete')}
                                    </Label>
                                    <Badge variant="outline" className="text-[10px] bg-indigo-950/60 text-indigo-300 border-indigo-800 flex items-center gap-1">
                                        <Scan className="w-3 h-3" /> {__('Lector USB listo')}
                                    </Badge>
                                </div>

                                <div className="relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        dir="ltr"
                                        value={documentInput}
                                        onChange={(e) => setDocumentInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                                        placeholder={__('Ingrese número o escanee código de barras/QR...')}
                                        className="w-full text-center text-2xl sm:text-3xl font-mono font-bold tracking-widest bg-slate-950 border-2 border-emerald-500/40 rounded-xl py-4 text-emerald-400 placeholder:text-slate-700 shadow-inner focus:outline-none focus:border-emerald-500"
                                        autoFocus
                                    />
                                </div>

                                {/* BOTÓN DE ESCÁNER QR POR CÁMARA */}
                                <Button
                                    onClick={startQrCamera}
                                    type="button"
                                    variant="outline"
                                    className="w-full h-12 border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-200 font-bold rounded-xl flex items-center justify-center gap-2 border"
                                >
                                    <QrCode className="w-5 h-5 text-indigo-400 animate-pulse" />
                                    <span>{__('ESCANEAR GAFETE QR (CÁMARA)')}</span>
                                </Button>
                            </div>

                            {/* TECLADO TÁCTIL (NUMPAD) */}
                            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => handleNumpadPress(num)}
                                        className="h-14 rounded-xl bg-slate-800/80 hover:bg-emerald-600 text-2xl font-bold text-white border border-slate-700 hover:border-emerald-500 transition-all active:scale-95 shadow-md flex items-center justify-center"
                                    >
                                        <span dir="ltr">{num}</span>
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleNumpadClear}
                                    className="h-14 rounded-xl bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold border border-rose-900 transition-all active:scale-95 flex items-center justify-center"
                                >
                                    {__('LIMPIAR')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleNumpadPress('0')}
                                    className="h-14 rounded-xl bg-slate-800/80 hover:bg-emerald-600 text-2xl font-bold text-white border border-slate-700 hover:border-emerald-500 transition-all active:scale-95 shadow-md flex items-center justify-center"
                                >
                                    <span dir="ltr">0</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNumpadDelete}
                                    className="h-14 rounded-xl bg-amber-950/60 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-900 transition-all active:scale-95 flex items-center justify-center"
                                >
                                    <Delete className="w-6 h-6 rtl:rotate-180" />
                                </button>
                            </div>

                            <Button
                                onClick={() => handleSearch()}
                                disabled={!documentInput.trim() || loadingSearch}
                                className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-950/50"
                            >
                                {loadingSearch ? __('VERIFICANDO...') : __('VERIFICAR EMPLEADO')}
                            </Button>
                        </CardContent>
                    </Card>

                    {errorMessage && (
                        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-sm flex items-center gap-3 animate-shake">
                            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}
                </div>

                {/* COLUMNA DERECHA: CONFIRMACIÓN Y BOTONES DE MARCAJE */}
                <div className="lg:col-span-6 space-y-6">
                    {successMessage ? (
                        <Card className="bg-emerald-950/90 border-2 border-emerald-500 p-8 text-center space-y-4 shadow-2xl animate-bounce-short">
                            <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto animate-pulse" />
                            <h2 className="text-2xl font-black text-white">{successMessage}</h2>
                            <p className="text-emerald-200 text-sm">{__('El sistema ha registrado el evento de asistencia y notificado por WhatsApp al empleado.')}</p>
                        </Card>
                    ) : empleado ? (
                        <Card className="bg-slate-900/90 border-2 border-emerald-500/40 shadow-2xl backdrop-blur-xl space-y-6 p-6">
                            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                                <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-slate-700 overflow-hidden flex items-center justify-center text-slate-500 font-bold text-xl">
                                    {empleado.foto_empleado ? (
                                        <img src={empleado.foto_empleado} alt={empleado.nombre_completo} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{empleado.nombre_completo.substring(0, 2).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                                        {__('Empleado Verificado')}
                                    </Badge>
                                    <h2 className="text-xl font-bold text-white">{empleado.nombre_completo}</h2>
                                    <p className="text-xs text-slate-400">{empleado.cargo || __('Sin cargo')} • {empleado.departamento || __('Sin departamento')}</p>
                                    <p className="text-xs text-emerald-400 font-medium">{__('Turno:')} {empleado.turno}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider block">
                                    {__('SELECCIONE LA ACCIÓN A REGISTRAR:')}
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
                                                    className={`h-20 text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                                                        sugerenciaMarcaje === 'entrada'
                                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-emerald-500/40 shadow-lg'
                                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                                    }`}
                                                >
                                                    <LogIn className="w-5 h-5 text-emerald-400" />
                                                    <span>{__('INICIO JORNADA')}</span>
                                                </Button>

                                                <Button
                                                    onClick={() => handleRegisterMarcaje('entrada_extraordinaria', { tipo_entrada: 'extraordinaria_doble' })}
                                                    disabled={loadingSearch}
                                                    className="h-20 text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700/60 shadow-lg transition-all"
                                                >
                                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                                    <span>{__('TIEMPO EXTRA')}</span>
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
                                                    className={`h-20 text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                                                        esDescansoActivo
                                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-emerald-500/40 shadow-lg animate-pulse'
                                                            : 'bg-teal-900/80 hover:bg-teal-800 text-teal-200 border border-teal-700/60 shadow-lg'
                                                    }`}
                                                >
                                                    <Coffee className="w-5 h-5 text-teal-400" />
                                                    <span>{esDescansoActivo ? __('FIN DESCANSO') : __('DESCANSO')}</span>
                                                </Button>

                                                <Button
                                                    onClick={() => handleRegisterMarcaje('salida_comida')}
                                                    disabled={loadingSearch}
                                                    className={`h-20 text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                                                        sugerenciaMarcaje === 'salida_comida'
                                                            ? 'bg-amber-600 hover:bg-amber-500 text-white ring-4 ring-amber-500/40 shadow-lg'
                                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                                    }`}
                                                >
                                                    <Utensils className="w-5 h-5 text-amber-400" />
                                                    <span>{__('INICIO COMIDA')}</span>
                                                </Button>

                                                <Button
                                                    onClick={() => handleRegisterMarcaje('entrada_comida')}
                                                    disabled={loadingSearch}
                                                    className={`h-20 text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                                                        sugerenciaMarcaje === 'entrada_comida'
                                                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white ring-4 ring-indigo-500/40 shadow-lg'
                                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                                    }`}
                                                >
                                                    <LogIn className="w-5 h-5 text-indigo-400" />
                                                    <span>{__('FIN COMIDA')}</span>
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
                                                    className={`h-20 text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                                                        esIncidenteActivo
                                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-emerald-500/40 shadow-lg animate-pulse'
                                                            : 'bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-800/60 shadow-lg'
                                                    }`}
                                                >
                                                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                                                    <span>{esIncidenteActivo ? __('FIN INCIDENTE') : __('INCIDENTE')}</span>
                                                </Button>

                                                <Button
                                                    onClick={() => handleRegisterMarcaje('salida')}
                                                    disabled={loadingSearch}
                                                    className={`col-span-2 sm:col-span-3 h-16 text-base font-bold flex items-center justify-center gap-2 rounded-xl transition-all ${
                                                        sugerenciaMarcaje === 'salida'
                                                            ? 'bg-rose-600 hover:bg-rose-500 text-white ring-4 ring-rose-500/40 shadow-lg'
                                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                                    }`}
                                                >
                                                    <LogOut className="w-6 h-6 text-rose-400" />
                                                    <span>{__('SALIDA JORNADA')}</span>
                                                </Button>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card className="bg-slate-900/40 border-slate-800/80 p-8 text-center space-y-4">
                            <UserCheck className="w-16 h-16 text-slate-700 mx-auto" />
                            <h3 className="text-slate-400 font-medium">{__('En espera de ingreso de documento o lectura de QR...')}</h3>
                            <p className="text-xs text-slate-600">{__('Al ingresar el número de empleado o acercar el QR del gafete a la cámara/lector, aparecerá el perfil con las opciones de marcaje.')}</p>
                        </Card>
                    )}

                    {/* VISTA DE CÁMARA DE EVIDENCIA SI ESTÁ ACTIVADA */}
                    {configuracion?.requiere_foto_marcaje && (
                        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                                <Camera className="w-4 h-4 text-emerald-400" />
                                <span>{__('Cámara de Evidencia Activa')}</span>
                            </div>
                            <div className="w-16 h-12 rounded bg-slate-950 border border-slate-800 overflow-hidden">
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Escáner QR con Cámara en Vivo (idéntico al de Garita Control) */}
            {qrModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="relative max-w-xl w-full bg-slate-900 border border-emerald-500/40 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-5 text-center">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <Camera className="w-5 h-5 text-emerald-400 animate-pulse" />
                                <h3 className="text-sm font-extrabold text-white">
                                    {__('Escáner QR de Cámara en Vivo')}
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
                                    {facingMode === 'environment' ? __('Cámara Trasera') : __('Cámara Frontal')}
                                </Button>

                                <button
                                    type="button"
                                    onClick={stopQrCamera}
                                    className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                    <span className="sr-only">{__('Cerrar')}</span>
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

                            {/* Escáner Láser Omnidireccional en Toda la Pantalla */}
                            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
                                <div className="flex justify-between">
                                    <div className="w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                                    <div className="w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                                </div>

                                {/* Línea Láser Verde Animada en Toda la Pantalla */}
                                <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse" />

                                <div className="flex justify-between">
                                    <div className="w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                                    <div className="w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                                </div>
                            </div>

                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center gap-2 shadow-lg w-11/12 justify-center text-center">
                                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-spin" />
                                <span>{__('Escaneo 360° Activo: Acerque el QR a cualquier lugar de la pantalla')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL SELECCIÓN DE MINUTOS DE DESCANSO */}
            <Dialog open={isDescansoModalOpen} onOpenChange={setIsDescansoModalOpen}>
                <DialogContent className="max-w-md bg-slate-900 border border-teal-500/40 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-teal-400">
                            <Coffee className="w-5 h-5 text-teal-400" />
                            {__('Seleccionar Duración del Descanso')}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-400">
                            {__('Elija los minutos asignados para su pausa o descanso de jornada.')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-3 gap-3">
                            {[5, 10, 15, 20, 30, 60].map((min) => (
                                <button
                                    key={min}
                                    type="button"
                                    onClick={() => setSelectedMinutosDescanso(min)}
                                    className={`p-4 rounded-xl text-center border font-bold text-sm transition-all ${
                                        selectedMinutosDescanso === min
                                            ? 'bg-teal-600 border-teal-400 text-white shadow-lg ring-2 ring-teal-500/40'
                                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                    }`}
                                >
                                    <span dir="ltr">{min}</span> {__('min')}
                                </button>
                            ))}
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDescansoModalOpen(false)}
                                className="border-slate-700 bg-slate-800 text-slate-300"
                            >
                                {__('Cancelar')}
                            </Button>
                            <Button
                                type="button"
                                onClick={() => handleRegisterMarcaje('descanso_inicio', { duracion_descanso_minutos: selectedMinutosDescanso })}
                                disabled={loadingSearch}
                                className="bg-teal-600 hover:bg-teal-500 text-white font-bold"
                            >
                                {__('Confirmar')} <span dir="ltr" className="mx-1">{selectedMinutosDescanso}</span> {__('min')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* MODAL REGISTRO DE INCIDENTES EN JORNADA */}
            <Dialog open={isIncidenteModalOpen} onOpenChange={setIsIncidenteModalOpen}>
                <DialogContent className="max-w-md bg-slate-900 border border-amber-500/40 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-amber-400">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                            {__('Registro de Incidente en Jornada')}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-400">
                            {__('Seleccione o describa la causa del incidente que interrumpe la actividad.')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-300">{__('Causas Frecuentes:')}</Label>
                            <div className="flex flex-wrap gap-2">
                                {['Falla Eléctrica / Maquinaria', 'Falta de Insumos', 'Cita / Atención Médica', 'Trámite Administrativo', 'Capacitación'].map((causa) => (
                                    <button
                                        key={causa}
                                        type="button"
                                        onClick={() => setIncidenteCausaInput(__(causa))}
                                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-900/50 border border-slate-700 text-amber-200 transition-colors"
                                    >
                                        {__(causa)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-300">{__('Causa o Detalle del Incidente:')}</Label>
                            <Input
                                value={incidenteCausaInput}
                                onChange={(e) => setIncidenteCausaInput(e.target.value)}
                                placeholder={__('Ej. Suspensión de energía en línea de empaque')}
                                className="bg-slate-950 border-slate-700 text-white text-xs"
                            />
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsIncidenteModalOpen(false)}
                                className="border-slate-700 bg-slate-800 text-slate-300"
                            >
                                {__('Cancelar')}
                            </Button>
                            <Button
                                type="button"
                                onClick={() => handleRegisterMarcaje('incidente_inicio', { incidente_causa: incidenteCausaInput || __('Incidente General') })}
                                disabled={loadingSearch || !incidenteCausaInput.trim()}
                                className="bg-amber-600 hover:bg-amber-500 text-white font-bold"
                            >
                                {__('Registrar Incidente')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* PIE DE PÁGINA */}
            <div className="border-t border-slate-900 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
                <div className="flex flex-wrap items-center gap-3">
                    <span>{__('Sistema Kiosko Checador • Soporte para Teclado, Pistola USB y QR Gafete')}</span>
                    {gpsStatus === 'activo' && gpsPosition && (
                        <Badge variant="outline" className="text-[10px] bg-emerald-950/40 text-emerald-400 border-emerald-800 flex items-center gap-1 font-mono">
                            <MapPin className="w-3 h-3 text-emerald-400" />
                            GPS: <span dir="ltr">{gpsPosition.lat.toFixed(4)}, {gpsPosition.lng.toFixed(4)}</span>
                        </Badge>
                    )}
                    {gpsStatus === 'obteniendo' && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-400 animate-pulse" />
                            {__('Sincronizando GPS...')}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>{__('Control de Asistencia & Horarios')}</span>
                </div>
            </div>
        </div>
    );
}
