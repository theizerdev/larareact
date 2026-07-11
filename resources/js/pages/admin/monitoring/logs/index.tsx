import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    Terminal, Download, Trash2, Search, AlertCircle, FileText, ChevronRight, Eye,
    AlertTriangle, Info, CheckCircle2, Copy, Check, Server, HardDrive, Filter, XCircle 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { useTranslate } from '@/hooks/use-translate';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Swal from 'sweetalert2';

interface LogItem {
    timestamp: string;
    environment: string;
    level: string;
    message: string;
    stack_trace: string | null;
}

interface PageProps {
    logs: LogItem[];
    logSizeMb: number;
}

export default function LogMonitoring({ logs, logSizeMb }: PageProps) {
    const { __ } = useTranslate();
    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('all');
    const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);
    const [copied, setCopied] = useState(false);
    const [hideVendor, setHideVendor] = useState(true);

    const parsedFrames = useMemo(() => {
        if (!selectedLog?.stack_trace) return [];
        return selectedLog.stack_trace.split('\n').map((line) => {
            const trimmed = line.trim();
            const frameMatch = trimmed.match(/^#(\d+)\s+(.+?)\((\d+)\):\s+(.+)$/);
            
            let frameNumber = '';
            let file = '';
            let lineNo = '';
            let call = '';
            
            if (frameMatch) {
                frameNumber = frameMatch[1];
                file = frameMatch[2];
                lineNo = frameMatch[3];
                call = frameMatch[4];
            } else {
                const altMatch = trimmed.match(/^#(\d+)\s+(.+?):\s+(.+)$/);
                if (altMatch) {
                    frameNumber = altMatch[1];
                    file = altMatch[2];
                    call = altMatch[3];
                } else {
                    call = trimmed;
                }
            }
            
            const isVendor = file.includes('vendor') || file.includes('node_modules') || file.includes('symfony') || file.includes('laravel') || file.includes('internal function');
            
            let displayFile = file;
            if (file) {
                const searchStr = 'larareact\\';
                const baseIdx = file.indexOf(searchStr);
                if (baseIdx !== -1) {
                    displayFile = file.substring(baseIdx + searchStr.length);
                } else {
                    const searchStrUnix = 'larareact/';
                    const baseIdxUnix = file.indexOf(searchStrUnix);
                    if (baseIdxUnix !== -1) {
                        displayFile = file.substring(baseIdxUnix + searchStrUnix.length);
                    }
                }
            }
            
            return {
                raw: trimmed,
                frameNumber,
                file: displayFile || file,
                lineNo,
                call,
                isVendor
            };
        });
    }, [selectedLog]);

    const handleClearLogs = () => {
        Swal.fire({
            title: __('Are you sure?'),
            text: __('This action will permanently delete all contents of laravel.log.'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: __('Yes, clear logs'),
            cancelButtonText: __('Cancel'),
            customClass: {
                confirmButton: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete('/admin/monitoring/logs/clear', {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire(__('Logs Cleared'), __('The log file has been cleared successfully.'), 'success');
                    }
                });
            }
        });
    };

    // Calcular estadísticas en tiempo real
    const stats = useMemo(() => {
        let total = logs.length;
        let errors = 0;
        let warnings = 0;
        let infos = 0;

        logs.forEach((log) => {
            const lvl = log.level.toLowerCase();
            if (['error', 'critical', 'emergency', 'alert'].includes(lvl)) {
                errors++;
            } else if (lvl === 'warning') {
                warnings++;
            } else {
                infos++;
            }
        });

        return { total, errors, warnings, infos };
    }, [logs]);

    // Filtrar y buscar logs en el cliente
    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase()) || 
                                 (log.stack_trace && log.stack_trace.toLowerCase().includes(search.toLowerCase()));
            const matchesLevel = levelFilter === 'all' || 
                                 (levelFilter === 'error' && ['error', 'critical', 'emergency', 'alert'].includes(log.level.toLowerCase())) ||
                                 (levelFilter === 'warning' && log.level.toLowerCase() === 'warning') ||
                                 (levelFilter === 'info' && ['info', 'debug'].includes(log.level.toLowerCase()));
            return matchesSearch && matchesLevel;
        });
    }, [logs, search, levelFilter]);

    // Información del nivel de log para estilos y visuales
    const getLevelInfo = (level: string) => {
        const lvl = level.toLowerCase();
        switch (lvl) {
            case 'emergency':
            case 'alert':
            case 'critical':
            case 'error':
                return {
                    label: lvl.toUpperCase(),
                    variant: 'destructive' as const,
                    icon: <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />,
                    bgBorder: 'border-l-4 border-l-rose-500 bg-rose-50/5 dark:bg-rose-950/5 hover:bg-rose-50/15 dark:hover:bg-rose-950/15 transition-colors duration-150',
                };
            case 'warning':
                return {
                    label: lvl.toUpperCase(),
                    variant: 'outline' as const,
                    icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 shrink-0" />,
                    className: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100/80",
                    bgBorder: 'border-l-4 border-l-amber-500 bg-amber-50/5 dark:bg-amber-950/5 hover:bg-amber-50/15 dark:hover:bg-amber-950/15 transition-colors duration-150',
                };
            case 'info':
                return {
                    label: lvl.toUpperCase(),
                    variant: 'secondary' as const,
                    icon: <Info className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400 shrink-0" />,
                    bgBorder: 'border-l-4 border-l-sky-500 bg-sky-50/5 dark:bg-sky-950/5 hover:bg-sky-50/15 dark:hover:bg-sky-950/15 transition-colors duration-150',
                };
            case 'debug':
                return {
                    label: lvl.toUpperCase(),
                    variant: 'secondary' as const,
                    icon: <Terminal className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />,
                    bgBorder: 'border-l-4 border-l-indigo-400 bg-indigo-50/5 dark:bg-indigo-950/5 hover:bg-indigo-50/15 dark:hover:bg-indigo-950/15 transition-colors duration-150',
                };
            default:
                return {
                    label: level.toUpperCase(),
                    variant: 'outline' as const,
                    icon: <Terminal className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />,
                    bgBorder: 'border-l-4 border-l-slate-400 hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition-colors duration-150',
                };
        }
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Monitoring'), href: '#' },
        { title: __('System Logs'), href: '/admin/monitoring/logs' }
    ];

    const copyModalTrace = () => {
        if (selectedLog?.stack_trace) {
            navigator.clipboard.writeText(selectedLog.stack_trace);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            Swal.fire({
                title: __('Copied!'),
                text: __('Stack trace copied to clipboard.'),
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
            });
        }
    };

    return (
        <>
            <Head title={__('System Logs')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Terminal className="h-8 w-8 text-indigo-600 animate-pulse" />
                            {__('System Logs Monitoring')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {__('View and audit the framework\'s latest warnings, exceptions, and error traces.')}
                        </p>
                    </div>

                    <div className="flex gap-2 shrink-0 self-start md:self-auto">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 border-slate-200 hover:bg-slate-50"
                            onClick={() => window.open('/admin/monitoring/logs/download')}
                        >
                            <Download className="h-4 w-4" />
                            {__('Download Log')}
                        </Button>
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            className="gap-2"
                            onClick={handleClearLogs}
                        >
                            <Trash2 className="h-4 w-4" />
                            {__('Clear Log')}
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Size */}
                    <Card className="shadow-sm border-l-4 border-l-indigo-500 overflow-hidden relative group hover:shadow-md transition-all duration-300">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">{__('File Size')}</span>
                                <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{logSizeMb} MB</h3>
                                <p className="text-xs text-muted-foreground">
                                    {logSizeMb > 20 ? __('Large log file size') : __('Log file within limits')}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                                <HardDrive className="h-6 w-6" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Logs */}
                    <Card className="shadow-sm border-l-4 border-l-sky-500 overflow-hidden relative group hover:shadow-md transition-all duration-300">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">{__('Loaded Entries')}</span>
                                <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{stats.total}</h3>
                                <p className="text-xs text-muted-foreground">{__('Total records parsed')}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                                <Terminal className="h-6 w-6" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Critical Errors */}
                    <Card className={`shadow-sm border-l-4 ${stats.errors > 0 ? 'border-l-rose-500 bg-rose-50/5 dark:bg-rose-950/5' : 'border-l-slate-300'} overflow-hidden relative group hover:shadow-md transition-all duration-300`}>
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">{__('Critical Errors')}</span>
                                <h3 className={`text-2xl font-bold tracking-tight ${stats.errors > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>{stats.errors}</h3>
                                <p className="text-xs text-muted-foreground">
                                    {stats.errors > 0 ? __('Immediate action required') : __('No critical exceptions')}
                                </p>
                            </div>
                            <div className={`p-3 rounded-xl ${stats.errors > 0 ? 'bg-rose-100 dark:bg-rose-950/45 text-rose-600' : 'bg-slate-50 dark:bg-slate-900/50 text-slate-400'}`}>
                                <AlertCircle className="h-6 w-6" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Warnings */}
                    <Card className={`shadow-sm border-l-4 ${stats.warnings > 0 ? 'border-l-amber-500 bg-amber-50/5 dark:bg-amber-950/5' : 'border-l-slate-300'} overflow-hidden relative group hover:shadow-md transition-all duration-300`}>
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">{__('System Warnings')}</span>
                                <h3 className={`text-2xl font-bold tracking-tight ${stats.warnings > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-slate-900 dark:text-slate-100'}`}>{stats.warnings}</h3>
                                <p className="text-xs text-muted-foreground">
                                    {stats.warnings > 0 ? __('Non-blocking issues logged') : __('Clean runtime state')}
                                </p>
                            </div>
                            <div className={`p-3 rounded-xl ${stats.warnings > 0 ? 'bg-amber-100 dark:bg-amber-950/45 text-amber-600' : 'bg-slate-50 dark:bg-slate-900/50 text-slate-400'}`}>
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtros */}
                <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                            {/* Buscar */}
                            <div className="flex-1 space-y-1.5">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <Search className="h-3.5 w-3.5" />
                                    {__('Quick Search')}
                                </span>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={__('Search message or stack trace...')}
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9 bg-slate-50/50 dark:bg-slate-950/20"
                                    />
                                </div>
                            </div>

                            {/* Nivel */}
                            <div className="w-full sm:w-48 space-y-1.5">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <Filter className="h-3.5 w-3.5" />
                                    {__('Alert Level')}
                                </span>
                                <Select value={levelFilter} onValueChange={setLevelFilter}>
                                    <SelectTrigger className="bg-slate-50/50 dark:bg-slate-950/20">
                                        <SelectValue placeholder={__('All')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{__('All')}</SelectItem>
                                        <SelectItem value="error">{__('Errors / Critical')}</SelectItem>
                                        <SelectItem value="warning">{__('Warnings')}</SelectItem>
                                        <SelectItem value="info">{__('Info / Debug')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla de Logs */}
                <Card className="shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table className="min-w-full">
                                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                                    <TableRow>
                                        <TableHead className="w-44 text-xs font-bold uppercase tracking-wider">{__('Timestamp')}</TableHead>
                                        <TableHead className="w-36 text-xs font-bold uppercase tracking-wider">{__('Level')}</TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-wider">{__('Message Detail')}</TableHead>
                                        <TableHead className="w-20 text-right text-xs font-bold uppercase tracking-wider pr-4">{__('Actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLogs.map((log, idx) => {
                                        const levelInfo = getLevelInfo(log.level);
                                        const [date, time] = log.timestamp.split(' ');

                                        return (
                                            <TableRow 
                                                key={idx} 
                                                className={`group cursor-pointer border-b transition-colors duration-150 ${levelInfo.bgBorder}`}
                                                onClick={() => setSelectedLog(log)}
                                            >
                                                {/* Timestamp */}
                                                <TableCell className="py-3 font-medium select-none">
                                                    <div className="font-mono text-[11.5px] text-slate-800 dark:text-slate-200">
                                                        {date}
                                                    </div>
                                                    <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                                                        {time}
                                                    </div>
                                                </TableCell>

                                                {/* Badge Nivel */}
                                                <TableCell className="py-3 select-none">
                                                    <Badge 
                                                        variant={levelInfo.variant} 
                                                        className={`uppercase text-[9px] font-bold px-2 py-0.5 tracking-wider inline-flex items-center ${
                                                            levelInfo.className || ""
                                                        }`}
                                                    >
                                                        {levelInfo.icon}
                                                        {levelInfo.label}
                                                    </Badge>
                                                </TableCell>

                                                {/* Message & Preview stack trace */}
                                                <TableCell className="py-3 max-w-lg">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-150" title={log.message}>
                                                            {log.message}
                                                        </span>
                                                        {log.stack_trace && (
                                                            <span className="text-[10px] font-mono text-muted-foreground/80 line-clamp-1 max-w-prose">
                                                                {log.stack_trace.split('\n')[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Eye / Action Details Button */}
                                                <TableCell className="py-3 text-right pr-4">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedLog(log);
                                                        }}
                                                        className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 opacity-60 group-hover:opacity-100 transition-opacity"
                                                        title={__('View Details')}
                                                    >
                                                        <Eye className="h-4 w-4 text-indigo-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}

                                    {filteredLogs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-muted-foreground select-none">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Terminal className="h-8 w-8 text-slate-300" />
                                                    <span>{__('No log records found matching search filters.')}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>            {/* Dialog Radix UI para Detalle de Log */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
                    {/* Header Banner dynamically colored */}
                    <div className={`p-6 border-b relative overflow-hidden ${
                        selectedLog?.level === 'error' || selectedLog?.level === 'critical' || selectedLog?.level === 'emergency' || selectedLog?.level === 'alert'
                            ? 'bg-gradient-to-r from-rose-500/10 to-rose-500/0 dark:from-rose-950/20'
                            : selectedLog?.level === 'warning'
                            ? 'bg-gradient-to-r from-amber-500/10 to-amber-500/0 dark:from-amber-950/20'
                            : 'bg-gradient-to-r from-sky-500/10 to-sky-500/0 dark:from-sky-950/20'
                    }`}>
                        {/* Glow effect */}
                        <div className={`absolute -left-10 -top-10 w-40 h-40 rounded-full filter blur-3xl opacity-20 ${
                            selectedLog?.level === 'error' || selectedLog?.level === 'critical' || selectedLog?.level === 'emergency' || selectedLog?.level === 'alert'
                                ? 'bg-rose-500'
                                : selectedLog?.level === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-sky-500'
                        }`} />

                        <div className="relative flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                    <Server className="h-3 w-3" />
                                    {__('System Exception logs')}
                                </span>
                                <div className="flex items-center gap-2">
                                    {selectedLog && (
                                        <Badge 
                                            variant={getLevelInfo(selectedLog.level).variant} 
                                            className={`uppercase text-[10px] font-extrabold px-2.5 py-0.5 tracking-wider ${
                                                getLevelInfo(selectedLog.level).className || ""
                                            }`}
                                        >
                                            {selectedLog.level}
                                        </Badge>
                                    )}
                                    <Badge variant="outline" className="text-[10px] font-mono px-2.5 py-0.5 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                        {selectedLog?.environment}
                                    </Badge>
                                </div>
                            </div>

                            <h2 className="text-lg font-mono font-bold tracking-tight text-slate-800 dark:text-slate-100 break-all select-all leading-snug">
                                {selectedLog?.message}
                            </h2>

                            <div className="text-xs text-muted-foreground flex items-center gap-2 font-mono mt-1">
                                <span className="font-semibold text-slate-500 dark:text-slate-400">{__('Logged at:')}</span>
                                <span>{selectedLog?.timestamp}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs system */}
                    <Tabs defaultValue="summary" className="w-full flex flex-col">
                        <div className="px-6 border-b bg-slate-50/50 dark:bg-slate-900/10">
                            <TabsList className="h-12 bg-transparent p-0 gap-6 border-b-0">
                                <TabsTrigger 
                                    value="summary" 
                                    className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 dark:data-[state=active]:border-indigo-400 bg-transparent px-1 pb-2 pt-2 text-sm font-semibold text-muted-foreground data-[state=active]:text-slate-950 dark:data-[state=active]:text-slate-50 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
                                >
                                    {__('Summary')}
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="stacktrace" 
                                    className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 dark:data-[state=active]:border-indigo-400 bg-transparent px-1 pb-2 pt-2 text-sm font-semibold text-muted-foreground data-[state=active]:text-slate-950 dark:data-[state=active]:text-slate-50 hover:text-slate-800 dark:hover:text-slate-200 transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    {__('Stack Trace')}
                                    {parsedFrames.length > 0 && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
                                            {parsedFrames.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="raw" 
                                    className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 dark:data-[state=active]:border-indigo-400 bg-transparent px-1 pb-2 pt-2 text-sm font-semibold text-muted-foreground data-[state=active]:text-slate-950 dark:data-[state=active]:text-slate-50 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
                                >
                                    {__('System Info / Raw')}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Summary Content */}
                        <TabsContent value="summary" className="p-6 focus-visible:outline-none">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                            {__('Exception Message')}
                                        </span>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => {
                                                if (selectedLog?.message) {
                                                    navigator.clipboard.writeText(selectedLog.message);
                                                    Swal.fire({
                                                        title: __('Copied!'),
                                                        text: __('Message copied to clipboard.'),
                                                        icon: 'success',
                                                        timer: 1000,
                                                        showConfirmButton: false,
                                                    });
                                                }
                                            }}
                                            className="h-7 text-xs text-muted-foreground"
                                        >
                                            <Copy className="h-3.5 w-3.5 mr-1" />
                                            {__('Copy Message')}
                                        </Button>
                                    </div>
                                    <div className="font-mono text-sm bg-rose-50/20 dark:bg-rose-950/10 p-5 rounded-xl border border-rose-100/50 dark:border-rose-950/30 text-rose-905 dark:text-rose-300 whitespace-pre-wrap select-text leading-relaxed font-semibold">
                                        {selectedLog?.message}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                    <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">{__('Time Logged')}</span>
                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 block font-mono">
                                            {selectedLog?.timestamp}
                                        </span>
                                    </div>
                                    <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">{__('Environment')}</span>
                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 block capitalize">
                                            {selectedLog?.environment}
                                        </span>
                                    </div>
                                    <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">{__('Severity Level')}</span>
                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 block uppercase">
                                            {selectedLog?.level}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Stack Trace Content */}
                        <TabsContent value="stacktrace" className="p-6 focus-visible:outline-none">
                            {selectedLog?.stack_trace ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <Switch 
                                                id="hide-vendor-switch"
                                                checked={hideVendor}
                                                onCheckedChange={setHideVendor}
                                            />
                                            <Label htmlFor="hide-vendor-switch" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                                                {__('Hide framework/vendor frames')}
                                            </Label>
                                        </div>

                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={copyModalTrace}
                                            className="h-8 text-xs gap-1.5"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                            {__('Copy Stack Trace')}
                                        </Button>
                                    </div>

                                    {/* Stack Frames List */}
                                    <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-2 border rounded-xl p-4 bg-slate-950/5 dark:bg-slate-950/40">
                                        {parsedFrames
                                            .filter(frame => !hideVendor || !frame.isVendor)
                                            .map((frame, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className={`p-3 rounded-lg border text-left font-mono transition-all duration-150 ${
                                                        frame.isVendor 
                                                            ? 'bg-slate-100/50 dark:bg-slate-900/30 text-slate-400/80 border-slate-200/50 dark:border-slate-900/40 text-[11px] opacity-60 hover:opacity-100'
                                                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-indigo-100 dark:border-indigo-950/60 shadow-sm hover:shadow hover:border-indigo-200 text-xs'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {/* Index Badge */}
                                                        <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                                                            frame.isVendor 
                                                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                                                : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                                                        }`}>
                                                            {frame.frameNumber || '#'}
                                                        </span>

                                                        <div className="flex-1 space-y-1.5 min-w-0">
                                                            {/* Method Call */}
                                                            <div className={`font-semibold break-all leading-normal ${
                                                                frame.isVendor 
                                                                    ? 'text-slate-600 dark:text-slate-400' 
                                                                    : 'text-indigo-600 dark:text-indigo-400 text-sm'
                                                            }`}>
                                                                {frame.call}
                                                            </div>

                                                            {/* File Location */}
                                                            {frame.file && (
                                                                <div className="text-[10.5px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                                                                    <span className="font-semibold text-slate-500 dark:text-slate-400 break-all select-all">
                                                                        {frame.file}
                                                                    </span>
                                                                    {frame.lineNo && (
                                                                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-bold border border-slate-200 dark:border-slate-700 shrink-0">
                                                                            :{frame.lineNo}
                                                                        </span>
                                                                    )}
                                                                    {frame.isVendor && (
                                                                        <span className="text-[8px] uppercase tracking-wider font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 px-1 rounded shrink-0 select-none">
                                                                            vendor
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                        {parsedFrames.filter(frame => !hideVendor || !frame.isVendor).length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground italic text-xs">
                                                {__('All stack frames are framework/vendor frames. Turn off the vendor filter to see them.')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground italic text-xs">
                                    {__('No stack trace available for this entry.')}
                                </div>
                            )}
                        </TabsContent>

                        {/* Raw Content */}
                        <TabsContent value="raw" className="p-6 focus-visible:outline-none">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        {__('Raw Log Payload')}
                                    </span>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => {
                                            if (selectedLog) {
                                                const rawText = `[${selectedLog.timestamp}] ${selectedLog.environment}.${selectedLog.level.toUpperCase()}: ${selectedLog.message}\n${selectedLog.stack_trace || ""}`;
                                                navigator.clipboard.writeText(rawText);
                                                Swal.fire({
                                                    title: __('Copied!'),
                                                    text: __('Raw log details copied.'),
                                                    icon: 'success',
                                                    timer: 1500,
                                                    showConfirmButton: false,
                                                });
                                            }
                                        }}
                                        className="h-8 text-xs gap-1.5"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                        {__('Copy Raw Log')}
                                    </Button>
                                </div>
                                <pre className="text-[10px] font-mono bg-slate-950 text-slate-300 p-5 rounded-xl overflow-x-auto whitespace-pre select-text border border-slate-800 max-h-[45vh] overscroll-contain leading-relaxed">
                                    {`[${selectedLog?.timestamp}] ${selectedLog?.environment}.${selectedLog?.level.toUpperCase()}: ${selectedLog?.message}\n${selectedLog?.stack_trace || ""}`}
                                </pre>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex justify-end">
                        <Button type="button" onClick={() => setSelectedLog(null)} className="h-9 px-4">
                            {__('Close')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
