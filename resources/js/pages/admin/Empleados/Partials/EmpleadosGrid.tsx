import { router } from '@inertiajs/react';
import {
    Briefcase,
    Eye,
    Layers,
    Mail,
    MoreVertical,
    Pencil,
    Phone,
    Send,
    ToggleRight,
    Trash2,
    UserCheck,
    Users,
} from 'lucide-react';
import React from 'react';
import { EntityAvatar } from '@/components/entity-avatar';
import Pagination from '@/components/pagination';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { CardGridSkeleton, GridEmptyState } from '@/components/view-mode-toggle';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types/app';

export interface EmpleadoGridItem {
    id: number;
    nombres: string;
    apellidos: string;
    documento_identidad: string;
    codigo_acceso?: string | null;
    tarjeta_acceso_1?: string | null;
    tarjeta_acceso_2?: string | null;
    tarjeta_acceso_3?: string | null;
    curp?: string | null;
    telefono?: string | null;
    correo?: string | null;
    foto_empleado?: string | null;
    status: boolean;
    pais_telefono?: { codigo_telefonico?: string | null } | null;
    departamento?: { nombre: string } | null;
    responsable?: {
        nombres: string;
        apellidos: string;
        cargo?: { nombre: string } | null;
    } | null;
    cargo?: { nombre: string } | null;
}

interface EmpleadosGridProps<T extends EmpleadoGridItem> {
    empleados: Paginated<T>;
    isLoading: boolean;
    filters: Record<string, string | undefined>;
    hasActiveFilters: boolean;
    onResetFilters: () => void;
    onCreateClick: () => void;
    onEdit: (emp: T) => void;
    onToggleStatus: (emp: T) => void;
    onDelete: (emp: T) => void;
    formatImageUrl: (url: string | null | undefined) => string | null;
}

export function EmpleadosGrid<T extends EmpleadoGridItem>({
    empleados,
    isLoading,
    filters,
    hasActiveFilters,
    onResetFilters,
    onCreateClick,
    onEdit,
    onToggleStatus,
    onDelete,
    formatImageUrl,
}: EmpleadosGridProps<T>) {
    const { __ } = useTranslate();

    return (
        <div className="space-y-4">
            {isLoading ? (
                <CardGridSkeleton />
            ) : empleados.data.length === 0 ? (
                <GridEmptyState
                    icon={<Users className="h-6 w-6" />}
                    title={__('No employees found')}
                    description={
                        hasActiveFilters
                            ? __('Try clearing your search filters or changing your query.')
                            : __('You have not registered any employees yet.')
                    }
                    hasActiveFilters={hasActiveFilters}
                    onResetFilters={onResetFilters}
                    ctaLabel={__('New Employee')}
                    onCtaClick={onCreateClick}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {empleados.data.map((emp) => {
                        const fullName = `${emp.nombres} ${emp.apellidos}`.trim();
                        const fotoUrl = formatImageUrl(emp.foto_empleado);

                        return (
                            <div
                                key={emp.id}
                                onClick={() => onEdit(emp)}
                                className="group relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card text-card-foreground shadow-xs hover:shadow-md hover:border-indigo-200/80 dark:hover:border-indigo-800/60 transition-all overflow-hidden flex flex-col justify-between cursor-pointer"
                            >
                                <div
                                    className={cn(
                                        'h-1.5 w-full bg-gradient-to-r',
                                        emp.status
                                            ? 'from-indigo-500 via-blue-500 to-emerald-500'
                                            : 'from-slate-400 to-slate-500'
                                    )}
                                />

                                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3.5 min-w-0">
                                                <EntityAvatar
                                                    name={fullName}
                                                    firstName={emp.nombres}
                                                    lastName={emp.apellidos}
                                                    seed={emp.correo || emp.documento_identidad || fullName}
                                                    src={fotoUrl}
                                                    status={emp.status ? 'active' : 'inactive'}
                                                    size="lg"
                                                    shape="circle"
                                                />
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                                                        {fullName}
                                                    </h3>
                                                    <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                                                        N° EMP: {emp.documento_identidad || 'N/A'}
                                                    </p>
                                                    {emp.correo && (
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                                            <Mail className="h-3 w-3 shrink-0 text-sky-500" />
                                                            <span className="truncate">{emp.correo}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-52 rounded-xl">
                                                        <DropdownMenuItem onClick={() => onEdit(emp)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            {__('Edit')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => router.get(`/admin/empleados/${emp.id}/carnet`)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            {__('Ver Carnet')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => router.post(`/admin/empleados/${emp.id}/enviar-carnet`)}>
                                                            <Send className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                            {__('Enviar Carnet por WhatsApp')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onToggleStatus(emp)}>
                                                            <ToggleRight className="mr-2 h-4 w-4" />
                                                            {emp.status ? __('Deactivate') : __('Activate')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => onDelete(emp)}
                                                            className="text-red-600 focus:text-red-600 dark:text-red-400"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            {__('Delete')}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span
                                                className={cn(
                                                    'text-[11px] font-semibold px-2.5 py-0.5 rounded-full border',
                                                    emp.status
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
                                                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                )}
                                            >
                                                {emp.status ? __('Active') : __('Inactive')}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-[11px] border border-emerald-500/20">
                                                ACCESO: {emp.codigo_acceso || 'N/A'}
                                            </span>
                                            {emp.curp && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] border border-slate-200 dark:border-slate-700">
                                                    {emp.curp}
                                                </span>
                                            )}
                                        </div>

                                        <div className="rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 p-3 space-y-1.5 text-xs text-muted-foreground">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="flex items-center gap-1.5 truncate font-medium text-slate-700 dark:text-slate-300">
                                                    <Layers className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                    <span className="truncate">{emp.departamento?.nombre || '—'}</span>
                                                </span>
                                                {emp.cargo?.nombre && (
                                                    <span className="flex items-center gap-1 truncate shrink-0">
                                                        <Briefcase className="h-3 w-3 text-teal-600 shrink-0" />
                                                        {emp.cargo.nombre}
                                                    </span>
                                                )}
                                            </div>
                                            {emp.responsable && (
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                    <span className="truncate">
                                                        {emp.responsable.nombres} {emp.responsable.apellidos}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between gap-2 pt-0.5">
                                                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                                                    <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                                                    {emp.telefono
                                                        ? `${emp.pais_telefono?.codigo_telefonico ? `+${emp.pais_telefono.codigo_telefonico} ` : ''}${emp.telefono}`
                                                        : '—'}
                                                </span>
                                                <span className="font-mono text-[10px] text-slate-500">
                                                    T1:{emp.tarjeta_acceso_1 || '0'} T2:{emp.tarjeta_acceso_2 || '0'} T3:{emp.tarjeta_acceso_3 || '0'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={emp.status}
                                                onCheckedChange={() => onToggleStatus(emp)}
                                            />
                                            <span className="text-[11px] text-muted-foreground">
                                                {emp.status ? __('Active') : __('Inactive')}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.get(`/admin/empleados/${emp.id}/carnet`)}
                                                className="h-8 px-2.5 rounded-xl text-xs gap-1"
                                                title={__('Ver Carnet')}
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                Carnet
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEdit(emp)}
                                                className="h-8 px-3 rounded-xl text-xs gap-1.5 hover:border-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-300"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                {__('Edit')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Pagination paginatedData={empleados} filters={filters} />
        </div>
    );
}
