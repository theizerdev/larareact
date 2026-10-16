import { Head, useForm, router } from '@inertiajs/react';
import {
    Users,
    UserCheck,
    UserX,
    Plus,
    Search,
    X,
    MoreVertical,
    Pencil,
    Trash2,
    Copy,
    Crown,
    Building2,
    GitBranch,
    ShieldCheck,
    Phone,
    Lock,
    Unlock,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Eye,
    EyeOff,
    LayoutGrid,
    List,
    Sparkles,
    SlidersHorizontal,
    Check,
} from 'lucide-react';
import React, { useState, useMemo, useRef } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { ModuleHeader } from '@/components/module-header';
import Pagination from '@/components/pagination';
import { SoxPasswordRequirements } from '@/components/sox-password-requirements';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
    codigo_iso2?: string | null;
    codigo_telefonico?: string | null;
}

interface Role {
    id: number;
    name: string;
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

interface User {
    id: number;
    name: string;
    email: string;
    username?: string | null;
    telefono?: string | null;
    pais_telefono_id?: number | null;
    status: 'activo' | 'inactivo' | 'suspendido';
    empresa_id?: number | null;
    sucursal_id?: number | null;
    empresa?: Empresa | null;
    sucursal?: Sucursal | null;
    roles: Role[];
    pais_telefono?: Pais | null;
    is_locked?: boolean;
    lockout_remaining_minutes?: number;
    days_remaining?: number;
    is_expired?: boolean;
    has_2fa?: boolean;
    created_at?: string;
}

interface UsersPageProps {
    auth: Auth;
    users: Paginated<User>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
        suspendidos?: number;
        bloqueados?: number;
        con_2fa?: number;
    };
    roles: Role[];
    empresas: Empresa[];
    sucursales: Sucursal[];
    paises: Pais[];
    filters: {
        search?: string;
        status?: string;
        role?: string;
        empresa_id?: string;
        perPage?: string;
        sortBy?: string;
        sortDir?: string;
    };
    soxPolicies?: {
        minLength: number;
        historyLimit: number;
        expireDays: number;
    };
}

const AVATAR_COLORS = [
    'bg-indigo-500',
    'bg-sky-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-fuchsia-500',
    'bg-teal-500',
];

const initialForm = {
    name: '',
    username: '',
    email: '',
    password: '',
    telefono: '',
    pais_telefono_id: '' as string | number,
    status: 'activo' as 'activo' | 'inactivo' | 'suspendido',
    empresa_id: '' as string | number,
    sucursal_id: '' as string | number,
    roles: [] as string[],
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
}: UsersPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Users'), href: '/admin/usuarios' },
    ];

    // ── Estados Principales ───────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<'general' | 'security' | 'roles'>('general');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [duplicatingUser, setDuplicatingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [isTableLoading, setIsTableLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [copiedEmailId, setCopiedEmailId] = useState<number | null>(null);

    // Filtros
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [empresaFilter, setEmpresaFilter] = useState(filters.empresa_id || '');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '10');

    // Navigation loader
    React.useEffect(() => {
        const unbindStart = router.on('start', () => setIsTableLoading(true));
        const unbindFinish = router.on('finish', () => setIsTableLoading(false));

        return () => {
            unbindStart();
            unbindFinish();
        };
    }, []);

    // Filter Query debouncing
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
                    role: roleFilter,
                    empresa_id: empresaFilter,
                    perPage: perPageFilter,
                    sortBy: filters.sortBy,
                    sortDir: filters.sortDir,
                }),
                { preserveState: true, preserveScroll: true, replace: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, roleFilter, empresaFilter, perPageFilter, filters.sortBy, filters.sortDir]);

    // Formulario Inertia
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm(initialForm);

    // Filtrar sucursales según la empresa seleccionada
    const filteredSucursales = useMemo(() => {
        if (!data.empresa_id) {
return [];
}

        return sucursales.filter((s) => s.empresa_id === Number(data.empresa_id));
    }, [data.empresa_id, sucursales]);

    // Generador de contraseña segura cumpliendo SOX 404
    const handleGeneratePassword = () => {
        const minLength = Math.max(16, soxPolicies?.minLength ?? 16);
        const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const lower = 'abcdefghijkmnopqrstuvwxyz';
        const numbers = '23456789';
        const symbols = '!@#$%^&*()-_=+';
        const all = upper + lower + numbers + symbols;

        let pwd = '';
        pwd += upper[Math.floor(Math.random() * upper.length)];
        pwd += lower[Math.floor(Math.random() * lower.length)];
        pwd += numbers[Math.floor(Math.random() * numbers.length)];
        pwd += symbols[Math.floor(Math.random() * symbols.length)];

        for (let i = pwd.length; i < minLength; i++) {
            pwd += all[Math.floor(Math.random() * all.length)];
        }

        const shuffled = pwd.split('').sort(() => 0.5 - Math.random()).join('');
        setData('password', shuffled);
        setShowPassword(true);
        notifySuccess(__('Secure password generated successfully.'));
    };

    // Copiar email al portapapeles
    const handleCopyEmail = (user: User) => {
        navigator.clipboard.writeText(user.email);
        setCopiedEmailId(user.id);
        setTimeout(() => setCopiedEmailId(null), 2000);
    };

    // ── Handlers de Modales y Acciones ────────────────────────────────────────

    const handleCreateClick = () => {
        clearErrors();
        setEditingUser(null);
        setDuplicatingUser(null);
        setShowPassword(false);
        setModalTab('general');
        reset();
        setIsModalOpen(true);
    };

    const handleEditClick = (user: User) => {
        clearErrors();
        setEditingUser(user);
        setDuplicatingUser(null);
        setShowPassword(false);
        setModalTab('general');
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
        setIsModalOpen(true);
    };

    const handleDuplicateClick = (user: User) => {
        clearErrors();
        setEditingUser(null);
        setDuplicatingUser(user);
        setShowPassword(false);
        setModalTab('general');
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
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setIsModalOpen(false);
                setEditingUser(null);
                setDuplicatingUser(null);
                reset();
                notifySuccess(editingUser ? __('User updated successfully.') : __('User created successfully.'));
            },
            onError: () => notifyError(__('Please review the highlighted fields.')),
        };

        if (editingUser) {
            put(`/admin/usuarios/${editingUser.id}`, options);
        } else {
            post('/admin/usuarios', options);
        }
    };

    const handleToggleStatus = (user: User) => {
        if (auth?.user?.id === user.id) {
            notifyError(__('You cannot deactivate your own account.'));

            return;
        }

        router.patch(`/admin/usuarios/${user.id}/toggle-status`, {}, {
            preserveScroll: true,
            onSuccess: () => notifySuccess(__('Status updated successfully.')),
            onError: () => notifyError(__('There was an error updating the status.')),
        });
    };

    const handleUnlockUser = (user: User) => {
        router.post(`/admin/usuarios/${user.id}/unlock`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                notifySuccess(__('User account unlocked successfully.'));

                if (editingUser?.id === user.id) {
                    setEditingUser({ ...editingUser, is_locked: false, lockout_remaining_minutes: 0 });
                }
            },
            onError: () => notifyError(__('There was an error unlocking the user.')),
        });
    };

    const handleDeleteClick = (user: User) => {
        if (auth?.user?.id === user.id) {
            notifyError(__('You cannot delete your own account.'));

            return;
        }

        setDeletingUser(user);
    };

    const handleDeleteConfirm = () => {
        if (!deletingUser) {
return;
}

        router.delete(`/admin/usuarios/${deletingUser.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingUser(null);
                notifySuccess(__('User deleted successfully.'));
            },
            onError: () => notifyError(__('There was an error deleting the user. Please try again.')),
        });
    };

    const handleRoleChange = (roleName: string, checked: boolean) => {
        if (checked) {
            setData('roles', [...data.roles, roleName]);
        } else {
            setData('roles', data.roles.filter((r) => r !== roleName));
        }
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setRoleFilter('');
        setEmpresaFilter('');
        setPerPageFilter('10');
    };

    const hasActiveFilters = Boolean(searchTerm || statusFilter || roleFilter || empresaFilter || perPageFilter !== '10');

    // ── Helpers Visuales ──────────────────────────────────────────────────────

    const isSuperAdminUser = (user: User) =>
        user.roles.some((r) => ['Super Administrador', 'super-admin', 'Super Admin', 'super_admin'].includes(r.name));

    const getUserInitials = (name: string) => {
        const parts = name.trim().split(' ').filter(Boolean);

        if (parts.length === 0) {
return '?';
}

        const first = parts[0]?.charAt(0) || '';
        const second = parts[1]?.charAt(0) || '';

        return (first + second).toUpperCase();
    };

    const renderSecurityBadges = (user: User) => {
        return (
            <div className="flex flex-wrap items-center gap-1.5">
                {user.is_locked && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        <Lock className="h-3 w-3" />
                        {__('Locked')} ({user.lockout_remaining_minutes}m)
                    </span>
                )}

                {user.has_2fa ? (
                    <span
                        className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300"
                        title={__('Two-factor authentication enabled')}
                    >
                        <ShieldCheck className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                        2FA
                    </span>
                ) : (
                    <span
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-normal text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400"
                        title={__('Without two-factor authentication')}
                    >
                        No 2FA
                    </span>
                )}

                {user.is_expired ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                        <AlertTriangle className="h-3 w-3" />
                        {__('Password Expired')}
                    </span>
                ) : user.days_remaining !== undefined && user.days_remaining <= 10 ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
                        <Clock className="h-3 w-3" />
                        {user.days_remaining}d
                    </span>
                ) : null}
            </div>
        );
    };

    const renderActionMenu = (user: User) => {
        const isSelf = auth?.user?.id === user.id;

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={__('Actions')}>
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleEditClick(user)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {__('Edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateClick(user)}>
                        <Copy className="mr-2 h-4 w-4" />
                        {__('Duplicate')}
                    </DropdownMenuItem>
                    {user.is_locked && (
                        <DropdownMenuItem
                            onClick={() => handleUnlockUser(user)}
                            className="text-amber-600 focus:text-amber-600 dark:text-amber-400 font-medium"
                        >
                            <Unlock className="mr-2 h-4 w-4" />
                            {__('Unlock Account')}
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => handleToggleStatus(user)}
                        disabled={isSelf}
                        className={isSelf ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                        {user.status === 'activo' ? (
                            <>
                                <UserX className="mr-2 h-4 w-4 text-amber-600" />
                                {__('Deactivate')}
                            </>
                        ) : (
                            <>
                                <UserCheck className="mr-2 h-4 w-4 text-emerald-600" />
                                {__('Activate')}
                            </>
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => handleDeleteClick(user)}
                        disabled={isSelf}
                        className={cn(
                            'text-red-600 focus:text-red-600 dark:text-red-400',
                            isSelf && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {__('Delete')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    // ── Columnas de la Tabla DataTable ────────────────────────────────────────

    const columns: ColumnDef<User>[] = [
        {
            header: __('User'),
            accessorKey: 'name',
            sortable: true,
            sortKey: 'name',
            cell: (user) => {
                const isSuperAdmin = isSuperAdminUser(user);
                const initials = getUserInitials(user.name);
                const colorBg = AVATAR_COLORS[user.id % AVATAR_COLORS.length];

                return (
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ring-2 ring-background',
                                isSuperAdmin ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-900' : colorBg
                            )}
                        >
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-sm text-foreground truncate">{user.name}</span>
                                {isSuperAdmin && (
                                    <span title={__('Super Administrator')}>
                                        <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <span className="truncate">{user.email}</span>
                                {user.username && (
                                    <span className="hidden sm:inline font-mono text-[11px] text-muted-foreground/80">
                                        @{user.username}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            header: __('Role'),
            cell: (user) => (
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {user.roles.map((r) => {
                        const isSuper = ['Super Administrador', 'super-admin', 'Super Admin'].includes(r.name);

                        return (
                            <Badge
                                key={r.id}
                                variant={isSuper ? 'default' : 'secondary'}
                                className={cn(
                                    'capitalize text-[11px] font-medium py-0.5',
                                    isSuper && 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                )}
                            >
                                {r.name}
                            </Badge>
                        );
                    })}
                    {user.roles.length === 0 && <span className="text-xs text-muted-foreground italic">{__('No roles')}</span>}
                </div>
            ),
        },
        {
            header: __('Company / Branch'),
            hideOn: 'tablet',
            cell: (user) => (
                <div className="space-y-1 text-xs">
                    {user.empresa ? (
                        <div className="flex items-center gap-1.5 font-medium text-foreground/90">
                            <Building2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate">{user.empresa.razon_social}</span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground italic text-xs">{__('No company')}</span>
                    )}
                    {user.sucursal && (
                        <div className="flex items-center gap-1.5 text-muted-foreground pl-1">
                            <GitBranch className="h-3 w-3 text-violet-500 shrink-0" />
                            <span className="truncate">{user.sucursal.nombre}</span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            header: __('Security / SOX'),
            hideOn: 'mobile',
            cell: (user) => renderSecurityBadges(user),
        },
        {
            header: __('Status'),
            sortable: true,
            sortKey: 'status',
            stopRowClick: true,
            cell: (user) => {
                const isSelf = auth?.user?.id === user.id;

                return (
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={user.status === 'activo'}
                            onCheckedChange={() => handleToggleStatus(user)}
                            disabled={isSelf}
                            title={isSelf ? __('You cannot deactivate your own account.') : undefined}
                        />
                        <span
                            className={cn(
                                'text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize',
                                user.status === 'activo'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                                    : user.status === 'suspendido'
                                    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900'
                                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                            )}
                        >
                            {__(user.status)}
                        </span>
                    </div>
                );
            },
        },
        {
            header: __('Actions'),
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (user) => renderActionMenu(user),
        },
    ];

    return (
        <>
            <Head title={__('Users')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Encabezado del Módulo con degradado enriquecido y accesos directos */}
                <ModuleHeader
                    icon={<Users className="h-6 w-6 text-white" />}
                    title={__('Users')}
                    description={__('Manage system users, passwords, access status and roles.')}
                    colorClassName="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600"
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.get('/admin/seguridad/sox')}
                            className="border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                        >
                            <ShieldCheck className="mr-1.5 h-4 w-4 text-emerald-300" />
                            {__('SOX Compliance')}
                        </Button>
                        <Button onClick={handleCreateClick} className="bg-white text-indigo-700 shadow-sm hover:bg-white/90 font-semibold">
                            <Plus className="mr-2 h-4 w-4" />
                            {__('New User')}
                        </Button>
                    </div>
                </ModuleHeader>

                {/* Tarjetas KPI Interactivas */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                    <button
                        type="button"
                        onClick={() => setStatusFilter('')}
                        className={cn(
                            'text-left transition-transform hover:-translate-y-0.5 rounded-xl focus:outline-none',
                            !statusFilter && 'ring-2 ring-indigo-500 rounded-xl'
                        )}
                    >
                        <StatCard
                            icon={<Users className="h-6 w-6" />}
                            title={__('TOTAL USERS')}
                            value={stats.total}
                            colorClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"
                        />
                    </button>

                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === 'activo' ? '' : 'activo')}
                        className={cn(
                            'text-left transition-transform hover:-translate-y-0.5 rounded-xl focus:outline-none',
                            statusFilter === 'activo' && 'ring-2 ring-emerald-500 rounded-xl'
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
                        onClick={() => setStatusFilter(statusFilter === 'inactivo' ? '' : 'inactivo')}
                        className={cn(
                            'text-left transition-transform hover:-translate-y-0.5 rounded-xl focus:outline-none',
                            statusFilter === 'inactivo' && 'ring-2 ring-slate-500 rounded-xl'
                        )}
                    >
                        <StatCard
                            icon={<UserX className="h-6 w-6" />}
                            title={__('INACTIVE / SUSPENDED')}
                            value={(stats.inactivos ?? 0) + (stats.suspendidos ?? 0)}
                            colorClassName="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        />
                    </button>

                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === 'bloqueado' ? '' : 'bloqueado')}
                        className={cn(
                            'text-left transition-transform hover:-translate-y-0.5 rounded-xl focus:outline-none',
                            statusFilter === 'bloqueado' && 'ring-2 ring-amber-500 rounded-xl'
                        )}
                    >
                        <StatCard
                            icon={<Lock className="h-6 w-6" />}
                            title={__('LOCKED (SOX)')}
                            value={stats.bloqueados ?? 0}
                            colorClassName="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
                        />
                    </button>

                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === '2fa' ? '' : '2fa')}
                        className={cn(
                            'text-left transition-transform hover:-translate-y-0.5 rounded-xl focus:outline-none col-span-2 md:col-span-1',
                            statusFilter === '2fa' && 'ring-2 ring-sky-500 rounded-xl'
                        )}
                    >
                        <StatCard
                            icon={<ShieldCheck className="h-6 w-6" />}
                            title={__('WITH 2FA ACTIVE')}
                            value={stats.con_2fa ?? 0}
                            colorClassName="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300"
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
                                id="users-search"
                                placeholder={__('Search by name, email, username, phone...')}
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
                            {/* Filtro Rol */}
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-[140px] sm:w-[160px] h-10 text-xs">
                                    <SelectValue placeholder={__('All roles')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('All roles')}</SelectItem>
                                    {roles.map((r) => (
                                        <SelectItem key={r.id} value={r.name}>
                                            <span className="capitalize">{r.name}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Filtro Empresa */}
                            <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                                <SelectTrigger className="w-[150px] sm:w-[180px] h-10 text-xs">
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

                            {/* Filtro Estado */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[120px] sm:w-[140px] h-10 text-xs">
                                    <SelectValue placeholder={__('Status')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('All')}</SelectItem>
                                    <SelectItem value="activo">{__('Active')}</SelectItem>
                                    <SelectItem value="inactivo">{__('Inactive')}</SelectItem>
                                    <SelectItem value="suspendido">{__('Suspended')}</SelectItem>
                                    <SelectItem value="bloqueado">{__('Locked')}</SelectItem>
                                    <SelectItem value="2fa">{__('2FA Active')}</SelectItem>
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
                                        viewMode === 'table' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
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
                                        viewMode === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
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
                            {roleFilter && (
                                <Badge variant="secondary" className="gap-1 font-normal capitalize">
                                    {__('Role')}: {roleFilter}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => setRoleFilter('')} />
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
                                    {__('Status')}: {statusFilter}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('')} />
                                </Badge>
                            )}
                            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 text-xs text-indigo-600 hover:text-indigo-700 px-2">
                                {__('Clear all filters')}
                            </Button>
                        </div>
                    )}
                </div>

                {/* ── Vista Tabla (DataTable) ──────────────────────────────────────── */}
                {viewMode === 'table' && (
                    <div className="w-full">
                        <DataTable
                            data={users}
                            columns={columns}
                            filters={filters}
                            isLoading={isTableLoading}
                            onRowClick={(user) => handleEditClick(user)}
                            emptyState={{
                                title: 'No users found',
                                description: hasActiveFilters
                                    ? 'Try clearing your search filters or changing your query.'
                                    : 'You have not registered any users yet.',
                                ctaLabel: 'New User',
                                onCtaClick: handleCreateClick,
                            }}
                        />
                    </div>
                )}

                {/* ── Vista Tarjetas (Grid) ────────────────────────────────────────── */}
                {viewMode === 'grid' && (
                    <div className="space-y-6">
                        {users.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                                    <Users className="h-7 w-7" />
                                </div>
                                <h3 className="text-base font-semibold">{__('No users found')}</h3>
                                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                    {hasActiveFilters
                                        ? __('Try clearing your search filters or changing your query.')
                                        : __('You have not registered any users yet.')}
                                </p>
                                <div className="mt-5 flex gap-2">
                                    {hasActiveFilters && (
                                        <Button variant="outline" onClick={clearAllFilters}>
                                            {__('Clear all filters')}
                                        </Button>
                                    )}
                                    <Button onClick={handleCreateClick}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        {__('New User')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {users.data.map((user) => {
                                    const isSuperAdmin = isSuperAdminUser(user);
                                    const initials = getUserInitials(user.name);
                                    const colorBg = AVATAR_COLORS[user.id % AVATAR_COLORS.length];
                                    const isSelf = auth?.user?.id === user.id;

                                    return (
                                        <div
                                            key={user.id}
                                            className={cn(
                                                'group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
                                                user.is_locked && 'border-amber-400/60 dark:border-amber-600/40'
                                            )}
                                        >
                                            {/* Barra superior de acento */}
                                            <div
                                                className={cn(
                                                    'h-1.5 w-full bg-gradient-to-r',
                                                    isSuperAdmin
                                                        ? 'from-amber-400 via-yellow-400 to-amber-500'
                                                        : user.status === 'activo'
                                                        ? 'from-indigo-500 to-blue-500'
                                                        : user.status === 'suspendido'
                                                        ? 'from-red-500 to-rose-500'
                                                        : 'from-slate-400 to-slate-500'
                                                )}
                                            />

                                            <div className="flex flex-1 flex-col p-5">
                                                {/* Header de la tarjeta */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div
                                                            className={cn(
                                                                'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-sm ring-2 ring-background',
                                                                isSuperAdmin ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-900' : colorBg
                                                            )}
                                                        >
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <h3 className="font-semibold text-sm truncate text-foreground" title={user.name}>
                                                                    {user.name}
                                                                </h3>
                                                                {isSuperAdmin && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                                                            </div>
                                                            {user.username && (
                                                                <p className="text-[11px] font-mono text-muted-foreground truncate">
                                                                    @{user.username}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {renderActionMenu(user)}
                                                </div>

                                                {/* Contacto y Organización */}
                                                <div className="mt-4 space-y-2 text-xs">
                                                    <div className="flex items-center justify-between gap-1 text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-lg border">
                                                        <span className="truncate select-all" title={user.email}>
                                                            {user.email}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyEmail(user)}
                                                            className="text-muted-foreground hover:text-foreground shrink-0 p-0.5 rounded"
                                                            title={__('Copy email')}
                                                        >
                                                            {copiedEmailId === user.id ? (
                                                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                            ) : (
                                                                <Copy className="h-3.5 w-3.5" />
                                                            )}
                                                        </button>
                                                    </div>

                                                    {user.telefono && (
                                                        <div className="flex items-center gap-2 text-muted-foreground px-1">
                                                            <Phone className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                                                            <span className="truncate">{user.telefono}</span>
                                                        </div>
                                                    )}

                                                    {(user.empresa || user.sucursal) && (
                                                        <div className="space-y-1 pt-1 border-t px-1">
                                                            {user.empresa && (
                                                                <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                                                                    <Building2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                                    <span className="truncate">{user.empresa.razon_social}</span>
                                                                </div>
                                                            )}
                                                            {user.sucursal && (
                                                                <div className="flex items-center gap-1.5 text-muted-foreground pl-1">
                                                                    <GitBranch className="h-3 w-3 text-violet-500 shrink-0" />
                                                                    <span className="truncate">{user.sucursal.nombre}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Roles */}
                                                <div className="mt-4 pt-3 border-t">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roles.map((r) => {
                                                            const isSuper = ['Super Administrador', 'super-admin', 'Super Admin'].includes(r.name);

                                                            return (
                                                                <Badge
                                                                    key={r.id}
                                                                    variant={isSuper ? 'default' : 'secondary'}
                                                                    className={cn(
                                                                        'text-[10px] capitalize font-medium py-0.5',
                                                                        isSuper && 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                                                                    )}
                                                                >
                                                                    {r.name}
                                                                </Badge>
                                                            );
                                                        })}
                                                        {user.roles.length === 0 && (
                                                            <span className="text-[11px] text-muted-foreground italic">
                                                                {__('No roles assigned')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Indicadores de Seguridad SOX */}
                                                <div className="mt-3">
                                                    {renderSecurityBadges(user)}
                                                </div>

                                                {/* Espaciador dinámico */}
                                                <div className="min-h-4 flex-1" />

                                                {/* Footer con Switch y Botón de Gestión */}
                                                <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3">
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={user.status === 'activo'}
                                                            onCheckedChange={() => handleToggleStatus(user)}
                                                            disabled={isSelf}
                                                        />
                                                        <span
                                                            className={cn(
                                                                'text-[10px] font-semibold uppercase tracking-wider',
                                                                user.status === 'activo'
                                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                                    : user.status === 'suspendido'
                                                                    ? 'text-red-600 dark:text-red-400'
                                                                    : 'text-slate-500'
                                                            )}
                                                        >
                                                            {__(user.status)}
                                                        </span>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-xs font-medium"
                                                        onClick={() => handleEditClick(user)}
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
                        {users.data.length > 0 && <Pagination paginatedData={users} filters={filters} />}
                    </div>
                )}
            </div>

            {/* ── Modal de Creación / Edición / Duplicación ───────────────────── */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                        <DialogHeader className="border-b p-6 pb-4 text-left">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                                    {editingUser ? (
                                        <Pencil className="h-5 w-5" />
                                    ) : duplicatingUser ? (
                                        <Copy className="h-5 w-5" />
                                    ) : (
                                        <Plus className="h-5 w-5" />
                                    )}
                                </div>
                                <div>
                                    <DialogTitle>
                                        {editingUser
                                            ? __('Edit User')
                                            : duplicatingUser
                                            ? __('Duplicate User')
                                            : __('New User')}
                                    </DialogTitle>
                                    <DialogDescription className="mt-0.5">
                                        {duplicatingUser
                                            ? `${__('Duplicating user characteristics from')} ${duplicatingUser.name}.`
                                            : __('Complete user credentials, personal details and select roles.')}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Alerta si el usuario está bloqueado */}
                        {editingUser?.is_locked && (
                            <div className="mx-6 mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                                <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 shrink-0 text-amber-600" />
                                    <span>
                                        {__('Account locked due to consecutive failed attempts.')}{' '}
                                        <span className="font-semibold">({editingUser.lockout_remaining_minutes} min {__('remaining')})</span>
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUnlockUser(editingUser)}
                                    className="h-7 border-amber-400 bg-white hover:bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100"
                                >
                                    <Unlock className="mr-1.5 h-3.5 w-3.5" />
                                    {__('Unlock now')}
                                </Button>
                            </div>
                        )}

                        <div className="min-h-0 flex-1 overflow-y-auto p-6">
                            <Tabs value={modalTab} onValueChange={(v: any) => setModalTab(v)} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-5">
                                    <TabsTrigger value="general" className="text-xs font-medium">
                                        {__('Personal Info')}
                                    </TabsTrigger>
                                    <TabsTrigger value="security" className="text-xs font-medium">
                                        {__('Security & Access')}
                                    </TabsTrigger>
                                    <TabsTrigger value="roles" className="text-xs font-medium">
                                        {__('Roles')} ({data.roles.length})
                                    </TabsTrigger>
                                </TabsList>

                                {/* ── Tab 1: Información Personal ── */}
                                <TabsContent value="general" className="space-y-4 focus-visible:outline-none">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Nombre Completo */}
                                        <div className="md:col-span-2">
                                            <Label htmlFor="name" className="text-xs font-semibold">{__('Full Name')} *</Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="Ej: John Doe"
                                                className="mt-1.5"
                                                required
                                            />
                                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                        </div>

                                        {/* Nombre de usuario */}
                                        <div>
                                            <Label htmlFor="username" className="text-xs font-semibold">{__('Username')}</Label>
                                            <Input
                                                id="username"
                                                value={data.username}
                                                onChange={(e) => setData('username', e.target.value)}
                                                placeholder="Ej: jdoe"
                                                className="mt-1.5"
                                            />
                                            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <Label htmlFor="email" className="text-xs font-semibold">{__('Email')} *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="jdoe@empresa.com"
                                                className="mt-1.5"
                                                required
                                            />
                                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                                        </div>

                                        {/* Teléfono con selector de país */}
                                        <div className="md:col-span-2">
                                            <Label htmlFor="telefono" className="text-xs font-semibold">{__('Phone')}</Label>
                                            <div className="mt-1.5">
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
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* ── Tab 2: Seguridad y Acceso ── */}
                                <TabsContent value="security" className="space-y-5 focus-visible:outline-none">
                                    {/* Contraseña con generador seguro */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password" className="text-xs font-semibold">
                                                {__('Password')} {editingUser ? `(${__('Leave blank to keep current password')})` : '*'}
                                            </Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleGeneratePassword}
                                                className="h-7 text-xs gap-1.5 text-indigo-600 dark:text-indigo-400 border-indigo-200 hover:bg-indigo-50"
                                            >
                                                <Sparkles className="h-3 w-3" />
                                                {__('Generate secure password')}
                                            </Button>
                                        </div>

                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                placeholder="••••••••••••••••"
                                                className="pr-10"
                                                required={!editingUser}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                aria-label={showPassword ? __('Hide password') : __('Show password')}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}

                                        {/* Validador interactivo SOX */}
                                        {(!editingUser || data.password.length > 0) && (
                                            <div className="mt-3">
                                                <SoxPasswordRequirements
                                                    password={data.password}
                                                    minLength={soxPolicies?.minLength ?? 15}
                                                    historyLimit={soxPolicies?.historyLimit ?? 8}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Estado, Empresa y Sucursal */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                                        {/* Estado */}
                                        <div>
                                            <Label htmlFor="status" className="text-xs font-semibold">{__('Status')} *</Label>
                                            <Select
                                                value={data.status}
                                                onValueChange={(v: 'activo' | 'inactivo' | 'suspendido') => setData('status', v)}
                                            >
                                                <SelectTrigger id="status" className="w-full mt-1.5">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="activo">{__('Active')}</SelectItem>
                                                    <SelectItem value="inactivo">{__('Inactive')}</SelectItem>
                                                    <SelectItem value="suspendido">{__('Suspended')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.status && <p className="text-xs text-red-500 mt-1">{errors.status}</p>}
                                        </div>

                                        {/* Empresa */}
                                        <div>
                                            <Label htmlFor="empresa_id" className="text-xs font-semibold">{__('Company')}</Label>
                                            <Select
                                                value={String(data.empresa_id)}
                                                onValueChange={(v) => {
                                                    setData((prev) => ({
                                                        ...prev,
                                                        empresa_id: v,
                                                        sucursal_id: '',
                                                    }));
                                                }}
                                            >
                                                <SelectTrigger id="empresa_id" className="w-full mt-1.5">
                                                    <SelectValue placeholder={__('None')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">{__('None')}</SelectItem>
                                                    {empresas.map((e) => (
                                                        <SelectItem key={e.id} value={String(e.id)}>
                                                            {e.razon_social}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.empresa_id && <p className="text-xs text-red-500 mt-1">{errors.empresa_id}</p>}
                                        </div>

                                        {/* Sucursal */}
                                        <div>
                                            <Label htmlFor="sucursal_id" className="text-xs font-semibold">{__('Branch')}</Label>
                                            <Select
                                                value={String(data.sucursal_id)}
                                                onValueChange={(v) => setData('sucursal_id', v)}
                                                disabled={!data.empresa_id}
                                            >
                                                <SelectTrigger id="sucursal_id" className="w-full mt-1.5">
                                                    <SelectValue placeholder={data.empresa_id ? __('None') : __('Select a company first')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">{__('None')}</SelectItem>
                                                    {filteredSucursales.map((s) => (
                                                        <SelectItem key={s.id} value={String(s.id)}>
                                                            {s.nombre}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.sucursal_id && <p className="text-xs text-red-500 mt-1">{errors.sucursal_id}</p>}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* ── Tab 3: Roles ── */}
                                <TabsContent value="roles" className="space-y-4 focus-visible:outline-none">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-sm font-semibold">{__('Assign Roles')}</Label>
                                            <p className="text-xs text-muted-foreground">
                                                {__('Assign one or more roles to define system access levels.')}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="text-xs font-semibold">
                                            {data.roles.length} {data.roles.length === 1 ? __('role') : __('roles')} {__('selected')}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                                        {roles.map((r) => {
                                            const isChecked = data.roles.includes(r.name);
                                            const isSuper = ['Super Administrador', 'super-admin', 'Super Admin', 'super_admin'].includes(r.name);

                                            return (
                                                <label
                                                    key={r.id}
                                                    htmlFor={`role-check-${r.id}`}
                                                    className={cn(
                                                        'flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all',
                                                        isChecked
                                                            ? isSuper
                                                                ? 'border-amber-400 bg-amber-50/70 dark:border-amber-700 dark:bg-amber-950/20'
                                                                : 'border-indigo-400 bg-indigo-50/70 dark:border-indigo-600 dark:bg-indigo-950/20'
                                                            : 'bg-card hover:bg-muted/40'
                                                    )}
                                                >
                                                    <Checkbox
                                                        id={`role-check-${r.id}`}
                                                        checked={isChecked}
                                                        onCheckedChange={(checked) => handleRoleChange(r.name, !!checked)}
                                                        className="mt-0.5"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs font-semibold capitalize text-foreground">
                                                                {r.name}
                                                            </span>
                                                            {isSuper && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                                            {isSuper
                                                                ? __('Unrestricted access across all modules (bypass).')
                                                                : __('Standard module access based on assigned permissions.')}
                                                        </p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    {errors.roles && <p className="text-xs text-red-500 mt-1">{errors.roles}</p>}
                                </TabsContent>
                            </Tabs>
                        </div>

                        <DialogFooter className="flex-row items-center justify-between gap-2 border-t bg-muted/20 p-4 sm:justify-between">
                            <span className="hidden text-xs text-muted-foreground sm:inline">
                                {editingUser ? __('Changes apply immediately.') : __('User will be created with selected credentials.')}
                            </span>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={processing}>
                                    {__('Cancel')}
                                </Button>
                                <Button type="submit" disabled={processing} className="font-semibold">
                                    {processing
                                        ? __('Saving...')
                                        : editingUser
                                        ? __('Save Changes')
                                        : duplicatingUser
                                        ? __('Duplicate User')
                                        : __('Create User')}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── AlertDialog de Confirmación para Eliminar ─────────────────── */}
            <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                            <Trash2 className="h-5 w-5" />
                        </div>
                        <AlertDialogTitle>{__('Delete User')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {__('Are you sure you want to delete the user')}{' '}
                            <strong className="text-foreground">{deletingUser?.name}</strong>?{' '}
                            {__('This action cannot be undone and will revoke all access for this user.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
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
