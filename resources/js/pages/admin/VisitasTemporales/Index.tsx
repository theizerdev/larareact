import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import {
    Users,
    Plus,
    Search,
    Calendar,
    ShieldAlert,
    Camera,
    Upload,
    Trash2,
    Edit2,
    CheckCircle,
    RefreshCw,
    XCircle,
    FileText,
    Briefcase,
    UserCheck,
    Phone,
    Clock,
    User,
    Check,
    Eye,
    MoreVertical,
    Pencil,
    ToggleRight,
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Link,
    Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import PhoneInputGroup from '../Empresas/Partials/PhoneInputGroup';
import { cn, cleanParams } from '@/lib/utils';
import { useTranslate } from '@/hooks/use-translate';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { DataTable } from '@/components/data-table';
import type { ColumnDef } from '@/components/data-table';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface Pais {
    id: number;
    nombre: string;
    codigo_iso2: string;
    codigo_telefonico: string;
}

interface Responsable {
    id: number;
    nombres: string;
    apellidos: string;
    departamento_id?: number | null;
    cargo_id?: number | null;
    departamento?: { id: number; nombre: string } | null;
    cargo?: { id: number; nombre: string } | null;
}

interface Empleado {
    id: number;
    nombres: string;
    apellidos: string;
    departamento_id?: number | null;
    cargo_id?: number | null;
    responsable_id?: number | null;
    departamento?: { id: number; nombre: string } | null;
    cargo?: { id: number; nombre: string } | null;
    responsable?: Responsable | null;
}

interface TipoServicio {
    id: number;
    nombre: string;
}

interface VisitaTemporal {
    id: number;
    nombres: string;
    apellidos: string;
    documento_identidad: string;
    pais_telefono_id?: number | null;
    telefono?: string | null;
    empleado_id?: number | null;
    responsable_id?: number | null;
    tipo_servicio_id?: number | string | null;
    motivo_visita?: string | null;
    fecha_ingreso: string;
    hora_ingreso: string;
    fecha_salida: string;
    hora_salida: string;
    foto_carnet?: string | null;
    foto_documento?: string | null;
    empresa_id: number;
    sucursal_id: number;
    status: number;
    pais_telefono?: Pais | null;
    empleado?: Empleado | null;
    responsable?: Responsable | null;
    tipo_servicio?: TipoServicio | null;
}

interface Paginated<T> {
    data: T[];
    links: any[];
    meta?: any;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface VisitasPageProps {
    visitas: Paginated<VisitaTemporal>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
    };
    empleados: Empleado[];
    responsables: Responsable[];
    paises: Pais[];
    tipoServicios: TipoServicio[];
    filters: {
        search?: string;
        status?: string;
        perPage?: string;
        fecha_ingreso?: string;
    };
    empresa?: { id: number; razon_social: string } | null;
    sucursal?: { id: number; nombre: string } | null;
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
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/40 flex flex-col items-center gap-3">
            {error && (
                <div className="text-red-500 flex flex-col items-center gap-2 text-center text-sm py-4">
                    <ShieldAlert className="w-8 h-8" />
                    <span>{error}</span>
                </div>
            )}

            {!error && !captured && (
                <div className="relative w-full max-w-[320px] aspect-[4/3] bg-black rounded-xl overflow-hidden border">
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
                            {__('Capture Photo')}
                        </Button>
                    </div>
                </div>
            )}

            {captured && (
                <div className="flex flex-col items-center gap-3 w-full">
                    <div className="w-full max-w-[320px] aspect-[4/3] rounded-xl overflow-hidden border">
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
                            className="flex items-center gap-1 bg-[#104a29] hover:bg-[#0c371e] text-white"
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

// ─── Main View Component ──────────────────────────────────────────────────
export default function Index({
    visitas = { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0, links: [] },
    stats = { total: 0, activos: 0, inactivos: 0 },
    empleados = [],
    responsables = [],
    paises = [],
    tipoServicios = [],
    filters = {},
    empresa = null,
    sucursal = null,
}: VisitasPageProps) {
    const { __ } = useTranslate();
    const { url } = usePage();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/dashboard' },
        { title: __('Temporary Visits'), href: '/admin/visitas-temporales' },
    ];

    // Form Hook
    const { data, setData, post, put, delete: destroyRoute, processing, errors, reset, clearErrors } = useForm({
        nombres: '',
        apellidos: '',
        documento_identidad: '',
        pais_telefono_id: paises[0]?.id || '',
        telefono: '',
        empleado_id: '',
        responsable_id: '',
        tipo_servicio_id: '',
        motivo_visita: '',
        fecha_ingreso: new Date().toISOString().split('T')[0],
        hora_ingreso: new Date().toTimeString().split(' ')[0].substring(0, 5),
        fecha_salida: new Date().toISOString().split('T')[0],
        hora_salida: new Date().toTimeString().split(' ')[0].substring(0, 5),
        foto_carnet: '' as string | null,
        foto_documento: '' as string | null,
        status: 'activo',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('general');
    const [editingVisit, setEditingVisit] = useState<VisitaTemporal | null>(null);
    const [deletingVisit, setDeletingVisit] = useState<VisitaTemporal | null>(null);
    const [activeCameraField, setActiveCameraField] = useState<'foto_carnet' | 'foto_documento' | null>(null);

    // Tipo de Servicio list and creation state
    const [localTipoServicios, setLocalTipoServicios] = useState<TipoServicio[]>(tipoServicios);
    const [newServiceType, setNewServiceType] = useState('');
    const [isCreatingServiceType, setIsCreatingServiceType] = useState(false);

    useEffect(() => {
        setLocalTipoServicios(tipoServicios);
    }, [tipoServicios]);

    const handleCreateServiceType = async () => {
        if (!newServiceType.trim()) return;

        try {
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
                return '';
            };
            const csrfToken = getCookie('XSRF-TOKEN');

            const response = await fetch('/admin/tipo-servicios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ nombre: newServiceType }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const resData = await response.json();
            if (resData && resData.success) {
                const createdType = resData.tipo_servicio;
                
                // Add to local state if not exists
                if (!localTipoServicios.some(t => t.id === createdType.id)) {
                    setLocalTipoServicios(prev => [...prev, createdType].sort((a, b) => a.nombre.localeCompare(b.nombre)));
                }

                // Select the new type
                setData('tipo_servicio_id', String(createdType.id));
                setIsCreatingServiceType(false);
                setNewServiceType('');
                notifySuccess(__('Service type added successfully.'));
            }
        } catch (error) {
            console.error(error);
            notifyError(__('Failed to create service type.'));
        }
    };

    // Search Autocomplete state
    const [responsibleSearch, setResponsibleSearch] = useState('');
    const [showResponsibleSuggestions, setShowResponsibleSuggestions] = useState(false);
    const suggestRef = useRef<HTMLDivElement>(null);

    // Filters state
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'none');
    const [dateFilter, setDateFilter] = useState(filters.fecha_ingreso || '');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '10');
    const [isTableLoading, setIsTableLoading] = useState(false);

    // Handle clicks outside of suggestion dropdown to close it
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (suggestRef.current && !suggestRef.current.contains(event.target as Node)) {
                setShowResponsibleSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedEmp = empleados.find(e => e.id === Number(data.empleado_id));
    const selectedResp = selectedEmp ? selectedEmp.responsable : responsables.find(r => r.id === Number(data.responsable_id));

    // navigation loading spinner bindings
    useEffect(() => {
        const unbindStart = router.on('start', () => setIsTableLoading(true));
        const unbindFinish = router.on('finish', () => setIsTableLoading(false));

        return () => {
            unbindStart();
            unbindFinish();
        };
    }, []);

    // Filter effect
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                window.location.pathname,
                cleanParams({
                    search: searchTerm,
                    status: statusFilter,
                    fecha_ingreso: dateFilter,
                    perPage: perPageFilter,
                }),
                { preserveState: true, preserveScroll: true }
            );
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, dateFilter, perPageFilter]);

    const handleCreateClick = () => {
        reset();
        clearErrors();
        setEditingVisit(null);
        setResponsibleSearch('');
        setNewServiceType('');
        setIsCreatingServiceType(false);
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleEditClick = (visit: VisitaTemporal) => {
        clearErrors();
        setEditingVisit(visit);
        setNewServiceType('');
        setIsCreatingServiceType(false);
        setData({
            nombres: visit.nombres,
            apellidos: visit.apellidos,
            documento_identidad: visit.documento_identidad,
            pais_telefono_id: visit.pais_telefono_id || paises[0]?.id || '',
            telefono: visit.telefono || '',
            empleado_id: String(visit.empleado_id || ''),
            responsable_id: String(visit.responsable_id || ''),
            tipo_servicio_id: String(visit.tipo_servicio_id || ''),
            motivo_visita: visit.motivo_visita || '',
            fecha_ingreso: String(visit.fecha_ingreso),
            hora_ingreso: visit.hora_ingreso.substring(0, 5),
            fecha_salida: String(visit.fecha_salida),
            hora_salida: visit.hora_salida.substring(0, 5),
            foto_carnet: visit.foto_carnet || '',
            foto_documento: visit.foto_documento || '',
            status: visit.status || 'activo',
        });

        if (visit.empleado) {
            setResponsibleSearch(`${visit.empleado.nombres} ${visit.empleado.apellidos}`);
        } else {
            setResponsibleSearch('');
        }

        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingVisit) {
            put(`/admin/visitas-temporales/${editingVisit.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    notifySuccess(__('Temporary visit updated successfully.'));
                },
                onError: () => {
                    notifyError(__('Please verify the form fields.'));
                }
            });
        } else {
            post('/admin/visitas-temporales', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    notifySuccess(__('Temporary visit registered successfully.'));
                },
                onError: () => {
                    notifyError(__('Please verify the form fields.'));
                }
            });
        }
    };

    const handleToggleStatus = (visit: VisitaTemporal, event?: React.MouseEvent | any) => {
        if (event && typeof event.stopPropagation === 'function') {
            event.stopPropagation();
        }
        router.patch(`/admin/visitas-temporales/${visit.id}/toggle-status`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                notifySuccess(__('Status updated successfully.'));
            }
        });
    };

    const handleDeleteConfirm = () => {
        if (deletingVisit) {
            destroyRoute(`/admin/visitas-temporales/${deletingVisit.id}`, {
                onSuccess: () => {
                    setDeletingVisit(null);
                    notifySuccess(__('Temporary visit log deleted.'));
                }
            });
        }
    };

    // File Input refs
    const fotoCarnetRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertFormat = (type: 'bold' | 'italic' | 'underline' | 'list' | 'list-ordered' | 'link' | 'image') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = data.motivo_visita || '';
        const selectedText = text.substring(start, end);

        let replacement = '';
        switch (type) {
            case 'bold':
                replacement = `**${selectedText || 'bold'}**`;
                break;
            case 'italic':
                replacement = `*${selectedText || 'italic'}*`;
                break;
            case 'underline':
                replacement = `<u>${selectedText || 'underline'}</u>`;
                break;
            case 'list':
                replacement = `\n- ${selectedText || 'item'}`;
                break;
            case 'list-ordered':
                replacement = `\n1. ${selectedText || 'item'}`;
                break;
            case 'link':
                replacement = `[${selectedText || 'link text'}](https://)`;
                break;
            case 'image':
                replacement = `![${selectedText || 'alt text'}](https://)`;
                break;
            default:
                return;
        }

        const newText = text.substring(0, start) + replacement + text.substring(end);
        setData('motivo_visita', newText);

        // Focus and select the inserted text after state updates
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + replacement.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'foto_carnet') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 3 * 1024 * 1024) {
            alert(__('The image must not exceed 3MB.'));
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            setData(fieldName, reader.result as string);
        };
    };

    // Table columns
    const columns: ColumnDef<VisitaTemporal>[] = [
        {
            id: 'foto_carnet',
            header: __('Photo'),
            cell: (visit) => (
                <div className="w-10 h-10 rounded-full border overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                    {visit.foto_carnet ? (
                        <img src={visit.foto_carnet} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-5 h-5 text-slate-400" />
                    )}
                </div>
            )
        },
        {
            id: 'visitante',
            header: __('Visitor'),
            cell: (visit) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{visit.nombres} {visit.apellidos}</span>
                    <span className="text-xs text-muted-foreground font-mono">{visit.documento_identidad}</span>
                </div>
            )
        },
        {
            id: 'telefono',
            header: __('Phone'),
            cell: (visit) => (
                <span className="text-xs text-slate-600 dark:text-slate-300">
                    {visit.pais_telefono ? `+${visit.pais_telefono.codigo_telefonico} ` : ''}{visit.telefono || '-'}
                </span>
            )
        },
        {
            id: 'empleado',
            header: __('Employee to Visit'),
            cell: (visit) => (
                visit.empleado ? (
                    <div className="flex flex-col text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{visit.empleado.nombres} {visit.empleado.apellidos}</span>
                        {visit.responsable && (
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                                {__('Authorized by:')} {visit.responsable.nombres} {visit.responsable.apellidos}
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-xs text-slate-400">-</span>
                )
            )
        },
        {
            id: 'tipo_servicio',
            header: __('Service Type'),
            cell: (visit) => (
                <div className="flex flex-col text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {visit.tipo_servicio?.nombre || '-'}
                    </span>
                    {visit.motivo_visita && (
                        <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[150px]" title={visit.motivo_visita}>
                            {visit.motivo_visita}
                        </span>
                    )}
                </div>
            )
        },
        {
            id: 'fecha_ingreso',
            header: __('Access Details'),
            cell: (visit) => (
                <div className="flex flex-col text-xs">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <Calendar className="w-3.5 h-3.5" /> {visit.fecha_ingreso} {visit.hora_ingreso.substring(0, 5)}
                    </span>
                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                        <Clock className="w-3.5 h-3.5" /> {visit.fecha_salida} {visit.hora_salida.substring(0, 5)}
                    </span>
                </div>
            )
        },
        {
            id: 'status',
            header: __('Status'),
            stopRowClick: true,
            cell: (visit) => {
                let badgeClass = '';
                let label = '';

                if (visit.status === 'activo') {
                    badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900';
                    label = __('Active');
                } else if (visit.status === 'suspendido') {
                    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900';
                    label = __('Suspended');
                } else {
                    badgeClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900';
                    label = __('Under Review');
                }

                return (
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={visit.status === 'activo'}
                            onCheckedChange={() => handleToggleStatus(visit)}
                        />
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', badgeClass)}>
                            {label}
                        </span>
                    </div>
                );
            }
        },
        {
            id: 'actions',
            header: __('Actions'),
            className: 'text-right',
            stopRowClick: true,
            cell: (visit) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(visit)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.patch(`/admin/visitas-temporales/${visit.id}/toggle-status`, { status: 'activo' }, { preserveScroll: true, onSuccess: () => notifySuccess(__('Status updated successfully.')) })}>
                            <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                            {__('Set Active')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.patch(`/admin/visitas-temporales/${visit.id}/toggle-status`, { status: 'suspendido' }, { preserveScroll: true, onSuccess: () => notifySuccess(__('Status updated successfully.')) })}>
                            <XCircle className="mr-2 h-4 w-4 text-rose-500" />
                            {__('Set Suspended')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.patch(`/admin/visitas-temporales/${visit.id}/toggle-status`, { status: 'en_revision' }, { preserveScroll: true, onSuccess: () => notifySuccess(__('Status updated successfully.')) })}>
                            <RefreshCw className="mr-2 h-4 w-4 text-amber-500" />
                            {__('Set Under Review')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setDeletingVisit(visit)}
                            className="text-red-650 focus:text-red-650 dark:text-red-400"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {__('Delete')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    const filteredResponsibles = (empleados || []).filter(e => {
        const fullName = `${e.nombres || ''} ${e.apellidos || ''}`.toLowerCase();
        return fullName.includes((responsibleSearch || '').toLowerCase());
    });


    return (
        <>
            <Head title={__('Temporary Visits')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Users className="h-6 w-6 text-white" />}
                    title={__('Temporary Visits')}
                    description={__('Manage, register and audit temporary visitor entries and check-outs.')}
                    colorClassName="bg-[#2729c4]"
                >
                    <Button onClick={handleCreateClick} className="bg-[#104a29] hover:bg-[#0c371e] text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        {__('New Visit')}
                    </Button>
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <StatCard
                        icon={<Users className="h-6 w-6" />}
                        title={__('TOTAL VISITS')}
                        value={stats.total}
                        colorClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
                    />
                    <StatCard
                        icon={<UserCheck className="h-6 w-6 animate-pulse" />}
                        title={__('ACTIVE')}
                        value={stats.activos || 0}
                        colorClassName="bg-green-100 text-green-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                    />
                    <StatCard
                        icon={<XCircle className="h-6 w-6" />}
                        title={__('SUSPENDED')}
                        value={stats.suspendidos || 0}
                        colorClassName="bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400"
                    />
                    <StatCard
                        icon={<RefreshCw className="h-6 w-6" />}
                        title={__('UNDER REVIEW')}
                        value={stats.revision || 0}
                        colorClassName="bg-amber-100 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                    />
                </div>

                {/* Filter Bar */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Search Visitor')}>
                            <Input
                                placeholder={__('Search by name, ID...')}
                                className="w-full md:w-80 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>

                        <FilterField label={__('Status')}>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-40 bg-white">
                                    <SelectValue placeholder={__('All')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{__('All')}</SelectItem>
                                    <SelectItem value="activo">{__('Active')}</SelectItem>
                                    <SelectItem value="suspendido">{__('Suspended')}</SelectItem>
                                    <SelectItem value="en_revision">{__('Under Review')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={__('Check-In Date')}>
                            <Input
                                type="date"
                                className="w-full md:w-48 bg-white"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </FilterField>

                        <FilterField label={__('Records per page')}>
                            <Select value={perPageFilter} onValueChange={setPerPageFilter}>
                                <SelectTrigger className="w-full md:w-32 bg-white">
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

                {/* DataTable */}
                <div className="w-full">
                    <DataTable
                        data={visitas}
                        columns={columns}
                        isLoading={isTableLoading}
                        onRowClick={(v) => handleEditClick(v)}
                        emptyState={{
                            title: __('No temporary visits found'),
                            description: searchTerm || statusFilter !== 'none' || dateFilter
                                ? __('Try clearing your search filters or changing your query.')
                                : __('You have not registered any visits yet.'),
                            ctaLabel: __('Register First Visit'),
                            onCtaClick: handleCreateClick,
                        }}
                    />
                </div>
            </div>

            {/* ─── Create / Edit Modal Dialog ────────────────────────────────────────── */}
            <Dialog open={isModalOpen} onOpenChange={(open) => {
                setIsModalOpen(open);
                if (!open) {
                    reset();
                    setActiveCameraField(null);
                }
            }}>
                <DialogContent className="sm:max-w-[720px] lg:max-w-[850px] w-full max-h-[90vh] overflow-y-auto p-8">
                    <DialogHeader>
                        <DialogTitle>{editingVisit ? __('Edit Temporary Visit') : __('Register Temporary Visit')}</DialogTitle>
                        <DialogDescription>
                            {__('Please enter visitor details, the authorizing manager and specify access date and time range.')}
                        </DialogDescription>
                    </DialogHeader>

                    {activeCameraField ? (
                        <CameraWidget
                            onCapture={(base64) => {
                                setData(activeCameraField, base64);
                                setActiveCameraField(null);
                            }}
                            onCancel={() => setActiveCameraField(null)}
                        />
                    ) : (
                        <form onSubmit={handleFormSubmit} className="space-y-6">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
                                <TabsList className="grid w-full grid-cols-2 mb-6">
                                    <TabsTrigger value="general" className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        {__('General Information')}
                                    </TabsTrigger>
                                    <TabsTrigger value="acceso" className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        {__('Access & Photos')}
                                    </TabsTrigger>
                                </TabsList>

                                {/* ── Pestaña 1: Información General ── */}
                                <TabsContent value="general" className="space-y-6 mt-4">

                            {/* Visitor Profile Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                                    <User className="w-4 h-4 text-[#104a29]" />
                                    {__('Visitor Information')}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="nombres">{__('First Name')} *</Label>
                                        <Input
                                            id="nombres"
                                            value={data.nombres}
                                            onChange={(e) => setData('nombres', e.target.value)}
                                            className={cn(errors.nombres && 'border-rose-500')}

                                        />
                                        {errors.nombres && <p className="text-xs text-rose-500">{errors.nombres}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="apellidos">{__('Last Name')} *</Label>
                                        <Input
                                            id="apellidos"
                                            value={data.apellidos}
                                            onChange={(e) => setData('apellidos', e.target.value)}
                                            className={cn(errors.apellidos && 'border-rose-500')}

                                        />
                                        {errors.apellidos && <p className="text-xs text-rose-500">{errors.apellidos}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="documento_identidad">{__('National ID / Passport *')}</Label>
                                        <Input
                                            id="documento_identidad"
                                            value={data.documento_identidad}
                                            onChange={(e) => setData('documento_identidad', e.target.value)}
                                            className={cn(errors.documento_identidad && 'border-rose-500')}

                                        />
                                        {errors.documento_identidad && <p className="text-xs text-rose-500">{errors.documento_identidad}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="telefono">{__('Phone Number')}</Label>
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
                            </div>

                            {/* Authorizing Manager Auto-suggest Autocomplete */}
                            <div className="space-y-4 border-t pt-4">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                                    <Briefcase className="w-4 h-4 text-[#104a29]" />
                                    {__('Authorization & Motive')}
                                </h3>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="relative space-y-1.5" ref={suggestRef}>
                                        <Label htmlFor="responsable_search">{__('Search Employee to Visit')} *</Label>
                                        <div className="relative">
                                            <Input
                                                id="responsable_search"
                                                value={responsibleSearch}
                                                onChange={(e) => {
                                                    setResponsibleSearch(e.target.value);
                                                    setShowResponsibleSuggestions(true);
                                                    if (!e.target.value) {
                                                        setData(prev => ({
                                                            ...prev,
                                                            empleado_id: '',
                                                            responsable_id: '',
                                                        }));
                                                    }
                                                }}
                                                onFocus={() => setShowResponsibleSuggestions(true)}
                                                placeholder={__('Type a name to search...')}
                                                className={cn((errors.empleado_id || errors.responsable_id) && 'border-rose-500')}

                                            />
                                            {data.empleado_id && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-500/10 text-emerald-600 rounded-full p-0.5 border border-emerald-500/20">
                                                    <Check className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                        </div>

                                        {showResponsibleSuggestions && (
                                            <div className="absolute z-[60] w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mt-1 shadow-2xl max-h-60 overflow-y-auto">
                                                {filteredResponsibles.length === 0 ? (
                                                    <div className="p-3 text-xs text-slate-500 text-center">{__('No matches found')}</div>
                                                ) : (
                                                    filteredResponsibles.map((r) => (
                                                        <button
                                                            key={r.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setData(prev => ({
                                                                    ...prev,
                                                                    empleado_id: String(r.id),
                                                                    responsable_id: String(r.responsable_id || ''),
                                                                }));
                                                                setResponsibleSearch(`${r.nombres} ${r.apellidos}`);
                                                                setShowResponsibleSuggestions(false);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex flex-col border-b last:border-0 border-slate-100 dark:border-slate-800/40"
                                                        >
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{r.nombres} {r.apellidos}</span>
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                {r.departamento?.nombre || __('No Department')} • {r.cargo?.nombre || __('No Position')}
                                                            </span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                        {errors.empleado_id && <p className="text-xs text-rose-500">{errors.empleado_id}</p>}
                                        {errors.responsable_id && <p className="text-xs text-rose-500">{errors.responsable_id}</p>}
                                    </div>

                                    {/* Selected Employee & Responsible Card */}
                                    {selectedEmp && (
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-3">
                                            <div>
                                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block mb-1">{__('Selected Employee Details')}</span>
                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                    <div>
                                                        <span className="text-slate-400 block">{__('Employee')}</span>
                                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmp.nombres} {selectedEmp.apellidos}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block">{__('Department')}</span>
                                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmp.departamento?.nombre || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block">{__('Position')}</span>
                                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmp.cargo?.nombre || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedResp ? (
                                                <div className="border-t pt-2 border-slate-200/60 dark:border-slate-800/60">
                                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-1">{__('Authorizing Manager Details')}</span>
                                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                                        <div>
                                                            <span className="text-slate-400 block">{__('Manager')}</span>
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedResp.nombres} {selectedResp.apellidos}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 block">{__('Department')}</span>
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedResp.departamento?.nombre || '-'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 block">{__('Position')}</span>
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedResp.cargo?.nombre || '-'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-rose-500 font-medium border-t pt-2 border-slate-200/60 dark:border-slate-800/60">
                                                    {__('Warning: Selected employee does not have an assigned manager. An authorizing responsible is required.')}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1.5 w-full">
                                            <Label htmlFor="tipo_servicio_id">{__('Type of Service')} *</Label>
                                            {isCreatingServiceType ? (
                                                <div className="flex gap-2 items-center animate-fadeIn">
                                                    <Input
                                                        value={newServiceType}
                                                        onChange={(e) => setNewServiceType(e.target.value)}
                                                        placeholder={__('Enter new service type...')}
                                                        className="flex-1 bg-white dark:bg-slate-950"
                                                        autoFocus
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={handleCreateServiceType}
                                                        className="bg-[#104a29] hover:bg-[#0c371e] text-white shrink-0"
                                                    >
                                                        {__('Save')}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setIsCreatingServiceType(false);
                                                            setNewServiceType('');
                                                        }}
                                                        className="shrink-0"
                                                    >
                                                        {__('Cancel')}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <Select
                                                            value={String(data.tipo_servicio_id || '')}
                                                            onValueChange={(val) => setData('tipo_servicio_id', val)}
                                                        >
                                                            <SelectTrigger id="tipo_servicio_id" className="w-full bg-white dark:bg-slate-950">
                                                                <SelectValue placeholder={__('Select a service type...')} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {localTipoServicios.map((t) => (
                                                                    <SelectItem key={t.id} value={String(t.id)}>
                                                                        {t.nombre}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setIsCreatingServiceType(true)}
                                                        className="shrink-0"
                                                        title={__('Add New Service Type')}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                            {errors.tipo_servicio_id && <p className="text-xs text-rose-500">{errors.tipo_servicio_id}</p>}
                                        </div>

                                        <div className="space-y-1.5 w-full">
                                            <Label htmlFor="motivo_visita">
                                                {localTipoServicios.find(t => String(t.id) === String(data.tipo_servicio_id))?.nombre.toLowerCase() === 'otros'
                                                    ? __('Specify Reason for Visit') + ' *'
                                                    : __('Additional Details')}
                                            </Label>
                                            <div className={cn(
                                                "rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:outline-none transition-all",
                                                errors.motivo_visita && 'border-rose-500 focus-within:ring-rose-500'
                                            )}>
                                                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                                                    <button
                                                        type="button"
                                                        onClick={() => insertFormat('bold')}
                                                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 transition-colors"
                                                        title={__('Bold')}
                                                    >
                                                        <Bold className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => insertFormat('italic')}
                                                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 transition-colors"
                                                        title={__('Italic')}
                                                    >
                                                        <Italic className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => insertFormat('underline')}
                                                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 transition-colors"
                                                        title={__('Underline')}
                                                    >
                                                        <Underline className="w-4 h-4" />
                                                    </button>
                                                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
                                                    <button
                                                        type="button"
                                                        onClick={() => insertFormat('list-ordered')}
                                                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 transition-colors"
                                                        title={__('Numbered List')}
                                                    >
                                                        <ListOrdered className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => insertFormat('list')}
                                                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 transition-colors"
                                                        title={__('Bulleted List')}
                                                    >
                                                        <List className="w-4 h-4" />
                                                    </button>
                                                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
                                                    <button
                                                        type="button"
                                                        onClick={() => insertFormat('link')}
                                                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 transition-colors"
                                                        title={__('Link')}
                                                    >
                                                        <Link className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => insertFormat('image')}
                                                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 transition-colors"
                                                        title={__('Image')}
                                                    >
                                                        <Image className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <textarea
                                                    id="motivo_visita"
                                                    ref={textareaRef}
                                                    value={data.motivo_visita}
                                                    onChange={(e) => setData('motivo_visita', e.target.value)}
                                                    className="w-full min-h-[120px] p-3 bg-transparent resize-y border-0 focus:ring-0 focus:outline-none dark:text-slate-100 placeholder-slate-400 text-sm"
                                                    placeholder={__('e.g., Maintenance, Interview, Meeting...')}
                                                    required={localTipoServicios.find(t => String(t.id) === String(data.tipo_servicio_id))?.nombre.toLowerCase() === 'otros'}
                                                />
                                            </div>
                                            {errors.motivo_visita && <p className="text-xs text-rose-500">{errors.motivo_visita}</p>}
                                        </div>

                                        <div className="space-y-1.5 w-full">
                                            <Label htmlFor="status">{__('Status')} *</Label>
                                            <Select
                                                value={data.status}
                                                onValueChange={(val) => setData('status', val)}
                                            >
                                                <SelectTrigger id="status" className="w-full bg-white dark:bg-slate-950">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="activo">{__('Active')}</SelectItem>
                                                    <SelectItem value="suspendido">{__('Suspended')}</SelectItem>
                                                    <SelectItem value="en_revision">{__('Under Review')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.status && <p className="text-xs text-rose-500">{errors.status}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                            {/* ── Pestaña 2: Acceso y Fotos ── */}
                            <TabsContent value="acceso" className="space-y-6 mt-4">
                                {/* Access Schedule Times */}
                                <div className="space-y-4 pt-4">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                                        <Clock className="w-4 h-4 text-[#104a29]" />
                                        {__('Time & Access Period')}
                                    </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="fecha_ingreso">{__('Check-In Date')} *</Label>
                                        <Input
                                            id="fecha_ingreso"
                                            type="date"
                                            value={data.fecha_ingreso}
                                            onChange={(e) => setData('fecha_ingreso', e.target.value)}
                                            className={cn(errors.fecha_ingreso && 'border-rose-500')}

                                        />
                                        {errors.fecha_ingreso && <p className="text-xs text-rose-500">{errors.fecha_ingreso}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="hora_ingreso">{__('Check-In Time')} *</Label>
                                        <Input
                                            id="hora_ingreso"
                                            type="time"
                                            value={data.hora_ingreso}
                                            onChange={(e) => setData('hora_ingreso', e.target.value)}
                                            className={cn(errors.hora_ingreso && 'border-rose-500')}

                                        />
                                        {errors.hora_ingreso && <p className="text-xs text-rose-500">{errors.hora_ingreso}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="fecha_salida">{__('Check-Out Date')} *</Label>
                                        <Input
                                            id="fecha_salida"
                                            type="date"
                                            value={data.fecha_salida}
                                            onChange={(e) => setData('fecha_salida', e.target.value)}
                                            className={cn(errors.fecha_salida && 'border-rose-500')}

                                        />
                                        {errors.fecha_salida && <p className="text-xs text-rose-500">{errors.fecha_salida}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="hora_salida">{__('Check-Out Time')} *</Label>
                                        <Input
                                            id="hora_salida"
                                            type="time"
                                            value={data.hora_salida}
                                            onChange={(e) => setData('hora_salida', e.target.value)}
                                            className={cn(errors.hora_salida && 'border-rose-500')}

                                        />
                                        {errors.hora_salida && <p className="text-xs text-rose-500">{errors.hora_salida}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Photographs */}
                            <div className="space-y-4 border-t pt-4">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                                    <Camera className="w-4 h-4 text-[#104a29]" />
                                    {__('Photographs')}
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Visitor Profile Photo */}
                                    <div className="flex flex-col gap-2">
                                        <Label className="font-semibold">{__('Visitor Photo')} *</Label>
                                        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 min-h-[150px] bg-slate-50/50 dark:bg-slate-900/10">
                                            {data.foto_carnet ? (
                                                <div className="relative w-28 h-28 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg group">
                                                    <img src={data.foto_carnet} className="w-full h-full object-cover" />
                                                    <Button
                                                        type="button"
                                                        size="xs"
                                                        variant="destructive"
                                                        className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                                        onClick={() => setData('foto_carnet', '')}
                                                    >
                                                        {__('Delete')}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <User className="w-10 h-10 text-slate-400" />
                                            )}
                                            <div className="flex gap-2">
                                                <Button type="button" variant="outline" size="xs" onClick={() => fotoCarnetRef.current?.click()}><Upload className="w-3.5 h-3.5 mr-1" />{__('Upload')}</Button>
                                                <Button type="button" variant="outline" size="xs" onClick={() => setActiveCameraField('foto_carnet')}><Camera className="w-3.5 h-3.5 mr-1" />{__('Camera')}</Button>
                                            </div>
                                            <input type="file" accept="image/*" ref={fotoCarnetRef} className="hidden" onChange={(e) => handleFileChange(e, 'foto_carnet')} />
                                        </div>
                                        {errors.foto_carnet && <span className="text-xs text-rose-500">{errors.foto_carnet}</span>}
                                    </div>

                                    {/* Visitor ID Photo */}
                                    <div className="flex flex-col gap-2">
                                        <Label className="font-semibold">{__('ID Document Photo')} *</Label>
                                        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 min-h-[150px] bg-slate-50/50 dark:bg-slate-900/10">
                                            {data.foto_documento ? (
                                                <div className="relative w-40 aspect-[3/2] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md group">
                                                    <img src={data.foto_documento} className="w-full h-full object-cover" />
                                                    <Button
                                                        type="button"
                                                        size="xs"
                                                        variant="destructive"
                                                        className="absolute inset-0 bg-red-650/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                                        onClick={() => setData('foto_documento', '')}
                                                    >
                                                        {__('Delete')}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <FileText className="w-10 h-10 text-slate-400" />
                                            )}
                                            <Button type="button" variant="outline" size="xs" onClick={() => setActiveCameraField('foto_documento')}><Camera className="w-3.5 h-3.5 mr-1" />{__('Camera')}</Button>
                                        </div>
                                        {errors.foto_documento && <span className="text-xs text-rose-500">{errors.foto_documento}</span>}
                                    </div>
                                </div>
                            </div>

                            </TabsContent>
                            </Tabs>

                            <DialogFooter className="mt-6 gap-2 border-t pt-4">
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
                                    className="bg-[#104a29] hover:bg-[#0c371e] text-white flex items-center gap-1.5"
                                >
                                    {processing ? __('Saving...') : __('Save Changes')}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* ─── Delete Confirmation dialog ─────────────────────────────────────────── */}
            <AlertDialog open={!!deletingVisit} onOpenChange={(open) => !open && setDeletingVisit(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{__('Are you sure?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {__('This action cannot be undone. This will permanently delete the temporary visit log and its attached photographs.')}
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
        </>
    );
}
