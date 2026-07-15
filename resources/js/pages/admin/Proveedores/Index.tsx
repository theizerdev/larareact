import { Head, useForm, router } from '@inertiajs/react';
import type { ColumnDef } from '@/components/data-table';
import {
    Truck,
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
    FileText,
} from 'lucide-react';
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { toast } from 'sonner';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { DataTable } from '@/components/data-table';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AdminSaasLayout from '@/layouts/admin/admin-saas-layout';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';

// Cargar perezosamente el componente del mapa
const ProveedorMapComponent = lazy(() => {
    return import('../Empresas/Partials/MapComponent').then((mod) => ({ default: mod.default }));
});

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

interface Proveedor {
    id: number;
    razon_social: string;
    nombre_comercial: string;
    documento_identidad: string;
    pais_telefono_id?: number | null;
    telefono?: string | null;
    direccion?: string | null;
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

interface ProveedoresPageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            empresa_id?: number | null;
            sucursal_id?: number | null;
            pais_telefono_id?: number | null;
        };
    };
    proveedores: {
        data: Proveedor[];
        links: any[];
        meta: any;
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
    empresa?: { id: number; razon_social: string } | null;
    sucursal?: { id: number; nombre: string } | null;
}



const initialForm = {
    razon_social: '',
    nombre_comercial: '',
    documento_identidad: '',
    pais_telefono_id: '',
    telefono: '',
    direccion: '',
    responsable: '',
    pais_id: '',
    latitud: '' as any,
    longitud: '' as any,
    status: 'activo' as 'activo' | 'suspendido' | 'en_revision',
    empresa_id: '',
    sucursal_id: '',
    user_id: '',
};

export default function ProveedoresIndexPage({
    auth,
    proveedores,
    stats,
    paises,
    empresas,
    sucursales,
    usuarios,
    filters,
    empresa: appEmpresa,
    sucursal: appSucursal,
}: ProveedoresPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Suppliers'), href: '/admin/proveedores' },
    ];

    // ── Estados ────────────────────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
    const [deletingProveedor, setDeletingProveedor] = useState<Proveedor | null>(null);
    const [activeTab, setActiveTab] = useState('general');
    const [isTableLoading, setIsTableLoading] = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [paisFilter, setPaisFilter] = useState(filters.pais_id || '');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '10');

    // Configuración del Mapa
    const [mapCenter, setMapCenter] = useState<[number, number]>([19.4326, -99.1332]); // Centro por defecto (Ciudad de México o ajustable)
    const [mapZoom, setMapZoom] = useState(12);

    // Notificaciones de feedback
    const notifySuccess = (message: string) => toast.success(message);
    const notifyError = (message: string) => toast.error(message);

    // ── Formulario Inertia ─────────────────────────────────────────────────────
    const { data, setData, post, put, reset, errors, processing } = useForm({ ...initialForm });

    // Actualizar coordenadas y centro del mapa cuando cambie el país seleccionado
    useEffect(() => {
        if (data.pais_id) {
            const selectedPais = paises.find((p) => p.id === Number(data.pais_id));
            if (selectedPais) {
                // Opcional: Centrar en un punto predeterminado o según el país
            }
        }
    }, [data.pais_id]);

    // ── Filtros en Tiempo Real ─────────────────────────────────────────────────
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
                    Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
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

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleCreateClick = () => {
        setEditingProveedor(null);
        reset();

        // Autocompletar datos del inquilino
        const companyId = auth.user?.empresa_id || appEmpresa?.id || '';
        const branchId = auth.user?.sucursal_id || appSucursal?.id || '';
        const defaultCodeId = auth.user?.pais_telefono_id || paises[0]?.id || '';

        setData({
            ...initialForm,
            empresa_id: String(companyId),
            sucursal_id: String(branchId),
            user_id: String(auth.user?.id || ''),
            pais_telefono_id: String(defaultCodeId),
            pais_id: String(paises[0]?.id || ''),
        });

        // Configuración de mapa inicial
        setMapCenter([19.4326, -99.1332]);
        setMapZoom(12);

        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleEditClick = (prov: Proveedor) => {
        setEditingProveedor(prov);
        reset();

        setData({
            razon_social: prov.razon_social || '',
            nombre_comercial: prov.nombre_comercial || '',
            documento_identidad: prov.documento_identidad || '',
            pais_telefono_id: prov.pais_telefono_id ? String(prov.pais_telefono_id) : '',
            telefono: prov.telefono || '',
            direccion: prov.direccion || '',
            responsable: prov.responsable || '',
            pais_id: prov.pais_id ? String(prov.pais_id) : '',
            latitud: prov.latitud || '',
            longitud: prov.longitud || '',
            status: prov.status || 'activo',
            empresa_id: prov.empresa_id ? String(prov.empresa_id) : '',
            sucursal_id: prov.sucursal_id ? String(prov.sucursal_id) : '',
            user_id: prov.user_id ? String(prov.user_id) : '',
        });

        if (prov.latitud && prov.longitud) {
            setMapCenter([Number(prov.latitud), Number(prov.longitud)]);
            setMapZoom(14);
        } else {
            setMapCenter([19.4326, -99.1332]);
            setMapZoom(12);
        }

        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingProveedor) {
            put(`/admin/proveedores/${editingProveedor.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingProveedor(null);
                    reset();
                    notifySuccess(__('Supplier updated successfully.'));
                },
                onError: () => {
                    notifyError(__('Please review the highlighted fields.'));
                },
            });
        } else {
            post('/admin/proveedores', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Supplier created successfully.'));
                },
                onError: () => {
                    notifyError(__('Please review the highlighted fields.'));
                },
            });
        }
    };

    const handleToggleStatus = (prov: Proveedor, nextStatus: 'activo' | 'suspendido' | 'en_revision') => {
        router.patch(
            `/admin/proveedores/${prov.id}/toggle-status`,
            { status: nextStatus },
            {
                preserveScroll: true,
                onSuccess: () => notifySuccess(__('Status updated successfully.')),
                onError: () => notifyError(__('There was an error updating the status.')),
            }
        );
    };

    const handleDeleteClick = () => {
        if (!deletingProveedor) return;

        router.delete(`/admin/proveedores/${deletingProveedor.id}`, {
            onSuccess: () => {
                setDeletingProveedor(null);
                notifySuccess(__('Supplier deleted successfully.'));
            },
            onError: () => {
                notifyError(__('There was an error deleting the supplier.'));
            },
        });
    };

    const handleLocationSelected = (lat: number, lng: number, address?: string) => {
        setData((prev) => ({
            ...prev,
            latitud: lat,
            longitud: lng,
            ...(address ? { direccion: address } : {}),
        }));
    };

    // ── Columnas de la tabla ──────────────────────────────────────────────────
    const columns: ColumnDef<Proveedor>[] = [
        {
            header: 'Supplier',
            accessorKey: 'razon_social',
            className: 'font-medium',
            cell: (prov) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded bg-[#104a29]/10 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-[#104a29]" />
                    </div>
                    <div>
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{prov.razon_social}</p>
                        <p className="text-xs text-muted-foreground">{prov.nombre_comercial}</p>
                    </div>
                </div>
            ),
        },
        {
            header: 'Identity Document',
            accessorKey: 'documento_identidad',
            cell: (prov) => <span className="text-sm font-mono">{prov.documento_identidad}</span>,
        },
        {
            header: 'Responsable',
            accessorKey: 'responsable',
            cell: (prov) => (
                <div className="flex items-center gap-1 text-sm">
                    <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{prov.responsable || '—'}</span>
                </div>
            ),
        },
        {
            header: 'Phone',
            accessorKey: 'telefono',
            cell: (prov) => {
                if (!prov.telefono) return <span className="text-muted-foreground">—</span>;
                const prefix = prov.pais_telefono?.codigo_telefonico
                    ? `+${prov.pais_telefono.codigo_telefonico} `
                    : '';
                return (
                    <div className="flex items-center gap-1 text-sm font-mono">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{prefix}{prov.telefono}</span>
                    </div>
                );
            },
        },
        {
            header: 'Status',
            cell: (prov) => {
                let badgeStyle = '';
                let label = '';

                switch (prov.status) {
                    case 'activo':
                        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900';
                        label = __('Active');
                        break;
                    case 'suspendido':
                        badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900';
                        label = __('Suspended');
                        break;
                    case 'en_revision':
                        badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900';
                        label = __('Under review');
                        break;
                }

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full border cursor-pointer hover:opacity-85 transition-opacity', badgeStyle)}>
                                {label}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => handleToggleStatus(prov, 'activo')} className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                {__('Active')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(prov, 'suspendido')} className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-rose-500" />
                                {__('Suspended')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(prov, 'en_revision')} className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-amber-500" />
                                {__('Under review')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
        {
            header: 'Actions',
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (prov) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(prov)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setDeletingProveedor(prov)}
                            className="text-rose-600 focus:text-rose-600 dark:text-rose-400"
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
        <AdminSaasLayout>
            <Head title={__('Suppliers')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* ── Encabezado principal ── */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                            {__('Suppliers')}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {__('Manage suppliers, their contact, tax info and physical location.')}
                        </p>
                    </div>

                    <Button
                        onClick={handleCreateClick}
                        className="bg-[#104a29] hover:bg-[#0c371e] text-white flex items-center gap-1.5 self-start md:self-auto"
                    >
                        <Plus className="w-4.5 h-4.5" />
                        {__('New Supplier')}
                    </Button>
                </div>

                {/* ── Tarjetas Estadísticas ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={<Truck className="h-6 w-6" />}
                        title={__('TOTAL SUPPLIERS')}
                        value={stats.total}
                        colorClassName="bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                    />
                    <StatCard
                        icon={<CheckCircle className="h-6 w-6" />}
                        title={__('ACTIVE SUPPLIERS')}
                        value={stats.activos}
                        colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                    />
                    <StatCard
                        icon={<XCircle className="h-6 w-6" />}
                        title={__('SUSPENDED SUPPLIERS')}
                        value={stats.suspendidos}
                        colorClassName="bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400"
                    />
                    <StatCard
                        icon={<Activity className="h-6 w-6" />}
                        title={__('SUPPLIERS UNDER REVIEW')}
                        value={stats.en_revision}
                        colorClassName="bg-amber-100 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                    />
                </div>

                {/* ── Barra de Filtros ── */}
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

                        <FilterField label={__('Status')}>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-44">
                                    <SelectValue placeholder={__('All')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('All')}</SelectItem>
                                    <SelectItem value="activo">{__('Active')}</SelectItem>
                                    <SelectItem value="suspendido">{__('Suspended')}</SelectItem>
                                    <SelectItem value="en_revision">{__('Under review')}</SelectItem>
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
                        data={proveedores.data}
                        columns={columns}
                        isLoading={isTableLoading}
                        pagination={proveedores}
                        onRowClick={(prov) => handleEditClick(prov)}
                        emptyState={{
                            title: __('No suppliers found'),
                            description: searchTerm || statusFilter || paisFilter
                                ? __('Try clearing your search filters or changing your query.')
                                : __('You have not registered any suppliers yet.'),
                            ctaLabel: __('New Supplier'),
                            onCtaClick: handleCreateClick,
                        }}
                    />
                </div>
            </div>

            {/* ══ Ventana Modal de Creación / Edición ════════════════════════════ */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6">
                        <DialogTitle>
                            {editingProveedor ? __('Edit Supplier') : __('New Supplier')}
                        </DialogTitle>
                        <DialogDescription>
                            {__('Complete the information of the supplier and register their location.')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-6 py-2">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
                                <TabsList className="grid w-full grid-cols-2 mb-6">
                                    <TabsTrigger value="general">{__('General')}</TabsTrigger>
                                    <TabsTrigger value="ubicacion">{__('Location')}</TabsTrigger>
                                </TabsList>

                                {/* ── Pestaña 1: Datos Generales ── */}
                                <TabsContent value="general" className="space-y-4 flex-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        
                                        {/* Razón Social */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="razon_social">{__('Business Name')}</Label>
                                            <Input
                                                id="razon_social"
                                                value={data.razon_social}
                                                onChange={(e) => setData('razon_social', e.target.value)}
                                                className={cn(errors.razon_social && 'border-rose-500')}
                                            />
                                            {errors.razon_social && (
                                                <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                                                    <ShieldAlert className="w-3 h-3" />
                                                    {errors.razon_social}
                                                </p>
                                            )}
                                        </div>

                                        {/* Nombre Comercial */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="nombre_comercial">{__('Commercial Name')}</Label>
                                            <Input
                                                id="nombre_comercial"
                                                value={data.nombre_comercial}
                                                onChange={(e) => setData('nombre_comercial', e.target.value)}
                                                className={cn(errors.nombre_comercial && 'border-rose-500')}
                                            />
                                            {errors.nombre_comercial && (
                                                <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                                                    <ShieldAlert className="w-3 h-3" />
                                                    {errors.nombre_comercial}
                                                </p>
                                            )}
                                        </div>

                                        {/* Documento de Identidad */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="documento_identidad">{__('Identity Document')}</Label>
                                            <Input
                                                id="documento_identidad"
                                                value={data.documento_identidad}
                                                onChange={(e) => setData('documento_identidad', e.target.value)}
                                                className={cn(errors.documento_identidad && 'border-rose-500')}
                                            />
                                            {errors.documento_identidad && (
                                                <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                                                    <ShieldAlert className="w-3 h-3" />
                                                    {errors.documento_identidad}
                                                </p>
                                            )}
                                        </div>

                                        {/* Responsable */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="responsable">{__('Responsable')}</Label>
                                            <Input
                                                id="responsable"
                                                value={data.responsable}
                                                onChange={(e) => setData('responsable', e.target.value)}
                                                className={cn(errors.responsable && 'border-rose-500')}
                                            />
                                            {errors.responsable && (
                                                <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                                                    <ShieldAlert className="w-3 h-3" />
                                                    {errors.responsable}
                                                </p>
                                            )}
                                        </div>

                                        {/* Teléfono (Prefix select + number agrupados) */}
                                        <div className="space-y-1.5 md:col-span-2">
                                            <Label htmlFor="telefono">{__('Phone')}</Label>
                                            <div className="flex rounded-md shadow-sm border border-input focus-within:ring-1 focus-within:ring-ring focus-within:border-ring overflow-hidden">
                                                <select
                                                    value={data.pais_telefono_id}
                                                    onChange={(e) => setData('pais_telefono_id', e.target.value)}
                                                    className="bg-muted text-muted-foreground border-0 px-3 py-2 text-sm focus:outline-none cursor-pointer w-28 shrink-0 select-none border-r"
                                                >
                                                    {paises.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.codigo_iso2} (+{p.codigo_telefonico})
                                                        </option>
                                                    ))}
                                                </select>
                                                <Input
                                                    id="telefono"
                                                    type="tel"
                                                    value={data.telefono}
                                                    onChange={(e) => setData('telefono', e.target.value)}
                                                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none w-full"
                                                />
                                            </div>
                                            {errors.telefono && (
                                                <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                                                    <ShieldAlert className="w-3 h-3" />
                                                    {errors.telefono}
                                                </p>
                                            )}
                                        </div>

                                        {/* Estado (Status) */}
                                        <div className="space-y-1.5 md:col-span-2">
                                            <Label htmlFor="status">{__('Status')}</Label>
                                            <Select
                                                value={data.status}
                                                onValueChange={(val) => setData('status', val as any)}
                                            >
                                                <SelectTrigger id="status">
                                                    <SelectValue placeholder={__('Select Status')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="activo">{__('Active')}</SelectItem>
                                                    <SelectItem value="suspendido">{__('Suspended')}</SelectItem>
                                                    <SelectItem value="en_revision">{__('Under review')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.status && (
                                                <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                                                    <ShieldAlert className="w-3 h-3" />
                                                    {errors.status}
                                                </p>
                                            )}
                                        </div>

                                    </div>
                                </TabsContent>

                                {/* ── Pestaña 2: Ubicación con Mapbox ── */}
                                <TabsContent value="ubicacion" className="space-y-4 flex-1 flex flex-col min-h-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        
                                        {/* País */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="pais_id">{__('Country')}</Label>
                                            <Select
                                                value={data.pais_id}
                                                onValueChange={(val) => setData('pais_id', val)}
                                            >
                                                <SelectTrigger id="pais_id">
                                                    <SelectValue placeholder={__('Select Country')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {paises.map((p) => (
                                                        <SelectItem key={p.id} value={String(p.id)}>
                                                            {p.nombre}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.pais_id && (
                                                <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                                                    <ShieldAlert className="w-3 h-3" />
                                                    {errors.pais_id}
                                                </p>
                                            )}
                                        </div>

                                        {/* Latitud y Longitud */}
                                        <div className="space-y-1.5">
                                            <Label>{__('Coordinates')}</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input
                                                    placeholder={__('Latitude')}
                                                    value={data.latitud !== null ? String(data.latitud) : ''}
                                                    readOnly
                                                    className="bg-muted text-muted-foreground text-xs"
                                                />
                                                <Input
                                                    placeholder={__('Longitude')}
                                                    value={data.longitud !== null ? String(data.longitud) : ''}
                                                    readOnly
                                                    className="bg-muted text-muted-foreground text-xs"
                                                />
                                            </div>
                                        </div>

                                        {/* Dirección */}
                                        <div className="space-y-1.5 md:col-span-2">
                                            <Label htmlFor="direccion">{__('Address')}</Label>
                                            <Textarea
                                                id="direccion"
                                                value={data.direccion}
                                                onChange={(e) => setData('direccion', e.target.value)}
                                                rows={2}
                                                className={cn(errors.direccion && 'border-rose-500')}
                                            />
                                            {errors.direccion && (
                                                <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                                                    <ShieldAlert className="w-3 h-3" />
                                                    {errors.direccion}
                                                </p>
                                            )}
                                        </div>

                                    </div>

                                    {/* Mapa de Mapbox */}
                                    <div className="flex-1 min-h-[220px] rounded-lg border overflow-hidden relative bg-slate-50 flex items-center justify-center">
                                        <Suspense
                                            fallback={
                                                <p className="text-sm text-muted-foreground">{__('Loading map...')}</p>
                                            }
                                        >
                                            {isModalOpen && activeTab === 'ubicacion' && (
                                                <ProveedorMapComponent
                                                    center={mapCenter}
                                                    zoom={mapZoom}
                                                    style={{ height: '100%', width: '100%' }}
                                                    markerPosition={
                                                        data.latitud && data.longitud
                                                            ? [Number(data.latitud), Number(data.longitud)]
                                                            : null
                                                    }
                                                    onLocationSelected={handleLocationSelected}
                                                />
                                            )}
                                        </Suspense>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-normal">
                                        {__('Click on the map to set the exact location. The address will be obtained automatically.')}
                                    </p>
                                </TabsContent>
                            </Tabs>
                        </div>

                        <DialogFooter className="px-6 py-4 border-t bg-slate-50/50">
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
                                className="bg-[#104a29] hover:bg-[#0c371e] text-white"
                            >
                                {__('Save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ══ Confirmación de Eliminación ════════════════════════════════════ */}
            <Dialog open={deletingProveedor !== null} onOpenChange={(open) => !open && setDeletingProveedor(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{__('Delete Supplier')}</DialogTitle>
                        <DialogDescription>
                            {__('Are you sure you want to delete this supplier?')}
                            <span className="block mt-2 font-semibold text-slate-800 dark:text-slate-200">
                                {deletingProveedor?.razon_social}
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingProveedor(null)}>
                            {__('Cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteClick}
                        >
                            {__('Delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminSaasLayout>
    );
}
