import React, { useState, useEffect, useRef } from 'react';
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
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ModuleHeader } from '@/components/module-header';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { useTranslate } from '@/hooks/use-translate';

interface Acompanante {
    nombre: string;
    documento?: string;
}

interface GaritaProps {
    searchQuery?: string;
    resultado?: {
        tipo: 'invitacion' | 'acceso';
        data: any;
    } | null;
    visitasEsperadas?: any[];
    siguienteCodigo?: number;
    timezone?: string;
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
                    videoRef.current.play().catch(() => {});
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
        router.post(`/admin/visitas-accesos/invitaciones/${invitacionId}/canjear`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                notifySuccess(__('¡Ingreso registrado correctamente en Garita! Se notificó al anfitrión por WhatsApp.'));
            },
            onError: () => {
                notifyError(__('Ocurrió un error al registrar el ingreso. Intente nuevamente.'));
            }
        });
    };

    // Marcar salida oficial de Garita
    const handleMarcarSalida = (accesoId: number) => {
        router.patch(`/admin/visitas-accesos/${accesoId}/marcar-salida`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                notifySuccess(__('Salida registrada correctamente en Garita.'));
            },
        });
    };

    const isInvitacion = resultado?.tipo === 'invitacion';
    const isAcceso = resultado?.tipo === 'acceso';
    const record = resultado?.data;

    return (
        <>
            <Head title={__('Control de Garita - Lectura de QR')} />

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
                        <div className={`p-5 text-white flex flex-wrap items-center justify-between gap-4 ${
                            isInvitacion && record.status === 'pendiente' ? 'bg-[#104a29]' :
                            isAcceso && record.status === 1 ? 'bg-blue-700' :
                            'bg-slate-800'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                    <Shield className="w-7 h-7 text-emerald-300" />
                                </div>
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 block">
                                        {isInvitacion ? __('Pre-Anuncio Registrado') : __('Registro de Acceso Garita')}
                                    </span>
                                    <h2 className="text-xl font-extrabold tracking-tight">
                                        {isInvitacion ? record.visitante_nombre : (record.empleado ? `${record.empleado.nombres} ${record.empleado.apellidos}` : record.proveedor ? (record.proveedor.razon_social || record.proveedor.nombre_comercial) : (record.productor?.nombre_comercial_rancho || 'Visitante'))}
                                    </h2>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
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
                                    N° {isInvitacion ? record.codigo_invitacion : record.codigo_visitante}
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
                                    
                                    {record.foto_carnet ? (
                                        <div className="relative w-40 h-40 mx-auto rounded-3xl overflow-hidden border-4 border-[#104a29] shadow-lg group cursor-pointer" onClick={() => setActiveImageModal(record.foto_carnet.startsWith('data:') ? record.foto_carnet : `/storage/${record.foto_carnet}`)}>
                                            <img src={record.foto_carnet.startsWith('data:') ? record.foto_carnet : `/storage/${record.foto_carnet}`} alt="Carnet" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                <Maximize2 className="w-6 h-6" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-40 h-40 mx-auto rounded-3xl bg-slate-200 border-4 border-slate-300 flex items-center justify-center text-slate-400">
                                            <User className="w-20 h-20" />
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <h3 className="font-extrabold text-lg text-slate-900">
                                            {isInvitacion ? record.visitante_nombre : (record.empleado ? `${record.empleado.nombres} ${record.empleado.apellidos}` : record.proveedor ? record.proveedor.razon_social : record.productor?.nombre_comercial_rancho)}
                                        </h3>
                                        {record.visitante_empresa && (
                                            <span className="text-xs font-semibold text-slate-600 block flex items-center justify-center gap-1">
                                                <Building className="w-3.5 h-3.5 text-emerald-600" /> {record.visitante_empresa}
                                            </span>
                                        )}
                                        {record.visitante_documento && (
                                            <span className="text-xs font-mono text-slate-500 block">
                                                Doc ID: {record.visitante_documento}
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
                                            {record.doc_foto_frontal ? (
                                                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-300 cursor-pointer group relative" onClick={() => setActiveImageModal(record.doc_foto_frontal.startsWith('data:') ? record.doc_foto_frontal : `/storage/${record.doc_foto_frontal}`)}>
                                                    <img src={record.doc_foto_frontal.startsWith('data:') ? record.doc_foto_frontal : `/storage/${record.doc_foto_frontal}`} alt="Doc Frontal" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 className="w-5 h-5" /></div>
                                                </div>
                                            ) : (
                                                <div className="w-full aspect-[4/3] rounded-2xl bg-slate-100 border border-dashed flex items-center justify-center text-slate-400 text-xs font-medium">{__('No adjunto')}</div>
                                            )}
                                        </div>

                                        <div className="space-y-1 text-center">
                                            <span className="text-[11px] font-bold text-slate-500">{__('Doc. Trasero')}</span>
                                            {record.doc_foto_trasera ? (
                                                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-300 cursor-pointer group relative" onClick={() => setActiveImageModal(record.doc_foto_trasera.startsWith('data:') ? record.doc_foto_trasera : `/storage/${record.doc_foto_trasera}`)}>
                                                    <img src={record.doc_foto_trasera.startsWith('data:') ? record.doc_foto_trasera : `/storage/${record.doc_foto_trasera}`} alt="Doc Trasero" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
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
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                        {record.medio_acceso === 'vehicular' ? <Car className="w-4 h-4 text-amber-500" /> : <Footprints className="w-4 h-4 text-emerald-600" />}
                                        {__('Medio de Acceso')}
                                    </h4>

                                    {record.medio_acceso === 'vehicular' ? (
                                        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-extrabold text-amber-900 text-sm flex items-center gap-2">
                                                    <Car className="w-5 h-5 text-amber-600" /> {__('Acceso Vehicular')}
                                                </span>
                                                {record.vehiculo_placa && (
                                                    <span className="font-mono text-sm font-extrabold bg-amber-200 text-amber-950 px-3 py-1 rounded-xl border border-amber-300">
                                                        {record.vehiculo_placa}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 font-mono">
                                                <div><span className="text-slate-400 font-sans">{__('Marca:')}</span> {record.vehiculo_marca || '-'}</div>
                                                <div><span className="text-slate-400 font-sans">{__('Modelo:')}</span> {record.vehiculo_modelo || '-'}</div>
                                                <div><span className="text-slate-400 font-sans">{__('Año:')}</span> {record.vehiculo_anio || '-'}</div>
                                                <div><span className="text-slate-400 font-sans">{__('Tipo:')}</span> {record.vehiculo_tipo || 'Auto'}</div>
                                            </div>

                                            {/* Fotos del Vehículo */}
                                            <div className="grid grid-cols-2 gap-2 pt-2">
                                                <div className="text-center">
                                                    <span className="text-[10px] font-bold text-slate-500">{__('Vehículo Frontal')}</span>
                                                    {record.vehiculo_foto_frontal ? (
                                                        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-300 cursor-pointer group relative" onClick={() => setActiveImageModal(record.vehiculo_foto_frontal.startsWith('data:') ? record.vehiculo_foto_frontal : `/storage/${record.vehiculo_foto_frontal}`)}>
                                                            <img src={record.vehiculo_foto_frontal.startsWith('data:') ? record.vehiculo_foto_frontal : `/storage/${record.vehiculo_foto_frontal}`} alt="Vehículo Frontal" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 className="w-4 h-4" /></div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full aspect-[4/3] rounded-xl bg-amber-100/50 border border-dashed flex items-center justify-center text-slate-400 text-[10px]">{__('Sin foto')}</div>
                                                    )}
                                                </div>

                                                <div className="text-center">
                                                    <span className="text-[10px] font-bold text-slate-500">{__('Vehículo Trasero')}</span>
                                                    {record.vehiculo_foto_trasera ? (
                                                        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-300 cursor-pointer group relative" onClick={() => setActiveImageModal(record.vehiculo_foto_trasera.startsWith('data:') ? record.vehiculo_foto_trasera : `/storage/${record.vehiculo_foto_trasera}`)}>
                                                            <img src={record.vehiculo_foto_trasera.startsWith('data:') ? record.vehiculo_foto_trasera : `/storage/${record.vehiculo_foto_trasera}`} alt="Vehículo Trasero" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Maximize2 className="w-4 h-4" /></div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full aspect-[4/3] rounded-xl bg-amber-100/50 border border-dashed flex items-center justify-center text-slate-400 text-[10px]">{__('Sin foto')}</div>
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
                                        <span className="text-[11px] text-slate-400">({record.acompanantes?.length || 0})</span>
                                    </h4>

                                    {record.acompanantes && record.acompanantes.length > 0 ? (
                                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                            {record.acompanantes.map((ac: any, idx: number) => {
                                                const nombreCompleto = ac.nombre || `${ac.nombres || ''} ${ac.apellidos || ''}`.trim() || `Acompañante #${idx + 1}`;
                                                const docIdentidad = ac.documento || ac.documento_identidad || null;
                                                return (
                                                    <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between text-slate-800">
                                                        <span className="font-bold">{nombreCompleto}</span>
                                                        {docIdentidad && <span className="font-mono text-slate-500 text-[11px]">Doc: {docIdentidad}</span>}
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
                                </div>

                                {/* BOTÓN DE ACCIÓN 1-CLIC DE GARITA */}
                                <div className="space-y-3 pt-4 border-t border-slate-200">
                                    {isInvitacion && record.status === 'pendiente' && (
                                        <Button
                                            type="button"
                                            onClick={() => handleConfirmIngreso(record.id)}
                                            className="w-full h-16 bg-[#104a29] hover:bg-[#0c371e] text-white text-base font-extrabold rounded-2xl shadow-xl gap-2 flex items-center justify-center transition-transform active:scale-[0.98]"
                                        >
                                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                            {__('Confirmar Ingreso en Garita (1-Clic)')}
                                        </Button>
                                    )}

                                    {isAcceso && record.status === 1 && (
                                        <Button
                                            type="button"
                                            onClick={() => handleMarcarSalida(record.id)}
                                            className="w-full h-16 bg-slate-900 hover:bg-black text-white text-base font-extrabold rounded-2xl shadow-xl gap-2 flex items-center justify-center transition-transform active:scale-[0.98]"
                                        >
                                            <LogOut className="w-6 h-6 text-rose-400" />
                                            {__('Marcar Salida de Garita')}
                                        </Button>
                                    )}

                                    {isInvitacion && record.status === 'ingresado' && (
                                        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-center text-xs font-bold border border-emerald-300">
                                            {__('✓ Este visitante ya fue ingresado por Garita.')}
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
        </>
    );
}

GaritaControl.layout = (page: React.ReactNode) => page;
