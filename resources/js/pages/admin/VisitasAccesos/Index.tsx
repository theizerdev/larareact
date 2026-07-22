import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { 
    ShieldCheck, 
    User, 
    Truck, 
    Search, 
    Plus, 
    Calendar, 
    Clock, 
    LogOut, 
    CheckCircle, 
    XCircle, 
    Camera, 
    Car, 
    Footprints, 
    Users,
    FileText,
    ChevronRight,
    RefreshCw,
    Pencil,
    MoreVertical,
    UserCheck,
    Check,
    AlertTriangle,
    Image,
    Upload,
    Trash2,
    MessageSquare,
    Send,
    ExternalLink,
    Printer,
    Eye,
    Info,
    Building,
    Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { DataTable } from '@/components/data-table';
import type { ColumnDef } from '@/components/data-table';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams } from '@/lib/utils';

interface VisitaAcceso {
    id: number;
    codigo_visitante: number;
    tipo_acceso: 'empleado' | 'proveedor';
    empleado_id?: number | null;
    proveedor_id?: number | null;
    proveedor_empleado_id?: number | null;
    medio_acceso: 'peatonal' | 'vehicular';
    empleado_vehiculo_id?: number | null;
    proveedor_vehiculo_id?: number | null;
    vehiculo_tipo?: string | null;
    vehiculo_marca?: string | null;
    vehiculo_modelo?: string | null;
    vehiculo_placa?: string | null;
    vehiculo_foto_frontal?: string | null;
    vehiculo_foto_trasera?: string | null;
    fecha_ingreso: string;
    hora_ingreso: string;
    fecha_salida?: string | null;
    hora_salida?: string | null;
    responsable_id?: number | null;
    observaciones?: string | null;
    acompanantes?: any[] | null;
    status: number;
    empleado?: any;
    proveedor?: any;
    proveedor_empleado?: any;
    empleado_vehiculo?: any;
    proveedor_vehiculo?: any;
    responsable?: any;
}

interface Paginated<T> {
    data: T[];
    links: any[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface VisitasAccesosProps {
    accesos: Paginated<VisitaAcceso>;
    stats: {
        total: number;
        en_instalaciones: number;
        finalizados: number;
        empleados: number;
        proveedores: number;
    };
    responsables: any[];
    siguienteCodigo: number;
    filters: {
        search?: string;
        tipo_acceso?: string;
        medio_acceso?: string;
        status?: string;
        perPage?: string;
    };
    empresa?: any;
    sucursal?: any;
}

// ─── Camera Capture Widget ──────────────────────────────────────────────────
interface CameraWidgetProps {
    onCapture: (base64Data: string) => void;
    onCancel: () => void;
}

function CameraWidget({ onCapture, onCancel }: CameraWidgetProps) {
    const { __ } = useTranslate();
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
            setError(__('Sin acceso a la cámara o dispositivo no encontrado.'));
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
        <div className="border rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 flex flex-col items-center gap-3">
            {error && (
                <div className="text-rose-500 flex flex-col items-center gap-2 text-center text-sm py-4">
                    <AlertTriangle className="w-8 h-8" />
                    <span>{error}</span>
                </div>
            )}

            {!error && !captured && (
                <div className="relative w-full max-w-[360px] aspect-[4/3] bg-black rounded-xl overflow-hidden border">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                        <Button
                            type="button"
                            size="sm"
                            onClick={capture}
                            className="bg-[#104a29] hover:bg-[#0c371e] text-white shadow-md flex items-center gap-1.5"
                        >
                            <Camera className="w-4 h-4" />
                            {__('Capturar Foto')}
                        </Button>
                    </div>
                </div>
            )}

            {captured && (
                <div className="flex flex-col items-center gap-3 w-full">
                    <div className="w-full max-w-[360px] aspect-[4/3] rounded-xl overflow-hidden border">
                        <img src={captured} alt="Captura preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => startCamera()}
                            className="flex items-center gap-1"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            {__('Repetir')}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => onCapture(captured)}
                            className="flex items-center gap-1 bg-[#104a29] hover:bg-[#0c371e] text-white"
                        >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {__('Usar esta foto')}
                        </Button>
                    </div>
                </div>
            )}

            <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="text-slate-500 mt-1">
                {__('Cancelar')}
            </Button>
        </div>
    );
}

export default function Index({
    accesos = { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0, links: [] },
    stats = { total: 0, en_instalaciones: 0, finalizados: 0, empleados: 0, proveedores: 0 },
    responsables = [],
    siguienteCodigo = 80000001,
    filters = {},
}: VisitasAccesosProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/dashboard' },
        { title: __('Accesos a Instalaciones'), href: '/admin/visitas-accesos' },
    ];

    // Estados de filtros y tabla
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [tipoAccesoFilter, setTipoAccesoFilter] = useState(filters.tipo_acceso || 'all');
    const [medioAccesoFilter, setMedioAccesoFilter] = useState(filters.medio_acceso || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '10');
    const [isTableLoading, setIsTableLoading] = useState(false);

    // Modal estado creación
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [tipoAcceso, setTipoAcceso] = useState<'empleado' | 'proveedor'>('empleado');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState<any>(null);

    // Modal de Detalle Completo de Acceso
    const [selectedAccesoDetail, setSelectedAccesoDetail] = useState<VisitaAcceso | null>(null);

    // Acompañantes en el vehículo
    const [acompanantesList, setAcompanantesList] = useState<any[]>([]);
    const [acompananteSearchTerm, setAcompananteSearchTerm] = useState('');
    const [acompananteSearchResults, setAcompananteSearchResults] = useState<any[]>([]);
    const [isSearchingAcompanantes, setIsSearchingAcompanantes] = useState(false);

    // Polling de Autorización en tiempo real desde WhatsApp
    const [activeAuthToken, setActiveAuthToken] = useState<string | null>(null);
    const [autorizacionRecibida, setAutorizacionRecibida] = useState<{
        status: string;
        motivo: string;
        responsable: string;
    } | null>(null);

    // Modal para ver lista de acompañantes únicamente
    const [selectedItemForAcompanantes, setSelectedItemForAcompanantes] = useState<any | null>(null);

    // Vehículo
    const [medioAcceso, setMedioAcceso] = useState<'peatonal' | 'vehicular'>('peatonal');
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<string>('nuevo');
    const [vehiculoNuevo, setVehiculoNuevo] = useState({
        tipo: 'Auto',
        marca: '',
        modelo: '',
        placa: '',
        foto_frontal: '',
        foto_trasera: '',
    });

    // Cámara activa
    const [activeCameraField, setActiveCameraField] = useState<'foto_frontal' | 'foto_trasera' | null>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        tipo_acceso: 'empleado',
        empleado_id: '',
        proveedor_id: '',
        proveedor_empleado_id: '',
        medio_acceso: 'peatonal',
        empleado_vehiculo_id: '',
        proveedor_vehiculo_id: '',
        vehiculo_tipo: '',
        vehiculo_marca: '',
        vehiculo_modelo: '',
        vehiculo_placa: '',
        vehiculo_foto_frontal: '',
        vehiculo_foto_trasera: '',
        responsable_id: '',
        observaciones: '',
        acompanantes: [] as any[],
    });

    // Polling en vivo para detectar cuando el Responsable presione "Autorizar" en su pantalla
    useEffect(() => {
        if (!activeAuthToken || autorizacionRecibida?.status === 'autorizado') return;

        const interval = setInterval(() => {
            fetch(`/api/autorizar-acceso/${activeAuthToken}/check`)
                .then((res) => res.json())
                .then((resData) => {
                    if (resData.found && resData.status === 'autorizado') {
                        setAutorizacionRecibida({
                            status: 'autorizado',
                            motivo: resData.motivo_autorizacion || '',
                            responsable: resData.responsable_nombre || '',
                        });
                        setData('observaciones', resData.motivo_autorizacion || '');
                        notifySuccess(__('¡El Responsable ') + (resData.responsable_nombre || '') + __(' autorizó el ingreso desde WhatsApp!'));
                    }
                })
                .catch((err) => console.error(err));
        }, 3000);

        return () => clearInterval(interval);
    }, [activeAuthToken, autorizacionRecibida]);

    // Indicador de carga al cambiar página
    useEffect(() => {
        const unbindStart = router.on('start', () => setIsTableLoading(true));
        const unbindFinish = router.on('finish', () => setIsTableLoading(false));

        return () => {
            unbindStart();
            unbindFinish();
        };
    }, []);

    // Filtros de tabla
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                window.location.pathname,
                cleanParams({
                    search: searchTerm,
                    tipo_acceso: tipoAccesoFilter === 'all' ? '' : tipoAccesoFilter,
                    medio_acceso: medioAccesoFilter === 'all' ? '' : medioAccesoFilter,
                    status: statusFilter === 'all' ? '' : statusFilter,
                    perPage: perPageFilter,
                }),
                { preserveState: true, preserveScroll: true }
            );
        }, 400);

        return () => clearTimeout(timer);
    }, [searchTerm, tipoAccesoFilter, medioAccesoFilter, statusFilter, perPageFilter]);

    // Búsqueda dinámica de conductor principal
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(() => {
            setIsSearching(true);
            fetch(`/admin/visitas-accesos/buscar-entidades?tipo_acceso=${tipoAcceso}&query=${encodeURIComponent(searchQuery)}`)
                .then((res) => res.json())
                .then((resData) => {
                    setSearchResults(resData);
                    setIsSearching(false);
                })
                .catch(() => setIsSearching(false));
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, tipoAcceso]);

    // Búsqueda dinámica de acompañantes empleados
    useEffect(() => {
        if (!acompananteSearchTerm || acompananteSearchTerm.length < 2) {
            setAcompananteSearchResults([]);
            return;
        }

        const timer = setTimeout(() => {
            setIsSearchingAcompanantes(true);
            fetch(`/admin/visitas-accesos/buscar-entidades?tipo_acceso=empleado&query=${encodeURIComponent(acompananteSearchTerm)}`)
                .then((res) => res.json())
                .then((resData) => {
                    const filtrados = resData.filter(
                        (emp: any) =>
                            emp.id !== selectedEntity?.id &&
                            !acompanantesList.some((ac) => ac.id === emp.id)
                    );
                    setAcompananteSearchResults(filtrados);
                    setIsSearchingAcompanantes(false);
                })
                .catch(() => setIsSearchingAcompanantes(false));
        }, 300);

        return () => clearTimeout(timer);
    }, [acompananteSearchTerm, selectedEntity, acompanantesList]);

    const handleSelectEntity = (entity: any) => {
        setSelectedEntity(entity);
        if (tipoAcceso === 'empleado') {
            setData((prev) => ({
                ...prev,
                tipo_acceso: 'empleado',
                empleado_id: entity.id,
                proveedor_id: '',
                proveedor_empleado_id: '',
                responsable_id: entity.responsable_id ? String(entity.responsable_id) : '',
            }));

            if (entity.vehiculos && entity.vehiculos.length > 0) {
                setVehiculoSeleccionado(entity.vehiculos[0].id.toString());
            } else {
                setVehiculoSeleccionado('nuevo');
            }
        } else {
            setData((prev) => ({
                ...prev,
                tipo_acceso: 'proveedor',
                proveedor_id: entity.id,
                empleado_id: '',
            }));

            if (entity.vehiculos_proveedor && entity.vehiculos_proveedor.length > 0) {
                setVehiculoSeleccionado(entity.vehiculos_proveedor[0].id.toString());
            } else {
                setVehiculoSeleccionado('nuevo');
            }
        }
    };

    const handleAddAcompanante = (emp: any) => {
        const itemObj = {
            id: emp.id,
            nombres: emp.nombres,
            apellidos: emp.apellidos,
            documento_identidad: emp.documento_identidad,
            foto_empleado: emp.foto_empleado,
            departamento: emp.departamento?.nombre || '',
            cargo: emp.cargo?.nombre || '',
            jornada_laboral: emp.jornada_laboral,
        };
        const nuevaLista = [...acompanantesList, itemObj];
        setAcompanantesList(nuevaLista);
        setData('acompanantes', nuevaLista);
        setAcompananteSearchTerm('');
        setAcompananteSearchResults([]);
        notifySuccess(__('Acompañante añadido al vehículo.'));
    };

    const handleRemoveAcompanante = (id: number) => {
        const nuevaLista = acompanantesList.filter((ac) => ac.id !== id);
        setAcompanantesList(nuevaLista);
        setData('acompanantes', nuevaLista);
    };

    const handleSolicitarWhatsapp = async (empleadoNombre: string, empleadoDocumento: string, esAcompanante: boolean = false) => {
        if (!data.responsable_id) {
            notifyError(__('Por favor seleccione primero un Responsable / Anfitrión para enviarle la solicitud de WhatsApp.'));
            return;
        }

        try {
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
                return '';
            };
            const csrfToken = getCookie('XSRF-TOKEN');

            const response = await fetch('/admin/visitas-accesos/solicitar-autorizacion-whatsapp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    responsable_id: data.responsable_id,
                    empleado_id: selectedEntity?.id || null,
                    empleado_nombre: empleadoNombre,
                    empleado_documento: empleadoDocumento,
                    es_acompanante: esAcompanante,
                }),
            });

            const resData = await response.json();
            if (resData && resData.success) {
                if (resData.token) {
                    setActiveAuthToken(resData.token);
                }
                notifySuccess(__('Solicitud con enlace enviada al Responsable vía WhatsApp. Esperando su autorización en tiempo real...'));
                if (resData.whatsapp_url) {
                    window.open(resData.whatsapp_url, '_blank');
                }
            } else {
                notifyError(__('No se pudo enviar la solicitud por WhatsApp.'));
            }
        } catch (err) {
            console.error(err);
            notifyError(__('Error al conectar con el servicio de WhatsApp.'));
        }
    };

    const handleCreateClick = () => {
        reset();
        clearErrors();
        setSelectedEntity(null);
        setAcompanantesList([]);
        setActiveAuthToken(null);
        setAutorizacionRecibida(null);
        setSearchQuery('');
        setAcompananteSearchTerm('');
        setMedioAcceso('peatonal');
        setVehiculoSeleccionado('nuevo');
        setActiveCameraField(null);
        setVehiculoNuevo({
            tipo: 'Auto',
            marca: '',
            modelo: '',
            placa: '',
            foto_frontal: '',
            foto_trasera: '',
        });
        setIsCreateOpen(true);
    };

    const handleSubmitAcceso = (e: React.FormEvent) => {
        e.preventDefault();

        const payload: any = {
            ...data,
            tipo_acceso: tipoAcceso,
            medio_acceso: medioAcceso,
            acompanantes: acompanantesList,
        };

        if (medioAcceso === 'vehicular') {
            if (vehiculoSeleccionado !== 'nuevo') {
                if (tipoAcceso === 'empleado') {
                    payload.empleado_vehiculo_id = vehiculoSeleccionado;
                } else {
                    payload.proveedor_vehiculo_id = vehiculoSeleccionado;
                }

                payload.vehiculo_foto_frontal = vehiculoNuevo.foto_frontal;
                payload.vehiculo_foto_trasera = vehiculoNuevo.foto_trasera;
            } else {
                payload.vehiculo_tipo = vehiculoNuevo.tipo;
                payload.vehiculo_marca = vehiculoNuevo.marca;
                payload.vehiculo_modelo = vehiculoNuevo.modelo;
                payload.vehiculo_placa = vehiculoNuevo.placa;
                payload.vehiculo_foto_frontal = vehiculoNuevo.foto_frontal;
                payload.vehiculo_foto_trasera = vehiculoNuevo.foto_trasera;
            }
        }

        post('/admin/visitas-accesos', {
            data: payload,
            onSuccess: () => {
                setIsCreateOpen(false);
                notifySuccess(__('Acceso a instalaciones registrado correctamente con Código N° ') + siguienteCodigo);
            },
            onError: () => {
                notifyError(__('Verifique los datos ingresados e intente nuevamente.'));
            },
        });
    };

    const handleMarcarSalida = (id: number) => {
        router.patch(`/admin/visitas-accesos/${id}/marcar-salida`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                notifySuccess(__('Salida marcada correctamente.'));
            },
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'foto_frontal' | 'foto_trasera') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setVehiculoNuevo((prev) => ({ ...prev, [field]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Renderizar Horario / Jornada Laboral estructurada
    const renderHorarioJornada = (
        jornada: any, 
        empleadoNombre?: string, 
        empleadoDoc?: string, 
        esAcompanante: boolean = false,
        isDetalleModal: boolean = false
    ) => {
        if (!jornada) return <span className="text-slate-400 italic text-xs">Sin jornada laboral asignada</span>;

        let items: any[] = [];
        if (typeof jornada === 'string') {
            try {
                items = JSON.parse(jornada);
            } catch {
                return <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{jornada}</span>;
            }
        } else if (Array.isArray(jornada)) {
            items = jornada;
        }

        if (!Array.isArray(items) || items.length === 0) {
            return <span className="text-slate-400 italic text-xs">Sin jornada laboral asignada</span>;
        }

        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const hoyNombre = diasSemana[new Date().getDay()];

        const isDiaActivo = (j: any) => {
            if (!j) return false;
            return j.activo === true || j.activo === 1 || j.activo === '1' || j.activo === 'true';
        };

        const jornadaHoy = items.find(
            (j: any) => j.dia && j.dia.toLowerCase() === hoyNombre.toLowerCase()
        );

        const diasActivos = items.filter((j: any) => isDiaActivo(j));
        const autorizadoHabitual = Boolean(jornadaHoy && isDiaActivo(jornadaHoy));
        const autorizadoHoy = autorizadoHabitual || autorizacionRecibida?.status === 'autorizado' || isDetalleModal;

        return (
            <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs">
                            {__('Día de ingreso')} ({hoyNombre}):
                        </span>
                        {autorizadoHoy ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono text-[11px] px-2.5 py-1 flex items-center gap-1.5 shadow-xs">
                                <Check className="w-3.5 h-3.5" />
                                {autorizadoHabitual
                                    ? `${__('Autorizado:')} ${jornadaHoy?.hora_ingreso || '08:00'} a ${jornadaHoy?.hora_salida || '17:00'}`
                                    : isDetalleModal
                                    ? __('Autorizado Excepcionalmente por Responsable ✓')
                                    : __('Autorizado por Responsable vía WhatsApp ✓')}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 text-[11px] px-2.5 py-1 flex items-center gap-1.5 font-semibold">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                {__('Fuera de Horario / Día No Autorizado')}
                            </Badge>
                        )}
                    </div>

                    {/* Botón WhatsApp si NO está autorizado hoy */}
                    {!autorizadoHoy && empleadoNombre && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSolicitarWhatsapp(empleadoNombre, empleadoDoc || '', esAcompanante)}
                            className={`shrink-0 whitespace-nowrap h-9 px-3.5 text-xs font-bold shadow-sm transition-all rounded-xl gap-2 w-full sm:w-auto ${
                                activeAuthToken
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                            }`}
                        >
                            {activeAuthToken ? (
                                <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>{__('Enlace enviado. Esperando respuesta...')}</span>
                                </>
                            ) : (
                                <>
                                    <MessageSquare className="w-4 h-4 text-emerald-100" />
                                    <span>{__('Solicitar Autorización vía WhatsApp')}</span>
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {/* Si el responsable ya aceptó en tiempo real */}
                {autorizacionRecibida?.status === 'autorizado' && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                        <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            {__('Acceso Autorizado por:')} {autorizacionRecibida.responsable}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 italic">
                            "{autorizacionRecibida.motivo}"
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <span className="text-[11px] text-slate-500 font-medium">{__('Horario habitual:')}</span>
                    {diasActivos.length > 0 ? (
                        diasActivos.map((d: any, idx: number) => {
                            const esHoy = d.dia?.toLowerCase() === hoyNombre.toLowerCase();
                            return (
                                <Badge
                                    key={idx}
                                    variant="secondary"
                                    className={`text-[10px] font-mono ${
                                        esHoy
                                            ? 'bg-emerald-600 text-white font-bold'
                                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                                >
                                    {d.dia}: {d.hora_ingreso || '08:00'}-{d.hora_salida || '17:00'}
                                </Badge>
                            );
                        })
                    ) : (
                        <span className="text-[11px] text-slate-400 italic">{__('Sin días activos')}</span>
                    )}
                </div>
            </div>
        );
    };

    // Formatear correctamente la URL de imágenes de almacenamiento para evitar enlaces relativos rotos y errores 403 de directorio
    const formatImageUrl = (path?: string | null) => {
        if (!path) return null;
        const cleanPath = String(path).trim();
        if (
            !cleanPath ||
            cleanPath === 'null' ||
            cleanPath === 'undefined' ||
            cleanPath === '/storage/' ||
            cleanPath === 'storage/' ||
            cleanPath === '/storage' ||
            cleanPath === 'storage' ||
            cleanPath.endsWith('/')
        ) {
            return null;
        }

        if (cleanPath.startsWith('data:') || cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
            return cleanPath;
        }

        // Rechazar directorios o rutas sin extensión de imagen válida (.jpg, .jpeg, .png, .webp, .gif, .svg)
        const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
        const hasValidExt = validExtensions.some((ext) => cleanPath.toLowerCase().endsWith(ext));
        if (!hasValidExt) {
            return null;
        }

        if (cleanPath.startsWith('/storage/')) {
            return cleanPath;
        }
        if (cleanPath.startsWith('storage/')) {
            return `/${cleanPath}`;
        }
        if (cleanPath.startsWith('/')) {
            return cleanPath;
        }
        return `/storage/${cleanPath}`;
    };

    // Obtener objeto del vehículo pre-registrado seleccionado
    const getVehiculoSeleccionadoObj = () => {
        if (!selectedEntity || vehiculoSeleccionado === 'nuevo') return null;
        const listaVehiculos = tipoAcceso === 'empleado' ? selectedEntity.vehiculos : selectedEntity.vehiculos_proveedor;
        return listaVehiculos?.find((v: any) => v.id.toString() === vehiculoSeleccionado) || null;
    };

    const vehiculoObj = getVehiculoSeleccionadoObj();

    // Columnas de la tabla
    const columns: ColumnDef<VisitaAcceso>[] = [
        {
            id: 'codigo_visitante',
            header: __('Código Visitante'),
            cell: (item) => (
                <Badge
                    variant="outline"
                    onClick={() => setSelectedAccesoDetail(item)}
                    className="font-mono font-bold bg-[#104a29]/10 hover:bg-[#104a29]/20 text-[#104a29] border-[#104a29]/30 text-xs px-2.5 py-1 cursor-pointer transition-colors flex items-center gap-1.5 w-fit"
                >
                    <Eye className="w-3 h-3 text-[#104a29]" />
                    N° {item.codigo_visitante}
                </Badge>
            ),
        },
        {
            id: 'visitante',
            header: __('Persona / Entidad'),
            cell: (item) => {
                const isEmp = item.tipo_acceso === 'empleado';
                const nombre = isEmp
                    ? `${item.empleado?.nombres || ''} ${item.empleado?.apellidos || ''}`
                    : item.proveedor_empleado
                    ? `${item.proveedor_empleado?.nombres || ''} ${item.proveedor_empleado?.apellidos || ''}`
                    : item.proveedor?.nombre_comercial || item.proveedor?.razon_social || '-';

                const doc = isEmp
                    ? item.empleado?.documento_identidad
                    : item.proveedor_empleado?.documento_identidad || item.proveedor?.documento_identidad;

                const avatar = isEmp ? item.empleado?.foto_empleado : item.proveedor_empleado?.foto_carnet;
                const tieneAcompanantes = item.acompanantes && item.acompanantes.length > 0;

                return (
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedAccesoDetail(item)}>
                        <div className="w-10 h-10 rounded-full border overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            {avatar ? (
                                <img src={avatar} alt={nombre} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-5 h-5 text-slate-400" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 hover:text-[#104a29]">
                                    {nombre}
                                </span>

                                {tieneAcompanantes && (
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedItemForAcompanantes(item);
                                        }}
                                        className="bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] h-5 px-1.5 gap-1 font-semibold"
                                    >
                                        <Users className="w-3 h-3 text-emerald-600" />
                                        +{item.acompanantes!.length} {item.acompanantes!.length === 1 ? 'Acompañante' : 'Acompañantes'}
                                    </Button>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                                Doc: {doc || '-'}
                                {!isEmp && item.proveedor && (
                                    <span className="ml-1 text-amber-600 dark:text-amber-400">({item.proveedor.nombre_comercial || item.proveedor.razon_social})</span>
                                )}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'tipo_acceso',
            header: __('Tipo Acceso'),
            cell: (item) => (
                item.tipo_acceso === 'empleado' ? (
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900 gap-1">
                        <User className="w-3 h-3" /> {__('Empleado')}
                    </Badge>
                ) : (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900 gap-1">
                        <Truck className="w-3 h-3" /> {__('Proveedor')}
                    </Badge>
                )
            ),
        },
        {
            id: 'medio_acceso',
            header: __('Medio Acceso'),
            cell: (item) => (
                item.medio_acceso === 'vehicular' ? (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
                        <Car className="w-4 h-4" />
                        <span>{__('Vehicular')}</span>
                        {item.vehiculo_placa && <span className="font-mono text-slate-500">({item.vehiculo_placa})</span>}
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                        <Footprints className="w-4 h-4" />
                        <span>{__('Peatonal')}</span>
                    </div>
                )
            ),
        },
        {
            id: 'fecha_ingreso',
            header: __('Ingreso'),
            cell: (item) => (
                <div className="flex flex-col text-xs">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <Calendar className="w-3.5 h-3.5" /> {item.fecha_ingreso} {item.hora_ingreso ? item.hora_ingreso.substring(0, 5) : ''}
                    </span>
                </div>
            ),
        },
        {
            id: 'fecha_salida',
            header: __('Salida'),
            cell: (item) => (
                item.fecha_salida ? (
                    <div className="flex flex-col text-xs text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                            <Clock className="w-3.5 h-3.5" /> {item.fecha_salida} {item.hora_salida ? item.hora_salida.substring(0, 5) : ''}
                        </span>
                    </div>
                ) : (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 italic font-medium">{__('En Instalaciones')}</span>
                )
            ),
        },
        {
            id: 'status',
            header: __('Estatus'),
            cell: (item) => (
                item.status === 1 ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400">
                        {__('En Instalaciones')}
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {__('Finalizado')}
                    </Badge>
                )
            ),
        },
        {
            id: 'actions',
            header: __('Acción'),
            className: 'text-right',
            stopRowClick: true,
            cell: (item) => (
                <div className="flex items-center justify-end gap-1.5">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedAccesoDetail(item)}
                        className="text-slate-600 hover:bg-slate-100 dark:text-slate-300 text-xs gap-1"
                    >
                        <Eye className="h-4 w-4" />
                        {__('Ver')}
                    </Button>

                    {item.status === 1 && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarcarSalida(item.id)}
                            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 text-xs gap-1"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            {__('Salida')}
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title={__('Control de Accesos a Instalaciones')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<ShieldCheck className="h-6 w-6 text-white" />}
                    title={__('Control de Accesos a Instalaciones')}
                    description={__('Gestión unificada de entradas/salidas para Empleados y Proveedores con Código de Visitante (80000001+).')}
                    colorClassName="bg-[#104a29]"
                >
                    <Button onClick={handleCreateClick} className="bg-[#104a29] hover:bg-[#0c371e] text-white w-full sm:w-auto shadow-md">
                        <Plus className="mr-2 h-4 w-4" />
                        {__('Nuevo Registro de Acceso')}
                    </Button>
                </ModuleHeader>

                {/* Tarjetas de Estadísticas Totalmente Responsivas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                    <StatCard
                        icon={<FileText className="h-6 w-6" />}
                        title={__('TOTAL ACCESOS')}
                        value={stats.total}
                        colorClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
                    />
                    <StatCard
                        icon={<UserCheck className="h-6 w-6 animate-pulse" />}
                        title={__('EN INSTALACIONES')}
                        value={stats.en_instalaciones}
                        colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                    />
                    <StatCard
                        icon={<CheckCircle className="h-6 w-6" />}
                        title={__('FINALIZADOS')}
                        value={stats.finalizados}
                        colorClassName="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    />
                    <StatCard
                        icon={<User className="h-6 w-6" />}
                        title={__('EMPLEADOS')}
                        value={stats.empleados}
                        colorClassName="bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                    />
                    <StatCard
                        icon={<Truck className="h-6 w-6" />}
                        title={__('PROVEEDORES')}
                        value={stats.proveedores}
                        colorClassName="bg-amber-100 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                    />
                </div>

                {/* Barra de Filtros */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Buscar Acceso')}>
                            <Input
                                placeholder={__('Buscar por código (80000001+), DNI, Nombre...')}
                                className="w-full md:w-80 bg-white dark:bg-slate-900"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>

                        <FilterField label={__('Tipo Acceso')}>
                            <Select value={tipoAccesoFilter} onValueChange={setTipoAccesoFilter}>
                                <SelectTrigger className="w-full md:w-40 bg-white dark:bg-slate-900">
                                    <SelectValue placeholder={__('Todos')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('Todos')}</SelectItem>
                                    <SelectItem value="empleado">{__('Empleado')}</SelectItem>
                                    <SelectItem value="proveedor">{__('Proveedor')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={__('Medio Acceso')}>
                            <Select value={medioAccesoFilter} onValueChange={setMedioAccesoFilter}>
                                <SelectTrigger className="w-full md:w-40 bg-white dark:bg-slate-900">
                                    <SelectValue placeholder={__('Todos')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('Todos')}</SelectItem>
                                    <SelectItem value="peatonal">{__('Peatonal')}</SelectItem>
                                    <SelectItem value="vehicular">{__('Vehicular')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={__('Estatus')}>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-40 bg-white dark:bg-slate-900">
                                    <SelectValue placeholder={__('Todos')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('Todos')}</SelectItem>
                                    <SelectItem value="1">{__('En Instalaciones')}</SelectItem>
                                    <SelectItem value="2">{__('Finalizado')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                    </div>
                </FilterBar>

                {/* Tabla Data */}
                <DataTable
                    columns={columns}
                    data={accesos}
                    isLoading={isTableLoading}
                    filters={filters}
                    onRowClick={(item) => setSelectedAccesoDetail(item)}
                />

                {/* MODAL DETALLE COMPLETO Y PROFESIONAL DE ACCESO */}
                <Dialog open={!!selectedAccesoDetail} onOpenChange={() => setSelectedAccesoDetail(null)}>
                    <DialogContent className="max-w-5xl sm:max-w-6xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-8">
                        {selectedAccesoDetail && (
                            <div className="space-y-6">
                                {/* Encabezado Principal de la Ficha */}
                                <DialogHeader className="border-b pb-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-[#104a29]/10 text-[#104a29] rounded-2xl">
                                                <ShieldCheck className="w-8 h-8 text-[#104a29]" />
                                            </div>
                                            <div>
                                                <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                                                    <span>{__('Ficha de Registro de Acceso')}</span>
                                                    <Badge variant="outline" className="font-mono text-base bg-[#104a29]/10 text-[#104a29] border-[#104a29]/30">
                                                        N° {selectedAccesoDetail.codigo_visitante}
                                                    </Badge>
                                                </DialogTitle>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {__('Registro oficial de control de garita de instalaciones')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {selectedAccesoDetail.status === 1 ? (
                                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-sm px-3 py-1 animate-pulse">
                                                    {__('En Instalaciones')}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-sm px-3 py-1">
                                                    {__('Finalizado')}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </DialogHeader>

                                {/* Badges informativos de Tipo y Medio */}
                                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                                            <span className="text-slate-500 uppercase">{__('Tipo:')}</span>
                                            {selectedAccesoDetail.tipo_acceso === 'empleado' ? (
                                                <Badge className="bg-blue-100 text-blue-800 border-blue-300">Empleado</Badge>
                                            ) : (
                                                <Badge className="bg-amber-100 text-amber-800 border-amber-300">Proveedor</Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                                            <span className="text-slate-500 uppercase">{__('Medio:')}</span>
                                            {selectedAccesoDetail.medio_acceso === 'vehicular' ? (
                                                <Badge className="bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1">
                                                    <Car className="w-3.5 h-3.5" /> Vehicular ({selectedAccesoDetail.vehiculo_placa || 'Sin placa'})
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1">
                                                    <Footprints className="w-3.5 h-3.5" /> Peatonal
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono text-slate-600 dark:text-slate-300">
                                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                            <Calendar className="w-4 h-4" /> Ingreso: {selectedAccesoDetail.fecha_ingreso} {selectedAccesoDetail.hora_ingreso?.substring(0, 5)}
                                        </span>
                                        {selectedAccesoDetail.fecha_salida && (
                                            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                                                <Clock className="w-4 h-4" /> Salida: {selectedAccesoDetail.fecha_salida} {selectedAccesoDetail.hora_salida?.substring(0, 5)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* SECCIÓN 1: DATOS DE LA PERSONA / ENTIDAD PRINCIPAL */}
                                <div className="border rounded-2xl p-5 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b pb-2">
                                        <User className="w-4 h-4 text-emerald-600" />
                                        1. {__('Información del Conductor / Visitante Principal')}
                                    </h4>

                                    {(() => {
                                        const isEmp = selectedAccesoDetail.tipo_acceso === 'empleado';
                                        const p = isEmp ? selectedAccesoDetail.empleado : (selectedAccesoDetail.proveedor_empleado || selectedAccesoDetail.proveedor);
                                        const nombre = isEmp
                                            ? `${p?.nombres || ''} ${p?.apellidos || ''}`
                                            : selectedAccesoDetail.proveedor_empleado
                                            ? `${p?.nombres || ''} ${p?.apellidos || ''}`
                                            : p?.nombre_comercial || p?.razon_social || '-';

                                        const doc = isEmp
                                            ? p?.documento_identidad
                                            : selectedAccesoDetail.proveedor_empleado?.documento_identidad || p?.documento_identidad;

                                        const fotoPerfil = isEmp ? p?.foto_empleado : p?.foto_carnet;
                                        const fotoDoc = isEmp ? p?.foto_documento : p?.documento_frontal;

                                        return (
                                            <div className="flex flex-col sm:flex-row gap-5 items-start">
                                                <div className="flex gap-3 shrink-0">
                                                    <div className="w-20 h-20 rounded-2xl overflow-hidden border bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow">
                                                        {fotoPerfil ? (
                                                            <img src={fotoPerfil} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-10 h-10 text-slate-400" />
                                                        )}
                                                    </div>
                                                    {fotoDoc && (
                                                        <div className="w-20 h-20 rounded-2xl overflow-hidden border bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow">
                                                            <img src={fotoDoc} alt="Documento" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-1.5 flex-1">
                                                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                                                        {nombre}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground font-mono">
                                                        Documento de Identidad: <span className="font-bold text-slate-800 dark:text-slate-200">{doc || 'N/A'}</span>
                                                    </p>
                                                    {isEmp && (
                                                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                                                            <span className="flex items-center gap-1">
                                                                <Building className="w-3.5 h-3.5" /> Depto: {p?.departamento?.nombre || 'General'}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Briefcase className="w-3.5 h-3.5" /> Cargo: {p?.cargo?.nombre || 'Técnico'}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Horario estructurado del día */}
                                                    {isEmp && p?.jornada_laboral && (
                                                        <div className="pt-2">
                                                            {renderHorarioJornada(p.jornada_laboral, undefined, undefined, false, true)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* SECCIÓN 2: FOTOGRAFÍAS Y DATOS DEL VEHÍCULO */}
                                {selectedAccesoDetail.medio_acceso === 'vehicular' && (
                                    <div className="border rounded-2xl p-5 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b pb-2">
                                            <Car className="w-4 h-4 text-amber-600" />
                                            2. {__('Información y Fotografías del Vehículo')}
                                        </h4>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border">
                                            <div>
                                                <span className="text-slate-500 block">{__('Marca / Modelo')}</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                                    {selectedAccesoDetail.vehiculo_marca || selectedAccesoDetail.empleado_vehiculo?.marca || selectedAccesoDetail.proveedor_vehiculo?.marca || 'N/A'} - {selectedAccesoDetail.vehiculo_modelo || selectedAccesoDetail.empleado_vehiculo?.modelo || selectedAccesoDetail.proveedor_vehiculo?.modelo || ''}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block">{__('Placa de Rodaje')}</span>
                                                <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                                                    {selectedAccesoDetail.vehiculo_placa || selectedAccesoDetail.empleado_vehiculo?.placa || selectedAccesoDetail.proveedor_vehiculo?.placa || 'N/A'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block">{__('Tipo Vehículo')}</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                                    {selectedAccesoDetail.vehiculo_tipo || selectedAccesoDetail.empleado_vehiculo?.tipo_vehiculo || 'Auto'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Fotos Frontal y Trasera panorámicas */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                            <div className="space-y-1.5">
                                                <span className="text-xs font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                                    <Camera className="w-3.5 h-3.5 text-emerald-600" /> Foto Frontal
                                                </span>
                                                <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border flex items-center justify-center">
                                                    {(selectedAccesoDetail.vehiculo_foto_frontal || selectedAccesoDetail.empleado_vehiculo?.foto_frontal || selectedAccesoDetail.proveedor_vehiculo?.foto_frontal) ? (
                                                        <img
                                                            src={formatImageUrl(selectedAccesoDetail.vehiculo_foto_frontal || selectedAccesoDetail.empleado_vehiculo?.foto_frontal || selectedAccesoDetail.proveedor_vehiculo?.foto_frontal)}
                                                            alt="Foto Frontal"
                                                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                            onClick={() => window.open(formatImageUrl(selectedAccesoDetail.vehiculo_foto_frontal || selectedAccesoDetail.empleado_vehiculo?.foto_frontal || selectedAccesoDetail.proveedor_vehiculo?.foto_frontal), '_blank')}
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">Sin fotografía frontal registrada</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <span className="text-xs font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                                    <Camera className="w-3.5 h-3.5 text-emerald-600" /> Foto Trasera
                                                </span>
                                                <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border flex items-center justify-center">
                                                    {(selectedAccesoDetail.vehiculo_foto_trasera || selectedAccesoDetail.empleado_vehiculo?.foto_trasera || selectedAccesoDetail.proveedor_vehiculo?.foto_trasera) ? (
                                                        <img
                                                            src={formatImageUrl(selectedAccesoDetail.vehiculo_foto_trasera || selectedAccesoDetail.empleado_vehiculo?.foto_trasera || selectedAccesoDetail.proveedor_vehiculo?.foto_trasera)}
                                                            alt="Foto Trasera"
                                                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                            onClick={() => window.open(formatImageUrl(selectedAccesoDetail.vehiculo_foto_trasera || selectedAccesoDetail.empleado_vehiculo?.foto_trasera || selectedAccesoDetail.proveedor_vehiculo?.foto_trasera), '_blank')}
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">Sin fotografía trasera registrada</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* SECCIÓN 3: EMPLEADOS ACOMPAÑANTES EN EL VEHÍCULO */}
                                {selectedAccesoDetail.acompanantes && selectedAccesoDetail.acompanantes.length > 0 && (
                                    <div className="border rounded-2xl p-5 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b pb-2">
                                            <Users className="w-4 h-4 text-blue-600" />
                                            3. {__('Empleados Acompañantes en el Vehículo')} ({selectedAccesoDetail.acompanantes.length})
                                        </h4>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {selectedAccesoDetail.acompanantes.map((ac: any, idx: number) => (
                                                <div key={idx} className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-800/40 flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-full border overflow-hidden bg-white dark:bg-slate-800 shrink-0">
                                                        {ac.foto_empleado ? (
                                                            <img src={ac.foto_empleado} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-5 h-5 m-2 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="space-y-0.5 flex-1">
                                                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                                            {ac.nombres} {ac.apellidos}
                                                        </div>
                                                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                                                            Doc: {ac.documento_identidad} | Depto: {ac.departamento || 'General'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* SECCIÓN 4: RESPONSABLE Y OBSERVACIONES */}
                                <div className="border rounded-2xl p-5 bg-slate-50 dark:bg-slate-900/60 space-y-3">
                                    <div className="flex flex-col sm:flex-row justify-between gap-4 border-b pb-3 text-xs">
                                        <div>
                                            <span className="text-slate-500 block uppercase font-bold">{__('Responsable / Anfitrión')}</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                                {selectedAccesoDetail.responsable ? `${selectedAccesoDetail.responsable.nombres} ${selectedAccesoDetail.responsable.apellidos}` : 'No asignado'}
                                            </span>
                                        </div>
                                    </div>

                                    {selectedAccesoDetail.observaciones && (
                                        <div className="space-y-1 pt-1">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{__('Observaciones de Acceso / Justificación:')}</span>
                                            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border text-xs text-slate-700 dark:text-slate-300 font-mono">
                                                "{selectedAccesoDetail.observaciones}"
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className="gap-3 border-t pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => window.print()}
                                        className="h-11 px-5 text-xs gap-2"
                                    >
                                        <Printer className="w-4 h-4" />
                                        {__('Imprimir Ficha')}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setSelectedAccesoDetail(null)}
                                        className="bg-[#104a29] hover:bg-[#0c371e] text-white h-11 px-6 font-semibold"
                                    >
                                        {__('Cerrar')}
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* MODAL PARA VER ACOMPAÑANTES DE UN ACCESO REGISTRADO (SOLO LISTA) */}
                <Dialog open={!!selectedItemForAcompanantes} onOpenChange={() => setSelectedItemForAcompanantes(null)}>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                                <Users className="w-5 h-5 text-emerald-600" />
                                {__('Empleados Acompañantes en el Vehículo')}
                            </DialogTitle>
                        </DialogHeader>

                        {selectedItemForAcompanantes?.acompanantes && (
                            <div className="space-y-3 my-2 max-h-96 overflow-y-auto">
                                <p className="text-xs text-muted-foreground">
                                    Vehículo N° <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedItemForAcompanantes.codigo_visitante}</span> ({selectedItemForAcompanantes.vehiculo_placa || 'Sin placa'})
                                </p>
                                <div className="divide-y border rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                    {selectedItemForAcompanantes.acompanantes.map((ac: any, idx: number) => (
                                        <div key={idx} className="p-3.5 flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full border overflow-hidden bg-white dark:bg-slate-800 shrink-0">
                                                {ac.foto_empleado ? (
                                                    <img src={ac.foto_empleado} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-5 h-5 m-2 text-slate-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                                    {ac.nombres} {ac.apellidos}
                                                </div>
                                                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                                    Doc: {ac.documento_identidad} | Depto: {ac.departamento || 'General'} {ac.cargo && `| Cargo: ${ac.cargo}`}
                                                </div>
                                                {ac.jornada_laboral && renderHorarioJornada(ac.jornada_laboral, `${ac.nombres} ${ac.apellidos}`, ac.documento_identidad, true)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedItemForAcompanantes(null)}>
                                {__('Cerrar')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* MODAL DE NUEVO ACCESO */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="max-w-4xl sm:max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center justify-between text-xl font-bold border-b pb-3">
                                <span>{__('Nuevo Registro de Acceso a Instalaciones')}</span>
                                <Badge variant="outline" className="font-mono bg-emerald-50 text-emerald-800 border-emerald-300 text-sm px-3 py-1">
                                    {__('Código de Visitante:')} N° {siguienteCodigo}
                                </Badge>
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmitAcceso} className="space-y-6 mt-2">
                            {/* PASO 1: Tipo de Acceso */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    1. {__('Seleccione Tipo de Acceso')}
                                </Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        type="button"
                                        size="lg"
                                        variant={tipoAcceso === 'empleado' ? 'default' : 'outline'}
                                        onClick={() => {
                                            setTipoAcceso('empleado');
                                            setSelectedEntity(null);
                                            setSearchQuery('');
                                            setAcompanantesList([]);
                                            setActiveAuthToken(null);
                                            setAutorizacionRecibida(null);
                                        }}
                                        className={`h-14 text-base font-semibold ${tipoAcceso === 'empleado' ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : ''}`}
                                    >
                                        <User className="mr-2 h-5 w-5" />
                                        {__('Empleado')}
                                    </Button>

                                    <Button
                                        type="button"
                                        size="lg"
                                        variant={tipoAcceso === 'proveedor' ? 'default' : 'outline'}
                                        onClick={() => {
                                            setTipoAcceso('proveedor');
                                            setSelectedEntity(null);
                                            setSearchQuery('');
                                            setAcompanantesList([]);
                                            setActiveAuthToken(null);
                                            setAutorizacionRecibida(null);
                                        }}
                                        className={`h-14 text-base font-semibold ${tipoAcceso === 'proveedor' ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md' : ''}`}
                                    >
                                        <Truck className="mr-2 h-5 w-5" />
                                        {__('Proveedor')}
                                    </Button>
                                </div>
                            </div>

                            {/* PASO 2: Búsqueda dinámica de entidad */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    2. {tipoAcceso === 'empleado' ? __('Buscar Empleado Conductor (Nombre, Apellidos, Documento)') : __('Buscar Proveedor (Razón Social, Nombre Comercial, RUC/DNI)')}
                                </Label>
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        placeholder={tipoAcceso === 'empleado' ? __('Escriba nombre, apellido o documento...') : __('Escriba razón social, nombre comercial o RUC...')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-11 h-12 text-base bg-white dark:bg-slate-900 w-full"
                                    />
                                </div>

                                {isSearching && <p className="text-xs text-muted-foreground">{__('Buscando registros...')}</p>}

                                {searchResults.length > 0 && !selectedEntity && (
                                    <div className="border rounded-xl bg-white dark:bg-slate-900 divide-y max-h-56 overflow-y-auto shadow-md">
                                        {searchResults.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => handleSelectEntity(item)}
                                                className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                                                        {(item.nombres || item.nombre_comercial || item.razon_social).charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-sm">
                                                            {tipoAcceso === 'empleado' ? `${item.nombres} ${item.apellidos}` : item.nombre_comercial || item.razon_social}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">Doc: {item.documento_identidad || 'N/A'}</div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-slate-400" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ENTIDAD SELECCIONADA CON FOTOS Y HORARIO */}
                            {selectedEntity && (
                                <div className="p-5 border rounded-2xl bg-slate-50 dark:bg-slate-900/60 space-y-4 shadow-sm">
                                    <div className="flex items-start justify-between border-b pb-4">
                                        <div className="flex gap-4 items-center">
                                            <div className="flex gap-2">
                                                {(selectedEntity.foto_empleado || selectedEntity.foto_carnet) && (
                                                    <img
                                                        src={selectedEntity.foto_empleado || selectedEntity.foto_carnet}
                                                        alt="Foto"
                                                        className="w-16 h-16 rounded-xl object-cover border-2 border-white dark:border-slate-800 shadow"
                                                    />
                                                )}
                                                {(selectedEntity.foto_documento || selectedEntity.documento_frontal) && (
                                                    <img
                                                        src={selectedEntity.foto_documento || selectedEntity.documento_frontal}
                                                        alt="Documento"
                                                        className="w-16 h-16 rounded-xl object-cover border-2 border-white dark:border-slate-800 shadow"
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-base">
                                                    {tipoAcceso === 'empleado'
                                                        ? `${selectedEntity.nombres} ${selectedEntity.apellidos}`
                                                        : selectedEntity.nombre_comercial || selectedEntity.razon_social}
                                                </h4>
                                                <p className="text-xs text-muted-foreground font-mono">Doc: {selectedEntity.documento_identidad}</p>
                                                {tipoAcceso === 'empleado' && (
                                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                                                        Depto: {selectedEntity.departamento?.nombre || '-'} | Cargo: {selectedEntity.cargo?.nombre || '-'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setSelectedEntity(null)}
                                            className="text-xs"
                                        >
                                            {__('Cambiar')}
                                        </Button>
                                    </div>

                                    {/* HORARIO Y DÍA QUE ESTÁ INGRESANDO */}
                                    {tipoAcceso === 'empleado' && (
                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm space-y-2">
                                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-emerald-600" />
                                                {__('Horario y Jornada Laboral Conductor')}
                                            </div>
                                            {renderHorarioJornada(
                                                selectedEntity.jornada_laboral,
                                                `${selectedEntity.nombres} ${selectedEntity.apellidos}`,
                                                selectedEntity.documento_identidad,
                                                false
                                            )}
                                        </div>
                                    )}

                                    {/* Si es Proveedor: Selecciona Empleado del Proveedor */}
                                    {tipoAcceso === 'proveedor' && (
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">{__('Personal del Proveedor que conduce/accede:')}</Label>
                                            {selectedEntity.empleados_proveedor && selectedEntity.empleados_proveedor.length > 0 ? (
                                                <Select
                                                    value={data.proveedor_empleado_id}
                                                    onValueChange={(val) => setData('proveedor_empleado_id', val)}
                                                >
                                                    <SelectTrigger className="w-full h-11 bg-white dark:bg-slate-900">
                                                        <SelectValue placeholder={__('Seleccione el empleado que ingresa...')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {selectedEntity.empleados_proveedor.map((emp: any) => (
                                                            <SelectItem key={emp.id} value={emp.id.toString()}>
                                                                {emp.nombres} {emp.apellidos} - Doc: {emp.documento_identidad}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <p className="text-xs text-amber-600 italic">{__('Sin empleados de proveedor pre-registrados.')}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PASO 3: Medio de Acceso */}
                            {selectedEntity && (
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        3. {__('Medio de Acceso')}
                                    </Label>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Button
                                            type="button"
                                            size="lg"
                                            variant={medioAcceso === 'peatonal' ? 'default' : 'outline'}
                                            onClick={() => setMedioAcceso('peatonal')}
                                            className={`h-12 ${medioAcceso === 'peatonal' ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md' : ''}`}
                                        >
                                            <Footprints className="mr-2 h-5 w-5" />
                                            {__('Peatonal')}
                                        </Button>

                                        <Button
                                            type="button"
                                            size="lg"
                                            variant={medioAcceso === 'vehicular' ? 'default' : 'outline'}
                                            onClick={() => setMedioAcceso('vehicular')}
                                            className={`h-12 ${medioAcceso === 'vehicular' ? 'bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md' : ''}`}
                                        >
                                            <Car className="mr-2 h-5 w-5" />
                                            {__('Vehicular')}
                                        </Button>
                                    </div>

                                    {/* Si es Vehicular */}
                                    {medioAcceso === 'vehicular' && (
                                        <div className="p-5 border rounded-2xl bg-slate-50 dark:bg-slate-900/60 space-y-5 shadow-sm">
                                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <Car className="w-4 h-4 text-amber-600" /> {__('Detalles y Fotografías del Vehículo')}
                                            </h5>

                                            {/* Vehículos Pre-registrados */}
                                            {((tipoAcceso === 'empleado' && selectedEntity.vehiculos?.length > 0) ||
                                                (tipoAcceso === 'proveedor' && selectedEntity.vehiculos_proveedor?.length > 0)) && (
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-muted-foreground">{__('Seleccionar Vehículo Registrado:')}</Label>
                                                    <Select
                                                        value={vehiculoSeleccionado}
                                                        onValueChange={(val) => setVehiculoSeleccionado(val)}
                                                    >
                                                        <SelectTrigger className="w-full h-11 bg-white dark:bg-slate-900">
                                                            <SelectValue placeholder={__('Seleccione vehículo...')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="nuevo">{__('+ Registrar otro vehículo ad-hoc')}</SelectItem>
                                                            {(tipoAcceso === 'empleado' ? selectedEntity.vehiculos : selectedEntity.vehiculos_proveedor).map((v: any) => (
                                                                <SelectItem key={v.id} value={v.id.toString()}>
                                                                    {v.marca} {v.modelo} - Placa: {v.placa} ({v.tipo_vehiculo || 'Auto'})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            {/* Vehículo Ad-hoc Campos de Texto */}
                                            {vehiculoSeleccionado === 'nuevo' && (
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                                                    <div>
                                                        <Label className="text-xs">{__('Marca')}</Label>
                                                        <Input
                                                            placeholder="Ej: Toyota"
                                                            value={vehiculoNuevo.marca}
                                                            onChange={(e) => setVehiculoNuevo({ ...vehiculoNuevo, marca: e.target.value })}
                                                            className="h-11 bg-white dark:bg-slate-900 w-full"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">{__('Modelo')}</Label>
                                                        <Input
                                                            placeholder="Ej: Hilux"
                                                            value={vehiculoNuevo.modelo}
                                                            onChange={(e) => setVehiculoNuevo({ ...vehiculoNuevo, modelo: e.target.value })}
                                                            className="h-11 bg-white dark:bg-slate-900 w-full"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">{__('Placa')}</Label>
                                                        <Input
                                                            placeholder="Ej: ABC-123"
                                                            value={vehiculoNuevo.placa}
                                                            onChange={(e) => setVehiculoNuevo({ ...vehiculoNuevo, placa: e.target.value })}
                                                            className="h-11 bg-white dark:bg-slate-900 font-mono w-full"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* WIDGET DE CÁMARA SI ESTÁ ACTIVO */}
                                            {activeCameraField && (
                                                <div className="pt-2">
                                                    <CameraWidget
                                                        onCapture={(base64) => {
                                                            setVehiculoNuevo((prev) => ({ ...prev, [activeCameraField]: base64 }));
                                                            setActiveCameraField(null);
                                                            notifySuccess(__('Fotografía capturada correctamente.'));
                                                        }}
                                                        onCancel={() => setActiveCameraField(null)}
                                                    />
                                                </div>
                                            )}

                                            {/* VISUALIZACIÓN DE FOTOGRAFÍAS */}
                                             {!activeCameraField && (() => {
                                                 const fotoFrontalUrl = formatImageUrl(vehiculoNuevo.foto_frontal) || formatImageUrl(vehiculoObj?.foto_frontal);
                                                 const fotoTraseraUrl = formatImageUrl(vehiculoNuevo.foto_trasera) || formatImageUrl(vehiculoObj?.foto_trasera);

                                                 return (
                                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                                                         {/* Foto Frontal */}
                                                         <div className="p-3 border rounded-xl bg-white dark:bg-slate-900 flex flex-col justify-between gap-3">
                                                             <div className="flex items-center justify-between">
                                                                 <span className="text-xs font-semibold flex items-center gap-1.5">
                                                                     <Camera className="w-4 h-4 text-emerald-600" />
                                                                     {__('Foto Frontal del Vehículo')}
                                                                 </span>
                                                                 {fotoFrontalUrl ? (
                                                                     <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Registrada ✓</Badge>
                                                                 ) : (
                                                                     <Badge variant="outline" className="bg-amber-50 text-amber-800 text-[10px]">Pendiente ⚠️</Badge>
                                                                 )}
                                                             </div>

                                                             <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border flex items-center justify-center relative">
                                                                 {fotoFrontalUrl ? (
                                                                     <img
                                                                         src={fotoFrontalUrl}
                                                                         alt="Foto Frontal Vehículo"
                                                                         className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                                         onClick={() => window.open(fotoFrontalUrl, '_blank')}
                                                                     />
                                                                 ) : (
                                                                     <div className="text-center p-3 text-slate-400">
                                                                         <Car className="w-8 h-8 mx-auto mb-1 opacity-50" />
                                                                         <span className="text-xs block">Sin fotografía frontal registrada</span>
                                                                     </div>
                                                                 )}
                                                             </div>

                                                             <div className="flex gap-2">
                                                                 <Button
                                                                     type="button"
                                                                     size="sm"
                                                                     variant="outline"
                                                                     onClick={() => setActiveCameraField('foto_frontal')}
                                                                     className="flex-1 text-xs gap-1"
                                                                 >
                                                                     <Camera className="w-3.5 h-3.5 text-emerald-600" />
                                                                     {__('Tomar Foto')}
                                                                 </Button>
                                                                 <label className="flex-1">
                                                                     <input
                                                                         type="file"
                                                                         accept="image/*"
                                                                         onChange={(e) => handleImageUpload(e, 'foto_frontal')}
                                                                         className="hidden"
                                                                     />
                                                                     <Button
                                                                         type="button"
                                                                         size="sm"
                                                                         variant="outline"
                                                                         onClick={(e) => (e.currentTarget.previousElementSibling as HTMLInputElement)?.click()}
                                                                         className="w-full text-xs gap-1"
                                                                     >
                                                                         <Upload className="w-3.5 h-3.5" />
                                                                         {__('Subir')}
                                                                     </Button>
                                                                 </label>
                                                             </div>
                                                         </div>

                                                         {/* Foto Trasera */}
                                                         <div className="p-3 border rounded-xl bg-white dark:bg-slate-900 flex flex-col justify-between gap-3">
                                                             <div className="flex items-center justify-between">
                                                                 <span className="text-xs font-semibold flex items-center gap-1.5">
                                                                     <Camera className="w-4 h-4 text-emerald-600" />
                                                                     {__('Foto Trasera del Vehículo')}
                                                                 </span>
                                                                 {fotoTraseraUrl ? (
                                                                     <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Registrada ✓</Badge>
                                                                 ) : (
                                                                     <Badge variant="outline" className="bg-amber-50 text-amber-800 text-[10px]">Pendiente ⚠️</Badge>
                                                                 )}
                                                             </div>

                                                             <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border flex items-center justify-center relative">
                                                                 {fotoTraseraUrl ? (
                                                                     <img
                                                                         src={fotoTraseraUrl}
                                                                         alt="Foto Trasera Vehículo"
                                                                         className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                                         onClick={() => window.open(fotoTraseraUrl, '_blank')}
                                                                     />
                                                                 ) : (
                                                                     <div className="text-center p-3 text-slate-400">
                                                                         <Car className="w-8 h-8 mx-auto mb-1 opacity-50" />
                                                                         <span className="text-xs block">Sin fotografía trasera registrada</span>
                                                                     </div>
                                                                 )}
                                                             </div>

                                                             <div className="flex gap-2">
                                                                 <Button
                                                                     type="button"
                                                                     size="sm"
                                                                     variant="outline"
                                                                     onClick={() => setActiveCameraField('foto_trasera')}
                                                                     className="flex-1 text-xs gap-1"
                                                                 >
                                                                     <Camera className="w-3.5 h-3.5 text-emerald-600" />
                                                                     {__('Tomar Foto')}
                                                                 </Button>
                                                                 <label className="flex-1">
                                                                     <input
                                                                         type="file"
                                                                         accept="image/*"
                                                                         onChange={(e) => handleImageUpload(e, 'foto_trasera')}
                                                                         className="hidden"
                                                                     />
                                                                     <Button
                                                                         type="button"
                                                                         size="sm"
                                                                         variant="outline"
                                                                         onClick={(e) => (e.currentTarget.previousElementSibling as HTMLInputElement)?.click()}
                                                                         className="w-full text-xs gap-1"
                                                                     >
                                                                         <Upload className="w-3.5 h-3.5" />
                                                                         {__('Subir')}
                                                                     </Button>
                                                                 </label>
                                                             </div>
                                                         </div>
                                                     </div>
                                                 );
                                             })()}

                                            {/* SECCIÓN DE EMPLEADOS ACOMPAÑANTES EN EL VEHÍCULO */}
                                            <div className="pt-4 border-t space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                                        <Users className="w-4 h-4 text-blue-600" />
                                                        {__('Empleados Acompañantes en el Vehículo (Opcional)')}
                                                    </Label>
                                                    {acompanantesList.length > 0 && (
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 font-bold">
                                                            {acompanantesList.length} {acompanantesList.length === 1 ? 'Acompañante' : 'Acompañantes'}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Buscador de acompañante */}
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                    <Input
                                                        placeholder={__('Escriba nombre o DNI para agregar acompañante...')}
                                                        value={acompananteSearchTerm}
                                                        onChange={(e) => setAcompananteSearchTerm(e.target.value)}
                                                        className="pl-9 bg-white dark:bg-slate-900 text-sm h-10 w-full"
                                                    />
                                                </div>

                                                {isSearchingAcompanantes && <p className="text-xs text-muted-foreground">{__('Buscando acompañantes...')}</p>}

                                                {acompananteSearchResults.length > 0 && (
                                                    <div className="border rounded-xl bg-white dark:bg-slate-900 divide-y max-h-40 overflow-y-auto shadow-md">
                                                        {acompananteSearchResults.map((emp) => (
                                                            <div
                                                                key={emp.id}
                                                                onClick={() => handleAddAcompanante(emp)}
                                                                className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600">
                                                                        {emp.nombres.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-semibold">{emp.nombres} {emp.apellidos}</div>
                                                                        <div className="text-[10px] text-muted-foreground">
                                                                            Doc: {emp.documento_identidad} | <span className="text-indigo-600 dark:text-indigo-400 font-medium">Depto: {emp.departamento?.nombre || 'General'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <Button size="xs" variant="secondary" className="gap-1 text-[10px]">
                                                                    <Plus className="w-3 h-3" /> Agregar
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Lista de Acompañantes Agregados con Fotos y Horario */}
                                                {acompanantesList.length > 0 ? (
                                                    <div className="space-y-2 pt-1">
                                                        {acompanantesList.map((ac) => (
                                                            <div
                                                                key={ac.id}
                                                                className="p-3 border rounded-xl bg-white dark:bg-slate-900 flex items-start justify-between gap-3 shadow-sm"
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className="w-10 h-10 rounded-full border overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                                                                        {ac.foto_empleado ? (
                                                                            <img src={ac.foto_empleado} alt="" className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <User className="w-5 h-5 m-2 text-slate-400" />
                                                                        )}
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                                                            {ac.nombres} {ac.apellidos}
                                                                            <span className="text-xs text-muted-foreground font-mono font-normal ml-2">Doc: {ac.documento_identidad}</span>
                                                                        </div>
                                                                        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                                                            Depto: {ac.departamento || 'General'} {ac.cargo && `| Cargo: ${ac.cargo}`}
                                                                        </div>
                                                                        {ac.jornada_laboral && renderHorarioJornada(ac.jornada_laboral, `${ac.nombres} ${ac.apellidos}`, ac.documento_identidad, true)}
                                                                    </div>
                                                                </div>

                                                                <Button
                                                                    type="button"
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => handleRemoveAcompanante(ac.id)}
                                                                    className="text-slate-400 hover:text-rose-500"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-400 italic">No hay empleados acompañantes agregados a este vehículo.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PASO 4: Responsable & Observaciones a ancho completo */}
                            {selectedEntity && (
                                <div className="space-y-4 pt-3 border-t">
                                    <div className="space-y-1.5 w-full">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            4. {__('Responsable / Anfitrión')} <span className="text-rose-500">*</span>
                                        </Label>
                                        <Select
                                            value={data.responsable_id}
                                            onValueChange={(val) => setData('responsable_id', val)}
                                        >
                                            <SelectTrigger className="w-full h-12 bg-white dark:bg-slate-900 text-sm">
                                                <SelectValue placeholder={__('Seleccione el Responsable / Anfitrión de la instalación...')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {responsables.map((resp) => (
                                                    <SelectItem key={resp.id} value={resp.id.toString()}>
                                                        {resp.nombres} {resp.apellidos} {resp.departamento ? `(${resp.departamento.nombre})` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5 w-full">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            5. {__('Observaciones de Acceso / Motivo Excepcional')}
                                        </Label>
                                        <Textarea
                                            placeholder={__('Motivo de acceso o explicación otorgada por el Responsable por WhatsApp...')}
                                            value={data.observaciones}
                                            onChange={(e) => setData('observaciones', e.target.value)}
                                            className="bg-white dark:bg-slate-900 min-h-[90px] text-sm w-full p-3"
                                        />
                                    </div>
                                </div>
                            )}

                            <DialogFooter className="gap-3 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="h-11 px-6"
                                >
                                    {__('Cancelar')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || !selectedEntity}
                                    className="bg-[#104a29] hover:bg-[#0c371e] text-white h-11 px-6 font-semibold"
                                >
                                    {__('Confirmar e Ingresar (N° ')} {siguienteCodigo}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
