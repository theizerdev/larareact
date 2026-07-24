import { Head, Link } from '@inertiajs/react';
import { format, subDays } from 'date-fns';
import {
    Activity,
    ArrowRight,
    Building2,
    Calendar as CalendarIcon,
    FileText,
    KeyRound,
    Layers,
    MessageSquare,
    QrCode,
    RefreshCw,
    ShieldCheck,
    TrendingUp,
    UserCheck,
    Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { dashboard } from '@/routes';

let Chart: any = null;

interface ModuleOverview {
    garita?: { total_accesos: number; accesos_hoy: number; activos_dentro: number };
    empleados?: { total: number; preregistros_pendientes: number };
    proveedores?: { total: number };
    productores?: { total: number };
    visitas_temporales?: { total: number; visitas_hoy?: number };
    organizacion?: { empresas: number; sucursales: number; departamentos: number; usuarios: number };
}

interface Props {
    moduleStats?: ModuleOverview;
}

export default function Dashboard({ moduleStats }: Props) {
    const [chartMounted, setChartMounted] = useState(false);
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(false);

    const [statsData, setStatsData] = useState<{
        dates: string[];
        accesos: number[];
        visitas_temporales: number[];
        overview: ModuleOverview;
    }>({
        dates: [],
        accesos: [],
        visitas_temporales: [],
        overview: moduleStats || {},
    });

    useEffect(() => {
        import('react-apexcharts').then((mod) => {
            Chart = mod.default;
            setChartMounted(true);
        });
    }, []);

    const fallbackStats = (start: string, end: string) => {
        const dates: string[] = [];
        const accesos: number[] = [];
        const visitas_temporales: number[] = [];

        const s = new Date(start);
        const e = new Date(end);
        const diffDays = Math.max(1, Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));

        for (let i = 0; i <= diffDays; i++) {
            const d = new Date(s);
            d.setDate(d.getDate() + i);
            dates.push(format(d, 'yyyy-MM-dd'));
            accesos.push(0);
            visitas_temporales.push(0);
        }

        setStatsData((prev) => ({
            ...prev,
            dates,
            accesos,
            visitas_temporales,
        }));
    };

    const fetchStats = async (start: string, end: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dashboard/stats?start=${start}&end=${end}`);
            if (res.ok) {
                const data = await res.json();
                setStatsData(data);
            } else {
                fallbackStats(start, end);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
            fallbackStats(start, end);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats(startDate, endDate);
    }, [startDate, endDate]);

    const overview = statsData.overview || moduleStats || {};

    const getGaritaChartOptions = () => ({
        chart: {
            id: 'garita-chart',
            type: 'area' as const,
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'Inter, sans-serif',
            foreColor: '#64748b',
            sparkline: { enabled: false },
        },
        colors: ['#10b981'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth' as const, width: 3 },
        xaxis: {
            categories: statsData.dates.length > 0 ? statsData.dates : [startDate, endDate],
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: '#64748b', fontSize: '11px' } },
        },
        yaxis: {
            min: 0,
            forceNiceScale: true,
            labels: {
                style: { colors: '#64748b', fontSize: '11px' },
                formatter: (val: number) => Math.round(val).toString(),
            },
        },
        grid: {
            borderColor: 'rgba(148, 163, 184, 0.2)',
            strokeDashArray: 4,
        },
        tooltip: {
            theme: 'light',
            x: { format: 'yyyy-MM-dd' },
        },
        fill: {
            type: 'gradient',
            gradient: {
                type: 'vertical',
                shadeIntensity: 0.3,
                gradientToColors: ['#34d399'],
                opacityFrom: 0.5,
                opacityTo: 0.05,
            },
        },
        noData: {
            text: 'Cargando datos...',
            style: { color: '#64748b', fontSize: '13px' },
        },
    });

    const getTemporalesChartOptions = () => ({
        chart: {
            id: 'temporales-chart',
            type: 'area' as const,
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'Inter, sans-serif',
            foreColor: '#64748b',
            sparkline: { enabled: false },
        },
        colors: ['#6366f1'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth' as const, width: 3 },
        xaxis: {
            categories: statsData.dates.length > 0 ? statsData.dates : [startDate, endDate],
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: '#64748b', fontSize: '11px' } },
        },
        yaxis: {
            min: 0,
            forceNiceScale: true,
            labels: {
                style: { colors: '#64748b', fontSize: '11px' },
                formatter: (val: number) => Math.round(val).toString(),
            },
        },
        grid: {
            borderColor: 'rgba(148, 163, 184, 0.2)',
            strokeDashArray: 4,
        },
        tooltip: {
            theme: 'light',
            x: { format: 'yyyy-MM-dd' },
        },
        fill: {
            type: 'gradient',
            gradient: {
                type: 'vertical',
                shadeIntensity: 0.3,
                gradientToColors: ['#8b5cf6'],
                opacityFrom: 0.5,
                opacityTo: 0.05,
            },
        },
        noData: {
            text: 'Cargando datos...',
            style: { color: '#64748b', fontSize: '13px' },
        },
    });

    const modulesList = [
        {
            name: 'Garita y Accesos',
            desc: 'Control de entrada y lectura QR',
            icon: QrCode,
            href: '/admin/visitas-accesos',
            count: `${overview.garita?.accesos_hoy || 0} hoy`,
            badgeColor: 'bg-emerald-500/10 text-emerald-500',
        },
        {
            name: 'Visitas Temporales',
            desc: 'Pases digitales e invitaciones',
            icon: KeyRound,
            href: '/admin/visitas-temporales',
            count: `${overview.visitas_temporales?.total || 0} registradas`,
            badgeColor: 'bg-rose-500/10 text-rose-500',
        },
        {
            name: 'Empleados',
            desc: 'Gestión de personal y carnets',
            icon: Users,
            href: '/admin/empleados',
            count: `${overview.empleados?.total || 0} registrados`,
            badgeColor: 'bg-indigo-500/10 text-indigo-500',
        },
        {
            name: 'Proveedores',
            desc: 'Proveedores y contratistas',
            icon: Building2,
            href: '/admin/proveedores',
            count: `${overview.proveedores?.total || 0} empresas`,
            badgeColor: 'bg-purple-500/10 text-purple-500',
        },
        {
            name: 'Productores',
            desc: 'Productores agrícolas y personal',
            icon: UserCheck,
            href: '/admin/productores',
            count: `${overview.productores?.total || 0} activos`,
            badgeColor: 'bg-amber-500/10 text-amber-500',
        },
        {
            name: 'Estructura Organizacional',
            desc: 'Empresas, sucursales y cargos',
            icon: Layers,
            href: '/admin/empresas',
            count: `${overview.organizacion?.sucursales || 0} sucursales`,
            badgeColor: 'bg-cyan-500/10 text-cyan-500',
        },
    ];

    return (
        <>
            <Head title="Dashboard Principal" />

            <div className="flex flex-col gap-6 p-2 md:p-4">
                {/* Page Header */}
                <PageHeader
                    title="Dashboard General"
                    description="Panel de control centralizado con métricas de todos los módulos."
                >
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 shadow-xs">
                            <CalendarIcon className="size-4 text-muted-foreground" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent text-xs font-medium text-foreground outline-hidden"
                            />
                            <span className="text-xs text-muted-foreground">a</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent text-xs font-medium text-foreground outline-hidden"
                            />
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => fetchStats(startDate, endDate)}
                            disabled={loading}
                        >
                            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Actualizar</span>
                        </Button>
                    </div>
                </PageHeader>

                {/* Top Module Navigation Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {modulesList.map((m) => (
                        <Link
                            key={m.name}
                            href={m.href}
                            className="group relative flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className={`rounded-xl p-3 ${m.badgeColor}`}>
                                    <m.icon className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground group-hover:text-primary">
                                        {m.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                                    <span className="mt-1 inline-block text-[11px] font-medium text-muted-foreground">
                                        {m.count}
                                    </span>
                                </div>
                            </div>
                            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                        </Link>
                    ))}
                </div>

                {/* Key Metrics Summary */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SectionCard className="relative overflow-hidden border-none bg-gradient-to-br from-card to-muted/30 py-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Accesos Registrados Hoy
                                </p>
                                <p className="mt-2 text-2xl font-bold tracking-tight">
                                    {overview.garita?.accesos_hoy || 0}
                                </p>
                            </div>
                            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
                                <ShieldCheck className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-500">
                            <TrendingUp className="size-3.5" />
                            <span>{overview.garita?.activos_dentro || 0} dentro actualmente</span>
                        </div>
                    </SectionCard>

                    <SectionCard className="relative overflow-hidden border-none bg-gradient-to-br from-card to-muted/30 py-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Visitas Temporales
                                </p>
                                <p className="mt-2 text-2xl font-bold tracking-tight">
                                    {overview.visitas_temporales?.total || 0}
                                </p>
                            </div>
                            <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-500">
                                <KeyRound className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>Pases e invitaciones temporales</span>
                        </div>
                    </SectionCard>

                    <SectionCard className="relative overflow-hidden border-none bg-gradient-to-br from-card to-muted/30 py-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Empleados Activos
                                </p>
                                <p className="mt-2 text-2xl font-bold tracking-tight">
                                    {overview.empleados?.total || 0}
                                </p>
                            </div>
                            <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-500">
                                <Users className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{overview.empleados?.preregistros_pendientes || 0} pre-registros por aprobar</span>
                        </div>
                    </SectionCard>

                    <SectionCard className="relative overflow-hidden border-none bg-gradient-to-br from-card to-muted/30 py-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Proveedores & Productores
                                </p>
                                <p className="mt-2 text-2xl font-bold tracking-tight">
                                    {(overview.proveedores?.total || 0) + (overview.productores?.total || 0)}
                                </p>
                            </div>
                            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500">
                                <Building2 className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-500">
                            <span>{overview.proveedores?.total || 0} proveedores / {overview.productores?.total || 0} productores</span>
                        </div>
                    </SectionCard>
                </div>

                {/* Charts Section */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Chart 1: Visitas y Accesos en Garita */}
                    <SectionCard
                        title="Visitas y Accesos en Garita"
                        description="Frecuencia diaria de personas e ingresos registrados en garita"
                        className="p-4"
                    >
                        <div className="mt-4 h-72 w-full">
                            {chartMounted && Chart ? (
                                <Chart
                                    options={getGaritaChartOptions()}
                                    series={[
                                        {
                                            name: 'Accesos Registrados',
                                            data: statsData.accesos,
                                        },
                                    ]}
                                    type="area"
                                    height="100%"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                    Cargando gráfico de accesos...
                                </div>
                            )}
                        </div>
                    </SectionCard>

                    {/* Chart 2: Visitas Temporales */}
                    <SectionCard
                        title="Visitas Temporales"
                        description="Pases de visita e invitaciones digitales creadas por día"
                        className="p-4"
                    >
                        <div className="mt-4 h-72 w-full">
                            {chartMounted && Chart ? (
                                <Chart
                                    options={getTemporalesChartOptions()}
                                    series={[
                                        {
                                            name: 'Visitas Temporales',
                                            data: statsData.visitas_temporales,
                                        },
                                    ]}
                                    type="area"
                                    height="100%"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                    Cargando gráfico de visitas temporales...
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
