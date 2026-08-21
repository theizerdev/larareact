import { Head, router } from '@inertiajs/react';
import { Layers, Play, AlertTriangle, RefreshCw, Trash2, Cpu, HelpCircle, Eye, CornerDownRight } from 'lucide-react';
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslate } from '@/hooks/use-translate';

interface JobItem {
    id: number;
    queue: string;
    attempts: number;
    status: 'pending' | 'running';
    created_at: string;
}

interface FailedJobItem {
    id: number;
    connection: string;
    queue: string;
    failed_at: string;
    exception: string;
    full_exception: string;
}

interface Stats {
    connection: string;
    pending: number;
    running: number;
    failed: number;
}

interface PageProps {
    stats: Stats;
    pendingJobs: JobItem[];
    failedJobs: FailedJobItem[];
}

export default function QueueMonitoring({ stats, pendingJobs, failedJobs }: PageProps) {
    const { __ } = useTranslate();
    const [selectedException, setSelectedException] = useState<string | null>(null);

    const handleRetry = (id: number) => {
        router.post(`/admin/monitoring/queues/${id}/retry`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire(__('Trabajo Reintentado'), __('El trabajo ha sido devuelto a la cola de procesamiento.'), 'success');
            }
        });
    };

    const handleRetryAll = () => {
        Swal.fire({
            title: __('¿Reintentar todos?'),
            text: __('Se pondrán en cola nuevamente todos los trabajos fallidos.'),
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: __('Sí, reintentar todos'),
            cancelButtonText: __('Cancelar'),
        }).then((result) => {
            if (result.isConfirmed) {
                router.post('/admin/monitoring/queues/retry-all', {}, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire(__('Reintentando'), __('Todos los trabajos han sido encolados de nuevo.'), 'success');
                    }
                });
            }
        });
    };

    const handleDelete = (id: number) => {
        Swal.fire({
            title: __('¿Estás seguro?'),
            text: __('El registro de este error se eliminará permanentemente.'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: __('Sí, eliminar'),
            cancelButtonText: __('Cancelar'),
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/admin/monitoring/queues/${id}`, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire(__('Eliminado'), __('El trabajo fallido ha sido eliminado.'), 'success');
                    }
                });
            }
        });
    };

    const handleClearAll = () => {
        Swal.fire({
            title: __('¿Vaciar historial de fallas?'),
            text: __('Esta acción eliminará de forma permanente todos los trabajos fallidos.'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: __('Sí, vaciar todo'),
            cancelButtonText: __('Cancelar'),
            customClass: {
                confirmButton: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete('/admin/monitoring/queues/clear-all', {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire(__('Historial Vacíado'), __('Todos los registros de trabajos fallidos se han eliminado.'), 'success');
                    }
                });
            }
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Monitoring'), href: '#' },
        { title: __('Queue Monitor'), href: '/admin/monitoring/queues' }
    ];

    return (
        <>
            <Head title={__('Queue Monitor')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Layers className="h-8 w-8 text-indigo-600" />
                            {__('Monitoreo de Colas y Procesos')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {__('Supervisa el estado y ejecución de tus procesos asíncronos y colas de trabajo (Jobs) en ejecución.')}
                        </p>
                    </div>

                    {failedJobs.length > 0 && (
                        <div className="flex gap-2 shrink-0 self-start md:self-auto">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2"
                                onClick={handleRetryAll}
                            >
                                <RefreshCw className="h-4 w-4" />
                                {__('Reintentar Todos')}
                            </Button>
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                className="gap-2"
                                onClick={handleClearAll}
                            >
                                <Trash2 className="h-4 w-4" />
                                {__('Vaciar Fallidos')}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Resumen de Cola */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">{__('Driver Activo')}</CardTitle>
                            <Cpu className="h-5 w-5 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold capitalize">{stats.connection}</div>
                            <p className="text-xs text-muted-foreground mt-1">{__('Conexión del sistema de colas')}</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">{__('Pendientes')}</CardTitle>
                            <Layers className="h-5 w-5 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pending}</div>
                            <p className="text-xs text-muted-foreground mt-1">{__('Trabajos esperando procesamiento')}</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">{__('En Ejecución')}</CardTitle>
                            <Play className="h-5 w-5 text-emerald-500 animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.running}</div>
                            <p className="text-xs text-muted-foreground mt-1">{__('Procesos activos actualmente')}</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">{__('Fallidos')}</CardTitle>
                            <AlertTriangle className="h-5 w-5 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.failed}</div>
                            <p className="text-xs text-muted-foreground mt-1">{__('Trabajos que reportaron un error')}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs de Radix UI */}
                <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="grid grid-cols-2 max-w-[360px]">
                        <TabsTrigger value="pending">{__('Trabajos Activos')} ({pendingJobs.length})</TabsTrigger>
                        <TabsTrigger value="failed">{__('Trabajos Fallidos')} ({failedJobs.length})</TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Pendientes y Ejecución */}
                    <TabsContent value="pending" className="mt-4">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>{__('Cola de Procesamiento')}</CardTitle>
                                <CardDescription>{__('Procesos asíncronos activos o esperando su turno de ejecución.')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-20">{__('ID')}</TableHead>
                                            <TableHead>{__('Cola (Queue)')}</TableHead>
                                            <TableHead className="text-center">{__('Intentos')}</TableHead>
                                            <TableHead>{__('Fecha de Encolado')}</TableHead>
                                            <TableHead className="text-right">{__('Estado')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingJobs.map((job) => (
                                            <TableRow key={job.id}>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    #{job.id}
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                                                    {job.queue}
                                                </TableCell>
                                                <TableCell className="text-center tabular-nums">
                                                    {job.attempts}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {job.created_at}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge 
                                                        variant={job.status === 'running' ? 'default' : 'secondary'}
                                                        className={job.status === 'running' ? 'bg-emerald-600 text-white' : ''}
                                                    >
                                                        {job.status === 'running' ? __('Ejecutándose') : __('Pendiente')}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {pendingJobs.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    {__('No hay trabajos pendientes ni en ejecución en este momento.')}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab 2: Fallidos */}
                    <TabsContent value="failed" className="mt-4">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>{__('Registro de Fallas')}</CardTitle>
                                <CardDescription>{__('Listado de trabajos que fallaron. Puedes reintentarlos o eliminarlos del historial.')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-20">{__('ID')}</TableHead>
                                            <TableHead>{__('Cola')}</TableHead>
                                            <TableHead>{__('Fecha de Falla')}</TableHead>
                                            <TableHead>{__('Excepción / Mensaje')}</TableHead>
                                            <TableHead className="w-32 text-right">{__('Acciones')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {failedJobs.map((job) => (
                                            <TableRow key={job.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    #{job.id}
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                                                    {job.queue}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {job.failed_at}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs max-w-[320px] truncate text-rose-600 dark:text-rose-400" title={job.exception}>
                                                    {job.exception}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => setSelectedException(job.full_exception)}
                                                            title={__('Ver Excepción Completa')}
                                                        >
                                                            <Eye className="h-4 w-4 text-indigo-500" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => handleRetry(job.id)}
                                                            title={__('Reintentar')}
                                                        >
                                                            <RefreshCw className="h-4 w-4 text-emerald-500" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => handleDelete(job.id)}
                                                            title={__('Eliminar')}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {failedJobs.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    {__('No se encontraron trabajos fallidos.')}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Dialog Radix UI para Detalles del error en cola */}
            <Dialog open={!!selectedException} onOpenChange={(open) => !open && setSelectedException(null)}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600">
                            <AlertTriangle className="h-5 w-5 animate-bounce" />
                            {__('Detalle del Error de Encolado')}
                        </DialogTitle>
                        <DialogDescription className="font-mono text-xs bg-slate-950 text-slate-300 p-4 rounded-lg overflow-x-auto whitespace-pre select-text border border-slate-800 mt-4 max-h-[60vh] overscroll-contain">
                            {selectedException}
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </>
    );
}
