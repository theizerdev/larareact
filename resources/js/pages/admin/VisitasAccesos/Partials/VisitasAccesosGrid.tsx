import {
    Calendar,
    Car,
    Clock,
    Eye,
    Footprints,
    LogOut,
    ShieldCheck,
    Sprout,
    Truck,
    User,
    Users,
} from 'lucide-react';
import React from 'react';
import { EntityAvatar } from '@/components/entity-avatar';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardGridSkeleton, GridEmptyState } from '@/components/view-mode-toggle';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';

export interface VisitaAccesoGridItem {
    id: number;
    codigo_visitante: number;
    tipo_acceso: 'empleado' | 'proveedor' | 'productor' | 'visitante';
    visitante_nombre?: string | null;
    visitante_documento?: string | null;
    foto_carnet?: string | null;
    visitante_empresa?: string | null;
    empleado_id?: number | null;
    proveedor_id?: number | null;
    proveedor_empleado_id?: number | null;
    productor_id?: number | null;
    productor_empleado_id?: number | null;
    medio_acceso: 'peatonal' | 'vehicular';
    vehiculo_placa?: string | null;
    fecha_ingreso: string;
    hora_ingreso: string;
    fecha_salida?: string | null;
    hora_salida?: string | null;
    acompanantes?: unknown[] | null;
    status: number;
    empleado?: {
        nombres?: string;
        apellidos?: string;
        codigo_acceso?: string;
        documento_identidad?: string;
        foto_empleado?: string | null;
    } | null;
    proveedor?: {
        nombre_comercial?: string;
        razon_social?: string;
        codigo_acceso?: string;
        documento_identidad?: string;
    } | null;
    proveedor_empleado?: {
        nombres?: string;
        apellidos?: string;
        documento_identidad?: string;
        foto_carnet?: string | null;
        foto_empleado?: string | null;
    } | null;
    productor?: {
        nombre_comercial_rancho?: string;
        razon_social_rancho?: string;
        nombre_comercial?: string;
        razon_social?: string;
        codigo_acceso?: string;
        documento_identidad?: string;
    } | null;
    productor_empleado?: {
        nombres?: string;
        apellidos?: string;
        documento_identidad?: string;
        foto_carnet?: string | null;
        foto_empleado?: string | null;
    } | null;
}

export interface AccesoResolvedDisplay {
    kind: 'empleado' | 'productor' | 'proveedor' | 'visitante';
    nombre: string;
    firstName?: string | null;
    lastName?: string | null;
    doc: string;
    subEntity: string | null;
    avatarUrl: string | null;
}

export function resolveAccesoDisplay(
    item: VisitaAccesoGridItem,
    formatImageUrl: (path?: string | null) => string | null
): AccesoResolvedDisplay {
    const isProv =
        item.tipo_acceso === 'proveedor' ||
        (item.tipo_acceso !== 'empleado' &&
            item.tipo_acceso !== 'productor' &&
            Boolean(item.proveedor_id || item.proveedor || item.proveedor_empleado));
    const isProd =
        item.tipo_acceso === 'productor' ||
        (item.tipo_acceso !== 'empleado' &&
            Boolean(item.productor_id || item.productor || item.productor_empleado));
    const isEmp = item.tipo_acceso === 'empleado' || Boolean(item.empleado_id || item.empleado);
    const isVisitante = !isProv && !isProd && !isEmp;

    if (isEmp) {
        const firstName = item.empleado?.nombres || null;
        const lastName = item.empleado?.apellidos || null;

        return {
            kind: 'empleado',
            nombre: `${firstName || ''} ${lastName || ''}`.trim() || 'Empleado',
            firstName,
            lastName,
            doc: item.empleado?.codigo_acceso
                ? `CÓD: ${item.empleado.codigo_acceso}`
                : item.empleado?.documento_identidad || '-',
            subEntity: null,
            avatarUrl: formatImageUrl(item.empleado?.foto_empleado),
        };
    }

    if (isProd) {
        const firstName = item.productor_empleado?.nombres || null;
        const lastName = item.productor_empleado?.apellidos || null;
        const ranchoName =
            item.productor?.nombre_comercial_rancho ||
            item.productor?.razon_social_rancho ||
            item.productor?.nombre_comercial ||
            item.productor?.razon_social ||
            null;
        const nombre = item.productor_empleado
            ? `${firstName || ''} ${lastName || ''}`.trim()
            : ranchoName || item.visitante_nombre || '-';

        return {
            kind: 'productor',
            nombre,
            firstName: item.productor_empleado ? firstName : undefined,
            lastName: item.productor_empleado ? lastName : undefined,
            doc: item.productor?.codigo_acceso
                ? `CÓD: ${item.productor.codigo_acceso}`
                : item.productor_empleado?.documento_identidad ||
                  item.productor?.documento_identidad ||
                  item.visitante_documento ||
                  '-',
            subEntity: ranchoName,
            avatarUrl: formatImageUrl(
                item.productor_empleado?.foto_carnet ||
                    item.productor_empleado?.foto_empleado ||
                    item.foto_carnet
            ),
        };
    }

    if (isProv) {
        const firstName = item.proveedor_empleado?.nombres || null;
        const lastName = item.proveedor_empleado?.apellidos || null;
        const provName = item.proveedor?.nombre_comercial || item.proveedor?.razon_social || null;
        const nombre = item.proveedor_empleado
            ? `${firstName || ''} ${lastName || ''}`.trim()
            : provName || item.visitante_nombre || '-';

        return {
            kind: 'proveedor',
            nombre,
            firstName: item.proveedor_empleado ? firstName : undefined,
            lastName: item.proveedor_empleado ? lastName : undefined,
            doc: item.proveedor?.codigo_acceso
                ? `CÓD: ${item.proveedor.codigo_acceso}`
                : item.proveedor_empleado?.documento_identidad ||
                  item.proveedor?.documento_identidad ||
                  item.visitante_documento ||
                  '-',
            subEntity: provName,
            avatarUrl: formatImageUrl(
                item.proveedor_empleado?.foto_carnet ||
                    item.proveedor_empleado?.foto_empleado ||
                    item.foto_carnet
            ),
        };
    }

    return {
        kind: isVisitante ? 'visitante' : 'visitante',
        nombre: item.visitante_nombre || 'Visitante Particular',
        doc: item.codigo_visitante ? `CÓD: ${item.codigo_visitante}` : item.visitante_documento || '-',
        subEntity: item.visitante_empresa || 'Particular',
        avatarUrl: formatImageUrl(item.foto_carnet),
    };
}

interface VisitasAccesosGridProps<T extends VisitaAccesoGridItem> {
    accesos: {
        data: T[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    isLoading: boolean;
    filters: Record<string, string | undefined>;
    hasActiveFilters: boolean;
    onResetFilters: () => void;
    onCreateClick: () => void;
    onViewDetail: (item: T) => void;
    onViewAcompanantes: (item: T) => void;
    onMarcarSalida: (id: number) => void;
    formatImageUrl: (path?: string | null) => string | null;
}

export function VisitasAccesosGrid<T extends VisitaAccesoGridItem>({
    accesos,
    isLoading,
    filters,
    hasActiveFilters,
    onResetFilters,
    onCreateClick,
    onViewDetail,
    onViewAcompanantes,
    onMarcarSalida,
    formatImageUrl,
}: VisitasAccesosGridProps<T>) {
    const { __ } = useTranslate();

    return (
        <div className="space-y-4">
            {isLoading ? (
                <CardGridSkeleton />
            ) : accesos.data.length === 0 ? (
                <GridEmptyState
                    icon={<ShieldCheck className="h-6 w-6" />}
                    title={__('No se encontraron registros de acceso')}
                    description={
                        hasActiveFilters
                            ? __('Intente limpiar los filtros de búsqueda o cambie su consulta.')
                            : __('No hay accesos registrados todavía.')
                    }
                    hasActiveFilters={hasActiveFilters}
                    onResetFilters={onResetFilters}
                    ctaLabel={__('Nuevo Registro de Acceso')}
                    onCtaClick={onCreateClick}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {accesos.data.map((item) => {
                        const info = resolveAccesoDisplay(item, formatImageUrl);
                        const isInside = item.status === 1;
                        const acompanantesCount = item.acompanantes?.length ?? 0;

                        const stripClass = isInside
                            ? 'from-emerald-600 via-teal-500 to-green-500'
                            : 'from-slate-400 to-slate-500';

                        return (
                            <div
                                key={item.id}
                                onClick={() => onViewDetail(item)}
                                className="group relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card text-card-foreground shadow-xs hover:shadow-md hover:border-emerald-200/80 dark:hover:border-emerald-800/60 transition-all overflow-hidden flex flex-col justify-between cursor-pointer"
                            >
                                <div className={cn('h-1.5 w-full bg-gradient-to-r', stripClass)} />

                                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3.5 min-w-0">
                                                <EntityAvatar
                                                    name={info.nombre}
                                                    firstName={info.firstName}
                                                    lastName={info.lastName}
                                                    seed={info.doc || info.nombre}
                                                    src={info.avatarUrl}
                                                    status={isInside ? 'active' : 'inactive'}
                                                    size="lg"
                                                    shape="circle"
                                                />
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                                                        {info.nombre}
                                                    </h3>
                                                    {info.subEntity && (
                                                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 truncate">
                                                            {info.subEntity}
                                                        </p>
                                                    )}
                                                    <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">
                                                        Doc: {info.doc}
                                                    </p>
                                                </div>
                                            </div>

                                            <Badge
                                                variant="outline"
                                                className="font-mono font-bold bg-[#104a29]/10 text-[#104a29] dark:text-emerald-300 border-[#104a29]/30 text-[11px] px-2 py-0.5 shrink-0"
                                            >
                                                N° {item.codigo_visitante}
                                            </Badge>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {info.kind === 'empleado' && (
                                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900 gap-1 text-[11px] rounded-full">
                                                    <User className="w-3 h-3" /> {__('Empleado')}
                                                </Badge>
                                            )}
                                            {info.kind === 'productor' && (
                                                <Badge className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900 gap-1 text-[11px] rounded-full">
                                                    <Sprout className="w-3 h-3" /> {__('Productor')}
                                                </Badge>
                                            )}
                                            {info.kind === 'proveedor' && (
                                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900 gap-1 text-[11px] rounded-full">
                                                    <Truck className="w-3 h-3" /> {__('Proveedor')}
                                                </Badge>
                                            )}
                                            {info.kind === 'visitante' && (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 gap-1 text-[11px] rounded-full">
                                                    <User className="w-3 h-3" /> {__('Visitante Particular')}
                                                </Badge>
                                            )}

                                            {isInside ? (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 text-[11px] rounded-full">
                                                    {__('En Instalaciones')}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[11px] rounded-full">
                                                    {__('Finalizado')}
                                                </Badge>
                                            )}

                                            {acompanantesCount > 0 && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onViewAcompanantes(item);
                                                    }}
                                                    className="bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] h-5 px-2 gap-1 font-semibold rounded-full"
                                                >
                                                    <Users className="w-3 h-3 text-emerald-600" />
                                                    +{acompanantesCount} {acompanantesCount === 1 ? 'Acompañante' : 'Acompañantes'}
                                                </Button>
                                            )}
                                        </div>

                                        <div className="rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 p-3 space-y-1.5 text-xs text-muted-foreground">
                                            <div className="flex items-center justify-between gap-2">
                                                {item.medio_acceso === 'vehicular' ? (
                                                    <span className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
                                                        <Car className="h-3.5 w-3.5 shrink-0" />
                                                        <span>{__('Vehicular')}</span>
                                                        {item.vehiculo_placa && (
                                                            <span className="font-mono text-slate-600 dark:text-slate-300">
                                                                ({item.vehiculo_placa})
                                                            </span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                                                        <Footprints className="h-3.5 w-3.5 shrink-0" />
                                                        <span>{__('Peatonal')}</span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                    {item.fecha_ingreso} {item.hora_ingreso ? item.hora_ingreso.substring(0, 5) : ''}
                                                </span>
                                                {item.fecha_salida ? (
                                                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                                                        <Clock className="h-3.5 w-3.5 shrink-0" />
                                                        {item.fecha_salida} {item.hora_salida ? item.hora_salida.substring(0, 5) : ''}
                                                    </span>
                                                ) : (
                                                    <span className="italic text-emerald-600 dark:text-emerald-400 font-medium">
                                                        {__('En Instalaciones')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2"
                                    >
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onViewDetail(item)}
                                            className="h-8 px-3 rounded-xl text-xs gap-1 text-slate-600 dark:text-slate-300"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            {__('Ver')}
                                        </Button>

                                        {isInside && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onMarcarSalida(item.id)}
                                                className="h-8 px-3 rounded-xl border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 text-xs gap-1"
                                            >
                                                <LogOut className="h-3.5 w-3.5" />
                                                {__('Salida')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Pagination paginatedData={accesos} filters={filters} />
        </div>
    );
}
