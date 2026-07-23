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
    Phone
} from 'lucide-react';

interface Acompanante {
    nombre: string;
    documento?: string;
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
    };
}

// ── Widget de Cámara en vivo ──
interface CameraWidgetProps {
    onCapture: (base64Data: string) => void;
    onCancel: () => void;
    title: string;
}

function CameraWidget({ onCapture, onCancel, title }: CameraWidgetProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [captured, setCaptured] = useState<string | null>(null);

    const startCamera = async () => {
        setError(null);
        setCaptured(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'environment' }
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
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
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
        startCamera();
        return () => stopCamera();
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 w-full max-w-md flex flex-col items-center gap-4 text-white shadow-2xl">
                <div className="flex items-center justify-between w-full border-b border-slate-800 pb-3">
                    <span className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                        <Camera className="w-5 h-5" /> {title}
                    </span>
                    <button type="button" onClick={() => { stopCamera(); onCancel(); }} className="text-slate-400 hover:text-white p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error ? (
                    <div className="text-rose-400 text-xs text-center p-6 space-y-2">
                        <AlertCircle className="w-8 h-8 mx-auto" />
                        <p>{error}</p>
                    </div>
                ) : !captured ? (
                    <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={capture}
                            className="absolute bottom-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg rounded-full px-6 py-3 text-xs font-extrabold flex items-center gap-2 transition-transform active:scale-95"
                        >
                            <Camera className="w-4 h-4" />
                            Tomar Fotografía
                        </button>
                    </div>
                ) : (
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
                                onClick={() => { stopCamera(); onCapture(captured); }}
                                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" /> Usar Foto
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PaseDigital({ invitacion }: PaseDigitalProps) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(invitacion.uuid)}&color=104a29&bgcolor=ffffff`;

    const isPending = invitacion.status === 'pendiente';
    const isIngresado = invitacion.status === 'ingresado';

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

    const [nuevoAcompanante, setNuevoAcompanante] = useState<Acompanante>({ nombre: '', documento: '' });

    const handleAddAcompanante = () => {
        if (!nuevoAcompanante.nombre.trim()) return;
        setData('acompanantes', [...data.acompanantes, { ...nuevoAcompanante }]);
        setNuevoAcompanante({ nombre: '', documento: '' });
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
            <Head title={`Pase Digital N° ${invitacion.codigo_invitacion} - Driscoll's`} />

            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans">
                
                {/* Header Público Estilo Pre-Registro */}
                <header className="bg-[#104a29] text-white border-b border-emerald-800 sticky top-0 z-40 px-6 py-4 shadow-md">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                            <div>
                                <span className="font-extrabold text-xl tracking-tight block leading-none">DRISCOLL'S</span>
                                <span className="text-xs text-emerald-200 font-medium tracking-wider uppercase">Portal Público de Accesos</span>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-mono font-extrabold text-emerald-200 border border-white/20">
                            Pre-Anuncio N° {invitacion.codigo_invitacion}
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
                                className={`flex items-center gap-2 transition-colors cursor-pointer ${
                                    activeView === 'registro' ? 'text-[#104a29] dark:text-emerald-400' : 'hover:text-slate-800'
                                }`}
                            >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                                    activeView === 'registro' ? 'bg-[#104a29] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
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
                                className={`flex items-center gap-2 transition-colors cursor-pointer ${
                                    activeView === 'pase' ? 'text-[#104a29] dark:text-emerald-400' : 'hover:text-slate-800'
                                }`}
                            >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                                    activeView === 'pase' ? 'bg-[#104a29] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
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
                                    <img src={(data.foto_carnet || invitacion.foto_carnet || '').startsWith('data:') ? (data.foto_carnet || invitacion.foto_carnet) : `/storage/${data.foto_carnet || invitacion.foto_carnet}`} alt="Carnet" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-extrabold text-xl shrink-0">
                                    {invitacion.visitante_nombre?.[0] || 'V'}
                                </div>
                            )}

                            <div className="space-y-1">
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                                    Visitante Registrado
                                </span>
                                <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                                    {invitacion.visitante_nombre}
                                </h1>
                                {invitacion.visitante_empresa && (
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
                                    <FileText className="w-5 h-5" /> Completa tus Datos de Registro e Ingreso
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Por favor registre el medio de acceso, fotografías de su documento de identidad, datos del vehículo (si aplica) y acompañantes antes de llegar a la garita.
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
                                        className={`flex items-center justify-start gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                                            data.medio_acceso === 'peatonal'
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
                                        className={`flex items-center justify-start gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                                            data.medio_acceso === 'vehicular'
                                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 shadow-sm'
                                                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className={`p-3 rounded-xl ${data.medio_acceso === 'vehicular' ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>
                                            <Car className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <span className="font-extrabold text-sm block">Acceso Vehicular</span>
                                            <span className="text-xs text-slate-500">Ingreso con vehículo por la garita principal.</span>
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
                            {data.medio_acceso === 'vehicular' && (
                                <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                                    <label className="text-xs font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                                        <Car className="w-5 h-5 text-amber-500" /> 3. Datos y Fotografías del Vehículo
                                    </label>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Marca</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: Nissan, Toyota..."
                                                value={data.vehiculo_marca}
                                                onChange={(e) => setData('vehiculo_marca', e.target.value)}
                                                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Modelo</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: Versa, Hilux..."
                                                value={data.vehiculo_modelo}
                                                onChange={(e) => setData('vehiculo_modelo', e.target.value)}
                                                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Año</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: 2023"
                                                value={data.vehiculo_anio}
                                                onChange={(e) => setData('vehiculo_anio', e.target.value)}
                                                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Placa</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: ABC-123-A"
                                                value={data.vehiculo_placa}
                                                onChange={(e) => setData('vehiculo_placa', e.target.value.toUpperCase())}
                                                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono uppercase"
                                            />
                                        </div>
                                    </div>

                                    {/* Fotos del Vehículo */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                                        {/* Vehículo Frontal */}
                                        <div className="space-y-2">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Fotografía Frontal del Vehículo</span>
                                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-5 bg-slate-50/60 dark:bg-slate-950 text-center relative overflow-hidden min-h-[160px]">
                                                {data.vehiculo_foto_frontal ? (
                                                    <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-md">
                                                        <img src={data.vehiculo_foto_frontal.startsWith('data:') ? data.vehiculo_foto_frontal : `/storage/${data.vehiculo_foto_frontal}`} alt="Vehículo Frontal" className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => setData('vehiculo_foto_frontal', '')} className="absolute top-2 right-2 bg-rose-600 text-white rounded-full p-1.5 shadow-lg hover:bg-rose-700"><X className="w-4 h-4" /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Car className="w-8 h-8 text-slate-400" />
                                                        <span className="text-xs font-medium text-slate-500">Foto del frente del vehículo (con placa visible)</span>
                                                        <div className="flex gap-3">
                                                            <button type="button" onClick={() => setActiveCameraField('vehiculo_foto_frontal')} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"><Camera className="w-4 h-4" /> Cámara</button>
                                                            <label className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-300 flex items-center gap-2">
                                                                <Upload className="w-4 h-4" /> Archivo
                                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'vehiculo_foto_frontal')} />
                                                            </label>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Vehículo Trasera */}
                                        <div className="space-y-2">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Fotografía Trasera del Vehículo</span>
                                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-5 bg-slate-50/60 dark:bg-slate-950 text-center relative overflow-hidden min-h-[160px]">
                                                {data.vehiculo_foto_trasera ? (
                                                    <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-md">
                                                        <img src={data.vehiculo_foto_trasera.startsWith('data:') ? data.vehiculo_foto_trasera : `/storage/${data.vehiculo_foto_trasera}`} alt="Vehículo Trasero" className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => setData('vehiculo_foto_trasera', '')} className="absolute top-2 right-2 bg-rose-600 text-white rounded-full p-1.5 shadow-lg hover:bg-rose-700"><X className="w-4 h-4" /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Car className="w-8 h-8 text-slate-400" />
                                                        <span className="text-xs font-medium text-slate-500">Foto de la parte trasera del vehículo</span>
                                                        <div className="flex gap-3">
                                                            <button type="button" onClick={() => setActiveCameraField('vehiculo_foto_trasera')} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"><Camera className="w-4 h-4" /> Cámara</button>
                                                            <label className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-300 flex items-center gap-2">
                                                                <Upload className="w-4 h-4" /> Archivo
                                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'vehiculo_foto_trasera')} />
                                                            </label>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 4. SECCIÓN: ACOMPAÑANTES */}
                            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                    <span className="flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600" /> 4. Acompañantes en el Ingreso</span>
                                    <span className="text-xs text-slate-500 font-normal">({data.acompanantes.length} añadidos)</span>
                                </label>

                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="sm:col-span-2">
                                            <input
                                                type="text"
                                                placeholder="Nombre Completo del Acompañante"
                                                value={nuevoAcompanante.nombre}
                                                onChange={(e) => setNuevoAcompanante(prev => ({ ...prev, nombre: e.target.value }))}
                                                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Documento ID (opcional)"
                                                value={nuevoAcompanante.documento}
                                                onChange={(e) => setNuevoAcompanante(prev => ({ ...prev, documento: e.target.value }))}
                                                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddAcompanante}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {data.acompanantes.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                            {data.acompanantes.map((ac, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                                                    <div className="flex flex-col">
                                                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{ac.nombre}</span>
                                                        {ac.documento && <span className="text-[11px] text-slate-500 font-mono">Doc: {ac.documento}</span>}
                                                    </div>
                                                    <button type="button" onClick={() => handleRemoveAcompanante(idx)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Botón de Enviar */}
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-[#104a29] hover:bg-[#0c371e] text-white text-sm font-extrabold py-4 px-6 rounded-2xl shadow-xl transition-transform active:scale-[0.99] flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    {processing ? 'Guardando Registro...' : 'Confirmar Datos y Activar Mi Pase QR'}
                                </button>
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
                        <p>© {new Date().getFullYear()} Driscoll's. Todos los derechos reservados.</p>
                        <p className="text-[11px] text-slate-400">Presente este pase digital al llegar a la garita de seguridad.</p>
                    </div>
                </footer>
            </div>

            {/* Camera Widget Overlay */}
            {activeCameraField && (
                <CameraWidget
                    title={`Capturar Fotografía`}
                    onCapture={(base64) => {
                        setData(activeCameraField as any, base64);
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
