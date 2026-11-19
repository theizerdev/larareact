import { Head, useForm, router } from '@inertiajs/react';
import {
    User,
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
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { EntityAvatar } from '@/components/entity-avatar';
import { FilterBar, FilterField } from '@/components/filter-bar';
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CardGridSkeleton, GridEmptyState, ViewModeToggle, useViewMode } from '@/components/view-mode-toggle';
import { useTranslate } from '@/hooks/use-translate';
import { cn, cleanParams } from '@/lib/utils';
import type { Auth } from '@/types';
import type { Paginated } from '@/types/app';
import { notifySuccess, notifyError } from '@/utils/notifications';
import PhoneInputGroup from '../Empresas/Partials/PhoneInputGroup';

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
    empresa_id: number;
    sucursal_id: number;
}

interface Usuario {
    id: number;
    name: string;
    email: string;
}

interface Responsable {
    id: number;
    nombres: string;
    apellidos: string;
    documento_identidad?: string | null;
    pais_telefono_id?: number | null;
    telefono?: string | null;
    correo?: string | null;
    departamento_id?: number | null;
    cargo_id?: number | null;
    empresa_id: number;
    sucursal_id: number;
    user_id: number;
    status: number;
    pais_telefono?: Pais | null;
    departamento?: Departamento | null;
    cargo?: Cargo | null;
    empresa?: Empresa | null;
    sucursal?: Sucursal | null;
    user?: Usuario | null;
}

interface ResponsablesPageProps {
    auth: Auth;
    responsables: Paginated<Responsable>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
    };
    paises: Pais[];
    departamentos: Departamento[];
    cargos: Cargo[];
    empresas: Empresa[];
    sucursales: Sucursal[];
    usuarios: Usuario[];
    filters: {
        search?: string;
        status?: string;
        departamento_id?: string;
        perPage?: string;
    };
}

// ─── Formulario inicial vacío ─────────────────────────────────────────────────

const initialForm = {
    nombres: '',
    apellidos: '',
    documento_identidad: '',
    pais_telefono_id: '' as string | number,
    telefono: '',
    correo: '',
    empresa_id: '' as string | number,
    sucursal_id: '' as string | number,
    departamento_id: '' as string | number,
    cargo_id: '' as string | number,
    user_id: '' as string | number,
    status: 1 as number,
};

// ─── Página principal ──────────────────────────────────────────────────────────

export default function ResponsablesIndexPage({
    auth,
    responsables,
    stats,
    paises,
    departamentos,
    cargos,
    empresas,
    sucursales,
    usuarios,
    filters,
}: ResponsablesPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Responsibles'), href: '/admin/responsables' },
    ];

    // ── Estados ────────────────────────────────────────────────────────────────
    const [viewMode, setViewMode]                       = useViewMode('smurfit_responsables_view_mode', 'grid');
    const [isModalOpen, setIsModalOpen]                 = useState(false);
    const [editingResponsable, setEditingResponsable]   = useState<Responsable | null>(null);
    const [deletingResponsable, setDeletingResponsable] = useState<Responsable | null>(null);
    const [isTableLoading, setIsTableLoading]           = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm]             = useState(filters.search || '');
    const [statusFilter, setStatusFilter]         = useState(filters.status || '');
    const [departamentoFilter, setDepartamentoFilter] = useState(filters.departamento_id || '');
    const [perPageFilter, setPerPageFilter]       = useState(filters.perPage || '10');
    const isFirstRender = useRef(true);

    const currentFilters = cleanParams({
        search:          searchTerm,
        status:          statusFilter,
        departamento_id: departamentoFilter,
        perPage:         perPageFilter,
    });

    // ── Hooks de navegación ────────────────────────────────────────────────────
    React.useEffect(() => {
        const unbindStart  = router.on('start',  () => setIsTableLoading(true));
        const unbindFinish = router.on('finish', () => setIsTableLoading(false));

        return () => {
            unbindStart();
            unbindFinish();
        };
    }, []);

    // Debounce de filtros
    React.useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;

            return;
        }

        const timer = setTimeout(() => {
            router.get(
                window.location.pathname,
                cleanParams({
                    search:          searchTerm,
                    status:          statusFilter,
                    departamento_id: departamentoFilter,
                    perPage:         perPageFilter,
                }),
                { preserveState: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, departamentoFilter, perPageFilter]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setDepartamentoFilter('');
        setPerPageFilter('10');
    };

    // ── Formulario Inertia ─────────────────────────────────────────────────────
    const { data, setData, post, put, processing, errors, reset } = useForm(initialForm);

    // ── Filtros en cascada para el formulario ──────────────────────────────────
    const filteredSucursales = sucursales.filter(s => s.empresa_id === Number(data.empresa_id));
    const filteredDepartamentos = departamentos.filter(
        d => d.empresa_id === Number(data.empresa_id) && d.sucursal_id === Number(data.sucursal_id)
    );
    const filteredCargos = cargos.filter(c => c.departamento_id === Number(data.departamento_id));

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleCreateClick = () => {
        setEditingResponsable(null);
        reset();

        if (auth.user?.empresa_id) {
            setData(prev => ({
                ...prev,
                empresa_id: auth.user.empresa_id,
                sucursal_id: auth.user.sucursal_id || '',
                user_id: auth.user.id,
            }));
        }

        setIsModalOpen(true);
    };

    const handleEditClick = (resp: Responsable) => {
        setEditingResponsable(resp);
        setData({
            nombres:             resp.nombres || '',
            apellidos:           resp.apellidos || '',
            documento_identidad: resp.documento_identidad || '',
            pais_telefono_id:    resp.pais_telefono_id || '',
            telefono:            resp.telefono || '',
            correo:              resp.correo || '',
            empresa_id:          resp.empresa_id,
            sucursal_id:         resp.sucursal_id,
            departamento_id:     resp.departamento_id || '',
            cargo_id:            resp.cargo_id || '',
            user_id:             resp.user_id,
            status:              resp.status,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingResponsable) {
            put(`/admin/responsables/${editingResponsable.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingResponsable(null);
                    reset();
                    notifySuccess(__('Responsible updated successfully.'));
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        } else {
            post('/admin/responsables', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Responsible created successfully.'));
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        }
    };

    const handleToggleStatus = (resp: Responsable) => {
        router.patch(`/admin/responsables/${resp.id}/toggle-status`, {}, { preserveScroll: true });
    };

    const handleDeleteConfirm = () => {
        if (!deletingResponsable) {
return;
}

        router.delete(`/admin/responsables/${deletingResponsable.id}`, {
            onSuccess: () => {
                setDeletingResponsable(null);
                notifySuccess(__('Responsible deleted successfully.'));
            },
            onError: () => notifyError(__('There was an error deleting the responsible. Please try again.')),
        });
    };

    // ── Columnas de la tabla ───────────────────────────────────────────────────

    const columns: ColumnDef<Responsable>[] = [
        {
            header: __('Responsible'),
            accessorKey: 'nombres',
            className: 'font-medium',
            cell: (resp) => (
                <div className="flex items-center gap-3">
                    <EntityAvatar
                        name={`${resp.nombres} ${resp.apellidos}`}
                        firstName={resp.nombres}
                        lastName={resp.apellidos}
                        seed={resp.correo || `${resp.nombres} ${resp.apellidos}`}
                        status={resp.status === 1 ? 'active' : 'inactive'}
                        size="md"
                        shape="circle"
                    />
                    <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {resp.nombres} {resp.apellidos}
                        </p>
                        {resp.documento_identidad && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono mt-0.5">
                                <FileText className="w-3 h-3 shrink-0" />
                                <span>{resp.documento_identidad}</span>
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: __('Contact Info'),
            cell: (resp) => (
                <div className="space-y-0.5">
                    {resp.correo && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{resp.correo}</span>
                        </div>
                    )}
                    {resp.telefono && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" />
                            <span>
                                {resp.pais_telefono ? `+${resp.pais_telefono.codigo_telefonico} ` : ''}
                                {resp.telefono}
                            </span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            header: __('Department / Position'),
            cell: (resp) => (
                <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200">
                        <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{resp.departamento?.nombre ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>{resp.cargo?.nombre ?? '—'}</span>
                    </div>
                </div>
            ),
        },
        {
            header: __('Company / Branch'),
            hideOn: 'mobile',
            cell: (resp) => (
                <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{resp.empresa?.razon_social ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Tag className="w-3.5 h-3.5" />
                        <span>{resp.sucursal?.nombre ?? '—'}</span>
                    </div>
                </div>
            ),
        },
        {
            header: __('Assigned User'),
            hideOn: 'mobile',
            cell: (resp) => (
                <span className="text-xs font-medium text-muted-foreground">
                    {resp.user?.name ?? '—'}
                </span>
            ),
        },
        {
            header: __('Status'),
            stopRowClick: true,
            cell: (resp) => (
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={resp.status === 1}
                        onCheckedChange={() => handleToggleStatus(resp)}
                    />
                    <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full border',
                        resp.status === 1
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                            : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                    )}>
                        {resp.status === 1 ? __('Active') : __('Inactive')}
                    </span>
                </div>
            ),
        },
        {
            header: 'Actions',
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (resp) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(resp)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(resp)}>
                            <ToggleRight className="mr-2 h-4 w-4" />
                            {resp.status === 1 ? __('Deactivate') : __('Activate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setDeletingResponsable(resp)}
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
            <Head title={__('Responsibles')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<User className="h-6 w-6 text-white" />}
                    title={__('Responsibles')}
                    description={__('Manage responsibles, their departments, positions, contact info and system user.')}
                    colorClassName="bg-teal-600"
                >
                    <Button onClick={handleCreateClick}>
                        <Plus className="mr-2 h-4 w-4" />
                        {__('New Responsible')}
                    </Button>
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard
                        icon={<User className="h-6 w-6" />}
                        title={__('TOTAL RESPONSIBLES')}
                        value={stats.total}
                        colorClassName="bg-teal-100 text-teal-600"
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

                {/* Filtros + Conmutador Cuadrícula / Lista */}
                <FilterBar className="rounded-2xl">
                    <div className="flex flex-1 flex-wrap items-end gap-4">
                        <FilterField label={__('Search')}>
                            <Input
                                placeholder={__('Search by name, document, email...')}
                                className="w-full md:w-72 rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Department')}>
                            <Select
                                value={departamentoFilter || 'all'}
                                onValueChange={(v) => setDepartamentoFilter(v === 'all' ? '' : v)}
                            >
                                <SelectTrigger className="w-full md:w-52 rounded-xl">
                                    <SelectValue placeholder={__('All')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('All')}</SelectItem>
                                    {departamentos.map((dep) => (
                                        <SelectItem key={dep.id} value={String(dep.id)}>
                                            {dep.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>
                        <FilterField label={__('Status')}>
                            <Select
                                value={statusFilter || 'all'}
                                onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}
                            >
                                <SelectTrigger className="w-full md:w-36 rounded-xl">
                                    <SelectValue placeholder={__('All')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('All')}</SelectItem>
                                    <SelectItem value="1">{__('Active')}</SelectItem>
                                    <SelectItem value="0">{__('Inactive')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                        <FilterField label={__('Records per page')}>
                            <Select value={perPageFilter} onValueChange={setPerPageFilter}>
                                <SelectTrigger className="w-full md:w-32 rounded-xl">
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

                    <div className="flex items-center gap-2 shrink-0 self-end">
                        <ViewModeToggle
                            value={viewMode}
                            onChange={setViewMode}
                            activeColorClassName="text-teal-600 dark:text-teal-400"
                        />
                    </div>
                </FilterBar>

                {/* Contenido Principal: Cuadrícula o Lista */}
                {viewMode === 'grid' ? (
                    <div className="space-y-4">
                        {isTableLoading ? (
                            <CardGridSkeleton />
                        ) : responsables.data.length === 0 ? (
                            <GridEmptyState
                                icon={<User className="h-6 w-6" />}
                                title={__('No responsibles found')}
                                description={
                                    searchTerm || statusFilter || departamentoFilter
                                        ? __('Try clearing your search filters or changing your query.')
                                        : __('You have not registered any responsibles yet.')
                                }
                                hasActiveFilters={Boolean(searchTerm || statusFilter || departamentoFilter)}
                                onResetFilters={handleResetFilters}
                                ctaLabel={__('New Responsible')}
                                onCtaClick={handleCreateClick}
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {responsables.data.map((resp) => (
                                    <div
                                        key={resp.id}
                                        onClick={() => handleEditClick(resp)}
                                        className="group relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card text-card-foreground shadow-xs hover:shadow-md hover:border-teal-200/80 dark:hover:border-teal-800/60 transition-all overflow-hidden flex flex-col justify-between cursor-pointer"
                                    >
                                        <div
                                            className={cn(
                                                'h-1.5 w-full bg-gradient-to-r',
                                                resp.status === 1
                                                    ? 'from-teal-500 via-emerald-500 to-cyan-500'
                                                    : 'from-slate-400 to-slate-500'
                                            )}
                                        />

                                        <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                                            <div className="space-y-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3.5 min-w-0">
                                                        <EntityAvatar
                                                            name={`${resp.nombres} ${resp.apellidos}`}
                                                            firstName={resp.nombres}
                                                            lastName={resp.apellidos}
                                                            seed={resp.correo || `${resp.nombres} ${resp.apellidos}`}
                                                            status={resp.status === 1 ? 'active' : 'inactive'}
                                                            size="lg"
                                                            shape="circle"
                                                        />
                                                        <div className="min-w-0">
                                                            <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                                                                {resp.nombres} {resp.apellidos}
                                                            </h3>
                                                            {resp.documento_identidad && (
                                                                <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate">
                                                                    {resp.documento_identidad}
                                                                </p>
                                                            )}
                                                            {resp.correo && (
                                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                                                    <Mail className="h-3 w-3 shrink-0 text-sky-500" />
                                                                    <span className="truncate">{resp.correo}</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                                                <DropdownMenuItem onClick={() => handleEditClick(resp)}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    {__('Edit')}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleToggleStatus(resp)}>
                                                                    <ToggleRight className="mr-2 h-4 w-4" />
                                                                    {resp.status === 1 ? __('Deactivate') : __('Activate')}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => setDeletingResponsable(resp)}
                                                                    className="text-red-600 focus:text-red-600 dark:text-red-400"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    {__('Delete')}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span
                                                        className={cn(
                                                            'text-[11px] font-semibold px-2.5 py-0.5 rounded-full border',
                                                            resp.status === 1
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
                                                                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                        )}
                                                    >
                                                        {resp.status === 1 ? __('Active') : __('Inactive')}
                                                    </span>
                                                    {resp.departamento?.nombre && (
                                                        <Badge variant="secondary" className="text-[11px] rounded-full gap-1">
                                                            <Layers className="h-3 w-3 text-teal-600" />
                                                            {resp.departamento.nombre}
                                                        </Badge>
                                                    )}
                                                    {resp.cargo?.nombre && (
                                                        <Badge variant="outline" className="text-[11px] rounded-full gap-1">
                                                            <Briefcase className="h-3 w-3 text-indigo-500" />
                                                            {resp.cargo.nombre}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 p-3 space-y-1.5 text-xs text-muted-foreground">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="flex items-center gap-1.5 truncate font-medium text-slate-700 dark:text-slate-300">
                                                            <Building2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                            <span className="truncate">{resp.empresa?.razon_social ?? '—'}</span>
                                                        </span>
                                                        <span className="flex items-center gap-1 truncate shrink-0">
                                                            <Tag className="h-3 w-3 text-violet-500 shrink-0" />
                                                            {resp.sucursal?.nombre ?? '—'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        {resp.telefono ? (
                                                            <span className="flex items-center gap-1.5 font-mono text-[11px]">
                                                                <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                                                                {resp.pais_telefono ? `+${resp.pais_telefono.codigo_telefonico} ` : ''}
                                                                {resp.telefono}
                                                            </span>
                                                        ) : (
                                                            <span>—</span>
                                                        )}
                                                        {resp.user?.name && (
                                                            <span className="truncate text-[11px] font-medium">
                                                                {resp.user.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                onClick={(e) => e.stopPropagation()}
                                                className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={resp.status === 1}
                                                        onCheckedChange={() => handleToggleStatus(resp)}
                                                    />
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {resp.status === 1 ? __('Active') : __('Inactive')}
                                                    </span>
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditClick(resp)}
                                                    className="h-8 px-3 rounded-xl text-xs gap-1.5 hover:border-teal-300 hover:text-teal-700 dark:hover:text-teal-300"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                    {__('Edit')}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Pagination paginatedData={responsables} filters={currentFilters} />
                    </div>
                ) : (
                    <div className="w-full">
                        <DataTable
                            data={responsables}
                            columns={columns}
                            filters={currentFilters}
                            isLoading={isTableLoading}
                            onRowClick={(resp) => handleEditClick(resp)}
                            emptyState={{
                                title: 'No responsibles found',
                                description: searchTerm || statusFilter || departamentoFilter
                                    ? 'Try clearing your search filters or changing your query.'
                                    : 'You have not registered any responsibles yet.',
                                ctaLabel: 'New Responsible',
                                onCtaClick: handleCreateClick,
                            }}
                        />
                    </div>
                )}
            </div>

            {/* ── Modal Creación / Edición ────────────────────────────────────────────── */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>
                                {editingResponsable ? __('Edit Responsible') : __('New Responsible')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Fill out the details below to define a responsible in the organization.')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {/* Nombres */}
                            <div>
                                <Label htmlFor="nombres">{__('First Name')} *</Label>
                                <Input
                                    id="nombres"
                                    value={data.nombres}
                                    onChange={(e) => setData('nombres', e.target.value)}
                                    placeholder="Ej: Juan"
                                    required
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
                                    placeholder="Ej: Pérez"
                                    required
                                />
                                {errors.apellidos && (
                                    <p className="text-red-500 text-xs mt-1">{errors.apellidos}</p>
                                )}
                            </div>

                            {/* Documento Identidad */}
                            <div>
                                <Label htmlFor="documento_identidad">{__('Document / Tax ID')}</Label>
                                <Input
                                    id="documento_identidad"
                                    value={data.documento_identidad}
                                    onChange={(e) => setData('documento_identidad', e.target.value)}
                                    placeholder="Ej: V-12345678"
                                />
                                {errors.documento_identidad && (
                                    <p className="text-red-500 text-xs mt-1">{errors.documento_identidad}</p>
                                )}
                            </div>

                            {/* Correo Electrónico */}
                            <div>
                                <Label htmlFor="correo">{__('Email')}</Label>
                                <Input
                                    id="correo"
                                    type="email"
                                    value={data.correo}
                                    onChange={(e) => setData('correo', e.target.value)}
                                    placeholder="juan.perez@empresa.com"
                                />
                                {errors.correo && (
                                    <p className="text-red-500 text-xs mt-1">{errors.correo}</p>
                                )}
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
                                    placeholder="000-0000000"
                                    error={errors.telefono}
                                />
                            </div>

                            {/* Empresa */}
                            <div className="md:col-span-2">
                                <Label htmlFor="empresa_id">{__('Company')} *</Label>
                                <Select
                                    value={String(data.empresa_id)}
                                    onValueChange={(v) => {
                                        setData(prev => ({
                                            ...prev,
                                            empresa_id: v,
                                            sucursal_id: '',
                                            departamento_id: '',
                                            cargo_id: '',
                                        }));
                                    }}
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

                            {/* Sucursal */}
                            <div>
                                <Label htmlFor="sucursal_id">{__('Branch')} *</Label>
                                <Select
                                    value={String(data.sucursal_id)}
                                    onValueChange={(v) => {
                                        setData(prev => ({
                                            ...prev,
                                            sucursal_id: v,
                                            departamento_id: '',
                                            cargo_id: '',
                                        }));
                                    }}
                                    disabled={!data.empresa_id}
                                >
                                    <SelectTrigger id="sucursal_id" className="w-full">
                                        <SelectValue placeholder={data.empresa_id ? __('Select Branch') : __('Choose a company first')} />
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
                                <Label htmlFor="departamento_id">{__('Department')}</Label>
                                <Select
                                    value={data.departamento_id ? String(data.departamento_id) : 'none'}
                                    onValueChange={(v) => {
                                        setData(prev => ({
                                            ...prev,
                                            departamento_id: v === 'none' ? '' : v,
                                            cargo_id: '',
                                        }));
                                    }}
                                    disabled={!data.sucursal_id}
                                >
                                    <SelectTrigger id="departamento_id" className="w-full">
                                        <SelectValue placeholder={data.sucursal_id ? __('Select Department') : __('Choose a branch first')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">{__('None')}</SelectItem>
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

                            {/* Cargo */}
                            <div>
                                <Label htmlFor="cargo_id">{__('Position')}</Label>
                                <Select
                                    value={data.cargo_id ? String(data.cargo_id) : 'none'}
                                    onValueChange={(v) => setData('cargo_id', v === 'none' ? '' : v)}
                                    disabled={!data.departamento_id}
                                >
                                    <SelectTrigger id="cargo_id" className="w-full">
                                        <SelectValue placeholder={data.departamento_id ? __('Select Position') : __('Choose a department first')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">{__('None')}</SelectItem>
                                        {filteredCargos.map((cg) => (
                                            <SelectItem key={cg.id} value={String(cg.id)}>
                                                {cg.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.cargo_id && (
                                    <p className="text-red-500 text-xs mt-1">{errors.cargo_id}</p>
                                )}
                            </div>

                            {/* Usuario de Sistema */}
                            <div>
                                <Label htmlFor="user_id">{__('System User')} *</Label>
                                <Select
                                    value={String(data.user_id)}
                                    onValueChange={(v) => setData('user_id', v)}
                                >
                                    <SelectTrigger id="user_id" className="w-full">
                                        <SelectValue placeholder={__('Select User')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {usuarios.map((usr) => (
                                            <SelectItem key={usr.id} value={String(usr.id)}>
                                                {usr.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.user_id && (
                                    <p className="text-red-500 text-xs mt-1">{errors.user_id}</p>
                                )}
                            </div>

                            {/* Estado (Status) */}
                            <div className="md:col-span-2">
                                <Label htmlFor="status">{__('Status')}</Label>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch
                                        id="status"
                                        checked={data.status === 1}
                                        onCheckedChange={(checked) => setData('status', checked ? 1 : 0)}
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        {data.status === 1 ? __('Active') : __('Inactive')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                disabled={processing}
                            >
                                {__('Cancel')}
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? __('Saving...') : __('Save Changes')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── AlertDialog de confirmación de eliminación ──────────────────────────── */}
            <AlertDialog open={!!deletingResponsable} onOpenChange={(open) => !open && setDeletingResponsable(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{__('Delete Responsible')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {__('Are you sure you want to delete this responsible?')}{' '}
                            <strong>{deletingResponsable?.nombres} {deletingResponsable?.apellidos}</strong>?{' '}
                            {__(
                                'This action cannot be undone. This will also permanently delete their pending access authorizations.',
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
