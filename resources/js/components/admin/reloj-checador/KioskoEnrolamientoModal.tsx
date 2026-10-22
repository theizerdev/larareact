import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    ScanFace,
    ShieldCheck,
    Camera,
    Upload,
    X,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowLeft,
    Sparkles,
    UserCheck,
    RefreshCw,
    Timer,
    SwitchCamera,
    Check,
    Zap,
    Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface EmpleadoKioskoEnrolar {
    id: number;
    nombre_completo: string;
    nombres?: string;
    apellidos?: string;
    documento_identidad: string;
    numero?: string | null;
    area?: string | null;
    departamento?: string | null;
    cargo?: string | null;
    genero?: string | null;
    fecha_nacimiento?: string | null;
    empresa_nombre?: string | null;
    foto_empleado?: string | null;
    enrolado?: boolean;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    empleado: EmpleadoKioskoEnrolar | null;
    empresaNombre?: string;
    csrfToken: string;
    onSuccess: (updatedEmpleado: any) => void;
}

const LADO_MAXIMO = 1280;

function DatoTarjeta({ etiqueta, valor, mono = false }: { etiqueta: string; valor: string | null | undefined; mono?: boolean }) {
    return (
        <div className="rounded-2xl border border-border/80 bg-card/80 p-3 sm:p-4 shadow-2xs backdrop-blur-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{etiqueta}</p>
            <p className={cn('mt-1 text-sm sm:text-base font-bold text-foreground truncate', mono && 'font-mono tracking-wider')}>
                {valor || '—'}
            </p>
        </div>
    );
}

export function KioskoEnrolamientoModal({
    isOpen,
    onClose,
    empleado,
    empresaNombre = 'Smurfit Westrock',
    csrfToken,
    onSuccess,
}: Props) {
    const [paso, setPaso] = useState<number>(1);

    // Formulario
    const [avisoAceptado, setAvisoAceptado] = useState<boolean>(false);
    const [foto1, setFoto1] = useState<string>('');
    const [foto2, setFoto2] = useState<string>('');
    const [genero, setGenero] = useState<string>('');
    const [fechaNacimiento, setFechaNacimiento] = useState<string>('');

    // Cámara en vivo integrada en el Kiosko
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraActive, setCameraActive] = useState<boolean>(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [isMirrored, setIsMirrored] = useState<boolean>(true);
    const [flashing, setFlashing] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [fotoActivaTarget, setFotoActivaTarget] = useState<1 | 2>(1);
    const [secuenciaEnProgreso, setSecuenciaEnProgreso] = useState<boolean>(false);

    const archivoInputRef = useRef<HTMLInputElement | null>(null);
    const [archivoTarget, setArchivoTarget] = useState<1 | 2>(1);

    const [loading, setLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Sonido de obturador para feedback auditivo de captura
    const playShutterSound = () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.12);
        } catch { }
    };

    // Chime de éxito cuando ambas fotos quedan listas
    const playSuccessChime = () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const now = audioCtx.currentTime;

            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(523.25, now);
            gain1.gain.setValueAtTime(0.18, now);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);
            osc1.start(now);
            osc1.stop(now + 0.2);

            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(659.25, now + 0.15);
            gain2.gain.setValueAtTime(0.2, now + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.start(now + 0.15);
            osc2.stop(now + 0.45);
        } catch { }
    };

    // Detener cámara al salir
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
        setCountdown(null);
        setSecuenciaEnProgreso(false);
    }, []);

    // Iniciar cámara con alta resolución
    const startCamera = useCallback(async () => {
        setCameraError(null);
        if (!navigator?.mediaDevices?.getUserMedia) {
            setCameraError('No se detectó cámara en este dispositivo o el navegador no tiene soporte.');
            return;
        }

        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    facingMode,
                },
                audio: false,
            });

            streamRef.current = mediaStream;

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play().catch(() => { });
            }
            setCameraActive(true);
        } catch (err: any) {
            console.error('Error accediendo a la cámara:', err);
            setCameraActive(false);
            setCameraError('No se pudo acceder a la cámara. Verifique que no esté en uso por otra ventana y otorgue permisos.');
        }
    }, [facingMode]);

    // Asignar video ref al montar el elemento del DOM
    const handleVideoRef = useCallback((node: HTMLVideoElement | null) => {
        videoRef.current = node;
        if (node && streamRef.current) {
            node.srcObject = streamRef.current;
            node.play().catch(() => { });
        }
    }, []);

    // Iniciar o parar cámara según paso
    useEffect(() => {
        if (isOpen && paso === 2) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isOpen, paso, startCamera, stopCamera]);

    // Cargar datos pre-existentes del colaborador al abrir
    useEffect(() => {
        if (!isOpen || !empleado) {
            setPaso(1);
            setAvisoAceptado(false);
            setFoto1('');
            setFoto2('');
            setGenero('');
            setFechaNacimiento('');
            setErrorMsg(null);
            setFieldErrors({});
            setCountdown(null);
            setSecuenciaEnProgreso(false);
            stopCamera();
            return;
        }

        setPaso(1);
        setAvisoAceptado(false);
        setFoto1('');
        setFoto2('');
        setGenero(empleado.genero === 'M' || empleado.genero === 'F' ? empleado.genero : '');
        setFechaNacimiento(empleado.fecha_nacimiento || '');
        setErrorMsg(null);
        setFieldErrors({});
        setFotoActivaTarget(1);
        setCountdown(null);
        setSecuenciaEnProgreso(false);
    }, [isOpen, empleado?.id, stopCamera]);

    // Salir con tecla Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !loading && isOpen) {
                stopCamera();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, loading, stopCamera, onClose]);

    if (!isOpen || !empleado) return null;

    const nombreMostrar = empleado.nombres || empleado.nombre_completo.split(' ')[0] || 'Colaborador';
    const empresaFinal = empleado.empresa_nombre || empresaNombre;

    // Disparo inmediato de foto desde el canvas
    const capturarSnapshot = (targetFoto: 1 | 2): string | null => {
        if (!videoRef.current) return null;
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        if (isMirrored) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

        // Flash visual y sonido
        setFlashing(true);
        setTimeout(() => setFlashing(false), 120);
        playShutterSound();

        if (targetFoto === 1) {
            setFoto1(dataUrl);
            setFieldErrors((prev) => {
                const copy = { ...prev };
                delete copy.foto_empleado;
                return copy;
            });
            // Si la foto 2 no está tomada, avanzar automáticamente a la foto 2
            if (!foto2) {
                setTimeout(() => setFotoActivaTarget(2), 250);
            }
        } else {
            setFoto2(dataUrl);
            setFieldErrors((prev) => {
                const copy = { ...prev };
                delete copy.foto_empleado_2;
                return copy;
            });
            if (foto1 || targetFoto === 2) {
                playSuccessChime();
            }
        }

        return dataUrl;
    };

    // Disparo con cuenta regresiva (3... 2... 1... ¡Clic!)
    const iniciarCuentaRegresiva = (targetFoto: 1 | 2) => {
        if (countdown !== null) return;
        setCountdown(3);

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    capturarSnapshot(targetFoto);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Secuencia automática: Foto 1 -> 1.5s -> Foto 2
    const iniciarSecuenciaAutomatica = () => {
        if (countdown !== null || secuenciaEnProgreso) return;
        setSecuenciaEnProgreso(true);
        setFotoActivaTarget(1);
        setCountdown(3);

        const timer1 = setInterval(() => {
            setCountdown((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer1);
                    capturarSnapshot(1);

                    setTimeout(() => {
                        setFotoActivaTarget(2);
                        setCountdown(2);
                        const timer2 = setInterval(() => {
                            setCountdown((prev2) => {
                                if (prev2 === null || prev2 <= 1) {
                                    clearInterval(timer2);
                                    capturarSnapshot(2);
                                    setSecuenciaEnProgreso(false);
                                    return null;
                                }
                                return prev2 - 1;
                            });
                        }, 1000);
                    }, 1200);

                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const alternarCamara = () => {
        setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    };

    const elegirArchivo = (target: 1 | 2) => {
        setArchivoTarget(target);
        archivoInputRef.current?.click();
    };

    const leerArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        e.target.value = '';
        if (!archivo) return;

        const lector = new FileReader();
        lector.onload = () => {
            const img = new Image();
            img.onload = () => {
                const escala = Math.min(1, LADO_MAXIMO / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * escala);
                canvas.height = Math.round(img.height * escala);
                canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

                if (archivoTarget === 1) {
                    setFoto1(dataUrl);
                    if (!foto2) setFotoActivaTarget(2);
                } else {
                    setFoto2(dataUrl);
                    if (foto1) playSuccessChime();
                }
            };
            img.src = String(lector.result);
        };
        lector.readAsDataURL(archivo);
    };

    const handleFinalizar = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        setFieldErrors({});

        try {
            const payload = {
                empleado_id: empleado.id,
                aviso_privacidad: avisoAceptado,
                foto_empleado: foto1,
                foto_empleado_2: foto2,
                genero,
                fecha_nacimiento: fechaNacimiento,
            };

            const response = await fetch('/admin/api/reloj-checador/enrolar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-XSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                stopCamera();
                setPaso(3);
                onSuccess(data.empleado);
            } else {
                if (data.errors) {
                    setFieldErrors(data.errors);
                }
                setErrorMsg(data.message || 'Error al completar el enrolamiento. Verifique los datos ingresados.');
            }
        } catch (err: any) {
            setErrorMsg('No se pudo conectar con el servidor para enrolar al colaborador.');
        } finally {
            setLoading(false);
        }
    };

    const fotosListas = Boolean(foto1 && foto2);
    const datosListos = Boolean(genero && fechaNacimiento);
    const formularioCompleto = fotosListas && datosListos;

    return (
        <div className="fixed inset-0 z-50 w-screen h-screen bg-background text-foreground flex flex-col overflow-hidden select-none animate-in fade-in-50 duration-200">
            {/* CABECERA FULLSCREEN DE LA ESTACIÓN DE ENROLAMIENTO */}
            <header className="h-18 px-6 md:px-10 border-b border-border/80 bg-card/60 backdrop-blur-md flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                        <ScanFace className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                                Enrolamiento Biométrico Facial
                            </h1>
                            <Badge variant="outline" className="hidden sm:inline-flex bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 text-xs px-2.5 py-0.5 font-bold">
                                Kiosko de Planta
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-xl">
                            {empresaFinal} • Sincronización automática de plantilla con terminales BioTime
                        </p>
                    </div>
                </div>

                {/* PASOS DE PROGRESO */}
                <div className="hidden lg:flex items-center gap-3">
                    {[
                        { num: 1, label: 'Datos del Colaborador' },
                        { num: 2, label: 'Toma Facial HD' },
                        { num: 3, label: 'Sincronizado BioTime' },
                    ].map((p, idx) => (
                        <React.Fragment key={p.num}>
                            <div className="flex items-center gap-2">
                                <span
                                    className={cn(
                                        'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all shadow-xs',
                                        paso >= p.num
                                            ? 'bg-indigo-600 text-white scale-105 shadow-indigo-600/30'
                                            : 'border border-border text-muted-foreground bg-muted/40'
                                    )}
                                >
                                    {paso > p.num ? <Check className="w-4 h-4" /> : p.num}
                                </span>
                                <span className={cn('font-bold text-xs', paso >= p.num ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground')}>
                                    {p.label}
                                </span>
                            </div>
                            {idx < 2 && <span className="h-0.5 w-8 bg-border" />}
                        </React.Fragment>
                    ))}
                </div>

                {/* BOTÓN SALIR / CANCELAR */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => { if (!loading) { stopCamera(); onClose(); } }}
                    className="h-11 px-5 rounded-xl border-border hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 gap-2 font-bold text-xs sm:text-sm"
                >
                    <X className="w-4 h-4" />
                    <span>Cancelar</span>
                </Button>
            </header>

            <input
                ref={archivoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={leerArchivo}
            />

            {/* CUERPO PRINCIPAL FULLSCREEN */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col justify-center">
                {/* PASO 1: DATOS PRECARGADOS Y AVISO DE PRIVACIDAD */}
                {paso === 1 && (
                    <div className="max-w-4xl w-full mx-auto space-y-6 my-auto animate-in fade-in-50 duration-300">
                        {/* HERO BIENVENIDA */}
                        <div className="flex items-start gap-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/5 border-2 border-indigo-500/20 p-6 rounded-3xl shadow-sm">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/30">
                                <Sparkles className="w-7 h-7" />
                            </div>
                            <div className="space-y-1.5">
                                <h2 className="text-2xl font-black text-foreground">
                                    ¡Bienvenido(a), {nombreMostrar}!
                                </h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Tus datos ya forman parte de la plantilla de <strong>{empresaFinal}</strong>. Para habilitar tu marcaje en este quiosco y sincronizar tu rostro con las terminales BioTime de planta, realizaremos una rápida toma fotográfica de frente.
                                </p>
                            </div>
                        </div>

                        {/* TARJETAS DE DATOS */}
                        <div className="space-y-2.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Información Oficial del Colaborador:
                            </Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                                <DatoTarjeta etiqueta="No. Empleado" valor={empleado.numero || empleado.documento_identidad} mono />
                                <DatoTarjeta etiqueta="Nombre Completo" valor={empleado.nombre_completo} />
                                <DatoTarjeta etiqueta="Área / Departamento" valor={empleado.area || empleado.departamento || 'General'} />
                                <DatoTarjeta etiqueta="Puesto / Cargo" valor={empleado.cargo || 'Operativo'} />
                            </div>
                        </div>

                        {/* AVISO DE PRIVACIDAD */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span>Consentimiento y Aviso de Privacidad Biométrico:</span>
                            </div>
                            <div className="max-h-48 overflow-y-auto rounded-2xl border bg-muted/20 p-5 text-xs sm:text-sm leading-relaxed text-muted-foreground space-y-2 select-none shadow-inner">
                                <p>
                                    <strong>{empresaFinal}</strong> es el responsable del tratamiento y resguardo confidencial de sus datos personales sensibles y biométricos faciales.
                                </p>
                                <p>
                                    Dichos datos se emplean estrictamente para el registro de asistencia laboral, puntualidad y control de accesos a las instalaciones de la empresa en cumplimiento con las políticas internas.
                                </p>
                                <p>
                                    Al marcar la casilla, otorga su consentimiento expreso para la toma fotográfica y su sincronización biométrica con el sistema BioTime.
                                </p>
                            </div>

                            <label className="flex cursor-pointer items-start gap-4 rounded-2xl border-2 border-border/80 bg-card p-5 hover:bg-muted/30 transition-all shadow-sm">
                                <Checkbox
                                    checked={avisoAceptado}
                                    onCheckedChange={(val) => setAvisoAceptado(val === true)}
                                    className="mt-0.5 h-6 w-6 rounded-lg data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                />
                                <span className="text-sm font-bold text-foreground leading-snug">
                                    He leído, comprendo y acepto el aviso de privacidad para el tratamiento de mis datos biométricos faciales.
                                </span>
                            </label>
                        </div>

                        {/* BOTÓN INICIAR */}
                        <div className="pt-2">
                            <Button
                                type="button"
                                size="lg"
                                disabled={!avisoAceptado}
                                onClick={() => setPaso(2)}
                                className="w-full h-18 text-lg font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all active:scale-98"
                            >
                                <Camera className="w-6 h-6" />
                                <span>COMENZAR TOMA DE FOTOGRAFÍAS</span>
                            </Button>
                        </div>
                    </div>
                )}

                {/* PASO 2: TOMA FACIAL FULLSCREEN */}
                {paso === 2 && (
                    <form onSubmit={handleFinalizar} className="max-w-7xl w-full mx-auto flex flex-col justify-center h-full space-y-4 my-auto animate-in fade-in-50 duration-300">
                        {errorMsg && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-red-600 dark:text-red-400 text-sm font-semibold">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* GRID PRINCIPAL: LADO IZQUIERDO VISOR DE CÁMARA (65%), LADO DERECHO PREVIEWS Y VALIDACIÓN (35%) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                            {/* COLUMNA IZQUIERDA: VISOR DE ALTA RESOLUCIÓN */}
                            <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                                {/* CONTENEDOR DEL VISOR DE CÁMARA */}
                                <div className="relative w-full aspect-[4/3] max-h-[56vh] min-h-[380px] rounded-3xl overflow-hidden bg-slate-950 border-4 border-indigo-500/40 shadow-2xl flex items-center justify-center mx-auto">
                                    {cameraActive ? (
                                        <>
                                            <video
                                                ref={handleVideoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className={cn(
                                                    'w-full h-full object-cover transition-opacity duration-150',
                                                    isMirrored && 'scale-x-[-1]',
                                                    flashing && 'opacity-0'
                                                )}
                                            />

                                            {/* Flash visual al disparar */}
                                            {flashing && (
                                                <div className="absolute inset-0 bg-white animate-out fade-out-90 duration-150 pointer-events-none" />
                                            )}

                                            {/* HUD BIOMÉTRICO: 4 MARCADORES DE ESQUINA */}
                                            <div className="pointer-events-none absolute inset-5 border-white/10 rounded-2xl">
                                                <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl shadow-lg" />
                                                <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl shadow-lg" />
                                                <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl shadow-lg" />
                                                <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-xl shadow-lg" />
                                            </div>

                                            {/* BADGE SUPERIOR DE ESTADO EN VIVO */}
                                            <div className="absolute top-4 left-4 flex items-center gap-2.5 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 text-xs text-white">
                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                                                <span className="font-black tracking-wider uppercase">Cámara Kiosko</span>
                                                <span className="text-white/40">|</span>
                                                <span className="font-mono font-bold text-indigo-300">
                                                    {fotoActivaTarget === 1 ? '🎯 FOTO 1 (PRINCIPAL)' : '🎯 FOTO 2 (VALIDACIÓN)'}
                                                </span>
                                            </div>

                                            {/* GUÍA FACIAL EN ÓVALO AMPLIO */}
                                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-4">
                                                <div
                                                    className={cn(
                                                        'w-[60%] h-[78%] rounded-[50%] border-3 border-dashed transition-all duration-300 flex items-center justify-center',
                                                        fotoActivaTarget === 1
                                                            ? 'border-indigo-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]'
                                                            : 'border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]'
                                                    )}
                                                >
                                                    {countdown !== null && (
                                                        <span className="text-8xl sm:text-9xl font-black text-amber-300 drop-shadow-[0_6px_24px_rgba(0,0,0,0.9)] animate-pulse">
                                                            {countdown}
                                                        </span>
                                                    )}
                                                </div>

                                                <span className="text-xs sm:text-sm font-bold text-white bg-black/75 px-5 py-1.5 rounded-full mt-3 backdrop-blur-md border border-white/15 shadow-xl">
                                                    {fotoActivaTarget === 1
                                                        ? '🎯 Coloque su rostro de frente dentro del óvalo con buena luz'
                                                        : '🎯 Mantenga la posición para la toma de verificación biométrica'}
                                                </span>
                                            </div>

                                            {/* HERRAMIENTAS RÁPIDAS DEL VISOR */}
                                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsMirrored((prev) => !prev)}
                                                    className={cn(
                                                        'h-10 px-3.5 rounded-full text-xs font-bold backdrop-blur-md border transition-all active:scale-95 shadow-lg flex items-center gap-1.5',
                                                        isMirrored
                                                            ? 'bg-black/60 text-white border-white/20 hover:bg-black/80'
                                                            : 'bg-indigo-600 text-white border-indigo-400'
                                                    )}
                                                >
                                                    <span>🪞</span>
                                                    <span>Espejo</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={alternarCamara}
                                                    title="Alternar dispositivo de cámara"
                                                    className="h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all active:scale-95 shadow-lg"
                                                >
                                                    <SwitchCamera className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </>
                                    ) : cameraError ? (
                                        <div className="p-8 text-center text-white space-y-4 max-w-lg">
                                            <AlertCircle className="w-14 h-14 text-rose-400 mx-auto" />
                                            <h4 className="font-bold text-lg">Cámara no disponible</h4>
                                            <p className="text-sm text-white/80">{cameraError}</p>
                                            <div className="flex flex-wrap gap-3 justify-center pt-2">
                                                <Button type="button" size="lg" onClick={startCamera} className="bg-white text-black hover:bg-slate-200 font-bold">
                                                    <RefreshCw className="w-5 h-5 mr-2" /> Reintentar Cámara
                                                </Button>
                                                <Button type="button" size="lg" variant="outline" onClick={() => elegirArchivo(fotoActivaTarget)} className="border-white/30 text-white font-bold">
                                                    <Upload className="w-5 h-5 mr-2" /> Subir Archivo
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 text-white/90">
                                            <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
                                            <span className="text-base font-bold">Iniciando cámara facial en alta definición...</span>
                                        </div>
                                    )}
                                </div>

                                {/* CONTROLES TÁCTILES GRANDES DE CAPTURA */}
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <Button
                                            type="button"
                                            size="lg"
                                            disabled={!cameraActive || countdown !== null}
                                            onClick={() => capturarSnapshot(fotoActivaTarget)}
                                            className={cn(
                                                'h-18 sm:h-20 text-lg sm:text-xl font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95',
                                                fotoActivaTarget === 1
                                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                                            )}
                                        >
                                            <Camera className="w-7 h-7" />
                                            <span>
                                                {fotoActivaTarget === 1 ? '📸 TOMAR FOTO 1' : '📸 TOMAR FOTO 2'}
                                            </span>
                                        </Button>

                                        <Button
                                            type="button"
                                            size="lg"
                                            variant="outline"
                                            disabled={!cameraActive || countdown !== null}
                                            onClick={() => iniciarCuentaRegresiva(fotoActivaTarget)}
                                            className="h-18 sm:h-20 text-base sm:text-lg font-bold rounded-2xl border-2 hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                                        >
                                            <Timer className="w-6 h-6 text-amber-500" />
                                            <span>⏱️ Conteo de 3s</span>
                                        </Button>
                                    </div>

                                    {/* OPCIÓN DE SECUENCIA AUTOMÁTICA Y SUBIDA MANUAL */}
                                    <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground px-2 gap-2">
                                        <button
                                            type="button"
                                            disabled={!cameraActive || countdown !== null || secuenciaEnProgreso}
                                            onClick={iniciarSecuenciaAutomatica}
                                            className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-2 transition-colors"
                                        >
                                            <Zap className="w-4 h-4 text-amber-500" />
                                            <span>⚡ Secuencia automática rápida (Dispara Foto 1 y Foto 2 seguidas)</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => elegirArchivo(fotoActivaTarget)}
                                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                                        >
                                            <Upload className="w-4 h-4" />
                                            <span>Cargar desde archivo</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* COLUMNA DERECHA: REVISIÓN DE FOTOS Y CONFIRMACIÓN DE DATOS */}
                            <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-muted/20 border-2 border-border/80 p-5 sm:p-6 rounded-3xl shadow-sm">
                                {/* ESTADO Y MINIATURAS DE LAS FOTOS */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                            Validación de Fotografías:
                                        </Label>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                'font-bold text-xs',
                                                fotosListas
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                    : 'bg-muted text-muted-foreground'
                                            )}
                                        >
                                            {fotosListas ? '✓ Ambas Fotos Listas' : foto1 ? '1 de 2 Listas' : 'Pendientes'}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3.5">
                                        {/* TARJETA FOTO 1 */}
                                        <div
                                            onClick={() => setFotoActivaTarget(1)}
                                            className={cn(
                                                'relative aspect-[4/3] rounded-2xl border-3 overflow-hidden flex flex-col items-center justify-center p-2 cursor-pointer transition-all',
                                                fotoActivaTarget === 1
                                                    ? 'border-indigo-600 ring-4 ring-indigo-500/20 shadow-md bg-indigo-50/20 dark:bg-indigo-950/20'
                                                    : 'border-border bg-card hover:border-border/80'
                                            )}
                                        >
                                            {foto1 ? (
                                                <>
                                                    <img src={foto1} alt="Foto 1" className="w-full h-full object-cover rounded-xl" />
                                                    <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                                                        <Check className="w-3.5 h-3.5" /> FOTO 1
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFoto1('');
                                                            setFotoActivaTarget(1);
                                                        }}
                                                        className="absolute bottom-2 right-2 bg-black/80 hover:bg-black text-white p-2 rounded-full shadow-lg transition-all active:scale-95"
                                                        title="Volver a tomar Foto 1"
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="text-center p-2 space-y-1.5 text-muted-foreground">
                                                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-foreground/60">
                                                        <Camera className="w-6 h-6" />
                                                    </div>
                                                    <span className="text-sm font-bold block text-foreground">Foto 1</span>
                                                    <span className="text-xs block opacity-75">Toma Principal</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* TARJETA FOTO 2 */}
                                        <div
                                            onClick={() => setFotoActivaTarget(2)}
                                            className={cn(
                                                'relative aspect-[4/3] rounded-2xl border-3 overflow-hidden flex flex-col items-center justify-center p-2 cursor-pointer transition-all',
                                                fotoActivaTarget === 2
                                                    ? 'border-emerald-600 ring-4 ring-emerald-500/20 shadow-md bg-emerald-50/20 dark:bg-emerald-950/20'
                                                    : 'border-border bg-card hover:border-border/80'
                                            )}
                                        >
                                            {foto2 ? (
                                                <>
                                                    <img src={foto2} alt="Foto 2" className="w-full h-full object-cover rounded-xl" />
                                                    <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                                                        <Check className="w-3.5 h-3.5" /> FOTO 2
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFoto2('');
                                                            setFotoActivaTarget(2);
                                                        }}
                                                        className="absolute bottom-2 right-2 bg-black/80 hover:bg-black text-white p-2 rounded-full shadow-lg transition-all active:scale-95"
                                                        title="Volver a tomar Foto 2"
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="text-center p-2 space-y-1.5 text-muted-foreground">
                                                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-foreground/60">
                                                        <Camera className="w-6 h-6" />
                                                    </div>
                                                    <span className="text-sm font-bold block text-foreground">Foto 2</span>
                                                    <span className="text-xs block opacity-75">Toma Validación</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {(fieldErrors.foto_empleado || fieldErrors.foto_empleado_2) && (
                                        <p className="text-xs text-red-500 font-semibold">
                                            {fieldErrors.foto_empleado || fieldErrors.foto_empleado_2}
                                        </p>
                                    )}
                                </div>

                                {/* CAMPOS DE GÉNERO Y FECHA DE NACIMIENTO */}
                                <div className="space-y-4 border border-border/80 rounded-2xl p-4 sm:p-5 bg-card/60">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                                            <span>Sexo / Género:</span>
                                            <span className="text-[11px] text-muted-foreground font-normal">Requerido por BioTime</span>
                                        </Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { valor: 'M', etiqueta: '👨 Hombre' },
                                                { valor: 'F', etiqueta: '👩 Mujer' },
                                            ].map(({ valor, etiqueta }) => (
                                                <Button
                                                    key={valor}
                                                    type="button"
                                                    variant={genero === valor ? 'default' : 'outline'}
                                                    className={cn(
                                                        'font-bold text-sm h-14 rounded-xl transition-all',
                                                        genero === valor
                                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 text-base'
                                                            : 'border-border'
                                                    )}
                                                    onClick={() => setGenero(valor)}
                                                    disabled={loading}
                                                >
                                                    {etiqueta}
                                                </Button>
                                            ))}
                                        </div>
                                        {fieldErrors.genero && (
                                            <p className="text-xs text-red-500 font-medium">{fieldErrors.genero}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2 pt-1">
                                        <Label htmlFor="fecha_nacimiento_kiosko_fs" className="text-xs font-bold text-foreground flex items-center justify-between">
                                            <span>Fecha de Nacimiento:</span>
                                            <span className="text-[11px] text-muted-foreground font-normal">Requerido</span>
                                        </Label>
                                        <Input
                                            id="fecha_nacimiento_kiosko_fs"
                                            type="date"
                                            max={new Date().toISOString().slice(0, 10)}
                                            min="1920-01-01"
                                            value={fechaNacimiento}
                                            onChange={(e) => setFechaNacimiento(e.target.value)}
                                            className="font-mono text-sm h-14 rounded-xl px-4"
                                            disabled={loading}
                                        />
                                        {fieldErrors.fecha_nacimiento && (
                                            <p className="text-xs text-red-500 font-medium">{fieldErrors.fecha_nacimiento}</p>
                                        )}
                                    </div>
                                </div>

                                {/* BOTÓN FINAL DE GUARDADO Y SINCRONIZACIÓN */}
                                <div className="space-y-2 pt-1">
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={loading || !formularioCompleto}
                                        className={cn(
                                            'w-full h-18 text-lg font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-98',
                                            formularioCompleto
                                                ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white shadow-indigo-600/40'
                                                : 'bg-muted text-muted-foreground opacity-60 cursor-not-allowed'
                                        )}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span>Sincronizando con BioTime...</span>
                                            </>
                                        ) : (
                                            <>
                                                <UserCheck className="w-6 h-6" />
                                                <span>FINALIZAR Y ENROLAR</span>
                                            </>
                                        )}
                                    </Button>

                                    {!formularioCompleto && (
                                        <div className="text-xs text-muted-foreground text-center space-x-2">
                                            <span>Falta:</span>
                                            {!foto1 && <span className="font-bold text-amber-600">Foto 1 •</span>}
                                            {!foto2 && <span className="font-bold text-amber-600">Foto 2 •</span>}
                                            {!genero && <span className="font-bold text-amber-600">Sexo •</span>}
                                            {!fechaNacimiento && <span className="font-bold text-amber-600">Fecha Nacimiento</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* BARRA INFERIOR DE REGRESO */}
                        <div className="pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setPaso(1)}
                                disabled={loading}
                                className="gap-2 h-11 px-5 rounded-xl text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Atrás: Revisar datos</span>
                            </Button>
                        </div>
                    </form>
                )}

                {/* PASO 3: ÉXITO Y CONFIRMACIÓN FINAL */}
                {paso === 3 && (
                    <div className="max-w-xl w-full mx-auto my-auto text-center space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shadow-2xl shadow-emerald-500/30 mx-auto">
                            <CheckCircle2 className="h-16 w-16" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-foreground">
                                ¡Enrolamiento Biométrico Exitoso!
                            </h2>
                            <p className="text-base text-muted-foreground leading-relaxed">
                                Los rasgos faciales de <strong className="text-foreground">{empleado.nombre_completo}</strong> han sido registrados y sincronizados con éxito en la plataforma BioTime.
                            </p>
                        </div>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 px-5 py-2 font-mono text-sm">
                            ✓ Estado: Enrolado y Listo para Checar Asistencia
                        </Badge>
                        <div className="pt-4">
                            <Button
                                type="button"
                                size="lg"
                                className="w-full h-18 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-600/30 transition-all active:scale-95"
                                onClick={onClose}
                            >
                                CONTINUAR AL RELOJ CHECADOR
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
