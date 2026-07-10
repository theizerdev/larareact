import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Calendar, Play, Clock, ShieldAlert, CheckCircle, RefreshCw, Command } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { useTranslate } from '@/hooks/use-translate';
import Swal from 'sweetalert2';

interface TaskItem {
    id: number;
    command: string;
    expression: string;
    schedule: string;
    next_run: string;
    timezone: string;
    without_overlapping: boolean;
    on_one_server: boolean;
}

interface PageProps {
    tasks: TaskItem[];
}

export default function TaskMonitoring({ tasks }: PageProps) {
    const { __ } = useTranslate();
    const [runningTaskId, setRunningTaskId] = useState<number | null>(null);

    const handleRunTask = (task: TaskItem) => {
        Swal.fire({
            title: __('¿Ejecutar Tarea?'),
            text: __('Se forzará la ejecución inmediata de esta tarea programada.'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: __('Sí, ejecutar'),
            cancelButtonText: __('Cancelar'),
        }).then((result) => {
            if (result.isConfirmed) {
                setRunningTaskId(task.id);
                router.post('/admin/monitoring/tasks/run', { command: task.command }, {
                    preserveScroll: true,
                    onFinish: () => {
                        setRunningTaskId(null);
                    }
                });
            }
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Monitoring'), href: '#' },
        { title: __('Scheduled Tasks'), href: '/admin/monitoring/tasks' }
    ];

    return (
        <>
            <Head title={__('Scheduled Tasks')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Calendar className="h-8 w-8 text-indigo-600" />
                            {__('Programador de Tareas (Cron)')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {__('Supervisa, inspecciona y ejecuta los comandos automatizados programados en la aplicación.')}
                        </p>
                    </div>
                </div>

                {/* Listado de Tareas */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>{__('Tareas Programadas')} ({tasks.length})</CardTitle>
                        <CardDescription>
                            {__('Eventos automatizados configurados para ejecutarse en segundo plano.')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{__('Comando / Tarea')}</TableHead>
                                    <TableHead>{__('Programación')}</TableHead>
                                    <TableHead>{__('Expresión Cron')}</TableHead>
                                    <TableHead>{__('Siguiente Ejecución')}</TableHead>
                                    <TableHead className="text-center">{__('Zona Horaria')}</TableHead>
                                    <TableHead className="text-right">{__('Acción')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.map((task) => (
                                    <TableRow key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                        {/* Comando */}
                                        <TableCell className="font-mono text-xs text-slate-800 dark:text-slate-200">
                                            <div className="flex items-center gap-2">
                                                <Command className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                {task.command}
                                            </div>
                                        </TableCell>

                                        {/* Frecuencia / Programación */}
                                        <TableCell className="font-medium text-sm">
                                            {task.schedule}
                                        </TableCell>

                                        {/* Expresión Cron */}
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {task.expression}
                                        </TableCell>

                                        {/* Siguiente Ejecución */}
                                        <TableCell className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                {task.next_run}
                                            </div>
                                        </TableCell>

                                        {/* Zona Horaria */}
                                        <TableCell className="text-center text-xs text-muted-foreground">
                                            {task.timezone}
                                        </TableCell>

                                        {/* Ejecutar */}
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-1.5 h-8 text-xs font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-950 dark:hover:bg-emerald-950/20"
                                                onClick={() => handleRunTask(task)}
                                                disabled={runningTaskId !== null}
                                            >
                                                {runningTaskId === task.id ? (
                                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Play className="h-3.5 w-3.5" />
                                                )}
                                                {__('Ejecutar')}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {tasks.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            {__('No se encontraron tareas programadas en la aplicación.')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
