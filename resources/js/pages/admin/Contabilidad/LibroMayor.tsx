import { Head, router } from '@inertiajs/react';
import {
    BookMarked,
    Search,
    ArrowDownRight,
    ArrowUpRight,
    Scale,
    Calendar,
    Receipt,
    Wallet,
    Download,
    CheckCircle2,
    FileSpreadsheet,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';

interface Cuenta {
    id: number;
    codigo: string;
    nombre: string;
    naturaleza?: string;
    tipo?: string;
}

interface Movimiento {
    id: number;
    debe: number;
    haber: number;
    referencia?: string;
    created_at: string;
    asiento?: {
        numero_asiento: string;
        glosa: string;
        fecha: string;
    };
}

interface Props {
    cuentasDisponibles: Cuenta[];
    cuentaSeleccionada?: Cuenta;
    movimientos?: {
        data: Movimiento[];
        links: any[];
        total: number;
        current_page: number;
        last_page: number;
        per_page: number;
        from?: number | null;
        to?: number | null;
    };
    filters: { cuenta_id?: string };
}

export default function LibroMayor({ cuentasDisponibles, cuentaSeleccionada, movimientos, filters }: Props) {
    const { __ } = useTranslate();
    const [selectedCuentaId, setSelectedCuentaId] = useState(filters.cuenta_id || '');

    const handleSelectCuenta = (val: string) => {
        setSelectedCuentaId(val);
        router.get('/admin/contabilidad/mayor', { cuenta_id: val }, { preserveState: true, preserveScroll: true });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Contabilidad'), href: '#' },
        { title: __('Libro Mayor'), href: '/admin/contabilidad/mayor' },
    ];

    const totalDebe = movimientos?.data?.reduce((acc, m) => acc + Number(m.debe), 0) || 0;
    const totalHaber = movimientos?.data?.reduce((acc, m) => acc + Number(m.haber), 0) || 0;
    const saldoNeto = totalDebe - totalHaber;

    const formatMoney = (val: number) => {
        return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Calcular saldos acumulados línea a línea para el libro mayor
    let runningBalance = 0;
    const movimientosConSaldo = (movimientos?.data || []).map((m) => {
        const debe = Number(m.debe);
        const haber = Number(m.haber);
        runningBalance += (debe - haber);
        return {
            ...m,
            saldoAcumulado: runningBalance,
        };
    });

    return (
        <>
            <Head title={__('Libro Mayor Contable')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <ModuleHeader
                        title={__('Libro Mayor (Consolidado por Cuentas)')}
                        description={__('Consolidado histórico de movimientos, sumas del debe, haber y saldo final por cuenta contable.')}
                        icon={<BookMarked className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                    />

                    {cuentaSeleccionada && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="h-9 gap-1.5 text-xs font-bold shrink-0"
                        >
                            <Download className="w-3.5 h-3.5" />
                            {__('Imprimir Mayor')}
                        </Button>
                    )}
                </div>

                {/* ══ Selector Principal de Cuenta Contable ════════════════════════════ */}
                <Card className="shadow-sm border-blue-200/60 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/50 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30">
                    <CardContent className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="w-full md:w-1/2 space-y-1.5">
                                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                                    {__('Seleccionar Cuenta Contable (PUC)')}
                                </Label>
                                <Select value={selectedCuentaId} onValueChange={handleSelectCuenta}>
                                    <SelectTrigger className="h-10 text-xs font-mono bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 shadow-2xs">
                                        <SelectValue placeholder={__('-- Seleccione una cuenta para consultar --')} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-72">
                                        {cuentasDisponibles.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)} className="font-mono text-xs">
                                                <span className="font-bold text-blue-600 dark:text-blue-400">{c.codigo}</span> - {c.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {cuentaSeleccionada && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono font-bold text-xs px-3 py-1.5">
                                        {cuentaSeleccionada.codigo}
                                    </Badge>
                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                        {cuentaSeleccionada.nombre}
                                    </span>
                                    {cuentaSeleccionada.naturaleza && (
                                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                            {__('Naturaleza')}: {cuentaSeleccionada.naturaleza}
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* ══ Cards Estadísticas Ejecutivas Pro ══════════════════════════════════ */}
                {cuentaSeleccionada && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Card 1: Total Movimientos */}
                        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    {__('Total Movimientos')}
                                </span>
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                                    <Receipt className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-baseline justify-between">
                                <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                                    {movimientos?.total || 0}
                                </span>
                                <Badge variant="outline" className="text-[10px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/50 border-blue-200">
                                    {__('Apuntes')}
                                </Badge>
                            </div>
                        </div>

                        {/* Card 2: Sumas Debe */}
                        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    {__('Sumas Debe (Débitos)')}
                                </span>
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                                    <ArrowDownRight className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-baseline justify-between">
                                <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                                    {formatMoney(totalDebe)}
                                </span>
                                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                    {__('Cargos Acumulados')}
                                </span>
                            </div>
                        </div>

                        {/* Card 3: Sumas Haber */}
                        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    {__('Sumas Haber (Créditos)')}
                                </span>
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                                    <ArrowUpRight className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-baseline justify-between">
                                <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                                    {formatMoney(totalHaber)}
                                </span>
                                <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                                    {__('Abonos Acumulados')}
                                </span>
                            </div>
                        </div>

                        {/* Card 4: Saldo Neto Final */}
                        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    {__('Saldo Neto Final')}
                                </span>
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                                    <Wallet className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-baseline justify-between">
                                <span className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                                    {formatMoney(saldoNeto)}
                                </span>
                                <Badge className="bg-blue-600 text-white font-mono text-[10px]">
                                    {saldoNeto >= 0 ? __('Deudor') : __('Acreedor')}
                                </Badge>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ Tabla de Movimientos del Libro Mayor ══════════════════════════════ */}
                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="p-4 border-b bg-slate-50/60 dark:bg-slate-900/60 flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <BookMarked className="w-4 h-4 text-blue-600" />
                            <span>{__('Detalle de Apuntes y Saldos Acumulados')}</span>
                        </CardTitle>

                        {cuentaSeleccionada && (
                            <Badge variant="outline" className="text-xs font-mono">
                                {__('Cuenta')}: {cuentaSeleccionada.codigo}
                            </Badge>
                        )}
                    </CardHeader>

                    <CardContent className="p-0">
                        {cuentaSeleccionada && movimientosConSaldo.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs font-mono">
                                    <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-bold text-[11px] text-slate-600 dark:text-slate-400 border-b tracking-wider">
                                        <tr>
                                            <th className="p-3.5">{__('N° Asiento')}</th>
                                            <th className="p-3.5">{__('Fecha')}</th>
                                            <th className="p-3.5 font-sans">{__('Concepto / Glosa Comercial')}</th>
                                            <th className="p-3.5 text-right">{__('Debe (Débito)')}</th>
                                            <th className="p-3.5 text-right">{__('Haber (Crédito)')}</th>
                                            <th className="p-3.5 text-right">{__('Saldo Acumulado')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {movimientosConSaldo.map((m) => (
                                            <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                                                <td className="p-3.5 font-bold text-blue-600 dark:text-blue-400">
                                                    <Badge className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono text-[11px]">
                                                        {m.asiento?.numero_asiento || `#${m.id}`}
                                                    </Badge>
                                                </td>
                                                <td className="p-3.5 text-slate-500 font-mono">
                                                    {m.asiento?.fecha ? new Date(m.asiento.fecha).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="p-3.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                                                    {m.asiento?.glosa}
                                                </td>
                                                <td className="p-3.5 text-right font-bold">
                                                    {Number(m.debe) > 0 ? (
                                                        <span className="text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                            {formatMoney(m.debe)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300 dark:text-slate-700">-</span>
                                                    )}
                                                </td>
                                                <td className="p-3.5 text-right font-bold">
                                                    {Number(m.haber) > 0 ? (
                                                        <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900">
                                                            {formatMoney(m.haber)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300 dark:text-slate-700">-</span>
                                                    )}
                                                </td>
                                                <td className="p-3.5 text-right font-extrabold text-blue-600 dark:text-blue-400">
                                                    {formatMoney(m.saldoAcumulado)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-100/80 dark:bg-slate-900/80 font-bold border-t text-xs">
                                        <tr>
                                            <td colSpan={3} className="p-3.5 font-sans text-right uppercase text-[10px] text-muted-foreground">
                                                {__('Totales Generales del Libro Mayor:')}
                                            </td>
                                            <td className="p-3.5 text-right text-slate-900 dark:text-slate-100">
                                                {formatMoney(totalDebe)}
                                            </td>
                                            <td className="p-3.5 text-right text-emerald-600 dark:text-emerald-400">
                                                {formatMoney(totalHaber)}
                                            </td>
                                            <td className="p-3.5 text-right text-blue-600 dark:text-blue-400 font-extrabold">
                                                {formatMoney(saldoNeto)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div className="p-16 text-center text-xs text-muted-foreground space-y-3">
                                <BookMarked className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 stroke-[1.2]" />
                                <p className="font-semibold text-sm">
                                    {cuentaSeleccionada
                                        ? __('Esta cuenta no registra movimientos en el período seleccionado.')
                                        : __('Seleccione una cuenta contable para visualizar su Libro Mayor.')}
                                </p>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                    {__('Utilice el selector de la parte superior para consultar los movimientos y saldos acumulados de cualquier cuenta del catálogo.')}
                                </p>
                            </div>
                        )}
                    </CardContent>

                    {/* Paginación */}
                    {movimientos && movimientos.total > 0 && (
                        <div className="p-4 border-t bg-slate-50/40 dark:bg-slate-900/40">
                            <Pagination paginatedData={movimientos} filters={filters} />
                        </div>
                    )}
                </Card>
            </div>
        </>
    );
}
