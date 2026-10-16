import { Head, useForm, router } from '@inertiajs/react';
import {
    GitBranch,
    Plus,
    MoreVertical,
    Pencil,
    Trash2,
    ToggleRight,
    Phone,
    MapPin,
    Building2,
    Clock,
    Users,
    Search,
    X,
    LayoutGrid,
    List,
    Copy,
    CheckCircle2,
    XCircle,
    Navigation,
    ExternalLink,
    AlertTriangle,
    SlidersHorizontal,
} from 'lucide-react';
import React, { useState, Suspense, lazy, useMemo, useRef } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { ModuleHeader } from '@/components/module-header';
import Pagination from '@/components/pagination';
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
import { Badge } from '@/components/ui/badge';
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';
import { cn, cleanParams } from '@/lib/utils';
import type { Auth } from '@/types';
import type { Paginated } from '@/types/app';
import { notifySuccess, notifyError } from '@/utils/notifications';
import PhoneInputGroup from '../Empresas/Partials/PhoneInputGroup';

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
    pais_telefono_id?: number | string | null;
    telefono?: string | null;
    direccion?: string | null;
    latitud?: number | null;
    longitud?: number | null;
    zona_horaria?: string | null;
    status: boolean;
    users_count?: number;
    empresa?: Empresa | null;
    pais_telefono?: Pais | null;
    created_at?: string;
}

interface SucursalesPageProps {
    auth: Auth;
    sucursales: Paginated<Sucursal>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
        con_gps?: number;
        con_usuarios?: number;
    };
    empresas: Empresa[];
    paises: Pais[];
    filters: {
        search?: string;
        status?: string;
        empresa_id?: string;
        perPage?: string;
        sortBy?: string;
        sortDir?: string;
    };
}

// ─── Formulario inicial vacío ─────────────────────────────────────────────────

const initialForm = {
    empresa_id: '' as string | number,
    nombre: '',
    pais_telefono_id: '' as string | number,
    telefono: '',
    direccion: '',
    latitud: null as number | null,
    longitud: null as number | null,
    zona_horaria: '',
    status: true as boolean,
};

export default function SucursalesIndexPage({
    sucursales,
    stats,
    empresas,
    paises,
    filters,
}: SucursalesPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Branches'), href: '/admin/sucursales' },
    ];

    // ── Estados Principales ───────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);
    const [duplicatingSucursal, setDuplicatingSucursal] = useState<Sucursal | null>(null);
    const [deletingSucursal, setDeletingSucursal] = useState<Sucursal | null>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'ubicacion'>('general');
    const [isTableLoading, setIsTableLoading] = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [empresaFilter, setEmpresaFilter] = useState(filters.empresa_id || '');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '10');

    // ── Hooks de navegación ────────────────────────────────────────────────────
    React.useEffect(() => {
        const unbindStart = router.on('start', () => setIsTableLoading(true));
        const unbindFinish = router.on('finish', () => setIsTableLoading(false));

        return () => {
            unbindStart();
            unbindFinish();
        };
    }, []);

    // Debounce de filtros
    const isFirstRender = useRef(true);
    React.useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;

            return;
        }

        const timer = setTimeout(() => {
            router.get(
                window.location.pathname,
                cleanParams({
                    search: searchTerm,
                    status: statusFilter,
                    empresa_id: empresaFilter,
                    perPage: perPageFilter,
                    sortBy: filters.sortBy,
                    sortDir: filters.sortDir,
                }),
                { preserveState: true, preserveScroll: true, replace: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, empresaFilter, perPageFilter, filters.sortBy, filters.sortDir]);

    // ── Formulario Inertia ─────────────────────────────────────────────────────
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm(initialForm);

    // ── Mapa ───────────────────────────────────────────────────────────────────
    const paisSeleccionado = useMemo(() => {
        return paises.find((p) => p.id === Number(data.pais_telefono_id));
    }, [paises, data.pais_telefono_id]);

    const mapCenter: [number, number] = useMemo(() => {
        if (data.latitud && data.longitud) {
            return [data.latitud, data.longitud];
        }

        if (paisSeleccionado?.latitud && paisSeleccionado?.longitud) {
            return [paisSeleccionado.latitud, paisSeleccionado.longitud];
        }

        return [4.6, -74.1];
    }, [data.latitud, data.longitud, paisSeleccionado]);

    const mapZoom = data.latitud && data.longitud ? 14 : paisSeleccionado ? 6 : 4;

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleCreateClick = () => {
        clearErrors();
        setEditingSucursal(null);
        setDuplicatingSucursal(null);
        reset();
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleEditClick = (sucursal: Sucursal) => {
        clearErrors();
        setEditingSucursal(sucursal);
        setDuplicatingSucursal(null);
        setData({
            empresa_id: sucursal.empresa_id,
            nombre: sucursal.nombre || '',
            pais_telefono_id: sucursal.pais_telefono_id ?? '',
            telefono: sucursal.telefono || '',
            direccion: sucursal.direccion || '',
            latitud: sucursal.latitud ?? null,
            longitud: sucursal.longitud ?? null,
            zona_horaria: sucursal.zona_horaria || '',
            status: sucursal.status,
        });
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleDuplicateClick = (sucursal: Sucursal) => {
        clearErrors();
        setEditingSucursal(null);
        setDuplicatingSucursal(sucursal);
        setData({
            empresa_id: sucursal.empresa_id,
            nombre: `${sucursal.nombre} (${__('Copy')})`,
            pais_telefono_id: sucursal.pais_telefono_id ?? '',
            telefono: sucursal.telefono || '',
            direccion: sucursal.direccion || '',
            latitud: sucursal.latitud ?? null,
            longitud: sucursal.longitud ?? null,
            zona_horaria: sucursal.zona_horaria || '',
            status: sucursal.status,
        });
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setIsModalOpen(false);
                setEditingSucursal(null);
                setDuplicatingSucursal(null);
                reset();
                notifySuccess(
                    editingSucursal ? __('Branch updated successfully.') : __('Branch created successfully.')
                );
            },
            onError: () => notifyError(__('Please review the highlighted fields.')),
        };

        if (editingSucursal) {
            put(`/admin/sucursales/${editingSucursal.id}`, options);
        } else {
            post('/admin/sucursales', options);
        }
    };

    const handleToggleStatus = (sucursal: Sucursal) => {
        router.patch(`/admin/sucursales/${sucursal.id}/toggle-status`, {}, {
            preserveScroll: true,
            onSuccess: () => notifySuccess(__('Status updated successfully.')),
            onError: () => notifyError(__('There was an error updating the status.')),
        });
    };

    const handleDeleteConfirm = () => {
        if (!deletingSucursal) {
return;
}

        router.delete(`/admin/sucursales/${deletingSucursal.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingSucursal(null);
                notifySuccess(__('Branch deleted successfully.'));
            },
            onError: () => notifyError(__('There was an error deleting the branch. Please try again.')),
        });
    };

    const handleLocationSelected = (lat: number, lng: number, address?: string, timezone?: string) => {
        setData((prev) => ({
            ...prev,
            latitud: lat,
            longitud: lng,
            ...(address ? { direccion: address } : {}),
            ...(timezone ? { zona_horaria: timezone } : {}),
        }));
    };

    const handleCenterOnCountry = () => {
        if (paisSeleccionado?.latitud && paisSeleccionado?.longitud) {
            setData((prev) => ({
                ...prev,
                latitud: paisSeleccionado.latitud ?? null,
                longitud: paisSeleccionado.longitud ?? null,
            }));
            notifySuccess(__('Centered coordinates on country.'));
        }
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setEmpresaFilter('');
        setPerPageFilter('10');
    };

    const hasActiveFilters = Boolean(searchTerm || statusFilter || empresaFilter || perPageFilter !== '10');

    // ── Render Helpers ────────────────────────────────────────────────────────

    const renderActionMenu = (sucursal: Sucursal) => {
        const hasGps = Boolean(sucursal.latitud && sucursal.longitud);

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={__('Actions')}>
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleEditClick(sucursal)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {__('Edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateClick(sucursal)}>
                        <Copy className="mr-2 h-4 w-4" />
                        {__('Duplicate')}
                    </DropdownMenuItem>
                    {hasGps && (
                        <DropdownMenuItem asChild>
                            <a
                                href={`https://www.google.com/maps?q=${sucursal.latitud},${sucursal.longitud}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center cursor-pointer"
                            >
                                <ExternalLink className="mr-2 h-4 w-4 text-sky-600" />
                                {__('Open in Google Maps')}
                            </a>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
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
        );
    };

    // ── Columnas de la tabla ───────────────────────────────────────────────────

    const columns: ColumnDef<Sucursal>[] = [
        {
            header: __('Branch'),
            accessorKey: 'nombre',
            sortable: true,
            sortKey: 'nombre',
            className: 'font-medium',
            cell: (sucursal) => (
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 shadow-xs">
                        <GitBranch className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-foreground truncate">{sucursal.nombre}</p>
                        {sucursal.direccion ? (
                            <p className="text-xs text-muted-foreground truncate max-w-[280px] mt-0.5" title={sucursal.direccion}>
                                {sucursal.direccion}
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground/60 italic mt-0.5">{__('No address registered')}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: __('Company'),
            accessorKey: 'empresa',
            sortable: true,
            sortKey: 'empresa_id',
            hideOn: 'mobile',
            cell: (sucursal) => (
                <div className="flex items-center gap-2">
                    {sucursal.empresa?.logo_mini || sucursal.empresa?.logo ? (
                        <img
                            src={sucursal.empresa.logo_mini || sucursal.empresa.logo || ''}
                            alt={sucursal.empresa.razon_social}
                            className="w-6 h-6 rounded-md object-cover border shrink-0"
                        />
                    ) : (
                        <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    )}
                    <span className="text-sm font-medium text-foreground/90 truncate">
                        {sucursal.empresa?.razon_social ?? '—'}
                    </span>
                </div>
            ),
        },
        {
            header: __('Contact'),
            hideOn: 'tablet',
            cell: (sucursal) => (
                <div className="space-y-0.5 text-xs text-muted-foreground">
                    {sucursal.telefono ? (
                        <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>{sucursal.telefono}</span>
                        </div>
                    ) : (
                        <span className="italic">—</span>
                    )}
                </div>
            ),
        },
        {
            header: __('Location'),
            hideOn: 'mobile',
            cell: (sucursal) => {
                const hasGps = Boolean(sucursal.latitud && sucursal.longitud);

                return hasGps ? (
                    <a
                        href={`https://www.google.com/maps?q=${sucursal.latitud},${sucursal.longitud}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline dark:text-sky-400"
                        title={__('Open in Google Maps')}
                    >
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>
                            {Number(sucursal.latitud).toFixed(4)}, {Number(sucursal.longitud).toFixed(4)}
                        </span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                    </a>
                ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 italic">
                        <MapPin className="h-3 w-3 opacity-40" />
                        {__('No GPS')}
                    </span>
                );
            },
        },
        {
            header: __('Staff'),
            sortable: true,
            sortKey: 'users_count',
            hideOn: 'tablet',
            cell: (sucursal) => {
                const count = sucursal.users_count ?? 0;

                return (
                    <div className="flex items-center gap-1.5 text-xs">
                        <span
                            className={cn(
                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                                count > 0
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800'
                                    : 'bg-muted text-muted-foreground'
                            )}
                        >
                            <Users className="h-3 w-3 shrink-0" />
                            <span>{count}</span>
                        </span>
                    </div>
                );
            },
        },
        {
            header: __('Time Zone'),
            hideOn: 'tablet',
            cell: (sucursal) => (
                <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                    <span className="truncate">{sucursal.zona_horaria || __('Default')}</span>
                </div>
            ),
        },
        {
            header: __('Status'),
            sortable: true,
            sortKey: 'status',
            stopRowClick: true,
            cell: (sucursal) => (
                <div className="flex items-center gap-2">
                    <Switch
                        checked={sucursal.status}
                        onCheckedChange={() => handleToggleStatus(sucursal)}
                    />
                    <span
                        className={cn(
                            'text-[11px] font-semibold px-2 py-0.5 rounded-full border',
                            sucursal.status
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        )}
                    >
                        {sucursal.status ? __('Active') : __('Inactive')}
                    </span>
                </div>
            ),
        },
        {
            header: __('Actions'),
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (sucursal) => renderActionMenu(sucursal),
        },
    ];

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <>
            <Head title={__('Branches')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Encabezado del Módulo con degradado enriquecido */}
                <ModuleHeader
                    icon={<GitBranch className="h-6 w-6 text-white" />}
                    title={__('Branches')}
                    description={__('Manage company branches, their locations and contact information.')}
                    colorClassName="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600"
                >
                    <Button onClick={handleCreateClick} className="bg-white text-violet-700 shadow-sm hover:bg-white/90 font-semibold">
                        <Plus className="mr-2 h-4 w-4" />
                        {__('New Branch')}
                    </Button>
                </ModuleHeader>

                {/* Tarjetas KPI Interactivas */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                    <button
                        type="button"
                        onClick={() => setStatusFilter('')}
                        className={cn(
                            'text-left transition-transform hover:-translate-y-0.5 rounded-xl focus:outline-none',
                            !statusFilter && 'ring-2 ring-violet-500 rounded-xl'
                        )}
                    >
                        <StatCard
                            icon={<GitBranch className="h-6 w-6" />}
                            title={__('TOTAL BRANCHES')}
                            value={stats.total}
                            colorClassName="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
                        />
                    </button>

                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === '1' ? '' : '1')}
                        className={cn(
                            'text-left transition-transform hover:-translate-y-0.5 rounded-xl focus:outline-none',
                            statusFilter === '1' && 'ring-2 ring-emerald-500 rounded-xl'
                        )}
                    >
                        <StatCard
                            icon={<CheckCircle2 className="h-6 w-6" />}
                            title={__('ACTIVE')}
                            value={stats.activos}
                            colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                        />
                    </button>

                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === '0' ? '' : '0')}
                        className={cn(
                            'text-left transition-transform hover:-translate-y-0.5 rounded-xl focus:outline-none',
                            statusFilter === '0' && 'ring-2 ring-slate-500 rounded-xl'
                        )}
                    >
                        <StatCard
                            icon={<XCircle className="h-6 w-6" />}
                            title={__('INACTIVE')}
                            value={stats.inactivos}
                            colorClassName="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        />
                    </button>

                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === 'con_gps' ? '' : 'con_gps')}
                        className={cn(
                            'text-left transition-transform hover:-translate-y-0.5 rounded-xl focus:outline-none',
                            statusFilter === 'con_gps' && 'ring-2 ring-sky-500 rounded-xl'
                        )}
                    >
                        <StatCard
                            icon={<MapPin className="h-6 w-6" />}
                            title={__('WITH GPS LOCATION')}
                            value={stats.con_gps ?? 0}
                            colorClassName="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300"
                        />
                    </button>

                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === 'con_usuarios' ? '' : 'con_usuarios')}
                        className={cn(
                            'text-left transition-transform hover:-translate-y-0.5 rounded-xl focus:outline-none col-span-2 md:col-span-1',
                            statusFilter === 'con_usuarios' && 'ring-2 ring-indigo-500 rounded-xl'
                        )}
                    >
                        <StatCard
                            icon={<Users className="h-6 w-6" />}
                            title={__('WITH ASSIGNED STAFF')}
                            value={stats.con_usuarios ?? 0}
                            colorClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"
                        />
                    </button>
                </div>

                {/* Barra de Filtros y Herramientas */}
                <div className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        {/* Buscador */}
                        <div className="relative w-full lg:max-w-md">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="branches-search"
                                placeholder={__('Search by name, phone, address...')}
                                className="pl-9 pr-9 h-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    aria-label={__('Clear')}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Selectores de Filtro y Switcher de Vista */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Filtro Empresa */}
                            <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                                <SelectTrigger className="w-[160px] sm:w-[200px] h-10 text-xs">
                                    <SelectValue placeholder={__('All companies')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('All companies')}</SelectItem>
                                    {empresas.map((emp) => (
                                        <SelectItem key={emp.id} value={String(emp.id)}>
                                            <div className="flex items-center gap-2">
                                                {emp.logo_mini || emp.logo ? (
                                                    <img
                                                        src={emp.logo_mini || emp.logo || ''}
                                                        alt=""
                                                        className="w-4 h-4 rounded object-cover border"
                                                    />
                                                ) : (
                                                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                                )}
                                                <span className="truncate">{emp.razon_social}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Filtro Estado */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[130px] sm:w-[150px] h-10 text-xs">
                                    <SelectValue placeholder={__('Status')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('All')}</SelectItem>
                                    <SelectItem value="1">{__('Active')}</SelectItem>
                                    <SelectItem value="0">{__('Inactive')}</SelectItem>
                                    <SelectItem value="con_gps">{__('With GPS')}</SelectItem>
                                    <SelectItem value="con_usuarios">{__('With Staff')}</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Registros por página */}
                            <Select value={perPageFilter} onValueChange={setPerPageFilter}>
                                <SelectTrigger className="w-[85px] h-10 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Switcher Vista Grid / Tabla */}
                            <div className="inline-flex rounded-lg border bg-muted/50 p-1">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('table')}
                                    className={cn(
                                        'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                                        viewMode === 'table'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                    title={__('Table view')}
                                    aria-label={__('Table view')}
                                >
                                    <List className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
                                        'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                                        viewMode === 'grid'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                    title={__('Grid view')}
                                    aria-label={__('Grid view')}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Chips de filtros activos */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs">
                            <span className="text-muted-foreground font-medium flex items-center gap-1">
                                <SlidersHorizontal className="h-3 w-3" />
                                {__('Active filters')}:
                            </span>
                            {searchTerm && (
                                <Badge variant="secondary" className="gap-1 font-normal">
                                    {__('Search')}: "{searchTerm}"
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                                </Badge>
                            )}
                            {empresaFilter && (
                                <Badge variant="secondary" className="gap-1 font-normal">
                                    {__('Company')}: {empresas.find((e) => String(e.id) === empresaFilter)?.razon_social || empresaFilter}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => setEmpresaFilter('')} />
                                </Badge>
                            )}
                            {statusFilter && (
                                <Badge variant="secondary" className="gap-1 font-normal capitalize">
                                    {__('Status')}: {statusFilter === '1' ? __('Active') : statusFilter === '0' ? __('Inactive') : statusFilter === 'con_gps' ? __('With GPS') : __('With Staff')}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('')} />
                                </Badge>
                            )}
                            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 text-xs text-violet-600 hover:text-violet-700 px-2">
                                {__('Clear all filters')}
                            </Button>
                        </div>
                    )}
                </div>

                {/* ── Vista Tabla (DataTable) ──────────────────────────────────────── */}
                {viewMode === 'table' && (
                    <div className="w-full">
                        <DataTable
                            data={sucursales}
                            columns={columns}
                            filters={filters}
                            isLoading={isTableLoading}
                            onRowClick={(sucursal) => handleEditClick(sucursal)}
                            emptyState={{
                                title: 'No branches found',
                                description: hasActiveFilters
                                    ? 'Try clearing your search filters or changing your query.'
                                    : 'You have not registered any branches yet.',
                                ctaLabel: 'New Branch',
                                onCtaClick: handleCreateClick,
                            }}
                        />
                    </div>
                )}

                {/* ── Vista Tarjetas (Grid) ────────────────────────────────────────── */}
                {viewMode === 'grid' && (
                    <div className="space-y-6">
                        {sucursales.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                                    <GitBranch className="h-7 w-7" />
                                </div>
                                <h3 className="text-base font-semibold">{__('No branches found')}</h3>
                                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                    {hasActiveFilters
                                        ? __('Try clearing your search filters or changing your query.')
                                        : __('You have not registered any branches yet.')}
                                </p>
                                <div className="mt-5 flex gap-2">
                                    {hasActiveFilters && (
                                        <Button variant="outline" onClick={clearAllFilters}>
                                            {__('Clear all filters')}
                                        </Button>
                                    )}
                                    <Button onClick={handleCreateClick} className="bg-violet-600 text-white hover:bg-violet-700">
                                        <Plus className="mr-2 h-4 w-4" />
                                        {__('New Branch')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {sucursales.data.map((sucursal) => {
                                    const hasGps = Boolean(sucursal.latitud && sucursal.longitud);
                                    const userCount = sucursal.users_count ?? 0;

                                    return (
                                        <div
                                            key={sucursal.id}
                                            className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                                        >
                                            {/* Barra de acento */}
                                            <div
                                                className={cn(
                                                    'h-1.5 w-full bg-gradient-to-r',
                                                    sucursal.status
                                                        ? 'from-violet-500 to-indigo-500'
                                                        : 'from-slate-400 to-slate-500'
                                                )}
                                            />

                                            <div className="flex flex-1 flex-col p-5">
                                                {/* Header de la tarjeta */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 shadow-xs">
                                                            <GitBranch className="h-5 w-5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="font-semibold text-sm truncate text-foreground" title={sucursal.nombre}>
                                                                {sucursal.nombre}
                                                            </h3>
                                                            {sucursal.empresa && (
                                                                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground truncate">
                                                                    <Building2 className="h-3 w-3 text-indigo-500 shrink-0" />
                                                                    <span className="truncate">{sucursal.empresa.razon_social}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {renderActionMenu(sucursal)}
                                                </div>

                                                {/* Detalles de la sucursal */}
                                                <div className="mt-4 space-y-2 text-xs">
                                                    {/* Dirección */}
                                                    <div className="flex items-start gap-2 text-muted-foreground bg-muted/40 p-2.5 rounded-lg border min-h-[52px]">
                                                        <MapPin className="h-3.5 w-3.5 text-violet-500 shrink-0 mt-0.5" />
                                                        <p className="line-clamp-2 leading-relaxed" title={sucursal.direccion || undefined}>
                                                            {sucursal.direccion || __('No address registered')}
                                                        </p>
                                                    </div>

                                                    {/* Teléfono */}
                                                    {sucursal.telefono && (
                                                        <div className="flex items-center gap-2 text-muted-foreground px-1">
                                                            <Phone className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                                                            <span className="truncate">{sucursal.telefono}</span>
                                                        </div>
                                                    )}

                                                    {/* Zona Horaria */}
                                                    <div className="flex items-center gap-2 text-muted-foreground px-1 font-mono text-[11px]">
                                                        <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                        <span className="truncate">{sucursal.zona_horaria || __('Default timezone')}</span>
                                                    </div>
                                                </div>

                                                {/* Geolocalización y Personal */}
                                                <div className="mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2">
                                                    {hasGps ? (
                                                        <a
                                                            href={`https://www.google.com/maps?q=${sucursal.latitud},${sucursal.longitud}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300"
                                                        >
                                                            <Navigation className="h-3 w-3 text-sky-600" />
                                                            <span>GPS</span>
                                                            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-[11px] text-muted-foreground/60 italic">
                                                            {__('No GPS')}
                                                        </span>
                                                    )}

                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                                                            userCount > 0
                                                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800'
                                                                : 'bg-muted text-muted-foreground'
                                                        )}
                                                    >
                                                        <Users className="h-3 w-3 shrink-0" />
                                                        <span>{userCount} {userCount === 1 ? __('user') : __('users')}</span>
                                                    </span>
                                                </div>

                                                {/* Espaciador dinámico */}
                                                <div className="min-h-3 flex-1" />

                                                {/* Footer con Switch y Botón de Gestión */}
                                                <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3">
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={sucursal.status}
                                                            onCheckedChange={() => handleToggleStatus(sucursal)}
                                                        />
                                                        <span
                                                            className={cn(
                                                                'text-[10px] font-semibold uppercase tracking-wider',
                                                                sucursal.status
                                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                                    : 'text-slate-500'
                                                            )}
                                                        >
                                                            {sucursal.status ? __('Active') : __('Inactive')}
                                                        </span>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-xs font-medium"
                                                        onClick={() => handleEditClick(sucursal)}
                                                    >
                                                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                                        {__('Edit')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Paginación en Vista Grid */}
                        {sucursales.data.length > 0 && <Pagination paginatedData={sucursales} filters={filters} />}
                    </div>
                )}
            </div>

            {/* ── Modal Creación / Edición / Duplicación ────────────────────────── */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl lg:max-w-4xl">
                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                        <DialogHeader className="border-b p-6 pb-4 text-left">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                                    {editingSucursal ? (
                                        <Pencil className="h-5 w-5" />
                                    ) : duplicatingSucursal ? (
                                        <Copy className="h-5 w-5" />
                                    ) : (
                                        <Plus className="h-5 w-5" />
                                    )}
                                </div>
                                <div>
                                    <DialogTitle>
                                        {editingSucursal
                                            ? __('Edit Branch')
                                            : duplicatingSucursal
                                            ? __('Duplicate Branch')
                                            : __('New Branch')}
                                    </DialogTitle>
                                    <DialogDescription className="mt-0.5">
                                        {duplicatingSucursal
                                            ? `${__('Duplicating branch details from')} ${duplicatingSucursal.nombre}.`
                                            : __('Complete the branch information across the available sections.')}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="min-h-0 flex-1 overflow-y-auto p-6">
                            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
                                <TabsList className="grid grid-cols-2 w-full mb-6">
                                    <TabsTrigger value="general" className="flex items-center gap-2 text-xs font-medium">
                                        <GitBranch className="h-4 w-4" />
                                        {__('General')}
                                    </TabsTrigger>
                                    <TabsTrigger value="ubicacion" className="flex items-center gap-2 text-xs font-medium">
                                        <MapPin className="h-4 w-4" />
                                        {__('Location')}
                                    </TabsTrigger>
                                </TabsList>

                                {/* ══ Tab 1: General ══════════════════════════════════════════════════ */}
                                <TabsContent value="general" className="space-y-4 focus-visible:outline-none">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Empresa */}
                                        <div>
                                            <Label htmlFor="empresa_id" className="text-xs font-semibold">{__('Company')} *</Label>
                                            <Select
                                                value={String(data.empresa_id)}
                                                onValueChange={(v) => setData('empresa_id', v)}
                                            >
                                                <SelectTrigger id="empresa_id" className="w-full h-10 text-sm mt-1.5">
                                                    <SelectValue placeholder={__('Select a company')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {empresas.map((emp) => (
                                                        <SelectItem key={emp.id} value={String(emp.id)}>
                                                            <div className="flex items-center gap-2">
                                                                {emp.logo_mini || emp.logo ? (
                                                                    <img
                                                                        src={emp.logo_mini || emp.logo || ''}
                                                                        alt={emp.razon_social}
                                                                        className="w-4 h-4 rounded object-cover"
                                                                    />
                                                                ) : (
                                                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                                                )}
                                                                <span>{emp.razon_social}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.empresa_id && (
                                                <p className="text-red-500 text-xs mt-1">{errors.empresa_id}</p>
                                            )}
                                        </div>

                                        {/* Nombre */}
                                        <div>
                                            <Label htmlFor="nombre" className="text-xs font-semibold">{__('Branch Name')} *</Label>
                                            <Input
                                                id="nombre"
                                                value={data.nombre}
                                                onChange={(e) => setData('nombre', e.target.value)}
                                                placeholder="Ej: Sucursal Centro"
                                                className="h-10 text-sm mt-1.5"
                                                required
                                            />
                                            {errors.nombre && (
                                                <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
                                            )}
                                        </div>

                                        {/* Teléfono */}
                                        <div className="md:col-span-2">
                                            <Label htmlFor="telefono" className="text-xs font-semibold">{__('Phone')}</Label>
                                            <div className="mt-1.5">
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
                                        </div>

                                        {/* Status */}
                                        <div className="md:col-span-2 pt-2 border-t">
                                            <Label htmlFor="status" className="text-xs font-semibold">{__('Status')}</Label>
                                            <div className="flex items-center space-x-2 pt-2">
                                                <Switch
                                                    id="status"
                                                    checked={data.status}
                                                    onCheckedChange={(checked) => setData('status', checked)}
                                                />
                                                <span className="text-sm font-medium text-foreground">
                                                    {data.status ? __('Active') : __('Inactive')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* ══ Tab 2: Ubicación ══════════════════════════════════════════════════ */}
                                <TabsContent value="ubicacion" className="space-y-4 focus-visible:outline-none">
                                    {/* Coordenadas manuales y zona horaria */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="latitud" className="text-xs font-semibold">{__('Latitude')}</Label>
                                                {paisSeleccionado?.latitud && !data.latitud && (
                                                    <button
                                                        type="button"
                                                        onClick={handleCenterOnCountry}
                                                        className="text-[11px] text-violet-600 hover:underline"
                                                    >
                                                        {__('Use Country')}
                                                    </button>
                                                )}
                                            </div>
                                            <Input
                                                id="latitud"
                                                type="number"
                                                step="any"
                                                value={data.latitud ?? ''}
                                                onChange={(e) =>
                                                    setData('latitud', e.target.value ? parseFloat(e.target.value) : null)
                                                }
                                                placeholder="10.48801"
                                                className="mt-1.5"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="longitud" className="text-xs font-semibold">{__('Longitude')}</Label>
                                            <Input
                                                id="longitud"
                                                type="number"
                                                step="any"
                                                value={data.longitud ?? ''}
                                                onChange={(e) =>
                                                    setData('longitud', e.target.value ? parseFloat(e.target.value) : null)
                                                }
                                                placeholder="-66.87919"
                                                className="mt-1.5"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="zona_horaria" className="text-xs font-semibold">{__('Time Zone')}</Label>
                                            <Input
                                                id="zona_horaria"
                                                value={data.zona_horaria || ''}
                                                onChange={(e) => setData('zona_horaria', e.target.value)}
                                                placeholder="America/Caracas"
                                                className="mt-1.5 font-mono text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Dirección */}
                                    <div>
                                        <Label htmlFor="direccion" className="text-xs font-semibold">{__('Address')}</Label>
                                        <Textarea
                                            id="direccion"
                                            value={data.direccion || ''}
                                            onChange={(e) => setData('direccion', e.target.value)}
                                            placeholder={__('The address will be auto-filled when you click on the map...')}
                                            rows={2}
                                            className="mt-1.5"
                                        />
                                    </div>

                                    {/* Mapa interactivo */}
                                    <div
                                        style={{ height: '360px', width: '100%' }}
                                        className="rounded-xl overflow-hidden border flex items-center justify-center bg-slate-100 dark:bg-slate-800 shadow-xs"
                                    >
                                        <Suspense
                                            fallback={
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
                                                    <p className="text-slate-500 text-xs">{__('Loading map...')}</p>
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

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Navigation className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                                        <span>
                                            {__('Click on the map to set the exact location. The address will be obtained automatically.')}
                                        </span>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>

                        <DialogFooter className="flex-row items-center justify-between gap-2 border-t bg-muted/20 p-4 sm:justify-between">
                            <span className="hidden text-xs text-muted-foreground sm:inline">
                                {editingSucursal ? __('Changes apply immediately.') : __('New branch will be available across the platform.')}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={processing}
                                >
                                    {__('Cancel')}
                                </Button>
                                <Button type="submit" disabled={processing} className="bg-violet-600 hover:bg-violet-700 text-white font-semibold">
                                    {processing
                                        ? __('Saving...')
                                        : editingSucursal
                                        ? __('Save Changes')
                                        : duplicatingSucursal
                                        ? __('Duplicate Branch')
                                        : __('Create Branch')}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── AlertDialog de confirmación de eliminación ──────────────────────────── */}
            <AlertDialog open={!!deletingSucursal} onOpenChange={(open) => !open && setDeletingSucursal(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                            <Trash2 className="h-5 w-5" />
                        </div>
                        <AlertDialogTitle>{__('Delete Branch')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {__('Are you sure you want to delete the branch')}{' '}
                            <strong className="text-foreground">{deletingSucursal?.nombre}</strong>?{' '}
                            {__('This action cannot be undone.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {deletingSucursal && (deletingSucursal.users_count ?? 0) > 0 && (
                        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                                {__('This branch has :count assigned user(s). Deleting it will leave them without an assigned branch.', {
                                    count: String(deletingSucursal.users_count),
                                })}
                            </span>
                        </div>
                    )}

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
