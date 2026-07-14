import { Head, useForm, router } from '@inertiajs/react';
import { Shield, Plus, Key, MoreVertical, Pencil, Trash2 } from 'lucide-react';
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
import { useTranslate } from '@/hooks/use-translate';
import type { Auth } from '@/types';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { Switch } from '@/components/ui/switch';

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
                <DialogContent className="sm:max-w-[768px] max-h-[90vh] flex flex-col p-0">
                    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                        <DialogHeader className="p-6 pb-4 border-b">
                            <DialogTitle>
                                {editingRole ? __('Edit Role') : __('New Role')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Define the role name and choose permissions grouped by sector.')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Nombre del Rol */}
                            <div className="grid gap-2">
                                <Label htmlFor="name">{__('Role Name')} *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder={__('e.g., Editor, supervisor')}
                                    required
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                                )}
                            </div>

                            {/* Selector de Permisos Agrupados */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">{__('Permissions Assignment')}</Label>
                                    <div className="flex items-center space-x-2 bg-muted/40 px-3 py-1.5 rounded-lg border border-border">
                                        <Switch
                                            id="toggle-all-permissions"
                                            checked={isAllSystemPermissionsSelected}
                                            onCheckedChange={handleSelectAllSystemPermissions}
                                        />
                                        <Label htmlFor="toggle-all-permissions" className="text-xs font-semibold cursor-pointer select-none">
                                            {__('Select all permissions')}
                                        </Label>
                                    </div>
                                </div>
                                <Tabs defaultValue={Object.keys(groupedPermissions)[0]} className="w-full">
                                    <TabsList className="grid w-full grid-flow-col bg-muted/60 p-1 mb-4">
                                        {Object.keys(groupedPermissions).map((sector) => (
                                            <TabsTrigger key={sector} value={sector} className="capitalize text-xs py-1.5">
                                                {sector}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>

                                    {Object.entries(groupedPermissions).map(([sector, modules]) => (
                                        <TabsContent key={sector} value={sector}>
                                            <div className="h-[320px] overflow-y-auto rounded-md border p-4 bg-background">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {Object.entries(modules).map(([module, permissions]) => {
                                                        const isAllSelected = isAllModulePermissionsSelected(permissions);

                                                        return (
                                                            <div key={module} className="border rounded-lg p-3 bg-muted/40 space-y-2.5">
                                                                {/* Cabecera del Módulo con Checkbox maestro */}
                                                                <div className="flex items-center justify-between border-b pb-1">
                                                                    <span className="text-xs font-semibold capitalize text-foreground/80">
                                                                        {module}
                                                                    </span>
                                                                    <div className="flex items-center space-x-1">
                                                                        <Checkbox
                                                                            id={`module-${sector}-${module}`}
                                                                            checked={isAllSelected}
                                                                            onCheckedChange={(checked) => handleModuleToggle(permissions, !!checked)}
                                                                        />
                                                                        <Label htmlFor={`module-${sector}-${module}`} className="text-[10px] text-muted-foreground cursor-pointer select-none">
                                                                            {__('All')}
                                                                        </Label>
                                                                    </div>
                                                                </div>

                                                                {/* Lista de Permisos del Módulo */}
                                                                <div className="space-y-1.5 pl-1">
                                                                    {permissions.map((p) => (
                                                                        <div key={p.id} className="flex items-start space-x-2">
                                                                            <Checkbox
                                                                                id={`perm-${p.id}`}
                                                                                checked={data.permissions.includes(p.name)}
                                                                                onCheckedChange={(checked) => handlePermissionToggle(p.name, !!checked)}
                                                                            />
                                                                            <Label
                                                                                htmlFor={`perm-${p.id}`}
                                                                                className="text-xs font-normal leading-none cursor-pointer select-none"
                                                                                title={p.name}
                                                                            >
                                                                                {p.slug}
                                                                            </Label>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </div>
                        </div>

                        <DialogFooter className="p-6 pt-4 border-t bg-muted/20">
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
