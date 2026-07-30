import { Head, router } from '@inertiajs/react';
import {
    Activity,
    ArrowUpRight,
    Calendar,
    CheckCircle2,
    Clock,
    Coins,
    CreditCard,
    DollarSign,
    Lock,
    RefreshCw,
    ShoppingBag,
    ShoppingCart,
    TrendingUp,
    User,
    Wallet,
    Trophy,
    BarChart2,
    ListOrdered
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { OpenCashRegisterModal } from '@/components/open-cash-register-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Switch } from '@/components/ui/switch';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';

interface TodayStats {
    total_mxn: number;
    total_usd: number;
    count: number;
    avg_ticket: number;
}

interface RegisterSummary {
    id: number;
    opened_at: string;
    opening_amount: number;
    inflows: number;
    outflows: number;
    expected_balance: number;
    expected_usd: number;
    by_payment_method: Record<string, { net: number }>;
}

interface TopItem {
    rank: number;
    nombre: string;
    total_qty: number;
    total_amount: number;
    percent_of_max: number;
}

interface Props {
    currencySymbol?: string;
    currencyCode?: string;
    valorDolar: number;
    filters: {
        start_date: string;
        end_date: string;
    };
    todayStats: TodayStats;
    rangeStats: {
        total: number;
        count: number;
    };
    registerSummary: RegisterSummary | null;
    charts: {
        trend: {
            categories: string[];
            totals: number[];
            orders: number[];
        };
        payments: {
            labels: string[];
            series: number[];
        };
        topItems: {
            categories: string[];
            series: number[];
            amounts?: number[];
            list?: TopItem[];
        };
    };
    recentSales: Array<{
        id: number;
        codigo_ticket: string;
        cliente_nombre: string;
        metodo_pago: string;
        total: number;
        created_at: string;
    }>;
}

export default function AdminDashboard({
    currencySymbol = '$',
    currencyCode = 'MXN',
    valorDolar = 20.0,
    filters,
    todayStats,
    rangeStats,
    registerSummary,
    charts,
    recentSales,
}: Props) {
    const { __ } = useTranslate();
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [topItemsTab, setTopItemsTab] = useState<'ranking' | 'chart'>('ranking');

    // Live Auto Refresh (Polling every 10 seconds)
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            router.reload({
                preserveScroll: true,
                preserveState: true,
            });
        }, 10000);

        return () => clearInterval(interval);
    }, [autoRefresh]);

    const handleManualRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            preserveScroll: true,
            onFinish: () => setIsRefreshing(false),
        });
    };

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/dashboard', { start_date: startDate, end_date: endDate }, { preserveState: true });
    };

    const formatLocalDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const applyQuickRange = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
        const today = new Date();
        let start = new Date();

        if (preset === 'today') {
            start = new Date(today);
        } else if (preset === 'yesterday') {
            start.setDate(today.getDate() - 1);
            const yestStr = formatLocalDate(start);
            setStartDate(yestStr);
            setEndDate(yestStr);
            router.get('/admin/dashboard', { start_date: yestStr, end_date: yestStr }, { preserveState: true });
            return;
        } else if (preset === 'week') {
            start.setDate(today.getDate() - 6);
        } else if (preset === 'month') {
            start.setDate(1);
        }

        const startStr = formatLocalDate(start);
        const endStr = formatLocalDate(today);
        setStartDate(startStr);
        setEndDate(endStr);
        router.get('/admin/dashboard', { start_date: startStr, end_date: endStr }, { preserveState: true });
    };

    // ApexCharts Configurations
    const trendChartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'area',
            toolbar: { show: false },
            zoom: { enabled: false },
            fontFamily: 'inherit',
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        colors: ['#4f46e5', '#10b981'],
        xaxis: { categories: charts.trend.categories },
        yaxis: [
            {
                min: 0,
                forceNiceScale: true,
                labels: {
                    formatter: (val) => `${currencySymbol}${Math.round(val)}`,
                },
                title: { text: `Ventas (${currencyCode})` },
            },
        ],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
            },
        },
        tooltip: { y: { formatter: (val) => `${currencySymbol}${val.toFixed(2)} ${currencyCode}` } },
    };

    const trendChartSeries = [
        { name: `Ventas (${currencySymbol} ${currencyCode})`, data: charts.trend.totals },
    ];

    const paymentChartOptions: ApexCharts.ApexOptions = {
        chart: { type: 'donut', fontFamily: 'inherit' },
        labels: charts.payments.labels,
        colors: ['#10b981', '#059669', '#3b82f6', '#8b5cf6', '#f59e0b'],
        legend: { position: 'bottom' },
        dataLabels: { enabled: true },
        tooltip: { y: { formatter: (val) => `${currencySymbol}${val.toFixed(2)} ${currencyCode}` } },
    };

    const topItemsChartOptions: ApexCharts.ApexOptions = {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 8,
                barHeight: '60%',
                distributed: true,
            },
        },
        colors: ['#6366f1', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'],
        xaxis: {
            categories: charts.topItems.categories,
            labels: {
                style: {
                    fontSize: '11px',
                    fontWeight: 600,
                },
            },
        },
        yaxis: {
            labels: {
                style: {
                    fontSize: '12px',
                    fontWeight: 700,
                },
            },
        },
        dataLabels: {
            enabled: true,
            formatter: (val) => `${val} unids.`,
            style: {
                fontSize: '11px',
                fontWeight: 'bold',
            },
        },
        tooltip: {
            y: {
                formatter: (val: number, opt?: { dataPointIndex: number }) => {
                    const idx = opt?.dataPointIndex ?? 0;
                    const amount = charts.topItems.amounts?.[idx];
                    const amountStr = amount !== undefined ? ` · Total: ${currencySymbol}${amount.toFixed(2)} ${currencyCode}` : '';
                    return `${val} ${__('unidades vendidas')}${amountStr}`;
                },
            },
        },
        legend: { show: false },
    };

    const topItemsChartSeries = [
        { name: 'Unidades Vendidas', data: charts.topItems.series },
    ];

    return (
        <>
            <Head title={__('Dashboard en Vivo - Panel General')} />
            <OpenCashRegisterModal />

            <div className="flex flex-col gap-6">
                {/* ENCABEZADO Y CONTROLES EN VIVO */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            {__('Panel de Control y Analíticas en Vivo')}
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {__('Monitoreo en tiempo real de ventas, cobros en dólares y estado de caja.')}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl font-mono text-xs font-bold shadow-2xs">
                            <Coins className="w-4 h-4 text-emerald-600" />
                            <span>$1 USD = {currencySymbol}{valorDolar.toFixed(2)} {currencyCode}</span>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border">
                            <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                            <Label htmlFor="auto-refresh" className="text-xs font-bold cursor-pointer flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                {__('En Vivo (10s)')}
                            </Label>
                        </div>

                        <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={isRefreshing} className="gap-1.5 font-bold text-xs">
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {__('Actualizar')}
                        </Button>
                    </div>
                </div>

                {/* SECCIÓN 1: LO GENERADO EL DÍA DE HOY */}
                <div className="space-y-2">
                    <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        {__('Generado Hoy')} ({new Date().toLocaleDateString()})
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50/50 to-white shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">{__('Total Recaudado Hoy')}</CardTitle>
                                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black font-mono text-emerald-700">
                                    {currencySymbol}{todayStats.total_mxn.toFixed(2)} <span className="text-xs font-sans text-muted-foreground">{currencyCode}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 font-mono">
                                    ≈ ${valorDolar > 0 ? (todayStats.total_mxn / valorDolar).toFixed(2) : '0.00'} USD
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-50/50 to-white shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">{__('Cobrado en Dólares (USD)')}</CardTitle>
                                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                                    <Coins className="w-5 h-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black font-mono text-indigo-700">
                                    💵 ${todayStats.total_usd.toFixed(2)} <span className="text-xs font-sans text-muted-foreground">USD</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 font-mono">Recibido en billetes hoy</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">{__('Ventas Completadas')}</CardTitle>
                                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black font-mono">{todayStats.count} <span className="text-xs font-sans text-muted-foreground">{__('tickets')}</span></div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">{__('Ticket Promedio')}</CardTitle>
                                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black font-mono text-purple-700">{currencySymbol}{todayStats.avg_ticket.toFixed(2)}</div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* SECCIÓN 2: ESTADO DE LA CAJA */}
                <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b pb-3">
                        <Wallet className="w-5 h-5 text-amber-600" />
                        <h3 className="font-extrabold text-base text-slate-900">{__('Estado del Turno de Caja')}</h3>
                        {registerSummary ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                {__('Caja Abierta')}
                            </Badge>
                        ) : (
                            <Badge variant="destructive">
                                <Lock className="w-3.5 h-3.5 mr-1" />
                                {__('Sin Caja Abierta')}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* SECCIÓN 3: FILTRO DE FECHAS */}
                <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{__('Filtro de Período')}</h3>
                        </div>

                        {/* Botones de Selección Rápida */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => applyQuickRange('today')}
                                className="text-xs font-semibold"
                            >
                                {__('Hoy')}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => applyQuickRange('yesterday')}
                                className="text-xs font-semibold"
                            >
                                {__('Ayer')}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => applyQuickRange('week')}
                                className="text-xs font-semibold"
                            >
                                {__('Últimos 7 días')}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => applyQuickRange('month')}
                                className="text-xs font-semibold"
                            >
                                {__('Este Mes')}
                            </Button>
                        </div>
                    </div>

                    <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-3 border-t">
                        <div className="space-y-1.5">
                            <Label htmlFor="start_date" className="text-xs font-semibold text-muted-foreground">
                                {__('Fecha Inicio')}
                            </Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="end_date" className="text-xs font-semibold text-muted-foreground">
                                {__('Fecha Fin')}
                            </Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                                {__('Filtrar Período')}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* SECCIÓN 4: GRÁFICAS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 shadow-xs">
                        <CardHeader>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-indigo-600" />
                                {__('Tendencia de Ventas')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Chart options={trendChartOptions} series={trendChartSeries} type="area" height={300} />
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs">
                        <CardHeader>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-emerald-600" />
                                {__('Ventas por Método de Pago')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Chart options={paymentChartOptions} series={charts.payments.series} type="donut" height={300} />
                        </CardContent>
                    </Card>
                </div>

                {/* SECCIÓN 5: TOP PRODUCTOS VENDIDOS Y ÚLTIMAS VENTAS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Trophy className="w-4.5 h-4.5 text-amber-500" />
                                    {__('Top 5 Productos Vendidos')}
                                </CardTitle>
                                <CardDescription>{__('Artículos con mayor demanda e ingresos.')}</CardDescription>
                            </div>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border">
                                <button
                                    type="button"
                                    onClick={() => setTopItemsTab('ranking')}
                                    className={cn(
                                        "px-2 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1",
                                        topItemsTab === 'ranking' ? "bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-400" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <ListOrdered className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTopItemsTab('chart')}
                                    className={cn(
                                        "px-2 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1",
                                        topItemsTab === 'chart' ? "bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-400" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <BarChart2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                            {charts.topItems.series.length > 0 ? (
                                topItemsTab === 'chart' ? (
                                    <Chart options={topItemsChartOptions} series={topItemsChartSeries} type="bar" height={285} />
                                ) : (
                                    <div className="space-y-2.5 min-h-[285px] flex flex-col justify-center">
                                        {charts.topItems.list?.map((item) => (
                                            <div
                                                key={item.rank}
                                                className="p-3 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-2 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-2xs"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span className={cn(
                                                            "w-6.5 h-6.5 rounded-full flex items-center justify-center text-xs font-black shrink-0 font-mono shadow-2xs",
                                                            item.rank === 1 ? "bg-amber-400 text-amber-950 ring-2 ring-amber-300/60" :
                                                            item.rank === 2 ? "bg-slate-300 text-slate-950 ring-2 ring-slate-200/60" :
                                                            item.rank === 3 ? "bg-amber-700 text-amber-100 ring-2 ring-amber-600/60" :
                                                            "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                                        )}>
                                                            {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : item.rank}
                                                        </span>
                                                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate" title={item.nombre}>
                                                            {item.nombre}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <Badge variant="outline" className="text-[10px] font-mono font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80">
                                                            {item.total_qty} {__('unids.')}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-[10px] font-mono font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80">
                                                            {currencySymbol}{item.total_amount.toFixed(2)}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {/* Visual Demand Progress Bar */}
                                                <div className="w-full bg-slate-200/70 dark:bg-slate-700/70 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-500",
                                                            item.rank === 1 ? "bg-gradient-to-r from-amber-400 to-amber-500" :
                                                            item.rank === 2 ? "bg-gradient-to-r from-indigo-500 to-purple-500" :
                                                            item.rank === 3 ? "bg-gradient-to-r from-blue-500 to-cyan-500" :
                                                            "bg-gradient-to-r from-emerald-500 to-teal-500"
                                                        )}
                                                        style={{ width: `${item.percent_of_max}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="h-[285px] flex items-center justify-center text-muted-foreground text-sm font-medium">
                                    {__('Sin ventas de productos.')}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4 text-emerald-600" />
                                    {__('Últimas Ventas Procesadas')}
                                </CardTitle>
                                <CardDescription>{__('Transacciones recientemente cobradas en la terminal.')}</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => router.get('/admin/ventas')} className="text-xs font-bold">
                                {__('Ver todas las ventas')}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-bold text-muted-foreground">
                                        <tr>
                                            <th className="py-2.5 px-3">{__('Ticket')}</th>
                                            <th className="py-2.5 px-3">{__('Cliente')}</th>
                                            <th className="py-2.5 px-3">{__('Método')}</th>
                                            <th className="py-2.5 px-3 text-right">{__('Total')} ({currencySymbol} {currencyCode})</th>
                                            <th className="py-2.5 px-3 text-center">{__('Hora')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y font-medium">
                                        {recentSales.length > 0 ? (
                                            recentSales.map((sale) => (
                                                <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{sale.codigo_ticket}</td>
                                                    <td className="py-2.5 px-3">{sale.cliente_nombre}</td>
                                                    <td className="py-2.5 px-3 capitalize">
                                                        <Badge variant="outline" className="text-[10px] font-bold">
                                                            {sale.metodo_pago === 'dolar' ? '💵 Dólares (USD)' : sale.metodo_pago}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                                                        {currencySymbol}{sale.total.toFixed(2)}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                                                        {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                                                    {__('No hay ventas recientes registradas.')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
