import { Head, useForm, router, Link } from '@inertiajs/react';
import {
    Wrench,
    Printer,
    Send,
    User,
    Smartphone,
    CheckCircle2,
    Clock,
    DollarSign,
    Lock,
    FileText,
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Check,
    AlertCircle,
    Package,
    ShieldCheck,
    History,
    Camera,
    Sparkles,
    Copy,
    Phone,
    Calendar,
    Layers,
    Activity,
    Eye,
    X,
    Upload,
    RefreshCw,
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { cn } from '@/lib/utils';

interface Item {
    id: number;
    servicio_id?: number;
    producto_id?: number;
    descripcion: string;
    cantidad: number;
    precio_costo: number;
    precio_venta: number;
    subtotal: number;
    producto?: { nombre: string; codigo: string };
    servicio?: { id: number; nombre: string; categoria?: { nombre: string } };
}

interface Foto {
    id: number;
    orden_id: number;
    angulo: string;
    url: string;
    descripcion?: string;
}

interface Historial {
    id: number;
    estado_anterior?: string;
    estado_nuevo: string;
    comentario?: string;
    created_at: string;
    user?: { name: string };
}

interface Orden {
    id: number;
    numero_orden: string;
    cliente_nombre: string;
    cliente_telefono?: string;
    tipo_dispositivo: string;
    marca_nombre: string;
    modelo_nombre: string;
    color?: string;
    imei_serie?: string;
    descripcion_falla: string;
    observaciones_fisicas?: string;
    contrasena_patron?: string;
    inspeccion_json?: any;
    estado_orden: string;
    costo_mano_obra: number;
    costo_repuestos: number;
    costo_estimado: number;
    anticipo: number;
    saldo_restante: number;
    garantia_dias: number;
    fecha_recepcion: string;
    fecha_prometida?: string;
    fecha_entrega?: string;
    tecnico?: { id: number; name: string };
    cliente?: { id: number; nombre: string; telefono?: string; email?: string };
    marca?: { id: number; nombre: string };
    modelo?: { id: number; nombre_comercial: string };
    items: Item[];
    historial: Historial[];
    fotos?: Foto[];
    evidencias_fotos?: Record<string, string>;
}

interface ProductoRepuesto {
    id: number;
    sku?: string;
    codigo_barras?: string;
    nombre_variante?: string;
    nombre?: string;
    precio_venta: number;
    stock: number;
    marca_id?: number;
    modelo_id?: number;
    condicion?: string;
    marca?: { id: number; nombre: string };
    modelo?: { id: number; nombre_comercial: string };
}

interface Props {
    orden: Orden;
    productosRepuestos: ProductoRepuesto[];
    tecnicos: { id: number; name: string }[];
    currencySymbol: string;
}

const DOT_COORDS_VIEW: Record<number, { x: number; y: number }> = {
    1: { x: 50, y: 50 },
    2: { x: 150, y: 50 },
    3: { x: 250, y: 50 },
    4: { x: 50, y: 150 },
    5: { x: 150, y: 150 },
    6: { x: 250, y: 150 },
    7: { x: 50, y: 250 },
    8: { x: 150, y: 250 },
    9: { x: 250, y: 250 },
};

function PatternLockViewer({ pattern = [] }: { pattern: number[] }) {
    const { __ } = useTranslate();
    if (!pattern || pattern.length === 0) {
        return (
            <div className="text-xs text-slate-400 italic">
                {__('No hay patrón dibujado registrado.')}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="text-xs font-bold text-indigo-400 font-mono bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-800">
                {__('Secuencia:')} {pattern.join(' ➔ ')}
            </div>

            <div className="relative bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-2xl">
                <svg className="w-[200px] h-[200px]" viewBox="0 0 300 300">
                    {pattern.map((dot, idx) => {
                        if (idx === 0) return null;
                        const prevDot = pattern[idx - 1];
                        const from = DOT_COORDS_VIEW[prevDot];
                        const to = DOT_COORDS_VIEW[dot];
                        return (
                            <g key={`line-${idx}`}>
                                <line
                                    x1={from.x}
                                    y1={from.y}
                                    x2={to.x}
                                    y2={to.y}
                                    stroke="#6366f1"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    opacity="0.8"
                                />
                                <line
                                    x1={from.x}
                                    y1={from.y}
                                    x2={to.x}
                                    y2={to.y}
                                    stroke="#818cf8"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                />
                            </g>
                        );
                    })}

                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((dotNum) => {
                        const coord = DOT_COORDS_VIEW[dotNum];
                        const isSelected = pattern.includes(dotNum);
                        const orderIndex = pattern.indexOf(dotNum);

                        return (
                            <g key={dotNum}>
                                <circle
                                    cx={coord.x}
                                    cy={coord.y}
                                    r={isSelected ? 26 : 18}
                                    fill={isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)'}
                                    stroke={isSelected ? 'rgba(99, 102, 241, 0.5)' : 'transparent'}
                                    strokeWidth="2"
                                />
                                <circle
                                    cx={coord.x}
                                    cy={coord.y}
                                    r={14}
                                    fill={isSelected ? '#6366f1' : '#475569'}
                                    stroke={isSelected ? '#c7d2fe' : '#334155'}
                                    strokeWidth="3"
                                />
                                {isSelected ? (
                                    <text
                                        x={coord.x}
                                        y={coord.y + 4}
                                        textAnchor="middle"
                                        fill="#ffffff"
                                        fontSize="12"
                                        fontWeight="900"
                                        fontFamily="monospace"
                                    >
                                        {orderIndex + 1}
                                    </text>
                                ) : (
                                    <circle cx={coord.x} cy={coord.y} r={4} fill="#cbd5e1" />
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}

const ELEMENTOS_INSPECCION_LIST = [
    'Pantalla',
    'Cristal trasero',
    'Marco',
    'Botones',
    'Bandeja SIM',
    'Cámara trasera',
    'Cámara frontal',
    'Tornillos',
    'Tapa trasera',
    'Puerto de carga',
    'Humedad visible',
    'Equipo doblado',
];

const REVISIONES_ESTADO_LIST = [
    { key: 'enciende', label: 'Enciende' },
    { key: 'carga_bateria', label: 'Carga batería' },
    { key: 'entra_sistema', label: 'Entra al sistema' },
    { key: 'tiene_bloqueo', label: 'Tiene bloqueo' },
    { key: 'cliente_proporciona_contrasena', label: 'Cliente proporciona clave/patrón' },
];

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

function PatternLockCanvas({
    pattern = [],
    onChange,
}: {
    pattern: number[];
    onChange: (p: number[]) => void;
}) {
    const { __ } = useTranslate();
    const [isMouseDown, setIsMouseDown] = useState(false);

    const addDot = (dotNum: number) => {
        if (!pattern.includes(dotNum)) {
            onChange([...pattern, dotNum]);
        }
    };

    return (
        <div className="flex flex-col items-center gap-3 select-none">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span>{__('Patrón dibujado:')}</span>
                {pattern.length > 0 ? (
                    <span className="font-mono bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-black border border-indigo-200 dark:border-indigo-800">
                        {pattern.join(' ➔ ')}
                    </span>
                ) : (
                    <span className="text-slate-400 font-normal italic">{__('Toque o arrastre los puntos')}</span>
                )}
            </div>

            <div
                className="relative bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-2xl touch-none cursor-crosshair"
                onMouseDown={() => setIsMouseDown(true)}
                onMouseUp={() => setIsMouseDown(false)}
                onMouseLeave={() => setIsMouseDown(false)}
            >
                <svg className="w-[240px] h-[240px]" viewBox="0 0 300 300">
                    {pattern.map((dot, idx) => {
                        if (idx === 0) return null;
                        const prevDot = pattern[idx - 1];
                        const from = DOT_COORDS_VIEW[prevDot];
                        const to = DOT_COORDS_VIEW[dot];
                        return (
                            <g key={`line-${idx}`}>
                                <line
                                    x1={from.x}
                                    y1={from.y}
                                    x2={to.x}
                                    y2={to.y}
                                    stroke="#6366f1"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    opacity="0.8"
                                />
                                <line
                                    x1={from.x}
                                    y1={from.y}
                                    x2={to.x}
                                    y2={to.y}
                                    stroke="#818cf8"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                />
                            </g>
                        );
                    })}

                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((dotNum) => {
                        const coord = DOT_COORDS_VIEW[dotNum];
                        const isSelected = pattern.includes(dotNum);
                        const orderIndex = pattern.indexOf(dotNum);

                        return (
                            <g
                                key={dotNum}
                                onMouseDown={() => addDot(dotNum)}
                                onMouseEnter={() => {
                                    if (isMouseDown) addDot(dotNum);
                                }}
                                onTouchStart={() => addDot(dotNum)}
                                className="cursor-pointer"
                            >
                                <circle
                                    cx={coord.x}
                                    cy={coord.y}
                                    r={isSelected ? 28 : 20}
                                    fill={isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)'}
                                    stroke={isSelected ? 'rgba(99, 102, 241, 0.5)' : 'transparent'}
                                    strokeWidth="2"
                                    className="transition-all duration-200"
                                />
                                <circle
                                    cx={coord.x}
                                    cy={coord.y}
                                    r={14}
                                    fill={isSelected ? '#6366f1' : '#475569'}
                                    stroke={isSelected ? '#c7d2fe' : '#334155'}
                                    strokeWidth="3"
                                    className="transition-all duration-200"
                                />
                                {isSelected ? (
                                    <text
                                        x={coord.x}
                                        y={coord.y + 4}
                                        textAnchor="middle"
                                        fill="#ffffff"
                                        fontSize="12"
                                        fontWeight="900"
                                        fontFamily="monospace"
                                    >
                                        {orderIndex + 1}
                                    </text>
                                ) : (
                                    <circle cx={coord.x} cy={coord.y} r={4} fill="#cbd5e1" />
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange([])}
                disabled={pattern.length === 0}
                className="h-8 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 gap-1.5 rounded-xl"
            >
                <X className="w-3.5 h-3.5" />
                {__('Limpiar Patrón')}
            </Button>
        </div>
    );
}

export default function ShowReparacion({ orden, productosRepuestos = [], tecnicos, currencySymbol }: Props) {
    const { __ } = useTranslate();
    const [activeTab, setActiveTab] = useState<'general' | 'preservicio' | 'postservicio' | 'repuestos' | 'fotos' | 'historial'>('general');
    const [previewPhoto, setPreviewPhoto] = useState<{ url: string; label: string } | null>(null);

    const inspeccionData = React.useMemo(() => {
        if (!orden.inspeccion_json) return null;
        if (typeof orden.inspeccion_json === 'string') {
            try {
                return JSON.parse(orden.inspeccion_json);
            } catch {
                return null;
            }
        }
        return orden.inspeccion_json;
    }, [orden.inspeccion_json]);

    const tienePreservicio = Boolean(
        inspeccionData || orden.contrasena_patron || orden.observaciones_fisicas
    );

    const postServicioData = React.useMemo(() => {
        if (!orden.post_servicio_json) return null;
        if (typeof orden.post_servicio_json === 'string') {
            try {
                return JSON.parse(orden.post_servicio_json);
            } catch {
                return null;
            }
        }
        return orden.post_servicio_json;
    }, [orden.post_servicio_json]);

    const tienePostServicio = Boolean(postServicioData);

    const [isPostServicioModalOpen, setIsPostServicioModalOpen] = useState(false);
    const [postModalTab, setPostModalTab] = useState<'validacion' | 'limpieza_qc' | 'fotos_obs'>('validacion');

    const [validacionFinalState, setValidacionFinalState] = useState<Record<string, { estado: 'correcto' | 'incorrecto'; obs: string }>>(() => {
        const init: Record<string, { estado: 'correcto' | 'incorrecto'; obs: string }> = {};
        FUNCIONES_VALIDACION_FINAL.forEach((fn) => {
            init[fn] = { estado: 'correcto', obs: '' };
        });
        return init;
    });

    const [limpiezaFinalState, setLimpiezaFinalState] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        LIMPIEZA_FINAL_LIST.forEach((item) => {
            init[item] = true;
        });
        return init;
    });

    const [controlCalidadState, setControlCalidadState] = useState<Record<string, boolean>>({
        reparacion_completada: true,
        equipo_probado: true,
        equipo_limpio: true,
        garantia_registrada: true,
        cliente_notificado: false,
        equipo_listo_entrega: true,
    });

    const [observacionesFinalesInput, setObservacionesFinalesInput] = useState('');
    const [fotosPostState, setFotosPostState] = useState<Record<string, string>>({});
    const [isSubmittingPostServicio, setIsSubmittingPostServicio] = useState(false);

    // CÁMARA EN VIVO WEBCAM PARA FOTOS POST-REPARACIÓN
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
                const videoEl = postVideoRef.current || (document.getElementById('post-camera-video') as HTMLVideoElement | null);
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
            const videoEl = postVideoRef.current || (document.getElementById('post-camera-video') as HTMLVideoElement | null);
            if (videoEl) {
                videoEl.srcObject = postCameraStream;
                videoEl.play().catch((e) => console.log('Video play error:', e));
            }
        }
    }, [postCameraStream, activePostCameraSlot, postCapturedImage]);

    const handleCapturePostSnapshot = () => {
        try {
            const video = postVideoRef.current || (document.getElementById('post-camera-video') as HTMLVideoElement | null);
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
            notifySuccess(__('Fotografía capturada y guardada.'));
            stopPostCameraStream();
        }
    };

    const handleRetakePostSnapshot = () => {
        setPostCapturedImage(null);
        if (postVideoRef.current && postCameraStream) {
            postVideoRef.current.srcObject = postCameraStream;
            postVideoRef.current.play();
        }
    };

    const togglePostFacingMode = () => {
        const nextMode = postCameraFacingMode === 'environment' ? 'user' : 'environment';
        setPostCameraFacingMode(nextMode);
        if (activePostCameraSlot) {
            startPostCameraStream(activePostCameraSlot, postCameraSlotLabel, nextMode);
        }
    };

    const openPostServicioModal = () => {
        if (postServicioData?.validacion) {
            setValidacionFinalState(postServicioData.validacion);
        } else {
            const init: Record<string, { estado: 'correcto' | 'incorrecto'; obs: string }> = {};
            FUNCIONES_VALIDACION_FINAL.forEach((fn) => {
                init[fn] = { estado: 'correcto', obs: '' };
            });
            setValidacionFinalState(init);
        }

        if (postServicioData?.limpieza) {
            setLimpiezaFinalState(postServicioData.limpieza);
        } else {
            const init: Record<string, boolean> = {};
            LIMPIEZA_FINAL_LIST.forEach((item) => {
                init[item] = true;
            });
            setLimpiezaFinalState(init);
        }

        if (postServicioData?.qc) {
            setControlCalidadState(postServicioData.qc);
        } else {
            setControlCalidadState({
                reparacion_completada: true,
                equipo_probado: true,
                equipo_limpio: true,
                garantia_registrada: true,
                cliente_notificado: false,
                equipo_listo_entrega: true,
            });
        }

        setObservacionesFinalesInput(postServicioData?.observaciones || '');

        if (postServicioData?.fotos_post) {
            if (typeof postServicioData.fotos_post === 'object' && !Array.isArray(postServicioData.fotos_post)) {
                setFotosPostState(postServicioData.fotos_post);
            } else if (Array.isArray(postServicioData.fotos_post)) {
                const map: Record<string, string> = {};
                postServicioData.fotos_post.forEach((item: any) => {
                    if (item.key && item.url) map[item.key] = item.url;
                    else if (item.angulo && item.url) map[item.angulo] = item.url;
                });
                setFotosPostState(map);
            } else {
                setFotosPostState({});
            }
        } else {
            setFotosPostState({});
        }

        setPostModalTab('validacion');
        setIsPostServicioModalOpen(true);
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

    const handleSavePostServicio = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingPostServicio(true);

        const postPayload = {
            validacion: validacionFinalState,
            limpieza: limpiezaFinalState,
            qc: controlCalidadState,
            observaciones: observacionesFinalesInput,
            fotos_post: fotosPostState,
            fecha_registro: new Date().toISOString(),
        };

        router.post(`/admin/reparaciones/${orden.id}/estado`, {
            estado_orden: orden.estado_orden === 'reparado' || orden.estado_orden === 'entregado' ? orden.estado_orden : 'reparado',
            post_servicio_json: postPayload,
            comentario: __('Validación Final, Limpieza & Control de Calidad Post-Atención registrado.'),
        }, {
            onSuccess: () => {
                setIsPostServicioModalOpen(false);
                setIsSubmittingPostServicio(false);
                notifySuccess(__('Validación Final y Post-Atención guardados correctamente.'));
            },
            onError: () => {
                setIsSubmittingPostServicio(false);
            }
        });
    };

    const [isPreservicioModalOpen, setIsPreservicioModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<'fisica' | 'estado' | 'observaciones'>('fisica');

    const [inspeccionFisica, setInspeccionFisica] = useState<Record<string, { estado: 'bueno' | 'malo' | 'na'; obs: string }>>(() => {
        const init: Record<string, { estado: 'bueno' | 'malo' | 'na'; obs: string }> = {};
        ELEMENTOS_INSPECCION_LIST.forEach((item) => {
            init[item] = { estado: 'na', obs: '' };
        });
        return init;
    });

    const [estadoEquipo, setEstadoEquipo] = useState<Record<string, boolean>>({
        enciende: false,
        carga_bateria: false,
        entra_sistema: false,
        tiene_bloqueo: false,
        cliente_proporciona_contrasena: false,
    });

    const [observacionesFisicasInput, setObservacionesFisicasInput] = useState('');
    const [isSubmittingPreservicio, setIsSubmittingPreservicio] = useState(false);

    const openPreservicioModal = () => {
        setObservacionesFisicasInput(orden.observaciones_fisicas || '');

        if (inspeccionData?.fisica) {
            setInspeccionFisica(inspeccionData.fisica);
        } else {
            const init: Record<string, { estado: 'bueno' | 'malo' | 'na'; obs: string }> = {};
            ELEMENTOS_INSPECCION_LIST.forEach((item) => {
                init[item] = { estado: 'na', obs: '' };
            });
            setInspeccionFisica(init);
        }

        if (inspeccionData?.estado) {
            setEstadoEquipo(inspeccionData.estado);
        } else {
            setEstadoEquipo({
                enciende: false,
                carga_bateria: false,
                entra_sistema: false,
                tiene_bloqueo: false,
                cliente_proporciona_contrasena: false,
            });
        }

        setModalTab('fisica');
        setIsPreservicioModalOpen(true);
    };

    const handleSavePreservicio = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingPreservicio(true);

        const inspeccionPayload = {
            fisica: inspeccionFisica,
            estado: estadoEquipo,
        };

        router.post(`/admin/reparaciones/${orden.id}/estado`, {
            estado_orden: orden.estado_orden || 'en_diagnostico',
            observaciones_fisicas: observacionesFisicasInput,
            inspeccion_json: inspeccionPayload,
            comentario: __('Inspección inicial de preservicio registrada / actualizada.'),
        }, {
            onSuccess: () => {
                setIsPreservicioModalOpen(false);
                setIsSubmittingPreservicio(false);
                notifySuccess(__('Preservicio e inspección inicial guardados correctamente.'));
            },
            onError: () => {
                setIsSubmittingPreservicio(false);
            }
        });
    };

    const formatNum = (val: any): string => {
        if (val === null || val === undefined || val === '') return '0.00';
        const num = parseFloat(val);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    const formatDate = (dateStr?: string): string => {
        if (!dateStr) return __('No especificada');
        try {
            const cleanStr = String(dateStr).replace(' ', 'T');
            const d = new Date(cleanStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return dateStr || __('No especificada');
        }
    };

    const formatOnlyDate = (dateStr?: string): string => {
        if (!dateStr) return __('Sin fecha especificada');
        try {
            const cleanStr = String(dateStr).split('T')[0];
            const parts = cleanStr.split('-');
            if (parts.length === 3) {
                const [year, month, day] = parts;
                return `${day}/${month}/${year}`;
            }
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
            return dateStr || __('Sin fecha especificada');
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        notifySuccess(`${label} ${__('copiado al portapapeles.')}`);
    };

    // Separar items de servicios de los repuestos de inventario
    const serviciosItems = (orden.items || []).filter((i) => i.servicio_id || !i.producto_id);
    const repuestosItems = (orden.items || []).filter((i) => !!i.producto_id);

    const [openStatusModal, setOpenStatusModal] = useState(false);
    const [nuevoEstado, setNuevoEstado] = useState(orden.estado_orden);
    const [comentarioEstado, setComentarioEstado] = useState('');
    const [tecnicoAsignadoId, setTecnicoAsignadoId] = useState(orden.tecnico?.id ? String(orden.tecnico.id) : '');

    // Formulario de Repuesto
    const [selectedProductoId, setSelectedProductoId] = useState('');
    const [cantidadRepuesto, setCantidadRepuesto] = useState('1');
    const [isSubmittingItem, setIsSubmittingItem] = useState(false);

    // Repuestos agrupados por compatibilidad
    const repuestosCompatibles = productosRepuestos.filter(
        (p) => (orden.modelo_id && p.modelo_id === orden.modelo_id) || (orden.marca_id && p.marca_id === orden.marca_id)
    );
    const otrosRepuestos = productosRepuestos.filter(
        (p) => !((orden.modelo_id && p.modelo_id === orden.modelo_id) || (orden.marca_id && p.marca_id === orden.marca_id))
    );

    // Formulario Mano de Obra y Anticipo
    const [manoObraInput, setManoObraInput] = useState(String(orden.costo_mano_obra || 0));
    const [anticipoInput, setAnticipoInput] = useState(String(orden.anticipo || 0));
    const manoObraActual = Number(manoObraInput || 0);
    const anticipoActual = Number(anticipoInput || 0);
    const totalPresupuestoActual = Math.max(0, manoObraActual);
    const saldoRestanteActual = Math.max(0, totalPresupuestoActual - anticipoActual);

    const handleUpdateEstado = () => {
        router.post(
            `/admin/reparaciones/${orden.id}/estado`,
            {
                estado_orden: nuevoEstado,
                comentario: comentarioEstado,
                tecnico_id: tecnicoAsignadoId || null,
            },
            {
                onSuccess: () => {
                    setOpenStatusModal(false);
                    notifySuccess(__('Estado actualizado exitosamente.'));
                },
                onError: () => notifyError(__('Ocurrió un error al actualizar el estado.')),
            }
        );
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProductoId) return;

        setIsSubmittingItem(true);
        router.post(
            `/admin/reparaciones/${orden.id}/items`,
            {
                producto_id: selectedProductoId,
                cantidad: cantidadRepuesto,
            },
            {
                onSuccess: () => {
                    setSelectedProductoId('');
                    setCantidadRepuesto('1');
                    notifySuccess(__('Repuesto asignado correctamente.'));
                },
                onError: () => notifyError(__('Error al agregar repuesto.')),
                onFinish: () => setIsSubmittingItem(false),
            }
        );
    };

    const handleRemoveItem = (itemId: number) => {
        if (!confirm(__('¿Deseas remover este item de la orden?'))) return;
        router.delete(`/admin/reparaciones/${orden.id}/items/${itemId}`, {
            onSuccess: () => notifySuccess(__('Item removido correctamente.')),
            onError: () => notifyError(__('Error al remover item.')),
        });
    };

    const handleSaveCostos = () => {
        const normalizeDecimal = (value: string) => value.replace(',', '.').trim();

        router.post(
            `/admin/reparaciones/${orden.id}/costos`,
            {
                costo_mano_obra: normalizeDecimal(manoObraInput),
                anticipo: normalizeDecimal(anticipoInput),
            },
            {
                onSuccess: () => notifySuccess(__('Ajustes financieros guardados.')),
                onError: () => notifyError(__('Error al guardar ajustes financieros.')),
            }
        );
    };

    const sendWhatsApp = () => {
        const phone = orden.cliente?.telefono || orden.cliente_telefono;
        if (!phone) return;
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const clientName = orden.cliente?.nombre || orden.cliente_nombre;
        const deviceName = `${orden.marca?.nombre || orden.marca_nombre} ${orden.modelo?.nombre_comercial || orden.modelo_nombre}`;
        const msg = encodeURIComponent(
            `Hola *${clientName}*, le saludamos de Servicio Técnico.\nInformación sobre su orden *${orden.numero_orden}* (${deviceName}):\n\n📌 Estado actual: *${orden.estado_orden.toUpperCase().replace('_', ' ')}*\n💵 Presupuesto Total: *${currencySymbol}${formatNum(orden.costo_estimado)}*\n💳 Saldo Pendiente: *${currencySymbol}${formatNum(orden.saldo_restante)}*\n\nSi requiere asistencia adicional, no dude en responder a este mensaje.`
        );
        window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    };

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'recibido':
                return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold px-3 py-1 text-xs gap-1.5">🟡 {__('Recibido')}</Badge>;
            case 'en_diagnostico':
                return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 font-bold px-3 py-1 text-xs gap-1.5">🔍 {__('En Diagnóstico')}</Badge>;
            case 'presupuestado':
                return <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 font-bold px-3 py-1 text-xs gap-1.5">💵 {__('Presupuestado')}</Badge>;
            case 'en_reparacion':
                return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800 font-bold px-3 py-1 text-xs gap-1.5">🛠️ {__('En Reparación')}</Badge>;
            case 'esperando_repuesto':
                return <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800 font-bold px-3 py-1 text-xs gap-1.5">📦 {__('Esperando Repuesto')}</Badge>;
            case 'reparado':
                return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold px-3 py-1 text-xs gap-1.5">🟢 {__('Listo p/ Entrega')}</Badge>;
            case 'entregado':
                return <Badge className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold px-3 py-1 text-xs gap-1.5">✅ {__('Entregado & Finalizado')}</Badge>;
            case 'cancelado':
                return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-bold px-3 py-1 text-xs gap-1.5">❌ {__('Cancelado')}</Badge>;
            default:
                return <Badge variant="outline">{st}</Badge>;
        }
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Servicio Técnico'), href: '/admin/reparaciones' },
        { title: orden.numero_orden, href: '#' },
    ];

    const clienteNombreDisplay = orden.cliente?.nombre || orden.cliente_nombre || __('Cliente General');
    const clienteTelefonoDisplay = orden.cliente?.telefono || orden.cliente_telefono || 'N/A';
    const marcaNombreDisplay = orden.marca?.nombre || orden.marca_nombre || __('Dispositivo');
    const modeloNombreDisplay = orden.modelo?.nombre_comercial || orden.modelo_nombre || '';

    // Mapeo de fotos para la sección de evidencias
    const fotoSlots = [
        { key: 'frente', label: __('📱 Frente / Pantalla'), desc: __('Frontal & Cristal Display') },
        { key: 'trasero', label: __('🔄 Tapa Trasera'), desc: __('Carcasa & Cámaras') },
        { key: 'borde_sup', label: __('📐 Borde Superior / Izq.'), desc: __('Marco, Botones y Bisel') },
        { key: 'borde_inf', label: __('🔌 Borde Inferior / Der.'), desc: __('Puerto Carga & Altavoz') },
    ];

    return (
        <>
            <Head title={`Orden ${orden.numero_orden} - ${marcaNombreDisplay} ${modeloNombreDisplay}`} />

            <div className="w-full space-y-6 pb-16">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* HERO BAR PRINCIPAL CON ESTILO DASHBOARD PREMIUM */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-6 text-white shadow-xl border border-purple-900/40">
                    <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
                    <div className="absolute left-1/3 bottom-0 -mb-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        {/* FOLIO Y ESTADO */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 px-3 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
                                    {__('Ficha de Servicio Técnico')}
                                </span>
                                {getStatusBadge(orden.estado_orden)}
                            </div>

                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white flex items-center gap-3">
                                    {orden.numero_orden}
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(orden.numero_orden, __('Folio'))}
                                        title={__('Copiar Folio')}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        <Copy className="w-5 h-5" />
                                    </button>
                                </h1>
                            </div>

                            <p className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-purple-400" /> {formatDate(orden.fecha_recepcion)}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-purple-400" /> {__('Técnico:')} <strong className="text-purple-200">{orden.tecnico?.name || __('Sin Asignar')}</strong></span>
                            </p>
                        </div>

                        {/* BOTONES DE ACCIÓN RÁPIDA */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            <Link href="/admin/reparaciones">
                                <Button variant="outline" size="sm" className="h-10 text-xs bg-white/10 hover:bg-white/20 border-white/20 text-white gap-1.5 font-bold">
                                    <ArrowLeft className="w-4 h-4" />
                                    {__('Volver')}
                                </Button>
                            </Link>

                            {(orden.cliente?.telefono || orden.cliente_telefono) && (
                                <Button size="sm" onClick={sendWhatsApp} className="h-10 gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40">
                                    <Send className="w-4 h-4" />
                                    {__('WhatsApp')}
                                </Button>
                            )}

                            <Button size="sm" onClick={() => window.print()} variant="outline" className="h-10 gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 border-white/20 text-white">
                                <Printer className="w-4 h-4 text-blue-400" />
                                {__('Imprimir Ticket')}
                            </Button>

                            <Dialog open={openStatusModal} onOpenChange={setOpenStatusModal}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="h-10 gap-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/50">
                                        <Wrench className="w-4 h-4" />
                                        {__('Cambiar Estado')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                            <Wrench className="w-5 h-5 text-purple-600" />
                                            {__('Actualizar Estado de Reparación')}
                                        </DialogTitle>
                                    </DialogHeader>

                                    <div className="space-y-4 py-2">
                                        <div>
                                            <Label className="text-xs font-semibold">{__('Nuevo Estado *')}</Label>
                                            <Select value={nuevoEstado} onValueChange={(val) => setNuevoEstado(val)}>
                                                <SelectTrigger className="text-xs h-10 mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="recibido">🟡 Recibido</SelectItem>
                                                    <SelectItem value="en_diagnostico">🔍 En Diagnóstico</SelectItem>
                                                    <SelectItem value="presupuestado">💵 Presupuestado</SelectItem>
                                                    <SelectItem value="en_reparacion">🛠️ En Reparación</SelectItem>
                                                    <SelectItem value="esperando_repuesto">📦 Esperando Repuesto</SelectItem>
                                                    <SelectItem value="reparado">🟢 Listo p/ Entrega</SelectItem>
                                                    <SelectItem value="entregado">✅ Entregado & Finalizado</SelectItem>
                                                    <SelectItem value="cancelado">❌ Sin Arreglo / Cancelado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label className="text-xs font-semibold">{__('Técnico Asignado')}</Label>
                                            <Select value={tecnicoAsignadoId} onValueChange={(val) => setTecnicoAsignadoId(val)}>
                                                <SelectTrigger className="text-xs h-10 mt-1">
                                                    <SelectValue placeholder={__('Seleccionar técnico...')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {tecnicos.map((t) => (
                                                        <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                                                            🛠️ {t.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label className="text-xs font-semibold">{__('Comentario para la Línea de Tiempo')}</Label>
                                            <Textarea
                                                value={comentarioEstado}
                                                onChange={(e) => setComentarioEstado(e.target.value)}
                                                placeholder={__('ej: Pantalla reemplazada y probada. Equipo listo para entrega.')}
                                                rows={3}
                                                className="text-xs mt-1"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <Button variant="outline" size="sm" onClick={() => setOpenStatusModal(false)} className="h-8 text-xs">
                                            {__('Cancelar')}
                                        </Button>
                                        <Button size="sm" onClick={handleUpdateEstado} className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white">
                                            {__('Guardar Estado')}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                {/* 4 STRIPS METRICAS CLAVE DE LA ORDEN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* CLIENTE */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">{__('Cliente')}</span>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate" title={clienteNombreDisplay}>{clienteNombreDisplay}</h3>
                                <p className="text-xs font-mono text-purple-700 dark:text-purple-300 font-semibold">{clienteTelefonoDisplay}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* DISPOSITIVO */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">{__('Equipo / Modelo')}</span>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate" title={`${marcaNombreDisplay} ${modeloNombreDisplay}`}>{marcaNombreDisplay} {modeloNombreDisplay}</h3>
                                <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1 truncate">
                                    IMEI: <strong className="text-slate-700 dark:text-slate-300 font-bold">{orden.imei_serie || 'N/A'}</strong>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* DÍAS GARANTÍA / FECHA PROMETIDA */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">{__('Compromiso & Garantía')}</span>
                                <div className="text-sm font-black text-slate-900 dark:text-slate-100 font-mono">
                                    {formatOnlyDate(orden.fecha_prometida)}
                                </div>
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                    {orden.garantia_dias} {__('días de garantía')}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SALDO PENDIENTE */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500 hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">{__('Saldo Restante a Cobrar')}</span>
                                <h3 className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                                    {currencySymbol}{formatNum(saldoRestanteActual)}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-mono">
                                    {__('Total:')} {currencySymbol}{formatNum(totalPresupuestoActual)} | {__('Adelanto:')} {currencySymbol}{formatNum(anticipoActual)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* BARRA NAVEGACIÓN TABBED MODERNA */}
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('general')}
                        className={cn(
                            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
                            activeTab === 'general'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                    >
                        <FileText className="w-4 h-4" />
                        {__('Resumen General')}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('preservicio')}
                        className={cn(
                            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
                            activeTab === 'preservicio'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                    >
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        {__('Preservicio / Inspección')}
                        {orden.inspeccion_json || orden.contrasena_patron ? (
                            <Badge className="ml-1 text-[10px] h-4 px-1.5 bg-emerald-500 text-white border-0 font-bold">
                                🟢 {__('Completado')}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="ml-1 text-[10px] h-4 px-1.5">
                                {__('Pendiente')}
                            </Badge>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('repuestos')}
                        className={cn(
                            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
                            activeTab === 'repuestos'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                    >
                        <Package className="w-4 h-4" />
                        {__('Repuestos de Inventario')}
                        <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200">
                            {repuestosItems.length}
                        </Badge>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('fotos')}
                        className={cn(
                            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
                            activeTab === 'fotos'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                    >
                        <Camera className="w-4 h-4" />
                        {__('Evidencias Fotográficas (Pre-Reparación)')}
                        <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200">
                            {orden.fotos?.length || 0} / 4
                        </Badge>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('postservicio')}
                        className={cn(
                            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
                            activeTab === 'postservicio'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                    >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        {__('Post-Atención / QC')}
                        {tienePostServicio ? (
                            <Badge className="ml-1 text-[10px] h-4 px-1.5 bg-emerald-500 text-white border-0 font-bold">
                                🟢 {__('Completado')}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="ml-1 text-[10px] h-4 px-1.5">
                                {__('Pendiente')}
                            </Badge>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('historial')}
                        className={cn(
                            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
                            activeTab === 'historial'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                    >
                        <History className="w-4 h-4" />
                        {__('Línea de Tiempo')}
                        <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200">
                            {orden.historial?.length || 0}
                        </Badge>
                    </button>
                </div>

                {/* CONTENIDO PRINCIPAL SEGÚN TAB SELECCIONADA */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* COLUMNA IZQUIERDA (2 ANCHOS) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* TAB 1: RESUMEN Y DIAGNÓSTICO */}
                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {/* CARD DETALLE DISPOSITIVO & FALLA */}
                                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                        <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-800 dark:text-slate-200">
                                            <span className="flex items-center gap-2">
                                                <Smartphone className="w-4 h-4 text-purple-600" />
                                                {__('Ficha Técnica del Equipo')}
                                            </span>
                                            <Badge variant="outline" className="font-mono text-[11px]">{orden.tipo_dispositivo || __('Smartphone')}</Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 space-y-5 text-xs">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            <div>
                                                <span className="text-slate-400 block text-[11px] font-medium">{__('Marca')}</span>
                                                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{marcaNombreDisplay}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[11px] font-medium">{__('Modelo')}</span>
                                                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{modeloNombreDisplay || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[11px] font-medium">{__('Color / Estética')}</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{orden.color || __('No especificado')}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[11px] font-medium">{__('IMEI / Serie')}</span>
                                                <span className="font-mono font-bold text-purple-700 dark:text-purple-400">{orden.imei_serie || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[11px] font-medium">{__('Fecha Prometida')}</span>
                                                <span className="font-medium text-slate-800 dark:text-slate-200">{orden.fecha_prometida || __('No especificada')}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[11px] font-medium">{__('Días Garantía')}</span>
                                                <span className="font-bold text-emerald-600">{orden.garantia_dias} {__('Días')}</span>
                                            </div>
                                        </div>

                                        {/* HERO FALLA REPORTADA */}
                                        <div className="p-4 bg-purple-50/70 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900 space-y-1.5">
                                            <span className="font-extrabold text-purple-900 dark:text-purple-200 block text-xs flex items-center gap-1.5">
                                                <AlertCircle className="w-4 h-4 text-purple-600" />
                                                {__('Falla Reportada por el Cliente:')}
                                            </span>
                                            <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed font-medium">
                                                {orden.descripcion_falla || __('Sin descripción especificada en la recepción.')}
                                            </p>
                                        </div>

                                        {orden.observaciones_fisicas && (
                                            <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 space-y-1 text-xs">
                                                <span className="font-bold block text-[11px]">{__('Observaciones Físicas de Recepción:')}</span>
                                                <p>{orden.observaciones_fisicas}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* TRABAJOS Y MANO DE OBRA ASIGNADA */}
                                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                        <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-800 dark:text-slate-200">
                                            <span className="flex items-center gap-2">
                                                <Wrench className="w-4 h-4 text-purple-600" />
                                                {__('Servicios de Mano de Obra Solicitados')}
                                            </span>
                                            <Badge variant="outline" className="font-mono text-purple-700 bg-purple-50 dark:bg-purple-950/50 font-bold border-purple-200">
                                                {serviciosItems.length} {serviciosItems.length === 1 ? __('Servicio') : __('Servicios')}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        {serviciosItems.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic text-center py-4">
                                                {__('No se han registrado conceptos específicos de mano de obra en la recepción.')}
                                            </p>
                                        ) : (
                                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {serviciosItems.map((item) => (
                                                    <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                                                        <div className="space-y-0.5">
                                                            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                                                                {item.descripcion}
                                                            </span>
                                                            {(item as any).servicio?.categoria?.nombre && (
                                                                <span className="text-[10px] text-slate-400 block font-medium pl-6">
                                                                    Categoría: {(item as any).servicio.categoria.nombre}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                                                            {currencySymbol}{formatNum(item.precio_venta)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* PESTAÑA: PRESERVICIO / INSPECCIÓN INICIAL */}
                        {activeTab === 'preservicio' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {!tienePreservicio ? (
                                    <Card className="border-indigo-200 dark:border-indigo-900 shadow-sm bg-white dark:bg-slate-900">
                                        <CardContent className="p-8 text-center space-y-4">
                                            <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-3xl shadow-xs border border-indigo-100 dark:border-indigo-900">
                                                🛡️
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                                    {__('El preservicio e inspección inicial aún no ha sido completado')}
                                                </h3>
                                                <p className="text-xs text-slate-500 max-w-md mx-auto">
                                                    {__('Registre la inspección estética (12 puntos), el estado funcional y el patrón de desbloqueo táctil 3x3.')}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={openPreservicioModal}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 h-10 gap-2 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none"
                                            >
                                                <ShieldCheck className="w-4 h-4" />
                                                {__('Iniciar Proceso de Preservicio')} ➔
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Card className="border-indigo-200 dark:border-indigo-900 shadow-sm bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/50 dark:from-indigo-950/20 dark:via-slate-900 dark:to-purple-950/20">
                                        <CardHeader className="py-4 border-b border-indigo-100 dark:border-indigo-900/50">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <CardTitle className="text-base font-black flex items-center gap-2 text-indigo-950 dark:text-indigo-100">
                                                    <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                                    {__('Ficha de Preservicio e Inspección Inicial')}
                                                </CardTitle>
                                                <div className="flex items-center gap-2">
                                                    {orden.tecnico && (
                                                        <Badge variant="outline" className="text-xs bg-white dark:bg-slate-800 font-semibold text-indigo-700 dark:text-indigo-300 border-indigo-200">
                                                            🛠️ {__('Inspeccionado por:')} {orden.tecnico.name}
                                                        </Badge>
                                                    )}
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={openPreservicioModal}
                                                        className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white h-8 gap-1.5 rounded-lg shadow-xs"
                                                    >
                                                        <Wrench className="w-3.5 h-3.5" />
                                                        {__('Editar Preservicio')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                    <CardContent className="p-5 space-y-6">
                                        {/* 1. CLAVE Y PATRÓN DE DESBLOQUEO */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                <Lock className="w-4 h-4 text-indigo-500" />
                                                {__('1. Tipo de Bloqueo & Claves de Acceso')}
                                            </h4>

                                            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-4 shadow-xs">
                                                <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 dark:border-slate-900 pb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{__('Tipo de Bloqueo Registrado:')}</span>
                                                        <Badge className="bg-indigo-600 text-white font-extrabold text-xs px-3 py-1">
                                                            {inspeccionData?.tipo_bloqueo === 'patron' ? '🌀 Patrón (3x3)' :
                                                             inspeccionData?.tipo_bloqueo === 'pin' ? '🔢 Código PIN' :
                                                             inspeccionData?.tipo_bloqueo === 'contrasena' ? '🔠 Contraseña' :
                                                             inspeccionData?.tipo_bloqueo === 'sin_bloqueo' ? '🔓 Sin Bloqueo' :
                                                             (orden.contrasena_patron || __('No registrado'))}
                                                        </Badge>
                                                    </div>

                                                    {orden.contrasena_patron && (
                                                        <div className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                                            🔑 {orden.contrasena_patron}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* RENDERIZADO DEL LIENZO DE PATRÓN 3X3 SI ES UN PATRÓN */}
                                                {(inspeccionData?.tipo_bloqueo === 'patron' || (inspeccionData?.patron_dots && inspeccionData.patron_dots.length > 0)) ? (
                                                    <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-950 text-white space-y-3 shadow-inner">
                                                        <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                                                            <span>🌀</span> {__('Lienzo de Patrón 3x3 Dibujado por el Técnico:')}
                                                        </span>
                                                        <PatternLockViewer pattern={inspeccionData?.patron_dots || []} />
                                                    </div>
                                                ) : inspeccionData?.tipo_bloqueo === 'pin' ? (
                                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 rounded-xl text-center text-xs font-bold font-mono">
                                                        🔑 PIN Numérico: {inspeccionData.codigo_pin || orden.contrasena_patron}
                                                    </div>
                                                ) : inspeccionData?.tipo_bloqueo === 'contrasena' ? (
                                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 rounded-xl text-center text-xs font-bold font-mono">
                                                        🔑 Clave Alfanumérica: {inspeccionData.clave_texto || orden.contrasena_patron}
                                                    </div>
                                                ) : inspeccionData?.tipo_bloqueo === 'sin_bloqueo' ? (
                                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-center text-xs font-bold">
                                                        🔓 Dispositivo sin ningún tipo de bloqueo de pantalla.
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>

                                        {/* 2. INSPECCIÓN FÍSICA DE 12 ELEMENTOS */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                <Smartphone className="w-4 h-4 text-indigo-500" />
                                                {__('2. Estado de Inspección Física (12 Puntos)')}
                                            </h4>

                                            {inspeccionData?.fisica ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {Object.entries(inspeccionData.fisica).map(([itemKey, itemVal]: [string, any]) => {
                                                        const st = itemVal?.estado ?? 'na';
                                                        const obs = itemVal?.obs ?? '';
                                                        return (
                                                            <div
                                                                key={itemKey}
                                                                className={cn(
                                                                    'p-3 rounded-xl border text-xs flex flex-col justify-between gap-1.5 transition-all shadow-xs',
                                                                    st === 'malo'
                                                                        ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900'
                                                                        : st === 'bueno'
                                                                        ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900'
                                                                        : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                                                                )}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-bold text-slate-900 dark:text-slate-100">{itemKey}</span>
                                                                    {st === 'bueno' && (
                                                                        <Badge className="bg-emerald-600 text-white text-[10px] px-2 font-extrabold">🟢 Bueno</Badge>
                                                                    )}
                                                                    {st === 'malo' && (
                                                                        <Badge className="bg-rose-600 text-white text-[10px] px-2 font-extrabold">🔴 Dañado</Badge>
                                                                    )}
                                                                    {st === 'na' && (
                                                                        <Badge variant="outline" className="text-[10px] text-slate-400 px-2">⚪ N/A</Badge>
                                                                    )}
                                                                </div>
                                                                {obs && (
                                                                    <p className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold bg-white/70 dark:bg-slate-950/60 p-1.5 rounded border border-rose-100 dark:border-rose-900/40">
                                                                        📝 {obs}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 text-xs italic text-center">
                                                    {__('Sin datos detallados de inspección de componentes.')}
                                                </div>
                                            )}
                                        </div>

                                        {/* 3. ESTADO FUNCIONAL ELECTRÓNICO */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-indigo-500" />
                                                {__('3. Estado Funcional Inicial')}
                                            </h4>

                                            {inspeccionData?.estado ? (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {Object.entries(inspeccionData.estado).map(([k, isOk]: [string, any]) => {
                                                        const labels: Record<string, string> = {
                                                            enciende: 'Enciende',
                                                            carga_bateria: 'Carga batería',
                                                            entra_sistema: 'Entra al sistema',
                                                            tiene_bloqueo: 'Tiene bloqueo',
                                                            cliente_proporciona_contrasena: 'Proporciona clave/patrón',
                                                        };
                                                        return (
                                                            <div
                                                                key={k}
                                                                className={cn(
                                                                    'p-3 rounded-xl border text-xs flex items-center justify-between font-bold shadow-xs',
                                                                    isOk
                                                                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-900 dark:text-emerald-200'
                                                                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-600 dark:text-slate-400'
                                                                )}
                                                            >
                                                                <span>{labels[k] || k}</span>
                                                                <span>{isOk ? '✅ Sí' : '❌ No'}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : null}
                                        </div>

                                        {/* 4. OBSERVACIONES FÍSICAS */}
                                        {orden.observaciones_fisicas && (
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-indigo-500" />
                                                    {__('4. Observaciones Físicas Adicionales')}
                                                </h4>
                                                <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed font-medium">
                                                    {orden.observaciones_fisicas}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                        {/* PESTAÑA: POST-ATENCIÓN / VALIDACIÓN FINAL & CONTROL DE CALIDAD */}
                        {activeTab === 'postservicio' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {!tienePostServicio ? (
                                    <Card className="border-emerald-200 dark:border-emerald-900 shadow-sm bg-white dark:bg-slate-900">
                                        <CardContent className="p-8 text-center space-y-4">
                                            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-3xl shadow-xs border border-emerald-100 dark:border-emerald-900">
                                                ✅
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                                    {__('La validación final y post-atención aún no ha sido registrada')}
                                                </h3>
                                                <p className="text-xs text-slate-500 max-w-md mx-auto">
                                                    {__('Verifique las 24 funciones electrónicas finales, el protocolo de limpieza (5 puntos), los 6 controles de calidad y cargue las fotos finales del equipo reparado.')}
                                                </p>
                                            </div>
                                            <Link href={`/admin/reparaciones/${orden.id}/post-servicio`}>
                                                <Button
                                                    type="button"
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-6 h-10 gap-2 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    {__('Registrar Validación Final & Post-Atención')} ➔
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Card className="border-emerald-200 dark:border-emerald-900 shadow-sm bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/20">
                                        <CardHeader className="py-4 border-b border-emerald-100 dark:border-emerald-900/50">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <CardTitle className="text-base font-black flex items-center gap-2 text-emerald-950 dark:text-emerald-100">
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                    {__('Ficha de Validación Final & Post-Atención')}
                                                </CardTitle>
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-emerald-600 text-white font-extrabold text-xs px-3 py-1">
                                                        🟢 {__('Proceso Concluido')}
                                                    </Badge>
                                                    <Link href={`/admin/reparaciones/${orden.id}/post-servicio`}>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-xs font-bold border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 gap-1.5"
                                                        >
                                                            ✨ {__('Editar Post-Atención & Fotos')}
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={openPostServicioModal}
                                                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white h-8 gap-1.5 rounded-lg shadow-xs"
                                                    >
                                                        <Wrench className="w-3.5 h-3.5" />
                                                        {__('Editar Post-Atención')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-5 space-y-6">
                                            {/* 1. TABLA VALIDACIÓN FINAL (24 FUNCIONES) */}
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                    <Activity className="w-4 h-4 text-emerald-500" />
                                                    {__('1. Validación Final de Funciones (24 Puntos de Control)')}
                                                </h4>

                                                {postServicioData?.validacion ? (
                                                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950 shadow-xs">
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-800">
                                                                        <th className="text-left py-2.5 px-4">{__('Función Evaluada')}</th>
                                                                        <th className="text-center py-2.5 px-4">{__('Estado')}</th>
                                                                        <th className="text-left py-2.5 px-4">{__('Observaciones')}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                                                    {Object.entries(postServicioData.validacion).map(([fnKey, fnVal]: [string, any]) => {
                                                                        const isCorrect = fnVal?.estado === 'correcto';
                                                                        return (
                                                                            <tr key={fnKey} className={isCorrect ? 'hover:bg-emerald-50/20' : 'bg-rose-50/30 hover:bg-rose-50/50'}>
                                                                                <td className="py-2 px-4 font-bold text-slate-800 dark:text-slate-200">{fnKey}</td>
                                                                                <td className="py-2 px-4 text-center">
                                                                                    {isCorrect ? (
                                                                                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-black">
                                                                                            ✓ {__('Correcto')}
                                                                                        </Badge>
                                                                                    ) : (
                                                                                        <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 text-[11px] font-black">
                                                                                            ✗ {__('Incorrecto')}
                                                                                        </Badge>
                                                                                    )}
                                                                                </td>
                                                                                <td className="py-2 px-4 text-slate-500 italic">
                                                                                    {fnVal?.obs || '-'}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>

                                            {/* 2. LIMPIEZA FINAL Y CONTROL DE CALIDAD */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* LIMPIEZA FINAL (5 PUNTOS) */}
                                                <div className="space-y-3">
                                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4 text-emerald-500" />
                                                        {__('2. Limpieza Final (5 Puntos)')}
                                                    </h4>

                                                    {postServicioData?.limpieza ? (
                                                        <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 bg-white dark:bg-slate-950">
                                                            {Object.entries(postServicioData.limpieza).map(([limKey, isOk]: [string, any]) => (
                                                                <div key={limKey} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs font-bold">
                                                                    <span className="text-slate-800 dark:text-slate-200">{limKey}</span>
                                                                    <span>{isOk ? '✅ Sí' : '❌ No'}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : null}
                                                </div>

                                                {/* CONTROL DE CALIDAD (6 PUNTOS) */}
                                                <div className="space-y-3">
                                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                                        {__('3. Control de Calidad (QC)')}
                                                    </h4>

                                                    {postServicioData?.qc ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 bg-white dark:bg-slate-950">
                                                            {CONTROL_CALIDAD_LIST.map((item) => {
                                                                const isChecked = postServicioData.qc[item.key] ?? false;
                                                                return (
                                                                    <div key={item.key} className={cn("flex items-center gap-2 p-2 rounded-xl text-xs font-bold border", isChecked ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" : "bg-slate-50 border-slate-200 text-slate-500")}>
                                                                        <span>{isChecked ? '☑️' : '⬜'}</span>
                                                                        <span>{item.label}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>

                                            {/* 4. OBSERVACIONES FINALES */}
                                            {postServicioData?.observaciones && (
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-emerald-500" />
                                                        {__('4. Observaciones Finales')}
                                                    </h4>
                                                    <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed font-medium">
                                                        {postServicioData.observaciones}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 5. FOTOS POST-REPARACIÓN (5 ÁNGULOS DE INSPECCIÓN FÍSICA) */}
                                            {postServicioData?.fotos_post && (
                                                <div className="space-y-3">
                                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                        <Camera className="w-4 h-4 text-emerald-500" />
                                                        {__('5. Evidencias Fotográficas Post-Reparación (5 Ángulos)')}
                                                    </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                                        {FOTOS_POST_REPARACION_ANGULOS.map((slot) => {
                                                            const imgUrl = typeof postServicioData.fotos_post === 'object' && !Array.isArray(postServicioData.fotos_post)
                                                                ? postServicioData.fotos_post[slot.key]
                                                                : (Array.isArray(postServicioData.fotos_post) ? postServicioData.fotos_post.find((item: any) => item.key === slot.key || item.angulo === slot.key)?.url : null);
                                                            return (
                                                                <div key={slot.key} className="space-y-1.5">
                                                                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate flex items-center gap-1">
                                                                        <span>{slot.icon}</span>
                                                                        <span className="truncate">{slot.label}</span>
                                                                    </div>
                                                                    {imgUrl ? (
                                                                        <div
                                                                            onClick={() => setPreviewPhoto({ url: imgUrl, label: slot.label })}
                                                                            className="group relative rounded-2xl overflow-hidden border border-emerald-200 dark:border-emerald-800 bg-black aspect-video cursor-pointer shadow-md"
                                                                        >
                                                                            <img src={imgUrl} alt={slot.label} className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-xs font-bold">
                                                                                🔍 {__('Ampliar')}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 aspect-video flex items-center justify-center text-[10px] text-slate-400 italic">
                                                                            {__('Sin Foto')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* TAB 2: REPUESTOS CONSUMIDOS DE INVENTARIO */}
                        {activeTab === 'repuestos' && (
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-300">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                    <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-800 dark:text-slate-200">
                                        <span className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-purple-600" />
                                            {__('Repuestos Consumidos de Inventario')}
                                        </span>
                                        <span className="font-mono text-xs text-purple-600 font-bold">
                                            {currencySymbol}{formatNum(orden.costo_repuestos)}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    {/* FORMULARIO AGREGAR REPUESTO */}
                                    <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <div className="flex-1 w-full">
                                            <Select value={selectedProductoId} onValueChange={(val) => setSelectedProductoId(val)}>
                                                <SelectTrigger className="text-xs h-10 bg-white dark:bg-slate-900">
                                                    <SelectValue placeholder={__('Buscar repuesto en inventario...')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {repuestosCompatibles.length > 0 && (
                                                        <SelectGroup>
                                                            <SelectLabel className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-1 flex items-center gap-1">
                                                                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                                                {__('🎯 Compatibles con')} {marcaNombreDisplay} {modeloNombreDisplay} ({repuestosCompatibles.length})
                                                            </SelectLabel>
                                                            {repuestosCompatibles.map((p) => {
                                                                const nombreProd = p.nombre_variante || p.nombre || '';
                                                                const cod = p.sku || p.codigo_barras || '';
                                                                return (
                                                                    <SelectItem key={p.id} value={String(p.id)} className="text-xs font-bold text-purple-950 dark:text-purple-100">
                                                                        🎯 {nombreProd} {cod ? `(${cod})` : ''} - {currencySymbol}{Number(p.precio_venta).toFixed(2)} [Stock: {p.stock}]
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectGroup>
                                                    )}

                                                    <SelectGroup>
                                                        <SelectLabel className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1">
                                                            {__('📦 Todos los Repuestos de Inventario')} ({otrosRepuestos.length})
                                                        </SelectLabel>
                                                        {otrosRepuestos.map((p) => {
                                                            const nombreProd = p.nombre_variante || p.nombre || '';
                                                            const cod = p.sku || p.codigo_barras || '';
                                                            const marcaInfo = p.marca?.nombre ? `[${p.marca.nombre}] ` : '';
                                                            return (
                                                                <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                                                                    {marcaInfo}{nombreProd} {cod ? `(${cod})` : ''} - {currencySymbol}{Number(p.precio_venta).toFixed(2)} [Stock: {p.stock}]
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24">
                                            <Input
                                                type="number"
                                                min="1"
                                                value={cantidadRepuesto}
                                                onChange={(e) => setCantidadRepuesto(e.target.value)}
                                                placeholder="Cant"
                                                className="text-xs h-10 bg-white dark:bg-slate-900"
                                            />
                                        </div>
                                        <Button type="submit" disabled={isSubmittingItem || !selectedProductoId} size="sm" className="h-10 px-5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white">
                                            <Plus className="w-4 h-4 mr-1" />
                                            {__('Asignar Repuesto')}
                                        </Button>
                                    </form>

                                    {/* TABLA DE REPUESTOS */}
                                    <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
                                                <tr>
                                                    <th className="px-4 py-3">{__('Repuesto / Componente')}</th>
                                                    <th className="px-4 py-3 text-center">{__('Cantidad')}</th>
                                                    <th className="px-4 py-3 text-right">{__('Precio Venta')}</th>
                                                    <th className="px-4 py-3 text-right">{__('Subtotal')}</th>
                                                    <th className="px-3 py-3 text-center"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {repuestosItems.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-4 py-6 text-center text-slate-400 italic">
                                                            {__('No se han asignado repuestos adicionales a esta orden.')}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    repuestosItems.map((item) => (
                                                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{item.descripcion}</td>
                                                            <td className="px-4 py-3 text-center font-mono font-bold">{item.cantidad}</td>
                                                            <td className="px-4 py-3 text-right font-mono">{currencySymbol}{formatNum(item.precio_venta)}</td>
                                                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">{currencySymbol}{formatNum(item.subtotal)}</td>
                                                            <td className="px-3 py-3 text-center">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => handleRemoveItem(item.id)}
                                                                    className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* TAB 3: EVIDENCIAS FOTOGRÁFICAS */}
                        {activeTab === 'fotos' && (
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-300">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                    <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-800 dark:text-slate-200">
                                        <span className="flex items-center gap-2">
                                            <Camera className="w-4 h-4 text-purple-600" />
                                            {__('Evidencias Fotográficas de Recepción (4 Ángulos)')}
                                        </span>
                                        <Badge variant="outline" className="font-mono text-xs">
                                            {orden.fotos?.length || 0} / 4 {__('Capturadas')}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {fotoSlots.map((item) => {
                                            const fotoObj = orden.fotos?.find((f: any) => f.angulo === item.key);
                                            const imgUrl = fotoObj ? fotoObj.url : (orden.evidencias_fotos as any)?.[item.key];
                                            return (
                                                <div key={item.key} className="flex flex-col items-center p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-center gap-2 shadow-sm hover:border-purple-300 transition-colors">
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</span>
                                                    <span className="text-[10px] text-slate-400">{item.desc}</span>

                                                    {imgUrl ? (
                                                        <div
                                                            onClick={() => setPreviewPhoto({ url: imgUrl, label: item.label })}
                                                            className="w-full h-40 rounded-xl overflow-hidden border border-purple-200 dark:border-purple-900 block group relative cursor-pointer shadow-inner"
                                                        >
                                                            <img src={imgUrl} alt={item.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 backdrop-blur-[2px]">
                                                                <Eye className="w-4 h-4" />
                                                                {__('Ampliar')}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-40 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-900/40 gap-1">
                                                            <Camera className="w-6 h-6 text-slate-300" />
                                                            <span className="font-semibold text-[11px]">{__('Sin Fotografía')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* TAB 4: LÍNEA DE TIEMPO / HISTORIAL */}
                        {activeTab === 'historial' && (
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-300">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                        <History className="w-4 h-4 text-purple-600" />
                                        {__('Línea de Tiempo & Trazabilidad de Cambios')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5">
                                    <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                                        {orden.historial.map((h) => (
                                            <div key={h.id} className="relative pl-8 space-y-1">
                                                <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-purple-600 ring-4 ring-white dark:ring-slate-900 shadow-sm" />
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                        {getStatusBadge(h.estado_nuevo)}
                                                    </span>
                                                    <span className="text-slate-400 text-[11px] font-mono">{formatDate(h.created_at)}</span>
                                                </div>
                                                {h.user && (
                                                    <span className="text-[11px] font-semibold text-slate-500 block">
                                                        👤 {h.user.name}
                                                    </span>
                                                )}
                                                {h.comentario && (
                                                    <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mt-1.5 font-medium leading-relaxed">
                                                        "{h.comentario}"
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* COLUMNA DERECHA: RESUMEN FINANCIERO E HISTORIAL (1 ANCHO) */}
                    <div className="space-y-6">
                        {/* RESUMEN FINANCIERO Y CONTROL DE COSTOS */}
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                    <DollarSign className="w-4 h-4 text-emerald-600" />
                                    {__('Resumen Financiero')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-5 text-xs">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                        <span>{__('Costo del Servicio:')}</span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{currencySymbol}{formatNum(totalPresupuestoActual)}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-[11px]">
                                        <span>{__('Repuestos (referencia interna):')}</span>
                                        <span className="font-mono">{currencySymbol}{formatNum(orden.costo_repuestos)}</span>
                                    </div>

                                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <Label className="text-[11px] font-semibold">{__('Costo Mano de Obra:')}</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={manoObraInput}
                                            onChange={(e) => setManoObraInput(e.target.value)}
                                            className="text-xs h-9 font-mono bg-white dark:bg-slate-950"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-semibold">{__('Anticipo / Adelanto:')}</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={anticipoInput}
                                            onChange={(e) => setAnticipoInput(e.target.value)}
                                            className="text-xs h-9 font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-slate-950"
                                        />
                                    </div>

                                    <Button onClick={handleSaveCostos} size="sm" variant="outline" className="w-full h-8 text-xs font-bold mt-2 border-purple-200 hover:bg-purple-50 text-purple-700 dark:border-purple-800 dark:text-purple-300">
                                        <Save className="w-3.5 h-3.5 mr-1" />
                                        {__('Guardar Ajustes de Costo')}
                                    </Button>
                                </div>

                                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                                    <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-slate-100">
                                        <span>{__('Total Presupuesto:')}</span>
                                        <span className="font-mono text-purple-700 dark:text-purple-400 text-lg font-black">{currencySymbol}{formatNum(totalPresupuestoActual)}</span>
                                    </div>

                                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-300 space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-xs">{__('Saldo Restante a Cobrar:')}</span>
                                            <span className="font-mono font-black text-xl text-emerald-600 dark:text-emerald-400">{currencySymbol}{formatNum(saldoRestanteActual)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* HISTORIAL LATERAL RESUMIDO */}
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-800 dark:text-slate-200">
                                    <span className="flex items-center gap-2">
                                        <History className="w-4 h-4 text-purple-600" />
                                        {__('Historial Reciente')}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('historial')}
                                        className="text-[11px] font-bold text-purple-600 hover:text-purple-800"
                                    >
                                        {__('Ver todo')} →
                                    </button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 text-xs space-y-3">
                                {orden.historial.slice(0, 3).map((h) => (
                                    <div key={h.id} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-bold capitalize text-slate-800 dark:text-slate-200">{h.estado_nuevo.replace('_', ' ')}</span>
                                            <span className="text-[10px] text-slate-400">{formatDate(h.created_at)}</span>
                                        </div>
                                        {h.comentario && <p className="text-[11px] text-slate-500 italic truncate">"{h.comentario}"</p>}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* MODAL AMPLIACIÓN FOTO */}
                <Dialog open={!!previewPhoto} onOpenChange={(open) => { if (!open) setPreviewPhoto(null); }}>
                    <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-slate-950 text-white border-slate-800">
                        <DialogHeader className="p-4 bg-slate-900 border-b border-slate-800 flex flex-row items-center justify-between">
                            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-white">
                                <Camera className="w-5 h-5 text-purple-400" />
                                {previewPhoto?.label}
                            </DialogTitle>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setPreviewPhoto(null)} className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </Button>
                        </DialogHeader>
                        <div className="p-4 flex items-center justify-center bg-black min-h-[400px]">
                            {previewPhoto?.url && (
                                <img src={previewPhoto.url} alt={previewPhoto.label} className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl" />
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* MODAL PROCESO DE PRESERVICIO EN DETALLE DE ORDEN */}
                <Dialog open={isPreservicioModalOpen} onOpenChange={setIsPreservicioModalOpen}>
                    <DialogContent className="w-[96vw] sm:max-w-[96vw] md:max-w-[92vw] h-[92vh] max-h-[92vh] p-0 flex flex-col overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <DialogHeader className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0 border-b border-indigo-900/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                                            {__('Proceso de Preservicio e Inspección Inicial')}
                                        </DialogTitle>
                                        <p className="text-xs text-indigo-200/80">
                                            {orden.numero_orden} • {orden.marca_nombre} {orden.modelo_nombre} ({orden.cliente_nombre})
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                                        {[
                                            { id: 'fisica', label: __('1. Inspección Física'), icon: '🔍' },
                                            { id: 'estado', label: __('2. Estado Funcional'), icon: '⚡' },
                                            { id: 'observaciones', label: __('3. Observaciones'), icon: '📝' },
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setModalTab(tab.id as any)}
                                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                                    modalTab === tab.id
                                                        ? 'bg-indigo-600 text-white shadow-xs'
                                                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                                }`}
                                            >
                                                <span>{tab.icon}</span>
                                                <span>{tab.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsPreservicioModalOpen(false)}
                                        className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </DialogHeader>

                        <form onSubmit={handleSavePreservicio} className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* PESTAÑA 1: INSPECCIÓN FÍSICA */}
                                {modalTab === 'fisica' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                            <div>
                                                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs">1</span>
                                                    {__('Inspección Estética y Física del Dispositivo (12 Elementos)')}
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    {__('Marque el estado de cada componente e indique observaciones específicas si existe daño.')}
                                                </p>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setInspeccionFisica((prev) => {
                                                        const copy = { ...prev };
                                                        ELEMENTOS_INSPECCION_LIST.forEach((item) => {
                                                            copy[item] = { ...copy[item], estado: 'bueno' };
                                                        });
                                                        return copy;
                                                    });
                                                }}
                                                className="text-xs font-bold bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 gap-1 rounded-xl"
                                            >
                                                ✨ {__('Marcar Todos como Bueno')}
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {ELEMENTOS_INSPECCION_LIST.map((item) => {
                                                const current = inspeccionFisica[item] || { estado: 'na', obs: '' };
                                                return (
                                                    <div
                                                        key={item}
                                                        className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                                                            current.estado === 'malo'
                                                                ? 'border-rose-300 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs'
                                                                : current.estado === 'bueno'
                                                                ? 'border-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/10'
                                                                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-black text-slate-900 dark:text-slate-100">{item}</span>

                                                            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-200/70 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setInspeccionFisica((prev) => ({
                                                                            ...prev,
                                                                            [item]: { ...prev[item], estado: 'bueno' },
                                                                        }))
                                                                    }
                                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                                                                        current.estado === 'bueno'
                                                                            ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                                    }`}
                                                                >
                                                                    {__('Bueno')}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setInspeccionFisica((prev) => ({
                                                                            ...prev,
                                                                            [item]: { ...prev[item], estado: 'malo' },
                                                                        }))
                                                                    }
                                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                                                                        current.estado === 'malo'
                                                                            ? 'bg-rose-600 text-white shadow-xs scale-105'
                                                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                                    }`}
                                                                >
                                                                    {__('Malo')}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setInspeccionFisica((prev) => ({
                                                                            ...prev,
                                                                            [item]: { ...prev[item], estado: 'na' },
                                                                        }))
                                                                    }
                                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                                                                        current.estado === 'na'
                                                                            ? 'bg-slate-600 text-white shadow-xs'
                                                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                                    }`}
                                                                >
                                                                    {__('N/A')}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {current.estado === 'malo' && (
                                                            <Input
                                                                value={current.obs}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setInspeccionFisica((prev) => ({
                                                                        ...prev,
                                                                        [item]: { ...prev[item], obs: val },
                                                                    }));
                                                                }}
                                                                placeholder={__('Detalle del daño (ej: fisura en esquina superior)...')}
                                                                className="text-xs h-8 border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-900 dark:text-rose-200"
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* PESTAÑA 2: ESTADO FUNCIONAL */}
                                {modalTab === 'estado' && (
                                    <div className="space-y-5">
                                        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                                            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs">2</span>
                                                {__('Estado Funcional Inicial del Equipo')}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                {__('Verifique las funciones electrónicas básicas al recibir el equipo.')}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            {REVISIONES_ESTADO_LIST.map((rev) => {
                                                const isChecked = estadoEquipo[rev.key] ?? false;
                                                return (
                                                    <div
                                                        key={rev.key}
                                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                                            isChecked
                                                                ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
                                                                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900'
                                                        }`}
                                                    >
                                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{rev.label}</span>
                                                        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700">
                                                            <button
                                                                type="button"
                                                                onClick={() => setEstadoEquipo((prev) => ({ ...prev, [rev.key]: true }))}
                                                                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                                                                    isChecked
                                                                        ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                                }`}
                                                            >
                                                                {__('Sí')}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEstadoEquipo((prev) => ({ ...prev, [rev.key]: false }))}
                                                                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                                                                    !isChecked
                                                                        ? 'bg-rose-600 text-white shadow-xs scale-105'
                                                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                                }`}
                                                            >
                                                                {__('No')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* PESTAÑA 3: OBSERVACIONES */}
                                {modalTab === 'observaciones' && (
                                    <div className="space-y-3">
                                        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                                            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-indigo-500" />
                                                {__('Observaciones Físicas Adicionales')}
                                            </h3>
                                        </div>

                                        <Textarea
                                            value={observacionesFisicasInput}
                                            onChange={(e) => setObservacionesFisicasInput(e.target.value)}
                                            rows={6}
                                            placeholder={__('Anotar rayones, raspones, golpes, humedad y demás detalles físicos...')}
                                            className="text-xs border-slate-200 dark:border-slate-800 rounded-xl p-3"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsPreservicioModalOpen(false)}
                                    disabled={isSubmittingPreservicio}
                                    className="text-xs font-bold px-4"
                                >
                                    {__('Cancelar')}
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={isSubmittingPreservicio}
                                    className="text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white px-5 h-10 gap-2 shadow-lg shadow-indigo-200 dark:shadow-none rounded-xl"
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    {isSubmittingPreservicio ? __('Guardando...') : __('Guardar e Iniciar Preservicio')}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL PROCESO DE POST-ATENCIÓN & VALIDACIÓN FINAL */}
                <Dialog open={isPostServicioModalOpen} onOpenChange={setIsPostServicioModalOpen}>
                    <DialogContent className="w-[96vw] sm:max-w-[96vw] md:max-w-[92vw] h-[92vh] max-h-[92vh] p-0 flex flex-col overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <DialogHeader className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white shrink-0 border-b border-emerald-900/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                                            {__('Post-Atención, Validación Final & Control de Calidad')}
                                        </DialogTitle>
                                        <p className="text-xs text-emerald-200/80">
                                            {orden.numero_orden} • {orden.marca_nombre} {orden.modelo_nombre} ({orden.cliente_nombre})
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                                        {[
                                            { id: 'validacion', label: __('1. Validación Final (24)'), icon: '⚡' },
                                            { id: 'limpieza_qc', label: __('2. Limpieza & QC'), icon: '✨' },
                                            { id: 'fotos_obs', label: __('3. Fotos & Notas'), icon: '📸' },
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setPostModalTab(tab.id as any)}
                                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                                    postModalTab === tab.id
                                                        ? 'bg-emerald-600 text-white shadow-xs'
                                                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                                }`}
                                            >
                                                <span>{tab.icon}</span>
                                                <span>{tab.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsPostServicioModalOpen(false)}
                                        className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </DialogHeader>

                        <form onSubmit={handleSavePostServicio} className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* PESTAÑA 1: VALIDACIÓN FINAL DE 24 FUNCIONES */}
                                {postModalTab === 'validacion' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                            <div>
                                                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">1</span>
                                                    {__('Validación Final de Funciones (24 Puntos de Control)')}
                                                </h3>
                                                <p className="text-xs text-slate-500">
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
                                                }}
                                                className="text-xs font-bold bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 gap-1 rounded-xl"
                                            >
                                                ✨ {__('Marcar Todos Correctos')}
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {FUNCIONES_VALIDACION_FINAL.map((fn) => {
                                                const current = validacionFinalState[fn] || { estado: 'correcto', obs: '' };
                                                const isOk = current.estado === 'correcto';
                                                return (
                                                    <div
                                                        key={fn}
                                                        className={`p-3 rounded-2xl border transition-all space-y-2 ${
                                                            !isOk
                                                                ? 'border-rose-300 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs'
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
                                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
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
                                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
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
                                    </div>
                                )}

                                {/* PESTAÑA 2: LIMPIEZA FINAL Y CONTROL DE CALIDAD */}
                                {postModalTab === 'limpieza_qc' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* LIMPIEZA FINAL */}
                                        <div className="space-y-4">
                                            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                                                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-emerald-500" />
                                                    {__('Limpieza Final (5 Puntos)')}
                                                </h3>
                                            </div>

                                            <div className="space-y-3">
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
                                                                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
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
                                                                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
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
                                            </div>
                                        </div>

                                        {/* CONTROL DE CALIDAD (6 PUNTOS) */}
                                        <div className="space-y-4">
                                            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                                                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                                    {__('Control de Calidad (6 Verificaciones)')}
                                                </h3>
                                            </div>

                                            <div className="space-y-2.5">
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
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PESTAÑA 3: FOTOS POST-REPARACIÓN & OBSERVACIONES FINALES */}
                                {postModalTab === 'fotos_obs' && (
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                                                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    <Camera className="w-4 h-4 text-emerald-500" />
                                                    {__('Evidencias Fotográficas Post-Reparación (5 Ángulos)')}
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    {__('Cargue la foto del teléfono reparado y los 4 ángulos de inspección final (Frontal, Trasero, Lat. Izquierdo, Lat. Derecho).')}
                                                </p>
                                            </div>

                                            {/* Tarjeta principal: Foto del Teléfono Reparado (Resultado) */}
                                            {(() => {
                                                const mainSlot = FOTOS_POST_REPARACION_ANGULOS[0];
                                                const mainImgUrl = fotosPostState[mainSlot.key];
                                                return (
                                                    <div className="p-4 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xl">{mainSlot.icon}</span>
                                                                <div>
                                                                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">{mainSlot.label}</h4>
                                                                    <p className="text-[11px] text-slate-500">{mainSlot.desc}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {mainImgUrl ? (
                                                            <div className="relative rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800 bg-black max-h-60 flex items-center justify-center group shadow-md">
                                                                <img src={mainImgUrl} alt={mainSlot.label} className="max-h-60 w-auto object-contain" />
                                                                <div className="absolute bottom-2 right-2 flex items-center gap-2 bg-black/60 p-1 rounded-xl backdrop-blur-sm">
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        onClick={() => startPostCameraStream(mainSlot.key, mainSlot.label)}
                                                                        className="h-7 px-2.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                                                    >
                                                                        <Camera className="w-3 h-3" />
                                                                        {__('Recapturar')}
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => handleRemoveFotoPost(mainSlot.key)}
                                                                        className="h-7 w-7 p-0"
                                                                        title={__('Eliminar foto')}
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-36 rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-3 gap-2">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={() => startPostCameraStream(mainSlot.key, mainSlot.label)}
                                                                    className="h-9 px-6 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm rounded-xl"
                                                                >
                                                                    <Camera className="w-4 h-4" />
                                                                    {__('Tomar con Cámara')}
                                                                </Button>

                                                                <label className="text-center cursor-pointer">
                                                                    <span className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center gap-1.5">
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                {FOTOS_POST_REPARACION_ANGULOS.slice(1).map((slot) => {
                                                    const imgUrl = fotosPostState[slot.key];
                                                    return (
                                                        <div key={slot.key} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2 shadow-xs">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-1.5 truncate">
                                                                    <span>{slot.icon}</span>
                                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{slot.label}</span>
                                                                </div>
                                                            </div>

                                                            {imgUrl ? (
                                                                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black aspect-video group shadow-xs">
                                                                    <img src={imgUrl} alt={slot.label} className="w-full h-full object-cover" />
                                                                    <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-black/60 p-1 rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all">
                                                                        <Button
                                                                            type="button"
                                                                            size="sm"
                                                                            onClick={() => startPostCameraStream(slot.key, slot.label)}
                                                                            className="h-6 px-2 text-[9px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                                                        >
                                                                            <Camera className="w-2.5 h-2.5" />
                                                                            {__('Recapturar')}
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            size="sm"
                                                                            variant="destructive"
                                                                            onClick={() => handleRemoveFotoPost(slot.key)}
                                                                            className="h-6 w-6 p-0"
                                                                            title={__('Eliminar foto')}
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="w-full h-28 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-2 gap-1.5">
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        onClick={() => startPostCameraStream(slot.key, slot.label)}
                                                                        className="w-full h-8 text-[11px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm rounded-lg"
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
                                        </div>

                                        <div className="space-y-3">
                                            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                                                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-emerald-500" />
                                                    {__('Observaciones Finales de Entrega')}
                                                </h3>
                                            </div>

                                            <Textarea
                                                value={observacionesFinalesInput}
                                                onChange={(e) => setObservacionesFinalesInput(e.target.value)}
                                                rows={3}
                                                placeholder={__('Anotar detalles adicionales sobre el equipo reparado, recomendaciones para el cliente o detalles de garantía...')}
                                                className="text-xs border-slate-200 dark:border-slate-800 rounded-xl p-3"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsPostServicioModalOpen(false)}
                                    disabled={isSubmittingPostServicio}
                                    className="text-xs font-bold px-4"
                                >
                                    {__('Cancelar')}
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={isSubmittingPostServicio}
                                    className="text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white px-5 h-10 gap-2 shadow-lg shadow-emerald-200 dark:shadow-none rounded-xl"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    {isSubmittingPostServicio ? __('Guardando...') : __('Guardar Validación Final & Post-Atención')}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* CÁMARA EN VIVO WEBCAM POST-REPARACIÓN (OVERLAY CUSTOM SIN DISMISS DE MODAL PADRE) */}
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
                                                id="post-camera-video"
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
