import { Head, router } from '@inertiajs/react';
import {
    FileText,
    Calendar,
    Filter,
    Download,
    FileSpreadsheet,
    Building2,
    DollarSign,
    Scale,
    CheckCircle2,
    ShieldAlert,
    Receipt,
    ShoppingBag,
    Printer,
    Globe,
    Landmark,
    Search,
    X,
    TrendingUp,
    ArrowDownRight,
    ArrowUpRight,
    Calculator,
    ShieldCheck,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams } from '@/lib/utils';

interface VentaItem {
    id: number;
    factura_numero: string;
    control_numero: string;
    fecha: string;
    cliente_nombre: string;
    cliente_rif: string;
    base_imponible: number;
    monto_iva: number;
    aliquota_iva: number;
    monto_exento: number;
    monto_igtf: number;
    total: number;
}

interface CompraItem {
    id: number;
    factura_numero: string;
    control_numero: string;
    fecha: string;
    proveedor_nombre: string;
    proveedor_rif: string;
    base_imponible: number;
    monto_iva: number;
    total: number;
}

interface Props {
    empresaInfo: {
        nombre: string;
        documento: string;
        pais: string;
        isVenezuela: boolean;
    };
    ventasData: VentaItem[];
    comprasData: CompraItem[];
    totales: {
        totalIvaDebito: number;
        totalIvaCredito: number;
        totalIgtf: number;
        saldoNetoIva: number;
    };
    filters: {
        from_date: string;
        to_date: string;
    };
}

export default function ImpuestosPage({ empresaInfo, ventasData, comprasData, totales, filters }: Props) {
    const { __ } = useTranslate();
    const [fromDate, setFromDate] = useState(filters.from_date || '');
    const [toDate, setToDate] = useState(filters.to_date || '');
    const [activeTab, setActiveTab] = useState('ventas');
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/admin/contabilidad/impuestos',
            cleanParams({
                from_date: fromDate,
                to_date: toDate,
            }),
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleResetFilters = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        setFromDate(firstDay);
        setToDate(lastDay);
        router.get('/admin/contabilidad/impuestos', {}, { preserveState: true, preserveScroll: true });
    };

    const setQuickDate = (type: 'today' | 'month' | 'prevMonth') => {
        const now = new Date();
        if (type === 'today') {
            const todayStr = now.toISOString().split('T')[0];
            setFromDate(todayStr);
            setToDate(todayStr);
            router.get('/admin/contabilidad/impuestos', cleanParams({ from_date: todayStr, to_date: todayStr }), { preserveState: true, preserveScroll: true });
        } else if (type === 'month') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            setFromDate(firstDay);
            setToDate(lastDay);
            router.get('/admin/contabilidad/impuestos', cleanParams({ from_date: firstDay, to_date: lastDay }), { preserveState: true, preserveScroll: true });
        } else if (type === 'prevMonth') {
            const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
            setFromDate(firstDay);
            setToDate(lastDay);
            router.get('/admin/contabilidad/impuestos', cleanParams({ from_date: firstDay, to_date: lastDay }), { preserveState: true, preserveScroll: true });
        }
    };

    const formatMoney = (val: number) => {
        return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Exportar Libro Activo a CSV
    const exportLibroToCSV = () => {
        let csv = '';
        let filename = 'Libro_Fiscal.csv';

        if (activeTab === 'ventas') {
            filename = `Libro_Ventas_Fiscales_${empresaInfo.pais}_${fromDate}_${toDate}.csv`;
            csv = 'N°,Fecha,N° Factura,N° Control,Cliente,RIF/NIT,Base Imponible,Alicuota IVA %,Monto IVA,Exento,IGTF (3%),Total Facturado\n';
            ventasData.forEach((v, idx) => {
                csv += `${idx + 1},"${v.fecha}","${v.factura_numero}","${v.control_numero}","${v.cliente_nombre.replace(/"/g, '""')}","${v.cliente_rif}",${v.base_imponible},${v.aliquota_iva}%,${v.monto_iva},${v.monto_exento},${v.monto_igtf},${v.total}\n`;
            });
        } else {
            filename = `Libro_Compras_Fiscales_${empresaInfo.pais}_${fromDate}_${toDate}.csv`;
            csv = 'N°,Fecha,N° Factura,N° Control,Proveedor,RIF/NIT,Base Imponible,Monto IVA,Total Compra\n';
            comprasData.forEach((c, idx) => {
                csv += `${idx + 1},"${c.fecha}","${c.factura_numero}","${c.control_numero}","${c.proveedor_nombre.replace(/"/g, '""')}","${c.proveedor_rif}",${c.base_imponible},${c.monto_iva},${c.total}\n`;
            });
        }

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Contabilidad'), href: '#' },
        { title: __('Impuestos & Libros Fiscales'), href: '/admin/contabilidad/impuestos' },
    ];

    const filteredVentas = ventasData.filter(
        (v) =>
            v.factura_numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.cliente_nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.cliente_rif.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCompras = comprasData.filter(
        (c) =>
            c.factura_numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.proveedor_nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.proveedor_rif.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <Head title={__('Impuestos & Libros Fiscales')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <ModuleHeader
                        title={__('Impuestos & Libros Fiscales')}
                        description={__('Gestión tributaria multipaís, IVA Débito/Crédito fiscal, IGTF y generación de Libros de Ventas y Compras.')}
                        icon={<Landmark className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                    />

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            size="sm"
                            onClick={() => {
                                const from = fromDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
                                const to = toDate || new Date().toISOString().split('T')[0];
                                window.location.href = `/admin/contabilidad/exportar-excel?from_date=${from}&to_date=${to}`;
                            }}
                            className="h-9 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                            {__('Excel Completo (.xlsx)')}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportLibroToCSV}
                            className="h-9 gap-1.5 text-xs font-semibold"
                        >
                            <Download className="w-3.5 h-3.5 text-emerald-600" />
                            {__('Exportar Libro CSV')}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="h-9 gap-1.5 text-xs font-bold"
                        >
                            <Printer className="w-3.5 h-3.5 text-blue-600" />
                            {__('Imprimir Libros')}
                        </Button>
                    </div>
                </div>

                {/* ══ Contexto Tributario de País ═════════════════════════════════════ */}
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50/60 via-white to-indigo-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-md shadow-blue-500/20">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                    {empresaInfo.nombre} ({empresaInfo.documento})
                                </h3>
                                <Badge className="bg-blue-600 text-white font-mono text-[10px]">
                                    {empresaInfo.pais}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {empresaInfo.isVenezuela
                                    ? __('Normativa Tributaria SENIAT Venezuela (IVA 16%, IGTF 3% Divisas, N° de Control Fiscal)')
                                    : __('Régimen Tributario General de Impuestos sobre Ventas y Compras')}
                            </p>
                        </div>
                    </div>

                    <Badge variant="outline" className="text-xs font-mono text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/40 self-start sm:self-auto">
                        {__('Período Fiscal')}: {fromDate} {__('al')} {toDate}
                    </Badge>
                </div>

                {/* ══ Cards Estadísticas Tributarias Pro ══════════════════════════════ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: IVA Débito (Ventas) */}
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {__('IVA Débito (Ventas)')}
                            </span>
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                                <ArrowUpRight className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                                {formatMoney(totales.totalIvaDebito)}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/50 border-rose-200">
                                {__('Pasivo por Pagar')}
                            </Badge>
                        </div>
                    </div>

                    {/* Card 2: IVA Crédito (Compras) */}
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {__('IVA Crédito (Compras)')}
                            </span>
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                                <ArrowDownRight className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                                {formatMoney(totales.totalIvaCredito)}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200">
                                {__('Activo a Favor')}
                            </Badge>
                        </div>
                    </div>

                    {/* Card 3: IGTF 3% Divisas */}
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {__('IGTF 3% Divisas')}
                            </span>
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                                {formatMoney(totales.totalIgtf)}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-semibold text-purple-600 bg-purple-50 dark:bg-purple-950/50 border-purple-200">
                                {__('Percepciones USD')}
                            </Badge>
                        </div>
                    </div>

                    {/* Card 4: Saldo Neto IVA */}
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {__('Saldo Neto de IVA')}
                            </span>
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                                <Scale className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                                {formatMoney(Math.abs(totales.saldoNetoIva))}
                            </span>
                            <Badge className={totales.saldoNetoIva >= 0 ? "bg-rose-600 text-white text-[10px]" : "bg-emerald-600 text-white text-[10px]"}>
                                {totales.saldoNetoIva >= 0 ? __('IVA a Pagar') : __('Crédito Fiscal')}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* ══ Toolbar de Filtros Rápidos ═══════════════════════════════════════ */}
                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="p-4 border-b bg-slate-50/60 dark:bg-slate-900/60">
                        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{__('Búsqueda por Factura o Cliente/RIF')}</Label>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                                        <Input
                                            placeholder={__('Buscar N° factura, RIF o cliente...')}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
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
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setQuickDate('prevMonth')}
                                    className="h-9 text-xs gap-1 font-medium bg-white dark:bg-slate-950"
                                >
                                    {__('Mes Anterior')}
                                </Button>

                                <Button
                                    type="submit"
                                    size="sm"
                                    className="h-9 px-4 text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                >
                                    <Filter className="w-3.5 h-3.5" />
                                    {__('Filtrar')}
                                </Button>

                                {searchQuery && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSearchQuery('')}
                                        className="h-9 px-3 text-xs gap-1 text-slate-600 hover:text-slate-900"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        {__('Limpiar')}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardHeader>
                </Card>

                {/* ══ Tabs de Libros Fiscales ═══════════════════════════════════════════ */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="grid grid-cols-2 max-w-md h-10 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <TabsTrigger value="ventas" className="text-xs font-bold gap-1.5">
                            <Receipt className="w-3.5 h-3.5 text-blue-600" />
                            {__('Libro de Ventas Fiscales')} ({ventasData.length})
                        </TabsTrigger>
                        <TabsTrigger value="compras" className="text-xs font-bold gap-1.5">
                            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                            {__('Libro de Compras Fiscales')} ({comprasData.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* ══ Tab 1: Libro de Ventas Fiscales ════════════════════════════════ */}
                    <TabsContent value="ventas">
                        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                            <CardHeader className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center justify-between">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-blue-600" />
                                    <span>{__('Libro de Ventas Fiscales')}</span>
                                </CardTitle>
                                <Badge variant="outline" className="text-xs font-mono font-bold text-blue-600 bg-blue-50 border-blue-200">
                                    {__('Total Ventas Registradas')}: {filteredVentas.length}
                                </Badge>
                            </CardHeader>

                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs font-mono">
                                        <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-bold text-[10px] text-slate-600 dark:text-slate-400 border-b tracking-wider">
                                            <tr>
                                                <th className="p-3 w-10">#</th>
                                                <th className="p-3">{__('Fecha')}</th>
                                                <th className="p-3">{__('N° Factura')}</th>
                                                <th className="p-3">{__('N° Control')}</th>
                                                <th className="p-3 font-sans">{__('Cliente')}</th>
                                                <th className="p-3">{__('RIF / NIT')}</th>
                                                <th className="p-3 text-right">{__('Base Imponible')}</th>
                                                <th className="p-3 text-right">{__('IVA (16%)')}</th>
                                                <th className="p-3 text-right">{__('IGTF (3%)')}</th>
                                                <th className="p-3 text-right">{__('Total Facturado')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {filteredVentas.length > 0 ? (
                                                filteredVentas.map((v, idx) => (
                                                    <tr key={v.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-900/40 transition-colors">
                                                        <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                                                        <td className="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{v.fecha}</td>
                                                        <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{v.factura_numero}</td>
                                                        <td className="p-3 text-slate-500">{v.control_numero}</td>
                                                        <td className="p-3 font-sans font-medium text-slate-900 dark:text-slate-100">{v.cliente_nombre}</td>
                                                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{v.cliente_rif}</td>
                                                        <td className="p-3 text-right font-semibold">{formatMoney(v.base_imponible)}</td>
                                                        <td className="p-3 text-right font-bold">
                                                            {v.monto_iva > 0 ? (
                                                                <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                                                                    {formatMoney(v.monto_iva)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 italic">Exento</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-right font-bold text-purple-600 dark:text-purple-400">
                                                            {v.monto_igtf > 0 ? formatMoney(v.monto_igtf) : '-'}
                                                        </td>
                                                        <td className="p-3 text-right font-extrabold text-slate-900 dark:text-slate-100">{formatMoney(v.total)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={10} className="p-12 text-center text-xs text-muted-foreground space-y-2">
                                                        <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 stroke-[1.2]" />
                                                        <p className="font-semibold text-sm">{__('No se encontraron ventas fiscales registradas')}</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {filteredVentas.length > 0 && (
                                            <tfoot className="bg-slate-100/90 dark:bg-slate-900/90 font-bold border-t border-slate-200 dark:border-slate-800 text-xs">
                                                <tr>
                                                    <td colSpan={6} className="p-3 font-sans text-right uppercase text-[10px] text-muted-foreground">
                                                        {__('Totales del Libro de Ventas:')}
                                                    </td>
                                                    <td className="p-3 text-right text-slate-900 dark:text-slate-100 font-extrabold">
                                                        {formatMoney(filteredVentas.reduce((a, b) => a + b.base_imponible, 0))}
                                                    </td>
                                                    <td className="p-3 text-right text-rose-600 font-extrabold">
                                                        {formatMoney(filteredVentas.reduce((a, b) => a + b.monto_iva, 0))}
                                                    </td>
                                                    <td className="p-3 text-right text-purple-600 font-extrabold">
                                                        {formatMoney(filteredVentas.reduce((a, b) => a + b.monto_igtf, 0))}
                                                    </td>
                                                    <td className="p-3 text-right text-blue-600 font-extrabold text-sm">
                                                        {formatMoney(filteredVentas.reduce((a, b) => a + b.total, 0))}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ══ Tab 2: Libro de Compras Fiscales ════════════════════════════════ */}
                    <TabsContent value="compras">
                        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                            <CardHeader className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center justify-between">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                                    <span>{__('Libro de Compras Fiscales')}</span>
                                </CardTitle>
                                <Badge variant="outline" className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 border-emerald-200">
                                    {__('Total Compras Registradas')}: {filteredCompras.length}
                                </Badge>
                            </CardHeader>

                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs font-mono">
                                        <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-bold text-[10px] text-slate-600 dark:text-slate-400 border-b tracking-wider">
                                            <tr>
                                                <th className="p-3 w-10">#</th>
                                                <th className="p-3">{__('Fecha')}</th>
                                                <th className="p-3">{__('N° Factura')}</th>
                                                <th className="p-3">{__('N° Control')}</th>
                                                <th className="p-3 font-sans">{__('Proveedor')}</th>
                                                <th className="p-3">{__('RIF / NIT')}</th>
                                                <th className="p-3 text-right">{__('Base Imponible')}</th>
                                                <th className="p-3 text-right">{__('IVA Crédito (16%)')}</th>
                                                <th className="p-3 text-right">{__('Total Compra')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {filteredCompras.length > 0 ? (
                                                filteredCompras.map((c, idx) => (
                                                    <tr key={c.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-900/40 transition-colors">
                                                        <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                                                        <td className="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{c.fecha}</td>
                                                        <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{c.factura_numero}</td>
                                                        <td className="p-3 text-slate-500">{c.control_numero}</td>
                                                        <td className="p-3 font-sans font-medium text-slate-900 dark:text-slate-100">{c.proveedor_nombre}</td>
                                                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{c.proveedor_rif}</td>
                                                        <td className="p-3 text-right font-semibold">{formatMoney(c.base_imponible)}</td>
                                                        <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(c.monto_iva)}</td>
                                                        <td className="p-3 text-right font-extrabold text-slate-900 dark:text-slate-100">{formatMoney(c.total)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={9} className="p-12 text-center text-xs text-muted-foreground space-y-2">
                                                        <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 stroke-[1.2]" />
                                                        <p className="font-semibold text-sm">{__('No se encontraron compras fiscales registradas')}</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {filteredCompras.length > 0 && (
                                            <tfoot className="bg-slate-100/90 dark:bg-slate-900/90 font-bold border-t border-slate-200 dark:border-slate-800 text-xs">
                                                <tr>
                                                    <td colSpan={6} className="p-3 font-sans text-right uppercase text-[10px] text-muted-foreground">
                                                        {__('Totales del Libro de Compras:')}
                                                    </td>
                                                    <td className="p-3 text-right text-slate-900 dark:text-slate-100 font-extrabold">
                                                        {formatMoney(filteredCompras.reduce((a, b) => a + b.base_imponible, 0))}
                                                    </td>
                                                    <td className="p-3 text-right text-emerald-600 font-extrabold">
                                                        {formatMoney(filteredCompras.reduce((a, b) => a + b.monto_iva, 0))}
                                                    </td>
                                                    <td className="p-3 text-right text-blue-600 font-extrabold text-sm">
                                                        {formatMoney(filteredCompras.reduce((a, b) => a + b.total, 0))}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
