import { Head, useForm, Link, router } from '@inertiajs/react';
import {
    Wrench,
    User,
    Smartphone,
    Laptop,
    Tv,
    Gamepad2,
    ShieldAlert,
    CheckCircle2,
    XCircle,
    MinusCircle,
    Calendar,
    DollarSign,
    Lock,
    FileText,
    ArrowLeft,
    Plus,
    Check,
    Save,
    Sparkles,
    Search,
    ShieldCheck,
    HelpCircle,
    Info,
    Hash,
    Clock,
    UserCheck,
    ChevronRight,
    ChevronLeft,
    Layers,
    Cpu,
    UserPlus,
    X,
    Tag,
    Camera,
    Upload,
    Trash2,
    RefreshCw,
    Calculator,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { compressImage } from '@/utils/imageOptimizer';

interface Cliente {
    id: number;
    nombre: string;
    telefono?: string;
    email?: string;
}

interface ModeloItem {
    id: number;
    nombre_comercial: string;
    codigo_modelo?: string;
    marca_id: number;
}

interface MarcaItem {
    id: number;
    nombre: string;
    modelos: ModeloItem[];
}

interface CategoriaItem {
    id: number;
    nombre: string;
}

interface ServicioItem {
    id: number;
    codigo?: string | null;
    nombre: string;
    precio: number;
    categoria_id?: number | null;
    categoria?: { id: number; nombre: string } | null;
}

interface CartServicio {
    servicio_id?: number;
    nombre: string;
    codigo?: string;
    precio: number;
    cantidad: number;
    subtotal: number;
    categoria_nombre?: string;
}

interface Props {
    clientes: Cliente[];
    marcas: MarcaItem[];
    tecnicos: { id: number; name: string }[];
    categorias?: CategoriaItem[];
    servicios?: ServicioItem[];
    currencySymbol: string;
}

const FOTO_SLOTS = [
    { key: 'frente', label: 'Frente / Pantalla', desc: 'Frontal & Cristal Display' },
    { key: 'trasero', label: 'Tapa Trasera', desc: 'Carcasa & Cámaras' },
    { key: 'borde_sup', label: 'Borde Sup. / Izq.', desc: 'Marco, Botones y Bisel' },
    { key: 'borde_inf', label: 'Borde Inf. / Der.', desc: 'Puerto Carga & Altavoz' },
];

const PATTERN_DOT_COORDS: Record<number, { x: number; y: number }> = {
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

function PatternLockCanvas({
    pattern,
    onChange,
}: {
    pattern: number[];
    onChange: (next: number[]) => void;
}) {
    const { __ } = useTranslate();
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [cursorPoint, setCursorPoint] = useState<{ x: number; y: number } | null>(null);

    const getLocalPoint = (event: React.PointerEvent<SVGSVGElement>) => {
        if (!svgRef.current) return null;
        const rect = svgRef.current.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 300;
        const y = ((event.clientY - rect.top) / rect.height) * 300;
        return { x, y };
    };

    const findNearestDot = (point: { x: number; y: number }) => {
        let bestDot: number | null = null;
        let bestDist = Number.MAX_VALUE;

        for (let dot = 1; dot <= 9; dot++) {
            const coord = PATTERN_DOT_COORDS[dot];
            const dx = point.x - coord.x;
            const dy = point.y - coord.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < bestDist) {
                bestDist = distance;
                bestDot = dot;
            }
        }

        return bestDist <= 28 ? bestDot : null;
    };

    const appendDotIfNeeded = (dot: number | null) => {
        if (!dot || pattern.includes(dot)) return;
        onChange([...pattern, dot]);
    };

    const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
        const point = getLocalPoint(event);
        if (!point) return;

        setIsDrawing(true);
        setCursorPoint(point);
        event.currentTarget.setPointerCapture(event.pointerId);
        appendDotIfNeeded(findNearestDot(point));
    };

    const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
        if (!isDrawing) return;
        const point = getLocalPoint(event);
        if (!point) return;

        setCursorPoint(point);
        appendDotIfNeeded(findNearestDot(point));
    };

    const handlePointerEnd = (event: React.PointerEvent<SVGSVGElement>) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        setIsDrawing(false);
        setCursorPoint(null);
    };

    const lastDot = pattern.length > 0 ? PATTERN_DOT_COORDS[pattern[pattern.length - 1]] : null;

    return (
        <div className="space-y-3 select-none mx-auto w-full max-w-[320px]">
            <div className="flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                    {pattern.length > 0
                        ? `${__('Secuencia')}: ${pattern.join(' - ')}`
                        : __('Mantenga presionado y deslice para dibujar el patrón.')}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onChange([])}
                    className="h-7 text-[11px]"
                >
                    {__('Limpiar patrón')}
                </Button>
            </div>

            <div className="mx-auto inline-block rounded-2xl border border-slate-800 bg-slate-950 p-3 shadow-2xl">
                <svg
                    ref={svgRef}
                    className="w-[240px] h-[240px] touch-none cursor-crosshair"
                    viewBox="0 0 300 300"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerEnd}
                    onPointerCancel={handlePointerEnd}
                    onPointerLeave={handlePointerEnd}
                >
                    {pattern.map((dot, idx) => {
                        if (idx === 0) return null;
                        const prevDot = pattern[idx - 1];
                        const from = PATTERN_DOT_COORDS[prevDot];
                        const to = PATTERN_DOT_COORDS[dot];
                        return (
                            <g key={`line-${idx}`}>
                                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#6366f1" strokeWidth="9" strokeLinecap="round" opacity="0.9" />
                                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#a5b4fc" strokeWidth="4" strokeLinecap="round" />
                            </g>
                        );
                    })}

                    {isDrawing && lastDot && cursorPoint && (
                        <line
                            x1={lastDot.x}
                            y1={lastDot.y}
                            x2={cursorPoint.x}
                            y2={cursorPoint.y}
                            stroke="#818cf8"
                            strokeWidth="3"
                            strokeLinecap="round"
                            opacity="0.8"
                        />
                    )}

                    {Array.from({ length: 9 }, (_, i) => i + 1).map((dot) => {
                        const coord = PATTERN_DOT_COORDS[dot];
                        const selected = pattern.includes(dot);
                        const order = pattern.indexOf(dot) + 1;

                        return (
                            <g key={dot}>
                                <circle
                                    cx={coord.x}
                                    cy={coord.y}
                                    r={selected ? 28 : 20}
                                    fill={selected ? 'rgba(99, 102, 241, 0.28)' : 'rgba(255,255,255,0.07)'}
                                    stroke={selected ? 'rgba(129, 140, 248, 0.55)' : 'rgba(148,163,184,0.2)'}
                                    strokeWidth="2"
                                />
                                <circle
                                    cx={coord.x}
                                    cy={coord.y}
                                    r={13}
                                    fill={selected ? '#6366f1' : '#475569'}
                                    stroke={selected ? '#c7d2fe' : '#334155'}
                                    strokeWidth="3"
                                />
                                {selected ? (
                                    <text
                                        x={coord.x}
                                        y={coord.y + 4}
                                        textAnchor="middle"
                                        fill="#ffffff"
                                        fontSize="12"
                                        fontWeight="900"
                                        fontFamily="monospace"
                                    >
                                        {order}
                                    </text>
                                ) : (
                                    <circle cx={coord.x} cy={coord.y} r={3.5} fill="#cbd5e1" />
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}

export default function CreateReparacion({ clientes: initialClientes, marcas: initialMarcas, tecnicos, categorias = [], servicios: initialServicios = [], currencySymbol }: Props) {
    const { __ } = useTranslate();

    const [clientesList, setClientesList] = useState<Cliente[]>(initialClientes || []);
    const [marcasList, setMarcasList] = useState<MarcaItem[]>(initialMarcas || []);

    // Búsqueda en tiempo real de Tipo de Dispositivo / Categoría (Select2 style)
    const [searchCategoriaTerm, setSearchCategoriaTerm] = useState('');
    const [isCategoriaDropdownOpen, setIsCategoriaDropdownOpen] = useState(false);

    // Búsqueda en tiempo real de Cliente
    const [searchClienteTerm, setSearchClienteTerm] = useState('');
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

    // Búsqueda en tiempo real de Marca (Select2)
    const [selectedMarcaId, setSelectedMarcaId] = useState<string>('');
    const [searchMarcaTerm, setSearchMarcaTerm] = useState('');
    const [isMarcaDropdownOpen, setIsMarcaDropdownOpen] = useState(false);

    // Búsqueda en tiempo real de Modelo (Select2)
    const [modelosFiltrados, setModelosFiltrados] = useState<ModeloItem[]>([]);
    const [searchModeloTerm, setSearchModeloTerm] = useState('');
    const [isModeloDropdownOpen, setIsModeloDropdownOpen] = useState(false);

    // Modal Crear Nuevo Cliente
    const [openNewClientModal, setOpenNewClientModal] = useState(false);
    const [newClientData, setNewClientData] = useState({
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
    });
    const [isCreatingClient, setIsCreatingClient] = useState(false);

    // Modales de Marca y Modelo
    const [openNewMarcaModal, setOpenNewMarcaModal] = useState(false);
    const [newMarcaNombre, setNewMarcaNombre] = useState('');
    const [isCreatingMarca, setIsCreatingMarca] = useState(false);

    const [openNewModeloModal, setOpenNewModeloModal] = useState(false);
    const [newModeloNombre, setNewModeloNombre] = useState('');
    const [newModeloCodigo, setNewModeloCodigo] = useState('');
    const [isCreatingModelo, setIsCreatingModelo] = useState(false);

    // Carrito de Servicios en Tiempo Real
    const [serviciosList, setServiciosList] = useState<ServicioItem[]>(initialServicios || []);
    const [cartServicios, setCartServicios] = useState<CartServicio[]>([]);
    const [searchServicioTerm, setSearchServicioTerm] = useState('');
    const [isServicioDropdownOpen, setIsServicioDropdownOpen] = useState(false);
    const [isCostoEstimadoManual, setIsCostoEstimadoManual] = useState(false);

    // Modal Crear Nuevo Servicio
    const [openNewServicioModal, setOpenNewServicioModal] = useState(false);
    const [newServicioData, setNewServicioData] = useState({
        categoria_id: '',
        nombre: '',
        codigo: '',
        descripcion: '',
        precio: '',
    });
    const [isCreatingServicio, setIsCreatingServicio] = useState(false);

    // 4 Ángulos de Evidencias Fotográficas
    type EvidenciasFotos = {
        frente: string;
        trasero: string;
        borde_sup: string;
        borde_inf: string;
        [key: string]: string;
    };
    const [fotosState, setFotosState] = useState<EvidenciasFotos>({
        frente: '',
        trasero: '',
        borde_sup: '',
        borde_inf: '',
    });

    // Modal & Stream de Cámara en Vivo
    const [activeCameraSlot, setActiveCameraSlot] = useState<string | null>(null);
    const [cameraSlotLabel, setCameraSlotLabel] = useState<string>('');
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCameraLoading, setIsCameraLoading] = useState<boolean>(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');

    // Estado e Historial de IMEI
    const [imeiHistoryData, setImeiHistoryData] = useState<{
        count: number;
        ultimaOrden: any;
        ordenes: any[];
    } | null>(null);
    const [isCheckingImei, setIsCheckingImei] = useState(false);

    // Seguridad del Dispositivo (3 Opciones: Sin contraseña, PIN/Contraseña unificados, Patrón 3x3)
    const [tipoSeguridad, setTipoSeguridad] = useState<'sin_contrasena' | 'pin_contrasena' | 'patron'>('sin_contrasena');
    const [claveSeguridad, setClaveSeguridad] = useState('');
    const [patronSecuencia, setPatronSecuencia] = useState<number[]>([]);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const categoriaRef = useRef<HTMLDivElement | null>(null);
    const marcaRef = useRef<HTMLDivElement | null>(null);
    const modeloRef = useRef<HTMLDivElement | null>(null);
    const clienteRef = useRef<HTMLDivElement | null>(null);
    const servicioRef = useRef<HTMLDivElement | null>(null);

    const stopCameraStream = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach((track) => track.stop());
            setCameraStream(null);
        }
        setActiveCameraSlot(null);
        setCapturedImage(null);
        setCameraError(null);
    };

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

    const startCameraStream = async (slotKey: string, slotLabel: string, overrideDeviceId?: string) => {
        const targetDeviceId = overrideDeviceId || selectedCameraDeviceId;
        setActiveCameraSlot(slotKey);
        setCameraSlotLabel(slotLabel);
        setCapturedImage(null);
        setCameraError(null);
        setIsCameraLoading(true);

        if (cameraStream) {
            cameraStream.getTracks().forEach((track) => track.stop());
            setCameraStream(null);
        }

        try {
            const constraints: MediaStreamConstraints = {
                video: targetDeviceId
                    ? { deviceId: { exact: targetDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
                    : { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false,
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setCameraStream(stream);

            setTimeout(async () => {
                await refreshCameraDevices();
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch((e) => console.log('Video play error:', e));
                }
            }, 150);
        } catch (err: any) {
            console.error('Camera access error:', err);
            setCameraError(__('No se pudo acceder a la cámara seleccionada. Por favor verifique la conexión USB o permisos.'));
        } finally {
            setIsCameraLoading(false);
        }
    };

    useEffect(() => {
        if (cameraStream && videoRef.current && !capturedImage) {
            videoRef.current.srcObject = cameraStream;
            videoRef.current.play().catch((e) => console.log('Video play error:', e));
        }
    }, [cameraStream, capturedImage]);

    const handleCaptureSnapshot = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            let width = video.videoWidth || 1280;
            let height = video.videoHeight || 720;
            const maxDim = 1024;
            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(video, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
                setCapturedImage(dataUrl);
            }
        }
    };

    const handleAcceptCapturedPhoto = async () => {
        if (capturedImage && activeCameraSlot) {
            try {
                const compressed = await compressImage(capturedImage, { maxWidth: 1024, maxHeight: 1024, quality: 0.75 });
                setFotosState((prev) => {
                    const next = { ...prev, [activeCameraSlot]: compressed };
                    setData('evidencias_fotos', next as any);
                    return next;
                });
                notifySuccess(__('Fotografía capturada y guardada.'));
                stopCameraStream();
            } catch (err) {
                console.error('Error al optimizar foto capturada:', err);
            }
        }
    };

    const handleRetakeSnapshot = () => {
        setCapturedImage(null);
        if (videoRef.current && cameraStream) {
            videoRef.current.srcObject = cameraStream;
            videoRef.current.play();
        }
    };

    const toggleFacingMode = () => {
        const nextMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
        setCameraFacingMode(nextMode);
        if (activeCameraSlot) {
            startCameraStream(activeCameraSlot, cameraSlotLabel, nextMode);
        }
    };

    // Búsqueda en tiempo real de historial por IMEI / Número de Serie
    const handleImeiChange = (val: string) => {
        setData('imei_serie', val);

        const cleanVal = val.trim();
        if (!cleanVal || cleanVal.length < 3) {
            setImeiHistoryData(null);
            return;
        }

        if ((window as any)._imeiDebounceTimer) {
            clearTimeout((window as any)._imeiDebounceTimer);
        }
        (window as any)._imeiDebounceTimer = setTimeout(async () => {
            setIsCheckingImei(true);
            try {
                const res = await postJson('/admin/reparaciones/check-imei', { imei: cleanVal });
                if (res.success && res.count > 0) {
                    setImeiHistoryData(res);
                } else {
                    setImeiHistoryData(null);
                }
            } catch (err) {
                console.error('Error al verificar IMEI/Serie:', err);
            } finally {
                setIsCheckingImei(false);
            }
        }, 400);
    };

    const handleFotoUpload = async (slotKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressedBase64 = await compressImage(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.75 });
            setFotosState((prev) => {
                const next = { ...prev, [slotKey]: compressedBase64 };
                setData('evidencias_fotos', next as any);
                return next;
            });
            notifySuccess(__('Fotografía cargada correctamente.'));
        } catch (err) {
            console.error('Error al procesar la fotografía:', err);
            notifyError(__('Error al procesar la fotografía.'));
        }
    };

    const handleRemoveFoto = (slotKey: string) => {
        setFotosState((prev) => {
            const next = { ...prev, [slotKey]: '' };
            setData('evidencias_fotos', next as any);
            return next;
        });
    };

    const { data, setData, post, processing, errors, transform } = useForm({
        cliente_id: '',
        cliente_nombre: '',
        cliente_telefono: '',
        tipo_dispositivo: '',
        marca_id: '',
        marca_nombre: '',
        modelo_id: '',
        modelo_nombre: '',
        color: '',
        imei_serie: '',
        contrasena_patron: '',
        descripcion_falla: '',
        observaciones_fisicas: '',
        tecnico_id: '',
        costo_estimado: '0',
        anticipo: '0',
        garantia_dias: '30',
        fecha_prometida: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        evidencias_fotos: { frente: '', trasero: '', borde_sup: '', borde_inf: '' },
    });

    useEffect(() => {
        if (tipoSeguridad === 'sin_contrasena') {
            setData('contrasena_patron', 'Sin contraseña');
            return;
        }

        if (tipoSeguridad === 'pin_contrasena') {
            setData('contrasena_patron', claveSeguridad ? `PIN/Clave: ${claveSeguridad}` : '');
            return;
        }

        setData('contrasena_patron', patronSecuencia.length > 0 ? `Patrón: ${patronSecuencia.join(' - ')}` : '');
    }, [tipoSeguridad, claveSeguridad, patronSecuencia, setData]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoriaRef.current && !categoriaRef.current.contains(event.target as Node)) {
                setIsCategoriaDropdownOpen(false);
            }
            if (marcaRef.current && !marcaRef.current.contains(event.target as Node)) {
                setIsMarcaDropdownOpen(false);
            }
            if (modeloRef.current && !modeloRef.current.contains(event.target as Node)) {
                setIsModeloDropdownOpen(false);
            }
            if (clienteRef.current && !clienteRef.current.contains(event.target as Node)) {
                setIsClientDropdownOpen(false);
            }
            if (servicioRef.current && !servicioRef.current.contains(event.target as Node)) {
                setIsServicioDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Servicios filtrados por la búsqueda en tiempo real
    const serviciosFiltrados = serviciosList.filter((s) => {
        if (!searchServicioTerm || searchServicioTerm.trim() === '') return true;
        const term = searchServicioTerm.toLowerCase().trim();
        return (
            s.nombre.toLowerCase().includes(term) ||
            (s.codigo && s.codigo.toLowerCase().includes(term)) ||
            (s.categoria?.nombre && s.categoria.nombre.toLowerCase().includes(term))
        );
    });

    // Marcas filtradas por la búsqueda rápida (Select2)
    const marcasFiltradas = marcasList.filter((m) => {
        if (!searchMarcaTerm || searchMarcaTerm.trim() === '') return true;
        return m.nombre.toLowerCase().includes(searchMarcaTerm.toLowerCase().trim());
    });

    // Modelos filtrados por la búsqueda rápida (Select2)
    const modelosFiltradosBusqueda = modelosFiltrados.filter((mod) => {
        if (!searchModeloTerm || searchModeloTerm.trim() === '') return true;
        const term = searchModeloTerm.toLowerCase().trim();
        return (
            mod.nombre_comercial.toLowerCase().includes(term) ||
            (mod.codigo_modelo && mod.codigo_modelo.toLowerCase().includes(term))
        );
    });

    // Categorías filtradas por la búsqueda rápida (Select2)
    const categoriasFiltradas = categorias.filter((cat) => {
        if (!searchCategoriaTerm || searchCategoriaTerm.trim() === '') return true;
        return cat.nombre.toLowerCase().includes(searchCategoriaTerm.toLowerCase().trim());
    });

    // Clientes filtrados por la búsqueda en tiempo real
    const clientesFiltrados = clientesList.filter((c) => {
        if (!searchClienteTerm || searchClienteTerm.trim() === '') return true;
        const term = searchClienteTerm.toLowerCase().trim();
        return (
            c.nombre?.toLowerCase().includes(term) ||
            c.telefono?.toLowerCase().includes(term) ||
            c.email?.toLowerCase().includes(term)
        );
    });

    const totalCartServicios = cartServicios.reduce((acc, item) => acc + item.subtotal, 0);

    const updateCostoEstimadoWithCart = (newCart: CartServicio[]) => {
        const total = newCart.reduce((acc, item) => acc + item.subtotal, 0);
        if (newCart.length === 0) {
            setData('costo_estimado', '0');
            setIsCostoEstimadoManual(false);
        } else if (!isCostoEstimadoManual && total > 0) {
            setData('costo_estimado', String(total));
        }
    };

    const handleAddServicioToCart = (servicio: ServicioItem) => {
        const existingIdx = cartServicios.findIndex((item) => item.servicio_id === servicio.id);
        let updated: CartServicio[];
        if (existingIdx >= 0) {
            updated = [...cartServicios];
            const item = updated[existingIdx];
            const newCant = item.cantidad + 1;
            updated[existingIdx] = {
                ...item,
                cantidad: newCant,
                subtotal: item.precio * newCant,
            };
        } else {
            const precioNum = Number(servicio.precio || 0);
            updated = [
                ...cartServicios,
                {
                    servicio_id: servicio.id,
                    nombre: servicio.nombre,
                    codigo: servicio.codigo || '',
                    precio: precioNum,
                    cantidad: 1,
                    subtotal: precioNum,
                    categoria_nombre: servicio.categoria?.nombre || '',
                },
            ];
        }
        setCartServicios(updated);
        updateCostoEstimadoWithCart(updated);
        setSearchServicioTerm('');
        setIsServicioDropdownOpen(false);
        notifySuccess(__('Servicio agregado a la orden.'));
    };

    const handleUpdateCartItemPrecio = (index: number, newPrecio: number) => {
        const updated = [...cartServicios];
        const item = updated[index];
        const p = Math.max(0, newPrecio);
        updated[index] = {
            ...item,
            precio: p,
            subtotal: p * item.cantidad,
        };
        setCartServicios(updated);
        updateCostoEstimadoWithCart(updated);
    };

    const handleUpdateCartItemCantidad = (index: number, newCant: number) => {
        if (newCant <= 0) {
            handleRemoveCartItem(index);
            return;
        }
        const updated = [...cartServicios];
        const item = updated[index];
        updated[index] = {
            ...item,
            cantidad: newCant,
            subtotal: item.precio * newCant,
        };
        setCartServicios(updated);
        updateCostoEstimadoWithCart(updated);
    };

    const handleRemoveCartItem = (index: number) => {
        const updated = cartServicios.filter((_, i) => i !== index);
        setCartServicios(updated);
        updateCostoEstimadoWithCart(updated);
        notifySuccess(__('Servicio eliminado de la orden.'));
    };

    const postJson = async (url: string, bodyObj: any) => {
        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify(bodyObj),
        });
        return await response.json();
    };

    const handleCreateNewClient = async (e?: React.SyntheticEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!newClientData.nombre.trim()) return;

        setIsCreatingClient(true);
        try {
            const dataRes = await postJson('/admin/reparaciones/quick-cliente', newClientData);
            if (dataRes.success) {
                const newClient = dataRes.cliente;
                setClientesList((prev) => [newClient, ...prev]);
                setData({
                    ...data,
                    cliente_id: String(newClient.id),
                    cliente_nombre: newClient.nombre,
                    cliente_telefono: newClient.telefono || '',
                });
                setSearchClienteTerm(newClient.nombre);
                setOpenNewClientModal(false);
                setNewClientData({ nombre: '', telefono: '', email: '', direccion: '' });
                notifySuccess(__('Nuevo cliente registrado y seleccionado.'));
            } else {
                notifyError(__('Ocurrió un error al registrar el cliente.'));
            }
        } catch (error) {
            notifyError(__('Ocurrió un error al registrar el cliente.'));
        } finally {
            setIsCreatingClient(false);
        }
    };

    const handleCreateNewMarca = async (e?: React.SyntheticEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!newMarcaNombre.trim()) return;

        setIsCreatingMarca(true);
        try {
            const dataRes = await postJson('/admin/reparaciones/quick-marca', { nombre: newMarcaNombre.trim() });
            if (dataRes.success) {
                const newMarca: MarcaItem = dataRes.marca;
                setMarcasList((prev) => [...prev, newMarca]);
                setSelectedMarcaId(String(newMarca.id));
                setModelosFiltrados([]);
                setData((prev) => ({
                    ...prev,
                    marca_id: String(newMarca.id),
                    marca_nombre: newMarca.nombre,
                    modelo_id: '',
                    modelo_nombre: '',
                }));
                setSearchMarcaTerm(newMarca.nombre);
                setSearchModeloTerm('');
                setOpenNewMarcaModal(false);
                setNewMarcaNombre('');
                notifySuccess(__('Nueva marca registrada exitosamente.'));
            } else {
                notifyError(__('Ocurrió un error al registrar la marca.'));
            }
        } catch (error) {
            notifyError(__('Ocurrió un error al registrar la marca.'));
        } finally {
            setIsCreatingMarca(false);
        }
    };

    const handleCreateNewModelo = async (e?: React.SyntheticEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const marcaIdToUse = selectedMarcaId || data.marca_id;
        if (!marcaIdToUse) {
            notifyError(__('Por favor seleccione una marca antes de crear un modelo.'));
            return;
        }
        if (!newModeloNombre.trim()) {
            notifyError(__('Por favor ingrese el nombre del modelo.'));
            return;
        }

        setIsCreatingModelo(true);
        try {
            const dataRes = await postJson('/admin/reparaciones/quick-modelo', {
                marca_id: marcaIdToUse,
                nombre_comercial: newModeloNombre.trim(),
                codigo_modelo: newModeloCodigo.trim(),
            });
            if (dataRes.success) {
                const newModelo: ModeloItem = dataRes.modelo;
                setModelosFiltrados((prev) => [...prev, newModelo]);
                setMarcasList((prevMarcas) =>
                    prevMarcas.map((m) =>
                        String(m.id) === String(marcaIdToUse)
                            ? { ...m, modelos: [...(m.modelos || []), newModelo] }
                            : m
                    )
                );
                setData((prev) => ({
                    ...prev,
                    marca_id: String(marcaIdToUse),
                    modelo_id: String(newModelo.id),
                    modelo_nombre: newModelo.nombre_comercial,
                }));
                setSearchModeloTerm(newModelo.nombre_comercial);
                setOpenNewModeloModal(false);
                setNewModeloNombre('');
                setNewModeloCodigo('');
                notifySuccess(__('Nuevo modelo registrado exitosamente.'));
            } else {
                notifyError(__('Ocurrió un error al registrar el modelo.'));
            }
        } catch (error) {
            notifyError(__('Ocurrió un error al registrar el modelo.'));
        } finally {
            setIsCreatingModelo(false);
        }
    };

    const handleCreateNewServicio = async (e?: React.SyntheticEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!newServicioData.nombre.trim()) {
            notifyError(__('Por favor ingrese el nombre del servicio.'));
            return;
        }
        if (!newServicioData.precio || Number(newServicioData.precio) < 0) {
            notifyError(__('Por favor ingrese un precio válido.'));
            return;
        }

        setIsCreatingServicio(true);
        try {
            const dataRes = await postJson('/admin/reparaciones/quick-servicio', newServicioData);
            if (dataRes.success) {
                const newServicio: ServicioItem = dataRes.servicio;
                setServiciosList((prev) => [...prev, newServicio]);

                const precioNum = Number(newServicio.precio || 0);
                const newCartItem: CartServicio = {
                    servicio_id: newServicio.id,
                    nombre: newServicio.nombre,
                    codigo: newServicio.codigo || '',
                    precio: precioNum,
                    cantidad: 1,
                    subtotal: precioNum,
                    categoria_nombre: newServicio.categoria?.nombre || '',
                };
                const updatedCart = [...cartServicios, newCartItem];
                setCartServicios(updatedCart);
                updateCostoEstimadoWithCart(updatedCart);

                setOpenNewServicioModal(false);
                setNewServicioData({ categoria_id: '', nombre: '', codigo: '', descripcion: '', precio: '' });
                notifySuccess(__('Nuevo servicio creado y agregado a la orden.'));
            } else {
                notifyError(__('Ocurrió un error al registrar el servicio.'));
            }
        } catch (error) {
            notifyError(__('Ocurrió un error al registrar el servicio.'));
        } finally {
            setIsCreatingServicio(false);
        }
    };

    const handleSelectClienteObj = (c: Cliente) => {
        setData({
            ...data,
            cliente_id: String(c.id),
            cliente_nombre: c.nombre,
            cliente_telefono: c.telefono || '',
        });
        setSearchClienteTerm(c.nombre);
        setIsClientDropdownOpen(false);
    };

    const handleClearCliente = () => {
        setData({
            ...data,
            cliente_id: '',
            cliente_nombre: '',
            cliente_telefono: '',
        });
        setSearchClienteTerm('');
    };

    const handleSelectMarcaObj = (m: MarcaItem) => {
        setSelectedMarcaId(String(m.id));
        setModelosFiltrados(m.modelos || []);
        setData((prev) => ({
            ...prev,
            marca_id: String(m.id),
            marca_nombre: m.nombre,
            modelo_id: '',
            modelo_nombre: '',
        }));
        setSearchMarcaTerm(m.nombre);
        setSearchModeloTerm('');
        setIsMarcaDropdownOpen(false);
    };

    const handleClearMarca = () => {
        setSelectedMarcaId('');
        setModelosFiltrados([]);
        setData((prev) => ({
            ...prev,
            marca_id: '',
            marca_nombre: '',
            modelo_id: '',
            modelo_nombre: '',
        }));
        setSearchMarcaTerm('');
        setSearchModeloTerm('');
        setIsMarcaDropdownOpen(false);
    };

    const handleSelectModeloObj = (mod: ModeloItem) => {
        setData((prev) => ({
            ...prev,
            modelo_id: String(mod.id),
            modelo_nombre: mod.nombre_comercial,
        }));
        setSearchModeloTerm(mod.nombre_comercial);
        setIsModeloDropdownOpen(false);
    };

    const handleClearModelo = () => {
        setData((prev) => ({
            ...prev,
            modelo_id: '',
            modelo_nombre: '',
        }));
        setSearchModeloTerm('');
        setIsModeloDropdownOpen(false);
    };

    const costoEstimadoNum = Number(data.costo_estimado || 0);
    const anticipoNum = Number(data.anticipo || 0);
    const saldoRestanteNum = Math.max(0, costoEstimadoNum - anticipoNum);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        transform((prevData) => ({
            ...prevData,
            servicios_seleccionados: cartServicios,
            inspeccion_json: {
                tipo_bloqueo: tipoSeguridad === 'patron' ? 'patron' : tipoSeguridad === 'pin_contrasena' ? 'pin' : 'sin_bloqueo',
                patron_dots: patronSecuencia,
                codigo_pin: claveSeguridad,
            },
        }));

        post('/admin/reparaciones', {
            onSuccess: () => notifySuccess(__('Orden de reparación registrada exitosamente.')),
            onError: (errs) => {
                console.error('Errores al guardar orden:', errs);
                notifyError(__('Por favor completa los campos requeridos.'));
            },
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Servicio Técnico'), href: '/admin/reparaciones' },
        { title: __('Recepción de Equipo'), href: '#' },
    ];

    return (
        <>
            <Head title={__('Recepción de Equipo - Servicio Técnico')} />

            <div className="space-y-6 w-full pb-16">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    {/* HEADER COMPACTO Y LIMPIO */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="space-y-0.5">
                            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Wrench className="w-5 h-5 text-purple-600" />
                                {__('Recepción de Equipo para Reparación')}
                            </h1>
                            <p className="text-xs text-slate-500">{__('Formulario de ingreso y recepción de orden de servicio técnico.')}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link href="/admin/reparaciones">
                                <Button type="button" variant="outline" size="sm" className="gap-2 text-xs font-semibold">
                                    <ArrowLeft className="w-4 h-4" />
                                    {__('Volver')}
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="h-9 px-4 gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-950/20 rounded-xl transition-all"
                            >
                                <Save className="w-4 h-4" />
                                {processing ? __('Guardando...') : __('Guardar Orden de Reparación')}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 max-w-[1600px] mx-auto items-start text-xs">
                        {/* COLUMNA IZQUIERDA (7 COLS): CLIENTE, DISPOSITIVO Y DIAGNÓSTICO */}
                        <div className="lg:col-span-7 space-y-2.5">
                            {/* BLOQUE 1: DATOS DEL CLIENTE Y DISPOSITIVO */}
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-visible">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-2 px-3 flex flex-row items-center justify-between">
                                    <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                                        <User className="w-3.5 h-3.5 text-purple-600" />
                                        {__('1. Datos del Cliente y Dispositivo')}
                                    </CardTitle>

                                    {/* MODAL REGISTRAR CLIENTE NUEVO */}
                                    <Dialog open={openNewClientModal} onOpenChange={setOpenNewClientModal}>
                                        <DialogTrigger asChild>
                                            <Button type="button" size="sm" variant="ghost" className="h-6 text-[10px] font-bold text-purple-600 hover:text-purple-700 p-0">
                                                <UserPlus className="w-3 h-3 mr-1" />
                                                {__('+ Crear Cliente')}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                                    <UserPlus className="w-5 h-5 text-purple-600" />
                                                    {__('Registrar Nuevo Cliente')}
                                                </DialogTitle>
                                            </DialogHeader>

                                            <div className="space-y-3 py-2 text-xs">
                                                <div>
                                                    <Label className="text-xs font-semibold">{__('Nombre Completo *')}</Label>
                                                    <Input
                                                        value={newClientData.nombre}
                                                        onChange={(e) => setNewClientData({ ...newClientData, nombre: e.target.value })}
                                                        placeholder={__('ej: Carlos Mendoza')}
                                                        className="text-xs h-8 mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs font-semibold">{__('Teléfono WhatsApp')}</Label>
                                                    <Input
                                                        value={newClientData.telefono}
                                                        onChange={(e) => setNewClientData({ ...newClientData, telefono: e.target.value })}
                                                        placeholder={__('ej: 77123456')}
                                                        className="text-xs h-8 mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs font-semibold">{__('Correo Electrónico')}</Label>
                                                    <Input
                                                        type="email"
                                                        value={newClientData.email}
                                                        onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                                                        placeholder={__('cliente@correo.com')}
                                                        className="text-xs h-8 mt-1"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                    <Button type="button" variant="outline" size="sm" onClick={() => setOpenNewClientModal(false)} className="h-8 text-xs">
                                                        {__('Cancelar')}
                                                    </Button>
                                                    <Button type="button" onClick={(e) => handleCreateNewClient(e)} disabled={isCreatingClient} size="sm" className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white">
                                                        {__('Guardar Cliente')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </CardHeader>

                                <CardContent className="p-3 space-y-2.5">
                                    {/* FILA 1: CLIENTE Y TELÉFONO */}
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                        <div ref={clienteRef} className="sm:col-span-8 relative">
                                            <Label className="text-[11px] font-bold text-purple-700 dark:text-purple-300">{__('Cliente *')}</Label>
                                            <div className="relative mt-0.5">
                                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-purple-600 pointer-events-none" />
                                                <Input
                                                    value={searchClienteTerm}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setSearchClienteTerm(val);
                                                        setData((prev) => ({
                                                            ...prev,
                                                            cliente_nombre: val,
                                                            cliente_id: '',
                                                        }));
                                                        setIsClientDropdownOpen(true);
                                                    }}
                                                    onFocus={() => {
                                                        setIsClientDropdownOpen(true);
                                                    }}
                                                    placeholder={__('Escriba nombre o teléfono...')}
                                                    className="text-xs h-8 pl-8 pr-7 font-medium"
                                                    required
                                                />
                                                {(data.cliente_nombre || searchClienteTerm) && (
                                                    <button type="button" onClick={handleClearCliente} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* RESULTADOS CLIENTE DROPDOWN */}
                                            {isClientDropdownOpen && (
                                                <div className="absolute left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl divide-y divide-slate-100 dark:divide-slate-800">
                                                    {clientesFiltrados.length > 0 ? (
                                                        clientesFiltrados.slice(0, 30).map((c) => (
                                                            <button
                                                                key={c.id}
                                                                type="button"
                                                                onClick={() => handleSelectClienteObj(c)}
                                                                className="w-full px-3 py-2 text-left text-xs hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center justify-between transition-colors"
                                                            >
                                                                <div>
                                                                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{c.nombre}</span>
                                                                    {c.email && <span className="text-[10px] text-slate-400 block">{c.email}</span>}
                                                                </div>
                                                                {c.telefono && (
                                                                    <Badge variant="outline" className="text-purple-600 border-purple-200 font-mono text-[10px]">
                                                                        📞 {c.telefono}
                                                                    </Badge>
                                                                )}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="p-3 text-center text-xs text-slate-500">
                                                            <p>{__('No se encontraron clientes que coincidan.')}</p>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setIsClientDropdownOpen(false);
                                                                    setNewClientData((prev) => ({ ...prev, nombre: searchClienteTerm }));
                                                                    setOpenNewClientModal(true);
                                                                }}
                                                                className="mt-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 underline inline-flex items-center gap-1"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                                {__('Crear cliente "{{name}}"', { name: searchClienteTerm || __('Nuevo') })}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="sm:col-span-4">
                                            <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{__('Teléfono WhatsApp')}</Label>
                                            <Input
                                                value={data.cliente_telefono}
                                                onChange={(e) => setData('cliente_telefono', e.target.value)}
                                                placeholder="ej: 77123456"
                                                className="text-xs h-8 mt-0.5 font-medium"
                                            />
                                        </div>
                                    </div>

                                    {/* FILA 2: CATEGORÍA, MARCA, MODELO */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {/* CATEGORÍA */}
                                        <div ref={categoriaRef} className="relative">
                                            <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{__('Tipo / Categoría *')}</Label>
                                            <div className="relative mt-0.5">
                                                <Input
                                                    value={isCategoriaDropdownOpen ? searchCategoriaTerm : data.tipo_dispositivo}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setSearchCategoriaTerm(val);
                                                        setData('tipo_dispositivo', val);
                                                        setIsCategoriaDropdownOpen(true);
                                                    }}
                                                    onFocus={() => {
                                                        setSearchCategoriaTerm('');
                                                        setIsCategoriaDropdownOpen(true);
                                                    }}
                                                    placeholder={__('Smartphone, Laptop...')}
                                                    className="text-xs h-8 pr-7 font-medium"
                                                    required
                                                />
                                                {data.tipo_dispositivo && (
                                                    <button type="button" onClick={() => { setSearchCategoriaTerm(''); setData('tipo_dispositivo', ''); setIsCategoriaDropdownOpen(false); }} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* DROPDOWN CATEGORÍAS */}
                                            {isCategoriaDropdownOpen && (
                                                <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl divide-y divide-slate-100 dark:divide-slate-800">
                                                    {categoriasFiltradas.length > 0 ? (
                                                        categoriasFiltradas.map((cat) => (
                                                            <button
                                                                key={cat.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setData('tipo_dispositivo', cat.nombre);
                                                                    setSearchCategoriaTerm(cat.nombre);
                                                                    setIsCategoriaDropdownOpen(false);
                                                                }}
                                                                className={cn(
                                                                    'w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition-colors',
                                                                    data.tipo_dispositivo === cat.nombre ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                                                                )}
                                                            >
                                                                <span>{cat.nombre}</span>
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="p-2 text-[10px] text-slate-400 text-center">{__('Sin resultados. Se usará el texto ingresado.')}</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* MARCA */}
                                        <div ref={marcaRef} className="relative">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{__('Marca *')}</Label>
                                                <Dialog open={openNewMarcaModal} onOpenChange={setOpenNewMarcaModal}>
                                                    <DialogTrigger asChild>
                                                        <button type="button" className="text-[9px] font-bold text-purple-600 hover:underline">+ Crear</button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-md">
                                                        <DialogHeader>
                                                            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                                                <Tag className="w-5 h-5 text-purple-600" />
                                                                {__('Crear Nueva Marca')}
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-3 py-2 text-xs">
                                                            <div>
                                                                <Label className="text-xs font-semibold">{__('Nombre de la Marca *')}</Label>
                                                                <Input
                                                                    value={newMarcaNombre}
                                                                    onChange={(e) => setNewMarcaNombre(e.target.value)}
                                                                    placeholder={__('ej: OPPO, Honor, Realme, Apple')}
                                                                    className="text-xs h-8 mt-1"
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                                <Button type="button" variant="outline" size="sm" onClick={() => setOpenNewMarcaModal(false)} className="h-8 text-xs">{__('Cancelar')}</Button>
                                                                <Button type="button" onClick={(e) => handleCreateNewMarca(e)} disabled={isCreatingMarca} size="sm" className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white">{__('Guardar Marca')}</Button>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>

                                            <div className="relative mt-0.5">
                                                <Input
                                                    value={isMarcaDropdownOpen ? searchMarcaTerm : data.marca_nombre}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setSearchMarcaTerm(val);
                                                        setIsMarcaDropdownOpen(true);
                                                    }}
                                                    onFocus={() => {
                                                        setSearchMarcaTerm('');
                                                        setIsMarcaDropdownOpen(true);
                                                    }}
                                                    placeholder={__('Apple, Samsung...')}
                                                    className="text-xs h-8 pr-7 font-medium"
                                                    required
                                                />
                                                {data.marca_nombre && (
                                                    <button type="button" onClick={handleClearMarca} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* DROPDOWN MARCAS */}
                                            {isMarcaDropdownOpen && (
                                                <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl divide-y divide-slate-100 dark:divide-slate-800">
                                                    {marcasFiltradas.length > 0 ? (
                                                        marcasFiltradas.map((m) => (
                                                            <button
                                                                key={m.id}
                                                                type="button"
                                                                onClick={() => handleSelectMarcaObj(m)}
                                                                className={cn(
                                                                    'w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition-colors',
                                                                    String(m.id) === selectedMarcaId ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                                                                )}
                                                            >
                                                                <span>{m.nombre}</span>
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="p-2 text-[10px] text-center text-slate-400">
                                                            <button type="button" onClick={() => { setNewMarcaNombre(searchMarcaTerm); setOpenNewMarcaModal(true); setIsMarcaDropdownOpen(false); }} className="text-purple-600 font-bold hover:underline">+ Crear "{searchMarcaTerm}"</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* MODELO */}
                                        <div ref={modeloRef} className="relative">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{__('Modelo *')}</Label>
                                                <Dialog open={openNewModeloModal} onOpenChange={setOpenNewModeloModal}>
                                                    <DialogTrigger asChild>
                                                        <button type="button" disabled={!selectedMarcaId} className="text-[9px] font-bold text-purple-600 hover:underline disabled:opacity-40">+ Crear</button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-md">
                                                        <DialogHeader>
                                                            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                                                <Smartphone className="w-5 h-5 text-purple-600" />
                                                                {__('Crear Nuevo Modelo')}
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-3 py-2 text-xs">
                                                            <div>
                                                                <Label className="text-xs font-semibold">{__('Nombre Comercial *')}</Label>
                                                                <Input
                                                                    value={newModeloNombre}
                                                                    onChange={(e) => setNewModeloNombre(e.target.value)}
                                                                    placeholder={__('ej: iPhone 14 Pro, Galaxy S23')}
                                                                    className="text-xs h-8 mt-1"
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                                <Button type="button" variant="outline" size="sm" onClick={() => setOpenNewModeloModal(false)} className="h-8 text-xs">{__('Cancelar')}</Button>
                                                                <Button type="button" onClick={(e) => handleCreateNewModelo(e)} disabled={isCreatingModelo} size="sm" className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white">{__('Guardar Modelo')}</Button>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>

                                            <div className="relative mt-0.5">
                                                <Input
                                                    value={isModeloDropdownOpen ? searchModeloTerm : data.modelo_nombre}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setSearchModeloTerm(val);
                                                        setIsModeloDropdownOpen(true);
                                                    }}
                                                    onFocus={() => {
                                                        if (data.marca_id || selectedMarcaId) {
                                                            setSearchModeloTerm('');
                                                            setIsModeloDropdownOpen(true);
                                                        }
                                                    }}
                                                    placeholder={!selectedMarcaId && !data.marca_id ? __('Elija marca...') : __('iPhone 14, PS5...')}
                                                    disabled={!selectedMarcaId && !data.marca_id}
                                                    className="text-xs h-8 pr-7 font-medium"
                                                    required
                                                />
                                                {data.modelo_nombre && (
                                                    <button type="button" onClick={handleClearModelo} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* DROPDOWN MODELOS */}
                                            {isModeloDropdownOpen && (
                                                <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl divide-y divide-slate-100 dark:divide-slate-800">
                                                    {modelosFiltradosBusqueda.length > 0 ? (
                                                        modelosFiltradosBusqueda.map((mod) => (
                                                            <button
                                                                key={mod.id}
                                                                type="button"
                                                                onClick={() => handleSelectModeloObj(mod)}
                                                                className={cn(
                                                                    'w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition-colors',
                                                                    String(mod.id) === data.modelo_id ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                                                                )}
                                                            >
                                                                <span>{mod.nombre_comercial}</span>
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="p-2 text-[10px] text-center text-slate-400">
                                                            <button type="button" onClick={() => { setNewModeloNombre(searchModeloTerm); setOpenNewModeloModal(true); setIsModeloDropdownOpen(false); }} className="text-purple-600 font-bold hover:underline">+ Crear "{searchModeloTerm}"</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* FILA 3: COLOR, IMEI (5 DÍGITOS), SEGURIDAD */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <div>
                                            <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{__('Color / Estética')}</Label>
                                            <Input
                                                value={data.color}
                                                onChange={(e) => setData('color', e.target.value)}
                                                placeholder="ej: Negro, Rayado"
                                                className="text-xs h-8 mt-0.5 font-medium"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{__('IMEI / Serie')}</Label>
                                                {isCheckingImei && (
                                                    <span className="text-[9px] text-purple-600 animate-pulse">{__('Buscando...')}</span>
                                                )}
                                                {imeiHistoryData && (
                                                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-1 rounded border border-amber-200">
                                                        ⚠️ {imeiHistoryData.count} {imeiHistoryData.count === 1 ? __('orden previa') : __('órdenes previas')}
                                                    </span>
                                                )}
                                            </div>
                                            <Input
                                                value={data.imei_serie}
                                                onChange={(e) => handleImeiChange(e.target.value)}
                                                placeholder="ej: 3568..., F2LZ... o 12345"
                                                maxLength={50}
                                                className="text-xs h-8 mt-0.5 font-mono font-bold uppercase"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{__('Seguridad / Clave')}</Label>
                                            <Select value={tipoSeguridad} onValueChange={(val: any) => setTipoSeguridad(val)}>
                                                <SelectTrigger className="text-xs h-8 mt-0.5 font-medium">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="sin_contrasena">🔓 Sin contraseña</SelectItem>
                                                    <SelectItem value="pin_contrasena">🔑 PIN / Clave</SelectItem>
                                                    <SelectItem value="patron">✏️ Patrón 3x3</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* INPUT PIN / PATRÓN SI SE SELECCIONA */}
                                    {tipoSeguridad === 'pin_contrasena' && (
                                        <div>
                                            <Input
                                                value={claveSeguridad}
                                                onChange={(e) => setClaveSeguridad(e.target.value)}
                                                placeholder={__('PIN o Contraseña del cliente...')}
                                                className="text-xs h-8 font-mono"
                                            />
                                        </div>
                                    )}
                                    {tipoSeguridad === 'patron' && (
                                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border">
                                            <span className="text-[11px] font-bold text-slate-600">Patrón: {patronSecuencia.join('-') || 'Dibuje abajo'}</span>
                                            <PatternLockCanvas pattern={patronSecuencia} onChange={setPatronSecuencia} />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* BLOQUE 2: DIAGNÓSTICO Y FALLA REPORTADA */}
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-2 px-3">
                                    <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                                        {__('2. Diagnóstico Inicial & Observaciones')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-[11px] font-bold text-purple-700 dark:text-purple-300">{__('Falla Reportada por Cliente *')}</Label>
                                            <Textarea
                                                value={data.descripcion_falla}
                                                onChange={(e) => setData('descripcion_falla', e.target.value)}
                                                rows={2}
                                                placeholder={__('ej: No enciende, pantalla rota, no carga...')}
                                                className="text-xs mt-0.5 font-medium resize-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{__('Observaciones Físicas / Accesorios')}</Label>
                                            <Textarea
                                                value={data.observaciones_fisicas}
                                                onChange={(e) => setData('observaciones_fisicas', e.target.value)}
                                                rows={2}
                                                placeholder={__('ej: Rayón en tapa trasera, incluye funda...')}
                                                className="text-xs mt-0.5 font-medium resize-none"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* COLUMNA DERECHA (5 COLS): SERVICIOS, PRESUPUESTO & ACCIONES */}
                        <div className="lg:col-span-5 space-y-2.5">
                            {/* SERVICIOS DE REPARACIÓN */}
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-visible">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-2 px-3 flex flex-row items-center justify-between">
                                    <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                                        <Tag className="w-3.5 h-3.5 text-purple-600" />
                                        {__('3. Servicios Requeridos')}
                                    </CardTitle>
                                    <Dialog open={openNewServicioModal} onOpenChange={setOpenNewServicioModal}>
                                        <DialogTrigger asChild>
                                            <button type="button" className="text-[9px] font-bold text-purple-600 hover:underline">+ Nuevo Servicio</button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                                    <Tag className="w-5 h-5 text-purple-600" />
                                                    {__('Crear Nuevo Servicio en Catálogo')}
                                                </DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-3 py-2 text-xs">
                                                <div>
                                                    <Label className="text-xs font-semibold">{__('Nombre del Servicio *')}</Label>
                                                    <Input
                                                        value={newServicioData.nombre}
                                                        onChange={(e) => setNewServicioData({ ...newServicioData, nombre: e.target.value })}
                                                        placeholder={__('ej: Cambio de Pantalla iPhone 14')}
                                                        className="text-xs h-8 mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs font-semibold">{__('Precio Sugerido')}</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={newServicioData.precio}
                                                        onChange={(e) => setNewServicioData({ ...newServicioData, precio: e.target.value })}
                                                        placeholder="0.00"
                                                        className="text-xs h-8 mt-1"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                    <Button type="button" variant="outline" size="sm" onClick={() => setOpenNewServicioModal(false)} className="h-8 text-xs">{__('Cancelar')}</Button>
                                                    <Button type="button" onClick={(e) => handleCreateNewServicio(e)} disabled={isCreatingServicio} size="sm" className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white">{__('Guardar Servicio')}</Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </CardHeader>
                                <CardContent className="p-3 space-y-2">
                                    <div ref={servicioRef} className="relative">
                                        <div className="relative">
                                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-purple-600 pointer-events-none" />
                                            <Input
                                                value={searchServicioTerm}
                                                onChange={(e) => {
                                                    setSearchServicioTerm(e.target.value);
                                                    setIsServicioDropdownOpen(true);
                                                }}
                                                onFocus={() => setIsServicioDropdownOpen(true)}
                                                placeholder={__('Buscar servicio (ej: Pantalla, Limpieza)...')}
                                                className="text-xs h-8 pl-8 font-medium"
                                            />
                                        </div>

                                        {/* DROPDOWN SERVICIOS */}
                                        {isServicioDropdownOpen && (
                                            <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl divide-y divide-slate-100 dark:divide-slate-800">
                                                {serviciosFiltrados.length > 0 ? (
                                                    serviciosFiltrados.map((s) => (
                                                        <button
                                                            key={s.id}
                                                            type="button"
                                                            onClick={() => {
                                                                handleAddServicioToCart(s);
                                                                setIsServicioDropdownOpen(false);
                                                                setSearchServicioTerm('');
                                                            }}
                                                            className="w-full px-3 py-1.5 text-left text-xs hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center justify-between transition-colors"
                                                        >
                                                            <div>
                                                                <span className="font-bold text-slate-900 dark:text-slate-100 block">{s.nombre}</span>
                                                            </div>
                                                            <Badge variant="outline" className="font-mono text-purple-600 border-purple-200 text-[10px]">
                                                                {currencySymbol}{s.precio}
                                                            </Badge>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-2 text-[10px] text-center text-slate-400">{__('No se encontraron servicios.')}</div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* TABLA DEL CARRITO COMPACTA */}
                                    {cartServicios.length > 0 ? (
                                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-28 overflow-y-auto">
                                            <table className="w-full text-left text-[11px]">
                                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold uppercase text-[9px]">
                                                    <tr>
                                                        <th className="p-1">{__('Servicio')}</th>
                                                        <th className="p-1 text-right">{__('Precio')}</th>
                                                        <th className="p-1 text-center"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {cartServicios.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                                            <td className="p-1 font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{item.nombre}</td>
                                                            <td className="p-1 text-right font-mono font-bold">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={item.precio}
                                                                    onChange={(e) => handleUpdateCartItemPrecio(idx, parseFloat(e.target.value) || 0)}
                                                                    className="w-16 text-right h-6 text-xs font-mono border rounded px-1"
                                                                />
                                                            </td>
                                                            <td className="p-1 text-center">
                                                                <button type="button" onClick={() => handleRemoveCartItem(idx)} className="text-slate-400 hover:text-rose-600">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="p-2 text-center text-[10px] text-slate-400 border border-dashed rounded-lg bg-slate-50/50">
                                            {__('Opcional: Seleccione servicios del catálogo')}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* BLOQUE 4: PRESUPUESTO & TÉCNICO */}
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-2 px-3">
                                    <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                        {__('4. Presupuesto & Asignación')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{__('Costo Estimado *')}</Label>
                                                {cartServicios.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setData('costo_estimado', String(totalCartServicios));
                                                            setIsCostoEstimadoManual(false);
                                                        }}
                                                        className="text-[9px] text-purple-600 font-bold hover:underline"
                                                    >
                                                        Suma: {currencySymbol}{totalCartServicios.toFixed(2)}
                                                    </button>
                                                )}
                                            </div>
                                            <div className="relative mt-0.5">
                                                <span className="absolute left-2.5 top-2 text-xs font-mono font-bold text-slate-400">{currencySymbol}</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={data.costo_estimado}
                                                    onChange={(e) => {
                                                        setIsCostoEstimadoManual(true);
                                                        setData('costo_estimado', e.target.value);
                                                    }}
                                                    className="text-xs h-8 pl-6 font-mono font-bold"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{__('Anticipo / Adelanto')}</Label>
                                            <div className="relative mt-0.5">
                                                <span className="absolute left-2.5 top-2 text-xs font-mono font-bold text-emerald-600">{currencySymbol}</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={data.anticipo}
                                                    onChange={(e) => setData('anticipo', e.target.value)}
                                                    className="text-xs h-8 pl-6 font-mono font-bold text-emerald-600"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{__('Técnico Asignado')}</Label>
                                            <Select value={data.tecnico_id} onValueChange={(val) => setData('tecnico_id', val)}>
                                                <SelectTrigger className="text-xs h-8 mt-0.5">
                                                    <SelectValue placeholder={__('Seleccionar...')} />
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
                                            <Label className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{__('Fecha Entrega')}</Label>
                                            <Input
                                                type="date"
                                                value={data.fecha_prometida}
                                                onChange={(e) => setData('fecha_prometida', e.target.value)}
                                                className="text-xs h-8 mt-0.5 font-mono"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* BLOQUE 5: EVIDENCIAS FOTOGRÁFICAS RÁPIDAS */}
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-1.5 px-3">
                                    <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                                        <Camera className="w-3.5 h-3.5 text-purple-600" />
                                        {__('5. Evidencias (4 Ángulos)')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-2">
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {FOTO_SLOTS.map((slot) => {
                                            const hasFoto = Boolean(fotosState[slot.key]);
                                            return (
                                                <div key={slot.key} className="flex flex-col items-center p-1 rounded border text-center bg-slate-50 dark:bg-slate-950">
                                                    <span className="text-[9px] font-bold text-slate-700 truncate w-full">{slot.label}</span>
                                                    {hasFoto ? (
                                                        <div className="relative w-full h-10 rounded mt-1 overflow-hidden group">
                                                            <img src={fotosState[slot.key]} alt={slot.label} className="w-full h-full object-cover" />
                                                            <button type="button" onClick={() => handleRemoveFoto(slot.key)} className="absolute inset-0 bg-rose-950/70 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-bold">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-1 mt-1">
                                                            <button type="button" onClick={() => startCameraStream(slot.key, slot.label)} className="p-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200" title="Cámara">
                                                                <Camera className="w-3 h-3" />
                                                            </button>
                                                            <label className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer" title="Archivo">
                                                                <Upload className="w-3 h-3" />
                                                                <input type="file" accept="image/*" onChange={(e) => handleFotoUpload(slot.key, e)} className="hidden" />
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* MODAL CÁMARA LIVE STREAM */}
                            <Dialog open={Boolean(activeCameraSlot)} onOpenChange={(open) => { if (!open) stopCameraStream(); }}>
                                <DialogContent className="sm:max-w-md bg-slate-950 text-white border-slate-800">
                                    <DialogHeader>
                                        <DialogTitle className="text-sm font-bold flex items-center gap-2">
                                            <Camera className="w-4 h-4 text-purple-400" />
                                            {__('Tomar Foto')} - {cameraSlotLabel}
                                        </DialogTitle>
                                    </DialogHeader>

                                    <div className="space-y-3 py-2 text-xs">
                                        {/* SELECCIONADOR DE CÁMARAS DISPONIBLES (MICROSCOPIOS USB) */}
                                        <div className="space-y-1 bg-slate-900 border border-slate-800 p-2 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[10px] font-bold text-purple-300 flex items-center gap-1">
                                                    <Camera className="w-3 h-3 text-purple-400" />
                                                    {__('Cámara / Microscopio USB:')}
                                                </Label>
                                                <button
                                                    type="button"
                                                    onClick={refreshCameraDevices}
                                                    className="text-[10px] text-purple-400 hover:text-purple-200 font-semibold flex items-center gap-1 cursor-pointer"
                                                >
                                                    <RefreshCw className="w-3 h-3" />
                                                    {__('Escanear')}
                                                </button>
                                            </div>
                                            <Select
                                                value={selectedCameraDeviceId}
                                                onValueChange={(val) => {
                                                    setSelectedCameraDeviceId(val);
                                                    if (activeCameraSlot) {
                                                        startCameraStream(activeCameraSlot, cameraSlotLabel, val);
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="w-full h-8 text-xs bg-slate-950 border-slate-700 text-white font-medium focus:ring-1 focus:ring-purple-500">
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
                                        {cameraError ? (
                                            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-center">
                                                {cameraError}
                                            </div>
                                        ) : (
                                            <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-800">
                                                {isCameraLoading && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                                                        <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
                                                    </div>
                                                )}
                                                <video ref={videoRef} className={cn('w-full h-full object-cover', capturedImage && 'hidden')} autoPlay playsInline muted />
                                                <canvas ref={canvasRef} className="hidden" />
                                                {capturedImage && (
                                                    <img src={capturedImage} alt="Foto capturada" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                        )}

                                        {!cameraError && (
                                            <div className="flex items-center justify-between pt-2">
                                                <Button type="button" variant="outline" size="sm" onClick={toggleFacingMode} className="text-xs bg-slate-900 border-slate-700 text-slate-300 hover:text-white">
                                                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                                                    {__('Voltear')}
                                                </Button>

                                                {capturedImage ? (
                                                    <div className="flex items-center gap-2">
                                                        <Button type="button" variant="outline" size="sm" onClick={handleRetakeSnapshot} className="text-xs bg-slate-900 border-slate-700 text-slate-300 hover:text-white">
                                                            {__('Repetir')}
                                                        </Button>
                                                        <Button type="button" size="sm" onClick={handleAcceptCapturedPhoto} className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                                                            <Check className="w-3.5 h-3.5" />
                                                            {__('Usar Foto')}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button type="button" size="sm" onClick={handleCaptureSnapshot} disabled={isCameraLoading} className="h-8 px-4 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs">
                                                        <Camera className="w-3.5 h-3.5 mr-1" />
                                                        {__('Capturar')}
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>

                            {/* BOTÓN PRINCIPAL DE GUARDAR ORDEN */}
                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full h-11 text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-950/30 rounded-xl gap-2 transition-all"
                                >
                                    <Save className="w-4 h-4" />
                                    {processing ? __('Guardando Orden...') : __('Guardar Orden de Reparación')}
                                </Button>
                            </div>

                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}
