import { Head } from '@inertiajs/react';
import { Server, Activity, HardDrive, Cpu, RefreshCw, Terminal, Network, Info } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTranslate } from '@/hooks/use-translate';

interface ServerInfo {
    os: string;
    php_version: string;
    laravel_version: string;
    software: string;
    disk_total_gb: number;
    disk_used_gb: number;
    disk_used_percent: number;
    hostname: string;
}

interface PageProps {
    serverInfo: ServerInfo;
}

interface LiveMetrics {
    timestamp: string;
    cpu_usage: number;
    ram_used_percent: number;
    ram_used_gb: number;
    ram_total_gb: number;
    network_in_mbps: number;
    network_out_mbps: number;
    load_average: number[];
    recent_logs: Array<{
        time: string;
        level: string;
        message: string;
    }>;
}

export default function ServerMonitoring({ serverInfo }: PageProps) {
    const { __ } = useTranslate();
    const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
    const [cpuHistory, setCpuHistory] = useState<number[]>(Array(15).fill(0));
    const [ramHistory, setRamHistory] = useState<number[]>(Array(15).fill(0));
    const [timeLabels, setTimeLabels] = useState<string[]>(Array(15).fill(''));
    const [loading, setLoading] = useState(false);

    const fetchMetrics = async () => {
        try {
            setLoading(true);
            const res = await fetch('/admin/monitoring/server/metrics');

            if (res.ok) {
                const data: LiveMetrics = await res.json();
                setMetrics(data);
                
                // Actualizar historial de CPU
                setCpuHistory((prev) => [...prev.slice(1), data.cpu_usage]);

                // Actualizar historial de RAM
                setRamHistory((prev) => [...prev.slice(1), data.ram_used_percent]);

                // Actualizar etiquetas de tiempo
                setTimeLabels((prev) => [...prev.slice(1), new Date().toLocaleTimeString()]);
            }
        } catch (err) {
            console.error('Error fetching live server metrics:', err);
        } finally {
            setLoading(false);
        }
    };

    // Polling en vivo cada 3 segundos
    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 3000);

        return () => clearInterval(interval);
    }, []);

    // Opciones del gráfico de línea en vivo (CPU & RAM)
    const lineChartOptions = {
        chart: {
            id: 'live-system-resources',
            animations: {
                enabled: true,
                easing: 'linear',
                dynamicAnimation: {
                    speed: 1000
                }
            },
            toolbar: { show: false },
            zoom: { enabled: false }
        },
        colors: ['#ef4444', '#3b82f6'], // Rojo para CPU, Azul para RAM
        stroke: { curve: 'smooth', width: 3 },
        grid: {
            borderColor: 'rgba(163, 163, 163, 0.1)',
            strokeDashArray: 4
        },
        xaxis: {
            categories: timeLabels,
            labels: {
                show: true,
                style: { colors: '#94a3b8', fontSize: '10px' }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            min: 0,
            max: 100,
            labels: {
                style: { colors: '#94a3b8' },
                formatter: (val: number) => `${Math.round(val)}%`
            }
        },
        legend: {
            position: 'top',
            labels: { colors: '#94a3b8' }
        },
        tooltip: { theme: 'dark' }
    };

    const lineChartSeries = [
        {
            name: __('Uso de CPU'),
            data: cpuHistory
        },
        {
            name: __('Uso de RAM'),
            data: ramHistory
        }
    ];

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Monitoring'), href: '#' },
        { title: __('Server'), href: '/admin/monitoring/server' }
    ];

    return (
        <>
            <Head title={__('Server Monitoring')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Server className="h-8 w-8 text-rose-600" />
                            {__('Server Monitoring')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {__('Monitor CPU consumption, RAM memory, network speed, system logs, and storage in real-time.')}
                        </p>
                    </div>
                    <Button 
                        onClick={fetchMetrics} 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 shrink-0 self-start md:self-auto"
                        disabled={loading}
                    >
                        <RefreshCw className="h-4 w-4" />
                        {__('Refrescar')}
                    </Button>
                </div>

                {/* Resumen Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">{__('Sistema Operativo')}</CardTitle>
                            <Info className="h-5 w-5 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{serverInfo.os}</div>
                            <p className="text-xs text-muted-foreground mt-1">Host: {serverInfo.hostname}</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">{__('Software & PHP')}</CardTitle>
                            <Terminal className="h-5 w-5 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">PHP {serverInfo.php_version}</div>
                            <p className="text-xs text-muted-foreground mt-1">Laravel {serverInfo.laravel_version}</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">{__('CPU & Carga (Load Avg)')}</CardTitle>
                            <Cpu className="h-5 w-5 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {metrics ? `${metrics.cpu_usage}%` : '--%'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {__('Promedio:')} {metrics ? metrics.load_average.join(' | ') : '--'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">{__('Memoria RAM')}</CardTitle>
                            <Activity className="h-5 w-5 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {metrics ? `${metrics.ram_used_gb} GB / ${metrics.ram_total_gb} GB` : '-- / --'}
                            </div>
                            <div className="mt-2">
                                <Progress 
                                    value={metrics?.ram_used_percent ?? 0} 
                                    className="h-1.5" 
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>


                {/* Graficos y Telemetría en Vivo */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-indigo-500" />
                                {__('Carga de Recursos del Sistema (CPU & RAM)')}
                            </CardTitle>
                            <CardDescription>{__('Historial de consumo activo en vivo de CPU y Memoria (3s de refresco).')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Chart 
                                options={lineChartOptions} 
                                series={lineChartSeries} 
                                type="line" 
                                height={280} 
                            />
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HardDrive className="h-5 w-5 text-blue-500" />
                                {__('Almacenamiento en Disco')}
                            </CardTitle>
                            <CardDescription>{__('Distribución física del disco principal.')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{__('Disco Usado:')}</span>
                                    <span className="font-semibold">{serverInfo.disk_used_gb} GB ({serverInfo.disk_used_percent}%)</span>
                                </div>
                                <Progress value={serverInfo.disk_used_percent} className="h-3" />
                            </div>

                            <div className="pt-4 border-t space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{__('Espacio Libre:')}</span>
                                    <span>{roundGb(serverInfo.disk_total_gb - serverInfo.disk_used_gb)} GB</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{__('Espacio Total:')}</span>
                                    <span>{serverInfo.disk_total_gb} GB</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Ancho de Banda y Logs */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Network className="h-5 w-5 text-blue-500" />
                                {__('Ancho de Banda (Red)')}
                            </CardTitle>
                            <CardDescription>{__('Velocidad de carga y descarga de red en tiempo real.')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex justify-between items-center p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                <div>
                                    <p className="text-xs text-muted-foreground">{__('Velocidad de Entrada')}</p>
                                    <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                        {metrics ? `${metrics.network_in_mbps} Mbps` : '-- Mbps'}
                                    </p>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            </div>

                            <div className="flex justify-between items-center p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                <div>
                                    <p className="text-xs text-muted-foreground">{__('Velocidad de Salida')}</p>
                                    <p className="text-xl font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                                        {metrics ? `${metrics.network_out_mbps} Mbps` : '-- Mbps'}
                                    </p>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Terminal className="h-5 w-5 text-rose-500" />
                                {__('Logs de Actividad del Servidor')}
                            </CardTitle>
                            <CardDescription>{__('Últimas acciones y eventos de logs registrados en el sistema.')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 font-mono text-xs">
                                {metrics?.recent_logs.map((log, idx) => (
                                    <div key={idx} className="p-2.5 border rounded bg-slate-50 dark:bg-slate-900/60 flex items-start gap-3">
                                        <span className="text-muted-foreground shrink-0">{log.time}</span>
                                        <Badge 
                                            variant={log.level === 'warning' ? 'destructive' : 'secondary'}
                                            className="uppercase text-[9px] px-1 py-0"
                                        >
                                            {log.level}
                                        </Badge>
                                        <span className="text-slate-800 dark:text-slate-200">{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function roundGb(val: number) {
    return Math.max(0, parseFloat(val.toFixed(2)));
}
