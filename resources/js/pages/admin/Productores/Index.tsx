import { Head, useForm, router } from '@inertiajs/react';
import type { ColumnDef } from '@/components/data-table';
import {
    Sprout,
    Plus,
    CheckCircle,
    XCircle,
    MoreVertical,
    Pencil,
    Trash2,
    ToggleRight,
    MapPin,
    Phone,
    User as UserIcon,
    ShieldAlert,
    Building2,
    Activity,
    Globe,
    Navigation,
    Car,
    Users,
    Send,
} from 'lucide-react';
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { toast } from 'sonner';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { DataTable } from '@/components/data-table';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import PhoneInputGroup from '../Empresas/Partials/PhoneInputGroup';
import ProductorEmpleadosModal from './Partials/ProductorEmpleadosModal';
import ProductorVehiculosModal from './Partials/ProductorVehiculosModal';
import MapboxMap, { MapAddressDetails } from '@/components/mapbox-map';

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
}

interface Usuario {
    id: number;
    name: string;
    email: string;
}

interface Productor {
    id: number;
    razon_social: string;
    nombre_comercial: string;
    documento_identidad: string;
    razon_social_rancho?: string | null;
    nombre_comercial_rancho?: string | null;
    pais_telefono_id?: number | null;
    telefono?: string | null;
    direccion?: string | null;
    codigo_postal?: string | null;
    estado?: string | null;
    responsable?: string | null;
    pais_id?: number | null;
    latitud?: number | null;
    longitud?: number | null;
    status: 'activo' | 'suspendido' | 'en_revision';
    empresa_id?: number | null;
    sucursal_id?: number | null;
    user_id?: number | null;
    pais?: Pais | null;
    pais_telefono?: Pais | null;
}

interface ProductoresPageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            empresa_id?: number | null;
            sucursal_id?: number | null;
        };
    };
    productores: {
        data: Productor[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    stats: {
        total: number;
        activos: number;
        suspendidos: number;
        en_revision: number;
    };
    paises: Pais[];
    empresas: Empresa[];
    sucursales: Sucursal[];
    usuarios: Usuario[];
    filters: {
        search?: string;
        status?: string;
        pais_id?: string;
        perPage?: string;
    };
    empresa?: {
        id: number;
        razon_social: string;
    } | null;
    sucursal?: {
        id: number;
        nombre: string;
        latitud?: number | null;
        longitud?: number | null;
        direccion?: string | null;
    } | null;
}

export default function Index({
    productores,
    stats,
    paises,
    empresas,
    sucursales,
    usuarios,
    filters,
    empresa,
    sucursal,
}: ProductoresPageProps) {
    const { __ } = useTranslate();

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingProductor, setEditingProductor] = useState<Productor | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingProductor, setDeletingProductor] = useState<Productor | null>(null);

    // Pre-registro modal state
    const [isPreRegistroModalOpen, setIsPreRegistroModalOpen] = useState(false);

    // Sub-modals for employees & vehicles
    const [selectedProductorForEmployees, setSelectedProductorForEmployees] = useState<Productor | null>(null);
    const [selectedProductorForVehicles, setSelectedProductorForVehicles] = useState<Productor | null>(null);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Active tab state
    const [activeTab, setActiveTab] = useState('general');

    // Filter states
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [paisFilter, setPaisFilter] = useState(filters.pais_id || '');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '10');
    const [isTableLoading, setIsTableLoading] = useState(false);

    // Debounced filter effect
    const isFirstMount = useRef(true);

    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        setIsTableLoading(true);
        const timer = setTimeout(() => {
            const cleanParams = (params: Record<string, any>) => {
                return Object.fromEntries(
                    Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined && v !== 'all')
                );
            };

            router.get(
                window.location.pathname,
                cleanParams({
                    search: searchTerm,
                    status: statusFilter,
                    pais_id: paisFilter,
                    perPage: perPageFilter,
                }),
                {
                    preserveState: true,
                    preserveScroll: true,
                    onFinish: () => setIsTableLoading(false),
                }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, paisFilter, perPageFilter]);

    // Default sucursal coordinates
    const defaultLat = sucursal?.latitud ? Number(sucursal.latitud) : (paises[0]?.latitud ? Number(paises[0].latitud) : 19.9868);
    const defaultLng = sucursal?.longitud ? Number(sucursal.longitud) : (paises[0]?.longitud ? Number(paises[0].longitud) : -102.2839);

    // Main Productor Form
    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        razon_social: '',
        nombre_comercial: '',
        documento_identidad: '',
        razon_social_rancho: '',
        nombre_comercial_rancho: '',
        pais_telefono_id: paises.length > 0 ? String(paises[0].id) : '',
        telefono: '',
        direccion: '',
        codigo_postal: '',
        estado: '',
        responsable: '',
        pais_id: paises.length > 0 ? String(paises[0].id) : '',
        latitud: defaultLat as number | null,
        longitud: defaultLng as number | null,
        status: 'activo' as 'activo' | 'suspendido' | 'en_revision',
        empresa_id: empresa ? String(empresa.id) : '',
        sucursal_id: sucursal ? String(sucursal.id) : '',
        user_id: '',
    });

    // Pre-registro Form
    const preRegistroForm = useForm({
        razon_social_rancho: '',
        nombre_comercial_rancho: '',
        pais_telefono_id: paises.length > 0 ? String(paises[0].id) : '',
        telefono: '',
    });

    // Setup coordinates on country change
    const handlePaisChange = (paisId: string) => {
        setData('pais_id', paisId);
        const selectedPais = paises.find((p) => String(p.id) === paisId);
        if (selectedPais && selectedPais.latitud && selectedPais.longitud) {
            setData((prev) => ({
                ...prev,
                latitud: Number(selectedPais.latitud),
                longitud: Number(selectedPais.longitud),
            }));
        }
    };

    // Open create modal
    const handleOpenCreateModal = () => {
        reset();
        clearErrors();
        setData((prev) => ({
            ...prev,
            latitud: defaultLat,
            longitud: defaultLng,
            direccion: sucursal?.direccion || prev.direccion,
        }));
        setEditingProductor(null);
        setActiveTab('general');
        setIsCreateModalOpen(true);
    };

    // Open edit modal
    const handleOpenEditModal = (productor: Productor) => {
        clearErrors();
        setEditingProductor(productor);
        setData({
            razon_social: productor.razon_social || '',
            nombre_comercial: productor.nombre_comercial || '',
            documento_identidad: productor.documento_identidad || '',
            razon_social_rancho: productor.razon_social_rancho || '',
            nombre_comercial_rancho: productor.nombre_comercial_rancho || '',
            pais_telefono_id: productor.pais_telefono_id ? String(productor.pais_telefono_id) : (paises.length > 0 ? String(paises[0].id) : ''),
            telefono: productor.telefono || '',
            direccion: productor.direccion || '',
            codigo_postal: productor.codigo_postal || '',
            estado: productor.estado || '',
            responsable: productor.responsable || '',
            pais_id: productor.pais_id ? String(productor.pais_id) : (paises.length > 0 ? String(paises[0].id) : ''),
            latitud: productor.latitud ?? null,
            longitud: productor.longitud ?? null,
            status: productor.status || 'activo',
            empresa_id: productor.empresa_id ? String(productor.empresa_id) : (empresa ? String(empresa.id) : ''),
            sucursal_id: productor.sucursal_id ? String(productor.sucursal_id) : (sucursal ? String(sucursal.id) : ''),
            user_id: productor.user_id ? String(productor.user_id) : '',
        });
        setActiveTab('general');
        setIsCreateModalOpen(true);
    };

    // Form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProductor) {
            put(`/admin/productores/${editingProductor.id}`, {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    toast.success(__('Producer updated successfully'));
                },
                onError: () => toast.error(__('Please check the form for errors')),
            });
        } else {
            post('/admin/productores', {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    toast.success(__('Producer created successfully'));
                },
                onError: () => toast.error(__('Please check the form for errors')),
            });
        }
    };

    // Pre-registro submission
    const handlePreRegistroSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        preRegistroForm.post('/admin/productores/pre-registro', {
            onSuccess: () => {
                setIsPreRegistroModalOpen(false);
                preRegistroForm.reset();
                toast.success(__('Producer pre-registration link sent via WhatsApp'));
            },
            onError: () => toast.error(__('Could not send pre-registration invitation')),
        });
    };

    // Delete submission
    const handleDelete = () => {
        if (!deletingProductor) return;
        destroy(`/admin/productores/${deletingProductor.id}`, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setDeletingProductor(null);
                toast.success(__('Producer deleted successfully'));
            },
        });
    };

    // Toggle status
    const handleToggleStatus = (productor: Productor, newStatus?: string) => {
        const nextStatus = newStatus || (productor.status === 'activo' ? 'suspendido' : 'activo');
        router.patch(
            `/admin/productores/${productor.id}/toggle-status`,
            { status: nextStatus },
            {
                onSuccess: () => toast.success(__('Estado actualizado correctamente')),
            }
        );
    };

    // Filter fields configuration
    const filterFields: FilterField[] = [
        {
            name: 'status',
            label: __('Estado'),
            type: 'select',
            options: [
                { label: __('Todos'), value: 'all' },
                { label: __('Activo'), value: 'activo' },
                { label: __('Suspendido'), value: 'suspendido' },
                { label: __('En Revisión'), value: 'en_revision' },
            ],
        },
        {
            name: 'pais_id',
            label: __('Country'),
            type: 'select',
            options: [
                { label: __('All Countries'), value: 'all' },
                ...paises.map((p) => ({ label: p.nombre, value: String(p.id) })),
            ],
        },
    ];

    // Table columns
    const columns: ColumnDef<Productor>[] = [
        {
            accessorKey: 'razon_social',
            header: __('Rancho'),
            cell: (productor: Productor) => (
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-[#104a29]/10 text-[#104a29] dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <Sprout className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                            {productor.razon_social}
                        </div>
                        <div className="text-xs text-slate-500">{productor.nombre_comercial}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'documento_identidad',
            header: __('RFC (Tax ID)'),
            cell: (productor: Productor) => (
                <span className="font-mono text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                    {productor.documento_identidad}
                </span>
            ),
        },
        {
            accessorKey: 'telefono',
            header: __('Phone'),
            cell: (productor: Productor) => (
                <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                        {productor.pais_telefono?.codigo_telefonico} {productor.telefono}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'responsable',
            header: __('Responsible'),
            cell: (productor: Productor) => (
                <div className="text-xs text-slate-600 dark:text-slate-300">
                    {productor.responsable || '-'}
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: __('Estado'),
            stopRowClick: true,
            cell: (productor: Productor) => {
                const rawStatus = (productor.status || '').toLowerCase();
                const isActive = rawStatus === 'activo' || rawStatus === 'active';
                const isReview = rawStatus === 'en_revision' || rawStatus === 'under_review' || rawStatus === 'pending';

                const statusText = isActive
                    ? __('Activo')
                    : isReview
                        ? __('En Revisión')
                        : __('Suspendido');

                return (
                    <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                        <Switch
                            checked={isActive}
                            onCheckedChange={(checked) => {
                                const targetStatus = checked ? 'activo' : 'suspendido';
                                handleToggleStatus(productor, targetStatus);
                            }}
                        />
                        <span
                            className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap',
                                isActive && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50',
                                !isActive && !isReview && 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900/50',
                                isReview && 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
                            )}
                        >
                            <span
                                className={cn(
                                    'h-1.5 w-1.5 rounded-full shrink-0',
                                    isActive && 'bg-emerald-500',
                                    !isActive && !isReview && 'bg-red-500',
                                    isReview && 'bg-amber-500'
                                )}
                            />
                            {statusText}
                        </span>
                    </div>
                );
            },
        },
        {
            header: __('Acciones'),
            stopRowClick: true,
            cell: (productor: Productor) => {
                const rawStatus = (productor.status || '').toLowerCase();
                const isActive = rawStatus === 'activo' || rawStatus === 'active';

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setSelectedProductorForEmployees(productor)}>
                                <Users className="h-4 w-4 mr-2 text-emerald-600" />
                                {__('Colaboradores')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedProductorForVehicles(productor)}>
                                <Car className="h-4 w-4 mr-2 text-indigo-600" />
                                {__('Vehículos')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(productor)}>
                                <ToggleRight className="h-4 w-4 mr-2 text-amber-600" />
                                {isActive ? __('Suspender') : __('Activar')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEditModal(productor)}>
                                <Pencil className="h-4 w-4 mr-2 text-slate-600" />
                                {__('Editar Productor')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    setDeletingProductor(productor);
                                    setIsDeleteModalOpen(true);
                                }}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {__('Eliminar')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <>
            <Head title={__('Producers')} />

            <div className="space-y-6">
                <Breadcrumbs
                    breadcrumbs={[
                        { title: __('Organization'), href: '#' },
                        { title: __('Producers'), href: '/admin/productores' },
                    ]}
                />

                {/* Header */}
                <ModuleHeader
                    icon={<Sprout className="h-6 w-6 text-white" />}
                    title={__('Producers')}
                    description={__('Manage agriculture producers, ranches, collaborators, vehicles and pre-registrations.')}
                    colorClassName="bg-[#071EA3]"
                >
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            onClick={() => {
                                preRegistroForm.reset();
                                setIsPreRegistroModalOpen(true);
                            }}
                            variant="outline"
                            className="bg-white text-[#104a29] hover:bg-white/90 font-semibold flex items-center gap-1.5 shadow-sm"
                        >
                            <Send className="h-4 w-4" />
                            {__('Pre-registro')}
                        </Button>
                        <Button
                            onClick={handleOpenCreateModal}
                            className="bg-white text-[#104a29] hover:bg-white/90 font-semibold flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus className="h-4 w-4" />
                            {__('New Producer')}
                        </Button>
                    </div>
                </ModuleHeader>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title={__('Total Producers')}
                        value={stats.total}
                        icon={<Sprout className="h-6 w-6" />}
                        colorClassName="bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                    />
                    <StatCard
                        title={__('Active Producers')}
                        value={stats.activos}
                        icon={<CheckCircle className="h-6 w-6" />}
                        colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                    />
                    <StatCard
                        title={__('Suspended')}
                        value={stats.suspendidos}
                        icon={<XCircle className="h-6 w-6" />}
                        colorClassName="bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400"
                    />
                    <StatCard
                        title={__('En Revisión')}
                        value={stats.en_revision}
                        icon={<Activity className="h-6 w-6" />}
                        colorClassName="bg-amber-100 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                    />
                </div>

                {/* ── Barra de Filtros ── */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Buscar')}>
                            <Input
                                placeholder={__('Search by rancho, RFC, responsible, phone...')}
                                className="w-full md:w-80"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>

                        <FilterField label={__('Estado')}>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-44">
                                    <SelectValue placeholder={__('Todos')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('Todos')}</SelectItem>
                                    <SelectItem value="activo">{__('Activo')}</SelectItem>
                                    <SelectItem value="suspendido">{__('Suspendido')}</SelectItem>
                                    <SelectItem value="en_revision">{__('En Revisión')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={__('Country')}>
                            <Select value={paisFilter} onValueChange={setPaisFilter}>
                                <SelectTrigger className="w-full md:w-52">
                                    <SelectValue placeholder={__('All')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('All')}</SelectItem>
                                    {paises.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={__('Records per page')}>
                            <Select value={perPageFilter} onValueChange={setPerPageFilter}>
                                <SelectTrigger className="w-full md:w-28">
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

                {/* ── Tabla de Datos ── */}
                <div className="w-full">
                    <DataTable
                        columns={columns}
                        data={productores as any}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        isLoading={isTableLoading}
                    />
                </div>

                {/* Modal: Pre-registro WhatsApp */}
                <Dialog open={isPreRegistroModalOpen} onOpenChange={setIsPreRegistroModalOpen}>
                    <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <DialogHeader>
                            <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                                <Send className="h-5 w-5" />
                            </div>
                            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                                {__('Pre-registro de Productor por WhatsApp')}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                {__('Envíe una invitación por WhatsApp para que el productor complete los datos del rancho, colaboradores y vehículos.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handlePreRegistroSubmit} className="space-y-4 py-2">
                            <div>
                                <Label htmlFor="pre_razon_social_rancho">{__('Razón Social del Rancho')} *</Label>
                                <Input
                                    id="pre_razon_social_rancho"
                                    required
                                    className="mt-1.5 w-full"
                                    placeholder="ej. Agrícola del Valle S.A. de C.V."
                                    value={preRegistroForm.data.razon_social_rancho}
                                    onChange={(e) => preRegistroForm.setData('razon_social_rancho', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="pre_nombre_comercial_rancho">{__('Nombre Comercial del Rancho')} *</Label>
                                <Input
                                    id="pre_nombre_comercial_rancho"
                                    required
                                    className="mt-1.5 w-full"
                                    placeholder="ej. Rancho Don Pedro"
                                    value={preRegistroForm.data.nombre_comercial_rancho}
                                    onChange={(e) => preRegistroForm.setData('nombre_comercial_rancho', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>{__('Teléfono de Contacto (WhatsApp)')} *</Label>
                                <div className="mt-1.5 w-full">
                                    <PhoneInputGroup
                                        paises={paises}
                                        selectedPaisId={preRegistroForm.data.pais_telefono_id}
                                        phoneValue={preRegistroForm.data.telefono}
                                        onPaisChange={(id) => preRegistroForm.setData('pais_telefono_id', id)}
                                        onPhoneChange={(phone) => preRegistroForm.setData('telefono', phone)}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="pt-4 border-t dark:border-slate-800">
                                <Button type="button" variant="outline" onClick={() => setIsPreRegistroModalOpen(false)}>
                                    {__('Cancelar')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={preRegistroForm.processing}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                                >
                                    <Send className="h-4 w-4" />
                                    {preRegistroForm.processing ? __('Enviando...') : __('Enviar Invitación por WhatsApp')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Modal: Create/Edit Productor */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-[900px] lg:max-w-[1100px] xl:max-w-[1200px] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8">
                    <DialogHeader className="border-b pb-4 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-[#104a29]/10 text-[#104a29] dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center font-bold">
                                <Sprout className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                                    {editingProductor ? __('Editar Productor') : __('Nuevo Productor')}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500">
                                    {__('Complete la información general del rancho, datos de contacto y dirección geolocalizada.')}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 py-2">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid grid-cols-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <TabsTrigger value="general" className="py-2.5 font-medium text-sm gap-2">
                                    <Building2 className="h-4 w-4" />
                                    {__('Datos del Rancho')}
                                </TabsTrigger>
                                <TabsTrigger value="location" className="py-2.5 font-medium text-sm gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {__('Ubicación y Dirección')}
                                </TabsTrigger>
                            </TabsList>

                            {/* Tab 1: Datos del Rancho */}
                            <TabsContent value="general" className="space-y-6">
                                <div className="bg-slate-50/70 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-[#104a29]" />
                                        {__('Datos del Rancho')}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <Label htmlFor="razon_social">{__('Razón Social del Rancho')} *</Label>
                                            <Input
                                                id="razon_social"
                                                required
                                                className="mt-1.5 w-full"
                                                placeholder="ej. Agrícola Los Pinos S.A. de C.V."
                                                value={data.razon_social}
                                                onChange={(e) => {
                                                    setData('razon_social', e.target.value);
                                                    setData('razon_social_rancho', e.target.value);
                                                }}
                                            />
                                            {errors.razon_social && <p className="text-xs text-red-500 mt-1">{errors.razon_social}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="nombre_comercial">{__('Nombre Comercial del Rancho')} *</Label>
                                            <Input
                                                id="nombre_comercial"
                                                required
                                                className="mt-1.5 w-full"
                                                placeholder="ej. Rancho Los Pinos"
                                                value={data.nombre_comercial}
                                                onChange={(e) => {
                                                    setData('nombre_comercial', e.target.value);
                                                    setData('nombre_comercial_rancho', e.target.value);
                                                }}
                                            />
                                            {errors.nombre_comercial && <p className="text-xs text-red-500 mt-1">{errors.nombre_comercial}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="documento_identidad">{__('RFC (Registro Federal de Contribuyentes)')} *</Label>
                                            <Input
                                                id="documento_identidad"
                                                required
                                                className="mt-1.5 w-full"
                                                placeholder="ej. ABC123456789"
                                                value={data.documento_identidad}
                                                onChange={(e) => setData('documento_identidad', e.target.value)}
                                            />
                                            {errors.documento_identidad && <p className="text-xs text-red-500 mt-1">{errors.documento_identidad}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="responsable">{__('Persona Responsable / Contacto')}</Label>
                                            <Input
                                                id="responsable"
                                                className="mt-1.5 w-full"
                                                placeholder="ej. Juan Pérez"
                                                value={data.responsable}
                                                onChange={(e) => setData('responsable', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <Label>{__('Teléfono de Contacto')}</Label>
                                            <div className="mt-1.5 w-full">
                                                <PhoneInputGroup
                                                    paises={paises}
                                                    selectedPaisId={data.pais_telefono_id ? String(data.pais_telefono_id) : ''}
                                                    phoneValue={data.telefono || ''}
                                                    onPaisChange={(id) => setData('pais_telefono_id', id)}
                                                    onPhoneChange={(phone) => setData('telefono', phone)}
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="status">{__('Estado del Productor')}</Label>
                                            <Select value={data.status} onValueChange={(val: any) => setData('status', val)}>
                                                <SelectTrigger id="status" className="mt-1.5 w-full">
                                                    <SelectValue placeholder={__('Seleccionar estado')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="activo">{__('Activo')}</SelectItem>
                                                    <SelectItem value="suspendido">{__('Suspendido')}</SelectItem>
                                                    <SelectItem value="en_revision">{__('En Revisión')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Tab 2: Location & Geocoding */}
                            <TabsContent value="location" className="space-y-6">
                                <div className="bg-slate-50/70 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-[#104a29]" />
                                            {__('Ubicación y Dirección del Rancho')}
                                        </h4>
                                        {sucursal?.nombre && (
                                            <span className="text-xs font-semibold text-[#104a29] bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50">
                                                Sucursal de Origen: {sucursal.nombre}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <Label htmlFor="pais_id">{__('País')} *</Label>
                                            <Select value={data.pais_id} onValueChange={handlePaisChange}>
                                                <SelectTrigger id="pais_id" className="mt-1.5 w-full">
                                                    <SelectValue placeholder={__('Seleccionar país')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {paises.map((p) => (
                                                        <SelectItem key={p.id} value={String(p.id)}>
                                                            {p.nombre}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="estado">{__('Estado')}</Label>
                                            <Input
                                                id="estado"
                                                className="mt-1.5 w-full"
                                                placeholder="ej. Michoacán, Jalisco"
                                                value={data.estado}
                                                onChange={(e) => setData('estado', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="codigo_postal">{__('Código Postal')}</Label>
                                            <Input
                                                id="codigo_postal"
                                                className="mt-1.5 w-full"
                                                placeholder="ej. 59600"
                                                value={data.codigo_postal}
                                                onChange={(e) => setData('codigo_postal', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <Label>{__('Referencia de la Sucursal')}</Label>
                                            <div className="mt-1.5 h-10 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/70 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 w-full">
                                                <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                                                <span className="truncate">Centrado cerca de Sucursal {sucursal?.nombre || 'principal'}</span>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <Label htmlFor="direccion">{__('Dirección Completa del Rancho')}</Label>
                                            <Textarea
                                                id="direccion"
                                                rows={2}
                                                className="mt-1.5 w-full"
                                                placeholder="ej. Carretera Zamora-Jacona Km 3, cerca de la sucursal"
                                                value={data.direccion}
                                                onChange={(e) => setData('direccion', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Mapbox Map centered at Sucursal Location as default */}
                                    <div className="space-y-2 pt-3">
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <Navigation className="h-4 w-4 text-[#104a29]" />
                                                {__('Click or drag marker on map to set rancho location (centered at your branch sucursal)')}
                                            </span>
                                            <span className="font-mono text-[11px] bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                Lat: {data.latitud?.toFixed(5) || '0'}, Lng: {data.longitud?.toFixed(5) || '0'}
                                            </span>
                                        </div>

                                        <MapboxMap
                                            lat={data.latitud || defaultLat}
                                            lng={data.longitud || defaultLng}
                                            zoom={12}
                                            onChange={(lat, lng, details?: MapAddressDetails) => {
                                                setData((prev) => ({
                                                    ...prev,
                                                    latitud: lat,
                                                    longitud: lng,
                                                    ...(details?.codigo_postal ? { codigo_postal: details.codigo_postal } : {}),
                                                    ...(details?.estado ? { estado: details.estado } : {}),
                                                    ...(details?.direccion ? { direccion: details.direccion } : {}),
                                                }));
                                            }}
                                            className="h-96 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner"
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <DialogFooter className="pt-4 border-t dark:border-slate-800">
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                {__('Cancelar')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-[#104a29] hover:bg-[#0c371e] text-white font-semibold shadow-sm px-6"
                            >
                                {processing ? __('Guardando...') : (editingProductor ? __('Guardar Cambios') : __('Guardar Productor'))}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Confirm Delete */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-2">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                            {__('Eliminar Productor')}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            {__('¿Está seguro de que desea eliminar a este productor? Esta acción no se puede deshacer y eliminará colaboradores y vehículos asociados.')}
                        </DialogDescription>
                    </DialogHeader>

                    {deletingProductor && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {deletingProductor.razon_social} ({deletingProductor.nombre_comercial})
                        </div>
                    )}

                    <DialogFooter className="pt-4">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            {__('Cancelar')}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={processing}>
                            {processing ? __('Eliminando...') : __('Sí, Eliminar')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Sub-component: Producer Collaborators */}
            <ProductorEmpleadosModal
                isOpen={!!selectedProductorForEmployees}
                onClose={() => setSelectedProductorForEmployees(null)}
                productor={selectedProductorForEmployees}
            />

            {/* Modal Sub-component: Producer Vehicles */}
            <ProductorVehiculosModal
                isOpen={!!selectedProductorForVehicles}
                onClose={() => setSelectedProductorForVehicles(null)}
                productor={selectedProductorForVehicles}
            />
        </>
    );
}
