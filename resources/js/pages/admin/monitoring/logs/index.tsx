import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Terminal, Download, Trash2, Search, AlertCircle, FileText, ChevronRight, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { useTranslate } from '@/hooks/use-translate';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

    const handleClearLogs = () => {
        Swal.fire({
            title: __('¿Estás seguro?'),
            text: __('Esta acción eliminará de forma permanente todo el contenido del archivo laravel.log.'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: __('Sí, limpiar logs'),
            cancelButtonText: __('Cancelar'),
            customClass: {
                confirmButton: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete('/admin/monitoring/logs/clear', {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire(__('Logs Limpiados'), __('El archivo de logs se ha vaciado correctamente.'), 'success');
                    }
                });
            }
        });
    };

    // Filtrar y buscar logs en el cliente
    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase()) || 
                                 (log.stack_trace && log.stack_trace.toLowerCase().includes(search.toLowerCase()));
            const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
            return matchesSearch && matchesLevel;
        });
    }, [logs, search, levelFilter]);

    const getLevelBadgeVariant = (level: string) => {
        switch (level) {
            case 'emergency':
            case 'alert':
            case 'critical':
            case 'error':
                return 'destructive';
            case 'warning':
                return 'outline'; // Podría simular warning
            default:
                return 'secondary';
        }
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Monitoring'), href: '#' },
        { title: __('System Logs'), href: '/admin/monitoring/logs' }
    ];

    return (
        <>
            <Head title={__('System Logs')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Terminal className="h-8 w-8 text-indigo-600" />
                            {__('Logs de Actividad del Sistema')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {__('Visualiza y audita las últimas advertencias, excepciones y trazas de error del framework.')}
                        </p>
                    </div>

                    <div className="flex gap-2 shrink-0 self-start md:self-auto">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => window.open('/admin/monitoring/logs/download')}
                        >
                            <Download className="h-4 w-4" />
                            {__('Descargar Log')}
                        </Button>
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            className="gap-2"
                            onClick={handleClearLogs}
                        >
                            <Trash2 className="h-4 w-4" />
                            {__('Limpiar Log')}
                        </Button>
                    </div>
                </div>

                {/* Info & Stats */}
                <Card className="shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="rounded-full bg-indigo-50 dark:bg-indigo-950/20 p-2 text-indigo-600 dark:text-indigo-400">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {__('Archivo laravel.log')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {__('Tamaño actual del archivo:')} <span className="font-semibold text-indigo-600">{logSizeMb} MB</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Filtros */}
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                            {/* Buscar */}
                            <div className="flex-1 space-y-1.5">
                                <span className="text-xs font-medium text-muted-foreground">{__('Buscador rápido')}</span>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={__('Buscar en el mensaje o stack trace...')}
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* Nivel */}
                            <div className="w-full sm:w-48 space-y-1.5">
                                <span className="text-xs font-medium text-muted-foreground">{__('Nivel de Alerta')}</span>
                                <Select value={levelFilter} onValueChange={setLevelFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={__('Todos')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{__('Todos')}</SelectItem>
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
                <Card className="shadow-sm">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-48">{__('Timestamp')}</TableHead>
                                    <TableHead className="w-32">{__('Nivel')}</TableHead>
                                    <TableHead>{__('Mensaje')}</TableHead>
                                    <TableHead className="w-24 text-right">{__('Detalles')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.map((log, idx) => (
                                    <TableRow key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {log.timestamp}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getLevelBadgeVariant(log.level)} className="uppercase text-[9px]">
                                                {log.level}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs max-w-[400px] truncate text-slate-800 dark:text-slate-200" title={log.message}>
                                            {log.message}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {log.stack_trace ? (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => setSelectedLog(log)}
                                                    title={__('Ver Stack Trace')}
                                                >
                                                    <Eye className="h-4 w-4 text-indigo-500" />
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic px-2">—</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {filteredLogs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            {__('No se encontraron registros de logs en este nivel.')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Dialog Radix UI para Stack Trace */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600">
                            <AlertCircle className="h-5 w-5" />
                            {__('Detalle de la Excepción')}
                        </DialogTitle>
                        <DialogDescription className="font-mono text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded border border-red-100 dark:border-red-950 text-slate-800 dark:text-slate-300 mt-2 whitespace-pre-wrap select-text">
                            {selectedLog?.message}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog?.stack_trace && (
                        <div className="mt-4 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground">{__('Stack Trace completo:')}</p>
                            <pre className="text-[10px] font-mono bg-slate-950 text-slate-300 p-4 rounded-lg overflow-x-auto whitespace-pre select-text border border-slate-800 max-h-[45vh] overscroll-contain">
                                {selectedLog.stack_trace}
                            </pre>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
