import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
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
    Maximize2,
    FileText,
    ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TemplateSettingsProvider } from '@/hooks/use-template-settings';

export interface EmpleadoKioskoEnrolar {
    id: number;
    nombre_completo: string;
    nombres?: string;
    apellidos?: string;
    documento_identidad: string;
    codigo_nuevo?: string | null;
    codigo_anterior?: string | null;
    legacy?: string | null;
    numero?: string | null;
    genero?: string | null;
    fecha_nacimiento?: string | null;
    empresa_nombre?: string | null;
    foto_empleado?: string | null;
    enrolado?: boolean;
}

interface Props {
    empleado: EmpleadoKioskoEnrolar;
}

const KIOSKO_URL = '/admin/reloj-checador/kiosko';

function obtenerCsrfToken(): string {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') || '' : '';
}

const FOTO_BIOTIME_ANCHO = 500;
const FOTO_BIOTIME_ALTO = 480;

function crearFotoBioTime(
    origen: CanvasImageSource,
    anchoOrigen: number,
    altoOrigen: number,
    espejo = false,
): string | null {
    const canvas = document.createElement('canvas');
    canvas.width = FOTO_BIOTIME_ANCHO;
    canvas.height = FOTO_BIOTIME_ALTO;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return null;
    }

    const proporcionDestino = FOTO_BIOTIME_ANCHO / FOTO_BIOTIME_ALTO;
    let sx = 0;
    let sy = 0;
    let anchoRecorte = anchoOrigen;
    let altoRecorte = altoOrigen;

    if (anchoOrigen / altoOrigen > proporcionDestino) {
        anchoRecorte = altoOrigen * proporcionDestino;
        sx = (anchoOrigen - anchoRecorte) / 2;
    } else {
        altoRecorte = anchoOrigen / proporcionDestino;
        sy = (altoOrigen - altoRecorte) / 2;
    }

    if (espejo) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }

    ctx.drawImage(
        origen,
        sx,
        sy,
        anchoRecorte,
        altoRecorte,
        0,
        0,
        canvas.width,
        canvas.height,
    );

    return canvas.toDataURL('image/jpeg', 0.88);
}

function DatoTarjeta({
    etiqueta,
    valor,
    mono = false,
    className,
}: {
    etiqueta: string;
    valor: string | null | undefined;
    mono?: boolean;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex min-h-[105px] flex-col justify-between rounded-2xl border-2 border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-xs transition-all hover:border-indigo-500/50 hover:shadow-md sm:min-h-[120px] sm:p-5 md:p-6',
                className,
            )}
        >
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase sm:text-sm">
                {etiqueta}
            </p>
            <p
                className={cn(
                    'mt-2 text-base leading-tight font-black break-words text-foreground sm:text-lg md:text-xl',
                    mono && 'font-mono tracking-wider',
                )}
            >
                {valor || '—'}
            </p>
        </div>
    );
}

function EnrolamientoKiosko({ empleado }: Props) {
    const isOpen = true;
    const empresaNombre = 'Smurfit Westrock';
    const csrfToken = obtenerCsrfToken();
    const [paso, setPaso] = useState<number>(1);
    const [fotoFallida, setFotoFallida] = useState<boolean>(false);

    // Vuelve al Kiosko (pantalla principal). Tras un enrolamiento exitoso se
    // abre directamente el marcaje del colaborador recién enrolado.
    const onClose = useCallback(() => {
        router.visit(KIOSKO_URL);
    }, []);
    const volverAlMarcaje = () => {
        const codigo =
            empleado.codigo_nuevo ||
            empleado.numero ||
            empleado.documento_identidad;
        router.visit(`${KIOSKO_URL}?empleado=${encodeURIComponent(codigo)}`);
    };
    const onSuccess = (_actualizado: any) => {
        /* el estado se recarga al volver al Kiosko */
    };

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
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
        'user',
    );
    const [isMirrored, setIsMirrored] = useState<boolean>(true);
    const [flashing, setFlashing] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [fotoActivaTarget, setFotoActivaTarget] = useState<1 | 2>(1);
    const [secuenciaEnProgreso, setSecuenciaEnProgreso] =
        useState<boolean>(false);

    const archivoInputRef = useRef<HTMLInputElement | null>(null);
    const [archivoTarget, setArchivoTarget] = useState<1 | 2>(1);

    const [loading, setLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Trazabilidad y Cédula de Enrolamiento
    const [cedulaUuid, setCedulaUuid] = useState<string | null>(null);
    const [avisoRegistradoEn, setAvisoRegistradoEn] = useState<string | null>(
        null,
    );
    const [registrandoAviso, setRegistrandoAviso] = useState<boolean>(false);
    const [geoCoords, setGeoCoords] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const [cedulaGenerada, setCedulaGenerada] = useState<{
        id: number;
        uuid: string;
        sello_digital: string | null;
        pdf_url: string | null;
    } | null>(null);

    // Sonido de obturador para feedback auditivo de captura
    const playShutterSound = () => {
        try {
            const audioCtx = new (
                window.AudioContext || (window as any).webkitAudioContext
            )();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(
                1200,
                audioCtx.currentTime + 0.08,
            );
            gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(
                0.01,
                audioCtx.currentTime + 0.12,
            );
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.12);
        } catch {}
    };

    // Chime de éxito cuando ambas fotos quedan listas
    const playSuccessChime = () => {
        try {
            const audioCtx = new (
                window.AudioContext || (window as any).webkitAudioContext
            )();
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
        } catch {}
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
            setCameraError(
                'No se detectó cámara en este dispositivo o el navegador no tiene soporte.',
            );
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
                videoRef.current.play().catch(() => {});
            }
            setCameraActive(true);
        } catch (err: any) {
            console.error('Error accediendo a la cámara:', err);
            setCameraActive(false);
            setCameraError(
                'No se pudo acceder a la cámara. Verifique que no esté en uso por otra ventana y otorgue permisos.',
            );
        }
    }, [facingMode]);

    // Asignar video ref al montar el elemento del DOM
    const handleVideoRef = useCallback((node: HTMLVideoElement | null) => {
        videoRef.current = node;
        if (node && streamRef.current) {
            node.srcObject = streamRef.current;
            node.play().catch(() => {});
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
            setCedulaUuid(null);
            setAvisoRegistradoEn(null);
            setRegistrandoAviso(false);
            setCedulaGenerada(null);
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
        setCedulaUuid(null);
        setAvisoRegistradoEn(null);
        setRegistrandoAviso(false);
        setCedulaGenerada(null);
        setFoto1('');
        setFoto2('');
        setGenero(
            empleado.genero === 'M' || empleado.genero === 'F'
                ? empleado.genero
                : '',
        );
        setFechaNacimiento(empleado.fecha_nacimiento || '');
        setErrorMsg(null);
        setFieldErrors({});
        setFotoActivaTarget(1);
        setCountdown(null);
        setSecuenciaEnProgreso(false);

        if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) =>
                    setGeoCoords({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    }),
                () => {},
                { timeout: 5000, maximumAge: 60000 },
            );
        }
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

    const nombreMostrar =
        empleado.nombres ||
        empleado.nombre_completo.split(' ')[0] ||
        'Colaborador';
    const empresaFinal = empleado.empresa_nombre || empresaNombre;
    const iniciales =
        `${(empleado.nombres || empleado.nombre_completo || '?').trim().charAt(0)}${(empleado.apellidos || '').trim().charAt(0)}`.toUpperCase();

    // Disparo inmediato de foto desde el canvas
    const capturarSnapshot = (targetFoto: 1 | 2): string | null => {
        if (!videoRef.current) return null;
        const video = videoRef.current;
        const dataUrl = crearFotoBioTime(
            video,
            video.videoWidth || 640,
            video.videoHeight || 480,
            isMirrored,
        );

        if (!dataUrl) {
            return null;
        }

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
                const dataUrl = crearFotoBioTime(img, img.width, img.height);

                if (!dataUrl) {
                    setErrorMsg(
                        'No fue posible procesar la fotografía seleccionada.',
                    );
                    return;
                }

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

    const handleToggleAvisoPrivacidad = async (checked: boolean) => {
        setAvisoAceptado(checked);

        if (!checked || !empleado) {
            return;
        }

        setRegistrandoAviso(true);
        try {
            const response = await fetch(
                '/admin/api/reloj-checador/enrolamiento/accion',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-XSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({
                        empleado_id: empleado.id,
                        accion: 'aviso_privacidad',
                        cedula_uuid: cedulaUuid,
                        latitud: geoCoords?.lat ?? null,
                        longitud: geoCoords?.lng ?? null,
                    }),
                },
            );

            const data = await response.json();
            if (response.ok && data.success) {
                if (data.cedula_uuid) {
                    setCedulaUuid(data.cedula_uuid);
                }
                if (data.log?.ocurrido_en) {
                    setAvisoRegistradoEn(data.log.ocurrido_en);
                }
            }
        } catch {
            // Si falla la red en este clic, el backend garantiza el registro al finalizar
        } finally {
            setRegistrandoAviso(false);
        }
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
                cedula_uuid: cedulaUuid,
                latitud: geoCoords?.lat ?? null,
                longitud: geoCoords?.lng ?? null,
            };

            const response = await fetch('/admin/api/reloj-checador/enrolar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-XSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                stopCamera();
                setCedulaGenerada(data.cedula || null);
                setPaso(3);
                onSuccess(data.empleado);
            } else {
                if (data.errors) {
                    setFieldErrors(data.errors);
                }
                const errorTexto =
                    (Array.isArray(data.errors?.biotime)
                        ? data.errors.biotime[0]
                        : null) ||
                    data.errors?.biotime ||
                    data.message ||
                    'Error al completar el enrolamiento. Verifique los datos ingresados.';
                setErrorMsg(errorTexto);
            }
        } catch (err: any) {
            setErrorMsg(
                'No se pudo conectar con el servidor para enrolar al colaborador.',
            );
        } finally {
            setLoading(false);
        }
    };

    const fotosListas = Boolean(foto1 && foto2);
    const datosListos = Boolean(genero && fechaNacimiento);
    const formularioCompleto = fotosListas && datosListos;

    return (
        <div className="flex h-screen w-screen animate-in flex-col overflow-hidden bg-background text-foreground duration-200 fade-in-50 select-none">
            <Head title="Enrolamiento Biométrico Facial" />
            {/* CABECERA FULLSCREEN DE LA ESTACIÓN DE ENROLAMIENTO */}
            <header className="flex h-18 shrink-0 items-center justify-between border-b border-border/80 bg-card/60 px-6 backdrop-blur-md md:px-10">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                        <ScanFace className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                                Enrolamiento Biométrico Facial
                            </h1>
                            <Badge
                                variant="outline"
                                className="hidden border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 sm:inline-flex dark:bg-indigo-950/40 dark:text-indigo-300"
                            >
                                Kiosko de Planta
                            </Badge>
                        </div>
                        <p className="max-w-xl truncate text-xs text-muted-foreground">
                            {empresaFinal} • Sincronización automática de
                            plantilla con terminales BioTime
                        </p>
                    </div>
                </div>

                {/* PASOS DE PROGRESO */}
                <div className="hidden items-center gap-3 lg:flex">
                    {[
                        { num: 1, label: 'Datos del Colaborador' },
                        { num: 2, label: 'Toma Facial HD' },
                        { num: 3, label: 'Sincronizado BioTime' },
                    ].map((p, idx) => (
                        <React.Fragment key={p.num}>
                            <div className="flex items-center gap-2">
                                <span
                                    className={cn(
                                        'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-xs transition-all',
                                        paso >= p.num
                                            ? 'scale-105 bg-indigo-600 text-white shadow-indigo-600/30'
                                            : 'border border-border bg-muted/40 text-muted-foreground',
                                    )}
                                >
                                    {paso > p.num ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        p.num
                                    )}
                                </span>
                                <span
                                    className={cn(
                                        'text-xs font-bold',
                                        paso >= p.num
                                            ? 'text-indigo-600 dark:text-indigo-400'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {p.label}
                                </span>
                            </div>
                            {idx < 2 && (
                                <span className="h-0.5 w-8 bg-border" />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* BOTÓN SALIR / CANCELAR */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        if (!loading) {
                            stopCamera();
                            onClose();
                        }
                    }}
                    className="h-11 gap-2 rounded-xl border-border px-5 text-xs font-bold hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 sm:text-sm dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Volver al Kiosko</span>
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
            <main className="flex flex-1 flex-col justify-center overflow-y-auto px-5 py-6 sm:px-10 md:px-14 lg:px-20">
                {/* PASO 1: CONFIRMAR COLABORADOR Y ACEPTAR AVISO DE PRIVACIDAD */}
                {paso === 1 && (
                    <div className="mx-auto my-auto grid w-full max-w-[1680px] animate-in grid-cols-1 items-stretch gap-6 duration-300 fade-in-50 lg:grid-cols-12 lg:gap-10">
                        {/* COLUMNA IZQUIERDA: IDENTIDAD DEL COLABORADOR */}
                        <aside className="flex flex-col overflow-hidden rounded-3xl border-2 border-border/80 bg-card shadow-sm lg:col-span-5">
                            <div className="flex flex-col items-center bg-gradient-to-br from-indigo-600 to-indigo-800 px-8 py-10 text-center text-white sm:py-14">
                                <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white/40 bg-white/15 shadow-xl sm:h-44 sm:w-44">
                                    {empleado.foto_empleado && !fotoFallida ? (
                                        <img
                                            src={empleado.foto_empleado}
                                            alt={empleado.nombre_completo}
                                            className="h-full w-full object-cover"
                                            onError={() => setFotoFallida(true)}
                                        />
                                    ) : (
                                        <span className="text-4xl font-black tracking-wide sm:text-5xl">
                                            {iniciales}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-5 text-sm font-semibold text-indigo-100">
                                    ¡Bienvenido(a)!
                                </p>
                                <h2 className="mt-1 text-3xl leading-tight font-black break-words sm:text-4xl">
                                    {empleado.nombre_completo}
                                </h2>
                                <Badge
                                    variant="outline"
                                    className="mt-4 border-white/40 bg-white/15 px-3 py-1 text-xs font-bold text-white"
                                >
                                    {empleado.enrolado
                                        ? 'Actualización de fotografías'
                                        : 'Primer enrolamiento facial'}
                                </Badge>
                            </div>

                            <div className="grid flex-1 grid-cols-1 content-center gap-4 p-6 sm:grid-cols-3 sm:p-8">
                                <DatoTarjeta
                                    etiqueta="No. de Empleado"
                                    valor={
                                        empleado.codigo_nuevo ||
                                        empleado.numero ||
                                        empleado.documento_identidad
                                    }
                                    mono
                                />
                                <DatoTarjeta
                                    etiqueta="N° de Tarjeta"
                                    valor={empleado.codigo_anterior || '—'}
                                    mono
                                />
                                <DatoTarjeta
                                    etiqueta="Legacy"
                                    valor={empleado.legacy || '—'}
                                    mono
                                />
                            </div>
                        </aside>

                        {/* COLUMNA DERECHA: AVISO DE PRIVACIDAD Y ACCIÓN */}
                        <section className="flex flex-col gap-5 lg:col-span-7">
                            <div className="space-y-6 rounded-3xl border-2 border-border/80 bg-card p-8 shadow-sm sm:p-10">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                                        <ShieldCheck className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-foreground sm:text-2xl">
                                            Aviso de Privacidad Biométrico
                                        </h3>
                                        <p className="text-xs text-muted-foreground sm:text-sm">
                                            Lee y acepta para continuar con la
                                            toma de fotografías.
                                        </p>
                                    </div>
                                </div>

                                <div className="max-h-64 space-y-3 overflow-y-auto rounded-2xl border bg-muted/30 p-6 text-base leading-relaxed text-muted-foreground shadow-inner sm:text-lg">
                                    <p>
                                        <strong className="font-bold text-foreground">
                                            {empresaFinal}
                                        </strong>{' '}
                                        es el responsable del tratamiento y
                                        resguardo confidencial de sus datos
                                        personales sensibles y biométricos
                                        faciales.
                                    </p>
                                    <p>
                                        Dichos datos se emplean estrictamente
                                        para el registro de asistencia laboral,
                                        puntualidad y control de accesos a las
                                        instalaciones de la empresa en
                                        cumplimiento con las políticas internas.
                                    </p>
                                    <p>
                                        Al marcar la casilla, otorga su
                                        consentimiento expreso para la toma
                                        fotográfica y su sincronización
                                        biométrica con el sistema BioTime.
                                    </p>
                                </div>

                                <label
                                    className={cn(
                                        'flex cursor-pointer items-center justify-between gap-4 rounded-2xl border-2 p-5 transition-all select-none sm:p-6',
                                        avisoAceptado
                                            ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20'
                                            : 'border-border/80 bg-card hover:border-indigo-400/60 hover:bg-muted/30',
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <Checkbox
                                            checked={avisoAceptado}
                                            onCheckedChange={(val) =>
                                                handleToggleAvisoPrivacidad(
                                                    val === true,
                                                )
                                            }
                                            className="h-7 w-7 shrink-0 rounded-lg data-[state=checked]:border-indigo-600 data-[state=checked]:bg-indigo-600"
                                        />
                                        <span className="text-base leading-snug font-bold text-foreground sm:text-lg md:text-xl">
                                            He leído, comprendo y acepto el
                                            aviso de privacidad para el
                                            tratamiento de mis datos biométricos
                                            faciales.
                                        </span>
                                    </div>
                                    {registrandoAviso ? (
                                        <Badge
                                            variant="outline"
                                            className="shrink-0 gap-1.5 text-xs"
                                        >
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Registrando...
                                        </Badge>
                                    ) : avisoAceptado && avisoRegistradoEn ? (
                                        <Badge
                                            variant="outline"
                                            className="shrink-0 border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                        >
                                            ✓ Registrado
                                        </Badge>
                                    ) : null}
                                </label>
                            </div>

                            <div className="flex items-start gap-3 rounded-3xl border-2 border-dashed border-border/80 p-5 text-sm text-muted-foreground sm:p-6 sm:text-base">
                                <Camera className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                                <p>
                                    Se tomarán{' '}
                                    <strong className="text-foreground">
                                        2 fotografías frontales
                                    </strong>{' '}
                                    con buena iluminación y sin gorra ni lentes
                                    oscuros. Después se sincronizarán con las
                                    terminales BioTime.
                                </p>
                            </div>

                            <Button
                                type="button"
                                size="lg"
                                disabled={!avisoAceptado}
                                onClick={() => setPaso(2)}
                                className={cn(
                                    'flex h-20 w-full items-center justify-center gap-3 rounded-2xl text-xl font-black tracking-wide shadow-xl transition-all sm:h-24 sm:text-2xl',
                                    avisoAceptado
                                        ? 'cursor-pointer bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-700 active:scale-98'
                                        : 'cursor-not-allowed bg-muted text-muted-foreground opacity-60',
                                )}
                            >
                                <Camera className="h-7 w-7" />
                                <span>COMENZAR TOMA DE FOTOGRAFÍAS</span>
                            </Button>
                        </section>
                    </div>
                )}

                {/* PASO 2: TOMA FACIAL FULLSCREEN */}
                {paso === 2 && (
                    <form
                        onSubmit={handleFinalizar}
                        className="mx-auto my-auto flex h-full w-full max-w-[1680px] animate-in flex-col justify-center space-y-4 duration-300 fade-in-50"
                    >
                        {errorMsg && (
                            <div className="animate-shake flex items-start gap-3.5 rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-700 shadow-md sm:p-5 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                                <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-rose-600 dark:text-rose-400" />
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-base font-bold text-rose-900 dark:text-rose-100">
                                        <span>
                                            Error en la Sincronización con
                                            BioTime
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="border-rose-300 bg-rose-100 text-[10px] text-rose-800 dark:bg-rose-950"
                                        >
                                            Rechazado
                                        </Badge>
                                    </div>
                                    <p className="text-xs leading-relaxed font-normal text-rose-800 sm:text-sm dark:text-rose-200">
                                        {errorMsg}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* GRID PRINCIPAL: LADO IZQUIERDO VISOR DE CÁMARA (65%), LADO DERECHO PREVIEWS Y VALIDACIÓN (35%) */}
                        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
                            {/* COLUMNA IZQUIERDA: VISOR DE ALTA RESOLUCIÓN */}
                            <div className="flex flex-col justify-between space-y-4 lg:col-span-7">
                                {/* CONTENEDOR DEL VISOR DE CÁMARA */}
                                <div
                                    className="relative mx-auto flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border-4 border-indigo-500/40 bg-slate-950 shadow-2xl"
                                    style={{ maxWidth: 'min(100%, 56vh)' }}
                                >
                                    {cameraActive ? (
                                        <>
                                            <video
                                                ref={handleVideoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className={cn(
                                                    'h-full w-full object-cover transition-opacity duration-150',
                                                    isMirrored &&
                                                        'scale-x-[-1]',
                                                    flashing && 'opacity-0',
                                                )}
                                            />

                                            {/* Flash visual al disparar */}
                                            {flashing && (
                                                <div className="pointer-events-none absolute inset-0 animate-out bg-white duration-150 fade-out-90" />
                                            )}

                                            {/* HUD BIOMÉTRICO: 4 MARCADORES DE ESQUINA */}
                                            <div className="pointer-events-none absolute inset-5 rounded-2xl border-white/10">
                                                <div className="absolute top-2 left-2 h-8 w-8 rounded-tl-xl border-t-4 border-l-4 border-indigo-400 shadow-lg" />
                                                <div className="absolute top-2 right-2 h-8 w-8 rounded-tr-xl border-t-4 border-r-4 border-indigo-400 shadow-lg" />
                                                <div className="absolute bottom-2 left-2 h-8 w-8 rounded-bl-xl border-b-4 border-l-4 border-indigo-400 shadow-lg" />
                                                <div className="absolute right-2 bottom-2 h-8 w-8 rounded-br-xl border-r-4 border-b-4 border-indigo-400 shadow-lg" />
                                            </div>

                                            {/* BADGE SUPERIOR DE ESTADO EN VIVO */}
                                            <div className="absolute top-4 left-4 flex items-center gap-2.5 rounded-full border border-white/15 bg-black/70 px-4 py-2 text-xs text-white backdrop-blur-md">
                                                <span className="h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400" />
                                                <span className="font-black tracking-wider uppercase">
                                                    Cámara Kiosko
                                                </span>
                                                <span className="text-white/40">
                                                    |
                                                </span>
                                                <span className="font-mono font-bold text-indigo-300">
                                                    {fotoActivaTarget === 1
                                                        ? '🎯 FOTO 1 (PRINCIPAL)'
                                                        : '🎯 FOTO 2 (VALIDACIÓN)'}
                                                </span>
                                            </div>

                                            {/* Guía cuadrada para el recorte de la fotografía */}
                                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-4">
                                                <div
                                                    className={cn(
                                                        'flex aspect-square w-[76%] items-center justify-center rounded-2xl border-3 border-dashed transition-all duration-300',
                                                        fotoActivaTarget === 1
                                                            ? 'border-indigo-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]'
                                                            : 'border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]',
                                                    )}
                                                >
                                                    {countdown !== null && (
                                                        <span className="animate-pulse text-8xl font-black text-amber-300 drop-shadow-[0_6px_24px_rgba(0,0,0,0.9)] sm:text-9xl">
                                                            {countdown}
                                                        </span>
                                                    )}
                                                </div>

                                                <span className="mt-3 rounded-full border border-white/15 bg-black/75 px-5 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md sm:text-sm">
                                                    {fotoActivaTarget === 1
                                                        ? '🎯 Coloque su rostro de frente dentro del marco con buena luz'
                                                        : '🎯 Mantenga la posición dentro del marco para la toma de verificación'}
                                                </span>
                                            </div>

                                            {/* HERRAMIENTAS RÁPIDAS DEL VISOR */}
                                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setIsMirrored(
                                                            (prev) => !prev,
                                                        )
                                                    }
                                                    className={cn(
                                                        'flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold shadow-lg backdrop-blur-md transition-all active:scale-95',
                                                        isMirrored
                                                            ? 'border-white/20 bg-black/60 text-white hover:bg-black/80'
                                                            : 'border-indigo-400 bg-indigo-600 text-white',
                                                    )}
                                                >
                                                    <span>🪞</span>
                                                    <span>Espejo</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={alternarCamara}
                                                    title="Alternar dispositivo de cámara"
                                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white shadow-lg backdrop-blur-md transition-all hover:bg-black/80 active:scale-95"
                                                >
                                                    <SwitchCamera className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </>
                                    ) : cameraError ? (
                                        <div className="max-w-lg space-y-4 p-8 text-center text-white">
                                            <AlertCircle className="mx-auto h-14 w-14 text-rose-400" />
                                            <h4 className="text-lg font-bold">
                                                Cámara no disponible
                                            </h4>
                                            <p className="text-sm text-white/80">
                                                {cameraError}
                                            </p>
                                            <div className="flex flex-wrap justify-center gap-3 pt-2">
                                                <Button
                                                    type="button"
                                                    size="lg"
                                                    onClick={startCamera}
                                                    className="bg-white font-bold text-black hover:bg-slate-200"
                                                >
                                                    <RefreshCw className="mr-2 h-5 w-5" />{' '}
                                                    Reintentar Cámara
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="lg"
                                                    variant="outline"
                                                    onClick={() =>
                                                        elegirArchivo(
                                                            fotoActivaTarget,
                                                        )
                                                    }
                                                    className="border-white/30 font-bold text-white"
                                                >
                                                    <Upload className="mr-2 h-5 w-5" />{' '}
                                                    Subir Archivo
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 text-white/90">
                                            <Loader2 className="h-12 w-12 animate-spin text-indigo-400" />
                                            <span className="text-base font-bold">
                                                Iniciando cámara facial en alta
                                                definición...
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* CONTROLES TÁCTILES GRANDES DE CAPTURA */}
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                                        <Button
                                            type="button"
                                            size="lg"
                                            disabled={
                                                !cameraActive ||
                                                countdown !== null
                                            }
                                            onClick={() =>
                                                capturarSnapshot(
                                                    fotoActivaTarget,
                                                )
                                            }
                                            className={cn(
                                                'flex h-18 items-center justify-center gap-3 rounded-2xl text-lg font-black shadow-xl transition-all active:scale-95 sm:h-20 sm:text-xl',
                                                fotoActivaTarget === 1
                                                    ? 'bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-700'
                                                    : 'bg-emerald-600 text-white shadow-emerald-600/30 hover:bg-emerald-700',
                                            )}
                                        >
                                            <Camera className="h-7 w-7" />
                                            <span>
                                                {fotoActivaTarget === 1
                                                    ? '📸 TOMAR FOTO 1'
                                                    : '📸 TOMAR FOTO 2'}
                                            </span>
                                        </Button>

                                        <Button
                                            type="button"
                                            size="lg"
                                            variant="outline"
                                            disabled={
                                                !cameraActive ||
                                                countdown !== null
                                            }
                                            onClick={() =>
                                                iniciarCuentaRegresiva(
                                                    fotoActivaTarget,
                                                )
                                            }
                                            className="flex h-18 items-center justify-center gap-3 rounded-2xl border-2 text-base font-bold transition-all hover:border-amber-400 hover:bg-amber-50/40 active:scale-95 sm:h-20 sm:text-lg dark:hover:bg-amber-950/20"
                                        >
                                            <Timer className="h-6 w-6 text-amber-500" />
                                            <span>⏱️ Conteo de 3s</span>
                                        </Button>
                                    </div>

                                    {/* OPCIÓN DE SECUENCIA AUTOMÁTICA Y SUBIDA MANUAL */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-muted-foreground">
                                        <button
                                            type="button"
                                            disabled={
                                                !cameraActive ||
                                                countdown !== null ||
                                                secuenciaEnProgreso
                                            }
                                            onClick={iniciarSecuenciaAutomatica}
                                            className="flex items-center gap-2 text-xs font-bold text-indigo-600 transition-colors hover:underline sm:text-sm dark:text-indigo-400"
                                        >
                                            <Zap className="h-4 w-4 text-amber-500" />
                                            <span>
                                                ⚡ Secuencia automática rápida
                                                (Dispara Foto 1 y Foto 2
                                                seguidas)
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                elegirArchivo(fotoActivaTarget)
                                            }
                                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            <Upload className="h-4 w-4" />
                                            <span>Cargar desde archivo</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* COLUMNA DERECHA: REVISIÓN DE FOTOS Y CONFIRMACIÓN DE DATOS */}
                            <div className="flex flex-col justify-between space-y-4 rounded-3xl border-2 border-border/80 bg-muted/20 p-5 shadow-sm sm:p-6 lg:col-span-5">
                                {/* ESTADO Y MINIATURAS DE LAS FOTOS */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold tracking-wider text-muted-foreground uppercase sm:text-sm">
                                            Validación de Fotografías:
                                        </Label>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                'text-xs font-bold',
                                                fotosListas
                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                    : 'bg-muted text-muted-foreground',
                                            )}
                                        >
                                            {fotosListas
                                                ? '✓ Ambas Fotos Listas'
                                                : foto1
                                                  ? '1 de 2 Listas'
                                                  : 'Pendientes'}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3.5">
                                        {/* TARJETA FOTO 1 */}
                                        <div
                                            onClick={() =>
                                                setFotoActivaTarget(1)
                                            }
                                            className={cn(
                                                'relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-3 p-2 transition-all',
                                                fotoActivaTarget === 1
                                                    ? 'border-indigo-600 bg-indigo-50/20 shadow-md ring-4 ring-indigo-500/20 dark:bg-indigo-950/20'
                                                    : 'border-border bg-card hover:border-border/80',
                                            )}
                                        >
                                            {foto1 ? (
                                                <>
                                                    <img
                                                        src={foto1}
                                                        alt="Foto 1"
                                                        className="h-full w-full rounded-xl object-cover"
                                                    />
                                                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white shadow-md">
                                                        <Check className="h-3.5 w-3.5" />{' '}
                                                        FOTO 1
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFoto1('');
                                                            setFotoActivaTarget(
                                                                1,
                                                            );
                                                        }}
                                                        className="absolute right-2 bottom-2 rounded-full bg-black/80 p-2 text-white shadow-lg transition-all hover:bg-black active:scale-95"
                                                        title="Volver a tomar Foto 1"
                                                    >
                                                        <RefreshCw className="h-4 w-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="space-y-1.5 p-2 text-center text-muted-foreground">
                                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground/60">
                                                        <Camera className="h-6 w-6" />
                                                    </div>
                                                    <span className="block text-sm font-bold text-foreground">
                                                        Foto 1
                                                    </span>
                                                    <span className="block text-xs opacity-75">
                                                        Toma Principal
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* TARJETA FOTO 2 */}
                                        <div
                                            onClick={() =>
                                                setFotoActivaTarget(2)
                                            }
                                            className={cn(
                                                'relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-3 p-2 transition-all',
                                                fotoActivaTarget === 2
                                                    ? 'border-emerald-600 bg-emerald-50/20 shadow-md ring-4 ring-emerald-500/20 dark:bg-emerald-950/20'
                                                    : 'border-border bg-card hover:border-border/80',
                                            )}
                                        >
                                            {foto2 ? (
                                                <>
                                                    <img
                                                        src={foto2}
                                                        alt="Foto 2"
                                                        className="h-full w-full rounded-xl object-cover"
                                                    />
                                                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white shadow-md">
                                                        <Check className="h-3.5 w-3.5" />{' '}
                                                        FOTO 2
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFoto2('');
                                                            setFotoActivaTarget(
                                                                2,
                                                            );
                                                        }}
                                                        className="absolute right-2 bottom-2 rounded-full bg-black/80 p-2 text-white shadow-lg transition-all hover:bg-black active:scale-95"
                                                        title="Volver a tomar Foto 2"
                                                    >
                                                        <RefreshCw className="h-4 w-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="space-y-1.5 p-2 text-center text-muted-foreground">
                                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground/60">
                                                        <Camera className="h-6 w-6" />
                                                    </div>
                                                    <span className="block text-sm font-bold text-foreground">
                                                        Foto 2
                                                    </span>
                                                    <span className="block text-xs opacity-75">
                                                        Toma Validación
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {(fieldErrors.foto_empleado ||
                                        fieldErrors.foto_empleado_2) && (
                                        <p className="text-xs font-semibold text-red-500">
                                            {fieldErrors.foto_empleado ||
                                                fieldErrors.foto_empleado_2}
                                        </p>
                                    )}
                                </div>

                                {/* CAMPOS DE GÉNERO Y FECHA DE NACIMIENTO */}
                                <div className="space-y-4 rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5">
                                    <div className="space-y-2">
                                        <Label className="flex items-center justify-between text-xs font-bold text-foreground">
                                            <span>Sexo / Género:</span>
                                            <span className="text-[11px] font-normal text-muted-foreground">
                                                Requerido por BioTime
                                            </span>
                                        </Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                {
                                                    valor: 'M',
                                                    etiqueta: '👨 Hombre',
                                                },
                                                {
                                                    valor: 'F',
                                                    etiqueta: '👩 Mujer',
                                                },
                                            ].map(({ valor, etiqueta }) => (
                                                <Button
                                                    key={valor}
                                                    type="button"
                                                    variant={
                                                        genero === valor
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    className={cn(
                                                        'h-14 rounded-xl text-sm font-bold transition-all',
                                                        genero === valor
                                                            ? 'bg-indigo-600 text-base text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700'
                                                            : 'border-border',
                                                    )}
                                                    onClick={() =>
                                                        setGenero(valor)
                                                    }
                                                    disabled={loading}
                                                >
                                                    {etiqueta}
                                                </Button>
                                            ))}
                                        </div>
                                        {fieldErrors.genero && (
                                            <p className="text-xs font-medium text-red-500">
                                                {fieldErrors.genero}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2 pt-1">
                                        <Label
                                            htmlFor="fecha_nacimiento_kiosko_fs"
                                            className="flex items-center justify-between text-xs font-bold text-foreground"
                                        >
                                            <span>Fecha de Nacimiento:</span>
                                            <span className="text-[11px] font-normal text-muted-foreground">
                                                Requerido
                                            </span>
                                        </Label>
                                        <Input
                                            id="fecha_nacimiento_kiosko_fs"
                                            type="date"
                                            max={new Date()
                                                .toISOString()
                                                .slice(0, 10)}
                                            min="1920-01-01"
                                            value={fechaNacimiento}
                                            onChange={(e) =>
                                                setFechaNacimiento(
                                                    e.target.value,
                                                )
                                            }
                                            className="h-14 rounded-xl px-4 font-mono text-sm"
                                            disabled={loading}
                                        />
                                        {fieldErrors.fecha_nacimiento && (
                                            <p className="text-xs font-medium text-red-500">
                                                {fieldErrors.fecha_nacimiento}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* BOTÓN FINAL DE GUARDADO Y SINCRONIZACIÓN */}
                                <div className="space-y-2 pt-1">
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={
                                            loading || !formularioCompleto
                                        }
                                        className={cn(
                                            'flex h-18 w-full items-center justify-center gap-3 rounded-2xl text-lg font-black shadow-xl transition-all active:scale-98',
                                            formularioCompleto
                                                ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white shadow-indigo-600/40 hover:from-indigo-500 hover:to-indigo-700'
                                                : 'cursor-not-allowed bg-muted text-muted-foreground opacity-60',
                                        )}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                                <span>
                                                    Sincronizando con BioTime...
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <UserCheck className="h-6 w-6" />
                                                <span>FINALIZAR Y ENROLAR</span>
                                            </>
                                        )}
                                    </Button>

                                    {!formularioCompleto && (
                                        <div className="space-x-2 text-center text-xs text-muted-foreground">
                                            <span>Falta:</span>
                                            {!foto1 && (
                                                <span className="font-bold text-amber-600">
                                                    Foto 1 •
                                                </span>
                                            )}
                                            {!foto2 && (
                                                <span className="font-bold text-amber-600">
                                                    Foto 2 •
                                                </span>
                                            )}
                                            {!genero && (
                                                <span className="font-bold text-amber-600">
                                                    Sexo •
                                                </span>
                                            )}
                                            {!fechaNacimiento && (
                                                <span className="font-bold text-amber-600">
                                                    Fecha Nacimiento
                                                </span>
                                            )}
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
                                className="h-11 gap-2 rounded-xl px-5 text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span>Atrás: Revisar datos</span>
                            </Button>
                        </div>
                    </form>
                )}

                {/* PASO 3: ÉXITO Y CONFIRMACIÓN FINAL */}
                {paso === 3 && (
                    <div className="mx-auto my-auto w-full max-w-xl animate-in space-y-6 text-center duration-300 zoom-in-95">
                        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-2xl shadow-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <CheckCircle2 className="h-16 w-16" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-foreground">
                                ¡Enrolamiento Biométrico Exitoso!
                            </h2>
                            <p className="text-base leading-relaxed text-muted-foreground">
                                Los rasgos faciales de{' '}
                                <strong className="text-foreground">
                                    {empleado.nombre_completo}
                                </strong>{' '}
                                han sido registrados y sincronizados con éxito
                                en la plataforma BioTime.
                            </p>
                        </div>
                        <Badge
                            variant="outline"
                            className="border-emerald-300 bg-emerald-50 px-5 py-2 font-mono text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        >
                            ✓ Estado: Enrolado y Listo para Checar Asistencia
                        </Badge>
                        {cedulaGenerada && (
                            <div className="space-y-2 rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 p-4 text-left dark:border-indigo-900/60 dark:bg-indigo-950/20">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-1.5 text-xs font-extrabold tracking-wider text-indigo-700 uppercase dark:text-indigo-300">
                                        <FileText className="h-4 w-4" />
                                        Cédula de Enrolamiento guardada en
                                        expediente
                                    </span>
                                    {cedulaGenerada.pdf_url && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-8 gap-1.5 border-indigo-300 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                                            onClick={() =>
                                                window.open(
                                                    cedulaGenerada.pdf_url!,
                                                    '_blank',
                                                    'noopener,noreferrer',
                                                )
                                            }
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            Ver Cédula PDF
                                        </Button>
                                    )}
                                </div>
                                <p className="font-mono text-[11px] break-all text-muted-foreground">
                                    <strong>Folio:</strong>{' '}
                                    {cedulaGenerada.uuid}
                                </p>
                                {cedulaGenerada.sello_digital && (
                                    <p className="font-mono text-[11px] break-all text-muted-foreground">
                                        <strong>Sello Digital:</strong>{' '}
                                        {cedulaGenerada.sello_digital}
                                    </p>
                                )}
                            </div>
                        )}
                        <div className="pt-4">
                            <Button
                                type="button"
                                size="lg"
                                className="h-18 w-full rounded-2xl bg-emerald-600 text-lg font-black text-white shadow-xl shadow-emerald-600/30 transition-all hover:bg-emerald-700 active:scale-95"
                                onClick={volverAlMarcaje}
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

// La pantalla se abre fuera del layout del panel: se envuelve en el proveedor de
// plantilla para heredar el color primario y el modo claro/oscuro del usuario.
export default function KioskoEnrolamientoPantalla(props: Props) {
    return (
        <TemplateSettingsProvider>
            <EnrolamientoKiosko {...props} />
        </TemplateSettingsProvider>
    );
}
