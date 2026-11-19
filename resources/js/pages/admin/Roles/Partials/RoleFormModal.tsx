import {
    Activity,
    Building2,
    CheckCheck,
    Clock,
    Copy,
    Cpu,
    Crown,
    DoorOpen,
    Eraser,
    Eye,
    Layers,
    Lock,
    Search,
    Settings,
    Shield,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { notifySuccess } from '@/utils/notifications';
import {
    getActionBadgeMeta
    
    
    
    
    
} from './types';
import type {GroupedPermissions, ModuleMeta, PermissionItem, RoleItem, SectorMeta} from './types';

interface RoleFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingRole: RoleItem | null;
    readOnly?: boolean;
    roles: RoleItem[];
    groupedPermissions: GroupedPermissions;
    sectorMeta: SectorMeta;
    moduleMeta: ModuleMeta;
    data: {
        name: string;
        permissions: string[];
    };
    setData: <K extends 'name' | 'permissions'>(key: K, value: K extends 'name' ? string : string[]) => void;
    errors: {
        name?: string;
        permissions?: string;
    };
    processing: boolean;
    onSubmit: (e: React.FormEvent) => void;
}

function getSectorIcon(sectorKey: string) {
    switch (sectorKey) {
        case 'seguridad':
            return Shield;
        case 'organizacion':
            return Building2;
        case 'visitas':
            return DoorOpen;
        case 'asistencia':
            return Clock;
        case 'configuracion':
            return Settings;
        case 'monitoreo':
            return Activity;
        default:
            return Cpu;
    }
}

export function RoleFormModal({
    open,
    onOpenChange,
    editingRole,
    readOnly = false,
    roles,
    groupedPermissions,
    sectorMeta,
    moduleMeta,
    data,
    setData,
    errors,
    processing,
    onSubmit,
}: RoleFormModalProps) {
    const { __ } = useTranslate();

    const isSuperAdmin = Boolean(editingRole?.is_super_admin);
    const isReadOnly = isSuperAdmin || Boolean(readOnly);
    const sectorKeys = useMemo(() => Object.keys(groupedPermissions), [groupedPermissions]);

    const [activeSector, setActiveSector] = useState<string>('all');
    const [permissionSearch, setPermissionSearch] = useState<string>('');
    const [copySelectorKey, setCopySelectorKey] = useState<number>(0);

    // Lista plana de todos los permisos del sistema
    const allPermissionsList = useMemo(() => {
        const list: PermissionItem[] = [];
        sectorKeys.forEach((sector) => {
            const modules = groupedPermissions[sector] || {};
            Object.values(modules).forEach((perms) => {
                perms.forEach((p) => list.push(p));
            });
        });

        return list;
    }, [groupedPermissions, sectorKeys]);

    const allSystemPermissionNames = useMemo(
        () => allPermissionsList.map((p) => p.name),
        [allPermissionsList]
    );

    const selectedSet = useMemo(() => new Set(data.permissions), [data.permissions]);

    const initialPermissionsSet = useMemo(() => {
        if (!editingRole) {
            return new Set<string>();
        }

        return new Set(editingRole.all_permissions.map((p) => p.name));
    }, [editingRole]);

    // Diff al editar un rol existente
    const diffCounts = useMemo(() => {
        if (!editingRole || isReadOnly) {
            return { added: 0, removed: 0 };
        }

        let added = 0;
        let removed = 0;
        selectedSet.forEach((name) => {
            if (!initialPermissionsSet.has(name)) {
                added++;
            }
        });
        initialPermissionsSet.forEach((name) => {
            if (!selectedSet.has(name)) {
                removed++;
            }
        });

        return { added, removed };
    }, [editingRole, isReadOnly, selectedSet, initialPermissionsSet]);

    const totalSystemCount = allPermissionsList.length;
    const selectedCount = useMemo(() => {
        if (isSuperAdmin) {
            return totalSystemCount;
        }

        return allPermissionsList.filter((p) => selectedSet.has(p.name)).length;
    }, [isSuperAdmin, totalSystemCount, allPermissionsList, selectedSet]);

    const coveragePercent =
        totalSystemCount > 0 ? Math.round((selectedCount / totalSystemCount) * 100) : 0;

    // Búsqueda filtrada por sector y módulo
    const normalizedSearch = permissionSearch.trim().toLowerCase();
    const isSearching = normalizedSearch !== '';

    const filteredStructure = useMemo(() => {
        const result: Array<{
            sector: string;
            label: string;
            description: string;
            totalInSector: number;
            selectedInSector: number;
            matchedCount: number;
            modules: Array<{
                module: string;
                moduleLabel: string;
                permissions: PermissionItem[];
            }>;
        }> = [];

        sectorKeys.forEach((sector) => {
            const modulesObj = groupedPermissions[sector] || {};
            const allInSector: PermissionItem[] = [];
            const matchedModules: Array<{
                module: string;
                moduleLabel: string;
                permissions: PermissionItem[];
            }> = [];

            let matchedCount = 0;

            Object.entries(modulesObj).forEach(([moduleKey, perms]) => {
                const moduleLabel = moduleMeta[moduleKey] || __(moduleKey);
                perms.forEach((p) => allInSector.push(p));

                const filteredPerms = isSearching
                    ? perms.filter(
                          (p) =>
                              p.slug.toLowerCase().includes(normalizedSearch) ||
                              p.name.toLowerCase().includes(normalizedSearch) ||
                              moduleLabel.toLowerCase().includes(normalizedSearch) ||
                              (sectorMeta[sector]?.label || sector).toLowerCase().includes(normalizedSearch)
                      )
                    : perms;

                if (filteredPerms.length > 0) {
                    matchedCount += filteredPerms.length;
                    matchedModules.push({
                        module: moduleKey,
                        moduleLabel,
                        permissions: filteredPerms,
                    });
                }
            });

            const selectedInSector = isSuperAdmin
                ? allInSector.length
                : allInSector.filter((p) => selectedSet.has(p.name)).length;

            result.push({
                sector,
                label: sectorMeta[sector]?.label || __(sector),
                description: sectorMeta[sector]?.description || '',
                totalInSector: allInSector.length,
                selectedInSector,
                matchedCount,
                modules: matchedModules,
            });
        });

        return result;
    }, [sectorKeys, groupedPermissions, moduleMeta, sectorMeta, isSearching, normalizedSearch, isSuperAdmin, selectedSet, __]);

    const visibleSectors = useMemo(() => {
        if (isSearching) {
            return filteredStructure.filter((s) => s.modules.length > 0);
        }

        if (activeSector === 'all') {
            return filteredStructure;
        }

        return filteredStructure.filter((s) => s.sector === activeSector);
    }, [filteredStructure, isSearching, activeSector]);

    const totalMatchedCount = useMemo(
        () => filteredStructure.reduce((acc, s) => acc + s.matchedCount, 0),
        [filteredStructure]
    );

    // Acciones de selección
    const addPermissions = (names: string[]) => {
        if (isReadOnly) {
            return;
        }

        const next = new Set(data.permissions);
        names.forEach((n) => next.add(n));
        setData('permissions', Array.from(next));
    };

    const removePermissions = (names: string[]) => {
        if (isReadOnly) {
            return;
        }

        const removeSet = new Set(names);
        setData(
            'permissions',
            data.permissions.filter((n) => !removeSet.has(n))
        );
    };

    const handlePermissionToggle = (permissionName: string, checked: boolean) => {
        if (isReadOnly) {
            return;
        }

        if (checked) {
            addPermissions([permissionName]);
        } else {
            removePermissions([permissionName]);
        }
    };

    const handleModuleToggle = (modulePermissions: PermissionItem[], checked: boolean) => {
        const names = modulePermissions.map((p) => p.name);

        if (checked) {
            addPermissions(names);
        } else {
            removePermissions(names);
        }
    };

    const handleSelectAll = () => {
        if (isReadOnly) {
            return;
        }

        setData('permissions', [...allSystemPermissionNames]);
    };

    const handleSelectReadOnly = () => {
        if (isReadOnly) {
            return;
        }

        const viewPerms = allSystemPermissionNames.filter((name) => name.endsWith('.view'));
        setData('permissions', viewPerms);
    };

    const handleClearAll = () => {
        if (isReadOnly) {
            return;
        }

        setData('permissions', []);
    };

    const handleCopyFromRole = (roleIdStr: string) => {
        if (isReadOnly) {
            return;
        }

        const sourceRole = roles.find((r) => String(r.id) === roleIdStr);

        if (!sourceRole) {
            return;
        }

        const validSet = new Set(allSystemPermissionNames);
        const copied = sourceRole.all_permissions
            .map((p) => p.name)
            .filter((name) => validSet.has(name));
        setData('permissions', copied);
        setCopySelectorKey((prev) => prev + 1);
        notifySuccess(`Se copiaron ${copied.length} permisos del rol "${sourceRole.name}".`);
    };

    const handleSectorQuickAction = (sectorEntry: (typeof filteredStructure)[number], mode: 'all' | 'view' | 'clear') => {
        if (isReadOnly) {
            return;
        }

        const names = sectorEntry.modules.flatMap((m) => m.permissions.map((p) => p.name));

        if (mode === 'all') {
            addPermissions(names);
        } else if (mode === 'clear') {
            removePermissions(names);
        } else {
            const viewOnly = names.filter((n) => n.endsWith('.view'));
            const nonView = names.filter((n) => !n.endsWith('.view'));
            const next = new Set(data.permissions);
            nonView.forEach((n) => next.delete(n));
            viewOnly.forEach((n) => next.add(n));
            setData('permissions', Array.from(next));
        }
    };

    const copyableRoles = useMemo(
        () => roles.filter((r) => !editingRole || r.id !== editingRole.id),
        [roles, editingRole]
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[920px] lg:max-w-[1120px] h-[90vh] max-h-[840px] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-slate-950/95">
                <form onSubmit={onSubmit} className="flex flex-col h-full min-h-0 overflow-hidden">
                    {/* Header con gradiente */}
                    <div className="relative px-6 pt-5 pb-4 pr-12 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-r from-indigo-500/8 via-violet-500/5 to-transparent shrink-0">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div
                                    className={cn(
                                        'h-11 w-11 rounded-2xl text-white flex items-center justify-center shadow-lg shrink-0 ring-4',
                                        isSuperAdmin
                                            ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/25 ring-amber-500/10'
                                            : 'bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-500/25 ring-indigo-500/10'
                                    )}
                                >
                                    {isSuperAdmin ? <Crown className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                            {isSuperAdmin
                                                ? 'Permisos del Super Administrador'
                                                : isReadOnly
                                                  ? 'Detalle del Rol'
                                                  : editingRole
                                                    ? __('Edit Role')
                                                    : __('New Role')}
                                        </DialogTitle>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60">
                                            {selectedCount} / {totalSystemCount} permisos · {coveragePercent}%
                                        </span>
                                        {diffCounts.added > 0 && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60">
                                                +{diffCounts.added} nuevos
                                            </span>
                                        )}
                                        {diffCounts.removed > 0 && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60">
                                                -{diffCounts.removed} removidos
                                            </span>
                                        )}
                                    </div>
                                    <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {isSuperAdmin
                                            ? 'Este rol del sistema cuenta con acceso total protegido y no puede ser editado o eliminado.'
                                            : isReadOnly
                                              ? 'Modo solo lectura: no cuentas con permiso para editar este rol.'
                                              : __('Define the role name and choose permissions grouped by sector.')}
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>

                        {/* Barra de identidad + herramientas rápidas */}
                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                            <div className="lg:col-span-4 space-y-1">
                                <Label htmlFor="role-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {__('Role Name')} <span className="text-rose-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="role-name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Ej: Supervisor de Planta"
                                        disabled={isReadOnly}
                                        required
                                        className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 pr-8"
                                    />
                                    {isReadOnly && (
                                        <Lock className="h-3.5 w-3.5 text-amber-500 absolute right-3 top-1/2 -translate-y-1/2" />
                                    )}
                                </div>
                                {errors.name && <p className="text-rose-500 text-xs font-medium">{errors.name}</p>}
                            </div>

                            <div className="lg:col-span-4 space-y-1">
                                <Label htmlFor="perm-search" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Buscar permiso o módulo
                                </Label>
                                <div className="relative">
                                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <Input
                                        id="perm-search"
                                        value={permissionSearch}
                                        onChange={(e) => setPermissionSearch(e.target.value)}
                                        placeholder="Ej: kiosko, empleados, users.view..."
                                        className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 pl-9 pr-8"
                                    />
                                    {permissionSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setPermissionSearch('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
                                            title="Limpiar búsqueda"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="lg:col-span-4 flex flex-wrap items-center gap-2 justify-start lg:justify-end">
                                {!isReadOnly && copyableRoles.length > 0 && (
                                    <Select key={copySelectorKey} onValueChange={handleCopyFromRole}>
                                        <SelectTrigger className="h-10 w-full sm:w-44 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs">
                                            <Copy className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                            <SelectValue placeholder="Copiar desde rol..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {copyableRoles.map((r) => (
                                                <SelectItem key={r.id} value={String(r.id)}>
                                                    {r.name} ({r.permissions_count})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                {!isReadOnly && (
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleSelectAll}
                                            className="h-8 px-2.5 text-xs rounded-lg hover:bg-white dark:hover:bg-slate-800 gap-1"
                                            title="Seleccionar todos los permisos"
                                        >
                                            <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                                            <span>Todos</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleSelectReadOnly}
                                            className="h-8 px-2.5 text-xs rounded-lg hover:bg-white dark:hover:bg-slate-800 gap-1"
                                            title="Solo permisos de visualización (*.view)"
                                        >
                                            <Eye className="h-3.5 w-3.5 text-sky-600" />
                                            <span>Lectura</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleClearAll}
                                            className="h-8 px-2.5 text-xs rounded-lg hover:bg-white dark:hover:bg-slate-800 gap-1 text-rose-600 dark:text-rose-400"
                                            title="Limpiar selección"
                                        >
                                            <Eraser className="h-3.5 w-3.5" />
                                            <span>Limpiar</span>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cuerpo de 2 paneles */}
                    <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
                        {/* Rail izquierdo de Sectores */}
                        <aside className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40 flex md:flex-col overflow-x-auto md:overflow-y-auto p-2.5 gap-1.5">
                            <button
                                type="button"
                                onClick={() => setActiveSector('all')}
                                className={cn(
                                    'shrink-0 flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all text-xs font-medium',
                                    activeSector === 'all' && !isSearching
                                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800/70'
                                )}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Layers className="h-4 w-4 shrink-0" />
                                    <span className="truncate font-semibold">Todos los sectores</span>
                                </div>
                                <span
                                    className={cn(
                                        'px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0',
                                        activeSector === 'all' && !isSearching
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                    )}
                                >
                                    {isSearching ? totalMatchedCount : `${selectedCount}/${totalSystemCount}`}
                                </span>
                            </button>

                            {filteredStructure.map((entry) => {
                                const SectorIcon = getSectorIcon(entry.sector);
                                const isActive = !isSearching && activeSector === entry.sector;
                                const pct =
                                    entry.totalInSector > 0
                                        ? Math.round((entry.selectedInSector / entry.totalInSector) * 100)
                                        : 0;

                                return (
                                    <button
                                        key={entry.sector}
                                        type="button"
                                        onClick={() => {
                                            setPermissionSearch('');
                                            setActiveSector(entry.sector);
                                        }}
                                        className={cn(
                                            'shrink-0 md:w-full rounded-xl px-3 py-2.5 text-left transition-all border border-transparent',
                                            isActive
                                                ? 'bg-white dark:bg-slate-800 border-indigo-200/80 dark:border-indigo-700/60 shadow-xs text-slate-900 dark:text-white'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <SectorIcon
                                                    className={cn(
                                                        'h-4 w-4 shrink-0',
                                                        isActive
                                                            ? 'text-indigo-600 dark:text-indigo-400'
                                                            : entry.selectedInSector > 0
                                                              ? 'text-emerald-600 dark:text-emerald-400'
                                                              : 'text-slate-400'
                                                    )}
                                                />
                                                <span className="text-xs font-semibold truncate">{entry.label}</span>
                                            </div>
                                            <span
                                                className={cn(
                                                    'text-[11px] font-bold px-1.5 py-0.5 rounded-md shrink-0',
                                                    entry.selectedInSector === entry.totalInSector && entry.totalInSector > 0
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                        : entry.selectedInSector > 0
                                                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                                                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                )}
                                            >
                                                {isSearching
                                                    ? `${entry.matchedCount}`
                                                    : `${entry.selectedInSector}/${entry.totalInSector}`}
                                            </span>
                                        </div>
                                        <div className="hidden md:block mt-1.5 h-1 w-full rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden">
                                            <div
                                                className={cn(
                                                    'h-full rounded-full transition-all duration-300',
                                                    pct === 100
                                                        ? 'bg-emerald-500'
                                                        : pct > 0
                                                          ? 'bg-indigo-500'
                                                          : 'bg-transparent'
                                                )}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </button>
                                );
                            })}
                        </aside>

                        {/* Panel derecho de Módulos y Permisos */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/30 dark:bg-slate-950/30">
                            {isSearching && (
                                <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/50 text-xs">
                                    <span className="font-medium text-indigo-900 dark:text-indigo-200">
                                        Mostrando <strong>{totalMatchedCount}</strong> permisos que coinciden con &ldquo;{permissionSearch}&rdquo;
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setPermissionSearch('')}
                                        className="h-7 px-2 text-xs text-indigo-700 dark:text-indigo-300"
                                    >
                                        Limpiar filtro
                                    </Button>
                                </div>
                            )}

                            {visibleSectors.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                                    <Search className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        No se encontraron permisos
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Intenta buscar con otro término o limpia el filtro actual.
                                    </p>
                                </div>
                            ) : (
                                visibleSectors.map((sectorEntry) => {
                                    const SectorIcon = getSectorIcon(sectorEntry.sector);

                                    return (
                                        <section key={sectorEntry.sector} className="space-y-3">
                                            {/* Cabecera del sector */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/70 dark:border-slate-800/70">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                                                        <SectorIcon className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                            {sectorEntry.label}
                                                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                                ({sectorEntry.selectedInSector}/{sectorEntry.totalInSector})
                                                            </span>
                                                        </h3>
                                                        {sectorEntry.description && (
                                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                {sectorEntry.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {!isReadOnly && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleSectorQuickAction(sectorEntry, 'all')}
                                                            className="h-7 px-2.5 text-[11px] rounded-lg"
                                                        >
                                                            Activar sector
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleSectorQuickAction(sectorEntry, 'view')}
                                                            className="h-7 px-2.5 text-[11px] rounded-lg"
                                                        >
                                                            Solo lectura
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleSectorQuickAction(sectorEntry, 'clear')}
                                                            className="h-7 px-2 text-[11px] rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                        >
                                                            Quitar
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Tarjetas de Módulos */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                                                {sectorEntry.modules.map((mod) => {
                                                    const modSelectedCount = isSuperAdmin
                                                        ? mod.permissions.length
                                                        : mod.permissions.filter((p) => selectedSet.has(p.name)).length;
                                                    const isAllModuleSelected =
                                                        mod.permissions.length > 0 &&
                                                        modSelectedCount === mod.permissions.length;

                                                    return (
                                                        <div
                                                            key={mod.module}
                                                            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs overflow-hidden flex flex-col"
                                                        >
                                                            {/* Header del módulo */}
                                                            <div className="px-4 py-2.5 bg-slate-50/90 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                                                        {mod.moduleLabel}
                                                                    </span>
                                                                    <span
                                                                        className={cn(
                                                                            'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                                                                            isAllModuleSelected
                                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                                : modSelectedCount > 0
                                                                                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                                                                                  : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                                        )}
                                                                    >
                                                                        {modSelectedCount}/{mod.permissions.length}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <Label
                                                                        htmlFor={`mod-switch-${sectorEntry.sector}-${mod.module}`}
                                                                        className="text-[11px] font-medium text-slate-500 dark:text-slate-400 cursor-pointer select-none"
                                                                    >
                                                                        {__('All')}
                                                                    </Label>
                                                                    <Switch
                                                                        id={`mod-switch-${sectorEntry.sector}-${mod.module}`}
                                                                        checked={isAllModuleSelected}
                                                                        disabled={isReadOnly}
                                                                        onCheckedChange={(checked) =>
                                                                            handleModuleToggle(mod.permissions, checked)
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Lista de permisos */}
                                                            <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                                                                {mod.permissions.map((perm) => {
                                                                    const isChecked = isSuperAdmin || selectedSet.has(perm.name);
                                                                    const badgeMeta = getActionBadgeMeta(perm.name);
                                                                    const isNewlyAdded =
                                                                        Boolean(editingRole) &&
                                                                        !isReadOnly &&
                                                                        isChecked &&
                                                                        !initialPermissionsSet.has(perm.name);
                                                                    const isNewlyRemoved =
                                                                        Boolean(editingRole) &&
                                                                        !isReadOnly &&
                                                                        !isChecked &&
                                                                        initialPermissionsSet.has(perm.name);

                                                                    return (
                                                                        <label
                                                                            key={perm.id}
                                                                            htmlFor={`perm-${perm.id}`}
                                                                            className={cn(
                                                                                'flex items-center justify-between gap-3 px-4 py-2.5 transition-colors select-none',
                                                                                !isReadOnly && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40',
                                                                                isNewlyAdded && 'bg-emerald-50/50 dark:bg-emerald-950/20',
                                                                                isNewlyRemoved && 'bg-rose-50/50 dark:bg-rose-950/20'
                                                                            )}
                                                                        >
                                                                            <div className="flex items-start gap-2.5 min-w-0">
                                                                                <Checkbox
                                                                                    id={`perm-${perm.id}`}
                                                                                    checked={isChecked}
                                                                                    disabled={isReadOnly}
                                                                                    onCheckedChange={(checked) =>
                                                                                        handlePermissionToggle(perm.name, Boolean(checked))
                                                                                    }
                                                                                    className="mt-0.5"
                                                                                />
                                                                                <div className="min-w-0">
                                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">
                                                                                            {perm.slug}
                                                                                        </span>
                                                                                        {isNewlyAdded && (
                                                                                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                                                                                +Nuevo
                                                                                            </span>
                                                                                        )}
                                                                                        {isNewlyRemoved && (
                                                                                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                                                                                -Quitado
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <span className="block font-mono text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                                                                        {perm.name}
                                                                                    </span>
                                                                                </div>
                                                                            </div>

                                                                            <span
                                                                                className={cn(
                                                                                    'shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize',
                                                                                    badgeMeta.className
                                                                                )}
                                                                            >
                                                                                {badgeMeta.label}
                                                                            </span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Footer Fijo */}
                    <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                        <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-2">
                            <span>
                                <strong className="text-slate-900 dark:text-white">{selectedCount}</strong> de{' '}
                                <strong>{totalSystemCount}</strong> permisos seleccionados
                            </span>
                            {editingRole && !isReadOnly && (diffCounts.added > 0 || diffCounts.removed > 0) && (
                                <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                                    ({diffCounts.added > 0 ? `+${diffCounts.added} añadidos` : ''}
                                    {diffCounts.added > 0 && diffCounts.removed > 0 ? ', ' : ''}
                                    {diffCounts.removed > 0 ? `-${diffCounts.removed} quitados` : ''})
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={processing}
                                className="rounded-xl"
                            >
                                {isReadOnly ? 'Cerrar' : __('Cancel')}
                            </Button>
                            {!isReadOnly && (
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20"
                                >
                                    {processing
                                        ? __('Saving...')
                                        : editingRole
                                          ? __('Save Changes')
                                          : 'Crear Rol'}
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
