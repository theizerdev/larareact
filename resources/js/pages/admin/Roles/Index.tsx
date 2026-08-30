import { Head, useForm, router } from '@inertiajs/react';
import { Shield, Plus, Key, MoreVertical, Pencil, Trash2, Search, CheckSquare, Square, AlertCircle, Layers, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTranslate } from '@/hooks/use-translate';
import type { Auth } from '@/types';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface User {
    id: number;
    name: string;
    initials: string;
}

interface Permission {
    id: number;
    name: string;
    slug: string;
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
    };
    groupedPermissions: GroupedPermissions;
    filters: {
        search?: string;
    };
}

const formatSectorName = (sector: string) => {
    const map: Record<string, string> = {
        administracion: 'Administración',
        punto_de_venta: 'Punto de Venta',
        reparaciones: 'Servicio Técnico',
        equipos: 'Catálogo de Equipos',
        inventario: 'Inventario',
        contabilidad: 'Contabilidad',
        configuracion: 'Configuración',
        seguridad: 'Seguridad & Accesos',
        monitoreo: 'Monitoreo SaaS',
        fondo_mensual: 'Fondo Mensual',
        compras: 'Compras & Proveedores',
    };
    return map[sector.toLowerCase()] || sector.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const formatModuleName = (module: string) => {
    const map: Record<string, string> = {
        fondo_mensual: 'Fondo de Mes',
        cuentas_por_pagar: 'Cuentas por Pagar',
        punto_de_venta: 'Punto de Venta',
        reparaciones: 'Reparaciones & Taller',
        catalogo_servicios: 'Catálogo de Servicios',
        ajustes_stock: 'Ajustes de Stock',
        kardex: 'Kardex de Movimientos',
        plan_cuentas: 'Plan de Cuentas',
        libro_diario: 'Libro Diario',
        libro_mayor: 'Libro Mayor',
        post_reparacion: 'Post Reparación',
        metas: 'Metas de Ventas',
        cajas: 'Cajas & Flujo',
    };
    return map[module.toLowerCase()] || module.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export default function RolesIndexPage({ auth, roles, stats, groupedPermissions, filters }: RolesPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Roles'), href: '/admin/roles' },
    ];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [deletingRole, setDeletingRole] = useState<Role | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [modalPermissionFilter, setModalPermissionFilter] = useState('');

    // Formulario Inertia
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        permissions: [] as string[], // array de nombres de permisos (name)
    });

    // Debounce de búsqueda
    React.useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                window.location.pathname,
                { search: searchTerm },
                { preserveState: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleCreateClick = () => {
        setEditingRole(null);
        reset();
        setIsModalOpen(true);
    };

    const handleEditClick = (role: Role) => {
        setEditingRole(role);
        setData({
            name: role.name,
            permissions: role.all_permissions.map(p => p.name),
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingRole) {
            put(`/admin/roles/${editingRole.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingRole(null);
                    reset();
                    notifySuccess(__('Role updated successfully.'));
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        } else {
            post('/admin/roles', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Role created successfully.'));
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
            onSuccess: () => {
                setDeletingRole(null);
                notifySuccess(__('Role deleted successfully.'));
            },
            onError: (err) => {
                notifyError(err.error || __('There was an error deleting the role.'));
            },
        });
    };

    // Obtiene una lista plana con el nombre de TODOS los permisos disponibles en la vista
    const allSystemPermissionNames = React.useMemo(() => {
        const names: string[] = [];
        Object.values(groupedPermissions).forEach(modules => {
            Object.values(modules).forEach(permissions => {
                permissions.forEach(p => {
                    names.push(p.name);
                });
            });
        });

        return names;
    }, [groupedPermissions]);

    const isAllSystemPermissionsSelected = React.useMemo(() => {
        if (allSystemPermissionNames.length === 0) {
return false;
}

        return allSystemPermissionNames.every(name => data.permissions.includes(name));
    }, [allSystemPermissionNames, data.permissions]);

    const handleSelectAllSystemPermissions = (checked: boolean) => {
        if (checked) {
            setData('permissions', allSystemPermissionNames);
        } else {
            setData('permissions', []);
        }
    };

    const handlePermissionToggle = (permissionName: string, checked: boolean) => {
        if (checked) {
            setData('permissions', [...data.permissions, permissionName]);
        } else {
            setData('permissions', data.permissions.filter(name => name !== permissionName));
        }
    };

    const isAllModulePermissionsSelected = (modulePermissions: Permission[]) => {
        return modulePermissions.every(p => data.permissions.includes(p.name));
    };

    const handleModuleToggle = (modulePermissions: Permission[], checked: boolean) => {
        const permissionNames = modulePermissions.map(p => p.name);

        if (checked) {
            // Añadir los que no estén
            const newPermissions = [...data.permissions];
            permissionNames.forEach(name => {
                if (!newPermissions.includes(name)) {
                    newPermissions.push(name);
                }
            });
            setData('permissions', newPermissions);
        } else {
            // Quitar todos los del módulo
            setData('permissions', data.permissions.filter(name => !permissionNames.includes(name)));
        }
    };

    return (
        <>
            <Head title={__('Roles')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Shield className="h-6 w-6 text-white" />}
                    title={__('Roles & Permissions')}
                    description={__('Manage user roles and assign permissions grouped by sector.')}
                    colorClassName="bg-indigo-600"
                >
                    <Button onClick={handleCreateClick}>
                        <Plus className="mr-2 h-4 w-4" />
                        {__('New Role')}
                    </Button>
                </ModuleHeader>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <StatCard
                        icon={<Key className="h-6 w-6" />}
                        title={__('TOTAL ROLES')}
                        value={stats.total}
                        colorClassName="bg-indigo-100 text-indigo-600"
                    />
                    <StatCard
                        icon={<Shield className="h-6 w-6" />}
                        title={__('TOTAL SYSTEM PERMISSIONS')}
                        value={stats.permissions_total}
                        colorClassName="bg-emerald-100 text-emerald-600"
                    />
                </div>

                {/* Filtro */}
                <FilterBar>
                    <FilterField label={__('Search')}>
                        <Input
                            placeholder={__('Search by name...')}
                            className="w-full md:w-96"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </FilterField>
                </FilterBar>

                {/* Cards Grid de Roles */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roles.map((role) => (
                        <div key={role.id} className="bg-card text-card-foreground border rounded-xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg capitalize">{role.name}</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {role.users_count} {role.users_count === 1 ? __('user') : __('users')}
                                        </p>
                                    </div>
                                    {!role.is_super_admin && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditClick(role)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    {__('Edit')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setDeletingRole(role)}
                                                    className="text-red-600 focus:text-red-600 dark:text-red-400"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    {__('Delete')}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>

                                {/* Avatares de Usuarios */}
                                <div className="flex items-center -space-x-2 mt-4 overflow-hidden">
                                    {role.users.map((user) => (
                                        <div
                                            key={user.id}
                                            title={user.name}
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-full border bg-muted text-xs font-semibold"
                                        >
                                            {user.initials}
                                        </div>
                                    ))}
                                    {role.more_users_count > 0 && (
                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full border bg-muted text-xs font-semibold text-muted-foreground">
                                            +{role.more_users_count}
                                        </div>
                                    )}
                                    {role.users_count === 0 && (
                                        <span className="text-xs text-muted-foreground italic">{__('No users assigned')}</span>
                                    )}
                                </div>

                                {/* Permisos Preview */}
                                <div className="mt-6 space-y-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{__('Permissions')}</h4>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {role.is_super_admin ? (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900">
                                                {__('All Permissions (bypass)')}
                                            </span>
                                        ) : (
                                            <>
                                                {role.permissions.map((p) => (
                                                    <span key={p.id} className="text-xs font-medium px-2 py-0.5 rounded-full border bg-secondary text-secondary-foreground" title={p.name}>
                                                        {p.slug}
                                                    </span>
                                                ))}
                                                {role.more_permissions_count > 0 && (
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-muted text-muted-foreground">
                                                        +{role.more_permissions_count}
                                                    </span>
                                                )}
                                                {role.permissions_count === 0 && (
                                                    <span className="text-xs text-muted-foreground italic">{__('No permissions assigned')}</span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal de Creación / Edición */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-5xl w-[96vw] max-h-[92vh] h-[820px] flex flex-col p-0 overflow-hidden shadow-2xl rounded-2xl border-border/80 bg-card">
                    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                        {/* Header */}
                        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                            <Shield className="size-5" />
                                        </div>
                                        <span>{editingRole ? __('Editar Rol') : __('Nuevo Rol')}</span>
                                    </DialogTitle>
                                    <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                                        {__('Define el nombre del rol y personaliza los permisos del sistema por sector.')}
                                    </DialogDescription>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant="outline" className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 text-xs font-semibold">
                                        <Key className="size-3.5 mr-1.5 text-indigo-500 shrink-0" />
                                        {data.permissions.length} / {allSystemPermissionNames.length} permisos activos
                                    </Badge>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                            {/* Error Alert */}
                            {errors.name && (
                                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium animate-in fade-in">
                                    <AlertCircle className="size-4 shrink-0 text-red-500" />
                                    <span>{errors.name}</span>
                                </div>
                            )}

                            {/* Fila: Nombre del Rol + Buscador de Permisos */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                <div className="md:col-span-6 space-y-1.5">
                                    <Label htmlFor="role-name" className="text-xs font-semibold text-foreground/90">
                                        {__('Nombre del Rol')} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="role-name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder={__('Ej: Administrador de Taller, Cajero Principal...')}
                                        className="h-10 text-sm font-medium"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-6 space-y-1.5">
                                    <Label htmlFor="perm-search" className="text-xs font-semibold text-foreground/90">
                                        {__('Filtrar Permisos en Tiempo Real')}
                                    </Label>
                                    <div className="relative">
                                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
                                        <Input
                                            id="perm-search"
                                            value={modalPermissionFilter}
                                            onChange={(e) => setModalPermissionFilter(e.target.value)}
                                            placeholder={__('Buscar por acción (ej: ver, crear, caja, ventas)...')}
                                            className="h-10 pl-9 text-sm"
                                        />
                                        {modalPermissionFilter && (
                                            <button
                                                type="button"
                                                onClick={() => setModalPermissionFilter('')}
                                                className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-semibold"
                                            >
                                                Limpiar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Selector Maestro de Permisos del Sistema */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/80">
                                <div className="flex items-center gap-2">
                                    <Layers className="size-4 text-indigo-500 shrink-0" />
                                    <span className="text-xs font-semibold text-foreground">
                                        {__('Asignación de Permisos por Sector y Módulo')}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <Switch
                                        id="toggle-all-permissions"
                                        checked={isAllSystemPermissionsSelected}
                                        onCheckedChange={handleSelectAllSystemPermissions}
                                    />
                                    <Label htmlFor="toggle-all-permissions" className="text-xs font-semibold cursor-pointer select-none">
                                        {__('Seleccionar todo el sistema')}
                                    </Label>
                                </div>
                            </div>

                            {/* Tabs por Sector */}
                            <Tabs defaultValue={Object.keys(groupedPermissions)[0]} className="w-full">
                                <div className="overflow-x-auto pb-1 custom-scrollbar">
                                    <TabsList className="inline-flex w-auto min-w-full justify-start gap-1.5 bg-muted/50 p-1.5 rounded-xl border border-border/60">
                                        {Object.entries(groupedPermissions).map(([sector, modules]) => {
                                            const allSectorPerms: Permission[] = [];
                                            Object.values(modules).forEach(perms => allSectorPerms.push(...perms));
                                            const selectedInSector = allSectorPerms.filter(p => data.permissions.includes(p.name)).length;

                                            return (
                                                <TabsTrigger
                                                    key={sector}
                                                    value={sector}
                                                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all shrink-0 flex items-center gap-1.5"
                                                >
                                                    <span>{formatSectorName(sector)}</span>
                                                    <span className={cn(
                                                        "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                                                        selectedInSector > 0
                                                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                                            : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {selectedInSector}/{allSectorPerms.length}
                                                    </span>
                                                </TabsTrigger>
                                            );
                                        })}
                                    </TabsList>
                                </div>

                                {Object.entries(groupedPermissions).map(([sector, modules]) => {
                                    const allSectorPerms: Permission[] = [];
                                    Object.values(modules).forEach(perms => allSectorPerms.push(...perms));
                                    const isAllSectorSelected = allSectorPerms.length > 0 && allSectorPerms.every(p => data.permissions.includes(p.name));

                                    const handleSectorSelectAll = (checked: boolean) => {
                                        const sectorNames = allSectorPerms.map(p => p.name);
                                        if (checked) {
                                            const merged = Array.from(new Set([...data.permissions, ...sectorNames]));
                                            setData('permissions', merged);
                                        } else {
                                            setData('permissions', data.permissions.filter(n => !sectorNames.includes(n)));
                                        }
                                    };

                                    return (
                                        <TabsContent key={sector} value={sector} className="mt-3 focus-visible:outline-none">
                                            {/* Sector header toggle */}
                                            <div className="flex items-center justify-between px-3 py-2 mb-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="size-4 text-indigo-600 dark:text-indigo-400" />
                                                    <span className="text-xs font-bold text-foreground">
                                                        Sector: {formatSectorName(sector)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Checkbox
                                                        id={`sector-toggle-${sector}`}
                                                        checked={isAllSectorSelected}
                                                        onCheckedChange={(checked) => handleSectorSelectAll(!!checked)}
                                                    />
                                                    <Label htmlFor={`sector-toggle-${sector}`} className="text-xs font-semibold text-muted-foreground cursor-pointer select-none">
                                                        {__('Seleccionar todo en este sector')}
                                                    </Label>
                                                </div>
                                            </div>

                                            {/* Cards Grid de Módulos */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {Object.entries(modules).map(([module, permissions]) => {
                                                    const filteredPermissions = modalPermissionFilter
                                                        ? permissions.filter(p =>
                                                            p.name.toLowerCase().includes(modalPermissionFilter.toLowerCase()) ||
                                                            p.slug.toLowerCase().includes(modalPermissionFilter.toLowerCase())
                                                        )
                                                        : permissions;

                                                    if (filteredPermissions.length === 0) return null;

                                                    const isAllSelected = isAllModulePermissionsSelected(permissions);
                                                    const selectedCount = permissions.filter(p => data.permissions.includes(p.name)).length;

                                                    return (
                                                        <div
                                                            key={module}
                                                            className={cn(
                                                                "border rounded-xl p-3.5 bg-card/90 transition-all flex flex-col justify-between shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700",
                                                                selectedCount > 0 && "border-indigo-200/90 dark:border-indigo-900/70 bg-indigo-50/10"
                                                            )}
                                                        >
                                                            {/* Cabecera del Módulo con Checkbox maestro */}
                                                            <div>
                                                                <div className="flex items-center justify-between border-b pb-2 mb-2.5">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-xs font-bold text-foreground">
                                                                            {formatModuleName(module)}
                                                                        </span>
                                                                        <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-muted text-muted-foreground">
                                                                            {selectedCount}/{permissions.length}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center space-x-1.5">
                                                                        <Checkbox
                                                                            id={`module-${sector}-${module}`}
                                                                            checked={isAllSelected}
                                                                            onCheckedChange={(checked) => handleModuleToggle(permissions, !!checked)}
                                                                        />
                                                                        <Label htmlFor={`module-${sector}-${module}`} className="text-[11px] font-semibold text-muted-foreground cursor-pointer select-none">
                                                                            {__('Todos')}
                                                                        </Label>
                                                                    </div>
                                                                </div>

                                                                {/* Lista de Permisos del Módulo */}
                                                                <div className="space-y-1 pl-0.5">
                                                                    {filteredPermissions.map((p) => {
                                                                        const isChecked = data.permissions.includes(p.name);

                                                                        return (
                                                                            <div
                                                                                key={p.id}
                                                                                onClick={() => handlePermissionToggle(p.name, !isChecked)}
                                                                                className={cn(
                                                                                    "flex items-start gap-2.5 p-1.5 rounded-lg transition-colors cursor-pointer select-none hover:bg-muted/60",
                                                                                    isChecked && "bg-indigo-50/60 dark:bg-indigo-950/30"
                                                                                )}
                                                                            >
                                                                                <Checkbox
                                                                                    id={`perm-${p.id}`}
                                                                                    checked={isChecked}
                                                                                    onCheckedChange={(checked) => handlePermissionToggle(p.name, !!checked)}
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                    className="mt-0.5"
                                                                                />
                                                                                <Label
                                                                                    htmlFor={`perm-${p.id}`}
                                                                                    className="text-xs font-medium leading-tight cursor-pointer select-none text-foreground/90"
                                                                                    title={p.name}
                                                                                >
                                                                                    {p.slug}
                                                                                </Label>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </TabsContent>
                                    );
                                })}
                            </Tabs>
                        </div>

                        {/* Footer */}
                        <DialogFooter className="p-4 px-6 border-t bg-muted/20 flex flex-row items-center justify-between gap-3">
                            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                                {data.permissions.length} permisos seleccionados para este rol
                            </span>
                            <div className="flex items-center gap-2 ml-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={processing}
                                    className="h-9 text-xs font-semibold"
                                >
                                    {__('Cancelar')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="h-9 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                                >
                                    {processing ? __('Guardando...') : __('Guardar Cambios')}
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
                        <AlertDialogTitle>{__('Delete Role')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {__('Are you sure you want to delete the role')}{' '}
                            <strong>{deletingRole?.name}</strong>?{' '}
                            {__('This action cannot be undone and will unassign it from all users.')}
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
