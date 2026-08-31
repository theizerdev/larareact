import { Head, router } from '@inertiajs/react';
import {
    Activity as ActivityIcon,
    Search,
    Filter,
    Clock,
    User,
    RefreshCw,
    Download,
    Trash2,
    Eye,
    Layers,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Info,
    Copy,
    Check,
    ExternalLink,
    FileSpreadsheet,
    Code2,
    Laptop,
    Smartphone,
    Globe,
    Database,
    Sparkles,
    Shield,
    ShoppingCart,
    DollarSign,
    Package,
    Wrench,
    FileText,
    KeyRound,
    UserCheck,
    MapPin,
    Flame,
    History,
    FileDown,
    SlidersHorizontal,
    X,
    Maximize2,
    Columns
} from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInitials } from '@/hooks/use-initials';
import { useTranslate } from '@/hooks/use-translate';

interface DiffItem {
    field: string;
    old: any;
    new: any;
}

interface ActivityItem {
    id: number;
    log_name: string;
    description: string;
    event: string;
    subject_type: string | null;
    subject_name: string | null;
    subject_id: number | null;
    causer: {
        id: number;
        name: string;
        email: string;
        profile_photo_url?: string | null;
    } | null;
    empresa_id: number | null;
    sucursal_id: number | null;
    ip_address: string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
    url: string | null;
    method: string | null;
    browser: string;
    os: string;
    device: string;
    properties: Record<string, any>;
    diff: DiffItem[];
    batch_uuid: string | null;
    created_at: string | null;
    created_at_human: string | null;
}

interface StatsData {
    total: number;
    today: number;
    yesterday: number;
    created_count: number;
    updated_count: number;
    deleted_count: number;
    auth_count: number;
    top_modules: Array<{ name: string; count: number }>;
}

interface FilterOptions {
    log_names: string[];
    users: Array<{ id: number; name: string; email: string }>;
    empresas: Array<{ id: number; razon_social: string; nombre_comercial: string | null }>;
    events: Array<{ value: string; label: string }>;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedActivities {
    data: ActivityItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLinks[];
}

interface PageProps {
    activities: PaginatedActivities;
    stats: StatsData;
    filters: {
        search: string | null;
        log_name: string;
        event: string;
        causer_id: string;
        empresa_id: string;
        date_range: string;
        start_date: string | null;
        end_date: string | null;
        per_page: number;
    };
    filterOptions: FilterOptions;
    isSuperAdmin: boolean;
}

export default function ActivityMonitoring({
    activities,
    stats,
    filters,
    filterOptions,
    isSuperAdmin,
}: PageProps) {
    const { __ } = useTranslate();
    const getInitials = useInitials();

    // Estado local de filtros
    const [search, setSearch] = useState(filters.search || '');
    const [logName, setLogName] = useState(filters.log_name || 'all');
    const [event, setEvent] = useState(filters.event || 'all');
    const [causerId, setCauserId] = useState(filters.causer_id || 'all');
    const [empresaId, setEmpresaId] = useState(filters.empresa_id || 'all');
    const [dateRange, setDateRange] = useState(filters.date_range || '30_days');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [perPage, setPerPage] = useState(String(filters.per_page || 25));

    // Estados de UI
    const [activeTab, setActiveTab] = useState('table');
    const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
    const [inspectorOpen, setInspectorOpen] = useState(false);
    const [copiedJson, setCopiedJson] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Auto-refresh timer
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            handleRefresh(true);
        }, 15000);
        return () => clearInterval(interval);
    }, [autoRefresh]);

    const handleApplyFilters = () => {
        router.get(
            '/admin/monitoring/activities',
            {
                search: search || undefined,
                log_name: logName !== 'all' ? logName : undefined,
                event: event !== 'all' ? event : undefined,
                causer_id: causerId !== 'all' ? causerId : undefined,
                empresa_id: empresaId !== 'all' ? empresaId : undefined,
                date_range: dateRange,
                start_date: dateRange === 'custom' && startDate ? startDate : undefined,
                end_date: dateRange === 'custom' && endDate ? endDate : undefined,
                per_page: perPage,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setLogName('all');
        setEvent('all');
        setCauserId('all');
        setEmpresaId('all');
        setDateRange('30_days');
        setStartDate('');
        setEndDate('');
        setPerPage('25');
        router.get('/admin/monitoring/activities', {}, { preserveState: true, preserveScroll: true });
    };

    const handleRefresh = (silent = false) => {
        if (!silent) setIsRefreshing(true);
        router.reload({
            onFinish: () => {
                if (!silent) setIsRefreshing(false);
            },
        });
    };

    const handleOpenInspector = (activity: ActivityItem) => {
        setSelectedActivity(activity);
        setInspectorOpen(true);
    };

    const handleCopyJson = () => {
        if (!selectedActivity) return;
        navigator.clipboard.writeText(JSON.stringify(selectedActivity.properties, null, 2));
        setCopiedJson(true);
        setTimeout(() => setCopiedJson(false), 2000);
    };

    const handleDeleteActivity = (id: number) => {
        Swal.fire({
            title: __('¿Eliminar registro de actividad?'),
            text: __('Esta acción eliminará de forma permanente este registro de auditoría.'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: __('Sí, eliminar'),
            cancelButtonText: __('Cancelar'),
            confirmButtonColor: '#ef4444',
        }).then((res) => {
            if (res.isConfirmed) {
                router.delete(`/admin/monitoring/activities/${id}`, {
                    preserveScroll: true,
                    onSuccess: () => {
                        if (selectedActivity?.id === id) {
                            setInspectorOpen(false);
                        }
                    },
                });
            }
        });
    };

    const handleClearOldLogs = () => {
        Swal.fire({
            title: __('¿Purgar registros antiguos?'),
            text: __('Selecciona el rango de antigüedad a depurar para optimizar la base de datos.'),
            icon: 'warning',
            input: 'select',
            inputOptions: {
                '90': __('Anteriores a 90 días'),
                '60': __('Anteriores a 60 días'),
                '30': __('Anteriores a 30 días'),
            },
            inputValue: '90',
            showCancelButton: true,
            confirmButtonText: __('Purgar Registros'),
            cancelButtonText: __('Cancelar'),
            confirmButtonColor: '#ef4444',
        }).then((res) => {
            if (res.isConfirmed && res.value) {
                router.delete('/admin/monitoring/activities/clear', {
                    data: { days: res.value },
                    preserveScroll: true,
                });
            }
        });
    };

    // Helper de colores e iconos para el Módulo
    const getModuleBadge = (logName: string) => {
        switch (logName?.toLowerCase()) {
            case 'ventas':
                return {
                    label: 'Ventas',
                    icon: ShoppingCart,
                    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                };
            case 'caja':
                return {
                    label: 'Caja POS',
                    icon: DollarSign,
                    color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
                };
            case 'inventario':
                return {
                    label: 'Inventario',
                    icon: Package,
                    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
                };
            case 'reparaciones':
                return {
                    label: 'Reparaciones',
                    icon: Wrench,
                    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                };
            case 'contabilidad':
                return {
                    label: 'Contabilidad',
                    icon: FileText,
                    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
                };
            case 'seguridad':
            case 'auth':
                return {
                    label: 'Seguridad / Auth',
                    icon: Shield,
                    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                };
            case 'clientes':
                return {
                    label: 'Clientes',
                    icon: UserCheck,
                    color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
                };
            case 'compras':
                return {
                    label: 'Compras',
                    icon: Layers,
                    color: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20',
                };
            default:
                return {
                    label: logName ? logName.toUpperCase() : 'GENERAL',
                    icon: ActivityIcon,
                    color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
                };
        }
    };

    // Helper de colores e iconos para el Evento
    const getEventBadge = (event: string) => {
        switch (event?.toLowerCase()) {
            case 'created':
                return {
                    label: 'Creación',
                    color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold',
                };
            case 'updated':
                return {
                    label: 'Modificación',
                    color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold',
                };
            case 'deleted':
                return {
                    label: 'Eliminación',
                    color: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold',
                };
            case 'login':
                return {
                    label: 'Inicio de Sesión',
                    color: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 font-bold',
                };
            default:
                return {
                    label: event ? event.toUpperCase() : 'ACCIÓN',
                    color: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 font-bold',
                };
        }
    };

    // Agrupación por fechas para la vista de Línea de Tiempo (Timeline)
    const timelineGroups = useMemo(() => {
        const groups: Record<string, ActivityItem[]> = {};
        activities.data.forEach((act) => {
            const dateKey = act.created_at ? act.created_at.split(' ')[0] : 'Desconocida';
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(act);
        });
        return groups;
    }, [activities.data]);

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 md:p-8 space-y-6">
            <Head title={__('Registro de Actividades - Monitoreo Avanzado')} />

            {/* Breadcrumbs y Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <Breadcrumbs
                        breadcrumbs={[
                            { title: __('Dashboard'), href: '/dashboard' },
                            { title: __('Monitoreo'), href: '/admin/monitoring/server' },
                            { title: __('Registro de Actividades'), href: '#' },
                        ]}
                    />
                    <div className="flex items-center gap-3 mt-1.5">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 shadow-sm">
                            <ActivityIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                                {__('Centro de Auditoría & Actividades')}
                            </h1>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                                {__('Monitoreo en tiempo real de operaciones, transacciones, cambios y auditoría forense del sistema.')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Acciones Globales */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-semibold">
                        <Switch
                            checked={autoRefresh}
                            onCheckedChange={setAutoRefresh}
                            id="auto-refresh-toggle"
                        />
                        <label htmlFor="auto-refresh-toggle" className="cursor-pointer select-none text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <span className={`inline-block h-2 w-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                            {__('En Vivo (15s)')}
                        </label>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefresh(false)}
                        disabled={isRefreshing}
                        className="bg-white dark:bg-slate-900"
                    >
                        <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
                        {__('Refrescar')}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="bg-white dark:bg-slate-900">
                                <Download className="h-4 w-4 mr-1.5 text-emerald-500" />
                                {__('Exportar')}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs">{__('Formatos de Descarga')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <a
                                    href={`/admin/monitoring/activities/export?format=csv&log_name=${logName}&event=${event}&date_range=${dateRange}&search=${search}`}
                                    className="cursor-pointer flex items-center"
                                >
                                    <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
                                    {__('Descargar como CSV')}
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a
                                    href={`/admin/monitoring/activities/export?format=json&log_name=${logName}&event=${event}&date_range=${dateRange}&search=${search}`}
                                    className="cursor-pointer flex items-center"
                                >
                                    <Code2 className="h-4 w-4 mr-2 text-indigo-600" />
                                    {__('Descargar como JSON')}
                                </a>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {isSuperAdmin && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleClearOldLogs}
                            className="shadow-sm"
                        >
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            {__('Purgar Logs')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Tarjetas de Métricas & KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. Total Actividades */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-500/50 transition-all">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{__('Total Histórico')}</p>
                            <ActivityIcon className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="mt-2">
                            <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                                {stats.total.toLocaleString()}
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">{__('Eventos registrados')}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Actividades Hoy */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{__('Actividades Hoy')}</p>
                            <Clock className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="mt-2">
                            <h3 className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                                {stats.today.toLocaleString()}
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                <span>{stats.yesterday} ayer</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Creaciones */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-teal-500/50 transition-all">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{__('Creaciones')}</p>
                            <CheckCircle2 className="h-4 w-4 text-teal-500" />
                        </div>
                        <div className="mt-2">
                            <h3 className="text-2xl font-black tracking-tight text-teal-600 dark:text-teal-400 font-mono">
                                {stats.created_count.toLocaleString()}
                            </h3>
                            <p className="text-[11px] text-teal-600/80 mt-0.5">created</p>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Modificaciones */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition-all">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{__('Modificaciones')}</p>
                            <ArrowUpDown className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="mt-2">
                            <h3 className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400 font-mono">
                                {stats.updated_count.toLocaleString()}
                            </h3>
                            <p className="text-[11px] text-amber-600/80 mt-0.5">updated</p>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Eliminaciones */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500/50 transition-all">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{__('Eliminaciones')}</p>
                            <Trash2 className="h-4 w-4 text-rose-500" />
                        </div>
                        <div className="mt-2">
                            <h3 className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400 font-mono">
                                {stats.deleted_count.toLocaleString()}
                            </h3>
                            <p className="text-[11px] text-rose-600/80 mt-0.5">deleted</p>
                        </div>
                    </CardContent>
                </Card>

                {/* 6. Inicios de Sesión */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500/50 transition-all">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{__('Autenticaciones')}</p>
                            <KeyRound className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="mt-2">
                            <h3 className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400 font-mono">
                                {stats.auth_count.toLocaleString()}
                            </h3>
                            <p className="text-[11px] text-blue-600/80 mt-0.5">auth / login</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Barra de Filtros Avanzados */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {/* Buscador de Texto */}
                        <div className="lg:col-span-2 relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                type="text"
                                placeholder={__('Buscar por descripción, usuario, IP, entidad...')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                                className="pl-9 h-9 text-xs"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Selector de Módulo (Log Name) */}
                        <div>
                            <Select value={logName} onValueChange={setLogName}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder={__('Módulo')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('Todos los Módulos')}</SelectItem>
                                    {filterOptions.log_names.map((name) => (
                                        <SelectItem key={name} value={name}>
                                            {name.toUpperCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Selector de Tipo de Evento */}
                        <div>
                            <Select value={event} onValueChange={setEvent}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder={__('Evento')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {filterOptions.events.map((ev) => (
                                        <SelectItem key={ev.value} value={ev.value}>
                                            {ev.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Selector de Rango de Fecha */}
                        <div>
                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder={__('Período')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">{__('Hoy')}</SelectItem>
                                    <SelectItem value="yesterday">{__('Ayer')}</SelectItem>
                                    <SelectItem value="7_days">{__('Últimos 7 días')}</SelectItem>
                                    <SelectItem value="30_days">{__('Últimos 30 días')}</SelectItem>
                                    <SelectItem value="this_month">{__('Este mes')}</SelectItem>
                                    <SelectItem value="all">{__('Todo el histórico')}</SelectItem>
                                    <SelectItem value="custom">{__('Rango personalizado')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Selector de Usuario */}
                        <div>
                            <Select value={causerId} onValueChange={setCauserId}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder={__('Usuario')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('Todos los Usuarios')}</SelectItem>
                                    {filterOptions.users.map((u) => (
                                        <SelectItem key={u.id} value={String(u.id)}>
                                            {u.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Fila secundaria si hay rango personalizado o Super Admin */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                        <div className="flex flex-wrap items-center gap-2">
                            {dateRange === 'custom' && (
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="h-8 text-xs w-36"
                                    />
                                    <span className="text-xs text-slate-400">-</span>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="h-8 text-xs w-36"
                                    />
                                </div>
                            )}

                            {isSuperAdmin && filterOptions.empresas.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-slate-500 font-medium">{__('Empresa:')}</span>
                                    <Select value={empresaId} onValueChange={setEmpresaId}>
                                        <SelectTrigger className="h-8 text-xs w-48">
                                            <SelectValue placeholder={__('Empresa')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{__('Todas las Empresas')}</SelectItem>
                                            {filterOptions.empresas.map((emp) => (
                                                <SelectItem key={emp.id} value={String(emp.id)}>
                                                    {emp.nombre_comercial || emp.razon_social}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500">{__('Por pág:')}</span>
                                <Select value={perPage} onValueChange={setPerPage}>
                                    <SelectTrigger className="h-8 text-xs w-20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="default"
                                onClick={handleApplyFilters}
                                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                            >
                                <Filter className="h-3.5 w-3.5 mr-1.5" />
                                {__('Filtrar')}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleResetFilters}
                                className="h-8 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            >
                                {__('Limpiar')}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Vistas: Tabla / Línea de Tiempo / Análisis */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <TabsList className="bg-slate-200/60 dark:bg-slate-900 p-1 rounded-xl">
                        <TabsTrigger value="table" className="text-xs font-semibold gap-1.5">
                            <Columns className="h-3.5 w-3.5" />
                            {__('Vista Tabla')}
                        </TabsTrigger>
                        <TabsTrigger value="timeline" className="text-xs font-semibold gap-1.5">
                            <History className="h-3.5 w-3.5" />
                            {__('Línea de Tiempo')}
                        </TabsTrigger>
                        <TabsTrigger value="modules" className="text-xs font-semibold gap-1.5">
                            <Layers className="h-3.5 w-3.5" />
                            {__('Distribución por Módulos')}
                        </TabsTrigger>
                    </TabsList>

                    <div className="text-xs text-slate-500 font-medium">
                        {__('Mostrando')} <span className="font-bold text-slate-700 dark:text-slate-300">{activities.from || 0}</span> - <span className="font-bold text-slate-700 dark:text-slate-300">{activities.to || 0}</span> {__('de')} <span className="font-bold text-slate-700 dark:text-slate-300">{activities.total.toLocaleString()}</span> {__('registros')}
                    </div>
                </div>

                {/* 1. Vista Tabla */}
                <TabsContent value="table" className="m-0">
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/80 dark:bg-slate-950/60">
                                    <TableRow className="border-b border-slate-200/80 dark:border-slate-800">
                                        <TableHead className="w-16 font-bold text-xs"># ID</TableHead>
                                        <TableHead className="w-36 font-bold text-xs">{__('Fecha / Hora')}</TableHead>
                                        <TableHead className="w-48 font-bold text-xs">{__('Usuario')}</TableHead>
                                        <TableHead className="w-32 font-bold text-xs">{__('Módulo')}</TableHead>
                                        <TableHead className="w-32 font-bold text-xs">{__('Evento')}</TableHead>
                                        <TableHead className="font-bold text-xs">{__('Descripción / Acción')}</TableHead>
                                        <TableHead className="w-40 font-bold text-xs">{__('Entidad Afectada')}</TableHead>
                                        <TableHead className="w-36 font-bold text-xs">{__('Origen (IP / Disp.)')}</TableHead>
                                        <TableHead className="w-24 text-right font-bold text-xs">{__('Detalle')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activities.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                                                <ActivityIcon className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                                                <p className="font-semibold text-slate-700 dark:text-slate-300">{__('No se encontraron registros de actividad.')}</p>
                                                <p className="text-xs text-slate-400 mt-1">{__('Intenta modificando los filtros de búsqueda o fecha.')}</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        activities.data.map((act) => {
                                            const mod = getModuleBadge(act.log_name);
                                            const ev = getEventBadge(act.event);
                                            const ModIcon = mod.icon;

                                            return (
                                                <TableRow
                                                    key={act.id}
                                                    onClick={() => handleOpenInspector(act)}
                                                    className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/60 text-xs"
                                                >
                                                    {/* ID */}
                                                    <TableCell className="font-mono text-slate-400 font-medium">
                                                        #{act.id}
                                                    </TableCell>

                                                    {/* Fecha y Hora */}
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                                                {act.created_at ? act.created_at.split(' ')[0] : ''}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400 font-mono">
                                                                {act.created_at ? act.created_at.split(' ')[1] : ''} ({act.created_at_human})
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    {/* Usuario */}
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-7 w-7 border border-slate-200 dark:border-slate-700">
                                                                {act.causer?.profile_photo_url && (
                                                                    <AvatarImage src={act.causer.profile_photo_url} alt={act.causer.name} />
                                                                )}
                                                                <AvatarFallback className="text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                                    {getInitials(act.causer?.name || 'Sis')}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col truncate max-w-[140px]">
                                                                <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                                    {act.causer ? act.causer.name : __('Sistema')}
                                                                </span>
                                                                {act.causer && (
                                                                    <span className="text-[10px] text-slate-400 truncate">
                                                                        {act.causer.email}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Módulo */}
                                                    <TableCell>
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${mod.color}`}>
                                                            <ModIcon className="h-3 w-3" />
                                                            {mod.label}
                                                        </span>
                                                    </TableCell>

                                                    {/* Evento */}
                                                    <TableCell>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] ${ev.color}`}>
                                                            {ev.label}
                                                        </span>
                                                    </TableCell>

                                                    {/* Descripción */}
                                                    <TableCell>
                                                        <div className="flex flex-col max-w-md">
                                                            <span className="text-slate-800 dark:text-slate-200 font-medium line-clamp-2">
                                                                {act.description}
                                                            </span>
                                                            {act.diff.length > 0 && (
                                                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                                                                    ✨ {act.diff.length} {__('campos modificados')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    {/* Entidad Afectada */}
                                                    <TableCell>
                                                        {act.subject_name ? (
                                                            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                                                                <Badge variant="outline" className="text-[10px] py-0 bg-slate-100 dark:bg-slate-800">
                                                                    {act.subject_name} #{act.subject_id}
                                                                </Badge>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Origen (IP / Disp) */}
                                                    <TableCell>
                                                        <div className="flex flex-col text-[11px]">
                                                            <span className="font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                                                <Globe className="h-3 w-3 text-slate-400" />
                                                                {act.ip_address || '127.0.0.1'}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                                                {act.os} • {act.browser}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    {/* Acciones */}
                                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleOpenInspector(act)}
                                                                className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600"
                                                                title={__('Inspeccionar detalles')}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            {isSuperAdmin && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleDeleteActivity(act.id)}
                                                                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                                                                    title={__('Eliminar registro')}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Paginador */}
                        {activities.links.length > 3 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="text-xs text-slate-500">
                                    {__('Página')} {activities.current_page} {__('de')} {activities.last_page}
                                </div>
                                <div className="flex items-center gap-1">
                                    {activities.links.map((link, idx) => {
                                        if (!link.url && link.label === '&laquo; Previous') {
                                            return null;
                                        }
                                        if (!link.url && link.label === 'Next &raquo;') {
                                            return null;
                                        }

                                        let label = link.label;
                                        if (label.includes('Previous')) label = __('Anterior');
                                        if (label.includes('Next')) label = __('Siguiente');

                                        return (
                                            <Button
                                                key={idx}
                                                size="sm"
                                                variant={link.active ? 'default' : 'outline'}
                                                className={`h-8 text-xs ${link.active ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900'}`}
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                                dangerouslySetInnerHTML={{ __html: label }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                {/* 2. Vista Línea de Tiempo (Timeline) */}
                <TabsContent value="timeline" className="m-0">
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="space-y-8">
                            {Object.keys(timelineGroups).length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    {__('No hay actividades para mostrar en la línea de tiempo.')}
                                </div>
                            ) : (
                                Object.entries(timelineGroups).map(([date, acts]) => (
                                    <div key={date} className="relative">
                                        <div className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 shadow-sm text-slate-700 dark:text-slate-300 font-mono mb-4">
                                            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                                            {date}
                                        </div>

                                        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                                            {acts.map((act) => {
                                                const mod = getModuleBadge(act.log_name);
                                                const ev = getEventBadge(act.event);
                                                const ModIcon = mod.icon;

                                                return (
                                                    <div
                                                        key={act.id}
                                                        onClick={() => handleOpenInspector(act)}
                                                        className="group relative flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all cursor-pointer"
                                                    >
                                                        {/* Punto indicador */}
                                                        <div className="absolute -left-6 top-4 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-600 shadow-sm" />

                                                        <div className="flex items-start gap-3">
                                                            <div className={`p-2 rounded-lg border shrink-0 ${mod.color}`}>
                                                                <ModIcon className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                                                                        {act.description}
                                                                    </span>
                                                                    <span className={`text-[10px] px-1.5 py-0.2 rounded border ${ev.color}`}>
                                                                        {ev.label}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                                                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                                                        {act.causer ? act.causer.name : __('Sistema')}
                                                                    </span>
                                                                    {act.subject_name && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span>{act.subject_name} #{act.subject_id}</span>
                                                                        </>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 self-end md:self-center text-xs text-slate-400 font-mono">
                                                            <span>{act.created_at ? act.created_at.split(' ')[1] : ''}</span>
                                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 group-hover:text-indigo-600">
                                                                <Maximize2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </TabsContent>

                {/* 3. Vista Distribución por Módulos */}
                <TabsContent value="modules" className="m-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-indigo-500" />
                                    {__('Módulos con Mayor Actividad')}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {__('Distribución porcentual de eventos generados por canal / área del sistema.')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {stats.top_modules.map((item, idx) => {
                                    const percentage = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                                    return (
                                        <div key={idx} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                                                <span className="font-mono text-slate-500">{item.count.toLocaleString()} ({percentage}%)</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-emerald-500" />
                                    {__('Resumen de Integridad & Seguridad')}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {__('Puntos clave del registro auditado conforme a estándares de seguridad.')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-xs">
                                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">{__('Trazabilidad Completa (Full Audit Trail)')}</h4>
                                        <p className="text-slate-500 mt-0.5">
                                            {__('Todas las acciones críticas en Ventas, Cajas, Inventario, Créditos y Reparaciones capturan dirección IP, agente de usuario y comparación de valores antes y después.')}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                                    <Database className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">{__('Aislamiento Multi-Tenant')}</h4>
                                        <p className="text-slate-500 mt-0.5">
                                            {__('Los registros están segmentados por empresa y sucursal. Los administradores solo tienen visibilidad sobre su propio entorno operativo.')}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modal / Sheet Inspector de Actividad (Diff & Metadata Viewer) */}
            <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-6">
                    {selectedActivity && (
                        <div className="space-y-6">
                            <SheetHeader className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs text-slate-400 font-bold">
                                        ACTIVITY #{selectedActivity.id}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded border ${getEventBadge(selectedActivity.event).color}`}>
                                        {getEventBadge(selectedActivity.event).label}
                                    </span>
                                </div>
                                <SheetTitle className="text-lg font-black text-slate-900 dark:text-white">
                                    {selectedActivity.description}
                                </SheetTitle>
                                <SheetDescription className="text-xs text-slate-500">
                                    {selectedActivity.created_at} ({selectedActivity.created_at_human})
                                </SheetDescription>
                            </SheetHeader>

                            {/* Resumen del Usuario y Entidad */}
                            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                                <div>
                                    <span className="text-slate-400 font-medium block text-[11px]">{__('Usuario Causante')}</span>
                                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                                        {selectedActivity.causer ? selectedActivity.causer.name : __('Sistema')}
                                    </span>
                                    <span className="text-slate-500 text-[10px] block">
                                        {selectedActivity.causer?.email || __('Operación automática')}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium block text-[11px]">{__('Entidad / Recurso')}</span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400 block mt-0.5">
                                        {selectedActivity.subject_name || __('General')} {selectedActivity.subject_id ? `#${selectedActivity.subject_id}` : ''}
                                    </span>
                                    <span className="text-slate-500 text-[10px] block truncate font-mono">
                                        {selectedActivity.subject_type || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {/* Comparación Visual de Cambios (Diff) */}
                            {selectedActivity.diff.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Sparkles className="h-4 w-4 text-amber-500" />
                                        {__('Cambios Realizados (Diferencias)')}
                                    </h4>
                                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                                        <Table>
                                            <TableHeader className="bg-slate-100/70 dark:bg-slate-900">
                                                <TableRow>
                                                    <TableHead className="w-1/3 font-bold text-xs">{__('Campo')}</TableHead>
                                                    <TableHead className="w-1/3 font-bold text-xs text-rose-600 dark:text-rose-400">{__('Valor Anterior')}</TableHead>
                                                    <TableHead className="w-1/3 font-bold text-xs text-emerald-600 dark:text-emerald-400">{__('Valor Nuevo')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedActivity.diff.map((item, i) => (
                                                    <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800/60 font-mono">
                                                        <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                                                            {item.field}
                                                        </TableCell>
                                                        <TableCell className="bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300">
                                                            {item.old !== null && item.old !== undefined
                                                                ? (typeof item.old === 'object' ? JSON.stringify(item.old) : String(item.old))
                                                                : <span className="text-slate-400 italic">null</span>}
                                                        </TableCell>
                                                        <TableCell className="bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold">
                                                            {item.new !== null && item.new !== undefined
                                                                ? (typeof item.new === 'object' ? JSON.stringify(item.new) : String(item.new))
                                                                : <span className="text-slate-400 italic">null</span>}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            {/* Metadatos de Red y Dispositivo */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Globe className="h-4 w-4 text-indigo-500" />
                                    {__('Información de Origen & Dispositivo')}
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                        <span className="text-slate-400 text-[10px] block font-medium">{__('Dirección IP')}</span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                                            {selectedActivity.ip_address || '127.0.0.1'}
                                        </span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                        <span className="text-slate-400 text-[10px] block font-medium">{__('Dispositivo / SO')}</span>
                                        <span className="font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
                                            {selectedActivity.os} • {selectedActivity.browser}
                                        </span>
                                    </div>
                                    {selectedActivity.url && (
                                        <div className="col-span-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                            <span className="text-slate-400 text-[10px] block font-medium">{__('Ruta / Método HTTP')}</span>
                                            <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                                                <Badge variant="outline" className="mr-1.5 text-[9px] py-0">{selectedActivity.method || 'GET'}</Badge>
                                                {selectedActivity.url}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payload JSON Crudo */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Code2 className="h-4 w-4 text-purple-500" />
                                        {__('Payload JSON Completo')}
                                    </h4>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCopyJson}
                                        className="h-7 text-xs"
                                    >
                                        {copiedJson ? (
                                            <>
                                                <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                                                {__('Copiado')}
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-3.5 w-3.5 mr-1" />
                                                {__('Copiar')}
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-60 border border-slate-800">
                                    {JSON.stringify(selectedActivity.properties, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
