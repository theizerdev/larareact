import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CreditCard,
    Plus,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Eye,
    Phone,
    Smartphone,
    Building2,
    DollarSign,
    ShieldAlert,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { FilterBar } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cleanParams, formatDate } from '@/lib/utils';
import type { Paginated } from '@/types/app';
import { useTranslate } from '@/hooks/use-translate';

interface Credito {
    id: number;
    codigo_credito: string;
    fecha_inicio: string;
    precio_equipo: string | number;
    monto_inicial: string | number;
    monto_financiado: string | number;
    total_credito: string | number;
    saldo_pendiente: string | number;
    estado: 'pendiente_aprobacion' | 'aprobado' | 'activo' | 'liquidado' | 'en_mora' | 'cancelado' | 'incobrable';
    cliente?: {
        id: number;
        nombres: string;
        apellidos: string;
        tipo_documento: string;
        numero_documento: string;
        telefono_principal: string;
    };
    equipo?: {
        id: number;
        imei_1: string;
        color?: string;
        modelo?: {
            nombre: string;
            marca?: {
                nombre: string;
            };
        };
    };
    plan?: {
        id: number;
        nombre: string;
        frecuencia: string;
        numero_cuotas: number;
    };
    sucursal?: {
        id: number;
        nombre: string;
    };
    vendedor?: {
        id: number;
        name: string;
    };
}

interface Props {
    creditos: Paginated<Credito>;
    stats: {
        total_creditos: number;
        activos: number;
        cartera_activa_monto: number;
        en_mora: number;
        liquidados: number;
    };
    sucursales: Array<{ id: number; nombre: string }>;
    filters: {
        search?: string;
        estado?: string;
        sucursal_id?: string;
        perPage?: number;
    };
}

export default function CreditosIndex({ creditos, stats, sucursales, filters }: Props) {
    const { __, currentLocale } = useTranslate();
    const { regional_config } = usePage().props as any;
    const currency = regional_config?.currency_symbol || '$';

    const [search, setSearch] = useState(filters.search || '');
    const [estadoFilter, setEstadoFilter] = useState(filters.estado || 'all');
    const [sucursalFilter, setSucursalFilter] = useState(filters.sucursal_id || 'all');

    const handleFilterChange = (overrideParams = {}) => {
        const params = {
            search: search || undefined,
            estado: estadoFilter !== 'all' ? estadoFilter : undefined,
            sucursal_id: sucursalFilter !== 'all' ? sucursalFilter : undefined,
            ...overrideParams,
        };
        router.get(window.location.pathname, cleanParams(params), { preserveState: true, replace: true });
    };

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'activo':
                return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">{__('Al Día / Activo')}</Badge>;
            case 'liquidado':
                return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20">{__('Liquidado / Pagado')}</Badge>;
            case 'en_mora':
                return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20 font-bold">{__('En Mora')}</Badge>;
            case 'pendiente_aprobacion':
                return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20">{__('Por Aprobar')}</Badge>;
            case 'cancelado':
                return <Badge variant="outline" className="text-slate-400">{__('Cancelado')}</Badge>;
            default:
                return <Badge variant="outline">{estado}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <Head title={__('Ventas a Crédito & Cartera')} />

            <Breadcrumbs
                breadcrumbs={[
                    { title: __('Dashboard'), href: '/admin/dashboard' },
                    { title: __('Ventas a Crédito'), href: '/admin/creditos' },
                ]}
            />

            {/* Header */}
            <ModuleHeader
                icon={<CreditCard className="size-6 sm:size-7" />}
                title={__('Ventas de Teléfonos a Crédito')}
                description={__('Control de contratos de financiamiento, seguimiento de cartera activa, amortizaciones y cobranza de cuotas.')}
                colorClassName="bg-emerald-600 dark:bg-emerald-700"
            >
                <Link href="/admin/creditos/nuevo">
                    <Button className="bg-white text-emerald-700 hover:bg-slate-100 font-bold">
                        <Plus className="size-4 mr-1.5" /> {__('Nueva Venta a Crédito')}
                    </Button>
                </Link>
            </ModuleHeader>

            {/* Métricas de Cartera */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<DollarSign className="size-5 text-emerald-600" />}
                    title={__('Cartera Activa por Cobrar')}
                    value={`${currency}${stats.cartera_activa_monto.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    colorClassName="bg-emerald-50 dark:bg-emerald-950/40"
                />
                <StatCard
                    icon={<CreditCard className="size-5 text-blue-600" />}
                    title={__('Créditos Activos')}
                    value={stats.activos}
                    colorClassName="bg-blue-50 dark:bg-blue-950/40"
                />
                <StatCard
                    icon={<ShieldAlert className="size-5 text-rose-600" />}
                    title={__('En Mora')}
                    value={stats.en_mora}
                    colorClassName="bg-rose-50 dark:bg-rose-950/40"
                />
                <StatCard
                    icon={<CheckCircle2 className="size-5 text-indigo-600" />}
                    title={__('Liquidados / Pagados')}
                    value={stats.liquidados}
                    colorClassName="bg-indigo-50 dark:bg-indigo-950/40"
                />
            </div>

            {/* Filtros */}
            <FilterBar>
                <div className="flex flex-1 flex-wrap items-center gap-3">
                    <div className="relative min-w-[240px] flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input
                            placeholder={__('Buscar por folio, cliente, teléfono o IMEI...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
                            className="pl-9 h-10"
                        />
                    </div>

                    <Select value={estadoFilter} onValueChange={(val) => { setEstadoFilter(val); handleFilterChange({ estado: val !== 'all' ? val : undefined }); }}>
                        <SelectTrigger className="w-full sm:w-[200px] md:w-[240px] h-10">
                            <SelectValue placeholder={__('Estado de cuenta')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{__('Todos los estados')}</SelectItem>
                            <SelectItem value="activo">{__('Al Día / Activo')}</SelectItem>
                            <SelectItem value="en_mora">{__('En Mora')}</SelectItem>
                            <SelectItem value="liquidado">{__('Liquidado')}</SelectItem>
                            <SelectItem value="pendiente_aprobacion">{__('Por Aprobar')}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sucursalFilter} onValueChange={(val) => { setSucursalFilter(val); handleFilterChange({ sucursal_id: val !== 'all' ? val : undefined }); }}>
                        <SelectTrigger className="w-full sm:w-[200px] md:w-[240px] h-10">
                            <SelectValue placeholder={__('Tienda')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{__('Todas las tiendas')}</SelectItem>
                            {sucursales.map((s) => (
                                <SelectItem key={s.id} value={s.id.toString()}>{s.nombre}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="secondary" onClick={() => handleFilterChange()} className="h-10">
                        <Filter className="size-4 mr-1.5" /> {__('Filtrar')}
                    </Button>
                </div>
            </FilterBar>

            {/* Tabla de Créditos */}
            <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-3.5">{__('Folio / Fecha')}</th>
                                <th className="px-4 py-3.5">{__('Cliente')}</th>
                                <th className="px-4 py-3.5">{__('Dispositivo / IMEI')}</th>
                                <th className="px-4 py-3.5">{__('Plan')}</th>
                                <th className="px-4 py-3.5">{__('Total Crédito')}</th>
                                <th className="px-4 py-3.5">{__('Inicial Cobrada')}</th>
                                <th className="px-4 py-3.5 font-bold text-rose-600 dark:text-rose-400">{__('Saldo Pendiente')}</th>
                                <th className="px-4 py-3.5">{__('Estado')}</th>
                                <th className="px-4 py-3.5 text-right">{__('Acción')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {creditos.data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                                        <CreditCard className="size-8 mx-auto text-slate-300 mb-2" />
                                        {__('No hay créditos registrados con los filtros aplicados.')}
                                    </td>
                                </tr>
                            ) : (
                                creditos.data.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                                {c.codigo_credito}
                                            </div>
                                            <div className="text-xs text-slate-400">{formatDate(c.fecha_inicio, 'short', currentLocale)}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                {c.cliente?.nombres} {c.cliente?.apellidos}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {c.cliente?.tipo_documento}-{c.cliente?.numero_documento} • {c.cliente?.telefono_principal}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800 dark:text-slate-200">
                                                {c.equipo?.modelo?.marca?.nombre} {c.equipo?.modelo?.nombre}
                                            </div>
                                            <div className="text-xs font-mono text-slate-500">
                                                IMEI: {c.equipo?.imei_1}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            <div className="font-medium text-slate-700 dark:text-slate-300">
                                                {c.plan?.nombre}
                                            </div>
                                            <div className="text-slate-400">{c.plan?.numero_cuotas} {__('cuotas')} {c.plan?.frecuencia ? __(c.plan.frecuencia) : ''}</div>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                                            {currency}{Number(c.total_credito).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-medium">
                                            {currency}{Number(c.monto_inicial).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 font-extrabold text-rose-600 dark:text-rose-400">
                                            {currency}{Number(c.saldo_pendiente).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getEstadoBadge(c.estado)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/admin/creditos/${c.id}`}>
                                                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                                                    <Eye className="size-3.5" /> {__('Ver Expediente')}
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

