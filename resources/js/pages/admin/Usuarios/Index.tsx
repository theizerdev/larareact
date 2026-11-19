import { Head, router, useForm } from '@inertiajs/react';
import {
    Building2,
    CheckCircle,
    Copy,
    GitBranch,
    LayoutGrid,
    List,
    Lock,
    Mail,
    MoreVertical,
    Pencil,
    Phone,
    Plus,
    Search,
    ShieldAlert,
    ShieldCheck,
    ToggleRight,
    Trash2,
    Unlock,
    User as UserIcon,
    X,
    XCircle,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams, cn } from '@/lib/utils';
import { notifyError } from '@/utils/notifications';
import {
    isPrivilegedRoleName
    
    
    
} from './Partials/types';
import type {UserFormState, UserItem, UsersPageProps} from './Partials/types';
import { UserAvatar } from './Partials/UserAvatar';
import { UserFormModal } from './Partials/UserFormModal';

type ViewMode = 'grid' | 'list';

const VIEW_STORAGE_KEY = 'smurfit_usuarios_view_mode';

function getInitialViewMode(): ViewMode {
    if (typeof window === 'undefined') {
        return 'grid';
    }

    const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);

    return saved === 'list' ? 'list' : 'grid';
}

const initialForm: UserFormState = {
    name: '',
    username: '',
    email: '',
    password: '',
    telefono: '',
    pais_telefono_id: '',
    status: 'activo',
    empresa_id: '',
    sucursal_id: '',
    roles: [],
};

export default function UsersIndexPage({
    auth,
    users,
    stats,
    roles,
    empresas,
    sucursales,
    paises,
    filters,
    soxPolicies,
    can,
}: UsersPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Users'), href: '/admin/usuarios' },
    ];

    const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInstanceKey, setModalInstanceKey] = useState(0);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [duplicatingUser, setDuplicatingUser] = useState<UserItem | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
    const [isTableLoading, setIsTableLoading] = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [empresaFilter, setEmpresaFilter] = useState(filters.empresa_id || '');
    const [perPageFilter, setPerPageFilter] = useState(String(filters.perPage || '12'));
    const [sortValue, setSortValue] = useState(
        `${filters.sortBy || 'created_at'}:${filters.sortDir || 'desc'}`
    );

    const isFirstRender = useRef(true);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<UserFormState>(initialForm);

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode);

        if (typeof window !== 'undefined') {
            window.localStorage.setItem(VIEW_STORAGE_KEY, mode);
        }
    };

    const buildQueryFilters = (
        nextSearch = searchTerm,
        nextStatus = statusFilter,
        nextRole = roleFilter,
        nextEmpresa = empresaFilter,
        nextPerPage = perPageFilter,
        nextSort = sortValue
    ) => {
        const [sortBy, sortDir] = nextSort.split(':');

        return cleanParams({
            search: nextSearch || undefined,
            status: nextStatus || undefined,
            role: nextRole || undefined,
            empresa_id: nextEmpresa || undefined,
            perPage: nextPerPage !== '12' ? nextPerPage : undefined,
            sortBy: sortBy && sortBy !== 'created_at' ? sortBy : sortDir === 'asc' ? 'created_at' : undefined,
            sortDir: sortDir && (sortBy !== 'created_at' || sortDir === 'asc') ? sortDir : undefined,
        });
    };

    const currentFilters = buildQueryFilters();

    const applyServerFilters = (
        nextSearch: string,
        nextStatus: string,
        nextRole: string,
        nextEmpresa: string,
        nextPerPage: string,
        nextSort: string
    ) => {
        router.get(
            window.location.pathname,
            buildQueryFilters(nextSearch, nextStatus, nextRole, nextEmpresa, nextPerPage, nextSort),
            { preserveState: true, preserveScroll: true }
        );
    };

    useEffect(() => {
        const unbindStart = router.on('start', () => setIsTableLoading(true));
        const unbindFinish = router.on('finish', () => setIsTableLoading(false));

        return () => {
            unbindStart();
            unbindFinish();
        };
    }, []);

    // Debounce solo al cambiar searchTerm (evita disparo inicial al montar)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;

            return;
        }

        const timer = setTimeout(() => {
            applyServerFilters(searchTerm, statusFilter, roleFilter, empresaFilter, perPageFilter, sortValue);
        }, 300);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setRoleFilter('');
        setEmpresaFilter('');
        setPerPageFilter('12');
        setSortValue('created_at:desc');
        router.get(window.location.pathname, {}, { preserveState: true, preserveScroll: true });
    };

    const handleCreateClick = () => {
        setEditingUser(null);
        setDuplicatingUser(null);
        clearErrors();
        reset();
        setModalInstanceKey((k) => k + 1);
        setIsModalOpen(true);
    };

    const handleEditClick = (user: UserItem) => {
        if (!can.edit) {
            return;
        }

        setEditingUser(user);
        setDuplicatingUser(null);
        clearErrors();
        setData({
            name: user.name,
            username: user.username || '',
            email: user.email,
            password: '',
            telefono: user.telefono || '',
            pais_telefono_id: user.pais_telefono_id || '',
            status: user.status,
            empresa_id: user.empresa_id || '',
            sucursal_id: user.sucursal_id || '',
            roles: user.roles.map((r) => r.name),
        });
        setModalInstanceKey((k) => k + 1);
        setIsModalOpen(true);
    };

    const handleDuplicateClick = (user: UserItem) => {
        if (!can.create) {
            return;
        }

        setEditingUser(null);
        setDuplicatingUser(user);
        clearErrors();
        setData({
            name: `${user.name} (${__('Copy')})`,
            username: user.username ? `${user.username}_copia` : '',
            email: '',
            password: '',
            telefono: user.telefono || '',
            pais_telefono_id: user.pais_telefono_id || '',
            status: user.status,
            empresa_id: user.empresa_id || '',
            sucursal_id: user.sucursal_id || '',
            roles: user.roles.map((r) => r.name),
        });
        setModalInstanceKey((k) => k + 1);
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingUser) {
            put(`/admin/usuarios/${editingUser.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingUser(null);
                    setDuplicatingUser(null);
                    reset();
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        } else {
            post('/admin/usuarios', {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    setDuplicatingUser(null);
                    reset();
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        }
    };

    const handleToggleStatus = (user: UserItem) => {
        if (!can.edit) {
            return;
        }

        router.patch(`/admin/usuarios/${user.id}/toggle-status`, {}, { preserveScroll: true });
    };

    const handleUnlockUser = (user: UserItem) => {
        if (!can.sox_manage) {
            return;
        }

        router.post(`/admin/seguridad/sox/users/${user.id}/unlock`, {}, { preserveScroll: true });
    };

    const handleDeleteConfirm = () => {
        if (!deletingUser) {
            return;
        }

        router.delete(`/admin/usuarios/${deletingUser.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingUser(null);
            },
            onError: () => notifyError(__('There was an error deleting the user. Please try again.')),
        });
    };

    const getAccentStripClass = (user: UserItem) => {
        if (user.is_super_admin) {
            return 'from-amber-400 via-orange-500 to-rose-500';
        }

        if (user.is_locked || user.status === 'suspendido') {
            return 'from-rose-500 via-red-500 to-orange-500';
        }

        if (user.status === 'activo') {
            return 'from-emerald-500 via-indigo-500 to-violet-500';
        }

        return 'from-slate-300 via-slate-400 to-slate-300 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700';
    };

    const getStatusBadgeClass = (status: UserItem['status']) => {
        if (status === 'activo') {
            return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900';
        }

        if (status === 'suspendido') {
            return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900';
        }

        return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800';
    };

    const formatPhone = (user: UserItem) => {
        if (!user.telefono) {
            return '—';
        }

        const prefix = user.pais_telefono?.codigo_telefonico;

        return prefix ? `${prefix} ${user.telefono}` : user.telefono;
    };

    const hasActiveFilters = Boolean(searchTerm || statusFilter || roleFilter || empresaFilter);

    // ── Columnas para Vista Lista (DataTable) ──────────────────────────────────
    const columns: ColumnDef<UserItem>[] = [
        {
            header: __('User'),
            accessorKey: 'name',
            className: 'font-medium',
            cell: (user) => (
                <div className="flex items-center gap-3">
                    <UserAvatar
                        name={user.name}
                        email={user.email}
                        status={user.status}
                        isLocked={user.is_locked}
                        isSuperAdmin={user.is_super_admin}
                        size="sm"
                        showStatusDot
                    />
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-sm text-slate-900 dark:text-white leading-tight truncate">
                                {user.name}
                            </p>
                            {user.is_locked && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                    <Lock className="h-2.5 w-2.5" />
                                    Bloqueado
                                </span>
                            )}
                            {!user.is_locked && user.is_expired && (
                                <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                    Clave expirada
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 truncate">
                            {user.username && <span className="font-mono text-[11px]">@{user.username}</span>}
                            {user.username && <span>·</span>}
                            <span className="truncate">{user.email}</span>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            header: __('Role'),
            cell: (user) => (
                <div className="flex flex-wrap gap-1">
                    {user.roles.map((r) => {
                        const privileged = isPrivilegedRoleName(r.name);

                        return (
                            <Badge
                                key={r.id}
                                variant="secondary"
                                className={cn(
                                    'capitalize text-[10px]',
                                    privileged &&
                                        'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60'
                                )}
                            >
                                {r.name}
                            </Badge>
                        );
                    })}
                    {user.roles.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                </div>
            ),
        },
        {
            header: __('Company / Branch'),
            hideOn: 'mobile',
            cell: (user) => (
                <div className="space-y-1">
                    {user.empresa && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate max-w-[200px]">{user.empresa.razon_social}</span>
                        </div>
                    )}
                    {user.sucursal && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <GitBranch className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                            <span className="truncate max-w-[200px]">{user.sucursal.nombre}</span>
                        </div>
                    )}
                    {!user.empresa && !user.sucursal && <span className="text-xs text-muted-foreground">—</span>}
                </div>
            ),
        },
        {
            header: __('Phone'),
            hideOn: 'tablet',
            cell: (user) => (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    {formatPhone(user)}
                </span>
            ),
        },
        {
            header: __('Status'),
            stopRowClick: true,
            cell: (user) => (
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={user.status === 'activo'}
                        disabled={!can.edit}
                        onCheckedChange={() => handleToggleStatus(user)}
                    />
                    <span
                        className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full border capitalize',
                            getStatusBadgeClass(user.status)
                        )}
                    >
                        {__(user.status)}
                    </span>
                </div>
            ),
        },
        {
            header: 'Actions',
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (user) => (
                <div className="inline-flex items-center justify-end gap-1">
                    {can.edit && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-600 hover:text-indigo-600 dark:text-slate-400"
                            onClick={() => handleEditClick(user)}
                            title={__('Edit')}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl">
                            {can.edit && (
                                <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    {__('Edit')}
                                </DropdownMenuItem>
                            )}
                            {can.create && (
                                <DropdownMenuItem onClick={() => handleDuplicateClick(user)}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    {__('Duplicate')}
                                </DropdownMenuItem>
                            )}
                            {user.is_locked && can.sox_manage && (
                                <DropdownMenuItem onClick={() => handleUnlockUser(user)} className="text-amber-600">
                                    <Unlock className="mr-2 h-4 w-4" />
                                    Desbloquear SOX
                                </DropdownMenuItem>
                            )}
                            {can.edit && (
                                <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                    <ToggleRight className="mr-2 h-4 w-4" />
                                    {user.status === 'activo' ? __('Deactivate') : __('Activate')}
                                </DropdownMenuItem>
                            )}
                            {can.delete && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => setDeletingUser(user)}
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
            ),
        },
    ];

    return (
        <>
            <Head title={__('Users')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<UserIcon className="h-6 w-6 text-white" />}
                    title={__('Users')}
                    description={__('Manage system users, passwords, access status and roles.')}
                    colorClassName="bg-gradient-to-r from-slate-800 via-indigo-700 to-indigo-600"
                >
                    <div className="flex flex-wrap items-center gap-2">
                        {can.sox && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => router.get('/admin/seguridad/sox')}
                                className="bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-sm gap-1.5 text-xs rounded-xl"
                            >
                                <ShieldCheck className="size-4 text-emerald-300" />
                                Cumplimiento SOX
                            </Button>
                        )}
                        {can.create && (
                            <Button
                                type="button"
                                onClick={handleCreateClick}
                                className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-sm gap-1.5 rounded-xl"
                            >
                                <Plus className="h-4 w-4" />
                                {__('New User')}
                            </Button>
                        )}
                    </div>
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard
                        icon={<UserIcon className="h-5 w-5" />}
                        title={__('TOTAL USERS')}
                        value={stats.total}
                        colorClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                    />
                    <StatCard
                        icon={<CheckCircle className="h-5 w-5" />}
                        title={__('ACTIVE')}
                        value={stats.activos}
                        colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                    />
                    <StatCard
                        icon={<XCircle className="h-5 w-5" />}
                        title="INACTIVOS / SUSPENDIDOS"
                        value={stats.inactivos + stats.suspendidos}
                        colorClassName="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    />
                    <StatCard
                        icon={<ShieldAlert className="h-5 w-5" />}
                        title="BLOQUEADOS SOX"
                        value={stats.bloqueados}
                        colorClassName="bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                    />
                </div>

                {/* Filtros + Conmutador Cuadrícula / Lista */}
                <FilterBar className="rounded-2xl">
                    <div className="flex flex-1 flex-wrap items-end gap-3.5 w-full">
                        <FilterField label={__('Search')} className="flex-1 min-w-[220px]">
                            <div className="relative">
                                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    placeholder={__('Search by name, email...')}
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

                        <FilterField label={__('Role')} className="w-full sm:w-44">
                            <Select
                                value={roleFilter || 'all'}
                                onValueChange={(v) => {
                                    const next = v === 'all' ? '' : v;
                                    setRoleFilter(next);
                                    applyServerFilters(searchTerm, statusFilter, next, empresaFilter, perPageFilter, sortValue);
                                }}
                            >
                                <SelectTrigger className="w-full rounded-xl">
                                    <SelectValue placeholder={__('All roles')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('All roles')}</SelectItem>
                                    {roles.map((r) => (
                                        <SelectItem key={r.id} value={r.name}>
                                            <span className="capitalize">{r.name}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={__('Company')} className="w-full sm:w-48">
                            <Select
                                value={empresaFilter || 'all'}
                                onValueChange={(v) => {
                                    const next = v === 'all' ? '' : v;
                                    setEmpresaFilter(next);
                                    applyServerFilters(searchTerm, statusFilter, roleFilter, next, perPageFilter, sortValue);
                                }}
                            >
                                <SelectTrigger className="w-full rounded-xl">
                                    <SelectValue placeholder={__('All companies')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('All companies')}</SelectItem>
                                    {empresas.map((emp) => (
                                        <SelectItem key={emp.id} value={String(emp.id)}>
                                            {emp.razon_social}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={__('Status')} className="w-full sm:w-36">
                            <Select
                                value={statusFilter || 'all'}
                                onValueChange={(v) => {
                                    const next = v === 'all' ? '' : v;
                                    setStatusFilter(next);
                                    applyServerFilters(searchTerm, next, roleFilter, empresaFilter, perPageFilter, sortValue);
                                }}
                            >
                                <SelectTrigger className="w-full rounded-xl">
                                    <SelectValue placeholder={__('All')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('All')}</SelectItem>
                                    <SelectItem value="activo">{__('Active')}</SelectItem>
                                    <SelectItem value="inactivo">{__('Inactive')}</SelectItem>
                                    <SelectItem value="suspendido">{__('Suspended')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Ordenar" className="w-full sm:w-40">
                            <Select
                                value={sortValue}
                                onValueChange={(v) => {
                                    setSortValue(v);
                                    applyServerFilters(searchTerm, statusFilter, roleFilter, empresaFilter, perPageFilter, v);
                                }}
                            >
                                <SelectTrigger className="w-full rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="created_at:desc">Más recientes</SelectItem>
                                    <SelectItem value="name:asc">Nombre (A - Z)</SelectItem>
                                    <SelectItem value="name:desc">Nombre (Z - A)</SelectItem>
                                    <SelectItem value="status:asc">Estado</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Mostrar" className="w-full sm:w-24">
                            <Select
                                value={perPageFilter}
                                onValueChange={(v) => {
                                    setPerPageFilter(v);
                                    applyServerFilters(searchTerm, statusFilter, roleFilter, empresaFilter, v, sortValue);
                                }}
                            >
                                <SelectTrigger className="w-full rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="12">12</SelectItem>
                                    <SelectItem value="24">24</SelectItem>
                                    <SelectItem value="48">48</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
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

                {/* Contenido Principal: Cuadrícula o Lista */}
                {viewMode === 'grid' ? (
                    <div className="space-y-4">
                        {isTableLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {Array.from({ length: 6 }).map((_, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card p-5 space-y-4 animate-pulse"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                                            <div className="space-y-2 flex-1">
                                                <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                                                <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
                                            </div>
                                        </div>
                                        <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-900" />
                                    </div>
                                ))}
                            </div>
                        ) : users.data.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-card p-12 text-center space-y-3">
                                <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                    <UserIcon className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        {__('No users found')}
                                    </h3>
                                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                        {hasActiveFilters
                                            ? __('Try clearing your search filters or changing your query.')
                                            : __('You have not registered any users yet.')}
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
                                            {__('New User')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {users.data.map((user) => (
                                    <div
                                        key={user.id}
                                        className="group relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card text-card-foreground shadow-xs hover:shadow-md hover:border-indigo-200/80 dark:hover:border-indigo-800/60 transition-all overflow-hidden flex flex-col justify-between"
                                    >
                                        {/* Barra de acento superior */}
                                        <div
                                            className={cn(
                                                'h-1.5 w-full bg-gradient-to-r',
                                                getAccentStripClass(user)
                                            )}
                                        />

                                        <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                                            <div className="space-y-4">
                                                {/* Cabecera: Avatar Iniciales + Nombre + Menú */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3.5 min-w-0">
                                                        <UserAvatar
                                                            name={user.name}
                                                            email={user.email}
                                                            status={user.status}
                                                            isLocked={user.is_locked}
                                                            isSuperAdmin={user.is_super_admin}
                                                            size="lg"
                                                            showStatusDot
                                                        />
                                                        <div className="min-w-0">
                                                            <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                                                                {user.name}
                                                            </h3>
                                                            {user.username && (
                                                                <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 truncate">
                                                                    @{user.username}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                                                <Mail className="h-3 w-3 shrink-0" />
                                                                <span className="truncate">{user.email}</span>
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
                                                            {can.edit && (
                                                                <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    {__('Edit')}
                                                                </DropdownMenuItem>
                                                            )}
                                                            {can.create && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDuplicateClick(user)}
                                                                >
                                                                    <Copy className="mr-2 h-4 w-4" />
                                                                    {__('Duplicate')}
                                                                </DropdownMenuItem>
                                                            )}
                                                            {user.is_locked && can.sox_manage && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleUnlockUser(user)}
                                                                    className="text-amber-600"
                                                                >
                                                                    <Unlock className="mr-2 h-4 w-4" />
                                                                    Desbloquear SOX
                                                                </DropdownMenuItem>
                                                            )}
                                                            {can.edit && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleToggleStatus(user)}
                                                                >
                                                                    <ToggleRight className="mr-2 h-4 w-4" />
                                                                    {user.status === 'activo'
                                                                        ? __('Deactivate')
                                                                        : __('Activate')}
                                                                </DropdownMenuItem>
                                                            )}
                                                            {can.delete && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => setDeletingUser(user)}
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

                                                {/* Alertas SOX o badges de Estado y Roles */}
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span
                                                        className={cn(
                                                            'text-[11px] font-semibold px-2.5 py-0.5 rounded-full border capitalize',
                                                            getStatusBadgeClass(user.status)
                                                        )}
                                                    >
                                                        {__(user.status)}
                                                    </span>

                                                    {user.is_locked && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60">
                                                            <Lock className="h-3 w-3" />
                                                            Bloqueado {user.lockout_remaining_minutes ?? 0}m
                                                        </span>
                                                    )}

                                                    {!user.is_locked && user.is_expired && (
                                                        <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60">
                                                            Clave expirada
                                                        </span>
                                                    )}

                                                    {user.roles.map((r) => {
                                                        const privileged = isPrivilegedRoleName(r.name);

                                                        return (
                                                            <Badge
                                                                key={r.id}
                                                                variant="secondary"
                                                                className={cn(
                                                                    'capitalize text-[11px] rounded-full',
                                                                    privileged &&
                                                                        'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60'
                                                                )}
                                                            >
                                                                {r.name}
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>

                                                {/* Organización y Contacto */}
                                                <div className="rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 p-3 space-y-1.5 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-2 truncate">
                                                        <Building2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                        <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                                                            {user.empresa?.razon_social || 'Sin empresa asignada'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2 truncate">
                                                            <GitBranch className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                                                            <span className="truncate">
                                                                {user.sucursal?.nombre || 'Sin sucursal'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
                                                            <Phone className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                                            <span>{formatPhone(user)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer Tarjeta */}
                                            <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={user.status === 'activo'}
                                                        disabled={!can.edit}
                                                        onCheckedChange={() => handleToggleStatus(user)}
                                                    />
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {user.created_at_human ? `Alta ${user.created_at_human}` : __(user.status)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    {user.is_locked && can.sox_manage && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleUnlockUser(user)}
                                                            className="h-8 px-2.5 rounded-xl text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300"
                                                        >
                                                            <Unlock className="h-3.5 w-3.5" />
                                                            Desbloquear
                                                        </Button>
                                                    )}
                                                    {can.edit && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEditClick(user)}
                                                            className="h-8 px-3 rounded-xl text-xs gap-1.5 hover:border-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-300"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                            {__('Edit')}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Pagination paginatedData={users} filters={currentFilters} />
                    </div>
                ) : (
                    /* ── Vista Lista (DataTable) ──────────────────────────────────────── */
                    <div className="w-full">
                        <DataTable
                            data={users}
                            columns={columns}
                            filters={currentFilters}
                            isLoading={isTableLoading}
                            onRowClick={can.edit ? (user) => handleEditClick(user) : undefined}
                            emptyState={{
                                title: 'No users found',
                                description: hasActiveFilters
                                    ? 'Try clearing your search filters or changing your query.'
                                    : 'You have not registered any users yet.',
                                ctaLabel: can.create ? 'New User' : undefined,
                                onCtaClick: can.create ? handleCreateClick : undefined,
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Modal Modernizado de Creación / Edición */}
            <UserFormModal
                key={`${modalInstanceKey}-${editingUser ? editingUser.id : 'new'}`}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                auth={auth}
                editingUser={editingUser}
                duplicatingUser={duplicatingUser}
                roles={roles}
                empresas={empresas}
                sucursales={sucursales}
                paises={paises}
                soxPolicies={soxPolicies}
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={handleSubmit}
            />

            {/* AlertDialog de confirmación de eliminación */}
            <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{__('Delete User')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {__('Are you sure you want to delete the user')}{' '}
                            <strong>{deletingUser?.name}</strong>?{' '}
                            {__('This action cannot be undone.')}
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
