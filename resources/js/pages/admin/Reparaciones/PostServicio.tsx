import { Head, router, Link } from '@inertiajs/react';
import {
    CheckCircle2,
    ShieldCheck,
    Camera,
    Sparkles,
    FileText,
    ArrowLeft,
    Save,
    Check,
    AlertCircle,
    X,
    Upload,
    RefreshCw,
    Trash2,
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { cn } from '@/lib/utils';

interface Props {
    orden: any;
    currencySymbol: string;
}

const FUNCIONES_VALIDACION_FINAL = [
    'Equipo enciende',
    'Carga correctamente',
    'Pantalla',
    'Touch',
    'Cámara frontal',
    'Cámara trasera',
    'Flash',
    'Micrófono',
    'Bocina',
    'Auricular',
    'Vibrador',
    'WiFi',
    'Bluetooth',
    'Red móvil',
    'Face ID',
    'Huella',
    'GPS',
    'NFC',
    'Sensor proximidad',
    'Sensor luz',
    'Puerto USB',
    'Botón Encendido',
    'Volumen +',
    'Volumen -',
];

const LIMPIEZA_FINAL_LIST = [
    'Pantalla limpia',
    'Carcasa limpia',
    'Tornillos completos',
    'Sin piezas sobrantes',
    'Sellos colocados',
];

const CONTROL_CALIDAD_LIST = [
    { key: 'reparacion_completada', label: 'Reparación completada' },
    { key: 'equipo_probado', label: 'Equipo probado' },
    { key: 'equipo_limpio', label: 'Equipo limpio' },
    { key: 'garantia_registrada', label: 'Garantía registrada' },
    { key: 'cliente_notificado', label: 'Cliente notificado' },
    { key: 'equipo_listo_entrega', label: 'Equipo listo para entrega' },
];

const FOTOS_POST_REPARACION_ANGULOS = [
    {
        key: 'post_reparado',
        label: '1. Foto de la Reparación Realizada',
        desc: 'Evidencia principal del teléfono reparado y funcionando.',
        icon: '✨',
    },
    {
        key: 'post_frontal',
        label: '2. Ángulo Frontal (Pantalla)',
        desc: 'Vista frontal del dispositivo.',
        icon: '📱',
    },
    {
        key: 'post_trasera',
        label: '3. Ángulo Trasero (Tapa)',
        desc: 'Vista trasera y lente de cámaras.',
        icon: '📲',
    },
    {
        key: 'post_lateral_izq',
        label: '4. Ángulo Lateral Izquierdo',
        desc: 'Borde izquierdo y botones de volumen.',
        icon: '↔️',
    },
    {
        key: 'post_lateral_der',
        label: '5. Ángulo Lateral Derecho',
        desc: 'Borde derecho y botón de encendido.',
        icon: '↕️',
    },
];

export default function PostServicio({ orden, currencySymbol }: Props) {
    const { __ } = useTranslate();
    const [activeTab, setActiveTab] = useState<'validacion' | 'limpieza_qc' | 'fotos_obs'>('validacion');

    const postServicioData = orden.post_servicio_json || null;

    const [validacionFinalState, setValidacionFinalState] = useState<Record<string, { estado: 'correcto' | 'incorrecto'; obs: string }>>(() => {
        if (postServicioData?.validacion) return postServicioData.validacion;
        const init: Record<string, { estado: 'correcto' | 'incorrecto'; obs: string }> = {};
        FUNCIONES_VALIDACION_FINAL.forEach((fn) => {
            init[fn] = { estado: 'correcto', obs: '' };
        });
        return init;
    });

    const [limpiezaFinalState, setLimpiezaFinalState] = useState<Record<string, boolean>>(() => {
        if (postServicioData?.limpieza) return postServicioData.limpieza;
        const init: Record<string, boolean> = {};
        LIMPIEZA_FINAL_LIST.forEach((item) => {
            init[item] = true;
        });
        return init;
    });

    const [controlCalidadState, setControlCalidadState] = useState<Record<string, boolean>>(() => {
        if (postServicioData?.qc) return postServicioData.qc;
        return {
            reparacion_completada: true,
            equipo_probado: true,
            equipo_limpio: true,
            garantia_registrada: true,
            cliente_notificado: false,
            equipo_listo_entrega: true,
        };
    });

    const [observacionesFinalesInput, setObservacionesFinalesInput] = useState<string>(postServicioData?.observaciones || '');
    const [fotosPostState, setFotosPostState] = useState<Record<string, string>>(() => {
        if (postServicioData?.fotos_post) {
            if (typeof postServicioData.fotos_post === 'object' && !Array.isArray(postServicioData.fotos_post)) {
                return postServicioData.fotos_post;
            } else if (Array.isArray(postServicioData.fotos_post)) {
                const map: Record<string, string> = {};
                postServicioData.fotos_post.forEach((item: any) => {
                    if (item.key && item.url) map[item.key] = item.url;
                    else if (item.angulo && item.url) map[item.angulo] = item.url;
                });
                return map;
            }
        }
        return {};
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // CÁMARA WEBCAM EN VIVO
    const [activePostCameraSlot, setActivePostCameraSlot] = useState<string | null>(null);
    const [postCameraSlotLabel, setPostCameraSlotLabel] = useState<string>('');
    const [postCameraStream, setPostCameraStream] = useState<MediaStream | null>(null);
    const [postCapturedImage, setPostCapturedImage] = useState<string | null>(null);
    const [postCameraError, setPostCameraError] = useState<string | null>(null);
    const [isPostCameraLoading, setIsPostCameraLoading] = useState(false);
    const [postCameraFacingMode, setPostCameraFacingMode] = useState<'environment' | 'user'>('environment');

    const postVideoRef = useRef<HTMLVideoElement | null>(null);
    const postCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const stopPostCameraStream = () => {
        if (postCameraStream) {
            postCameraStream.getTracks().forEach((track) => track.stop());
            setPostCameraStream(null);
        }
        setActivePostCameraSlot(null);
        setPostCapturedImage(null);
        setPostCameraError(null);
    };

    const startPostCameraStream = async (slotKey: string, slotLabel: string, mode: 'environment' | 'user' = 'environment') => {
        setActivePostCameraSlot(slotKey);
        setPostCameraSlotLabel(slotLabel);
        setPostCapturedImage(null);
        setPostCameraError(null);
        setIsPostCameraLoading(true);

        if (postCameraStream) {
            postCameraStream.getTracks().forEach((track) => track.stop());
            setPostCameraStream(null);
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: mode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            });
            setPostCameraStream(stream);

            setTimeout(() => {
                const videoEl = postVideoRef.current || (document.getElementById('post-camera-video-page') as HTMLVideoElement | null);
                if (videoEl) {
                    videoEl.srcObject = stream;
                    videoEl.play().catch((e) => console.log('Video play error:', e));
                }
            }, 100);
        } catch (err: any) {
            console.error('Camera access error:', err);
            setPostCameraError(__('No se pudo acceder a la cámara. Por favor verifique los permisos del navegador o use la opción de subir archivo.'));
        } finally {
            setIsPostCameraLoading(false);
        }
    };

    useEffect(() => {
        if (postCameraStream && !postCapturedImage) {
            const videoEl = postVideoRef.current || (document.getElementById('post-camera-video-page') as HTMLVideoElement | null);
            if (videoEl) {
                videoEl.srcObject = postCameraStream;
                videoEl.play().catch((e) => console.log('Video play error:', e));
            }
        }
    }, [postCameraStream, activePostCameraSlot, postCapturedImage]);

    const handleCapturePostSnapshot = () => {
        try {
            const video = postVideoRef.current || (document.getElementById('post-camera-video-page') as HTMLVideoElement | null);
            if (!video) {
                notifyError(__('No se encontró la fuente de video de la cámara.'));
                return;
            }

            const width = video.videoWidth || video.clientWidth || 1280;
            const height = video.videoHeight || video.clientHeight || 720;

            if (width === 0 || height === 0) {
                notifyError(__('Esperando señal de la cámara... Reintente en un momento.'));
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
                if (dataUrl && dataUrl.length > 500) {
                    setPostCapturedImage(dataUrl);
                    notifySuccess(__('Foto capturada correctamente. Haga clic en "Usar Esta Foto".'));
                } else {
                    notifyError(__('La captura resultó vacía. Por favor reintente.'));
                }
            }
        } catch (err: any) {
            console.error('Error al capturar foto:', err);
            notifyError(__('Error al procesar la captura de la cámara: ') + (err?.message || ''));
        }
    };

    const handleAcceptPostCapturedPhoto = () => {
        if (postCapturedImage && activePostCameraSlot) {
            setFotosPostState((prev) => ({
                ...prev,
                [activePostCameraSlot]: postCapturedImage,
            }));
            notifySuccess(__('Fotografía guardada correctamente.'));
            stopPostCameraStream();
        }
    };

    const handleRetakePostSnapshot = () => {
        setPostCapturedImage(null);
        setTimeout(() => {
            const videoEl = postVideoRef.current || (document.getElementById('post-camera-video-page') as HTMLVideoElement | null);
            if (videoEl && postCameraStream) {
                videoEl.srcObject = postCameraStream;
                videoEl.play().catch((e) => console.log('Video play error:', e));
            }
        }, 100);
    };

    const togglePostFacingMode = () => {
        const nextMode = postCameraFacingMode === 'environment' ? 'user' : 'environment';
        setPostCameraFacingMode(nextMode);
        if (activePostCameraSlot) {
            startPostCameraStream(activePostCameraSlot, postCameraSlotLabel, nextMode);
        }
    };

    const handleSingleFotoPostUpload = (slotKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                setFotosPostState((prev) => ({
                    ...prev,
                    [slotKey]: reader.result as string,
                }));
                notifySuccess(__('Fotografía cargada correctamente.'));
            }
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveFotoPost = (slotKey: string) => {
        setFotosPostState((prev) => {
            const next = { ...prev };
            delete next[slotKey];
            return next;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const postPayload = {
            validacion: validacionFinalState,
            limpieza: limpiezaFinalState,
            qc: controlCalidadState,
            observaciones: observacionesFinalesInput,
            fotos_post: fotosPostState,
            fecha_registro: new Date().toISOString(),
        };

        router.post(`/admin/reparaciones/${orden.id}/post-servicio`, {
            post_servicio_json: postPayload,
            estado_orden: orden.estado_orden === 'entregado' ? 'entregado' : 'reparado',
        }, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    const breadcrumbs = [
        { title: __('Órdenes de Reparación'), href: '/admin/reparaciones' },
        { title: orden.numero_orden, href: `/admin/reparaciones/${orden.id}` },
        { title: __('Post-Atención & QC'), href: `/admin/reparaciones/${orden.id}/post-servicio` },
    ];

    return (
        <>
            <Head title={`${__('Post-Atención')} - ${orden.numero_orden}`} />

            <div className="w-full space-y-6 pb-16">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* BANNER PRINCIPAL DE ENCABEZADO */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 p-6 text-white shadow-xl border border-emerald-900/50">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    {__('Ficha Oficial de Post-Atención & Control de Calidad')}
                                </span>
                                <Badge className="bg-emerald-600 text-white font-extrabold text-xs">
                                    {orden.numero_orden}
                                </Badge>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                                {orden.marca_nombre} {orden.modelo_nombre}
                            </h1>
                            <p className="text-xs text-emerald-200/80">
                                {__('Cliente:')} <strong className="text-white">{orden.cliente_nombre}</strong> • {__('Técnico:')} <strong className="text-white">{orden.tecnico_nombre || __('No asignado')}</strong>
                                {orden.imei_serie && <span> • IMEI: <strong className="font-mono text-emerald-300">{orden.imei_serie}</strong></span>}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link href={`/admin/reparaciones/${orden.id}`}>
                                <Button variant="outline" size="sm" className="bg-slate-900/60 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    {__('Volver a la Orden')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* BARRA NAVEGADORA DE ETAPAS / TAB SWITCHER */}
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                        <button
                            type="button"
                            onClick={() => setActiveTab('validacion')}
                            className={cn(
                                "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer",
                                activeTab === 'validacion'
                                    ? "bg-emerald-600 text-white shadow-md scale-[1.01]"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                            )}
                        >
                            <span className="text-base">⚡</span>
                            <span>{__('1. Validación Final (24 Funciones)')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('limpieza_qc')}
                            className={cn(
                                "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer",
                                activeTab === 'limpieza_qc'
                                    ? "bg-emerald-600 text-white shadow-md scale-[1.01]"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                            )}
                        >
                            <span className="text-base">✨</span>
                            <span>{__('2. Limpieza Final & QC')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('fotos_obs')}
                            className={cn(
                                "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer",
                                activeTab === 'fotos_obs'
                                    ? "bg-emerald-600 text-white shadow-md scale-[1.01]"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                            )}
                        >
                            <span className="text-base">📸</span>
                            <span>{__('3. Fotos (5 Ángulos) & Notas')}</span>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* PESTAÑA 1: VALIDACIÓN FINAL DE 24 FUNCIONES */}
                    {activeTab === 'validacion' && (
                        <Card className="border-slate-200 dark:border-slate-800 shadow-md">
                            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-4 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">1</span>
                                        {__('Validación Final de Funciones Electrónicas (24 Puntos)')}
                                    </CardTitle>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {__('Verifique las 24 funciones al finalizar la reparación e indique si están correctas o presentan falla.')}
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setValidacionFinalState((prev) => {
                                            const copy = { ...prev };
                                            FUNCIONES_VALIDACION_FINAL.forEach((fn) => {
                                                copy[fn] = { ...copy[fn], estado: 'correcto' };
                                            });
                                            return copy;
                                        });
                                        notifySuccess(__('Todas las funciones marcadas como correctas.'));
                                    }}
                                    className="text-xs font-bold bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 gap-1.5 rounded-xl shadow-xs"
                                >
                                    ✨ {__('Marcar Todos Correctos')}
                                </Button>
                            </CardHeader>

                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {FUNCIONES_VALIDACION_FINAL.map((fn) => {
                                        const current = validacionFinalState[fn] || { estado: 'correcto', obs: '' };
                                        const isOk = current.estado === 'correcto';
                                        return (
                                            <div
                                                key={fn}
                                                className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                                                    !isOk
                                                        ? 'border-rose-300 bg-rose-50/60 dark:bg-rose-950/20 shadow-xs'
                                                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{fn}</span>

                                                    <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-200/70 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setValidacionFinalState((prev) => ({
                                                                    ...prev,
                                                                    [fn]: { ...prev[fn], estado: 'correcto' },
                                                                }))
                                                            }
                                                            className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                                                                isOk
                                                                    ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                            }`}
                                                        >
                                                            {__('Correcto')}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setValidacionFinalState((prev) => ({
                                                                    ...prev,
                                                                    [fn]: { ...prev[fn], estado: 'incorrecto' },
                                                                }))
                                                            }
                                                            className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                                                                !isOk
                                                                    ? 'bg-rose-600 text-white shadow-xs scale-105'
                                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                            }`}
                                                        >
                                                            {__('Incorrecto')}
                                                        </button>
                                                    </div>
                                                </div>

                                                {!isOk && (
                                                    <Input
                                                        value={current.obs}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setValidacionFinalState((prev) => ({
                                                                ...prev,
                                                                [fn]: { ...prev[fn], obs: val },
                                                            }));
                                                        }}
                                                        placeholder={__('Detalle la falla o anomalía...')}
                                                        className="text-xs h-8 border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-900 dark:text-rose-200"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* PESTAÑA 2: LIMPIEZA FINAL Y CONTROL DE CALIDAD */}
                    {activeTab === 'limpieza_qc' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* LIMPIEZA FINAL */}
                            <Card className="border-slate-200 dark:border-slate-800 shadow-md">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3.5">
                                    <CardTitle className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-emerald-500" />
                                        {__('Limpieza & Ensamblado Final (5 Puntos)')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 space-y-3">
                                    {LIMPIEZA_FINAL_LIST.map((item) => {
                                        const isChecked = limpiezaFinalState[item] ?? true;
                                        return (
                                            <div
                                                key={item}
                                                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                                                    isChecked
                                                        ? 'border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20'
                                                        : 'border-slate-200 dark:border-slate-800 bg-slate-50'
                                                }`}
                                            >
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item}</span>
                                                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-200/70 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700">
                                                    <button
                                                        type="button"
                                                        onClick={() => setLimpiezaFinalState((prev) => ({ ...prev, [item]: true }))}
                                                        className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                                                            isChecked
                                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                                : 'text-slate-600 dark:text-slate-400'
                                                        }`}
                                                    >
                                                        {__('Sí')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setLimpiezaFinalState((prev) => ({ ...prev, [item]: false }))}
                                                        className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                                                            !isChecked
                                                                ? 'bg-rose-600 text-white shadow-xs'
                                                                : 'text-slate-600 dark:text-slate-400'
                                                        }`}
                                                    >
                                                        {__('No')}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>

                            {/* CONTROL DE CALIDAD (QC) */}
                            <Card className="border-slate-200 dark:border-slate-800 shadow-md">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3.5">
                                    <CardTitle className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        {__('Control de Calidad Final (QC)')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 space-y-3">
                                    {CONTROL_CALIDAD_LIST.map((qc) => {
                                        const isChecked = controlCalidadState[qc.key] ?? false;
                                        return (
                                            <label
                                                key={qc.key}
                                                onClick={() => setControlCalidadState((prev) => ({ ...prev, [qc.key]: !isChecked }))}
                                                className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                                                    isChecked
                                                        ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
                                                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900'
                                                }`}
                                            >
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{qc.label}</span>
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${isChecked ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-transparent'}`}>
                                                    ✓
                                                </div>
                                            </label>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* PESTAÑA 3: FOTOS POST-REPARACIÓN & OBSERVACIONES FINALES */}
                    {activeTab === 'fotos_obs' && (
                        <div className="space-y-6">
                            <Card className="border-slate-200 dark:border-slate-800 shadow-md">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-4">
                                    <CardTitle className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        <Camera className="w-5 h-5 text-emerald-500" />
                                        {__('Evidencias Fotográficas Post-Reparación (5 Ángulos)')}
                                    </CardTitle>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {__('Tome la foto del teléfono reparado y los 4 ángulos de inspección final igual que en la recepción.')}
                                    </p>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    {/* Tarjeta principal: Foto del Teléfono Reparado (Resultado) */}
                                    {(() => {
                                        const mainSlot = FOTOS_POST_REPARACION_ANGULOS[0];
                                        const mainImgUrl = fotosPostState[mainSlot.key];
                                        return (
                                            <div className="p-5 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl">{mainSlot.icon}</span>
                                                        <div>
                                                            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">{mainSlot.label}</h4>
                                                            <p className="text-xs text-slate-500">{mainSlot.desc}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {mainImgUrl ? (
                                                    <div className="relative rounded-2xl overflow-hidden border border-emerald-200 dark:border-emerald-800 bg-black max-h-72 flex items-center justify-center group shadow-lg">
                                                        <img src={mainImgUrl} alt={mainSlot.label} className="max-h-72 w-auto object-contain" />
                                                        <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/70 p-1.5 rounded-xl backdrop-blur-md">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={() => startPostCameraStream(mainSlot.key, mainSlot.label)}
                                                                className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                                                            >
                                                                <Camera className="w-3.5 h-3.5" />
                                                                {__('Recapturar con Cámara')}
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleRemoveFotoPost(mainSlot.key)}
                                                                className="h-8 w-8 p-0"
                                                                title={__('Eliminar foto')}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-44 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-4 gap-3">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => startPostCameraStream(mainSlot.key, mainSlot.label)}
                                                            className="h-10 px-6 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md rounded-xl"
                                                        >
                                                            <Camera className="w-4 h-4" />
                                                            {__('Tomar con Cámara')}
                                                        </Button>

                                                        <label className="text-center cursor-pointer">
                                                            <span className="text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center gap-1.5">
                                                                <Upload className="w-3.5 h-3.5" />
                                                                {__('Subir Archivo de Imagen')}
                                                            </span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => handleSingleFotoPostUpload(mainSlot.key, e)}
                                                            />
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {/* Grilla con los 4 Ángulos Restantes (Frontal, Trasero, Lat. Izq, Lat. Der) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {FOTOS_POST_REPARACION_ANGULOS.slice(1).map((slot) => {
                                            const imgUrl = fotosPostState[slot.key];
                                            return (
                                                <div key={slot.key} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-3 shadow-xs">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <span className="text-base">{slot.icon}</span>
                                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{slot.label}</span>
                                                        </div>
                                                    </div>

                                                    {imgUrl ? (
                                                        <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black aspect-video group shadow-xs">
                                                            <img src={imgUrl} alt={slot.label} className="w-full h-full object-cover" />
                                                            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 p-1 rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={() => startPostCameraStream(slot.key, slot.label)}
                                                                    className="h-7 px-2 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                                                >
                                                                    <Camera className="w-3 h-3" />
                                                                    {__('Recapturar')}
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => handleRemoveFotoPost(slot.key)}
                                                                    className="h-7 w-7 p-0"
                                                                    title={__('Eliminar foto')}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-3 gap-2">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={() => startPostCameraStream(slot.key, slot.label)}
                                                                className="w-full h-9 text-[11px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm rounded-lg"
                                                            >
                                                                <Camera className="w-3.5 h-3.5" />
                                                                {__('Tomar con Cámara')}
                                                            </Button>

                                                            <label className="w-full text-center cursor-pointer">
                                                                <span className="text-[10px] font-semibold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center gap-1">
                                                                    <Upload className="w-3 h-3" />
                                                                    {__('Subir Archivo')}
                                                                </span>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => handleSingleFotoPostUpload(slot.key, e)}
                                                                />
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 dark:border-slate-800 shadow-md">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3.5">
                                    <CardTitle className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-emerald-500" />
                                        {__('Observaciones Finales de Entrega')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5">
                                    <Textarea
                                        value={observacionesFinalesInput}
                                        onChange={(e) => setObservacionesFinalesInput(e.target.value)}
                                        rows={4}
                                        placeholder={__('Anotar detalles adicionales sobre el equipo reparado, recomendaciones para el cliente o detalles de garantía...')}
                                        className="text-xs border-slate-200 dark:border-slate-800 rounded-xl p-3"
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* BARRA DE ACCIÓN PRINCIPAL AL PIE DE PÁGINA */}
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg sticky bottom-4 z-30">
                        <Link href={`/admin/reparaciones/${orden.id}`}>
                            <Button type="button" variant="outline" className="text-xs font-bold px-5 h-10">
                                {__('Cancelar y Volver')}
                            </Button>
                        </Link>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-11 gap-2 shadow-lg shadow-emerald-200 dark:shadow-none rounded-xl"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {isSubmitting ? __('Guardando...') : __('Guardar Proceso de Post-Atención')}
                        </Button>
                    </div>
                </form>

                {/* OVERLAY DE CÁMARA WEBCAM EN VIVO DEDICADO PÁGINA */}
                {activePostCameraSlot && (
                    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="w-full max-w-xl bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
                            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-bold text-white">
                                    <Camera className="w-5 h-5 text-emerald-400" />
                                    <span>{__('Capturar Evidencia Post-Reparación:')}</span>
                                    <span className="text-emerald-300 font-mono">{postCameraSlotLabel}</span>
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={stopPostCameraStream} className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="p-4 space-y-4">
                                {postCameraError ? (
                                    <div className="p-6 text-center space-y-3 bg-rose-950/40 border border-rose-800 rounded-xl">
                                        <AlertCircle className="w-10 h-10 mx-auto text-rose-500" />
                                        <p className="text-xs text-rose-200 font-medium">{postCameraError}</p>
                                        <Button type="button" variant="outline" size="sm" onClick={stopPostCameraStream} className="text-xs text-white border-slate-700">
                                            {__('Cerrar y usar subida de archivo')}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-2xl">
                                        <canvas ref={postCanvasRef} className="hidden" />

                                        {isPostCameraLoading && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 gap-2 text-xs text-slate-300">
                                                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                                                <span>{__('Iniciando cámara...')}</span>
                                            </div>
                                        )}

                                        {postCapturedImage ? (
                                            <div className="relative w-full h-full">
                                                <img src={postCapturedImage} alt="Captura" className="w-full h-full object-contain" />
                                                <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-md">
                                                    ✓ {__('Captura lista')}
                                                </div>
                                            </div>
                                        ) : (
                                            <video
                                                id="post-camera-video-page"
                                                ref={postVideoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                onLoadedMetadata={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                                                className="w-full h-full object-cover"
                                            />
                                        )}

                                        {!postCapturedImage && !isPostCameraLoading && (
                                            <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/30 m-4 rounded-lg flex items-center justify-center">
                                                <div className="w-10 h-10 border-t-2 border-l-2 border-emerald-400 absolute top-0 left-0" />
                                                <div className="w-10 h-10 border-t-2 border-r-2 border-emerald-400 absolute top-0 right-0" />
                                                <div className="w-10 h-10 border-b-2 border-l-2 border-emerald-400 absolute bottom-0 left-0" />
                                                <div className="w-10 h-10 border-b-2 border-r-2 border-emerald-400 absolute bottom-0 right-0" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!postCameraError && (
                                    <div className="flex items-center justify-between pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={togglePostFacingMode}
                                            className="text-xs bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            {__('Voltear Cámara')}
                                        </Button>

                                        {postCapturedImage ? (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleRetakePostSnapshot}
                                                    className="text-xs bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
                                                >
                                                    {__('Repetir Foto')}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={handleAcceptPostCapturedPhoto}
                                                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 px-4"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    {__('Usar Esta Foto')}
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={handleCapturePostSnapshot}
                                                disabled={isPostCameraLoading}
                                                className="h-10 px-6 font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg rounded-full gap-2 text-xs"
                                            >
                                                <Camera className="w-4 h-4" />
                                                {__('CAPTURAR FOTO')}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
