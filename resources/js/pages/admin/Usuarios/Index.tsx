import { Head, useForm, router } from '@inertiajs/react';
import {
    User as UserIcon,
    Plus,
    CheckCircle,
    XCircle,
    MoreVertical,
    Pencil,
    Trash2,
    ToggleRight,
    Building2,
    GitBranch,
    ShieldAlert,
    ShieldCheck,
    Shield,
    Lock,
    Unlock,
    Phone,
    Copy,
    Users,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import PasswordInput from '@/components/password-input';
import { SoxPasswordRequirements } from '@/components/sox-password-requirements';
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
import { cn, cleanParams } from '@/lib/utils';
import type { Auth } from '@/types';
import type { Paginated } from '@/types/app';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PhoneInputGroup from '../Empresas/Partials/PhoneInputGroup';
import { usePermission } from '@/hooks/use-permission';
import { Can } from '@/components/can';

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

interface Group {
    id: number;
    name: string;
    description?: string | null;
    roles?: Role[];
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
    groups?: Group[];
    pais_telefono?: Pais | null;
    is_locked?: boolean;
    lockout_remaining_minutes?: number;
    days_remaining?: number;
    is_expired?: boolean;
}

interface UsersPageProps {
    auth: Auth;
    users: Paginated<User>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
    };
    soxPolicies?: {
        minLength: number;
        historyLimit: number;
        expireDays: number;
    };
    roles: Role[];
    groups: Group[];
    empresas: Empresa[];
    sucursales: Sucursal[];
    paises: Pais[];
    filters: {
        search?: string;
        status?: string;
        role?: string;
        empresa_id?: string;
        group_id?: string;
        perPage?: string;
    };
}

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
    groups: [] as number[],
};

export default function UsersIndexPage({
    auth, users, stats, soxPolicies, roles, groups = [], empresas, sucursales, paises, filters,
}: UsersPageProps) {
    const { __ } = useTranslate();
    const { can } = usePermission();
    const canCreate = can('users.create');
    const canEdit = can('users.edit');
    const canDelete = can('users.delete');

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Users'), href: '/admin/usuarios' },
    ];

    // ── Estados ────────────────────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [duplicatingUser, setDuplicatingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [isTableLoading, setIsTableLoading] = useState(false);
    const [userModalTab, setUserModalTab] = useState<'cuenta' | 'permisos'>('cuenta');

    const handleUnlockUser = (user: User) => {
        router.post(`/admin/usuarios/${user.id}/unlock`, {}, {
            preserveScroll: true,
            onSuccess: () => notifySuccess(`Cuenta de ${user.name} desbloqueada exitosamente.`),
            onError: () => notifyError('Error al desbloquear el usuario.'),
        });
    };

    // Filtros
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [empresaFilter, setEmpresaFilter] = useState(filters.empresa_id || '');
    const [groupFilter, setGroupFilter] = useState(filters.group_id || '');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '10');

    // Navigation indicators
    React.useEffect(() => {
        const unbindStart = router.on('start', () => setIsTableLoading(true));
        const unbindFinish = router.on('finish', () => setIsTableLoading(false));

        return () => {
 unbindStart(); unbindFinish(); 
};
    }, []);

    // Filter Query debouncing
    React.useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                window.location.pathname,
                cleanParams({
                    search: searchTerm,
                    status: statusFilter,
                    role: roleFilter,
                    empresa_id: empresaFilter,
                    group_id: groupFilter,
                    perPage: perPageFilter,
                }),
                { preserveState: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, roleFilter, empresaFilter, groupFilter, perPageFilter]);

    // Formulario Inertia
    const { data, setData, post, put, processing, errors, reset } = useForm(initialForm);

    // Roles heredados calculados a partir de los grupos seleccionados
    const inheritedRoleNames = useMemo(() => {
        const roleSet = new Set<string>();
        groups
            .filter((g) => data.groups.includes(g.id))
            .forEach((g) => {
                g.roles?.forEach((r) => roleSet.add(r.name));
            });
        return Array.from(roleSet);
    }, [data.groups, groups]);

    // Filtrar sucursales según la empresa seleccionada
    const filteredSucursales = useMemo(() => {
        if (!data.empresa_id) {
return [];
}

        return sucursales.filter((s) => s.empresa_id === Number(data.empresa_id));
    }, [data.empresa_id, sucursales]);

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleCreateClick = () => {
        setEditingUser(null);
        setDuplicatingUser(null);
        setUserModalTab('cuenta');
        reset();
        setData('groups', []);
        setData('roles', []);
        setIsModalOpen(true);
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setDuplicatingUser(null);
        setUserModalTab('cuenta');
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
            groups: user.groups ? user.groups.map((g) => g.id) : [],
        });
        setIsModalOpen(true);
    };

    const handleDuplicateClick = (user: User) => {
        setEditingUser(null);
        setDuplicatingUser(user);
        setUserModalTab('cuenta');
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
            groups: user.groups ? user.groups.map((g) => g.id) : [],
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingUser) {
            put(`/admin/usuarios/${editingUser.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingUser(null);
                    setDuplicatingUser(null);
                    reset();
                    notifySuccess(__('User updated successfully.'));
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        } else {
            post('/admin/usuarios', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setDuplicatingUser(null);
                    reset();
                    notifySuccess(__('User created successfully.'));
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        }
    };

    const handleToggleStatus = (user: User) => {
        router.patch(`/admin/usuarios/${user.id}/toggle-status`, {}, { preserveScroll: true });
    };

    const handleDeleteConfirm = () => {
        if (!deletingUser) {
return;
}

        router.delete(`/admin/usuarios/${deletingUser.id}`, {
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

    const handleGroupChange = (groupId: number, checked: boolean) => {
        if (checked) {
            setData('groups', [...data.groups, groupId]);
        } else {
            setData('groups', data.groups.filter((id) => id !== groupId));
        }
    };

    // ── Columnas de la Tabla ───────────────────────────────────────────────────

    const columns: ColumnDef<User>[] = [
        {
            header: __('User'),
            accessorKey: 'name',
            className: 'font-medium',
            cell: (user) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm text-indigo-600 dark:text-indigo-400">
                        {user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-medium text-sm leading-none">{user.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                    </div>
                </div>
            ),
        },
        {
            header: __('Grupo (Role Group)'),
            cell: (user) => (
                <div className="flex flex-wrap gap-1">
                    {user.groups && user.groups.length > 0 ? (
                        user.groups.map((g) => (
                            <Badge key={g.id} variant="outline" className="text-[10px] bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200">
                                <Users className="w-2.5 h-2.5 mr-1 text-sky-500" />
                                {g.name}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                    )}
                </div>
            ),
        },
        {
            header: __('Role'),
            cell: (user) => (
                <div className="flex flex-wrap gap-1">
                    {user.roles.map((r) => (
                        <Badge key={r.id} variant="secondary" className="capitalize text-[10px]">
                            {r.name}
                        </Badge>
                    ))}
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
                            <Building2 className="w-3 h-3 text-indigo-500" />
                            {user.empresa.razon_social}
                        </div>
                    )}
                    {user.sucursal && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <GitBranch className="w-3 h-3 text-violet-500" />
                            {user.sucursal.nombre}
                        </div>
                    )}
                    {!user.empresa && !user.sucursal && (
                        <span className="text-xs text-muted-foreground">—</span>
                    )}
                </div>
            ),
        },
        {
            header: __('Phone'),
            hideOn: 'mobile',
            cell: (user) => (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    {user.telefono ?? '—'}
                </span>
            ),
        },
        {
            header: __('Status'),
            stopRowClick: true,
            cell: (user) => (
                <div className="flex flex-col gap-1 items-start">
                    <div className="flex items-center space-x-2">
                        <Switch
                            disabled={!canEdit}
                            checked={user.status === 'activo'}
                            onCheckedChange={() => canEdit && handleToggleStatus(user)}
                        />
                        <span className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full border capitalize',
                            user.status === 'activo'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                                : user.status === 'suspendido'
                                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900'
                                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                        )}>
                            {__(user.status)}
                        </span>
                    </div>
                    {user.is_locked ? (
                        <Badge className="bg-red-600 text-white gap-1 text-[10px] mt-0.5">
                            <Lock className="size-2.5" />
                            Bloqueado SOX ({user.lockout_remaining_minutes ?? 15}m)
                        </Badge>
                    ) : user.is_expired ? (
                        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] mt-0.5">
                            Contraseña Caducada
                        </Badge>
                    ) : null}
                </div>
            ),
        },
        {
            header: __('Actions'),
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (user) => {
                const hasAnyAction = canEdit || canDelete || canCreate;
                if (!hasAnyAction) return null;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {canEdit && user.is_locked && (
                                <DropdownMenuItem onClick={() => handleUnlockUser(user)} className="text-red-600 font-semibold focus:text-red-700">
                                    <Unlock className="mr-2 h-4 w-4" />
                                    Desbloquear (SOX)
                                </DropdownMenuItem>
                            )}
                            {canEdit && (
                                <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    {__('Edit')}
                                </DropdownMenuItem>
                            )}
                            {canCreate && (
                                <DropdownMenuItem onClick={() => handleDuplicateClick(user)}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    {__('Duplicate')}
                                </DropdownMenuItem>
                            )}
                            {canEdit && (
                                <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                    <ToggleRight className="mr-2 h-4 w-4" />
                                    {user.status === 'activo' ? __('Deactivate') : __('Activate')}
                                </DropdownMenuItem>
                            )}
                            {canDelete && (
                                <DropdownMenuItem
                                    onClick={() => setDeletingUser(user)}
                                    className="text-red-600 focus:text-red-600 dark:text-red-400"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {__('Delete')}
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
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
                    colorClassName="bg-slate-600"
                >
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.get('/admin/seguridad/sox')}
                            className="gap-1.5 text-xs border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        >
                            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                            Cumplimiento SOX
                        </Button>
                        <Can permission="users.create">
                            <Button onClick={handleCreateClick}>
                                <Plus className="mr-2 h-4 w-4" />
                                {__('New User')}
                            </Button>
                        </Can>
                    </div>
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard
                        icon={<UserIcon className="h-6 w-6" />}
                        title={__('TOTAL USERS')}
                        value={stats.total}
                        colorClassName="bg-slate-100 text-slate-600"
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
                                placeholder={__('Search by name, email...')}
                                className="w-full md:w-80"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Role')}>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-full md:w-48">
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
                        </FilterField>
                        <FilterField label={__('Grupo')}>
                            <Select value={groupFilter} onValueChange={setGroupFilter}>
                                <SelectTrigger className="w-full md:w-52">
                                    <SelectValue placeholder={__('Todos los grupos')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('Todos los grupos')}</SelectItem>
                                    {groups.map((g) => (
                                        <SelectItem key={g.id} value={String(g.id)}>
                                            {g.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                    <SelectItem value="activo">{__('Active')}</SelectItem>
                                    <SelectItem value="inactivo">{__('Inactive')}</SelectItem>
                                    <SelectItem value="suspendido">{__('Suspended')}</SelectItem>
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
                        data={users}
                        columns={columns}
                        isLoading={isTableLoading}
                        onRowClick={(user) => {
                            if (canEdit) handleEditClick(user);
                        }}
                        emptyState={{
                            title: __('No users found'),
                            description: searchTerm || statusFilter || roleFilter || empresaFilter
                                ? __('Try clearing your search filters or changing your query.')
                                : __('You have not registered any users yet.'),
                            ctaLabel: canCreate ? __('New User') : undefined,
                            onCtaClick: canCreate ? handleCreateClick : undefined,
                        }}
                    />
                </div>
            </div>

            {/* Modal Creación / Edición */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[92vw] md:max-w-4xl lg:max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl shadow-2xl">
                    <DialogHeader className="p-6 pb-4 border-b bg-white dark:bg-slate-900 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                <UserIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                    {editingUser
                                        ? __('Edit User')
                                        : duplicatingUser
                                        ? __('Duplicate User')
                                        : __('New User')}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    {duplicatingUser
                                        ? `${__('Duplicating user characteristics from')} ${duplicatingUser.name}. ${__('Please enter a new email and password.')}`
                                        : __('Complete user credentials, personal details and select roles.')}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <Tabs value={userModalTab} onValueChange={(val: any) => setUserModalTab(val)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-6 h-11 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                    <TabsTrigger value="cuenta" className="flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm">
                                        <UserIcon className="w-4 h-4" />
                                        {__('1. Datos del Usuario y Cuenta')}
                                        {(errors.name || errors.email || errors.username || errors.password) && (
                                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="permisos" className="flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm">
                                        <Shield className="w-4 h-4" />
                                        {__('2. Grupos de Roles & Permisos (RBAC)')}
                                        {data.groups.length > 0 && (
                                            <Badge className="bg-sky-500 hover:bg-sky-500 text-white text-[10px] px-1.5 py-0 h-4 font-semibold">
                                                {data.groups.length} {data.groups.length === 1 ? __('grupo') : __('grupos')}
                                            </Badge>
                                        )}
                                        {((errors as any).groups || errors.roles) && (
                                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                        )}
                                    </TabsTrigger>
                                </TabsList>

                                {/* Tab 1: Datos Personales, Credenciales, Empresa */}
                                <TabsContent value="cuenta" className="space-y-4 focus-visible:outline-none focus-visible:ring-0 mt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Nombre completo */}
                                        <div className="md:col-span-2 space-y-1.5">
                                            <Label htmlFor="name" className="text-xs font-semibold">{__('Full Name')} *</Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="Ej: John Doe"
                                                required
                                                className="h-9"
                                            />
                                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                        </div>

                                        {/* Usuario */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="username" className="text-xs font-semibold">{__('Username')}</Label>
                                            <Input
                                                id="username"
                                                value={data.username}
                                                onChange={(e) => setData('username', e.target.value)}
                                                placeholder="Ej: jdoe"
                                                className="h-9"
                                            />
                                            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                                        </div>

                                        {/* Correo */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="email" className="text-xs font-semibold">{__('Email')} *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="jdoe@empresa.com"
                                                required
                                                className="h-9"
                                            />
                                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                        </div>

                                        {/* Contraseña */}
                                        <div className="md:col-span-2 space-y-2">
                                            <Label htmlFor="password" className="text-xs font-semibold">
                                                {__('Password')} {editingUser ? `(${__('Leave blank to keep current password')})` : '*'}
                                            </Label>
                                            <PasswordInput
                                                id="password"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                placeholder={!editingUser ? `Mínimo ${soxPolicies?.minLength ?? 15} caracteres (Política SOX)` : '•••••••••••••••'}
                                                required={!editingUser}
                                            />
                                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}

                                            {(!editingUser || data.password.length > 0) && (
                                                <SoxPasswordRequirements
                                                    password={data.password}
                                                    minLength={soxPolicies?.minLength ?? 15}
                                                    historyLimit={soxPolicies?.historyLimit ?? 8}
                                                />
                                            )}
                                        </div>

                                        {/* Teléfono */}
                                        <div className="md:col-span-2 space-y-1.5">
                                            <Label htmlFor="telefono" className="text-xs font-semibold">{__('Phone')}</Label>
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
                                        <div className="space-y-1.5">
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
                                                <SelectTrigger id="empresa_id" className="w-full h-9">
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
                                            {errors.empresa_id && <p className="text-red-500 text-xs mt-1">{errors.empresa_id}</p>}
                                        </div>

                                        {/* Sucursal */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="sucursal_id" className="text-xs font-semibold">{__('Branch')}</Label>
                                            <Select
                                                value={String(data.sucursal_id)}
                                                onValueChange={(v) => setData('sucursal_id', v)}
                                                disabled={!data.empresa_id}
                                            >
                                                <SelectTrigger id="sucursal_id" className="w-full h-9">
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
                                            {errors.sucursal_id && <p className="text-red-500 text-xs mt-1">{errors.sucursal_id}</p>}
                                        </div>

                                        {/* Estado */}
                                        <div className="md:col-span-2 space-y-1.5">
                                            <Label htmlFor="status" className="text-xs font-semibold">{__('Status')} *</Label>
                                            <Select
                                                value={data.status}
                                                onValueChange={(v: 'activo' | 'inactivo' | 'suspendido') => setData('status', v)}
                                            >
                                                <SelectTrigger id="status" className="w-full h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="activo">{__('Active')}</SelectItem>
                                                    <SelectItem value="inactivo">{__('Inactive')}</SelectItem>
                                                    <SelectItem value="suspendido">{__('Suspended')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Tab 2: Grupos y Roles */}
                                <TabsContent value="permisos" className="space-y-6 focus-visible:outline-none focus-visible:ring-0 mt-0">
                                    {/* Grupos (Group-Based Role Management) */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="font-bold text-sm flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                                                    <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                                                    {__('Asignar a Grupos (Role Groups)')}
                                                </Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {__('Recomendado: El usuario heredará automáticamente todos los roles y permisos del grupo.')}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="text-xs border-sky-300 text-sky-700 dark:text-sky-400 font-semibold bg-sky-50 dark:bg-sky-950/40">
                                                {data.groups.length} {__('seleccionado(s)')}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {groups.map((g) => {
                                                const isChecked = data.groups.includes(g.id);
                                                return (
                                                    <div
                                                        key={g.id}
                                                        className={cn(
                                                            "flex items-start space-x-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none",
                                                            isChecked 
                                                                ? "bg-sky-50/70 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700 shadow-xs" 
                                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                                                        )}
                                                        onClick={() => handleGroupChange(g.id, !isChecked)}
                                                    >
                                                        <Checkbox
                                                            id={`group-check-${g.id}`}
                                                            checked={isChecked}
                                                            onCheckedChange={(checked) => handleGroupChange(g.id, !!checked)}
                                                            className="mt-0.5"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <div className="space-y-1 min-w-0 flex-1">
                                                            <Label
                                                                htmlFor={`group-check-${g.id}`}
                                                                className="text-xs font-bold leading-none cursor-pointer select-none text-slate-800 dark:text-slate-200 block truncate"
                                                            >
                                                                {g.name}
                                                            </Label>
                                                            {g.description && (
                                                                <p className="text-[11px] text-muted-foreground line-clamp-2">
                                                                    {g.description}
                                                                </p>
                                                            )}
                                                            {g.roles && g.roles.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 pt-1">
                                                                    {g.roles.map((r) => (
                                                                        <span key={r.id} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                                                            Hereda: {r.name}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {groups.length === 0 && (
                                                <p className="text-xs text-muted-foreground col-span-2 text-center py-6">
                                                    {__('No hay grupos creados todavía.')}
                                                </p>
                                            )}
                                        </div>
                                        {(errors as any).groups && <p className="text-red-500 text-xs mt-1">{(errors as any).groups}</p>}
                                    </div>

                                    {/* Resumen de Roles Heredados */}
                                    {inheritedRoleNames.length > 0 && (
                                        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                                            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                                            <div>
                                                <p className="font-bold">
                                                    {__('Roles activos conferidos por el grupo')} ({inheritedRoleNames.length}):
                                                </p>
                                                <p className="text-[11px] text-muted-foreground mb-1.5">
                                                    {__('El usuario ya cuenta con estos privilegios por pertenecer a sus grupos organizacionales.')}
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {inheritedRoleNames.map((roleName) => (
                                                        <Badge key={roleName} className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] capitalize font-semibold shadow-xs">
                                                            ✓ {roleName}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Roles Directos Adicionales */}
                                    <div className="space-y-3 border-t pt-4">
                                        <div>
                                            <Label className="font-bold text-sm flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                                                <ShieldAlert className="w-4 h-4 text-slate-500" />
                                                {__('Roles Directos Adicionales (Opcional)')}
                                            </Label>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {__('Usa esto únicamente para excepciones individuales o roles temporales específicos que no pertenezcan al grupo.')}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50/60 dark:bg-slate-900/40 p-4 rounded-xl border">
                                            {roles.map((r) => {
                                                const isInherited = inheritedRoleNames.includes(r.name);
                                                return (
                                                    <div key={r.id} className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800/50 transition-colors">
                                                        <Checkbox
                                                            id={`role-check-${r.id}`}
                                                            checked={data.roles.includes(r.name) || isInherited}
                                                            disabled={isInherited}
                                                            onCheckedChange={(checked) => handleRoleChange(r.name, !!checked)}
                                                        />
                                                        <Label
                                                            htmlFor={`role-check-${r.id}`}
                                                            className={cn(
                                                                "text-xs font-medium leading-none cursor-pointer select-none capitalize",
                                                                isInherited && "text-emerald-700 dark:text-emerald-400 font-semibold cursor-default"
                                                            )}
                                                        >
                                                            {r.name}
                                                            {isInherited && (
                                                                <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                                                                    ({__('Heredado')})
                                                                </span>
                                                            )}
                                                        </Label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {errors.roles && <p className="text-red-500 text-xs mt-1">{errors.roles}</p>}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Footer fijo */}
                        <DialogFooter className="p-4 px-6 border-t bg-slate-50/70 dark:bg-slate-900/60 shrink-0 flex items-center justify-between sm:justify-between">
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <span>{data.groups.length} {__('grupo(s)')}</span>
                                <span>•</span>
                                <span>{data.roles.length + inheritedRoleNames.length} {__('roles totales')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={processing}
                                >
                                    {__('Cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || (!editingUser && data.password.length < (soxPolicies?.minLength ?? 15))}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                                >
                                    {processing ? __('Saving...') : __('Save Changes')}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* AlertDialog de confirmación de eliminación */}
            <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{__('Delete User')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {__('Are you sure you want to delete the user')}{' '}
                            <strong>{deletingUser?.name}</strong>?{' '}
                            {__('This action cannot be undone.')}
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
