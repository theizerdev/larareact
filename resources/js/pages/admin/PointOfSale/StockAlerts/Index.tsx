import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle, Package, RefreshCw, ShoppingCart,
    XCircle, TrendingDown, ArrowRight, BarChart2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { useTranslate } from '@/hooks/use-translate';
import type { BreadcrumbItem } from '@/types';

interface ProductAlert {
    id: number;
    nombre: string;
    sku: string | null;
    codigo_barras: string | null;
    categoria: string | null;
    marca: string | null;
    stock: number;
    stock_minimo: number;
    severidad: 'agotado' | 'critico' | 'bajo' | 'alerta';
    ratio: number;
}

interface Resumen {
    agotado: number;
    critico: number;
    bajo: number;
    alerta: number;
    total: number;
}

interface Props {
    products: ProductAlert[];
    resumen: Resumen;
}

const severityConfig = {
    agotado: {
        label: 'Agotado',
        icon: XCircle,
        badgeClass: 'bg-rose-600 text-white border-rose-700',
        rowClass: 'bg-rose-50/60 dark:bg-rose-950/20 border-l-4 border-l-rose-500',
        barClass: 'bg-rose-500',
        summaryBg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800',
        summaryText: 'text-rose-700 dark:text-rose-400',
        summaryIcon: 'text-rose-500',
    },
    critico: {
        label: 'Crítico',
        icon: AlertTriangle,
        badgeClass: 'bg-orange-500 text-white border-orange-600',
        rowClass: 'bg-orange-50/60 dark:bg-orange-950/20 border-l-4 border-l-orange-400',
        barClass: 'bg-orange-500',
        summaryBg: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
        summaryText: 'text-orange-700 dark:text-orange-400',
        summaryIcon: 'text-orange-500',
    },
    bajo: {
        label: 'Bajo',
        icon: TrendingDown,
        badgeClass: 'bg-amber-500 text-white border-amber-600',
        rowClass: 'bg-amber-50/40 dark:bg-amber-950/20 border-l-4 border-l-amber-400',
        barClass: 'bg-amber-500',
        summaryBg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
        summaryText: 'text-amber-700 dark:text-amber-400',
        summaryIcon: 'text-amber-500',
    },
    alerta: {
        label: 'Alerta',
        icon: AlertTriangle,
        badgeClass: 'bg-yellow-400 text-yellow-900 border-yellow-500',
        rowClass: 'bg-yellow-50/40 dark:bg-yellow-950/20 border-l-4 border-l-yellow-400',
        barClass: 'bg-yellow-400',
        summaryBg: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
        summaryText: 'text-yellow-700 dark:text-yellow-600',
        summaryIcon: 'text-yellow-500',
    },
};

function StockBar({ ratio, severidad }: { ratio: number; severidad: ProductAlert['severidad'] }) {
    const config = severityConfig[severidad];
    const clampedRatio = Math.min(100, Math.max(0, ratio));
    return (
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
                className={`h-1.5 rounded-full transition-all ${config.barClass}`}
                style={{ width: `${clampedRatio}%` }}
            />
        </div>
    );
}

export default function StockAlertsIndex({ products, resumen }: Props) {
    const { __ } = useTranslate();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Punto de Venta'), href: '#' },
        { title: __('Alertas de Stock'), href: '/admin/stock-alerts' },
    ];

    const summaryCards = [
        { key: 'agotado', label: __('Agotados'), count: resumen.agotado },
        { key: 'critico', label: __('Críticos'), count: resumen.critico },
        { key: 'bajo', label: __('Bajo Stock'), count: resumen.bajo },
        { key: 'alerta', label: __('Alerta'), count: resumen.alerta },
    ] as const;

    return (
        <>
            <Head title={__('Alertas de Stock')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<AlertTriangle className="h-6 w-6 text-white" />}
                    title={__('Alertas de Stock Mínimo')}
                    description={__('Productos que han alcanzado o superado su nivel mínimo de inventario.')}
                    colorClassName="bg-rose-600"
                >
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.reload()}
                        className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                    >
                        <RefreshCw className="w-4 h-4 mr-1.5" />
                        {__('Actualizar')}
                    </Button>
                </ModuleHeader>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {summaryCards.map(({ key, label, count }) => {
                        const cfg = severityConfig[key];
                        const Icon = cfg.icon;
                        return (
                            <div
                                key={key}
                                className={`rounded-xl border p-4 flex items-center gap-3 transition-all ${cfg.summaryBg}`}
                            >
                                <div className={`p-2 rounded-lg bg-white/70 dark:bg-black/20 ${cfg.summaryIcon}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={`text-2xl font-extrabold leading-none ${cfg.summaryText}`}>{count}</p>
                                    <p className={`text-xs font-medium mt-0.5 ${cfg.summaryText} opacity-80`}>{label}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Products table */}
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30">
                        <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-rose-500" />
                            <h2 className="font-semibold text-base">{__('Productos con Stock Bajo')}</h2>
                            <Badge variant="secondary" className="ml-1 text-xs">
                                {resumen.total} {resumen.total === 1 ? __('producto') : __('productos')}
                            </Badge>
                        </div>
                        <Link href="/admin/productos">
                            <Button variant="outline" size="sm">
                                <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                                {__('Ir a Productos')}
                                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                        </Link>
                    </div>

                    {products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                                <BarChart2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <p className="text-base font-semibold text-foreground">{__('¡Todo bajo control!')}</p>
                            <p className="text-sm mt-1">{__('No hay productos por debajo de su stock mínimo.')}</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {/* Table header */}
                            <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20">
                                <div className="col-span-4">{__('Producto')}</div>
                                <div className="col-span-2">{__('Categoría / Marca')}</div>
                                <div className="col-span-2 text-center">{__('Stock Actual')}</div>
                                <div className="col-span-2 text-center">{__('Stock Mínimo')}</div>
                                <div className="col-span-1 text-center">{__('Estado')}</div>
                                <div className="col-span-1 text-right">{__('Acción')}</div>
                            </div>

                            {products.map((product) => {
                                const cfg = severityConfig[product.severidad];
                                const Icon = cfg.icon;
                                return (
                                    <div key={product.id} className={`grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 px-5 py-3.5 items-center ${cfg.rowClass}`}>
                                        {/* Product name */}
                                        <div className="col-span-4">
                                            <p className="text-sm font-semibold leading-tight line-clamp-2">{product.nombre}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {product.sku && (
                                                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                        {product.sku}
                                                    </span>
                                                )}
                                                {product.codigo_barras && (
                                                    <span className="text-[10px] font-mono text-muted-foreground">
                                                        {product.codigo_barras}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Category / Brand */}
                                        <div className="col-span-2">
                                            <p className="text-xs text-muted-foreground">{product.categoria || '—'}</p>
                                            <p className="text-xs font-medium">{product.marca || '—'}</p>
                                        </div>

                                        {/* Current stock */}
                                        <div className="col-span-2 text-center">
                                            <span className={`text-xl font-extrabold font-mono ${product.stock <= 0 ? 'text-rose-600' : 'text-foreground'}`}>
                                                {product.stock}
                                            </span>
                                            <div className="mt-1">
                                                <StockBar ratio={product.ratio} severidad={product.severidad} />
                                                <span className="text-[10px] text-muted-foreground">{product.ratio}% del mínimo</span>
                                            </div>
                                        </div>

                                        {/* Minimum stock */}
                                        <div className="col-span-2 text-center">
                                            <span className="text-base font-bold font-mono text-muted-foreground">
                                                {product.stock_minimo}
                                            </span>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{__('unidades mín.')}</p>
                                        </div>

                                        {/* Severity badge */}
                                        <div className="col-span-1 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badgeClass}`}>
                                                <Icon className="w-3 h-3" />
                                                {cfg.label}
                                            </span>
                                        </div>

                                        {/* Action */}
                                        <div className="col-span-1 text-right">
                                            <Link href={`/admin/productos/${product.id}/edit`}>
                                                <Button variant="outline" size="sm" className="h-7 text-xs">
                                                    {__('Actualizar')}
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

import AdminLayout from '@/layouts/admin-layout';

StockAlertsIndex.layout = (page: React.ReactNode) => (
    <AdminLayout breadcrumbs={[]}>{page}</AdminLayout>
);