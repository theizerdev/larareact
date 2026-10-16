import { Head, useForm, router } from '@inertiajs/react';
import {
    Shield,
    ShieldCheck,
    Plus,
    Key,
    MoreVertical,
    Pencil,
    Trash2,
    Copy,
    Crown,
    Users,
    UserX,
    Search,
    X,
    LayoutGrid,
    List,
    Lock,
    AlertTriangle,
    CheckCircle2,
    Settings2,
} from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
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
import { Checkbox } from '@/components/ui/checkbox';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface User {
    id: number;
    name: string;
    initials: string;
}

interface Permission {
    id: number;
    name: string;
    slug: string;
    module?: string;
    sector?: string;
}

interface Role {
    id: number;
    name: string;
    users_count: number;
    permissions_count: number;
    users: User[];
    more_users_count: number;
    permissions: Permission[];
    more_permissions_count: number;
    all_permissions: Permission[];
    sector_counts: Record<string, number> | [];
    is_super_admin: boolean;
}

interface GroupedPermissions {
    [sector: string]: {
        [module: string]: Permission[];
    };
}

interface RolesPageProps {
    auth: Auth;
    roles: Role[];
    stats: {
        total: number;
        permissions_total: number;
        users_with_roles?: number;
        roles_without_users?: number;
    };
    groupedPermissions: GroupedPermissions;
    filters: {
        search?: string;
    };
}

/** Paleta de acentos para diferenciar visualmente cada rol. */
const ACCENTS = [
    { bar: 'from-indigo-500 to-violet-500', soft: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300', fill: 'bg-indigo-500' },
    { bar: 'from-sky-500 to-cyan-400', soft: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300', fill: 'bg-sky-500' },
    { bar: 'from-emerald-500 to-teal-400', soft: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300', fill: 'bg-emerald-500' },
    { bar: 'from-amber-500 to-orange-400', soft: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300', fill: 'bg-amber-500' },
    { bar: 'from-rose-500 to-pink-500', soft: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300', fill: 'bg-rose-500' },
    { bar: 'from-fuchsia-500 to-purple-500', soft: 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-300', fill: 'bg-fuchsia-500' },
];

const SUPER_ACCENT = {
    bar: 'from-amber-400 via-yellow-400 to-amber-500',
    soft: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    fill: 'bg-amber-500',
};

const AVATAR_COLORS = [
    'bg-indigo-500',
    'bg-sky-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-fuchsia-500',
    'bg-teal-500',
];

const accentFor = (role: Role) => (role.is_super_admin ? SUPER_ACCENT : ACCENTS[role.id % ACCENTS.length]);

export default function RolesIndexPage({ roles, stats, groupedPermissions, filters }: RolesPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Roles'), href: '/admin/roles' },
    ];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [deletingRole, setDeletingRole] = useState<Role | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [permissionSearch, setPermissionSearch] = useState('');
    const [activeSector, setActiveSector] = useState<string>(Object.keys(groupedPermissions)[0] ?? '');

    // Formulario Inertia
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        permissions: [] as string[], // array de nombres de permisos (name)
    });

    // Debounce de búsqueda (se omite el primer render para no recargar la página al montar)
    const isFirstRender = useRef(true);
    React.useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;

            return;
        }

        const timer = setTimeout(() => {
            router.get(
                window.location.pathname,
                searchTerm ? { search: searchTerm } : {},
                { preserveState: true, preserveScroll: true, replace: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    /* ------------------------------------------------------------------ */
    /* Datos derivados                                                     */
    /* ------------------------------------------------------------------ */

    // Lista plana con el nombre de TODOS los permisos disponibles
    const allSystemPermissionNames = useMemo(() => {
        const names: string[] = [];
        Object.values(groupedPermissions).forEach(modules => {
            Object.values(modules).forEach(permissions => {
                permissions.forEach(p => names.push(p.name));
            });
        });

        return names;
    }, [groupedPermissions]);

    // Total de permisos por sector (para las barras de cobertura)
    const sectorTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        Object.entries(groupedPermissions).forEach(([sector, modules]) => {
            totals[sector] = Object.values(modules).reduce((acc, perms) => acc + perms.length, 0);
        });

        return totals;
    }, [groupedPermissions]);

    const totalPermissions = allSystemPermissionNames.length || stats.permissions_total || 0;
    const selectedSet = useMemo(() => new Set(data.permissions), [data.permissions]);
    const selectedCount = data.permissions.length;
    const selectedPercent = totalPermissions ? Math.round((selectedCount / totalPermissions) * 100) : 0;

    const isAllSystemPermissionsSelected =
        allSystemPermissionNames.length > 0 && allSystemPermissionNames.every(name => selectedSet.has(name));

    // Filtro de permisos dentro del modal
    const normalizedPermissionSearch = permissionSearch.trim().toLowerCase();
    const matchesPermission = (p: Permission) =>
        !normalizedPermissionSearch ||
        p.slug.toLowerCase().includes(normalizedPermissionSearch) ||
        p.name.toLowerCase().includes(normalizedPermissionSearch);

    const sectorSelectedCount = (sector: string) =>
        Object.values(groupedPermissions[sector] ?? {}).reduce(
            (acc, perms) => acc + perms.filter(p => selectedSet.has(p.name)).length,
            0
        );

    const sectorMatchCount = (sector: string) =>
        Object.values(groupedPermissions[sector] ?? {}).reduce((acc, perms) => acc + perms.filter(matchesPermission).length, 0);

    /* ------------------------------------------------------------------ */
    /* Acciones                                                            */
    /* ------------------------------------------------------------------ */

    const openModal = () => {
        clearErrors();
        setPermissionSearch('');
        setActiveSector(Object.keys(groupedPermissions)[0] ?? '');
        setIsModalOpen(true);
    };

    const handleCreateClick = () => {
        setEditingRole(null);
        reset();
        openModal();
    };

    const handleEditClick = (role: Role) => {
        setEditingRole(role);
        setData({
            name: role.name,
            permissions: role.all_permissions.map(p => p.name),
        });
        openModal();
    };

    const handleDuplicateClick = (role: Role) => {
        setEditingRole(null);
        setData({
            name: `${role.name} (${__('copy')})`,
            permissions: role.all_permissions.map(p => p.name),
        });
        openModal();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setIsModalOpen(false);
                setEditingRole(null);
                reset();
                notifySuccess(editingRole ? __('Role updated successfully.') : __('Role created successfully.'));
            },
            onError: () => notifyError(__('Please review the highlighted fields.')),
        };

        if (editingRole) {
            put(`/admin/roles/${editingRole.id}`, options);
        } else {
            post('/admin/roles', options);
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
                notifySuccess(__('Role deleted successfully.'));
            },
            onError: (err) => {
                notifyError(err.error || __('There was an error deleting the role.'));
            },
        });
    };

    const setPermissions = (names: string[]) => setData('permissions', Array.from(new Set(names)));

    const handleSelectAllSystemPermissions = (checked: boolean) => {
        setPermissions(checked ? allSystemPermissionNames : []);
    };

    const handlePermissionToggle = (permissionName: string, checked: boolean) => {
        if (checked) {
            setPermissions([...data.permissions, permissionName]);
        } else {
            setData('permissions', data.permissions.filter(name => name !== permissionName));
        }
    };

    const togglePermissionGroup = (permissions: Permission[], checked: boolean) => {
        const names = permissions.map(p => p.name);

        if (checked) {
            setPermissions([...data.permissions, ...names]);
        } else {
            setData('permissions', data.permissions.filter(name => !names.includes(name)));
        }
    };

    const groupState = (permissions: Permission[]): boolean | 'indeterminate' => {
        const selected = permissions.filter(p => selectedSet.has(p.name)).length;

        if (selected === 0) {
            return false;
        }

        return selected === permissions.length ? true : 'indeterminate';
    };

    const sectorPermissions = (sector: string) => Object.values(groupedPermissions[sector] ?? {}).flat();

    /* ------------------------------------------------------------------ */
    /* Subcomponentes de presentación                                      */
    /* ------------------------------------------------------------------ */

    const renderUserAvatars = (role: Role) => (
        <div className="flex items-center">
            <div className="flex -space-x-2">
                {role.users.map((user) => (
                    <div
                        key={user.id}
                        title={user.name}
                        className={cn(
                            'inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white ring-2 ring-card',
                            AVATAR_COLORS[user.id % AVATAR_COLORS.length]
                        )}
                    >
                        {user.initials || '?'}
                    </div>
                ))}
                {role.more_users_count > 0 && (
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground ring-2 ring-card">
                        +{role.more_users_count}
                    </div>
                )}
            </div>
            {role.users_count === 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs italic text-muted-foreground">
                    <UserX className="h-3.5 w-3.5" />
                    {__('No users assigned')}
                </span>
            )}
        </div>
    );

    const renderRoleActions = (role: Role) =>
        role.is_super_admin ? (
            <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground"
                title={__('System role: it cannot be edited or deleted.')}
            >
                <Lock className="h-4 w-4" />
            </span>
        ) : (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={__('Actions')}>
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => handleEditClick(role)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {__('Edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateClick(role)}>
                        <Copy className="mr-2 h-4 w-4" />
                        {__('Duplicate')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setDeletingRole(role)}
                        className="text-red-600 focus:text-red-600 dark:text-red-400"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {__('Delete')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );

    const coverageOf = (role: Role) =>
        role.is_super_admin ? 100 : totalPermissions ? Math.round((role.permissions_count / totalPermissions) * 100) : 0;

    const sectorCount = (role: Role, sector: string) =>
        Array.isArray(role.sector_counts) ? 0 : role.sector_counts?.[sector] ?? 0;

    /* ------------------------------------------------------------------ */
    /* Render                                                              */
    /* ------------------------------------------------------------------ */

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
                    <Button onClick={handleCreateClick} className="bg-white text-indigo-700 shadow-sm hover:bg-white/90">
                        <Plus className="mr-2 h-4 w-4" />
                        {__('New Role')}
                    </Button>
                </ModuleHeader>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard
                        icon={<Key className="h-6 w-6" />}
                        title={__('TOTAL ROLES')}
                        value={stats.total}
                        colorClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"
                    />
                    <StatCard
                        icon={<ShieldCheck className="h-6 w-6" />}
                        title={__('TOTAL SYSTEM PERMISSIONS')}
                        value={stats.permissions_total}
                        colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                    />
                    <StatCard
                        icon={<Users className="h-6 w-6" />}
                        title={__('USERS WITH ROLES')}
                        value={stats.users_with_roles ?? 0}
                        colorClassName="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300"
                    />
                    <StatCard
                        icon={<UserX className="h-6 w-6" />}
                        title={__('ROLES WITHOUT USERS')}
                        value={stats.roles_without_users ?? 0}
                        colorClassName="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
                    />
                </div>

                {/* Barra de herramientas */}
                <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="roles-search"
                            placeholder={__('Search by name...')}
                            className="pl-9 pr-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                aria-label={__('Clear')}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span className="text-xs text-muted-foreground">
                            {roles.length} {roles.length === 1 ? __('role') : __('roles')}
                        </span>
                        <div className="inline-flex rounded-lg border bg-muted/50 p-0.5">
                            <button
                                type="button"
                                id="view-grid"
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    'inline-flex h-7 w-8 items-center justify-center rounded-md transition-colors',
                                    viewMode === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                )}
                                aria-label={__('Grid view')}
                                title={__('Grid view')}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                id="view-list"
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    'inline-flex h-7 w-8 items-center justify-center rounded-md transition-colors',
                                    viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                )}
                                aria-label={__('List view')}
                                title={__('List view')}
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Estado vacío */}
                {roles.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                            <Shield className="h-7 w-7" />
                        </div>
                        <h3 className="text-base font-semibold">{__('No roles found')}</h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            {searchTerm
                                ? __('No roles match your search. Try a different term.')
                                : __('Create your first role to start assigning permissions.')}
                        </p>
                        <div className="mt-5 flex gap-2">
                            {searchTerm && (
                                <Button variant="outline" onClick={() => setSearchTerm('')}>
                                    {__('Clear search')}
                                </Button>
                            )}
                            <Button onClick={handleCreateClick}>
                                <Plus className="mr-2 h-4 w-4" />
                                {__('New Role')}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Vista en tarjetas */}
                {roles.length > 0 && viewMode === 'grid' && (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {roles.map((role) => {
                            const accent = accentFor(role);
                            const coverage = coverageOf(role);

                            return (
                                <div
                                    key={role.id}
                                    className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                                >
                                    <div className={cn('h-1.5 w-full bg-gradient-to-r', accent.bar)} />

                                    <div className="flex flex-1 flex-col p-5">
                                        {/* Cabecera */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', accent.soft)}>
                                                    {role.is_super_admin ? <Crown className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="truncate text-base font-semibold capitalize" title={role.name}>
                                                            {role.name}
                                                        </h3>
                                                        {role.is_super_admin && (
                                                            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                                                {__('System')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        {role.users_count} {role.users_count === 1 ? __('user') : __('users')}
                                                        {' · '}
                                                        {role.is_super_admin
                                                            ? __('All Permissions (bypass)')
                                                            : `${role.permissions_count} ${__('permissions')}`}
                                                    </p>
                                                </div>
                                            </div>
                                            {renderRoleActions(role)}
                                        </div>

                                        {/* Cobertura */}
                                        <div className="mt-5">
                                            <div className="mb-1.5 flex items-center justify-between text-xs">
                                                <span className="font-medium text-muted-foreground">{__('Permission coverage')}</span>
                                                <span className="font-semibold tabular-nums">{coverage}%</span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className={cn('h-full rounded-full transition-all duration-500', accent.fill)}
                                                    style={{ width: `${coverage}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Desglose por sector */}
                                        {!role.is_super_admin && (
                                            <div className="mt-4 grid grid-cols-2 gap-2">
                                                {Object.keys(groupedPermissions).map((sector) => {
                                                    const count = sectorCount(role, sector);
                                                    const total = sectorTotals[sector] || 0;

                                                    return (
                                                        <div
                                                            key={sector}
                                                            className={cn(
                                                                'flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-[11px]',
                                                                count > 0 ? 'bg-muted/40' : 'border-dashed opacity-60'
                                                            )}
                                                        >
                                                            <span className="truncate capitalize text-muted-foreground">{__(sector)}</span>
                                                            <span className="ml-2 font-semibold tabular-nums">
                                                                {count}/{total}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {role.is_super_admin && (
                                            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                                <span>{__('This role has unrestricted access to every module of the system.')}</span>
                                            </div>
                                        )}

                                        {/* Pie */}
                                        <div className="min-h-5 flex-1" />
                                        <div className="flex items-center justify-between gap-3 border-t pt-4">
                                            {renderUserAvatars(role)}
                                            {!role.is_super_admin && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 shrink-0 text-xs opacity-80 group-hover:opacity-100"
                                                    onClick={() => handleEditClick(role)}
                                                >
                                                    <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                                                    {__('Manage')}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Vista en lista */}
                {roles.length > 0 && viewMode === 'list' && (
                    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold">{__('Role')}</th>
                                        <th className="px-4 py-3 text-left font-semibold">{__('Users')}</th>
                                        <th className="px-4 py-3 text-left font-semibold">{__('Permissions')}</th>
                                        <th className="w-56 px-4 py-3 text-left font-semibold">{__('Permission coverage')}</th>
                                        <th className="w-12 px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {roles.map((role) => {
                                        const accent = accentFor(role);
                                        const coverage = coverageOf(role);

                                        return (
                                            <tr key={role.id} className="transition-colors hover:bg-muted/30">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', accent.soft)}>
                                                            {role.is_super_admin ? <Crown className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="truncate font-semibold capitalize">{role.name}</div>
                                                            {role.is_super_admin && (
                                                                <div className="text-[11px] font-medium text-amber-600 dark:text-amber-300">{__('System')}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {renderUserAvatars(role)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {role.is_super_admin ? (
                                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400">
                                                            {__('All Permissions (bypass)')}
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1">
                                                            {role.permissions.map((p) => (
                                                                <span
                                                                    key={p.id}
                                                                    className="rounded-full border bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
                                                                    title={p.name}
                                                                >
                                                                    {p.slug}
                                                                </span>
                                                            ))}
                                                            {role.more_permissions_count > 0 && (
                                                                <span className="rounded-full border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                                    +{role.more_permissions_count}
                                                                </span>
                                                            )}
                                                            {role.permissions_count === 0 && (
                                                                <span className="text-xs italic text-muted-foreground">{__('No permissions assigned')}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                                            <div className={cn('h-full rounded-full', accent.fill)} style={{ width: `${coverage}%` }} />
                                                        </div>
                                                        <span className="w-10 text-right text-xs font-semibold tabular-nums">{coverage}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {renderRoleActions(role)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Creación / Edición */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                        <DialogHeader className="border-b p-6 pb-4 text-left">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                                    {editingRole ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                </div>
                                <div>
                                    <DialogTitle>{editingRole ? __('Edit Role') : __('New Role')}</DialogTitle>
                                    <DialogDescription className="mt-0.5">
                                        {__('Define the role name and choose permissions grouped by sector.')}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
                            {/* Nombre + resumen */}
                            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">{__('Role Name')} *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder={__('e.g., Editor, supervisor')}
                                        aria-invalid={!!errors.name}
                                        autoFocus
                                        required
                                    />
                                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                                </div>

                                <div className="flex min-w-[220px] items-center gap-3 rounded-xl border bg-muted/30 px-4 py-2.5">
                                    <div className="relative h-10 w-10 shrink-0">
                                        <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
                                            <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="4" className="stroke-muted" />
                                            <circle
                                                cx="18"
                                                cy="18"
                                                r="15.5"
                                                fill="none"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                                className="stroke-indigo-500 transition-all duration-300"
                                                strokeDasharray={`${(selectedPercent / 100) * 97.4} 97.4`}
                                            />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums">
                                            {selectedPercent}%
                                        </span>
                                    </div>
                                    <div className="leading-tight">
                                        <div className="text-sm font-semibold tabular-nums">
                                            {selectedCount} / {totalPermissions}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground">{__('permissions selected')}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Herramientas de permisos */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="relative w-full sm:max-w-xs">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="permission-search"
                                        value={permissionSearch}
                                        onChange={(e) => setPermissionSearch(e.target.value)}
                                        placeholder={__('Filter permissions...')}
                                        className="h-9 pl-9"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSelectAllSystemPermissions(!isAllSystemPermissionsSelected)}
                                    >
                                        {isAllSystemPermissionsSelected ? __('Deselect all') : __('Select all permissions')}
                                    </Button>
                                    {selectedCount > 0 && !isAllSystemPermissionsSelected && (
                                        <Button type="button" variant="ghost" size="sm" onClick={() => handleSelectAllSystemPermissions(false)}>
                                            {__('Clear')}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Selector de Permisos Agrupados */}
                            <Tabs value={activeSector} onValueChange={setActiveSector} className="w-full">
                                <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
                                    {Object.keys(groupedPermissions).map((sector) => {
                                        const selected = sectorSelectedCount(sector);
                                        const total = sectorTotals[sector] || 0;
                                        const matches = sectorMatchCount(sector);

                                        return (
                                            <TabsTrigger
                                                key={sector}
                                                value={sector}
                                                className={cn(
                                                    'flex-1 gap-2 py-1.5 text-xs capitalize',
                                                    normalizedPermissionSearch && matches === 0 && 'opacity-40'
                                                )}
                                            >
                                                {__(sector)}
                                                <span
                                                    className={cn(
                                                        'rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums',
                                                        selected === total && total > 0
                                                            ? 'bg-indigo-500 text-white'
                                                            : selected > 0
                                                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                                                              : 'bg-muted-foreground/10 text-muted-foreground'
                                                    )}
                                                >
                                                    {selected}/{total}
                                                </span>
                                            </TabsTrigger>
                                        );
                                    })}
                                </TabsList>

                                {Object.entries(groupedPermissions).map(([sector, modules]) => {
                                    const allInSector = sectorPermissions(sector);
                                    const sectorChecked = groupState(allInSector);
                                    const visibleModules = Object.entries(modules)
                                        .map(([module, perms]) => [module, perms.filter(matchesPermission)] as const)
                                        .filter(([, perms]) => perms.length > 0);

                                    return (
                                        <TabsContent key={sector} value={sector} className="mt-3">
                                            <div className="mb-3 flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
                                                <label htmlFor={`sector-${sector}`} className="flex cursor-pointer select-none items-center gap-2 text-xs font-medium">
                                                    <Checkbox
                                                        id={`sector-${sector}`}
                                                        checked={sectorChecked}
                                                        onCheckedChange={() => togglePermissionGroup(allInSector, sectorChecked !== true)}
                                                    />
                                                    {__('Select entire sector')}
                                                </label>
                                                <span className="text-[11px] text-muted-foreground">
                                                    {Object.keys(modules).length} {__('modules')}
                                                </span>
                                            </div>

                                            <div className="max-h-[360px] overflow-y-auto pr-1">
                                                {visibleModules.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                                                        <Search className="mb-2 h-5 w-5" />
                                                        {__('No permissions match your filter.')}
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                        {visibleModules.map(([module, permissions]) => {
                                                            const fullModule = modules[module];
                                                            const moduleState = groupState(fullModule);
                                                            const moduleSelected = fullModule.filter(p => selectedSet.has(p.name)).length;

                                                            return (
                                                                <div
                                                                    key={module}
                                                                    className={cn(
                                                                        'rounded-xl border p-3 transition-colors',
                                                                        moduleState === true
                                                                            ? 'border-indigo-300 bg-indigo-50/50 dark:border-indigo-500/40 dark:bg-indigo-500/5'
                                                                            : 'bg-card'
                                                                    )}
                                                                >
                                                                    {/* Cabecera del Módulo con Checkbox maestro */}
                                                                    <div className="mb-2 flex items-center justify-between border-b pb-2">
                                                                        <label
                                                                            htmlFor={`module-${sector}-${module}`}
                                                                            className="flex cursor-pointer select-none items-center gap-2"
                                                                        >
                                                                            <Checkbox
                                                                                id={`module-${sector}-${module}`}
                                                                                checked={moduleState}
                                                                                onCheckedChange={() => togglePermissionGroup(fullModule, moduleState !== true)}
                                                                            />
                                                                            <span className="text-sm font-semibold capitalize">{__(module)}</span>
                                                                        </label>
                                                                        <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                                                                            {moduleSelected}/{fullModule.length}
                                                                        </span>
                                                                    </div>

                                                                    {/* Lista de Permisos del Módulo */}
                                                                    <div className="space-y-1">
                                                                        {permissions.map((p) => {
                                                                            const checked = selectedSet.has(p.name);

                                                                            return (
                                                                                <label
                                                                                    key={p.id}
                                                                                    htmlFor={`perm-${p.id}`}
                                                                                    className={cn(
                                                                                        'flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors',
                                                                                        checked ? 'bg-indigo-500/10' : 'hover:bg-muted/60'
                                                                                    )}
                                                                                >
                                                                                    <Checkbox
                                                                                        id={`perm-${p.id}`}
                                                                                        checked={checked}
                                                                                        onCheckedChange={(value) => handlePermissionToggle(p.name, !!value)}
                                                                                    />
                                                                                    <span className="min-w-0 flex-1">
                                                                                        <span className="block truncate text-xs font-medium">{p.slug}</span>
                                                                                        <span className="block truncate font-mono text-[10px] text-muted-foreground">
                                                                                            {p.name}
                                                                                        </span>
                                                                                    </span>
                                                                                </label>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>
                                    );
                                })}
                            </Tabs>
                        </div>

                        <DialogFooter className="flex-row items-center justify-between gap-2 border-t bg-muted/20 p-4 sm:justify-between">
                            <span className="hidden text-xs text-muted-foreground sm:inline">
                                {selectedCount} {__('permissions selected')}
                            </span>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={processing}>
                                    {__('Cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? __('Saving...') : editingRole ? __('Save Changes') : __('Create Role')}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* AlertDialog de Confirmación para eliminar */}
            <AlertDialog open={!!deletingRole} onOpenChange={(open) => !open && setDeletingRole(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                            <Trash2 className="h-5 w-5" />
                        </div>
                        <AlertDialogTitle>{__('Delete Role')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {__('Are you sure you want to delete the role')}{' '}
                            <strong className="text-foreground">{deletingRole?.name}</strong>?{' '}
                            {__('This action cannot be undone and will unassign it from all users.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {deletingRole && deletingRole.users_count > 0 && (
                        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                                {__(':count user(s) currently have this role and will lose its permissions.', {
                                    count: String(deletingRole.users_count),
                                })}
                            </span>
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel>{__('Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 text-white hover:bg-red-700">
                            {__('Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
