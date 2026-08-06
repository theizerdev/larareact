import { Head } from '@inertiajs/react';
import { BarChart3, DollarSign, Download, PieChart, TrendingUp, Wrench, ShoppingBag, ArrowUpRight, Scale, CheckCircle2 } from 'lucide-react';
import React from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslate } from '@/hooks/use-translate';

interface CuentaReporte {
    id: number;
    codigo: string;
    nombre: string;
    tipo: string;
    naturaleza: string;
    debe: number;
    haber: number;
    saldo: number;
}

interface PnlData {
    ingresosProductos: number;
    ingresosServicios: number;
    totalIngresos: number;
    costoProductos: number;
    costoRepuestos: number;
    totalCostos: number;
    gastosGenerales: number;
    utilidadBruta: number;
    utilidadNeta: number;
}

interface Props {
    cuentasReporte: CuentaReporte[];
    pnl: PnlData;
}

export default function ReportesContables({ cuentasReporte, pnl }: Props) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Contabilidad'), href: '#' },
        { title: __('Estados Financieros & P&L'), href: '/admin/contabilidad/reportes' },
    ];

    const formatMoney = (val: number) => {
        return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const totalDebeBalance = cuentasReporte.reduce((acc, c) => acc + Number(c.debe), 0);
    const totalHaberBalance = cuentasReporte.reduce((acc, c) => acc + Number(c.haber), 0);
    const isBalanceEquilibrado = Math.abs(totalDebeBalance - totalHaberBalance) < 0.01;

    return (
        <>
            <Head title={__('Estados Financieros & P&L')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <ModuleHeader
                        title={__('Estados Financieros (P&L y Balance de Comprobación)')}
                        description={__('Resumen de resultados del ejercicio, desglose de ingresos por productos y servicios, y balance de comprobación.')}
                        icon={<BarChart3 className="w-6 h-6 text-blue-600" />}
                    />

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.print()}
                        className="h-9 gap-1.5 text-xs font-bold shrink-0"
                    >
                        <Download className="w-3.5 h-3.5" />
                        {__('Imprimir Informe')}
                    </Button>
                </div>

                {/* 1. Tarjetas de Resumen P&L */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-blue-100 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm">
                        <CardContent className="p-4 space-y-1">
                            <div className="flex items-center justify-between text-xs text-blue-600 font-semibold">
                                <span>{__('Ingresos por Productos')}</span>
                                <ShoppingBag className="w-4 h-4" />
                            </div>
                            <p className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">
                                {formatMoney(pnl.ingresosProductos)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-purple-100 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/20 shadow-sm">
                        <CardContent className="p-4 space-y-1">
                            <div className="flex items-center justify-between text-xs text-purple-600 font-semibold">
                                <span>{__('Ingresos Servicio Técnico')}</span>
                                <Wrench className="w-4 h-4" />
                            </div>
                            <p className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">
                                {formatMoney(pnl.ingresosServicios)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-amber-100 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm">
                        <CardContent className="p-4 space-y-1">
                            <div className="flex items-center justify-between text-xs text-amber-600 font-semibold">
                                <span>{__('Utilidad Bruta')}</span>
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <p className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">
                                {formatMoney(pnl.utilidadBruta)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-sm">
                        <CardContent className="p-4 space-y-1">
                            <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                                <span>{__('Utilidad Neta del Ejercicio')}</span>
                                <DollarSign className="w-4 h-4" />
                            </div>
                            <p className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                                {formatMoney(pnl.utilidadNeta)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. Estado de Pérdidas y Ganancias (P&L) Estructurado */}
                <Card className="shadow-sm">
                    <CardHeader className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
                        <CardTitle className="text-base font-bold flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <PieChart className="w-4 h-4 text-blue-600" />
                                <span>{__('Estado de Resultados (Pérdidas y Ganancias P&L)')}</span>
                            </div>
                            <Badge variant="outline" className="text-xs font-mono text-blue-600 border-blue-200">
                                {__('Ejercicio Actual')}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4 text-xs font-mono">
                        <div className="space-y-2 border-b pb-3">
                            <div className="flex justify-between font-bold text-blue-700 dark:text-blue-400 font-sans text-sm">
                                <span>(+) {__('INGRESOS OPERACIONALES')}</span>
                                <span>{formatMoney(pnl.totalIngresos)}</span>
                            </div>
                            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300">
                                <span>• {__('Ventas de Productos POS')}</span>
                                <span>{formatMoney(pnl.ingresosProductos)}</span>
                            </div>
                            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300">
                                <span>• {__('Servicios Técnicos y Reparaciones')}</span>
                                <span>{formatMoney(pnl.ingresosServicios)}</span>
                            </div>
                        </div>

                        <div className="space-y-2 border-b pb-3">
                            <div className="flex justify-between font-bold text-rose-700 dark:text-rose-400 font-sans text-sm">
                                <span>(-) {__('COSTO DE VENTAS E INSUMOS')}</span>
                                <span>{formatMoney(pnl.totalCostos)}</span>
                            </div>
                            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300">
                                <span>• {__('Costo de Ventas Productos')}</span>
                                <span>{formatMoney(pnl.costoProductos)}</span>
                            </div>
                            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300">
                                <span>• {__('Costo de Repuestos Taller')}</span>
                                <span>{formatMoney(pnl.costoRepuestos)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100 text-sm border-b pb-3">
                            <span>(=) {__('UTILIDAD BRUTA')}</span>
                            <span className="text-blue-600 dark:text-blue-400">{formatMoney(pnl.utilidadBruta)}</span>
                        </div>

                        <div className="space-y-2 border-b pb-3">
                            <div className="flex justify-between font-bold text-amber-700 dark:text-amber-400 font-sans text-sm">
                                <span>(-) {__('GASTOS OPERACIONALES')}</span>
                                <span>{formatMoney(pnl.gastosGenerales)}</span>
                            </div>
                            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300">
                                <span>• {__('Gastos Generales y Administrativos')}</span>
                                <span>{formatMoney(pnl.gastosGenerales)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between font-extrabold text-sm sm:text-base text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <span>(=) {__('UTILIDAD NETA DEL EJERCICIO')}</span>
                            <span>{formatMoney(pnl.utilidadNeta)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Balance de Comprobación */}
                <Card className="shadow-sm">
                    <CardHeader className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Scale className="w-4 h-4 text-blue-600" />
                                <span>{__('Balance de Comprobación de Sumas y Saldos')}</span>
                            </CardTitle>
                            {isBalanceEquilibrado && (
                                <Badge className="bg-emerald-600 text-white font-mono text-xs gap-1 self-start sm:self-auto">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {__('Partida Doble Cuadrada')}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-mono">
                                <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-bold text-[11px] text-muted-foreground border-b">
                                    <tr>
                                        <th className="p-3">{__('Código')}</th>
                                        <th className="p-3 font-sans">{__('Cuenta Contable')}</th>
                                        <th className="p-3 text-right">{__('Sumas Debe')}</th>
                                        <th className="p-3 text-right">{__('Sumas Haber')}</th>
                                        <th className="p-3 text-right">{__('Saldo Final')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {cuentasReporte.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="p-3 font-bold text-blue-600">{c.codigo}</td>
                                            <td className="p-3 font-sans font-medium">{c.nombre}</td>
                                            <td className="p-3 text-right font-semibold">{formatMoney(c.debe)}</td>
                                            <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{formatMoney(c.haber)}</td>
                                            <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">{formatMoney(c.saldo)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-100 dark:bg-slate-900 font-bold border-t text-xs">
                                    <tr>
                                        <td colSpan={2} className="p-3 font-sans text-right uppercase text-[10px] text-muted-foreground">
                                            {__('Totales del Balance:')}
                                        </td>
                                        <td className="p-3 text-right text-slate-900 dark:text-slate-100">{formatMoney(totalDebeBalance)}</td>
                                        <td className="p-3 text-right text-emerald-600 dark:text-emerald-400">{formatMoney(totalHaberBalance)}</td>
                                        <td className="p-3 text-right text-blue-600 font-bold">
                                            {formatMoney(Math.max(totalDebeBalance, totalHaberBalance))}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
