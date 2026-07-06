import { Head } from '@inertiajs/react';
import {
    Activity,
    ArrowUpRight,
    CreditCard,
    DollarSign,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dashboard } from '@/routes';
import { useTranslate } from '@/hooks/use-translate';

const stats = [
    {
        title: 'Total Revenue',
        value: '$45,231.89',
        change: '+20.1%',
        icon: DollarSign,
    },
    {
        title: 'Subscriptions',
        value: '+2,350',
        change: '+180.1%',
        icon: Users,
    },
    {
        title: 'Sales',
        value: '+12,234',
        change: '+19%',
        icon: CreditCard,
    },
    {
        title: 'Active Now',
        value: '+573',
        change: '+201',
        icon: Activity,
    },
];

export default function Dashboard() {
    const { __ } = useTranslate();

    return (
        <>
            <Head title={__('Dashboard')} />

            <div className="flex flex-col gap-8">
                <PageHeader
                    title={__('Dashboard')}
                    description={__(
                        'Welcome back. Here is an overview of your business.',
                    )}
                >
                    <Button variant="outline" size="sm" className="gap-1">
                        {__('Download report')}
                        <ArrowUpRight className="size-4" />
                    </Button>
                </PageHeader>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="h-9 rounded-full bg-muted/60 p-1">
                        <TabsTrigger
                            value="overview"
                            className="rounded-full text-xs shadow-xs"
                        >
                            {__('Overview')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="analytics"
                            className="rounded-full text-xs shadow-xs"
                        >
                            {__('Analytics')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="reports"
                            className="rounded-full text-xs shadow-xs"
                        >
                            {__('Reports')}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <SectionCard
                            key={stat.title}
                            className="relative overflow-hidden border-none bg-gradient-to-br from-card to-muted/30 py-6 shadow-sm"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {__(stat.title)}
                                    </p>
                                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                                        {stat.value}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                                    <stat.icon className="size-5" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                    {stat.change}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {__('vs previous month')}
                                </span>
                            </div>
                        </SectionCard>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-7">
                    <SectionCard
                        title={__('Trends')}
                        description={__('Activity for the last 30 days')}
                        className="lg:col-span-5"
                    >
                        <div className="flex h-80 items-center justify-center rounded-xl border border-dashed bg-muted/20">
                            <p className="text-sm text-muted-foreground">
                                {__('Trends chart')}
                            </p>
                        </div>
                    </SectionCard>

                    <SectionCard
                        title={__('Recent activity')}
                        description={__('Latest system actions')}
                        className="lg:col-span-2"
                    >
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3"
                                >
                                    <div className="size-2 rounded-full bg-primary" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            {__('System action :index', {
                                                index: i.toString(),
                                            })}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {__(':time hours ago', {
                                                time: (i * 2).toString(),
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
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
