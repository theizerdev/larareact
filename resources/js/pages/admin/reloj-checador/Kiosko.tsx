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
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Configuracion {
    requiere_foto_marcaje?: boolean;
    tolerancia_retardo_minutos?: number;
}

interface Props {
    configuracion?: Configuracion;
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

export default function RelojChecadorKiosko({ configuracion }: Props) {
    // Reloj digital en tiempo real
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

    // Cámara de evidencia de marcaje
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [cameraActive, setCameraActive] = useState(false);

    // Estado y refs para Escáner QR de Gafete por Cámara
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const qrVideoRef = useRef<HTMLVideoElement | null>(null);
    const qrStreamRef = useRef<MediaStream | null>(null);
    const [qrScanning, setQrScanning] = useState(false);
    const [qrDetectedNotice, setQrDetectedNotice] = useState<string | null>(null);

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
            navigator.mediaDevices?.getUserMedia({ video: true })
                .then((stream) => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        setCameraActive(true);
                    }
                })
                .catch(() => setCameraActive(false));
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

    // Iniciar / Detener cámara para lector de QR Gafete
    const startQrCamera = async () => {
        setQrModalOpen(true);
        setQrDetectedNotice(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            qrStreamRef.current = stream;
            if (qrVideoRef.current) {
                qrVideoRef.current.srcObject = stream;
                setQrScanning(true);
            }
        } catch (err) {
            setErrorMessage('No se pudo acceder a la cámara para escanear el gafete QR.');
            setQrModalOpen(false);
        }
    };

    const stopQrCamera = () => {
        setQrScanning(false);
        if (qrStreamRef.current) {
            qrStreamRef.current.getTracks().forEach(track => track.stop());
            qrStreamRef.current = null;
        }
        setQrModalOpen(false);
    };

    // Bucle de Detección QR por Cámara usando BarcodeDetector si está disponible
    useEffect(() => {
        let intervalId: any = null;

        if (qrScanning && qrVideoRef.current) {
            intervalId = setInterval(async () => {
                if (!qrVideoRef.current || qrVideoRef.current.readyState !== 4) return;

                if ('BarcodeDetector' in window) {
                    try {
                        const barcodeDetector = new (window as any).BarcodeDetector({
                            formats: ['qr_code', 'code_128', 'code_39', 'data_matrix', 'ean_13']
                        });
                        const barcodes = await barcodeDetector.detect(qrVideoRef.current);

                        if (barcodes.length > 0) {
                            const rawCode = barcodes[0].rawValue;
                            if (rawCode && rawCode.trim()) {
                                playBeepSound();
                                setQrDetectedNotice(`Gafete detectado: ${rawCode}`);
                                setDocumentInput(rawCode.trim());
                                stopQrCamera();
                                // Ejecutar búsqueda automáticamente
                                performSearch(rawCode.trim());
                            }
                        }
                    } catch (e) {
                        // Error de detección sostenido
                    }
                }
            }, 300);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [qrScanning]);

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
    const handleRegisterMarcaje = async (tipo: string) => {
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
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                playBeepSound();
                setSuccessMessage(`¡Marcaje de ${tipo.toUpperCase()} registrado exitosamente para ${data.empleado_nombre}!`);
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

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 md:p-8 font-sans select-none">
            <Head title="Kiosko Reloj Checador - Escáner QR Gafete" />

            {/* BARRA SUPERIOR */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-600/20 rounded-2xl border border-emerald-500/30 text-emerald-400">
                        <Clock className="w-8 h-8 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-wide">RELOJ CHECADOR DIGITAL</h1>
                        <p className="text-xs text-slate-400">Control de Asistencia por Numpad, QR Gafete & Pistola Lector</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <div className="text-2xl font-black text-emerald-400 font-mono tracking-wider">{formatTime(currentTime)}</div>
                        <div className="text-xs text-slate-400 capitalize">{formatDate(currentTime)}</div>
                    </div>

                    <Link href="/dashboard">
                        <Button variant="outline" className="border-slate-800 bg-slate-900 text-slate-300 hover:text-white">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Panel Admin
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
                                        N° de Empleado, Documento o QR Gafete
                                    </Label>
                                    <Badge variant="outline" className="text-[10px] bg-indigo-950/60 text-indigo-300 border-indigo-800 flex items-center gap-1">
                                        <Scan className="w-3 h-3" /> Lector USB listo
                                    </Badge>
                                </div>

                                <div className="relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={documentInput}
                                        onChange={(e) => setDocumentInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                                        placeholder="Ingrese número o escanee código de barras/QR..."
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
                                    <span>ESCANEAR GAFETE QR (CÁMARA)</span>
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
                                        {num}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleNumpadClear}
                                    className="h-14 rounded-xl bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold border border-rose-900 transition-all active:scale-95 flex items-center justify-center"
                                >
                                    LIMPIAR
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleNumpadPress('0')}
                                    className="h-14 rounded-xl bg-slate-800/80 hover:bg-emerald-600 text-2xl font-bold text-white border border-slate-700 hover:border-emerald-500 transition-all active:scale-95 shadow-md flex items-center justify-center"
                                >
                                    0
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNumpadDelete}
                                    className="h-14 rounded-xl bg-amber-950/60 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-900 transition-all active:scale-95 flex items-center justify-center"
                                >
                                    <Delete className="w-6 h-6" />
                                </button>
                            </div>

                            <Button
                                onClick={() => handleSearch()}
                                disabled={!documentInput.trim() || loadingSearch}
                                className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-950/50"
                            >
                                {loadingSearch ? 'VERIFICANDO...' : 'VERIFICAR EMPLEADO'}
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
                            <p className="text-emerald-200 text-sm">El sistema ha registrado el evento de asistencia y notificado por WhatsApp al empleado.</p>
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
                                        Empleado Verificado
                                    </Badge>
                                    <h2 className="text-xl font-bold text-white">{empleado.nombre_completo}</h2>
                                    <p className="text-xs text-slate-400">{empleado.cargo || 'Sin cargo'} • {empleado.departamento || 'Sin departamento'}</p>
                                    <p className="text-xs text-emerald-400 font-medium">Turno: {empleado.turno}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider block">
                                    SELECCIONE EL ACCIÓN A REGISTRAR:
                                </Label>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        onClick={() => handleRegisterMarcaje('entrada')}
                                        disabled={loadingSearch}
                                        className={`h-20 text-base font-bold flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                                            sugerenciaMarcaje === 'entrada'
                                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-emerald-500/40 shadow-lg shadow-emerald-950/50'
                                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                        }`}
                                    >
                                        <LogIn className="w-6 h-6 text-emerald-400" />
                                        <span>ENTRADA</span>
                                    </Button>

                                    <Button
                                        onClick={() => handleRegisterMarcaje('salida_comida')}
                                        disabled={loadingSearch}
                                        className={`h-20 text-base font-bold flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                                            sugerenciaMarcaje === 'salida_comida'
                                                ? 'bg-amber-600 hover:bg-amber-500 text-white ring-4 ring-amber-500/40 shadow-lg'
                                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                        }`}
                                    >
                                        <Utensils className="w-6 h-6 text-amber-400" />
                                        <span>SALIDA COMIDA</span>
                                    </Button>

                                    <Button
                                        onClick={() => handleRegisterMarcaje('entrada_comida')}
                                        disabled={loadingSearch}
                                        className={`h-20 text-base font-bold flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                                            sugerenciaMarcaje === 'entrada_comida'
                                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white ring-4 ring-indigo-500/40 shadow-lg'
                                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                        }`}
                                    >
                                        <Coffee className="w-6 h-6 text-indigo-400" />
                                        <span>REGRESO COMIDA</span>
                                    </Button>

                                    <Button
                                        onClick={() => handleRegisterMarcaje('salida')}
                                        disabled={loadingSearch}
                                        className={`h-20 text-base font-bold flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                                            sugerenciaMarcaje === 'salida'
                                                ? 'bg-rose-600 hover:bg-rose-500 text-white ring-4 ring-rose-500/40 shadow-lg'
                                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                        }`}
                                    >
                                        <LogOut className="w-6 h-6 text-rose-400" />
                                        <span>SALIDA FINAL</span>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card className="bg-slate-900/40 border-slate-800/80 p-8 text-center space-y-4">
                            <UserCheck className="w-16 h-16 text-slate-700 mx-auto" />
                            <h3 className="text-slate-400 font-medium">En espera de ingreso de documento o lectura de QR...</h3>
                            <p className="text-xs text-slate-600">Al ingresar el número de empleado o acercar el QR del gafete a la cámara/lector, aparecerá el perfil con las opciones de marcaje.</p>
                        </Card>
                    )}

                    {/* VISTA DE CÁMARA DE EVIDENCIA SI ESTÁ ACTIVADA */}
                    {configuracion?.requiere_foto_marcaje && (
                        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                                <Camera className="w-4 h-4 text-emerald-400" />
                                <span>Cámara de Evidencia Activa</span>
                            </div>
                            <div className="w-16 h-12 rounded bg-slate-950 border border-slate-800 overflow-hidden">
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE ESCÁNER DE CÁMARA QR GAFETE */}
            <Dialog open={qrModalOpen} onOpenChange={(open) => { if (!open) stopQrCamera(); }}>
                <DialogContent className="max-w-md bg-slate-900 border border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-indigo-400">
                            <QrCode className="w-6 h-6 text-indigo-400 animate-pulse" />
                            Escáner de Gafete QR
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-400">
                            Alinee el código QR del gafete del empleado dentro del recuadro del visor de la cámara.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-500/50 bg-slate-950 h-64 flex items-center justify-center">
                            <video
                                ref={qrVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                            {/* Overlay de Enfoque QR */}
                            <div className="absolute inset-0 border-[40px] border-slate-950/60 pointer-events-none flex items-center justify-center">
                                <div className="w-44 h-44 border-2 border-indigo-400 rounded-2xl relative animate-pulse shadow-2xl">
                                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-indigo-400 rounded-tl"></div>
                                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-indigo-400 rounded-tr"></div>
                                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-indigo-400 rounded-bl"></div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-indigo-400 rounded-br"></div>
                                </div>
                            </div>
                        </div>

                        {qrDetectedNotice && (
                            <div className="p-3 bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-bold text-center rounded-xl flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>{qrDetectedNotice}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-xs text-slate-400">
                            <span>Estado: {qrScanning ? 'Buscando código QR...' : 'Detenido'}</span>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={stopQrCamera}
                                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
                            >
                                Cancelar Escaneo
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* PIE DE PÁGINA */}
            <div className="border-t border-slate-900 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
                <div>Sistema Kiosko Checador LFT • Soporte para Teclado, Pistola USB y QR Gafete</div>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Cumplimiento Ley Federal del Trabajo Art. 60-75</span>
                </div>
            </div>
        </div>
    );
}
