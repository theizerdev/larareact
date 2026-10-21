import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { 
    ShieldCheck, 
    UserCheck, 
    LogOut, 
    LogIn, 
    Utensils, 
    UtensilsCrossed,
    Coffee, 
    Moon,
    Apple,
    Sandwich,
    Clock,
    CheckCircle2, 
    AlertCircle, 
    Camera,
    CameraOff,
    Keyboard,
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
import ClientLogo from '@/components/client-logo';
import { TemplateSettingsProvider } from '@/hooks/use-template-settings';

interface Configuracion {
    requiere_foto_marcaje?: boolean;
    tolerancia_retardo_minutos?: number;
}

interface OpcionComida {
    id?: number;
    nombre: string;
    tipo?: string;
    costo: number;
    costo_empleado?: number;
    costo_empresa?: number;
    descripcion?: string;
    icono?: string;
    color?: string;
    hora_inicio?: string | null;
    hora_fin?: string | null;
    disponible_ahora?: boolean;
}

interface Props {
    configuracion?: Configuracion;
    zona_horaria?: string | null;
    opciones_comida?: OpcionComida[];
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

function KioskoChecador({ configuracion, zona_horaria, opciones_comida = [] }: Props) {
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
    const [ultimoMarcaje, setUltimoMarcaje] = useState<{ tipo: string; hora: string; tipo_nombre?: string } | null>(null);
    // Si la foto no carga se muestran las iniciales en lugar del texto alternativo.
    const [fotoFallida, setFotoFallida] = useState(false);
    useEffect(() => setFotoFallida(false), [empleado?.id]);
    const [sugerenciaMarcaje, setSugerenciaMarcaje] = useState<string>('entrada');
    const [tipoMarcajeSeleccionado, setTipoMarcajeSeleccionado] = useState<string>('entrada');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Mapeo legible de tipos de marcaje para el usuario final del kiosko
    const getNombreMarcaje = (tipoMarcaje: string): string => {
        switch (tipoMarcaje) {
            case 'entrada':
                return 'INICIO DE JORNADA';
            case 'salida_comida':
                return 'INICIO DE COMIDA';
            case 'entrada_comida':
                return 'FIN DE COMIDA';
            case 'salida':
                return 'SALIDA DE JORNADA';
            case 'descanso_inicio':
                return 'INICIO DE DESCANSO';
            case 'descanso_fin':
                return 'FIN DE DESCANSO';
            case 'incidente_inicio':
                return 'INICIO DE INCIDENTE';
            case 'incidente_fin':
                return 'FIN DE INCIDENTE';
            case 'entrada_extraordinaria':
                return 'TIEMPO EXTRA';
            default:
                return tipoMarcaje.replace('_', ' ').toUpperCase();
        }
    };

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

    // Modo de identificación: por defecto el colaborador ingresa su número de empleado en el numpad;
    // el escáner de gafete QR con la cámara es la segunda opción.
    const [modoEntrada, setModoEntrada] = useState<'camara' | 'manual'>('manual');
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    // Un solo stream de cámara sirve para escanear y para la foto de evidencia. El <video> se muestra
    // grande (escáner) o pequeño (evidencia en modo manual); al cambiar de lugar se reconecta al stream.
    const attachVideo = useCallback((el: HTMLVideoElement | null) => {
        videoRef.current = el;
        if (el && streamRef.current && el.srcObject !== streamRef.current) {
            el.srcObject = streamRef.current;
            el.play().catch(() => {});
        }
    }, []);

    // Último código leído, para no repetir la búsqueda mientras el mismo gafete sigue frente a la cámara.
    const ultimoCodigoRef = useRef<{ codigo: string; at: number } | null>(null);

    // Modales para Descansos e Incidentes
    const [isDescansoModalOpen, setIsDescansoModalOpen] = useState(false);
    const [selectedMinutosDescanso, setSelectedMinutosDescanso] = useState<number>(15);
    const [isIncidenteModalOpen, setIsIncidenteModalOpen] = useState(false);
    const [isComidaModalOpen, setIsComidaModalOpen] = useState(false);
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

    const necesitaCamara = modoEntrada === 'camara' || Boolean(configuracion?.requiere_foto_marcaje);

    useEffect(() => {
        if (!necesitaCamara) return;
        if (!navigator?.mediaDevices?.getUserMedia) {
            setCameraActive(false);
            setCameraError(
                typeof window !== 'undefined' && !window.isSecureContext
                    ? 'La cámara requiere una conexión segura (HTTPS). Configure HTTPS o acceda desde localhost.'
                    : 'No se detectó una cámara en este dispositivo o navegador.'
            );
            return;
        }

        let cancelado = false;
        setCameraError(null);
        navigator.mediaDevices.getUserMedia({ video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } })
            .then((stream) => {
                if (cancelado) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(() => {});
                }
                setCameraActive(true);
            })
            .catch(() => {
                if (!cancelado) {
                    setCameraActive(false);
                    setCameraError('No se pudo acceder a la cámara. Revise los permisos del navegador.');
                }
            });

        return () => {
            cancelado = true;
            streamRef.current?.getTracks().forEach(t => t.stop());
            streamRef.current = null;
            setCameraActive(false);
        };
    }, [necesitaCamara, facingMode]);

    const toggleCameraFacing = () => {
        setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    };

    // Lector físico (pistola USB/Bluetooth) o teclado: Enter busca lo capturado. Solo aplica mientras
    // no hay un colaborador en pantalla, para no relanzar la búsqueda desde los modales.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !empleado && !loadingSearch && documentInput.trim()) {
                e.preventDefault();
                performSearch(documentInput);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [documentInput, empleado, loadingSearch]);

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
        setDocumentInput(clean);
        performSearch(clean);
    };

    // Escaneo continuo: mientras la cámara está en modo escáner y no hay un colaborador en pantalla,
    // se buscan códigos QR en los cuadros del video (BarcodeDetector nativo o jsQR como respaldo).
    const escaneando = modoEntrada === 'camara' && cameraActive && !empleado && !successMessage && !loadingSearch;

    useEffect(() => {
        if (!escaneando) return;

        let activo = true;
        let frameId = 0;
        let ultimoAnalisis = 0;

        let detector: any = null;
        if ('BarcodeDetector' in window) {
            try {
                detector = new (window as any).BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39', 'data_matrix', 'ean_13'] });
            } catch (e) {
                detector = null;
            }
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const procesar = (raw: string): boolean => {
            const ultimo = ultimoCodigoRef.current;
            if (ultimo && ultimo.codigo === raw && Date.now() - ultimo.at < 5000) {
                // El mismo gafete sigue frente a la cámara: se ignora hasta que se retire unos segundos.
                ultimo.at = Date.now();
                return false;
            }
            ultimoCodigoRef.current = { codigo: raw, at: Date.now() };
            playBeepSound();
            handleProcessScannedCode(raw);
            return true;
        };

        const scanFrame = async (ts: number) => {
            if (!activo) return;
            const video = videoRef.current;

            // Se analiza cada ~150 ms para no saturar el CPU del equipo del kiosko.
            if (video && video.readyState === video.HAVE_ENOUGH_DATA && ts - ultimoAnalisis > 150) {
                ultimoAnalisis = ts;
                let raw: string | null = null;

                if (detector) {
                    try {
                        const barcodes = await detector.detect(video);
                        raw = barcodes?.[0]?.rawValue || null;
                    } catch (err) {}
                }

                const jsQR = (window as any).jsQR;
                if (!raw && jsQR && ctx && video.videoWidth > 0 && video.videoHeight > 0) {
                    const escala = Math.min(1, 960 / video.videoWidth);
                    canvas.width = Math.round(video.videoWidth * escala);
                    canvas.height = Math.round(video.videoHeight * escala);
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    raw = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })?.data || null;
                }

                if (activo && raw && procesar(raw)) return;
            }

            if (activo) frameId = requestAnimationFrame(scanFrame);
        };

        frameId = requestAnimationFrame(scanFrame);
        return () => {
            activo = false;
            cancelAnimationFrame(frameId);
        };
    }, [escaneando]);

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
        setUltimoMarcaje(null);
        setErrorMessage(null);
        if (inputRef.current) inputRef.current.focus();
    };

    // Cancelar desde la tarjeta del colaborador: el mismo gafete no se relee mientras siga frente a la
    // cámara (debe retirarse unos segundos); un gafete distinto se lee de inmediato.
    const handleCancelar = () => {
        if (ultimoCodigoRef.current) ultimoCodigoRef.current.at = Date.now();
        handleNumpadClear();
    };

    const getCsrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) {
            const content = meta.getAttribute('content');
            if (content) return content;
        }
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) {
            return decodeURIComponent(match[1]);
        }
        return '';
    };

    // Función Central de Búsqueda
    const performSearch = async (queryValue: string) => {
        if (!queryValue.trim()) return;

        setLoadingSearch(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        const token = getCsrfToken();
        try {
            const response = await fetch('/admin/api/reloj-checador/buscar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-XSRF-TOKEN': token,
                },
                body: JSON.stringify({ query: queryValue.trim() }),
            });

            if (response.status === 401 || response.status === 419) {
                setEmpleado(null);
                setErrorMessage('Tu sesión expiró. Recarga la página e inicia sesión de nuevo.');
                return;
            }
            if (response.status >= 500) {
                setEmpleado(null);
                setErrorMessage('Error del servidor. Intenta de nuevo en unos segundos.');
                return;
            }

            const data = await response.json();

            if (response.ok && data.success) {
                playBeepSound();
                setEmpleado(data.empleado);
                setUltimoMarcaje(data.ultimo_marcaje || null);
                setSugerenciaMarcaje(data.sugerencia_marcaje);
                setTipoMarcajeSeleccionado(data.sugerencia_marcaje);
            } else {
                setEmpleado(null);
                setUltimoMarcaje(null);
                setErrorMessage(data.message || 'No se encontró ningún empleado activo con ese número o QR.');
            }
        } catch (err: any) {
            // Antes cualquier fallo (sin red, respuesta no JSON) se mostraba como
            // "empleado no encontrado", lo que confundía al colaborador.
            setEmpleado(null);
            setErrorMessage('No se pudo conectar con el servidor. Verifica la conexión e intenta de nuevo.');
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

        const token = getCsrfToken();
        try {
            const response = await fetch('/admin/api/reloj-checador/registrar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-XSRF-TOKEN': token,
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

            if (response.status === 401 || response.status === 419) {
                setErrorMessage('Tu sesión expiró. El marcaje NO se registró: recarga la página e inicia sesión de nuevo.');
                return;
            }
            if (response.status >= 500) {
                setErrorMessage('Error del servidor. El marcaje NO se registró; intenta de nuevo.');
                return;
            }

            const data = await response.json();

            if (response.ok && data.success) {
                playBeepSound();
                const tipoFinal = data?.marcaje?.tipo_marcaje || tipo;
                const nombreMarcaje = data?.marcaje?.tipo_nombre
                    ? data.marcaje.tipo_nombre.toUpperCase()
                    : getNombreMarcaje(tipoFinal);

                setSuccessMessage(`¡Marcaje de ${nombreMarcaje} registrado exitosamente para ${data.empleado_nombre}!`);
                setIsDescansoModalOpen(false);
                setIsIncidenteModalOpen(false);
                setTimeout(() => {
                    // Si el colaborador sigue con el gafete frente a la cámara, no se vuelve a leer al instante.
                    if (ultimoCodigoRef.current) ultimoCodigoRef.current.at = Date.now();
                    handleNumpadClear();
                    setSuccessMessage(null);
                }, 4000);
            } else {
                setErrorMessage(data.message || 'Error al registrar el marcaje.');
            }
        } catch (err: any) {
            setErrorMessage('No se pudo conectar con el servidor. El marcaje NO se registró; verifica la conexión e intenta de nuevo.');
        } finally {
            setLoadingSearch(false);
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: tz,
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: tz,
        });
    };

    // Mismo logo que el sidebar del panel: el de la empresa del usuario o, por defecto, el isotipo de Smurfit Westrock.
    const empresaAuth = (usePage().props.auth as any)?.user?.empresa;

    // Clases compartidas para homologar el kiosko con el resto del panel (tokens del tema + color primario de la marca).
    const teclaDigito = 'h-14 rounded-xl bg-card text-foreground text-2xl font-semibold border border-border shadow-sm transition-all active:scale-95 hover:bg-primary hover:text-primary-foreground hover:border-primary flex items-center justify-center';
    const accionNeutra = 'bg-card hover:bg-muted text-foreground border border-border shadow-sm';
    const accionBase = 'h-20 text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1 rounded-xl transition-all';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background text-foreground flex flex-col font-sans select-none">
            <Head title="Kiosko Checador" />

            {/* BARRA SUPERIOR (mismo tono que el sidebar del panel, con la marca del cliente) */}
            <header className="bg-neutral-950 text-white shadow-sm border-b border-neutral-800">
                <div className="h-1 bg-primary" />
                <div className="flex items-center justify-between gap-4 px-4 md:px-8 py-3">
                    <div className="flex items-center gap-4 min-w-0">
                        <ClientLogo
                            onDarkBackground
                            className="h-10 md:h-12 w-auto object-contain"
                            textClassName="text-lg font-bold text-white"
                        />
                        <div className="h-10 w-px bg-neutral-800 hidden sm:block" />
                        <div className="hidden sm:block min-w-0">
                            <h1 className="text-lg md:text-xl font-bold tracking-wide">Kiosko Checador</h1>
                            <p className="text-xs text-neutral-400 truncate">Control de Asistencia por Numpad, QR Gafete & Pistola Lector</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-2xl font-bold font-mono tabular-nums tracking-wider text-white">{formatTime(currentTime)}</div>
                            <div className="text-xs text-neutral-400 capitalize">{formatDate(currentTime)} • {tz}</div>
                        </div>

                        <Link href="/dashboard">
                            <Button variant="outline" className="border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-800 hover:text-white">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Panel Admin
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* CONTENIDO CENTRAL */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
                            <img
                                src={empresaAuth?.logo_mini || empresaAuth?.logo || '/image/logo/smurfit/icon.png'}
                                alt={empresaAuth?.razon_social || 'Smurfit Westrock'}
                                className="h-9 w-auto object-contain"
                            />
                            Registro de Asistencia
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            Ingrese su número de empleado, escanee su gafete QR o use la pistola lectora.
                        </p>
                    </div>
                    {/* En pantallas pequeñas el reloj no cabe en la barra superior */}
                    <div className="sm:hidden text-2xl font-bold font-mono tabular-nums text-primary">{formatTime(currentTime)}</div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* COLUMNA IZQUIERDA: NUMPAD (principal) O ESCÁNER QR CON CÁMARA (segunda opción) */}
                    <div className="lg:col-span-6 space-y-4">
                        <Card className="shadow-sm border-t-4 border-t-primary">
                            <CardContent className="space-y-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            {modoEntrada === 'camara' ? <QrCode className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold leading-tight">
                                                {modoEntrada === 'camara' ? 'Escanee su gafete QR' : 'Identificación del colaborador'}
                                            </h3>
                                            <Label className="text-xs text-muted-foreground font-normal">
                                                {modoEntrada === 'camara' ? 'Acerque el código QR de su gafete a la cámara' : 'N° de empleado, documento o QR gafete'}
                                            </Label>
                                        </div>
                                    </div>
                                    {modoEntrada === 'camara' ? (
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] flex items-center gap-1 shrink-0 ${
                                                cameraActive
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/50'}`} />
                                            {cameraActive ? 'Cámara activa' : 'Cámara inactiva'}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 flex items-center gap-1 shrink-0">
                                            <Scan className="w-3 h-3" /> Lector USB listo
                                        </Badge>
                                    )}
                                </div>

                                {modoEntrada === 'camara' ? (
                                    <>
                                        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-neutral-950 border">
                                            <video
                                                ref={attachVideo}
                                                autoPlay
                                                playsInline
                                                muted
                                                className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                                            />

                                            {cameraError ? (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-neutral-200">
                                                    <CameraOff className="w-10 h-10 text-neutral-400" />
                                                    <p className="text-sm max-w-sm">{cameraError}</p>
                                                </div>
                                            ) : (
                                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                                    {/* Marco guía del escáner */}
                                                    <div className="relative h-[70%] aspect-square">
                                                        <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                                                        <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                                                        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                                                        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                                                        {escaneando && (
                                                            <div className="absolute inset-x-3 top-1/2 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse" />
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {configuracion?.requiere_foto_marcaje && cameraActive && (
                                                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 text-[11px] font-medium text-white">
                                                    <Camera className="w-3.5 h-3.5" />
                                                    Foto de evidencia al marcar
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={toggleCameraFacing}
                                                title={facingMode === 'user' ? 'Usar cámara trasera' : 'Usar cámara frontal'}
                                                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                                            >
                                                <SwitchCamera className="w-4 h-4" />
                                            </button>

                                            {!cameraError && (
                                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/70 backdrop-blur-sm text-xs font-semibold text-white flex items-center gap-2 whitespace-nowrap">
                                                    {loadingSearch ? (
                                                        <>
                                                            <Clock className="w-4 h-4 text-emerald-400 animate-spin" />
                                                            Verificando gafete...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Scan className="w-4 h-4 text-emerald-400" />
                                                            Acerque su gafete QR al recuadro
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Captura invisible para la pistola lectora USB (inputMode none: sin teclado en pantalla táctil) */}
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            inputMode="none"
                                            aria-label="Lector de código de barras"
                                            value={documentInput}
                                            onChange={(e) => setDocumentInput(e.target.value)}
                                            className="sr-only"
                                            autoFocus
                                        />

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setModoEntrada('manual')}
                                            className="w-full h-12 rounded-xl font-semibold gap-2"
                                        >
                                            <Keyboard className="w-5 h-5" />
                                            <span>VOLVER A INGRESAR N° DE EMPLEADO</span>
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={documentInput}
                                            onChange={(e) => setDocumentInput(e.target.value)}
                                            placeholder="Ingrese número o escanee código de barras/QR..."
                                            className="w-full text-center text-2xl sm:text-3xl font-mono font-bold tracking-widest bg-background border-2 border-input rounded-xl py-4 text-foreground placeholder:text-base placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition"
                                            autoFocus
                                        />

                                        {/* VOLVER AL ESCÁNER QR POR CÁMARA */}
                                        <Button
                                            onClick={() => setModoEntrada('camara')}
                                            type="button"
                                            variant="outline"
                                            className="w-full h-12 rounded-xl font-semibold gap-2 border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
                                        >
                                            <QrCode className="w-5 h-5" />
                                            <span>ESCANEAR GAFETE QR (CÁMARA)</span>
                                        </Button>

                                        {/* TECLADO TÁCTIL (NUMPAD) */}
                                        <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                                            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                                                <button key={num} type="button" onClick={() => handleNumpadPress(num)} className={teclaDigito}>
                                                    {num}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={handleNumpadClear}
                                                className="h-14 rounded-xl text-xs font-bold border shadow-sm transition-all active:scale-95 flex items-center justify-center bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900"
                                            >
                                                LIMPIAR
                                            </button>
                                            <button type="button" onClick={() => handleNumpadPress('0')} className={teclaDigito}>
                                                0
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleNumpadDelete}
                                                className="h-14 rounded-xl border shadow-sm transition-all active:scale-95 flex items-center justify-center bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900"
                                            >
                                                <Delete className="w-6 h-6" />
                                            </button>
                                        </div>

                                        <Button
                                            onClick={() => handleSearch()}
                                            disabled={!documentInput.trim() || loadingSearch}
                                            className="w-full h-14 text-lg font-bold rounded-xl shadow-sm"
                                        >
                                            {loadingSearch ? 'VERIFICANDO...' : 'VERIFICAR EMPLEADO'}
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {errorMessage && (
                            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300 text-sm flex items-center gap-3 animate-shake">
                                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}
                    </div>

                    {/* COLUMNA DERECHA: CONFIRMACIÓN Y BOTONES DE MARCAJE */}
                    <div className="lg:col-span-6 space-y-4">
                        {successMessage ? (
                            <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 p-8 text-center space-y-4 shadow-sm animate-bounce-short">
                                <CheckCircle2 className="w-20 h-20 text-emerald-600 dark:text-emerald-400 mx-auto animate-pulse" />
                                <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{successMessage}</h2>
                                <p className="text-emerald-700 dark:text-emerald-300 text-sm">El sistema ha registrado el evento de asistencia y notificado por WhatsApp al empleado.</p>
                            </Card>
                        ) : empleado ? (
                            <Card className="shadow-sm border-t-4 border-t-emerald-500 space-y-6 p-6">
                                <div className="flex items-center gap-4 border-b pb-4">
                                    <div className="w-20 h-20 shrink-0 rounded-2xl bg-muted border overflow-hidden flex items-center justify-center text-muted-foreground font-bold text-xl">
                                        {empleado.foto_empleado && !fotoFallida ? (
                                            <img
                                                src={empleado.foto_empleado}
                                                alt={empleado.nombre_completo}
                                                className="w-full h-full object-cover"
                                                onError={() => setFotoFallida(true)}
                                            />
                                        ) : (
                                            <span>{empleado.nombre_completo.substring(0, 2).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 text-xs">
                                                Empleado Verificado
                                            </Badge>
                                            {ultimoMarcaje && (
                                                <Badge variant="outline" className="text-[11px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900 flex items-center gap-1 font-mono">
                                                    <Clock className="w-3 h-3" />
                                                    <span>Último: {getNombreMarcaje(ultimoMarcaje.tipo)} ({ultimoMarcaje.hora.slice(0, 5)} hrs)</span>
                                                </Badge>
                                            )}
                                        </div>
                                        <h2 className="text-xl font-bold text-foreground">{empleado.nombre_completo}</h2>
                                        <p className="text-xs text-muted-foreground">{empleado.cargo || 'Sin cargo'} • {empleado.departamento || 'Sin departamento'}</p>
                                        <p className="text-xs text-primary font-medium">Turno: {empleado.turno}</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCancelar}
                                        disabled={loadingSearch}
                                        className="ml-auto self-start shrink-0 gap-1 text-muted-foreground"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancelar
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider block">
                                        SELECCIONE LA ACCIÓN A REGISTRAR:
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
                                                        className={`${accionBase} ${
                                                            sugerenciaMarcaje === 'entrada'
                                                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-emerald-500/30 shadow-md'
                                                                : accionNeutra
                                                        }`}
                                                    >
                                                        <LogIn className={`w-5 h-5 ${sugerenciaMarcaje === 'entrada' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                                                        <span>INICIO JORNADA</span>
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
                                                        className={`${accionBase} ${
                                                            esDescansoActivo
                                                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-emerald-500/30 shadow-md animate-pulse'
                                                                : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 shadow-sm dark:bg-teal-950/30 dark:hover:bg-teal-950/50 dark:text-teal-300 dark:border-teal-900'
                                                        }`}
                                                    >
                                                        <Coffee className={`w-5 h-5 ${esDescansoActivo ? 'text-white' : 'text-teal-600 dark:text-teal-400'}`} />
                                                        <span>{esDescansoActivo ? 'FIN DESCANSO' : 'DESCANSO'}</span>
                                                    </Button>

                                                    <Button
                                                        onClick={() => handleRegisterMarcaje('entrada_extraordinaria', { tipo_entrada: 'extraordinaria_doble' })}
                                                        disabled={loadingSearch}
                                                        className={`${accionBase} bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 shadow-sm dark:bg-purple-950/30 dark:hover:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900`}
                                                    >
                                                        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                        <span>TIEMPO EXTRA</span>
                                                    </Button>

                                                    <Button
                                                        onClick={() => setIsComidaModalOpen(true)}
                                                        disabled={loadingSearch}
                                                        className={`${accionBase} gap-0.5 ${
                                                            sugerenciaMarcaje === 'salida_comida'
                                                                ? 'bg-amber-500 hover:bg-amber-400 text-white ring-4 ring-amber-500/30 shadow-md'
                                                                : accionNeutra
                                                        }`}
                                                    >
                                                        <Utensils className={`w-5 h-5 ${sugerenciaMarcaje === 'salida_comida' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
                                                        <span>INICIO COMIDA</span>
                                                        <span className="text-[10px] opacity-75 font-normal">Salida a Comer</span>
                                                    </Button>

                                                    <Button
                                                        onClick={() => handleRegisterMarcaje('entrada_comida')}
                                                        disabled={loadingSearch}
                                                        className={`${accionBase} gap-0.5 ${
                                                            sugerenciaMarcaje === 'entrada_comida'
                                                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white ring-4 ring-indigo-500/30 shadow-md'
                                                                : accionNeutra
                                                        }`}
                                                    >
                                                        <LogIn className={`w-5 h-5 ${sugerenciaMarcaje === 'entrada_comida' ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
                                                        <span>FIN COMIDA</span>
                                                        <span className="text-[10px] opacity-75 font-normal">Regreso de Comer</span>
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
                                                        className={`${accionBase} ${
                                                            esIncidenteActivo
                                                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-emerald-500/30 shadow-md animate-pulse'
                                                                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 shadow-sm dark:bg-amber-950/30 dark:hover:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900'
                                                        }`}
                                                    >
                                                        <AlertTriangle className={`w-5 h-5 ${esIncidenteActivo ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
                                                        <span>{esIncidenteActivo ? 'FIN INCIDENTE' : 'INCIDENTE'}</span>
                                                    </Button>

                                                    <Button
                                                        onClick={() => handleRegisterMarcaje('salida')}
                                                        disabled={loadingSearch}
                                                        className={`col-span-2 sm:col-span-3 h-16 text-base font-bold flex items-center justify-center gap-2 rounded-xl transition-all ${
                                                            sugerenciaMarcaje === 'salida'
                                                                ? 'bg-rose-600 hover:bg-rose-500 text-white ring-4 ring-rose-500/30 shadow-md'
                                                                : accionNeutra
                                                        }`}
                                                    >
                                                        <LogOut className={`w-6 h-6 ${sugerenciaMarcaje === 'salida' ? 'text-white' : 'text-rose-600 dark:text-rose-400'}`} />
                                                        <span>SALIDA JORNADA</span>
                                                    </Button>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <Card className="border-2 border-dashed shadow-none p-10 text-center space-y-4">
                                <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                                    <UserCheck className="w-10 h-10" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">
                                    {modoEntrada === 'camara' ? 'En espera de lectura del gafete QR...' : 'En espera de ingreso de documento o lectura de QR...'}
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                    {modoEntrada === 'camara'
                                        ? 'Acerque el QR de su gafete a la cámara: al leerlo aparecerá su perfil con las opciones de marcaje.'
                                        : 'Al ingresar el número de empleado o acercar el QR del gafete a la cámara/lector, aparecerá el perfil con las opciones de marcaje.'}
                                </p>
                            </Card>
                        )}

                        {/* VISTA DE CÁMARA DE EVIDENCIA (en modo escáner la cámara ya se ve grande a la izquierda) */}
                        {configuracion?.requiere_foto_marcaje && modoEntrada === 'manual' && (
                            <div className="p-3 bg-card rounded-xl border shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-foreground">
                                    <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40'}`} />
                                    <Camera className="w-4 h-4 text-primary" />
                                    <span>Cámara de Evidencia Activa</span>
                                </div>
                                <div className="w-16 h-12 rounded-lg bg-black border overflow-hidden">
                                    <video ref={attachVideo} autoPlay playsInline muted className="w-full h-full object-cover" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* MODAL SELECCIÓN DE MINUTOS DE DESCANSO */}
            <Dialog open={isDescansoModalOpen} onOpenChange={setIsDescansoModalOpen}>
                <DialogContent className="max-w-md border-t-4 border-t-teal-500">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-teal-700 dark:text-teal-400">
                            <Coffee className="w-5 h-5" />
                            Seleccionar Duración del Descanso
                        </DialogTitle>
                        <DialogDescription className="text-xs">
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
                                    className={`p-4 rounded-xl text-center border font-bold text-sm transition-all ${
                                        selectedMinutosDescanso === min
                                            ? 'bg-teal-600 border-teal-600 text-white shadow-md ring-2 ring-teal-500/30'
                                            : 'bg-card border-border text-foreground hover:bg-muted'
                                    }`}
                                >
                                    {min} min
                                </button>
                            ))}
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsDescansoModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={() => handleRegisterMarcaje('descanso_inicio', { duracion_descanso_minutos: selectedMinutosDescanso })}
                                disabled={loadingSearch}
                                className="bg-teal-600 hover:bg-teal-500 text-white font-bold"
                            >
                                Confirmar {selectedMinutosDescanso} min
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* MODAL SELECCIÓN DE TIPO DE COMIDA (INICIO COMIDA) - EXTRA GRANDE Y LEGIBLE */}
            <Dialog open={isComidaModalOpen} onOpenChange={setIsComidaModalOpen}>
                <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[95vw] md:max-w-[92vw] lg:max-w-6xl xl:max-w-7xl max-h-[92vh] overflow-y-auto border-t-4 border-t-amber-500 p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl">
                    {(() => {
                        const estaDisponibleAhora = (opcion: OpcionComida) => {
                            if (opcion.disponible_ahora !== undefined) {
                                return Boolean(opcion.disponible_ahora);
                            }
                            if (!opcion.hora_inicio || !opcion.hora_fin) return true;

                            try {
                                const nowStr = currentTime.toLocaleTimeString('en-US', {
                                    timeZone: tz,
                                    hour12: false,
                                    hour: '2-digit',
                                    minute: '2-digit',
                                });

                                const [hAct, mAct] = nowStr.split(':').map(Number);
                                const [hIni, mIni] = opcion.hora_inicio.slice(0, 5).split(':').map(Number);
                                const [hFin, mFin] = opcion.hora_fin.slice(0, 5).split(':').map(Number);

                                const minAct = hAct * 60 + mAct;
                                const minIni = hIni * 60 + mIni;
                                const minFin = hFin * 60 + mFin;

                                if (minIni <= minFin) {
                                    return minAct >= minIni && minAct <= minFin;
                                }
                                return minAct >= minIni || minAct <= minFin;
                            } catch {
                                return true;
                            }
                        };

                        const opcionesDisponibles = opciones_comida
                            .map((opcion, idx) => ({
                                ...opcion,
                                _idx: idx,
                                _disponible: estaDisponibleAhora(opcion),
                            }))
                            .filter((o) => o._disponible);

                        const horaPlanta = currentTime.toLocaleTimeString('es-MX', {
                            timeZone: tz,
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                        });

                        return (
                            <>
                                <DialogHeader className="pb-4 border-b">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400 flex items-center justify-center shrink-0">
                                                <Utensils className="w-7 h-7" />
                                            </div>
                                            <div className="space-y-1 text-left">
                                                <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                                                    Seleccione su Alimento / Comida
                                                </DialogTitle>
                                                <DialogDescription className="text-sm sm:text-base">
                                                    Toque el platillo deseado para confirmar el marcaje de <strong className="text-amber-600 dark:text-amber-400">INICIO COMIDA</strong>.
                                                </DialogDescription>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-muted border text-foreground font-mono text-sm sm:text-base shrink-0">
                                            <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                                            <span>Hora en Planta: <strong className="text-amber-600 dark:text-amber-400 font-bold text-lg sm:text-xl">{horaPlanta}</strong></span>
                                        </div>
                                    </div>
                                </DialogHeader>

                                {/* SUB-CABECERA: INDICADOR DE DISPONIBILIDAD Y OPCIÓN RÁPIDA DE NO CONSUMO */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400 font-bold text-sm">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>Alimentos Disponibles en este Horario ({opcionesDisponibles.length})</span>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={loadingSearch}
                                        onClick={() => {
                                            setIsComidaModalOpen(false);
                                            handleRegisterMarcaje('salida_comida', { comida_opcion: 'sin_consumo', no_adquirio_alimento: true });
                                        }}
                                        className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-card hover:bg-muted text-foreground border hover:border-amber-400 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                                    >
                                        <UtensilsCrossed className="w-4 h-4 text-amber-500" />
                                        <span>No Adquirir Ningún Alimento (Sin Consumo)</span>
                                    </button>
                                </div>

                                {/* LISTADO DE PLATILLOS DISPONIBLES O MENSAJE DE ESPERA */}
                                {opcionesDisponibles.length === 0 ? (
                                    <div className="py-14 px-6 rounded-2xl bg-muted/50 border text-center space-y-5 my-6 w-full">
                                        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400 flex items-center justify-center mx-auto">
                                            <Clock className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl sm:text-2xl font-bold text-foreground">No hay opciones de comida disponibles en este horario</h3>
                                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                                El servicio de comedor se activa automáticamente en los horarios configurados para cada turno (Desayuno, Almuerzo, Cena o Refrigerio).
                                            </p>
                                            <div className="text-xs sm:text-sm font-mono text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-900 py-1.5 px-4 rounded-xl inline-block">
                                                Hora actual en planta: {horaPlanta}
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                disabled={loadingSearch}
                                                onClick={() => {
                                                    setIsComidaModalOpen(false);
                                                    handleRegisterMarcaje('salida_comida', { comida_opcion: 'sin_consumo', no_adquirio_alimento: true });
                                                }}
                                                className="px-6 py-3.5 rounded-2xl text-base font-bold bg-amber-500 hover:bg-amber-400 text-white shadow-md flex items-center gap-3 mx-auto transition-all active:scale-95"
                                            >
                                                <UtensilsCrossed className="w-5 h-5" />
                                                <span>Registrar Inicio de Comida (Sin adquirir platillo del comedor)</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-3">
                                        {opcionesDisponibles.map((opcion) => {
                                            const iconProps = { className: "w-8 h-8 sm:w-9 sm:h-9 text-amber-600 dark:text-amber-400" };
                                            const renderIcon = () => {
                                                switch (opcion.icono) {
                                                    case 'coffee': return <Coffee {...iconProps} />;
                                                    case 'moon': return <Moon {...iconProps} />;
                                                    case 'apple': return <Apple {...iconProps} />;
                                                    case 'sandwich': return <Sandwich {...iconProps} />;
                                                    default: return <Utensils {...iconProps} />;
                                                }
                                            };

                                            const tipoLabel = opcion.tipo ? {
                                                desayuno: 'Desayuno',
                                                almuerzo: 'Almuerzo / Comida',
                                                cena: 'Cena',
                                                refrigerio: 'Refrigerio',
                                            }[opcion.tipo] : null;

                                            return (
                                                <button
                                                    key={opcion.id ?? opcion._idx}
                                                    type="button"
                                                    disabled={loadingSearch}
                                                    onClick={() => {
                                                        setIsComidaModalOpen(false);
                                                        handleRegisterMarcaje('salida_comida', { comida_opcion: opcion.id ?? opcion._idx });
                                                    }}
                                                    className="p-6 rounded-2xl border-2 border-amber-200 dark:border-amber-900 bg-card hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 active:scale-[0.98] text-center transition-all flex flex-col items-center justify-between gap-4 shadow-sm min-h-[320px] group cursor-pointer"
                                                >
                                                    {/* Cabecera de la tarjeta: Badge de tipo y disponibilidad */}
                                                    <div className="flex items-center justify-between w-full gap-2">
                                                        {tipoLabel ? (
                                                            <span className="text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900">
                                                                {tipoLabel}
                                                            </span>
                                                        ) : <span />}

                                                        <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                            Disponible
                                                        </span>
                                                    </div>

                                                    {/* Contenido principal: Ícono, Nombre y Descripción */}
                                                    <div className="flex flex-col items-center gap-2.5 w-full my-1">
                                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900">
                                                            {renderIcon()}
                                                        </div>

                                                        <h3 className="font-bold text-lg sm:text-xl text-foreground leading-tight text-center px-1">
                                                            {opcion.nombre}
                                                        </h3>

                                                        {opcion.descripcion && (
                                                            <p className="text-xs sm:text-sm text-muted-foreground text-center line-clamp-3 leading-relaxed px-2">
                                                                {opcion.descripcion}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Horario estipulado: Bien espaciado y en una sola línea */}
                                                    {opcion.hora_inicio && opcion.hora_fin ? (
                                                        <div className="w-full flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold bg-muted px-4 py-2.5 rounded-xl border whitespace-nowrap">
                                                            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                                            <span className="text-muted-foreground">Servicio:</span>
                                                            <strong className="text-amber-700 dark:text-amber-300 font-mono tracking-wide">
                                                                {opcion.hora_inicio.slice(0, 5)} - {opcion.hora_fin.slice(0, 5)} hrs
                                                            </strong>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full text-center text-xs text-muted-foreground italic py-2">
                                                            Disponible todo el día
                                                        </div>
                                                    )}

                                                    {/* Pie: Solo el Costo en Pesos Mexicanos (Sin etiqueta "Costo Colaborador") */}
                                                    {Number(opcion.costo) > 0 && (
                                                        <div className="pt-3 border-t w-full flex items-center justify-center">
                                                            <span className="font-mono text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-wide">
                                                                ${Number(opcion.costo).toFixed(2)} MXN
                                                            </span>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}

                                        {/* TARJETA ESPECIAL: NO ADQUIRIR ALIMENTO / COMIDA PROPIA */}
                                        <button
                                            type="button"
                                            disabled={loadingSearch}
                                            onClick={() => {
                                                setIsComidaModalOpen(false);
                                                handleRegisterMarcaje('salida_comida', { comida_opcion: 'sin_consumo', no_adquirio_alimento: true });
                                            }}
                                            className="p-6 rounded-2xl border-2 border-dashed border-border hover:border-amber-400 bg-card hover:bg-muted/50 text-center transition-all flex flex-col items-center justify-between gap-4 shadow-sm min-h-[320px] group cursor-pointer active:scale-[0.98]"
                                        >
                                            <div className="flex items-center justify-between w-full gap-2">
                                                <span className="text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-lg bg-muted text-muted-foreground border">
                                                    OPCIÓN
                                                </span>
                                                <span className="text-xs font-semibold tracking-wider uppercase px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border">
                                                    Sin Consumo
                                                </span>
                                            </div>

                                            <div className="flex flex-col items-center gap-2.5 w-full my-1">
                                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 bg-muted border text-muted-foreground group-hover:text-amber-500">
                                                    <UtensilsCrossed className="w-8 h-8" />
                                                </div>

                                                <h3 className="font-bold text-lg sm:text-xl text-foreground leading-tight text-center px-1">
                                                    No Adquirir Alimento
                                                </h3>

                                                <p className="text-xs sm:text-sm text-muted-foreground text-center line-clamp-3 leading-relaxed px-2">
                                                    Trae comida propia de casa, ayuno o no desea consumir platillos del comedor en este turno.
                                                </p>
                                            </div>

                                            <div className="w-full flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-foreground bg-muted px-4 py-2.5 rounded-xl border whitespace-nowrap">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                <span>Disponible en cualquier turno</span>
                                            </div>

                                            <div className="pt-3 border-t w-full flex items-center justify-center">
                                                <span className="font-mono text-2xl font-bold text-muted-foreground tracking-wide">
                                                    $0.00 MXN
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                <div className="pt-5 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span>Los alimentos estipulados por horario se validan automáticamente con el reloj de la planta.</span>
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsComidaModalOpen(false)}
                                        className="h-12 px-8 rounded-xl text-base font-bold w-full sm:w-auto"
                                    >
                                        Cerrar / Cancelar
                                    </Button>
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* MODAL REGISTRO DE INCIDENTES EN JORNADA */}
            <Dialog open={isIncidenteModalOpen} onOpenChange={setIsIncidenteModalOpen}>
                <DialogContent className="max-w-md border-t-4 border-t-amber-500">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="w-5 h-5" />
                            Registro de Incidente en Jornada
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Seleccione o describa la causa del incidente que interrumpe la actividad.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Causas Frecuentes:</Label>
                            <div className="flex flex-wrap gap-2">
                                {['Falla Eléctrica / Maquinaria', 'Falta de Insumos', 'Cita / Atención Médica', 'Trámite Administrativo', 'Capacitación'].map((causa) => (
                                    <button
                                        key={causa}
                                        type="button"
                                        onClick={() => setIncidenteCausaInput(causa)}
                                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                                            incidenteCausaInput === causa
                                                ? 'bg-amber-500 border-amber-500 text-white'
                                                : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 dark:border-amber-900 dark:text-amber-300'
                                        }`}
                                    >
                                        {causa}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Causa o Detalle del Incidente:</Label>
                            <Input
                                value={incidenteCausaInput}
                                onChange={(e) => setIncidenteCausaInput(e.target.value)}
                                placeholder="Ej. Suspensión de energía en línea de empaque"
                                className="text-xs"
                            />
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsIncidenteModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={() => handleRegisterMarcaje('incidente_inicio', { incidente_causa: incidenteCausaInput || 'Incidente General' })}
                                disabled={loadingSearch || !incidenteCausaInput.trim()}
                                className="bg-amber-500 hover:bg-amber-400 text-white font-bold"
                            >
                                Registrar Incidente
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* PIE DE PÁGINA */}
            <footer className="border-t bg-card px-4 md:px-8 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
                <div className="flex items-center gap-3 flex-wrap justify-center">
                    <span>Sistema Kiosko Checador • Soporte para Teclado, Pistola USB y QR Gafete</span>
                    {gpsStatus === 'activo' && gpsPosition && (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 flex items-center gap-1 font-mono">
                            <MapPin className="w-3 h-3" />
                            GPS: {gpsPosition.lat.toFixed(4)}, {gpsPosition.lng.toFixed(4)}
                        </Badge>
                    )}
                    {gpsStatus === 'obteniendo' && (
                        <span className="text-[10px] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-500 animate-pulse" />
                            Sincronizando GPS...
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span>Control de Asistencia & Horarios</span>
                </div>
            </footer>
        </div>
    );
}

// El kiosko se abre fuera del layout del panel: se envuelve en el proveedor de
// plantilla para heredar el color primario y el modo claro/oscuro del usuario.
export default function RelojChecadorKiosko(props: Props) {
    return (
        <TemplateSettingsProvider>
            <KioskoChecador {...props} />
        </TemplateSettingsProvider>
    );
}
