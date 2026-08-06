import { Head, router } from '@inertiajs/react';
import {
    ShieldCheck,
    Search,
    Filter,
    Calendar,
    User,
    Clock,
    Eye,
    FileSpreadsheet,
    Activity,
    Lock,
    KeyRound,
    AlertCircle,
    Receipt,
    Wallet,
    Layers,
    X,
    ChevronRight,
    PlusCircle,
    Edit3,
    Trash2,
    CheckCircle2,
    Copy,
    ArrowRight,
    TrendingUp,
    Shield,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams } from '@/lib/utils';
import { notifySuccess } from '@/utils/notifications';

interface LogItem {
    id: number;
    log_name: string;
    description: string;
    event: string;
    subject_type?: string;
    subject_id?: number;
    causer?: {
        id: number;
        name: string;
        email: string;
    };
    properties: {
        attributes?: Record<string, any>;
        old?: Record<string, any>;
        [key: string]: any;
    };
    created_at: string;
}

interface Props {
    logs: {
        data: LogItem[];
        links: any[];
        total: number;
        current_page: number;
        last_page: number;
        per_page: number;
        from?: number | null;
        to?: number | null;
    };
    categories: string[];
    filters: {
        search?: string;
        log_name?: string;
        from_date?: string;
        to_date?: string;
    };
    stats: {
        totalEvents: number;
        todayEvents: number;
        contabilidadEvents: number;
        cajaEvents: number;
    };
}

export default function BitacoraPage({ logs, categories, filters, stats }: Props) {
    const { __ } = useTranslate();
    const [search, setSearch] = useState(filters.search || '');
    const [logName, setLogName] = useState(filters.log_name || 'all');
    const [fromDate, setFromDate] = useState(filters.from_date || '');
    const [toDate, setToDate] = useState(filters.to_date || '');
    const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/admin/seguridad/bitacora',
            cleanParams({
                search,
                log_name: logName,
                from_date: fromDate,
                to_date: toDate,
            }),
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleCategoryFilter = (cat: string) => {
        setLogName(cat);
        router.get(
            '/admin/seguridad/bitacora',
            cleanParams({
                search,
                log_name: cat,
                from_date: fromDate,
                to_date: toDate,
            }),
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setLogName('all');
        setFromDate('');
        setToDate('');
        router.get('/admin/seguridad/bitacora', {}, { preserveState: true, preserveScroll: true });
    };

    // Exportar bitácora a CSV
    const exportToCSV = () => {
        if (!logs.data || logs.data.length === 0) return;

        let csv = 'ID,Fecha,Usuario,Email,Modulo,Evento,Descripcion\n';
        logs.data.forEach((l) => {
            csv += `${l.id},"${l.created_at}","${l.causer?.name || 'Sistema'}","${l.causer?.email || 'N/A'}","${l.log_name}","${l.event}","${l.description.replace(/"/g, '""')}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Bitacora_Auditoria_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const copyJsonToClipboard = (json: any) => {
        navigator.clipboard.writeText(JSON.stringify(json, null, 2));
        notifySuccess(__('Copiado al portapapeles'));
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Seguridad'), href: '#' },
        { title: __('Bitácora de Auditoría'), href: '/admin/seguridad/bitacora' },
    ];

    const getLogBadge = (name: string) => {
        switch (name) {
            case 'contabilidad':
                return <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-mono text-[10px]">{__('Contabilidad')}</Badge>;
            case 'caja':
            case 'ventas':
                return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px]">{__('Caja & Ventas')}</Badge>;
            case 'auth':
            case 'seguridad':
                return <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-mono text-[10px]">{__('Seguridad')}</Badge>;
            case 'inventario':
                return <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-mono text-[10px]">{__('Inventario')}</Badge>;
            default:
                return <Badge variant="outline" className="font-mono text-[10px]">{name ? name.toUpperCase() : __('GENERAL')}</Badge>;
        }
    };

    const getEventBadge = (event: string) => {
        const ev = event?.toLowerCase() || '';
        if (ev.includes('create') || ev.includes('crea')) {
            return (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                    <PlusCircle className="w-3 h-3" />
                    {__('Creación')}
                </span>
            );
        }
        if (ev.includes('update') || ev.includes('edit')) {
            return (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                    <Edit3 className="w-3 h-3" />
                    {__('Modificación')}
                </span>
            );
        }
        if (ev.includes('delete') || ev.includes('elim')) {
            return (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                    <Trash2 className="w-3 h-3" />
                    {__('Eliminación')}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-900">
                <Activity className="w-3 h-3" />
                {event || __('Evento')}
            </span>
        );
    };

    return (
        <>
            <Head title={__('Bitácora de Auditoría & Seguridad')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <ModuleHeader
                        title={__('Bitácora de Auditoría & Logs de Seguridad')}
                        description={__('Historial cronológico e inalterable de auditoría sobre transacciones, eventos de seguridad y modificaciones.')}
                        icon={<ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
                    />

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToCSV}
                        className="h-9 gap-1.5 text-xs font-semibold self-start sm:self-auto"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        {__('Exportar Bitácora CSV')}
                    </Button>
                </div>

                {/* ══ Cards Estadísticas Ejecutivas Pro ══════════════════════════════════ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Eventos */}
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {__('Total Eventos')}
                            </span>
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                                <Shield className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                                {stats.totalEvents}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-semibold text-purple-600 bg-purple-50 dark:bg-purple-950/50 border-purple-200">
                                {__('Histórico')}
                            </Badge>
                        </div>
                    </div>

                    {/* Card 2: Hoy */}
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {__('Eventos Hoy')}
                            </span>
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                                {stats.todayEvents}
                            </span>
                            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                                <TrendingUp className="w-3 h-3" />
                                {__('Últimas 24h')}
                            </span>
                        </div>
                    </div>

                    {/* Card 3: Contabilidad */}
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {__('Auditoría Contable')}
                            </span>
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                                <Receipt className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                                {stats.contabilidadEvents}
                            </span>
                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                {__('Asientos / Cierres')}
                            </span>
                        </div>
                    </div>

                    {/* Card 4: Caja & Ventas */}
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {__('Caja & Transacciones')}
                            </span>
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                                <Wallet className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                                {stats.cajaEvents}
                            </span>
                            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                {__('Movimientos')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ══ Quick Category Pills ════════════════════════════════════════════ */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                    <span className="text-xs font-semibold text-slate-500 shrink-0">{__('Categorías Rápidas:')}</span>

                    <Button
                        variant={logName === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleCategoryFilter('all')}
                        className={`h-8 rounded-full text-xs font-medium ${logName === 'all' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
                    >
                        {__('Todas')} ({stats.totalEvents})
                    </Button>

                    {categories.map((cat) => (
                        <Button
                            key={cat}
                            variant={logName === cat ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleCategoryFilter(cat)}
                            className={`h-8 rounded-full text-xs font-medium uppercase font-mono ${logName === cat ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>

                {/* ══ Toolbar de Filtros y Búsqueda ═════════════════════════════════════ */}
                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="p-4 border-b bg-slate-50/60 dark:bg-slate-900/60">
                        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{__('Búsqueda Libre')}</Label>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                                        <Input
                                            placeholder={__('Buscar usuario, email o descripción...')}
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-9 h-9 text-xs bg-white dark:bg-slate-950"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{__('Desde Fecha')}</Label>
                                    <Input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="h-9 text-xs bg-white dark:bg-slate-950"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{__('Hasta Fecha')}</Label>
                                    <Input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="h-9 text-xs bg-white dark:bg-slate-950"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 justify-end pt-1 lg:pt-5">
                                <Button type="submit" size="sm" className="h-9 px-4 text-xs font-bold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-sm">
                                    <Filter className="w-3.5 h-3.5" />
                                    {__('Filtrar')}
                                </Button>

                                {(search || logName !== 'all' || fromDate || toDate) && (
                                    <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="h-9 px-3 text-xs gap-1 text-slate-600 hover:text-slate-900">
                                        <X className="w-3.5 h-3.5" />
                                        {__('Limpiar')}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardHeader>

                    {/* ══ Tabla de Registros de Auditoría ══════════════════════════════════ */}
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-sans">
                                <thead className="bg-slate-100/80 dark:bg-slate-900 uppercase font-bold text-[10px] text-slate-600 dark:text-slate-400 border-b tracking-wider font-mono">
                                    <tr>
                                        <th className="py-3 px-4 w-12">#</th>
                                        <th className="py-3 px-4">{__('Fecha y Hora')}</th>
                                        <th className="py-3 px-4">{__('Usuario Responsable')}</th>
                                        <th className="py-3 px-4">{__('Módulo')}</th>
                                        <th className="py-3 px-4">{__('Tipo Evento')}</th>
                                        <th className="py-3 px-4">{__('Descripción de la Acción')}</th>
                                        <th className="py-3 px-4 text-center w-24">{__('Detalles')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {logs.data.length > 0 ? (
                                        logs.data.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-900/40 transition-colors">
                                                <td className="py-3 px-4 font-mono text-slate-400 font-bold">{log.id}</td>
                                                <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                    {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {log.causer ? (
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                                                {log.causer.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">{log.causer.name}</p>
                                                                <p className="text-[10px] text-slate-500 font-mono">{log.causer.email}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 font-mono italic text-[11px]">{__('Sistema Automático')}</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">{getLogBadge(log.log_name)}</td>
                                                <td className="py-3 px-4">{getEventBadge(log.event)}</td>
                                                <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                                                    {log.description}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedLog(log)}
                                                        className="h-8 gap-1 text-xs font-bold border-purple-200 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        {__('Ver Diff')}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="py-16 text-center text-xs text-muted-foreground space-y-3">
                                                <ShieldCheck className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 stroke-[1.2]" />
                                                <p className="font-semibold text-sm">{__('No se encontraron eventos de auditoría')}</p>
                                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                                    {__('Los eventos sensibles de contabilidad, caja y seguridad se registrarán automáticamente aquí.')}
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>

                    {/* Paginación Nativa */}
                    {logs.total > 0 && (
                        <div className="p-4 border-t bg-slate-50/40 dark:bg-slate-900/40">
                            <Pagination paginatedData={logs} filters={filters} />
                        </div>
                    )}
                </Card>

                {/* ══ Modal de Inspección Visual de Cambios (Diff Table) ═══════════════ */}
                <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                    <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader className="border-b pb-3">
                            <DialogTitle className="flex items-center justify-between text-base">
                                <div className="flex items-center gap-2 font-mono">
                                    <ShieldCheck className="w-5 h-5 text-purple-600" />
                                    <span>{__('INSPECCIÓN DE CAMBIOS (AUDIT DIFF)')} N° {selectedLog?.id}</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => selectedLog && copyJsonToClipboard(selectedLog.properties)}
                                    className="h-7 text-xs gap-1"
                                >
                                    <Copy className="w-3 h-3" />
                                    {__('Copiar JSON')}
                                </Button>
                            </DialogTitle>
                        </DialogHeader>

                        {selectedLog && (
                            <div className="space-y-4 text-xs font-sans py-2">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">{__('Fecha y Hora del Evento')}</p>
                                        <p className="font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                                            {new Date(selectedLog.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">{__('Usuario Ejecutor')}</p>
                                        <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                                            {selectedLog.causer?.name || __('Sistema Automático')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">{__('Categoría / Módulo')}</p>
                                        <div className="mt-0.5">{getLogBadge(selectedLog.log_name)}</div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">{__('Descripción de la Acción')}</p>
                                    <p className="p-3 bg-purple-50/60 dark:bg-purple-950/40 rounded-lg border border-purple-100 dark:border-purple-900 font-medium text-slate-900 dark:text-slate-100">
                                        {selectedLog.description}
                                    </p>
                                </div>

                                {/* Tabla Visual Comparativa Diff (Old vs Attributes) */}
                                {selectedLog.properties && (selectedLog.properties.old || selectedLog.properties.attributes) ? (
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-800 dark:text-slate-200">{__('Modificación de Campos (Antes vs Después)')}</Label>
                                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                            <table className="w-full text-left font-mono text-xs">
                                                <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-muted-foreground border-b">
                                                    <tr>
                                                        <th className="p-2.5 font-sans">{__('Campo / Atributo')}</th>
                                                        <th className="p-2.5 text-rose-600 bg-rose-50/50 dark:bg-rose-950/20">{__('Valor Anterior (Old)')}</th>
                                                        <th className="p-2.5 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20">{__('Valor Nuevo (Attributes)')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y text-[11px]">
                                                    {Object.keys(selectedLog.properties.attributes || selectedLog.properties.old || {}).map((key) => {
                                                        const oldVal = selectedLog.properties.old ? selectedLog.properties.old[key] : null;
                                                        const newVal = selectedLog.properties.attributes ? selectedLog.properties.attributes[key] : null;

                                                        return (
                                                            <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                                                <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200 font-sans">{key}</td>
                                                                <td className="p-2.5 bg-rose-50/30 dark:bg-rose-950/10 text-rose-700 dark:text-rose-400 font-mono">
                                                                    {oldVal !== null && oldVal !== undefined ? String(oldVal) : <span className="text-slate-400 italic">-</span>}
                                                                </td>
                                                                <td className="p-2.5 bg-emerald-50/30 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                                                                    {newVal !== null && newVal !== undefined ? String(newVal) : <span className="text-slate-400 italic">-</span>}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    selectedLog.properties && Object.keys(selectedLog.properties).length > 0 && (
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">{__('Propiedades del Evento (Raw JSON)')}</p>
                                            <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto border border-slate-800 leading-relaxed max-h-60">
                                                {JSON.stringify(selectedLog.properties, null, 2)}
                                            </pre>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
