import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    ArrowUpRight,
    Users,
    Eye,
    Mail,
    Briefcase,
    Code,
    Award,
    FileText,
    ArrowRight,
    Sparkles,
    CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import type { BreadcrumbItem } from '@/types';
import Chart from 'react-apexcharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
];

interface Stats {
    visits_total: number;
    visits_last_30_days: number;
    visits_change: string;
    visits_trend: 'up' | 'down';
    projects_count: number;
    skills_count: number;
    experiences_count: number;
    clients_count: number;
    messages_total: number;
    messages_unread: number;
}

interface ChartDataItem {
    date: string;
    count: number;
}

interface RecentMessage {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    subject: string | null;
    message: string;
    is_read: boolean;
    created_at: string;
    updated_at: string;
}

interface DashboardProps {
    stats: Stats;
    chartData: ChartDataItem[];
    recentMessages: RecentMessage[];
}

export default function AdminDashboard({ stats, chartData, recentMessages }: DashboardProps) {
    const statCards = [
        {
            title: 'Visitas Totales',
            value: stats.visits_total.toLocaleString(),
            change: stats.visits_change,
            subtext: `${stats.visits_last_30_days.toLocaleString()} últimos 30 días`,
            icon: Eye,
            trend: stats.visits_trend,
            color: 'text-indigo-500 bg-indigo-500/10'
        },
        {
            title: 'Bandeja de Entrada',
            value: stats.messages_total.toLocaleString(),
            change: stats.messages_unread > 0 ? `${stats.messages_unread} sin leer` : 'Al día',
            subtext: 'Mensajes de contacto',
            icon: Mail,
            trend: stats.messages_unread > 0 ? 'down' : 'up',
            color: 'text-blue-500 bg-blue-500/10'
        },
        {
            title: 'Proyectos',
            value: stats.projects_count.toLocaleString(),
            change: 'Portafolio',
            subtext: 'Trabajos publicados',
            icon: Briefcase,
            trend: 'up',
            color: 'text-emerald-500 bg-emerald-500/10'
        },
        {
            title: 'Perfil & Skills',
            value: stats.skills_count.toLocaleString(),
            change: `${stats.experiences_count} Exp. / ${stats.clients_count} Cli.`,
            subtext: 'Resumen curricular',
            icon: Award,
            trend: 'up',
            color: 'text-violet-500 bg-violet-500/10'
        }
    ];

    const chartOptions = {
        chart: {
            id: 'visits-history',
            toolbar: { show: false },
            zoom: { enabled: false },
            sparkline: { enabled: false }
        },
        stroke: {
            curve: 'smooth' as const,
            width: 3
        },
        colors: ['#6366f1'], // Indigo
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [0, 100]
            }
        },
        grid: {
            borderColor: 'rgba(163, 163, 163, 0.1)',
            strokeDashArray: 4
        },
        xaxis: {
            categories: chartData.map((d) => d.date),
            labels: {
                show: true,
                style: { colors: '#94a3b8', fontSize: '10px' }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            min: 0,
            labels: {
                style: { colors: '#94a3b8' },
                formatter: (val: number) => Math.round(val).toString()
            }
        },
        tooltip: { theme: 'dark' }
    };

    const chartSeries = [
        {
            name: 'Visitas',
            data: chartData.map((d) => d.count)
        }
    ];

    return (
        <>
            <Head title="Admin Dashboard" />

            <div className="flex flex-col gap-8">
                <PageHeader
                    title="Dashboard"
                    description="Bienvenido de nuevo. Aquí tienes un resumen real del rendimiento de tu portafolio."
                />

                {/* Stat Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((stat) => (
                        <SectionCard
                            key={stat.title}
                            className="relative overflow-hidden border-none bg-gradient-to-br from-card to-muted/30 py-6 shadow-sm"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </p>
                                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                                        {stat.value}
                                    </p>
                                </div>
                                <div className={`rounded-xl p-2.5 ${stat.color}`}>
                                    <stat.icon className="size-5" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    stat.trend === 'up'
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                }`}>
                                    {stat.change}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {stat.subtext}
                                </span>
                            </div>
                        </SectionCard>
                    ))}
                </div>

                {/* Chart and Recent Messages */}
                <div className="grid gap-6 lg:grid-cols-7">
                    <SectionCard
                        title="Historial de Visitas"
                        description="Tráfico de visitas en los últimos 30 días"
                        className="lg:col-span-5 border-none shadow-sm"
                    >
                        <div className="mt-4">
                            <Chart
                                options={chartOptions}
                                series={chartSeries}
                                type="area"
                                height={320}
                            />
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Mensajes Recientes"
                        description="Últimas consultas recibidas"
                        className="lg:col-span-2 border-none shadow-sm"
                    >
                        <div className="space-y-4 mt-2">
                            {recentMessages.length === 0 ? (
                                <div className="flex h-60 flex-col items-center justify-center text-center p-4 border border-dashed rounded-xl">
                                    <Mail className="h-8 w-8 text-muted-foreground/35 mb-2" />
                                    <p className="text-sm font-semibold text-muted-foreground">Bandeja vacía</p>
                                    <p className="text-xs text-muted-foreground/75 mt-1">No se han recibido mensajes en el formulario de contacto.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                    {recentMessages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className="flex flex-col gap-1 p-3 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-all duration-200"
                                        >
                                            <div className="flex items-center justify-between gap-1.5">
                                                <span className="font-semibold text-xs truncate max-w-[120px]">{msg.name}</span>
                                                <span className="text-[9px] text-muted-foreground shrink-0">
                                                    {new Date(msg.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[150px]">{msg.subject || 'Sin asunto'}</span>
                                                {!msg.is_read && (
                                                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{msg.message}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="pt-2">
                                <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" asChild>
                                    <Link href="/admin/messages">
                                        Ver todos los mensajes
                                        <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </SectionCard>
                </div>

                {/* Shortcuts */}
                <SectionCard
                    title="Accesos Rápidos al Portafolio"
                    description="Administra los diferentes módulos y contenido de tu sitio personal"
                    className="border-none shadow-sm"
                >
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 mt-4">
                        <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground" asChild>
                            <Link href="/admin/about">
                                <Sparkles className="h-4 w-4 text-indigo-500 mb-0.5" />
                                <span>Información General & Hero</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground" asChild>
                            <Link href="/admin/projects">
                                <Briefcase className="h-4 w-4 text-emerald-500 mb-0.5" />
                                <span>Administrar Proyectos</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground" asChild>
                            <Link href="/admin/skills">
                                <Code className="h-4 w-4 text-violet-500 mb-0.5" />
                                <span>Gestionar Habilidades</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground" asChild>
                            <Link href="/admin/messages">
                                <Mail className="h-4 w-4 text-blue-500 mb-0.5" />
                                <span>Bandeja de Mensajes</span>
                            </Link>
                        </Button>
                    </div>
                </SectionCard>
            </div>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs,
};
