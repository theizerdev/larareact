import { Head, router } from '@inertiajs/react';
import { Calendar, Play, Clock, ShieldAlert, CheckCircle, RefreshCw, Command } from 'lucide-react';
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslate } from '@/hooks/use-translate';

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
            title: __('Run Task?'),
            text: __('This scheduled task will be forced to run immediately.'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: __('Yes, run it'),
            cancelButtonText: __('Cancel'),
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
                            {__('Task Scheduler (Cron)')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {__('Monitor, inspect and execute automated commands scheduled in the application.')}
                        </p>
                    </div>
                </div>

                {/* Listado de Tareas */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>{__('Scheduled Tasks')} ({tasks.length})</CardTitle>
                        <CardDescription>
                            {__('Automated events configured to run in the background.')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{__('Command / Task')}</TableHead>
                                    <TableHead>{__('Schedule')}</TableHead>
                                    <TableHead>{__('Cron Expression')}</TableHead>
                                    <TableHead>{__('Next Execution')}</TableHead>
                                    <TableHead className="text-center">{__('Timezone')}</TableHead>
                                    <TableHead className="text-right">{__('Action')}</TableHead>
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
                                                {__('Run')}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {tasks.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            {__('No scheduled tasks found in the application.')}
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
