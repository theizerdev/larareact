import { Head, Link, usePage, router } from '@inertiajs/react';
import {
    ShieldCheck,
    Building2,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Gift,
    CreditCard,
    ArrowUpRight,
    Eye,
    Check,
    X,
    ExternalLink,
    RefreshCw,
    Sparkles,
    Calendar,
    ChevronRight,
    Users,
    Search,
    TrendingUp,
    Filter,
    DollarSign,
    BarChart2,
    PieChart as PieChartIcon,
    Radio,
    Activity,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslate } from '@/hooks/use-translate';

interface SuperAdminStats {
    total_empresas: number;
    activas: number;
    trial: number;
    vencidas: number;
    exentas: number;
    pagos_pendientes: number;
    proximas_vencer: number;
    total_revenue_in_range: number;
    en_linea?: number;
    activas_semana?: number;
    inactivas?: number;
}

interface EmpresaResumen {
    id: number;
    razon_social: string;
    documento: string;
    email: string;
    telefono: string;
    subscription_status: string;
    estado_legible: string;
    dias_restantes: number;
    is_exempt: boolean;
    fecha_vencimiento: string;
    total_sucursales: number;
    created_at: string;
    activity?: {
        is_online: boolean;
        online_users_count: number;
        activity_status: 'online' | 'active_today' | 'recent' | 'inactive' | 'never';
        activity_status_label: string;
        last_activity_for_humans: string;
        last_activity_type: string;
        sales_30d: number;
        repairs_30d: number;
    } | null;
}

interface PagoPendiente {
    id: number;
    empresa_id: number;
    empresa_nombre: string;
    usuario_nombre: string;
    monto: number;
    ciclo_meses: number;
    sucursales_contratadas: number;
    metodo_pago: string;
    referencia_pago: string | null;
    comprobante_path: string | null;
    created_at: string;
}

interface RenovacionReciente {
    id: number;
    empresa_nombre: string;
    monto: number;
    ciclo_meses: number;
    aprobado_at: string;
}

interface PageProps {
    filters: {
        start_date: string;
        end_date: string;
    };
    stats: SuperAdminStats;
    revenueChart: {
        categories: string[];
        data: number[];
    };
    statusDistribution: {
        activas: number;
        trial: number;
        vencidas: number;
        exentas: number;
    };
    proximasAVencer: EmpresaResumen[];
    pagosPendientes: PagoPendiente[];
    empresasResumen: EmpresaResumen[];
    renovacionesRecientes: RenovacionReciente[];
    bcvRate?: number;
}

export default function SuperAdminDashboard({
    filters,
    stats,
    revenueChart,
    statusDistribution,
    proximasAVencer,
    pagosPendientes,
    empresasResumen,
    renovacionesRecientes,
    bcvRate = 36.50,
}: PageProps) {
    const { __ } = useTranslate();
    const pageProps = usePage().props as any;
    const { currencySymbol = '$', isVenezuela = false } = pageProps;

    const [startDate, setStartDate] = useState<string>(filters?.start_date || '');
    const [endDate, setEndDate] = useState<string>(filters?.end_date || '');
    const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const formatPrice = (usdAmount: number) => {
        if (isVenezuela) {
            const bsAmount = usdAmount * bcvRate;
            return `Bs. ${bsAmount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `${currencySymbol}${usdAmount.toFixed(2)}`;
    };

    const handleFilterDate = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/superadministrador/dashboard0', {
            start_date: startDate,
            end_date: endDate,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const filteredEmpresas = useMemo(() => {
        return empresasResumen.filter((emp) => {
            const matchesSearch =
                emp.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.documento.toLowerCase().includes(searchTerm.toLowerCase());

            if (statusFilter === 'all') return matchesSearch;
            if (statusFilter === 'active') return matchesSearch && emp.subscription_status === 'active';
            if (statusFilter === 'trial') return matchesSearch && emp.subscription_status === 'trial';
            if (statusFilter === 'expired') return matchesSearch && emp.subscription_status === 'expired';
            if (statusFilter === 'exempt') return matchesSearch && emp.is_exempt;

            return matchesSearch;
        });
    }, [empresasResumen, searchTerm, statusFilter]);

    const breadcrumbs = [
        { title: __('Dashboard Super Admin'), href: '/superadministrador/dashboard0' },
        { title: __('Analítica de Suscripciones'), href: '#' },
    ];

    const handleApprove = (paymentId: number) => {
        router.post(`/admin/monitoring/subscription/approve/${paymentId}`);
    };

    // Configuración ApexCharts: Tendencia de Ingresos por Renovación
    const revenueChartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'area',
            height: 300,
            toolbar: { show: false },
            fontFamily: 'inherit',
            background: 'transparent',
        },
        stroke: { curve: 'smooth', width: 3 },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [0, 90, 100]
            }
        },
        colors: ['#4f46e5'],
        dataLabels: { enabled: false },
        xaxis: {
            categories: revenueChart.categories,
            labels: {
                style: { colors: '#64748b', fontSize: '11px' }
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                style: { colors: '#64748b', fontSize: '11px' },
                formatter: (val) => `${currencySymbol}${val}`
            }
        },
        grid: {
            borderColor: '#e2e8f0',
            strokeDashArray: 4,
            padding: { top: 0, right: 10, bottom: 0, left: 10 }
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: (val) => formatPrice(val)
            }
        }
    };

    // Configuración ApexCharts: Distribución de Estado de Cuentas SaaS
    const distributionChartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'donut',
            height: 280,
            fontFamily: 'inherit',
            background: 'transparent',
        },
        labels: [__('Activas'), __('En Prueba (Trial)'), __('Vencidas'), __('Exentas (Permanentes)')],
        colors: ['#10b981', '#f59e0b', '#ef4444', '#6366f1'],
        legend: {
            position: 'bottom',
            labels: { colors: '#64748b' }
        },
        dataLabels: { enabled: true },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: __('Total SaaS'),
                            color: '#64748b',
                            formatter: () => `${stats.total_empresas}`
                        }
                    }
                }
            }
        },
        tooltip: { theme: 'dark' }
    };

    return (
        <>
            <Head title={__('Dashboard Super Administrador - Analítica SaaS')} />

            <div className="space-y-6 pb-12">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header Premium y Selector de Rango de Fechas */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl text-white shadow-xl border border-slate-800 relative overflow-hidden">
                    <div className="space-y-1 z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>{__('Métrica y Analítica SaaS')}</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            {__('Flujo General de Suscripciones')}
                        </h1>
                        <p className="text-slate-300 text-xs sm:text-sm">
                            {__('Visualización estratégica del rendimiento de ingresos, renovación de licencias y estatus de cuentas.')}
                        </p>
                    </div>

                    {/* Filtro DatePicker por Rango de Fechas */}
                    <form onSubmit={handleFilterDate} className="flex flex-wrap items-end gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 z-10">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-slate-400">{__('Fecha Inicio')}</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-8 text-xs bg-slate-900 border-slate-700 text-white w-36"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-slate-400">{__('Fecha Fin')}</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-8 text-xs bg-slate-900 border-slate-700 text-white w-36"
                            />
                        </div>
                        <Button type="submit" size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5">
                            <Filter className="h-3.5 w-3.5" />
                            {__('Filtrar Rango')}
                        </Button>
                    </form>
                </div>

                {/* Métricas Resumidas Neutras (Color solo en Iconos) */}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Card 1: Ingresos por Renovación */}
                    <Card className="shadow-sm border border-border hover:shadow-md transition-shadow">
                        <CardContent className="p-5 flex items-start justify-between">
                            <div className="space-y-1.5">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                                    <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                                    {__('Ingresos Renovación')}
                                </span>
                                <p className="text-2xl sm:text-3xl font-black text-foreground">
                                    {formatPrice(stats.total_revenue_in_range)}
                                </p>
                                <p className="text-[11px] text-muted-foreground font-medium">
                                    {__('En los últimos 7 días')}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                                <DollarSign className="h-6 w-6" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2: Cuentas Activas */}
                    <Card className="shadow-sm border border-border hover:shadow-md transition-shadow">
                        <CardContent className="p-5 flex items-start justify-between">
                            <div className="space-y-1.5">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                    {__('Suscripciones Activas')}
                                </span>
                                <p className="text-2xl sm:text-3xl font-black text-foreground">
                                    {stats.activas}
                                </p>
                                <p className="text-[11px] text-muted-foreground font-medium">
                                    {stats.total_empresas > 0 ? `${((stats.activas / stats.total_empresas) * 100).toFixed(0)}% ${__('del total de empresas')}` : __('Sin empresas')}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                                <Building2 className="h-6 w-6" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 3: Prueba Gratis (Trial) */}
                    <Card className="shadow-sm border border-border hover:shadow-md transition-shadow">
                        <CardContent className="p-5 flex items-start justify-between">
                            <div className="space-y-1.5">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                                    <Gift className="h-3.5 w-3.5 text-amber-600" />
                                    {__('En Prueba Gratis')}
                                </span>
                                <p className="text-2xl sm:text-3xl font-black text-foreground">
                                    {stats.trial}
                                </p>
                                <p className="text-[11px] text-muted-foreground font-medium">
                                    {__('Clientes en periodo de evaluación')}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                                <Sparkles className="h-6 w-6" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 4: Próximas a Vencer */}
                    <Card className="shadow-sm border border-border hover:shadow-md transition-shadow">
                        <CardContent className="p-5 flex items-start justify-between">
                            <div className="space-y-1.5">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5 text-rose-600" />
                                    {__('Por Vencer (≤ 7 días)')}
                                </span>
                                <p className="text-2xl sm:text-3xl font-black text-foreground">
                                    {stats.proximas_vencer}
                                </p>
                                <p className="text-[11px] text-muted-foreground font-medium">
                                    {__('Requieren atención inmediata')}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Indicadores de Conexión y Salud de Adopción SaaS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border shadow-sm">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <Radio className="h-5 w-5 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-semibold">{__('Empresas en Línea Ahora')}</p>
                            <p className="text-lg font-black text-foreground">
                                {stats.en_linea ?? 0} <span className="text-xs font-normal text-muted-foreground">{__('con personal navegando')}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border shadow-sm">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-semibold">{__('Activas en los Últimos 7 Días')}</p>
                            <p className="text-lg font-black text-foreground">
                                {stats.activas_semana ?? 0} <span className="text-xs font-normal text-muted-foreground">({stats.total_empresas > 0 ? Math.round(((stats.activas_semana ?? 0) / stats.total_empresas) * 100) : 0}% {__('de adopción')})</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border shadow-sm">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-semibold">{__('Inactivas / Sin Uso Reciente (+7d)')}</p>
                            <p className="text-lg font-black text-rose-600 dark:text-rose-400">
                                {stats.inactivas ?? 0} <span className="text-xs font-normal text-muted-foreground">{__('requieren contacto de soporte')}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sección de Gráficos Apexcharts */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Gráfico 1: Flujo de Ingresos por Renovación en Rango de Fechas */}
                    <Card className="lg:col-span-2 shadow-sm border border-border">
                        <CardHeader className="border-b pb-3 bg-muted/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <BarChart2 className="h-5 w-5 text-indigo-600" />
                                        {__('Flujo Diario de Ingresos por Renovaciones')}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {__('Comportamiento de pagos aprobados en el periodo seleccionado.')}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {revenueChart.categories.length > 0 ? (
                                <Chart
                                    options={revenueChartOptions}
                                    series={[{ name: __('Ingresos'), data: revenueChart.data }]}
                                    type="area"
                                    height={280}
                                />
                            ) : (
                                <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
                                    {__('No hay datos suficientes para el rango de fechas.')}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Gráfico 2: Distribución de Licencias SaaS */}
                    <Card className="shadow-sm border border-border">
                        <CardHeader className="border-b pb-3 bg-muted/20">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5 text-emerald-600" />
                                {__('Distribución de Estatus SaaS')}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {__('Proporción actual de cuentas activas, pruebas y vencidas.')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 flex items-center justify-center">
                            <Chart
                                options={distributionChartOptions}
                                series={[
                                    statusDistribution.activas,
                                    statusDistribution.trial,
                                    statusDistribution.vencidas,
                                    statusDistribution.exentas,
                                ]}
                                type="donut"
                                height={280}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Sección Alertas y Solicitudes Pendientes */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Alerta de Cuentas Próximas a Vencer */}
                    <Card className="shadow-sm border-2 border-orange-500/20 overflow-hidden">
                        <CardHeader className="bg-orange-500/5 border-b pb-3.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold">
                                            {__('Próximas a Vencer (≤ 7 días)')}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {__('Requieren atención o recordatorio de renovación')}
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge className="bg-orange-500 text-white font-bold text-xs px-2.5 py-0.5">
                                    {proximasAVencer.length}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 max-h-80 overflow-y-auto">
                            {proximasAVencer.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/40 text-xs">
                                            <TableHead>{__('Empresa')}</TableHead>
                                            <TableHead>{__('Vencimiento')}</TableHead>
                                            <TableHead className="text-right">{__('Días Restantes')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {proximasAVencer.map((emp) => (
                                            <TableRow key={emp.id} className="hover:bg-muted/40">
                                                <TableCell className="py-2.5">
                                                    <p className="font-bold text-xs text-foreground">{emp.razon_social}</p>
                                                    <p className="text-[11px] text-muted-foreground">{emp.email}</p>
                                                </TableCell>
                                                <TableCell className="py-2.5 text-xs font-mono text-muted-foreground">
                                                    {emp.fecha_vencimiento}
                                                </TableCell>
                                                <TableCell className="py-2.5 text-right">
                                                    <Badge 
                                                        className={
                                                            emp.dias_restantes <= 3 
                                                                ? 'bg-rose-500 text-white font-bold text-xs' 
                                                                : 'bg-amber-500 text-white font-bold text-xs'
                                                        }
                                                    >
                                                        {emp.dias_restantes} {__('días')}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground text-xs">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                                    <p>{__('No hay empresas con vencimiento inminente en los próximos 7 días.')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Alerta de Solicitudes de Renovación Pendientes */}
                    <Card className="shadow-sm border-2 border-indigo-500/20 overflow-hidden">
                        <CardHeader className="bg-indigo-500/5 border-b pb-3.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold">
                                            {__('Pagos Pendientes por Revisar')}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {__('Comprobantes de renovación enviados por clientes')}
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge className="bg-indigo-600 text-white font-bold text-xs px-2.5 py-0.5">
                                    {pagosPendientes.length}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 max-h-80 overflow-y-auto">
                            {pagosPendientes.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/40 text-xs">
                                            <TableHead>{__('Empresa / Ref')}</TableHead>
                                            <TableHead>{__('Monto')}</TableHead>
                                            <TableHead className="text-right">{__('Acción')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pagosPendientes.map((pago) => (
                                            <TableRow key={pago.id} className="hover:bg-muted/40">
                                                <TableCell className="py-2.5">
                                                    <p className="font-bold text-xs text-foreground">{pago.empresa_nombre}</p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {pago.ciclo_meses} meses • Ref: <span className="font-mono font-medium">{pago.referencia_pago || 'S/R'}</span>
                                                    </p>
                                                </TableCell>
                                                <TableCell className="py-2.5 font-mono font-bold text-xs text-primary">
                                                    {formatPrice(pago.monto)}
                                                </TableCell>
                                                <TableCell className="py-2.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {pago.comprobante_path && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setPreviewReceipt(`/storage/${pago.comprobante_path}`)}
                                                                className="h-7 px-2 text-xs gap-1 border-slate-300 dark:border-slate-700"
                                                                title={__('Ver comprobante')}
                                                            >
                                                                <Eye className="h-3.5 w-3.5 text-indigo-600" />
                                                                {__('Ver')}
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleApprove(pago.id)}
                                                            className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 shadow-sm"
                                                        >
                                                            <Check className="h-3 w-3" />
                                                            {__('Aprobar')}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground text-xs">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                                    <p>{__('No hay comprobantes de pago pendientes por revisar.')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Resumen Completo de Suscripciones SaaS */}
                <Card className="shadow-sm border border-border">
                    <CardHeader className="border-b bg-muted/30 pb-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-primary" />
                                    {__('Estado General de Cuentas SaaS')}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {__('Filtrar y visualizar la totalidad de empresas registradas en la plataforma.')}
                                </CardDescription>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={__('Buscar empresa, RIF...')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 h-9 text-xs"
                                    />
                                </div>

                                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border text-xs">
                                    <button
                                        onClick={() => setStatusFilter('all')}
                                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${statusFilter === 'all' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
                                    >
                                        {__('Todas')}
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter('active')}
                                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${statusFilter === 'active' ? 'bg-emerald-500 text-white shadow' : 'text-muted-foreground'}`}
                                    >
                                        {__('Activas')}
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter('trial')}
                                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${statusFilter === 'trial' ? 'bg-amber-500 text-white shadow' : 'text-muted-foreground'}`}
                                    >
                                        {__('Trial')}
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter('expired')}
                                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${statusFilter === 'expired' ? 'bg-rose-500 text-white shadow' : 'text-muted-foreground'}`}
                                    >
                                        {__('Vencidas')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 text-xs">
                                    <TableHead className="font-bold">{__('Empresa')}</TableHead>
                                    <TableHead className="font-bold">{__('Contacto / RIF')}</TableHead>
                                    <TableHead className="font-bold">{__('Sucursales')}</TableHead>
                                    <TableHead className="font-bold">{__('Uso y Actividad')}</TableHead>
                                    <TableHead className="font-bold">{__('Vencimiento')}</TableHead>
                                    <TableHead className="font-bold">{__('Estado')}</TableHead>
                                    <TableHead className="font-bold text-right">{__('Acción')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmpresas.map((emp) => (
                                    <TableRow key={emp.id} className="hover:bg-muted/40">
                                        <TableCell className="py-3">
                                            <p className="font-bold text-xs text-foreground">{emp.razon_social}</p>
                                            <p className="text-[11px] text-muted-foreground">{emp.email}</p>
                                        </TableCell>
                                        <TableCell className="py-3 text-xs font-mono text-muted-foreground">
                                            <p>{emp.documento}</p>
                                            <p className="text-[11px]">{emp.telefono || '--'}</p>
                                        </TableCell>
                                        <TableCell className="py-3 text-xs font-semibold">
                                            {emp.total_sucursales} {__('sucursal(es)')}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            {emp.activity ? (
                                                <div className="space-y-1">
                                                    {emp.activity.is_online ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 animate-pulse">
                                                            <span className="relative flex h-2 w-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                            </span>
                                                            {__('En línea')} ({emp.activity.online_users_count})
                                                        </span>
                                                    ) : emp.activity.activity_status === 'active_today' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                            {__('Activo hoy')}
                                                        </span>
                                                    ) : emp.activity.activity_status === 'recent' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                                                            <Clock className="w-3 h-3 text-amber-500" />
                                                            {emp.activity.activity_status_label}
                                                        </span>
                                                    ) : emp.activity.activity_status === 'inactive' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800">
                                                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                                                            {emp.activity.activity_status_label}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800">
                                                            {__('Sin actividad')}
                                                        </span>
                                                    )}
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {emp.activity.last_activity_for_humans}
                                                        {(emp.activity.sales_30d > 0 || emp.activity.repairs_30d > 0) && (
                                                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold ml-1">
                                                                • {emp.activity.sales_30d > 0 ? `${emp.activity.sales_30d} vent.` : ''} {emp.activity.repairs_30d > 0 ? `${emp.activity.repairs_30d} rep.` : ''}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-3 text-xs font-mono">
                                            {emp.fecha_vencimiento}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <Badge 
                                                variant="outline"
                                                className={`text-xs font-bold ${
                                                    emp.is_exempt ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30' :
                                                    emp.subscription_status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
                                                    emp.subscription_status === 'trial' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                                                    'bg-rose-500/10 text-rose-600 border-rose-500/30'
                                                }`}
                                            >
                                                {emp.estado_legible}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3 text-right">
                                            <Link
                                                href={`/admin/empresas/${emp.id}`}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 transition-colors shadow-sm"
                                                title={__('Ver Detalle 360° y Uso')}
                                            >
                                                <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                                <span>{__('Detalle')}</span>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {filteredEmpresas.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                                            {__('No se encontraron empresas con los filtros aplicados.')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Lightbox Ver Comprobante */}
            <Dialog open={previewReceipt !== null} onOpenChange={() => setPreviewReceipt(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold">
                            <CreditCard className="h-5 w-5 text-primary" />
                            {__('Comprobante de Pago Adjunto')}
                        </DialogTitle>
                    </DialogHeader>

                    {previewReceipt && (
                        <div className="p-2 border rounded-xl bg-muted flex items-center justify-center max-h-[70vh] overflow-auto">
                            {previewReceipt.endsWith('.pdf') ? (
                                <iframe src={previewReceipt} className="w-full h-96 rounded" title="PDF Comprobante" />
                            ) : (
                                <img src={previewReceipt} alt="Comprobante" className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-md" />
                            )}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                        {previewReceipt && (
                            <a 
                                href={previewReceipt} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                {__('Abrir en ventana nueva')}
                            </a>
                        )}
                        <Button variant="outline" onClick={() => setPreviewReceipt(null)}>
                            {__('Cerrar')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
