import { Head, useForm, router } from '@inertiajs/react';
import {
    Target,
    TrendingUp,
    DollarSign,
    Percent,
    Calendar,
    Building2,
    Save,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Info,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface WeekBreakdown {
    semana: string;
    inicio_dia: number;
    fin_dia: number;
    dias: number;
    dias_map: {
        lunes: number;
        martes: number;
        miercoles: number;
        jueves: number;
        viernes: number;
        sabado: number;
        domingo: number;
    };
    total_ventas: number;
    meta_semanal: number;
    porcentaje_avance: number;
    objetivo_diario: number;
}

interface Sucursal {
    id: number;
    nombre: string;
}

interface MetasPageProps {
    goal: {
        id?: number;
        increment_percentage?: number;
        target_amount?: number;
        notes?: string;
    } | null;
    filters: {
        year: number;
        month: number;
        sucursal_id?: number | null;
    };
    actualSalesTotal: number;
    targetAmount: number;
    incrementPercentage: number;
    dailyAverageTarget: number;
    overallProgress: number;
    weeksBreakdown: WeekBreakdown[];
    yearsList: number[];
    monthsList: Record<number, string>;
    sucursales: Sucursal[];
    currencySymbol: string;
}

export default function MetasIndexPage({
    goal,
    filters,
    actualSalesTotal,
    targetAmount: initialTargetAmount,
    incrementPercentage: initialIncrementPercentage,
    dailyAverageTarget,
    overallProgress,
    weeksBreakdown,
    yearsList,
    monthsList,
    sucursales,
    currencySymbol = '$',
}: MetasPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Point of Sale'), href: '/admin/ventas/terminal' },
        { title: __('Metas de Ventas'), href: '/admin/pos/metas' },
    ];

    // Estados de filtros
    const [selectedYear, setSelectedYear] = useState<string>(String(filters.year));
    const [selectedMonth, setSelectedMonth] = useState<string>(String(filters.month));
    const [selectedSucursal, setSelectedSucursal] = useState<string>(
        filters.sucursal_id ? String(filters.sucursal_id) : ''
    );

    // Formulario para guardar / recalcular meta
    const { data, setData, post, processing, errors } = useForm({
        year: filters.year,
        month: filters.month,
        sucursal_id: filters.sucursal_id || '',
        increment_percentage: initialIncrementPercentage,
        target_amount: initialTargetAmount,
        notes: goal?.notes || '',
    });

    // Actualizar formulario al cambiar filtros desde props
    useEffect(() => {
        setData((prev) => ({
            ...prev,
            year: Number(selectedYear),
            month: Number(selectedMonth),
            sucursal_id: selectedSucursal ? Number(selectedSucursal) : '',
        }));
    }, [selectedYear, selectedMonth, selectedSucursal]);

    // Recalcular meta al modificar el % de incremento
    const handleIncrementChange = (value: string) => {
        const pct = parseFloat(value) || 0;
        const newTarget = actualSalesTotal > 0
            ? Math.round(actualSalesTotal * (1 + pct / 100) * 100) / 100
            : data.target_amount;

        setData((prev) => ({
            ...prev,
            increment_percentage: pct,
            target_amount: newTarget,
        }));
    };

    // Recalcular % al modificar manualmente el monto de meta
    const handleTargetAmountChange = (value: string) => {
        const target = parseFloat(value) || 0;
        const pct = actualSalesTotal > 0
            ? Math.round(((target - actualSalesTotal) / actualSalesTotal) * 100 * 10) / 10
            : 0;

        setData((prev) => ({
            ...prev,
            target_amount: target,
            increment_percentage: pct >= 0 ? pct : 0,
        }));
    };

    // Aplicar cambio de filtros para recargar datos desde el servidor
    const handleFilterChange = (newYear?: string, newMonth?: string, newSucursal?: string) => {
        const y = newYear || selectedYear;
        const m = newMonth || selectedMonth;
        const s = newSucursal !== undefined ? newSucursal : selectedSucursal;

        router.get(
            '/admin/pos/metas',
            {
                year: y,
                month: m,
                sucursal_id: s || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Guardar meta en backend
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/pos/metas', {
            preserveScroll: true,
            onSuccess: () => {
                notifySuccess(__('Meta de ventas actualizada correctamente.'));
            },
            onError: () => {
                notifyError(__('Ocurrió un error al guardar la meta de ventas.'));
            },
        });
    };

    // Formateador de moneda
    const formatMoney = (amount: number) => {
        return `${currencySymbol}${amount.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    // Totales globales para el pie de tabla
    const totalLun = weeksBreakdown.reduce((acc, w) => acc + w.dias_map.lunes, 0);
    const totalMar = weeksBreakdown.reduce((acc, w) => acc + w.dias_map.martes, 0);
    const totalMie = weeksBreakdown.reduce((acc, w) => acc + w.dias_map.miercoles, 0);
    const totalJue = weeksBreakdown.reduce((acc, w) => acc + w.dias_map.jueves, 0);
    const totalVie = weeksBreakdown.reduce((acc, w) => acc + w.dias_map.viernes, 0);
    const totalSab = weeksBreakdown.reduce((acc, w) => acc + w.dias_map.sabado, 0);
    const totalDom = weeksBreakdown.reduce((acc, w) => acc + w.dias_map.domingo, 0);
    const totalDiasMes = weeksBreakdown.reduce((acc, w) => acc + w.dias, 0);

    return (
        <>
            <Head title={__('Metas de Ventas')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Encabezado Principal del Módulo (Estilo Empresas) */}
                <ModuleHeader
                    icon={<Target className="h-6 w-6 text-white" />}
                    title={__('Metas de Ventas')}
                    description={__('Sincronización de caja, planificación de metas de facturación y análisis de avance semanal.')}
                    colorClassName="bg-emerald-600 dark:bg-emerald-700"
                >
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => handleFilterChange()}
                            className="bg-white/10 text-white hover:bg-white/20 border-white/20"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            {__('Sincronizar')}
                        </Button>
                    </div>
                </ModuleHeader>

                {/* Filtros de Control y Configuración de Incremento */}
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
                        {/* Selector Año */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {__('Año')}
                            </Label>
                            <Select
                                value={selectedYear}
                                onValueChange={(val) => {
                                    setSelectedYear(val);
                                    handleFilterChange(val, selectedMonth, selectedSucursal);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={__('Seleccionar Año')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {yearsList.map((y) => (
                                        <SelectItem key={y} value={String(y)}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Selector Mes */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {__('Mes')}
                            </Label>
                            <Select
                                value={selectedMonth}
                                onValueChange={(val) => {
                                    setSelectedMonth(val);
                                    handleFilterChange(selectedYear, val, selectedSucursal);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={__('Seleccionar Mes')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(monthsList).map(([num, name]) => (
                                        <SelectItem key={num} value={num}>
                                            {name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Selector Sucursal */}
                        {sucursales.length > 0 && (
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5" />
                                    {__('Sucursal')}
                                </Label>
                                <Select
                                    value={selectedSucursal}
                                    onValueChange={(val) => {
                                        setSelectedSucursal(val);
                                        handleFilterChange(selectedYear, selectedMonth, val);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={__('Todas las sucursales')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">{__('Todas las sucursales')}</SelectItem>
                                        {sucursales.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Input % Incremento */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Percent className="h-3.5 w-3.5" />
                                {__('% Porcentaje de Incremento')}
                            </Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={data.increment_percentage}
                                    onChange={(e) => handleIncrementChange(e.target.value)}
                                    placeholder="0.0"
                                    className="pr-8"
                                />
                                <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">%</span>
                            </div>
                        </div>

                        {/* Botón Guardar Meta */}
                        <div>
                            <Button type="submit" disabled={processing} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Save className="mr-2 h-4 w-4" />
                                {__('Guardar Meta')}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Tarjetas de Estadísticas KPI (Estilo Empresas StatCard) */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={<DollarSign className="h-6 w-6" />}
                        title={__('VENTAS REALES DE CAJA')}
                        value={formatMoney(actualSalesTotal)}
                        description={__('Monto de venta acumulado en el mes')}
                        colorClassName="bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                    />

                    <StatCard
                        icon={<Percent className="h-6 w-6" />}
                        title={__('% DE INCREMENTO')}
                        value={`${data.increment_percentage}%`}
                        description={__('Objetivo sobre las ventas base')}
                        colorClassName="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                    />

                    <StatCard
                        icon={<Target className="h-6 w-6" />}
                        title={__('META MENSUAL DE VENTAS')}
                        value={formatMoney(data.target_amount)}
                        description={__('Monto objetivo proyectado')}
                        colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                    />

                    <StatCard
                        icon={<TrendingUp className="h-6 w-6" />}
                        title={__('% DE AVANCE GLOBAL')}
                        value={`${overallProgress}%`}
                        description={
                            overallProgress >= 100
                                ? __('¡Meta mensual alcanzada!')
                                : `${formatMoney(Math.max(0, data.target_amount - actualSalesTotal))} ${__('restantes')}`
                        }
                        colorClassName={cn(
                            overallProgress >= 100
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : overallProgress >= 80
                                ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                                : 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                        )}
                    />
                </div>

                {/* Barra de Progreso Global */}
                <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-emerald-600" />
                            {__('Progreso Mensual del Objetivo de Facturación')}
                        </span>
                        <span className="font-bold text-emerald-600">{overallProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
                        <div
                            className={cn(
                                'h-full transition-all duration-500 rounded-full',
                                overallProgress >= 100
                                    ? 'bg-emerald-500'
                                    : overallProgress >= 80
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-600'
                            )}
                            style={{ width: `${Math.min(100, overallProgress)}%` }}
                        />
                    </div>
                </div>

                {/* TABLA PRINCIPAL: AVANCE MENSUAL (Réplica fiel de la plantilla Excel) */}
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-emerald-600" />
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                                {__('AVANCE MENSUAL DE VENTAS DIARIAS POR SEMANA')} — {monthsList[Number(selectedMonth)]} {selectedYear}
                            </h3>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3">
                            <span className="inline-flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> ≥100% Meta
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> 80-99% Meta
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> &lt;80% Meta
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-center border-b">
                                    <th colSpan={2} className="p-2.5 border-r border-slate-300 dark:border-slate-700">
                                        AVANCE MENSUAL
                                    </th>
                                    <th className="p-2.5 border-r border-slate-300 dark:border-slate-700">
                                        INICIO Y FINAL (DÍAS)
                                    </th>
                                    <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 bg-lime-200 dark:bg-lime-950/60 text-slate-900 dark:text-lime-200">
                                        META MENSUAL
                                    </th>
                                    <th colSpan={7} className="p-2.5 border-r border-slate-300 dark:border-slate-700">
                                        VENTAS DIARIAS POR SEMANA DE TODO EL MES
                                    </th>
                                    <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 bg-lime-200 dark:bg-lime-950/60 text-slate-900 dark:text-lime-200">
                                        TOTAL VENTAS SEMANAL
                                    </th>
                                    <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 bg-lime-300 dark:bg-lime-900/60 text-slate-900 dark:text-lime-100">
                                        META SEMANAL
                                    </th>
                                    <th className="p-2.5 border-r border-slate-300 dark:border-slate-700">
                                        % AVANCE META
                                    </th>
                                    <th className="p-2.5 border-r border-slate-300 dark:border-slate-700">
                                        DÍAS X SEMANA
                                    </th>
                                    <th className="p-2.5">
                                        OBJETIVO DIARIO PROMEDIO
                                    </th>
                                </tr>
                                <tr className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-semibold border-b text-center">
                                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">SEMANAS</th>
                                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">MES</th>
                                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">RANGO</th>
                                    <th className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                                        {formatMoney(data.target_amount)}
                                    </th>
                                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">Lunes</th>
                                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">Martes</th>
                                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">Miércoles</th>
                                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">Jueves</th>
                                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">Viernes</th>
                                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">Sábado</th>
                                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">Domingo</th>
                                    <th className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold">RECAUDO</th>
                                    <th className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold">OBJETIVO</th>
                                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">%</th>
                                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">DÍAS</th>
                                    <th className="p-2">DIARIO</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {weeksBreakdown.map((wb, idx) => {
                                    const isRowGreen = wb.porcentaje_avance >= 100;
                                    const isRowYellow = wb.porcentaje_avance >= 80 && wb.porcentaje_avance < 100;
                                    const isRowRed = wb.porcentaje_avance < 80;

                                    return (
                                        <tr key={wb.semana} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                            <td className="p-2.5 font-medium border-r text-center">{wb.semana}</td>
                                            <td className="p-2.5 text-muted-foreground border-r text-center capitalize">
                                                {monthsList[Number(selectedMonth)]}
                                            </td>
                                            <td className="p-2.5 border-r text-center font-mono">
                                                {wb.inicio_dia} AL {wb.fin_dia}
                                            </td>

                                            {/* Span solo en primera fila para Meta Mensual */}
                                            {idx === 0 ? (
                                                <td
                                                    rowSpan={weeksBreakdown.length}
                                                    className="p-2.5 border-r font-bold text-base text-center bg-slate-50/50 dark:bg-slate-900/30 align-middle text-slate-800 dark:text-slate-200"
                                                >
                                                    {formatMoney(data.target_amount)}
                                                </td>
                                            ) : null}

                                            {/* Ventas Diarias */}
                                            <td className="p-2.5 border-r text-right font-mono">
                                                {wb.dias_map.lunes > 0 ? formatMoney(wb.dias_map.lunes) : '—'}
                                            </td>
                                            <td className="p-2.5 border-r text-right font-mono">
                                                {wb.dias_map.martes > 0 ? formatMoney(wb.dias_map.martes) : '—'}
                                            </td>
                                            <td className="p-2.5 border-r text-right font-mono">
                                                {wb.dias_map.miercoles > 0 ? formatMoney(wb.dias_map.miercoles) : '—'}
                                            </td>
                                            <td className="p-2.5 border-r text-right font-mono">
                                                {wb.dias_map.jueves > 0 ? formatMoney(wb.dias_map.jueves) : '—'}
                                            </td>
                                            <td className="p-2.5 border-r text-right font-mono">
                                                {wb.dias_map.viernes > 0 ? formatMoney(wb.dias_map.viernes) : '—'}
                                            </td>
                                            <td className="p-2.5 border-r text-right font-mono">
                                                {wb.dias_map.sabado > 0 ? formatMoney(wb.dias_map.sabado) : '—'}
                                            </td>
                                            <td className="p-2.5 border-r text-right font-mono">
                                                {wb.dias_map.domingo > 0 ? formatMoney(wb.dias_map.domingo) : '—'}
                                            </td>

                                            {/* Total Ventas Semanal */}
                                            <td className="p-2.5 border-r text-right font-bold font-mono bg-slate-50 dark:bg-slate-900/50">
                                                {formatMoney(wb.total_ventas)}
                                            </td>

                                            {/* Meta Semanal de Ventas (Con color de fondo del Excel) */}
                                            <td
                                                className={cn(
                                                    'p-2.5 border-r text-right font-bold font-mono text-white',
                                                    isRowGreen
                                                        ? 'bg-emerald-600'
                                                        : isRowYellow
                                                        ? 'bg-amber-500'
                                                        : 'bg-rose-600'
                                                )}
                                            >
                                                {formatMoney(wb.meta_semanal)}
                                            </td>

                                            {/* % de Avance de la Meta */}
                                            <td className="p-2.5 border-r text-center font-bold">
                                                <span
                                                    className={cn(
                                                        'inline-block px-2 py-0.5 rounded-full text-xs font-semibold',
                                                        isRowGreen
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                                            : isRowYellow
                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                                    )}
                                                >
                                                    {wb.porcentaje_avance}%
                                                </span>
                                            </td>

                                            {/* Cantidad de Días x Semana */}
                                            <td className="p-2.5 border-r text-center font-semibold">{wb.dias}</td>

                                            {/* Objetivo Promedio Facturación Diario */}
                                            <td className="p-2.5 text-right font-mono">{formatMoney(wb.objetivo_diario)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>

                            {/* Fila de Totales Generales */}
                            <tfoot className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-t border-slate-300 dark:border-slate-700">
                                <tr>
                                    <td colSpan={4} className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center uppercase tracking-wider">
                                        TOTAL GENERAL DEL MES
                                    </td>
                                    <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-right font-mono">
                                        {formatMoney(totalLun)}
                                    </td>
                                    <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-right font-mono">
                                        {formatMoney(totalMar)}
                                    </td>
                                    <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-right font-mono">
                                        {formatMoney(totalMie)}
                                    </td>
                                    <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-right font-mono">
                                        {formatMoney(totalJue)}
                                    </td>
                                    <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-right font-mono">
                                        {formatMoney(totalVie)}
                                    </td>
                                    <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-right font-mono">
                                        {formatMoney(totalSab)}
                                    </td>
                                    <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-right font-mono">
                                        {formatMoney(totalDom)}
                                    </td>
                                    <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-right font-mono bg-lime-300 dark:bg-lime-900/80 text-slate-900 dark:text-lime-100">
                                        {formatMoney(actualSalesTotal)}
                                    </td>
                                    <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-right font-mono bg-lime-400 dark:bg-lime-800 text-slate-900 dark:text-lime-100">
                                        {formatMoney(data.target_amount)}
                                    </td>
                                    <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center">
                                        {overallProgress}%
                                    </td>
                                    <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center">
                                        {totalDiasMes}
                                    </td>
                                    <td className="p-2.5 text-right font-mono">{formatMoney(dailyAverageTarget)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
