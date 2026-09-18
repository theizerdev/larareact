import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { DataTable, type ColumnDef } from '@/components/data-table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import {
    LayoutDashboard,
    Clock,
    Users,
    UserCheck,
    Coffee,
    LogOut,
    AlertTriangle,
    XCircle,
    CheckCircle2,
    MapPin,
    Building2,
    Search,
    RotateCcw,
    Eye,
    TrendingUp,
    ExternalLink,
    FileSpreadsheet,
    FileText,
    Camera
} from 'lucide-react';
import type { Paginated } from '@/types/app';
import { cleanParams } from '@/lib/utils';

interface SucursalOption {
    id: number;
    nombre: string;
    zona_horaria?: string | null;
    ciudad?: string | null;
    estado?: string | null;
}

interface ResponsableOption {
    id: number;
    nombres: string;
    apellidos: string;
}

interface EventoHoy {
    id: number;
    tipo_marcaje: string;
    fecha_hora: string;
    hora: string;
    origen?: string | null;
    latitud?: number | string | null;
    longitud?: number | string | null;
    geolocalizacion?: string | null;
    fotografia_path?: string | null;
    observaciones?: string | null;
}

interface ColaboradorStatus {
    id: number;
    nombres: string;
    apellidos: string;
    nombre_completo: string;
    documento_identidad: string;
    foto_empleado?: string | null;
    departamento: string;
    cargo: string;
    responsable: string;
    responsable_id?: number | null;
    sucursal: string;
    sucursal_id?: number | null;
    zona_horaria: string;
    turno: string;
    turno_horario?: string | null;
    status_asistencia: 'presente' | 'en_comida' | 'en_descanso' | 'salida' | 'ausente';
    es_retardo: boolean;
    minutos_retardo: number;
    primer_ingreso?: string | null;
    ultimo_evento?: {
        tipo: string;
        hora: string;
        origen?: string | null;
        latitud?: number | string | null;
        longitud?: number | string | null;
        geolocalizacion?: string | null;
    } | null;
    eventos_hoy?: EventoHoy[];
    total_marcajes_hoy: number;
}

interface KPIs {
    total_plantilla: number;
    presentes: number;
    en_comida: number;
    en_descanso: number;
    salidas: number;
    retardos: number;
    ausentes: number;
    tasa_asistencia: number;
}

interface Props {
    colaboradores: Paginated<ColaboradorStatus>;
    kpis: KPIs;
    sucursales: SucursalOption[];
    responsables: ResponsableOption[];
    filters: {
        sucursal_id?: number | null;
        responsable_id?: number | null;
        fecha?: string;
        search?: string;
        status_asistencia?: string;
        perPage?: number;
    };
}

export default function PanelControlAsistencia({
    colaboradores,
    kpis,
    sucursales = [],
    responsables = [],
    filters
}: Props) {
    // Estados locales para los filtros
    const [sucursalId, setSucursalId] = useState<string>(filters.sucursal_id ? String(filters.sucursal_id) : 'todas');
    const [responsableId, setResponsableId] = useState<string>(filters.responsable_id ? String(filters.responsable_id) : 'todos');
    const [fecha, setFecha] = useState<string>(filters.fecha || new Date().toISOString().split('T')[0]);
    const [search, setSearch] = useState<string>(filters.search || '');
    const [statusFilter, setStatusFilter] = useState<string>(filters.status_asistencia || 'todos');
    const [perPage, setPerPage] = useState<string>(filters.perPage ? String(filters.perPage) : '15');

    // Estado del colaborador seleccionado para inspección en Dialog
    const [selectedColaborador, setSelectedColaborador] = useState<ColaboradorStatus | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

    // Sede seleccionada para mostrar zona horaria
    const selectedSede = useMemo(() => {
        if (sucursalId === 'todas') return null;
        return sucursales.find((s) => String(s.id) === sucursalId) || null;
    }, [sucursalId, sucursales]);

    // Función para disparar la búsqueda/filtros
    const applyFilters = (newStatus?: string, newPerPage?: string) => {
        const activeStatus = newStatus !== undefined ? newStatus : statusFilter;
        const activePerPage = newPerPage !== undefined ? newPerPage : perPage;

        const params = cleanParams({
            sucursal_id: sucursalId !== 'todas' ? sucursalId : undefined,
            responsable_id: responsableId !== 'todos' ? responsableId : undefined,
            fecha: fecha || undefined,
            search: search.trim() || undefined,
            status_asistencia: activeStatus !== 'todos' ? activeStatus : undefined,
            perPage: activePerPage !== '15' ? activePerPage : undefined,
        });

        router.get('/admin/asistencia/panel-control', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSucursalId('todas');
        setResponsableId('todos');
        setFecha(new Date().toISOString().split('T')[0]);
        setSearch('');
        setStatusFilter('todos');
        setPerPage('15');
        router.get('/admin/asistencia/panel-control', {}, { preserveState: true });
    };

    const handleStatusTabChange = (val: string) => {
        setStatusFilter(val);
        applyFilters(val);
    };

    const handleCardClick = (statusKey: string) => {
        setStatusFilter(statusKey);
        applyFilters(statusKey);
    };

    // Apertura del modal de detalle
    const handleOpenDetail = (colab: ColaboradorStatus) => {
        setSelectedColaborador(colab);
        setIsDetailOpen(true);
    };

    // Helper para formato de estatus
    const getStatusConfig = (status: ColaboradorStatus['status_asistencia']) => {
        switch (status) {
            case 'presente':
                return {
                    label: 'Laborando',
                    badgeVariant: 'default' as const,
                    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20',
                    dotClass: 'bg-emerald-500 animate-pulse'
                };
            case 'en_comida':
                return {
                    label: 'En Almuerzo',
                    badgeVariant: 'default' as const,
                    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20',
                    dotClass: 'bg-amber-500'
                };
            case 'en_descanso':
                return {
                    label: 'Descanso Ley Silla',
                    badgeVariant: 'default' as const,
                    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 hover:bg-purple-500/20',
                    dotClass: 'bg-purple-500'
                };
            case 'salida':
                return {
                    label: 'Jornada Concluida',
                    badgeVariant: 'secondary' as const,
                    badgeClass: 'bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
                    dotClass: 'bg-slate-400'
                };
            case 'ausente':
            default:
                return {
                    label: 'Sin Marcaje',
                    badgeVariant: 'destructive' as const,
                    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20',
                    dotClass: 'bg-rose-400'
                };
        }
    };

    const getEventoLabel = (tipo?: string) => {
        switch (tipo) {
            case 'entrada': return 'Entrada Laboral';
            case 'salida_comida': return 'Salida a Comer';
            case 'entrada_comida': return 'Regreso de Comer';
            case 'descanso_inicio': return 'Inicio Descanso Silla';
            case 'descanso_fin': return 'Fin Descanso Silla';
            case 'salida': return 'Salida Final';
            case 'entrada_extraordinaria': return 'Entrada Extraordinaria';
            default: return tipo || 'Evento Registrado';
        }
    };

    // Definición de columnas estandarizadas para el componente DataTable
    const columns: ColumnDef<ColaboradorStatus>[] = [
        {
            header: 'Colaborador',
            dropdownLabel: 'Colaborador',
            accessorKey: 'nombre_completo',
            sortable: true,
            cell: (row) => {
                const initials = `${row.nombres.charAt(0)}${row.apellidos.charAt(0)}`.toUpperCase();
                return (
                    <div className="flex items-center gap-3 py-1">
                        <Avatar className="h-10 w-10 border border-indigo-200 dark:border-indigo-900 shrink-0">
                            {row.foto_empleado ? (
                                <AvatarImage src={`/storage/${row.foto_empleado}`} alt={row.nombre_completo} />
                            ) : null}
                            <AvatarFallback className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block truncate">
                                {row.nombres} {row.apellidos}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                <span className="font-mono font-medium">N° {row.documento_identidad}</span>
                                <span>•</span>
                                <span className="truncate max-w-[140px]">{row.cargo}</span>
                            </div>
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Sede & Turno',
            dropdownLabel: 'Sede y Turno',
            accessorKey: 'sucursal',
            sortable: true,
            cell: (row) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-xs text-slate-900 dark:text-slate-100">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">{row.sucursal}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono text-muted-foreground">
                            {row.zona_horaria}
                        </Badge>
                        {row.turno_horario && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium">
                                ({row.turno_horario})
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            header: 'Supervisor',
            dropdownLabel: 'Supervisor',
            accessorKey: 'responsable',
            sortable: true,
            cell: (row) => (
                <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium truncate">{row.responsable}</span>
                </div>
            )
        },
        {
            header: 'Estatus Hoy',
            dropdownLabel: 'Estatus Hoy',
            accessorKey: 'status_asistencia',
            sortable: true,
            cell: (row) => {
                const config = getStatusConfig(row.status_asistencia);
                return (
                    <Badge variant={config.badgeVariant} className={`gap-1.5 px-2.5 py-1 text-xs font-semibold ${config.badgeClass}`}>
                        <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
                        <span>{config.label}</span>
                    </Badge>
                );
            }
        },
        {
            header: 'Primer Ingreso',
            dropdownLabel: 'Primer Ingreso',
            accessorKey: 'primer_ingreso',
            sortable: true,
            cell: (row) => {
                if (!row.primer_ingreso) {
                    return <span className="text-xs text-muted-foreground italic">Sin entrada</span>;
                }
                return (
                    <div className="space-y-1">
                        <div className="font-mono font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{row.primer_ingreso}</span>
                        </div>
                        {row.es_retardo ? (
                            <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 text-[10px] font-mono font-bold">
                                Retardo +{row.minutos_retardo}m
                            </Badge>
                        ) : (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> A tiempo
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            header: 'Último Evento',
            dropdownLabel: 'Último Evento',
            cell: (row) => {
                const ultimo = row.ultimo_evento;
                if (!ultimo) {
                    return <span className="text-xs text-muted-foreground">—</span>;
                }
                return (
                    <div className="space-y-0.5 text-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {getEventoLabel(ultimo.tipo)}
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                            {ultimo.hora} • {ultimo.origen || 'Kiosko'}
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Geolocalización',
            dropdownLabel: 'Geolocalización',
            stopRowClick: true,
            cell: (row) => {
                const ultimo = row.ultimo_evento;
                if (ultimo && ultimo.latitud && ultimo.longitud) {
                    return (
                        <a
                            href={`https://www.google.com/maps?q=${ultimo.latitud},${ultimo.longitud}`}
                            target="_blank"
                            rel="noreferrer"
                            title={`Ver en Google Maps (${ultimo.latitud}, ${ultimo.longitud})`}
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900 hover:bg-blue-100 transition-colors"
                        >
                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{Number(ultimo.latitud).toFixed(3)}, {Number(ultimo.longitud).toFixed(3)}</span>
                            <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                        </a>
                    );
                }
                return (
                    <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1 opacity-70">
                        <MapPin className="w-3.5 h-3.5 opacity-40" /> Sin GPS
                    </span>
                );
            }
        },
        {
            header: 'Acciones',
            dropdownLabel: 'Acciones',
            stopRowClick: true,
            className: 'text-right',
            cell: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDetail(row)}
                        className="h-8 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-semibold gap-1"
                        title="Inspeccionar detalle del día"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Detalle</span>
                    </Button>
                    <Link
                        href={`/admin/asistencia/bitacora?search=${encodeURIComponent(row.documento_identidad)}`}
                        className="inline-flex items-center justify-center h-8 px-2 rounded-md text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                        title="Ver bitácora histórica completa de este colaborador"
                    >
                        <FileText className="w-3.5 h-3.5" />
                    </Link>
                </div>
            )
        }
    ];

    return (
        <>
            <Head title="Panel de Control de Asistencia en Vivo" />

            <div className="space-y-6">
                {/* 1. Breadcrumbs Reutilizable */}
                <Breadcrumbs
                    breadcrumbs={[
                        { title: 'Asistencia', href: '/admin/asistencia/bitacora' },
                        { title: 'Panel por Sede y Responsable', href: '/admin/asistencia/panel-control' },
                    ]}
                />

                {/* 2. Cabecera con ModuleHeader Reutilizable */}
                <ModuleHeader
                    title="Panel de Control por Sede y Responsable"
                    description="Supervisión en tiempo real de asistencia, retardos, pausas de ley y geolocalización por sede y supervisor."
                    icon={<LayoutDashboard className="h-6 w-6 text-white" />}
                    colorClassName="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600"
                >
                    <div className="flex flex-wrap items-center gap-2">
                        {selectedSede && (
                            <Badge variant="outline" className="bg-white/15 text-white border-white/30 text-xs font-mono gap-1.5 py-1 px-3">
                                <Clock className="w-3.5 h-3.5" />
                                Zona: {selectedSede.zona_horaria || 'America/Mexico_City'}
                            </Badge>
                        )}
                        <a
                            href={`/admin/asistencia/bitacora/exportar?formato=excel&fecha_inicio=${fecha}&fecha_fin=${fecha}${sucursalId !== 'todas' ? `&sucursal_id=${sucursalId}` : ''}${responsableId !== 'todos' ? `&responsable_id=${responsableId}` : ''}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/15 hover:bg-white/25 text-white transition-colors shadow-xs"
                            title="Exportar marcajes en formato Excel"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Excel
                        </a>
                        <Link href="/admin/asistencia/bitacora">
                            <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0 gap-1.5 text-xs font-semibold shadow-xs">
                                <Clock className="w-3.5 h-3.5" />
                                Bitácora Completa
                            </Button>
                        </Link>
                    </div>
                </ModuleHeader>

                {/* 3. Indicadores Clave con StatCard Reutilizable */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <div className="cursor-pointer" onClick={() => handleCardClick('todos')}>
                        <StatCard
                            title="Plantilla Total"
                            value={kpis.total_plantilla}
                            icon={<Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                            colorClassName="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                            className={statusFilter === 'todos' ? 'ring-2 ring-indigo-500' : ''}
                        />
                    </div>
                    <div className="cursor-pointer" onClick={() => handleCardClick('presentes')}>
                        <StatCard
                            title="Laborando"
                            value={kpis.presentes}
                            icon={<UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                            colorClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            className={statusFilter === 'presentes' ? 'ring-2 ring-emerald-500' : ''}
                        />
                    </div>
                    <div className="cursor-pointer" onClick={() => handleCardClick('pausa')}>
                        <StatCard
                            title="Comida / Descanso"
                            value={kpis.en_comida + kpis.en_descanso}
                            icon={<Coffee className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                            colorClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            className={statusFilter === 'pausa' ? 'ring-2 ring-amber-500' : ''}
                        />
                    </div>
                    <div className="cursor-pointer" onClick={() => handleCardClick('retardos')}>
                        <StatCard
                            title="Retardos"
                            value={kpis.retardos}
                            icon={<AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
                            colorClassName="bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            className={statusFilter === 'retardos' ? 'ring-2 ring-rose-500' : ''}
                        />
                    </div>
                    <div className="cursor-pointer" onClick={() => handleCardClick('salidas')}>
                        <StatCard
                            title="Jornada Concluida"
                            value={kpis.salidas}
                            icon={<LogOut className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
                            colorClassName="bg-slate-500/10 text-slate-600 dark:text-slate-400"
                            className={statusFilter === 'salidas' ? 'ring-2 ring-slate-500' : ''}
                        />
                    </div>
                    <div className="cursor-pointer" onClick={() => handleCardClick('ausentes')}>
                        <StatCard
                            title="Sin Marcaje"
                            value={kpis.ausentes}
                            icon={<XCircle className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />}
                            colorClassName="bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
                            className={statusFilter === 'ausentes' ? 'ring-2 ring-zinc-500' : ''}
                        />
                    </div>
                    <div>
                        <StatCard
                            title="% Asistencia"
                            value={`${kpis.tasa_asistencia}%`}
                            icon={<TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />}
                            colorClassName="bg-teal-500/10 text-teal-600 dark:text-teal-400"
                        />
                    </div>
                </div>

                {/* 4. Barra de Filtros con FilterBar y FilterField Reutilizables */}
                <FilterBar>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 w-full">
                        <FilterField label="Sede / Sucursal">
                            <Select value={sucursalId} onValueChange={setSucursalId}>
                                <SelectTrigger className="text-xs">
                                    <SelectValue placeholder="Todas las sedes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todas">Todas las sedes</SelectItem>
                                    {sucursales.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.nombre} {s.zona_horaria ? `(${s.zona_horaria})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Supervisor / Responsable">
                            <Select value={responsableId} onValueChange={setResponsableId}>
                                <SelectTrigger className="text-xs">
                                    <SelectValue placeholder="Todos los supervisores" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos los supervisores</SelectItem>
                                    {responsables.map((r) => (
                                        <SelectItem key={r.id} value={String(r.id)}>
                                            {r.nombres} {r.apellidos}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Fecha de Supervisión">
                            <Input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                className="text-xs"
                            />
                        </FilterField>

                        <FilterField label="Buscar Colaborador">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                                <Input
                                    placeholder="Nombre o N° Empleado..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                    className="pl-9 text-xs"
                                />
                            </div>
                        </FilterField>

                        <FilterField label="Por página">
                            <Select
                                value={perPage}
                                onValueChange={(val) => {
                                    setPerPage(val);
                                    applyFilters(undefined, val);
                                }}
                            >
                                <SelectTrigger className="text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 registros</SelectItem>
                                    <SelectItem value="15">15 registros</SelectItem>
                                    <SelectItem value="25">25 registros</SelectItem>
                                    <SelectItem value="50">50 registros</SelectItem>
                                    <SelectItem value="100">100 registros</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <div className="flex items-end gap-2">
                            <Button
                                onClick={() => applyFilters()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 flex-1 shadow-xs"
                            >
                                Filtrar
                            </Button>
                            <Button
                                onClick={handleReset}
                                variant="outline"
                                className="h-9 px-3"
                                title="Restablecer filtros"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                </FilterBar>

                {/* 5. Segmentación con Tabs Reutilizable */}
                <div className="w-full">
                    <Tabs value={statusFilter} onValueChange={handleStatusTabChange} className="w-full">
                        <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto p-1 bg-slate-100 dark:bg-slate-900 border rounded-xl gap-1">
                            <TabsTrigger value="todos" className="text-xs font-semibold py-2">
                                Todos ({kpis.total_plantilla})
                            </TabsTrigger>
                            <TabsTrigger value="presentes" className="text-xs font-semibold py-2 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400">
                                Laborando ({kpis.presentes})
                            </TabsTrigger>
                            <TabsTrigger value="pausa" className="text-xs font-semibold py-2 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-400">
                                Pausa ({kpis.en_comida + kpis.en_descanso})
                            </TabsTrigger>
                            <TabsTrigger value="retardos" className="text-xs font-semibold py-2 data-[state=active]:text-rose-700 dark:data-[state=active]:text-rose-400">
                                Retardos ({kpis.retardos})
                            </TabsTrigger>
                            <TabsTrigger value="salidas" className="text-xs font-semibold py-2 data-[state=active]:text-slate-700 dark:data-[state=active]:text-slate-300">
                                Salidas ({kpis.salidas})
                            </TabsTrigger>
                            <TabsTrigger value="ausentes" className="text-xs font-semibold py-2 data-[state=active]:text-zinc-600 dark:data-[state=active]:text-zinc-400">
                                Sin Marcaje ({kpis.ausentes})
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* 6. Tabla de Datos Avanzada con DataTable Reutilizable */}
                <div className="w-full">
                    <DataTable<ColaboradorStatus>
                        data={colaboradores}
                        columns={columns}
                        onRowClick={handleOpenDetail}
                        filters={{
                            sucursal_id: sucursalId !== 'todas' ? sucursalId : undefined,
                            responsable_id: responsableId !== 'todos' ? responsableId : undefined,
                            fecha,
                            search,
                            status_asistencia: statusFilter !== 'todos' ? statusFilter : undefined,
                            perPage,
                        }}
                        emptyState={{
                            title: 'No se encontraron colaboradores',
                            description: 'No hay registros de colaboradores que coincidan con la sede, supervisor o estado seleccionado.',
                            icon: <Users className="w-10 h-10 text-muted-foreground/40" />,
                            ctaLabel: 'Restablecer Filtros',
                            onCtaClick: handleReset,
                        }}
                    />
                </div>
            </div>

            {/* 7. Modal de Inspección Operativa con Dialog Reutilizable */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    {selectedColaborador && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 border-2 border-indigo-200 dark:border-indigo-900 shrink-0">
                                        {selectedColaborador.foto_empleado ? (
                                            <AvatarImage src={`/storage/${selectedColaborador.foto_empleado}`} alt={selectedColaborador.nombre_completo} />
                                        ) : null}
                                        <AvatarFallback className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                                            {`${selectedColaborador.nombres.charAt(0)}${selectedColaborador.apellidos.charAt(0)}`.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <DialogTitle className="text-lg font-bold leading-tight">
                                            {selectedColaborador.nombres} {selectedColaborador.apellidos}
                                        </DialogTitle>
                                        <DialogDescription className="text-xs mt-0.5 flex flex-wrap items-center gap-2">
                                            <span className="font-mono font-medium">N° {selectedColaborador.documento_identidad}</span>
                                            <span>•</span>
                                            <span>{selectedColaborador.cargo}</span>
                                            <span>•</span>
                                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">{selectedColaborador.departamento}</span>
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-4 py-2 text-xs">
                                {/* Ficha de asignación operativa */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Sede Asignada</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedColaborador.sucursal}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Zona Horaria</span>
                                        <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{selectedColaborador.zona_horaria}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Supervisor</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedColaborador.responsable}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Turno Programado</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                            {selectedColaborador.turno} {selectedColaborador.turno_horario ? `(${selectedColaborador.turno_horario})` : ''}
                                        </span>
                                    </div>
                                </div>

                                {/* Resumen métrico de hoy */}
                                <div className="grid grid-cols-3 gap-2.5">
                                    <div className="p-2.5 rounded-lg border bg-card">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Primer Ingreso</span>
                                        <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                                            {selectedColaborador.primer_ingreso || 'Sin entrada'}
                                        </span>
                                    </div>
                                    <div className="p-2.5 rounded-lg border bg-card">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Marcajes Hoy</span>
                                        <span className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                                            {selectedColaborador.total_marcajes_hoy} eventos
                                        </span>
                                    </div>
                                    <div className="p-2.5 rounded-lg border bg-card">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Puntualidad</span>
                                        {selectedColaborador.es_retardo ? (
                                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5 block">
                                                Retardo +{selectedColaborador.minutos_retardo} min
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                                                Puntual / A tiempo
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Timeline de eventos del día */}
                                <div className="space-y-2">
                                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-indigo-600" />
                                        Cronología de Marcajes de Hoy ({fecha})
                                    </h4>

                                    {!selectedColaborador.eventos_hoy || selectedColaborador.eventos_hoy.length === 0 ? (
                                        <div className="p-6 text-center text-muted-foreground border rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                                            <Clock className="w-8 h-8 mx-auto mb-1.5 opacity-30" />
                                            <p className="font-medium">No se registran eventos de marcaje para este colaborador en la fecha seleccionada.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 border rounded-xl p-3 bg-card divide-y">
                                            {selectedColaborador.eventos_hoy.map((ev, index) => (
                                                <div key={ev.id || index} className="pt-2.5 first:pt-0 pb-2.5 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="mt-0.5 w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-200 dark:border-indigo-900">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-800 dark:text-slate-200">
                                                                {getEventoLabel(ev.tipo_marcaje)}
                                                            </div>
                                                            <div className="text-muted-foreground text-[11px] flex flex-wrap items-center gap-1.5 mt-0.5">
                                                                <span>Dispositivo / Origen: <strong className="text-slate-700 dark:text-slate-300">{ev.origen || 'Kiosko Web'}</strong></span>
                                                                {ev.observaciones && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="italic">"{ev.observaciones}"</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                                        <Badge variant="outline" className="font-mono font-bold text-xs px-2 py-0.5">
                                                            {ev.hora}
                                                        </Badge>
                                                        {ev.latitud && ev.longitud && (
                                                            <a
                                                                href={`https://www.google.com/maps?q=${ev.latitud},${ev.longitud}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 hover:underline"
                                                                title="Ver en Google Maps"
                                                            >
                                                                <MapPin className="w-3 h-3" />
                                                                <span>Mapa</span>
                                                            </a>
                                                        )}
                                                        {ev.fotografia_path && (
                                                            <a
                                                                href={`/storage/${ev.fotografia_path}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 hover:underline"
                                                                title="Ver fotografía de verificación"
                                                            >
                                                                <Camera className="w-3 h-3" />
                                                                <span>Foto</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter className="flex items-center justify-between sm:justify-between w-full border-t pt-3">
                                <Link
                                    href={`/admin/asistencia/bitacora?search=${encodeURIComponent(selectedColaborador.documento_identidad)}`}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    Ver Bitácora Histórica Completa
                                </Link>
                                <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                                    Cerrar
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
