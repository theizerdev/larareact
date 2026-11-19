import {
    Calendar,
    CheckCircle,
    Clock,
    MoreVertical,
    Pencil,
    Phone,
    RefreshCw,
    Trash2,
    UserCheck,
    Users,
    XCircle,
} from 'lucide-react';
import React from 'react';
import { EntityAvatar } from '@/components/entity-avatar';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
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

export interface VisitaTemporalGridItem {
    id: number;
    nombres: string;
    apellidos: string;
    nombre_comercial?: string | null;
    documento_identidad: string;
    telefono?: string | null;
    motivo_visita?: string | null;
    fecha_ingreso: string;
    hora_ingreso: string;
    fecha_salida: string;
    hora_salida: string;
    foto_carnet?: string | null;
    status: string | number;
    pais_telefono?: { codigo_telefonico?: string | null } | null;
    empleado?: { nombres: string; apellidos: string } | null;
    responsable?: { nombres: string; apellidos: string } | null;
    tipo_servicio?: { nombre: string } | null;
}

interface VisitasTemporalesGridProps<T extends VisitaTemporalGridItem> {
    visitas: {
        data: T[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    isLoading: boolean;
    filters: Record<string, string | undefined>;
    hasActiveFilters: boolean;
    onResetFilters: () => void;
    onCreateClick: () => void;
    onEdit: (visit: T) => void;
    onToggleStatus: (visit: T, event?: React.MouseEvent | unknown) => void;
    onSetStatus: (visit: T, status: 'activo' | 'suspendido' | 'en_revision') => void;
    onDelete: (visit: T) => void;
}

export function VisitasTemporalesGrid<T extends VisitaTemporalGridItem>({
    visitas,
    isLoading,
    filters,
    hasActiveFilters,
    onResetFilters,
    onCreateClick,
    onEdit,
    onToggleStatus,
    onSetStatus,
    onDelete,
}: VisitasTemporalesGridProps<T>) {
    const { __ } = useTranslate();

    return (
        <div className="space-y-4">
            {isLoading ? (
                <CardGridSkeleton />
            ) : visitas.data.length === 0 ? (
                <GridEmptyState
                    icon={<Users className="h-6 w-6" />}
                    title={__('No temporary visits found')}
                    description={
                        hasActiveFilters
                            ? __('Try clearing your search filters or changing your query.')
                            : __('You have not registered any visits yet.')
                    }
                    hasActiveFilters={hasActiveFilters}
                    onResetFilters={onResetFilters}
                    ctaLabel={__('Register First Visit')}
                    onCtaClick={onCreateClick}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {visitas.data.map((visit) => {
                        const fullName = `${visit.nombres} ${visit.apellidos}`.trim();
                        const statusStr = String(visit.status || '');
                        const isActive = statusStr === 'activo';
                        const isSuspended = statusStr === 'suspendido';

                        const badgeClass = isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                            : isSuspended
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900';

                        const statusLabel = isActive
                            ? __('Active')
                            : isSuspended
                              ? __('Suspended')
                              : __('Under Review');

                        const avatarStatus = isActive ? 'active' : isSuspended ? 'danger' : 'warning';
                        const stripClass = isActive
                            ? 'from-indigo-600 via-blue-500 to-emerald-500'
                            : isSuspended
                              ? 'from-rose-500 to-red-600'
                              : 'from-amber-500 to-orange-500';

                        return (
                            <div
                                key={visit.id}
                                onClick={() => onEdit(visit)}
                                className="group relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card text-card-foreground shadow-xs hover:shadow-md hover:border-indigo-200/80 dark:hover:border-indigo-800/60 transition-all overflow-hidden flex flex-col justify-between cursor-pointer"
                            >
                                <div className={cn('h-1.5 w-full bg-gradient-to-r', stripClass)} />

                                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3.5 min-w-0">
                                                <EntityAvatar
                                                    name={fullName}
                                                    firstName={visit.nombres}
                                                    lastName={visit.apellidos}
                                                    seed={visit.documento_identidad || fullName}
                                                    src={visit.foto_carnet}
                                                    status={avatarStatus}
                                                    size="lg"
                                                    shape="circle"
                                                />
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                                                        {fullName}
                                                    </h3>
                                                    {visit.nombre_comercial && (
                                                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate">
                                                            {visit.nombre_comercial}
                                                        </p>
                                                    )}
                                                    <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">
                                                        {visit.documento_identidad || __('Fast Delivery')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                                        <DropdownMenuItem onClick={() => onEdit(visit)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            {__('Edit')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onSetStatus(visit, 'activo')}>
                                                            <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                                                            {__('Set Active')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onSetStatus(visit, 'suspendido')}>
                                                            <XCircle className="mr-2 h-4 w-4 text-rose-500" />
                                                            {__('Set Suspended')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onSetStatus(visit, 'en_revision')}>
                                                            <RefreshCw className="mr-2 h-4 w-4 text-amber-500" />
                                                            {__('Set Under Review')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => onDelete(visit)}
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
                                            <span className={cn('text-[11px] font-semibold px-2.5 py-0.5 rounded-full border', badgeClass)}>
                                                {statusLabel}
                                            </span>
                                            {visit.tipo_servicio?.nombre && (
                                                <Badge variant="secondary" className="text-[11px] rounded-full">
                                                    {visit.tipo_servicio.nombre}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 p-3 space-y-1.5 text-xs text-muted-foreground">
                                            {visit.empleado && (
                                                <div className="flex items-center gap-1.5 truncate text-slate-700 dark:text-slate-300 font-medium">
                                                    <UserCheck className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                    <span className="truncate">
                                                        {visit.empleado.nombres} {visit.empleado.apellidos}
                                                    </span>
                                                </div>
                                            )}
                                            {visit.responsable && (
                                                <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono truncate">
                                                    {__('Authorized by:')} {visit.responsable.nombres} {visit.responsable.apellidos}
                                                </div>
                                            )}
                                            {visit.motivo_visita && (
                                                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                                                    {visit.motivo_visita}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                    {visit.fecha_ingreso
                                                        ? `${visit.fecha_ingreso} ${visit.hora_ingreso ? visit.hora_ingreso.substring(0, 5) : ''}`
                                                        : __('Fast Delivery')}
                                                </span>
                                                {visit.telefono && (
                                                    <span className="flex items-center gap-1 font-mono text-[11px]">
                                                        <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                                                        {visit.pais_telefono ? `+${visit.pais_telefono.codigo_telefonico} ` : ''}
                                                        {visit.telefono}
                                                    </span>
                                                )}
                                            </div>
                                            {visit.fecha_salida && (
                                                <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 text-[11px]">
                                                    <Clock className="h-3 w-3 shrink-0" />
                                                    <span>
                                                        {visit.fecha_salida} {visit.hora_salida ? visit.hora_salida.substring(0, 5) : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={isActive}
                                                onCheckedChange={() => onToggleStatus(visit)}
                                            />
                                            <span className="text-[11px] text-muted-foreground">{statusLabel}</span>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onEdit(visit)}
                                            className="h-8 px-3 rounded-xl text-xs gap-1.5 hover:border-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-300"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            {__('Edit')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Pagination paginatedData={visitas} filters={filters} />
        </div>
    );
}
