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
import { useTranslate } from '@/hooks/use-translate';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
];

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

export default function AdminDashboard({ moduleStats }: Props) {
    const { __ } = useTranslate();
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
                formatter: (val: number) => (typeof val === 'number' && !isNaN(val)) ? Math.round(val).toString() : '0',
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
            text: __('Loading data...'),
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
                formatter: (val: number) => (typeof val === 'number' && !isNaN(val)) ? Math.round(val).toString() : '0',
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
            text: __('Loading data...'),
            style: { color: '#64748b', fontSize: '13px' },
        },
    });

    const modulesList = [
        {
            name: __('Gate and Access Control'),
            desc: __('Entry control and QR reading'),
            icon: QrCode,
            href: '/admin/visitas-accesos',
            count: `${overview.garita?.accesos_hoy || 0} ${__('today')}`,
            badgeColor: 'bg-emerald-500/10 text-emerald-500',
        },
        {
            name: __('Visits'),
            desc: __('Digital visitor passes and invitations'),
            icon: KeyRound,
            href: '/admin/visitas-temporales',
            count: `${overview.visitas_temporales?.total || 0} ${__('registered')}`,
            badgeColor: 'bg-rose-500/10 text-rose-500',
        },
        {
            name: __('Employees'),
            desc: __('Staff management and ID cards'),
            icon: Users,
            href: '/admin/empleados',
            count: `${overview.empleados?.total || 0} ${__('registered')}`,
            badgeColor: 'bg-indigo-500/10 text-indigo-500',
        },
        {
            name: __('Suppliers'),
            desc: __('Suppliers and contractors'),
            icon: Building2,
            href: '/admin/proveedores',
            count: `${overview.proveedores?.total || 0} ${__('companies')}`,
            badgeColor: 'bg-purple-500/10 text-purple-500',
        },
        {
            name: __('Business Partner'),
            desc: __('Agricultural business partners and staff'),
            icon: UserCheck,
            href: '/admin/productores',
            count: `${overview.productores?.total || 0} ${__('active')}`,
            badgeColor: 'bg-amber-500/10 text-amber-500',
        },
        {
            name: __('Organizational Structure'),
            desc: __('Companies, branches and positions'),
            icon: Layers,
            href: '/admin/empresas',
            count: `${overview.organizacion?.sucursales || 0} ${__('branches')}`,
            badgeColor: 'bg-cyan-500/10 text-cyan-500',
        },
    ];

    return (
        <>
            <Head title={__('Admin Dashboard')} />

            <div className="flex flex-col gap-6 p-2 md:p-4">
                {/* Page Header */}
                <PageHeader
                    title={__('General Dashboard')}
                    description={__('Centralized control panel with metrics from all modules.')}
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
                            <span className="text-xs text-muted-foreground">{__('to')}</span>
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
                            <span className="hidden sm:inline">{__('Update')}</span>
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
                            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 group-hover:text-primary" />
                        </Link>
                    ))}
                </div>

                {/* Key Metrics Summary */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SectionCard className="relative overflow-hidden border-none bg-gradient-to-br from-card to-muted/30 py-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    {__('Accesses Registered Today')}
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
                            <span>{overview.garita?.activos_dentro || 0} {__('inside currently')}</span>
                        </div>
                    </SectionCard>

                    <SectionCard className="relative overflow-hidden border-none bg-gradient-to-br from-card to-muted/30 py-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    {__('Visits')}
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
                            <span>{__('Temporary passes and invitations')}</span>
                        </div>
                    </SectionCard>

                    <SectionCard className="relative overflow-hidden border-none bg-gradient-to-br from-card to-muted/30 py-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    {__('Active Employees')}
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
                            <span>{overview.empleados?.preregistros_pendientes || 0} {__('pre-registrations pending approval')}</span>
                        </div>
                    </SectionCard>

                    <SectionCard className="relative overflow-hidden border-none bg-gradient-to-br from-card to-muted/30 py-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    {__('Suppliers & Producers')}
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
                            <span>{overview.proveedores?.total || 0} {__('suppliers')} / {overview.productores?.total || 0} {__('producers')}</span>
                        </div>
                    </SectionCard>
                </div>

                {/* Charts Section */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Chart 1: Visitas y Accesos en Caseta */}
                    <SectionCard
                        title={__('Gate Visits and Accesses')}
                        description={__('Daily frequency of people and entries registered at gate')}
                        className="p-4"
                    >
                        <div className="mt-4 h-72 w-full">
                            {chartMounted && Chart ? (
                                <Chart
                                    options={getGaritaChartOptions()}
                                    series={[
                                        {
                                            name: __('Registered Accesses'),
                                            data: statsData.accesos,
                                        },
                                    ]}
                                    type="area"
                                    height="100%"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                    {__('Loading access chart...')}
                                </div>
                            )}
                        </div>
                    </SectionCard>

                    {/* Chart 2: Visitas */}
                    <SectionCard
                        title={__('Visits')}
                        description={__('Digital visitor passes and invitations created per day')}
                        className="p-4"
                    >
                        <div className="mt-4 h-72 w-full">
                            {chartMounted && Chart ? (
                                <Chart
                                    options={getTemporalesChartOptions()}
                                    series={[
                                        {
                                            name: __('Visits'),
                                            data: statsData.visitas_temporales,
                                        },
                                    ]}
                                    type="area"
                                    height="100%"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                    {__('Loading visits chart...')}
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>
            </div>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs,
};
