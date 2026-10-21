import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
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
    QrCode,
    Scan,
    Volume2,
    VolumeX,
    X,
    Sparkles,
    SwitchCamera,
    AlertTriangle,
    MapPin,
    Maximize,
    Minimize,
    Lock,
    Wifi,
    WifiOff,
    RefreshCw,
    Circle,
    FastForward,
    Timer
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

export interface MarcajeItem {
    id?: number;
    tipo: string;
    tipo_nombre?: string;
    hora: string;
    comida_tipo?: string | null;
}

interface EmpleadoFound {
    id: number;
    nombre_completo: string;
    documento_identidad: string;
    foto_empleado?: string | null;
    departamento?: string;
    cargo?: string;
    turno?: string;
    minutos_descanso?: number;
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

    // Disponibilidad de opciones de comida según horario en planta
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

    const opcionesDisponibles = useMemo(() => {
        return opciones_comida
            .map((opcion, idx) => ({
                ...opcion,
                _idx: idx,
                _disponible: estaDisponibleAhora(opcion),
            }))
            .filter((o) => o._disponible);
    }, [opciones_comida, currentTime, tz]);

    const horaPlanta = currentTime.toLocaleTimeString('es-MX', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    // Estado del Numpad / Entrada
    const [documentInput, setDocumentInput] = useState('');
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [empleado, setEmpleado] = useState<EmpleadoFound | null>(null);
    const [marcajesHoy, setMarcajesHoy] = useState<MarcajeItem[]>([]);
    const [ultimoMarcaje, setUltimoMarcaje] = useState<{ tipo: string; hora: string; tipo_nombre?: string } | null>(null);
    // Si la foto no carga se muestran las iniciales en lugar del texto alternativo.
    const [fotoFallida, setFotoFallida] = useState(false);
    useEffect(() => setFotoFallida(false), [empleado?.id]);
    const [sugerenciaMarcaje, setSugerenciaMarcaje] = useState<string>('entrada');
    const [tipoMarcajeSeleccionado, setTipoMarcajeSeleccionado] = useState<string>('entrada');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [successCountdown, setSuccessCountdown] = useState<number>(4);
    const [successExtraData, setSuccessExtraData] = useState<{
        minutos_descanso?: number;
        hora_regreso_estimada?: string | null;
        es_offline?: boolean;
        tipo?: string;
    } | null>(null);

    // Temporizador de Inactividad (Auto-Reset tras 15s de abandono)
    const [inactivityCountdown, setInactivityCountdown] = useState<number>(15);

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

    // Modales para Descansos, Comidas e Incidentes
    const [isDescansoModalOpen, setIsDescansoModalOpen] = useState(false);
    const [selectedMinutosDescanso, setSelectedMinutosDescanso] = useState<number>(15);
    const [isIncidenteModalOpen, setIsIncidenteModalOpen] = useState(false);
    const [isComidaModalOpen, setIsComidaModalOpen] = useState(false);
    const [incidenteCausaInput, setIncidenteCausaInput] = useState<string>('');

    const inputRef = useRef<HTMLInputElement | null>(null);

    // Text-To-Speech (Voz sintetizada)
    const [ttsEnabled, setTtsEnabled] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('kiosko_tts_enabled') !== 'false';
        }
        return true;
    });

    const toggleTts = () => {
        setTtsEnabled((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem('kiosko_tts_enabled', String(next));
            }
            return next;
        });
    };

    const speakMessage = (text: string) => {
        if (!ttsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-MX';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            const voices = window.speechSynthesis.getVoices();
            const esVoice = voices.find(v => v.lang.includes('es-MX') || v.lang.includes('es-ES') || v.lang.startsWith('es'));
            if (esVoice) utterance.voice = esVoice;
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn('TTS error:', e);
        }
    };

    // Feedback háptico (Vibración táctil)
    const triggerHaptic = () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
                navigator.vibrate(25);
            } catch (e) { }
        }
    };

    // Modo Pantalla Completa
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => { });
        } else {
            document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => { });
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // PIN de Administrador para salir del modo Kiosko
    const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState<boolean>(false);
    const [adminPinInput, setAdminPinInput] = useState<string>('');
    const [adminPinError, setAdminPinError] = useState<string | null>(null);

    const handleAdminPinSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const validPins = ['1234', 'admin', '0000', 'smurfit'];
        if (validPins.includes(adminPinInput.trim())) {
            setIsAdminPinModalOpen(false);
            window.location.href = '/dashboard';
        } else {
            setAdminPinError('PIN de supervisor incorrecto.');
        }
    };

    // Resiliencia Offline
    const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [offlineQueue, setOfflineQueue] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                return JSON.parse(localStorage.getItem('smurfit_kiosko_offline_marcajes') || '[]');
            } catch {
                return [];
            }
        }
        return [];
    });
    const [syncingOffline, setSyncingOffline] = useState<boolean>(false);
    const [syncNotice, setSyncNotice] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('smurfit_kiosko_offline_marcajes', JSON.stringify(offlineQueue));
        }
    }, [offlineQueue]);

    const syncOfflineQueue = async () => {
        if (offlineQueue.length === 0 || syncingOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) return;

        setSyncingOffline(true);
        const token = getCsrfToken();
        const pending = [...offlineQueue];
        const remaining: any[] = [];
        let syncedCount = 0;

        for (const item of pending) {
            try {
                const response = await fetch('/admin/api/reloj-checador/registrar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': token,
                        'X-XSRF-TOKEN': token,
                    },
                    body: JSON.stringify(item.payload),
                });
                if (response.ok) {
                    syncedCount++;
                } else {
                    remaining.push(item);
                }
            } catch (err) {
                remaining.push(item);
            }
        }

        setOfflineQueue(remaining);
        setSyncingOffline(false);
        if (syncedCount > 0) {
            setSyncNotice(`✓ Sincronizados ${syncedCount} marcaje(s) offline.`);
            setTimeout(() => setSyncNotice(null), 5000);
        }
    };

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncOfflineQueue();
        };
        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [offlineQueue]);

    // Temporizador de Inactividad (15s) cuando hay empleado verificado
    useEffect(() => {
        if (!empleado || isComidaModalOpen || isDescansoModalOpen || isIncidenteModalOpen || successMessage) {
            return;
        }

        setInactivityCountdown(15);
        const timer = setInterval(() => {
            setInactivityCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleNumpadClear();
                    return 15;
                }
                return prev - 1;
            });
        }, 1000);

        const resetInactivity = () => setInactivityCountdown(15);
        window.addEventListener('pointerdown', resetInactivity);
        window.addEventListener('keydown', resetInactivity);

        return () => {
            clearInterval(timer);
            window.removeEventListener('pointerdown', resetInactivity);
            window.removeEventListener('keydown', resetInactivity);
        };
    }, [empleado, isComidaModalOpen, isDescansoModalOpen, isIncidenteModalOpen, successMessage]);

    // Temporizador de Cuenta Regresiva de Éxito (4s para siguiente colaborador)
    useEffect(() => {
        if (!successMessage) return;

        setSuccessCountdown(4);
        const timer = setInterval(() => {
            setSuccessCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleNumpadClear();
                    setSuccessMessage(null);
                    setSuccessExtraData(null);
                    return 4;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [successMessage]);

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
        triggerHaptic();
        if (successMessage) {
            handleNumpadClear();
            setSuccessMessage(null);
            setSuccessExtraData(null);
        }
        if (documentInput.length < 20) {
            const nextVal = documentInput + val;
            setDocumentInput(nextVal);
            // Búsqueda instantánea al completar 8 dígitos
            if (nextVal.length === 8 && !loadingSearch) {
                performSearch(nextVal);
            }
        }
    };

    const handleNumpadDelete = () => {
        triggerHaptic();
        setDocumentInput((prev) => prev.slice(0, -1));
    };

    // Limpia la pantalla para el siguiente colaborador (cancelar, inactividad o marcaje exitoso). El mismo
    // gafete no se relee mientras siga frente a la cámara (debe retirarse unos segundos); uno distinto se lee de inmediato.
    const handleNumpadClear = () => {
        triggerHaptic();
        if (ultimoCodigoRef.current) ultimoCodigoRef.current.at = Date.now();
        setDocumentInput('');
        setEmpleado(null);
        setUltimoMarcaje(null);
        setMarcajesHoy([]);
        setErrorMessage(null);
        setInactivityCountdown(15);
        if (inputRef.current) inputRef.current.focus();
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
        setSuccessExtraData(null);

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
                setMarcajesHoy([]);
                setErrorMessage('Tu sesión expiró. Recarga la página e inicia sesión de nuevo.');
                return;
            }
            if (response.status >= 500) {
                setEmpleado(null);
                setMarcajesHoy([]);
                setErrorMessage('Error del servidor. Intenta de nuevo en unos segundos.');
                return;
            }

            const data = await response.json();

            if (response.ok && data.success) {
                playBeepSound();
                setEmpleado(data.empleado);
                setMarcajesHoy(data.marcajes_hoy || []);
                setUltimoMarcaje(data.ultimo_marcaje || null);
                setSugerenciaMarcaje(data.sugerencia_marcaje);
                setTipoMarcajeSeleccionado(data.sugerencia_marcaje);
                setInactivityCountdown(15);
            } else {
                setEmpleado(null);
                setUltimoMarcaje(null);
                setMarcajesHoy([]);
                setErrorMessage(data.message || 'No se encontró ningún empleado activo con ese número o QR.');
            }
        } catch (err: any) {
            // Antes cualquier fallo (sin red, respuesta no JSON) se mostraba como
            // "empleado no encontrado", lo que confundía al colaborador.
            setEmpleado(null);
            setMarcajesHoy([]);
            setErrorMessage('No se pudo conectar con el servidor. Verifica la conexión a la red de la planta.');
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

        const nowIso = new Date().toISOString();
        const payloadData = {
            empleado_id: empleado.id,
            tipo_marcaje: tipo,
            fotografia_base64: fotoBase64,
            latitud: gpsPosition?.lat ?? null,
            longitud: gpsPosition?.lng ?? null,
            fecha_hora_local: nowIso,
            ...extraPayload,
        };

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
                body: JSON.stringify(payloadData),
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
                triggerHaptic();

                const tipoFinal = data?.marcaje?.tipo_marcaje || tipo;
                const nombreMarcaje = data?.marcaje?.tipo_nombre
                    ? data.marcaje.tipo_nombre.toUpperCase()
                    : getNombreMarcaje(tipoFinal);

                const primerNombre = (data.empleado_nombre || empleado.nombre_completo).split(' ')[0];
                if (tipoFinal === 'entrada') {
                    speakMessage(`¡Bienvenido, ${primerNombre}! Registro de entrada completado. Que tengas un excelente turno.`);
                } else if (tipoFinal === 'salida_comida') {
                    speakMessage(`¡Buen provecho, ${primerNombre}! Marcaje de inicio de comida registrado.`);
                } else if (tipoFinal === 'entrada_comida') {
                    speakMessage(`¡Bienvenido de vuelta, ${primerNombre}! Marcaje de fin de comida registrado.`);
                } else if (tipoFinal === 'salida') {
                    speakMessage(`¡Hasta pronto, ${primerNombre}! Marcaje de salida completado. Que descanses.`);
                } else if (tipoFinal === 'descanso_inicio') {
                    speakMessage(`Pausa de descanso registrada para ${primerNombre}.`);
                } else if (tipoFinal === 'descanso_fin') {
                    speakMessage(`Fin de descanso registrado para ${primerNombre}.`);
                } else {
                    speakMessage(`Marcaje de ${nombreMarcaje} registrado exitosamente para ${primerNombre}.`);
                }

                setSuccessExtraData({
                    tipo: tipoFinal,
                    minutos_descanso: data?.marcaje?.minutos_descanso || empleado.minutos_descanso || 30,
                    hora_regreso_estimada: data?.marcaje?.hora_regreso_estimada,
                    es_offline: false,
                });

                setSuccessMessage(`¡Marcaje de ${nombreMarcaje} registrado exitosamente para ${data.empleado_nombre}!`);
                setIsDescansoModalOpen(false);
                setIsIncidenteModalOpen(false);
            } else {
                setErrorMessage(data.message || 'Error al registrar el marcaje.');
            }
        } catch (err: any) {
            // Modo Offline: Registrar en memoria local ante corte de red en planta
            playBeepSound();
            triggerHaptic();

            const tipoFinal = tipo;
            const nombreMarcaje = getNombreMarcaje(tipoFinal);
            const offlineRecord = {
                id: 'offline_' + Date.now(),
                payload: payloadData,
                empleado_nombre: empleado.nombre_completo,
                tipo_nombre: nombreMarcaje,
                hora: formatTime(new Date()),
            };

            setOfflineQueue((prev) => [...prev, offlineRecord]);

            const primerNombre = empleado.nombre_completo.split(' ')[0];
            speakMessage(`Marcaje guardado en modo offline para ${primerNombre}.`);

            setSuccessExtraData({
                tipo: tipoFinal,
                minutos_descanso: empleado.minutos_descanso || 30,
                hora_regreso_estimada: null,
                es_offline: true,
            });

            setSuccessMessage(`¡Marcaje de ${nombreMarcaje} GUARDADO LOCALMENTE (Modo Offline) para ${empleado.nombre_completo}!`);
            setIsDescansoModalOpen(false);
            setIsIncidenteModalOpen(false);
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
    // Las teclas son grandes para pantallas táctiles de pared.
    const teclaDigito = 'h-16 rounded-2xl bg-card text-foreground text-2xl sm:text-3xl font-bold border-2 border-border shadow-sm transition-all active:scale-90 active:ring-4 active:ring-primary/30 hover:bg-primary hover:text-primary-foreground hover:border-primary flex items-center justify-center select-none';
    const accionNeutra = 'bg-card hover:bg-muted text-foreground border border-border shadow-sm';
    const accionBase = 'h-20 text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1 rounded-xl transition-all';
    const botonBarra = 'p-2.5 rounded-xl border border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:text-white transition-all';

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

                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="text-right hidden sm:block mr-1">
                            <div className="text-2xl font-bold font-mono tabular-nums tracking-wider text-white">{formatTime(currentTime)}</div>
                            <div className="text-xs text-neutral-400 capitalize">{formatDate(currentTime)} • {tz}</div>
                        </div>

                        {/* Botón de Voz Sintetizada (TTS) */}
                        <button
                            type="button"
                            onClick={toggleTts}
                            title={ttsEnabled ? 'Voz activa (Clic para silenciar)' : 'Voz silenciada (Clic para activar)'}
                            className={`${botonBarra} ${ttsEnabled ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-500'}`}
                        >
                            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>

                        {/* Botón de Pantalla Completa Táctil */}
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            title={isFullscreen ? 'Salir de Pantalla Completa' : 'Modo Pantalla Completa F11'}
                            className={botonBarra}
                        >
                            {isFullscreen ? <Minimize className="w-4 h-4 text-emerald-400" /> : <Maximize className="w-4 h-4" />}
                        </button>

                        {/* Botón Panel Admin Protegido con PIN */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setAdminPinInput('');
                                setAdminPinError(null);
                                setIsAdminPinModalOpen(true);
                            }}
                            className="border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-800 hover:text-white gap-1.5"
                        >
                            <Lock className="w-4 h-4 text-amber-400" />
                            <span className="hidden sm:inline">Panel Admin</span>
                        </Button>
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

                                        {/* TECLADO TÁCTIL (NUMPAD) PARA PANTALLAS DE PARED */}
                                        <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                                            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                                                <button key={num} type="button" onClick={() => handleNumpadPress(num)} className={teclaDigito}>
                                                    {num}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={handleNumpadClear}
                                                className="h-16 rounded-2xl text-xs sm:text-sm font-bold border-2 shadow-sm transition-all active:scale-90 flex items-center justify-center select-none bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900"
                                            >
                                                LIMPIAR
                                            </button>
                                            <button type="button" onClick={() => handleNumpadPress('0')} className={teclaDigito}>
                                                0
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleNumpadDelete}
                                                className="h-16 rounded-2xl border-2 shadow-sm transition-all active:scale-90 flex items-center justify-center select-none bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900"
                                            >
                                                <Delete className="w-6 h-6 sm:w-7 sm:h-7" />
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
                            <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 p-6 sm:p-8 text-center space-y-5 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-300 dark:bg-emerald-900/40 dark:border-emerald-700 flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                                </div>

                                <div className="space-y-2">
                                    <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 text-xs px-3 py-1 font-semibold">
                                        {successExtraData?.es_offline ? 'Registro Offline Guardado' : 'Marcaje Registrado Correctamente'}
                                    </Badge>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-emerald-900 dark:text-emerald-100 tracking-tight leading-snug">
                                        {successMessage}
                                    </h2>
                                    <p className="text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm max-w-md mx-auto">
                                        {successExtraData?.es_offline
                                            ? 'Guardado en la memoria local del quiosco. Se sincronizará silenciosamente tan pronto regrese la conexión de red en planta.'
                                            : 'El sistema ha registrado el evento de asistencia y notificado automáticamente por WhatsApp al empleado.'}
                                    </p>
                                </div>

                                {/* TARJETA ESPECIAL: CONTADOR Y HORA SUGERIDA DE REGRESO DE ALMUERZO */}
                                {successExtraData?.tipo === 'salida_comida' && (
                                    <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200 space-y-3 max-w-lg mx-auto">
                                        <div className="flex items-center justify-center gap-2 font-bold text-sm sm:text-base">
                                            <Utensils className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                            <span>Tiempo de Comida Asignado: {successExtraData.minutos_descanso ?? 30} Minutos</span>
                                        </div>

                                        {successExtraData.hora_regreso_estimada ? (
                                            <div className="bg-card py-3 px-4 rounded-xl border border-amber-200 dark:border-amber-900">
                                                <div className="text-xs text-muted-foreground">Hora sugerida de regreso para marcar FIN DE COMIDA:</div>
                                                <div className="text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-300 font-mono tracking-wider mt-0.5">
                                                    {successExtraData.hora_regreso_estimada} hrs
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-xs font-mono">
                                                Dispones de {successExtraData.minutos_descanso ?? 30} minutos de descanso estipulado.
                                            </div>
                                        )}

                                        <p className="text-xs opacity-90">
                                            ¡Buen provecho! Al concluir tus alimentos, recuerda checar tu <strong className="underline">FIN DE COMIDA</strong> en este quiosco.
                                        </p>
                                    </div>
                                )}

                                {/* BARRA DE CUENTA REGRESIVA (4s) Y BOTÓN DE LIBERACIÓN INMEDIATA */}
                                <div className="pt-2 space-y-3 max-w-md mx-auto">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
                                            <span>Liberando quiosco para el siguiente compañero...</span>
                                            <strong className="font-mono">{successCountdown}s</strong>
                                        </div>
                                        <div className="w-full h-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-linear"
                                                style={{ width: `${(successCountdown / 4) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        onClick={() => {
                                            handleNumpadClear();
                                            setSuccessMessage(null);
                                            setSuccessExtraData(null);
                                        }}
                                        className="w-full h-14 text-sm sm:text-base font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                                    >
                                        <FastForward className="w-5 h-5" />
                                        <span>REGISTRAR SIGUIENTE EMPLEADO AHORA</span>
                                    </Button>
                                </div>
                            </Card>
                        ) : empleado ? (
                            <Card className="shadow-sm border-t-4 border-t-emerald-500 space-y-5 p-5 sm:p-6">
                                {/* CABECERA DE PERFIL DEL EMPLEADO */}
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
                                        <h2 className="text-xl font-bold text-foreground truncate">{empleado.nombre_completo}</h2>
                                        <p className="text-xs text-muted-foreground truncate">{empleado.cargo || 'Sin cargo'} • {empleado.departamento || 'Sin departamento'}</p>
                                        <p className="text-xs text-primary font-medium">Turno: {empleado.turno}</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleNumpadClear}
                                        disabled={loadingSearch}
                                        className="ml-auto self-start shrink-0 gap-1 text-muted-foreground"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancelar
                                    </Button>
                                </div>

                                {/* MINI LÍNEA DE TIEMPO DEL DÍA (TIMELINE DE ASISTENCIA - 4 HITOS) */}
                                {(() => {
                                    const hitoEntrada = marcajesHoy.find(m => m.tipo === 'entrada' || m.tipo === 'entrada_extraordinaria');
                                    const hitoInicioComida = marcajesHoy.find(m => m.tipo === 'salida_comida');
                                    const hitoFinComida = marcajesHoy.find(m => m.tipo === 'entrada_comida');
                                    const hitoSalida = marcajesHoy.find(m => m.tipo === 'salida');

                                    const hitos = [
                                        {
                                            key: 'entrada',
                                            label: 'Entrada',
                                            icon: LogIn,
                                            marcaje: hitoEntrada,
                                            esSugerido: sugerenciaMarcaje === 'entrada',
                                        },
                                        {
                                            key: 'salida_comida',
                                            label: 'Inicio Comida',
                                            icon: Utensils,
                                            marcaje: hitoInicioComida,
                                            esSugerido: sugerenciaMarcaje === 'salida_comida',
                                        },
                                        {
                                            key: 'entrada_comida',
                                            label: 'Fin Comida',
                                            icon: UtensilsCrossed,
                                            marcaje: hitoFinComida,
                                            esSugerido: sugerenciaMarcaje === 'entrada_comida',
                                        },
                                        {
                                            key: 'salida',
                                            label: 'Salida',
                                            icon: LogOut,
                                            marcaje: hitoSalida,
                                            esSugerido: sugerenciaMarcaje === 'salida',
                                        },
                                    ];

                                    return (
                                        <div className="bg-muted/40 border rounded-2xl p-3 sm:p-4 space-y-2">
                                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
                                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Clock className="w-3.5 h-3.5 text-primary" />
                                                    <span>Línea de Asistencia del Turno</span>
                                                </span>
                                                <span className="text-[11px] text-muted-foreground font-normal normal-case">
                                                    {formatDate(currentTime).split(',')[0]}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1">
                                                {hitos.map((h) => {
                                                    const Icon = h.icon;
                                                    const tieneMarcaje = Boolean(h.marcaje);
                                                    const esActivo = !tieneMarcaje && h.esSugerido;

                                                    return (
                                                        <div
                                                            key={h.key}
                                                            className={`relative flex flex-col items-center text-center p-2 rounded-xl border transition-all ${
                                                                tieneMarcaje
                                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                                                                    : esActivo
                                                                        ? 'bg-amber-50 border-amber-400 text-amber-700 ring-2 ring-amber-400/30 animate-pulse dark:bg-amber-950/30 dark:text-amber-300'
                                                                        : 'bg-card border-border text-muted-foreground'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-1 mb-1">
                                                                {tieneMarcaje ? (
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                                ) : esActivo ? (
                                                                    <Icon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 animate-bounce" />
                                                                ) : (
                                                                    <Circle className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                                                                )}
                                                                <span className="text-[10px] sm:text-xs font-bold truncate max-w-[65px] sm:max-w-none">
                                                                    {h.label}
                                                                </span>
                                                            </div>

                                                            <div className="font-mono text-[11px] sm:text-xs font-bold">
                                                                {tieneMarcaje ? (
                                                                    <span>{h.marcaje?.hora?.slice(0, 5)}</span>
                                                                ) : esActivo ? (
                                                                    <span className="uppercase tracking-tighter text-[9px] sm:text-[10px]">
                                                                        Siguiente
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted-foreground/60 font-normal">--:--</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* TEMPORIZADOR DE INACTIVIDAD (AUTO-RESET TRAS 15s) */}
                                <div className="space-y-1.5 bg-muted/40 p-2.5 rounded-xl border">
                                    <div className="flex items-center text-[11px] text-muted-foreground gap-1.5">
                                        <Timer className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                                        <span>Tiempo restante para checar: <strong className="text-amber-600 dark:text-amber-400 font-mono">{inactivityCountdown}s</strong></span>
                                    </div>
                                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ease-linear rounded-full ${inactivityCountdown <= 5 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${(inactivityCountdown / 15) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* BOTONES DE MARCAJE CON SUGERENCIA RESALTADA */}
                                <div className="space-y-3">
                                    <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider block">
                                        SELECCIONE LA ACCIÓN A REGISTRAR:
                                    </Label>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {(() => {
                                            const esDescansoActivo = sugerenciaMarcaje === 'descanso_fin' || empleado?.ultimo_marcaje_tipo === 'descanso_inicio';
                                            const esIncidenteActivo = sugerenciaMarcaje === 'incidente_fin' || empleado?.ultimo_marcaje_tipo === 'incidente_inicio';
                                            const tieneUnicaOpcionComida = opcionesDisponibles.length === 1;
                                            const unicaOpcionComida = tieneUnicaOpcionComida ? opcionesDisponibles[0] : null;

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

                                                    {/* BOTÓN INICIO COMIDA: CON MARCAJE RÁPIDO SI SOLO HAY 1 PLATILLO ACTIVO */}
                                                    <div className="flex flex-col">
                                                        <Button
                                                            onClick={() => {
                                                                if (tieneUnicaOpcionComida && unicaOpcionComida) {
                                                                    handleRegisterMarcaje('salida_comida', {
                                                                        comida_opcion: unicaOpcionComida.id ?? unicaOpcionComida._idx,
                                                                    });
                                                                } else {
                                                                    setIsComidaModalOpen(true);
                                                                }
                                                            }}
                                                            disabled={loadingSearch}
                                                            className={`${accionBase} gap-0.5 w-full ${
                                                                sugerenciaMarcaje === 'salida_comida'
                                                                    ? 'bg-amber-500 hover:bg-amber-400 text-white ring-4 ring-amber-500/30 shadow-md'
                                                                    : accionNeutra
                                                            }`}
                                                        >
                                                            <Utensils className={`w-5 h-5 ${sugerenciaMarcaje === 'salida_comida' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
                                                            <span>INICIO COMIDA</span>
                                                            {tieneUnicaOpcionComida && unicaOpcionComida ? (
                                                                <span className="text-[10px] opacity-80 font-medium truncate max-w-[130px]">
                                                                    ⚡ Rápido: {unicaOpcionComida.nombre}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] opacity-75 font-normal">Salida a Comer</span>
                                                            )}
                                                        </Button>
                                                        {tieneUnicaOpcionComida && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsComidaModalOpen(true)}
                                                                className="text-[10px] text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 underline mt-1 text-center"
                                                            >
                                                                Ver menú / Sin consumo
                                                            </button>
                                                        )}
                                                    </div>

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

            {/* MODAL DE SEGURIDAD: PIN DE SUPERVISOR PARA SALIR DEL KIOSKO */}
            <Dialog open={isAdminPinModalOpen} onOpenChange={setIsAdminPinModalOpen}>
                <DialogContent className="max-w-sm border-t-4 border-t-amber-500 p-6 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                            <Lock className="w-5 h-5 text-amber-500" />
                            <span>Acceso Administrativo</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            El quiosco está protegido. Ingrese el PIN de supervisor para salir al Panel Administrativo.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAdminPinSubmit} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Input
                                type="password"
                                inputMode="numeric"
                                autoFocus
                                placeholder="PIN de Supervisor"
                                value={adminPinInput}
                                onChange={(e) => {
                                    setAdminPinInput(e.target.value);
                                    setAdminPinError(null);
                                }}
                                className="text-center text-2xl tracking-widest font-mono h-14 rounded-xl"
                            />
                            {adminPinError && (
                                <p className="text-xs text-rose-600 dark:text-rose-400 text-center font-semibold">{adminPinError}</p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAdminPinModalOpen(false)}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-amber-500 hover:bg-amber-400 text-white font-bold"
                            >
                                Desbloquear
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* PIE DE PÁGINA CON ESTADO DE RED, COLA OFFLINE Y SINCRONIZACIÓN */}
            <footer className="border-t bg-card px-4 md:px-8 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
                <div className="flex items-center gap-3 flex-wrap justify-center">
                    <span>Sistema Kiosko Checador • Soporte Táctil, Pistola USB y QR Gafete</span>

                    {/* Indicador de Red Online / Offline */}
                    {isOnline ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 flex items-center gap-1 font-mono">
                            <Wifi className="w-3 h-3" />
                            <span>En Línea (Planta)</span>
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900 flex items-center gap-1 font-mono animate-pulse">
                            <WifiOff className="w-3 h-3" />
                            <span>Modo Offline (Sin red)</span>
                        </Badge>
                    )}

                    {/* Marcajes Pendientes en Cola Offline */}
                    {offlineQueue.length > 0 && (
                        <button
                            type="button"
                            onClick={syncOfflineQueue}
                            disabled={syncingOffline}
                            className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900 px-2 py-0.5 rounded-md flex items-center gap-1 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
                            title="Haga clic para sincronizar ahora"
                        >
                            <RefreshCw className={`w-3 h-3 ${syncingOffline ? 'animate-spin' : ''}`} />
                            <span>{offlineQueue.length} marcaje(s) offline {syncingOffline ? '(Sincronizando...)' : '(Clic para sincronizar)'}</span>
                        </button>
                    )}

                    {syncNotice && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            {syncNotice}
                        </span>
                    )}

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
                    <span>Control de Asistencia & Horarios • Smurfit Westrock</span>
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
