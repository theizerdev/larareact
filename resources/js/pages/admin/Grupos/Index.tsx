import { Head, useForm, router } from '@inertiajs/react';
import {
    Users,
    Plus,
    CheckCircle,
    XCircle,
    MoreVertical,
    Pencil,
    Trash2,
    ToggleRight,
    Shield,
    ShieldCheck,
    Search,
    UserCheck,
    Info,
    Check,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { usePermission } from '@/hooks/use-permission';
import { useTranslate } from '@/hooks/use-translate';
import { cn, cleanParams } from '@/lib/utils';
import type { Auth } from '@/types';
import type { Paginated } from '@/types/app';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface RoleOption {
    id: number;
    name: string;
    permissions_count?: number;
}

interface UserOption {
    id: number;
    name: string;
    email: string;
}

interface GroupItem {
    id: number;
    name: string;
    slug?: string | null;
    description?: string | null;
    status: boolean;
    users_count: number;
    roles_count: number;
    roles: Array<{ id: number; name: string; permissions_count: number }>;
    users: Array<{ id: number; name: string; email: string }>;
    more_users_count: number;
    created_at: string;
}

interface GruposPageProps {
    auth: Auth;
    groups: Paginated<GroupItem>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
        total_users: number;
    };
    availableRoles: RoleOption[];
    availableUsers: UserOption[];
    filters: {
        search?: string;
        status?: string;
    };
}

const initialForm = {
    name: '',
    description: '',
    status: true,
    roles: [] as number[],
    users: [] as number[],
};

export default function GruposIndexPage({
    auth,
    groups,
    stats,
    availableRoles = [],
    availableUsers = [],
    filters,
}: GruposPageProps) {
    const { __ } = useTranslate();
    const { can } = usePermission();
    const canCreate = can('roles.create');
    const canEdit = can('roles.edit');
    const canDelete = can('roles.delete');

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Seguridad'), href: '/admin/usuarios' },
        { title: __('Grupos de Roles'), href: '/admin/grupos' },
    ];

    // Estados de UI
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<GroupItem | null>(null);
    const [deletingGroup, setDeletingGroup] = useState<GroupItem | null>(null);
    const [isTableLoading, setIsTableLoading] = useState(false);
    const [userSearch, setUserSearch] = useState('');

    // Filtros
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    // Formulario
    const { data, setData, post, put, processing, errors, reset } = useForm(initialForm);

    // Debounce filtros
    React.useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                window.location.pathname,
                cleanParams({
                    search: searchTerm,
                    status: statusFilter,
                }),
                { preserveState: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter]);

    // Handlers
    const handleCreateClick = () => {
        setEditingGroup(null);
        reset();
        setUserSearch('');
        setIsModalOpen(true);
    };

    const handleEditClick = (group: GroupItem) => {
        setEditingGroup(group);
        setUserSearch('');
        setData({
            name: group.name,
            description: group.description || '',
            status: group.status,
            roles: group.roles.map((r) => r.id),
            users: group.users.map((u) => u.id),
        });
        setIsModalOpen(true);
    };

    const handleToggleRole = (roleId: number) => {
        setData(
            'roles',
            data.roles.includes(roleId)
                ? data.roles.filter((id) => id !== roleId)
                : [...data.roles, roleId]
        );
    };

    const handleToggleUser = (userId: number) => {
        setData(
            'users',
            data.users.includes(userId)
                ? data.users.filter((id) => id !== userId)
                : [...data.users, userId]
        );
    };

    const handleSelectAllRoles = () => {
        setData('roles', availableRoles.map((r) => r.id));
    };

    const handleClearRoles = () => {
        setData('roles', []);
    };

    const handleSelectAllUsers = () => {
        const ids = filteredUsers.map((u) => u.id);
        const combined = Array.from(new Set([...data.users, ...ids]));
        setData('users', combined);
    };

    const handleClearUsers = () => {
        const filterIds = new Set(filteredUsers.map((u) => u.id));
        setData('users', data.users.filter((id) => !filterIds.has(id)));
    };

    const getInitials = (name: string) => {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingGroup) {
            put(`/admin/grupos/${editingGroup.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingGroup(null);
                    reset();
                    notifySuccess(__('Grupo actualizado exitosamente.'));
                },
                onError: () => notifyError(__('Por favor revisa los campos requeridos.')),
            });
        } else {
            post('/admin/grupos', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Grupo creado exitosamente.'));
                },
                onError: () => notifyError(__('Por favor revisa los campos requeridos.')),
            });
        }
    };

    const handleToggleStatus = (group: GroupItem) => {
        router.patch(
            `/admin/grupos/${group.id}/toggle-status`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => notifySuccess(__('Estado del grupo actualizado.')),
            }
        );
    };

    const handleDeleteConfirm = () => {
        if (!deletingGroup) return;

        router.delete(`/admin/grupos/${deletingGroup.id}`, {
            onSuccess: () => {
                setDeletingGroup(null);
                notifySuccess(__('Grupo eliminado exitosamente.'));
            },
            onError: () => notifyError(__('Hubo un error al eliminar el grupo.')),
        });
    };

    // Filtrar usuarios en modal
    const filteredUsers = availableUsers.filter((u) =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    // Columnas de tabla
    const columns: ColumnDef<GroupItem>[] = [
        {
            header: __('Grupo'),
            accessorKey: 'name',
            className: 'font-medium',
            cell: (group) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center font-bold text-sm text-sky-700 dark:text-sky-300 shrink-0">
                        <Users className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{group.name}</p>
                        {group.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-sm mt-0.5">{group.description}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: __('Roles Asignados (Permisos Heredados)'),
            cell: (group) => (
                <div className="flex flex-wrap gap-1.5 items-center">
                    {group.roles.map((r) => (
                        <Badge key={r.id} variant="secondary" className="text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                            <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                            {r.name}
                            <span className="ml-1 text-[10px] text-muted-foreground">({r.permissions_count} perm.)</span>
                        </Badge>
                    ))}
                    {group.roles.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">{__('Sin roles asignados')}</span>
                    )}
                </div>
            ),
        },
        {
            header: __('Miembros'),
            cell: (group) => (
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5 overflow-hidden">
                        {group.users.map((u) => (
                            <div
                                key={u.id}
                                title={u.name}
                                className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-center leading-6 text-slate-700 dark:text-slate-200"
                            >
                                {u.name.substring(0, 1).toUpperCase()}
                            </div>
                        ))}
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {group.users_count} {group.users_count === 1 ? __('usuario') : __('usuarios')}
                    </span>
                </div>
            ),
        },
        {
            header: __('Estado'),
            accessorKey: 'status',
            cell: (group) => (
                <div className="flex items-center gap-2">
                    {canEdit ? (
                        <Switch
                            checked={group.status}
                            onCheckedChange={() => handleToggleStatus(group)}
                            aria-label={__('Toggle status')}
                        />
                    ) : (
                        <Badge variant={group.status ? 'default' : 'secondary'} className="text-[10px]">
                            {group.status ? __('Activo') : __('Inactivo')}
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            id: 'actions',
            header: __('Actions'),
            className: 'text-right',
            cell: (group) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {canEdit && (
                            <DropdownMenuItem onClick={() => handleEditClick(group)} className="cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4" />
                                {__('Edit')}
                            </DropdownMenuItem>
                        )}
                        {canDelete && (
                            <DropdownMenuItem
                                onClick={() => setDeletingGroup(group)}
                                className="text-red-600 dark:text-red-400 cursor-pointer"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {__('Delete')}
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={__('Grupos de Roles')} />
            <Breadcrumbs breadcrumbs={breadcrumbs} />

            <ModuleHeader
                title={__('Grupos de Roles')}
                description={__('Define grupos organizacionales donde los usuarios heredan colectivamente roles y permisos de acuerdo a su función en la empresa.')}
                icon={<Users className="h-6 w-6 text-white" />}
                colorClassName="bg-slate-600"
            >
                {canCreate && (
                    <Button onClick={handleCreateClick} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                        <Plus className="w-4 h-4" />
                        {__('Nuevo Grupo')}
                    </Button>
                )}
            </ModuleHeader>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title={__('Total Grupos')}
                    value={stats.total}
                    icon={<Users className="w-5 h-5 text-sky-600" />}
                    colorClassName="bg-sky-100 dark:bg-sky-900/30"
                />
                <StatCard
                    title={__('Grupos Activos')}
                    value={stats.activos}
                    icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
                    colorClassName="bg-emerald-100 dark:bg-emerald-900/30"
                />
                <StatCard
                    title={__('Grupos Inactivos')}
                    value={stats.inactivos}
                    icon={<XCircle className="w-5 h-5 text-amber-600" />}
                    colorClassName="bg-amber-100 dark:bg-amber-900/30"
                />
                <StatCard
                    title={__('Usuarios en Grupos')}
                    value={stats.total_users}
                    icon={<UserCheck className="w-5 h-5 text-indigo-600" />}
                    colorClassName="bg-indigo-100 dark:bg-indigo-900/30"
                />
            </div>

            {/* Filtros */}
            <FilterBar>
                <div className="flex flex-wrap items-center gap-4 flex-1">
                    <FilterField label={__('Buscar')}>
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder={__('Buscar grupo por nombre o descripción...')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>
                    </FilterField>
                    <FilterField label={__('Estado')}>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40 h-9">
                                <SelectValue placeholder={__('Todos')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{__('Todos')}</SelectItem>
                                <SelectItem value="activo">{__('Activo')}</SelectItem>
                                <SelectItem value="inactivo">{__('Inactivo')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </FilterField>
                </div>
            </FilterBar>

            {/* Tabla de Grupos */}
            <DataTable
                columns={columns}
                data={groups}
                isLoading={isTableLoading}
                emptyState={{
                    title: __('No se encontraron grupos'),
                    description: searchTerm || statusFilter
                        ? __('Prueba modificando tus filtros de búsqueda.')
                        : __('Aún no has creado grupos de roles.'),
                    ctaLabel: canCreate ? __('Nuevo Grupo') : undefined,
                    onCtaClick: canCreate ? handleCreateClick : undefined,
                }}
            />

            {/* Modal Crear / Editar Grupo */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[94vw] md:max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl shadow-2xl">
                    <DialogHeader className="p-6 pb-4 border-b bg-white dark:bg-slate-900 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                    {editingGroup ? __('Editar Grupo de Roles') : __('Crear Nuevo Grupo de Roles')}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    {__('Los miembros asignados a este grupo heredarán colectivamente todos los roles y permisos configurados.')}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                                {/* Columna Izquierda: Información del Grupo y Roles (6 columnas) */}
                                <div className="lg:col-span-6 space-y-5">
                                    {/* Sección: Datos del Grupo */}
                                    <div className="p-5 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                                        <div className="flex items-center justify-between border-b pb-3">
                                            <div className="flex items-center gap-2">
                                                <Info className="w-4 h-4 text-sky-600" />
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                                    {__('1. Información del Grupo')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="group-status" className="text-xs font-medium cursor-pointer">
                                                    {data.status ? __('Activo') : __('Inactivo')}
                                                </Label>
                                                <Switch
                                                    id="group-status"
                                                    checked={data.status}
                                                    onCheckedChange={(val) => setData('status', val)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="group-name" className="font-semibold text-xs text-slate-700 dark:text-slate-200">
                                                {__('Nombre del Grupo')} *
                                            </Label>
                                            <Input
                                                id="group-name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="Ej: Seguridad y Control de Garita"
                                                className="bg-white dark:bg-slate-900 h-9"
                                                required
                                            />
                                            {errors.name && <p className="text-xs text-rose-500 font-medium">{errors.name}</p>}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="group-description" className="font-semibold text-xs text-slate-700 dark:text-slate-200">
                                                {__('Descripción del Área / Función')}
                                            </Label>
                                            <Textarea
                                                id="group-description"
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                placeholder="Describe el propósito del grupo y los empleados que lo componen..."
                                                className="bg-white dark:bg-slate-900 resize-none"
                                                rows={2}
                                            />
                                            {errors.description && <p className="text-xs text-rose-500 font-medium">{errors.description}</p>}
                                        </div>
                                    </div>

                                    {/* Sección: Roles Asignados */}
                                    <div className="p-5 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                                        <div className="flex items-center justify-between border-b pb-3">
                                            <div className="flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-emerald-600" />
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                                    {__('2. Roles Heredados por Miembros')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="font-semibold text-[11px] border-emerald-300 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40">
                                                    {data.roles.length} {__('seleccionados')}
                                                </Badge>
                                                <div className="flex items-center gap-1 text-[11px]">
                                                    <button
                                                        type="button"
                                                        onClick={handleSelectAllRoles}
                                                        className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                                                    >
                                                        {__('Todos')}
                                                    </button>
                                                    <span className="text-muted-foreground">|</span>
                                                    <button
                                                        type="button"
                                                        onClick={handleClearRoles}
                                                        className="text-xs font-medium text-muted-foreground hover:underline cursor-pointer"
                                                    >
                                                        {__('Ninguno')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-[11px] text-muted-foreground">
                                            {__('Cualquier usuario asignado a este grupo obtendrá automáticamente todos los permisos correspondientes:')}
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                                            {availableRoles.map((role) => {
                                                const isChecked = data.roles.includes(role.id);
                                                return (
                                                    <div
                                                        key={role.id}
                                                        onClick={() => handleToggleRole(role.id)}
                                                        className={cn(
                                                            "flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer select-none",
                                                            isChecked
                                                                ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-xs"
                                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                                                        )}
                                                    >
                                                        <Checkbox
                                                            id={`role-opt-${role.id}`}
                                                            checked={isChecked}
                                                            onCheckedChange={() => handleToggleRole(role.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="mt-0.5"
                                                        />
                                                        <div className="flex-1 min-w-0 space-y-0.5">
                                                            <Label
                                                                htmlFor={`role-opt-${role.id}`}
                                                                className="text-xs font-bold capitalize cursor-pointer select-none truncate block text-slate-800 dark:text-slate-100"
                                                            >
                                                                {role.name}
                                                            </Label>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    {role.permissions_count ?? 0} {__('permisos')}
                                                                </span>
                                                                {isChecked && (
                                                                    <Badge className="bg-emerald-600 text-white text-[9px] px-1 py-0 h-4">
                                                                        ✓ {__('Activo')}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Columna Derecha: Asignación de Usuarios Miembros (6 columnas) */}
                                <div className="lg:col-span-6 flex flex-col space-y-4 p-5 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/40">
                                    <div className="flex items-center justify-between border-b pb-3">
                                        <div className="flex items-center gap-2">
                                            <UserCheck className="w-4 h-4 text-indigo-600" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                                {__('3. Usuarios Miembros Asignados')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 text-[11px] font-semibold">
                                                {data.users.length} {__('miembros')}
                                            </Badge>
                                            <div className="flex items-center gap-1 text-[11px]">
                                                <button
                                                    type="button"
                                                    onClick={handleSelectAllUsers}
                                                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                                >
                                                    {__('Todos')}
                                                </button>
                                                <span className="text-muted-foreground">|</span>
                                                <button
                                                    type="button"
                                                    onClick={handleClearUsers}
                                                    className="text-xs font-medium text-muted-foreground hover:underline cursor-pointer"
                                                >
                                                    {__('Limpiar')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder={__('Filtrar usuarios por nombre o correo...')}
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            className="h-9 pl-9 pr-8 text-xs bg-white dark:bg-slate-900 rounded-xl"
                                        />
                                        {userSearch && (
                                            <button
                                                type="button"
                                                onClick={() => setUserSearch('')}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Lista de usuarios con iniciales y sin truncar feo */}
                                    <div className="flex-1 min-h-[380px] max-h-[460px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border bg-white dark:bg-slate-900 p-1.5">
                                        {filteredUsers.map((user) => {
                                            const isChecked = data.users.includes(user.id);
                                            const initials = getInitials(user.name);
                                            return (
                                                <div
                                                    key={user.id}
                                                    onClick={() => handleToggleUser(user.id)}
                                                    className={cn(
                                                        "flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors select-none",
                                                        isChecked
                                                            ? "bg-indigo-50/70 dark:bg-indigo-950/40"
                                                            : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                                                        <Checkbox
                                                            id={`user-opt-${user.id}`}
                                                            checked={isChecked}
                                                            onCheckedChange={() => handleToggleUser(user.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="shrink-0"
                                                        />
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none",
                                                            isChecked
                                                                ? "bg-indigo-600 text-white"
                                                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                                        )}>
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                                                {user.name}
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground truncate">
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {isChecked ? (
                                                        <Badge className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 text-[10px] font-semibold shrink-0 gap-1">
                                                            <Check className="w-3 h-3" />
                                                            {__('Miembro')}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-[11px] text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100">
                                                            {__('Asignar')}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {filteredUsers.length === 0 && (
                                            <div className="text-center py-12 space-y-2">
                                                <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                                                <p className="text-xs text-muted-foreground">
                                                    {__('No se encontraron usuarios que coincidan con la búsqueda.')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer fijo */}
                        <DialogFooter className="p-4 px-6 border-t bg-slate-50/70 dark:bg-slate-900/60 shrink-0 flex items-center justify-between sm:justify-between">
                            <div className="text-xs text-muted-foreground flex items-center gap-3">
                                <span>{data.roles.length} {__('roles seleccionados')}</span>
                                <span>•</span>
                                <span>{data.users.length} {__('usuarios asignados')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    {__('Cancelar')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                                >
                                    {editingGroup ? __('Guardar Cambios') : __('Crear Grupo')}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Alert Dialog para Eliminar */}
            <AlertDialog open={!!deletingGroup} onOpenChange={() => setDeletingGroup(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{__('¿Eliminar este grupo de roles?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {__('Esta acción no eliminará a los usuarios ni a los roles del sistema, pero revocará inmediatamente los permisos heredados de este grupo.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{__('Cancelar')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {__('Eliminar Grupo')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
