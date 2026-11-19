import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Loader2,
    PlusCircle,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Trash2,
} from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { notifyError } from '@/utils/notifications';
import type { ModuleMeta, SectorMeta, SyncStatus } from './types';

interface SyncPermissionsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    syncStatus: SyncStatus;
    sectorMeta: SectorMeta;
    moduleMeta: ModuleMeta;
}

export function SyncPermissionsModal({
    open,
    onOpenChange,
    syncStatus,
    sectorMeta,
    moduleMeta,
}: SyncPermissionsModalProps) {
    const [syncSuperAdmin, setSyncSuperAdmin] = useState(true);
    const [pruneObsolete, setPruneObsolete] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSyncSubmit = () => {
        setIsSyncing(true);
        router.post(
            '/admin/roles/sync-permissions',
            {
                sync_super_admin: syncSuperAdmin,
                prune_obsolete: pruneObsolete,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSyncing(false);
                    setPruneObsolete(false);
                    onOpenChange(false);
                },
                onError: () => {
                    setIsSyncing(false);
                    notifyError('Ocurrió un error al sincronizar los permisos.');
                },
            }
        );
    };

    const getSectorLabel = (sectorKey: string | null) => {
        if (!sectorKey) {
            return 'Sin sector';
        }

        return sectorMeta[sectorKey]?.label || sectorKey;
    };

    const getModuleLabel = (moduleKey: string | null) => {
        if (!moduleKey) {
            return 'General';
        }

        return moduleMeta[moduleKey] || moduleKey;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl">
                {/* Header */}
                <div className="relative px-6 pt-5 pb-4 pr-12 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-r from-emerald-500/8 via-indigo-500/5 to-transparent shrink-0">
                    <div className="flex items-center gap-3.5">
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/10 shrink-0">
                            <RefreshCw className={cn('h-5 w-5', isSyncing && 'animate-spin')} />
                        </div>
                        <div>
                            <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Sincronización de Permisos del Sistema
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Compara el catálogo canónico y las rutas activas contra los permisos registrados en base de datos ({syncStatus.total_in_db} actuales vs {syncStatus.total_expected} esperados).
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {/* Body Scrolleable */}
                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Tarjetas Resumen */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                    Nuevos
                                </span>
                                <PlusCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <p className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-200 mt-1">
                                {syncStatus.to_create.length}
                            </p>
                            <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">Por crear</span>
                        </div>

                        <div className="rounded-2xl border border-amber-200/70 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-3.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                    Reorganizar
                                </span>
                                <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <p className="text-2xl font-extrabold text-amber-900 dark:text-amber-200 mt-1">
                                {syncStatus.to_update.length}
                            </p>
                            <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80">Sector/etiqueta</span>
                        </div>

                        <div className="rounded-2xl border border-rose-200/70 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-3.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                                    Obsoletos
                                </span>
                                <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                            </div>
                            <p className="text-2xl font-extrabold text-rose-900 dark:text-rose-200 mt-1">
                                {syncStatus.obsolete.length}
                            </p>
                            <span className="text-[11px] text-rose-700/80 dark:text-rose-400/80">Sin ruta activa</span>
                        </div>
                    </div>

                    {/* Estado sincronizado o listado detallado */}
                    {syncStatus.in_sync ? (
                        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 p-5 flex items-start gap-3.5">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                                    Catálogo sincronizado al 100%
                                </h4>
                                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                                    Todos los permisos del catálogo y de las rutas activas coinciden con la base de datos. Puedes ejecutar la sincronización de igual modo para refrescar la caché de permisos y asegurar la asignación del Super Administrador.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {syncStatus.to_create.length > 0 && (
                                <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-900/60 overflow-hidden">
                                    <div className="px-4 py-2.5 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-200/60 dark:border-emerald-900/50 flex items-center justify-between">
                                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                            Permisos nuevos por crear ({syncStatus.to_create.length})
                                        </span>
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-44 overflow-y-auto">
                                        {syncStatus.to_create.map((item) => (
                                            <div key={item.name} className="px-4 py-2 flex items-center justify-between gap-2 text-xs">
                                                <div className="min-w-0">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                                                        {item.slug}
                                                    </span>
                                                    <span className="font-mono text-[11px] text-slate-400">{item.name}</span>
                                                </div>
                                                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                    {getSectorLabel(item.sector)} · {getModuleLabel(item.module)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {syncStatus.to_update.length > 0 && (
                                <div className="rounded-2xl border border-amber-200/70 dark:border-amber-900/60 overflow-hidden">
                                    <div className="px-4 py-2.5 bg-amber-50/80 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-900/50 flex items-center justify-between">
                                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                            Permisos por actualizar / reorganizar ({syncStatus.to_update.length})
                                        </span>
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-48 overflow-y-auto">
                                        {syncStatus.to_update.map((item) => (
                                            <div key={item.name} className="px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                                                <div className="min-w-0">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                                                        {item.slug}
                                                    </span>
                                                    <span className="font-mono text-[11px] text-slate-400">{item.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-medium">
                                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                        {getSectorLabel(item.current_sector)} / {getModuleLabel(item.current_module)}
                                                    </span>
                                                    <ArrowRight className="h-3 w-3 text-amber-500 shrink-0" />
                                                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold">
                                                        {getSectorLabel(item.target_sector)} / {getModuleLabel(item.target_module)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {syncStatus.obsolete.length > 0 && (
                                <div className="rounded-2xl border border-rose-200/70 dark:border-rose-900/60 overflow-hidden">
                                    <div className="px-4 py-2.5 bg-rose-50/80 dark:bg-rose-950/40 border-b border-rose-200/60 dark:border-rose-900/50 flex items-center justify-between">
                                        <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                                            Permisos obsoletos sin uso en rutas o catálogo ({syncStatus.obsolete.length})
                                        </span>
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-44 overflow-y-auto">
                                        {syncStatus.obsolete.map((item) => (
                                            <div key={item.id} className="px-4 py-2 flex items-center justify-between gap-2 text-xs">
                                                <div className="min-w-0">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                                                        {item.slug}
                                                    </span>
                                                    <span className="font-mono text-[11px] text-slate-400">{item.name}</span>
                                                </div>
                                                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                                    {item.roles_count} {item.roles_count === 1 ? 'rol' : 'roles'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Opciones de sincronización */}
                    <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-900/40">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                                <div>
                                    <Label htmlFor="sync-super-admin" className="text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer">
                                        Sincronizar permisos al Super Administrador y limpiar caché
                                    </Label>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        Asegura que los roles de Super Admin hereden los permisos recién creados y refresca la caché de Spatie.
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="sync-super-admin"
                                checked={syncSuperAdmin}
                                onCheckedChange={setSyncSuperAdmin}
                            />
                        </div>

                        {syncStatus.obsolete.length > 0 && (
                            <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200/70 dark:border-rose-900/60 p-4 bg-rose-50/40 dark:bg-rose-950/20">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                                    <div>
                                        <Label htmlFor="prune-obsolete" className="text-xs font-bold text-rose-900 dark:text-rose-200 cursor-pointer">
                                            Eliminar permisos obsoletos no utilizados en rutas ({syncStatus.obsolete.length})
                                        </Label>
                                        <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80 mt-0.5">
                                            Acción preventiva: desactivada por defecto. Si la activas, se desvincularán de todos los roles existentes.
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    id="prune-obsolete"
                                    checked={pruneObsolete}
                                    onCheckedChange={setPruneObsolete}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/70 flex items-center justify-end gap-2.5 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSyncing}
                        className="rounded-xl"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSyncSubmit}
                        disabled={isSyncing}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 gap-2"
                    >
                        {isSyncing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Sincronizando...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4" />
                                Sincronizar ahora
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
