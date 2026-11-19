import { Head, router, useForm } from '@inertiajs/react';
import {
    Copy,
    Crown,
    Key,
    Layers,
    LayoutGrid,
    List,
    MoreVertical,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    SlidersHorizontal,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams, cn } from '@/lib/utils';
import { notifyError } from '@/utils/notifications';
import { RoleFormModal } from './Partials/RoleFormModal';
import { SyncPermissionsModal } from './Partials/SyncPermissionsModal';
import type { RoleItem, RolesPageProps } from './Partials/types';

type ViewMode = 'grid' | 'list';

const VIEW_STORAGE_KEY = 'smurfit_roles_view_mode';

function getInitialViewMode(): ViewMode {
    if (typeof window === 'undefined') {
        return 'grid';
    }

    const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);

    return saved === 'list' ? 'list' : 'grid';
}

export default function RolesIndexPage({
    roles,
    stats,
    groupedPermissions,
    sectorMeta,
    moduleMeta,
    syncStatus,
    filters,
    can,
}: RolesPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Roles'), href: '/admin/roles' },
    ];

    const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [modalInstanceKey, setModalInstanceKey] = useState(0);
    const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
    const [deletingRole, setDeletingRole] = useState<RoleItem | null>(null);

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [filterType, setFilterType] = useState(filters.filter || 'all');
    const [sortValue, setSortValue] = useState(
        `${filters.sortBy || 'name'}:${filters.sortDir || 'asc'}`
    );

    const isFirstRender = useRef(true);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        permissions: [] as string[],
    });

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode);

        if (typeof window !== 'undefined') {
            window.localStorage.setItem(VIEW_STORAGE_KEY, mode);
        }
    };

    const applyServerFilters = (nextSearch: string, nextFilter: string, nextSort: string) => {
        const [sortBy, sortDir] = nextSort.split(':');
        router.get(
            window.location.pathname,
            cleanParams({
                search: nextSearch || undefined,
                filter: nextFilter !== 'all' ? nextFilter : undefined,
                sortBy: sortBy && sortBy !== 'name' ? sortBy : sortDir === 'desc' ? 'name' : undefined,
                sortDir: sortDir && (sortBy !== 'name' || sortDir === 'desc') ? sortDir : undefined,
            }),
            { preserveState: true, preserveScroll: true }
        );
    };

    // Debounce de búsqueda sin disparar recarga redundante en el primer montaje
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;

            return;
        }

        const timer = setTimeout(() => {
            applyServerFilters(searchTerm, filterType, sortValue);
        }, 300);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const handleFilterChange = (nextFilter: string) => {
        setFilterType(nextFilter);
        applyServerFilters(searchTerm, nextFilter, sortValue);
    };

    const handleSortChange = (nextSort: string) => {
        setSortValue(nextSort);
        applyServerFilters(searchTerm, filterType, nextSort);
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setFilterType('all');
        setSortValue('name:asc');
        router.get(window.location.pathname, {}, { preserveState: true, preserveScroll: true });
    };

    const handleCreateClick = () => {
        setEditingRole(null);
        clearErrors();
        reset();
        setModalInstanceKey((k) => k + 1);
        setIsModalOpen(true);
    };

    const handleEditClick = (role: RoleItem) => {
        setEditingRole(role);
        clearErrors();
        setData({
            name: role.name,
            permissions: role.all_permissions.map((p) => p.name),
        });
        setModalInstanceKey((k) => k + 1);
        setIsModalOpen(true);
    };

    const handleDuplicateRole = (role: RoleItem) => {
        router.post(
            `/admin/roles/${role.id}/duplicate`,
            {},
            {
                preserveScroll: true,
                onError: () => notifyError('No se pudo duplicar el rol.'),
            }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingRole) {
            if (editingRole.is_super_admin || !can.edit) {
                setIsModalOpen(false);

                return;
            }

            put(`/admin/roles/${editingRole.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingRole(null);
                    reset();
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        } else {
            post('/admin/roles', {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        }
    };

    const handleDeleteConfirm = () => {
        if (!deletingRole) {
            return;
        }

        router.delete(`/admin/roles/${deletingRole.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingRole(null);
            },
            onError: (err) => {
                notifyError(err.error || __('There was an error deleting the role.'));
            },
        });
    };

    const getAccentStripClass = (role: RoleItem) => {
        if (role.is_super_admin) {
            return 'from-amber-400 via-orange-500 to-rose-500';
        }

        if (role.coverage_percent >= 65) {
            return 'from-indigo-500 via-violet-500 to-purple-500';
        }

        if (role.coverage_percent > 0) {
            return 'from-sky-500 via-indigo-500 to-blue-600';
        }

        return 'from-slate-300 via-slate-400 to-slate-300 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700';
    };

    const hasActiveFilters = searchTerm !== '' || filterType !== 'all';

    return (
        <>
            <Head title={__('Roles')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Shield className="h-6 w-6 text-white" />}
                    title={__('Roles & Permissions')}
                    description={__('Manage user roles and assign permissions grouped by sector.')}
                    colorClassName="bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600"
                >
                    <div className="flex flex-wrap items-center gap-2">
                        {can.edit && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setIsSyncModalOpen(true)}
                                className="bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-sm gap-2 rounded-xl"
                            >
                                <RefreshCw className="h-4 w-4" />
                                <span>Sincronizar Permisos</span>
                                {syncStatus.pending_count > 0 ? (
                                    <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-400 text-amber-950 leading-none">
                                        {syncStatus.pending_count}
                                    </span>
                                ) : (
                                    <span
                                        className="h-2 w-2 rounded-full bg-emerald-400"
                                        title="Catálogo sincronizado"
                                    />
                                )}
                            </Button>
                        )}
                        {can.create && (
                            <Button
                                type="button"
                                onClick={handleCreateClick}
                                className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-sm gap-1.5 rounded-xl"
                            >
                                <Plus className="h-4 w-4" />
                                {__('New Role')}
                            </Button>
                        )}
                    </div>
                </ModuleHeader>

                {/* Banner informativo cuando hay permisos pendientes por sincronizar */}
                {can.edit && syncStatus.pending_count > 0 && (
                    <div className="rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 shrink-0">
                                <RefreshCw className="h-4 w-4" />
                            </div>
                            <div className="text-xs">
                                <p className="font-bold text-amber-950 dark:text-amber-200">
                                    Hay {syncStatus.pending_count} cambios de permisos detectados en el sistema
                                </p>
                                <p className="text-amber-800/80 dark:text-amber-300/80">
                                    {syncStatus.to_create.length} nuevos por crear y {syncStatus.to_update.length} por reorganizar por sector/módulo.
                                </p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => setIsSyncModalOpen(true)}
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shrink-0 text-xs"
                        >
                            Revisar y sincronizar
                        </Button>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard
                        icon={<Key className="h-5 w-5" />}
                        title={__('TOTAL ROLES')}
                        value={stats.total}
                        colorClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                    />
                    <StatCard
                        icon={<Shield className="h-5 w-5" />}
                        title={__('TOTAL SYSTEM PERMISSIONS')}
                        value={stats.permissions_total}
                        colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                    />
                    <StatCard
                        icon={<Users className="h-5 w-5" />}
                        title="USUARIOS CON ROL"
                        value={stats.assigned_users}
                        colorClassName="bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400"
                    />
                    <StatCard
                        icon={<Layers className="h-5 w-5" />}
                        title="SECTORES / MÓDULOS"
                        value={`${stats.sectors_count} / ${stats.modules_count}`}
                        colorClassName="bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400"
                    />
                </div>

                {/* Barra de Filtros y Conmutador Cuadrícula / Lista */}
                <FilterBar className="rounded-2xl">
                    <div className="flex flex-1 flex-wrap items-end gap-4 w-full">
                        <FilterField label={__('Search')} className="flex-1 min-w-[240px]">
                            <div className="relative">
                                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    placeholder="Buscar rol o permiso..."
                                    className="w-full pl-9 pr-8 rounded-xl"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
                                        title="Limpiar búsqueda"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </FilterField>

                        <FilterField label="Filtrar por" className="w-full sm:w-48">
                            <Select value={filterType} onValueChange={handleFilterChange}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los roles</SelectItem>
                                    <SelectItem value="with_users">Con usuarios asignados</SelectItem>
                                    <SelectItem value="without_users">Sin usuarios</SelectItem>
                                    <SelectItem value="system">Roles del sistema</SelectItem>
                                    <SelectItem value="custom">Personalizados</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Ordenar por" className="w-full sm:w-48">
                            <Select value={sortValue} onValueChange={handleSortChange}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="name:asc">Nombre (A - Z)</SelectItem>
                                    <SelectItem value="name:desc">Nombre (Z - A)</SelectItem>
                                    <SelectItem value="permissions_count:desc">Más permisos</SelectItem>
                                    <SelectItem value="users_count:desc">Más usuarios</SelectItem>
                                    <SelectItem value="updated_at:desc">Actualizados recientemente</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                    </div>

                    {/* Conmutador Cuadrícula / Lista */}
                    <div className="flex items-center gap-2 shrink-0 self-end">
                        <div
                            className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700"
                            role="group"
                            aria-label="Modo de visualización"
                        >
                            <button
                                type="button"
                                onClick={() => handleViewModeChange('grid')}
                                className={cn(
                                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                                    viewMode === 'grid'
                                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                                )}
                                title="Vista Cuadrícula"
                            >
                                <LayoutGrid className="h-4 w-4" />
                                <span>Cuadrícula</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleViewModeChange('list')}
                                className={cn(
                                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                                    viewMode === 'list'
                                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                                )}
                                title="Vista Lista"
                            >
                                <List className="h-4 w-4" />
                                <span>Lista</span>
                            </button>
                        </div>
                    </div>
                </FilterBar>

                {/* Contenido Principal: Estado Vacío / Cuadrícula / Lista */}
                {roles.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-card p-12 text-center space-y-3">
                        <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                No se encontraron roles
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                {hasActiveFilters
                                    ? 'No hay roles que coincidan con tu búsqueda o filtro actual.'
                                    : 'Aún no hay roles registrados en el sistema.'}
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-2">
                            {hasActiveFilters && (
                                <Button variant="outline" size="sm" onClick={handleResetFilters} className="rounded-xl">
                                    Limpiar filtros
                                </Button>
                            )}
                            {can.create && (
                                <Button size="sm" onClick={handleCreateClick} className="rounded-xl gap-1.5">
                                    <Plus className="h-4 w-4" />
                                    {__('New Role')}
                                </Button>
                            )}
                        </div>
                    </div>
                ) : viewMode === 'grid' ? (
                    /* ── Vista Cuadrícula ─────────────────────────────────────────────── */
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {roles.map((role) => {
                            const activeSectors = role.sector_breakdown.filter((s) => s.count > 0);
                            const visibleSectors = activeSectors.slice(0, 4);
                            const remainingSectors = Math.max(0, activeSectors.length - visibleSectors.length);

                            return (
                                <div
                                    key={role.id}
                                    className="group relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card text-card-foreground shadow-xs hover:shadow-md hover:border-indigo-200/80 dark:hover:border-indigo-800/60 transition-all overflow-hidden flex flex-col justify-between"
                                >
                                    {/* Barra superior de acento */}
                                    <div
                                        className={cn('h-1.5 w-full bg-gradient-to-r', getAccentStripClass(role))}
                                    />

                                    <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                                        <div>
                                            {/* Header Tarjeta */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <div
                                                        className={cn(
                                                            'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border',
                                                            role.is_super_admin
                                                                ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/60'
                                                                : 'bg-indigo-50 text-indigo-600 border-indigo-200/70 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800/60'
                                                        )}
                                                    >
                                                        {role.is_super_admin ? (
                                                            <Crown className="h-5 w-5" />
                                                        ) : (
                                                            <Shield className="h-5 w-5" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="font-bold text-base capitalize truncate text-slate-900 dark:text-white">
                                                                {role.name}
                                                            </h3>
                                                            {role.is_super_admin ? (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60">
                                                                    Super Admin
                                                                </span>
                                                            ) : role.is_system ? (
                                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                                                    Sistema
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60">
                                                                    Personalizado
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {role.users_count}{' '}
                                                            {role.users_count === 1 ? __('user') : __('users')} · Act.{' '}
                                                            {role.updated_at_human}
                                                        </p>
                                                    </div>
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg shrink-0"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                                        <DropdownMenuItem onClick={() => handleEditClick(role)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            {role.is_super_admin || !can.edit
                                                                ? 'Ver permisos'
                                                                : __('Edit')}
                                                        </DropdownMenuItem>
                                                        {can.create && (
                                                            <DropdownMenuItem onClick={() => handleDuplicateRole(role)}>
                                                                <Copy className="mr-2 h-4 w-4" />
                                                                Duplicar rol
                                                            </DropdownMenuItem>
                                                        )}
                                                        {!role.is_super_admin && can.delete && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => setDeletingRole(role)}
                                                                    className="text-rose-600 focus:text-rose-600 dark:text-rose-400"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    {__('Delete')}
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {/* Barra de Cobertura */}
                                            <div className="mt-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 p-3 space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                                                        Cobertura de permisos
                                                    </span>
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {role.permissions_count} / {stats.permissions_total}{' '}
                                                        <span className="text-indigo-600 dark:text-indigo-400">
                                                            ({role.coverage_percent}%)
                                                        </span>
                                                    </span>
                                                </div>
                                                <Progress value={role.coverage_percent} className="h-2" />
                                            </div>

                                            {/* Chips por Sector */}
                                            <div className="mt-4 space-y-1.5">
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                    Sectores activos
                                                </span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {role.is_super_admin ? (
                                                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
                                                            Acceso Total ({stats.permissions_total} permisos)
                                                        </span>
                                                    ) : activeSectors.length > 0 ? (
                                                        <>
                                                            {visibleSectors.map((sec) => (
                                                                <span
                                                                    key={sec.sector}
                                                                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
                                                                >
                                                                    <span>{sec.label}</span>
                                                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                                                        {sec.count}/{sec.total}
                                                                    </span>
                                                                </span>
                                                            ))}
                                                            {remainingSectors > 0 && (
                                                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-muted text-muted-foreground">
                                                                    +{remainingSectors} más
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">
                                                            {__('No permissions assigned')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Tarjeta: Usuarios + CTA */}
                                        <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                                            <div className="flex items-center -space-x-2 overflow-hidden min-h-8">
                                                {role.users.map((user) => (
                                                    <div
                                                        key={user.id}
                                                        title={`${user.name}${user.email ? ` (${user.email})` : ''}`}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-card bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-bold shadow-2xs"
                                                    >
                                                        {user.initials}
                                                    </div>
                                                ))}
                                                {role.more_users_count > 0 && (
                                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-card bg-muted text-xs font-bold text-muted-foreground">
                                                        +{role.more_users_count}
                                                    </div>
                                                )}
                                                {role.users_count === 0 && (
                                                    <span className="text-xs text-muted-foreground italic">
                                                        {__('No users assigned')}
                                                    </span>
                                                )}
                                            </div>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditClick(role)}
                                                className="h-8 px-3 rounded-xl text-xs gap-1.5 shrink-0 hover:border-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-300"
                                            >
                                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                                {role.is_super_admin || !can.edit ? 'Ver detalle' : 'Configurar'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* ── Vista Lista ──────────────────────────────────────────────────── */
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card shadow-xs overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/80 dark:bg-slate-900/60">
                                <TableRow>
                                    <TableHead className="w-[240px]">Rol</TableHead>
                                    <TableHead>Usuarios</TableHead>
                                    <TableHead className="w-[220px]">Cobertura</TableHead>
                                    <TableHead className="hidden lg:table-cell">Sectores Activos</TableHead>
                                    <TableHead className="text-right w-[160px]">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.map((role) => {
                                    const activeSectors = role.sector_breakdown.filter((s) => s.count > 0);
                                    const visibleSectors = activeSectors.slice(0, 3);
                                    const remainingSectors = Math.max(
                                        0,
                                        activeSectors.length - visibleSectors.length
                                    );

                                    return (
                                        <TableRow
                                            key={role.id}
                                            onClick={() => handleEditClick(role)}
                                            className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={cn(
                                                            'h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border',
                                                            role.is_super_admin
                                                                ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/60'
                                                                : 'bg-indigo-50 text-indigo-600 border-indigo-200/70 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800/60'
                                                        )}
                                                    >
                                                        {role.is_super_admin ? (
                                                            <Crown className="h-4 w-4" />
                                                        ) : (
                                                            <Shield className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-sm capitalize text-slate-900 dark:text-white truncate">
                                                                {role.name}
                                                            </span>
                                                            {role.is_super_admin ? (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                                                    Super Admin
                                                                </span>
                                                            ) : role.is_system ? (
                                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                    Sistema
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <span className="text-[11px] text-muted-foreground">
                                                            Act. {role.updated_at_human}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex items-center -space-x-2">
                                                        {role.users.slice(0, 3).map((user) => (
                                                            <div
                                                                key={user.id}
                                                                title={user.name}
                                                                className="inline-flex items-center justify-center w-7 h-7 rounded-full border-2 border-card bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[11px] font-bold"
                                                            >
                                                                {user.initials}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                                        {role.users_count}{' '}
                                                        {role.users_count === 1 ? __('user') : __('users')}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                            {role.permissions_count}/{stats.permissions_total}
                                                        </span>
                                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                                            {role.coverage_percent}%
                                                        </span>
                                                    </div>
                                                    <Progress value={role.coverage_percent} className="h-1.5" />
                                                </div>
                                            </TableCell>

                                            <TableCell className="hidden lg:table-cell">
                                                <div className="flex flex-wrap gap-1">
                                                    {role.is_super_admin ? (
                                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
                                                            Acceso Total ({stats.permissions_total})
                                                        </span>
                                                    ) : activeSectors.length > 0 ? (
                                                        <>
                                                            {visibleSectors.map((sec) => (
                                                                <span
                                                                    key={sec.sector}
                                                                    className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
                                                                >
                                                                    {sec.label} ({sec.count})
                                                                </span>
                                                            ))}
                                                            {remainingSectors > 0 && (
                                                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                                    +{remainingSectors}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">
                                                            Sin permisos
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell
                                                className="text-right"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="inline-flex items-center justify-end gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg text-slate-600 hover:text-indigo-600 dark:text-slate-400"
                                                        onClick={() => handleEditClick(role)}
                                                        title={
                                                            role.is_super_admin || !can.edit
                                                                ? 'Ver permisos'
                                                                : __('Edit')
                                                        }
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    {can.create && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg text-slate-600 hover:text-emerald-600 dark:text-slate-400"
                                                            onClick={() => handleDuplicateRole(role)}
                                                            title="Duplicar rol"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {!role.is_super_admin && can.delete && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                                            onClick={() => setDeletingRole(role)}
                                                            title={__('Delete')}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Modal Estudio de Roles y Permisos */}
            <RoleFormModal
                key={`${modalInstanceKey}-${editingRole ? editingRole.id : 'new'}`}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                editingRole={editingRole}
                readOnly={Boolean(editingRole) && !can.edit}
                roles={roles}
                groupedPermissions={groupedPermissions}
                sectorMeta={sectorMeta}
                moduleMeta={moduleMeta}
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={handleSubmit}
            />

            {/* Modal de Sincronización de Permisos */}
            <SyncPermissionsModal
                open={isSyncModalOpen}
                onOpenChange={setIsSyncModalOpen}
                syncStatus={syncStatus}
                sectorMeta={sectorMeta}
                moduleMeta={moduleMeta}
            />

            {/* AlertDialog de Confirmación para eliminar */}
            <AlertDialog open={!!deletingRole} onOpenChange={(open) => !open && setDeletingRole(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{__('Delete Role')}</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <span className="block">
                                {__('Are you sure you want to delete the role')}{' '}
                                <strong>{deletingRole?.name}</strong>?{' '}
                                {__('This action cannot be undone and will unassign it from all users.')}
                            </span>
                            {deletingRole && deletingRole.users_count > 0 && (
                                <span className="block text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-2">
                                    Atención: este rol está actualmente asignado a {deletingRole.users_count}{' '}
                                    {deletingRole.users_count === 1 ? 'usuario' : 'usuarios'}.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">{__('Cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                        >
                            {__('Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
