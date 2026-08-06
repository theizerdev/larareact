import { Head } from '@inertiajs/react';
import { BarChart3, DollarSign, Download, PieChart, TrendingUp, Wrench, ShoppingBag } from 'lucide-react';
import React from 'react';
import { ModuleHeader } from '@/components/module-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';

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
    const breadcrumbs = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Contabilidad', href: '#' },
        { title: 'Estados Financieros & P&L', href: '/admin/contabilidad/reportes' },
    ];

    return (
        <>
            <Head title="Estados Financieros & P&L" />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />
                <ModuleHeader
                    title="Estados Financieros (P&L y Balance de Comprobación)"
                    description="Resumen de resultados del ejercicio, desglose de ingresos por productos y servicios, y balance de comprobación."
                    icon={<BarChart3 className="w-6 h-6" />}
                />

                {/* 1. Tarjetas de Resumen P&L */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-blue-100 bg-blue-50/40 dark:bg-blue-950/20">
                        <CardContent className="p-4 space-y-1">
                            <div className="flex items-center justify-between text-xs text-blue-600 font-bold">
                                <span>Ingresos por Productos</span>
                                <ShoppingBag className="w-4 h-4" />
                            </div>
                            <p className="text-xl font-mono font-bold text-slate-900 dark:text-slate-100">
                                ${pnl.ingresosProductos.toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-purple-100 bg-purple-50/40 dark:bg-purple-950/20">
                        <CardContent className="p-4 space-y-1">
                            <div className="flex items-center justify-between text-xs text-purple-600 font-bold">
                                <span>Ingresos Servicio Técnico</span>
                                <Wrench className="w-4 h-4" />
                            </div>
                            <p className="text-xl font-mono font-bold text-slate-900 dark:text-slate-100">
                                ${pnl.ingresosServicios.toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-amber-100 bg-amber-50/40 dark:bg-amber-950/20">
                        <CardContent className="p-4 space-y-1">
                            <div className="flex items-center justify-between text-xs text-amber-600 font-bold">
                                <span>Utilidad Bruta</span>
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <p className="text-xl font-mono font-bold text-slate-900 dark:text-slate-100">
                                ${pnl.utilidadBruta.toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-100 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm">
                        <CardContent className="p-4 space-y-1">
                            <div className="flex items-center justify-between text-xs text-emerald-700 font-bold">
                                <span>Utilidad Neta</span>
                                <DollarSign className="w-4 h-4" />
                            </div>
                            <p className="text-2xl font-mono font-extrabold text-emerald-600">
                                ${pnl.utilidadNeta.toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. Estado de Pérdidas y Ganancias (P&L) Estructurado */}
                <Card className="shadow-sm">
                    <CardHeader className="p-4 border-b">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <PieChart className="w-4 h-4 text-blue-600" />
                            Estado de Resultados (Pérdidas y Ganancias P&L)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4 text-xs font-mono">
                        <div className="space-y-2 border-b pb-3">
                            <div className="flex justify-between font-bold text-blue-700 dark:text-blue-400 font-sans text-sm">
                                <span>(+) INGRESOS OPERACIONALES</span>
                                <span>${pnl.totalIngresos.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300">
                                <span>• Ventas de Productos POS</span>
                                <span>${pnl.ingresosProductos.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300">
                                <span>• Servicios Técnicos y Reparaciones</span>
                                <span>${pnl.ingresosServicios.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-2 border-b pb-3">
                            <div className="flex justify-between font-bold text-rose-700 dark:text-rose-400 font-sans text-sm">
                                <span>(-) COSTO DE VENTAS E INSUMOS</span>
                                <span>${pnl.totalCostos.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300">
                                <span>• Costo de Ventas Productos</span>
                                <span>${pnl.costoProductos.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300">
                                <span>• Costo de Repuestos Taller</span>
                                <span>${pnl.costoRepuestos.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100 text-sm border-b pb-3">
                            <span>(=) UTILIDAD BRUTA</span>
                            <span className="text-blue-600">${pnl.utilidadBruta.toFixed(2)}</span>
                        </div>

                        <div className="space-y-2 border-b pb-3">
                            <div className="flex justify-between font-bold text-amber-700 dark:text-amber-400 font-sans text-sm">
                                <span>(-) GASTOS OPERACIONALES</span>
                                <span>${pnl.gastosGenerales.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300">
                                <span>• Gastos Generales y Administrativos</span>
                                <span>${pnl.gastosGenerales.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between font-extrabold text-base text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200">
                            <span>(=) UTILIDAD NETA DEL EJERCICIO</span>
                            <span>${pnl.utilidadNeta.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Balance de Comprobación */}
                <Card className="shadow-sm">
                    <CardHeader className="p-4 border-b">
                        <CardTitle className="text-base font-bold">Balance de Comprobación de Sumas y Saldos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-left text-xs font-mono">
                            <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-bold text-[11px]">
                                <tr>
                                    <th className="p-3">Código</th>
                                    <th className="p-3">Cuenta Contable</th>
                                    <th className="p-3 text-right">Sumas Debe</th>
                                    <th className="p-3 text-right">Sumas Haber</th>
                                    <th className="p-3 text-right">Saldo Final</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {cuentasReporte.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="p-3 font-bold text-blue-600">{c.codigo}</td>
                                        <td className="p-3 font-sans font-medium">{c.nombre}</td>
                                        <td className="p-3 text-right">${c.debe.toFixed(2)}</td>
                                        <td className="p-3 text-right text-emerald-600">${c.haber.toFixed(2)}</td>
                                        <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">${c.saldo.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
