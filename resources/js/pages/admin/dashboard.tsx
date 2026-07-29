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
    Wallet
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

    const applyQuickRange = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
        const today = new Date();
        let start = new Date();

        if (preset === 'yesterday') {
            start.setDate(today.getDate() - 1);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(start.toISOString().split('T')[0]);
            router.get('/admin/dashboard', { start_date: start.toISOString().split('T')[0], end_date: start.toISOString().split('T')[0] }, { preserveState: true });
            return;
        }

        if (preset === 'week') {
            start.setDate(today.getDate() - 6);
        } else if (preset === 'month') {
            start.setDate(1);
        }

        const startStr = start.toISOString().split('T')[0];
        const endStr = today.toISOString().split('T')[0];
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
        plotOptions: { bar: { horizontal: true, borderRadius: 6 } },
        colors: ['#6366f1'],
        xaxis: { categories: charts.topItems.categories },
        dataLabels: { enabled: true },
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
                        {/* Indicador Valor del Dólar */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl font-mono text-xs font-bold shadow-2xs">
                            <Coins className="w-4 h-4 text-emerald-600" />
                            <span>$1 USD = {currencySymbol}{valorDolar.toFixed(2)} {currencyCode}</span>
                        </div>

                        {/* Switch de Auto-Refresh */}
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border">
                            <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                            <Label htmlFor="auto-refresh" className="text-xs font-bold cursor-pointer flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                {__('En Vivo (10s)')}
                            </Label>
                        </div>

                        {/* Botón de Actualizar Manual */}
                        <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={isRefreshing} className="gap-1.5 font-bold text-xs">
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {__('Actualizar')}
                        </Button>
                    </div>
                </div>

                {/* SECCIÓN 1: LO GENERADO EL DÍA DE HOY (MÉTRICAS CLAVE) */}
                <div className="space-y-2">
                    <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        {__('Generado Hoy')} ({new Date().toLocaleDateString()})
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Tarjeta 1: Total Hoy */}
                        <Card className="border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">{__('Total Recaudado Hoy')}</CardTitle>
                                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-600">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                                    {currencySymbol}{todayStats.total_mxn.toFixed(2)} <span className="text-xs font-sans text-muted-foreground">{currencyCode}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 font-mono">
                                    ≈ ${valorDolar > 0 ? (todayStats.total_mxn / valorDolar).toFixed(2) : '0.00'} USD en total
                                </p>
                            </CardContent>
                        </Card>

                        {/* Tarjeta 2: Recaudación Físicamente en Dólares Hoy */}
                        <Card className="border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">{__('Cobrado en Dólares (USD)')}</CardTitle>
                                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600">
                                    <Coins className="w-5 h-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black font-mono text-indigo-700 dark:text-indigo-300">
                                    💵 ${todayStats.total_usd.toFixed(2)} <span className="text-xs font-sans text-muted-foreground">USD</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 font-mono">
                                    Recibido en billetes de dólares hoy
                                </p>
                            </CardContent>
                        </Card>

                        {/* Tarjeta 3: Cantidad de Ventas Hoy */}
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">{__('Ventas Completadas')}</CardTitle>
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
                                    {todayStats.count} <span className="text-xs font-sans text-muted-foreground">{__('tickets')}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 font-mono">
                                    Operaciones procesadas hoy
                                </p>
                            </CardContent>
                        </Card>

                        {/* Tarjeta 4: Ticket Promedio */}
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">{__('Ticket Promedio')}</CardTitle>
                                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-600">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black font-mono text-purple-700 dark:text-purple-300">
                                    {currencySymbol}{todayStats.avg_ticket.toFixed(2)} <span className="text-xs font-sans text-muted-foreground">{currencyCode}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 font-mono">
                                    Promedio por compra
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* SECCIÓN 2: ESTADO DE LA CAJA REGISTRADORA DEL CAJERO */}
                <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                        <div className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-amber-600" />
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                                {__('Estado del Turno de Caja')}
                            </h3>
                            {registerSummary ? (
                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                    {__('Caja')} #{registerSummary.id} {__('Abierta')}
                                </Badge>
                            ) : (
                                <Badge variant="destructive">
                                    <Lock className="w-3.5 h-3.5 mr-1" />
                                    {__('Sin Caja Abierta')}
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button size="sm" onClick={() => router.get('/admin/ventas/terminal')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5">
                                <ShoppingCart className="w-4 h-4" />
                                {__('Ir a Terminal POS')}
                            </Button>
                        </div>
                    </div>

                    {registerSummary ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border">
                                <span className="text-muted-foreground font-semibold block">{__('Fondo Inicial')}</span>
                                <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200">
                                    {currencySymbol}{registerSummary.opening_amount.toFixed(2)} {currencyCode}
                                </span>
                            </div>
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200">
                                <span className="text-emerald-700 dark:text-emerald-400 font-semibold block">{__('Ingresos Turno (+)')}</span>
                                <span className="text-lg font-bold font-mono text-emerald-600">
                                    +{currencySymbol}{registerSummary.inflows.toFixed(2)} {currencyCode}
                                </span>
                            </div>
                            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200">
                                <span className="text-rose-700 dark:text-rose-400 font-semibold block">{__('Egresos Turno (-)')}</span>
                                <span className="text-lg font-bold font-mono text-rose-600">
                                    -{currencySymbol}{registerSummary.outflows.toFixed(2)} {currencyCode}
                                </span>
                            </div>
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200">
                                <span className="text-indigo-700 dark:text-indigo-300 font-semibold block">{__('Dinero Esperado en Caja')}</span>
                                <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-300 block">
                                    {currencySymbol}{registerSummary.expected_balance.toFixed(2)} {currencyCode}
                                </span>
                                <span className="text-[11px] font-bold text-emerald-600 font-mono block">
                                    💵 ≈ ${registerSummary.expected_usd.toFixed(2)} USD
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                            {__('Abra una caja registradora en la terminal POS para comenzar a operar el turno.')}
                        </p>
                    )}
                </div>

                {/* SECCIÓN 3: FILTRO DE FECHAS (DATEPICKER) */}
                <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                                {__('Filtro de Período y Reportes')}
                            </h3>
                        </div>

                        {/* Botones Atajos Rápido de Fechas */}
                        <div className="flex flex-wrap gap-1.5">
                            <Button type="button" variant="outline" size="sm" className="h-7 text-xs font-semibold" onClick={() => applyQuickRange('today')}>
                                {__('Hoy')}
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="h-7 text-xs font-semibold" onClick={() => applyQuickRange('yesterday')}>
                                {__('Ayer')}
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="h-7 text-xs font-semibold" onClick={() => applyQuickRange('week')}>
                                {__('Últimos 7 Días')}
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="h-7 text-xs font-semibold" onClick={() => applyQuickRange('month')}>
                                {__('Este Mes')}
                            </Button>
                        </div>
                    </div>

                    <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-end gap-3 pt-2 border-t">
                        <div className="space-y-1">
                            <Label htmlFor="start_date" className="text-xs font-bold">{__('Fecha Inicio')}</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-40 font-mono text-sm font-semibold bg-white dark:bg-slate-900"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="end_date" className="text-xs font-bold">{__('Fecha Fin')}</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-40 font-mono text-sm font-semibold bg-white dark:bg-slate-900"
                            />
                        </div>

                        <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-6">
                            {__('Filtrar Rango')}
                        </Button>
                    </form>
                </div>

                {/* SECCIÓN 4: GRÁFICAS INTERACTIVAS APEXCHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Gráfica 1: Tendencia de Ventas (Rango) */}
                    <Card className="lg:col-span-2 shadow-xs">
                        <CardHeader>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-indigo-600" />
                                {__('Tendencia de Ventas')} ({currencySymbol} {currencyCode})
                            </CardTitle>
                            <CardDescription>{__('Evolución diaria del volumen de ventas en el período seleccionado.')}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            {charts.trend.totals.length > 0 ? (
                                <Chart options={trendChartOptions} series={trendChartSeries} type="area" height={300} />
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm font-medium">
                                    {__('No hay datos de ventas registradas en este período.')}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Gráfica 2: Desglose por Método de Pago */}
                    <Card className="shadow-xs">
                        <CardHeader>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-emerald-600" />
                                {__('Ventas por Método de Pago')}
                            </CardTitle>
                            <CardDescription>{__('Distribución entre Efectivo, Dólares, Tarjeta y Crédito.')}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            {charts.payments.series.length > 0 ? (
                                <Chart options={paymentChartOptions} series={charts.payments.series} type="donut" height={300} />
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm font-medium">
                                    {__('Sin cobros en este rango.')}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* SECCIÓN 5: TOP PRODUCTOS VENDIDOS Y ÚLTIMAS VENTAS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Gráfica Top 5 Productos */}
                    <Card className="shadow-xs">
                        <CardHeader>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                                {__('Top 5 Productos Vendidos')}
                            </CardTitle>
                            <CardDescription>{__('Artículos con mayor demanda.')}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            {charts.topItems.series.length > 0 ? (
                                <Chart options={topItemsChartOptions} series={topItemsChartSeries} type="bar" height={260} />
                            ) : (
                                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                                    {__('Sin ventas de productos.')}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tabla de ÚLTIMAS VENTAS DEL DÍA */}
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
