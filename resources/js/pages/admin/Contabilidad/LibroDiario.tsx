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

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Contabilidad'), href: '#' },
        { title: __('Libro Diario'), href: '/admin/contabilidad/asientos' },
    ];

    // Cálculos de totales agregados para la vista actual
    const totalDebeVista = asientos.data.reduce((acc, a) => {
        return acc + (a.apuntes?.reduce((sum, item) => sum + Number(item.debe), 0) || 0);
    }, 0);

    const totalHaberVista = asientos.data.reduce((acc, a) => {
        return acc + (a.apuntes?.reduce((sum, item) => sum + Number(item.haber), 0) || 0);
    }, 0);

    const isBalancedView = Math.abs(totalDebeVista - totalHaberVista) < 0.01;

    return (
        <>
            <Head title={__('Libro Diario - Asientos Contables')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    title={__('Libro Diario (Asientos Contables)')}
                    description={__('Registro cronológico y automático de todas las operaciones comerciales por Partida Doble.')}
                    icon={<FileCheck2 className="w-6 h-6 text-blue-600" />}
                />

                {/* ══ Muestras Estadísticas Ejecutivas ════════════════════════════════════ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="shadow-sm border-l-4 border-l-blue-600 bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">{__('Total Asientos Registrados')}</p>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
                                    {asientos.total}
                                </h3>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600">
                                <Receipt className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-l-4 border-l-emerald-600 bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">{__('Total Débitos (Debe)')}</p>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
                                    ${totalDebeVista.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h3>
                            </div>
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600">
                                <ArrowDownRight className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-l-4 border-l-indigo-600 bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">{__('Total Créditos (Haber)')}</p>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
                                    ${totalHaberVista.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h3>
                            </div>
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600">
                                <ArrowUpRight className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-l-4 border-l-teal-500 bg-card">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">{__('Estado Partida Doble')}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    {isBalancedView ? (
                                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            {__('Cuadrado 100%')}
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive" className="font-mono text-xs">
                                            {__('Desbalanceado')}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="p-3 bg-teal-50 dark:bg-teal-950/50 rounded-xl text-teal-600">
                                <Scale className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ══ Filtros de Búsqueda Avanzados ════════════════════════════════════ */}
                <Card className="shadow-sm">
                    <CardHeader className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
                        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row items-end justify-between gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto flex-1">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">{__('Búsqueda por N° o Glosa')}</Label>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                                        <Input
                                            placeholder={__('Buscar N° asiento o concepto...')}
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-9 h-9 text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">{__('Desde Fecha')}</Label>
                                    <Input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">{__('Hasta Fecha')}</Label>
                                    <Input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="h-9 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                                <Button type="submit" size="sm" className="h-9 px-4 text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700">
                                    <Filter className="w-3.5 h-3.5" />
                                    {__('Filtrar')}
                                </Button>
                                {(search || fromDate || toDate) && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleResetFilters}
                                        className="h-9 px-3 text-xs gap-1"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        {__('Limpiar')}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardHeader>

                    {/* ══ Listado Profesional de Asientos ═════════════════════════════════ */}
                    <CardContent className="p-0 divide-y">
                        {asientos.data.length > 0 ? (
                            asientos.data.map((asiento) => {
                                const totalDebe = asiento.apuntes?.reduce((acc, curr) => acc + Number(curr.debe), 0) || 0;
                                const totalHaber = asiento.apuntes?.reduce((acc, curr) => acc + Number(curr.haber), 0) || 0;
                                const isBalanced = Math.abs(totalDebe - totalHaber) < 0.01;

                                return (
                                    <div
                                        key={asiento.id}
                                        className="p-5 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors space-y-3"
                                    >
                                        {/* Cabecera de Asiento */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-dashed">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono font-bold text-xs px-2.5 py-1">
                                                    {asiento.numero_asiento}
                                                </Badge>

                                                <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(asiento.fecha).toLocaleDateString()} {new Date(asiento.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>

                                                {asiento.user && (
                                                    <span className="flex items-center gap-1 text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                        <User className="w-3 h-3 text-slate-500" />
                                                        {asiento.user.name}
                                                    </span>
                                                )}

                                                <Badge variant="outline" className="text-[11px] font-mono text-emerald-600 border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30">
                                                    <DollarSign className="w-3 h-3 mr-0.5" />
                                                    Tasa: ${Number(asiento.tasa_cambio).toFixed(2)} VES
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isBalanced && (
                                                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        {__('Cuadrado')}
                                                    </span>
                                                )}

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedAsiento(asiento)}
                                                    className="h-8 text-xs font-semibold gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    {__('Ver Comprobante')}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Glosa o Concepto */}
                                        <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-md border border-slate-100 dark:border-slate-800">
                                            <BookOpen className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                                                {asiento.glosa}
                                            </p>
                                        </div>

                                        {/* Tabla de Apuntes Contables (Partida Doble) */}
                                        <div className="overflow-x-auto rounded-lg border bg-card">
                                            <table className="w-full text-left text-xs font-mono">
                                                <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-muted-foreground tracking-wider border-b">
                                                    <tr>
                                                        <th className="py-2 px-3">{__('Código')}</th>
                                                        <th className="py-2 px-3 font-sans">{__('Cuenta Contable')}</th>
                                                        <th className="py-2 px-3 text-right">{__('Debe (Débito)')}</th>
                                                        <th className="py-2 px-3 text-right">{__('Haber (Crédito)')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y text-[11px]">
                                                    {asiento.apuntes?.map((apunte) => {
                                                        const isCredit = Number(apunte.haber) > 0;

                                                        return (
                                                            <tr key={apunte.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                                <td className="py-2 px-3 font-bold text-blue-600 w-32">
                                                                    {apunte.cuenta?.codigo}
                                                                </td>
                                                                <td className="py-2 px-3 font-sans">
                                                                    <span className={isCredit ? 'pl-6 text-slate-600 dark:text-slate-400 inline-block' : 'font-semibold text-slate-900 dark:text-slate-100'}>
                                                                        {isCredit ? '↳ ' : ''}{apunte.cuenta?.nombre}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2 px-3 text-right font-bold w-36">
                                                                    {Number(apunte.debe) > 0 ? (
                                                                        <span className="text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                                            ${Number(apunte.debe).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-slate-300 dark:text-slate-700">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="py-2 px-3 text-right font-bold w-36">
                                                                    {Number(apunte.haber) > 0 ? (
                                                                        <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                                                                            ${Number(apunte.haber).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-slate-300 dark:text-slate-700">-</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot className="bg-slate-50 dark:bg-slate-900 font-bold border-t text-[11px]">
                                                    <tr>
                                                        <td colSpan={2} className="py-2 px-3 font-sans text-right text-muted-foreground uppercase text-[10px]">
                                                            {__('Totales del Asiento:')}
                                                        </td>
                                                        <td className="py-2 px-3 text-right text-slate-900 dark:text-slate-100">
                                                            ${totalDebe.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400">
                                                            ${totalHaber.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        <div className="p-4 border-t">
                            <Pagination paginatedData={asientos} filters={filters} />
                        </div>
                    )}
                </Card>

                {/* ══ Modal de Comprobante de Contabilidad ══════════════════════════════ */}
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
                                {/* Información del Encabezado */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">
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

                                {/* Glosa / Concepto */}
                                <div>
                                    <p className="text-[11px] text-muted-foreground uppercase font-semibold mb-1">{__('Concepto / Glosa Comercial')}</p>
                                    <p className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-md border border-blue-100 dark:border-blue-900 font-medium text-slate-800 dark:text-slate-200">
                                        {selectedAsiento.glosa}
                                    </p>
                                </div>

                                {/* Tabla Completa del Comprobante */}
                                <div className="overflow-x-auto rounded-lg border">
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
                                                            {Number(apunte.debe) > 0 ? `$${Number(apunte.debe).toFixed(2)}` : '-'}
                                                        </td>
                                                        <td className="p-2.5 text-right font-bold text-emerald-600">
                                                            {Number(apunte.haber) > 0 ? `$${Number(apunte.haber).toFixed(2)}` : '-'}
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
                                                    ${selectedAsiento.apuntes?.reduce((a, b) => a + Number(b.debe), 0).toFixed(2)}
                                                </td>
                                                <td className="p-2.5 text-right text-emerald-600">
                                                    ${selectedAsiento.apuntes?.reduce((a, b) => a + Number(b.haber), 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Acciones del Modal */}
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
