import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Database, Activity, HardDrive, Hash, ShieldAlert, Cpu, RefreshCw, Layers } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/breadcrumbs';
import Chart from 'react-apexcharts';

interface TableInfo {
    name: string;
    rows: number;
    size_mb: number;
}

interface DbInfo {
    connection: string;
    driver: string;
    version: string;
    total_tables: number;
    total_size_mb: number;
    total_rows: number;
    tables: TableInfo[];
}

interface PageProps {
    dbInfo: DbInfo;
}

interface LiveMetrics {
    queries_per_second: number;
    active_connections: number;
    max_connections: number;
    cache_hit_rate: number;
    query_types: {
        select: number;
        insert: number;
        update: number;
        delete: number;
    };
    slow_queries: Array<{
        query: string;
        duration: string;
        time: string;
    }>;
    active_processes: Array<{
        id: number;
        user: string;
        host: string;
        db: string;
        command: string;
        time: number;
        state: string;
        info: string;
    }>;
}

export default function DatabaseMonitoring({ dbInfo }: PageProps) {
    const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
    const [qpsHistory, setQpsHistory] = useState<number[]>(Array(15).fill(0));
    const [timeLabels, setTimeLabels] = useState<string[]>(Array(15).fill(''));
    const [loading, setLoading] = useState(false);

    const fetchMetrics = async () => {
        try {
            const res = await fetch('/admin/monitoring/database/metrics');
            if (res.ok) {
                const data: LiveMetrics = await res.json();
                setMetrics(data);
                
                // Actualizar historial de Consultas por Segundo (QPS)
                setQpsHistory((prev) => {
                    const next = [...prev.slice(1), data.queries_per_second];
                    return next;
                });

                setTimeLabels((prev) => {
                    const next = [...prev.slice(1), new Date().toLocaleTimeString()];
                    return next;
                });
            }
        } catch (err) {
            console.error('Error fetching live DB metrics:', err);
        }
    };

    // Polling en vivo cada 3 segundos
    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 3000);
        return () => clearInterval(interval);
    }, []);

    // Opciones del gráfico de línea en vivo (QPS)
    const lineChartOptions = {
        chart: {
            id: 'live-qps',
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
        colors: ['#6366f1'],
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
            max: 120,
            labels: {
                style: { colors: '#94a3b8' }
            }
        },
        tooltip: { theme: 'dark' }
    };

    const lineChartSeries = [
        {
            name: 'Consultas / Seg',
            data: qpsHistory
        }
    ];

    // Opciones del gráfico de dona (Distribución de Queries)
    const donutChartOptions = {
        labels: ['Select', 'Insert', 'Update', 'Delete'],
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        legend: {
            position: 'bottom',
            labels: { colors: '#94a3b8' }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total Queries',
                            color: '#94a3b8',
                            formatter: () => {
                                if (!metrics) return '0';
                                const qt = metrics.query_types;
                                return String(qt.select + qt.insert + qt.update + qt.delete);
                            }
                        }
                    }
                }
            }
        },
        dataLabels: { enabled: false },
        tooltip: { theme: 'dark' }
    };

    const donutChartSeries = metrics
        ? [
              metrics.query_types.select,
              metrics.query_types.insert,
              metrics.query_types.update,
              metrics.query_types.delete
          ]
        : [0, 0, 0, 0];

    const breadcrumbs = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Monitoreo', href: '#' },
        { title: 'Base de Datos', href: '/admin/monitoring/database' }
    ];

    return (
        <>
            <Head title="Monitoreo de Base de Datos" />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Database className="h-8 w-8 text-indigo-600" />
                            Monitoreo de Base de Datos
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Visualiza métricas del motor SQL, consultas en vivo, logs lentos y optimización de almacenamiento.
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
                        Refrescar
                    </Button>
                </div>

                {/* Resumen Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Motor & Versión</CardTitle>
                            <Cpu className="h-5 w-5 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold capitalize">{dbInfo.driver}</div>
                            <p className="text-xs text-muted-foreground mt-1">Versión {dbInfo.version}</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Tamaño Total</CardTitle>
                            <HardDrive className="h-5 w-5 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dbInfo.total_size_mb} MB</div>
                            <p className="text-xs text-muted-foreground mt-1">Espacio de almacenamiento ocupado</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Tablas del Sistema</CardTitle>
                            <Layers className="h-5 w-5 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dbInfo.total_tables}</div>
                            <p className="text-xs text-muted-foreground mt-1">{dbInfo.total_rows.toLocaleString()} filas registradas</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Conexiones</CardTitle>
                            <Activity className="h-5 w-5 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {metrics?.active_connections ?? '--'} / {metrics?.max_connections ?? '--'}
                            </div>
                            <div className="mt-2">
                                <Progress 
                                    value={metrics ? (metrics.active_connections / metrics.max_connections) * 100 : 0} 
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
                                Consultas por Segundo (QPS)
                            </CardTitle>
                            <CardDescription>Carga transaccional actual en tiempo real (3s de refresco).</CardDescription>
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
                                <Hash className="h-5 w-5 text-blue-500" />
                                Distribución de Consultas
                            </CardTitle>
                            <CardDescription>Estadística del tipo de operaciones ejecutadas.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col justify-between h-[300px]">
                            <div className="pt-2">
                                <Chart 
                                    options={donutChartOptions} 
                                    series={donutChartSeries} 
                                    type="donut" 
                                    height={230} 
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detalle Radix UI Tabs */}
                <Tabs defaultValue="tables" className="w-full">
                    <TabsList className="grid grid-cols-3 max-w-[480px]">
                        <TabsTrigger value="tables">Tablas y Tamaño</TabsTrigger>
                        <TabsTrigger value="processes">Procesos Activos</TabsTrigger>
                        <TabsTrigger value="slow-queries">Slow Queries</TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Tablas y filas */}
                    <TabsContent value="tables" className="mt-4">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Tamaño de Tablas y Almacenamiento</CardTitle>
                                <CardDescription>Listado y volumen físico de datos por cada tabla en la BD.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nombre de la Tabla</TableHead>
                                            <TableHead className="text-right">Filas Estimadas</TableHead>
                                            <TableHead className="text-right">Tamaño Físico (MB)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dbInfo.tables.map((t, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-mono font-medium text-slate-800 dark:text-slate-200">
                                                    {t.name}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {t.rows.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums text-indigo-600 font-semibold">
                                                    {t.size_mb.toFixed(2)} MB
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab 2: Procesos activos */}
                    <TabsContent value="processes" className="mt-4">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Lista de Procesos (Threads)</CardTitle>
                                <CardDescription>Conexiones activas actualmente procesadas por la base de datos.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-16">ID</TableHead>
                                            <TableHead>Usuario</TableHead>
                                            <TableHead>Host</TableHead>
                                            <TableHead>Comando</TableHead>
                                            <TableHead className="text-right">Tiempo (s)</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="max-w-[300px] truncate">Query</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {metrics?.active_processes.map((p, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-mono text-xs">{p.id}</TableCell>
                                                <TableCell className="font-medium">{p.user}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs">{p.host}</TableCell>
                                                <TableCell>
                                                    <Badge variant={p.command === 'Query' ? 'default' : 'secondary'}>
                                                        {p.command}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums font-mono text-xs">{p.time}</TableCell>
                                                <TableCell className="text-xs text-slate-600">{p.state || 'idle'}</TableCell>
                                                <TableCell className="font-mono text-xs max-w-[300px] truncate text-slate-700 dark:text-slate-300" title={p.info}>
                                                    {p.info || <span className="italic text-muted-foreground">Ninguno</span>}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab 3: Consultas lentas */}
                    <TabsContent value="slow-queries" className="mt-4">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShieldAlert className="h-5 w-5 text-amber-500" />
                                    Registro de Slow Queries
                                </CardTitle>
                                <CardDescription>Alertas de consultas que exceden el tiempo óptimo de respuesta (100ms).</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {metrics?.slow_queries.map((q, idx) => (
                                        <div key={idx} className="p-4 border rounded-lg bg-red-50/50 dark:bg-red-950/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-1 max-w-[70%]">
                                                <p className="font-mono text-xs bg-white dark:bg-slate-900 p-2.5 rounded border overflow-x-auto text-red-800 dark:text-red-300">
                                                    {q.query}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Ejecutado a las {q.time}</p>
                                            </div>
                                            <div className="flex gap-2 self-start md:self-auto items-center">
                                                <span className="text-xs text-muted-foreground">Duración:</span>
                                                <Badge variant="destructive" className="font-mono text-xs">
                                                    {q.duration}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
