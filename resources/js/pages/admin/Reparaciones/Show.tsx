import { Head, useForm, router, Link, usePage } from '@inertiajs/react';
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
    Search,
    Pencil,
    Info,
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from '@/components/qr-code-svg';
import { BarcodeSVG } from '@/components/barcode-svg';
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
import { compressImage } from '@/utils/imageOptimizer';
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
    marca_id?: number;
    marca_nombre: string;
    modelo_id?: number;
    modelo_nombre: string;
    color?: string;
    imei_serie?: string;
    descripcion_falla: string;
    observaciones_fisicas?: string;
    accesorios_incluidos?: string;
    contrasena_patron?: string;
    inspeccion_json?: any;
    post_servicio_json?: any;
    estado_orden: string;
    costo_mano_obra: number;
    costo_repuestos: number;
    costo_estimado: number;
    anticipo: number;
    saldo_restante: number;
    garantia_dias: number;
    fecha_recepcion: string;
    fecha_prometida?: string;
    fecha_estimada_entrega?: string;
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

interface MarcaItem {
    id: number;
    nombre: string;
    modelos?: { id: number; nombre_comercial: string; codigo_modelo?: string }[];
}

interface CategoriaItem {
    id: number;
    nombre: string;
}

interface Props {
    orden: Orden;
    empresa?: any;
    productosRepuestos: ProductoRepuesto[];
    tecnicos: { id: number; name: string }[];
    currencySymbol: string;
    marcas?: MarcaItem[];
    categorias?: CategoriaItem[];
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

function PrintablePatternLock({ pattern = [] }: { pattern: number[] }) {
    if (!pattern || pattern.length === 0) return null;
    return (
        <div className="flex flex-col items-center my-1.5 text-center">
            <div className="text-[9px] font-bold uppercase mb-0.5">GRÁFICA DEL PATRÓN DE DESBLOQUEO</div>
            <svg width="120" height="120" viewBox="0 0 300 300" className="border border-black bg-white mx-auto">
                {pattern.map((dot, idx) => {
                    if (idx === 0) return null;
                    const prevDot = pattern[idx - 1];
                    const from = DOT_COORDS_VIEW[prevDot];
                    const to = DOT_COORDS_VIEW[dot];
                    if (!from || !to) return null;
                    return (
                        <g key={`print-line-${idx}`}>
                            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="black" strokeWidth="10" strokeLinecap="round" />
                        </g>
                    );
                })}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((dotNum) => {
                    const coord = DOT_COORDS_VIEW[dotNum];
                    const isSelected = pattern.includes(dotNum);
                    const orderIndex = pattern.indexOf(dotNum);
                    return (
                        <g key={`print-dot-${dotNum}`}>
                            <circle cx={coord.x} cy={coord.y} r={isSelected ? 18 : 12} fill={isSelected ? "black" : "white"} stroke="black" strokeWidth="3" />
                            {isSelected && (
                                <text x={coord.x} y={coord.y + 4} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace">
                                    {orderIndex + 1}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
            <div className="text-[9px] font-mono font-bold mt-1">Secuencia: {pattern.join(' - ')}</div>
        </div>
    );
}

const extractPatternNumbers = (str?: string): number[] => {
    if (!str) return [];
    const matches = str.match(/\d/g);
    if (matches && (str.toLowerCase().includes('patrón') || str.toLowerCase().includes('patron') || str.includes('-'))) {
        return matches.map(Number).filter((n) => n >= 1 && n <= 9);
    }
    return [];
};

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

export default function ShowReparacion({ 
    orden, 
    empresa: propEmpresa, 
    productosRepuestos = [], 
    tecnicos = [], 
    clientes = [], 
    marcas = [], 
    categorias = [], 
    currencySymbol 
}: Props) {
    const { __ } = useTranslate();
    const pageProps = usePage<any>().props;
    const empresa = propEmpresa 
        || (orden as any)?.empresa 
        || pageProps.empresa 
        || pageProps.auth?.user?.empresa 
        || (pageProps as any)?.auth?.empresa;

    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printType, setPrintType] = useState<'cliente' | 'tecnico'>('cliente');

    // MODAL DE EDICIÓN / CORRECCIÓN DE DATOS DE LA ORDEN
    const [openEditDatosModal, setOpenEditDatosModal] = useState(false);
    const [editDatosForm, setEditDatosForm] = useState({
        cliente_id: orden.cliente_id ? String(orden.cliente_id) : (orden.cliente?.id ? String(orden.cliente.id) : ''),
        cliente_nombre: orden.cliente_nombre || '',
        cliente_telefono: orden.cliente_telefono || '',
        tipo_dispositivo: orden.tipo_dispositivo || 'Smartphone',
        marca_id: orden.marca_id ? String(orden.marca_id) : (orden.marca?.id ? String(orden.marca.id) : ''),
        marca_nombre: orden.marca_nombre || '',
        modelo_id: orden.modelo_id ? String(orden.modelo_id) : (orden.modelo?.id ? String(orden.modelo.id) : ''),
        modelo_nombre: orden.modelo_nombre || '',
        color: orden.color || '',
        imei_serie: orden.imei_serie || '',
        contrasena_patron: orden.contrasena_patron || '',
        descripcion_falla: orden.descripcion_falla || '',
        observaciones_fisicas: orden.observaciones_fisicas || '',
        tecnico_id: orden.tecnico?.id ? String(orden.tecnico.id) : (orden as any).tecnico_id ? String((orden as any).tecnico_id) : '',
    });
    const [isSavingDatos, setIsSavingDatos] = useState(false);

    const handleOpenEditDatosModal = () => {
        const matchedMarca = marcas.find((m) => 
            (orden.marca_id && m.id === orden.marca_id) || 
            (orden.marca_nombre && m.nombre.toLowerCase() === orden.marca_nombre.toLowerCase())
        );
        const resolvedMarcaId = matchedMarca ? String(matchedMarca.id) : (orden.marca_id ? String(orden.marca_id) : '');

        let resolvedModeloId = orden.modelo_id ? String(orden.modelo_id) : '';
        if (matchedMarca && !resolvedModeloId && orden.modelo_nombre) {
            const matchedMod = matchedMarca.modelos?.find((mod) => 
                mod.nombre_comercial.toLowerCase() === orden.modelo_nombre.toLowerCase()
            );
            if (matchedMod) {
                resolvedModeloId = String(matchedMod.id);
            }
        }

        setEditDatosForm({
            cliente_id: orden.cliente_id ? String(orden.cliente_id) : (orden.cliente?.id ? String(orden.cliente.id) : ''),
            cliente_nombre: orden.cliente_nombre || '',
            cliente_telefono: orden.cliente_telefono || '',
            tipo_dispositivo: orden.tipo_dispositivo || 'Smartphone',
            marca_id: resolvedMarcaId,
            marca_nombre: orden.marca_nombre || '',
            modelo_id: resolvedModeloId,
            modelo_nombre: orden.modelo_nombre || '',
            color: orden.color || '',
            imei_serie: orden.imei_serie || '',
            contrasena_patron: orden.contrasena_patron || '',
            descripcion_falla: orden.descripcion_falla || '',
            observaciones_fisicas: orden.observaciones_fisicas || '',
            tecnico_id: orden.tecnico?.id ? String(orden.tecnico.id) : (orden as any).tecnico_id ? String((orden as any).tecnico_id) : '',
        });
        setOpenEditDatosModal(true);
    };

    const handleSaveEditDatos = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingDatos(true);
        router.post(`/admin/reparaciones/${orden.id}/update-datos`, editDatosForm, {
            onSuccess: () => {
                notifySuccess(__('Datos de la orden actualizados correctamente.'));
                setOpenEditDatosModal(false);
            },
            onError: () => {
                notifyError(__('Error al actualizar los datos de la orden.'));
            },
            onFinish: () => setIsSavingDatos(false),
        });
    };

    // FOTOS Y EVIDENCIAS DE REPARACIÓN EN TALLER (PROCESO TÉCNICO)
    const [openAddFotoModal, setOpenAddFotoModal] = useState(false);
    const [fotoDescripcion, setFotoDescripcion] = useState('');
    const [newFotoDataUrl, setNewFotoDataUrl] = useState<string | null>(null);
    const [isUploadingFoto, setIsUploadingFoto] = useState(false);
    const [isRepairCameraActive, setIsRepairCameraActive] = useState(false);
    const [repairCameraStream, setRepairCameraStream] = useState<MediaStream | null>(null);
    const repairVideoRef = useRef<HTMLVideoElement | null>(null);
    const repairCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedCameraDeviceId, setSelectedCameraDeviceId] = useState<string>('');

    const refreshCameraDevices = async () => {
        try {
            if (!navigator.mediaDevices?.enumerateDevices) return;
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter((d) => d.kind === 'videoinput');
            setAvailableCameras(videoInputs);
            if (videoInputs.length > 0 && !selectedCameraDeviceId) {
                setSelectedCameraDeviceId(videoInputs[0].deviceId);
            }
        } catch (err) {
            console.error('Error enumerating cameras:', err);
        }
    };

    useEffect(() => {
        refreshCameraDevices();
    }, []);

    const startRepairCamera = async (overrideDeviceId?: string) => {
        const targetDeviceId = overrideDeviceId || selectedCameraDeviceId;
        setIsRepairCameraActive(true);
        if (repairCameraStream) {
            repairCameraStream.getTracks().forEach((track) => track.stop());
            setRepairCameraStream(null);
        }
        try {
            const constraints: MediaStreamConstraints = {
                video: targetDeviceId
                    ? { deviceId: { exact: targetDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
                    : { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false,
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setRepairCameraStream(stream);

            setTimeout(async () => {
                await refreshCameraDevices();
                if (repairVideoRef.current) {
                    repairVideoRef.current.srcObject = stream;
                    repairVideoRef.current.play().catch((e) => console.log('Video play error:', e));
                }
            }, 150);
        } catch (err) {
            console.error('Error starting repair camera:', err);
            notifyError(__('No se pudo acceder a la cámara seleccionada. Por favor verifique los permisos o conexiones USB.'));
            setIsRepairCameraActive(false);
        }
    };

    const stopRepairCamera = () => {
        if (repairCameraStream) {
            repairCameraStream.getTracks().forEach((track) => track.stop());
            setRepairCameraStream(null);
        }
        setIsRepairCameraActive(false);
    };

    const captureRepairSnapshot = () => {
        if (repairVideoRef.current && repairCanvasRef.current) {
            const video = repairVideoRef.current;
            const canvas = repairCanvasRef.current;
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                setNewFotoDataUrl(dataUrl);
                stopRepairCamera();
            }
        }
    };

    const handleRepairFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const compressedBase64 = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.8 });
            setNewFotoDataUrl(compressedBase64);
        } catch (err) {
            console.error('Error optimizando imagen:', err);
            notifyError(__('Error al procesar la fotografía.'));
        }
    };

    const handleSaveRepairFoto = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFotoDataUrl) {
            notifyError(__('Por favor tome o seleccione una fotografía primero.'));
            return;
        }
        setIsUploadingFoto(true);
        router.post(`/admin/reparaciones/${orden.id}/add-foto`, {
            foto: newFotoDataUrl,
            descripcion: fotoDescripcion || __('Evidencia de reparación en taller'),
        }, {
            onSuccess: () => {
                notifySuccess(__('Foto de reparación guardada exitosamente.'));
                setOpenAddFotoModal(false);
                setNewFotoDataUrl(null);
                setFotoDescripcion('');
                stopRepairCamera();
            },
            onError: () => {
                notifyError(__('Error al guardar la foto.'));
            },
            onFinish: () => setIsUploadingFoto(false),
        });
    };

    const handleDeleteFoto = (fotoId: number) => {
        if (confirm(__('¿Desea eliminar esta evidencia fotográfica?'))) {
            router.delete(`/admin/reparaciones/${orden.id}/fotos/${fotoId}`, {
                onSuccess: () => notifySuccess(__('Foto eliminada.')),
                onError: () => notifyError(__('Error al eliminar la foto.')),
            });
        }
    };

    useEffect(() => {
        const waUrl = pageProps.flash?.whatsapp_url || pageProps.whatsapp_url;
        if (waUrl) {
            window.open(waUrl, '_blank');
        }
    }, [pageProps]);

    const handleExecutePrint = (type: 'cliente' | 'tecnico') => {
        setPrintType(type);
        setIsPrintModalOpen(false);
        setTimeout(() => {
            window.print();
        }, 100);
    };

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

    const rawContrasena = String(orden.contrasena_patron || '');
    const isPatronByString = rawContrasena.toLowerCase().includes('patrón') || rawContrasena.toLowerCase().includes('patron');
    const isSinContrasena = rawContrasena.toLowerCase().includes('sin contraseña') || rawContrasena.toLowerCase().includes('sin contrasena');

    const isPatron = inspeccionData?.tipo_bloqueo === 'patron' || isPatronByString;
    const isSinBloqueo = inspeccionData?.tipo_bloqueo === 'sin_bloqueo' || isSinContrasena || (!orden.contrasena_patron && !inspeccionData);

    const patronDotsFromStr = React.useMemo(() => {
        if (inspeccionData?.patron_dots && Array.isArray(inspeccionData.patron_dots) && inspeccionData.patron_dots.length > 0) {
            return inspeccionData.patron_dots;
        }
        if (isPatronByString) {
            const matches = rawContrasena.match(/\d+/g);
            if (matches) {
                return matches.map(Number).filter((n) => n >= 1 && n <= 9);
            }
        }
        return [];
    }, [inspeccionData, isPatronByString, rawContrasena]);

    const tienePreservicioCompletado = React.useMemo(() => {
        if (!inspeccionData) return false;
        if (inspeccionData.completado === true || inspeccionData.estado === 'completado') return true;
        const keysFuncionales = Object.keys(inspeccionData.pruebas_funcionales || {});
        const keysEsteticas = Object.keys(inspeccionData.revision_estetica || {});
        return keysFuncionales.length > 0 || keysEsteticas.length > 0;
    }, [inspeccionData]);

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
    const [isReporteModalOpen, setIsReporteModalOpen] = useState(false);

    const reporteFotosList = React.useMemo(() => {
        const list: { title: string; url: string; category: string }[] = [];

        if (inspeccionData?.fotos_recepcion) {
            Object.entries(inspeccionData.fotos_recepcion).forEach(([k, v]) => {
                if (v && typeof v === 'string') {
                    const label = k.replace(/_/g, ' ').toUpperCase();
                    list.push({ title: `Recepción: ${label}`, url: v, category: 'Recepción' });
                }
            });
        }

        if (Array.isArray(orden.fotos)) {
            orden.fotos.forEach((f: any) => {
                if (f.url) {
                    const isPost = f.angulo && f.angulo.startsWith('post_');
                    const cat = isPost ? 'Post-Reparación' : 'Proceso de Reparación';
                    const desc = f.descripcion || (f.angulo ? f.angulo.replace(/_/g, ' ') : 'Evidencia Taller');
                    list.push({ title: desc, url: f.url, category: cat });
                }
            });
        }

        if (postServicioData?.fotos_post) {
            if (typeof postServicioData.fotos_post === 'object' && !Array.isArray(postServicioData.fotos_post)) {
                Object.entries(postServicioData.fotos_post).forEach(([k, v]) => {
                    if (v && typeof v === 'string') {
                        const label = k.replace(/_/g, ' ').toUpperCase();
                        if (!list.some((item) => item.url === v)) {
                            list.push({ title: `Post-Atención: ${label}`, url: v, category: 'Post-Reparación' });
                        }
                    }
                });
            }
        }

        return list;
    }, [inspeccionData, orden.fotos, postServicioData]);
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

    // ESTADO E INICIALIZACIÓN PARA FORMULARIO DIRECTO INTERACTIVO DE PRESERVICIO
    const DEFAULT_FISICA_ITEMS = React.useMemo(() => [
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
    ], []);

    const [inspeccionFisicaForm, setInspeccionFisicaForm] = useState<Record<string, { estado: 'bueno' | 'malo' | 'na'; obs: string }>>(() => {
        const existing = inspeccionData?.fisica;
        if (existing !== undefined && existing !== null && typeof existing === 'object') {
            return existing;
        }
        const init: Record<string, { estado: 'bueno' | 'malo' | 'na'; obs: string }> = {};
        DEFAULT_FISICA_ITEMS.forEach((k) => {
            init[k] = { estado: 'bueno', obs: '' };
        });
        return init;
    });

    const [inspeccionEstadoForm, setInspeccionEstadoForm] = useState<Record<string, boolean>>(() => {
        const existing = inspeccionData?.estado;
        if (existing !== undefined && existing !== null && typeof existing === 'object') {
            return existing;
        }
        return {
            enciende: true,
            carga_bateria: true,
            entra_sistema: true,
            tiene_bloqueo: false,
            cliente_proporciona_contrasena: true,
        };
    });

    const [observacionesFisicasForm, setObservacionesFisicasForm] = useState<string>(orden.observaciones_fisicas || '');
    const [openAddCustomItemModal, setOpenAddCustomItemModal] = useState(false);
    const [newCustomItemName, setNewCustomItemName] = useState('');
    const [openAddCustomEstadoModal, setOpenAddCustomEstadoModal] = useState(false);
    const [newCustomEstadoName, setNewCustomEstadoName] = useState('');
    const [isSavingPreservicioInline, setIsSavingPreservicioInline] = useState(false);

    // ESTADO E INICIALIZACIÓN PARA FORMULARIO DIRECTO INTERACTIVO DE POST-ATENCIÓN (VALIDACIÓN FINAL & QC)
    const FUNCIONES_VALIDACION_LIST = React.useMemo(() => [
        'Pantalla / Touch Display',
        'Prueba de Llamadas & Micrófono Audio',
        'Altavoz Principal / Bocina Speaker',
        'Micrófono Inferior de Voz',
        'Conectividad Wi-Fi (Carga/Descarga)',
        'Conectividad Bluetooth',
        'Cámara Frontal & Grabación',
        'Cámara Trasera Principal & Zoom',
        'Botón Físico Power / Bloqueo',
        'Botón Físico Volumen +',
        'Botón Físico Volumen -',
        'Lector de Huella Dactilar Fingerprint',
        'Sensor de Reconocimiento Facial Face ID',
        'Puerto de Carga / USB Data Transfer',
        'Vibrador Interno Haptic Engine',
        'Flash LED / Linterna',
        'Sensor de Proximidad Llamadas',
        'Lector de Tarjeta SIM',
        'Lector de Tarjeta MicroSD',
        'Módulo de Posicionamiento GPS',
        'Sensor Giroscopio & Acelerómetro',
        'Botón Físico Home / Inicio',
        'Puerto / Jack de Audio 3.5mm',
        'Carga Inalámbrica Qi',
    ], []);

    const [validacionFormState, setValidacionFormState] = useState<Record<string, { estado: 'correcto' | 'incorrecto'; obs: string }>>(() => {
        const existing = postServicioData?.validacion;
        if (existing !== undefined && existing !== null && typeof existing === 'object') {
            return existing;
        }
        const init: Record<string, { estado: 'correcto' | 'incorrecto'; obs: string }> = {};
        FUNCIONES_VALIDACION_LIST.forEach((fn) => {
            init[fn] = { estado: 'correcto', obs: '' };
        });
        return init;
    });

    const [limpiezaFormState, setLimpiezaFormState] = useState<Record<string, boolean>>(() => {
        const existing = postServicioData?.limpieza;
        if (existing !== undefined && existing !== null && typeof existing === 'object') {
            return existing;
        }
        const init: Record<string, boolean> = {};
        LIMPIEZA_FINAL_LIST.forEach((item) => {
            init[item] = true;
        });
        return init;
    });

    const [openAddCustomValidacionModal, setOpenAddCustomValidacionModal] = useState(false);
    const [newCustomValidacionName, setNewCustomValidacionName] = useState('');
    const [openAddCustomLimpiezaModal, setOpenAddCustomLimpiezaModal] = useState(false);
    const [newCustomLimpiezaName, setNewCustomLimpiezaName] = useState('');

    const [qcFormState, setQcFormState] = useState<Record<string, boolean>>(() => {
        const existing = postServicioData?.qc || {};
        return {
            reparacion_completada: existing.reparacion_completada ?? true,
            equipo_probado: existing.equipo_probado ?? true,
            equipo_limpio: existing.equipo_limpio ?? true,
            garantia_registrada: existing.garantia_registrada ?? true,
            cliente_notificado: existing.cliente_notificado ?? false,
            equipo_listo_entrega: existing.equipo_listo_entrega ?? true,
        };
    });

    const [observacionesPostInput, setObservacionesPostInput] = useState<string>(postServicioData?.observaciones || '');
    const [isSavingPostInline, setIsSavingPostInline] = useState(false);

    useEffect(() => {
        if (postServicioData?.validacion !== undefined && postServicioData?.validacion !== null && typeof postServicioData.validacion === 'object') {
            setValidacionFormState(postServicioData.validacion);
        }
    }, [postServicioData?.validacion]);

    useEffect(() => {
        if (postServicioData?.limpieza !== undefined && postServicioData?.limpieza !== null && typeof postServicioData.limpieza === 'object') {
            setLimpiezaFormState(postServicioData.limpieza);
        }
    }, [postServicioData?.limpieza]);

    useEffect(() => {
        if (inspeccionData?.fisica !== undefined && inspeccionData?.fisica !== null && typeof inspeccionData.fisica === 'object') {
            setInspeccionFisicaForm(inspeccionData.fisica);
        }
    }, [inspeccionData?.fisica]);

    useEffect(() => {
        if (inspeccionData?.estado !== undefined && inspeccionData?.estado !== null && typeof inspeccionData.estado === 'object') {
            setInspeccionEstadoForm(inspeccionData.estado);
        }
    }, [inspeccionData?.estado]);

    const handleMarkAllValidacionCorrecto = () => {
        setValidacionFormState((prev) => {
            const updated = { ...prev };
            Object.keys(updated).forEach((key) => {
                updated[key] = { estado: 'correcto', obs: '' };
            });
            return updated;
        });
        notifySuccess(__('Todas las funciones fueron marcadas como Correcto 🟢'));
    };

    const handleDeleteValidacionItem = (keyToDelete: string) => {
        setValidacionFormState((prev) => {
            const updated = { ...prev };
            delete updated[keyToDelete];
            return updated;
        });
        notifySuccess(__('Punto de validación eliminado: ') + keyToDelete);
    };

    const handleAddCustomValidacionItem = () => {
        const trimmed = newCustomValidacionName.trim();
        if (!trimmed) return;
        if (!validacionFormState[trimmed]) {
            setValidacionFormState((prev) => ({
                ...prev,
                [trimmed]: { estado: 'correcto', obs: '' },
            }));
            notifySuccess(__('Nuevo punto de validación añadido: ') + trimmed);
        }
        setNewCustomValidacionName('');
        setOpenAddCustomValidacionModal(false);
    };

    const handleDeleteLimpiezaItem = (keyToDelete: string) => {
        setLimpiezaFormState((prev) => {
            const updated = { ...prev };
            delete updated[keyToDelete];
            return updated;
        });
        notifySuccess(__('Paso de limpieza eliminado: ') + keyToDelete);
    };

    const handleAddCustomLimpiezaItem = () => {
        const trimmed = newCustomLimpiezaName.trim();
        if (!trimmed) return;
        if (limpiezaFormState[trimmed] === undefined) {
            setLimpiezaFormState((prev) => ({
                ...prev,
                [trimmed]: true,
            }));
            notifySuccess(__('Nuevo paso de limpieza añadido: ') + trimmed);
        }
        setNewCustomLimpiezaName('');
        setOpenAddCustomLimpiezaModal(false);
    };

    const handleSavePostServicioInline = () => {
        setIsSavingPostInline(true);
        const updatedPostJson = {
            ...(postServicioData || {}),
            validacion: validacionFormState,
            limpieza: limpiezaFormState,
            qc: qcFormState,
            observaciones: observacionesPostInput,
            fecha_validacion: new Date().toISOString(),
        };

        router.post(
            `/admin/reparaciones/${orden.id}/estado`,
            {
                estado_orden: orden.estado_orden,
                post_servicio_json: updatedPostJson,
            },
            {
                onSuccess: () => {
                    notifySuccess(__('Validación post-atención guardada correctamente.'));
                },
                onError: () => {
                    notifyError(__('Ocurrió un error al guardar la validación final.'));
                },
                onFinish: () => setIsSavingPostInline(false),
            }
        );
    };

    const handleAddCustomItem = () => {
        const trimmed = newCustomItemName.trim();
        if (!trimmed) return;
        if (!inspeccionFisicaForm[trimmed]) {
            setInspeccionFisicaForm((prev) => ({
                ...prev,
                [trimmed]: { estado: 'bueno', obs: '' },
            }));
            notifySuccess(__('Nuevo punto de inspección añadido: ') + trimmed);
        }
        setNewCustomItemName('');
        setOpenAddCustomItemModal(false);
    };

    const handleDeleteFisicaItem = (keyToDelete: string) => {
        setInspeccionFisicaForm((prev) => {
            const updated = { ...prev };
            delete updated[keyToDelete];
            return updated;
        });
        notifySuccess(__('Punto de inspección física eliminado: ') + keyToDelete);
    };

    const handleAddCustomEstadoItem = () => {
        const trimmed = newCustomEstadoName.trim();
        if (!trimmed) return;
        if (inspeccionEstadoForm[trimmed] === undefined) {
            setInspeccionEstadoForm((prev) => ({
                ...prev,
                [trimmed]: true,
            }));
            notifySuccess(__('Nuevo punto funcional añadido: ') + trimmed);
        }
        setNewCustomEstadoName('');
        setOpenAddCustomEstadoModal(false);
    };

    const handleDeleteEstadoItem = (keyToDelete: string) => {
        setInspeccionEstadoForm((prev) => {
            const updated = { ...prev };
            delete updated[keyToDelete];
            return updated;
        });
        notifySuccess(__('Punto funcional eliminado: ') + keyToDelete);
    };

    const handleMarkAllFisicaBueno = () => {
        setInspeccionFisicaForm((prev) => {
            const updated = { ...prev };
            Object.keys(updated).forEach((key) => {
                updated[key] = { estado: 'bueno', obs: '' };
            });
            return updated;
        });
        notifySuccess(__('Todos los puntos de inspección fueron marcados como Bueno 🟢'));
    };

    const handleSavePreservicioInline = () => {
        setIsSavingPreservicioInline(true);
        const updatedInspeccionJson = {
            ...(inspeccionData || {}),
            tipo_bloqueo: isPatron ? 'patron' : isSinBloqueo ? 'sin_bloqueo' : 'pin',
            patron_dots: patronDotsFromStr,
            fisica: inspeccionFisicaForm,
            estado: inspeccionEstadoForm,
        };

        router.post(
            `/admin/reparaciones/${orden.id}/estado`,
            {
                estado_orden: orden.estado_orden,
                inspeccion_json: updatedInspeccionJson,
                observaciones_fisicas: observacionesFisicasForm,
            },
            {
                onSuccess: () => {
                    notifySuccess(__('Preservicio e inspección inicial guardados exitosamente.'));
                },
                onError: () => {
                    notifyError(__('No se pudo guardar la inspección de preservicio.'));
                },
                onFinish: () => setIsSavingPreservicioInline(false),
            }
        );
    };

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

    const handleSingleFotoPostUpload = async (slotKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressedBase64 = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.8 });
            setFotosPostState((prev) => ({
                ...prev,
                [slotKey]: compressedBase64,
            }));
            notifySuccess(__('Fotografía cargada correctamente.'));
        } catch (err) {
            console.error('Error optimizando fotografía:', err);
            notifyError(__('Error al procesar la fotografía.'));
        }
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

    const formatFullSpanishDate = (dateStr?: string): string => {
        if (!dateStr) return __('No especificada');
        try {
            const cleanStr = String(dateStr).split('T')[0];
            const parts = cleanStr.split('-');
            if (parts.length === 3) {
                const [year, month, day] = parts.map(Number);
                const d = new Date(year, month - 1, day);
                const dayName = d.toLocaleDateString('es-ES', { weekday: 'long' });
                const monthName = d.toLocaleDateString('es-ES', { month: 'long' });
                const capDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                const capMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                return `${capDay} ${day} de ${capMonth} de ${year}`;
            }
            return dateStr;
        } catch {
            return dateStr || __('No especificada');
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

    // Formulario de Repuesto (Select2 Buscador en tiempo real)
    const [selectedProductoId, setSelectedProductoId] = useState('');
    const [selectedRepuestoNombre, setSelectedRepuestoNombre] = useState('');
    const [searchRepuestoTerm, setSearchRepuestoTerm] = useState('');
    const [isRepuestoDropdownOpen, setIsRepuestoDropdownOpen] = useState(false);
    const [cantidadRepuesto, setCantidadRepuesto] = useState('1');
    const [isSubmittingItem, setIsSubmittingItem] = useState(false);
    const repuestoDropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (repuestoDropdownRef.current && !repuestoDropdownRef.current.contains(event.target as Node)) {
                setIsRepuestoDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Repuestos agrupados por compatibilidad y filtrados por la búsqueda Select2
    const { repuestosCompatibles, otrosRepuestos } = React.useMemo(() => {
        const marcaId = orden.marca_id || orden.marca?.id;
        const modeloId = orden.modelo_id || orden.modelo?.id;
        const term = searchRepuestoTerm.toLowerCase().trim();

        const compatibles: typeof productosRepuestos = [];
        const otros: typeof productosRepuestos = [];

        productosRepuestos.forEach((p) => {
            if (term) {
                const nombreProd = (p.nombre_variante || p.nombre || '').toLowerCase();
                const sku = (p.sku || '').toLowerCase();
                const cod = (p.codigo_barras || '').toLowerCase();
                const marca = (p.marca?.nombre || '').toLowerCase();
                const modelo = (p.modelo?.nombre_comercial || '').toLowerCase();

                if (!nombreProd.includes(term) && !sku.includes(term) && !cod.includes(term) && !marca.includes(term) && !modelo.includes(term)) {
                    return;
                }
            }

            const isMarcaCompat = Boolean(marcaId && p.marca_id === marcaId);
            const isModeloCompat = Boolean(modeloId && p.modelo_id === modeloId);

            if (isMarcaCompat || isModeloCompat) {
                compatibles.push(p);
            } else {
                otros.push(p);
            }
        });

        return { repuestosCompatibles: compatibles, otrosRepuestos: otros };
    }, [productosRepuestos, orden.marca_id, orden.marca, orden.modelo_id, orden.modelo, searchRepuestoTerm]);

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
                    setSelectedRepuestoNombre('');
                    setSearchRepuestoTerm('');
                    setIsRepuestoDropdownOpen(false);
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
        const trackingUrl = `${window.location.origin}/reparacion/consultar?orden=${orden.numero_orden}`;
        const msg = encodeURIComponent(
            `Hola *${clientName}*, le saludamos de Servicio Tecnico.\nInformacion sobre su orden *${orden.numero_orden}* (${deviceName}):\n\n*Estado actual:* *${orden.estado_orden.toUpperCase().replace('_', ' ')}*\n*Presupuesto Total:* *${currencySymbol}${formatNum(orden.costo_estimado)}*\n*Saldo Pendiente:* *${currencySymbol}${formatNum(orden.saldo_restante)}*\n\nConsulte el estado en vivo o apruebe su presupuesto aqui:\n${trackingUrl}`
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

                            <Button size="sm" onClick={handleOpenEditDatosModal} variant="outline" className="h-10 gap-2 text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 border-purple-400/40 text-purple-100">
                                <Pencil className="w-4 h-4 text-purple-300" />
                                {__('Editar Datos')}
                            </Button>

                            <Button size="sm" onClick={() => setIsPrintModalOpen(true)} variant="outline" className="h-10 gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 border-white/20 text-white">
                                <Printer className="w-4 h-4 text-blue-400" />
                                {__('Imprimir Ticket')}
                            </Button>

                            <a
                                href={`/admin/reparaciones/${orden.id}/reporte-pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button
                                    size="sm"
                                    className={cn(
                                        "h-10 gap-2 text-xs font-bold text-white shadow-lg transition-all",
                                        orden.estado_orden === 'reparado' || orden.estado_orden === 'entregado'
                                            ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40 ring-2 ring-emerald-400/50"
                                            : "bg-teal-600 hover:bg-teal-500 shadow-teal-950/40"
                                    )}
                                >
                                    <FileText className="w-4 h-4 text-emerald-100" />
                                    {__('Reporte PDF')}
                                </Button>
                            </a>

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
                                                        <SelectItem key={t.id} value={String(t.id)} className="text-xs font-medium">
                                                            {t.name}
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
                        {tienePreservicioCompletado ? (
                            <Badge className="ml-1 text-[10px] h-4 px-1.5 bg-emerald-500 text-white border-0 font-bold">
                                {__('Completado')}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="ml-1 text-[10px] h-4 px-1.5 text-amber-600 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40">
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
                        {__('Evidencias Fotográficas (Recepción & Taller)')}
                        <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200">
                            {orden.fotos?.length || 0}
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
                    {/* COLUMNA PRINCIPAL */}
                    <div className={cn("space-y-6", activeTab === 'repuestos' ? "lg:col-span-2" : "lg:col-span-3")}>
                        {/* TAB 1: RESUMEN GENERAL (EN EL MISMO ORDEN QUE RECEPCIÓN/CREATE) */}
                        {activeTab === 'general' && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                {/* FILA 1: 4 TARJETAS COMPACTAS (DASHBOARD GRID) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                    {/* 1. DATOS DEL CLIENTE */}
                                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-2.5 px-4">
                                            <CardTitle className="text-xs font-bold flex items-center justify-between text-slate-800 dark:text-slate-200 w-full">
                                                <span className="flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-purple-600" />
                                                    {__('1. Datos del Cliente')}
                                                </span>
                                                <Button variant="ghost" size="sm" onClick={handleOpenEditDatosModal} className="h-6 px-2 text-[11px] text-purple-600 font-bold hover:bg-purple-50 dark:hover:bg-purple-950/50">
                                                    <Pencil className="w-3 h-3 mr-1" />
                                                    {__('Editar')}
                                                </Button>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 text-xs space-y-2.5 flex-1">
                                            <div>
                                                <span className="text-slate-400 block text-[10px] uppercase font-semibold">{__('Nombre')}</span>
                                                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block leading-tight">{clienteNombreDisplay}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[10px] uppercase font-semibold">{__('Teléfono')}</span>
                                                <a
                                                    href={`tel:${clienteTelefonoDisplay}`}
                                                    className="font-mono font-bold text-purple-700 dark:text-purple-300 text-xs flex items-center gap-1.5 hover:underline"
                                                >
                                                    <Phone className="w-3 h-3 text-purple-600" /> {clienteTelefonoDisplay}
                                                </a>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[10px] uppercase font-semibold">{__('Correo')}</span>
                                                <span className="font-medium text-slate-700 dark:text-slate-300 text-xs truncate block">
                                                    {orden.cliente?.email || __('No registrado')}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* 2. DATOS DEL DISPOSITIVO */}
                                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-2.5 px-4">
                                            <CardTitle className="text-xs font-bold flex items-center justify-between text-slate-800 dark:text-slate-200 w-full">
                                                <span className="flex items-center gap-1.5">
                                                    <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                                                    {__('2. Dispositivo')}
                                                </span>
                                                <Badge variant="outline" className="font-mono text-[10px] py-0 px-1.5 bg-purple-50 dark:bg-purple-950 text-purple-700 border-purple-200">
                                                    {orden.tipo_dispositivo || __('Smartphone')}
                                                </Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 text-xs space-y-2.5 flex-1">
                                            <div>
                                                <span className="text-slate-400 block text-[10px] uppercase font-semibold">{__('Marca y Modelo')}</span>
                                                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block leading-tight">
                                                    {marcaNombreDisplay} {modeloNombreDisplay}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[10px] uppercase font-semibold">{__('IMEI / Serie')}</span>
                                                <span className="font-mono font-bold text-purple-700 dark:text-purple-400 text-xs">
                                                    {orden.imei_serie || 'N/A'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[10px] uppercase font-semibold">{__('Color / Estética')}</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                                    {orden.color || __('No especificado')}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* 3. RESUMEN ECONÓMICO */}
                                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-2.5 px-4">
                                            <CardTitle className="text-xs font-bold flex items-center justify-between text-slate-800 dark:text-slate-200 w-full">
                                                <span className="flex items-center gap-1.5">
                                                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                                    {__('3. Presupuesto')}
                                                </span>
                                                <Badge className="bg-emerald-600 text-white font-mono text-[10px] py-0 px-1.5">
                                                    {orden.garantia_dias} {__('días gtía')}
                                                </Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 text-xs space-y-2 flex-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500 text-[11px] font-medium">{__('Total Estimado')}:</span>
                                                <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                                                    {currencySymbol}{formatNum(totalPresupuestoActual)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500 text-[11px] font-medium">{__('Anticipo')}:</span>
                                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                                                    {currencySymbol}{formatNum(anticipoActual)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 dark:border-slate-800">
                                                <span className="text-slate-900 dark:text-slate-100 text-[11px] font-bold">{__('Saldo Restante')}:</span>
                                                <span className="font-mono font-black text-emerald-600 text-sm">
                                                    {currencySymbol}{formatNum(saldoRestanteActual)}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* 4. TALLER, FECHAS Y SEGURIDAD */}
                                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-2.5 px-4">
                                            <CardTitle className="text-xs font-bold flex items-center justify-between text-slate-800 dark:text-slate-200 w-full">
                                                <span className="flex items-center gap-1.5">
                                                    <Wrench className="w-3.5 h-3.5 text-purple-600" />
                                                    {__('4. Taller & Fechas')}
                                                </span>
                                                <Badge variant="outline" className="font-mono text-[10px] py-0 px-1.5">
                                                    {orden.estado_orden.toUpperCase().replace('_', ' ')}
                                                </Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 text-xs space-y-2 flex-1">
                                            <div>
                                                <span className="text-slate-400 block text-[10px] uppercase font-semibold">{__('Técnico')}</span>
                                                <span className="font-bold text-purple-700 dark:text-purple-300 text-xs block truncate">
                                                    {orden.tecnico?.name || __('Sin Asignar')}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-1 text-[11px]">
                                                <div>
                                                    <span className="text-slate-400 block text-[9px] uppercase font-semibold">{__('Recepción')}</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(orden.fecha_recepcion)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block text-[9px] uppercase font-semibold">{__('Entrega')}</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(orden.fecha_prometida || orden.fecha_estimada_entrega)}</span>
                                                </div>
                                            </div>
                                            <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                <span className="text-slate-400 text-[10px] font-semibold">{__('Seguridad')}:</span>
                                                <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                                                    {orden.contrasena_patron || __('Sin contraseña')}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* FILA 2: FALLA REPORTADA Y SERVICIOS REQUERIDOS */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* FALLA REPORTADA Y OBSERVACIONES FÍSICAS */}
                                    <div className="space-y-3">
                                        <div className="p-4 bg-purple-50/80 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900 space-y-1.5 shadow-sm">
                                            <span className="font-extrabold text-purple-900 dark:text-purple-200 block text-xs flex items-center gap-1.5">
                                                <AlertCircle className="w-4 h-4 text-purple-600 shrink-0" />
                                                {__('Falla Reportada por el Cliente:')}
                                            </span>
                                            <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed font-medium">
                                                {orden.descripcion_falla || __('Sin descripción especificada en la recepción.')}
                                            </p>
                                        </div>

                                        {orden.observaciones_fisicas && (
                                            <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 space-y-1 text-xs shadow-sm">
                                                <span className="font-bold block text-[11px] flex items-center gap-1">
                                                    <Info className="w-3.5 h-3.5 text-amber-600" />
                                                    {__('Observaciones Físicas de Recepción:')}
                                                </span>
                                                <p className="font-medium">{orden.observaciones_fisicas}</p>
                                            </div>
                                        )}

                                        {(isPatron || patronDotsFromStr.length > 0) && (
                                            <div className="p-3.5 rounded-xl bg-slate-950 text-white flex items-center justify-between gap-3 shadow-sm">
                                                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                                                    {__('Patrón de Bloqueo:')}
                                                </span>
                                                <PatternLockViewer pattern={patronDotsFromStr} />
                                            </div>
                                        )}
                                    </div>

                                    {/* SERVICIOS DE REPARACIÓN REQUERIDOS */}
                                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-2.5 px-4">
                                            <CardTitle className="text-xs font-bold flex items-center justify-between text-slate-800 dark:text-slate-200">
                                                <span className="flex items-center gap-1.5">
                                                    <Wrench className="w-3.5 h-3.5 text-purple-600" />
                                                    {__('Servicios y Mano de Obra Requerida')}
                                                </span>
                                                <Badge variant="outline" className="font-mono text-purple-700 bg-purple-50 dark:bg-purple-950/50 font-bold border-purple-200 text-[10px] py-0">
                                                    {serviciosItems.length} {serviciosItems.length === 1 ? __('Servicio') : __('Servicios')}
                                                </Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-3 text-xs flex-1">
                                            {serviciosItems.length === 0 ? (
                                                <p className="text-xs text-slate-400 italic text-center py-6">
                                                    {__('No se han registrado conceptos específicos de mano de obra en la recepción.')}
                                                </p>
                                            ) : (
                                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {serviciosItems.map((item) => (
                                                        <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                                                            <div className="space-y-0.5">
                                                                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                                                                    {item.descripcion}
                                                                </span>
                                                                {(item as any).servicio?.categoria?.nombre && (
                                                                    <span className="text-[10px] text-slate-400 block font-medium pl-5">
                                                                        Categoría: {(item as any).servicio.categoria.nombre}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                                                                {currencySymbol}{formatNum(item.precio_venta)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* FILA 3: FOTOS (EVIDENCIAS FOTOGRÁFICAS DE RECEPCIÓN - 4 ÁNGULOS) */}
                                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-2.5 px-4">
                                        <CardTitle className="text-xs font-bold flex items-center justify-between text-slate-800 dark:text-slate-200">
                                            <span className="flex items-center gap-1.5">
                                                <Camera className="w-3.5 h-3.5 text-purple-600" />
                                                {__('FOTOS: Evidencias Fotográficas de Recepción (4 Ángulos)')}
                                            </span>
                                            <Badge variant="outline" className="font-mono text-[10px] py-0">
                                                {orden.fotos?.length || 0} / 4 {__('Fotos')}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {fotoSlots.map((item) => {
                                                const fotoObj = orden.fotos?.find((f: any) => f.angulo === item.key);
                                                const imgUrl = fotoObj ? fotoObj.url : (orden.evidencias_fotos as any)?.[item.key];
                                                return (
                                                    <div key={item.key} className="flex flex-col items-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-center gap-1">
                                                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{item.label}</span>
                                                        {imgUrl ? (
                                                            <div
                                                                onClick={() => setPreviewPhoto({ url: imgUrl, label: item.label })}
                                                                className="w-full h-28 rounded-lg overflow-hidden border border-purple-200 dark:border-purple-900 block group relative cursor-pointer"
                                                            >
                                                                <img src={imgUrl} alt={item.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                    {__('Ampliar')}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-28 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 text-[10px] bg-slate-50 dark:bg-slate-900/40">
                                                                <Camera className="w-4 h-4 text-slate-300 mb-1" />
                                                                <span>{__('Sin Foto')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* PESTAÑA: PRESERVICIO / INSPECCIÓN INICIAL */}
                        {activeTab === 'preservicio' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <Card className="border-indigo-200 dark:border-indigo-900 shadow-sm bg-white dark:bg-slate-900">
                                    <CardHeader className="py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                        <div className="flex items-center justify-between flex-wrap gap-3">
                                            <div className="space-y-0.5">
                                                <CardTitle className="text-base font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                                    <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                                    {__('Ficha de Preservicio e Inspección Inicial')}
                                                </CardTitle>
                                                <p className="text-xs text-slate-500">
                                                    {__('Formulario directo e interactivo de revisión estética (componentes), pruebas funcionales y observaciones.')}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={handleMarkAllFisicaBueno}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 rounded-lg shadow-xs"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    {__('Marcar Todos como Bueno 🟢')}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={handleSavePreservicioInline}
                                                    disabled={isSavingPreservicioInline}
                                                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black gap-1.5 rounded-lg shadow-md"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    {isSavingPreservicioInline ? __('Guardando...') : __('💾 Guardar')}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-6 space-y-8">
                                        {/* 1. INSPECCIÓN FÍSICA Y ESTÉTICA (CON CATÁLOGO Y BOTÓN DE AGREGAR) */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                                <div className="space-y-0.5">
                                                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                        <Smartphone className="w-4 h-4 text-indigo-600" />
                                                        {__('1. Inspección Física y Estética del Dispositivo')}
                                                        <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 text-xs font-mono font-bold">
                                                            {Object.keys(inspeccionFisicaForm).length} {__('Puntos')}
                                                        </Badge>
                                                    </h4>
                                                    <p className="text-xs text-slate-400">
                                                        {__('Seleccione el estado de cada componente e ingrese observaciones específicas en caso de daño.')}
                                                    </p>
                                                </div>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setOpenAddCustomItemModal(true)}
                                                    className="border-indigo-300 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300 hover:bg-indigo-50 font-bold text-xs gap-1.5 rounded-lg"
                                                >
                                                    <Plus className="w-4 h-4 text-indigo-600" />
                                                    {__('➕ Agregar Nuevo Punto de Inspección')}
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {Object.entries(inspeccionFisicaForm).map(([itemKey, itemVal]) => {
                                                    const st = itemVal.estado;
                                                    return (
                                                        <div
                                                            key={itemKey}
                                                            className={cn(
                                                                "p-3.5 rounded-xl border text-xs flex flex-col justify-between space-y-2.5 transition-all shadow-xs",
                                                                st === 'malo'
                                                                    ? "bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900"
                                                                    : st === 'bueno'
                                                                        ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900"
                                                                        : "bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800"
                                                            )}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{itemKey}</span>
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setInspeccionFisicaForm((prev) => ({ ...prev, [itemKey]: { ...prev[itemKey], estado: 'bueno' } }))}
                                                                        className={cn(
                                                                            "px-2 py-1 rounded-md text-[10px] font-bold transition-all",
                                                                            st === 'bueno' ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-300"
                                                                        )}
                                                                    >
                                                                        🟢 Bueno
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setInspeccionFisicaForm((prev) => ({ ...prev, [itemKey]: { ...prev[itemKey], estado: 'malo' } }))}
                                                                        className={cn(
                                                                            "px-2 py-1 rounded-md text-[10px] font-bold transition-all",
                                                                            st === 'malo' ? "bg-rose-600 text-white shadow-xs" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-300"
                                                                        )}
                                                                    >
                                                                        🔴 Dañado
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setInspeccionFisicaForm((prev) => ({ ...prev, [itemKey]: { ...prev[itemKey], estado: 'na' } }))}
                                                                        className={cn(
                                                                            "px-2 py-1 rounded-md text-[10px] font-bold transition-all",
                                                                            st === 'na' ? "bg-slate-700 text-white shadow-xs" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-300"
                                                                        )}
                                                                    >
                                                                        ⚪ N/A
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteFisicaItem(itemKey)}
                                                                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors ml-1"
                                                                        title={__('Eliminar este punto de inspección')}
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {st === 'malo' && (
                                                                <Input
                                                                    type="text"
                                                                    placeholder={__('Escriba observación del daño (ej. Botón roto, pintura desgastada...)')}
                                                                    value={itemVal.obs}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        setInspeccionFisicaForm((prev) => ({
                                                                            ...prev,
                                                                            [itemKey]: { ...prev[itemKey], obs: val },
                                                                        }));
                                                                    }}
                                                                    className="h-8 text-xs bg-white dark:bg-slate-950 border-rose-200 text-rose-900 dark:text-rose-100 placeholder:text-rose-300"
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* 2. ESTADO FUNCIONAL INICIAL */}
                                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <div className="space-y-0.5">
                                                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                        <Activity className="w-4 h-4 text-indigo-600" />
                                                        {__('2. Estado Funcional Inicial')}
                                                        <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 text-xs font-mono font-bold">
                                                            {Object.keys(inspeccionEstadoForm).length} {__('Pruebas')}
                                                        </Badge>
                                                    </h4>
                                                    <p className="text-xs text-slate-400">
                                                        {__('Pruebas electrónicas iniciales antes de la intervención técnica.')}
                                                    </p>
                                                </div>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setOpenAddCustomEstadoModal(true)}
                                                    className="border-indigo-300 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300 hover:bg-indigo-50 font-bold text-xs gap-1.5 rounded-lg"
                                                >
                                                    <Plus className="w-4 h-4 text-indigo-600" />
                                                    {__('➕ Agregar Punto Funcional')}
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                                {Object.entries(inspeccionEstadoForm).map(([key, isOk]) => {
                                                    const labelMap: Record<string, string> = {
                                                        enciende: 'Enciende',
                                                        carga_bateria: 'Carga batería',
                                                        entra_sistema: 'Entra al sistema',
                                                        tiene_bloqueo: 'Tiene bloqueo',
                                                        cliente_proporciona_contrasena: 'Proporciona clave',
                                                    };
                                                    const labelDisplay = labelMap[key] || key;

                                                    return (
                                                        <div
                                                            key={key}
                                                            onClick={() => setInspeccionEstadoForm((prev) => ({ ...prev, [key]: !prev[key] }))}
                                                            className={cn(
                                                                "p-3 rounded-xl border text-xs flex items-center justify-between font-bold cursor-pointer transition-all shadow-xs select-none",
                                                                isOk
                                                                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/80"
                                                                    : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-900 dark:text-rose-200 hover:bg-rose-100/80"
                                                            )}
                                                        >
                                                            <span className="truncate pr-1">{labelDisplay}</span>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <Badge className={cn("text-[10px] font-extrabold px-2 py-0.5", isOk ? "bg-emerald-600 text-white" : "bg-rose-600 text-white")}>
                                                                    {isOk ? '✅ Sí' : '❌ No'}
                                                                </Badge>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteEstadoItem(key);
                                                                    }}
                                                                    className="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-100/50 transition-colors"
                                                                    title={__('Eliminar este punto funcional')}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* 3. OBSERVACIONES FÍSICAS Y ADICIONALES */}
                                        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <div className="space-y-0.5">
                                                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-indigo-600" />
                                                    {__('3. Observaciones Físicas y Notas Adicionales')}
                                                </h4>
                                                <p className="text-xs text-slate-400">
                                                    {__('Comentarios generales sobre el estado estético o detalles acordados con el cliente.')}
                                                </p>
                                            </div>

                                            <Textarea
                                                rows={3}
                                                placeholder={__('Escriba cualquier detalle o rasguño adicional previo a la reparación...')}
                                                value={observacionesFisicasForm}
                                                onChange={(e) => setObservacionesFisicasForm(e.target.value)}
                                                className="text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:bg-white"
                                            />
                                        </div>

                                        {/* BOTÓN DE GUARDADO */}
                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                            <Button
                                                type="button"
                                                onClick={handleSavePreservicioInline}
                                                disabled={isSavingPreservicioInline}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 h-11 gap-2 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none"
                                            >
                                                <Save className="w-4 h-4" />
                                                {isSavingPreservicioInline ? __('Guardando Preservicio...') : __('💾 Guardar Cambios de Preservicio')}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* PESTAÑA: POST-ATENCIÓN / VALIDACIÓN FINAL & CONTROL DE CALIDAD */}
                        {activeTab === 'postservicio' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <Card className="border-emerald-200 dark:border-emerald-900 shadow-sm bg-white dark:bg-slate-900">
                                    <CardHeader className="py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                        <div className="flex items-center justify-between flex-wrap gap-3">
                                            <div className="space-y-0.5">
                                                <CardTitle className="text-base font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                    {__('Ficha de Validación Final & Post-Atención')}
                                                </CardTitle>
                                                <p className="text-xs text-slate-500">
                                                    {__('Formulario directo e interactivo de validación de 24 funciones electrónicas, protocolo de limpieza y fotos finales.')}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={handleMarkAllValidacionCorrecto}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 rounded-lg shadow-xs"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    {__('Marcar Todos como Correctos 🟢')}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={handleSavePostServicioInline}
                                                    disabled={isSavingPostInline}
                                                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black gap-1.5 rounded-lg shadow-md"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    {isSavingPostInline ? __('Guardando...') : __('💾 Guardar Cambios en BD')}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-6 space-y-8">
                                        {/* 1. VALIDACIÓN FINAL (24 FUNCIONES DE CONTROL ELECTRÓNICO) */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                                <div className="space-y-0.5">
                                                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                        <Activity className="w-4 h-4 text-emerald-600" />
                                                        {__('1. Validación Final de Funciones Electrónicas')}
                                                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 text-xs font-mono font-bold">
                                                            {Object.keys(validacionFormState).length} {__('Puntos')}
                                                        </Badge>
                                                    </h4>
                                                    <p className="text-xs text-slate-400">
                                                        {__('Verifique el funcionamiento correcto de cada componente antes de la entrega final.')}
                                                    </p>
                                                </div>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setOpenAddCustomValidacionModal(true)}
                                                    className="border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 font-bold text-xs gap-1.5 rounded-lg"
                                                >
                                                    <Plus className="w-4 h-4 text-emerald-600" />
                                                    {__('➕ Agregar Punto de Validación')}
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                                {Object.entries(validacionFormState).map(([fnKey, fnVal]) => {
                                                    const isOk = fnVal.estado === 'correcto';
                                                    return (
                                                        <div
                                                            key={fnKey}
                                                            className={cn(
                                                                "p-3 rounded-xl border text-xs flex flex-col justify-between space-y-2 transition-all shadow-xs",
                                                                isOk
                                                                    ? "bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900"
                                                                    : "bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900"
                                                            )}
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">{fnKey}</span>
                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setValidacionFormState((prev) => ({ ...prev, [fnKey]: { ...prev[fnKey], estado: 'correcto' } }))}
                                                                        className={cn(
                                                                            "px-2 py-1 rounded-md text-[10px] font-bold transition-all",
                                                                            isOk ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-300"
                                                                        )}
                                                                    >
                                                                        🟢 Correcto
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setValidacionFormState((prev) => ({ ...prev, [fnKey]: { ...prev[fnKey], estado: 'incorrecto' } }))}
                                                                        className={cn(
                                                                            "px-2 py-1 rounded-md text-[10px] font-bold transition-all",
                                                                            !isOk ? "bg-rose-600 text-white shadow-xs" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-300"
                                                                        )}
                                                                    >
                                                                        🔴 Incorrecto
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteValidacionItem(fnKey)}
                                                                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors ml-1"
                                                                        title={__('Eliminar este punto de validación')}
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {!isOk && (
                                                                <Input
                                                                    type="text"
                                                                    placeholder={__('Escriba observación de la falla o detalle técnico...')}
                                                                    value={fnVal.obs}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        setValidacionFormState((prev) => ({
                                                                            ...prev,
                                                                            [fnKey]: { ...prev[fnKey], obs: val },
                                                                        }));
                                                                    }}
                                                                    className="h-8 text-xs bg-white dark:bg-slate-950 border-rose-200 text-rose-900 dark:text-rose-100 placeholder:text-rose-300"
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* 2. LIMPIEZA FINAL Y CONTROL DE CALIDAD */}
                                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <div className="space-y-0.5">
                                                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-emerald-600" />
                                                    {__('2. Protocolo de Limpieza & Control de Calidad (QC)')}
                                                </h4>
                                                <p className="text-xs text-slate-400">
                                                    {__('Verificación de acabados de limpieza y checklist de liberación.')}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* LIMPIEZA FINAL */}
                                                <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950">
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                                            ✨ Protocolo de Limpieza ({Object.keys(limpiezaFormState).length} Puntos)
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setOpenAddCustomLimpiezaModal(true)}
                                                            className="h-6 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 p-0"
                                                        >
                                                            <Plus className="w-3 h-3 mr-1" />
                                                            {__('+ Agregar Paso')}
                                                        </Button>
                                                    </div>
                                                    {Object.entries(limpiezaFormState).map(([item, isChecked]) => {
                                                        return (
                                                            <div
                                                                key={item}
                                                                onClick={() => setLimpiezaFormState((prev) => ({ ...prev, [item]: !prev[item] }))}
                                                                className={cn(
                                                                    "flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all shadow-xs select-none",
                                                                    isChecked
                                                                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-200"
                                                                        : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-900 dark:text-rose-200"
                                                                )}
                                                            >
                                                                <span className="truncate pr-1">{item}</span>
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <Badge className={cn("text-[10px] font-extrabold px-2 py-0.5", isChecked ? "bg-emerald-600 text-white" : "bg-rose-600 text-white")}>
                                                                        {isChecked ? '✅ Sí' : '❌ No'}
                                                                    </Badge>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteLimpiezaItem(item);
                                                                        }}
                                                                        className="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-100/50 transition-colors"
                                                                        title={__('Eliminar este paso de limpieza')}
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* CONTROL DE CALIDAD QC (6 PUNTOS) */}
                                                <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950">
                                                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                                                        🛡️ Liberación de Calidad (QC 6 Puntos)
                                                    </span>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {CONTROL_CALIDAD_LIST.map((item) => {
                                                            const isChecked = Boolean(qcFormState[item.key]);
                                                            return (
                                                                <div
                                                                    key={item.key}
                                                                    onClick={() => setQcFormState((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                                                                    className={cn(
                                                                        "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all shadow-xs select-none",
                                                                        isChecked
                                                                            ? "bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                                                                            : "bg-slate-100 border-slate-200 text-slate-500"
                                                                    )}
                                                                >
                                                                    <span>{isChecked ? '☑️' : '⬜'}</span>
                                                                    <span>{item.label}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. FOTOS & OBSERVACIONES FINALES */}
                                        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <div className="space-y-0.5">
                                                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-emerald-600" />
                                                    {__('3. Observaciones Finales del Servicio')}
                                                </h4>
                                                <p className="text-xs text-slate-400">
                                                    {__('Comentarios o recomendaciones finales enviadas al cliente o guardadas en la bitácora.')}
                                                </p>
                                            </div>

                                            <Textarea
                                                rows={3}
                                                placeholder={__('Escriba observaciones finales o recomendaciones sobre la reparación efectuada...')}
                                                value={observacionesPostInput}
                                                onChange={(e) => setObservacionesPostInput(e.target.value)}
                                                className="text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:bg-white"
                                            />
                                        </div>

                                        {/* BOTÓN DE GUARDADO POST-SERVICO */}
                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                            <Button
                                                type="button"
                                                onClick={handleSavePostServicioInline}
                                                disabled={isSavingPostInline}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 h-11 gap-2 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none"
                                            >
                                                <Save className="w-4 h-4" />
                                                {isSavingPostInline ? __('Guardando Post-Atención...') : __('💾 Guardar Validación Post-Atención')}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
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
                                    {/* FORMULARIO AGREGAR REPUESTO SELECT2 CON BUSCADOR EN TIEMPO REAL */}
                                    <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <div className="flex-1 w-full relative" ref={repuestoDropdownRef}>
                                            <div className="relative">
                                                <Search className="w-4 h-4 absolute left-3 top-3 text-purple-600 z-10 pointer-events-none" />
                                                <Input
                                                    type="text"
                                                    value={isRepuestoDropdownOpen ? searchRepuestoTerm : (selectedRepuestoNombre || searchRepuestoTerm)}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setSearchRepuestoTerm(val);
                                                        setIsRepuestoDropdownOpen(true);
                                                    }}
                                                    onFocus={() => {
                                                        setIsRepuestoDropdownOpen(true);
                                                    }}
                                                    placeholder={__('Buscar repuesto por SKU, Nombre, Marca, Modelo...')}
                                                    className="text-xs h-10 pl-9 pr-8 bg-white dark:bg-slate-950 border-purple-200 dark:border-purple-900 font-medium"
                                                />
                                                {(selectedProductoId || searchRepuestoTerm) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedProductoId('');
                                                            setSelectedRepuestoNombre('');
                                                            setSearchRepuestoTerm('');
                                                            setIsRepuestoDropdownOpen(false);
                                                        }}
                                                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 z-20"
                                                        title={__('Limpiar búsqueda')}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {isRepuestoDropdownOpen && (
                                                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                                    {/* COMPATIBLES */}
                                                    {repuestosCompatibles.length > 0 && (
                                                        <div className="p-1">
                                                            <div className="px-3 py-1.5 text-[11px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 rounded-lg flex items-center gap-1">
                                                                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                                                {__('🎯 Compatibles con')} {marcaNombreDisplay} {modeloNombreDisplay} ({repuestosCompatibles.length})
                                                            </div>
                                                            {repuestosCompatibles.map((p) => {
                                                                const nombreProd = p.nombre_variante || p.nombre || '';
                                                                const cod = p.sku || p.codigo_barras || '';
                                                                return (
                                                                    <div
                                                                        key={p.id}
                                                                        onClick={() => {
                                                                            setSelectedProductoId(String(p.id));
                                                                            setSelectedRepuestoNombre(`🎯 ${nombreProd} ${cod ? `(${cod})` : ''}`);
                                                                            setSearchRepuestoTerm('');
                                                                            setIsRepuestoDropdownOpen(false);
                                                                        }}
                                                                        className="px-3 py-2 text-xs font-bold text-purple-950 dark:text-purple-100 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer rounded-lg flex items-center justify-between transition-colors mt-0.5"
                                                                    >
                                                                        <div>
                                                                            <span>🎯 {nombreProd}</span>
                                                                            {cod && <span className="text-[10px] text-purple-600 block font-mono">SKU: {cod}</span>}
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <span className="font-mono text-purple-700 dark:text-purple-300">{currencySymbol}{Number(p.precio_venta).toFixed(2)}</span>
                                                                            <span className="text-[10px] text-slate-400 block font-normal">Stock: {p.stock}</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* OTROS REPUESTOS */}
                                                    {otrosRepuestos.length > 0 && (
                                                        <div className="p-1">
                                                            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                                📦 {__('Otros Repuestos de Inventario')} ({otrosRepuestos.length})
                                                            </div>
                                                            {otrosRepuestos.map((p) => {
                                                                const nombreProd = p.nombre_variante || p.nombre || '';
                                                                const cod = p.sku || p.codigo_barras || '';
                                                                const marcaInfo = p.marca?.nombre ? `[${p.marca.nombre}] ` : '';
                                                                return (
                                                                    <div
                                                                        key={p.id}
                                                                        onClick={() => {
                                                                            setSelectedProductoId(String(p.id));
                                                                            setSelectedRepuestoNombre(`${marcaInfo}${nombreProd} ${cod ? `(${cod})` : ''}`);
                                                                            setSearchRepuestoTerm('');
                                                                            setIsRepuestoDropdownOpen(false);
                                                                        }}
                                                                        className="px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer rounded-lg flex items-center justify-between transition-colors mt-0.5"
                                                                    >
                                                                        <div>
                                                                            <span className="font-medium text-slate-900 dark:text-slate-100">{marcaInfo}{nombreProd}</span>
                                                                            {cod && <span className="text-[10px] text-slate-400 block font-mono">SKU: {cod}</span>}
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{currencySymbol}{Number(p.precio_venta).toFixed(2)}</span>
                                                                            <span className="text-[10px] text-slate-400 block font-normal">Stock: {p.stock}</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {repuestosCompatibles.length === 0 && otrosRepuestos.length === 0 && (
                                                        <div className="p-4 text-center text-xs text-slate-400 italic">
                                                            {__('No se encontraron repuestos con el término')} "{searchRepuestoTerm}"
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-full sm:w-24">
                                            <Input
                                                type="number"
                                                min="1"
                                                value={cantidadRepuesto}
                                                onChange={(e) => setCantidadRepuesto(e.target.value)}
                                                placeholder={__('Cant.')}
                                                className="text-xs h-10 text-center font-bold bg-white dark:bg-slate-950"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isSubmittingItem || !selectedProductoId}
                                            className="h-10 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto px-5 gap-1.5 rounded-xl shadow-md shadow-purple-200 dark:shadow-none"
                                        >
                                            <Plus className="w-4 h-4" />
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
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {/* SECCIÓN 1: EVIDENCIAS DE RECEPCIÓN */}
                                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                        <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-800 dark:text-slate-200">
                                            <span className="flex items-center gap-2">
                                                <Camera className="w-4 h-4 text-purple-600" />
                                                {__('Evidencias Fotográficas de Recepción (4 Ángulos)')}
                                            </span>
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {orden.fotos?.filter((f: any) => ['frente', 'trasero', 'borde_sup', 'borde_inf', 'tapa_trasera', 'borde_superior', 'borde_inferior'].includes(f.angulo)).length || 0} / 4 {__('Capturadas')}
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

                                {/* SECCIÓN 2: EVIDENCIAS DE PROCESO DE REPARACIÓN Y TRABAJO TÉCNICO */}
                                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                        <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-800 dark:text-slate-200 w-full">
                                            <span className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-purple-600" />
                                                {__('Evidencias Fotográficas del Trabajo y Proceso Técnico (En Taller)')}
                                            </span>
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setNewFotoDataUrl(null);
                                                    setFotoDescripcion('');
                                                    setOpenAddFotoModal(true);
                                                }}
                                                className="h-8 gap-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                                            >
                                                <Plus className="w-4 h-4" />
                                                {__('Capturar / Subir Foto de Reparación')}
                                            </Button>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5">
                                        {(() => {
                                            const fotosProceso = (orden.fotos || []).filter((f: any) =>
                                                !['frente', 'trasero', 'borde_sup', 'borde_inf', 'tapa_trasera', 'borde_superior', 'borde_inferior'].includes(f.angulo)
                                            );
                                            if (fotosProceso.length === 0) {
                                                return (
                                                    <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 space-y-3">
                                                        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mx-auto">
                                                            <Camera className="w-6 h-6" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                                                {__('Aún no hay fotos del proceso de reparación registradas')}
                                                            </p>
                                                            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                                                                {__('El técnico puede tomar fotos en tiempo real con la cámara o subir evidencias de las piezas reemplazadas, componentes intervenidos o pruebas finalizadas.')}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                setNewFotoDataUrl(null);
                                                                setFotoDescripcion('');
                                                                setOpenAddFotoModal(true);
                                                            }}
                                                            className="h-8 gap-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            {__('Agregar Primera Foto de Reparación')}
                                                        </Button>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {fotosProceso.map((foto: any) => (
                                                        <div key={foto.id} className="flex flex-col p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 gap-2 shadow-sm relative group">
                                                            <div className="flex items-center justify-between">
                                                                <Badge variant="secondary" className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 font-bold">
                                                                    🛠️ {__('Proceso Técnico')}
                                                                </Badge>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteFoto(foto.id)}
                                                                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                                                                    title={__('Eliminar foto')}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>

                                                            <div
                                                                onClick={() => setPreviewPhoto({ url: foto.url, label: foto.descripcion || __('Foto de Reparación') })}
                                                                className="w-full h-48 rounded-xl overflow-hidden border border-purple-100 dark:border-purple-900 block group relative cursor-pointer shadow-inner bg-slate-900"
                                                            >
                                                                <img src={foto.url} alt={foto.descripcion} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 backdrop-blur-[2px]">
                                                                    <Eye className="w-4 h-4" />
                                                                    {__('Ampliar')}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-1 pt-1">
                                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                                                                    {foto.descripcion || __('Sin descripción')}
                                                                </p>
                                                                <span className="text-[10px] text-slate-400 font-mono block">
                                                                    🕒 {formatDate(foto.created_at)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>
                            </div>
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

                    {/* COLUMNA DERECHA: RESUMEN FINANCIERO (SOLO SE MUESTRA EN PESTAÑA DE REPUESTOS) */}
                    {activeTab === 'repuestos' && (
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
                    )}
                </div>

                {/* MODAL AGREGAR NUEVO PUNTO DE INSPECCIÓN CUSTÓMICO */}
                <Dialog open={openAddCustomItemModal} onOpenChange={setOpenAddCustomItemModal}>
                    <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                                <Plus className="w-4 h-4 text-indigo-600" />
                                {__('Agregar Nuevo Punto de Inspección')}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {__('Nombre del Componente o Punto de Revisión')}
                                </Label>
                                <Input
                                    type="text"
                                    placeholder={__('Ej. Bocina Superior, Lector de Huella, Sensor de Proximidad...')}
                                    value={newCustomItemName}
                                    onChange={(e) => setNewCustomItemName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddCustomItem();
                                    }}
                                    className="text-xs"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpenAddCustomItemModal(false)}
                                    className="text-xs font-bold"
                                >
                                    {__('Cancelar')}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleAddCustomItem}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    {__('Agregar Punto')}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* MODAL AGREGAR PUNTO FUNCIONAL PRESERVICIO */}
                <Dialog open={openAddCustomEstadoModal} onOpenChange={setOpenAddCustomEstadoModal}>
                    <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                                <Plus className="w-4 h-4 text-indigo-600" />
                                {__('Agregar Nuevo Punto Funcional')}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {__('Nombre de la Prueba o Componente Electrónico')}
                                </Label>
                                <Input
                                    type="text"
                                    placeholder={__('Ej. Wi-Fi / Bluetooth, Lector SIM, Cámara Frontal, Micrófono...')}
                                    value={newCustomEstadoName}
                                    onChange={(e) => setNewCustomEstadoName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddCustomEstadoItem();
                                    }}
                                    className="text-xs"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpenAddCustomEstadoModal(false)}
                                    className="text-xs font-bold"
                                >
                                    {__('Cancelar')}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleAddCustomEstadoItem}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    {__('Agregar Prueba')}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* MODAL AGREGAR PUNTO DE VALIDACIÓN POST-ATENCIÓN */}
                <Dialog open={openAddCustomValidacionModal} onOpenChange={setOpenAddCustomValidacionModal}>
                    <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                                <Plus className="w-4 h-4 text-emerald-600" />
                                {__('Agregar Punto de Validación Final')}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {__('Nombre del Componente o Prueba de Salida')}
                                </Label>
                                <Input
                                    type="text"
                                    placeholder={__('Ej. Prueba de Carga Rápida, Calibración de Pantalla...')}
                                    value={newCustomValidacionName}
                                    onChange={(e) => setNewCustomValidacionName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddCustomValidacionItem();
                                    }}
                                    className="text-xs"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpenAddCustomValidacionModal(false)}
                                    className="text-xs font-bold"
                                >
                                    {__('Cancelar')}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleAddCustomValidacionItem}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    {__('Agregar Punto')}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* MODAL AGREGAR PASO DE LIMPIEZA POST-ATENCIÓN */}
                <Dialog open={openAddCustomLimpiezaModal} onOpenChange={setOpenAddCustomLimpiezaModal}>
                    <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                                <Plus className="w-4 h-4 text-emerald-600" />
                                {__('Agregar Paso al Protocolo de Limpieza')}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {__('Descripción del Paso o Acabado de Limpieza')}
                                </Label>
                                <Input
                                    type="text"
                                    placeholder={__('Ej. Desinfección UV, Pulido de Cristal, Soplado de Bocina...')}
                                    value={newCustomLimpiezaName}
                                    onChange={(e) => setNewCustomLimpiezaName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddCustomLimpiezaItem();
                                    }}
                                    className="text-xs"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpenAddCustomLimpiezaModal(false)}
                                    className="text-xs font-bold"
                                >
                                    {__('Cancelar')}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleAddCustomLimpiezaItem}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    {__('Agregar Paso')}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

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
                                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${modalTab === tab.id
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
                                                        className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${current.estado === 'malo'
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
                                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${current.estado === 'bueno'
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
                                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${current.estado === 'malo'
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
                                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${current.estado === 'na'
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
                                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isChecked
                                                                ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
                                                                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900'
                                                            }`}
                                                    >
                                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{rev.label}</span>
                                                        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700">
                                                            <button
                                                                type="button"
                                                                onClick={() => setEstadoEquipo((prev) => ({ ...prev, [rev.key]: true }))}
                                                                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${isChecked
                                                                        ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                                    }`}
                                                            >
                                                                {__('Sí')}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEstadoEquipo((prev) => ({ ...prev, [rev.key]: false }))}
                                                                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${!isChecked
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
                                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${postModalTab === tab.id
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
                                                        className={`p-3 rounded-2xl border transition-all space-y-2 ${!isOk
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
                                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${isOk
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
                                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${!isOk
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
                                                            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${isChecked
                                                                    ? 'border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20'
                                                                    : 'border-slate-200 dark:border-slate-800 bg-slate-50'
                                                                }`}
                                                        >
                                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item}</span>
                                                            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-200/70 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setLimpiezaFinalState((prev) => ({ ...prev, [item]: true }))}
                                                                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${isChecked
                                                                            ? 'bg-emerald-600 text-white shadow-xs'
                                                                            : 'text-slate-600 dark:text-slate-400'
                                                                        }`}
                                                                >
                                                                    {__('Sí')}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setLimpiezaFinalState((prev) => ({ ...prev, [item]: false }))}
                                                                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${!isChecked
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
                                                            className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${isChecked
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
                                                onLoadedMetadata={(e) => (e.target as HTMLVideoElement).play().catch(() => { })}
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

                {/* MODAL SELECCIONAR TIPO DE TICKET (CLIENTE O TÉCNICO) */}
                <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
                    <DialogContent className="sm:max-w-2xl p-6 sm:p-8 rounded-2xl">
                        <DialogHeader className="pb-2">
                            <DialogTitle className="flex items-center gap-3 text-xl font-extrabold text-slate-900 dark:text-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Printer className="w-6 h-6" />
                                </div>
                                {__('Imprimir Ticket de Reparación')}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="py-4 space-y-6">
                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                                {__('Seleccione el tipo de comprobante térmico (80mm) que desea generar para esta orden de servicio:')}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* OPCIÓN CLIENTE */}
                                <button
                                    type="button"
                                    onClick={() => handleExecutePrint('cliente')}
                                    className="p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/80 dark:bg-slate-900/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-all text-left group flex flex-col justify-between space-y-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shadow-inner">
                                            <User className="w-7 h-7" />
                                        </div>
                                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 text-xs font-extrabold px-3 py-1">
                                            80mm POS
                                        </Badge>
                                    </div>
                                    <div className="space-y-1.5">
                                        <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                                            {__('Ticket para el Cliente')}
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                            {__('Comprobante oficial de entrega con datos del equipo, servicios contratados, resumen financiero, técnico asignado y datos de seguridad.')}
                                        </p>
                                    </div>
                                </button>

                                {/* OPCIÓN TÉCNICO */}
                                <button
                                    type="button"
                                    onClick={() => handleExecutePrint('tecnico')}
                                    className="p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 bg-slate-50/80 dark:bg-slate-900/60 hover:bg-purple-50/60 dark:hover:bg-purple-950/40 transition-all text-left group flex flex-col justify-between space-y-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform shadow-inner">
                                            <Wrench className="w-7 h-7" />
                                        </div>
                                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 text-xs font-extrabold px-3 py-1">
                                            Con QR Local
                                        </Badge>
                                    </div>
                                    <div className="space-y-1.5">
                                        <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 transition-colors">
                                            {__('Ticket para el Técnico')}
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                            {__('Ficha de trabajo de taller con descripción de la falla, observaciones físicas, patrón 3x3 y Código QR para escanear en móvil.')}
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* PLANTILLA DE IMPRESIÓN OFICIAL TICKET 80MM (REPARACIÓN: CLIENTE O TÉCNICO) */}
                <div id="printable-ticket-reparacion" className="hidden print:block text-black bg-white font-sans p-4 text-xs w-[80mm] max-w-[80mm] mx-auto">
                    <style>{`
                        @media print {
                            * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                color-adjust: exact !important;
                            }
                            body * {
                                visibility: hidden !important;
                            }
                            #printable-ticket-reparacion, #printable-ticket-reparacion * {
                                visibility: visible !important;
                            }
                            #printable-ticket-reparacion {
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 80mm !important;
                                max-width: 80mm !important;
                                margin: 0 !important;
                                padding: 2mm !important;
                                background: white !important;
                                color: black !important;
                                font-family: 'Courier New', Courier, monospace, Arial, sans-serif !important;
                                font-size: 11px !important;
                            }
                            @page {
                                size: 80mm auto;
                                margin: 0;
                            }
                        }
                    `}</style>

                    {printType === 'cliente' ? (
                        /* ================= TICKET PARA EL CLIENTE ================= */
                        <div className="font-mono text-black text-xs leading-tight p-0 bg-white">
                            {/* HEADER EMPRESA CON LOGO */}
                            <div className="text-center mb-1 flex flex-col items-center justify-center">
                                {empresa?.logo || empresa?.logo_mini ? (
                                    <img
                                        src={empresa.logo || empresa.logo_mini}
                                        alt={empresa.razon_social || empresa.nombre_comercial || 'Logo'}
                                        style={{
                                            width: `${Number(empresa?.logo_ticket_size || 200)}px`,
                                            maxWidth: '100%',
                                            height: 'auto',
                                            maxHeight: '160px',
                                        }}
                                        className="mx-auto object-contain mb-1"
                                    />
                                ) : (
                                    <div className="font-black text-base uppercase tracking-tight">{empresa?.nombre_comercial || empresa?.razon_social || 'SERVITEC'}</div>
                                )}
                            </div>

                            {/* DIRECCIÓN Y TELÉFONO CENTRADOS */}
                            {empresa?.direccion && (
                                <div className="text-center font-bold text-[9px] uppercase px-1 leading-snug font-mono">
                                    {empresa.direccion}
                                </div>
                            )}
                            <div className="text-center font-bold text-[10.5px] mt-0.5 font-mono">
                                TEL: {empresa?.telefono || empresa?.whatsapp_phone || 'S/T'}
                            </div>

                            {/* BANNER NEGRO ORDEN N° CON BORDES NEGROS SÓLIDOS */}
                            <div className="bg-black text-white text-center font-black text-sm py-1 my-2 uppercase tracking-wider">
                                ORDEN N° {orden.numero_orden}
                            </div>

                            {/* DATOS DEL CLIENTE */}
                            <div className="text-center font-black text-[11px] uppercase mb-1">
                                DATOS DEL CLIENTE
                            </div>
                            <div className="text-[10px] space-y-0.5 font-bold uppercase px-1">
                                <div>NOMBRE: <span className="font-normal">{clienteNombreDisplay}</span></div>
                                <div>TELEFONO: <span className="font-normal">{clienteTelefonoDisplay}</span></div>
                            </div>

                            {/* DATOS DEL EQUIPO */}
                            <div className="text-center font-black text-[11px] uppercase mt-3 mb-1">
                                DATOS DEL EQUIPO
                            </div>
                            <div className="text-[10px] space-y-0.5 font-bold uppercase px-1">
                                <div>EQUIPO: <span className="font-normal">{marcaNombreDisplay} {modeloNombreDisplay}</span></div>
                                <div>IMEI/SN: <span className="font-normal">{orden.imei_serie || 'nv'}</span></div>
                                <div>OBSERVACIONES: <span className="font-normal">{orden.observaciones_fisicas || 'equipo sin observaciones'}</span></div>
                                <div>REPARACION: <span className="font-normal">{orden.descripcion_falla || (orden.items && orden.items.length > 0 ? orden.items.map((i) => i.descripcion || i.servicio?.nombre || i.producto?.nombre).join(', ') : 'Revisión y diagnóstico')}</span></div>
                                <div>ACCESORIOS: <span className="font-normal">{orden.accesorios_incluidos || 'no deja'}</span></div>
                            </div>

                            {/* BANNER COSTO REPARACION */}
                            <div className="bg-black text-white text-center font-black text-[10px] py-0.5 mt-3 uppercase tracking-wide">
                                COSTO REPARACION
                            </div>
                            <div className="text-[10px] space-y-0.5 py-1 px-1 font-bold">
                                <div className="flex justify-between">
                                    <span>SUBTOTAL =</span>
                                    <span>${formatNum(orden.costo_estimado)} {currencySymbol !== '$' ? currencySymbol : 'MXN'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>ANTICIPO =</span>
                                    <span>${formatNum(orden.anticipo)} {currencySymbol !== '$' ? currencySymbol : 'MXN'}</span>
                                </div>
                                <div className="flex justify-between border-t border-dotted border-black pt-0.5 font-black">
                                    <span>TOTAL =</span>
                                    <span>${formatNum(orden.saldo_restante)} {currencySymbol !== '$' ? currencySymbol : 'MXN'}</span>
                                </div>
                            </div>

                            {/* BANNER FECHA DE RECEPCION */}
                            <div className="bg-black text-white text-center font-black text-[10px] py-0.5 mt-1 uppercase tracking-wide">
                                FECHA DE RECEPCION
                            </div>
                            <div className="text-center text-[10px] font-bold py-1">
                                {formatDate(orden.fecha_recepcion)}
                            </div>

                            {/* BANNER CONTRASEÑA */}
                            <div className="bg-black text-white text-center font-black text-[10px] py-0.5 mt-1 uppercase tracking-wide">
                                CONTRASEÑA
                            </div>
                            <div className="py-2">
                                {extractPatternNumbers(orden.contrasena_patron).length > 0 ? (
                                    <PrintablePatternLock pattern={extractPatternNumbers(orden.contrasena_patron)} />
                                ) : (
                                    <div className="text-center font-bold text-xs py-1">
                                        {orden.contrasena_patron || 'Sin contraseña'}
                                    </div>
                                )}
                            </div>

                            {/* CÓDIGO DE BARRAS Y CÓDIGO DE REPARACIÓN PARA CONSULTA Y BÚSQUEDA */}
                            <div className="text-center py-2.5 flex flex-col items-center">
                                <div className="w-full max-w-[250px] overflow-hidden flex justify-center py-1">
                                    <BarcodeSVG
                                        value={orden.numero_orden}
                                        width={1.6}
                                        height={48}
                                        displayValue={false}
                                    />
                                </div>
                                <div className="text-[10px] font-black uppercase mt-1 font-mono tracking-wider">
                                    CÓDIGO DE REPARACIÓN: {orden.numero_orden}
                                </div>
                                <div className="text-[7.5px] text-gray-700 font-semibold font-mono">
                                    Escanee el código para consultar estado o cobrar en POS
                                </div>
                            </div>

                            {/* TÉRMINOS Y GARANTÍA CON RECUADRO DE FIRMA DE CONFORMIDAD */}
                            <div className="pt-2">
                                <div className="text-[9px] font-bold text-left mb-1 font-mono">
                                    Términos y Condiciones de Garantía:
                                </div>
                                <div className="border-2 border-black h-12 w-full mb-1 bg-white"></div>
                                <div className="text-center font-black text-[10px] uppercase font-mono">
                                    FIRMA DE CONFORMIDAD
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ================= TICKET PARA EL TÉCNICO ================= */
                        <>
                            <div className="text-center font-bold uppercase text-[11px] font-mono bg-black text-white py-0.5">
                                FICHA DE TRABAJO TÉCNICO DE TALLER
                            </div>
                            <div className="flex justify-between text-[10px] font-mono mt-1">
                                <span>ORDEN: <strong>{orden.numero_orden}</strong></span>
                                <span>RECIBIDO: <strong>{formatDate(orden.fecha_recepcion)}</strong></span>
                            </div>
                            <div className="flex justify-between text-[10px] font-mono">
                                <span>CLIENTE: <strong>{clienteNombreDisplay}</strong></span>
                                <span>TEL: <strong>{clienteTelefonoDisplay}</strong></span>
                            </div>
                            <div className="border-b border-black my-1"></div>

                            <div className="text-[10px] font-mono space-y-0.5">
                                <div>EQUIPO: <strong>{marcaNombreDisplay} {modeloNombreDisplay}</strong></div>
                                <div>IMEI/SERIE: <strong>{orden.imei_serie || 'nv'}</strong></div>
                                <div>ENTREGA ESTIMADA: <strong>{formatDate(orden.fecha_prometida || orden.fecha_estimada_entrega) || 'No especificada'}</strong></div>
                                <div>FALLA: <strong>{orden.descripcion_falla}</strong></div>
                                <div>DETALLE TALLER: <strong>{orden.observaciones_fisicas || 'Sin observaciones'}</strong></div>
                                <div>SEGURIDAD: <strong>{orden.contrasena_patron || 'Sin contraseña'}</strong></div>
                            </div>

                            {extractPatternNumbers(orden.contrasena_patron).length > 0 && (
                                <PrintablePatternLock pattern={extractPatternNumbers(orden.contrasena_patron)} />
                            )}

                            <div className="border-b border-dashed border-black my-1.5"></div>

                            {/* CÓDIGO DE BARRAS PARA ESCANEAR */}
                            <div className="text-center pt-1 pb-1 flex flex-col items-center">
                                <div className="w-full max-w-[250px] overflow-hidden flex justify-center py-0.5">
                                    <BarcodeSVG
                                        value={orden.numero_orden}
                                        width={1.6}
                                        height={45}
                                        displayValue={false}
                                    />
                                </div>
                                <div className="text-[8.5px] font-bold uppercase mt-1 font-mono">CÓDIGO DE REPARACIÓN: {orden.numero_orden}</div>
                                <div className="text-[7px] text-gray-600 font-mono">
                                    Escanee para consultar estado o abrir detalle en el sistema
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/* MODAL DIALOG PARA EDITAR/CORREGIR DATOS DE LA ORDEN */}
            <Dialog open={openEditDatosModal} onOpenChange={setOpenEditDatosModal}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                            <Pencil className="w-5 h-5 text-purple-600" />
                            {__('Editar Datos de la Orden (Corrección de Captura)')}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSaveEditDatos} className="space-y-4 py-2 text-xs">
                        {/* SECCIÓN CLIENTE */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl space-y-3 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-purple-700 dark:text-purple-300 block text-xs">1. Datos del Cliente</span>
                                {clientes.length > 0 && (
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        {clientes.length} {__('clientes registrados')}
                                    </span>
                                )}
                            </div>

                            {/* SELECTOR DESPLEGABLE DE CLIENTE */}
                            {clientes.length > 0 && (
                                <div>
                                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{__('Cambiar o Seleccionar Cliente de la Lista')}</Label>
                                    <Select
                                        value={editDatosForm.cliente_id}
                                        onValueChange={(val) => {
                                            const found = clientes.find((c) => String(c.id) === val);
                                            if (found) {
                                                setEditDatosForm({
                                                    ...editDatosForm,
                                                    cliente_id: val,
                                                    cliente_nombre: found.nombre,
                                                    cliente_telefono: found.telefono || editDatosForm.cliente_telefono,
                                                });
                                            } else {
                                                setEditDatosForm({ ...editDatosForm, cliente_id: val });
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="text-xs h-9 mt-1 font-medium bg-white dark:bg-slate-950">
                                            <SelectValue placeholder={editDatosForm.cliente_nombre ? `Cliente: ${editDatosForm.cliente_nombre}` : __('Seleccionar cliente...')}>
                                                {editDatosForm.cliente_nombre ? `${editDatosForm.cliente_nombre}` : __('Seleccionar cliente...')}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {clientes.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                                                    {c.nombre} {c.telefono ? `(${c.telefono})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div>
                                    <Label className="text-xs font-semibold">{__('Nombre del Cliente *')}</Label>
                                    <Input
                                        value={editDatosForm.cliente_nombre}
                                        onChange={(e) => setEditDatosForm({ ...editDatosForm, cliente_nombre: e.target.value })}
                                        className="text-xs h-9 mt-1 font-medium bg-white dark:bg-slate-950"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold">{__('Teléfono de Contacto')}</Label>
                                    <Input
                                        value={editDatosForm.cliente_telefono}
                                        onChange={(e) => setEditDatosForm({ ...editDatosForm, cliente_telefono: e.target.value })}
                                        className="text-xs h-9 mt-1 font-medium bg-white dark:bg-slate-950"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN DISPOSITIVO CON LISTAS DESPLEGABLES */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl space-y-3 border border-slate-100 dark:border-slate-800">
                            <span className="font-bold text-purple-700 dark:text-purple-300 block text-xs">2. Datos del Dispositivo</span>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* TIPO / CATEGORÍA */}
                                <div>
                                    <Label className="text-xs font-semibold">{__('Tipo / Categoría *')}</Label>
                                    <Select
                                        value={editDatosForm.tipo_dispositivo}
                                        onValueChange={(val) => setEditDatosForm({ ...editDatosForm, tipo_dispositivo: val })}
                                    >
                                        <SelectTrigger className="text-xs h-9 mt-1 font-medium bg-white dark:bg-slate-950">
                                            <SelectValue placeholder={__('Seleccionar tipo...')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['Smartphone', 'Tablet', 'Laptop', 'Smartwatch', 'Consola', 'PC Escritorio', 'Otro'].map((tipo) => (
                                                <SelectItem key={tipo} value={tipo} className="text-xs">
                                                    {tipo}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* MARCA DEL EQUIPO */}
                                <div>
                                    <Label className="text-xs font-semibold">{__('Marca del Equipo *')}</Label>
                                    {marcas.length > 0 ? (
                                        <div className="space-y-1 mt-1">
                                            <Select
                                                value={editDatosForm.marca_id}
                                                onValueChange={(val) => {
                                                    const found = marcas.find((m) => String(m.id) === val);
                                                    setEditDatosForm({
                                                        ...editDatosForm,
                                                        marca_id: val,
                                                        marca_nombre: found ? found.nombre : editDatosForm.marca_nombre,
                                                        modelo_id: '',
                                                        modelo_nombre: '',
                                                    });
                                                }}
                                            >
                                                <SelectTrigger className="text-xs h-9 font-medium bg-white dark:bg-slate-950">
                                                    <SelectValue placeholder={editDatosForm.marca_nombre ? `${editDatosForm.marca_nombre}` : __('Seleccionar marca...')}>
                                                        {editDatosForm.marca_nombre ? `${editDatosForm.marca_nombre}` : __('Seleccionar marca...')}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent className="max-h-60">
                                                    {marcas.map((m) => (
                                                        <SelectItem key={m.id} value={String(m.id)} className="text-xs">
                                                            {m.nombre}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <Input
                                            value={editDatosForm.marca_nombre}
                                            onChange={(e) => setEditDatosForm({ ...editDatosForm, marca_nombre: e.target.value })}
                                            placeholder={__('ej: Apple, Samsung, Xiaomi')}
                                            className="text-xs h-9 mt-1 font-medium bg-white dark:bg-slate-950"
                                            required
                                        />
                                    )}
                                </div>

                                {/* MODELO DEL EQUIPO */}
                                <div>
                                    {(() => {
                                        const selectedMarcaForEdit = marcas.find(
                                            (m) => String(m.id) === editDatosForm.marca_id || (editDatosForm.marca_nombre && m.nombre.toLowerCase() === editDatosForm.marca_nombre.toLowerCase())
                                        );
                                        const availableModelosForEdit = selectedMarcaForEdit?.modelos || [];

                                        return (
                                            <div>
                                                <Label className="text-xs font-semibold">{__('Modelo del Equipo *')}</Label>
                                                {availableModelosForEdit.length > 0 ? (
                                                    <div className="space-y-1 mt-1">
                                                        <Select
                                                            value={editDatosForm.modelo_id}
                                                            onValueChange={(val) => {
                                                                const found = availableModelosForEdit.find((mod) => String(mod.id) === val);
                                                                setEditDatosForm({
                                                                    ...editDatosForm,
                                                                    modelo_id: val,
                                                                    modelo_nombre: found ? found.nombre_comercial : editDatosForm.modelo_nombre,
                                                                });
                                                            }}
                                                        >
                                                            <SelectTrigger className="text-xs h-9 font-medium bg-white dark:bg-slate-950">
                                                                <SelectValue placeholder={editDatosForm.modelo_nombre ? `${editDatosForm.modelo_nombre}` : __('Seleccionar de la lista...')}>
                                                                    {editDatosForm.modelo_nombre ? `${editDatosForm.modelo_nombre}` : __('Seleccionar de la lista...')}
                                                                </SelectValue>
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-60">
                                                                {availableModelosForEdit.map((mod) => (
                                                                    <SelectItem key={mod.id} value={String(mod.id)} className="text-xs">
                                                                        {mod.nombre_comercial} {mod.numero_modelo ? `(${mod.numero_modelo})` : ''}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                ) : (
                                                    <Input
                                                        value={editDatosForm.modelo_nombre}
                                                        onChange={(e) => setEditDatosForm({ ...editDatosForm, modelo_nombre: e.target.value })}
                                                        placeholder={__('ej: Galaxy S23, iPhone 14')}
                                                        className="text-xs h-9 mt-1 font-medium bg-white dark:bg-slate-950"
                                                        required
                                                    />
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-xs font-semibold">{__('Color / Estética')}</Label>
                                    <Input
                                        value={editDatosForm.color}
                                        onChange={(e) => setEditDatosForm({ ...editDatosForm, color: e.target.value })}
                                        placeholder={__('ej: Negro, Azul, Rayones leves')}
                                        className="text-xs h-9 mt-1 font-medium bg-white dark:bg-slate-950"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold">{__('IMEI / Serie')}</Label>
                                    <Input
                                        value={editDatosForm.imei_serie}
                                        onChange={(e) => setEditDatosForm({ ...editDatosForm, imei_serie: e.target.value })}
                                        placeholder={__('5 dígitos o número completo')}
                                        className="text-xs h-9 mt-1 font-medium font-mono bg-white dark:bg-slate-950"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold">{__('Clave / Patrón')}</Label>
                                    <Input
                                        value={editDatosForm.contrasena_patron}
                                        onChange={(e) => setEditDatosForm({ ...editDatosForm, contrasena_patron: e.target.value })}
                                        placeholder={__('Sin contraseña, PIN: 1234, etc.')}
                                        className="text-xs h-9 mt-1 font-medium bg-white dark:bg-slate-950"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN FALLA Y ASIGNACIÓN */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl space-y-3 border border-slate-100 dark:border-slate-800">
                            <span className="font-bold text-purple-700 dark:text-purple-300 block text-xs">3. Falla y Asignación</span>
                            <div>
                                <Label className="text-xs font-semibold">{__('Falla Reportada por el Cliente *')}</Label>
                                <Textarea
                                    value={editDatosForm.descripcion_falla}
                                    onChange={(e) => setEditDatosForm({ ...editDatosForm, descripcion_falla: e.target.value })}
                                    rows={2}
                                    className="text-xs mt-1 font-medium"
                                    required
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold">{__('Observaciones Físicas')}</Label>
                                <Textarea
                                    value={editDatosForm.observaciones_fisicas}
                                    onChange={(e) => setEditDatosForm({ ...editDatosForm, observaciones_fisicas: e.target.value })}
                                    rows={2}
                                    className="text-xs mt-1 font-medium"
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold">{__('Técnico Asignado')}</Label>
                                <Select
                                    value={editDatosForm.tecnico_id}
                                    onValueChange={(val) => setEditDatosForm({ ...editDatosForm, tecnico_id: val })}
                                >
                                    <SelectTrigger className="text-xs h-9 mt-1 font-medium">
                                        <SelectValue placeholder={__('Seleccionar técnico...')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tecnicos.map((t) => (
                                            <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Button type="button" variant="outline" size="sm" onClick={() => setOpenEditDatosModal(false)} className="h-8 text-xs">
                                {__('Cancelar')}
                            </Button>
                            <Button type="submit" disabled={isSavingDatos} size="sm" className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white">
                                {isSavingDatos ? __('Guardando...') : __('Guardar Cambios')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
            {/* MODAL PARA AGREGAR / CAPTURAR FOTO DE REPARACIÓN EN TALLER */}
            <Dialog open={openAddFotoModal} onOpenChange={(open) => {
                if (!open) stopRepairCamera();
                setOpenAddFotoModal(open);
            }}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                            <Camera className="w-5 h-5 text-purple-600" />
                            {__('Capturar / Subir Evidencia de Reparación')}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSaveRepairFoto} className="space-y-4 py-2 text-xs">
                        {/* VISOR DE FOTO / VISTA PREVIA O CÁMARA */}
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold">{__('Seleccionar Método de Captura *')}</Label>

                            {/* OPCIONES: CÁMARA O ARCHIVO */}
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant={isRepairCameraActive ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                        setNewFotoDataUrl(null);
                                        startRepairCamera();
                                    }}
                                    className={cn("h-9 text-xs font-bold gap-1.5", isRepairCameraActive && "bg-purple-600 text-white")}
                                >
                                    <Camera className="w-4 h-4" />
                                    {__('Cámara en Vivo')}
                                </Button>

                                <label className="h-9 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                    <Upload className="w-4 h-4 text-purple-600" />
                                    <span>{__('Subir de Galería')}</span>
                                    <input type="file" accept="image/*" onChange={handleRepairFileUpload} className="hidden" />
                                </label>
                            </div>

                            {/* SELECCIONADOR DE CÁMARAS DISPONIBLES / MICROSCOPIOS USB */}
                            <div className="space-y-1.5 bg-slate-900/90 border border-purple-900/50 p-2.5 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                                        <Camera className="w-3.5 h-3.5 text-purple-400" />
                                        {__('Dispositivo de Video / Microscopio USB:')}
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            refreshCameraDevices();
                                            notifySuccess(__('Lista de cámaras actualizada.'));
                                        }}
                                        className="text-[10px] text-purple-400 hover:text-purple-200 font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                        <RefreshCw className="w-3 h-3 text-purple-400" />
                                        {__('Escanear Dispositivos')}
                                    </button>
                                </div>
                                <Select
                                    value={selectedCameraDeviceId}
                                    onValueChange={(val) => {
                                        setSelectedCameraDeviceId(val);
                                        if (isRepairCameraActive) {
                                            startRepairCamera(val);
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-full h-9 text-xs bg-slate-950 border-slate-700 text-white font-medium focus:ring-2 focus:ring-purple-500">
                                        <SelectValue placeholder={__('Seleccionar Cámara / Microscopio...')} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                        {availableCameras.length === 0 ? (
                                            <SelectItem value="default" className="text-xs focus:bg-purple-900/50 focus:text-white">
                                                📷 {__('Cámara Predeterminada del Sistema')}
                                            </SelectItem>
                                        ) : (
                                            availableCameras.map((cam, idx) => (
                                                <SelectItem key={cam.deviceId || idx} value={cam.deviceId} className="text-xs focus:bg-purple-900/50 focus:text-white">
                                                    📷 {cam.label || `${__('Cámara / Microscopio')} ${idx + 1}`}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* CÁMARA EN VIVO WEBCAM */}
                            {isRepairCameraActive && (
                                <div className="space-y-2 border border-purple-200 dark:border-purple-900 p-2 rounded-xl bg-slate-950 text-center">
                                    <video ref={repairVideoRef} className="w-full h-56 rounded-lg object-cover bg-black" autoPlay playsInline muted />
                                    <canvas ref={repairCanvasRef} className="hidden" />
                                    <div className="flex items-center justify-center gap-2 pt-1">
                                        <Button type="button" size="sm" onClick={captureRepairSnapshot} className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                                            <Camera className="w-3.5 h-3.5" />
                                            {__('Tomar Fotografía')}
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" onClick={stopRepairCamera} className="h-8 text-xs text-slate-300 border-slate-700 hover:bg-slate-800">
                                            {__('Cancelar Cámara')}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* VISTA PREVIA DE LA FOTO CAPTURADA / SELECCIONADA */}
                            {newFotoDataUrl && (
                                <div className="relative rounded-xl overflow-hidden border-2 border-purple-500 shadow-md">
                                    <img src={newFotoDataUrl} alt="Vista previa" className="w-full h-56 object-cover bg-slate-900" />
                                    <button
                                        type="button"
                                        onClick={() => setNewFotoDataUrl(null)}
                                        className="absolute top-2 right-2 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700"
                                        title={__('Quitar foto')}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* CAMPO DE DESCRIPCIÓN */}
                        <div>
                            <Label className="text-xs font-semibold">{__('Descripción / Detalle del Trabajo Realizado')}</Label>
                            <Input
                                value={fotoDescripcion}
                                onChange={(e) => setFotoDescripcion(e.target.value)}
                                placeholder={__('ej: Placa madre intervenida, reemplazo de flex de carga, etc.')}
                                className="text-xs h-9 mt-1 font-medium"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Button type="button" variant="outline" size="sm" onClick={() => {
                                stopRepairCamera();
                                setOpenAddFotoModal(false);
                            }} className="h-8 text-xs">
                                {__('Cancelar')}
                            </Button>
                            <Button type="submit" disabled={!newFotoDataUrl || isUploadingFoto} size="sm" className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white">
                                {isUploadingFoto ? __('Guardando...') : __('Guardar Evidencia')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>


        </>
    );
}
