import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
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
    Calendar as CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import type { BreadcrumbItem } from '@/types';
import Chart from 'react-apexcharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DayPicker, type DateRange } from 'react-day-picker';
import { format, parseISO, subDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslate } from '@/hooks/use-translate';

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

interface Filters {
    start_date: string;
    end_date: string;
}

interface DashboardProps {
    stats: Stats;
    chartData: ChartDataItem[];
    recentMessages: RecentMessage[];
    filters: Filters;
}

export default function AdminDashboard({ stats, chartData, recentMessages, filters }: DashboardProps) {
    const { __ } = useTranslate();
    const { locale } = usePage().props as any;
    const dateLocale = locale === 'es' ? es : enUS;

    const [range, setRange] = useState<DateRange | undefined>({
        from: parseISO(filters.start_date),
        to: parseISO(filters.end_date)
    });

    useEffect(() => {
        setRange({
            from: parseISO(filters.start_date),
            to: parseISO(filters.end_date)
        });
    }, [filters.start_date, filters.end_date]);

    const handleApplyFilter = () => {
        if (range?.from && range?.to) {
            router.get(
                window.location.pathname,
                {
                    start_date: format(range.from, 'yyyy-MM-dd'),
                    end_date: format(range.to, 'yyyy-MM-dd')
                },
                {
                    preserveState: true,
                    preserveScroll: true
                }
            );
        }
    };

    const handleQuickRange = (days: number) => {
        const from = subDays(new Date(), days);
        const to = new Date();
        setRange({ from, to });
        router.get(
            window.location.pathname,
            {
                start_date: format(from, 'yyyy-MM-dd'),
                end_date: format(to, 'yyyy-MM-dd')
            },
            {
                preserveState: true,
                preserveScroll: true
            }
        );
    };

    const statCards = [
        {
            title: __('Visits (Filtered)'),
            value: stats.visits_last_30_days.toLocaleString(),
            change: stats.visits_change,
            subtext: __('vs previous period'),
            icon: Eye,
            trend: stats.visits_trend,
            color: 'text-indigo-500 bg-indigo-500/10'
        },
        {
            title: __('New Messages'),
            value: stats.messages_total.toLocaleString(),
            change: stats.messages_unread > 0 ? __(':count unread', { count: stats.messages_unread.toString() }) : __('Up to date'),
            subtext: __('Contact inbox'),
            icon: Mail,
            trend: stats.messages_unread > 0 ? 'down' : 'up',
            color: 'text-blue-500 bg-blue-500/10'
        },
        {
            title: __('Projects'),
            value: stats.projects_count.toLocaleString(),
            change: __('Portfolio'),
            subtext: __('Published works'),
            icon: Briefcase,
            trend: 'up',
            color: 'text-emerald-500 bg-emerald-500/10'
        },
        {
            title: __('Profile & Skills'),
            value: stats.skills_count.toLocaleString(),
            change: __(':experiences Exp. / :clients Cli.', { experiences: stats.experiences_count.toString(), clients: stats.clients_count.toString() }),
            subtext: __('Curriculum summary'),
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
        tooltip: { theme: 'dark' as const }
    };

    const chartSeries = [
        {
            name: 'Visitas',
            data: chartData.map((d) => d.count)
        }
    ];

    return (
        <>
            <Head title={__('Dashboard')} />

            <div className="flex flex-col gap-8">
                <PageHeader
                    title={__('Dashboard')}
                    description={__('Welcome back. Here is an overview of your portfolio performance.')}
                >
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 text-xs h-9 cursor-pointer">
                                <CalendarIcon className="h-4 w-4 text-indigo-500" />
                                <span>
                                    {range?.from ? (
                                        range.to ? (
                                            <>
                                                {format(range.from, 'dd LLL yyyy', { locale: dateLocale })} - {format(range.to, 'dd LLL yyyy', { locale: dateLocale })}
                                            </>
                                        ) : (
                                            format(range.from, 'dd LLL yyyy', { locale: dateLocale })
                                        )
                                    ) : (
                                        __('Filter dates')
                                    )}
                                </span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4 flex flex-col md:flex-row gap-4" align="end">
                            {/* Shortcuts */}
                            <div className="flex flex-col gap-1.5 border-r pr-4 justify-center min-w-[120px]">
                                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">{__('Quick')}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start text-xs font-normal h-8"
                                    onClick={() => handleQuickRange(7)}
                                >
                                    {__('Last 7 days')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start text-xs font-normal h-8"
                                    onClick={() => handleQuickRange(15)}
                                >
                                    {__('Last 15 days')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start text-xs font-normal h-8"
                                    onClick={() => handleQuickRange(30)}
                                >
                                    {__('Last 30 days')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start text-xs font-normal h-8"
                                    onClick={() => handleQuickRange(90)}
                                >
                                    {__('Last 90 days')}
                                </Button>
                            </div>

                            {/* Calendar selection */}
                            <div className="flex flex-col gap-3">
                                <DayPicker
                                    mode="range"
                                    selected={range}
                                    onSelect={setRange}
                                    locale={dateLocale}
                                    className="p-0 m-0"
                                    classNames={{
                                        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                                        month: 'space-y-4',
                                        month_caption: 'flex justify-center pt-1 relative items-center mb-2',
                                        caption_label: 'text-sm font-semibold',
                                        nav: 'space-x-1 flex items-center',
                                        button_previous: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1',
                                        button_next: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1',
                                        month_grid: 'w-full border-collapse space-y-1',
                                        weekdays: 'flex',
                                        weekday: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
                                        week: 'flex w-full mt-2',
                                        day: 'h-9 w-9 text-center text-sm p-0 relative',
                                        day_button: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-muted/70 transition-all',
                                        selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                                        today: 'bg-accent text-accent-foreground font-bold',
                                        outside: 'text-muted-foreground opacity-30 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
                                        disabled: 'text-muted-foreground opacity-50',
                                        hidden: 'invisible',
                                    }}
                                />
                                <div className="flex justify-end gap-2 border-t pt-3">
                                    <Button
                                        size="sm"
                                        className="text-xs h-8 cursor-pointer"
                                        disabled={!range?.from || !range?.to}
                                        onClick={handleApplyFilter}
                                    >
                                        {__('Apply Filter')}
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </PageHeader>

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
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${stat.trend === 'up'
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
                        title={__('Visits History')}
                        description={__('Visits traffic between :start and :end', {
                            start: format(parseISO(filters.start_date), 'dd MMM yyyy', { locale: dateLocale }),
                            end: format(parseISO(filters.end_date), 'dd MMM yyyy', { locale: dateLocale })
                        })}
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
                        title={__('Recent Messages')}
                        description={__('Latest inquiries received')}
                        className="lg:col-span-2 border-none shadow-sm"
                    >
                        <div className="space-y-4 mt-2">
                            {recentMessages.length === 0 ? (
                                <div className="flex h-60 flex-col items-center justify-center text-center p-4 border border-dashed rounded-xl">
                                    <Mail className="h-8 w-8 text-muted-foreground/35 mb-2" />
                                    <p className="text-sm font-semibold text-muted-foreground">{__('Inbox empty')}</p>
                                    <p className="text-xs text-muted-foreground/75 mt-1">{__('No messages received in the selected range.')}</p>
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
                                                    {new Date(msg.created_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'short' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[150px]">{msg.subject || __('No subject')}</span>
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
                                        {__('View all messages')}
                                        <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </SectionCard>
                </div>

                {/* Shortcuts */}
                <SectionCard
                    title={__('Quick Access to Portfolio')}
                    description={__('Manage the different modules and content of your personal site')}
                    className="border-none shadow-sm"
                >
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 mt-4">
                        <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground" asChild>
                            <Link href="/admin/about">
                                <Sparkles className="h-4 w-4 text-indigo-500 mb-0.5" />
                                <span>{__('General Info & Hero')}</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground" asChild>
                            <Link href="/admin/projects">
                                <Briefcase className="h-4 w-4 text-emerald-500 mb-0.5" />
                                <span>{__('Manage Projects')}</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground" asChild>
                            <Link href="/admin/skills">
                                <Code className="h-4 w-4 text-violet-500 mb-0.5" />
                                <span>{__('Manage Skills')}</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground" asChild>
                            <Link href="/admin/messages">
                                <Mail className="h-4 w-4 text-blue-500 mb-0.5" />
                                <span>{__('Message Inbox')}</span>
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
