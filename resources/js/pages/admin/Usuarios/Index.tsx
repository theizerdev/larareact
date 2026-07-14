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
    Phone,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, cleanParams } from '@/lib/utils';
import type { Auth } from '@/types';
import type { Paginated } from '@/types/app';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
}

interface UsersPageProps {
    auth: Auth;
    users: Paginated<User>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
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
};

export default function UsersIndexPage({
    auth, users, stats, roles, empresas, sucursales, paises, filters,
}: UsersPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Users'), href: '/admin/usuarios' },
    ];

    // ── Estados ────────────────────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [isTableLoading, setIsTableLoading] = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [empresaFilter, setEmpresaFilter] = useState(filters.empresa_id || '');
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
                    perPage: perPageFilter,
                }),
                { preserveState: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, roleFilter, empresaFilter, perPageFilter]);

    // Formulario Inertia
    const { data, setData, post, put, processing, errors, reset } = useForm(initialForm);

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
        reset();
        setIsModalOpen(true);
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingUser) {
            put(`/admin/usuarios/${editingUser.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingUser(null);
                    reset();
                    notifySuccess(__('User updated successfully.'));
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        } else {
            post('/admin/usuarios', {
                onSuccess: () => {
                    setIsModalOpen(false);
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

    // ── Columnas de la Tabla ───────────────────────────────────────────────────

    const columns: ColumnDef<User>[] = [
        {
            header: 'User',
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
            header: 'Role',
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
            header: 'Company / Branch',
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
            header: 'Phone',
            hideOn: 'mobile',
            cell: (user) => (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    {user.telefono ?? '—'}
                </span>
            ),
        },
        {
            header: 'Status',
            stopRowClick: true,
            cell: (user) => (
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={user.status === 'activo'}
                        onCheckedChange={() => handleToggleStatus(user)}
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
            ),
        },
        {
            header: 'Actions',
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (user) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(user)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                            <ToggleRight className="mr-2 h-4 w-4" />
                            {user.status === 'activo' ? __('Deactivate') : __('Activate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setDeletingUser(user)}
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
                    <Button onClick={handleCreateClick}>
                        <Plus className="mr-2 h-4 w-4" />
                        {__('New User')}
                    </Button>
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
                        onRowClick={(user) => handleEditClick(user)}
                        emptyState={{
                            title: 'No users found',
                            description: searchTerm || statusFilter || roleFilter || empresaFilter
                                ? 'Try clearing your search filters or changing your query.'
                                : 'You have not registered any users yet.',
                            ctaLabel: 'New User',
                            onCtaClick: handleCreateClick,
                        }}
                    />
                </div>
            </div>

            {/* Modal Creación / Edición */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editingUser ? __('Edit User') : __('New User')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Complete user credentials, personal details and select roles.')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {/* Nombre completo */}
                            <div className="md:col-span-2">
                                <Label htmlFor="name">{__('Full Name')} *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Ej: John Doe"
                                    required
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            {/* Usuario */}
                            <div>
                                <Label htmlFor="username">{__('Username')}</Label>
                                <Input
                                    id="username"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    placeholder="Ej: jdoe"
                                />
                                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                            </div>

                            {/* Correo */}
                            <div>
                                <Label htmlFor="email">{__('Email')} *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="jdoe@empresa.com"
                                    required
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>

                            {/* Contraseña */}
                            <div className="md:col-span-2">
                                <Label htmlFor="password">
                                    {__('Password')} {editingUser ? `(${__('Leave blank to keep current password')})` : '*'}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    required={!editingUser}
                                />
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
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
                            <div>
                                <Label htmlFor="empresa_id">{__('Company')}</Label>
                                <Select
                                    value={String(data.empresa_id)}
                                    onValueChange={(v) => {
                                        setData((prev) => ({
                                            ...prev,
                                            empresa_id: v,
                                            sucursal_id: '', // Reset sucursal if company changes
                                        }));
                                    }}
                                >
                                    <SelectTrigger id="empresa_id" className="w-full">
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
                            <div>
                                <Label htmlFor="sucursal_id">{__('Branch')}</Label>
                                <Select
                                    value={String(data.sucursal_id)}
                                    onValueChange={(v) => setData('sucursal_id', v)}
                                    disabled={!data.empresa_id}
                                >
                                    <SelectTrigger id="sucursal_id" className="w-full">
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
                            <div className="md:col-span-2">
                                <Label htmlFor="status">{__('Status')} *</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(v: 'activo' | 'inactivo' | 'suspendido') => setData('status', v)}
                                >
                                    <SelectTrigger id="status" className="w-full">
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

                            {/* Roles */}
                            <div className="md:col-span-2 border-t pt-4 mt-2">
                                <Label className="font-bold flex items-center gap-1.5 mb-3">
                                    <ShieldAlert className="w-4 h-4 text-slate-500" />
                                    {__('Assign Roles')}
                                </Label>
                                <div className="grid grid-cols-2 gap-3 bg-muted/40 p-4 rounded-lg border">
                                    {roles.map((r) => (
                                        <div key={r.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`role-check-${r.id}`}
                                                checked={data.roles.includes(r.name)}
                                                onCheckedChange={(checked) => handleRoleChange(r.name, !!checked)}
                                            />
                                            <Label
                                                htmlFor={`role-check-${r.id}`}
                                                className="text-xs font-medium leading-none cursor-pointer select-none capitalize"
                                            >
                                                {r.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {errors.roles && <p className="text-red-500 text-xs mt-1">{errors.roles}</p>}
                            </div>
                        </div>

                        <DialogFooter className="mt-6 pt-6 border-t">
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
