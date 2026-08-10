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

function PatternLockInput({
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
    const [fotosState, setFotosState] = useState<Record<string, string>>({
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

    const stopCameraStream = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach((track) => track.stop());
            setCameraStream(null);
        }
        setActiveCameraSlot(null);
        setCapturedImage(null);
        setCameraError(null);
    };

    const startCameraStream = async (slotKey: string, slotLabel: string, mode: 'environment' | 'user' = 'environment') => {
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
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: mode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err: any) {
            console.error('Camera access error:', err);
            setCameraError(__('No se pudo acceder a la cámara. Por favor verifique los permisos del navegador o use la opción de subir archivo.'));
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
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
                setCapturedImage(dataUrl);
            }
        }
    };

    const handleAcceptCapturedPhoto = () => {
        if (capturedImage && activeCameraSlot) {
            setFotosState((prev) => {
                const next = { ...prev, [activeCameraSlot]: capturedImage };
                setData('evidencias_fotos', next);
                return next;
            });
            notifySuccess(__('Fotografía capturada y guardada.'));
            stopCameraStream();
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

    // Búsqueda en tiempo real de historial por serie corta (5 dígitos)
    const handleImeiChange = (val: string) => {
        const onlyDigits = val.replace(/\D/g, '').slice(0, 5);
        setData('imei_serie', onlyDigits);

        if (!onlyDigits || onlyDigits.length < 5) {
            setImeiHistoryData(null);
            return;
        }

        if ((window as any)._imeiDebounceTimer) {
            clearTimeout((window as any)._imeiDebounceTimer);
        }
        (window as any)._imeiDebounceTimer = setTimeout(async () => {
            setIsCheckingImei(true);
            try {
                const res = await postJson('/admin/reparaciones/check-imei', { imei: onlyDigits });
                if (res.success && res.count > 0) {
                    setImeiHistoryData(res);
                } else {
                    setImeiHistoryData(null);
                }
            } catch (err) {
                console.error('Error al verificar IMEI:', err);
            } finally {
                setIsCheckingImei(false);
            }
        }, 400);
    };

    const handleFotoUpload = (slotKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setFotosState((prev) => {
                const next = { ...prev, [slotKey]: base64String };
                setData('evidencias_fotos', next);
                return next;
            });
            notifySuccess(__('Fotografía cargada correctamente.'));
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveFoto = (slotKey: string) => {
        setFotosState((prev) => {
            const next = { ...prev, [slotKey]: '' };
            setData('evidencias_fotos', next);
            return next;
        });
    };

    const { data, setData, post, processing, errors, transform } = useForm({
        cliente_id: '',
        cliente_nombre: '',
        cliente_telefono: '',
        tipo_dispositivo: (categorias && categorias.length > 0) ? categorias[0].nombre : 'Smartphone',
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
        if (!searchClienteTerm || searchClienteTerm.trim() === '') return false;
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
        if (total > 0) {
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

                {/* HEADER COMPACTO Y LIMPIO */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="space-y-0.5">
                        <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-purple-600" />
                            {__('Recepción de Equipo para Reparación')}
                        </h1>
                        <p className="text-xs text-slate-500">{__('Formulario de ingreso y recepción de orden de servicio técnico.')}</p>
                    </div>

                    <Link href="/admin/reparaciones">
                        <Button variant="outline" size="sm" className="gap-2 text-xs font-semibold">
                            <ArrowLeft className="w-4 h-4" />
                            {__('Volver al Listado')}
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="max-w-4xl mx-auto space-y-6">

                            {/* SECCIÓN 1: DATOS DEL CLIENTE */}
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-visible">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                        <User className="w-4 h-4 text-purple-600" />
                                        {__('1. Datos del Cliente')}
                                    </CardTitle>

                                    {/* MODAL REGISTRAR CLIENTE NUEVO */}
                                    <Dialog open={openNewClientModal} onOpenChange={setOpenNewClientModal}>
                                        <DialogTrigger asChild>
                                            <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5 text-xs font-bold text-purple-700 border-purple-300 hover:bg-purple-50 dark:text-purple-300 dark:border-purple-800">
                                                <UserPlus className="w-4 h-4 text-purple-600" />
                                                {__('+ Crear Nuevo Cliente')}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                                    <UserPlus className="w-5 h-5 text-purple-600" />
                                                    {__('Registrar Nuevo Cliente')}
                                                </DialogTitle>
                                            </DialogHeader>

                                            <div className="space-y-4 py-2">
                                                <div>
                                                    <Label className="text-xs font-semibold">{__('Nombre Completo *')}</Label>
                                                    <Input
                                                        value={newClientData.nombre}
                                                        onChange={(e) => setNewClientData({ ...newClientData, nombre: e.target.value })}
                                                        placeholder={__('ej: Carlos Mendoza')}
                                                        className="text-xs h-9 mt-1"
                                                    />
                                                </div>

                                                <div>
                                                    <Label className="text-xs font-semibold">{__('Teléfono WhatsApp')}</Label>
                                                    <Input
                                                        value={newClientData.telefono}
                                                        onChange={(e) => setNewClientData({ ...newClientData, telefono: e.target.value })}
                                                        placeholder={__('ej: +58 412 0000000')}
                                                        className="text-xs h-9 mt-1"
                                                    />
                                                </div>

                                                <div>
                                                    <Label className="text-xs font-semibold">{__('Correo Electrónico')}</Label>
                                                    <Input
                                                        type="email"
                                                        value={newClientData.email}
                                                        onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                                                        placeholder={__('cliente@correo.com')}
                                                        className="text-xs h-9 mt-1"
                                                    />
                                                </div>

                                                <div>
                                                    <Label className="text-xs font-semibold">{__('Dirección')}</Label>
                                                    <Input
                                                        value={newClientData.direccion}
                                                        onChange={(e) => setNewClientData({ ...newClientData, direccion: e.target.value })}
                                                        placeholder={__('Ciudad, Dirección de residencia')}
                                                        className="text-xs h-9 mt-1"
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

                                <CardContent className="p-4 space-y-4">
                                    {/* BUSCADOR DE CLIENTE ANCHO COMPLETO */}
                                    <div className="relative w-full">
                                        <Label className="text-xs font-semibold">{__('Búsqueda de Cliente en Tiempo Real *')}</Label>
                                        <div className="relative mt-1">
                                            <Search className="w-4 h-4 absolute left-3 top-3.5 text-purple-600" />
                                            <Input
                                                value={searchClienteTerm}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setSearchClienteTerm(val);
                                                    setData('cliente_nombre', val);
                                                    setIsClientDropdownOpen(val.trim().length > 0);
                                                }}
                                                onFocus={() => {
                                                    if (searchClienteTerm.trim().length > 0) {
                                                        setIsClientDropdownOpen(true);
                                                    }
                                                }}
                                                placeholder={__('Escriba el nombre o teléfono para buscar un cliente...')}
                                                className="text-xs h-11 pl-9 pr-8 font-medium"
                                                required
                                            />
                                            {(data.cliente_nombre || searchClienteTerm) && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearCliente}
                                                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                                                    title={__('Limpiar cliente')}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* RESULTADOS CLIENTE DROPDOWN */}
                                        {isClientDropdownOpen && clientesFiltrados.length > 0 && (
                                            <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl divide-y divide-slate-100 dark:divide-slate-800">
                                                {clientesFiltrados.map((c) => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => handleSelectClienteObj(c)}
                                                        className="w-full px-4 py-3 text-left text-xs hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center justify-between transition-colors"
                                                    >
                                                        <div>
                                                            <span className="font-bold text-slate-900 dark:text-slate-100 block">{c.nombre}</span>
                                                            {c.email && <span className="text-[10px] text-slate-400 block">{c.email}</span>}
                                                        </div>
                                                        {c.telefono && (
                                                            <Badge variant="outline" className="text-purple-600 border-purple-200 font-mono text-[11px]">
                                                                📞 {c.telefono}
                                                            </Badge>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* SECCIÓN 2: TIPO DE DISPOSITIVO */}
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                        <Smartphone className="w-4 h-4 text-purple-600" />
                                        {__('2. Tipo de Dispositivo')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    <div className="relative w-full">
                                        <Label className="text-xs font-semibold">{__('Seleccionar Categoría / Tipo de Dispositivo *')}</Label>
                                        <div className="relative mt-1">
                                            <Layers className="w-4 h-4 absolute left-3 top-3.5 text-purple-600 z-10 pointer-events-none" />
                                            <Input
                                                value={isCategoriaDropdownOpen ? searchCategoriaTerm : data.tipo_dispositivo}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setSearchCategoriaTerm(val);
                                                    setData('tipo_dispositivo', val);
                                                    setIsCategoriaDropdownOpen(true);
                                                }}
                                                onFocus={() => {
                                                    setSearchCategoriaTerm(data.tipo_dispositivo || '');
                                                    setIsCategoriaDropdownOpen(true);
                                                }}
                                                placeholder={__('Escriba para buscar o seleccione una categoría...')}
                                                className="text-xs h-11 pl-9 pr-8 font-medium"
                                                required
                                            />
                                            {data.tipo_dispositivo && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSearchCategoriaTerm('');
                                                        setData('tipo_dispositivo', '');
                                                        setIsCategoriaDropdownOpen(false);
                                                    }}
                                                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                                                    title={__('Limpiar selección')}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* DROPDOWN CATEGORÍAS */}
                                        {isCategoriaDropdownOpen && (
                                            <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl divide-y divide-slate-100 dark:divide-slate-800">
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
                                                                'w-full px-4 py-2.5 text-left text-xs flex items-center justify-between transition-colors',
                                                                data.tipo_dispositivo === cat.nombre
                                                                    ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 font-bold'
                                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                                                            )}
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <Layers className="w-3.5 h-3.5 text-purple-600" />
                                                                {cat.nombre}
                                                            </span>
                                                            {data.tipo_dispositivo === cat.nombre && (
                                                                <Check className="w-4 h-4 text-purple-600" />
                                                            )}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-3 text-xs text-slate-400 text-center">
                                                        {__('No se encontraron categorías. Se usará el texto ingresado.')}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* SECCIÓN 3: MARCA, MODELO Y SERIE / IMEI */}
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-visible">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                        <Tag className="w-4 h-4 text-purple-600" />
                                        {__('3. Marca, Modelo e IMEI/Serie')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* BUSCADOR SELECT2 MARCA CON OPCIÓN CREAR */}
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-1">
                                                <Label className="text-xs font-semibold">{__('Marca del Equipo *')}</Label>
                                                <Dialog open={openNewMarcaModal} onOpenChange={setOpenNewMarcaModal}>
                                                    <DialogTrigger asChild>
                                                        <button type="button" className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1">
                                                            <Plus className="w-3 h-3" />
                                                            {__('Crear Marca')}
                                                        </button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-md">
                                                        <DialogHeader>
                                                            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                                                <Tag className="w-5 h-5 text-purple-600" />
                                                                {__('Crear Nueva Marca')}
                                                            </DialogTitle>
                                                        </DialogHeader>

                                                        <div className="space-y-4 py-2">
                                                            <div>
                                                                <Label className="text-xs font-semibold">{__('Nombre de la Marca *')}</Label>
                                                                <Input
                                                                    value={newMarcaNombre}
                                                                    onChange={(e) => setNewMarcaNombre(e.target.value)}
                                                                    placeholder={__('ej: OPPO, Honor, Realme, Xiaomi, Apple')}
                                                                    className="text-xs h-9 mt-1"
                                                                />
                                                            </div>

                                                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                                <Button type="button" variant="outline" size="sm" onClick={() => setOpenNewMarcaModal(false)} className="h-8 text-xs">
                                                                    {__('Cancelar')}
                                                                </Button>
                                                                <Button type="button" onClick={(e) => handleCreateNewMarca(e)} disabled={isCreatingMarca} size="sm" className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white">
                                                                    {__('Guardar Marca')}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>

                                            <div className="relative">
                                                <Search className="w-4 h-4 absolute left-3 top-3.5 text-purple-600 z-10 pointer-events-none" />
                                                <Input
                                                    value={isMarcaDropdownOpen ? searchMarcaTerm : data.marca_nombre}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setSearchMarcaTerm(val);
                                                        setIsMarcaDropdownOpen(true);
                                                    }}
                                                    onFocus={() => {
                                                        setSearchMarcaTerm(data.marca_nombre || '');
                                                        setIsMarcaDropdownOpen(true);
                                                    }}
                                                    placeholder={__('Buscar o seleccionar marca...')}
                                                    className="text-xs h-10 pl-9 pr-8 font-medium"
                                                    required
                                                />
                                                {data.marca_nombre && (
                                                    <button
                                                        type="button"
                                                        onClick={handleClearMarca}
                                                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                                        title={__('Limpiar marca')}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* DROPDOWN SELECT2 MARCAS */}
                                            {isMarcaDropdownOpen && (
                                                <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl divide-y divide-slate-100 dark:divide-slate-800">
                                                    {marcasFiltradas.length > 0 ? (
                                                        marcasFiltradas.map((m) => (
                                                            <button
                                                                key={m.id}
                                                                type="button"
                                                                onClick={() => handleSelectMarcaObj(m)}
                                                                className={cn(
                                                                    'w-full px-4 py-2.5 text-left text-xs flex items-center justify-between transition-colors',
                                                                    String(m.id) === selectedMarcaId
                                                                        ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 font-bold'
                                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                                                                )}
                                                            >
                                                                <span>{m.nombre}</span>
                                                                {String(m.id) === selectedMarcaId && (
                                                                    <Check className="w-4 h-4 text-purple-600" />
                                                                )}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="p-3 text-xs text-center text-slate-400 space-y-2">
                                                            <span>{__('No se encontró la marca.')}</span>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setNewMarcaNombre(searchMarcaTerm);
                                                                    setOpenNewMarcaModal(true);
                                                                    setIsMarcaDropdownOpen(false);
                                                                }}
                                                                className="w-full text-xs text-purple-700 border-purple-300"
                                                            >
                                                                <Plus className="w-3.5 h-3.5 mr-1" />
                                                                {__('Crear')} "{searchMarcaTerm}"
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* BUSCADOR SELECT2 MODELO CON OPCIÓN CREAR */}
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-1">
                                                <Label className="text-xs font-semibold">{__('Modelo del Equipo *')}</Label>
                                                <Dialog open={openNewModeloModal} onOpenChange={setOpenNewModeloModal}>
                                                    <DialogTrigger asChild>
                                                        <button type="button" className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1">
                                                            <Plus className="w-3 h-3" />
                                                            {__('Crear Modelo')}
                                                        </button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-md">
                                                        <DialogHeader>
                                                            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                                                <Smartphone className="w-5 h-5 text-purple-600" />
                                                                {__('Crear Nuevo Modelo')}
                                                            </DialogTitle>
                                                        </DialogHeader>

                                                        <div className="space-y-4 py-2">
                                                            <div>
                                                                <Label className="text-xs font-semibold">{__('Marca Seleccionada')}</Label>
                                                                <Input
                                                                    value={data.marca_nombre || __('Seleccione una marca primero')}
                                                                    disabled
                                                                    className="text-xs h-9 mt-1 bg-slate-100 dark:bg-slate-800"
                                                                />
                                                            </div>

                                                            <div>
                                                                <Label className="text-xs font-semibold">{__('Nombre Comercial del Modelo *')}</Label>
                                                                <Input
                                                                    value={newModeloNombre}
                                                                    onChange={(e) => setNewModeloNombre(e.target.value)}
                                                                    placeholder={__('ej: Redmi Note 12 Pro / Reno 8 / Galaxy A54')}
                                                                    className="text-xs h-9 mt-1"
                                                                />
                                                            </div>

                                                            <div>
                                                                <Label className="text-xs font-semibold">{__('Código de Modelo (Opcional)')}</Label>
                                                                <Input
                                                                    value={newModeloCodigo}
                                                                    onChange={(e) => setNewModeloCodigo(e.target.value)}
                                                                    placeholder={__('ej: SM-A546B / CPH2359')}
                                                                    className="text-xs h-9 mt-1 font-mono"
                                                                />
                                                            </div>

                                                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                                <Button type="button" variant="outline" size="sm" onClick={() => setOpenNewModeloModal(false)} className="h-8 text-xs">
                                                                    {__('Cancelar')}
                                                                </Button>
                                                                <Button type="button" onClick={(e) => handleCreateNewModelo(e)} disabled={isCreatingModelo || (!selectedMarcaId && !data.marca_id)} size="sm" className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white">
                                                                    {__('Guardar Modelo')}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>

                                            <div className="relative">
                                                <Search className="w-4 h-4 absolute left-3 top-3.5 text-purple-600 z-10 pointer-events-none" />
                                                <Input
                                                    value={isModeloDropdownOpen ? searchModeloTerm : data.modelo_nombre}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setSearchModeloTerm(val);
                                                        setIsModeloDropdownOpen(true);
                                                    }}
                                                    onFocus={() => {
                                                        if (data.marca_id || selectedMarcaId) {
                                                            setSearchModeloTerm(data.modelo_nombre || '');
                                                            setIsModeloDropdownOpen(true);
                                                        }
                                                    }}
                                                    placeholder={!selectedMarcaId && !data.marca_id ? __('Seleccione una marca primero...') : __('Buscar o seleccionar modelo...')}
                                                    disabled={!selectedMarcaId && !data.marca_id}
                                                    className="text-xs h-10 pl-9 pr-8 font-medium"
                                                    required
                                                />
                                                {data.modelo_nombre && (
                                                    <button
                                                        type="button"
                                                        onClick={handleClearModelo}
                                                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                                        title={__('Limpiar modelo')}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* DROPDOWN SELECT2 MODELOS */}
                                            {isModeloDropdownOpen && (
                                                <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl divide-y divide-slate-100 dark:divide-slate-800">
                                                    {modelosFiltradosBusqueda.length > 0 ? (
                                                        modelosFiltradosBusqueda.map((mod) => (
                                                            <button
                                                                key={mod.id}
                                                                type="button"
                                                                onClick={() => handleSelectModeloObj(mod)}
                                                                className={cn(
                                                                    'w-full px-4 py-2.5 text-left text-xs flex items-center justify-between transition-colors',
                                                                    String(mod.id) === data.modelo_id
                                                                        ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 font-bold'
                                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                                                                )}
                                                            >
                                                                <span>{mod.nombre_comercial}</span>
                                                                {String(mod.id) === data.modelo_id && (
                                                                    <Check className="w-4 h-4 text-purple-600" />
                                                                )}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="p-3 text-xs text-center text-slate-400 space-y-2">
                                                            <span>{__('No se encontró el modelo.')}</span>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setNewModeloNombre(searchModeloTerm);
                                                                    setOpenNewModeloModal(true);
                                                                    setIsModeloDropdownOpen(false);
                                                                }}
                                                                className="w-full text-xs text-purple-700 border-purple-300"
                                                            >
                                                                <Plus className="w-3.5 h-3.5 mr-1" />
                                                                {__('Crear')} "{searchModeloTerm}"
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* SERIE / IMEI CORTO */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <Label className="text-xs font-semibold">{__('Serie / IMEI Corto (5 dígitos)')}</Label>
                                            {data.imei_serie && (
                                                <span className="text-[10px] font-mono font-bold">
                                                    {data.imei_serie.length === 5 ? (
                                                        <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                                            ✓ Serie corta válida (5 dígitos)
                                                        </span>
                                                    ) : (
                                                        <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                                                            {__('Debe tener exactamente 5 dígitos')}
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Input
                                                value={data.imei_serie}
                                                onChange={(e) => handleImeiChange(e.target.value)}
                                                placeholder={__('Serie/IMEI corto (5 dígitos, opcional)')}
                                                inputMode="numeric"
                                                maxLength={5}
                                                className={cn(
                                                    "text-xs h-10 font-mono font-semibold pr-8",
                                                    data.imei_serie && data.imei_serie.length === 5
                                                        ? "border-emerald-500 focus-visible:ring-emerald-500"
                                                        : data.imei_serie && data.imei_serie.length > 0
                                                            ? "border-rose-500 focus-visible:ring-rose-500"
                                                            : ""
                                                )}
                                            />
                                            {isCheckingImei && (
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin absolute right-3 top-3 text-purple-600" />
                                            )}
                                        </div>

                                        {/* DETECCIÓN POR INTERNET TAC / GSMA */}
                                        {imeiHistoryData?.onlineDevice && (!imeiHistoryData.count || imeiHistoryData.count === 0) && (
                                            <div className="mt-2.5 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-in fade-in duration-300">
                                                <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-medium">
                                                    <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                                    <span>
                                                        {__('Dispositivo Detectado por Internet (TAC GSMA):')} <strong className="font-bold text-purple-700 dark:text-purple-300">{imeiHistoryData.onlineDevice.brand} {imeiHistoryData.onlineDevice.model}</strong>
                                                    </span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => {
                                                        const dev = imeiHistoryData.onlineDevice;
                                                        if (dev) {
                                                            if (dev.marca_id) {
                                                                handleSelectMarcaObj(dev);
                                                            } else {
                                                                setData((prev) => ({ ...prev, marca_nombre: dev.brand }));
                                                                setSearchMarcaTerm(dev.brand);
                                                            }
                                                            setTimeout(() => {
                                                                setData((prev) => ({
                                                                    ...prev,
                                                                    modelo_id: dev.modelo_id ? String(dev.modelo_id) : '',
                                                                    modelo_nombre: dev.model || dev.modelo_nombre || '',
                                                                }));
                                                                setSearchModeloTerm(dev.model || dev.modelo_nombre || '');
                                                            }, 50);
                                                            notifySuccess(__('Marca y Modelo autocompletados desde la consulta en internet.'));
                                                        }
                                                    }}
                                                    className="h-7 text-[10px] font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1 flex-shrink-0 w-full sm:w-auto"
                                                >
                                                    <Check className="w-3 h-3" />
                                                    {__('Cargar Marca & Modelo')}
                                                </Button>
                                            </div>
                                        )}

                                        {/* TARJETA DE HISTORIAL PREVIO DEL EQUIPO SI EXISTE */}
                                        {imeiHistoryData && imeiHistoryData.count > 0 && (
                                            <div className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs space-y-2 animate-in fade-in duration-300">
                                                <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                                                    <span className="flex items-center gap-1.5">
                                                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                                                        {__('¡Equipo Registrado Anteriormente!')}
                                                    </span>
                                                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 font-mono text-[10px]">
                                                        {imeiHistoryData.count} {imeiHistoryData.count === 1 ? __('Ingreso Previo') : __('Ingresos Previos')}
                                                    </Badge>
                                                </div>

                                                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                                                    {__('Última recepción:')} <strong className="font-mono">{imeiHistoryData.ultimaOrden?.numero_orden}</strong> - {imeiHistoryData.ultimaOrden?.fecha_recepcion?.split('T')[0]} ({imeiHistoryData.ultimaOrden?.estado_orden?.replace('_', ' ')})
                                                    <br />
                                                    {__('Cliente previo:')} <strong>{imeiHistoryData.ultimaOrden?.cliente_nombre}</strong> | {__('Falla:')} <em>"{imeiHistoryData.ultimaOrden?.descripcion_falla}"</em>
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* DESCRIPCIÓN DE LA FALLA */}
                                    <div className="pt-2">
                                        <Label className="text-xs font-semibold">{__('Descripción de la Falla Reportada *')}</Label>
                                        <Textarea
                                            value={data.descripcion_falla}
                                            onChange={(e) => setData('descripcion_falla', e.target.value)}
                                            placeholder={__('Describa en detalle qué problema presenta el dispositivo...')}
                                            rows={3}
                                            className="text-xs mt-1"
                                            required
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* SECCIÓN 4: SERVICIOS DE REPARACIÓN REQUERIDOS (CARRITO) */}
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-visible">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                        <Wrench className="w-4 h-4 text-purple-600" />
                                        {__('4. Servicios de Reparación Requeridos')}
                                    </CardTitle>

                                    {/* MODAL CREAR NUEVO SERVICIO RÁPIDO */}
                                    <Dialog open={openNewServicioModal} onOpenChange={setOpenNewServicioModal}>
                                        <DialogTrigger asChild>
                                            <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5 text-xs font-bold text-purple-700 border-purple-300 hover:bg-purple-50 dark:text-purple-300 dark:border-purple-800">
                                                <Plus className="w-4 h-4 text-purple-600" />
                                                {__('+ Crear Nuevo Servicio')}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                                    <Wrench className="w-5 h-5 text-purple-600" />
                                                    {__('Crear Nuevo Servicio de Reparación')}
                                                </DialogTitle>
                                            </DialogHeader>

                                            <div className="space-y-4 py-2">
                                                <div>
                                                    <Label className="text-xs font-semibold">{__('Categoría de Dispositivo / Servicio *')}</Label>
                                                    <Select
                                                        value={newServicioData.categoria_id}
                                                        onValueChange={(val) => setNewServicioData({ ...newServicioData, categoria_id: val })}
                                                    >
                                                        <SelectTrigger className="text-xs h-9 mt-1 w-full">
                                                            <SelectValue placeholder={__('Seleccionar Categoría...')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {categorias.map((cat) => (
                                                                <SelectItem key={cat.id} value={String(cat.id)}>
                                                                    {cat.nombre}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <Label className="text-xs font-semibold">{__('Código / SKU')}</Label>
                                                        <Input
                                                            value={newServicioData.codigo}
                                                            onChange={(e) => setNewServicioData({ ...newServicioData, codigo: e.target.value })}
                                                            placeholder="Ej: SRV-001"
                                                            className="text-xs h-9 mt-1 font-mono"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs font-semibold">{__('Precio Base *')} ({currencySymbol})</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={newServicioData.precio}
                                                            onChange={(e) => setNewServicioData({ ...newServicioData, precio: e.target.value })}
                                                            placeholder="Ej: 25.00"
                                                            className="text-xs h-9 mt-1 font-mono font-bold"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label className="text-xs font-semibold">{__('Nombre del Servicio *')}</Label>
                                                    <Input
                                                        value={newServicioData.nombre}
                                                        onChange={(e) => setNewServicioData({ ...newServicioData, nombre: e.target.value })}
                                                        placeholder={__('ej: Cambio de Pantalla OLED, Pin de Carga')}
                                                        className="text-xs h-9 mt-1"
                                                    />
                                                </div>

                                                <div>
                                                    <Label className="text-xs font-semibold">{__('Descripción (Opcional)')}</Label>
                                                    <Textarea
                                                        value={newServicioData.descripcion}
                                                        onChange={(e) => setNewServicioData({ ...newServicioData, descripcion: e.target.value })}
                                                        placeholder={__('Detalles del trabajo a realizar...')}
                                                        rows={2}
                                                        className="text-xs mt-1"
                                                    />
                                                </div>

                                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                    <Button type="button" variant="outline" size="sm" onClick={() => setOpenNewServicioModal(false)} className="h-8 text-xs">
                                                        {__('Cancelar')}
                                                    </Button>
                                                    <Button type="button" onClick={(e) => handleCreateNewServicio(e)} disabled={isCreatingServicio} size="sm" className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white">
                                                        {__('Guardar y Agregar a la Orden')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </CardHeader>

                                <CardContent className="p-4 space-y-4">
                                    {/* BUSCADOR DE SERVICIOS EN TIEMPO REAL */}
                                    <div className="relative w-full">
                                        <Label className="text-xs font-semibold">{__('Buscar y Agregar Servicios a la Orden *')}</Label>
                                        <div className="relative mt-1">
                                            <Search className="w-4 h-4 absolute left-3 top-3.5 text-purple-600" />
                                            <Input
                                                value={searchServicioTerm}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setSearchServicioTerm(val);
                                                    setIsServicioDropdownOpen(true);
                                                }}
                                                onFocus={() => {
                                                    setIsServicioDropdownOpen(true);
                                                }}
                                                placeholder={__('Haga clic o escriba para buscar un servicio (ej: Pantalla, Batería, Limpieza...)...')}
                                                className="text-xs h-11 pl-9 pr-8 font-medium"
                                            />
                                            {searchServicioTerm && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSearchServicioTerm('');
                                                        setIsServicioDropdownOpen(false);
                                                    }}
                                                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* DROPDOWN SERVICIOS */}
                                        {isServicioDropdownOpen && (
                                            <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl divide-y divide-slate-100 dark:divide-slate-800">
                                                {serviciosFiltrados.length > 0 ? (
                                                    serviciosFiltrados.map((s) => (
                                                        <button
                                                            key={s.id}
                                                            type="button"
                                                            onClick={() => handleAddServicioToCart(s)}
                                                            className="w-full px-4 py-3 text-left text-xs hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center justify-between transition-colors"
                                                        >
                                                            <div>
                                                                <span className="font-bold text-slate-900 dark:text-slate-100 block">{s.nombre}</span>
                                                                {s.categoria?.nombre && (
                                                                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block">
                                                                        📁 {s.categoria.nombre}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="font-extrabold text-purple-700 dark:text-purple-300 font-mono text-sm block">
                                                                    {currencySymbol}{Number(s.precio).toFixed(2)}
                                                                </span>
                                                                <span className="text-[10px] text-emerald-600 font-bold">+ Agregar</span>
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-xs text-slate-400">
                                                        {__('No se encontraron servicios registrados.')}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* TABLA DEL CARRITO DE SERVICIOS */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">{__('Servicios Seleccionados en esta Orden:')}</Label>
                                        {cartServicios.length > 0 ? (
                                            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                                                        <tr>
                                                            <th className="p-3">{__('Servicio')}</th>
                                                            <th className="p-3 text-right">{__('Precio Unit.')}</th>
                                                            <th className="p-3 text-center">{__('Cant.')}</th>
                                                            <th className="p-3 text-right">{__('Subtotal')}</th>
                                                            <th className="p-3 text-center"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                        {cartServicios.map((item, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                                                <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                                                                    {item.nombre}
                                                                    {item.categoria_nombre && (
                                                                        <span className="text-[10px] text-purple-600 block font-normal">{item.categoria_nombre}</span>
                                                                    )}
                                                                </td>
                                                                <td className="p-3 text-right font-mono">
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={item.precio}
                                                                        onChange={(e) => handleUpdateCartItemPrecio(idx, parseFloat(e.target.value) || 0)}
                                                                        className="w-20 text-right h-7 text-xs font-mono font-semibold border rounded px-1"
                                                                    />
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleUpdateCartItemCantidad(idx, item.cantidad - 1)}
                                                                            className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-300"
                                                                        >
                                                                            -
                                                                        </button>
                                                                        <span className="w-8 text-center font-mono font-bold">{item.cantidad}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleUpdateCartItemCantidad(idx, item.cantidad + 1)}
                                                                            className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-300"
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td className="p-3 text-right font-extrabold text-purple-700 dark:text-purple-300 font-mono">
                                                                    {currencySymbol}{item.subtotal.toFixed(2)}
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveCartItem(idx)}
                                                                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                                                                        title={__('Eliminar del carrito')}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="bg-purple-50/70 dark:bg-purple-950/40 font-bold text-xs">
                                                        <tr>
                                                            <td colSpan={3} className="p-3 text-right font-bold text-purple-900 dark:text-purple-200">
                                                                {__('Total Servicios en la Orden:')}
                                                            </td>
                                                            <td className="p-3 text-right font-black text-purple-700 dark:text-purple-300 text-sm font-mono">
                                                                {currencySymbol}{totalCartServicios.toFixed(2)}
                                                            </td>
                                                            <td></td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 space-y-1">
                                                <Wrench className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                                                <p className="text-xs font-semibold">{__('No se ha agregado ningún servicio a esta orden.')}</p>
                                                <p className="text-[11px] text-slate-400">{__('Utilice el buscador arriba para agregar servicios o cree uno nuevo.')}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* SECCIÓN 5: PRESUPUESTO, ADELANTO Y TÉCNICO ASIGNADO */}
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                        <DollarSign className="w-4 h-4 text-emerald-600" />
                                        {__('5. Presupuesto, Adelanto y Técnico Asignado')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs font-semibold">{__('Costo Estimado (Total)')}</Label>
                                            <div className="relative mt-1">
                                                <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">{currencySymbol}</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={data.costo_estimado}
                                                    onChange={(e) => setData('costo_estimado', e.target.value)}
                                                    className="text-xs h-10 pl-8 font-mono font-bold text-slate-900 dark:text-slate-100"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-xs font-semibold">{__('Anticipo / Adelanto Recibido')}</Label>
                                            <div className="relative mt-1">
                                                <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-emerald-600">{currencySymbol}</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={data.anticipo}
                                                    onChange={(e) => setData('anticipo', e.target.value)}
                                                    className="text-xs h-10 pl-8 font-mono font-bold text-emerald-600"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-xs font-semibold">{__('Técnico de Taller Asignado')}</Label>
                                        <Select value={data.tecnico_id} onValueChange={(val) => setData('tecnico_id', val)}>
                                            <SelectTrigger className="text-xs h-10 mt-1">
                                                <SelectValue placeholder={__('Seleccionar técnico de la lista...')} />
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
                                </CardContent>
                            </Card>

                            {/* SECCIÓN 6: SEGURIDAD DEL DISPOSITIVO (3 OPCIONES COMPACTAS) */}
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                        <Lock className="w-4 h-4 text-purple-600" />
                                        {__('6. Seguridad del Dispositivo')}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-4 space-y-4">
                                    {/* SELECTOR COMPACTO DE 3 OPCIONES */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'sin_contrasena', label: __('Sin contraseña'), icon: '🔓' },
                                            { id: 'pin_contrasena', label: __('PIN / Contraseña'), icon: '🔑' },
                                            { id: 'patron', label: __('Patrón 3x3'), icon: '🌀' },
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => {
                                                    setTipoSeguridad(item.id as 'sin_contrasena' | 'pin_contrasena' | 'patron');
                                                    if (item.id !== 'patron') {
                                                        setPatronSecuencia([]);
                                                    }
                                                }}
                                                className={cn(
                                                    'p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2',
                                                    tipoSeguridad === item.id
                                                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-sm'
                                                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                )}
                                            >
                                                <span>{item.icon}</span>
                                                <span>{item.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/60 dark:bg-slate-950/40">
                                        {tipoSeguridad === 'sin_contrasena' && (
                                            <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold text-center py-1">
                                                {__('Este equipo se registra sin clave o patrón de bloqueo.')}
                                            </div>
                                        )}

                                        {tipoSeguridad === 'pin_contrasena' && (
                                            <div>
                                                <Label className="text-xs font-semibold">{__('Ingrese el PIN o Contraseña de desbloqueo')}</Label>
                                                <Input
                                                    value={claveSeguridad}
                                                    onChange={(e) => setClaveSeguridad(e.target.value)}
                                                    placeholder={__('Ej: 1234 o ClaveCliente')}
                                                    className="text-xs h-10 mt-1 font-mono"
                                                />
                                            </div>
                                        )}

                                        {tipoSeguridad === 'patron' && (
                                            <div className="space-y-3 flex flex-col items-center">
                                                <Label className="text-xs font-semibold">{__('Dibujar Patrón 3x3')}</Label>
                                                <PatternLockInput
                                                    pattern={patronSecuencia}
                                                    onChange={setPatronSecuencia}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* SECCIÓN 7: EVIDENCIAS FOTOGRÁFICAS DEL EQUIPO (4 ÁNGULOS) */}
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                        <Camera className="w-4 h-4 text-purple-600" />
                                        {__('7. Evidencias Fotográficas del Equipo (4 Ángulos)')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <p className="text-xs text-slate-500">
                                        {__('Tome o adjunte fotografías del equipo desde 4 ángulos clave para respaldar las condiciones físicas de recepción:')}
                                    </p>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { key: 'frente', label: '📱 1. Frente / Pantalla', desc: 'Display & Cristal' },
                                            { key: 'trasero', label: '🔄 2. Tapa Trasera', desc: 'Módulo de Cámaras' },
                                            { key: 'borde_sup', label: '📐 3. Borde Sup. / Izq.', desc: 'Bisel y Esquinas' },
                                            { key: 'borde_inf', label: '🔌 4. Borde Inf. / Der.', desc: 'Puerto de Carga' },
                                        ].map((slot) => {
                                            const fotoUrl = fotosState[slot.key];
                                            return (
                                                <div key={slot.key} className="flex flex-col items-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 gap-2 text-center">
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{slot.label}</span>
                                                    <span className="text-[10px] text-slate-400">{slot.desc}</span>

                                                    {fotoUrl ? (
                                                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-purple-300 dark:border-purple-800 group">
                                                            <img src={fotoUrl} alt={slot.label} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={() => startCameraStream(slot.key, slot.label)}
                                                                    className="h-7 px-2 text-[10px] font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1"
                                                                >
                                                                    <Camera className="w-3 h-3" />
                                                                    {__('Recapturar')}
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => handleRemoveFoto(slot.key)}
                                                                    className="h-7 w-7 p-0"
                                                                    title={__('Eliminar foto')}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-32 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-2 gap-2">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={() => startCameraStream(slot.key, slot.label)}
                                                                className="w-full h-9 text-[11px] font-extrabold bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-sm"
                                                            >
                                                                <Camera className="w-3.5 h-3.5" />
                                                                {__('Tomar Foto')}
                                                            </Button>

                                                            <label className="w-full text-center">
                                                                <span className="text-[10px] font-semibold text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer flex items-center justify-center gap-1">
                                                                    <Upload className="w-3 h-3" />
                                                                    {__('Subir Archivo')}
                                                                </span>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => handleFotoUpload(slot.key, e)}
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

                            {/* MODAL CÁMARA WEBCAM EN VIVO */}
                            <Dialog open={!!activeCameraSlot} onOpenChange={(open) => { if (!open) stopCameraStream(); }}>
                                <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-slate-950 text-white border-slate-800">
                                    <DialogHeader className="p-4 bg-slate-900 border-b border-slate-800 flex flex-row items-center justify-between">
                                        <DialogTitle className="flex items-center gap-2 text-sm font-bold text-white">
                                            <Camera className="w-5 h-5 text-purple-400" />
                                            {__('Capturar Evidencia Fotográfica:')} <span className="text-purple-300 font-mono">{cameraSlotLabel}</span>
                                        </DialogTitle>
                                        <Button type="button" variant="ghost" size="sm" onClick={stopCameraStream} className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </DialogHeader>

                                    <div className="p-4 space-y-4">
                                        {cameraError ? (
                                            <div className="p-6 text-center space-y-3 bg-rose-950/40 border border-rose-800 rounded-xl">
                                                <ShieldAlert className="w-10 h-10 mx-auto text-rose-500" />
                                                <p className="text-xs text-rose-200 font-medium">{cameraError}</p>
                                                <Button type="button" variant="outline" size="sm" onClick={stopCameraStream} className="text-xs text-white border-slate-700">
                                                    {__('Cerrar y usar subida de archivo')}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-2xl">
                                                <canvas ref={canvasRef} className="hidden" />

                                                {isCameraLoading && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 gap-2 text-xs text-slate-300">
                                                        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
                                                        <span>{__('Iniciando cámara...')}</span>
                                                    </div>
                                                )}

                                                {capturedImage ? (
                                                    <div className="relative w-full h-full">
                                                        <img src={capturedImage} alt="Captura" className="w-full h-full object-contain" />
                                                        <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-md">
                                                            ✓ {__('Captura lista')}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <video
                                                        ref={videoRef}
                                                        autoPlay
                                                        playsInline
                                                        muted
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}

                                                {!capturedImage && !isCameraLoading && (
                                                    <div className="absolute inset-0 pointer-events-none border-2 border-purple-500/30 m-4 rounded-lg flex items-center justify-center">
                                                        <div className="w-10 h-10 border-t-2 border-l-2 border-purple-400 absolute top-0 left-0" />
                                                        <div className="w-10 h-10 border-t-2 border-r-2 border-purple-400 absolute top-0 right-0" />
                                                        <div className="w-10 h-10 border-b-2 border-l-2 border-purple-400 absolute bottom-0 left-0" />
                                                        <div className="w-10 h-10 border-b-2 border-r-2 border-purple-400 absolute bottom-0 right-0" />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {!cameraError && (
                                            <div className="flex items-center justify-between pt-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={toggleFacingMode}
                                                    className="text-xs bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                    {__('Voltear Cámara')}
                                                </Button>

                                                {capturedImage ? (
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleRetakeSnapshot}
                                                            className="text-xs bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
                                                        >
                                                            {__('Repetir Foto')}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={handleAcceptCapturedPhoto}
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
                                                        onClick={handleCaptureSnapshot}
                                                        disabled={isCameraLoading}
                                                        className="h-10 px-6 font-extrabold bg-purple-600 hover:bg-purple-700 text-white shadow-lg rounded-full gap-2 text-xs"
                                                    >
                                                        <Camera className="w-4 h-4" />
                                                        {__('CAPTURAR FOTO')}
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>

                            {/* BOTÓN FINAL DE GUARDAR ORDEN */}
                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full h-12 text-sm font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xl gap-2 rounded-xl"
                                >
                                    <Save className="w-5 h-5" />
                                    {__('FINALIZAR Y REGISTRAR ORDEN DE REPARACIÓN')}
                                </Button>
                            </div>

                    </div>
                </form>
            </div>
        </>
    );
}
