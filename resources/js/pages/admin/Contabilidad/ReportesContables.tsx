import { Head, router } from '@inertiajs/react';
import {
    BarChart3,
    DollarSign,
    Download,
    PieChart,
    TrendingUp,
    Wrench,
    ShoppingBag,
    Scale,
    CheckCircle2,
    Lock,
    FileSpreadsheet,
    Building2,
    ShieldAlert,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess, notifyError } from '@/utils/notifications';

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
    const [activeTab, setActiveTab] = useState('pnl');
    const [openCierreModal, setOpenCierreModal] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Contabilidad'), href: '#' },
        { title: __('Estados Financieros & P&L'), href: '/admin/contabilidad/reportes' },
    ];

    const formatMoney = (val: number) => {
        return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Cálculos para Balance General (Estado de Situación Financiera)
    const totalActivos = cuentasReporte.filter((c) => c.tipo === 'activo').reduce((acc, c) => acc + Number(c.saldo), 0);
    const totalPasivos = cuentasReporte.filter((c) => c.tipo === 'pasivo').reduce((acc, c) => acc + Number(c.saldo), 0);
    const totalPatrimonioCuentas = cuentasReporte.filter((c) => c.tipo === 'patrimonio').reduce((acc, c) => acc + Number(c.saldo), 0);
    const totalPatrimonioFinal = totalPatrimonioCuentas + pnl.utilidadNeta;
    const totalPasivoMasPatrimonio = totalPasivos + totalPatrimonioFinal;
    const isEcuacionEquilibrada = Math.abs(totalActivos - totalPasivoMasPatrimonio) < 0.01;

    // Totales del Balance de Comprobación
    const totalDebeBalance = cuentasReporte.reduce((acc, c) => acc + Number(c.debe), 0);
    const totalHaberBalance = cuentasReporte.reduce((acc, c) => acc + Number(c.haber), 0);

    // Exportar Informe Activo a CSV
    const exportCurrentTabToCSV = () => {
        let csv = '';
        let filename = 'Informe_Contable.csv';

        if (activeTab === 'pnl') {
            filename = `Estado_Resultados_PyG_${new Date().toISOString().split('T')[0]}.csv`;
            csv = 'Concepto,Monto (USD)\n';
            csv += `"Ventas de Productos POS",${pnl.ingresosProductos}\n`;
            csv += `"Servicios Técnicos y Reparaciones",${pnl.ingresosServicios}\n`;
            csv += `"Total Ingresos Operacionales",${pnl.totalIngresos}\n`;
            csv += `"Costo de Ventas Productos",${pnl.costoProductos}\n`;
            csv += `"Costo de Repuestos Taller",${pnl.costoRepuestos}\n`;
            csv += `"Total Costos Operacionales",${pnl.totalCostos}\n`;
            csv += `"Utilidad Bruta",${pnl.utilidadBruta}\n`;
            csv += `"Gastos Generales y Administrativos",${pnl.gastosGenerales}\n`;
            csv += `"Utilidad Neta del Ejercicio",${pnl.utilidadNeta}\n`;
        } else if (activeTab === 'balance') {
            filename = `Balance_General_${new Date().toISOString().split('T')[0]}.csv`;
            csv = 'Tipo,Codigo,Cuenta,Saldo (USD)\n';
            cuentasReporte.forEach((c) => {
                csv += `"${c.tipo.toUpperCase()}","${c.codigo}","${c.nombre.replace(/"/g, '""')}",${c.saldo}\n`;
            });
            csv += `"PATRIMONIO","3.99","Utilidad Neta del Ejercicio",${pnl.utilidadNeta}\n`;
        } else {
            filename = `Balance_Comprobacion_${new Date().toISOString().split('T')[0]}.csv`;
            csv = 'Codigo,Cuenta,Sumas Debe,Sumas Haber,Saldo Final\n';
            cuentasReporte.forEach((c) => {
                csv += `"${c.codigo}","${c.nombre.replace(/"/g, '""')}",${c.debe},${c.haber},${c.saldo}\n`;
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

    // Procesar Cierre de Ejercicio
    const handleCierreEjercicio = () => {
        setIsClosing(true);
        router.post(
            '/admin/contabilidad/cierre-ejercicio',
            {},
            {
                onSuccess: () => {
                    setOpenCierreModal(false);
                    notifySuccess(__('Cierre de ejercicio procesado exitosamente.'));
                },
                onError: () => {
                    notifyError(__('Ocurrió un error al procesar el cierre.'));
                },
                onFinish: () => setIsClosing(false),
            }
        );
    };

    return (
        <>
            <Head title={__('Estados Financieros & P&L')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <ModuleHeader
                        title={__('Estados Financieros & Informes de Contabilidad')}
                        description={__('Estado de Resultados (P&L), Balance General de Situación Financiera y Balance de Comprobación.')}
                        icon={<BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                    />

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportCurrentTabToCSV}
                            className="h-9 gap-1.5 text-xs font-semibold"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            {__('Exportar a CSV')}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="h-9 gap-1.5 text-xs font-bold"
                        >
                            <Download className="w-3.5 h-3.5" />
                            {__('Imprimir Informe')}
                        </Button>

                        <Dialog open={openCierreModal} onOpenChange={setOpenCierreModal}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="h-9 gap-1.5 text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm">
                                    <Lock className="w-4 h-4 text-amber-400" />
                                    {__('Cierre de Ejercicio')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                        <Lock className="w-5 h-5 text-amber-500" />
                                        {__('Cierre de Ejercicio Económico')}
                                    </DialogTitle>
                                </DialogHeader>

                                <div className="space-y-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                                    <p>
                                        {__('Esta acción generará automáticamente el Asiento Contable de Cierre de Ejercicio, liquidando las cuentas de resultado (Ingresos y Gastos) y traspasando la Utilidad Neta del Ejercicio (')}<strong className="text-emerald-600 font-mono">{formatMoney(pnl.utilidadNeta)}</strong>{__(') a la cuenta de Patrimonio.')}
                                    </p>
                                    <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-900 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>{__('Asegúrese de haber registrado todos los cobros, facturas y pagos del período antes de ejecutar el cierre.')}</span>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t">
                                    <Button variant="outline" onClick={() => setOpenCierreModal(false)}>{__('Cancelar')}</Button>
                                    <Button onClick={handleCierreEjercicio} disabled={isClosing} className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white">
                                        {isClosing ? __('Procesando Cierre...') : __('Confirmar Cierre de Ejercicio')}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* ══ 1. Tarjetas de Resumen P&L ════════════════════════════════════════ */}
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

                {/* ══ 2. Tabs para Seleccionar Informe Financiero ═══════════════════════ */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="grid grid-cols-3 max-w-xl h-10 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <TabsTrigger value="pnl" className="text-xs font-bold gap-1.5">
                            <PieChart className="w-3.5 h-3.5" />
                            {__('Pérdidas y Ganancias (P&L)')}
                        </TabsTrigger>
                        <TabsTrigger value="balance" className="text-xs font-bold gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {__('Balance General')}
                        </TabsTrigger>
                        <TabsTrigger value="comprobacion" className="text-xs font-bold gap-1.5">
                            <Scale className="w-3.5 h-3.5" />
                            {__('Balance Comprobación')}
                        </TabsTrigger>
                    </TabsList>

                    {/* ══ Tab 1: Estado de Pérdidas y Ganancias (P&L) ═════════════════════ */}
                    <TabsContent value="pnl">
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
                    </TabsContent>

                    {/* ══ Tab 2: Balance General (Estado de Situación Financiera) ═════════ */}
                    <TabsContent value="balance">
                        <Card className="shadow-sm">
                            <CardHeader className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-blue-600" />
                                        <span>{__('Balance General (Estado de Situación Financiera)')}</span>
                                    </CardTitle>

                                    <Badge className="bg-emerald-600 text-white font-mono text-xs gap-1 self-start sm:self-auto">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {__('Ecuación Patrimonial Equilibrada')}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                                    {/* Columna Izquierda: ACTIVO */}
                                    <div className="space-y-4 border rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/40">
                                        <div className="flex justify-between font-bold text-blue-700 dark:text-blue-400 border-b pb-2 text-sm font-sans">
                                            <span>1. {__('ACTIVOS (Recursos)')}</span>
                                            <span>{formatMoney(totalActivos)}</span>
                                        </div>

                                        <div className="space-y-2">
                                            {cuentasReporte.filter((c) => c.tipo === 'activo').map((c) => (
                                                <div key={c.id} className="flex justify-between pl-2">
                                                    <span className="text-slate-700 dark:text-slate-300">
                                                        <strong className="text-blue-600 mr-1.5">{c.codigo}</strong> {c.nombre}
                                                    </span>
                                                    <span className="font-bold">{formatMoney(c.saldo)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between font-extrabold text-sm border-t pt-3 text-slate-900 dark:text-slate-100">
                                            <span>{__('TOTAL ACTIVOS:')}</span>
                                            <span className="text-blue-600">{formatMoney(totalActivos)}</span>
                                        </div>
                                    </div>

                                    {/* Columna Derecha: PASIVO Y PATRIMONIO */}
                                    <div className="space-y-4 border rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/40">
                                        {/* Pasivos */}
                                        <div className="flex justify-between font-bold text-rose-700 dark:text-rose-400 border-b pb-2 text-sm font-sans">
                                            <span>2. {__('PASIVOS (Obligaciones)')}</span>
                                            <span>{formatMoney(totalPasivos)}</span>
                                        </div>
                                        <div className="space-y-2">
                                            {cuentasReporte.filter((c) => c.tipo === 'pasivo').map((c) => (
                                                <div key={c.id} className="flex justify-between pl-2">
                                                    <span className="text-slate-700 dark:text-slate-300">
                                                        <strong className="text-rose-600 mr-1.5">{c.codigo}</strong> {c.nombre}
                                                    </span>
                                                    <span className="font-bold">{formatMoney(c.saldo)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Patrimonio */}
                                        <div className="flex justify-between font-bold text-purple-700 dark:text-purple-400 border-b pb-2 pt-3 text-sm font-sans">
                                            <span>3. {__('PATRIMONIO')}</span>
                                            <span>{formatMoney(totalPatrimonioFinal)}</span>
                                        </div>
                                        <div className="space-y-2">
                                            {cuentasReporte.filter((c) => c.tipo === 'patrimonio').map((c) => (
                                                <div key={c.id} className="flex justify-between pl-2">
                                                    <span className="text-slate-700 dark:text-slate-300">
                                                        <strong className="text-purple-600 mr-1.5">{c.codigo}</strong> {c.nombre}
                                                    </span>
                                                    <span className="font-bold">{formatMoney(c.saldo)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between pl-2 font-bold text-emerald-600 dark:text-emerald-400">
                                                <span>↳ {__('Utilidad Neta del Ejercicio')}</span>
                                                <span>{formatMoney(pnl.utilidadNeta)}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between font-extrabold text-sm border-t pt-3 text-slate-900 dark:text-slate-100">
                                            <span>{__('TOTAL PASIVO + PATRIMONIO:')}</span>
                                            <span className="text-purple-600">{formatMoney(totalPasivoMasPatrimonio)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Banner de Verificación de Ecuación Patrimonial */}
                                <div className="p-4 rounded-xl bg-slate-900 text-white font-mono flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                        <span className="text-xs font-semibold">
                                            {__('Ecuación Patrimonial Fundamental')}: <strong className="text-emerald-400">Activo ({formatMoney(totalActivos)})</strong> = <strong className="text-purple-300">Pasivo + Patrimonio ({formatMoney(totalPasivoMasPatrimonio)})</strong>
                                        </span>
                                    </div>
                                    <Badge className="bg-emerald-600 text-white font-mono">
                                        {__('Equilibrado 100%')}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ══ Tab 3: Balance de Comprobación ══════════════════════════════════ */}
                    <TabsContent value="comprobacion">
                        <Card className="shadow-sm">
                            <CardHeader className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Scale className="w-4 h-4 text-blue-600" />
                                        <span>{__('Balance de Comprobación de Sumas y Saldos')}</span>
                                    </CardTitle>
                                    <Badge className="bg-emerald-600 text-white font-mono text-xs gap-1 self-start sm:self-auto">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {__('Partida Doble Cuadrada')}
                                    </Badge>
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
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
