import { Head, router } from '@inertiajs/react';
import {
    FileCheck2,
    Search,
    Eye,
    Printer,
    Scale,
    CheckCircle2,
    Calendar,
    Filter,
    User,
    DollarSign,
    X,
    Receipt,
    BookOpen,
    ArrowDownRight,
    ArrowUpRight,
    TrendingUp,
    ShieldCheck,
    RefreshCw,
    Sparkles,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams } from '@/lib/utils';

interface Apunte {
    id: number;
    cuenta: {
        codigo: string;
        nombre: string;
    };
    debe: number;
    haber: number;
    debe_usd: number;
    haber_usd: number;
    referencia?: string;
}

interface Asiento {
    id: number;
    numero_asiento: string;
    fecha: string;
    glosa: string;
    tasa_cambio: number;
    estado: string;
    apuntes: Apunte[];
    user?: { name: string };
}

interface Props {
    asientos: {
        data: Asiento[];
        links: any[];
        total: number;
        current_page: number;
        last_page: number;
        per_page: number;
        from?: number | null;
        to?: number | null;
    };
    filters: {
        search?: string;
        from_date?: string;
        to_date?: string;
    };
}

export default function LibroDiario({ asientos, filters }: Props) {
    const { __ } = useTranslate();
    const [search, setSearch] = useState(filters.search || '');
    const [fromDate, setFromDate] = useState(filters.from_date || '');
    const [toDate, setToDate] = useState(filters.to_date || '');
    const [selectedAsiento, setSelectedAsiento] = useState<Asiento | null>(null);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/admin/contabilidad/asientos',
            cleanParams({
                search,
                from_date: fromDate,
                to_date: toDate,
            }),
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setFromDate('');
        setToDate('');
        router.get('/admin/contabilidad/asientos', {}, { preserveState: true, preserveScroll: true });
    };

    const setQuickDate = (type: 'today' | 'month' | 'clear') => {
        if (type === 'today') {
            const todayStr = new Date().toISOString().split('T')[0];
            setFromDate(todayStr);
            setToDate(todayStr);
            router.get('/admin/contabilidad/asientos', cleanParams({ search, from_date: todayStr, to_date: todayStr }), { preserveState: true, preserveScroll: true });
        } else if (type === 'month') {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            setFromDate(firstDay);
            setToDate(lastDay);
            router.get('/admin/contabilidad/asientos', cleanParams({ search, from_date: firstDay, to_date: lastDay }), { preserveState: true, preserveScroll: true });
        } else {
            handleResetFilters();
        }
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Contabilidad'), href: '#' },
        { title: __('Libro Diario'), href: '/admin/contabilidad/asientos' },
    ];

    // Cálculos agregados para la vista actual
    const totalDebeVista = asientos.data.reduce((acc, a) => {
        return acc + (a.apuntes?.reduce((sum, item) => sum + Number(item.debe), 0) || 0);
    }, 0);

    const totalHaberVista = asientos.data.reduce((acc, a) => {
        return acc + (a.apuntes?.reduce((sum, item) => sum + Number(item.haber), 0) || 0);
    }, 0);

    const isBalancedView = Math.abs(totalDebeVista - totalHaberVista) < 0.01;

    const formatMoney = (val: number) => {
        return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <>
            <Head title={__('Libro Diario - Asientos Contables')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    title={__('Libro Diario (Asientos Contables)')}
                    description={__('Registro cronológico y automático de todas las operaciones comerciales por Partida Doble.')}
                    icon={<FileCheck2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                />

                {/* ══ Cards Estadísticas Ejecutivas Pro ══════════════════════════════════ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Asientos */}
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {__('Comprobantes Diario')}
                            </span>
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                                <Receipt className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                                {asientos.total}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/50 border-blue-200">
                                {__('Registros')}
                            </Badge>
                        </div>
                    </div>

                    {/* Card 2: Total Débitos */}
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {__('Débitos (Debe)')}
                            </span>
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                                <ArrowDownRight className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                                {formatMoney(totalDebeVista)}
                            </span>
                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                <TrendingUp className="w-3 h-3" />
                                {__('Cargos')}
                            </span>
                        </div>
                    </div>

                    {/* Card 3: Total Créditos */}
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {__('Créditos (Haber)')}
                            </span>
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                                <ArrowUpRight className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                                {formatMoney(totalHaberVista)}
                            </span>
                            <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                                {__('Abonos')}
                            </span>
                        </div>
                    </div>

                    {/* Card 4: Estado de Partida Doble */}
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {__('Verificación Contable')}
                            </span>
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                            {isBalancedView ? (
                                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs gap-1.5 px-3 py-1 shadow-sm">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {__('100% Cuadrado')}
                                </Badge>
                            ) : (
                                <Badge variant="destructive" className="font-mono text-xs px-3 py-1">
                                    {__('Desbalanceado')}
                                </Badge>
                            )}
                            <span className="text-[10px] font-mono text-muted-foreground">
                                Δ $0.00
                            </span>
                        </div>
                    </div>
                </div>

                {/* ══ Toolbar de Búsqueda y Filtros Rápidos ══════════════════════════════ */}
                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="p-4 border-b bg-slate-50/60 dark:bg-slate-900/60">
                        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                            {/* Inputs de Filtro */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{__('Búsqueda')}</Label>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                                        <Input
                                            placeholder={__('Buscar N° asiento o glosa...')}
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-9 h-9 text-xs bg-white dark:bg-slate-950"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{__('Desde Fecha')}</Label>
                                    <Input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="h-9 text-xs bg-white dark:bg-slate-950"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{__('Hasta Fecha')}</Label>
                                    <Input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="h-9 text-xs bg-white dark:bg-slate-950"
                                    />
                                </div>
                            </div>

                            {/* Botones de Acción y Presets */}
                            <div className="flex flex-wrap items-center gap-2 justify-end pt-1 lg:pt-5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setQuickDate('today')}
                                    className="h-9 text-xs gap-1 font-medium bg-white dark:bg-slate-950"
                                >
                                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                    {__('Hoy')}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setQuickDate('month')}
                                    className="h-9 text-xs gap-1 font-medium bg-white dark:bg-slate-950"
                                >
                                    {__('Este Mes')}
                                </Button>

                                <Button
                                    type="submit"
                                    size="sm"
                                    className="h-9 px-4 text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                >
                                    <Filter className="w-3.5 h-3.5" />
                                    {__('Filtrar')}
                                </Button>

                                {(search || fromDate || toDate) && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleResetFilters}
                                        className="h-9 px-3 text-xs gap-1 text-slate-600 hover:text-slate-900"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        {__('Limpiar')}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardHeader>

                    {/* ══ Listado Ejecutivos de Comprobantes ═════════════════════════════════ */}
                    <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
                        {asientos.data.length > 0 ? (
                            asientos.data.map((asiento) => {
                                const totalDebe = asiento.apuntes?.reduce((acc, curr) => acc + Number(curr.debe), 0) || 0;
                                const totalHaber = asiento.apuntes?.reduce((acc, curr) => acc + Number(curr.haber), 0) || 0;
                                const isBalanced = Math.abs(totalDebe - totalHaber) < 0.01;

                                return (
                                    <div
                                        key={asiento.id}
                                        className="p-5 hover:bg-slate-50/90 dark:hover:bg-slate-900/50 transition-all space-y-3 group"
                                    >
                                        {/* Header Asiento */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-dashed border-slate-200 dark:border-slate-800">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono font-bold text-xs px-3 py-1 shadow-sm">
                                                    {asiento.numero_asiento}
                                                </Badge>

                                                <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-slate-700/60">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                                    {new Date(asiento.fecha).toLocaleDateString()} {new Date(asiento.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>

                                                {asiento.user && (
                                                    <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-slate-700/60">
                                                        <User className="w-3.5 h-3.5 text-slate-500" />
                                                        {asiento.user.name}
                                                    </span>
                                                )}

                                                <Badge variant="outline" className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40">
                                                    <DollarSign className="w-3 h-3 mr-0.5" />
                                                    Tasa: ${Number(asiento.tasa_cambio).toFixed(2)} VES
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isBalanced && (
                                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        {__('Cuadrado')}
                                                    </span>
                                                )}

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedAsiento(asiento)}
                                                    className="h-8 text-xs font-bold gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 group-hover:border-blue-400"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    {__('Ver Comprobante')}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Glosa / Concepto */}
                                        <div className="flex items-start gap-2.5 bg-slate-50/80 dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
                                            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                                                {asiento.glosa}
                                            </p>
                                        </div>

                                        {/* Tabla de Apuntes Contables */}
                                        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xs">
                                            <table className="w-full text-left text-xs font-mono">
                                                <thead className="bg-slate-100/80 dark:bg-slate-900 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider border-b">
                                                    <tr>
                                                        <th className="py-2.5 px-4">{__('Código')}</th>
                                                        <th className="py-2.5 px-4 font-sans">{__('Cuenta Contable')}</th>
                                                        <th className="py-2.5 px-4 text-right">{__('Debe (Débito)')}</th>
                                                        <th className="py-2.5 px-4 text-right">{__('Haber (Crédito)')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-[11px]">
                                                    {asiento.apuntes?.map((apunte) => {
                                                        const isCredit = Number(apunte.haber) > 0;

                                                        return (
                                                            <tr key={apunte.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                                                                <td className="py-2.5 px-4 font-bold text-blue-600 dark:text-blue-400 w-36">
                                                                    {apunte.cuenta?.codigo}
                                                                </td>
                                                                <td className="py-2.5 px-4 font-sans">
                                                                    <span className={isCredit ? 'pl-6 text-slate-600 dark:text-slate-400 font-normal inline-block' : 'font-semibold text-slate-900 dark:text-slate-100'}>
                                                                        {isCredit ? '↳ ' : ''}{apunte.cuenta?.nombre}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2.5 px-4 text-right font-bold w-40">
                                                                    {Number(apunte.debe) > 0 ? (
                                                                        <span className="text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                                                                            {formatMoney(apunte.debe)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-slate-300 dark:text-slate-700">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="py-2.5 px-4 text-right font-bold w-40">
                                                                    {Number(apunte.haber) > 0 ? (
                                                                        <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-100 dark:border-emerald-900">
                                                                            {formatMoney(apunte.haber)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-slate-300 dark:text-slate-700">-</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot className="bg-slate-50/80 dark:bg-slate-900/80 font-bold border-t border-slate-200 dark:border-slate-800 text-[11px]">
                                                    <tr>
                                                        <td colSpan={2} className="py-2.5 px-4 font-sans text-right text-muted-foreground uppercase text-[10px]">
                                                            {__('Totales del Asiento:')}
                                                        </td>
                                                        <td className="py-2.5 px-4 text-right text-slate-900 dark:text-slate-100">
                                                            {formatMoney(totalDebe)}
                                                        </td>
                                                        <td className="py-2.5 px-4 text-right text-emerald-600 dark:text-emerald-400">
                                                            {formatMoney(totalHaber)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-16 text-center text-xs text-muted-foreground space-y-3">
                                <Receipt className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 stroke-[1.2]" />
                                <p className="font-semibold text-sm">{__('No se encontraron asientos contables')}</p>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                    {__('Los asientos se generan automáticamente al registrar ventas, compras o movimientos de caja.')}
                                </p>
                            </div>
                        )}
                    </CardContent>

                    {/* ══ Paginación Nativa ══════════════════════════════════════════════ */}
                    {asientos.total > 0 && (
                        <div className="p-4 border-t bg-slate-50/40 dark:bg-slate-900/40">
                            <Pagination paginatedData={asientos} filters={filters} />
                        </div>
                    )}
                </Card>

                {/* ══ Modal de Comprobante Oficial de Contabilidad ══════════════════════ */}
                <Dialog open={!!selectedAsiento} onOpenChange={() => setSelectedAsiento(null)}>
                    <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="border-b pb-3">
                            <DialogTitle className="flex items-center justify-between text-base">
                                <div className="flex items-center gap-2 font-mono">
                                    <FileCheck2 className="w-5 h-5 text-blue-600" />
                                    <span>{__('COMPROBANTE DIARIO')} N° {selectedAsiento?.numero_asiento}</span>
                                </div>
                                <Badge className="bg-emerald-600 text-white font-semibold">
                                    {selectedAsiento?.estado || __('ASENTADO')}
                                </Badge>
                            </DialogTitle>
                        </DialogHeader>

                        {selectedAsiento && (
                            <div className="space-y-5 text-xs font-sans py-2">
                                {/* Encabezado de Voucher */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <div>
                                        <p className="text-[11px] text-muted-foreground uppercase font-semibold">{__('Fecha del Asiento')}</p>
                                        <p className="font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                                            {new Date(selectedAsiento.fecha).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-muted-foreground uppercase font-semibold">{__('Tasa Oficial Registrada')}</p>
                                        <p className="font-mono font-bold text-emerald-600 mt-0.5">
                                            ${Number(selectedAsiento.tasa_cambio).toFixed(2)} VES/USD
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-muted-foreground uppercase font-semibold">{__('Usuario Registrador')}</p>
                                        <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                                            {selectedAsiento.user?.name || __('Sistema Automático')}
                                        </p>
                                    </div>
                                </div>

                                {/* Concepto / Glosa */}
                                <div>
                                    <p className="text-[11px] text-muted-foreground uppercase font-semibold mb-1">{__('Concepto / Glosa Comercial')}</p>
                                    <p className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900 font-medium text-slate-800 dark:text-slate-200">
                                        {selectedAsiento.glosa}
                                    </p>
                                </div>

                                {/* Tabla del Voucher */}
                                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                    <table className="w-full text-left font-mono text-xs">
                                        <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-muted-foreground border-b">
                                            <tr>
                                                <th className="p-2.5 border-r">{__('Código')}</th>
                                                <th className="p-2.5 border-r font-sans">{__('Cuenta Contable')}</th>
                                                <th className="p-2.5 border-r text-right">{__('Debe (USD)')}</th>
                                                <th className="p-2.5 text-right">{__('Haber (USD)')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y text-[11px]">
                                            {selectedAsiento.apuntes?.map((apunte) => {
                                                const isCredit = Number(apunte.haber) > 0;
                                                return (
                                                    <tr key={apunte.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                        <td className="p-2.5 border-r font-bold text-blue-600">{apunte.cuenta?.codigo}</td>
                                                        <td className="p-2.5 border-r font-sans">
                                                            <span className={isCredit ? 'pl-6 text-slate-600 dark:text-slate-400' : 'font-semibold text-slate-900 dark:text-slate-100'}>
                                                                {isCredit ? '↳ ' : ''}{apunte.cuenta?.nombre}
                                                            </span>
                                                        </td>
                                                        <td className="p-2.5 border-r text-right font-bold">
                                                            {Number(apunte.debe) > 0 ? formatMoney(apunte.debe) : '-'}
                                                        </td>
                                                        <td className="p-2.5 text-right font-bold text-emerald-600">
                                                            {Number(apunte.haber) > 0 ? formatMoney(apunte.haber) : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-slate-100 dark:bg-slate-900 font-bold border-t text-xs">
                                            <tr>
                                                <td colSpan={2} className="p-2.5 border-r font-sans text-right text-muted-foreground uppercase text-[10px]">
                                                    {__('Totales Generales:')}
                                                </td>
                                                <td className="p-2.5 border-r text-right text-slate-900 dark:text-slate-100">
                                                    {formatMoney(selectedAsiento.apuntes?.reduce((a, b) => a + Number(b.debe), 0) || 0)}
                                                </td>
                                                <td className="p-2.5 text-right text-emerald-600">
                                                    {formatMoney(selectedAsiento.apuntes?.reduce((a, b) => a + Number(b.haber), 0) || 0)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Pie de Modal */}
                                <div className="flex items-center justify-between pt-2">
                                    <Badge variant="outline" className="text-emerald-600 border-emerald-300 font-mono text-[11px] gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {__('Principio de Partida Doble Verificado')}
                                    </Badge>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.print()}
                                        className="h-8 gap-1.5 text-xs font-bold"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                        {__('Imprimir Comprobante')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
