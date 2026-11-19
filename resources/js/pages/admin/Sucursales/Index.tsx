import { Head, useForm, router, usePage } from '@inertiajs/react';
import {
    GitBranch,
    Plus,
    CheckCircle,
    XCircle,
    MoreVertical,
    Pencil,
    Trash2,
    ToggleRight,
    Phone,
    MapPin,
    Building2,
    Clock,
    Search,
    Loader2,
    Sparkles,
    Compass,
    Layers,
    Globe,
    Check,
} from 'lucide-react';
import React, { useState, Suspense, lazy, useRef } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
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
import { cn, cleanParams } from '@/lib/utils';
import type { Auth } from '@/types';
import type { Paginated } from '@/types/app';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import PhoneInputGroup from '../Empresas/Partials/PhoneInputGroup';
import { useLocationGeocoding } from '@/hooks/use-location-geocoding';

const SucursalMapComponent = lazy(() => {
    return import('../Empresas/Partials/MapComponent').then((mod) => ({ default: mod.default }));
});

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Pais {
    id: number;
    nombre: string;
    codigo_iso2?: string | null;
    codigo_telefonico?: string | null;
    latitud?: number | null;
    longitud?: number | null;
}

interface Empresa {
    id: number;
    razon_social: string;
    logo?: string | null;
    logo_mini?: string | null;
}

interface Sucursal {
    id: number;
    empresa_id: number;
    nombre: string;
    codigo_numeral?: string | null;
    pais_telefono_id?: number | string | null;
    telefono?: string | null;
    direccion?: string | null;
    latitud?: number | null;
    longitud?: number | null;
    zona_horaria?: string | null;
    status: boolean;
    empresa?: Empresa | null;
}

interface SucursalesPageProps {
    auth: Auth;
    sucursales: Paginated<Sucursal>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
    };
    empresas: Empresa[];
    paises: Pais[];
    filters: {
        search?: string;
        status?: string;
        empresa_id?: string;
        perPage?: string;
    };
}

// ─── Formulario inicial vacío ─────────────────────────────────────────────────

const initialForm = {
    empresa_id:       '' as string | number,
    nombre:           '',
    codigo_numeral:   '01',
    pais_telefono_id: '' as string | number,
    telefono:         '',
    direccion:        '',
    latitud:          null as number | null,
    longitud:         null as number | null,
    zona_horaria:     '',
    status:           true as boolean,
};

// ─── Página principal ──────────────────────────────────────────────────────────

export default function SucursalesIndexPage({
    auth, sucursales, stats, empresas, paises, filters,
}: SucursalesPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Branches'), href: '/admin/sucursales' },
    ];

    // ── Estados ────────────────────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen]           = useState(false);
    const [editingSucursal, setEditingSucursal]   = useState<Sucursal | null>(null);
    const [deletingSucursal, setDeletingSucursal] = useState<Sucursal | null>(null);
    const [activeTab, setActiveTab]               = useState('general');
    const [isTableLoading, setIsTableLoading]     = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm]         = useState(filters.search || '');
    const [statusFilter, setStatusFilter]     = useState(filters.status || '');
    const [empresaFilter, setEmpresaFilter]   = useState(filters.empresa_id || '');
    const [perPageFilter, setPerPageFilter]   = useState(filters.perPage || '10');

    // ── Hooks de navegación ────────────────────────────────────────────────────
    React.useEffect(() => {
        const unbindStart  = router.on('start',  () => setIsTableLoading(true));
        const unbindFinish = router.on('finish', () => setIsTableLoading(false));

        return () => {
 unbindStart(); unbindFinish(); 
};
    }, []);

    // Debounce de filtros
    React.useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                window.location.pathname,
                cleanParams({
                    search:     searchTerm,
                    status:     statusFilter,
                    empresa_id: empresaFilter,
                    perPage:    perPageFilter,
                }),
                { preserveState: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, empresaFilter, perPageFilter]);

    // ── Formulario Inertia ─────────────────────────────────────────────────────
    const { data, setData, post, put, processing, errors, reset } = useForm(initialForm);

    const coordsSourceRef = useRef<'manual' | 'map' | 'auto'>('auto');
    const pageProps = usePage().props as any;
    const mapboxApiKey = pageProps.mapbox_api_key || pageProps.auth?.user?.empresa?.mapbox_api_key;
    const { forwardGeocode, isGeocoding: geocoding } = useLocationGeocoding({
        mapboxApiKey,
        debounceMs: 700,
    });

    const handleForceGeocode = async () => {
        if (!data.direccion || data.direccion.trim().length < 3) {
            notifyError(__('Please enter a valid address to locate on the map.'));
            return;
        }
        coordsSourceRef.current = 'auto';
        const result = await forwardGeocode(data.direccion);
        if (result) {
            setData((prev) => ({
                ...prev,
                latitud: result.lat,
                longitud: result.lng,
                ...(result.zona_horaria ? { zona_horaria: result.zona_horaria } : {}),
            }));
            notifySuccess(__('Address located on map successfully.'));
        } else {
            notifyError(__('Could not locate address. Please check or click directly on the map.'));
        }
    };

    // ── Mapa ───────────────────────────────────────────────────────────────────
    const paisSeleccionado = paises.find((p) => p.id === Number(data.pais_telefono_id));
    const mapCenter: [number, number] =
        data.latitud && data.longitud
            ? [data.latitud, data.longitud]
            : paisSeleccionado?.latitud && paisSeleccionado?.longitud
            ? [paisSeleccionado.latitud, paisSeleccionado.longitud]
            : [4.6, -74.1];

    const mapZoom = data.latitud && data.longitud ? 14 : paisSeleccionado ? 6 : 4;

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleCreateClick = () => {
        setEditingSucursal(null);
        reset();
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleEditClick = (sucursal: Sucursal) => {
        setEditingSucursal(sucursal);
        setData({
            empresa_id:       sucursal.empresa_id,
            nombre:           sucursal.nombre || '',
            codigo_numeral:   sucursal.codigo_numeral || '01',
            pais_telefono_id: sucursal.pais_telefono_id ?? '',
            telefono:         sucursal.telefono || '',
            direccion:        sucursal.direccion || '',
            latitud:          sucursal.latitud ?? null,
            longitud:         sucursal.longitud ?? null,
            zona_horaria:     sucursal.zona_horaria || '',
            status:           sucursal.status,
        });
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingSucursal) {
            put(`/admin/sucursales/${editingSucursal.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingSucursal(null);
                    reset();
                    notifySuccess(__('Branch updated successfully.'));
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        } else {
            post('/admin/sucursales', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Branch created successfully.'));
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        }
    };

    const handleToggleStatus = (sucursal: Sucursal) => {
        router.patch(`/admin/sucursales/${sucursal.id}/toggle-status`, {}, { preserveScroll: true });
    };

    const handleDeleteConfirm = () => {
        if (!deletingSucursal) {
return;
}

        router.delete(`/admin/sucursales/${deletingSucursal.id}`, {
            onSuccess: () => {
                setDeletingSucursal(null);
                notifySuccess(__('Branch deleted successfully.'));
            },
            onError: () => notifyError(__('There was an error deleting the branch. Please try again.')),
        });
    };

    const handleLocationSelected = (lat: number, lng: number, address?: string, timezone?: string) => {
        coordsSourceRef.current = 'map';
        setData((prev) => ({
            ...prev,
            latitud:  lat,
            longitud: lng,
            ...(address ? { direccion: address } : {}),
            ...(timezone ? { zona_horaria: timezone } : {}),
        }));
    };

    // ── Columnas de la tabla ───────────────────────────────────────────────────

    const columns: ColumnDef<Sucursal>[] = [
        {
            header: 'Branch',
            accessorKey: 'nombre',
            className: 'font-medium',
            cell: (sucursal) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <GitBranch className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <p className="font-medium text-sm">{sucursal.nombre}</p>
                        {sucursal.direccion && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{sucursal.direccion}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: 'Company',
            accessorKey: 'empresa',
            hideOn: 'mobile',
            cell: (sucursal) => (
                <div className="flex items-center gap-2">
                    {sucursal.empresa?.logo_mini || sucursal.empresa?.logo ? (
                        <img
                            src={sucursal.empresa.logo_mini || sucursal.empresa.logo || ''}
                            alt={sucursal.empresa.razon_social}
                            className="w-6 h-6 rounded object-cover border"
                        />
                    ) : (
                        <div className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Building2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    )}
                    <span className="text-sm text-muted-foreground">
                        {sucursal.empresa?.razon_social ?? '—'}
                    </span>
                </div>
            ),
        },
        {
            header: 'Contact',
            hideOn: 'mobile',
            cell: (sucursal) => (
                <div className="space-y-0.5">
                    {sucursal.telefono && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {sucursal.telefono}
                        </div>
                    )}
                    {sucursal.latitud && sucursal.longitud && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {Number(sucursal.latitud).toFixed(4)}, {Number(sucursal.longitud).toFixed(4)}
                        </div>
                    )}
                    {!sucursal.telefono && !sucursal.latitud && (
                        <span className="text-xs text-muted-foreground">—</span>
                    )}
                </div>
            ),
        },
        {
            header: __('Time Zone'),
            hideOn: 'mobile',
            cell: (sucursal) => (
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{sucursal.zona_horaria || __('Default')}</span>
                </div>
            ),
        },
        {
            header: 'Status',
            stopRowClick: true,
            cell: (sucursal) => (
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={sucursal.status}
                        onCheckedChange={() => handleToggleStatus(sucursal)}
                    />
                    <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full border',
                        sucursal.status
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                            : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                    )}>
                        {sucursal.status ? __('Active') : __('Inactive')}
                    </span>
                </div>
            ),
        },
        {
            header: 'Actions',
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (sucursal) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(sucursal)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(sucursal)}>
                            <ToggleRight className="mr-2 h-4 w-4" />
                            {sucursal.status ? __('Deactivate') : __('Activate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setDeletingSucursal(sucursal)}
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

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <>
            <Head title={__('Branches')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<GitBranch className="h-6 w-6 text-white" />}
                    title={__('Branches')}
                    description={__('Manage company branches, their locations and contact information.')}
                    colorClassName="bg-violet-600"
                >
                    <Button onClick={handleCreateClick}>
                        <Plus className="mr-2 h-4 w-4" />
                        {__('New Branch')}
                    </Button>
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard
                        icon={<GitBranch className="h-6 w-6" />}
                        title={__('TOTAL BRANCHES')}
                        value={stats.total}
                        colorClassName="bg-violet-100 text-violet-600"
                    />
                    <StatCard
                        icon={<CheckCircle className="h-6 w-6" />}
                        title={__('ACTIVE')}
                        value={stats.activos}
                        colorClassName="bg-green-100 text-green-600"
                    />
                    <StatCard
                        icon={<XCircle className="h-6 w-6" />}
                        title={__('INACTIVE')}
                        value={stats.inactivos}
                        colorClassName="bg-red-100 text-red-600"
                    />
                </div>

                {/* Filtros */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Search')}>
                            <Input
                                placeholder={__('Search by name, phone, address...')}
                                className="w-full md:w-80"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Company')}>
                            <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                                <SelectTrigger className="w-full md:w-56">
                                    <SelectValue placeholder={__('All companies')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('All companies')}</SelectItem>
                                    {empresas.map((emp) => (
                                        <SelectItem key={emp.id} value={String(emp.id)}>
                                            {emp.razon_social}
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
                                    <SelectItem value="">{__('All')}</SelectItem>
                                    <SelectItem value="1">{__('Active')}</SelectItem>
                                    <SelectItem value="0">{__('Inactive')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                        <FilterField label={__('Records per page')}>
                            <Select value={perPageFilter} onValueChange={setPerPageFilter}>
                                <SelectTrigger className="w-full md:w-40">
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
                        data={sucursales}
                        columns={columns}
                        isLoading={isTableLoading}
                        onRowClick={(sucursal) => handleEditClick(sucursal)}
                        emptyState={{
                            title: 'No branches found',
                            description: searchTerm || statusFilter || empresaFilter
                                ? 'Try clearing your search filters or changing your query.'
                                : 'You have not registered any branches yet.',
                            ctaLabel: 'New Branch',
                            onCtaClick: handleCreateClick,
                        }}
                    />
                </div>
            </div>

            {/* ── Modal Creación / Edición Modernizado ─────────────────────────────────── */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[760px] lg:max-w-[980px] p-0 overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-slate-950/95 max-h-[92vh] flex flex-col">
                    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                        {/* Header Moderno con Gradiente y Badges */}
                        <div className="relative px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-4 ring-emerald-500/10">
                                        <GitBranch className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                                {editingSucursal ? __('Edit Branch') : __('New Branch')}
                                            </DialogTitle>
                                            {editingSucursal && (
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
                                                        data.status
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60'
                                                            : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                                    )}
                                                >
                                                    <span className={cn('w-1.5 h-1.5 rounded-full', data.status ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400')} />
                                                    {data.status ? __('Active') : __('Inactive')}
                                                </span>
                                            )}
                                        </div>
                                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            {editingSucursal
                                                ? __('Update branch details, contacts, and Leaflet GPS coordinates.')
                                                : __('Register a new physical branch and configure its location on the map.')}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs Segmentados Modernos */}
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-5">
                                <TabsList className="grid grid-cols-2 w-full p-1.5 bg-slate-100/90 dark:bg-slate-900/90 rounded-2xl border border-slate-200/70 dark:border-slate-800/70">
                                    <TabsTrigger
                                        value="general"
                                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all"
                                    >
                                        <GitBranch className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        {__('General Info')}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="ubicacion"
                                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all"
                                    >
                                        <MapPin className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                        {__('Location & Map')}
                                        {data.latitud && data.longitud && (
                                            <span className="w-2 h-2 rounded-full bg-teal-500 inline-block ml-1" />
                                        )}
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* Modal Body scrolleable */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                {/* ══ Tab 1: General ══════════════════════════════════════════════════ */}
                                <TabsContent value="general" className="mt-0 space-y-5">
                                    {/* Sección: Datos de la Sucursal */}
                                    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-5 space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                                            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                {__('Branch Identification')}
                                            </h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Empresa */}
                                            <div className="space-y-1.5 md:col-span-2">
                                                <Label htmlFor="empresa_id" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    {__('Company')} <span className="text-rose-500">*</span>
                                                </Label>
                                                <Select
                                                    value={String(data.empresa_id)}
                                                    onValueChange={(v) => setData('empresa_id', v)}
                                                >
                                                    <SelectTrigger id="empresa_id" className="w-full h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                        <SelectValue placeholder={__('Select a company')} />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl shadow-xl">
                                                        {empresas.map((emp) => (
                                                            <SelectItem key={emp.id} value={String(emp.id)} className="rounded-lg">
                                                                <div className="flex items-center gap-2.5">
                                                                    {emp.logo_mini || emp.logo ? (
                                                                        <img
                                                                            src={emp.logo_mini || emp.logo || ''}
                                                                            alt={emp.razon_social}
                                                                            className="w-5 h-5 rounded-md object-contain border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                                                                        </div>
                                                                    )}
                                                                    <span className="font-medium text-slate-800 dark:text-slate-200">{emp.razon_social}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.empresa_id && (
                                                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.empresa_id}</p>
                                                )}
                                            </div>

                                            {/* Nombre de la Sucursal */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="nombre" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    {__('Branch Name')} <span className="text-rose-500">*</span>
                                                </Label>
                                                <Input
                                                    id="nombre"
                                                    value={data.nombre}
                                                    onChange={(e) => setData('nombre', e.target.value)}
                                                    placeholder="Ej: Planta Purépero, Cedis Guadalajara"
                                                    className="h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                />
                                                {errors.nombre && (
                                                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.nombre}</p>
                                                )}
                                            </div>

                                            {/* Numeral Planta (Código de Acceso Kiosko) */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="codigo_numeral" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                        Numeral Planta (Kiosko) <span className="text-rose-500">*</span>
                                                    </Label>
                                                    <span className="text-[10px] text-slate-400 font-medium">Ej: 01, 02, 10</span>
                                                </div>
                                                <div className="relative">
                                                    <Input
                                                        id="codigo_numeral"
                                                        value={data.codigo_numeral}
                                                        onChange={(e) => setData('codigo_numeral', e.target.value)}
                                                        placeholder="01"
                                                        maxLength={2}
                                                        className="h-11 rounded-xl font-mono text-center font-bold tracking-widest text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-base"
                                                    />
                                                </div>
                                                {errors.codigo_numeral && (
                                                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.codigo_numeral}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sección: Contacto & Operación */}
                                    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-5 space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                                            <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                {__('Contact & Operation')}
                                            </h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Teléfono */}
                                            <div className="space-y-1.5 md:col-span-2">
                                                <Label htmlFor="telefono" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    {__('Phone')}
                                                </Label>
                                                <PhoneInputGroup
                                                    paises={paises}
                                                    selectedPaisId={data.pais_telefono_id}
                                                    phoneValue={data.telefono || ''}
                                                    onPaisChange={(v) => setData('pais_telefono_id', v)}
                                                    onPhoneChange={(v) => setData('telefono', v)}
                                                    placeholder="000-0000000"
                                                    error={errors.telefono}
                                                />
                                            </div>

                                            {/* Status Switch Box */}
                                            <div className="md:col-span-2 flex items-center justify-between p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="status" className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                                                        {__('Branch Operational Status')}
                                                    </Label>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {data.status
                                                            ? __('Branch is enabled and visible for attendance kiosks, visits and departments.')
                                                            : __('Branch is inactive. Kiosks and services are temporarily suspended for this site.')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={cn(
                                                            'text-xs font-bold px-2.5 py-1 rounded-full',
                                                            data.status
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                                        )}
                                                    >
                                                        {data.status ? __('Active') : __('Inactive')}
                                                    </span>
                                                    <Switch
                                                        id="status"
                                                        checked={data.status}
                                                        onCheckedChange={(checked) => setData('status', checked)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* ══ Tab 2: Ubicación & MapLibre GL ══════════════════════════════════ */}
                                <TabsContent value="ubicacion" className="mt-0 space-y-5">
                                    {/* Barra de Búsqueda y Dirección */}
                                    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="direccion" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                {__('Address & Geocoding')}
                                            </Label>
                                            <span className="text-[11px] text-slate-400">
                                                {__('Auto-geocodes on map click')}
                                            </span>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <div className="relative flex-1">
                                                <Textarea
                                                    id="direccion"
                                                    value={data.direccion || ''}
                                                    onChange={(e) => setData('direccion', e.target.value)}
                                                    placeholder={__('Street, neighborhood, postal code, city... or click anywhere on the map.')}
                                                    rows={2}
                                                    className="rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none text-xs sm:text-sm"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleForceGeocode}
                                                disabled={geocoding}
                                                className="sm:w-44 h-auto py-2.5 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-xs flex sm:flex-col items-center justify-center gap-1.5 shadow-sm text-slate-700 dark:text-slate-300"
                                            >
                                                {geocoding ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                                                        <span>{__('Locating...')}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                        <span>{__('Locate on Map')}</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        {errors.direccion && (
                                            <p className="text-rose-500 text-xs font-medium">{errors.direccion}</p>
                                        )}
                                    </div>

                                    {/* Visor Leaflet JS Moderno */}
                                    <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-md bg-slate-100 dark:bg-slate-900">
                                        <div style={{ height: '400px', width: '100%' }}>
                                            <Suspense
                                                fallback={
                                                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900 text-slate-400">
                                                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                                                        <p className="text-xs font-medium">{__('Loading map...')}</p>
                                                    </div>
                                                }
                                            >
                                                {isModalOpen && activeTab === 'ubicacion' && (
                                                    <SucursalMapComponent
                                                        center={mapCenter}
                                                        zoom={mapZoom}
                                                        style={{ height: '100%', width: '100%' }}
                                                        markerPosition={
                                                            data.latitud && data.longitud
                                                                ? [data.latitud, data.longitud]
                                                                : null
                                                        }
                                                        onLocationSelected={handleLocationSelected}
                                                    />
                                                )}
                                            </Suspense>
                                        </div>
                                    </div>

                                    {/* Fila de Coordenadas y Zona Horaria */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {/* Latitud */}
                                        <div className="space-y-1.5 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                                            <Label htmlFor="latitud" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                <Compass className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                                {__('Latitude')}
                                            </Label>
                                            <Input
                                                id="latitud"
                                                type="number"
                                                step="any"
                                                value={data.latitud ?? ''}
                                                onChange={(e) => {
                                                    coordsSourceRef.current = 'manual';
                                                    setData('latitud', e.target.value ? parseFloat(e.target.value) : null);
                                                }}
                                                placeholder="19.9213"
                                                className="h-9 rounded-lg font-mono text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                            />
                                            {errors.latitud && <p className="text-rose-500 text-[11px] font-medium">{errors.latitud}</p>}
                                        </div>

                                        {/* Longitud */}
                                        <div className="space-y-1.5 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                                            <Label htmlFor="longitud" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                <Compass className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                                {__('Longitude')}
                                            </Label>
                                            <Input
                                                id="longitud"
                                                type="number"
                                                step="any"
                                                value={data.longitud ?? ''}
                                                onChange={(e) => {
                                                    coordsSourceRef.current = 'manual';
                                                    setData('longitud', e.target.value ? parseFloat(e.target.value) : null);
                                                }}
                                                placeholder="-102.0152"
                                                className="h-9 rounded-lg font-mono text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                            />
                                            {errors.longitud && <p className="text-rose-500 text-[11px] font-medium">{errors.longitud}</p>}
                                        </div>

                                        {/* Zona Horaria */}
                                        <div className="space-y-1.5 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                                            <Label htmlFor="zona_horaria" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                                {__('Time Zone')}
                                            </Label>
                                            <Select
                                                value={data.zona_horaria || 'America/Mexico_City'}
                                                onValueChange={(v) => setData('zona_horaria', v)}
                                            >
                                                <SelectTrigger id="zona_horaria" className="w-full h-9 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                    <SelectValue placeholder="Zona horaria" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl shadow-xl max-h-60">
                                                    <SelectItem value="America/Mexico_City">America/Mexico_City (Centro)</SelectItem>
                                                    <SelectItem value="America/Tijuana">America/Tijuana (Noroeste)</SelectItem>
                                                    <SelectItem value="America/Hermosillo">America/Hermosillo (Sonora)</SelectItem>
                                                    <SelectItem value="America/Ciudad_Juarez">America/Ciudad_Juarez</SelectItem>
                                                    <SelectItem value="America/Chihuahua">America/Chihuahua</SelectItem>
                                                    <SelectItem value="America/Mazatlan">America/Mazatlan (Pacífico)</SelectItem>
                                                    <SelectItem value="America/Cancun">America/Cancun (Sureste)</SelectItem>
                                                    <SelectItem value="America/Monterrey">America/Monterrey</SelectItem>
                                                    <SelectItem value="America/Bogota">America/Bogota (UTC-5)</SelectItem>
                                                    <SelectItem value="America/Lima">America/Lima (UTC-5)</SelectItem>
                                                    <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                                                    <SelectItem value="America/Los_Angeles">America/Los_Angeles (UTC-8)</SelectItem>
                                                    <SelectItem value="UTC">UTC (Universal)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.zona_horaria && (
                                                <p className="text-rose-500 text-[11px] font-medium">{errors.zona_horaria}</p>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Footer Moderno con Botones de Acción */}
                        <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-between">
                            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span>{__('All required fields must be filled before saving')}</span>
                            </div>
                            <div className="flex items-center gap-2.5 ml-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={processing}
                                    className="rounded-xl px-5 h-10 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-xs sm:text-sm"
                                >
                                    {__('Cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl px-6 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>{__('Saving...')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            <span>{editingSucursal ? __('Save Changes') : __('Create Branch')}</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── AlertDialog de confirmación de eliminación ──────────────────────────── */}
            <AlertDialog open={!!deletingSucursal} onOpenChange={(open) => !open && setDeletingSucursal(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{__('Delete Branch')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {__('Are you sure you want to delete the branch')}{' '}
                            <strong>{deletingSucursal?.nombre}</strong>?{' '}
                            {__(
                                'This action cannot be undone. This will also permanently delete its departments, positions, hosts, service visits and access/visit history.',
                            )}
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
