import { Head, useForm, router } from '@inertiajs/react';
import {
    Users,
    Plus,
    CheckCircle,
    XCircle,
    MoreVertical,
    Pencil,
    Trash2,
    ToggleRight,
    Building2,
    Tag,
    Layers,
    Briefcase,
    Mail,
    Phone,
    FileText,
    Camera,
    RefreshCw,
    User as UserIcon,
    ShieldAlert,
    Eye,
    Upload,
    Car,
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PhoneInputGroup from '../Empresas/Partials/PhoneInputGroup';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTranslate } from '@/hooks/use-translate';
import { cn, cleanParams } from '@/lib/utils';
import type { Auth } from '@/types';
import type { Paginated } from '@/types/app';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Pais {
    id: number;
    nombre: string;
    codigo_iso2: string;
    codigo_telefonico: string;
}

interface Empresa {
    id: number;
    razon_social: string;
}

interface Sucursal {
    id: number;
    nombre: string;
    empresa_id: number;
}

interface Departamento {
    id: number;
    nombre: string;
    empresa_id: number;
    sucursal_id: number;
}

interface Cargo {
    id: number;
    nombre: string;
    departamento_id: number;
}

interface Responsable {
    id: number;
    nombres: string;
    apellidos: string;
    departamento_id: number;
    cargo_id: number;
    cargo?: {
        id: number;
        nombre: string;
    } | null;
}

interface Usuario {
    id: number;
    name: string;
    email: string;
}

interface Empleado {
    id: number;
    nombres: string;
    apellidos: string;
    documento_identidad: string;
    pais_telefono_id?: number | null;
    telefono?: string | null;
    correo?: string | null;
    genero?: string | null;
    departamento_id: number;
    responsable_id?: number | null;
    cargo_id?: number | null;
    foto_empleado?: string | null;
    foto_documento?: string | null;
    empresa_id: number;
    sucursal_id: number;
    user_id: number;
    status: boolean;
    pais_telefono?: Pais | null;
    departamento?: Departamento | null;
    responsable?: Responsable | null;
    cargo?: Cargo | null;
    empresa?: Empresa | null;
    sucursal?: Sucursal | null;
    user?: Usuario | null;
}

interface EmpleadosPageProps {
    auth: Auth;
    empleados: Paginated<Empleado>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
    };
    empresas: Empresa[];
    sucursales: Sucursal[];
    usuarios: Usuario[];
    departamentos: Departamento[];
    responsables: Responsable[];
    cargos: Cargo[];
    paises: Pais[];
    filters: {
        search?: string;
        status?: string;
        perPage?: string;
        departamento_id?: string;
    };
    empresa?: {
        id: number;
        razon_social: string;
    } | null;
    sucursal?: {
        id: number;
        nombre: string;
    } | null;
}

const defaultJornada = [
    { dia: 'Lunes', activo: false, hora_ingreso: '08:00', hora_salida: '17:00' },
    { dia: 'Martes', activo: false, hora_ingreso: '08:00', hora_salida: '17:00' },
    { dia: 'Miércoles', activo: false, hora_ingreso: '08:00', hora_salida: '17:00' },
    { dia: 'Jueves', activo: false, hora_ingreso: '08:00', hora_salida: '17:00' },
    { dia: 'Viernes', activo: false, hora_ingreso: '08:00', hora_salida: '17:00' },
    { dia: 'Sábado', activo: false, hora_ingreso: '08:00', hora_salida: '17:00' },
    { dia: 'Domingo', activo: false, hora_ingreso: '08:00', hora_salida: '17:00' }
];

// ─── Formulario inicial vacío ─────────────────────────────────────────────────

const initialForm = {
    nombres: '',
    apellidos: '',
    documento_identidad: '',
    pais_telefono_id: '' as string | number,
    telefono: '',
    correo: '',
    genero: '',
    departamento_id: '' as string | number,
    responsable_id: '' as string | number,
    cargo_id: '' as string | number,
    jornada_laboral: defaultJornada as any,
    foto_empleado: null as any,
    foto_empleado_2: null as any,
    foto_documento: null as any,
    foto_documento_reverso: null as any,
    vehiculos: [] as any[],
    empresa_id: '' as string | number,
    sucursal_id: '' as string | number,
    user_id: '' as string | number,
    status: 1 as number,
};

// ─── Componente de Captura de Cámara Integrado ───────────────────────────────

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
                video: { width: 640, height: 480, facingMode: 'user' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error(err);
            setError(__('No webcam access or camera not found'));
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
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/40 flex flex-col items-center gap-3">
            {error && (
                <div className="text-red-500 flex flex-col items-center gap-2 text-center text-sm py-4">
                    <ShieldAlert className="w-8 h-8" />
                    <span>{error}</span>
                </div>
            )}

            {!error && !captured && (
                <div className="relative w-full max-w-[320px] aspect-[4/3] bg-black rounded-md overflow-hidden border">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                        <Button
                            type="button"
                            size="sm"
                            onClick={capture}
                            className="bg-primary text-primary-foreground shadow-md flex items-center gap-1.5"
                        >
                            <Camera className="w-4 h-4" />
                            {__('Capture Snapshot')}
                        </Button>
                    </div>
                </div>
            )}

            {captured && (
                <div className="flex flex-col items-center gap-3 w-full">
                    <div className="w-full max-w-[320px] aspect-[4/3] rounded-md overflow-hidden border">
                        <img src={captured} alt="Captured preview" className="w-full h-full object-cover" />
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
                            {__('Retake')}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => onCapture(captured)}
                            className="flex items-center gap-1"
                        >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {__('Save')}
                        </Button>
                    </div>
                </div>
            )}

            <Button type="button" variant="ghost" size="xs" onClick={onCancel} className="text-muted-foreground mt-1">
                {__('Cancel')}
            </Button>
        </div>
    );
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function EmpleadosIndexPage({
    auth,
    empleados,
    stats,
    empresas,
    sucursales,
    usuarios,
    departamentos,
    responsables,
    cargos,
    paises,
    filters,
    empresa: appEmpresa,
    sucursal: appSucursal,
}: EmpleadosPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Employees'), href: '/admin/empleados' },
    ];

    // ── Estados ────────────────────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null);
    const [deletingEmpleado, setDeletingEmpleado] = useState<Empleado | null>(null);
    const [activeTab, setActiveTab] = useState('general');
    const [isTableLoading, setIsTableLoading] = useState(false);
    const [activeCameraField, setActiveCameraField] = useState<'foto_empleado' | 'foto_empleado_2' | 'foto_documento' | 'foto_documento_reverso' | 'foto_frontal' | 'foto_trasera' | null>(null);
    const [showVehicleForm, setShowVehicleForm] = useState(false);
    const [newVehicle, setNewVehicle] = useState({
        tipo_vehiculo: '',
        marca: '',
        modelo: '',
        year: '',
        placa: '',
        foto_frontal: '',
        foto_trasera: '',
    });

    const [isPreRegistroModalOpen, setIsPreRegistroModalOpen] = useState(false);
    const preRegistroForm = useForm({
        nombres: '',
        apellidos: '',
        pais_telefono_id: auth.user?.pais_telefono_id || paises[0]?.id || '',
        telefono: '',
        motivo_registro: '',
        responsable_id: '',
    });

    const handlePreRegistroSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        preRegistroForm.post('/admin/empleados/pre-registro', {
            onSuccess: () => {
                setIsPreRegistroModalOpen(false);
                preRegistroForm.reset();
            },
        });
    };

    // Filtros
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [depFilter, setDepFilter] = useState(filters.departamento_id || '');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '10');

    const fileInputEmpleadoRef = useRef<HTMLInputElement>(null);
    const fileInputEmpleado2Ref = useRef<HTMLInputElement>(null);
    const fileInputDocumentoRef = useRef<HTMLInputElement>(null);
    const fileInputDocumentoReversoRef = useRef<HTMLInputElement>(null);
    const fileInputVehiculoFrontalRef = useRef<HTMLInputElement>(null);
    const fileInputVehiculoTraseraRef = useRef<HTMLInputElement>(null);

    // ── Hooks de navegación ────────────────────────────────────────────────────
    useEffect(() => {
        const unbindStart = router.on('start', () => setIsTableLoading(true));
        const unbindFinish = router.on('finish', () => setIsTableLoading(false));

        return () => {
            unbindStart();
            unbindFinish();
        };
    }, []);

    // Debounce de filtros
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                window.location.pathname,
                cleanParams({
                    search: searchTerm,
                    status: statusFilter,
                    departamento_id: depFilter,
                    perPage: perPageFilter,
                }),
                { preserveState: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, depFilter, perPageFilter]);

    // ── Formulario Inertia ─────────────────────────────────────────────────────
    const { data, setData, post, reset, errors, processing } = useForm(initialForm);

    // ── Filtro de dependencias según selección ──────────────────────────────────
    const filteredSucursales = sucursales.filter(s => s.empresa_id === Number(data.empresa_id));
    const filteredDepartamentos = departamentos.filter(d => d.empresa_id === Number(data.empresa_id) && d.sucursal_id === Number(data.sucursal_id));
    const filteredResponsables = responsables.filter(r => r.departamento_id === Number(data.departamento_id));
    const filteredCargos = cargos.filter(c => c.departamento_id === Number(data.departamento_id));

    // Obtener información del responsable seleccionado
    const selectedResponsable = responsables.find(r => r.id === Number(data.responsable_id));

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleCreateClick = () => {
        setEditingEmpleado(null);
        reset();

        // Autocompletar empresa, sucursal y usuario del autenticado
        const companyId = auth.user?.empresa_id || appEmpresa?.id || '';
        const branchId = auth.user?.sucursal_id || appSucursal?.id || '';
        
        setData(prev => ({
            ...prev,
            empresa_id: companyId,
            sucursal_id: branchId,
            user_id: auth.user?.id || '',
            pais_telefono_id: auth.user?.pais_telefono_id || paises[0]?.id || '',
            jornada_laboral: defaultJornada,
            foto_empleado_2: null,
            foto_documento_reverso: null,
            vehiculos: [],
        }));

        setActiveTab('general');
        setActiveCameraField(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (emp: any) => {
        setEditingEmpleado(emp);
        setData({
            nombres: emp.nombres || '',
            apellidos: emp.apellidos || '',
            documento_identidad: emp.documento_identidad || '',
            pais_telefono_id: emp.pais_telefono_id || '',
            telefono: emp.telefono || '',
            correo: emp.correo || '',
            genero: emp.genero || '',
            departamento_id: emp.departamento_id || '',
            responsable_id: emp.responsable_id || '',
            cargo_id: emp.cargo_id || '',
            jornada_laboral: emp.jornada_laboral || defaultJornada,
            foto_empleado: emp.foto_empleado || null,
            foto_empleado_2: emp.foto_empleado_2 || null,
            foto_documento: emp.foto_documento || null,
            foto_documento_reverso: emp.foto_documento_reverso || null,
            vehiculos: emp.vehiculos || [],
            empresa_id: emp.empresa_id || '',
            sucursal_id: emp.sucursal_id || '',
            user_id: emp.user_id || '',
            status: emp.status ? 1 : 0,
        });
        setActiveTab('general');
        setActiveCameraField(null);
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingEmpleado) {
            // Spoofing PUT con POST en Inertia para soportar subidas de archivos
            router.post(`/admin/empleados/${editingEmpleado.id}`, {
                ...data,
                _method: 'PUT'
            } as any, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingEmpleado(null);
                    reset();
                    notifySuccess(__('Employee updated successfully.'));
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        } else {
            post('/admin/empleados', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Employee created successfully.'));
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        }
    };

    const handleToggleStatus = (emp: Empleado) => {
        router.patch(`/admin/empleados/${emp.id}/toggle-status`, {}, { 
            preserveScroll: true,
            onSuccess: () => notifySuccess(__('Status updated successfully.')),
        });
    };

    const handleDeleteConfirm = () => {
        if (!deletingEmpleado) return;

        router.delete(`/admin/empleados/${deletingEmpleado.id}`, {
            onSuccess: () => {
                setDeletingEmpleado(null);
                notifySuccess(__('Employee deleted successfully.'));
            },
            onError: () => notifyError(__('There was an error deleting the employee.')),
        });
    };

    // Subida manual de archivos
    const handleFileChange = (field: 'foto_empleado' | 'foto_documento' | 'foto_documento_reverso', file: File | null) => {
        if (file) {
            setData(field, file);
        }
    };

    // Captura desde cámara
    const handleCameraCapture = (field: 'foto_empleado' | 'foto_documento' | 'foto_documento_reverso', base64Data: string) => {
        setData(field, base64Data);
        setActiveCameraField(null);
    };

    // Resolver preview de imagen
    const getImageSrc = (fieldVal: any) => {
        if (!fieldVal) return null;
        if (typeof fieldVal === 'string') return fieldVal; // Base64 o URL guardada (/storage/...)
        if (fieldVal instanceof File) return URL.createObjectURL(fieldVal);
        return null;
    };

    // ── Columnas de la tabla ───────────────────────────────────────────────────

    const columns: ColumnDef<Empleado>[] = [
        {
            header: 'Employee',
            accessorKey: 'nombres',
            className: 'font-medium',
            cell: (emp) => {
                const foto = emp.foto_empleado || '/image/avatar-placeholder.png'; // fallback avatar
                return (
                    <div className="flex items-center gap-3">
                        <img
                            src={foto}
                            alt={`${emp.nombres} ${emp.apellidos}`}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cccccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
                            }}
                        />
                        <div>
                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{emp.nombres} {emp.apellidos}</p>
                            <p className="text-xs text-muted-foreground">{__('ID')}: {emp.documento_identidad}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            header: 'Contact Info',
            hideOn: 'mobile',
            cell: (emp) => (
                <div className="space-y-0.5 text-xs">
                    {emp.correo && (
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{emp.correo}</span>
                        </div>
                    )}
                    {emp.telefono && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" />
                            <span>
                                {emp.pais_telefono?.codigo_telefonico ? `+${emp.pais_telefono.codigo_telefonico} ` : ''}
                                {emp.telefono}
                            </span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            header: 'Department / Position',
            hideOn: 'mobile',
            cell: (emp) => (
                <div className="space-y-0.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 font-medium">
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{emp.departamento?.nombre || '—'}</span>
                    </div>
                    {emp.cargo && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>{emp.cargo?.nombre}</span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            header: 'Responsible / Manager',
            hideOn: 'mobile',
            cell: (emp) => {
                if (!emp.responsable) return <span className="text-xs text-muted-foreground">—</span>;
                return (
                    <div className="text-xs">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                            {emp.responsable.nombres} {emp.responsable.apellidos}
                        </p>
                        {emp.responsable.cargo && (
                            <p className="text-[10px] text-muted-foreground">
                                {emp.responsable.cargo.nombre}
                            </p>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Status',
            stopRowClick: true,
            cell: (emp) => (
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={emp.status}
                        onCheckedChange={() => handleToggleStatus(emp)}
                    />
                    <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full border',
                        emp.status
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                            : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                    )}>
                        {emp.status ? __('Active') : __('Inactive')}
                    </span>
                </div>
            ),
        },
        {
            header: 'Actions',
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (emp) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(emp)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.get(`/admin/empleados/${emp.id}/carnet`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {__('Ver Carnet')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(emp)}>
                            <ToggleRight className="mr-2 h-4 w-4" />
                            {emp.status ? __('Deactivate') : __('Activate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setDeletingEmpleado(emp)}
                            className="text-red-600 focus:text-red-600 dark:text-red-400"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {__('Delete')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <>
            <Head title={__('Employees')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Users className="h-6 w-6 text-white" />}
                    title={__('Employees')}
                    description={__('Manage employees, their departments, responsibles, contact info and photos.')}
                    colorClassName="bg-indigo-600"
                >
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            onClick={() => setIsPreRegistroModalOpen(true)}
                            variant="outline"
                            className="border-indigo-600 text-indigo-600 hover:bg-indigo-600/10 flex items-center gap-1.5"
                        >
                            <Phone className="w-4 h-4" />
                            {__('Pre-registro')}
                        </Button>
                        <Button onClick={handleCreateClick}>
                            <Plus className="mr-2 h-4 w-4" />
                            {__('New Employee')}
                        </Button>
                    </div>
                </ModuleHeader>

                {/* Tarjetas Estadísticas */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard
                        icon={<Users className="h-6 w-6" />}
                        title={__('TOTAL EMPLOYEES')}
                        value={stats.total}
                        colorClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
                    />
                    <StatCard
                        icon={<CheckCircle className="h-6 w-6" />}
                        title={__('ACTIVE')}
                        value={stats.activos}
                        colorClassName="bg-green-100 text-green-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                    />
                    <StatCard
                        icon={<XCircle className="h-6 w-6" />}
                        title={__('INACTIVE')}
                        value={stats.inactivos}
                        colorClassName="bg-red-100 text-red-600 dark:bg-rose-950/20 dark:text-rose-400"
                    />
                </div>

                {/* Filtros */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Search')}>
                            <Input
                                placeholder={__('Search by name, document, email...')}
                                className="w-full md:w-80"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Department')}>
                            <Select value={depFilter} onValueChange={setDepFilter}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue placeholder={__('All Departments')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{__('All')}</SelectItem>
                                    {departamentos.map((dep) => (
                                        <SelectItem key={dep.id} value={String(dep.id)}>
                                            {dep.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>
                        <FilterField label={__('Status')}>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue placeholder={__('All')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{__('All')}</SelectItem>
                                    <SelectItem value="1">{__('Active')}</SelectItem>
                                    <SelectItem value="0">{__('Inactive')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                        <FilterField label={__('Records per page')}>
                            <Select value={perPageFilter} onValueChange={setPerPageFilter}>
                                <SelectTrigger className="w-full md:w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                    </div>
                </FilterBar>

                {/* Tabla */}
                <div className="w-full">
                    <DataTable
                        data={empleados}
                        columns={columns}
                        isLoading={isTableLoading}
                        onRowClick={(emp) => handleEditClick(emp)}
                        emptyState={{
                            title: 'No employees found',
                            description: searchTerm || statusFilter || depFilter
                                ? 'Try clearing your search filters or changing your query.'
                                : 'You have not registered any employees yet.',
                            ctaLabel: 'New Employee',
                            onCtaClick: handleCreateClick,
                        }}
                    />
                </div>
            </div>

            {/* ── Modal Creación / Edición ────────────────────────────────────────────── */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[720px] lg:max-w-[850px] max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <DialogHeader>
                            <DialogTitle>
                                {editingEmpleado ? __('Edit Employee') : __('New Employee')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Complete the employee details and upload or capture the requested photographs.')}
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
                            <TabsList className="grid grid-cols-4 w-full mb-6">
                                <TabsTrigger value="general" className="flex items-center gap-2">
                                    <UserIcon className="h-4 w-4" />
                                    {__('General')}
                                </TabsTrigger>
                                <TabsTrigger value="laboral" className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" />
                                    {__('Job Position')}
                                </TabsTrigger>
                                <TabsTrigger value="fotos" className="flex items-center gap-2">
                                    <Camera className="h-4 w-4" />
                                    {__('Photographs')}
                                </TabsTrigger>
                                <TabsTrigger value="vehiculos" className="flex items-center gap-2">
                                    <Car className="h-4 w-4" />
                                    {__('Vehicles')}
                                </TabsTrigger>
                            </TabsList>

                            {/* ══ Tab 1: General ══════════════════════════════════════════════════ */}
                            <TabsContent value="general" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Nombres */}
                                    <div>
                                        <Label htmlFor="nombres">{__('First Name')} *</Label>
                                        <Input
                                            id="nombres"
                                            value={data.nombres}
                                            onChange={(e) => setData('nombres', e.target.value)}
                                            placeholder="John"
                                        />
                                        {errors.nombres && (
                                            <p className="text-red-500 text-xs mt-1">{errors.nombres}</p>
                                        )}
                                    </div>

                                    {/* Apellidos */}
                                    <div>
                                        <Label htmlFor="apellidos">{__('Last Name')} *</Label>
                                        <Input
                                            id="apellidos"
                                            value={data.apellidos}
                                            onChange={(e) => setData('apellidos', e.target.value)}
                                            placeholder="Doe"
                                        />
                                        {errors.apellidos && (
                                            <p className="text-red-500 text-xs mt-1">{errors.apellidos}</p>
                                        )}
                                    </div>

                                    {/* Documento de Identidad */}
                                    <div>
                                        <Label htmlFor="documento_identidad">{__('Document / Tax ID')} *</Label>
                                        <Input
                                            id="documento_identidad"
                                            value={data.documento_identidad}
                                            onChange={(e) => setData('documento_identidad', e.target.value)}
                                            placeholder="V-12345678"
                                        />
                                        {errors.documento_identidad && (
                                            <p className="text-red-500 text-xs mt-1">{errors.documento_identidad}</p>
                                        )}
                                    </div>

                                    {/* Correo */}
                                    <div>
                                        <Label htmlFor="correo">{__('Email')}</Label>
                                        <Input
                                            id="correo"
                                            type="email"
                                            value={data.correo}
                                            onChange={(e) => setData('correo', e.target.value)}
                                            placeholder="john.doe@example.com"
                                        />
                                        {errors.correo && (
                                            <p className="text-red-500 text-xs mt-1">{errors.correo}</p>
                                        )}
                                    </div>

                                    {/* Género */}
                                    <div>
                                        <Label htmlFor="genero">{__('Gender')}</Label>
                                        <Select
                                            value={data.genero || ''}
                                            onValueChange={(v) => setData('genero', v)}
                                        >
                                            <SelectTrigger id="genero" className="w-full">
                                                <SelectValue placeholder={__('Select Gender')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="M">{__('Male')}</SelectItem>
                                                <SelectItem value="F">{__('Female')}</SelectItem>
                                                <SelectItem value="Otro">{__('Other')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.genero && (
                                            <p className="text-red-500 text-xs mt-1">{errors.genero}</p>
                                        )}
                                    </div>

                                    {/* Estado */}
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-900/30">
                                        <div>
                                            <Label htmlFor="status" className="font-semibold block">{__('Status')}</Label>
                                            <span className="text-xs text-muted-foreground">{__('Enable or disable employee access')}</span>
                                        </div>
                                        <Switch
                                            id="status"
                                            checked={Number(data.status) === 1}
                                            onCheckedChange={(checked) => setData('status', checked ? 1 : 0)}
                                        />
                                    </div>

                                    {/* Teléfono */}
                                    <div className="md:col-span-2">
                                        <Label htmlFor="telefono">{__('Phone')}</Label>
                                        <PhoneInputGroup
                                            paises={paises}
                                            selectedPaisId={data.pais_telefono_id}
                                            phoneValue={data.telefono}
                                            onPaisChange={(v) => setData('pais_telefono_id', v)}
                                            onPhoneChange={(v) => setData('telefono', v)}
                                            placeholder="000-000000"
                                            error={errors.telefono}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ══ Tab 2: Laboral ══════════════════════════════════════════════════ */}
                            <TabsContent value="laboral" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Empresa (Auto-asignado u Opcional) */}
                                    <div>
                                        <Label htmlFor="empresa_id">{__('Company')} *</Label>
                                        <Select
                                            value={String(data.empresa_id)}
                                            onValueChange={(v) => {
                                                setData(prev => ({
                                                    ...prev,
                                                    empresa_id: v,
                                                    sucursal_id: '',
                                                    departamento_id: '',
                                                    responsable_id: '',
                                                    cargo_id: '',
                                                }));
                                            }}
                                            disabled={!!auth.user?.empresa_id}
                                        >
                                            <SelectTrigger id="empresa_id" className="w-full">
                                                <SelectValue placeholder={__('Select Company')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {empresas.map((emp) => (
                                                    <SelectItem key={emp.id} value={String(emp.id)}>
                                                        {emp.razon_social}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.empresa_id && (
                                            <p className="text-red-500 text-xs mt-1">{errors.empresa_id}</p>
                                        )}
                                    </div>

                                    {/* Sucursal (Auto-asignado u Opcional) */}
                                    <div>
                                        <Label htmlFor="sucursal_id">{__('Branch')} *</Label>
                                        <Select
                                            value={String(data.sucursal_id)}
                                            onValueChange={(v) => {
                                                setData(prev => ({
                                                    ...prev,
                                                    sucursal_id: v,
                                                    departamento_id: '',
                                                    responsable_id: '',
                                                    cargo_id: '',
                                                }));
                                            }}
                                            disabled={!!auth.user?.sucursal_id}
                                        >
                                            <SelectTrigger id="sucursal_id" className="w-full">
                                                <SelectValue placeholder={__('Select Branch')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredSucursales.map((suc) => (
                                                    <SelectItem key={suc.id} value={String(suc.id)}>
                                                        {suc.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.sucursal_id && (
                                            <p className="text-red-500 text-xs mt-1">{errors.sucursal_id}</p>
                                        )}
                                    </div>

                                    {/* Departamento */}
                                    <div>
                                        <Label htmlFor="departamento_id">{__('Department')} *</Label>
                                        <Select
                                            value={String(data.departamento_id)}
                                            onValueChange={(v) => {
                                                setData(prev => ({
                                                    ...prev,
                                                    departamento_id: v,
                                                    responsable_id: '',
                                                    cargo_id: '',
                                                }));
                                            }}
                                        >
                                            <SelectTrigger id="departamento_id" className="w-full">
                                                <SelectValue placeholder={__('Select Department')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredDepartamentos.map((dep) => (
                                                    <SelectItem key={dep.id} value={String(dep.id)}>
                                                        {dep.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.departamento_id && (
                                            <p className="text-red-500 text-xs mt-1">{errors.departamento_id}</p>
                                        )}
                                    </div>

                                    {/* Cargo del empleado */}
                                    <div>
                                        <Label htmlFor="cargo_id">{__('Position')}</Label>
                                        <Select
                                            value={String(data.cargo_id || '')}
                                            onValueChange={(v) => setData('cargo_id', v)}
                                            disabled={!data.departamento_id}
                                        >
                                            <SelectTrigger id="cargo_id" className="w-full">
                                                <SelectValue placeholder={data.departamento_id ? __('Select Position') : __('Select Department First')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredCargos.map((cargo) => (
                                                    <SelectItem key={cargo.id} value={String(cargo.id)}>
                                                        {cargo.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.cargo_id && (
                                            <p className="text-red-500 text-xs mt-1">{errors.cargo_id}</p>
                                        )}
                                    </div>

                                    {/* Responsable / Supervisor */}
                                    <div>
                                        <Label htmlFor="responsable_id">{__('Responsible')}</Label>
                                        <Select
                                            value={String(data.responsable_id || '')}
                                            onValueChange={(v) => setData('responsable_id', v)}
                                            disabled={!data.departamento_id}
                                        >
                                            <SelectTrigger id="responsable_id" className="w-full">
                                                <SelectValue placeholder={data.departamento_id ? __('Select Responsible') : __('Select Department First')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredResponsables.map((resp) => (
                                                    <SelectItem key={resp.id} value={String(resp.id)}>
                                                        {resp.nombres} {resp.apellidos}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.responsable_id && (
                                            <p className="text-red-500 text-xs mt-1">{errors.responsable_id}</p>
                                        )}
                                    </div>

                                    {/* Cargo del Responsable (Se muestra informativamente) */}
                                    <div>
                                        <Label>{__('Responsible Position')}</Label>
                                        <div className="w-full h-9 rounded-md border border-input bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 text-sm flex items-center text-slate-500 select-none">
                                            {selectedResponsable?.cargo?.nombre ? (
                                                <span className="flex items-center gap-1.5">
                                                    <Briefcase className="w-4 h-4 text-slate-400" />
                                                    {selectedResponsable.cargo.nombre}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 italic">
                                                    {data.responsable_id ? __('Position not assigned') : __('Select responsible first')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Jornada Laboral */}
                                    <div className="md:col-span-2 border-t pt-6 mt-4 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-5 h-5 text-indigo-500" />
                                            <h3 className="text-sm font-semibold">{__('Working Days & Hours')}</h3>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {__('Select working days and configure check-in / check-out times for the employee.')}
                                        </p>

                                        <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                            {((data.jornada_laboral as any[]) || []).map((jornada, idx) => (
                                                <div key={jornada.dia} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b last:border-0 border-slate-100 dark:border-slate-800/50">
                                                    <div className="flex items-center gap-3 w-36">
                                                        <Switch
                                                            checked={!!jornada.activo}
                                                            onCheckedChange={(checked) => {
                                                                const updated = [...(data.jornada_laboral as any[])];
                                                                updated[idx].activo = checked;
                                                                setData('jornada_laboral', updated);
                                                            }}
                                                        />
                                                        <Label className="font-semibold text-sm cursor-pointer">{__(jornada.dia)}</Label>
                                                    </div>

                                                    <div className="flex items-center gap-4 flex-1 max-w-md">
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <span className="text-xs text-slate-400">{__('In:')}</span>
                                                            <Input
                                                                type="time"
                                                                value={jornada.hora_ingreso || '08:00'}
                                                                disabled={!jornada.activo}
                                                                onChange={(e) => {
                                                                    const updated = [...(data.jornada_laboral as any[])];
                                                                    updated[idx].hora_ingreso = e.target.value;
                                                                    setData('jornada_laboral', updated);
                                                                }}
                                                                className="h-8 py-1 px-2 text-xs"
                                                            />
                                                        </div>

                                                        <div className="flex items-center gap-2 flex-1">
                                                            <span className="text-xs text-slate-400">{__('Out:')}</span>
                                                            <Input
                                                                type="time"
                                                                value={jornada.hora_salida || '17:00'}
                                                                disabled={!jornada.activo}
                                                                onChange={(e) => {
                                                                    const updated = [...(data.jornada_laboral as any[])];
                                                                    updated[idx].hora_salida = e.target.value;
                                                                    setData('jornada_laboral', updated);
                                                                }}
                                                                className="h-8 py-1 px-2 text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ══ Tab 3: Fotos (Subida + Webcam) ══════════════════════════════════ */}
                            <TabsContent value="fotos" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Foto del Empleado */}
                                    <div className="flex flex-col gap-2">
                                        <Label className="font-semibold">{__('Employee Photo')}</Label>
                                        
                                        {activeCameraField === 'foto_empleado' ? (
                                            <CameraWidget
                                                onCapture={(base64) => handleCameraCapture('foto_empleado', base64)}
                                                onCancel={() => setActiveCameraField(null)}
                                            />
                                        ) : (
                                            <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center gap-3 min-h-[180px] bg-slate-50/50 dark:bg-slate-900/10">
                                                {getImageSrc(data.foto_empleado) ? (
                                                    <div className="relative w-28 h-28 rounded-full overflow-hidden border border-slate-200 shadow-sm group">
                                                        <img
                                                            src={getImageSrc(data.foto_empleado)!}
                                                            alt="Employee Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                            <Button
                                                                type="button"
                                                                size="xs"
                                                                variant="destructive"
                                                                onClick={() => setData('foto_empleado', '')}
                                                            >
                                                                {__('Delete')}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-center">
                                                        <UserIcon className="w-10 h-10 text-slate-300" />
                                                        <span className="text-xs text-muted-foreground max-w-[200px]">
                                                            {__('Upload a photo or capture one using your camera')}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        ref={fileInputEmpleadoRef}
                                                        className="hidden"
                                                        onChange={(e) => handleFileChange('foto_empleado', e.target.files?.[0] || null)}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="xs"
                                                        onClick={() => fileInputEmpleadoRef.current?.click()}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Upload className="w-3 h-3" />
                                                        {__('Upload')}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="xs"
                                                        onClick={() => setActiveCameraField('foto_empleado')}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Camera className="w-3 h-3" />
                                                        {__('Take Photo')}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        {errors.foto_empleado && (
                                            <p className="text-red-500 text-xs">{errors.foto_empleado}</p>
                                        )}
                                    </div>

                                    {/* Foto del Empleado 2 */}
                                    <div className="flex flex-col gap-2">
                                        <Label className="font-semibold">{__('Employee Photo 2')}</Label>
                                        
                                        {activeCameraField === 'foto_empleado_2' ? (
                                            <CameraWidget
                                                onCapture={(base64) => handleCameraCapture('foto_empleado_2', base64)}
                                                onCancel={() => setActiveCameraField(null)}
                                            />
                                        ) : (
                                            <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center gap-3 min-h-[180px] bg-slate-50/50 dark:bg-slate-900/10">
                                                {getImageSrc(data.foto_empleado_2) ? (
                                                    <div className="relative w-28 h-28 rounded-full overflow-hidden border border-slate-200 shadow-sm group">
                                                        <img
                                                            src={getImageSrc(data.foto_empleado_2)!}
                                                            alt="Employee Photo 2 Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                            <Button
                                                                type="button"
                                                                size="xs"
                                                                variant="destructive"
                                                                onClick={() => setData('foto_empleado_2', '')}
                                                            >
                                                                {__('Delete')}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-center">
                                                        <UserIcon className="w-10 h-10 text-slate-300" />
                                                        <span className="text-xs text-muted-foreground max-w-[200px]">
                                                            {__('Upload a photo or capture one using your camera')}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        ref={fileInputEmpleado2Ref}
                                                        className="hidden"
                                                        onChange={(e) => handleFileChange('foto_empleado_2', e.target.files?.[0] || null)}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="xs"
                                                        onClick={() => fileInputEmpleado2Ref.current?.click()}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Upload className="w-3 h-3" />
                                                        {__('Upload')}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="xs"
                                                        onClick={() => setActiveCameraField('foto_empleado_2')}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Camera className="w-3 h-3" />
                                                        {__('Take Photo')}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        {errors.foto_empleado_2 && (
                                            <p className="text-red-500 text-xs">{errors.foto_empleado_2}</p>
                                        )}
                                    </div>

                                    {/* Foto del Documento de Identidad */}
                                    <div className="flex flex-col gap-2">
                                        <Label className="font-semibold">{__('ID Document Photo')}</Label>
                                        
                                        {activeCameraField === 'foto_documento' ? (
                                            <CameraWidget
                                                onCapture={(base64) => handleCameraCapture('foto_documento', base64)}
                                                onCancel={() => setActiveCameraField(null)}
                                            />
                                        ) : (
                                            <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center gap-3 min-h-[180px] bg-slate-50/50 dark:bg-slate-900/10">
                                                {getImageSrc(data.foto_documento) ? (
                                                    <div className="relative w-44 aspect-[3/2] rounded-md overflow-hidden border border-slate-200 shadow-sm group">
                                                        <img
                                                            src={getImageSrc(data.foto_documento)!}
                                                            alt="Document Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                            <Button
                                                                type="button"
                                                                size="xs"
                                                                variant="destructive"
                                                                onClick={() => setData('foto_documento', '')}
                                                            >
                                                                {__('Delete')}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-center">
                                                        <FileText className="w-10 h-10 text-slate-300" />
                                                        <span className="text-xs text-muted-foreground max-w-[200px]">
                                                            {__('Upload a photo or capture one using your camera')}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        ref={fileInputDocumentoRef}
                                                        className="hidden"
                                                        onChange={(e) => handleFileChange('foto_documento', e.target.files?.[0] || null)}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="xs"
                                                        onClick={() => fileInputDocumentoRef.current?.click()}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Upload className="w-3 h-3" />
                                                        {__('Upload')}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="xs"
                                                        onClick={() => setActiveCameraField('foto_documento')}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Camera className="w-3 h-3" />
                                                        {__('Take Photo')}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        {errors.foto_documento && (
                                            <p className="text-red-500 text-xs">{errors.foto_documento}</p>
                                        )}
                                    </div>

                                    {/* Foto del Documento de Identidad (Reverso) */}
                                    <div className="flex flex-col gap-2">
                                        <Label className="font-semibold">{__('ID Document Photo (Reverse)')}</Label>
                                        
                                        {activeCameraField === 'foto_documento_reverso' ? (
                                            <CameraWidget
                                                onCapture={(base64) => handleCameraCapture('foto_documento_reverso', base64)}
                                                onCancel={() => setActiveCameraField(null)}
                                            />
                                        ) : (
                                            <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center gap-3 min-h-[180px] bg-slate-50/50 dark:bg-slate-900/10">
                                                {getImageSrc(data.foto_documento_reverso) ? (
                                                    <div className="relative w-44 aspect-[3/2] rounded-md overflow-hidden border border-slate-200 shadow-sm group">
                                                        <img
                                                            src={getImageSrc(data.foto_documento_reverso)!}
                                                            alt="Document Reverse Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                            <Button
                                                                type="button"
                                                                size="xs"
                                                                variant="destructive"
                                                                onClick={() => setData('foto_documento_reverso', '')}
                                                            >
                                                                {__('Delete')}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-center">
                                                        <FileText className="w-10 h-10 text-slate-300" />
                                                        <span className="text-xs text-muted-foreground max-w-[200px]">
                                                            {__('Upload a photo or capture one using your camera')}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        ref={fileInputDocumentoReversoRef}
                                                        className="hidden"
                                                        onChange={(e) => handleFileChange('foto_documento_reverso', e.target.files?.[0] || null)}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="xs"
                                                        onClick={() => fileInputDocumentoReversoRef.current?.click()}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Upload className="w-3 h-3" />
                                                        {__('Upload')}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="xs"
                                                        onClick={() => setActiveCameraField('foto_documento_reverso')}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Camera className="w-3 h-3" />
                                                        {__('Take Photo')}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        {errors.foto_documento_reverso && (
                                            <p className="text-red-500 text-xs">{errors.foto_documento_reverso}</p>
                                        )}
                                    </div>

                                </div>
                            </TabsContent>

                            {/* ══ Tab 4: Vehículos ══════════════════════════════════════════════════ */}
                            <TabsContent value="vehiculos" className="space-y-6">
                                <div className="border-b pb-4 flex justify-between items-center">
                                    <h2 className="text-lg font-bold">{__('Vehicles')}</h2>
                                    {!showVehicleForm && (
                                        <Button type="button" size="sm" onClick={() => setShowVehicleForm(true)}>
                                            <Plus className="w-4 h-4 mr-1" /> {__('Add Vehicle')}
                                        </Button>
                                    )}
                                </div>

                                {showVehicleForm && (
                                    <div className="p-5 border bg-slate-50/50 dark:bg-slate-900/55 rounded-2xl space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label>{__('Vehicle Type *')}</Label>
                                                <Select
                                                    value={newVehicle.tipo_vehiculo}
                                                    onValueChange={(val) => setNewVehicle(prev => ({ ...prev, tipo_vehiculo: val }))}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={__('Select')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Automóvil">{__('Car')}</SelectItem>
                                                        <SelectItem value="Camioneta">{__('Pickup')}</SelectItem>
                                                        <SelectItem value="Camión">{__('Truck')}</SelectItem>
                                                        <SelectItem value="Motocicleta">{__('Motorcycle')}</SelectItem>
                                                        <SelectItem value="Otro">{__('Other')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>{__('Make *')}</Label>
                                                <Input
                                                    value={newVehicle.marca}
                                                    onChange={(e) => setNewVehicle(prev => ({ ...prev, marca: e.target.value }))}
                                                    placeholder="Ej: Chevrolet, Toyota"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>{__('Model *')}</Label>
                                                <Input
                                                    value={newVehicle.modelo}
                                                    onChange={(e) => setNewVehicle(prev => ({ ...prev, modelo: e.target.value }))}
                                                    placeholder="Ej: Hilux, Aveo"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>{__('Year *')}</Label>
                                                <Input
                                                    type="number"
                                                    value={newVehicle.year}
                                                    onChange={(e) => setNewVehicle(prev => ({ ...prev, year: e.target.value }))}
                                                    placeholder="Ej: 2020"
                                                />
                                            </div>
                                            <div className="space-y-1.5 sm:col-span-2">
                                                <Label>{__('License Plate *')}</Label>
                                                <Input
                                                    value={newVehicle.placa}
                                                    onChange={(e) => setNewVehicle(prev => ({ ...prev, placa: e.target.value }))}
                                                    placeholder="Ej: ABC-1234"
                                                />
                                            </div>

                                            {/* Foto frontal */}
                                            <div className="flex flex-col gap-2">
                                                <Label className="text-xs font-semibold">{__('Front Photo')}</Label>
                                                {activeCameraField === 'foto_frontal' ? (
                                                    <CameraWidget
                                                        onCapture={(base64) => {
                                                            setNewVehicle(prev => ({ ...prev, foto_frontal: base64 }));
                                                            setActiveCameraField(null);
                                                        }}
                                                        onCancel={() => setActiveCameraField(null)}
                                                    />
                                                ) : (
                                                    <div className="border border-dashed rounded-lg p-2 flex flex-col items-center justify-center gap-2 min-h-[120px] bg-white dark:bg-slate-900/10">
                                                        {newVehicle.foto_frontal ? (
                                                            <div className="relative w-24 h-16 rounded overflow-hidden border">
                                                                <img src={newVehicle.foto_frontal} className="w-full h-full object-cover" />
                                                                <Button type="button" size="xs" variant="destructive" className="absolute top-0 right-0 h-4 w-4 p-0 rounded-none animate-none" onClick={() => setNewVehicle(prev => ({ ...prev, foto_frontal: '' }))}>X</Button>
                                                            </div>
                                                        ) : <span className="text-xs text-muted-foreground">{__('No photo')}</span>}
                                                        <div className="flex gap-1.5">
                                                            <Button type="button" variant="outline" size="xs" onClick={() => fileInputVehiculoFrontalRef.current?.click()}>{__('Upload')}</Button>
                                                            <Button type="button" variant="outline" size="xs" onClick={() => setActiveCameraField('foto_frontal')}>{__('Camera')}</Button>
                                                        </div>
                                                    </div>
                                                )}
                                                <input type="file" accept="image/*" ref={fileInputVehiculoFrontalRef} className="hidden" onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.readAsDataURL(file);
                                                        reader.onload = () => setNewVehicle(prev => ({ ...prev, foto_frontal: reader.result as string }));
                                                    }
                                                }} />
                                            </div>

                                            {/* Foto trasera */}
                                            <div className="flex flex-col gap-2">
                                                <Label className="text-xs font-semibold">{__('Rear Photo')}</Label>
                                                {activeCameraField === 'foto_trasera' ? (
                                                    <CameraWidget
                                                        onCapture={(base64) => {
                                                            setNewVehicle(prev => ({ ...prev, foto_trasera: base64 }));
                                                            setActiveCameraField(null);
                                                        }}
                                                        onCancel={() => setActiveCameraField(null)}
                                                    />
                                                ) : (
                                                    <div className="border border-dashed rounded-lg p-2 flex flex-col items-center justify-center gap-2 min-h-[120px] bg-white dark:bg-slate-900/10">
                                                        {newVehicle.foto_trasera ? (
                                                            <div className="relative w-24 h-16 rounded overflow-hidden border">
                                                                <img src={newVehicle.foto_trasera} className="w-full h-full object-cover" />
                                                                <Button type="button" size="xs" variant="destructive" className="absolute top-0 right-0 h-4 w-4 p-0 rounded-none animate-none" onClick={() => setNewVehicle(prev => ({ ...prev, foto_trasera: '' }))}>X</Button>
                                                            </div>
                                                        ) : <span className="text-xs text-muted-foreground">{__('No photo')}</span>}
                                                        <div className="flex gap-1.5">
                                                            <Button type="button" variant="outline" size="xs" onClick={() => fileInputVehiculoTraseraRef.current?.click()}>{__('Upload')}</Button>
                                                            <Button type="button" variant="outline" size="xs" onClick={() => setActiveCameraField('foto_trasera')}>{__('Camera')}</Button>
                                                        </div>
                                                    </div>
                                                )}
                                                <input type="file" accept="image/*" ref={fileInputVehiculoTraseraRef} className="hidden" onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.readAsDataURL(file);
                                                        reader.onload = () => setNewVehicle(prev => ({ ...prev, foto_trasera: reader.result as string }));
                                                    }
                                                }} />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                                            <Button type="button" variant="outline" size="sm" onClick={() => setShowVehicleForm(false)}>{__('Cancel')}</Button>
                                            <Button type="button" size="sm" onClick={() => {
                                                if (!newVehicle.tipo_vehiculo || !newVehicle.marca || !newVehicle.modelo || !newVehicle.year || !newVehicle.placa) {
                                                    alert(__('All vehicle fields are required.'));
                                                    return;
                                                }
                                                setData('vehiculos', [...(data.vehiculos || []), newVehicle]);
                                                setNewVehicle({ tipo_vehiculo: '', marca: '', modelo: '', year: '', placa: '', foto_frontal: '', foto_trasera: '' });
                                                setShowVehicleForm(false);
                                            }}>{__('Save Vehicle')}</Button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {(!data.vehiculos || data.vehiculos.length === 0) ? (
                                        <div className="text-center py-10 border-2 border-dashed rounded-2xl text-muted-foreground bg-slate-50/20 dark:bg-slate-900/10">
                                            <Car className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                            <p className="text-sm font-medium">{__('No vehicles registered.')}</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {data.vehiculos.map((veh: any, i: number) => (
                                                <div key={i} className="p-4 border rounded-2xl flex justify-between items-center bg-white dark:bg-slate-900 shadow-xs">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 border rounded-lg overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center">
                                                            {veh.foto_frontal ? <img src={veh.foto_frontal} className="w-full h-full object-cover" /> : <Car className="w-6 h-6 text-slate-300" />}
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-sm block">{veh.marca} {veh.modelo} ({veh.year})</span>
                                                            <span className="text-xs text-slate-400 font-mono">{__('License Plate:')} {veh.placa} • {__((veh.tipo_vehiculo || '').toUpperCase()) || veh.tipo_vehiculo}</span>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={() => {
                                                        const updated = (data.vehiculos || []).filter((_: any, idx: number) => idx !== i);
                                                        setData('vehiculos', updated);
                                                    }} className="text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="flex justify-end gap-3 border-t pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                            >
                                {__('Cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                            >
                                {processing ? __('Saving...') : __('Save Changes')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Modal Confirmación Eliminación ──────────────────────────────────────── */}
            <AlertDialog open={!!deletingEmpleado} onOpenChange={(open) => !open && setDeletingEmpleado(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{__('Are you sure?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {__('This action cannot be undone. This will permanently delete the employee record and their photos.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{__('Cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {__('Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ══ Modal de Pre-registro de Empleado ════════════════════ */}
            <Dialog open={isPreRegistroModalOpen} onOpenChange={(open) => {
                setIsPreRegistroModalOpen(open);
                if (!open) preRegistroForm.reset();
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{__('Pre-registro de Empleado')}</DialogTitle>
                        <DialogDescription>
                            {__('Ingrese los datos del colaborador, el motivo y quién autoriza para enviar una invitación de registro rápido a su WhatsApp.')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePreRegistroSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="pre_nombres">{__('First Name')}</Label>
                                <Input
                                    id="pre_nombres"
                                    value={preRegistroForm.data.nombres}
                                    onChange={(e) => preRegistroForm.setData('nombres', e.target.value)}
                                    className={cn(preRegistroForm.errors.nombres && 'border-rose-500')}
                                    required
                                />
                                {preRegistroForm.errors.nombres && (
                                    <p className="text-xs text-rose-500 mt-1">{preRegistroForm.errors.nombres}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="pre_apellidos">{__('Last Name')}</Label>
                                <Input
                                    id="pre_apellidos"
                                    value={preRegistroForm.data.apellidos}
                                    onChange={(e) => preRegistroForm.setData('apellidos', e.target.value)}
                                    className={cn(preRegistroForm.errors.apellidos && 'border-rose-500')}
                                    required
                                />
                                {preRegistroForm.errors.apellidos && (
                                    <p className="text-xs text-rose-500 mt-1">{preRegistroForm.errors.apellidos}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="pre_telefono">{__('Phone')}</Label>
                            <PhoneInputGroup
                                paises={paises}
                                selectedPaisId={preRegistroForm.data.pais_telefono_id ? Number(preRegistroForm.data.pais_telefono_id) : '' as any}
                                phoneValue={preRegistroForm.data.telefono}
                                onPaisChange={(v) => preRegistroForm.setData('pais_telefono_id', String(v))}
                                onPhoneChange={(v) => preRegistroForm.setData('telefono', v)}
                                placeholder="000-0000000"
                                error={preRegistroForm.errors.telefono}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="pre_motivo">{__('Reason for registration')}</Label>
                            <Input
                                id="pre_motivo"
                                value={preRegistroForm.data.motivo_registro}
                                onChange={(e) => preRegistroForm.setData('motivo_registro', e.target.value)}
                                className={cn(preRegistroForm.errors.motivo_registro && 'border-rose-500')}
                                placeholder="Ej: Nuevo ingreso, temporal, etc."
                                required
                            />
                            {preRegistroForm.errors.motivo_registro && (
                                <p className="text-xs text-rose-500 mt-1">{preRegistroForm.errors.motivo_registro}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="pre_responsable">{__('Authorizer (Manager)')}</Label>
                            <Select
                                value={preRegistroForm.data.responsable_id}
                                onValueChange={(val) => preRegistroForm.setData('responsable_id', val)}
                            >
                                <SelectTrigger className={cn(preRegistroForm.errors.responsable_id && 'border-rose-500')}>
                                    <SelectValue placeholder={__('Select manager')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {responsables.map((resp) => (
                                        <SelectItem key={resp.id} value={String(resp.id)}>
                                            {resp.nombres} {resp.apellidos}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {preRegistroForm.errors.responsable_id && (
                                <p className="text-xs text-rose-500 mt-1">{preRegistroForm.errors.responsable_id}</p>
                            )}
                        </div>

                        <DialogFooter className="mt-6 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsPreRegistroModalOpen(false)}
                            >
                                {__('Cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={preRegistroForm.processing}
                                className="bg-[#104a29] hover:bg-[#0c371e] text-white flex items-center gap-1.5"
                            >
                                {__('Enviar invitación')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
