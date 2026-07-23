import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { 
    ShieldCheck, 
    User, 
    Truck, 
    Sprout,
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
    Briefcase,
    X
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
    tipo_acceso: 'empleado' | 'proveedor' | 'productor' | 'visitante';
    invitacion_id?: number | null;
    visitante_nombre?: string | null;
    visitante_documento?: string | null;
    foto_carnet?: string | null;
    doc_foto_frontal?: string | null;
    doc_foto_trasera?: string | null;
    visitante_empresa?: string | null;
    visitante_telefono?: string | null;
    empleado_id?: number | null;
    proveedor_id?: number | null;
    proveedor_empleado_id?: number | null;
    productor_id?: number | null;
    productor_empleado_id?: number | null;
    medio_acceso: 'peatonal' | 'vehicular';
    empleado_vehiculo_id?: number | null;
    proveedor_vehiculo_id?: number | null;
    productor_vehiculo_id?: number | null;
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
    productor?: any;
    productor_empleado?: any;
    empleado_vehiculo?: any;
    proveedor_vehiculo?: any;
    productor_vehiculo?: any;
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
    visitasEsperadas?: any[];
    stats: {
        total: number;
        en_instalaciones: number;
        finalizados: number;
        empleados: number;
        proveedores: number;
        productores: number;
    };
    responsables: any[];
    paises?: any[];
    tipoServicios?: any[];
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
    visitasEsperadas = [],
    stats = { total: 0, en_instalaciones: 0, finalizados: 0, empleados: 0, proveedores: 0, productores: 0 },
    responsables = [],
    paises = [],
    tipoServicios = [],
    siguienteCodigo = 80000001,
    filters = {},
}: VisitasAccesosProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/dashboard' },
        { title: __('Accesos a Instalaciones'), href: '/admin/visitas-accesos' },
    ];

    const [activeImageModal, setActiveImageModal] = useState<string | null>(null);

    // ─── PRE-ANUNCIAR / MODAL INVITACIÓN ───────────────────────────────────────
    const [isCreateInvitacionOpen, setIsCreateInvitacionOpen] = useState(false);

    // Tipo de visita seleccionado en el modal
    const [invTipoAcceso, setInvTipoAcceso] = useState<'visitante' | 'proveedor' | 'productor'>('visitante');

    // Buscador de Responsable / Anfitrión
    const [invResponsableQuery, setInvResponsableQuery] = useState('');
    const [selectedInvResponsable, setSelectedInvResponsable] = useState<any>(null);
    const [invResponsableOpen, setInvResponsableOpen] = useState(false);
    const invResponsableRef = useRef<HTMLDivElement>(null);

    const filteredResponsables = responsables.filter((r) => {
        const q = invResponsableQuery.toLowerCase();
        return !q || r.nombres?.toLowerCase().includes(q) || r.apellidos?.toLowerCase().includes(q) || r.departamento?.nombre?.toLowerCase().includes(q);
    });

    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (invResponsableRef.current && !invResponsableRef.current.contains(e.target as Node)) {
                setInvResponsableOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    // Buscador dinámico de Proveedor / Productor
    const [invEntityQuery, setInvEntityQuery] = useState('');
    const [invEntityResults, setInvEntityResults] = useState<any[]>([]);
    const [isSearchingInvEntity, setIsSearchingInvEntity] = useState(false);
    const [selectedInvEntity, setSelectedInvEntity] = useState<any>(null);

    useEffect(() => {
        if (!invEntityQuery || invEntityQuery.length < 2) { setInvEntityResults([]); return; }
        const t = setTimeout(() => {
            setIsSearchingInvEntity(true);
            fetch(`/admin/visitas-accesos/buscar-entidades?tipo_acceso=${invTipoAcceso}&query=${encodeURIComponent(invEntityQuery)}`)
                .then(r => r.json())
                .then(d => { setInvEntityResults(d); setIsSearchingInvEntity(false); })
                .catch(() => setIsSearchingInvEntity(false));
        }, 300);
        return () => clearTimeout(t);
    }, [invEntityQuery, invTipoAcceso]);

    // Form de Invitación
    const invForm = useForm({
        tipo_acceso: 'visitante' as string,
        anfitrion_id: '' as string,
        visitante_nombres: '',
        visitante_apellidos: '',
        visitante_telefono: '',
        pais_telefono_id: paises.length > 0 ? String(paises[0].id) : '',
        proveedor_id: '',
        productor_id: '',
        tipo_servicio_id: '',
        fecha_estimada: new Date().toISOString().split('T')[0],
        hora_estimada: '09:00',
        motivo_visita: '',
    });

    const resetInvModal = () => {
        setInvTipoAcceso('visitante');
        setSelectedInvResponsable(null);
        setInvResponsableQuery('');
        setSelectedInvEntity(null);
        setInvEntityQuery('');
        setInvEntityResults([]);
        invForm.reset();
    };

    const handleCreateInvitacionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        invForm.setData('tipo_acceso', invTipoAcceso);
        invForm.post('/admin/visitas-accesos/invitaciones', {
            onSuccess: () => {
                setIsCreateInvitacionOpen(false);
                resetInvModal();
                notifySuccess(__('Pre-Anuncio de visita registrado correctamente.'));
            },
            onError: () => notifyError(__('Verifique los datos ingresados e intente nuevamente.')),
        });
    };

    // Estados de filtros y tabla
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [tipoAccesoFilter, setTipoAccesoFilter] = useState(filters.tipo_acceso || 'all');
    const [medioAccesoFilter, setMedioAccesoFilter] = useState(filters.medio_acceso || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '10');
    const [isTableLoading, setIsTableLoading] = useState(false);

    // Modal estado creación
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [tipoAcceso, setTipoAcceso] = useState<'empleado' | 'proveedor' | 'productor'>('empleado');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState<any>(null);
    const [selectedProveedorEmpleadoIds, setSelectedProveedorEmpleadoIds] = useState<string[]>([]);

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
        productor_id: '',
        productor_empleado_id: '',
        medio_acceso: 'peatonal',
        empleado_vehiculo_id: '',
        proveedor_vehiculo_id: '',
        productor_vehiculo_id: '',
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

    const syncProveedorEmpleadosState = (ids: string[], entityParam?: any) => {
        const ent = entityParam || selectedEntity;
        const listaEmps = tipoAcceso === 'productor' ? ent?.empleados_productor : ent?.empleados_proveedor;

        if (!listaEmps || ids.length === 0) {
            if (tipoAcceso === 'productor') {
                setData('productor_empleado_id', '');
            } else {
                setData('proveedor_empleado_id', '');
            }
            setAcompanantesList([]);
            setData('acompanantes', []);
            return;
        }

        const mainId = ids[0];
        if (tipoAcceso === 'productor') {
            setData('productor_empleado_id', mainId);
            setData('proveedor_empleado_id', '');
        } else {
            setData('proveedor_empleado_id', mainId);
            setData('productor_empleado_id', '');
        }

        const extraIds = ids.slice(1);
        const extraEmps = listaEmps
            .filter((emp: any) => extraIds.includes(emp.id.toString()))
            .map((emp: any) => ({
                id: emp.id,
                nombres: emp.nombres,
                apellidos: emp.apellidos,
                documento_identidad: emp.documento_identidad,
                foto_empleado: emp.foto_carnet || emp.foto_empleado || null,
                documento_frontal: emp.documento_frontal || null,
                departamento: ent.nombre_comercial_rancho || ent.razon_social_rancho || ent.nombre_comercial || ent.razon_social,
                cargo: emp.cargo || (tipoAcceso === 'productor' ? 'Colaborador Productor' : 'Personal Proveedor'),
                is_proveedor_empleado: true,
            }));

        setAcompanantesList(extraEmps);
        setData('acompanantes', extraEmps);
    };

    const toggleProveedorEmpleadoSelection = (empIdStr: string) => {
        let updated: string[];
        if (selectedProveedorEmpleadoIds.includes(empIdStr)) {
            updated = selectedProveedorEmpleadoIds.filter((id) => id !== empIdStr);
        } else {
            updated = [...selectedProveedorEmpleadoIds, empIdStr];
        }
        setSelectedProveedorEmpleadoIds(updated);
        syncProveedorEmpleadosState(updated);
    };

    const selectAllProveedorEmpleados = () => {
        const list = tipoAcceso === 'productor' ? selectedEntity?.empleados_productor : selectedEntity?.empleados_proveedor;
        if (!list) return;
        const allIds = list.map((emp: any) => emp.id.toString());
        setSelectedProveedorEmpleadoIds(allIds);
        syncProveedorEmpleadosState(allIds);
    };

    const deselectAllProveedorEmpleados = () => {
        setSelectedProveedorEmpleadoIds([]);
        syncProveedorEmpleadosState([]);
    };

    const handleSelectEntity = (entity: any) => {
        setSelectedEntity(entity);
        if (tipoAcceso === 'empleado') {
            setSelectedProveedorEmpleadoIds([]);
            setData((prev) => ({
                ...prev,
                tipo_acceso: 'empleado',
                empleado_id: entity.id,
                proveedor_id: '',
                proveedor_empleado_id: '',
                productor_id: '',
                productor_empleado_id: '',
                responsable_id: entity.responsable_id ? String(entity.responsable_id) : '',
            }));

            if (entity.vehiculos && entity.vehiculos.length > 0) {
                setVehiculoSeleccionado(entity.vehiculos[0].id.toString());
            } else {
                setVehiculoSeleccionado('nuevo');
            }
        } else if (tipoAcceso === 'proveedor') {
            setData((prev) => ({
                ...prev,
                tipo_acceso: 'proveedor',
                proveedor_id: entity.id,
                empleado_id: '',
                productor_id: '',
                productor_empleado_id: '',
            }));

            if (entity.empleados_proveedor && entity.empleados_proveedor.length > 0) {
                const initialIds = [entity.empleados_proveedor[0].id.toString()];
                setSelectedProveedorEmpleadoIds(initialIds);
                syncProveedorEmpleadosState(initialIds, entity);
            } else {
                setSelectedProveedorEmpleadoIds([]);
                syncProveedorEmpleadosState([], entity);
            }

            if (entity.vehiculos_proveedor && entity.vehiculos_proveedor.length > 0) {
                setVehiculoSeleccionado(entity.vehiculos_proveedor[0].id.toString());
            } else {
                setVehiculoSeleccionado('nuevo');
            }
        } else if (tipoAcceso === 'productor') {
            setData((prev) => ({
                ...prev,
                tipo_acceso: 'productor',
                productor_id: entity.id,
                empleado_id: '',
                proveedor_id: '',
                proveedor_empleado_id: '',
            }));

            if (entity.empleados_productor && entity.empleados_productor.length > 0) {
                const initialIds = [entity.empleados_productor[0].id.toString()];
                setSelectedProveedorEmpleadoIds(initialIds);
                syncProveedorEmpleadosState(initialIds, entity);
            } else {
                setSelectedProveedorEmpleadoIds([]);
                syncProveedorEmpleadosState([], entity);
            }

            if (entity.vehiculos_productor && entity.vehiculos_productor.length > 0) {
                setVehiculoSeleccionado(entity.vehiculos_productor[0].id.toString());
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
        setSelectedProveedorEmpleadoIds([]);
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
                } else if (tipoAcceso === 'productor') {
                    payload.productor_vehiculo_id = vehiculoSeleccionado;
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

        router.post('/admin/visitas-accesos', payload, {
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
        const listaVehiculos = tipoAcceso === 'empleado'
            ? selectedEntity.vehiculos
            : tipoAcceso === 'productor'
            ? selectedEntity.vehiculos_productor
            : selectedEntity.vehiculos_proveedor;
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
                const isVisitante = item.tipo_acceso === 'visitante' || !!item.visitante_nombre;
                const isEmp = item.tipo_acceso === 'empleado';
                const isProd = item.tipo_acceso === 'productor';

                const nombre = isVisitante
                    ? (item.visitante_nombre || 'Visitante Particular')
                    : isEmp
                    ? `${item.empleado?.nombres || ''} ${item.empleado?.apellidos || ''}`
                    : isProd
                    ? (item.productor_empleado
                        ? `${item.productor_empleado?.nombres || ''} ${item.productor_empleado?.apellidos || ''}`
                        : item.productor?.nombre_comercial_rancho || item.productor?.razon_social_rancho || item.productor?.nombre_comercial || item.productor?.razon_social || '-')
                    : item.proveedor_empleado
                    ? `${item.proveedor_empleado?.nombres || ''} ${item.proveedor_empleado?.apellidos || ''}`
                    : item.proveedor?.nombre_comercial || item.proveedor?.razon_social || '-';

                const doc = isVisitante
                    ? item.visitante_documento
                    : isEmp
                    ? item.empleado?.documento_identidad
                    : isProd
                    ? (item.productor_empleado?.documento_identidad || item.productor?.documento_identidad)
                    : (item.proveedor_empleado?.documento_identidad || item.proveedor?.documento_identidad);

                const rawAvatar = isVisitante
                    ? item.foto_carnet
                    : isEmp
                    ? item.empleado?.foto_empleado
                    : isProd
                    ? (item.productor_empleado?.foto_carnet || (item.productor_empleado as any)?.foto_empleado)
                    : (item.proveedor_empleado?.foto_carnet || (item.proveedor_empleado as any)?.foto_empleado);
                const avatar = formatImageUrl(rawAvatar);
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
                                {isVisitante && (
                                    <span className="ml-1 text-emerald-700 dark:text-emerald-400 font-sans font-medium">({item.visitante_empresa || 'Particular'})</span>
                                )}
                                {isProd && item.productor && (
                                    <span className="ml-1 text-purple-600 dark:text-purple-400">({item.productor.nombre_comercial_rancho || item.productor.razon_social_rancho || item.productor.nombre_comercial})</span>
                                )}
                                {!isEmp && !isProd && !isVisitante && item.proveedor && (
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
                item.tipo_acceso === 'visitante' || item.visitante_nombre ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 gap-1">
                        <User className="w-3 h-3" /> {__('Visitante Particular')}
                    </Badge>
                ) : item.tipo_acceso === 'empleado' ? (
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900 gap-1">
                        <User className="w-3 h-3" /> {__('Empleado')}
                    </Badge>
                ) : item.tipo_acceso === 'productor' ? (
                    <Badge className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900 gap-1">
                        <Sprout className="w-3 h-3" /> {__('Productor')}
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
                    description={__('Gestión unificada de entradas/salidas para Empleados, Proveedores y Productores con Código de Visitante (80000001+).')}
                    colorClassName="bg-[#104a29]"
                >
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <Button
                            onClick={() => { resetInvModal(); setIsCreateInvitacionOpen(true); }}
                            variant="secondary"
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 w-full sm:w-auto font-bold"
                        >
                            <Calendar className="mr-2 h-4 w-4 text-emerald-300" />
                            {__('Pre-Anunciar / Invitar Visita')}
                        </Button>
                        <Button onClick={handleCreateClick} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto shadow-md font-bold">
                            <Plus className="mr-2 h-4 w-4" />
                            {__('Nuevo Registro de Acceso')}
                        </Button>
                    </div>
                </ModuleHeader>

                {/* Tarjetas de Estadísticas Totalmente Responsivas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
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
                    <StatCard
                        icon={<Sprout className="h-6 w-6" />}
                        title={__('PRODUCTORES')}
                        value={stats.productores || 0}
                        colorClassName="bg-purple-100 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400"
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
                                    <SelectItem value="productor">{__('Productor')}</SelectItem>
                                    <SelectItem value="visitante">{__('Visitante Particular')}</SelectItem>
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
                                            ) : selectedAccesoDetail.tipo_acceso === 'productor' ? (
                                                <Badge className="bg-purple-100 text-purple-800 border-purple-300">Productor</Badge>
                                            ) : (
                                                <Badge className="bg-amber-100 text-amber-800 border-amber-300">Proveedor</Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                                            <span className="text-slate-500 uppercase">{__('Medio:')}</span>
                                            {selectedAccesoDetail.medio_acceso === 'vehicular' ? (
                                                <Badge className="bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1">
                                                    <Car className="w-3.5 h-3.5" /> Vehicular ({
                                                        selectedAccesoDetail.tipo_acceso === 'productor' && (selectedAccesoDetail.productor_vehiculo?.placa || selectedAccesoDetail.productor?.vehiculos?.[0]?.placa)
                                                            ? (selectedAccesoDetail.productor_vehiculo?.placa || selectedAccesoDetail.productor?.vehiculos?.[0]?.placa)
                                                            : (selectedAccesoDetail.vehiculo_placa || 'Sin placa')
                                                    })
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
                                        1. {selectedAccesoDetail.tipo_acceso === 'empleado'
                                            ? __('Información del Empleado / Conductor')
                                            : selectedAccesoDetail.tipo_acceso === 'productor'
                                            ? __('Información del Rancho / Productor y Personal')
                                            : selectedAccesoDetail.tipo_acceso === 'visitante' || selectedAccesoDetail.visitante_nombre
                                            ? __('Información del Visitante Particular')
                                            : __('Información de la Empresa Proveedora y Personal')}
                                    </h4>

                                    {selectedAccesoDetail.tipo_acceso === 'empleado' ? (
                                        <div className="flex flex-col sm:flex-row gap-5 items-start">
                                            <div className="flex gap-3 shrink-0">
                                                <div className="w-20 h-20 rounded-2xl overflow-hidden border bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow">
                                                    {formatImageUrl(selectedAccesoDetail.empleado?.foto_empleado) ? (
                                                        <img src={formatImageUrl(selectedAccesoDetail.empleado?.foto_empleado)!} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-10 h-10 text-slate-400" />
                                                    )}
                                                </div>
                                                {formatImageUrl(selectedAccesoDetail.empleado?.foto_documento) && (
                                                    <div className="w-20 h-20 rounded-2xl overflow-hidden border bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow">
                                                        <img src={formatImageUrl(selectedAccesoDetail.empleado?.foto_documento)!} alt="Documento" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-1.5 flex-1">
                                                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                                                    {selectedAccesoDetail.empleado?.nombres} {selectedAccesoDetail.empleado?.apellidos}
                                                </h3>
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    Documento de Identidad: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedAccesoDetail.empleado?.documento_identidad || 'N/A'}</span>
                                                </p>
                                                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                                                    <span className="flex items-center gap-1">
                                                        <Building className="w-3.5 h-3.5" /> Depto: {selectedAccesoDetail.empleado?.departamento?.nombre || 'General'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Briefcase className="w-3.5 h-3.5" /> Cargo: {selectedAccesoDetail.empleado?.cargo?.nombre || 'Técnico'}
                                                    </span>
                                                </div>

                                                {selectedAccesoDetail.empleado?.jornada_laboral && (
                                                    <div className="pt-2">
                                                        {renderHorarioJornada(selectedAccesoDetail.empleado.jornada_laboral, undefined, undefined, false, true)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : selectedAccesoDetail.tipo_acceso === 'productor' ? (
                                        <div className="space-y-4">
                                            {/* Ficha del Rancho / Productor */}
                                            <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 space-y-3">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/80 dark:border-purple-900/60 pb-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="p-2 bg-purple-600 text-white rounded-xl">
                                                            <Sprout className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                                                                {selectedAccesoDetail.productor?.nombre_comercial_rancho || selectedAccesoDetail.productor?.razon_social_rancho || selectedAccesoDetail.productor?.nombre_comercial || selectedAccesoDetail.productor?.razon_social || __('Rancho Productor')}
                                                            </h3>
                                                            {(selectedAccesoDetail.productor?.razon_social_rancho || selectedAccesoDetail.productor?.razon_social) && (
                                                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                                                    Razón Social: {selectedAccesoDetail.productor.razon_social_rancho || selectedAccesoDetail.productor.razon_social}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 border-purple-300 font-mono text-xs w-fit">
                                                        RFC/Doc: {selectedAccesoDetail.productor?.documento_identidad || 'N/A'}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                                    <div>
                                                        <span className="text-slate-500 block font-medium">{__('Teléfono de Contacto')}</span>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                                                            {selectedAccesoDetail.productor?.telefono || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block font-medium">{__('Contacto / Encargado')}</span>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                                            {selectedAccesoDetail.productor?.responsable || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block font-medium">{__('Ubicación Rancho')}</span>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                                            {selectedAccesoDetail.productor?.direccion || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Conductor / Personal Principal del Productor */}
                                            {selectedAccesoDetail.productor_empleado && (
                                                <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="flex gap-2 shrink-0">
                                                            <div className="w-14 h-14 rounded-2xl overflow-hidden border bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs">
                                                                {formatImageUrl(selectedAccesoDetail.productor_empleado.foto_carnet || (selectedAccesoDetail.productor_empleado as any).foto_empleado) ? (
                                                                    <img
                                                                        src={formatImageUrl(selectedAccesoDetail.productor_empleado.foto_carnet || (selectedAccesoDetail.productor_empleado as any).foto_empleado)!}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <User className="w-7 h-7 text-slate-400" />
                                                                )}
                                                            </div>
                                                            {formatImageUrl(selectedAccesoDetail.productor_empleado.documento_frontal) && (
                                                                <div className="w-14 h-14 rounded-2xl overflow-hidden border bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs">
                                                                    <img
                                                                        src={formatImageUrl(selectedAccesoDetail.productor_empleado.documento_frontal)!}
                                                                        alt="Documento"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-sm text-slate-800 dark:text-slate-200 flex flex-wrap items-center gap-2">
                                                                <span>{selectedAccesoDetail.productor_empleado.nombres} {selectedAccesoDetail.productor_empleado.apellidos}</span>
                                                                <Badge className="bg-purple-600 text-white text-[10px]">Conductor / Principal 🚗</Badge>
                                                            </div>
                                                            <div className="text-xs text-slate-500 font-mono mt-1">
                                                                Doc: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedAccesoDetail.productor_empleado.documento_identidad}</span>
                                                                {selectedAccesoDetail.productor_empleado.cargo && (
                                                                    <span className="ml-2 font-sans text-purple-600 dark:text-purple-400 font-medium">
                                                                        • {selectedAccesoDetail.productor_empleado.cargo}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (selectedAccesoDetail.tipo_acceso === 'visitante' || selectedAccesoDetail.visitante_nombre) ? (
                                        <div className="space-y-4">
                                            {/* Ficha del Visitante Particular */}
                                            <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-4">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-200 dark:border-emerald-800 pb-4">
                                                    <div className="flex items-center gap-4">
                                                        {/* Fotografías (Carnet y Documentos) */}
                                                        <div className="flex gap-2.5 shrink-0">
                                                            {formatImageUrl(selectedAccesoDetail.foto_carnet) ? (
                                                                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-600 bg-white shadow-md cursor-pointer group relative" onClick={() => setActiveImageModal(formatImageUrl(selectedAccesoDetail.foto_carnet)!)}>
                                                                    <img src={formatImageUrl(selectedAccesoDetail.foto_carnet)!} alt="Rostro" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 border flex items-center justify-center text-slate-400">
                                                                    <User className="w-8 h-8" />
                                                                </div>
                                                            )}

                                                            {formatImageUrl(selectedAccesoDetail.doc_foto_frontal) && (
                                                                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-300 bg-white shadow-xs cursor-pointer group relative" onClick={() => setActiveImageModal(formatImageUrl(selectedAccesoDetail.doc_foto_frontal)!)}>
                                                                    <img src={formatImageUrl(selectedAccesoDetail.doc_foto_frontal)!} alt="Doc Frontal" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                                </div>
                                                            )}

                                                            {formatImageUrl(selectedAccesoDetail.doc_foto_trasera) && (
                                                                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-300 bg-white shadow-xs cursor-pointer group relative" onClick={() => setActiveImageModal(formatImageUrl(selectedAccesoDetail.doc_foto_trasera)!)}>
                                                                    <img src={formatImageUrl(selectedAccesoDetail.doc_foto_trasera)!} alt="Doc Trasero" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                                                                    {selectedAccesoDetail.visitante_nombre}
                                                                </h3>
                                                                <Badge className="bg-emerald-600 text-white text-[10px]">
                                                                    {__('Visitante Particular')}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                                                                Documento de Identidad: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedAccesoDetail.visitante_documento || 'N/A'}</span>
                                                            </p>
                                                            {selectedAccesoDetail.visitante_empresa && (
                                                                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                                                                    Empresa / Organización: {selectedAccesoDetail.visitante_empresa}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {selectedAccesoDetail.visitante_telefono && (
                                                        <Badge variant="outline" className="bg-emerald-100 text-emerald-900 border-emerald-300 font-mono text-xs">
                                                            📱 WhatsApp: {selectedAccesoDetail.visitante_telefono}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Documentos de Identidad en Foto con Ampliador */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                    <div>
                                                        <span className="text-slate-500 block font-medium mb-1">{__('Documento de Identidad (Frontal)')}</span>
                                                        {formatImageUrl(selectedAccesoDetail.doc_foto_frontal) ? (
                                                            <img
                                                                src={formatImageUrl(selectedAccesoDetail.doc_foto_frontal)!}
                                                                alt="Documento Frontal"
                                                                className="w-full h-32 object-cover rounded-xl border border-slate-300 cursor-pointer hover:opacity-90 transition-opacity"
                                                                onClick={() => setActiveImageModal(formatImageUrl(selectedAccesoDetail.doc_foto_frontal)!)}
                                                            />
                                                        ) : (
                                                            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-center italic">{__('Sin foto de documento frontal')}</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block font-medium mb-1">{__('Documento de Identidad (Trasero)')}</span>
                                                        {formatImageUrl(selectedAccesoDetail.doc_foto_trasera) ? (
                                                            <img
                                                                src={formatImageUrl(selectedAccesoDetail.doc_foto_trasera)!}
                                                                alt="Documento Trasero"
                                                                className="w-full h-32 object-cover rounded-xl border border-slate-300 cursor-pointer hover:opacity-90 transition-opacity"
                                                                onClick={() => setActiveImageModal(formatImageUrl(selectedAccesoDetail.doc_foto_trasera)!)}
                                                            />
                                                        ) : (
                                                            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-center italic">{__('Sin foto de documento trasero')}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Ficha de la Empresa Proveedora */}
                                            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-3">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 dark:border-amber-900/60 pb-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="p-2 bg-amber-600 text-white rounded-xl">
                                                            <Building className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                                                                {selectedAccesoDetail.proveedor?.nombre_comercial || selectedAccesoDetail.proveedor?.razon_social || __('Empresa Proveedora Contratista')}
                                                            </h3>
                                                            {selectedAccesoDetail.proveedor?.razon_social && selectedAccesoDetail.proveedor?.nombre_comercial && (
                                                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                                                    Razón Social: {selectedAccesoDetail.proveedor.razon_social}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-300 font-mono text-xs w-fit">
                                                        RUC/Doc: {selectedAccesoDetail.proveedor?.documento_identidad || 'N/A'}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                                    <div>
                                                        <span className="text-slate-500 block font-medium">{__('Teléfono de Contacto')}</span>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                                                            {selectedAccesoDetail.proveedor?.telefono || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block font-medium">{__('Contacto / Representante')}</span>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                                            {selectedAccesoDetail.proveedor?.responsable || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block font-medium">{__('Dirección Fiscal')}</span>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                                            {selectedAccesoDetail.proveedor?.direccion || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Conductor / Personal Principal del Proveedor */}
                                            {selectedAccesoDetail.proveedor_empleado && (
                                                <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="flex gap-2 shrink-0">
                                                            <div className="w-14 h-14 rounded-2xl overflow-hidden border bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs">
                                                                {formatImageUrl(selectedAccesoDetail.proveedor_empleado.foto_carnet || (selectedAccesoDetail.proveedor_empleado as any).foto_empleado) ? (
                                                                    <img
                                                                        src={formatImageUrl(selectedAccesoDetail.proveedor_empleado.foto_carnet || (selectedAccesoDetail.proveedor_empleado as any).foto_empleado)!}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <User className="w-7 h-7 text-slate-400" />
                                                                )}
                                                            </div>
                                                            {formatImageUrl(selectedAccesoDetail.proveedor_empleado.documento_frontal) && (
                                                                <div className="w-14 h-14 rounded-2xl overflow-hidden border bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs">
                                                                    <img
                                                                        src={formatImageUrl(selectedAccesoDetail.proveedor_empleado.documento_frontal)!}
                                                                        alt="Documento"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-sm text-slate-800 dark:text-slate-200 flex flex-wrap items-center gap-2">
                                                                <span>{selectedAccesoDetail.proveedor_empleado.nombres} {selectedAccesoDetail.proveedor_empleado.apellidos}</span>
                                                                <Badge className="bg-emerald-600 text-white text-[10px]">Conductor / Principal 🚗</Badge>
                                                            </div>
                                                            <div className="text-xs text-slate-500 font-mono mt-1">
                                                                Doc: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedAccesoDetail.proveedor_empleado.documento_identidad}</span>
                                                                {selectedAccesoDetail.proveedor_empleado.cargo && (
                                                                    <span className="ml-2 font-sans text-indigo-600 dark:text-indigo-400 font-medium">
                                                                        • {selectedAccesoDetail.proveedor_empleado.cargo}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* SECCIÓN 2: FOTOGRAFÍAS Y DATOS DEL VEHÍCULO */}
                                {selectedAccesoDetail.medio_acceso === 'vehicular' && (
                                    <div className="border rounded-2xl p-5 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b pb-2">
                                            <Car className="w-4 h-4 text-amber-600" />
                                            2. {__('Información y Fotografías del Vehículo')}
                                        </h4>

                                        {(() => {
                                            const vDet = (() => {
                                                const isProd = selectedAccesoDetail.tipo_acceso === 'productor';
                                                const isProv = selectedAccesoDetail.tipo_acceso === 'proveedor';

                                                let veh = isProd
                                                    ? (selectedAccesoDetail.productor_vehiculo || selectedAccesoDetail.productor?.vehiculos?.[0] || selectedAccesoDetail.productor?.vehiculos_productor?.[0])
                                                    : isProv
                                                    ? (selectedAccesoDetail.proveedor_vehiculo || selectedAccesoDetail.proveedor?.vehiculos?.[0] || selectedAccesoDetail.proveedor?.vehiculos_proveedor?.[0])
                                                    : selectedAccesoDetail.empleado_vehiculo;

                                                if (veh) {
                                                    return {
                                                        marca: veh.marca || 'N/A',
                                                        modelo: veh.modelo || '',
                                                        placa: veh.placa || 'N/A',
                                                        tipo: veh.tipo_vehiculo || 'Auto',
                                                        fotoFrontal: veh.foto_frontal || null,
                                                        fotoTrasera: veh.foto_trasera || null,
                                                    };
                                                }

                                                return {
                                                    marca: selectedAccesoDetail.vehiculo_marca || 'N/A',
                                                    modelo: selectedAccesoDetail.vehiculo_modelo || '',
                                                    placa: selectedAccesoDetail.vehiculo_placa || 'N/A',
                                                    tipo: selectedAccesoDetail.vehiculo_tipo || 'Auto',
                                                    fotoFrontal: selectedAccesoDetail.vehiculo_foto_frontal,
                                                    fotoTrasera: selectedAccesoDetail.vehiculo_foto_trasera,
                                                };
                                            })();

                                            return (
                                                <>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border">
                                                        <div>
                                                            <span className="text-slate-500 block">{__('Marca / Modelo')}</span>
                                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                                {vDet.marca} - {vDet.modelo}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 block">{__('Placa de Rodaje')}</span>
                                                            <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                                                                {vDet.placa}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 block">{__('Tipo Vehículo')}</span>
                                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                                {vDet.tipo}
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
                                                                {vDet.fotoFrontal ? (
                                                                    <img
                                                                        src={formatImageUrl(vDet.fotoFrontal)!}
                                                                        alt="Foto Frontal"
                                                                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                                        onClick={() => window.open(formatImageUrl(vDet.fotoFrontal)!, '_blank')}
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
                                                                {vDet.fotoTrasera ? (
                                                                    <img
                                                                        src={formatImageUrl(vDet.fotoTrasera)!}
                                                                        alt="Foto Trasera"
                                                                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                                        onClick={() => window.open(formatImageUrl(vDet.fotoTrasera)!, '_blank')}
                                                                    />
                                                                ) : (
                                                                    <span className="text-xs text-slate-400 italic">Sin fotografía trasera registrada</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* SECCIÓN 3: ACOMPAÑANTES REGISTRADOS */}
                                {selectedAccesoDetail.acompanantes && selectedAccesoDetail.acompanantes.length > 0 && (
                                    <div className="border rounded-2xl p-5 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b pb-2">
                                            <Users className="w-4 h-4 text-emerald-600" />
                                            3. {__('Acompañantes Registrados')} ({selectedAccesoDetail.acompanantes.length})
                                        </h4>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {selectedAccesoDetail.acompanantes.map((ac: any, idx: number) => {
                                                const nombreCompleto = ac.nombre || `${ac.nombres || ''} ${ac.apellidos || ''}`.trim() || `Acompañante #${idx + 1}`;
                                                const docIdentidad = ac.documento || ac.documento_identidad || 'N/A';
                                                const deptoCargo = ac.departamento ? `Depto: ${ac.departamento}` : (ac.cargo ? `Cargo: ${ac.cargo}` : null);

                                                return (
                                                    <div key={idx} className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-800/40 flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full border border-emerald-300 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden">
                                                            {ac.foto_empleado ? (
                                                                <img src={ac.foto_empleado} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                            )}
                                                        </div>
                                                        <div className="space-y-0.5 flex-1 min-w-0">
                                                            <div className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                                                                {nombreCompleto}
                                                            </div>
                                                            <div className="text-[11px] text-slate-500 font-mono">
                                                                Doc: <span className="font-bold text-slate-700 dark:text-slate-300">{docIdentidad}</span>
                                                                {deptoCargo && <span className="ml-1 text-slate-400 font-sans">| {deptoCargo}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
                                    {selectedItemForAcompanantes.acompanantes.map((ac: any, idx: number) => {
                                        const nombreCompleto = ac.nombre || `${ac.nombres || ''} ${ac.apellidos || ''}`.trim() || `Acompañante #${idx + 1}`;
                                        const docIdentidad = ac.documento || ac.documento_identidad || 'N/A';
                                        return (
                                            <div key={idx} className="p-3.5 flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-full border border-emerald-300 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 overflow-hidden text-xs">
                                                    {ac.foto_empleado ? (
                                                        <img src={ac.foto_empleado} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                                        {nombreCompleto}
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-mono">
                                                        Doc: <span className="font-bold text-slate-700 dark:text-slate-300">{docIdentidad}</span>
                                                        {ac.departamento && <span className="ml-1 font-sans text-slate-400">| Depto: {ac.departamento}</span>}
                                                    </div>
                                                    {ac.jornada_laboral && renderHorarioJornada(ac.jornada_laboral, nombreCompleto, docIdentidad, true)}
                                                </div>
                                            </div>
                                        );
                                    })}
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
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                                        className={`h-14 text-sm font-semibold ${tipoAcceso === 'empleado' ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : ''}`}
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
                                        className={`h-14 text-sm font-semibold ${tipoAcceso === 'proveedor' ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md' : ''}`}
                                    >
                                        <Truck className="mr-2 h-5 w-5" />
                                        {__('Proveedor')}
                                    </Button>

                                    <Button
                                        type="button"
                                        size="lg"
                                        variant={tipoAcceso === 'productor' ? 'default' : 'outline'}
                                        onClick={() => {
                                            setTipoAcceso('productor');
                                            setSelectedEntity(null);
                                            setSearchQuery('');
                                            setAcompanantesList([]);
                                            setActiveAuthToken(null);
                                            setAutorizacionRecibida(null);
                                        }}
                                        className={`h-14 text-sm font-semibold ${tipoAcceso === 'productor' ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md' : ''}`}
                                    >
                                        <Sprout className="mr-2 h-5 w-5" />
                                        {__('Productor')}
                                    </Button>
                                </div>
                            </div>

                            {/* PASO 2: Búsqueda dinámica de entidad */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    2. {tipoAcceso === 'empleado'
                                        ? __('Buscar Empleado Conductor (Nombre, Apellidos, Documento)')
                                        : tipoAcceso === 'productor'
                                        ? __('Buscar Productor / Rancho (Razón Social, Nombre Comercial, RFC)')
                                        : __('Buscar Proveedor (Razón Social, Nombre Comercial, RUC/DNI)')}
                                </Label>
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        placeholder={tipoAcceso === 'empleado'
                                            ? __('Escriba nombre, apellido o documento...')
                                            : tipoAcceso === 'productor'
                                            ? __('Escriba nombre del rancho, razón social o RFC...')
                                            : __('Escriba razón social, nombre comercial o RUC...')}
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
                                                        {(item.nombres || item.nombre_comercial_rancho || item.nombre_comercial || item.razon_social).charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-sm">
                                                            {tipoAcceso === 'empleado'
                                                                ? `${item.nombres} ${item.apellidos}`
                                                                : item.nombre_comercial_rancho || item.razon_social_rancho || item.nombre_comercial || item.razon_social}
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
                                                        : selectedEntity.nombre_comercial_rancho || selectedEntity.razon_social_rancho || selectedEntity.nombre_comercial || selectedEntity.razon_social}
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

                                    {/* Si es Proveedor o Productor: Selección Múltiple de Empleados del Proveedor/Productor */}
                                    {(tipoAcceso === 'proveedor' || tipoAcceso === 'productor') && (
                                        <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
                                                <div>
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                                        <Users className="w-4 h-4 text-indigo-600" />
                                                        {tipoAcceso === 'productor' ? __('Personal del Productor que accederá:') : __('Personal del Proveedor que accederá:')}
                                                    </Label>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                                        {__('Seleccione uno o varios empleados. El primero actuará como Conductor / Principal.')}
                                                    </p>
                                                </div>

                                                {((tipoAcceso === 'productor' ? selectedEntity.empleados_productor : selectedEntity.empleados_proveedor)?.length > 0) && (
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <Button
                                                            type="button"
                                                            size="xs"
                                                            variant="outline"
                                                            onClick={selectAllProveedorEmpleados}
                                                            className="text-[11px] h-7 px-2.5"
                                                        >
                                                            {__('Seleccionar Todos')}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="xs"
                                                            variant="ghost"
                                                            onClick={deselectAllProveedorEmpleados}
                                                            className="text-[11px] h-7 px-2 text-slate-500 hover:text-slate-700"
                                                        >
                                                            {__('Desmarcar')}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            {((tipoAcceso === 'productor' ? selectedEntity.empleados_productor : selectedEntity.empleados_proveedor)?.length > 0) ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                                    {(tipoAcceso === 'productor' ? selectedEntity.empleados_productor : selectedEntity.empleados_proveedor).map((emp: any) => {
                                                        const empIdStr = emp.id.toString();
                                                        const isSelected = selectedProveedorEmpleadoIds.includes(empIdStr);
                                                        const isMain = selectedProveedorEmpleadoIds[0] === empIdStr;

                                                        return (
                                                            <div
                                                                key={emp.id}
                                                                onClick={() => toggleProveedorEmpleadoSelection(empIdStr)}
                                                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                                                                    isSelected
                                                                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-400/30 shadow-xs'
                                                                        : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                                                        isSelected
                                                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                                                                    }`}>
                                                                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                                    </div>
                                                                    <div className="w-9 h-9 rounded-full overflow-hidden border bg-white dark:bg-slate-800 shrink-0 flex items-center justify-center shadow-xs">
                                                                         {formatImageUrl(emp.foto_carnet || emp.foto_empleado) ? (
                                                                             <img
                                                                                 src={formatImageUrl(emp.foto_carnet || emp.foto_empleado)!}
                                                                                 alt=""
                                                                                 className="w-full h-full object-cover"
                                                                             />
                                                                         ) : (
                                                                             <User className="w-4 h-4 text-slate-400" />
                                                                         )}
                                                                     </div>
                                                                     <div className="min-w-0">
                                                                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                                                                            {emp.nombres} {emp.apellidos}
                                                                        </div>
                                                                        <div className="text-[11px] text-slate-500 font-mono">
                                                                            Doc: {emp.documento_identidad}
                                                                            {emp.cargo && <span className="ml-1.5 text-indigo-600 dark:text-indigo-400 font-sans">({emp.cargo})</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {isSelected && (
                                                                    <Badge className={`text-[10px] shrink-0 font-medium ${
                                                                        isMain
                                                                            ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                                                                            : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-200'
                                                                    }`}>
                                                                        {isMain ? __('Principal 🚗') : __('Acompañante 👥')}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 text-purple-800 dark:text-purple-300 text-xs">
                                                    {tipoAcceso === 'productor'
                                                        ? __('Este productor no tiene colaboradores pre-registrados en el sistema. Puede registrar el acceso del vehículo y agregar observaciones.')
                                                        : __('Este proveedor no tiene empleados pre-registrados en el sistema. Puede registrar el acceso del vehículo y agregar observaciones.')}
                                                </div>
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
                                            onClick={() => {
                                                setMedioAcceso('peatonal');
                                                setData('medio_acceso', 'peatonal');
                                            }}
                                            className={`h-12 ${medioAcceso === 'peatonal' ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md' : ''}`}
                                        >
                                            <Footprints className="mr-2 h-5 w-5" />
                                            {__('Peatonal')}
                                        </Button>

                                        <Button
                                            type="button"
                                            size="lg"
                                            variant={medioAcceso === 'vehicular' ? 'default' : 'outline'}
                                            onClick={() => {
                                                setMedioAcceso('vehicular');
                                                setData('medio_acceso', 'vehicular');
                                            }}
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
                                                (tipoAcceso === 'proveedor' && selectedEntity.vehiculos_proveedor?.length > 0) ||
                                                (tipoAcceso === 'productor' && selectedEntity.vehiculos_productor?.length > 0)) && (
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
                                                            {(tipoAcceso === 'empleado'
                                                                ? selectedEntity.vehiculos
                                                                : tipoAcceso === 'productor'
                                                                ? selectedEntity.vehiculos_productor
                                                                : selectedEntity.vehiculos_proveedor).map((v: any) => (
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

                {/* ═══════════════════════════════════════════════════════════
                    MODAL: PRE-ANUNCIAR / GENERAR PASE DIGITAL DE VISITA
                ═══════════════════════════════════════════════════════════ */}
                <Dialog
                    open={isCreateInvitacionOpen}
                    onOpenChange={(open) => {
                        if (!open) resetInvModal();
                        setIsCreateInvitacionOpen(open);
                    }}
                >
                    <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="px-6 pt-6 pb-0">
                            <DialogTitle className="text-lg font-extrabold flex items-center gap-2 text-[#104a29]">
                                <Calendar className="w-5 h-5 text-emerald-600" />
                                {__('Pre-Anunciar / Generar Pase Digital de Visita')}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleCreateInvitacionSubmit} className="flex flex-col gap-5 px-6 py-5">

                            {/* PASO 1 — Tipo de Visita */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {__('Tipo de Visita')} <span className="text-rose-500">*</span>
                                </Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {([
                                        { val: 'visitante', icon: '👤', label: __('Visitante Particular') },
                                        { val: 'proveedor', icon: '🚚', label: __('Proveedor de Servicios') },
                                        { val: 'productor', icon: '🌱', label: __('Productor / Socio Agrícola') },
                                    ] as const).map((opt) => (
                                        <button
                                            key={opt.val}
                                            type="button"
                                            onClick={() => {
                                                setInvTipoAcceso(opt.val);
                                                setSelectedInvEntity(null);
                                                setInvEntityQuery('');
                                                setInvEntityResults([]);
                                                invForm.setData((prev: any) => ({
                                                    ...prev,
                                                    tipo_acceso: opt.val,
                                                    proveedor_id: '',
                                                    productor_id: '',
                                                    tipo_servicio_id: '',
                                                    visitante_nombres: '',
                                                    visitante_apellidos: '',
                                                }));
                                            }}
                                            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-bold transition-all cursor-pointer ${
                                                invTipoAcceso === opt.val
                                                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 shadow-sm'
                                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                            }`}
                                        >
                                            <span className="text-xl">{opt.icon}</span>
                                            <span className="text-center leading-tight">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* PASO 2 — Responsable / Anfitrión (siempre visible) */}
                            <div className="space-y-2" ref={invResponsableRef}>
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {invTipoAcceso === 'visitante' ? __('Anfitrión / Responsable Driscoll\'s') : __('Responsable Driscoll\'s')}
                                    <span className="text-rose-500"> *</span>
                                </Label>

                                {selectedInvResponsable ? (
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                                        <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0">
                                            {selectedInvResponsable.nombres?.[0]}{selectedInvResponsable.apellidos?.[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 truncate">
                                                {selectedInvResponsable.nombres} {selectedInvResponsable.apellidos}
                                            </div>
                                            {selectedInvResponsable.departamento && (
                                                <div className="text-[11px] text-slate-500">{selectedInvResponsable.departamento.nombre}</div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedInvResponsable(null);
                                                setInvResponsableQuery('');
                                                invForm.setData('anfitrion_id', '');
                                            }}
                                            className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                        >
                                            {__('Cambiar')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                        <Input
                                            placeholder={__('Buscar por nombre, apellido o departamento...')}
                                            value={invResponsableQuery}
                                            onChange={(e) => { setInvResponsableQuery(e.target.value); setInvResponsableOpen(true); }}
                                            onFocus={() => setInvResponsableOpen(true)}
                                            className="pl-9 h-10 w-full bg-white dark:bg-slate-900 text-xs"
                                        />
                                        {invResponsableOpen && filteredResponsables.length > 0 && (
                                            <div className="absolute z-50 top-full mt-1 w-full border rounded-xl bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 max-h-52 overflow-y-auto shadow-xl">
                                                {filteredResponsables.map((resp) => (
                                                    <button
                                                        key={resp.id}
                                                        type="button"
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                                                        onClick={() => {
                                                            setSelectedInvResponsable(resp);
                                                            invForm.setData('anfitrion_id', String(resp.id));
                                                            setInvResponsableOpen(false);
                                                            setInvResponsableQuery('');
                                                        }}
                                                    >
                                                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                                                            {resp.nombres?.[0]}{resp.apellidos?.[0]}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{resp.nombres} {resp.apellidos}</div>
                                                            {resp.departamento && <div className="text-[10px] text-slate-500">{resp.departamento.nombre}</div>}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-dashed pt-4 space-y-4">

                            {/* ── VISITANTE PARTICULAR ── */}
                            {invTipoAcceso === 'visitante' && (
                                <>
                                    {/* Nombres y Apellidos */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">{__('Nombres')} <span className="text-rose-500">*</span></Label>
                                            <Input
                                                placeholder="Ej: Juan Carlos"
                                                value={invForm.data.visitante_nombres}
                                                onChange={(e) => invForm.setData('visitante_nombres', e.target.value)}
                                                className="h-10 w-full bg-white dark:bg-slate-900 text-xs"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">{__('Apellidos')} <span className="text-rose-500">*</span></Label>
                                            <Input
                                                placeholder="Ej: Pérez Gómez"
                                                value={invForm.data.visitante_apellidos}
                                                onChange={(e) => invForm.setData('visitante_apellidos', e.target.value)}
                                                className="h-10 w-full bg-white dark:bg-slate-900 text-xs"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* País + Teléfono */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">{__('Teléfono (WhatsApp)')} <span className="text-rose-500">*</span></Label>
                                        <div className="flex gap-2">
                                            <Select
                                                value={invForm.data.pais_telefono_id}
                                                onValueChange={(v) => invForm.setData('pais_telefono_id', v)}
                                            >
                                                <SelectTrigger className="w-48 flex-shrink-0 h-10 text-xs bg-white dark:bg-slate-900 font-mono">
                                                    <SelectValue placeholder={__('País...')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {paises.map((p: any) => (
                                                        <SelectItem key={p.id} value={String(p.id)}>
                                                            {p.nombre} ({p.codigo_telefonico})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                placeholder="Ej: 33 1234 5678"
                                                value={invForm.data.visitante_telefono}
                                                onChange={(e) => invForm.setData('visitante_telefono', e.target.value)}
                                                className="flex-1 h-10 bg-white dark:bg-slate-900 text-xs font-mono"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Fecha y Hora */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">{__('Fecha Estimada')} <span className="text-rose-500">*</span></Label>
                                            <Input type="date" value={invForm.data.fecha_estimada} onChange={(e) => invForm.setData('fecha_estimada', e.target.value)} className="h-10 w-full bg-white dark:bg-slate-900 text-xs" required />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">{__('Hora Estimada')}</Label>
                                            <Input type="time" value={invForm.data.hora_estimada} onChange={(e) => invForm.setData('hora_estimada', e.target.value)} className="h-10 w-full bg-white dark:bg-slate-900 text-xs" />
                                        </div>
                                    </div>

                                    {/* Motivo */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">{__('Motivo de Visita')} <span className="text-rose-500">*</span></Label>
                                        <Textarea placeholder="Ej: Reunión comercial en sala de juntas..." value={invForm.data.motivo_visita} onChange={(e) => invForm.setData('motivo_visita', e.target.value)} className="min-h-[80px] w-full bg-white dark:bg-slate-900 text-xs" required />
                                    </div>
                                </>
                            )}

                            {/* ── PROVEEDOR ── */}
                            {invTipoAcceso === 'proveedor' && (
                                <>
                                    {/* Buscador de Proveedor */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">{__('Buscar Proveedor')} <span className="text-rose-500">*</span></Label>
                                        {selectedInvEntity ? (
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200">
                                                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white flex-shrink-0"><Truck className="w-4 h-4" /></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold text-amber-900 dark:text-amber-300 truncate">{selectedInvEntity.razon_social || selectedInvEntity.nombre_comercial}</div>
                                                    <div className="text-[11px] text-slate-500">RFC/Doc: {selectedInvEntity.documento_identidad || 'N/A'}</div>
                                                </div>
                                                <button type="button" onClick={() => { setSelectedInvEntity(null); invForm.setData('proveedor_id', ''); setInvEntityQuery(''); }} className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors">{__('Cambiar')}</button>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                                    <Input placeholder={__('Razón Social, Nombre Comercial o RFC...')} value={invEntityQuery} onChange={(e) => setInvEntityQuery(e.target.value)} className="pl-9 h-10 w-full bg-white dark:bg-slate-900 text-xs" />
                                                </div>
                                                {isSearchingInvEntity && <p className="text-xs text-slate-500 px-1">{__('Buscando...')}</p>}
                                                {invEntityResults.length > 0 && (
                                                    <div className="border rounded-xl bg-white dark:bg-slate-900 divide-y max-h-48 overflow-y-auto shadow-lg">
                                                        {invEntityResults.map((e: any) => (
                                                            <button key={e.id} type="button" onClick={() => { setSelectedInvEntity(e); invForm.setData('proveedor_id', String(e.id)); setInvEntityQuery(''); setInvEntityResults([]); }} className="w-full p-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 text-left text-xs">
                                                                <Truck className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                                <div>
                                                                    <div className="font-bold text-slate-800 dark:text-slate-200">{e.razon_social || e.nombre_comercial}</div>
                                                                    <div className="text-[10px] text-slate-500">Doc: {e.documento_identidad || 'N/A'} · Tel: {e.telefono || 'N/A'}</div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Tipo de Servicio (sin IDs 1 y 6) */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">{__('Tipo de Servicio')} <span className="text-rose-500">*</span></Label>
                                        <Select value={invForm.data.tipo_servicio_id} onValueChange={(v) => invForm.setData('tipo_servicio_id', v)}>
                                            <SelectTrigger className="h-10 w-full bg-white dark:bg-slate-900 text-xs">
                                                <SelectValue placeholder={__('Seleccionar tipo de servicio...')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tipoServicios.filter((ts: any) => ts.id !== 1 && ts.id !== 6).map((ts: any) => (
                                                    <SelectItem key={ts.id} value={String(ts.id)}>{ts.nombre}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Fecha y Hora */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">{__('Fecha Estimada de Visita')} <span className="text-rose-500">*</span></Label>
                                            <Input type="date" value={invForm.data.fecha_estimada} onChange={(e) => invForm.setData('fecha_estimada', e.target.value)} className="h-10 w-full bg-white dark:bg-slate-900 text-xs" required />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">{__('Hora de Llegada')}</Label>
                                            <Input type="time" value={invForm.data.hora_estimada} onChange={(e) => invForm.setData('hora_estimada', e.target.value)} className="h-10 w-full bg-white dark:bg-slate-900 text-xs" />
                                        </div>
                                    </div>

                                    {/* Motivo */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">{__('Motivo de Visita')} <span className="text-rose-500">*</span></Label>
                                        <Textarea placeholder="Ej: Mantenimiento preventivo de equipos..." value={invForm.data.motivo_visita} onChange={(e) => invForm.setData('motivo_visita', e.target.value)} className="min-h-[80px] w-full bg-white dark:bg-slate-900 text-xs" required />
                                    </div>
                                </>
                            )}

                            {/* ── PRODUCTOR ── */}
                            {invTipoAcceso === 'productor' && (
                                <>
                                    {/* Buscador de Productor */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">{__('Buscar Productor / Rancho')} <span className="text-rose-500">*</span></Label>
                                        {selectedInvEntity ? (
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200">
                                                <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white flex-shrink-0"><Sprout className="w-4 h-4" /></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold text-purple-900 dark:text-purple-300 truncate">{selectedInvEntity.nombre_comercial_rancho || selectedInvEntity.razon_social_rancho || selectedInvEntity.nombre_comercial}</div>
                                                    <div className="text-[11px] text-slate-500">RFC/Doc: {selectedInvEntity.documento_identidad || 'N/A'}</div>
                                                </div>
                                                <button type="button" onClick={() => { setSelectedInvEntity(null); invForm.setData('productor_id', ''); setInvEntityQuery(''); }} className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors">{__('Cambiar')}</button>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                                    <Input placeholder={__('Nombre del Rancho, Razón Social o RFC...')} value={invEntityQuery} onChange={(e) => setInvEntityQuery(e.target.value)} className="pl-9 h-10 w-full bg-white dark:bg-slate-900 text-xs" />
                                                </div>
                                                {isSearchingInvEntity && <p className="text-xs text-slate-500 px-1">{__('Buscando...')}</p>}
                                                {invEntityResults.length > 0 && (
                                                    <div className="border rounded-xl bg-white dark:bg-slate-900 divide-y max-h-48 overflow-y-auto shadow-lg">
                                                        {invEntityResults.map((e: any) => (
                                                            <button key={e.id} type="button" onClick={() => { setSelectedInvEntity(e); invForm.setData('productor_id', String(e.id)); setInvEntityQuery(''); setInvEntityResults([]); }} className="w-full p-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 text-left text-xs">
                                                                <Sprout className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                                                <div>
                                                                    <div className="font-bold text-slate-800 dark:text-slate-200">{e.nombre_comercial_rancho || e.razon_social_rancho || e.nombre_comercial}</div>
                                                                    <div className="text-[10px] text-slate-500">Razón Social: {e.razon_social || 'N/A'} · RFC: {e.documento_identidad || 'N/A'}</div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Tipo de Servicio */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">{__('Tipo de Servicio / Entrega')} <span className="text-rose-500">*</span></Label>
                                        <Select value={invForm.data.tipo_servicio_id} onValueChange={(v) => invForm.setData('tipo_servicio_id', v)}>
                                            <SelectTrigger className="h-10 w-full bg-white dark:bg-slate-900 text-xs">
                                                <SelectValue placeholder={__('Seleccionar tipo de servicio agrícola...')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tipoServicios.map((ts: any) => (
                                                    <SelectItem key={ts.id} value={String(ts.id)}>{ts.nombre}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Fecha y Hora */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">{__('Fecha Estimada de Visita')} <span className="text-rose-500">*</span></Label>
                                            <Input type="date" value={invForm.data.fecha_estimada} onChange={(e) => invForm.setData('fecha_estimada', e.target.value)} className="h-10 w-full bg-white dark:bg-slate-900 text-xs" required />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">{__('Hora de Llegada')}</Label>
                                            <Input type="time" value={invForm.data.hora_estimada} onChange={(e) => invForm.setData('hora_estimada', e.target.value)} className="h-10 w-full bg-white dark:bg-slate-900 text-xs" />
                                        </div>
                                    </div>

                                    {/* Motivo */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">{__('Motivo de Visita')} <span className="text-rose-500">*</span></Label>
                                        <Textarea placeholder="Ej: Entrega de cosecha / Reunión agrícola..." value={invForm.data.motivo_visita} onChange={(e) => invForm.setData('motivo_visita', e.target.value)} className="min-h-[80px] w-full bg-white dark:bg-slate-900 text-xs" required />
                                    </div>
                                </>
                            )}

                            </div>{/* end border-t section */}

                            <DialogFooter className="gap-2 pt-2 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsCreateInvitacionOpen(false)} className="h-10 px-6 text-xs">
                                    {__('Cancelar')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={invForm.processing || !invForm.data.anfitrion_id}
                                    className="bg-[#104a29] hover:bg-[#0c371e] text-white h-10 px-6 text-xs font-bold gap-1.5"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    {__('Pre-Anunciar e Invitar (Pase QR)')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL LIGHTBOX / VISOR DE IMÁGENES COMPLETO */}
                {activeImageModal && (
                    <div
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
                        onClick={() => setActiveImageModal(null)}
                    >
                        <div className="relative max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-3xl" onClick={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                onClick={() => setActiveImageModal(null)}
                                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 backdrop-blur-md transition-colors z-10 shadow-lg"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <img
                                src={activeImageModal}
                                alt="Fotografía / Documento"
                                className="w-full h-full object-contain max-h-[85vh] mx-auto rounded-2xl border border-white/10"
                            />
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}
