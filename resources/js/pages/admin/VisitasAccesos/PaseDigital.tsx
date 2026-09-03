import React, { useState, useRef, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
    ShieldCheck,
    Calendar,
    Clock,
    User,
    Building,
    Car,
    Footprints,
    CheckCircle2,
    XCircle,
    Camera,
    Upload,
    Plus,
    Trash2,
    Users,
    FileText,
    Check,
    Edit3,
    AlertCircle,
    RefreshCw,
    X,
    QrCode,
    Lock,
    ChevronRight,
    Building2,
    Info,
    Phone,
    SwitchCamera,
    Scan
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogPortal,
    DialogOverlay,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Acompanante {
    nombres?: string;
    apellidos?: string;
    nombre: string;
    curp?: string;
    documento?: string;
    genero?: string;
    fecha_nacimiento?: string;
    edad?: number | string;
    correo?: string;
    cargo?: string;
    foto_carnet?: string;
    doc_foto_frontal?: string;
    doc_foto_trasera?: string;
}

interface PaseDigitalProps {
    invitacion: {
        id: number;
        uuid: string;
        codigo_invitacion: string;
        tipo_acceso: string;
        visitante_nombre: string;
        visitante_nombres?: string | null;
        visitante_apellidos?: string | null;
        visitante_documento?: string | null;
        foto_carnet?: string | null;
        doc_foto_frontal?: string | null;
        doc_foto_trasera?: string | null;
        visitante_telefono?: string | null;
        visitante_empresa?: string | null;
        fecha_estimada: string;
        hora_estimada?: string | null;
        medio_acceso: 'peatonal' | 'vehicular' | string;
        vehiculo_placa?: string | null;
        vehiculo_marca?: string | null;
        vehiculo_modelo?: string | null;
        vehiculo_anio?: string | null;
        vehiculo_foto_frontal?: string | null;
        vehiculo_foto_trasera?: string | null;
        acompanantes?: Acompanante[] | null;
        datos_acceso_completados?: boolean;
        motivo_visita?: string | null;
        status: string;
        anfitrion?: {
            id: number;
            nombres: string;
            apellidos: string;
            telefono?: string | null;
        } | null;
        empresa?: {
            razon_social: string;
        } | null;
        sucursal?: {
            nombre: string;
        } | null;
        proveedor?: {
            id: number;
            razon_social?: string;
            nombre_comercial?: string;
            documento_identidad?: string;
            telefono?: string;
            responsable?: string;
            empleados?: Array<{
                id: number;
                nombres: string;
                apellidos: string;
                documento_identidad?: string;
                foto_carnet?: string;
                foto_empleado?: string;
                cargo?: any;
            }>;
            vehiculos?: Array<{
                id: number;
                tipo?: string;
                marca?: string;
                modelo?: string;
                placa?: string;
                foto_frontal?: string;
                foto_trasera?: string;
            }>;
        } | null;
        productor?: {
            id: number;
            razon_social?: string;
            nombre_comercial?: string;
            razon_social_rancho?: string;
            nombre_comercial_rancho?: string;
            documento_identidad?: string;
            telefono?: string;
            responsable?: string;
            empleados?: Array<{
                id: number;
                nombres: string;
                apellidos: string;
                documento_identidad?: string;
                foto_carnet?: string;
                foto_empleado?: string;
                cargo?: any;
            }>;
            vehiculos?: Array<{
                id: number;
                tipo?: string;
                marca?: string;
                modelo?: string;
                placa?: string;
                foto_frontal?: string;
                foto_trasera?: string;
            }>;
        } | null;
    };
}

// ── Widget de Cámara en vivo ──
interface CameraWidgetProps {
    onCapture: (base64Data: string) => void;
    onCancel: () => void;
    title: string;
    faceGuide?: boolean;
    docGuide?: boolean;
}

function CameraWidget({ onCapture, onCancel, title, faceGuide = false, docGuide = false }: CameraWidgetProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [captured, setCaptured] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>(faceGuide ? 'user' : 'environment');
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

    // Face & Document guide state
    const [faceStatus, setFaceStatus] = useState<'searching' | 'detected' | 'countdown' | 'idle'>('idle');
    const [docCorners, setDocCorners] = useState<{ tl: boolean; tr: boolean; bl: boolean; br: boolean }>({
        tl: false, tr: false, bl: false, br: false
    });
    const [countdown, setCountdown] = useState(3);
    const faceDetectorRef = useRef<any>(null);
    const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const faceStableCountRef = useRef(0);

    // Detectar si el dispositivo tiene más de una cámara
    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            const videoInputs = devices.filter(d => d.kind === 'videoinput');
            setHasMultipleCameras(videoInputs.length > 1);
        }).catch(() => setHasMultipleCameras(false));
    }, []);

    // Inicializar FaceDetector si está disponible
    useEffect(() => {
        if (faceGuide && 'FaceDetector' in window) {
            try {
                faceDetectorRef.current = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
            } catch {
                faceDetectorRef.current = null;
            }
        }
        return () => {
            if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, [faceGuide]);

    const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setError(null);
        setCaptured(null);
        setFaceStatus((faceGuide || docGuide) ? 'searching' : 'idle');
        setDocCorners({ tl: false, tr: false, bl: false, br: false });
        setCountdown(3);
        faceStableCountRef.current = 0;
        if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: mode }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error(err);
            setError('Sin acceso a la cámara. Por favor active los permisos del navegador.');
        }
    };

    const stopCamera = () => {
        if (detectionIntervalRef.current) { clearInterval(detectionIntervalRef.current); detectionIntervalRef.current = null; }
        if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const flipCamera = () => {
        const newMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(newMode);
        startCamera(newMode);
    };

    const capture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth || 640;
            canvas.height = videoRef.current.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const base64 = canvas.toDataURL('image/jpeg');
                setCaptured(base64);
                stopCamera();
            }
        }
    };

    // Detección de rostro con FaceDetector API
    useEffect(() => {
        if (!faceGuide || !stream || captured) return;

        if (faceDetectorRef.current && videoRef.current) {
            setFaceStatus('searching');

            detectionIntervalRef.current = setInterval(async () => {
                if (!videoRef.current || videoRef.current.readyState < 2) return;
                try {
                    const faces = await faceDetectorRef.current.detect(videoRef.current);
                    if (faces.length > 0) {
                        const face = faces[0];
                        const vw = videoRef.current.videoWidth;
                        const vh = videoRef.current.videoHeight;
                        const faceCenterX = face.boundingBox.x + face.boundingBox.width / 2;
                        const faceCenterY = face.boundingBox.y + face.boundingBox.height / 2;
                        const iscenteredX = Math.abs(faceCenterX - vw / 2) < vw * 0.2;
                        const iscenteredY = Math.abs(faceCenterY - vh / 2) < vh * 0.25;
                        const isBigEnough = face.boundingBox.width > vw * 0.2 && face.boundingBox.height > vh * 0.2;

                        if (iscenteredX && iscenteredY && isBigEnough) {
                            faceStableCountRef.current++;
                            if (faceStableCountRef.current >= 3) {
                                setFaceStatus('countdown');
                            } else {
                                setFaceStatus('detected');
                            }
                        } else {
                            faceStableCountRef.current = Math.max(0, faceStableCountRef.current - 1);
                            setFaceStatus('detected');
                        }
                    } else {
                        faceStableCountRef.current = 0;
                        setFaceStatus('searching');
                    }
                } catch {
                    // Ignorar errores en frame individual
                }
            }, 400);
        } else if (faceGuide) {
            setFaceStatus('searching');
        }

        return () => {
            if (detectionIntervalRef.current) { clearInterval(detectionIntervalRef.current); detectionIntervalRef.current = null; }
        };
    }, [faceGuide, stream, captured]);

    // Detección de alineación de documento y 4 esquinas para docGuide
    useEffect(() => {
        if (!docGuide || !stream || captured) return;

        setFaceStatus('searching');

        detectionIntervalRef.current = setInterval(() => {
            if (!videoRef.current || videoRef.current.readyState < 2) return;
            const video = videoRef.current;

            let canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = 160;
            canvas.height = 120;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.drawImage(video, 0, 0, 160, 120);

            // Muestreo de contraste/luminosidad en cada una de las 4 esquinas del documento
            const getRegionVariance = (rx: number, ry: number, rw: number, rh: number) => {
                try {
                    const imgData = ctx.getImageData(rx, ry, rw, rh);
                    const pixels = imgData.data;
                    let sum = 0;
                    let count = 0;
                    for (let i = 0; i < pixels.length; i += 4) {
                        const lum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
                        sum += lum;
                        count++;
                    }
                    const mean = sum / count;
                    let variance = 0;
                    for (let i = 0; i < pixels.length; i += 4) {
                        const lum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
                        variance += (lum - mean) * (lum - mean);
                    }
                    return Math.sqrt(variance / count);
                } catch {
                    return 0;
                }
            };

            const tlVar = getRegionVariance(15, 18, 22, 22);
            const trVar = getRegionVariance(123, 18, 22, 22);
            const blVar = getRegionVariance(15, 80, 22, 22);
            const brVar = getRegionVariance(123, 80, 22, 22);

            const threshold = 16;
            const newTL = tlVar > threshold;
            const newTR = trVar > threshold;
            const newBL = blVar > threshold;
            const newBR = brVar > threshold;

            setDocCorners({ tl: newTL, tr: newTR, bl: newBL, br: newBR });

            const countGreen = (newTL ? 1 : 0) + (newTR ? 1 : 0) + (newBL ? 1 : 0) + (newBR ? 1 : 0);

            if (countGreen === 4) {
                faceStableCountRef.current++;
                if (faceStableCountRef.current >= 2) {
                    setFaceStatus('countdown');
                }
            } else {
                faceStableCountRef.current = 0;
                setFaceStatus('searching');
            }
        }, 300);

        return () => {
            if (detectionIntervalRef.current) { clearInterval(detectionIntervalRef.current); detectionIntervalRef.current = null; }
        };
    }, [docGuide, stream, captured]);

    // Countdown para auto-captura
    useEffect(() => {
        if (faceStatus === 'countdown' && !captured) {
            setCountdown(3);
            countdownIntervalRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                        // Auto-captura
                        capture();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
        }
        return () => {
            if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
        };
    }, [faceStatus, captured]);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const guideColor = faceStatus === 'countdown' ? 'rgba(16, 185, 129, 0.9)' : faceStatus === 'detected' ? 'rgba(250, 204, 21, 0.7)' : 'rgba(148, 163, 184, 0.5)';
    const guideGlow = faceStatus === 'countdown' ? '0 0 30px rgba(16, 185, 129, 0.5)' : faceStatus === 'detected' ? '0 0 20px rgba(250, 204, 21, 0.3)' : 'none';
    const cornersCount = (docCorners.tl ? 1 : 0) + (docCorners.tr ? 1 : 0) + (docCorners.bl ? 1 : 0) + (docCorners.br ? 1 : 0);

    return (
        <Dialog open={true} onOpenChange={(open) => { if (!open) { stopCamera(); onCancel(); } }}>
            <DialogPortal>
                <DialogOverlay className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" />
                <DialogContent className="fixed z-[61] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700 rounded-3xl p-5 w-full max-w-md flex flex-col items-center gap-4 text-white shadow-2xl [&>button]:hidden">
                    <DialogHeader className="w-full flex flex-row items-center justify-between border-b border-slate-800 pb-3 space-y-0">
                        <DialogTitle className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                            <Camera className="w-5 h-5" /> {title}
                        </DialogTitle>
                        <div className="flex items-center gap-1">
                            {hasMultipleCameras && !captured && (
                                <button
                                    type="button"
                                    onClick={flipCamera}
                                    title={facingMode === 'environment' ? 'Cambiar a cámara frontal' : 'Cambiar a cámara trasera'}
                                    className="text-slate-400 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    <SwitchCamera className="w-5 h-5" />
                                </button>
                            )}
                            <button type="button" onClick={() => { stopCamera(); onCancel(); }} className="text-slate-400 hover:text-white p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </DialogHeader>

                    {error && (
                        <div className="text-rose-400 text-xs text-center p-6 space-y-2">
                            <AlertCircle className="w-8 h-8 mx-auto" />
                            <p>{error}</p>
                        </div>
                    )}

                    {!error && !captured && (
                        <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                            <canvas ref={canvasRef} className="hidden" />

                            {faceGuide && (
                                <>
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
                                        <defs>
                                            <mask id="faceMask">
                                                <rect width="400" height="300" fill="white" />
                                                <rect x="65" y="25" width="270" height="250" rx="24" fill="black" />
                                            </mask>
                                        </defs>
                                        <rect width="400" height="300" fill="rgba(0,0,0,0.55)" mask="url(#faceMask)" />
                                        <rect
                                            x="65" y="25" width="270" height="250" rx="24"
                                            fill="none"
                                            stroke={guideColor}
                                            strokeWidth="2.5"
                                            strokeDasharray={faceStatus === 'searching' ? '8 4' : 'none'}
                                            style={{ filter: guideGlow !== 'none' ? `drop-shadow(${guideGlow})` : undefined, transition: 'stroke 0.3s, filter 0.3s' }}
                                        />
                                        {faceStatus !== 'countdown' && (
                                            <>
                                                <line x1="200" y1="25" x2="200" y2="35" stroke={guideColor} strokeWidth="2" strokeLinecap="round" />
                                                <line x1="200" y1="265" x2="200" y2="275" stroke={guideColor} strokeWidth="2" strokeLinecap="round" />
                                                <line x1="65" y1="150" x2="75" y2="150" stroke={guideColor} strokeWidth="2" strokeLinecap="round" />
                                                <line x1="325" y1="150" x2="335" y2="150" stroke={guideColor} strokeWidth="2" strokeLinecap="round" />
                                            </>
                                        )}
                                    </svg>

                                    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 pointer-events-none">
                                        {faceStatus === 'searching' && (
                                            <div className="bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 animate-pulse">
                                                <Scan className="w-4 h-4 text-slate-400" />
                                                <span className="text-[11px] font-bold text-slate-300">Coloque su rostro dentro del marco</span>
                                            </div>
                                        )}
                                        {faceStatus === 'detected' && (
                                            <div className="bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                                                <User className="w-4 h-4 text-yellow-400" />
                                                <span className="text-[11px] font-bold text-yellow-300">Rostro detectado — mantenga la posición</span>
                                            </div>
                                        )}
                                        {faceStatus === 'countdown' && (
                                            <div className="bg-emerald-600/90 backdrop-blur-sm rounded-full px-5 py-2.5 flex items-center gap-2 shadow-lg shadow-emerald-500/30">
                                                <Camera className="w-4 h-4 text-white" />
                                                <span className="text-xs font-extrabold text-white">Capturando en {countdown}...</span>
                                            </div>
                                        )}
                                    </div>

                                    {faceStatus === 'countdown' && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <span className="text-7xl font-black text-white/80 drop-shadow-[0_4px_20px_rgba(16,185,129,0.6)] animate-pulse">
                                                {countdown}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}

                            {docGuide && (
                                <>
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
                                        <defs>
                                            <mask id="docMask">
                                                <rect width="400" height="300" fill="white" />
                                                <rect x="45" y="50" width="310" height="200" rx="16" fill="black" />
                                            </mask>
                                        </defs>
                                        <rect width="400" height="300" fill="rgba(0,0,0,0.65)" mask="url(#docMask)" />

                                        <rect x="45" y="50" width="310" height="200" rx="16" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="6 4" />

                                        <path
                                            d="M 45 85 L 45 50 L 80 50"
                                            fill="none"
                                            stroke={docCorners.tl ? '#10B981' : '#F59E0B'}
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ filter: docCorners.tl ? 'drop-shadow(0 0 10px #10B981)' : undefined, transition: 'stroke 0.25s, filter 0.25s' }}
                                        />
                                        <path
                                            d="M 320 50 L 355 50 L 355 85"
                                            fill="none"
                                            stroke={docCorners.tr ? '#10B981' : '#F59E0B'}
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ filter: docCorners.tr ? 'drop-shadow(0 0 10px #10B981)' : undefined, transition: 'stroke 0.25s, filter 0.25s' }}
                                        />
                                        <path
                                            d="M 45 215 L 45 250 L 80 250"
                                            fill="none"
                                            stroke={docCorners.bl ? '#10B981' : '#F59E0B'}
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ filter: docCorners.bl ? 'drop-shadow(0 0 10px #10B981)' : undefined, transition: 'stroke 0.25s, filter 0.25s' }}
                                        />
                                        <path
                                            d="M 320 250 L 355 250 L 355 215"
                                            fill="none"
                                            stroke={docCorners.br ? '#10B981' : '#F59E0B'}
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ filter: docCorners.br ? 'drop-shadow(0 0 10px #10B981)' : undefined, transition: 'stroke 0.25s, filter 0.25s' }}
                                        />

                                        <circle cx="58" cy="63" r="6" fill={docCorners.tl ? '#10B981' : '#F59E0B'} opacity={docCorners.tl ? 1 : 0.5} />
                                        <circle cx="342" cy="63" r="6" fill={docCorners.tr ? '#10B981' : '#F59E0B'} opacity={docCorners.tr ? 1 : 0.5} />
                                        <circle cx="58" cy="237" r="6" fill={docCorners.bl ? '#10B981' : '#F59E0B'} opacity={docCorners.bl ? 1 : 0.5} />
                                        <circle cx="342" cy="237" r="6" fill={docCorners.br ? '#10B981' : '#F59E0B'} opacity={docCorners.br ? 1 : 0.5} />
                                    </svg>

                                    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 pointer-events-none">
                                        {faceStatus !== 'countdown' ? (
                                            <div className="bg-black/75 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 border border-slate-700 shadow-md">
                                                <FileText className="w-4 h-4 text-emerald-400" />
                                                <span className="text-[11px] font-bold text-slate-200">
                                                    Alinee la credencial — Esquinas: {cornersCount} / 4
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="bg-emerald-600/90 backdrop-blur-sm rounded-full px-5 py-2.5 flex items-center gap-2 shadow-lg shadow-emerald-500/30">
                                                <Camera className="w-4 h-4 text-white" />
                                                <span className="text-xs font-extrabold text-white">¡Documento Alineado! Capturando en {countdown}...</span>
                                            </div>
                                        )}
                                    </div>

                                    {faceStatus === 'countdown' && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <span className="text-7xl font-black text-emerald-400 drop-shadow-[0_4px_25px_rgba(16,185,129,0.8)] animate-pulse">
                                                {countdown}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}

                            {hasMultipleCameras && (
                                <button
                                    type="button"
                                    onClick={flipCamera}
                                    title={facingMode === 'environment' ? 'Cambiar a cámara frontal' : 'Cambiar a cámara trasera'}
                                    className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full shadow-lg transition-all active:scale-90"
                                >
                                    <SwitchCamera className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={capture}
                                className="absolute bottom-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg rounded-full px-6 py-3 text-xs font-extrabold flex items-center gap-2 transition-transform active:scale-95"
                            >
                                <Camera className="w-4 h-4" />
                                {(faceGuide || docGuide) ? 'Capturar Manualmente' : 'Tomar Fotografía'}
                            </button>
                        </div>
                    )}

                    {!error && captured && (
                        <div className="flex flex-col items-center gap-4 w-full">
                            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md">
                                <img src={captured} alt="Captura preview" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={() => startCamera()}
                                    className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold hover:bg-slate-700 flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" /> Repetir Foto
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { stopCamera(); if (captured) onCapture(captured); }}
                                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" /> Usar Foto
                                </button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
}

export default function PaseDigital({ invitacion }: PaseDigitalProps) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(invitacion.uuid)}&color=104a29&bgcolor=ffffff`;

    const isPending = invitacion.status === 'pendiente';
    const isIngresado = invitacion.status === 'ingresado';

    // Razón Social limpia para la empresa / visitante
    const nombreVisitante = (() => {
        if (invitacion.tipo_acceso === 'proveedor' && invitacion.proveedor?.razon_social) {
            return invitacion.proveedor.razon_social;
        }
        if (invitacion.tipo_acceso === 'productor') {
            if (invitacion.productor?.razon_social) return invitacion.productor.razon_social;
            if (invitacion.productor?.razon_social_rancho) return invitacion.productor.razon_social_rancho;
        }
        if (invitacion.visitante_nombre) {
            return invitacion.visitante_nombre.replace(/\s*\([^)]*\)$/, '');
        }
        return 'Visitante';
    })();

    const formatImageUrl = (url: string | null | undefined): string | null => {
        if (!url) return null;
        if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        const cleanUrl = url.replace(/^\/?(storage\/)+/, '');
        return `/storage/${cleanUrl}`;
    };

    // Vista activa: 'registro' vs 'pase'
    const [activeView, setActiveView] = useState<'registro' | 'pase'>(
        invitacion.datos_acceso_completados ? 'pase' : 'registro'
    );

    const [activeCameraField, setActiveCameraField] = useState<string | null>(null);

    // Inertia form
    const { data, setData, post, processing, errors } = useForm({
        medio_acceso: invitacion.medio_acceso || 'peatonal',
        foto_carnet: invitacion.foto_carnet || '',
        doc_foto_frontal: invitacion.doc_foto_frontal || '',
        doc_foto_trasera: invitacion.doc_foto_trasera || '',
        vehiculo_marca: invitacion.vehiculo_marca || '',
        vehiculo_modelo: invitacion.vehiculo_modelo || '',
        vehiculo_anio: invitacion.vehiculo_anio || '',
        vehiculo_placa: invitacion.vehiculo_placa || '',
        vehiculo_foto_frontal: invitacion.vehiculo_foto_frontal || '',
        vehiculo_foto_trasera: invitacion.vehiculo_foto_trasera || '',
        acompanantes: (invitacion.acompanantes || []) as Acompanante[],
    });

    const [isAcompananteModalOpen, setIsAcompananteModalOpen] = useState(false);
    const [nuevoAcompanante, setNuevoAcompanante] = useState<Acompanante>({
        nombres: '',
        apellidos: '',
        nombre: '',
        curp: '',
        documento: '',
        genero: '',
        fecha_nacimiento: '',
        edad: '',
        correo: '',
        cargo: '',
        foto_carnet: '',
        doc_foto_frontal: '',
        doc_foto_trasera: '',
    });

    const handleAcompananteFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNuevoAcompanante(prev => ({ ...prev, [field]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAcompananteListFileUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number, field: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const updated = [...data.acompanantes];
                if (updated[index]) {
                    updated[index] = { ...updated[index], [field]: reader.result as string };
                    setData('acompanantes', updated);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAcompananteFechaChange = (fechaStr: string) => {
        let age: string | number = '';
        if (fechaStr) {
            const birthDate = new Date(fechaStr);
            const today = new Date();
            let calcAge = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                calcAge--;
            }
            if (calcAge >= 0 && !isNaN(calcAge)) {
                age = calcAge;
            }
        }
        setNuevoAcompanante(prev => ({
            ...prev,
            fecha_nacimiento: fechaStr,
            edad: age !== '' ? age : prev.edad,
        }));
    };

    const handleAddAcompanante = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const nombres = (nuevoAcompanante.nombres || '').trim();
        const apellidos = (nuevoAcompanante.apellidos || '').trim();
        const nombreCompleto = `${nombres} ${apellidos}`.trim() || (nuevoAcompanante.nombre || '').trim();

        if (!nombreCompleto) {
            alert('Por favor ingrese los nombres y apellidos del acompañante.');
            return;
        }

        const item: Acompanante = {
            ...nuevoAcompanante,
            nombres: nombres || nombreCompleto,
            apellidos: apellidos,
            nombre: nombreCompleto,
            documento: nuevoAcompanante.curp || nuevoAcompanante.documento || '',
            curp: nuevoAcompanante.curp || nuevoAcompanante.documento || '',
        };

        setData('acompanantes', [...data.acompanantes, item]);

        // Reset state
        setNuevoAcompanante({
            nombres: '',
            apellidos: '',
            nombre: '',
            curp: '',
            documento: '',
            genero: '',
            fecha_nacimiento: '',
            edad: '',
            correo: '',
            cargo: '',
            foto_carnet: '',
            doc_foto_frontal: '',
            doc_foto_trasera: '',
        });
        setIsAcompananteModalOpen(false);
    };

    const handleRemoveAcompanante = (index: number) => {
        setData('acompanantes', data.acompanantes.filter((_, i) => i !== index));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setData(field as any, reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitDatos = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/pase-digital/${invitacion.uuid}/datos-acceso`, {
            preserveScroll: true,
            onSuccess: () => {
                setActiveView('pase');
            },
        });
    };

    return (
        <>
            <Head title={`Pase Digital N° ${invitacion.codigo_invitacion} - ${invitacion.empresa?.razon_social || 'Control de Accesos'}`} />

            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans">

                {/* Header Público Estilo Pre-Registro */}
                <header className="bg-[#104a29] text-white border-b border-emerald-800 sticky top-0 z-40 px-6 py-4 shadow-md">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                            <div>
                                <span className="font-extrabold text-xl tracking-tight block leading-none">{(invitacion.empresa?.razon_social || 'CONTROL DE ACCESOS').toUpperCase()}</span>
                                <span className="text-xs text-emerald-200 font-medium tracking-wider uppercase">Portal Público de Accesos</span>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-mono font-extrabold text-emerald-200 border border-white/20">
                            Pre-Registro  N° {invitacion.codigo_invitacion}
                        </div>
                    </div>
                </header>

                {/* Progress Bar / Steps Bar amplio */}
                <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3 shadow-xs">
                    <div className="max-w-4xl mx-auto px-6">
                        <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 dark:text-slate-400">
                            <button
                                type="button"
                                onClick={() => setActiveView('registro')}
                                className={`flex items-center gap-2 transition-colors cursor-pointer ${activeView === 'registro' ? 'text-[#104a29] dark:text-emerald-400' : 'hover:text-slate-800'
                                    }`}
                            >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${activeView === 'registro' ? 'bg-[#104a29] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                                    }`}>1</span>
                                <span>1. Registro de Datos e Identificación</span>
                                {invitacion.datos_acceso_completados && (
                                    <Check className="w-4 h-4 text-emerald-600 font-bold" />
                                )}
                            </button>

                            <ChevronRight className="w-4 h-4 text-slate-400" />

                            <button
                                type="button"
                                onClick={() => setActiveView('pase')}
                                className={`flex items-center gap-2 transition-colors cursor-pointer ${activeView === 'pase' ? 'text-[#104a29] dark:text-emerald-400' : 'hover:text-slate-800'
                                    }`}
                            >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${activeView === 'pase' ? 'bg-[#104a29] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                                    }`}>2</span>
                                <span>2. Pase Digital QR</span>
                            </button>
                        </div>

                        {/* Line Indicator */}
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                            <div
                                className="bg-[#104a29] dark:bg-emerald-400 h-full transition-all duration-300"
                                style={{ width: activeView === 'registro' ? '50%' : '100%' }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Contenido Principal Amplio (max-w-4xl) */}
                <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">

                    {/* Banner Informativo Cita */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 flex-1">
                            {invitacion.foto_carnet || data.foto_carnet ? (
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md shrink-0">
                                    <img src={formatImageUrl(data.foto_carnet || invitacion.foto_carnet)!} alt="Carnet" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-extrabold text-xl shrink-0">
                                    {nombreVisitante?.[0] || 'V'}
                                </div>
                            )}

                            <div className="space-y-1">
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                                    Visitante Registrado
                                </span>
                                <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                                    {nombreVisitante}
                                </h1>
                                {invitacion.visitante_empresa && invitacion.visitante_empresa !== nombreVisitante && (
                                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                        <Building className="w-3.5 h-3.5 text-emerald-600" />
                                        Empresa: <span className="font-bold text-slate-700 dark:text-slate-300">{invitacion.visitante_empresa}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-2 w-full md:w-auto min-w-[220px]">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 font-medium flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Fecha:
                                </span>
                                <span className="font-extrabold text-slate-800 dark:text-slate-200">{invitacion.fecha_estimada}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 font-medium flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> Hora:
                                </span>
                                <span className="font-extrabold text-slate-800 dark:text-slate-200">{invitacion.hora_estimada ? invitacion.hora_estimada.substring(0, 5) : '09:00'} hrs</span>
                            </div>
                            {invitacion.anfitrion && (
                                <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5 text-[11px]">
                                    <span className="text-slate-400 block">Anfitrión:</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{invitacion.anfitrion.nombres} {invitacion.anfitrion.apellidos}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════════
                        PASO 1: FORMULARIO AMPLIO DE REGISTRO
                    ═══════════════════════════════════════════════════════════ */}
                    {activeView === 'registro' && (
                        <form onSubmit={handleSubmitDatos} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">

                            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                                <h2 className="text-lg font-extrabold text-[#104a29] dark:text-emerald-400 flex items-center gap-2">
                                    <FileText className="w-5 h-5" /> Completa tus Datos de Registro para tu ingreso
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Por favor registra el medio de acceso, fotografías de tu documento de identidad, datos del vehículo (si aplica) y acompañantes antes de llegar a la caseta. Realizaremos una validación de tus datos con base a las políticas de seguridad y privacidad de la organización.
                                </p>
                            </div>

                            {/* 1. SECCIÓN: MEDIO DE ACCESO */}
                            <div className="space-y-3">
                                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                                    1. Selección de Medio de Acceso <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setData('medio_acceso', 'peatonal')}
                                        className={`flex items-center justify-start gap-4 p-5 rounded-2xl border-2 text-left transition-all ${data.medio_acceso === 'peatonal'
                                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 shadow-sm'
                                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className={`p-3 rounded-xl ${data.medio_acceso === 'peatonal' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>
                                            <Footprints className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <span className="font-extrabold text-sm block">Acceso Peatonal</span>
                                            <span className="text-xs text-slate-500">Ingreso a pie por la puerta de control peatonal.</span>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setData('medio_acceso', 'vehicular')}
                                        className={`flex items-center justify-start gap-4 p-5 rounded-2xl border-2 text-left transition-all ${data.medio_acceso === 'vehicular'
                                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 shadow-sm'
                                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className={`p-3 rounded-xl ${data.medio_acceso === 'vehicular' ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>
                                            <Car className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <span className="font-extrabold text-sm block">Acceso Vehicular</span>
                                            <span className="text-xs text-slate-500">Ingreso con vehículo por la caseta principal.</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* 2. SECCIÓN: FOTOGRAFÍA TIPO CARNET (ROSTRO DEL VISITANTE) */}
                            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                                    2. Fotografía Tipo Carnet (Rostro del Visitante) <span className="text-rose-500">*</span>
                                </label>

                                <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-3xl bg-slate-50/60 dark:bg-slate-950 border-2 border-dashed border-slate-300 dark:border-slate-700">
                                    {data.foto_carnet ? (
                                        <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-emerald-500 shadow-md shrink-0">
                                            <img src={data.foto_carnet.startsWith('data:') ? data.foto_carnet : `/storage/${data.foto_carnet}`} alt="Foto Carnet" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setData('foto_carnet', '')}
                                                className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-32 h-32 rounded-2xl bg-slate-200 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                                            <User className="w-14 h-14" />
                                        </div>
                                    )}

                                    <div className="space-y-3 text-center sm:text-left flex-1">
                                        <div>
                                            <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200 block">Fotografía del Rostro</span>
                                            <span className="text-xs text-slate-500">Toma una foto legible de frente para tu identificación digital en la garita.</span>
                                        </div>

                                        <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setActiveCameraField('foto_carnet')}
                                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"
                                            >
                                                <Camera className="w-4 h-4" /> Capturar Cámara
                                            </button>
                                            <label className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-300 flex items-center gap-2">
                                                <Upload className="w-4 h-4" /> Subir Archivo
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'foto_carnet')} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. SECCIÓN: FOTOS DEL DOCUMENTO DE IDENTIDAD */}
                            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                                    3. Fotografías del Documento de Identidad (INE / Cédula / Pasaporte)
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Documento Frontal */}
                                    <div className="space-y-2">
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Foto Frontal de Identificación</span>
                                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-5 bg-slate-50/60 dark:bg-slate-950 text-center relative overflow-hidden min-h-[160px]">
                                            {data.doc_foto_frontal ? (
                                                <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-md">
                                                    <img src={data.doc_foto_frontal.startsWith('data:') ? data.doc_foto_frontal : `/storage/${data.doc_foto_frontal}`} alt="Doc Frontal" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setData('doc_foto_frontal', '')}
                                                        className="absolute top-2 right-2 bg-rose-600 text-white rounded-full p-1.5 shadow-lg hover:bg-rose-700"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-3">
                                                    <FileText className="w-8 h-8 text-slate-400" />
                                                    <span className="text-xs font-medium text-slate-500">Selecciona o toma una foto del frente de tu documento</span>
                                                    <div className="flex gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveCameraField('doc_foto_frontal')}
                                                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"
                                                        >
                                                            <Camera className="w-4 h-4" /> Cámara
                                                        </button>
                                                        <label className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-300 flex items-center gap-2">
                                                            <Upload className="w-4 h-4" /> Archivo
                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'doc_foto_frontal')} />
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Documento Trasero */}
                                    <div className="space-y-2">
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Foto Trasera de Identificación</span>
                                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-5 bg-slate-50/60 dark:bg-slate-950 text-center relative overflow-hidden min-h-[160px]">
                                            {data.doc_foto_trasera ? (
                                                <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-md">
                                                    <img src={data.doc_foto_trasera.startsWith('data:') ? data.doc_foto_trasera : `/storage/${data.doc_foto_trasera}`} alt="Doc Trasero" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setData('doc_foto_trasera', '')}
                                                        className="absolute top-2 right-2 bg-rose-600 text-white rounded-full p-1.5 shadow-lg hover:bg-rose-700"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-3">
                                                    <FileText className="w-8 h-8 text-slate-400" />
                                                    <span className="text-xs font-medium text-slate-500">Selecciona o toma una foto del reverso de tu documento</span>
                                                    <div className="flex gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveCameraField('doc_foto_trasera')}
                                                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"
                                                        >
                                                            <Camera className="w-4 h-4" /> Cámara
                                                        </button>
                                                        <label className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-300 flex items-center gap-2">
                                                            <Upload className="w-4 h-4" /> Archivo
                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'doc_foto_trasera')} />
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. SECCIÓN: DATOS Y FOTOS DEL VEHÍCULO (Si es vehicular) */}
                            {data.medio_acceso === 'vehicular' && (() => {
                                const vehiculosFlota = [
                                    ...(invitacion.proveedor?.vehiculos || []),
                                    ...(invitacion.productor?.vehiculos || []),
                                    ...((invitacion as any).empleado?.vehiculos || []),
                                    ...((invitacion as any).vehiculos || []),
                                ];

                                const isVehiculoSeleccionado = vehiculosFlota.some(
                                    v => (v.placa || '').toUpperCase() === (data.vehiculo_placa || '').toUpperCase() && data.vehiculo_placa !== ''
                                );

                                return (
                                    <Card className="border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm mt-4">
                                        <CardHeader className="pb-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <CardTitle className="text-xs font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                                                    <Car className="w-5 h-5 text-amber-500" /> 3. Datos y Fotografías del Vehículo de Ingreso
                                                </CardTitle>
                                                {isVehiculoSeleccionado ? (
                                                    <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 font-bold w-fit">
                                                        ✓ Vehículo Registrado Seleccionado
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 font-bold w-fit">
                                                        🚗 Vehículo Particular / Distinto No Registrado
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {/* Selector de Vehículos Pre-registrados (Si existen) */}
                                            {vehiculosFlota.length > 0 && (
                                                <Card className="p-4 bg-amber-100/50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 space-y-3 shadow-xs">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                                                            <Car className="w-4 h-4 text-amber-600" /> Vehículos Asignados / Registrados:
                                                        </Label>
                                                        <span className="text-[11px] text-slate-500">Seleccione un vehículo o registre uno distinto abajo</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 pt-1">
                                                        {vehiculosFlota.map((v: any, index: number) => {
                                                            const isThisSelected = (v.placa || '').toUpperCase() === (data.vehiculo_placa || '').toUpperCase() && data.vehiculo_placa !== '';
                                                            return (
                                                                <Button
                                                                    key={v.id || index}
                                                                    type="button"
                                                                    variant={isThisSelected ? "default" : "outline"}
                                                                    onClick={() => {
                                                                        setData({
                                                                            ...data,
                                                                            vehiculo_marca: v.marca || '',
                                                                            vehiculo_modelo: v.modelo || '',
                                                                            vehiculo_anio: v.anio || data.vehiculo_anio || '',
                                                                            vehiculo_placa: (v.placa || '').toUpperCase(),
                                                                            vehiculo_foto_frontal: v.foto_frontal || data.vehiculo_foto_frontal,
                                                                            vehiculo_foto_trasera: v.foto_trasera || data.vehiculo_foto_trasera,
                                                                        });
                                                                    }}
                                                                    className={`h-auto py-2 px-3 text-xs font-bold transition-all ${isThisSelected
                                                                        ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs'
                                                                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-amber-300 hover:bg-amber-100'
                                                                        }`}
                                                                >
                                                                    <Badge variant="secondary" className={`font-mono font-extrabold mr-1 ${isThisSelected ? 'bg-amber-600 text-white border-amber-400' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                                                                        }`}>
                                                                        {v.placa || 'S/N'}
                                                                    </Badge>
                                                                    <span>{v.marca} {v.modelo}</span>
                                                                </Button>
                                                            );
                                                        })}

                                                        {/* Opción para registrar un vehículo distinto */}
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setData({
                                                                    ...data,
                                                                    vehiculo_marca: '',
                                                                    vehiculo_modelo: '',
                                                                    vehiculo_anio: '',
                                                                    vehiculo_placa: '',
                                                                    vehiculo_foto_frontal: '',
                                                                    vehiculo_foto_trasera: '',
                                                                });
                                                            }}
                                                            className="bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 h-auto py-2 px-3"
                                                        >
                                                            <Plus className="w-4 h-4 text-emerald-600 mr-1" />
                                                            <span>Registrar Vehículo Distinto / Nuevo</span>
                                                        </Button>
                                                    </div>
                                                </Card>
                                            )}

                                            {/* Formulario de Datos del Vehículo */}
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="vehiculo_marca" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                            Marca del Vehículo <span className="text-rose-500">*</span>
                                                        </Label>
                                                        <Input
                                                            id="vehiculo_marca"
                                                            type="text"
                                                            placeholder="Ej: Nissan, Toyota, Chevrolet..."
                                                            value={data.vehiculo_marca}
                                                            onChange={(e) => setData('vehiculo_marca', e.target.value)}
                                                            className="text-xs bg-white dark:bg-slate-900 border-slate-300 focus:ring-amber-500"
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="vehiculo_modelo" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                            Modelo del Vehículo <span className="text-rose-500">*</span>
                                                        </Label>
                                                        <Input
                                                            id="vehiculo_modelo"
                                                            type="text"
                                                            placeholder="Ej: Versa, Hilux, Aveo..."
                                                            value={data.vehiculo_modelo}
                                                            onChange={(e) => setData('vehiculo_modelo', e.target.value)}
                                                            className="text-xs bg-white dark:bg-slate-900 border-slate-300 focus:ring-amber-500"
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="vehiculo_anio" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                            Año
                                                        </Label>
                                                        <Input
                                                            id="vehiculo_anio"
                                                            type="text"
                                                            placeholder="Ej: 2023"
                                                            value={data.vehiculo_anio}
                                                            onChange={(e) => setData('vehiculo_anio', e.target.value)}
                                                            className="text-xs bg-white dark:bg-slate-900 border-slate-300 font-mono focus:ring-amber-500"
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="vehiculo_placa" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                            Placa del Vehículo <span className="text-rose-500">*</span>
                                                        </Label>
                                                        <Input
                                                            id="vehiculo_placa"
                                                            type="text"
                                                            placeholder="Ej: ABC-123-A"
                                                            value={data.vehiculo_placa}
                                                            onChange={(e) => setData('vehiculo_placa', e.target.value.toUpperCase())}
                                                            className="text-xs bg-white dark:bg-slate-900 border-slate-300 font-mono uppercase font-bold focus:ring-amber-500"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Fotografías del Vehículo */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                                                    {/* Vehículo Frontal */}
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                                                            <span>Fotografía Frontal del Vehículo</span>
                                                            <span className="text-[10px] text-slate-400 font-normal">(Con placa visible)</span>
                                                        </Label>
                                                        <Card className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 p-5 bg-slate-50/60 dark:bg-slate-950 text-center relative overflow-hidden min-h-[160px] shadow-none">
                                                            {data.vehiculo_foto_frontal ? (
                                                                <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-md">
                                                                    <img src={data.vehiculo_foto_frontal.startsWith('data:') ? data.vehiculo_foto_frontal : `/storage/${data.vehiculo_foto_frontal}`} alt="Vehículo Frontal" className="w-full h-full object-cover" />
                                                                    <Button type="button" size="icon" variant="destructive" onClick={() => setData('vehiculo_foto_frontal', '')} className="absolute top-2 right-2 rounded-full h-7 w-7"><X className="w-4 h-4" /></Button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-3">
                                                                    <Car className="w-8 h-8 text-amber-500" />
                                                                    <span className="text-xs font-medium text-slate-500">Fotografía de la parte frontal del vehículo</span>
                                                                    <div className="flex gap-3">
                                                                        <Button type="button" onClick={() => setActiveCameraField('vehiculo_foto_frontal')} className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs">
                                                                            <Camera className="w-4 h-4 mr-1.5" /> Cámara
                                                                        </Button>
                                                                        <Label className="inline-flex items-center justify-center rounded-md text-xs font-bold transition-colors bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 px-4 py-2.5 cursor-pointer">
                                                                            <Upload className="w-4 h-4 mr-1.5" /> Archivo
                                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'vehiculo_foto_frontal')} />
                                                                        </Label>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Card>
                                                    </div>

                                                    {/* Vehículo Trasera */}
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                                                            <span>Fotografía Trasera del Vehículo</span>
                                                            <span className="text-[10px] text-slate-400 font-normal">(Con placa visible)</span>
                                                        </Label>
                                                        <Card className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 p-5 bg-slate-50/60 dark:bg-slate-950 text-center relative overflow-hidden min-h-[160px] shadow-none">
                                                            {data.vehiculo_foto_trasera ? (
                                                                <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-md">
                                                                    <img src={data.vehiculo_foto_trasera.startsWith('data:') ? data.vehiculo_foto_trasera : `/storage/${data.vehiculo_foto_trasera}`} alt="Vehículo Trasero" className="w-full h-full object-cover" />
                                                                    <Button type="button" size="icon" variant="destructive" onClick={() => setData('vehiculo_foto_trasera', '')} className="absolute top-2 right-2 rounded-full h-7 w-7"><X className="w-4 h-4" /></Button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-3">
                                                                    <Car className="w-8 h-8 text-amber-500" />
                                                                    <span className="text-xs font-medium text-slate-500">Fotografía de la parte trasera del vehículo</span>
                                                                    <div className="flex gap-3">
                                                                        <Button type="button" onClick={() => setActiveCameraField('vehiculo_foto_trasera')} className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs">
                                                                            <Camera className="w-4 h-4 mr-1.5" /> Cámara
                                                                        </Button>
                                                                        <Label className="inline-flex items-center justify-center rounded-md text-xs font-bold transition-colors bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 px-4 py-2.5 cursor-pointer">
                                                                            <Upload className="w-4 h-4 mr-1.5" /> Archivo
                                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'vehiculo_foto_trasera')} />
                                                                        </Label>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Card>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })()}

                            {/* 4. SECCIÓN: ACOMPAÑANTES DE INGRESO */}
                            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                    <span className="flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600" /> 4. Acompañantes que Accederán a las instalaciones</span>
                                    <span className="text-xs text-slate-500 font-normal">({data.acompanantes.length} seleccionados)</span>
                                </label>

                                {/* Muestrario de Empleados del Proveedor si existen */}
                                {((invitacion.proveedor?.empleados && invitacion.proveedor.empleados.length > 0) || (invitacion.productor?.empleados && invitacion.productor.empleados.length > 0)) && (
                                    <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-emerald-600" />
                                                Empleados Registrados de {invitacion.proveedor?.nombre_comercial || invitacion.proveedor?.razon_social || invitacion.productor?.nombre_comercial || 'la Empresa Proveedora'}
                                            </span>
                                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                                                {(invitacion.proveedor?.empleados || invitacion.productor?.empleados || []).length} Empleados
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                            Haga clic en los empleados que acompañarán al conductor e ingresarán a las instalaciones:
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                            {(invitacion.proveedor?.empleados || invitacion.productor?.empleados || []).map((emp: any) => {
                                                const nombreEmp = `${emp.nombres} ${emp.apellidos}`.trim();
                                                const docEmp = emp.documento_identidad || '';
                                                const isSelected = data.acompanantes.some(ac => ac.nombre === nombreEmp || (docEmp && ac.documento === docEmp));

                                                const toggleEmp = () => {
                                                    if (isSelected) {
                                                        setData('acompanantes', data.acompanantes.filter(ac => ac.nombre !== nombreEmp && ac.documento !== docEmp));
                                                    } else {
                                                        const cargoText = typeof emp.cargo === 'string'
                                                            ? emp.cargo
                                                            : (emp.cargo?.nombre || emp.puesto || '');

                                                        const fotoCarnet = emp.foto_carnet || emp.foto_empleado || emp.foto || '';
                                                        const docFrontal = emp.documento_frontal || emp.doc_foto_frontal || '';
                                                        const docTrasera = emp.documento_reverso || emp.doc_foto_trasera || '';
                                                        const docIdentidad = emp.documento_identidad || emp.curp || emp.documento || '';

                                                        setData('acompanantes', [
                                                            ...data.acompanantes,
                                                            {
                                                                nombres: emp.nombres || '',
                                                                apellidos: emp.apellidos || '',
                                                                nombre: nombreEmp,
                                                                curp: docIdentidad,
                                                                documento: docIdentidad || docEmp,
                                                                genero: emp.genero || '',
                                                                fecha_nacimiento: emp.fecha_nacimiento || '',
                                                                edad: emp.edad || '',
                                                                correo: emp.correo || emp.email || '',
                                                                cargo: cargoText,
                                                                foto_carnet: fotoCarnet,
                                                                doc_foto_frontal: docFrontal,
                                                                doc_foto_trasera: docTrasera,
                                                            }
                                                        ]);
                                                    }
                                                };

                                                return (
                                                    <button
                                                        key={emp.id}
                                                        type="button"
                                                        onClick={toggleEmp}
                                                        className={`p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between gap-3 cursor-pointer ${isSelected
                                                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400'
                                                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden font-bold text-xs ${isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                                                                }`}>
                                                                {formatImageUrl(emp.foto_carnet || emp.foto_empleado || emp.foto) ? (
                                                                    <img src={formatImageUrl(emp.foto_carnet || emp.foto_empleado || emp.foto)!} alt={nombreEmp} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <User className="w-4 h-4" />
                                                                )}
                                                            </div>
                                                            <div className="space-y-0.5 truncate">
                                                                <div className="font-bold text-xs truncate">{nombreEmp}</div>
                                                                <div className={`text-[10px] font-mono ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                                                                    Doc: {docEmp || 'S/N'} {typeof emp.cargo === 'string' ? `| ${emp.cargo}` : (emp.cargo?.nombre ? `| ${emp.cargo.nombre}` : '')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${isSelected ? 'bg-white text-emerald-700 border-white' : 'border-slate-300 dark:border-slate-700 text-slate-400'
                                                            }`}>
                                                            {isSelected ? <Check className="w-4 h-4 font-bold" /> : <Plus className="w-3.5 h-3.5" />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
                                        <div>
                                            <span className="font-extrabold text-xs text-emerald-900 dark:text-emerald-300 block">¿Ingresa con un acompañante no registrado?</span>
                                            <span className="text-[11px] text-slate-500">Registre los datos completos, identificación y fotografías del acompañante.</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsAcompananteModalOpen(true)}
                                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-sm shrink-0 transition-transform active:scale-95"
                                        >
                                            <Plus className="w-4 h-4" /> Registrar Nuevo Acompañante
                                        </button>
                                    </div>

                                    {data.acompanantes.length > 0 && (
                                        <div className="grid grid-cols-1 gap-3 pt-2">
                                            {data.acompanantes.map((ac, idx) => {
                                                const foto = ac.foto_carnet || (ac as any).foto_empleado || (ac as any).foto;
                                                const curpDoc = ac.curp || ac.documento || (ac as any).documento_identidad;
                                                const docFrontal = ac.doc_foto_frontal || (ac as any).documento_frontal;
                                                const docTrasera = ac.doc_foto_trasera || (ac as any).documento_reverso;
                                                const email = ac.correo || (ac as any).email;

                                                return (
                                                    <Card key={idx} className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                                                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                            <div className="relative group w-12 h-12 shrink-0">
                                                                <Avatar className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs">
                                                                    {formatImageUrl(foto) && (
                                                                        <AvatarImage src={formatImageUrl(foto)!} alt={ac.nombre} className="object-cover" />
                                                                    )}
                                                                    <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-400">
                                                                        <User className="w-6 h-6 text-slate-400" />
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                {!foto && (
                                                                    <Button
                                                                        type="button"
                                                                        size="icon"
                                                                        onClick={() => setActiveCameraField(`ac_list_foto_carnet_idx_${idx}`)}
                                                                        className="absolute inset-0 w-full h-full rounded-2xl bg-emerald-600/85 hover:bg-emerald-600 text-white flex items-center justify-center transition-opacity"
                                                                        title="Tomar fotografía del rostro"
                                                                    >
                                                                        <Camera className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                            </div>

                                                            <div className="space-y-1 min-w-0 flex-1">
                                                                <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm truncate">
                                                                    {ac.nombre || `${ac.nombres || ''} ${ac.apellidos || ''}`.trim()}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                                                    {curpDoc && (
                                                                        <Badge variant="outline" className="font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                                                                            CURP/Doc: {curpDoc}
                                                                        </Badge>
                                                                    )}
                                                                    {ac.genero && <span className="font-medium">Género: {ac.genero}</span>}
                                                                    {ac.edad && <span className="font-medium">Edad: {ac.edad} años</span>}
                                                                    {ac.cargo && <span className="font-medium text-emerald-600 dark:text-emerald-400">| Cargo: {ac.cargo}</span>}
                                                                </div>
                                                                {email && <div className="text-[11px] text-slate-400">Correo: {email}</div>}

                                                                {/* Badges de Documentos y Fotografía de Rostro faltantes */}
                                                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                                                    {/* Rostro faltante */}
                                                                    {!foto && (
                                                                        <div className="flex items-center gap-1">
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => setActiveCameraField(`ac_list_foto_carnet_idx_${idx}`)}
                                                                                className="h-7 text-[10px] bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 font-bold rounded-full px-2.5"
                                                                            >
                                                                                <Camera className="w-3 h-3 text-emerald-600 mr-1" /> + Foto Rostro
                                                                            </Button>
                                                                            <Label className="h-7 text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 rounded-full font-bold border border-slate-300 cursor-pointer flex items-center justify-center transition-colors">
                                                                                <Upload className="w-3 h-3" />
                                                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAcompananteListFileUpload(e, idx, 'foto_carnet')} />
                                                                            </Label>
                                                                        </div>
                                                                    )}

                                                                    {/* Doc Frontal */}
                                                                    {docFrontal ? (
                                                                        <Badge variant="outline" className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 font-bold rounded-full px-2.5 py-0.5">
                                                                            ✓ Doc. Frontal
                                                                        </Badge>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1">
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => setActiveCameraField(`ac_list_doc_foto_frontal_idx_${idx}`)}
                                                                                className="h-7 text-[10px] bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 font-bold rounded-full px-2.5"
                                                                                title="Tomar foto frontal del documento"
                                                                            >
                                                                                <Camera className="w-3 h-3 text-amber-600 mr-1" /> + Doc. Frontal
                                                                            </Button>
                                                                            <Label className="h-7 text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 rounded-full font-bold border border-slate-300 cursor-pointer flex items-center justify-center transition-colors">
                                                                                <Upload className="w-3 h-3" />
                                                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAcompananteListFileUpload(e, idx, 'doc_foto_frontal')} />
                                                                            </Label>
                                                                        </div>
                                                                    )}

                                                                    {/* Doc Reverso */}
                                                                    {docTrasera ? (
                                                                        <Badge variant="outline" className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 font-bold rounded-full px-2.5 py-0.5">
                                                                            ✓ Doc. Reverso
                                                                        </Badge>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1">
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => setActiveCameraField(`ac_list_doc_foto_trasera_idx_${idx}`)}
                                                                                className="h-7 text-[10px] bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 font-bold rounded-full px-2.5"
                                                                                title="Tomar foto trasera del documento"
                                                                            >
                                                                                <Camera className="w-3 h-3 text-amber-600 mr-1" /> + Doc. Reverso
                                                                            </Button>
                                                                            <Label className="h-7 text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 rounded-full font-bold border border-slate-300 cursor-pointer flex items-center justify-center transition-colors">
                                                                                <Upload className="w-3 h-3" />
                                                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAcompananteListFileUpload(e, idx, 'doc_foto_trasera')} />
                                                                            </Label>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setData('acompanantes', data.acompanantes.filter((_, i) => i !== idx))}
                                                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 h-8 w-8 shrink-0"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Botón de Enviar */}
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-[#104a29] hover:bg-[#0c371e] text-white text-sm font-extrabold py-6 rounded-2xl shadow-xl transition-transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    {processing ? 'Guardando Registro...' : 'Confirmar Datos y Activar Mi Pase QR'}
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* ═══════════════════════════════════════════════════════════
                        PASO 2: VISTA PASE DIGITAL CON CÓDIGO QR
                    ═══════════════════════════════════════════════════════════ */}
                    {activeView === 'pase' && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">

                            {invitacion.datos_acceso_completados ? (
                                <div className="text-center space-y-6">
                                    <div className="relative inline-block p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border-2 border-emerald-500/30">
                                        <img
                                            src={qrUrl}
                                            alt="Código QR de Acceso"
                                            className="w-64 h-64 mx-auto object-contain rounded-2xl"
                                        />
                                        {isIngresado && (
                                            <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center text-white p-4">
                                                <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-2 animate-bounce" />
                                                <span className="font-extrabold text-lg uppercase">¡Ingreso Registrado!</span>
                                                <span className="text-xs text-emerald-200 text-center">Bienvenido a las instalaciones</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Badges de Estado */}
                                    <div className="flex justify-center">
                                        {isPending ? (
                                            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-400 shadow-xs">
                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                                                PASE ACTIVO - MUESTRA EN GARITA DE SEGURIDAD
                                            </span>
                                        ) : isIngresado ? (
                                            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-extrabold bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-400">
                                                <CheckCircle2 className="w-4 h-4" />
                                                INGRESADO A INSTALACIONES
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-extrabold bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-400">
                                                <XCircle className="w-4 h-4" />
                                                PASE CANCELADO
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-3xl text-center space-y-4 max-w-md mx-auto">
                                    <Lock className="w-12 h-12 text-amber-600 mx-auto" />
                                    <h3 className="text-base font-extrabold text-amber-900 dark:text-amber-300">
                                        Pase QR no activado
                                    </h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        Debes completar tus datos de ingreso (Vehículo, Documentos, Acompañantes) para activar tu Pase QR.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setActiveView('registro')}
                                        className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs py-3 px-6 rounded-2xl shadow-md"
                                    >
                                        Completar Mis Datos de Ingreso
                                    </button>
                                </div>
                            )}

                            {/* Resumen de Información Registrada */}
                            <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4 text-xs">
                                <h3 className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-xs">
                                    Resumen de Registro de Visita
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                                        <span className="text-slate-400 font-medium block">Medio de Acceso</span>
                                        <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                            {invitacion.medio_acceso === 'vehicular' ? <Car className="w-4 h-4 text-amber-600" /> : <Footprints className="w-4 h-4 text-emerald-600" />}
                                            {invitacion.medio_acceso === 'vehicular' ? 'Vehicular' : 'Peatonal'}
                                        </span>
                                    </div>

                                    {invitacion.medio_acceso === 'vehicular' && (
                                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-1">
                                            <span className="text-amber-800 dark:text-amber-300 font-medium block">Placa del Vehículo</span>
                                            <span className="font-extrabold font-mono text-amber-900 dark:text-amber-200 text-sm">
                                                {invitacion.vehiculo_placa || 'No especificada'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {invitacion.acompanantes && invitacion.acompanantes.length > 0 && (
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Users className="w-4 h-4 text-emerald-600" /> Acompañantes ({invitacion.acompanantes.length})
                                        </span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {invitacion.acompanantes.map((ac, i) => (
                                                <div key={i} className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                                                    {ac.nombre} {ac.documento && <span className="text-slate-400 font-mono">({ac.documento})</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isPending && (
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setActiveView('registro')}
                                            className="w-full py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            <Edit3 className="w-4 h-4" /> Modificar Mis Datos de Registro
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                </main>

                {/* Footer Institucional Público */}
                <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 px-4 text-center text-xs text-slate-500 mt-auto">
                    <div className="max-w-4xl mx-auto space-y-1">
                        <p>© {new Date().getFullYear()} {invitacion.empresa?.razon_social || 'Control de Accesos'}. Todos los derechos reservados.</p>
                        <p className="text-[11px] text-slate-400">Presente este pase digital al llegar a la garita de seguridad.</p>
                    </div>
                </footer>
            </div>

            {/* ── Modal de Registro de Acompañante (Radix UI Dialog) ── */}
            <Dialog open={isAcompananteModalOpen} onOpenChange={setIsAcompananteModalOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl [&>button[data-slot=dialog-close]]:hidden">
                    {/* Header */}
                    <DialogHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
                        <DialogTitle className="text-lg font-extrabold text-[#104a29] dark:text-emerald-400 flex items-center gap-2">
                            <Users className="w-5 h-5" /> Registro Completo de Acompañante
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 mt-1">
                            Ingrese la información personal, identificación y fotografías del acompañante no registrado.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Modal Body */}
                    <form onSubmit={handleAddAcompanante} className="space-y-6 text-xs">

                        {/* Section 1: Datos Personales */}
                        <div className="space-y-4">
                            <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                                1. Datos Personales
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="font-bold text-slate-700 dark:text-slate-300">
                                        Nombres <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        required
                                        placeholder="Ej: Juan Antonio"
                                        value={nuevoAcompanante.nombres}
                                        onChange={(e) => setNuevoAcompanante(prev => ({ ...prev, nombres: e.target.value }))}
                                        className="w-full h-auto p-3 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="font-bold text-slate-700 dark:text-slate-300">
                                        Apellidos <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        required
                                        placeholder="Ej: Pérez Gómez"
                                        value={nuevoAcompanante.apellidos}
                                        onChange={(e) => setNuevoAcompanante(prev => ({ ...prev, apellidos: e.target.value }))}
                                        className="w-full h-auto p-3 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="font-bold text-slate-700 dark:text-slate-300">
                                        CURP / Documento ID
                                    </Label>
                                    <Input
                                        type="text"
                                        placeholder="Ej: PEGJ900101HDF..."
                                        value={nuevoAcompanante.curp}
                                        onChange={(e) => setNuevoAcompanante(prev => ({ ...prev, curp: e.target.value.toUpperCase(), documento: e.target.value.toUpperCase() }))}
                                        className="w-full h-auto p-3 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono uppercase"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="font-bold text-slate-700 dark:text-slate-300">Género</Label>
                                    <Select
                                        value={nuevoAcompanante.genero || undefined}
                                        onValueChange={(value) => setNuevoAcompanante(prev => ({ ...prev, genero: value }))}
                                    >
                                        <SelectTrigger className="w-full h-auto p-3 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                                            <SelectValue placeholder="Seleccione género..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Masculino">Masculino</SelectItem>
                                            <SelectItem value="Femenino">Femenino</SelectItem>
                                            <SelectItem value="Otro">Otro / Prefiero no decir</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="font-bold text-slate-700 dark:text-slate-300">Fecha de Nacimiento</Label>
                                    <Input
                                        type="date"
                                        value={nuevoAcompanante.fecha_nacimiento || ''}
                                        onChange={(e) => handleAcompananteFechaChange(e.target.value)}
                                        className="w-full h-auto p-3 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="font-bold text-slate-700 dark:text-slate-300">Edad (Años)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Ej: 30"
                                        value={nuevoAcompanante.edad || ''}
                                        onChange={(e) => setNuevoAcompanante(prev => ({ ...prev, edad: e.target.value }))}
                                        className="w-full h-auto p-3 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="font-bold text-slate-700 dark:text-slate-300">Correo Electrónico</Label>
                                    <Input
                                        type="email"
                                        placeholder="ejemplo@correo.com"
                                        value={nuevoAcompanante.correo}
                                        onChange={(e) => setNuevoAcompanante(prev => ({ ...prev, correo: e.target.value }))}
                                        className="w-full h-auto p-3 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="font-bold text-slate-700 dark:text-slate-300">Cargo (Solo si aplica)</Label>
                                    <Input
                                        type="text"
                                        placeholder="Ej: Asistente, Técnico..."
                                        value={nuevoAcompanante.cargo}
                                        onChange={(e) => setNuevoAcompanante(prev => ({ ...prev, cargo: e.target.value }))}
                                        className="w-full h-auto p-3 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Fotografía Tipo Carnet (Rostro) */}
                        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <Label className="font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                                2. Fotografía Tipo Carnet (Rostro del Acompañante)
                            </Label>

                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                {nuevoAcompanante.foto_carnet ? (
                                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-emerald-500 shrink-0">
                                        <img src={formatImageUrl(nuevoAcompanante.foto_carnet)!} alt="Foto Carnet" className="w-full h-full object-cover" />
                                        <Button type="button" variant="destructive" size="icon" onClick={() => setNuevoAcompanante(prev => ({ ...prev, foto_carnet: '' }))} className="absolute top-1 right-1 h-5 w-5 rounded-full shadow-md">
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                        <User className="w-8 h-8" />
                                    </div>
                                )}

                                <div className="space-y-2 flex-1">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Foto del Rostro del Acompañante</span>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            onClick={() => setActiveCameraField('ac_foto_carnet')}
                                            className="px-3 py-2 h-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs"
                                        >
                                            <Camera className="w-3.5 h-3.5" /> Cámara
                                        </Button>
                                        <Button type="button" variant="secondary" asChild className="px-3 py-2 h-auto rounded-xl font-bold text-xs cursor-pointer">
                                            <label>
                                                <Upload className="w-3.5 h-3.5" /> Subir
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAcompananteFileUpload(e, 'foto_carnet')} />
                                            </label>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Fotografías del Documento de Identidad */}
                        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <Label className="font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                                3. Fotografías del Documento de Identidad (INE / Cédula / Pasaporte)
                            </Label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Frontal Documento */}
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-600 dark:text-slate-400 text-[11px]">Foto Frontal</Label>
                                    <div className="flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950 min-h-[130px] relative">
                                        {nuevoAcompanante.doc_foto_frontal ? (
                                            <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden shadow-sm">
                                                <img src={formatImageUrl(nuevoAcompanante.doc_foto_frontal)!} alt="Doc Frontal" className="w-full h-full object-cover" />
                                                <Button type="button" variant="destructive" size="icon" onClick={() => setNuevoAcompanante(prev => ({ ...prev, doc_foto_frontal: '' }))} className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full shadow-md">
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText className="w-6 h-6 text-slate-400" />
                                                <div className="flex gap-2">
                                                    <Button type="button" onClick={() => setActiveCameraField('ac_doc_foto_frontal')} className="px-3 py-1.5 h-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px]">
                                                        <Camera className="w-3 h-3" /> Cámara
                                                    </Button>
                                                    <Button type="button" variant="secondary" asChild className="px-3 py-1.5 h-auto rounded-lg font-bold text-[11px] cursor-pointer">
                                                        <label>
                                                            <Upload className="w-3 h-3" /> Archivo
                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAcompananteFileUpload(e, 'doc_foto_frontal')} />
                                                        </label>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Reverso Documento */}
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-600 dark:text-slate-400 text-[11px]">Foto Reverso</Label>
                                    <div className="flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950 min-h-[130px] relative">
                                        {nuevoAcompanante.doc_foto_trasera ? (
                                            <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden shadow-sm">
                                                <img src={formatImageUrl(nuevoAcompanante.doc_foto_trasera)!} alt="Doc Trasero" className="w-full h-full object-cover" />
                                                <Button type="button" variant="destructive" size="icon" onClick={() => setNuevoAcompanante(prev => ({ ...prev, doc_foto_trasera: '' }))} className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full shadow-md">
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText className="w-6 h-6 text-slate-400" />
                                                <div className="flex gap-2">
                                                    <Button type="button" onClick={() => setActiveCameraField('ac_doc_foto_trasera')} className="px-3 py-1.5 h-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px]">
                                                        <Camera className="w-3 h-3" /> Cámara
                                                    </Button>
                                                    <Button type="button" variant="secondary" asChild className="px-3 py-1.5 h-auto rounded-lg font-bold text-[11px] cursor-pointer">
                                                        <label>
                                                            <Upload className="w-3 h-3" /> Archivo
                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAcompananteFileUpload(e, 'doc_foto_trasera')} />
                                                        </label>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Modal Action Buttons */}
                        <DialogFooter className="pt-4 border-t border-slate-200 dark:border-slate-800 gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAcompananteModalOpen(false)}
                                className="px-5 py-3 h-auto rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="px-6 py-3 h-auto rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md"
                            >
                                <Plus className="w-4 h-4" /> Agregar Acompañante
                            </Button>
                        </DialogFooter>

                        {/* Camera Widget Overlay inside Modal for Acompañantes */}
                        {activeCameraField && activeCameraField.startsWith('ac_') && !activeCameraField.startsWith('ac_list_') && (
                            <CameraWidget
                                title={
                                    activeCameraField === 'ac_foto_carnet'
                                        ? 'Fotografía del Rostro del Acompañante'
                                        : activeCameraField.includes('frontal')
                                            ? 'Fotografía Frontal del Documento del Acompañante'
                                            : 'Fotografía Reverso del Documento del Acompañante'
                                }
                                faceGuide={activeCameraField === 'ac_foto_carnet'}
                                docGuide={activeCameraField.includes('doc_foto')}
                                onCapture={(base64) => {
                                    const field = activeCameraField.replace('ac_', '');
                                    setNuevoAcompanante(prev => ({ ...prev, [field]: base64 }));
                                    setActiveCameraField(null);
                                }}
                                onCancel={() => setActiveCameraField(null)}
                            />
                        )}
                    </form>
                </DialogContent>
            </Dialog>

            {/* Camera Widget Overlay for Main Form and Acompañantes List */}
            {activeCameraField && (!activeCameraField.startsWith('ac_') || activeCameraField.startsWith('ac_list_')) && (
                <CameraWidget
                    title={
                        activeCameraField.includes('foto_carnet')
                            ? 'Fotografía del Rostro'
                            : activeCameraField.includes('doc_foto')
                                ? activeCameraField.includes('frontal')
                                    ? 'Fotografía Frontal del Documento'
                                    : 'Fotografía Reverso del Documento'
                                : 'Capturar Fotografía'
                    }
                    faceGuide={activeCameraField.includes('foto_carnet')}
                    docGuide={activeCameraField.includes('doc_foto')}
                    onCapture={(base64) => {
                        if (activeCameraField.startsWith('ac_list_')) {
                            const parts = activeCameraField.replace('ac_list_', '').split('_idx_');
                            const field = parts[0];
                            const index = parseInt(parts[1], 10);
                            const updated = [...data.acompanantes];
                            if (updated[index]) {
                                updated[index] = { ...updated[index], [field]: base64 };
                                setData('acompanantes', updated);
                            }
                        } else {
                            setData(activeCameraField as any, base64);
                        }
                        setActiveCameraField(null);
                    }}
                    onCancel={() => setActiveCameraField(null)}
                />
            )}
        </>
    );
}

// Prevenir layout persistente de admin dashboard si existiera
PaseDigital.layout = (page: React.ReactNode) => page;
