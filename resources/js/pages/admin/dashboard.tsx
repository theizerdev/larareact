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
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
];

const stats = [
    {
        title: 'Ingresos totales',
        value: '$45,231.89',
        change: '+20.1%',
        icon: DollarSign,
        trend: 'up',
    },
    {
        title: 'Suscripciones',
        value: '+2,350',
        change: '+180.1%',
        icon: Users,
        trend: 'up',
    },
    {
        title: 'Ventas',
        value: '+12,234',
        change: '+19%',
        icon: CreditCard,
        trend: 'up',
    },
    {
        title: 'Activos ahora',
        value: '+573',
        change: '+201',
        icon: Activity,
        trend: 'up',
    },
];

export default function AdminDashboard() {
    return (
        <>
            <Head title="Admin Dashboard" />

            <div className="flex flex-col gap-8">
                <PageHeader
                    title="Dashboard"
                    description="Bienvenido de nuevo. Aquí tienes un resumen de tu negocio."
                >
                    <Button variant="outline" size="sm" className="gap-1">
                        Descargar reporte
                        <ArrowUpRight className="size-4" />
                    </Button>
                </PageHeader>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="h-9 rounded-full bg-muted/60 p-1">
                        <TabsTrigger
                            value="overview"
                            className="rounded-full text-xs"
                        >
                            Resumen
                        </TabsTrigger>
                        <TabsTrigger
                            value="analytics"
                            className="rounded-full text-xs"
                        >
                            Analíticas
                        </TabsTrigger>
                        <TabsTrigger
                            value="reports"
                            className="rounded-full text-xs"
                        >
                            Reportes
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
                                        {stat.title}
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
                                    vs mes anterior
                                </span>
                            </div>
                        </SectionCard>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-7">
                    <SectionCard
                        title="Tendencias"
                        description="Actividad de los últimos 30 días"
                        className="lg:col-span-5"
                    >
                        <div className="flex h-80 items-center justify-center rounded-xl border border-dashed bg-muted/20">
                            <p className="text-sm text-muted-foreground">
                                Gráfico de tendencias
                            </p>
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Actividad reciente"
                        description="Últimas acciones del sistema"
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
                                            Acción del sistema {i}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Hace {i * 2} horas
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

AdminDashboard.layout = {
    breadcrumbs,
};
