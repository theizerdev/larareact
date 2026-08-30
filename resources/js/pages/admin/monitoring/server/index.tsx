import { Head } from '@inertiajs/react';
import {
    Server,
    Activity,
    HardDrive,
    Cpu,
    RefreshCw,
    Terminal,
    Network,
    Info,
    Clock,
    Layers,
    ArrowDownRight,
    ArrowUpRight,
    CheckCircle2,
    AlertTriangle,
    XCircle,
} from 'lucide-react';
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
    kernel?: string;
    php_version: string;
    laravel_version: string;
    software: string;
    disk_total_gb: number;
    disk_used_gb: number;
    disk_used_percent: number;
    disk_free_gb?: number;
    hostname: string;
    uptime?: string;
    cpu_model?: string;
    cpu_cores?: number;
}

interface PageProps {
    serverInfo: ServerInfo;
}

interface LogEntry {
    time: string;
    full_date?: string;
    level: string;
    message: string;
}

interface LiveMetrics {
    timestamp: string;
    cpu_usage: number;
    ram_used_percent: number;
    ram_used_gb: number;
    ram_total_gb: number;
    ram_free_gb?: number;
    disk_used_percent?: number;
    disk_used_gb?: number;
    disk_total_gb?: number;
    disk_free_gb?: number;
    network_in_mbps: number;
    network_out_mbps: number;
    network_rx_total_mb?: number;
    network_tx_total_mb?: number;
    load_average: number[];
    recent_logs: LogEntry[];
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
                setTimeLabels((prev) => [...prev.slice(1), data.timestamp || new Date().toLocaleTimeString()]);
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
    const lineChartOptions: any = {
        chart: {
            id: 'live-system-resources',
            animations: {
                enabled: true,
                easing: 'linear' as const,
                dynamicAnimation: {
                    speed: 1000,
                },
            },
            toolbar: { show: false },
            zoom: { enabled: false },
        },
        colors: ['#ef4444', '#3b82f6'], // Rojo para CPU, Azul para RAM
        stroke: { curve: 'smooth' as const, width: 3 },
        grid: {
            borderColor: 'rgba(163, 163, 163, 0.1)',
            strokeDashArray: 4,
        },
        xaxis: {
            categories: timeLabels,
            labels: {
                show: true,
                style: { colors: '#94a3b8', fontSize: '10px' },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            min: 0,
            max: 100,
            labels: {
                style: { colors: '#94a3b8' },
                formatter: (val: number) => `${Math.round(val)}%`,
            },
        },
        legend: {
            position: 'top' as const,
            labels: { colors: '#94a3b8' },
        },
        tooltip: { theme: 'dark' as const },
    };

    const lineChartSeries = [
        {
            name: __('Uso de CPU (%)'),
            data: cpuHistory,
        },
        {
            name: __('Uso de RAM (%)'),
            data: ramHistory,
        },
    ];

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Monitoring'), href: '#' },
        { title: __('Server'), href: '/admin/monitoring/server' },
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
                            {__('Telemetría en tiempo real 100% extraída del sistema operativo Linux y PHP.')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={fetchMetrics}
                            variant="outline"
                            size="sm"
                            className="gap-2 shrink-0 self-start md:self-auto"
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            {__('Refrescar')}
                        </Button>
                    </div>
                </div>

                {/* Resumen Cards con Datos 100% Reales */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* SO & Hostname */}
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                {__('Sistema Operativo')}
                            </CardTitle>
                            <Info className="h-5 w-5 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold truncate text-foreground" title={serverInfo.os}>
                                {serverInfo.os}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1.5">
                                <span>Host: {serverInfo.hostname}</span>
                                {serverInfo.uptime && (
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <Clock className="size-3" /> {serverInfo.uptime}
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Software, PHP y Núcleos */}
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                {__('Software & Entorno')}
                            </CardTitle>
                            <Terminal className="h-5 w-5 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-foreground">
                                PHP {serverInfo.php_version}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5 flex items-center justify-between">
                                <span>Laravel {serverInfo.laravel_version}</span>
                                {serverInfo.cpu_cores && (
                                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                        {serverInfo.cpu_cores} Cores
                                    </span>
                                )}
                            </p>
                        </CardContent>
                    </Card>

                    {/* CPU & Load Average Real */}
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                {__('CPU & Carga')}
                            </CardTitle>
                            <Cpu className="h-5 w-5 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between">
                                <div className="text-2xl font-black tabular-nums text-foreground">
                                    {metrics ? `${metrics.cpu_usage}%` : '--%'}
                                </div>
                                <span className="text-[11px] font-mono text-muted-foreground">
                                    Load: {metrics ? metrics.load_average.join(' · ') : '--'}
                                </span>
                            </div>
                            <div className="mt-2">
                                <Progress
                                    value={metrics?.cpu_usage ?? 0}
                                    className="h-1.5 bg-muted"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Memoria RAM Real */}
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                {__('Memoria RAM')}
                            </CardTitle>
                            <Activity className="h-5 w-5 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between">
                                <div className="text-2xl font-black tabular-nums text-foreground">
                                    {metrics ? `${metrics.ram_used_percent}%` : '--%'}
                                </div>
                                <span className="text-xs font-semibold text-muted-foreground">
                                    {metrics ? `${metrics.ram_used_gb} GB / ${metrics.ram_total_gb} GB` : '-- / --'}
                                </span>
                            </div>
                            <div className="mt-2">
                                <Progress
                                    value={metrics?.ram_used_percent ?? 0}
                                    className="h-1.5 bg-muted"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Graficos y Telemetría en Vivo */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <Activity className="h-5 w-5 text-indigo-500" />
                                {__('Carga de Recursos del Sistema (CPU & RAM)')}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {__('Historial dinámico en tiempo real (mediciones extraídas directamente del kernel cada 3s).')}
                            </CardDescription>
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

                    {/* Almacenamiento Real */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <HardDrive className="h-5 w-5 text-blue-500" />
                                {__('Almacenamiento en Disco')}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {__('Partición principal del servidor web.')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-semibold">
                                    <span className="text-muted-foreground">{__('Disco Usado:')}</span>
                                    <span>
                                        {metrics?.disk_used_gb ?? serverInfo.disk_used_gb} GB (
                                        {metrics?.disk_used_percent ?? serverInfo.disk_used_percent}%)
                                    </span>
                                </div>
                                <Progress
                                    value={metrics?.disk_used_percent ?? serverInfo.disk_used_percent}
                                    className="h-3"
                                />
                            </div>

                            <div className="pt-4 border-t space-y-2.5 text-xs">
                                <div className="flex justify-between font-medium">
                                    <span className="text-muted-foreground">{__('Espacio Libre:')}</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                        {metrics?.disk_free_gb ?? serverInfo.disk_free_gb ?? roundGb(serverInfo.disk_total_gb - serverInfo.disk_used_gb)} GB
                                    </span>
                                </div>
                                <div className="flex justify-between font-medium">
                                    <span className="text-muted-foreground">{__('Capacidad Total:')}</span>
                                    <span className="font-bold text-foreground">{serverInfo.disk_total_gb} GB</span>
                                </div>
                                {serverInfo.cpu_model && (
                                    <div className="pt-2 border-t text-[11px] text-muted-foreground truncate" title={serverInfo.cpu_model}>
                                        CPU: {serverInfo.cpu_model}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Ancho de Banda y Logs Reales */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Ancho de Banda Real */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <Network className="h-5 w-5 text-blue-500" />
                                {__('Ancho de Banda (Red)')}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {__('Tasa de transferencia en tiempo real e historial acumulado.')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center p-3 border rounded-xl bg-card">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                        <ArrowDownRight className="size-3.5 text-emerald-500" />
                                        {__('Velocidad de Entrada (RX)')}
                                    </p>
                                    <p className="text-xl font-black tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                                        {metrics ? `${metrics.network_in_mbps} Mbps` : '-- Mbps'}
                                    </p>
                                    {metrics?.network_rx_total_mb !== undefined && (
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            Total: {metrics.network_rx_total_mb.toLocaleString()} MB
                                        </p>
                                    )}
                                </div>
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            </div>

                            <div className="flex justify-between items-center p-3 border rounded-xl bg-card">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                        <ArrowUpRight className="size-3.5 text-indigo-500" />
                                        {__('Velocidad de Salida (TX)')}
                                    </p>
                                    <p className="text-xl font-black tabular-nums text-indigo-600 dark:text-indigo-400 mt-0.5">
                                        {metrics ? `${metrics.network_out_mbps} Mbps` : '-- Mbps'}
                                    </p>
                                    {metrics?.network_tx_total_mb !== undefined && (
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            Total: {metrics.network_tx_total_mb.toLocaleString()} MB
                                        </p>
                                    )}
                                </div>
                                <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Logs Reales de Laravel */}
                    <Card className="md:col-span-2 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <Terminal className="h-5 w-5 text-rose-500" />
                                {__('Logs Reales de la Aplicación')}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {__('Últimos registros del sistema extraídos de storage/logs/laravel.log.')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2.5 font-mono text-xs max-h-[300px] overflow-y-auto pr-1">
                                {metrics?.recent_logs.map((log, idx) => (
                                    <div
                                        key={idx}
                                        className="p-2.5 border rounded-lg bg-muted/30 flex items-start gap-2.5 hover:bg-muted/50 transition-colors"
                                    >
                                        <span className="text-muted-foreground shrink-0 font-sans text-[11px]">
                                            {log.time}
                                        </span>
                                        <Badge
                                            variant={log.level === 'error' ? 'destructive' : log.level === 'warning' ? 'outline' : 'secondary'}
                                            className={`uppercase text-[9px] px-1.5 py-0 shrink-0 font-bold ${
                                                log.level === 'warning' ? 'border-amber-500 text-amber-600 dark:text-amber-400' : ''
                                            }`}
                                        >
                                            {log.level}
                                        </Badge>
                                        <span className="text-foreground break-all text-[11px] leading-relaxed">
                                            {log.message}
                                        </span>
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
