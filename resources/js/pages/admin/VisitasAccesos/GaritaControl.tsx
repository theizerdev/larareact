import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    ShieldCheck,
    QrCode,
    Search,
    Camera,
    User,
    Building,
    Calendar,
    Clock,
    Car,
    Footprints,
    CheckCircle2,
    XCircle,
    Users,
    FileText,
    Maximize2,
    X,
    Send,
    LogOut,
    Check,
    AlertCircle,
    ArrowRight,
    Sparkles,
    RefreshCw,
    SwitchCamera,
    Video,
    Volume2,
    Shield,
    AlertTriangle,
    MessageSquare,
    CheckCircle,
    Eye,
    Upload,
    Plus,
    Scan
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogPortal,
    DialogOverlay,
} from '@/components/ui/dialog';
import { ModuleHeader } from '@/components/module-header';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { useTranslate } from '@/hooks/use-translate';

const formatImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    if (url.startsWith('/storage/')) {
        return url;
    }
    if (url.startsWith('storage/')) {
        return `/${url}`;
    }
    return `/storage/${url.replace(/^\/+/, '')}`;
};

interface Acompanante {
    nombre: string;
    documento?: string;
}

interface GaritaProps {
    searchQuery?: string;
    resultado?: {
        tipo: 'invitacion' | 'acceso' | 'empleado';
        data: any;
        acceso_existente?: any;
    } | null;
    visitasEsperadas?: any[];
    siguienteCodigo?: number;
    timezone?: string;
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

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            const videoInputs = devices.filter(d => d.kind === 'videoinput');
            setHasMultipleCameras(videoInputs.length > 1);
        }).catch(() => setHasMultipleCameras(false));
    }, []);

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
                }
            }, 400);
        } else if (faceGuide) {
            setFaceStatus('searching');
        }

        return () => {
            if (detectionIntervalRef.current) { clearInterval(detectionIntervalRef.current); detectionIntervalRef.current = null; }
        };
    }, [faceGuide, stream, captured]);

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

    useEffect(() => {
        if (faceStatus === 'countdown' && !captured) {
            setCountdown(3);
            countdownIntervalRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
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

export default function GaritaControl({
    searchQuery = '',
    resultado = null,
    visitasEsperadas = [],
    siguienteCodigo = 80000001,
    timezone = 'America/Mexico_City',
}: GaritaProps) {
    const { __ } = useTranslate();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const [query, setQuery] = useState(searchQuery);
    const [isScanningCamera, setIsScanningCamera] = useState(false);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState<string>('');
    const [activeImageModal, setActiveImageModal] = useState<string | null>(null);
    const [activeCameraField, setActiveCameraField] = useState<string | null>(null);

    // Estado para Autorización en Tiempo Real vía WhatsApp (Garita Empleados)
    const [activeAuthToken, setActiveAuthToken] = useState<string | null>(null);
    const [autorizacionRecibida, setAutorizacionRecibida] = useState<{
        status: string;
        motivo: string;
        responsable: string;
    } | null>(null);
    const [medioAcceso, setMedioAcceso] = useState<'peatonal' | 'vehicular'>('peatonal');
    const [selectedVehiculoMode, setSelectedVehiculoMode] = useState<'registrado' | 'nuevo'>('registrado');
    const [empleadoVehiculoId, setEmpleadoVehiculoId] = useState<string>('');
    const [proveedorVehiculoId, setProveedorVehiculoId] = useState<string>('');
    const [productorVehiculoId, setProductorVehiculoId] = useState<string>('');
    const [nuevoVehiculoPlaca, setNuevoVehiculoPlaca] = useState<string>('');
    const [nuevoVehiculoMarca, setNuevoVehiculoMarca] = useState<string>('');
    const [nuevoVehiculoModelo, setNuevoVehiculoModelo] = useState<string>('');
    const [nuevoVehiculoTipo, setNuevoVehiculoTipo] = useState<string>('Auto');
    const [nuevoVehiculoFotoFrontal, setNuevoVehiculoFotoFrontal] = useState<string>('');
    const [nuevoVehiculoFotoTrasera, setNuevoVehiculoFotoTrasera] = useState<string>('');

    // Estado para Acompañantes en Ingreso de Empleados por Garita
    const [acompanantesList, setAcompanantesList] = useState<Array<{ nombre: string; documento?: string; telefono?: string; observacion?: string; foto_carnet?: string; doc_foto_frontal?: string; doc_foto_trasera?: string }>>([]);
    const [isAcompananteModalOpen, setIsAcompananteModalOpen] = useState(false);
    const [selectedAcompananteDetail, setSelectedAcompananteDetail] = useState<any | null>(null);
    const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>('');
    const [nuevoAcompanante, setNuevoAcompanante] = useState({
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
        observacion: '',
        foto_carnet: '',
        doc_foto_frontal: '',
        doc_foto_trasera: '',
    });

    const handleAcompananteFechaChange = (fechaStr: string) => {
        let edadCalculada = '';
        if (fechaStr) {
            const birth = new Date(fechaStr);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            if (age >= 0 && age < 120) {
                edadCalculada = String(age);
            }
        }
        setNuevoAcompanante((prev) => ({
            ...prev,
            fecha_nacimiento: fechaStr,
            edad: edadCalculada,
        }));
    };

    const handleAcompananteFileUpload = (
        e: React.ChangeEvent<HTMLInputElement>,
        field: 'foto_carnet' | 'doc_foto_frontal' | 'doc_foto_trasera'
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setNuevoAcompanante((prev) => ({ ...prev, [field]: event.target!.result as string }));
            }
        };
        reader.readAsDataURL(file);
    };

    const vehiculoFrontalInputRef = useRef<HTMLInputElement>(null);
    const vehiculoTraseraInputRef = useRef<HTMLInputElement>(null);

    const handleVehicleImageUpload = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: React.Dispatch<React.SetStateAction<string>>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setter(event.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    // Auto-selección inicial de vehículo y reseteo de acompañantes
    useEffect(() => {
        if (resultado?.data) {
            const rawAcompanantes = resultado.data.acompanantes || [];
            const formattedAcompanantes = Array.isArray(rawAcompanantes)
                ? rawAcompanantes.map((ac: any) => ({
                    nombre: ac.nombre || `${ac.nombres || ''} ${ac.apellidos || ''}`.trim() || 'Acompañante',
                    documento: ac.documento || ac.documento_identidad || ac.curp || '',
                    telefono: ac.telefono || ac.telefono_contacto || ac.correo || '',
                    observacion: ac.observacion || ac.cargo || '',
                    ...ac,
                }))
                : [];
            setAcompanantesList(formattedAcompanantes);
            setNuevoAcompanante({ nombre: '', documento: '', telefono: '', observacion: '' });
            setIsAcompananteModalOpen(false);
            const vehs = resultado.data.vehiculos || [];
            if (vehs.length > 0) {
                setMedioAcceso('vehicular');
                setSelectedVehiculoMode('registrado');
                setEmpleadoVehiculoId(String(vehs[0].id));
                setProveedorVehiculoId(String(vehs[0].id));
                setProductorVehiculoId(String(vehs[0].id));
            } else {
                setMedioAcceso('peatonal');
                setSelectedVehiculoMode('nuevo');
                setEmpleadoVehiculoId('');
                setProveedorVehiculoId('');
                setProductorVehiculoId('');
            }
        }
    }, [resultado]);

    const formatImageUrl = (url: string | null | undefined): string | null => {
        if (!url) return null;
        if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        const cleanUrl = url.replace(/^\/?(storage\/)+/, '');
        return `/storage/${cleanUrl}`;
    };

    // Reloj en vivo para la tablet de garita según la zona horaria oficial de la sucursal
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            try {
                setCurrentTime(
                    now.toLocaleTimeString('es-ES', {
                        timeZone: timezone,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    })
                );
            } catch (err) {
                setCurrentTime(
                    now.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    })
                );
            }
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, [timezone]);

    // Auto-focus en buscador para lectores físicos
    useEffect(() => {
        if (searchInputRef.current && !isScanningCamera) {
            searchInputRef.current.focus();
        }
    }, [isScanningCamera]);

    // Sonido de escaneo exitoso
    const playScanBeep = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) {
            // Ignorar errores de contexto de audio
        }
    };

    // Procesar texto escaneado por cámara
    const handleProcessScannedCode = (scannedText: string) => {
        let clean = scannedText.trim();
        if (clean.includes('/pase-digital/')) {
            const parts = clean.split('/pase-digital/');
            clean = parts[parts.length - 1];
        }
        stopCameraScanner();
        setQuery(clean);
        router.get('/admin/visitas-accesos/garita', { q: clean }, { preserveState: true });
    };

    // Cargar jsQR dinámicamente si el navegador no tiene BarcodeDetector nativo
    useEffect(() => {
        if (typeof window !== 'undefined' && !('BarcodeDetector' in window) && !(window as any).jsQR) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
            script.async = true;
            document.head.appendChild(script);
        }
    }, []);

    // Escáner Físico USB/Bluetooth HID Global (Lector de garita tipo pistola/tablet)
    useEffect(() => {
        let buffer = '';
        let lastKeyTime = Date.now();

        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElem = document.activeElement;
            const isTypingInOtherInput = activeElem && (activeElem.tagName === 'TEXTAREA' || (activeElem.tagName === 'INPUT' && activeElem !== searchInputRef.current));

            if (isTypingInOtherInput) return;
            if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;

            const now = Date.now();
            const timeDiff = now - lastKeyTime;
            lastKeyTime = now;

            if (timeDiff > 120 && buffer.length > 0 && e.key !== 'Enter') {
                buffer = '';
            }

            if (e.key === 'Enter') {
                if (buffer.length >= 4) {
                    e.preventDefault();
                    let clean = buffer.trim();
                    if (clean.includes('/pase-digital/')) {
                        const parts = clean.split('/pase-digital/');
                        clean = parts[parts.length - 1];
                    }
                    playScanBeep();
                    setQuery(clean);
                    router.get('/admin/visitas-accesos/garita', { q: clean }, { preserveState: true });
                    buffer = '';
                }
            } else if (e.key.length === 1) {
                buffer += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Efecto de cámara en vivo (Escaneo Omnidireccional 360° en 100% de la pantalla sin marco)
    useEffect(() => {
        let animationFrameId: number;
        let active = true;

        if (isScanningCamera) {
            setCameraError(null);
            navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
            })
                .then((stream) => {
                    if (!active) {
                        stream.getTracks().forEach(t => t.stop());
                        return;
                    }
                    setCameraStream(stream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.setAttribute('playsinline', 'true');
                        videoRef.current.play().catch(() => { });
                    }

                    // Detección nativa con BarcodeDetector API (soporta Android, Chrome, Edge, Safari 17+)
                    const hasBarcodeDetector = 'BarcodeDetector' in window;
                    let detector: any = null;
                    if (hasBarcodeDetector) {
                        try {
                            detector = new (window as any).BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39'] });
                        } catch (e) {
                            detector = null;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });

                    const scanFrame = async () => {
                        if (!active || !videoRef.current) return;
                        const video = videoRef.current;

                        if (video.readyState === video.HAVE_ENOUGH_DATA) {
                            // 1. Detección por BarcodeDetector (si disponible) en todo el campo visual
                            if (detector) {
                                try {
                                    const barcodes = await detector.detect(video);
                                    if (barcodes && barcodes.length > 0) {
                                        const detectedRaw = barcodes[0].rawValue;
                                        if (detectedRaw) {
                                            playScanBeep();
                                            handleProcessScannedCode(detectedRaw);
                                            return;
                                        }
                                    }
                                } catch (err) {
                                    // Ignorar frame en error
                                }
                            }

                            // 2. Detección por jsQR en 100% del cuadro de imagen (Escaneo omnidireccional sin marco)
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
                                        playScanBeep();
                                        handleProcessScannedCode(code.data);
                                        return;
                                    }
                                }
                            }
                        }
                        animationFrameId = requestAnimationFrame(scanFrame);
                    };

                    animationFrameId = requestAnimationFrame(scanFrame);
                })
                .catch((err) => {
                    console.error('Camera access error:', err);
                    setCameraError(__('No se pudo acceder a la cámara. Verifique los permisos en su navegador o tablet.'));
                });
        } else {
            if (cameraStream) {
                cameraStream.getTracks().forEach(t => t.stop());
                setCameraStream(null);
            }
        }

        return () => {
            active = false;
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (cameraStream) {
                cameraStream.getTracks().forEach(t => t.stop());
            }
        };
    }, [isScanningCamera, facingMode]);

    const stopCameraScanner = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            setCameraStream(null);
        }
        setIsScanningCamera(false);
    };

    const toggleCameraFacing = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            setCameraStream(null);
        }
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        let cleanQuery = query.trim();
        if (cleanQuery.includes('/pase-digital/')) {
            const parts = cleanQuery.split('/pase-digital/');
            cleanQuery = parts[parts.length - 1];
        }

        router.get('/admin/visitas-accesos/garita', { q: cleanQuery }, { preserveState: true });
    };

    const handleSelectEsperada = (uuidOrCodigo: string) => {
        setQuery(uuidOrCodigo);
        router.get('/admin/visitas-accesos/garita', { q: uuidOrCodigo }, { preserveState: true });
    };

    // Confirmar ingreso oficial en Garita (1-Clic)
    const handleConfirmIngreso = (invitacionId: number) => {
        playScanBeep();
        const payload: any = {};
        if (acompanantesList.length > 0) {
            payload.acompanantes = acompanantesList;
        }
        router.post(`/admin/visitas-accesos/invitaciones/${invitacionId}/canjear`, payload, {
            preserveScroll: true,
            onSuccess: () => {
                notifySuccess(__('¡Ingreso registrado correctamente en Caseta! Se notificó al anfitrión por WhatsApp.'));
            },
            onError: () => {
                notifyError(__('Ocurrió un error al registrar el ingreso. Intente nuevamente.'));
            }
        });
    };

    // Polling en vivo para detectar cuando el Responsable presione "Autorizar" en su pantalla
    useEffect(() => {
        if (!activeAuthToken || autorizacionRecibida?.status === 'autorizado') return;

        const interval = setInterval(() => {
            fetch(`/api/autorizar-acceso/${activeAuthToken}/check`)
                .then((res) => res.json())
                .then((resData) => {
                    if (resData.found && resData.status === 'autorizado') {
                        setAutorizacionRecibida({
                            status: 'autorizado',
                            motivo: resData.motivo_autorizacion || '',
                            responsable: resData.responsable_nombre || '',
                        });
                        notifySuccess(__('¡El Responsable ') + (resData.responsable_nombre || '') + __(' autorizó el ingreso desde WhatsApp!'));
                    }
                })
                .catch((err) => console.error(err));
        }, 3000);

        return () => clearInterval(interval);
    }, [activeAuthToken, autorizacionRecibida]);

    const handleSolicitarWhatsappGarita = async (empNombre: string, empDoc: string, respId: number, empId: number) => {
        try {
            const response = await fetch('/admin/visitas-accesos/solicitar-autorizacion-whatsapp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    responsable_id: respId,
                    empleado_id: empId,
                    empleado_nombre: empNombre,
                    empleado_documento: empDoc,
                    es_acompanante: false,
                }),
            });

            const resData = await response.json();
            if (resData.success && resData.token) {
                setActiveAuthToken(resData.token);
                notifySuccess(__('Solicitud de autorización enviada vía WhatsApp al responsable ') + (resData.responsable_nombre || ''));
            } else {
                notifyError(resData.message || __('No se pudo enviar la solicitud por WhatsApp.'));
            }
        } catch (e) {
            console.error(e);
            notifyError(__('Ocurrió un error al enviar la solicitud de autorización.'));
        }
    };

    const handleRegistrarIngresoEmpleadoGarita = (empId: number, respId: number) => {
        playScanBeep();
        const payload: any = {
            tipo_acceso: 'empleado',
            empleado_id: empId,
            responsable_id: respId,
            medio_acceso: medioAcceso,
            observaciones: autorizacionRecibida
                ? `Autorizado Fuera de Horario por ${autorizacionRecibida.responsable}: ${autorizacionRecibida.motivo}`
                : 'Ingreso directo por Garita (Horario Habitual)',
        };

        if (medioAcceso === 'vehicular') {
            if (selectedVehiculoMode === 'registrado' && empleadoVehiculoId) {
                payload.empleado_vehiculo_id = empleadoVehiculoId;
            } else {
                payload.vehiculo_placa = nuevoVehiculoPlaca;
                payload.vehiculo_marca = nuevoVehiculoMarca;
                payload.vehiculo_modelo = nuevoVehiculoModelo;
                payload.vehiculo_tipo = nuevoVehiculoTipo;
                if (nuevoVehiculoFotoFrontal) {
                    payload.vehiculo_foto_frontal = nuevoVehiculoFotoFrontal;
                }
                if (nuevoVehiculoFotoTrasera) {
                    payload.vehiculo_foto_trasera = nuevoVehiculoFotoTrasera;
                }
            }
        }

        if (acompanantesList.length > 0) {
            payload.acompanantes = acompanantesList;
        }

        router.post('/admin/visitas-accesos', payload, {
            preserveScroll: true,
            onSuccess: () => {
                notifySuccess(__('Ingreso de Empleado registrado correctamente en Caseta.'));
            },
        });
    };

    const handleRegistrarIngresoProveedorGarita = (tipoAcceso: 'proveedor' | 'productor') => {
        playScanBeep();
        const payload: any = {
            tipo_acceso: tipoAcceso,
            medio_acceso: medioAcceso,
            observaciones: 'Ingreso directo por Garita mediante Gafete Autorizado',
        };

        if (resultado?.tipo === 'proveedor') {
            payload.proveedor_id = record.id;
        } else if (resultado?.tipo === 'proveedor_empleado') {
            payload.proveedor_id = record.proveedor_id;
            payload.proveedor_empleado_id = record.id;
        } else if (resultado?.tipo === 'productor') {
            payload.productor_id = record.id;
        } else if (resultado?.tipo === 'productor_empleado') {
            payload.productor_id = record.productor_id;
            payload.productor_empleado_id = record.id;
        }

        if (medioAcceso === 'vehicular') {
            if (selectedVehiculoMode === 'registrado') {
                if (proveedorVehiculoId) payload.proveedor_vehiculo_id = proveedorVehiculoId;
                if (productorVehiculoId) payload.productor_vehiculo_id = productorVehiculoId;
            } else {
                payload.vehiculo_placa = nuevoVehiculoPlaca;
                payload.vehiculo_marca = nuevoVehiculoMarca;
                payload.vehiculo_modelo = nuevoVehiculoModelo;
                payload.vehiculo_tipo = nuevoVehiculoTipo;
                if (nuevoVehiculoFotoFrontal) payload.vehiculo_foto_frontal = nuevoVehiculoFotoFrontal;
                if (nuevoVehiculoFotoTrasera) payload.vehiculo_foto_trasera = nuevoVehiculoFotoTrasera;
            }
        }

        if (acompanantesList.length > 0) {
            payload.acompanantes = acompanantesList;
        }

        router.post('/admin/visitas-accesos', payload, {
            preserveScroll: true,
            onSuccess: () => {
                notifySuccess(__('Ingreso registrado correctamente en Caseta.'));
            },
        });
    };

    const isInvitacion = resultado?.tipo === 'invitacion';
    const isAcceso = resultado?.tipo === 'acceso';
    const isEmpleado = resultado?.tipo === 'empleado';
    const isProveedor = resultado?.tipo === 'proveedor' || resultado?.tipo === 'proveedor_empleado';
    const isProductor = resultado?.tipo === 'productor' || resultado?.tipo === 'productor_empleado';
    const record = resultado?.data;
    const accesoExistente = resultado?.acceso_existente;

    const formatVisitorHeaderAndCompany = (rec: any, isInv: boolean, resTipo: string | undefined) => {
        if (!rec) return { primaryTitle: 'Visitante', companySubtitle: '' };

        // 1. Caso Colaborador / Empleado directo o Empleado de Contratista
        if (rec.nombres && rec.apellidos) {
            const name = `${rec.nombres} ${rec.apellidos}`.trim();
            const comp = rec.departamento?.nombre ||
                rec.proveedor?.nombre_comercial || rec.proveedor?.razon_social ||
                rec.productor?.nombre_comercial_rancho || rec.productor?.razon_social ||
                rec.visitante_empresa || '';
            return { primaryTitle: name, companySubtitle: comp };
        }

        // 2. Para Proveedores, Productores o Invitaciones Particulares
        let rawTitle = rec.visitante_nombre ||
            rec.nombre_comercial_rancho ||
            rec.nombre_comercial ||
            rec.razon_social ||
            (rec.proveedor ? (rec.proveedor.nombre_comercial || rec.proveedor.razon_social) : '') ||
            (rec.productor ? (rec.productor.nombre_comercial_rancho || rec.productor.razon_social) : '') ||
            'Visitante';

        let rawCompany = rec.visitante_empresa ||
            rec.proveedor?.nombre_comercial || rec.proveedor?.razon_social ||
            rec.productor?.nombre_comercial_rancho || rec.productor?.razon_social || '';

        // Si rawTitle tiene el patrón de texto "Nombre Principal (Nombre Comercial)"
        const match = rawTitle.match(/^(.*?)\s*\((.*?)\)$/);
        if (match) {
            const legalName = match[1].trim();
            const commercialName = match[2].trim();

            rawTitle = legalName;
            if (!rawCompany || rawCompany.toLowerCase() === commercialName.toLowerCase() || rawCompany.toLowerCase() === legalName.toLowerCase()) {
                rawCompany = commercialName;
            }
        }

        // Evitar redundancia si el título y la empresa son idénticos
        if (rawTitle.toLowerCase() === rawCompany.toLowerCase()) {
            rawCompany = '';
        }

        return {
            primaryTitle: rawTitle,
            companySubtitle: rawCompany
        };
    };

    const visitorInfo = formatVisitorHeaderAndCompany(record, isInvitacion, resultado?.tipo);

    const empleadosDisponibles = React.useMemo(() => {
        if (!record) return [];
        let list: any[] = [];
        if (record.empleados && Array.isArray(record.empleados)) {
            list = record.empleados;
        } else if (record.proveedor?.empleados && Array.isArray(record.proveedor.empleados)) {
            list = record.proveedor.empleados;
        } else if (record.productor?.empleados && Array.isArray(record.productor.empleados)) {
            list = record.productor.empleados;
        } else if (record.proveedor_empleado?.proveedor?.empleados && Array.isArray(record.proveedor_empleado.proveedor.empleados)) {
            list = record.proveedor_empleado.proveedor.empleados;
        } else if (record.proveedorEmpleado?.proveedor?.empleados && Array.isArray(record.proveedorEmpleado.proveedor.empleados)) {
            list = record.proveedorEmpleado.proveedor.empleados;
        } else if (record.productor_empleado?.productor?.empleados && Array.isArray(record.productor_empleado.productor.empleados)) {
            list = record.productor_empleado.productor.empleados;
        } else if (record.productorEmpleado?.productor?.empleados && Array.isArray(record.productorEmpleado.productor.empleados)) {
            list = record.productorEmpleado.productor.empleados;
        }
        return list;
    }, [record]);

    // Validación de Jornada Laboral de Empleado para hoy
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const hoyNombre = diasSemana[new Date().getDay()];

    const isDiaActivo = (j: any) => {
        if (!j) return false;
        return j.activo === true || j.activo === 1 || j.activo === '1' || j.activo === 'true';
    };

    const jornadaLaboralItems = isEmpleado ? (record?.jornada_laboral || record?.jornadaLaboral || []) : [];
    const jornadaHoy = Array.isArray(jornadaLaboralItems)
        ? jornadaLaboralItems.find((j: any) => j.dia && j.dia.toLowerCase() === hoyNombre.toLowerCase())
        : null;

    const autorizadoHabitual = Boolean(jornadaHoy && isDiaActivo(jornadaHoy));
    const autorizadoHoy = autorizadoHabitual || autorizacionRecibida?.status === 'autorizado';

    return (
        <>
            <Head title={__('Control de Caseta - Lectura de QR')} />

            <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-12">

                {/* ── BARRA SUPERIOR DE CONTROL PARA TABLET EN GARITA ── */}
                <header className="sticky top-0 z-40 bg-[#104a29] text-white border-b border-[#0d3b20] px-4 py-3 sm:px-8 sm:py-4 shadow-lg">
                    <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-black/20 border border-white/10 rounded-2xl shrink-0">
                                <ShieldCheck className="h-7 w-7 text-emerald-300" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                                        {__("DRISCOLL'S • CONTROL DE GARITA")}
                                    </h1>
                                    <Badge className="bg-emerald-400 text-emerald-950 font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 border-0">
                                        {__('🟢 Lector Activo')}
                                    </Badge>
                                </div>
                                <p className="text-xs text-white/80 font-medium">
                                    {__('Terminal de Seguridad para Escaneo de Códigos QR y Validación de Accesos')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {currentTime && (
                                <div className="hidden md:flex items-center gap-2 bg-black/20 border border-white/20 px-3.5 py-1.5 rounded-xl font-mono text-emerald-200 text-xs font-bold shadow-inner">
                                    <Clock className="w-4 h-4 text-emerald-300 animate-pulse" />
                                    <span>{currentTime}</span>
                                    {timezone && (
                                        <span className="text-[10px] text-emerald-300/80 border-l border-white/20 pl-2 font-sans font-medium">
                                            {timezone}
                                        </span>
                                    )}
                                </div>
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get('/admin/visitas-accesos')}
                                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold rounded-xl gap-2 backdrop-blur-md"
                            >
                                <ArrowRight className="w-4 h-4 rotate-180" />
                                {__('Panel Admin')}
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">

                    {/* ── BARRA DE BÚSQUEDA Y ESCÁNER TIPO TERMINAL DE GARITA ── */}
                    <div className="bg-white border-2 border-[#104a29]/30 rounded-3xl p-5 shadow-lg space-y-4">
                        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1">
                                <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-[#104a29] pointer-events-none" />
                                <Input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder={__('Escanee código QR o busque por Código, Nombres, DNI o Placa...')}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="pl-13 h-14 w-full bg-slate-50 text-slate-900 text-base font-medium rounded-2xl border-slate-300 focus:border-[#104a29] focus:ring-2 focus:ring-[#104a29]/20"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    onClick={() => setIsScanningCamera(true)}
                                    className="h-14 px-5 bg-[#104a29] hover:bg-[#0c371e] text-white font-black text-sm rounded-2xl shadow-md gap-2 flex-1 md:flex-none"
                                >
                                    <Camera className="w-5 h-5 text-emerald-300" />
                                    {__('Escanear con Cámara')}
                                </Button>

                                <Button
                                    type="submit"
                                    className="h-14 px-7 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-sm rounded-2xl shadow-md gap-2 flex-1 md:flex-none"
                                >
                                    <Search className="w-5 h-5" />
                                    {__('Buscar')}
                                </Button>
                            </div>
                        </form>

                        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200 gap-2">
                            <span className="flex items-center gap-1.5 font-medium text-emerald-800">
                                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                                {__('Soporta Lector de Barras USB físico, Escáner QR de Cámara Tablet y Búsqueda Manual.')}
                            </span>
                            <span className="font-mono text-slate-500">{__('Próximo Código Visitante: N°')} <strong className="text-[#104a29] font-bold">{siguienteCodigo}</strong></span>
                        </div>
                    </div>

                    {/* ── RESULTADO DE LA BÚSQUEDA / FICHA DEL VISITANTE ── */}
                    {resultado ? (
                        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden space-y-0 text-slate-900">

                            {/* Status Header Banner */}
                            <div className={`p-5 text-white flex flex-wrap items-center justify-between gap-4 ${isInvitacion && record.status === 'pendiente' ? 'bg-[#104a29]' :
                                    isAcceso && record.status === 1 ? 'bg-blue-700' :
                                        isProveedor ? 'bg-rose-800' :
                                            isProductor ? 'bg-blue-800' :
                                                'bg-slate-800'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                        <Shield className="w-7 h-7 text-emerald-300" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 block">
                                            {isEmpleado ? __('Colaborador / Empleado Driscoll\'s') :
                                                resultado?.tipo === 'proveedor' ? __('🪪 Gafete Rojo • Proveedor Autorizado') :
                                                    resultado?.tipo === 'proveedor_empleado' ? __('🪪 Gafete Rojo • Empleado de Proveedor') :
                                                        resultado?.tipo === 'productor' ? __('🪪 Gafete Azul • Productor Autorizado') :
                                                            resultado?.tipo === 'productor_empleado' ? __('🪪 Gafete Azul • Empleado de Productor') :
                                                                isInvitacion ? __('Pre-Anuncio Registrado') : __('Registro de Acceso Caseta')}
                                        </span>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-xl font-extrabold tracking-tight text-white">
                                                {visitorInfo.primaryTitle}
                                            </h2>
                                            {visitorInfo.companySubtitle && (
                                                <Badge className="bg-emerald-400/20 text-emerald-100 border border-emerald-300/30 font-semibold text-xs px-2.5 py-0.5 rounded-full">
                                                    {visitorInfo.companySubtitle}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {(isEmpleado || isProveedor || isProductor) && accesoExistente && (
                                        <Badge className="bg-blue-300 text-blue-950 font-extrabold text-xs px-3.5 py-1.5 rounded-full border-0">
                                            <CheckCircle2 className="w-4 h-4 mr-1" />
                                            {__('EN INSTALACIONES (INGRESADO)')}
                                        </Badge>
                                    )}
                                    {(isProveedor || isProductor) && !accesoExistente && (
                                        <Badge className="bg-emerald-400 text-emerald-950 font-extrabold text-xs px-3.5 py-1.5 rounded-full border-0">
                                            <CheckCircle2 className="w-4 h-4 mr-1" />
                                            {__('GAFETE AUTORIZADO - LISTO PARA INGRESAR')}
                                        </Badge>
                                    )}
                                    {isEmpleado && !accesoExistente && autorizadoHoy && (
                                        <Badge className="bg-emerald-400 text-emerald-950 font-extrabold text-xs px-3.5 py-1.5 rounded-full border-0">
                                            <CheckCircle2 className="w-4 h-4 mr-1" />
                                            {__('AUTORIZADO PARA INGRESAR')}
                                        </Badge>
                                    )}
                                    {isEmpleado && !accesoExistente && !autorizadoHoy && (
                                        <Badge className="bg-rose-400 text-rose-950 font-extrabold text-xs px-3.5 py-1.5 rounded-full border-0">
                                            <AlertTriangle className="w-4 h-4 mr-1" />
                                            {__('REQUIERE AUTORIZACIÓN FUERA DE HORARIO')}
                                        </Badge>
                                    )}
                                    {isInvitacion && record.status === 'pendiente' && (
                                        <Badge className="bg-emerald-400 text-emerald-950 font-extrabold text-xs px-3.5 py-1.5 rounded-full border-0">
                                            <CheckCircle2 className="w-4 h-4 mr-1" />
                                            {__('PASE PENDIENTE - LISTO PARA INGRESAR')}
                                        </Badge>
                                    )}
                                    {isAcceso && record.status === 1 && (
                                        <Badge className="bg-blue-300 text-blue-950 font-extrabold text-xs px-3.5 py-1.5 rounded-full border-0">
                                            <CheckCircle2 className="w-4 h-4 mr-1" />
                                            {__('EN INSTALACIONES (INGRESADO)')}
                                        </Badge>
                                    )}
                                    {isAcceso && record.status === 2 && (
                                        <Badge className="bg-slate-300 text-slate-900 font-extrabold text-xs px-3.5 py-1.5 rounded-full border-0">
                                            <LogOut className="w-4 h-4 mr-1" />
                                            {__('SALIDA CONCLUIDA')}
                                        </Badge>
                                    )}
                                    {isInvitacion && record.status === 'ingresado' && (
                                        <Badge className="bg-blue-400 text-blue-950 font-extrabold text-xs px-3.5 py-1.5 rounded-full border-0">
                                            <CheckCircle2 className="w-4 h-4 mr-1" />
                                            {__('INGRESADO PREVIAMENTE')}
                                        </Badge>
                                    )}
                                    <span className="font-mono text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20">
                                        N° {record.documento_identidad || record.codigo_invitacion || record.codigo_visitante || record.id}
                                    </span>
                                </div>
                            </div>

                            {/* Ficha Completa en Grid Amplio (TODO TODO) */}
                            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                                {/* COLUMNA 1: Rostro del Visitante & Identificación */}
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-center space-y-4">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                            {__('Fotografía del Rostro')}
                                        </span>

                                        {formatImageUrl(isEmpleado ? record.foto_empleado : (record.foto_carnet || record.empleado?.foto_empleado || record.proveedor_empleado?.foto_carnet || record.productor_empleado?.foto_carnet)) ? (
                                            <div className="relative w-40 h-40 mx-auto rounded-3xl overflow-hidden border-4 border-[#104a29] shadow-lg group cursor-pointer" onClick={() => setActiveImageModal(formatImageUrl(isEmpleado ? record.foto_empleado : (record.foto_carnet || record.empleado?.foto_empleado || record.proveedor_empleado?.foto_carnet || record.productor_empleado?.foto_carnet))!)}>
                                                <img src={formatImageUrl(isEmpleado ? record.foto_empleado : (record.foto_carnet || record.empleado?.foto_empleado || record.proveedor_empleado?.foto_carnet || record.productor_empleado?.foto_carnet))!} alt="Fotografía" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                    <Maximize2 className="w-6 h-6" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-40 h-40 mx-auto rounded-3xl bg-slate-200 border-4 border-slate-300 flex items-center justify-center text-slate-400">
                                                <User className="w-20 h-20" />
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <h3 className="font-extrabold text-lg text-slate-900 leading-snug">
                                                {visitorInfo.primaryTitle}
                                            </h3>

                                            {visitorInfo.companySubtitle && (
                                                <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full text-xs font-bold shadow-2xs">
                                                    <Building className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    {visitorInfo.companySubtitle}
                                                </span>
                                            )}

                                            {(record.documento_identidad || record.visitante_documento) && (
                                                <span className="text-xs font-mono text-slate-500 block pt-0.5">
                                                    Doc ID: {record.documento_identidad || record.visitante_documento}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Documentos de Identidad (Fotos Frontal / Trasera) */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                            <FileText className="w-4 h-4 text-emerald-600" /> {__('Documentos de Identidad')}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1 text-center">
                                                <span className="text-[11px] font-bold text-slate-500">{__('Doc. Frontal')}</span>
                                                {formatImageUrl(record.foto_documento || record.doc_foto_frontal || record.empleado?.foto_documento) ? (
                                                    <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-300 cursor-pointer group relative" onClick={() => setActiveImageModal(formatImageUrl(record.foto_documento || record.doc_foto_frontal || record.empleado?.foto_documento)!)}>
                                                        <img src={formatImageUrl(record.foto_documento || record.doc_foto_frontal || record.empleado?.foto_documento)!} alt="Doc Frontal" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 className="w-5 h-5" /></div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full aspect-[4/3] rounded-2xl bg-slate-100 border border-dashed flex items-center justify-center text-slate-400 text-xs font-medium">{__('No adjunto')}</div>
                                                )}
                                            </div>

                                            <div className="space-y-1 text-center">
                                                <span className="text-[11px] font-bold text-slate-500">{__('Doc. Trasero')}</span>
                                                {formatImageUrl(record.foto_documento_reverso || record.doc_foto_trasera || record.empleado?.foto_documento_reverso) ? (
                                                    <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-300 cursor-pointer group relative" onClick={() => setActiveImageModal(formatImageUrl(record.foto_documento_reverso || record.doc_foto_trasera || record.empleado?.foto_documento_reverso)!)}>
                                                        <img src={formatImageUrl(record.foto_documento_reverso || record.doc_foto_trasera || record.empleado?.foto_documento_reverso)!} alt="Doc Trasero" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 className="w-5 h-5" /></div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full aspect-[4/3] rounded-2xl bg-slate-100 border border-dashed flex items-center justify-center text-slate-400 text-xs font-medium">{__('No adjunto')}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* COLUMNA 2: Medio de Acceso & Detalles del Vehículo */}
                                <div className="space-y-6">
                                    {/* Medio de Acceso */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                {medioAcceso === 'vehicular' ? <Car className="w-4 h-4 text-amber-500" /> : <Footprints className="w-4 h-4 text-emerald-600" />}
                                                {__('Medio de Acceso')}
                                            </span>
                                            {(isEmpleado || isProveedor || isProductor) && !accesoExistente && (record.vehiculos?.length || 0) > 0 && (
                                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                                                    {record.vehiculos.length} {__('Vehículo(s) Registrado(s)')}
                                                </span>
                                            )}
                                        </h4>

                                        {(isEmpleado || isProveedor || isProductor) && !accesoExistente ? (
                                            <div className="space-y-4 bg-slate-50 p-4 rounded-3xl border border-slate-200">
                                                {/* Selector de Opciones Peatonal / Vehicular */}
                                                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/70 rounded-2xl">
                                                    <button
                                                        type="button"
                                                        onClick={() => setMedioAcceso('peatonal')}
                                                        className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${medioAcceso === 'peatonal'
                                                                ? 'bg-emerald-600 text-white shadow-md'
                                                                : 'text-slate-700 hover:bg-slate-300/60'
                                                            }`}
                                                    >
                                                        <Footprints className="w-4 h-4" />
                                                        {__('Peatonal')}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setMedioAcceso('vehicular')}
                                                        className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${medioAcceso === 'vehicular'
                                                                ? 'bg-amber-600 text-white shadow-md'
                                                                : 'text-slate-700 hover:bg-slate-300/60'
                                                            }`}
                                                    >
                                                        <Car className="w-4 h-4" />
                                                        {__('Vehicular')}
                                                    </button>
                                                </div>

                                                {/* Configuración de Vehículo cuando se elige Vehicular */}
                                                {medioAcceso === 'vehicular' && (
                                                    <div className="space-y-3 pt-1">
                                                        {(record.vehiculos || []).length > 0 && (
                                                            <div className="flex items-center gap-5 text-xs font-bold text-slate-700 bg-amber-50/80 p-3 rounded-2xl border border-amber-200">
                                                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                                                    <Checkbox
                                                                        checked={selectedVehiculoMode === 'registrado'}
                                                                        onCheckedChange={(checked) => {
                                                                            if (checked) setSelectedVehiculoMode('registrado');
                                                                            else setSelectedVehiculoMode('nuevo');
                                                                        }}
                                                                        className="border-amber-400 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600 shadow-xs"
                                                                    />
                                                                    <span>{__('Vehículo Registrado')}</span>
                                                                </label>

                                                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                                                    <Checkbox
                                                                        checked={selectedVehiculoMode === 'nuevo'}
                                                                        onCheckedChange={(checked) => {
                                                                            if (checked) setSelectedVehiculoMode('nuevo');
                                                                            else setSelectedVehiculoMode('registrado');
                                                                        }}
                                                                        className="border-amber-400 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600 shadow-xs"
                                                                    />
                                                                    <span>{__('Vehículo No Registrado')}</span>
                                                                </label>
                                                            </div>
                                                        )}

                                                        {/* Dropdown y Fotos de Vehículos Registrados del Empleado */}
                                                        {selectedVehiculoMode === 'registrado' && (record.vehiculos || []).length > 0 ? (
                                                            <div className="space-y-3">
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[11px] font-bold text-slate-600 block">
                                                                        {__('Seleccionar Vehículo Registrado:')}
                                                                    </label>
                                                                    <select
                                                                        value={isProveedor ? proveedorVehiculoId : isProductor ? productorVehiculoId : empleadoVehiculoId}
                                                                        onChange={(e) => {
                                                                            if (isProveedor) setProveedorVehiculoId(e.target.value);
                                                                            else if (isProductor) setProductorVehiculoId(e.target.value);
                                                                            else setEmpleadoVehiculoId(e.target.value);
                                                                        }}
                                                                        className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3 text-xs font-bold text-slate-800 focus:border-amber-500 focus:ring-amber-500 shadow-xs"
                                                                    >
                                                                        {record.vehiculos.map((v: any) => (
                                                                            <option key={v.id} value={v.id}>
                                                                                {v.placa ? `[${v.placa}] ` : ''}{v.marca || ''} {v.modelo || ''} ({v.tipo_vehiculo || 'Auto'})
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>

                                                                {/* Fotos del Vehículo Registrado Seleccionado */}
                                                                {(() => {
                                                                    const activeVehId = isProveedor ? proveedorVehiculoId : isProductor ? productorVehiculoId : empleadoVehiculoId;
                                                                    const selVeh = (record.vehiculos || []).find((v: any) => String(v.id) === String(activeVehId)) || (record.vehiculos || [])[0];
                                                                    if (!selVeh) return null;
                                                                    return (
                                                                        <div className="space-y-2 pt-1">
                                                                            <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                                                                                {__('Fotografías Registradas del Vehículo')}
                                                                            </span>
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <div className="text-center space-y-1">
                                                                                    <span className="text-[10px] font-bold text-slate-500">{__('Frontal')}</span>
                                                                                    {formatImageUrl(selVeh.foto_frontal) ? (
                                                                                        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-300 cursor-pointer group relative" onClick={() => setActiveImageModal(formatImageUrl(selVeh.foto_frontal)!)}>
                                                                                            <img src={formatImageUrl(selVeh.foto_frontal)!} alt="Frontal" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 className="w-4 h-4" /></div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="w-full aspect-[4/3] rounded-xl bg-amber-100/50 border border-dashed border-amber-300 flex items-center justify-center text-slate-400 text-[10px] font-medium">{__('Sin foto')}</div>
                                                                                    )}
                                                                                </div>

                                                                                <div className="text-center space-y-1">
                                                                                    <span className="text-[10px] font-bold text-slate-500">{__('Trasera')}</span>
                                                                                    {formatImageUrl(selVeh.foto_trasera) ? (
                                                                                        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-300 cursor-pointer group relative" onClick={() => setActiveImageModal(formatImageUrl(selVeh.foto_trasera)!)}>
                                                                                            <img src={formatImageUrl(selVeh.foto_trasera)!} alt="Trasera" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 className="w-4 h-4" /></div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="w-full aspect-[4/3] rounded-xl bg-amber-100/50 border border-dashed border-amber-300 flex items-center justify-center text-slate-400 text-[10px] font-medium">{__('Sin foto')}</div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        ) : (
                                                            /* Formulario y Fotos para Vehículo No Registrado */
                                                            <div className="space-y-3 bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider">
                                                                        {__('Datos del Vehículo No Registrado')}
                                                                    </span>
                                                                    <Badge variant="outline" className="text-[10px] bg-amber-100 border-amber-300 text-amber-800 font-bold">
                                                                        {__('Ingreso Temporal')}
                                                                    </Badge>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{__('Placa *')}</label>
                                                                        <Input
                                                                            type="text"
                                                                            placeholder="EJ: ABC-123"
                                                                            value={nuevoVehiculoPlaca}
                                                                            onChange={(e) => setNuevoVehiculoPlaca(e.target.value.toUpperCase())}
                                                                            className="h-9 text-xs font-mono font-extrabold uppercase bg-white border-slate-300 focus:border-amber-500"
                                                                        />
                                                                    </div>

                                                                    <div>
                                                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{__('Tipo')}</label>
                                                                        <select
                                                                            value={nuevoVehiculoTipo}
                                                                            onChange={(e) => setNuevoVehiculoTipo(e.target.value)}
                                                                            className="w-full h-9 bg-white border border-slate-300 rounded-xl px-2 text-xs font-medium focus:border-amber-500"
                                                                        >
                                                                            <option value="Auto">Auto</option>
                                                                            <option value="Camioneta">Camioneta</option>
                                                                            <option value="Motocicleta">Motocicleta</option>
                                                                            <option value="Camión">Camión</option>
                                                                        </select>
                                                                    </div>

                                                                    <div>
                                                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{__('Marca')}</label>
                                                                        <Input
                                                                            type="text"
                                                                            placeholder="Nissan, Toyota..."
                                                                            value={nuevoVehiculoMarca}
                                                                            onChange={(e) => setNuevoVehiculoMarca(e.target.value)}
                                                                            className="h-9 text-xs font-medium bg-white border-slate-300 focus:border-amber-500"
                                                                        />
                                                                    </div>

                                                                    <div>
                                                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{__('Modelo')}</label>
                                                                        <Input
                                                                            type="text"
                                                                            placeholder="Sentra, Hilux..."
                                                                            value={nuevoVehiculoModelo}
                                                                            onChange={(e) => setNuevoVehiculoModelo(e.target.value)}
                                                                            className="h-9 text-xs font-medium bg-white border-slate-300 focus:border-amber-500"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Fotos del Vehículo No Registrado */}
                                                                <div className="pt-2 border-t border-amber-200/80 space-y-2">
                                                                    <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block">
                                                                        {__('Capturar Fotografías del Vehículo Temporal')}
                                                                    </span>

                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {/* Foto Frontal */}
                                                                        <div className="text-center space-y-1">
                                                                            <span className="text-[10px] font-bold text-slate-600 block">{__('Foto Frontal')}</span>
                                                                            {nuevoVehiculoFotoFrontal ? (
                                                                                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-amber-300 group">
                                                                                    <img src={nuevoVehiculoFotoFrontal} alt="Frontal" className="w-full h-full object-cover" />
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => setNuevoVehiculoFotoFrontal('')}
                                                                                        className="absolute inset-0 bg-red-600/85 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold text-xs transition-opacity"
                                                                                    >
                                                                                        {__('Quitar Foto')}
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="w-full aspect-[4/3] rounded-xl bg-white border border-dashed border-amber-300 flex flex-col items-center justify-center p-2">
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="outline"
                                                                                        size="xs"
                                                                                        onClick={() => vehiculoFrontalInputRef.current?.click()}
                                                                                        className="h-7 text-[10px] font-bold gap-1 w-full border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100"
                                                                                    >
                                                                                        <Camera className="w-3 h-3 text-amber-600" />
                                                                                        {__('Tomar / Adjuntar')}
                                                                                    </Button>
                                                                                    <input
                                                                                        ref={vehiculoFrontalInputRef}
                                                                                        type="file"
                                                                                        accept="image/*"
                                                                                        capture="environment"
                                                                                        className="hidden"
                                                                                        onChange={(e) => handleVehicleImageUpload(e, setNuevoVehiculoFotoFrontal)}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Foto Trasera */}
                                                                        <div className="text-center space-y-1">
                                                                            <span className="text-[10px] font-bold text-slate-600 block">{__('Foto Trasera')}</span>
                                                                            {nuevoVehiculoFotoTrasera ? (
                                                                                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-amber-300 group">
                                                                                    <img src={nuevoVehiculoFotoTrasera} alt="Trasera" className="w-full h-full object-cover" />
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => setNuevoVehiculoFotoTrasera('')}
                                                                                        className="absolute inset-0 bg-red-600/85 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold text-xs transition-opacity"
                                                                                    >
                                                                                        {__('Quitar Foto')}
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="w-full aspect-[4/3] rounded-xl bg-white border border-dashed border-amber-300 flex flex-col items-center justify-center p-2">
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="outline"
                                                                                        size="xs"
                                                                                        onClick={() => vehiculoTraseraInputRef.current?.click()}
                                                                                        className="h-7 text-[10px] font-bold gap-1 w-full border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100"
                                                                                    >
                                                                                        <Camera className="w-3 h-3 text-amber-600" />
                                                                                        {__('Tomar / Adjuntar')}
                                                                                    </Button>
                                                                                    <input
                                                                                        ref={vehiculoTraseraInputRef}
                                                                                        type="file"
                                                                                        accept="image/*"
                                                                                        capture="environment"
                                                                                        className="hidden"
                                                                                        onChange={(e) => handleVehicleImageUpload(e, setNuevoVehiculoFotoTrasera)}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (record.medio_acceso === 'vehicular' || (accesoExistente && accesoExistente.medio_acceso === 'vehicular')) ? (
                                            <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-extrabold text-amber-900 text-sm flex items-center gap-2">
                                                        <Car className="w-5 h-5 text-amber-600" /> {__('Acceso Vehicular')}
                                                    </span>
                                                    {(record.vehiculo_placa || accesoExistente?.vehiculo_placa) && (
                                                        <span className="font-mono text-sm font-extrabold bg-amber-200 text-amber-950 px-3 py-1 rounded-xl border border-amber-300">
                                                            {record.vehiculo_placa || accesoExistente?.vehiculo_placa}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 font-mono">
                                                    <div><span className="text-slate-400 font-sans">{__('Marca:')}</span> {record.vehiculo_marca || accesoExistente?.vehiculo_marca || '-'}</div>
                                                    <div><span className="text-slate-400 font-sans">{__('Modelo:')}</span> {record.vehiculo_modelo || accesoExistente?.vehiculo_modelo || '-'}</div>
                                                    <div><span className="text-slate-400 font-sans">{__('Año:')}</span> {record.vehiculo_anio || '-'}</div>
                                                    <div><span className="text-slate-400 font-sans">{__('Tipo:')}</span> {record.vehiculo_tipo || accesoExistente?.vehiculo_tipo || 'Auto'}</div>
                                                </div>

                                                {/* Fotos del Vehículo en Accesos Registrados */}
                                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200">
                                                    <div className="text-center space-y-1">
                                                        <span className="text-[10px] font-bold text-slate-500">{__('Vehículo Frontal')}</span>
                                                        {formatImageUrl(record.vehiculo_foto_frontal || accesoExistente?.vehiculo_foto_frontal) ? (
                                                            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-300 cursor-pointer group relative" onClick={() => setActiveImageModal(formatImageUrl(record.vehiculo_foto_frontal || accesoExistente?.vehiculo_foto_frontal)!)}>
                                                                <img src={formatImageUrl(record.vehiculo_foto_frontal || accesoExistente?.vehiculo_foto_frontal)!} alt="Vehículo Frontal" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 className="w-4 h-4" /></div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-full aspect-[4/3] rounded-xl bg-amber-100/50 border border-dashed border-amber-300 flex items-center justify-center text-slate-400 text-[10px] font-medium">{__('Sin foto')}</div>
                                                        )}
                                                    </div>

                                                    <div className="text-center space-y-1">
                                                        <span className="text-[10px] font-bold text-slate-500">{__('Vehículo Trasero')}</span>
                                                        {formatImageUrl(record.vehiculo_foto_trasera || accesoExistente?.vehiculo_foto_trasera) ? (
                                                            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-300 cursor-pointer group relative" onClick={() => setActiveImageModal(formatImageUrl(record.vehiculo_foto_trasera || accesoExistente?.vehiculo_foto_trasera)!)}>
                                                                <img src={formatImageUrl(record.vehiculo_foto_trasera || accesoExistente?.vehiculo_foto_trasera)!} alt="Vehículo Trasero" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 className="w-4 h-4" /></div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-full aspect-[4/3] rounded-xl bg-amber-100/50 border border-dashed border-amber-300 flex items-center justify-center text-slate-400 text-[10px] font-medium">{__('Sin foto')}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-extrabold text-sm flex items-center gap-2">
                                                <Footprints className="w-5 h-5 text-emerald-600" /> {__('Acceso Peatonal Confirmado')}
                                            </div>
                                        )}
                                    </div>

                                    {/* Acompañantes Registrados */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-emerald-600" /> {__('Acompañantes')}</span>
                                            {!accesoExistente && resultado ? (
                                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                                    {acompanantesList.length} {__('Añadido(s)')}
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-slate-400">({record?.acompanantes?.length || accesoExistente?.acompanantes?.length || 0})</span>
                                            )}
                                        </h4>

                                        {!accesoExistente && resultado ? (
                                            <div className="space-y-3 bg-slate-50 p-4 rounded-3xl border border-slate-200">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-700">
                                                        {__('Acompañantes del Ingreso / Visita')}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => {
                                                            setNuevoAcompanante({ nombre: '', documento: '', telefono: '', observacion: '', foto_carnet: '', doc_foto_frontal: '', doc_foto_trasera: '' });
                                                            setSelectedEmpleadoId('');
                                                            setIsAcompananteModalOpen(true);
                                                        }}
                                                        className="h-8 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1 shadow-xs"
                                                    >
                                                        + {__('Agregar Acompañante')}
                                                    </Button>
                                                </div>

                                                {/* Listado de Acompañantes Añadidos */}
                                                {acompanantesList.length > 0 ? (
                                                    <div className="space-y-2 pt-1">
                                                        {acompanantesList.map((ac: any, idx: number) => {
                                                            const nameToShow = ac.nombre || `${ac.nombres || ''} ${ac.apellidos || ''}`.trim() || `Acompañante #${idx + 1}`;
                                                            const docToShow = ac.documento || ac.documento_identidad || ac.curp || '';
                                                            const faceImg = formatImageUrl(ac.foto_carnet || ac.doc_foto_frontal);
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    onClick={() => setSelectedAcompananteDetail(ac)}
                                                                    className="p-3 rounded-2xl bg-white border border-slate-200 text-xs flex items-center justify-between shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        {faceImg ? (
                                                                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/40 shrink-0 bg-slate-100">
                                                                                <img src={faceImg} alt={nameToShow} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                                                                                <User className="w-5 h-5" />
                                                                            </div>
                                                                        )}
                                                                        <div className="space-y-0.5">
                                                                            <div className="font-bold text-slate-900 flex items-center gap-2">
                                                                                <span className="group-hover:text-emerald-700 transition-colors">{nameToShow}</span>
                                                                                {(ac.observacion || ac.cargo) && <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{ac.observacion || ac.cargo}</span>}
                                                                            </div>
                                                                            <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                                                                                {docToShow && <span>Doc: {docToShow}</span>}
                                                                                {ac.telefono && <span>Tel: {ac.telefono}</span>}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                                            <Eye className="w-3.5 h-3.5" /> {__('Ver detalle')}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setAcompanantesList(acompanantesList.filter((_, i) => i !== idx));
                                                                            }}
                                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 font-bold text-xs p-1.5 rounded-xl transition-colors"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="p-4 rounded-2xl bg-white/70 border border-dashed border-slate-300 text-xs text-slate-400 text-center italic">
                                                        {__('No se han agregado acompañantes a este ingreso. Pulse "+ Agregar Acompañante" para registrar uno.')}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (record?.acompanantes && record.acompanantes.length > 0) || (accesoExistente?.acompanantes && accesoExistente.acompanantes.length > 0) ? (
                                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                                {(record?.acompanantes || accesoExistente?.acompanantes || []).map((ac: any, idx: number) => {
                                                    const nombreCompleto = ac.nombre || `${ac.nombres || ''} ${ac.apellidos || ''}`.trim() || `Acompañante #${idx + 1}`;
                                                    const docIdentidad = ac.documento || ac.documento_identidad || ac.curp || null;
                                                    const faceImg = formatImageUrl(ac.foto_carnet || ac.doc_foto_frontal);
                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={() => setSelectedAcompananteDetail(ac)}
                                                            className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between text-slate-800 hover:bg-white hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {faceImg ? (
                                                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/40 shrink-0 bg-slate-100">
                                                                        <img src={faceImg} alt={nombreCompleto} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                                                                        <User className="w-5 h-5" />
                                                                    </div>
                                                                )}
                                                                <div className="space-y-0.5">
                                                                    <span className="font-bold block group-hover:text-emerald-700 transition-colors">{nombreCompleto}</span>
                                                                    {docIdentidad && <span className="font-mono text-slate-500 text-[11px] block">Doc: {docIdentidad}</span>}
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                                <Eye className="w-3.5 h-3.5" /> {__('Ver detalle')}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-400 text-center italic">
                                                {__('Sin acompañantes adicionales registrados')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* COLUMNA 3: Anfitrión, Horario y Acción Principal en 1-Clic */}
                                <div className="space-y-6 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        {/* Cita & Anfitrión */}
                                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-3 text-xs text-slate-800">
                                            <div className="space-y-1">
                                                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[11px]">
                                                    {__('Anfitrión / Responsable')}
                                                </span>
                                                <span className="font-extrabold text-slate-900 text-sm block">
                                                    {record.anfitrion ? `${record.anfitrion.nombres} ${record.anfitrion.apellidos}` : (record.responsable ? `${record.responsable.nombres} ${record.responsable.apellidos}` : 'No asignado')}
                                                </span>
                                                {record.anfitrion?.departamento && (
                                                    <span className="text-emerald-700 font-medium block">{record.anfitrion.departamento.nombre}</span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                                                <div>
                                                    <span className="text-slate-400 block font-medium">{__('Fecha Cita')}</span>
                                                    <span className="font-bold text-slate-800">{record.fecha_estimada || record.fecha_ingreso}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block font-medium">{__('Hora Cita')}</span>
                                                    <span className="font-bold text-slate-800">{record.hora_estimada ? record.hora_estimada.substring(0, 5) : (record.hora_ingreso ? record.hora_ingreso.substring(0, 5) : '09:00')}</span>
                                                </div>
                                            </div>

                                            {record.motivo_visita && (
                                                <div className="pt-2 border-t border-slate-200">
                                                    <span className="text-slate-400 block font-medium mb-1">{__('Motivo de Visita')}</span>
                                                    <p className="italic bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700">
                                                        "{record.motivo_visita}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Validación de Horario / Día de Acceso para Empleado */}
                                        {isEmpleado && (
                                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-3">
                                                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[11px]">
                                                    {__('Validación de Horario / Día de Acceso')}
                                                </span>

                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-semibold text-slate-700">
                                                            {__('Día de ingreso')} ({hoyNombre}):
                                                        </span>
                                                        {autorizadoHoy ? (
                                                            <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 font-mono text-xs px-2.5 py-1 flex items-center gap-1.5 font-bold shadow-xs">
                                                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                                {autorizadoHabitual
                                                                    ? `${__('Autorizado:')} ${jornadaHoy?.hora_ingreso || '08:00'} a ${jornadaHoy?.hora_salida || '17:00'}`
                                                                    : __('Autorizado por WhatsApp ✓')}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-300 text-xs px-2.5 py-1 flex items-center gap-1.5 font-bold">
                                                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                                                {__('Fuera de Horario / Día No Autorizado')}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Botón WhatsApp si NO está autorizado hoy */}
                                                    {!autorizadoHoy && record.responsable_id && (
                                                        <Button
                                                            type="button"
                                                            onClick={() => handleSolicitarWhatsappGarita(`${record.nombres} ${record.apellidos}`, record.documento_identidad || '', record.responsable_id, record.id)}
                                                            className={`w-full h-11 text-xs font-bold rounded-xl gap-2 shadow-md transition-all ${activeAuthToken
                                                                    ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                                                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                                                }`}
                                                        >
                                                            {activeAuthToken ? (
                                                                <>
                                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                                    <span>{__('Solicitud enviada. Esperando respuesta...')}</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <MessageSquare className="w-4 h-4" />
                                                                    <span>{__('Solicitar Autorización vía WhatsApp')}</span>
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}

                                                    {/* Notificación de Autorización Recibida en Tiempo Real */}
                                                    {autorizacionRecibida?.status === 'autorizado' && (
                                                        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs space-y-1 mt-2">
                                                            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                                                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                                {__('Acceso Autorizado por:')} {autorizacionRecibida.responsable}
                                                            </div>
                                                            <div className="text-slate-600 italic">
                                                                "{autorizacionRecibida.motivo}"
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* BOTÓN DE ACCIÓN 1-CLIC DE GARITA */}
                                    <div className="space-y-3 pt-4 border-t border-slate-200">
                                        {(isEmpleado || isProveedor || isProductor) && (
                                            <>
                                                {accesoExistente ? (
                                                    <Button
                                                        type="button"
                                                        onClick={() => handleMarcarSalida(accesoExistente.id)}
                                                        className="w-full h-16 bg-slate-900 hover:bg-black text-white text-base font-extrabold rounded-2xl shadow-xl gap-2 flex items-center justify-center transition-transform active:scale-[0.98]"
                                                    >
                                                        <LogOut className="w-6 h-6 text-rose-400" />
                                                        {__('Marcar Salida de Caseta')}
                                                    </Button>
                                                ) : isEmpleado ? (
                                                    <Button
                                                        type="button"
                                                        disabled={!autorizadoHoy}
                                                        onClick={() => handleRegistrarIngresoEmpleadoGarita(record.id, record.responsable_id)}
                                                        className={`w-full h-16 text-base font-extrabold rounded-2xl shadow-xl gap-2 flex items-center justify-center transition-transform active:scale-[0.98] ${autorizadoHoy
                                                                ? 'bg-[#104a29] hover:bg-[#0c371e] text-white'
                                                                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                                        {autorizadoHoy ? __('Registrar Ingreso de Empleado (1-Clic)') : __('Requiere Autorización para Ingresar')}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        onClick={() => handleRegistrarIngresoProveedorGarita(isProductor ? 'productor' : 'proveedor')}
                                                        className="w-full h-16 bg-[#104a29] hover:bg-[#0c371e] text-white text-base font-extrabold rounded-2xl shadow-xl gap-2 flex items-center justify-center transition-transform active:scale-[0.98]"
                                                    >
                                                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                                        {__('Registrar Ingreso de ') + (isProductor ? __('Productor') : __('Proveedor')) + __(' (1-Clic)')}
                                                    </Button>
                                                )}
                                            </>
                                        )}

                                        {isInvitacion && record.status === 'pendiente' && (
                                            <Button
                                                type="button"
                                                onClick={() => handleConfirmIngreso(record.id)}
                                                className="w-full h-16 bg-[#104a29] hover:bg-[#0c371e] text-white text-base font-extrabold rounded-2xl shadow-xl gap-2 flex items-center justify-center transition-transform active:scale-[0.98]"
                                            >
                                                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                                {__('Confirmar Ingreso en Caseta (1-Clic)')}
                                            </Button>
                                        )}

                                        {isAcceso && record.status === 1 && (
                                            <Button
                                                type="button"
                                                onClick={() => handleMarcarSalida(record.id)}
                                                className="w-full h-16 bg-slate-900 hover:bg-black text-white text-base font-extrabold rounded-2xl shadow-xl gap-2 flex items-center justify-center transition-transform active:scale-[0.98]"
                                            >
                                                <LogOut className="w-6 h-6 text-rose-400" />
                                                {__('Marcar Salida de Caseta')}
                                            </Button>
                                        )}

                                        {isInvitacion && record.status === 'ingresado' && (
                                            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-center text-xs font-bold border border-emerald-300">
                                                {__('✓ Este visitante ya fue ingresado por Caseta.')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    ) : searchQuery ? (
                        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-md text-slate-900">
                            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto animate-pulse" />
                            <h3 className="text-lg font-extrabold text-slate-900">
                                {__('No se encontró ningún pre-anuncio o pase de acceso')}
                            </h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                                {__('Verifique que el código escaneado o la placa ingresada sea correcta. Búsqueda realizada:')} <span className="font-mono font-bold text-[#104a29]">{searchQuery}</span>
                            </p>
                        </div>
                    ) : null}

                    {/* Estado inicial elegante cuando no hay búsqueda activa */}
                    {!resultado && !searchQuery && (
                        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-md text-slate-900">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-[#104a29]">
                                <QrCode className="w-8 h-8 animate-pulse" />
                            </div>
                            <div className="space-y-1 max-w-md mx-auto">
                                <h3 className="text-base font-extrabold text-slate-900">
                                    {__('Esperando Lectura de Pase Digital')}
                                </h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    {__('Escanee el código QR del visitante con la cámara de la tablet, la pistola de código de barras USB o busque por DNI/Placa.')}
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Modal de Escáner QR con Cámara en Vivo para Tablet */}
            {isScanningCamera && (
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
                                    onClick={stopCameraScanner}
                                    className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {cameraError ? (
                            <div className="p-8 bg-rose-950/40 border border-rose-800/60 rounded-2xl space-y-3">
                                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                                <p className="text-xs text-rose-300 font-medium">{cameraError}</p>
                                <Button type="button" onClick={stopCameraScanner} className="bg-slate-800 text-xs font-bold rounded-xl">
                                    {__('Cerrar Escáner')}
                                </Button>
                            </div>
                        ) : (
                            <div className="relative aspect-[4/3] w-full max-w-xl mx-auto bg-black rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-inner group">
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-cover"
                                    playsInline
                                    muted
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
                        )}
                    </div>
                </div>
            )}

            {/* Modal Lightbox para Ampliar Fotos */}
            {activeImageModal && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setActiveImageModal(null)}>
                    <div className="relative max-w-3xl w-full max-h-[90vh] overflow-hidden rounded-3xl" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => setActiveImageModal(null)} className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 backdrop-blur-md">
                            <X className="w-6 h-6" />
                        </button>
                        <img src={activeImageModal} alt="Documento / Vehículo Ampliado" className="w-full h-full object-contain max-h-[85vh] mx-auto rounded-2xl" />
                    </div>
                </div>
            )}

            {/* ── Modal de Registro de Acompañante ── */}
            <Dialog open={isAcompananteModalOpen} onOpenChange={setIsAcompananteModalOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border border-slate-200 bg-white shadow-2xl [&>button[data-slot=dialog-close]]:hidden">
                    {/* Header */}
                    <DialogHeader className="border-b border-slate-200 pb-4">
                        <DialogTitle className="text-lg font-extrabold text-[#104a29] flex items-center gap-2">
                            <Users className="w-5 h-5" /> {__('Registro Completo de Acompañante')}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 mt-1">
                            {__('Ingrese la información personal, identificación y fotografías del acompañante no registrado.')}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Modal Body */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const fullNombre = `${nuevoAcompanante.nombres || ''} ${nuevoAcompanante.apellidos || ''}`.trim() || nuevoAcompanante.nombre.trim();
                            if (!fullNombre) return;

                            const docIdentidad = nuevoAcompanante.curp || nuevoAcompanante.documento || '';

                            setAcompanantesList([
                                ...acompanantesList,
                                {
                                    nombre: fullNombre,
                                    documento: docIdentidad,
                                    telefono: nuevoAcompanante.correo || '',
                                    observacion: nuevoAcompanante.cargo || nuevoAcompanante.observacion || 'Acompañante registrado',
                                    foto_carnet: nuevoAcompanante.foto_carnet || undefined,
                                    doc_foto_frontal: nuevoAcompanante.doc_foto_frontal || undefined,
                                    doc_foto_trasera: nuevoAcompanante.doc_foto_trasera || undefined,
                                },
                            ]);

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
                                observacion: '',
                                foto_carnet: '',
                                doc_foto_frontal: '',
                                doc_foto_trasera: '',
                            });
                            setSelectedEmpleadoId('');
                            setIsAcompananteModalOpen(false);
                        }}
                        className="space-y-6 text-xs"
                    >
                        {/* Selector de Empleado del Proveedor / Productor si existen empleados registrados */}
                        {empleadosDisponibles.length > 0 && (
                            <div className="space-y-1.5 bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200">
                                <label className="text-xs font-extrabold text-emerald-900 flex items-center justify-between">
                                    <span>{__('Autorellenar desde Empleado del Proveedor / Productor:')}</span>
                                    <Badge className="bg-emerald-200 text-emerald-950 font-bold text-[10px]">
                                        {empleadosDisponibles.length} {__('Registrado(s)')}
                                    </Badge>
                                </label>
                                <select
                                    value={selectedEmpleadoId}
                                    onChange={(e) => {
                                        const empId = e.target.value;
                                        setSelectedEmpleadoId(empId);
                                        if (empId) {
                                            const emp = empleadosDisponibles.find((x: any) => String(x.id) === String(empId));
                                            if (emp) {
                                                setNuevoAcompanante({
                                                    nombres: emp.nombres || '',
                                                    apellidos: emp.apellidos || '',
                                                    nombre: `${emp.nombres || ''} ${emp.apellidos || ''}`.trim(),
                                                    curp: emp.curp || emp.documento_identidad || '',
                                                    documento: emp.documento_identidad || emp.curp || '',
                                                    genero: emp.genero || '',
                                                    fecha_nacimiento: emp.fecha_nacimiento || '',
                                                    edad: emp.edad ? String(emp.edad) : '',
                                                    correo: emp.correo || emp.email || '',
                                                    cargo: emp.cargo || 'Empleado del Proveedor',
                                                    observacion: emp.cargo || 'Empleado del Proveedor',
                                                    foto_carnet: emp.foto_carnet || emp.foto_empleado || '',
                                                    doc_foto_frontal: emp.doc_foto_frontal || emp.foto_documento || '',
                                                    doc_foto_trasera: emp.doc_foto_trasera || emp.foto_documento_reverso || '',
                                                });
                                            }
                                        } else {
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
                                                observacion: '',
                                                foto_carnet: '',
                                                doc_foto_frontal: '',
                                                doc_foto_trasera: '',
                                            });
                                        }
                                    }}
                                    className="w-full h-11 bg-white border border-emerald-300 rounded-xl px-3 text-xs font-bold text-slate-800 focus:border-emerald-600 focus:ring-emerald-600 shadow-xs"
                                >
                                    <option value="">-- {__('Seleccione para autorellenar datos y fotos')} --</option>
                                    {empleadosDisponibles.map((emp: any) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.nombres} {emp.apellidos} {emp.documento_identidad ? `[Doc: ${emp.documento_identidad}]` : ''} {emp.cargo ? `(${emp.cargo})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Section 1: Datos Personales */}
                        <div className="space-y-4">
                            <span className="font-extrabold text-slate-700 uppercase tracking-wider block">
                                1. {__('DATOS PERSONALES')}
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="font-bold text-slate-700">
                                        {__('Nombres')} <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        required
                                        placeholder="Ej: Juan Antonio"
                                        value={nuevoAcompanante.nombres}
                                        onChange={(e) => setNuevoAcompanante(prev => ({ ...prev, nombres: e.target.value }))}
                                        className="w-full h-auto p-3 rounded-xl border-slate-300 bg-white text-xs font-medium"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="font-bold text-slate-700">
                                        {__('Apellidos')} <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        required
                                        placeholder="Ej: Pérez Gómez"
                                        value={nuevoAcompanante.apellidos}
                                        onChange={(e) => setNuevoAcompanante(prev => ({ ...prev, apellidos: e.target.value }))}
                                        className="w-full h-auto p-3 rounded-xl border-slate-300 bg-white text-xs font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="font-bold text-slate-700">
                                        {__('CURP / Documento ID')}
                                    </Label>
                                    <Input
                                        type="text"
                                        placeholder="EJ: PEGJ900101HDF..."
                                        value={nuevoAcompanante.curp}
                                        onChange={(e) => setNuevoAcompanante(prev => ({ ...prev, curp: e.target.value.toUpperCase(), documento: e.target.value.toUpperCase() }))}
                                        className="w-full h-auto p-3 rounded-xl border-slate-300 bg-white text-xs font-mono uppercase"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="font-bold text-slate-700">{__('Género')}</Label>
                                    <Select
                                        value={nuevoAcompanante.genero || undefined}
                                        onValueChange={(value) => setNuevoAcompanante(prev => ({ ...prev, genero: value }))}
                                    >
                                        <SelectTrigger className="w-full h-auto p-3 rounded-xl border-slate-300 bg-white text-xs font-medium">
                                            <SelectValue placeholder={__('Seleccione género...')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Masculino">{__('Masculino')}</SelectItem>
                                            <SelectItem value="Femenino">{__('Femenino')}</SelectItem>
                                            <SelectItem value="Otro">{__('Otro / Prefiero no decir')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="font-bold text-slate-700">{__('Fecha de Nacimiento')}</Label>
                                    <Input
                                        type="date"
                                        value={nuevoAcompanante.fecha_nacimiento || ''}
                                        onChange={(e) => handleAcompananteFechaChange(e.target.value)}
                                        className="w-full h-auto p-3 rounded-xl border-slate-300 bg-white text-xs font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="font-bold text-slate-700">{__('Edad (Años)')}</Label>
                                    <Input
                                        type="number"
                                        placeholder="Ej: 30"
                                        value={nuevoAcompanante.edad || ''}
                                        onChange={(e) => setNuevoAcompanante(prev => ({ ...prev, edad: e.target.value }))}
                                        className="w-full h-auto p-3 rounded-xl border-slate-300 bg-white text-xs font-mono"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="font-bold text-slate-700">{__('Correo Electrónico')}</Label>
                                    <Input
                                        type="email"
                                        placeholder="ejemplo@correo.com"
                                        value={nuevoAcompanante.correo}
                                        onChange={(e) => setNuevoAcompanante(prev => ({ ...prev, correo: e.target.value }))}
                                        className="w-full h-auto p-3 rounded-xl border-slate-300 bg-white text-xs font-medium"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="font-bold text-slate-700">{__('Cargo (Solo si aplica)')}</Label>
                                    <Input
                                        type="text"
                                        placeholder="Ej: Asistente, Técnico..."
                                        value={nuevoAcompanante.cargo}
                                        onChange={(e) => setNuevoAcompanante(prev => ({ ...prev, cargo: e.target.value }))}
                                        className="w-full h-auto p-3 rounded-xl border-slate-300 bg-white text-xs font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Fotografía Tipo Carnet (Rostro) */}
                        <div className="space-y-3 pt-4 border-t border-slate-200">
                            <Label className="font-extrabold text-slate-700 uppercase tracking-wider block">
                                2. {__('FOTOGRAFÍA TIPO CARNET (ROSTRO DEL ACOMPAÑANTE)')}
                            </Label>

                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                {nuevoAcompanante.foto_carnet ? (
                                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-emerald-500 shrink-0">
                                        <img src={formatImageUrl(nuevoAcompanante.foto_carnet)!} alt="Foto Carnet" className="w-full h-full object-cover" />
                                        <Button type="button" variant="destructive" size="icon" onClick={() => setNuevoAcompanante(prev => ({ ...prev, foto_carnet: '' }))} className="absolute top-1 right-1 h-5 w-5 rounded-full shadow-md">
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                        <User className="w-8 h-8" />
                                    </div>
                                )}

                                <div className="space-y-2 flex-1">
                                    <span className="font-bold text-slate-800 block text-xs">{__('Foto del Rostro del Acompañante')}</span>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            onClick={() => setActiveCameraField('ac_foto_carnet')}
                                            className="px-3 py-2 h-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs"
                                        >
                                            <Camera className="w-3.5 h-3.5 mr-1" /> {__('Cámara')}
                                        </Button>
                                        <Button type="button" variant="secondary" asChild className="px-3 py-2 h-auto rounded-xl font-bold text-xs cursor-pointer">
                                            <label>
                                                <Upload className="w-3.5 h-3.5 mr-1 inline" /> {__('Subir')}
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAcompananteFileUpload(e, 'foto_carnet')} />
                                            </label>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Fotografías del Documento de Identidad */}
                        <div className="space-y-3 pt-4 border-t border-slate-200">
                            <Label className="font-extrabold text-slate-700 uppercase tracking-wider block">
                                3. {__('FOTOGRAFÍAS DEL DOCUMENTO DE IDENTIDAD (INE / CÉDULA / PASAPORTE)')}
                            </Label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Frontal Documento */}
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-600 text-[11px]">{__('Foto Frontal')}</Label>
                                    <div className="flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50 min-h-[130px] relative">
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
                                                    <Button
                                                        type="button"
                                                        onClick={() => setActiveCameraField('ac_doc_foto_frontal')}
                                                        className="px-3 py-1.5 h-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px]"
                                                    >
                                                        <Camera className="w-3 h-3 mr-1" /> {__('Cámara')}
                                                    </Button>
                                                    <Button type="button" variant="secondary" asChild className="px-3 py-1.5 h-auto rounded-lg font-bold text-[11px] cursor-pointer">
                                                        <label>
                                                            <Upload className="w-3 h-3 mr-1 inline" /> {__('Archivo')}
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
                                    <Label className="font-bold text-slate-600 text-[11px]">{__('Foto Reverso')}</Label>
                                    <div className="flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50 min-h-[130px] relative">
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
                                                    <Button
                                                        type="button"
                                                        onClick={() => setActiveCameraField('ac_doc_foto_trasera')}
                                                        className="px-3 py-1.5 h-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px]"
                                                    >
                                                        <Camera className="w-3 h-3 mr-1" /> {__('Cámara')}
                                                    </Button>
                                                    <Button type="button" variant="secondary" asChild className="px-3 py-1.5 h-auto rounded-lg font-bold text-[11px] cursor-pointer">
                                                        <label>
                                                            <Upload className="w-3 h-3 mr-1 inline" /> {__('Archivo')}
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
                        <DialogFooter className="pt-4 border-t border-slate-200 gap-3 flex items-center justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAcompananteModalOpen(false)}
                                className="px-5 py-3 h-auto rounded-xl border-slate-300 text-slate-700 font-bold hover:bg-slate-100"
                            >
                                {__('Cancelar')}
                            </Button>
                            <Button
                                type="submit"
                                className="px-6 py-3 h-auto rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md flex items-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" /> {__('Agregar Acompañante')}
                            </Button>
                        </DialogFooter>

                        {/* Camera Widget Overlay inside Modal for Acompañantes */}
                        {activeCameraField && activeCameraField.startsWith('ac_') && (
                            <CameraWidget
                                title={
                                    activeCameraField === 'ac_foto_carnet'
                                        ? __('Fotografía del Rostro del Acompañante')
                                        : activeCameraField.includes('frontal')
                                        ? __('Fotografía Frontal del Documento del Acompañante')
                                        : __('Fotografía Reverso del Documento del Acompañante')
                                }
                                faceGuide={activeCameraField === 'ac_foto_carnet'}
                                docGuide={activeCameraField.includes('doc_foto')}
                                onCapture={(base64) => {
                                    const field = activeCameraField.replace('ac_', '') as 'foto_carnet' | 'doc_foto_frontal' | 'doc_foto_trasera';
                                    setNuevoAcompanante(prev => ({ ...prev, [field]: base64 }));
                                    setActiveCameraField(null);
                                }}
                                onCancel={() => setActiveCameraField(null)}
                            />
                        )}
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal de Detalle Completo de Acompañante */}
            <Dialog open={Boolean(selectedAcompananteDetail)} onOpenChange={(open) => { if (!open) setSelectedAcompananteDetail(null); }}>
                <DialogContent className="max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-slate-900 max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="space-y-1 text-left border-b border-slate-100 pb-4">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-emerald-600" />
                                {__('Detalle del Acompañante')}
                            </DialogTitle>
                            <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 font-bold text-[10px] uppercase">
                                {__('Información Registrada')}
                            </Badge>
                        </div>
                    </DialogHeader>

                    {selectedAcompananteDetail && (
                        <div className="space-y-6 py-3">
                            {/* Rostro del Acompañante */}
                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 text-center space-y-3">
                                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                                    {__('Fotografía del Acompañante')}
                                </span>

                                {formatImageUrl(selectedAcompananteDetail.foto_carnet || selectedAcompananteDetail.doc_foto_frontal) ? (
                                    <div
                                        className="relative w-32 h-32 mx-auto rounded-3xl overflow-hidden border-4 border-emerald-600 shadow-md group cursor-pointer"
                                        onClick={() => setActiveImageModal(formatImageUrl(selectedAcompananteDetail.foto_carnet || selectedAcompananteDetail.doc_foto_frontal)!)}
                                    >
                                        <img
                                            src={formatImageUrl(selectedAcompananteDetail.foto_carnet || selectedAcompananteDetail.doc_foto_frontal)!}
                                            alt="Fotografía"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                            <Maximize2 className="w-6 h-6" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-32 h-32 mx-auto rounded-3xl bg-slate-200 border-4 border-slate-300 flex items-center justify-center text-slate-400">
                                        <User className="w-16 h-16" />
                                    </div>
                                )}

                                <div className="space-y-0.5">
                                    <h3 className="font-extrabold text-base text-slate-900">
                                        {selectedAcompananteDetail.nombre || `${selectedAcompananteDetail.nombres || ''} ${selectedAcompananteDetail.apellidos || ''}`.trim() || 'Acompañante'}
                                    </h3>
                                    {(selectedAcompananteDetail.observacion || selectedAcompananteDetail.cargo) && (
                                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block">
                                            {selectedAcompananteDetail.observacion || selectedAcompananteDetail.cargo}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Datos Registrados */}
                            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <div>
                                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">{__('Documento / ID')}</span>
                                    <span className="font-mono font-bold text-slate-800">
                                        {selectedAcompananteDetail.documento || selectedAcompananteDetail.documento_identidad || selectedAcompananteDetail.curp || '-'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">{__('Teléfono')}</span>
                                    <span className="font-medium text-slate-800">
                                        {selectedAcompananteDetail.telefono || selectedAcompananteDetail.telefono_contacto || '-'}
                                    </span>
                                </div>
                                {selectedAcompananteDetail.correo && (
                                    <div className="col-span-2">
                                        <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">{__('Correo Electrónico')}</span>
                                        <span className="font-medium text-slate-800">{selectedAcompananteDetail.correo}</span>
                                    </div>
                                )}
                                {selectedAcompananteDetail.genero && (
                                    <div>
                                        <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">{__('Género')}</span>
                                        <span className="font-medium text-slate-800">{selectedAcompananteDetail.genero}</span>
                                    </div>
                                )}
                                {(selectedAcompananteDetail.fecha_nacimiento || selectedAcompananteDetail.edad) && (
                                    <div>
                                        <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">{__('Edad / Nacimiento')}</span>
                                        <span className="font-medium text-slate-800">
                                            {selectedAcompananteDetail.edad ? `${selectedAcompananteDetail.edad} años` : selectedAcompananteDetail.fecha_nacimiento}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Documentos Adjuntos (Frontal / Trasero) */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <FileText className="w-4 h-4 text-emerald-600" /> {__('Documentos de Identidad Adjuntos')}
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1 text-center">
                                        <span className="text-[11px] font-bold text-slate-500">{__('Doc. Frontal')}</span>
                                        {formatImageUrl(selectedAcompananteDetail.doc_foto_frontal) ? (
                                            <div
                                                className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-300 cursor-pointer group relative"
                                                onClick={() => setActiveImageModal(formatImageUrl(selectedAcompananteDetail.doc_foto_frontal)!)}
                                            >
                                                <img src={formatImageUrl(selectedAcompananteDetail.doc_foto_frontal)!} alt="Doc Frontal" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                    <Maximize2 className="w-5 h-5" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full aspect-[4/3] rounded-2xl bg-slate-100 border border-dashed flex items-center justify-center text-slate-400 text-xs font-medium">
                                                {__('No adjunto')}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1 text-center">
                                        <span className="text-[11px] font-bold text-slate-500">{__('Doc. Trasero')}</span>
                                        {formatImageUrl(selectedAcompananteDetail.doc_foto_trasera) ? (
                                            <div
                                                className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-300 cursor-pointer group relative"
                                                onClick={() => setActiveImageModal(formatImageUrl(selectedAcompananteDetail.doc_foto_trasera)!)}
                                            >
                                                <img src={formatImageUrl(selectedAcompananteDetail.doc_foto_trasera)!} alt="Doc Trasero" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                    <Maximize2 className="w-5 h-5" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full aspect-[4/3] rounded-2xl bg-slate-100 border border-dashed flex items-center justify-center text-slate-400 text-xs font-medium">
                                                {__('No adjunto')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="pt-3 border-t border-slate-100">
                        <Button
                            type="button"
                            onClick={() => setSelectedAcompananteDetail(null)}
                            className="w-full h-11 text-xs font-bold rounded-2xl bg-slate-900 hover:bg-black text-white shadow-md"
                        >
                            {__('Cerrar')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

GaritaControl.layout = (page: React.ReactNode) => page;
