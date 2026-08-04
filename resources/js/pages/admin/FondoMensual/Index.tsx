import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import Chart from 'react-apexcharts';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Lock,
    CheckCircle2,
    Calendar,
    Building2,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    Info,
    History,
    PieChart,
    BarChart3,
    Printer,
    Sparkles,
    ShieldCheck,
    Coins,
    Layers,
    FileSpreadsheet,
    Download,
    CreditCard,
    Zap,
    Clock,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslate } from '@/hooks/use-translate';

interface Sucursal {
    id: number;
    nombre: string;
}

interface CierreSnapshot {
    id: number;
    year: number;
    month: number;
    fecha_cierre: string;
    total_ingresos: number;
    total_egresos: number;
    saldo_neto: number;
    fondo_siguiente_mes: number;
    retiro_utilidad: number;
    status: string;
    notas?: string;
    user?: { name: string };
    sucursal?: { nombre: string };
}

interface Props {
    sucursales: Sucursal[];
    selectedYear: number;
    selectedMonth: number;
    selectedSucursal: string;
    currencySymbol: string;
    currentMonthStats: {
        cajas_cerradas_cant: number;
        inflows: number;
        outflows: number;
        saldo_neto: number;
        fondos_apertura: number;
        prev_month_net: number;
        percentage_change: number;
        is_closed: boolean;
        snapshot?: CierreSnapshot;
    };
    annualChartData: {
        categories: string[];
        inflows: number[];
        outflows: number[];
        net: number[];
    };
    paymentChartData: {
        labels: string[];
        series: number[];
    };
    cierresHistoricos: CierreSnapshot[];
}

export default function Index({
    sucursales,
    selectedYear,
    selectedMonth,
    selectedSucursal,
    currencySymbol,
    currentMonthStats,
    annualChartData,
    paymentChartData,
    cierresHistoricos,
}: Props) {
    const { __ } = useTranslate();
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
    const [selectedSnapshotDetails, setSelectedSnapshotDetails] = useState<CierreSnapshot | null>(null);

    const breadcrumbs = [
        { title: __('Administración'), href: '/admin/proveedores' },
        { title: __('Fondo de Mes'), href: '/admin/fondo-mensual' },
    ];

    const monthNames = [
        __('Enero'), __('Febrero'), __('Marzo'), __('Abril'),
        __('Mayo'), __('Junio'), __('Julio'), __('Agosto'),
        __('Septiembre'), __('Octubre'), __('Noviembre'), __('Diciembre'),
    ];

    const currentYearNum = new Date().getFullYear();
    const yearsOptions = [currentYearNum - 2, currentYearNum - 1, currentYearNum, currentYearNum + 1];

    const { data, setData, post, processing, errors, reset } = useForm({
        year: selectedYear,
        month: selectedMonth,
        sucursal_id: selectedSucursal,
        fondo_siguiente_mes: 0,
        retiro_utilidad: currentMonthStats.saldo_neto > 0 ? currentMonthStats.saldo_neto : 0,
        notas: '',
    });

    const handleFilterChange = (key: string, value: any) => {
        const query: any = {
            year: selectedYear,
            month: selectedMonth,
            sucursal_id: selectedSucursal,
            [key]: value,
        };

        router.get('/admin/fondo-mensual', query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleCloseMonthSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/fondo-mensual/cerrar', {
            onSuccess: () => {
                setIsCloseModalOpen(false);
                reset();
            },
        });
    };

    const handlePrint = () => {
        window.print();
    };

    // Calcular el total general de métodos de pago para los % de la lista
    const totalPaymentVolume = paymentChartData.series.reduce((a, b) => a + b, 0);

    // Configuración ApexCharts 1: Evolución Anual (Bar / Area)
    const annualChartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: chartType,
            toolbar: { show: false },
            fontFamily: 'inherit',
            zoom: { enabled: false },
        },
        colors: ['#10B981', '#EF4444', '#6366F1'],
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '50%',
                borderRadius: 6,
            },
        },
        fill: {
            type: chartType === 'area' ? 'gradient' : 'solid',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [0, 90, 100],
            },
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: chartType === 'area' ? 3 : 2, curve: 'smooth' },
        xaxis: {
            categories: annualChartData.categories,
            labels: { style: { colors: '#94A3B8', fontWeight: 500 } },
            axisBorder: { show: false },
        },
        yaxis: {
            labels: {
                formatter: (val) => `${currencySymbol} ${val.toLocaleString()}`,
                style: { colors: '#94A3B8' },
            },
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: (val) => `${currencySymbol} ${val.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
            },
        },
        legend: { position: 'top', horizontalAlign: 'right', labels: { colors: '#94A3B8' } },
        grid: { borderColor: '#334155', strokeDashArray: 4 },
    };

    const annualChartSeries = [
        { name: __('Ingresos Cajas'), data: annualChartData.inflows },
        { name: __('Egresos Cajas'), data: annualChartData.outflows },
        { name: __('Saldo Neto'), data: annualChartData.net },
    ];

    // Configuración ApexCharts 2: Donut Chart de Formas de Pago
    const paymentChartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'donut',
            fontFamily: 'inherit',
        },
        labels: paymentChartData.labels.length > 0 ? paymentChartData.labels : [__('Sin registros')],
        colors: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'],
        legend: { position: 'bottom', labels: { colors: '#94A3B8' } },
        plotOptions: {
            pie: {
                donut: {
                    size: '75%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: __('Total Acumulado'),
                            color: '#94A3B8',
                            fontSize: '12px',
                            formatter: () => `${currencySymbol} ${totalPaymentVolume.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
                        },
                    },
                },
            },
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: (val) => `${currencySymbol} ${val.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
            },
        },
        noData: { text: __('Sin movimientos en cajas cerradas') },
    };

    const paymentChartSeries = paymentChartData.series.length > 0 ? paymentChartData.series : [100];

    return (
        <>
            <Head title={__('Fondo de Mes')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header Principal con Botones de Acción */}
                <ModuleHeader
                    icon={<Wallet className="h-6 w-6 text-white" />}
                    title={__('Fondo de Mes')}
                    description={__('Dashboard ejecutivo de control anual de efectivo, flujo consolidado de cajas cerradas y cierres operativos.')}
                    colorClassName="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700"
                >
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handlePrint}
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md gap-2 font-medium"
                        >
                            <Printer className="w-4 h-4" />
                            {__('Imprimir Resumen')}
                        </Button>

                        {currentMonthStats.is_closed ? (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-sm py-1.5 px-3 flex items-center gap-2 shadow-sm">
                                <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                                {__('Mes Cerrado')} ({new Date(currentMonthStats.snapshot?.fecha_cierre || '').toLocaleDateString()})
                            </Badge>
                        ) : (
                            <Button
                                onClick={() => setIsCloseModalOpen(true)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold gap-2 shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02]"
                            >
                                <Lock className="w-4 h-4" />
                                {__('Cerrar Mes Operativo')}
                            </Button>
                        )}
                    </div>
                </ModuleHeader>

                {/* Card Destacado: Estado del Mes y Filtros Ejecutivos */}
                <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                    <CardContent className="p-6 relative z-10">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                            <div className="flex items-center space-x-4">
                                <div className="p-3.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-inner text-white">
                                    <Sparkles className="w-7 h-7" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold tracking-tight">
                                            {monthNames[selectedMonth - 1]} {selectedYear}
                                        </h2>
                                        {currentMonthStats.is_closed ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                {__('Snapshot Guardado')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                                {__('Mes en Curso (En vivo)')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {__('Consolidado de')} <span className="text-indigo-400 font-semibold">{currentMonthStats.cajas_cerradas_cant}</span> {__('cajas registradoras cerradas en este ciclo.')}
                                    </p>
                                </div>
                            </div>

                            {/* Controles de Filtros Integrados */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="w-full sm:w-auto">
                                    <Select
                                        value={selectedSucursal}
                                        onValueChange={(val) => handleFilterChange('sucursal_id', val)}
                                    >
                                        <SelectTrigger className="bg-slate-800/80 border-slate-700 text-white min-w-[200px]">
                                            <Building2 className="w-4 h-4 mr-2 text-indigo-400" />
                                            <SelectValue placeholder={__('Sucursal')} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                            <SelectItem value="all">{__('Todas las Sucursales (Empresa)')}</SelectItem>
                                            {sucursales.map((s) => (
                                                <SelectItem key={s.id} value={s.id.toString()}>
                                                    {s.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="w-1/2 sm:w-auto">
                                    <Select
                                        value={selectedYear.toString()}
                                        onValueChange={(val) => handleFilterChange('year', parseInt(val))}
                                    >
                                        <SelectTrigger className="bg-slate-800/80 border-slate-700 text-white w-full sm:w-[110px]">
                                            <Calendar className="w-4 h-4 mr-1.5 text-indigo-400" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                            {yearsOptions.map((y) => (
                                                <SelectItem key={y} value={y.toString()}>
                                                    {y}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="w-1/2 sm:w-auto">
                                    <Select
                                        value={selectedMonth.toString()}
                                        onValueChange={(val) => handleFilterChange('month', parseInt(val))}
                                    >
                                        <SelectTrigger className="bg-slate-800/80 border-slate-700 text-white w-full sm:w-[130px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                            {monthNames.map((name, index) => (
                                                <SelectItem key={index + 1} value={(index + 1).toString()}>
                                                    {name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Tarjetas de Métricas Directas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
                            {/* Saldo Neto */}
                            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-md">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-medium text-slate-400">{__('Saldo Neto Acumulado')}</span>
                                    <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                        <Coins className="w-4 h-4" />
                                    </span>
                                </div>
                                <div className="text-2xl font-extrabold text-white mt-2">
                                    {currencySymbol} {currentMonthStats.saldo_neto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="flex items-center text-xs mt-2 text-slate-400">
                                    {currentMonthStats.percentage_change >= 0 ? (
                                        <span className="text-emerald-400 font-semibold flex items-center gap-0.5 mr-1.5">
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                            +{currentMonthStats.percentage_change}%
                                        </span>
                                    ) : (
                                        <span className="text-rose-400 font-semibold flex items-center gap-0.5 mr-1.5">
                                            <ArrowDownRight className="w-3.5 h-3.5" />
                                            {currentMonthStats.percentage_change}%
                                        </span>
                                    )}
                                    <span>{__('vs mes anterior')}</span>
                                </div>
                            </div>

                            {/* Ingresos Totales */}
                            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-md">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-medium text-slate-400">{__('Ingresos Cajas Cerradas')}</span>
                                    <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                        <TrendingUp className="w-4 h-4" />
                                    </span>
                                </div>
                                <div className="text-2xl font-extrabold text-emerald-400 mt-2">
                                    {currencySymbol} {currentMonthStats.inflows.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    {__('En ventas y cobros del mes')}
                                </p>
                            </div>

                            {/* Egresos Totales */}
                            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-md">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-medium text-slate-400">{__('Egresos Cajas Cerradas')}</span>
                                    <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                                        <TrendingDown className="w-4 h-4" />
                                    </span>
                                </div>
                                <div className="text-2xl font-extrabold text-rose-400 mt-2">
                                    {currencySymbol} {currentMonthStats.outflows.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    {__('Gastos y retiros de efectivo')}
                                </p>
                            </div>

                            {/* Fondos de Apertura */}
                            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-md">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-medium text-slate-400">{__('Fondos Iniciales Cajas')}</span>
                                    <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                        <Wallet className="w-4 h-4" />
                                    </span>
                                </div>
                                <div className="text-2xl font-extrabold text-purple-300 mt-2">
                                    {currencySymbol} {currentMonthStats.fondos_apertura.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    {__('Total dinero base de aperturas')}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sección de Gráficos ApexCharts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Gráfico 1: Evolución Anual (Columna 2 tercios) */}
                    <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    {__('Evolución Anual del Fondo')} ({selectedYear})
                                </CardTitle>
                                <CardDescription>
                                    {__('Comparación mensual de Ingresos, Egresos y Saldo Neto en Cajas Cerradas')}
                                </CardDescription>
                            </div>

                            {/* Toggle de Tipo de Gráfico */}
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                <button
                                    onClick={() => setChartType('bar')}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                        chartType === 'bar'
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    {__('Barras')}
                                </button>
                                <button
                                    onClick={() => setChartType('area')}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                        chartType === 'area'
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    {__('Área Gradient')}
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <Chart
                                options={annualChartOptions}
                                series={annualChartSeries}
                                type={chartType}
                                height={330}
                            />
                        </CardContent>
                    </Card>

                    {/* Gráfico 2: Desglose por Método de Pago (Columna 1 tercio) */}
                    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                {__('Métodos de Pago')} ({monthNames[selectedMonth - 1]})
                            </CardTitle>
                            <CardDescription>
                                {__('Distribución del flujo en cajas cerradas del mes')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2 flex-grow flex flex-col justify-center">
                            <Chart
                                options={paymentChartOptions}
                                series={paymentChartSeries}
                                type="donut"
                                height={260}
                            />

                            {/* Barras de Contribución por Método de Pago */}
                            <div className="mt-4 space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-4">
                                {paymentChartData.labels.map((label, idx) => {
                                    const amount = paymentChartData.series[idx] || 0;
                                    const percentage = totalPaymentVolume > 0 ? ((amount / totalPaymentVolume) * 100).toFixed(1) : '0';
                                    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500'];
                                    const colorClass = colors[idx % colors.length];

                                    return (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="text-slate-700 dark:text-slate-300">{label}</span>
                                                <span className="text-slate-500 dark:text-slate-400">
                                                    {currencySymbol} {amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} ({percentage}%)
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabla Histórica de Cierres Mensuales */}
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                {__('Histórico de Cierres de Mes')}
                            </CardTitle>
                            <CardDescription>
                                {__('Registro permanente de fotografías financieras de cierres mensuales')}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {cierresHistoricos.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                                <Info className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-500" />
                                <p className="font-semibold">{__('No se han registrado cierres mensuales en este filtro.')}</p>
                                <p className="text-xs mt-1 text-slate-400">
                                    {__('Al finalizar el mes, presione "Cerrar Mes Operativo" para guardar una fotografía fija del saldo.')}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="p-3.5">{__('Año/Mes')}</th>
                                            <th className="p-3.5">{__('Sucursal')}</th>
                                            <th className="p-3.5">{__('Fecha Cierre')}</th>
                                            <th className="p-3.5">{__('Ingresos')}</th>
                                            <th className="p-3.5">{__('Egresos')}</th>
                                            <th className="p-3.5">{__('Saldo Neto')}</th>
                                            <th className="p-3.5">{__('Fondo Próx. Mes')}</th>
                                            <th className="p-3.5">{__('Utilidad/Retiro')}</th>
                                            <th className="p-3.5">{__('Cerrado Por')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {cierresHistoricos.map((c) => (
                                            <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                                                    <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs">
                                                        {c.year} - {c.month.toString().padStart(2, '0')}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 font-medium">{c.sucursal?.nombre || __('Todas (Empresa)')}</td>
                                                <td className="p-3.5 text-slate-500 text-xs">
                                                    {new Date(c.fecha_cierre).toLocaleString()}
                                                </td>
                                                <td className="p-3.5 text-emerald-600 font-medium">
                                                    {currencySymbol} {c.total_ingresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-3.5 text-rose-600 font-medium">
                                                    {currencySymbol} {c.total_egresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">
                                                    {currencySymbol} {c.saldo_neto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-3.5 text-blue-600 dark:text-blue-400 font-semibold">
                                                    {currencySymbol} {c.fondo_siguiente_mes.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-3.5 text-purple-600 dark:text-purple-400 font-semibold">
                                                    {currencySymbol} {c.retiro_utilidad.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-3.5 text-slate-500 text-xs flex items-center gap-1.5">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-[10px]">
                                                        {c.user?.name ? c.user.name.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                    {c.user?.name || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Modal de Cierre de Mes */}
                <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
                    <DialogContent className="sm:max-w-lg border-slate-200 dark:border-slate-800">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xl">
                                <Lock className="w-5 h-5 text-indigo-500" />
                                {__('Cerrar Mes Operativo')} ({monthNames[selectedMonth - 1]} {selectedYear})
                            </DialogTitle>
                            <DialogDescription>
                                {__('Al congelar el mes, se creará el registro definitivo del acumulado neto en cajas cerradas.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCloseMonthSubmit} className="space-y-4 py-2">
                            <div className="p-4 bg-gradient-to-br from-indigo-900/40 to-slate-900 rounded-xl border border-indigo-500/30 text-white space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-indigo-200">{__('Saldo Neto Acumulado en Cajas')}:</span>
                                    <span className="text-lg font-extrabold text-emerald-400">
                                        {currencySymbol} {currentMonthStats.saldo_neto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 border-t border-indigo-800/40 pt-2">
                                    <span>{__('Cajas registradoras cerradas')}:</span>
                                    <span className="font-semibold text-white">{currentMonthStats.cajas_cerradas_cant}</span>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="fondo_siguiente_mes" className="font-semibold">
                                    {__('Monto Fondo Inicial Reservado para Próximo Mes')} ({currencySymbol})
                                </Label>
                                <Input
                                    id="fondo_siguiente_mes"
                                    type="number"
                                    step="0.01"
                                    value={data.fondo_siguiente_mes}
                                    onChange={(e) => setData('fondo_siguiente_mes', parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                    className="mt-1 font-semibold"
                                    required
                                />
                                <p className="text-[11px] text-slate-500 mt-1">
                                    {__('Este dinero quedará reservado como base para aperturar las cajas del siguiente mes.')}
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="retiro_utilidad" className="font-semibold">
                                    {__('Monto Transferido a Ganancia/Retiro')} ({currencySymbol})
                                </Label>
                                <Input
                                    id="retiro_utilidad"
                                    type="number"
                                    step="0.01"
                                    value={data.retiro_utilidad}
                                    onChange={(e) => setData('retiro_utilidad', parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="notas" className="font-semibold">
                                    {__('Observaciones o Notas del Cierre')}
                                </Label>
                                <Textarea
                                    id="notas"
                                    rows={2.5}
                                    value={data.notas}
                                    onChange={(e) => setData('notas', e.target.value)}
                                    placeholder={__('Detalles de cierre, observaciones de arqueo o notas importantes...')}
                                    className="mt-1 text-sm"
                                />
                            </div>

                            <DialogFooter className="pt-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCloseModalOpen(false)}
                                >
                                    {__('Cancelar')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-lg shadow-emerald-600/20"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    {__('Confirmar Cierre de Mes')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
