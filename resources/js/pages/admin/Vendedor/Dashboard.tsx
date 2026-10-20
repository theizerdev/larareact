import { Head, Link, router } from '@inertiajs/react';
import {
    Award,
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    Filter,
    Package,
    Receipt,
    RefreshCw,
    Search,
    ShoppingCart,
    Store,
    Target,
    TrendingUp,
    UserCheck,
    Wallet,
    Zap,
    Wrench,
    Eye,
    ArrowRight,
    AlertCircle,
    Check,
    Smartphone,
    User,
    ShieldCheck,
} from 'lucide-react';
import React, { useState } from 'react';
import Chart from 'react-apexcharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';

interface EmpleadoInfo {
    id: number;
    nombre_completo: string;
    cargo: string;
    porcentaje_comision: number;
    comision_aplica_a: string;
    porcentaje_comision_reparacion?: number;
    comision_reparacion_aplica_a?: string;
    foto?: string | null;
}

interface StatsSection {
    total_ventas?: number;
    total_reparaciones_monto?: number;
    total_ingresos?: number;
    total_operaciones?: number;
    cantidad_ventas?: number;
    cantidad_reparaciones?: number;
    ticket_promedio?: number;
    comisiones_generadas?: number;
    comisiones_totales?: number;
    comisiones_pendientes: number;
    comisiones_pagadas: number;
}

interface Stats {
    ventas: {
        total_ventas: number;
        cantidad_ventas: number;
        ticket_promedio: number;
        comisiones_generadas: number;
        comisiones_pendientes: number;
        comisiones_pagadas: number;
    };
    taller: {
        total_reparaciones_monto: number;
        cantidad_reparaciones: number;
        ticket_promedio: number;
        comisiones_generadas: number;
        comisiones_pendientes: number;
        comisiones_pagadas: number;
    };
    global: {
        total_ingresos: number;
        total_operaciones: number;
        comisiones_totales: number;
        comisiones_pendientes: number;
        comisiones_pagadas: number;
    };
    all_time: {
        total_ventas: number;
        total_reparaciones: number;
        total_ingresos: number;
        comisiones_totales: number;
        comisiones_pendientes: number;
        comisiones_pagadas: number;
    };
}

interface TopProduct {
    rank: number;
    nombre: string;
    total_qty: number;
    total_amount: number;
    percent_of_max: number;
}

interface RecentSale {
    id: number;
    codigo_ticket: string;
    cliente_nombre: string;
    metodo_pago: string;
    total: number;
    comision_porcentaje: number;
    comision_monto: number;
    comision_estado: string;
    created_at: string;
}

interface RecentRepair {
    id: number;
    numero_orden: string;
    cliente_nombre: string;
    equipo: string;
    total: number;
    comision_monto: number;
    comision_estado: string;
    estado_orden: string;
    created_at: string;
}

interface AssignedRepair {
    id: number;
    numero_orden: string;
    cliente_nombre: string;
    marca_nombre: string;
    modelo_nombre: string;
    imei_serie?: string;
    descripcion_falla: string;
    estado_orden: string;
    costo_estimado: number;
    costo_total: number;
    comision_monto: number;
    comision_estado: string;
    fecha_recepcion: string;
}

interface UnassignedRepair {
    id: number;
    numero_orden: string;
    cliente_nombre: string;
    marca_nombre: string;
    modelo_nombre: string;
    imei_serie?: string;
    descripcion_falla: string;
    estado_orden: string;
    fecha_recepcion: string;
}

interface Props {
    empleado: EmpleadoInfo | null;
    empleadosList: Array<{
        id: number;
        nombres: string;
        apellidos: string;
        cargo: string;
        porcentaje_comision: number;
        porcentaje_comision_reparacion?: number;
    }>;
    isAdmin: boolean;
    isTecnico: boolean;
    isVendedor: boolean;
    isHybrid: boolean;
    activeView?: string;
    stats: Stats;
    tallerCounts: {
        en_diagnostico: number;
        en_reparacion: number;
        esperando_repuesto: number;
        reparado_mes: number;
        total_asignados: number;
    };
    misEquiposPendientes: AssignedRepair[];
    sinAsignar: UnassignedRepair[];
    charts: {
        trend: {
            categories: string[];
            sales: number[];
            commissions_ventas: number[];
            commissions_taller: number[];
            commissions_totales: number[];
            orders: number[];
        };
        paymentMethods: {
            labels: string[];
            series: number[];
        };
        topProducts: {
            categories: string[];
            quantities: number[];
            amounts: number[];
            list: TopProduct[];
        };
    };
    recentSales: RecentSale[];
    recentRepairs: RecentRepair[];
    filters: {
        preset: string;
        start_date: string;
        end_date: string;
        empleado_id?: number;
        view?: string;
    };
    currencySymbol: string;
    currencyCode: string;
}

export default function VendedorDashboard({
    empleado,
    empleadosList = [],
    isAdmin = false,
    isTecnico = false,
    isVendedor = false,
    isHybrid = false,
    activeView = 'hibrido',
    stats,
    tallerCounts,
    misEquiposPendientes = [],
    sinAsignar = [],
    charts,
    recentSales = [],
    recentRepairs = [],
    filters,
    currencySymbol = '$',
    currencyCode = 'MXN',
}: Props) {
    const { __ } = useTranslate();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState(filters.preset || 'mes');
    const [customStart, setCustomStart] = useState(filters.start_date || '');
    const [customEnd, setCustomEnd] = useState(filters.end_date || '');
    const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<number | string>(filters.empleado_id || '');
    const [viewMode, setViewMode] = useState<'hibrido' | 'ventas' | 'taller'>(
        (filters.view as any) || (isHybrid || isAdmin ? 'hibrido' : (isTecnico ? 'taller' : 'ventas'))
    );

    const applyFilter = (preset: string, start?: string, end?: string, empId?: number | string, view?: string) => {
        setIsRefreshing(true);
        const params: Record<string, any> = {
            preset,
            view: view || viewMode,
        };

        if (preset === 'custom') {
            params.start_date = start || customStart;
            params.end_date = end || customEnd;
        }

        const employeeToUse = empId !== undefined ? empId : selectedEmpleadoId;
        if (employeeToUse) {
            params.empleado_id = employeeToUse;
        }

        router.get('/admin/vendedor/dashboard', params, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsRefreshing(false),
        });
    };

    const handlePresetChange = (preset: string) => {
        setSelectedPreset(preset);
        if (preset !== 'custom') {
            applyFilter(preset);
        }
    };

    const handleCustomFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter('custom', customStart, customEnd);
    };

    const handleEmpleadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedEmpleadoId(val);
        applyFilter(selectedPreset, customStart, customEnd, val);
    };

    const handleViewModeChange = (mode: 'hibrido' | 'ventas' | 'taller') => {
        setViewMode(mode);
        applyFilter(selectedPreset, customStart, customEnd, selectedEmpleadoId, mode);
    };

    // Formatter helpers
    const formatCurrency = (val: number) => {
        return `${currencySymbol}${Number(val || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const getRepairStatusBadge = (st: string) => {
        switch (st) {
            case 'recibido':
                return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 font-bold text-xs">🟡 1-RECIBIDO</Badge>;
            case 'en_diagnostico_presupuesto':
            case 'en_diagnostico':
                return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300 font-bold text-xs">🔍 2-EN DIAGNÓSTICO</Badge>;
            case 'confirmacion_presupuesto':
            case 'presupuestado':
                return <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-300 font-bold text-xs">⏳ 3-PRESUPUESTADO</Badge>;
            case 'espera_refaccion':
            case 'esperando_repuesto':
                return <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-300 font-bold text-xs">📦 4-ESPERA DE PIEZA</Badge>;
            case 'en_reparacion':
                return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300 font-bold text-xs">🛠️ 5-EN REPARACIÓN</Badge>;
            case 'listo_reparado':
            case 'reparado':
                return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 font-bold text-xs">🟢 6-LISTO REPARADO</Badge>;
            case 'listo_sin_solucion':
            case 'cancelado':
                return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 font-bold text-xs">❌ 7-SIN SOLUCIÓN</Badge>;
            case 'entregado_finalizado':
            case 'entregado':
                return <Badge className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs">✅ 8-ENTREGADO</Badge>;
            default:
                return <Badge variant="outline">{st?.replace(/_/g, ' ').toUpperCase()}</Badge>;
        }
    };

    // Chart 1: Dual Trend of Sales & Total Commissions (ApexCharts Area)
    const trendChartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'area',
            height: 330,
            toolbar: { show: false },
            zoom: { enabled: false },
            fontFamily: 'inherit',
            background: 'transparent',
        },
        colors: ['#4f46e5', '#10b981', '#a855f7'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [0, 95, 100],
            },
        },
        dataLabels: { enabled: false },
        stroke: {
            curve: 'smooth',
            width: [3, 2.5, 2],
        },
        xaxis: {
            categories: charts.trend.categories,
            labels: {
                style: {
                    colors: '#64748b',
                    fontSize: '11px',
                    fontWeight: 500,
                },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: [
            {
                title: {
                    text: `Ventas (${currencySymbol})`,
                    style: { color: '#4f46e5', fontSize: '11px', fontWeight: 600 },
                },
                labels: {
                    formatter: (val) => `${currencySymbol}${Number(val).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
                    style: { colors: '#64748b', fontSize: '11px' },
                },
            },
            {
                opposite: true,
                title: {
                    text: `Comisiones (${currencySymbol})`,
                    style: { color: '#10b981', fontSize: '11px', fontWeight: 600 },
                },
                labels: {
                    formatter: (val) => `${currencySymbol}${Number(val).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
                    style: { colors: '#64748b', fontSize: '11px' },
                },
            },
        ],
        tooltip: {
            shared: true,
            intersect: false,
            theme: 'dark',
            y: {
                formatter: (val) => formatCurrency(val),
            },
        },
        grid: {
            borderColor: '#33415520',
            strokeDashArray: 4,
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            labels: { colors: '#94a3b8' },
        },
    };

    const trendChartSeries = [
        {
            name: 'Ventas en Mostrador',
            data: charts.trend.sales,
        },
        {
            name: 'Comisiones Ventas POS',
            data: charts.trend.commissions_ventas,
        },
        {
            name: 'Comisiones Taller',
            data: charts.trend.commissions_taller,
        },
    ];

    // Chart 2: Payment Methods breakdown (ApexCharts Donut)
    const paymentChartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'donut',
            fontFamily: 'inherit',
            background: 'transparent',
        },
        labels: charts.paymentMethods.labels,
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'],
        dataLabels: { enabled: false },
        plotOptions: {
            pie: {
                donut: {
                    size: '72%',
                    labels: {
                        show: true,
                        name: { show: true, fontSize: '12px', fontWeight: 600, color: '#94a3b8' },
                        value: {
                            show: true,
                            fontSize: '18px',
                            fontWeight: 700,
                            formatter: (val) => formatCurrency(Number(val)),
                        },
                        total: {
                            show: true,
                            label: 'Total Métodos',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#94a3b8',
                            formatter: (w) => {
                                const sum = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                                return formatCurrency(sum);
                            },
                        },
                    },
                },
            },
        },
        legend: {
            position: 'bottom',
            horizontalAlign: 'center',
            labels: { colors: '#94a3b8' },
            fontSize: '11px',
        },
        tooltip: {
            theme: 'dark',
            y: { formatter: (val) => formatCurrency(val) },
        },
        stroke: { width: 0 },
    };

    const presets = [
        { id: 'hoy', label: 'Hoy' },
        { id: 'ayer', label: 'Ayer' },
        { id: 'semana', label: 'Esta Semana' },
        { id: 'mes', label: 'Este Mes' },
        { id: 'ultimos_30', label: 'Últimos 30 días' },
        { id: 'custom', label: 'Personalizado' },
    ];

    return (
        <>
            <Head title={`Panel Híbrido - ${empleado?.nombre_completo || 'Dashboard'}`} />

            <div className="space-y-6 pb-12">
                {/* HERO BANNER DE BIENVENIDA */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 md:p-8 text-white shadow-xl border border-indigo-900/40">
                    <div className="absolute -right-16 -top-16 size-72 rounded-full bg-indigo-500/10 blur-3xl" />
                    <div className="absolute right-32 -bottom-20 size-80 rounded-full bg-emerald-500/10 blur-3xl" />

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-400/30">
                                <Zap className="size-3.5 text-amber-400" />
                                <span>FixSale POS & Taller · Panel Híbrido Operativo</span>
                            </div>

                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                                <span>¡Hola, {empleado?.nombre_completo || 'Colaborador'}!</span>
                                <span className="text-xl">👋</span>
                            </h1>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                                <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 font-medium">
                                    Rol: <strong className="text-white">{isHybrid ? 'Técnico y Vendedor' : (empleado?.cargo || 'Colaborador')}</strong>
                                </span>
                                <span className="bg-emerald-950/60 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-700/40 font-medium">
                                    🛒 Com. Ventas: <strong className="text-emerald-200">{empleado?.porcentaje_comision || 0}%</strong>
                                </span>
                                <span className="bg-indigo-950/60 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-700/40 font-medium">
                                    🔧 Com. Taller: <strong className="text-indigo-200">{empleado?.porcentaje_comision_reparacion || 0}%</strong>
                                </span>
                            </div>
                        </div>

                        {/* ACCIONES RÁPIDAS */}
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <Link href="/admin/ventas/terminal" className="w-full sm:w-auto">
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-900/30 gap-2 h-11 px-5 rounded-xl border border-emerald-400/30"
                                >
                                    <ShoppingCart className="size-4" />
                                    <span>Terminal POS</span>
                                </Button>
                            </Link>

                            <Link href="/admin/reparaciones" className="w-full sm:w-auto">
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-900/30 gap-2 h-11 px-5 rounded-xl border border-purple-400/30"
                                >
                                    <Wrench className="size-4" />
                                    <span>Taller & Equipos</span>
                                </Button>
                            </Link>

                            <Link href="/admin/comisiones" className="w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold gap-2 h-11 px-4 rounded-xl backdrop-blur-md"
                                >
                                    <Wallet className="size-4 text-amber-400" />
                                    <span>Comisiones</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* SELECTOR DE VISTAS (OPCIÓN A - DASHBOARD HÍBRIDO) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2 bg-card border rounded-2xl shadow-xs">
                    <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-muted/60 rounded-xl">
                        <button
                            type="button"
                            onClick={() => handleViewModeChange('hibrido')}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap',
                                viewMode === 'hibrido'
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            )}
                        >
                            <Zap className="size-3.5 text-amber-300" />
                            <span>⚡ Resumen Híbrido</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleViewModeChange('ventas')}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap',
                                viewMode === 'ventas'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            )}
                        >
                            <ShoppingCart className="size-3.5 text-white" />
                            <span>🛒 Vista Ventas & POS</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleViewModeChange('taller')}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap',
                                viewMode === 'taller'
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            )}
                        >
                            <Wrench className="size-3.5 text-white" />
                            <span>🔧 Vista Taller & Reparaciones</span>
                            {tallerCounts.total_asignados > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 font-mono">
                                    {tallerCounts.total_asignados}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end md:self-auto px-2">
                        {isAdmin && empleadosList.length > 0 && (
                            <div className="flex items-center gap-2">
                                <UserCheck className="size-4 text-muted-foreground" />
                                <select
                                    value={selectedEmpleadoId}
                                    onChange={handleEmpleadoChange}
                                    className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-semibold text-foreground"
                                >
                                    <option value="">-- Empleado Seleccionado --</option>
                                    {empleadosList.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.nombres} {emp.apellidos} ({emp.cargo || 'Empleado'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => applyFilter(selectedPreset)}
                            disabled={isRefreshing}
                            className="gap-1 text-xs font-bold h-8"
                        >
                            <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
                            <span>Actualizar</span>
                        </Button>
                    </div>
                </div>

                {/* BARRA DE FILTROS TEMPORALES */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 border rounded-xl p-3 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-muted-foreground uppercase tracking-wider mr-1 flex items-center gap-1">
                            <Calendar className="size-3.5 text-primary" />
                            Periodo:
                        </span>
                        {presets.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => handlePresetChange(p.id)}
                                className={cn(
                                    'px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer',
                                    selectedPreset === p.id
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {selectedPreset === 'custom' && (
                        <form onSubmit={handleCustomFilterSubmit} className="flex items-center gap-2">
                            <Input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="h-8 text-xs w-36"
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="h-8 text-xs w-36"
                            />
                            <Button type="submit" size="sm" className="h-8 px-3 text-xs font-bold">
                                Filtrar
                            </Button>
                        </form>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/* 1. MODO: RESUMEN HÍBRIDO (VENTAS + REPARACIONES COMBINADAS)       */}
                {/* ══════════════════════════════════════════════════════════════════ */}
                {viewMode === 'hibrido' && (
                    <div className="space-y-6">
                        {/* 4 CARDS GLOBALES COMBINADAS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-card">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 shrink-0">
                                        <Zap className="size-6 text-amber-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-extrabold uppercase text-muted-foreground block truncate">
                                            {__('Ingresos Totales (POS + Taller)')}
                                        </span>
                                        <h3 className="text-2xl font-black font-mono text-foreground">
                                            {formatCurrency(stats.global.total_ingresos)}
                                        </h3>
                                        <span className="text-[11px] text-muted-foreground truncate block">
                                            🛒 {stats.ventas.cantidad_ventas} ventas • 🔧 {stats.taller.cantidad_reparaciones} órdenes
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-card">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
                                        <DollarSign className="size-6 text-emerald-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-extrabold uppercase text-muted-foreground block truncate">
                                            {__('Comisiones Devengadas')}
                                        </span>
                                        <h3 className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(stats.global.comisiones_totales)}
                                        </h3>
                                        <span className="text-[11px] text-muted-foreground truncate block">
                                            🛒 {formatCurrency(stats.ventas.comisiones_generadas)} • 🔧 {formatCurrency(stats.taller.comisiones_generadas)}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-amber-200 dark:border-amber-900/40 shadow-xs bg-amber-50/20 dark:bg-amber-950/10">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 shrink-0">
                                        <Clock className="size-6 text-amber-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-400 block truncate">
                                            {__('Comisiones Pendientes')}
                                        </span>
                                        <h3 className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                                            {formatCurrency(stats.global.comisiones_pendientes)}
                                        </h3>
                                        <span className="text-[11px] text-muted-foreground truncate block">
                                            {__('Listas para liquidar en caja')}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-purple-200 dark:border-purple-900/40 shadow-xs bg-purple-50/20 dark:bg-purple-950/10">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 shrink-0">
                                        <Wrench className="size-6 text-purple-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-extrabold uppercase text-purple-700 dark:text-purple-400 block truncate">
                                            {__('Equipos Activos Taller')}
                                        </span>
                                        <h3 className="text-2xl font-black font-mono text-purple-700 dark:text-purple-300">
                                            {tallerCounts.total_asignados}
                                        </h3>
                                        <span className="text-[11px] text-muted-foreground truncate block">
                                            {tallerCounts.en_diagnostico} diagnósticos • {tallerCounts.en_reparacion} en taller
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* GRÁFICA DE TENDENCIA DIARIA COMPARTIDA */}
                        <Card className="border shadow-xs">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <TrendingUp className="size-4 text-primary" />
                                        <span>{__('Tendencia Operativa: Ventas POS y Comisiones Devengadas')}</span>
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {__('Comportamiento diario de ingresos en mostrador y comisiones por ventas y reparaciones.')}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <Chart
                                    options={trendChartOptions}
                                    series={trendChartSeries}
                                    type="area"
                                    height={300}
                                />
                            </CardContent>
                        </Card>

                        {/* COLA DE EQUIPOS EN TALLER + COLA DE VENTAS RECIENTES */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* COLUMNA IZQUIERDA: EQUIPOS EN TALLER ASIGNADOS AL TÉCNICO */}
                            <Card className="border shadow-xs overflow-hidden">
                                <CardHeader className="p-4 border-b bg-muted/30 flex flex-row items-center justify-between">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                        <Wrench className="size-4 text-purple-600" />
                                        <span>{__('Mis Equipos Asignados en Taller')} ({misEquiposPendientes.length})</span>
                                    </CardTitle>
                                    <Link href="/admin/reparaciones">
                                        <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-purple-600">
                                            {__('Ver Taller')} <ArrowRight className="size-3.5 ml-1" />
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <div className="divide-y max-h-96 overflow-y-auto">
                                    {misEquiposPendientes.length === 0 ? (
                                        <div className="p-8 text-center text-xs text-muted-foreground italic">
                                            {__('No tienes órdenes técnicas en proceso actualmente.')}
                                        </div>
                                    ) : (
                                        misEquiposPendientes.map((o) => (
                                            <div key={o.id} className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors text-xs">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-purple-700 dark:text-purple-400">
                                                            {o.numero_orden}
                                                        </span>
                                                        {getRepairStatusBadge(o.estado_orden)}
                                                    </div>
                                                    <div className="font-semibold text-foreground">
                                                        {o.marca_nombre} {o.modelo_nombre}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                                                        {o.descripcion_falla}
                                                    </div>
                                                </div>

                                                <div className="text-right space-y-1">
                                                    <div className="font-bold text-indigo-600 dark:text-indigo-400">
                                                        +{formatCurrency(o.comision_monto)}
                                                    </div>
                                                    <Link href={`/admin/reparaciones/${o.id}`}>
                                                        <Button size="sm" className="h-7 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1">
                                                            <Eye className="size-3" />
                                                            {__('Trabajar')}
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>

                            {/* COLUMNA DERECHA: VENTAS RECIENTES EN MOSTRADOR */}
                            <Card className="border shadow-xs overflow-hidden">
                                <CardHeader className="p-4 border-b bg-muted/30 flex flex-row items-center justify-between">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                        <ShoppingCart className="size-4 text-emerald-600" />
                                        <span>{__('Últimas Ventas Realizadas (POS)')}</span>
                                    </CardTitle>
                                    <Link href="/admin/ventas">
                                        <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-emerald-600">
                                            {__('Ver Ventas')} <ArrowRight className="size-3.5 ml-1" />
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <div className="divide-y max-h-96 overflow-y-auto">
                                    {recentSales.length === 0 ? (
                                        <div className="p-8 text-center text-xs text-muted-foreground italic">
                                            {__('No hay ventas registradas recientemente.')}
                                        </div>
                                    ) : (
                                        recentSales.map((s) => (
                                            <div key={s.id} className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors text-xs">
                                                <div className="space-y-0.5">
                                                    <div className="font-mono font-bold text-foreground">
                                                        {s.codigo_ticket}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {s.cliente_nombre} • {s.created_at}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground uppercase">
                                                        {s.metodo_pago}
                                                    </div>
                                                </div>

                                                <div className="text-right space-y-0.5">
                                                    <div className="font-bold text-foreground">
                                                        {formatCurrency(s.total)}
                                                    </div>
                                                    <div className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                                                        +{formatCurrency(s.comision_monto)}
                                                    </div>
                                                    <Badge variant={s.comision_estado === 'pagada' ? 'default' : 'outline'} className="text-[10px] h-4">
                                                        {s.comision_estado === 'pagada' ? 'Pagada' : 'Pendiente'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/* 2. MODO: VISTA VENTAS & POS (EXCLUSIVO MOSTRADOR)                 */}
                {/* ══════════════════════════════════════════════════════════════════ */}
                {viewMode === 'ventas' && (
                    <div className="space-y-6">
                        {/* 4 CARDS DE VENTAS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="border shadow-xs bg-card">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
                                        <ShoppingCart className="size-6 text-emerald-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-extrabold uppercase text-muted-foreground block truncate">
                                            {__('Ventas en Mostrador')}
                                        </span>
                                        <h3 className="text-2xl font-black font-mono text-foreground">
                                            {formatCurrency(stats.ventas.total_ventas)}
                                        </h3>
                                        <span className="text-[11px] text-muted-foreground truncate block">
                                            {stats.ventas.cantidad_ventas} tickets completados
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-xs bg-card">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 shrink-0">
                                        <Receipt className="size-6 text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-extrabold uppercase text-muted-foreground block truncate">
                                            {__('Ticket Promedio')}
                                        </span>
                                        <h3 className="text-2xl font-black font-mono text-foreground">
                                            {formatCurrency(stats.ventas.ticket_promedio)}
                                        </h3>
                                        <span className="text-[11px] text-muted-foreground truncate block">
                                            Promedio por venta
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-xs bg-card">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 shrink-0">
                                        <Clock className="size-6 text-amber-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-extrabold uppercase text-muted-foreground block truncate">
                                            {__('Comisión Ventas Pendiente')}
                                        </span>
                                        <h3 className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                                            {formatCurrency(stats.ventas.comisiones_pendientes)}
                                        </h3>
                                        <span className="text-[11px] text-muted-foreground truncate block">
                                            Por liquidar en caja
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-xs bg-card">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
                                        <CheckCircle2 className="size-6 text-emerald-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-extrabold uppercase text-muted-foreground block truncate">
                                            {__('Comisión Ventas Pagada')}
                                        </span>
                                        <h3 className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(stats.ventas.comisiones_pagadas)}
                                        </h3>
                                        <span className="text-[11px] text-muted-foreground truncate block">
                                            Liquidadas con comprobante
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* MÉTODOS DE PAGO Y TOP PRODUCTOS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Métodos de Pago */}
                            <Card className="border shadow-xs">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Wallet className="size-4 text-primary" />
                                        <span>{__('Desglose por Método de Pago')}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    {charts.paymentMethods.series.length === 0 ? (
                                        <div className="p-10 text-center text-xs text-muted-foreground italic">
                                            {__('Sin datos de pago para el periodo seleccionado.')}
                                        </div>
                                    ) : (
                                        <Chart
                                            options={paymentChartOptions}
                                            series={charts.paymentMethods.series}
                                            type="donut"
                                            height={260}
                                        />
                                    )}
                                </CardContent>
                            </Card>

                            {/* Top 5 Productos */}
                            <Card className="border shadow-xs">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Package className="size-4 text-primary" />
                                        <span>{__('Top 5 Productos Más Vendidos')}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-2">
                                    {charts.topProducts.list.length === 0 ? (
                                        <div className="p-10 text-center text-xs text-muted-foreground italic">
                                            {__('No hay productos vendidos en este rango.')}
                                        </div>
                                    ) : (
                                        charts.topProducts.list.map((item) => (
                                            <div key={item.rank} className="space-y-1 text-xs">
                                                <div className="flex justify-between items-center font-semibold">
                                                    <span className="truncate max-w-[200px]">
                                                        #{item.rank} {item.nombre}
                                                    </span>
                                                    <span className="font-mono text-muted-foreground">
                                                        {item.total_qty} unids • {formatCurrency(item.total_amount)}
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-600 rounded-full transition-all"
                                                        style={{ width: `${item.percent_of_max}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/* 3. MODO: VISTA TALLER & REPARACIONES (EXCLUSIVO SERVICIO TÉCNICO)  */}
                {/* ══════════════════════════════════════════════════════════════════ */}
                {viewMode === 'taller' && (
                    <div className="space-y-6">
                        {/* 5 CARDS DE TALLER */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            <Card className="border shadow-xs bg-card">
                                <CardContent className="p-3.5 flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 shrink-0">
                                        <Wrench className="size-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">{__('En Reparación')}</span>
                                        <h3 className="text-xl font-black font-mono text-purple-700 dark:text-purple-300">{tallerCounts.en_reparacion}</h3>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-xs bg-card">
                                <CardContent className="p-3.5 flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 shrink-0">
                                        <Search className="size-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">{__('En Diagnóstico')}</span>
                                        <h3 className="text-xl font-black font-mono text-blue-700 dark:text-blue-300">{tallerCounts.en_diagnostico}</h3>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-xs bg-card">
                                <CardContent className="p-3.5 flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 shrink-0">
                                        <Package className="size-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">{__('Espera de Pieza')}</span>
                                        <h3 className="text-xl font-black font-mono text-orange-700 dark:text-orange-300">{tallerCounts.esperando_repuesto}</h3>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-xs bg-card">
                                <CardContent className="p-3.5 flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
                                        <CheckCircle2 className="size-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">{__('Listos este Mes')}</span>
                                        <h3 className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{tallerCounts.reparado_mes}</h3>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-xs bg-card col-span-2 sm:col-span-1">
                                <CardContent className="p-3.5 flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 shrink-0">
                                        <DollarSign className="size-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">{__('Comisión Taller')}</span>
                                        <h3 className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                                            {formatCurrency(stats.taller.comisiones_generadas)}
                                        </h3>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* MIS EQUIPOS ASIGNADOS EN TALLER COMPLETO */}
                        <Card className="border shadow-xs overflow-hidden">
                            <CardHeader className="p-4 border-b bg-muted/30 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Wrench className="size-4 text-purple-600" />
                                    <span>{__('Mis Equipos Asignados Activos')} ({misEquiposPendientes.length})</span>
                                </CardTitle>
                                <Link href="/admin/reparaciones">
                                    <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-purple-600">
                                        {__('Ver Catálogo de Reparaciones')} <ArrowRight className="size-3.5 ml-1" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground border-b">
                                        <tr>
                                            <th className="px-4 py-3">{__('Folio / Fecha')}</th>
                                            <th className="px-4 py-3">{__('Cliente')}</th>
                                            <th className="px-4 py-3">{__('Equipo / Modelo')}</th>
                                            <th className="px-4 py-3">{__('Falla Reportada')}</th>
                                            <th className="px-4 py-3 text-center">{__('Estado')}</th>
                                            <th className="px-4 py-3 text-right">{__('Comisión')}</th>
                                            <th className="px-4 py-3 text-center">{__('Acción')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {misEquiposPendientes.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground italic">
                                                    {__('No tienes órdenes pendientes asignadas actualmente en taller.')}
                                                </td>
                                            </tr>
                                        ) : (
                                            misEquiposPendientes.map((o) => (
                                                <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono font-bold text-purple-700 dark:text-purple-400 block">{o.numero_orden}</span>
                                                        <span className="text-[10px] text-muted-foreground">📅 {o.fecha_recepcion}</span>
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-foreground">
                                                        {o.cliente_nombre}
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-foreground">
                                                        {o.marca_nombre} {o.modelo_nombre}
                                                        {o.imei_serie && <span className="text-[10px] font-mono text-muted-foreground block font-normal">IMEI: {o.imei_serie}</span>}
                                                    </td>
                                                    <td className="px-4 py-3 max-w-xs text-muted-foreground truncate" title={o.descripcion_falla}>
                                                        {o.descripcion_falla}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {getRepairStatusBadge(o.estado_orden)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-black text-indigo-600 dark:text-indigo-400">
                                                        +{formatCurrency(o.comision_monto)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Link href={`/admin/reparaciones/${o.id}`}>
                                                            <Button size="sm" className="h-7 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1">
                                                                <Eye className="size-3" />
                                                                {__('Trabajar')}
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

                        {/* EQUIPOS SIN ASIGNAR EN TALLER */}
                        {sinAsignar.length > 0 && (
                            <Card className="border-amber-200 dark:border-amber-900 shadow-xs bg-amber-50/20 dark:bg-amber-950/10 overflow-hidden">
                                <CardHeader className="p-4 border-b border-amber-200 dark:border-amber-900/40 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-900 dark:text-amber-300">
                                        <AlertCircle className="size-4 text-amber-600" />
                                        <span>{__('Equipos Recién Ingresados Sin Técnico Asignado')} ({sinAsignar.length})</span>
                                    </CardTitle>
                                </CardHeader>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-amber-100/40 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 uppercase text-[10px] font-bold border-b border-amber-200">
                                            <tr>
                                                <th className="px-4 py-3">{__('Folio')}</th>
                                                <th className="px-4 py-3">{__('Cliente')}</th>
                                                <th className="px-4 py-3">{__('Equipo')}</th>
                                                <th className="px-4 py-3">{__('Falla')}</th>
                                                <th className="px-4 py-3 text-center">{__('Acción')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-amber-100 dark:divide-slate-800">
                                            {sinAsignar.map((o) => (
                                                <tr key={o.id} className="hover:bg-amber-100/20">
                                                    <td className="px-4 py-3 font-mono font-bold text-amber-900 dark:text-amber-200">{o.numero_orden}</td>
                                                    <td className="px-4 py-3 font-medium text-foreground">{o.cliente_nombre}</td>
                                                    <td className="px-4 py-3 font-bold text-foreground">{o.marca_nombre} {o.modelo_nombre}</td>
                                                    <td className="px-4 py-3 max-w-xs text-muted-foreground truncate">{o.descripcion_falla}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Link href={`/admin/reparaciones/${o.id}`}>
                                                            <Button size="sm" className="h-7 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1">
                                                                <Check className="size-3" />
                                                                {__('Tomar Orden')}
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
