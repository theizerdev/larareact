import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    BarChart2,
    ChevronDown,
    ChevronRight,
    ChevronsUpDown,
    FileDown,
    Layers,
    Package,
    Printer,
    RefreshCw,
    Search,
    ShoppingCart,
    Tag,
    TrendingDown,
    Wrench,
    X,
    XCircle,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';
import AdminLayout from '@/layouts/admin-layout';
import type { BreadcrumbItem } from '@/types/navigation';

type SeverityKey = 'agotado' | 'critico' | 'bajo' | 'alerta';
type BrandSortMode = 'az' | 'urgencia' | 'cantidad';

interface ProductAlert {
    id: number;
    nombre: string;
    sku: string | null;
    codigo_barras: string | null;
    categoria: string | null;
    modelo?: string | null;
    marca: string | null;
    marca_id?: number | null;
    marca_logo?: string | null;
    tipo_producto?: 'venta' | 'repuesto' | 'servicio';
    stock: number;
    stock_minimo: number;
    faltante?: number;
    precio_compra?: number;
    precio_venta?: number;
    costo_reposicion?: number;
    severidad: SeverityKey;
    ratio: number;
}

interface BrandGroup {
    key: string;
    marca: string;
    marca_id: number | null;
    marca_logo: string | null;
    sin_marca: boolean;
    total_productos: number;
    agotados: number;
    criticos: number;
    bajos: number;
    alertas: number;
    unidades_faltantes: number;
    costo_reposicion: number;
    products: ProductAlert[];
}

interface Resumen {
    agotado: number;
    critico: number;
    bajo: number;
    alerta: number;
    total: number;
    total_marcas?: number;
    unidades_faltantes?: number;
    costo_estimado_reposicion?: number;
}

interface Props {
    products: ProductAlert[];
    brandGroups?: BrandGroup[];
    resumen: Resumen;
}

const severityConfig = {
    agotado: {
        label: 'Agotado',
        icon: XCircle,
        badgeClass: 'bg-rose-600 text-white border-rose-700',
        softBadgeClass: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
        rowClass: 'bg-rose-50/50 dark:bg-rose-950/15 border-l-4 border-l-rose-500 hover:bg-rose-50/80 dark:hover:bg-rose-950/25',
        barClass: 'bg-rose-500',
        summaryBg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800',
        summaryActiveRing: 'ring-2 ring-rose-500 shadow-md',
        summaryText: 'text-rose-700 dark:text-rose-400',
        summaryIcon: 'text-rose-500',
    },
    critico: {
        label: 'Crítico',
        icon: AlertTriangle,
        badgeClass: 'bg-orange-500 text-white border-orange-600',
        softBadgeClass: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
        rowClass: 'bg-orange-50/40 dark:bg-orange-950/15 border-l-4 border-l-orange-400 hover:bg-orange-50/70 dark:hover:bg-orange-950/25',
        barClass: 'bg-orange-500',
        summaryBg: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
        summaryActiveRing: 'ring-2 ring-orange-500 shadow-md',
        summaryText: 'text-orange-700 dark:text-orange-400',
        summaryIcon: 'text-orange-500',
    },
    bajo: {
        label: 'Bajo',
        icon: TrendingDown,
        badgeClass: 'bg-amber-500 text-white border-amber-600',
        softBadgeClass: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
        rowClass: 'bg-amber-50/30 dark:bg-amber-950/15 border-l-4 border-l-amber-400 hover:bg-amber-50/60 dark:hover:bg-amber-950/25',
        barClass: 'bg-amber-500',
        summaryBg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
        summaryActiveRing: 'ring-2 ring-amber-500 shadow-md',
        summaryText: 'text-amber-700 dark:text-amber-400',
        summaryIcon: 'text-amber-500',
    },
    alerta: {
        label: 'Alerta',
        icon: AlertTriangle,
        badgeClass: 'bg-yellow-400 text-yellow-900 border-yellow-500',
        softBadgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-800',
        rowClass: 'bg-yellow-50/25 dark:bg-yellow-950/10 border-l-4 border-l-yellow-400 hover:bg-yellow-50/50 dark:hover:bg-yellow-950/20',
        barClass: 'bg-yellow-400',
        summaryBg: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
        summaryActiveRing: 'ring-2 ring-yellow-500 shadow-md',
        summaryText: 'text-yellow-700 dark:text-yellow-500',
        summaryIcon: 'text-yellow-500',
    },
};

function formatQty(value: number): string {
    if (Math.abs(value - Math.round(value)) < 0.0001) {
        return Math.round(value).toLocaleString('es-MX');
    }

    return value.toLocaleString('es-MX', { maximumFractionDigits: 2 });
}

function getBrandInitials(name: string): string {
    const clean = name.trim();
    if (!clean) return 'SM';
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    return clean.slice(0, 2).toUpperCase();
}

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
    const { currencySymbol = '$' } = usePage().props as { currencySymbol?: string };

    const [searchTerm, setSearchTerm] = useState('');
    const [brandFilter, setBrandFilter] = useState<string>('all');
    const [severityFilter, setSeverityFilter] = useState<SeverityKey | 'all'>('all');
    const [brandSort, setBrandSort] = useState<BrandSortMode>('az');
    const [collapsedBrands, setCollapsedBrands] = useState<Record<string, boolean>>({});

    const breadcrumbs: BreadcrumbItem[] = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Productos'), href: '/admin/productos' },
        { title: __('Alertas de Stock'), href: '/admin/stock-alerts' },
    ];

    // All available brand options derived from full dataset
    const allBrandOptions = useMemo(() => {
        const map = new Map<string, { key: string; label: string; count: number; sinMarca: boolean }>();

        for (const p of products) {
            const rawBrand = p.marca?.trim() || '';
            const sinMarca = rawBrand === '';
            const key = sinMarca ? '__sin_marca__' : rawBrand.toLowerCase();
            const label = sinMarca ? __('Sin Marca') : rawBrand;

            const existing = map.get(key);
            if (existing) {
                existing.count += 1;
            } else {
                map.set(key, { key, label, count: 1, sinMarca });
            }
        }

        return Array.from(map.values()).sort((a, b) => {
            if (a.sinMarca !== b.sinMarca) return a.sinMarca ? 1 : -1;

            return a.label.localeCompare(b.label, 'es', { sensitivity: 'base', numeric: true });
        });
    }, [products, __]);

    // Filtered & Grouped by Brand
    const filteredBrandGroups = useMemo<BrandGroup[]>(() => {
        const query = searchTerm.trim().toLowerCase();

        const filtered = products.filter((p) => {
            const rawBrand = p.marca?.trim() || '';
            const pBrandKey = rawBrand === '' ? '__sin_marca__' : rawBrand.toLowerCase();

            if (brandFilter !== 'all' && pBrandKey !== brandFilter) {
                return false;
            }

            if (severityFilter !== 'all' && p.severidad !== severityFilter) {
                return false;
            }

            if (query !== '') {
                const haystack = [
                    p.nombre,
                    p.sku,
                    p.codigo_barras,
                    p.categoria,
                    p.marca,
                    p.modelo,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                if (!haystack.includes(query)) {
                    return false;
                }
            }

            return true;
        });

        const groupsMap = new Map<string, BrandGroup>();

        for (const p of filtered) {
            const rawBrand = p.marca?.trim() || '';
            const sinMarca = rawBrand === '';
            const key = sinMarca ? '__sin_marca__' : rawBrand.toLowerCase();
            const marcaLabel = sinMarca ? __('Sin Marca') : rawBrand;
            const faltante = p.faltante ?? Math.max(0, p.stock_minimo - p.stock);
            const costo = p.costo_reposicion ?? faltante * (p.precio_compra ?? 0);

            let group = groupsMap.get(key);
            if (!group) {
                group = {
                    key,
                    marca: marcaLabel,
                    marca_id: sinMarca ? null : (p.marca_id ?? null),
                    marca_logo: sinMarca ? null : (p.marca_logo ?? null),
                    sin_marca: sinMarca,
                    total_productos: 0,
                    agotados: 0,
                    criticos: 0,
                    bajos: 0,
                    alertas: 0,
                    unidades_faltantes: 0,
                    costo_reposicion: 0,
                    products: [],
                };
                groupsMap.set(key, group);
            }

            group.total_productos += 1;
            if (p.severidad === 'agotado') group.agotados += 1;
            else if (p.severidad === 'critico') group.criticos += 1;
            else if (p.severidad === 'bajo') group.bajos += 1;
            else group.alertas += 1;

            group.unidades_faltantes += faltante;
            group.costo_reposicion += costo;
            group.products.push(p);
        }

        const groups = Array.from(groupsMap.values());

        for (const g of groups) {
            g.products.sort((a, b) => {
                if (a.ratio !== b.ratio) return a.ratio - b.ratio;
                if (a.stock !== b.stock) return a.stock - b.stock;

                return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
            });
        }

        groups.sort((a, b) => {
            if (a.sin_marca !== b.sin_marca) return a.sin_marca ? 1 : -1;

            if (brandSort === 'urgencia') {
                if (a.agotados !== b.agotados) return b.agotados - a.agotados;
                if (a.criticos !== b.criticos) return b.criticos - a.criticos;
                if (a.total_productos !== b.total_productos) return b.total_productos - a.total_productos;
            } else if (brandSort === 'cantidad') {
                if (a.total_productos !== b.total_productos) return b.total_productos - a.total_productos;
                if (a.agotados !== b.agotados) return b.agotados - a.agotados;
            }

            return a.marca.localeCompare(b.marca, 'es', { sensitivity: 'base', numeric: true });
        });

        return groups;
    }, [products, brandFilter, severityFilter, searchTerm, brandSort, __]);

    const filteredTotalProducts = useMemo(
        () => filteredBrandGroups.reduce((acc, g) => acc + g.total_productos, 0),
        [filteredBrandGroups]
    );

    const totalMarcasCount = resumen.total_marcas ?? allBrandOptions.length;
    const totalUnidadesFaltantes = useMemo(
        () =>
            resumen.unidades_faltantes ??
            products.reduce((acc, p) => acc + (p.faltante ?? Math.max(0, p.stock_minimo - p.stock)), 0),
        [resumen.unidades_faltantes, products]
    );

    const hasActiveFilters =
        brandFilter !== 'all' || severityFilter !== 'all' || searchTerm.trim() !== '';

    const allCollapsed =
        filteredBrandGroups.length > 0 &&
        filteredBrandGroups.every((g) => Boolean(collapsedBrands[g.key]));

    const toggleBrandCollapse = (key: string) => {
        setCollapsedBrands((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const toggleCollapseAll = () => {
        if (allCollapsed) {
            setCollapsedBrands({});
        } else {
            const next: Record<string, boolean> = {};
            for (const g of filteredBrandGroups) {
                next[g.key] = true;
            }
            setCollapsedBrands(next);
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setBrandFilter('all');
        setSeverityFilter('all');
    };

    const buildPdfUrl = (inline: boolean, specificMarcaParam?: string): string => {
        const params = new URLSearchParams();

        const targetBrand = specificMarcaParam ?? brandFilter;
        if (targetBrand && targetBrand !== 'all') {
            if (targetBrand === '__sin_marca__') {
                params.set('marca', '__sin_marca__');
            } else {
                const matched = allBrandOptions.find((b) => b.key === targetBrand);
                params.set('marca', matched ? matched.label : targetBrand);
            }
        }

        if (!specificMarcaParam) {
            if (severityFilter !== 'all') {
                params.set('severidad', severityFilter);
            }
            if (searchTerm.trim() !== '') {
                params.set('search', searchTerm.trim());
            }
        }

        params.set('sort_brands', brandSort);

        if (inline) {
            params.set('inline', '1');
        }

        const qs = params.toString();

        return `/admin/stock-alerts/export-pdf${qs ? `?${qs}` : ''}`;
    };

    const handleExportPdf = (inline: boolean, specificMarcaParam?: string) => {
        const url = buildPdfUrl(inline, specificMarcaParam);
        if (inline) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            window.location.assign(url);
        }
    };

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
                    description={__('Productos agrupados por marca que han alcanzado o están por debajo de su nivel mínimo de inventario.')}
                    colorClassName="bg-rose-600"
                >
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                            type="button"
                            size="sm"
                            disabled={filteredTotalProducts === 0}
                            onClick={() => handleExportPdf(false)}
                            className="bg-white text-rose-700 hover:bg-rose-50 font-bold shadow-sm border-0"
                        >
                            <FileDown className="w-4 h-4 mr-1.5" />
                            {hasActiveFilters ? __('Exportar PDF (Filtrado)') : __('Exportar PDF')}
                        </Button>

                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={filteredTotalProducts === 0}
                            onClick={() => handleExportPdf(true)}
                            className="bg-white/20 text-white border border-white/30 hover:bg-white/30"
                            title={__('Abrir vista previa del reporte PDF en una nueva pestaña')}
                        >
                            <Printer className="w-4 h-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">{__('Vista Previa PDF')}</span>
                        </Button>

                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => router.reload()}
                            className="bg-white/20 text-white border border-white/30 hover:bg-white/30"
                        >
                            <RefreshCw className="w-4 h-4 sm:mr-1.5" />
                            <span className="hidden md:inline">{__('Actualizar')}</span>
                        </Button>
                    </div>
                </ModuleHeader>

                {/* Summary KPI Cards (click severity cards to filter) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {summaryCards.map(({ key, label, count }) => {
                        const cfg = severityConfig[key];
                        const Icon = cfg.icon;
                        const isActive = severityFilter === key;

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setSeverityFilter((prev) => (prev === key ? 'all' : key))}
                                className={`text-left rounded-xl border p-4 flex items-center gap-3 transition-all cursor-pointer hover:scale-[1.01] ${cfg.summaryBg} ${isActive ? cfg.summaryActiveRing : ''}`}
                                title={__('Clic para filtrar por este estado')}
                            >
                                <div className={`p-2 rounded-lg bg-white/80 dark:bg-black/25 ${cfg.summaryIcon}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-2xl font-extrabold leading-none ${cfg.summaryText}`}>{count}</p>
                                    <p className={`text-xs font-semibold mt-0.5 truncate ${cfg.summaryText} opacity-85`}>
                                        {label}
                                    </p>
                                </div>
                            </button>
                        );
                    })}

                    {/* Brands & Units to Restock Card */}
                    <div className="col-span-2 sm:col-span-1 rounded-xl border p-4 flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800">
                        <div className="p-2 rounded-lg bg-white/80 dark:bg-black/25 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-2xl font-extrabold leading-none text-indigo-700 dark:text-indigo-300">
                                {totalMarcasCount}
                            </p>
                            <p className="text-xs font-semibold mt-0.5 text-indigo-700 dark:text-indigo-300 opacity-85 truncate">
                                {totalMarcasCount === 1 ? __('Marca con alerta') : __('Marcas con alerta')}
                            </p>
                            {totalUnidadesFaltantes > 0 && (
                                <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
                                    +{formatQty(totalUnidadesFaltantes)} {__('uds. a reponer')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filter & Grouping Toolbar */}
                <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2.5">
                            {/* Search Input */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={__('Buscar por producto, SKU, código o categoría...')}
                                    className="pl-9 pr-8 h-9 text-sm"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Brand Filter */}
                            <div className="w-full sm:w-56">
                                <Select value={brandFilter} onValueChange={setBrandFilter}>
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue placeholder={__('Filtrar por marca')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {__('Todas las marcas')} ({resumen.total})
                                        </SelectItem>
                                        {allBrandOptions.map((b) => (
                                            <SelectItem key={b.key} value={b.key}>
                                                {b.label} ({b.count})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Brand Sort Order */}
                            <div className="w-full sm:w-52">
                                <Select value={brandSort} onValueChange={(v) => setBrandSort(v as BrandSortMode)}>
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue placeholder={__('Ordenar marcas')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="az">{__('Marcas: Alfabético (A - Z)')}</SelectItem>
                                        <SelectItem value="urgencia">{__('Marcas: Mayor urgencia')}</SelectItem>
                                        <SelectItem value="cantidad">{__('Marcas: Más productos')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Right Controls */}
                        <div className="flex flex-wrap items-center gap-2">
                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-9 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                >
                                    <X className="w-3.5 h-3.5 mr-1" />
                                    {__('Limpiar filtros')}
                                </Button>
                            )}

                            {filteredBrandGroups.length > 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={toggleCollapseAll}
                                    className="h-9 text-xs"
                                >
                                    <ChevronsUpDown className="w-3.5 h-3.5 mr-1.5" />
                                    {allCollapsed ? __('Expandir marcas') : __('Contraer marcas')}
                                </Button>
                            )}

                            <Link href="/admin/productos">
                                <Button variant="outline" size="sm" className="h-9 text-xs">
                                    <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                                    {__('Ir a Productos')}
                                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Active Status Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-rose-500" />
                            <span>
                                {__('Mostrando')}{' '}
                                <strong className="text-foreground">{filteredTotalProducts}</strong>{' '}
                                {filteredTotalProducts === 1 ? __('producto') : __('productos')} {__('agrupados en')}{' '}
                                <strong className="text-foreground">{filteredBrandGroups.length}</strong>{' '}
                                {filteredBrandGroups.length === 1 ? __('marca') : __('marcas')}
                            </span>
                        </div>

                        {filteredTotalProducts > 0 && (
                            <button
                                type="button"
                                onClick={() => handleExportPdf(false)}
                                className="inline-flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                            >
                                <FileDown className="w-3.5 h-3.5" />
                                {__('Descargar reporte ejecutivo en PDF')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Empty States */}
                {products.length === 0 ? (
                    <div className="rounded-xl border bg-card shadow-sm flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                            <BarChart2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <p className="text-base font-semibold text-foreground">{__('¡Todo bajo control!')}</p>
                        <p className="text-sm mt-1">{__('No hay productos por debajo de su stock mínimo.')}</p>
                    </div>
                ) : filteredBrandGroups.length === 0 ? (
                    <div className="rounded-xl border bg-card shadow-sm flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Search className="w-10 h-10 text-muted-foreground/50 mb-3" />
                        <p className="text-base font-semibold text-foreground">{__('Sin resultados para el filtro actual')}</p>
                        <p className="text-sm mt-1">{__('Prueba ajustando la búsqueda, marca o estado de alerta.')}</p>
                        <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                            {__('Mostrar todos los productos en alerta')}
                        </Button>
                    </div>
                ) : (
                    /* Brand Grouped Cards */
                    <div className="space-y-5">
                        {filteredBrandGroups.map((group) => {
                            const isCollapsed = Boolean(collapsedBrands[group.key]);

                            return (
                                <div
                                    key={group.key}
                                    className="rounded-xl border bg-card shadow-sm overflow-hidden transition-all"
                                >
                                    {/* Brand Header Banner */}
                                    <div
                                        onClick={() => toggleBrandCollapse(group.key)}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-slate-900 dark:bg-slate-900/95 text-white cursor-pointer select-none hover:bg-slate-800/95 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="text-slate-300 flex-shrink-0">
                                                {isCollapsed ? (
                                                    <ChevronRight className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}
                                            </div>

                                            {/* Brand Logo or Monogram */}
                                            {group.marca_logo ? (
                                                <img
                                                    src={group.marca_logo}
                                                    alt={group.marca}
                                                    className="w-9 h-9 rounded-lg object-contain bg-white p-1 flex-shrink-0"
                                                />
                                            ) : (
                                                <div
                                                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 border ${
                                                        group.sin_marca
                                                            ? 'bg-slate-700/80 border-slate-600 text-slate-200'
                                                            : 'bg-indigo-600/90 border-indigo-400/40 text-white'
                                                    }`}
                                                >
                                                    {group.sin_marca ? (
                                                        <Tag className="w-4 h-4" />
                                                    ) : (
                                                        getBrandInitials(group.marca)
                                                    )}
                                                </div>
                                            )}

                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-bold text-sm sm:text-base tracking-tight uppercase truncate">
                                                        {group.marca}
                                                    </h3>
                                                    <Badge className="bg-white/15 hover:bg-white/20 text-white border-white/20 text-[11px] font-semibold">
                                                        {group.total_productos}{' '}
                                                        {group.total_productos === 1 ? __('producto') : __('productos')}
                                                    </Badge>
                                                </div>

                                                {/* Per-brand severity breakdown */}
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                    {group.agotados > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/25 text-rose-200 border border-rose-400/30">
                                                            {group.agotados} {group.agotados === 1 ? __('Agotado') : __('Agotados')}
                                                        </span>
                                                    )}
                                                    {group.criticos > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/25 text-orange-200 border border-orange-400/30">
                                                            {group.criticos} {group.criticos === 1 ? __('Crítico') : __('Críticos')}
                                                        </span>
                                                    )}
                                                    {group.bajos > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-200 border border-amber-400/30">
                                                            {group.bajos} {__('Bajo')}
                                                        </span>
                                                    )}
                                                    {group.alertas > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-200 border border-yellow-300/30">
                                                            {group.alertas} {__('Alerta')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Brand Metrics + Single-Brand PDF Export */}
                                        <div
                                            className="flex items-center justify-between sm:justify-end gap-3 pl-7 sm:pl-0"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="text-left sm:text-right">
                                                <div className="text-xs font-bold text-emerald-300">
                                                    {__('Por pedir')}: +{formatQty(group.unidades_faltantes)} {__('uds.')}
                                                </div>
                                                {group.costo_reposicion > 0 && (
                                                    <div className="text-[11px] text-slate-300">
                                                        {__('Reposición est.')}: {currencySymbol}
                                                        {group.costo_reposicion.toLocaleString('es-MX', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                onClick={() =>
                                                    handleExportPdf(
                                                        false,
                                                        group.sin_marca ? '__sin_marca__' : group.marca
                                                    )
                                                }
                                                className="h-8 text-xs bg-white/15 hover:bg-white/25 text-white border border-white/25 flex-shrink-0"
                                                title={__('Exportar reporte PDF únicamente de esta marca')}
                                            >
                                                <FileDown className="w-3.5 h-3.5 mr-1" />
                                                PDF
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Collapsible Brand Products Table */}
                                    {!isCollapsed && (
                                        <div className="divide-y">
                                            {/* Table Columns Header */}
                                            <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30">
                                                <div className="col-span-4">{__('Producto / SKU')}</div>
                                                <div className="col-span-2">{__('Categoría / Modelo')}</div>
                                                <div className="col-span-2 text-center">{__('Stock Actual')}</div>
                                                <div className="col-span-1 text-center">{__('Mínimo')}</div>
                                                <div className="col-span-1 text-center">{__('A Pedir')}</div>
                                                <div className="col-span-1 text-center">{__('Estado')}</div>
                                                <div className="col-span-1 text-right">{__('Acción')}</div>
                                            </div>

                                            {group.products.map((product) => {
                                                const cfg = severityConfig[product.severidad];
                                                const Icon = cfg.icon;
                                                const faltante =
                                                    product.faltante ?? Math.max(0, product.stock_minimo - product.stock);
                                                const searchTarget =
                                                    product.sku || product.codigo_barras || product.nombre;

                                                return (
                                                    <div
                                                        key={product.id}
                                                        className={`grid grid-cols-1 sm:grid-cols-12 gap-3 px-5 py-3.5 items-center transition-colors ${cfg.rowClass}`}
                                                    >
                                                        {/* Product Name & Codes */}
                                                        <div className="sm:col-span-4 min-w-0">
                                                            <p className="text-sm font-semibold leading-tight line-clamp-2 text-foreground">
                                                                {product.nombre}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                                {product.sku && (
                                                                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60">
                                                                        {product.sku}
                                                                    </span>
                                                                )}
                                                                {product.codigo_barras &&
                                                                    product.codigo_barras !== product.sku && (
                                                                        <span className="text-[10px] font-mono text-muted-foreground">
                                                                            {product.codigo_barras}
                                                                        </span>
                                                                    )}
                                                                {product.tipo_producto === 'repuesto' && (
                                                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                                                                        <Wrench className="w-2.5 h-2.5" />
                                                                        {__('Repuesto')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Category & Model */}
                                                        <div className="sm:col-span-2 min-w-0">
                                                            <p className="text-xs font-medium text-foreground truncate">
                                                                {product.categoria || __('General')}
                                                            </p>
                                                            {product.modelo && (
                                                                <p className="text-[11px] text-muted-foreground truncate">
                                                                    {product.modelo}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Current Stock */}
                                                        <div className="sm:col-span-2 text-left sm:text-center">
                                                            <div className="flex sm:justify-center items-baseline gap-1.5">
                                                                <span className="sm:hidden text-xs text-muted-foreground">
                                                                    {__('Stock')}:
                                                                </span>
                                                                <span
                                                                    className={`text-lg font-extrabold font-mono leading-none ${
                                                                        product.stock <= 0
                                                                            ? 'text-rose-600 dark:text-rose-400'
                                                                            : 'text-foreground'
                                                                    }`}
                                                                >
                                                                    {formatQty(product.stock)}
                                                                </span>
                                                            </div>
                                                            <div className="mt-1.5 max-w-[130px] sm:mx-auto">
                                                                <StockBar
                                                                    ratio={product.ratio}
                                                                    severidad={product.severidad}
                                                                />
                                                                <span className="text-[10px] text-muted-foreground block mt-0.5">
                                                                    {product.ratio}% {__('del mínimo')}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Minimum Stock */}
                                                        <div className="sm:col-span-1 text-left sm:text-center">
                                                            <span className="sm:hidden text-xs text-muted-foreground mr-1.5">
                                                                {__('Mínimo')}:
                                                            </span>
                                                            <span className="text-sm font-bold font-mono text-muted-foreground">
                                                                {formatQty(product.stock_minimo)}
                                                            </span>
                                                            <p className="hidden sm:block text-[10px] text-muted-foreground">
                                                                {__('mín.')}
                                                            </p>
                                                        </div>

                                                        {/* Units Needed to Restock */}
                                                        <div className="sm:col-span-1 text-left sm:text-center">
                                                            <span className="sm:hidden text-xs text-muted-foreground mr-1.5">
                                                                {__('A pedir')}:
                                                            </span>
                                                            {faltante > 0 ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                                    +{formatQty(faltante)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[11px] font-medium text-muted-foreground">
                                                                    {__('En límite')}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Severity Badge */}
                                                        <div className="sm:col-span-1 sm:text-center">
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badgeClass}`}
                                                            >
                                                                <Icon className="w-3 h-3" />
                                                                {__(cfg.label)}
                                                            </span>
                                                        </div>

                                                        {/* Action */}
                                                        <div className="sm:col-span-1 text-right">
                                                            <Link
                                                                href={`/admin/productos?search=${encodeURIComponent(searchTarget)}`}
                                                            >
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 text-xs px-2.5"
                                                                >
                                                                    {__('Gestionar')}
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

StockAlertsIndex.layout = (page: React.ReactNode) => (
    <AdminLayout breadcrumbs={[]}>{page}</AdminLayout>
);
