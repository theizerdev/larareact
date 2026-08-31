import { Head, router } from '@inertiajs/react';
import {
    Activity,
    PlusCircle,
    Edit3,
    Trash2,
    LogIn,
    LogOut,
    Globe,
    User as UserIcon,
    Eye,
    Calendar,
    Search,
    Clock,
    FileText,
    RefreshCw,
    Download,
    Filter,
    Copy,
    Check,
    Server,
    Shield,
    X,
    Building2,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams, cn } from '@/lib/utils';
import type { Paginated } from '@/types/app';

interface ActivityUser {
    id: number;
    name: string;
    email: string;
}

interface EmpresaItem {
    id: number;
    razon_social: string;
    nombre_comercial?: string | null;
}

interface FieldChange {
    field_key: string;
    field_label: string;
    old_value: string;
    new_value: string;
}

interface ActivityLogItem {
    id: number;
    log_name: string;
    description: string;
    event: string;
    subject_type: string;
    subject_type_raw: string;
    subject_id?: number | null;
    causer?: ActivityUser | null;
    empresa_id?: number | null;
    empresa_nombre?: string | null;
    sucursal_id?: number | null;
    properties: Record<string, any>;
    field_changes: FieldChange[];
    ip_address: string;
    method: string;
    device_info: string;
    url?: string | null;
    table?: string | null;
    created_at: string;
    created_at_human: string;
}

interface Props {
    activities: Paginated<ActivityLogItem>;
    stats: {
        total: number;
        today: number;
        created: number;
        updated: number;
        deleted: number;
        today_pct: number;
        created_pct: number;
        updated_pct: number;
        deleted_pct: number;
    };
    users: ActivityUser[];
    empresas?: EmpresaItem[];
    isSuperAdmin?: boolean;
    modelsList: { raw: string; label: string }[];
    filters: {
        search?: string;
        event?: string;
        subject_type?: string;
        causer_id?: string;
        empresa_id?: string;
        date_from?: string;
        date_to?: string;
        perPage?: string;
    };
}

export default function ActivityMonitoringPage({
    activities,
    stats,
    users,
    empresas = [],
    isSuperAdmin = false,
    modelsList,
    filters,
}: Props) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Monitoreo'), href: '/admin/monitoring/server' },
        { title: __('Registros de Actividad del Sistema'), href: '/admin/monitoring/activities' },
    ];

    // States
    const [selectedActivity, setSelectedActivity] = useState<ActivityLogItem | null>(null);
    const [activeTab, setActiveTab] = useState<'changes' | 'json' | 'context'>('changes');
    const [copiedJson, setCopiedJson] = useState(false);

    // Confirmation dialog for Clear
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Filters state
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [eventFilter, setEventFilter] = useState(filters.event || '');
    const [modelFilter, setModelFilter] = useState(filters.subject_type || '');
    const [causerFilter, setCauserFilter] = useState(filters.causer_id || '');
    const [empresaFilter, setEmpresaFilter] = useState(filters.empresa_id || '');
    const [dateFromFilter, setDateFromFilter] = useState(filters.date_from || '');
    const [dateToFilter, setDateToFilter] = useState(filters.date_to || '');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '15');

    const handleApplyFilters = () => {
        router.get(
            window.location.pathname,
            cleanParams({
                search: searchTerm,
                event: eventFilter,
                subject_type: modelFilter,
                causer_id: causerFilter,
                empresa_id: empresaFilter,
                date_from: dateFromFilter,
                date_to: dateToFilter,
                perPage: perPageFilter,
            }),
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setEventFilter('');
        setModelFilter('');
        setCauserFilter('');
        setEmpresaFilter('');
        setDateFromFilter('');
        setDateToFilter('');
        setPerPageFilter('15');
        router.get(window.location.pathname, {}, { preserveState: true, preserveScroll: true });
    };

    const handleRefresh = () => {
        router.reload({ preserveScroll: true });
    };

    const handleExportCsv = () => {
        const queryParams = new URLSearchParams();
        if (empresaFilter) queryParams.set('empresa_id', empresaFilter);
        if (searchTerm) queryParams.set('search', searchTerm);
        if (eventFilter) queryParams.set('event', eventFilter);
        if (modelFilter) queryParams.set('subject_type', modelFilter);
        if (causerFilter) queryParams.set('causer_id', causerFilter);
        if (dateFromFilter) queryParams.set('date_from', dateFromFilter);
        if (dateToFilter) queryParams.set('date_to', dateToFilter);

        const qs = queryParams.toString();
        window.location.href = `/admin/monitoring/activities/export${qs ? '?' + qs : ''}`;
    };

    const handleClearAll = () => {
        router.delete('/admin/monitoring/activities/clear', {
            data: { empresa_id: empresaFilter || undefined },
            onSuccess: () => setShowClearConfirm(false),
        });
    };

    const handleCopyJson = () => {
        if (!selectedActivity) return;
        navigator.clipboard.writeText(JSON.stringify(selectedActivity.properties, null, 2));
        setCopiedJson(true);
        setTimeout(() => setCopiedJson(false), 2000);
    };

    const getEventPill = (event: string, logName: string) => {
        if (logName === 'autenticacion' || logName === 'auth') {
            if (event === 'logout') {
                return (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 gap-1 text-[11px] font-bold tracking-wide uppercase px-2.5 py-1">
                        <LogOut className="w-3 h-3" />
                        [➔ CIERRE DE SESIÓN
                    </Badge>
                );
            }
            return (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 gap-1 text-[11px] font-bold tracking-wide uppercase px-2.5 py-1">
                    <LogIn className="w-3 h-3" />
                    ➔] INICIO DE SESIÓN
                </Badge>
            );
        }

        switch (event) {
            case 'created':
                return (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 gap-1 text-[11px] font-bold tracking-wide uppercase px-2.5 py-1">
                        <PlusCircle className="w-3 h-3" />
                        + CREADO
                    </Badge>
                );
            case 'updated':
                return (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 gap-1 text-[11px] font-bold tracking-wide uppercase px-2.5 py-1">
                        <Edit3 className="w-3 h-3" />
                        EDITADO
                    </Badge>
                );
            case 'deleted':
                return (
                    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 gap-1 text-[11px] font-bold tracking-wide uppercase px-2.5 py-1">
                        <Trash2 className="w-3 h-3" />
                        ELIMINADO
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-300 text-[11px] font-bold uppercase px-2.5 py-1">
                        {event}
                    </Badge>
                );
        }
    };

    const columns: ColumnDef<ActivityLogItem>[] = [
        {
            header: 'FECHA Y HORA',
            cell: (act) => (
                <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{act.created_at}</p>
                    <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">{act.created_at_human}</p>
                </div>
            ),
        },
        {
            header: 'ACTOR / USUARIO',
            cell: (act) => (
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-bold text-xs text-indigo-700 dark:text-indigo-300 shrink-0">
                        {act.causer ? act.causer.name.substring(0, 2).toUpperCase() : 'SYS'}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {act.causer ? act.causer.name : 'Sistema'}
                        </p>
                        {act.causer && (
                            <p className="text-[11px] text-muted-foreground truncate">{act.causer.email}</p>
                        )}
                        {isSuperAdmin && act.empresa_nombre && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                                <Building2 className="w-2.5 h-2.5" />
                                {act.empresa_nombre}
                            </span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: 'ACCIÓN',
            cell: (act) => getEventPill(act.event, act.log_name),
        },
        {
            header: 'ENTIDAD / MODELO',
            cell: (act) => (
                <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">{act.subject_type}</span>
                    {act.subject_id ? (
                        <span className="text-[11px] font-mono text-muted-foreground">ID: #{act.subject_id}</span>
                    ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                    )}
                </div>
            ),
        },
        {
            header: 'DETALLE DE DESCRIPCIÓN',
            cell: (act) => (
                <div className="max-w-sm">
                    <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate" title={act.description}>
                        {act.description}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {act.causer ? act.causer.name : 'Sistema'}
                    </p>
                </div>
            ),
        },
        {
            header: 'IP Y DISPOSITIVO',
            hideOn: 'mobile',
            cell: (act) => (
                <div>
                    <p className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">{act.ip_address}</p>
                    <p className="text-[11px] text-muted-foreground">{act.device_info}</p>
                </div>
            ),
        },
        {
            header: 'INSPECCIONAR',
            className: 'text-right',
            stopRowClick: true,
            cell: (act) => (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 rounded-full"
                    onClick={() => {
                        setSelectedActivity(act);
                        setActiveTab(act.field_changes.length > 0 ? 'changes' : 'json');
                    }}
                >
                    <Eye className="w-4 h-4" />
                </Button>
            ),
        },
    ];

    return (
        <>
            <Head title="Monitoreo de Actividad del Sistema" />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header Header Bar */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <Activity className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                                Monitoreo de Actividad del Sistema
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Auditoría de acciones del sistema, cambios en modelos, operaciones de usuarios y registros históricos de actividad.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            className="h-9 gap-1.5 text-xs font-semibold"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Refresh
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportCsv}
                            className="h-9 gap-1.5 text-xs font-semibold"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Exportar CSV
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowClearConfirm(true)}
                            className="h-9 gap-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Vaciar Actividad
                        </Button>
                    </div>
                </div>

                {/* 5 Stat Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {/* Card 1: Total */}
                    <div className="rounded-xl border border-indigo-200 bg-white p-4 shadow-sm dark:border-indigo-950 dark:bg-slate-900 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                TOTAL REGISTROS <Check className="w-3 h-3 text-indigo-500" />
                            </span>
                            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                                <Activity className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{stats.total}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Acciones registradas</span>
                            <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded dark:bg-indigo-950 dark:text-indigo-400">100%</span>
                        </div>
                        <div className="mt-3 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full w-full"></div>
                        </div>
                    </div>

                    {/* Card 2: Hoy */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">HOY</span>
                            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                                <Calendar className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{stats.today}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Acciones en las últimas 24h</span>
                            <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded dark:bg-blue-950 dark:text-blue-400">{stats.today_pct}%</span>
                        </div>
                        <div className="mt-3 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(stats.today_pct, 100)}%` }}></div>
                        </div>
                    </div>

                    {/* Card 3: Creado */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">CREADO</span>
                            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                <PlusCircle className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.created}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Nuevos registros</span>
                            <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded dark:bg-emerald-950 dark:text-emerald-400">{stats.created_pct}%</span>
                        </div>
                        <div className="mt-3 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(stats.created_pct, 100)}%` }}></div>
                        </div>
                    </div>

                    {/* Card 4: Actualizado */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ACTUALIZADO</span>
                            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                                <Edit3 className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{stats.updated}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Registros modificados</span>
                            <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded dark:bg-indigo-950 dark:text-indigo-400">{stats.updated_pct}%</span>
                        </div>
                        <div className="mt-3 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.min(stats.updated_pct, 100)}%` }}></div>
                        </div>
                    </div>

                    {/* Card 5: Eliminado */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ELIMINADO</span>
                            <div className="rounded-lg bg-rose-50 p-2 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                                <Trash2 className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{stats.deleted}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Registros eliminados</span>
                            <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded dark:bg-rose-950 dark:text-rose-400">{stats.deleted_pct}%</span>
                        </div>
                        <div className="mt-3 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(stats.deleted_pct, 100)}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Filter Box */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                    <div className={`grid grid-cols-1 gap-4 ${isSuperAdmin && empresas.length > 0 ? 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5' : 'md:grid-cols-4'}`}>
                        {/* Search Term */}
                        <div>
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                                Término de Búsqueda
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar descripción, usuario, IP..."
                                    className="pl-9 h-9 text-xs"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Company Filter (Super Admin) */}
                        {isSuperAdmin && empresas.length > 0 && (
                            <div>
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                                    Empresa
                                </label>
                                <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="Todas las Empresas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Todas las Empresas</SelectItem>
                                        {empresas.map((emp) => (
                                            <SelectItem key={emp.id} value={String(emp.id)}>
                                                {emp.nombre_comercial ? `${emp.nombre_comercial} (${emp.razon_social})` : emp.razon_social}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Event Filter */}
                        <div>
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                                Tipo de Evento
                            </label>
                            <Select value={eventFilter} onValueChange={setEventFilter}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Todos los Eventos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Todos los Eventos</SelectItem>
                                    <SelectItem value="created">Creados (+ CREADO)</SelectItem>
                                    <SelectItem value="updated">Actualizados (EDITADO)</SelectItem>
                                    <SelectItem value="deleted">Eliminados (ELIMINADO)</SelectItem>
                                    <SelectItem value="autenticacion">Accesos / Sesiones (AUTH)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Entity / Model Filter */}
                        <div>
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                                Entidad / Modelo
                            </label>
                            <Select value={modelFilter} onValueChange={setModelFilter}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Todos los Modelos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Todos los Modelos</SelectItem>
                                    {modelsList.map((m) => (
                                        <SelectItem key={m.raw} value={m.raw}>
                                            {m.label} ({m.raw})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* User / Actor Filter */}
                        <div>
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                                Usuario / Actor
                            </label>
                            <Select value={causerFilter} onValueChange={setCauserFilter}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Todos los Usuarios" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Todos los Usuarios</SelectItem>
                                    {users.map((u) => (
                                        <SelectItem key={u.id} value={String(u.id)}>
                                            {u.name} ({u.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-2 md:flex-row md:items-end md:justify-between border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-3">
                            <div>
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                                    Desde Fecha
                                </label>
                                <Input
                                    type="date"
                                    value={dateFromFilter}
                                    onChange={(e) => setDateFromFilter(e.target.value)}
                                    className="h-9 text-xs w-36"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                                    Hasta Fecha
                                </label>
                                <Input
                                    type="date"
                                    value={dateToFilter}
                                    onChange={(e) => setDateToFilter(e.target.value)}
                                    className="h-9 text-xs w-36"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                                    Por Página
                                </label>
                                <Select value={perPageFilter} onValueChange={setPerPageFilter}>
                                    <SelectTrigger className="h-9 text-xs w-24">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="15">15</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleApplyFilters}
                                className="h-9 gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-5"
                            >
                                <Filter className="h-3.5 w-3.5" />
                                Filtrar Resultados
                            </Button>
                            <button
                                onClick={handleResetFilters}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Data */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={activities.data}
                        pagination={activities}
                        onRowClick={(act) => {
                            setSelectedActivity(act);
                            setActiveTab(act.field_changes.length > 0 ? 'changes' : 'json');
                        }}
                    />
                </div>
            </div>

            {/* Inspect Activity Modal */}
            <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
                <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                    {selectedActivity && (
                        <>
                            {/* Modal Header */}
                            <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                            #{selectedActivity.id}
                                        </span>
                                        {getEventPill(selectedActivity.event, selectedActivity.log_name)}
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {selectedActivity.created_at} ({selectedActivity.created_at_human})
                                    </span>
                                </div>

                                <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-2">
                                    {selectedActivity.description}
                                </DialogTitle>
                            </DialogHeader>

                            {/* Modal Navigation Tabs */}
                            <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                <button
                                    onClick={() => setActiveTab('changes')}
                                    className={cn(
                                        'pb-3 text-xs font-bold tracking-wider uppercase transition-colors border-b-2 flex items-center gap-1.5',
                                        activeTab === 'changes'
                                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                            : 'border-transparent text-muted-foreground hover:text-slate-800 dark:hover:text-slate-200'
                                    )}
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    Cambios Realizados ({selectedActivity.field_changes.length})
                                </button>

                                <button
                                    onClick={() => setActiveTab('json')}
                                    className={cn(
                                        'pb-3 text-xs font-bold tracking-wider uppercase transition-colors border-b-2 flex items-center gap-1.5',
                                        activeTab === 'json'
                                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                            : 'border-transparent text-muted-foreground hover:text-slate-800 dark:hover:text-slate-200'
                                    )}
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    Payload JSON
                                </button>

                                <button
                                    onClick={() => setActiveTab('context')}
                                    className={cn(
                                        'pb-3 text-xs font-bold tracking-wider uppercase transition-colors border-b-2 flex items-center gap-1.5',
                                        activeTab === 'context'
                                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                            : 'border-transparent text-muted-foreground hover:text-slate-800 dark:hover:text-slate-200'
                                    )}
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                    Contexto y Origen
                                </button>
                            </div>

                            {/* Modal Content Body */}
                            <div className="p-6 overflow-y-auto max-h-[50vh] space-y-4 bg-slate-50/30 dark:bg-slate-950/20">
                                {/* TAB 1: CHANGES DIFF */}
                                {activeTab === 'changes' && (
                                    <div>
                                        {selectedActivity.field_changes.length === 0 ? (
                                            <div className="text-center py-10 text-muted-foreground space-y-2">
                                                <Shield className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                                                <p className="text-xs font-semibold">No se detectaron diferencias de atributos específicos para este evento.</p>
                                                <p className="text-[11px]">Este registro contiene metadatos globales de ejecución.</p>
                                            </div>
                                        ) : (
                                            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                                        <tr>
                                                            <th className="py-2.5 px-3">CAMPO</th>
                                                            <th className="py-2.5 px-3 text-rose-600 dark:text-rose-400">VALOR ANTERIOR</th>
                                                            <th className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">VALOR NUEVO</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                                                        {selectedActivity.field_changes.map((change, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                                                <td className="py-2.5 px-3 font-sans font-bold text-slate-800 dark:text-slate-200">
                                                                    {change.field_label}
                                                                    <span className="block text-[10px] text-muted-foreground font-mono font-normal">
                                                                        {change.field_key}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2.5 px-3 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 break-all">
                                                                    {change.old_value}
                                                                </td>
                                                                <td className="py-2.5 px-3 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold break-all">
                                                                    {change.new_value}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB 2: JSON RAW */}
                                {activeTab === 'json' && (
                                    <div className="relative">
                                        <div className="absolute right-3 top-3 z-10">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCopyJson}
                                                className="h-7 text-[11px] gap-1 bg-slate-900 text-white border-slate-700 hover:bg-slate-800 hover:text-white"
                                            >
                                                {copiedJson ? (
                                                    <>
                                                        <Check className="w-3 h-3 text-emerald-400" />
                                                        Copiado!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3 h-3" />
                                                        Copiar JSON
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-[40vh] border border-slate-800 leading-relaxed">
                                            {JSON.stringify(selectedActivity.properties, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {/* TAB 3: CONTEXT */}
                                {activeTab === 'context' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {/* Actor Card */}
                                        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <UserIcon className="w-4 h-4 text-indigo-500" />
                                                ACTOR / USUARIO
                                            </div>

                                            <div className="flex items-center gap-3 pt-1">
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-extrabold flex items-center justify-center text-xs shrink-0">
                                                    {selectedActivity.causer ? selectedActivity.causer.name.substring(0, 2).toUpperCase() : 'SYS'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                                        {selectedActivity.causer ? selectedActivity.causer.name : 'Sistema'}
                                                    </h4>
                                                    {selectedActivity.causer && (
                                                        <p className="text-xs text-muted-foreground">{selectedActivity.causer.email}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {selectedActivity.causer && (
                                                <div className="pt-2">
                                                    <Badge variant="outline" className="text-[11px] font-mono bg-slate-50">
                                                        User ID: #{selectedActivity.causer.id}
                                                    </Badge>
                                                </div>
                                            )}

                                            {selectedActivity.empresa_nombre && (
                                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{__('Empresa')}</span>
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                                                        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                                                        {selectedActivity.empresa_nombre} (ID #{selectedActivity.empresa_id})
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Entity Card */}
                                        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <Server className="w-4 h-4 text-indigo-500" />
                                                ENTIDAD OBJETIVO
                                            </div>

                                            <div className="space-y-2 pt-1 text-xs">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">Clase Entidad:</span>
                                                    <Badge variant="outline" className="font-mono text-[11px]">
                                                        {selectedActivity.subject_type}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">ID Registro:</span>
                                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                                        #{selectedActivity.subject_id || '-'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">Tabla BD:</span>
                                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                                        {selectedActivity.table || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Environment Card */}
                                        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <Globe className="w-4 h-4 text-indigo-500" />
                                                ENTORNO DE LA PETICIÓN
                                            </div>

                                            <div className="space-y-2 pt-1 text-xs">
                                                <div>
                                                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">DIRECCIÓN IP</span>
                                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                                        {selectedActivity.ip_address}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">MÉTODO HTTP Y URL</span>
                                                    <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate" title={selectedActivity.url || ''}>
                                                        [{selectedActivity.method}] {selectedActivity.url || '-'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">USER AGENT</span>
                                                    <p className="font-mono text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2" title={selectedActivity.device_info}>
                                                        {selectedActivity.device_info}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
                                <Button variant="outline" size="sm" onClick={() => setSelectedActivity(null)}>
                                    Cerrar
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Clear Confirm Dialog */}
            <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600">
                            <Shield className="w-5 h-5" />
                            ¿Vaciar todo el historial de actividad?
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground mt-2">
                        Esta acción eliminará de forma permanente todos los registros de auditoría y actividad almacenados en el sistema. Esta acción no se puede deshacer.
                    </p>
                    <DialogFooter className="mt-6 flex justify-end gap-3">
                        <Button variant="outline" size="sm" onClick={() => setShowClearConfirm(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleClearAll} className="bg-rose-600 hover:bg-rose-700">
                            Sí, Vaciar Historial
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
