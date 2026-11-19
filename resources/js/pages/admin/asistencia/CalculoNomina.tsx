import { Head, router } from '@inertiajs/react';
import {
    DollarSign,
    Clock,
    FileSpreadsheet,
    RefreshCw,
    Users,
    TrendingUp,
    Sparkles,
    Briefcase,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { EntityAvatar } from '@/components/entity-avatar';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GridEmptyState, ViewModeToggle, useViewMode } from '@/components/view-mode-toggle';
import { cn } from '@/lib/utils';

interface Empleado {
    id: number;
    nombres: string;
    apellidos: string;
    documento_identidad: string;
    foto_empleado?: string | null;
    salario_diario: string | null;
    departamento?: { nombre: string };
    cargo?: { nombre: string };
    turnoLaboral?: { nombre: string; tipo_jornada: string };
}

interface ResumenSemanal {
    id: number;
    empleado_id: number;
    periodo_inicio: string;
    periodo_fin: string;
    total_horas_ordinarias: string;
    total_horas_extra_dobles: string;
    total_horas_extra_triples: string;
    dias_festivos_trabajados: number;
    primas_dominicales_aplicadas: number;
    monto_horas_ordinarias: string;
    monto_horas_dobles: string;
    monto_horas_triples: string;
    monto_primas_dominicales: string;
    monto_festivos: string;
    monto_total_pagar: string;
    empleado: Empleado;
    semaforo?: { color: string; label: string };
}

interface Props {
    resumenesSemanales: ResumenSemanal[];
    stats: {
        total_empleados: number;
        total_horas_ordinarias: number;
        total_horas_dobles: number;
        total_horas_triples: number;
        monto_total_nomina: number;
    };
    filters: {
        fecha_inicio: string;
        fecha_fin: string;
    };
}

function getSemaforoInfo(r: ResumenSemanal) {
    const totalH =
        parseFloat(r.total_horas_ordinarias || '0') +
        parseFloat(r.total_horas_extra_dobles || '0') +
        parseFloat(r.total_horas_extra_triples || '0');

    let badgeClass = 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40';
    let labelText = `Verde (${totalH.toFixed(1)}h)`;
    let avatarStatus: 'active' | 'warning' | 'danger' = 'active';
    let stripClass = 'from-emerald-500 via-teal-500 to-green-500';

    if (totalH > 60) {
        badgeClass = 'bg-rose-950 text-rose-100 border-rose-600 animate-pulse font-black';
        labelText = `🚨 ¡EXPLOTACIÓN! (${totalH.toFixed(1)}h)`;
        avatarStatus = 'danger';
        stripClass = 'from-rose-600 to-red-700';
    } else if (totalH > 48) {
        badgeClass = 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 font-bold';
        labelText = `Rojo (${totalH.toFixed(1)}h)`;
        avatarStatus = 'danger';
        stripClass = 'from-rose-500 to-red-600';
    } else if (totalH > 40) {
        badgeClass = 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40';
        labelText = `Amarillo (${totalH.toFixed(1)}h)`;
        avatarStatus = 'warning';
        stripClass = 'from-amber-500 to-orange-500';
    }

    return { totalH, badgeClass, labelText: r.semaforo?.label || labelText, avatarStatus, stripClass };
}

export default function CalculoNominaIndex({ resumenesSemanales, stats, filters }: Props) {
    const [viewMode, setViewMode] = useViewMode('smurfit_calculo_nomina_view_mode', 'grid');
    const [fechaInicio, setFechaInicio] = useState(filters.fecha_inicio);
    const [fechaFin, setFechaFin] = useState(filters.fecha_fin);
    const [empleadoId, setEmpleadoId] = useState('todos');

    const empleados = Array.from(
        new Map(resumenesSemanales.map(r => [r.empleado.id, r.empleado])).values()
    );

    const filteredResumenes = resumenesSemanales.filter(r => {
        if (empleadoId !== 'todos' && r.empleado_id.toString() !== empleadoId) {
            return false;
        }

        return true;
    });

    const handleFilter = () => {
        router.get('/admin/asistencia/calculo-nomina', {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
        }, { preserveState: true });
    };

    const handleProcesar = () => {
        router.get('/admin/asistencia/calculo-nomina', {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            procesar: true,
        }, { preserveState: true });
    };

    const formatCurrency = (amount: number | string) => {
        const val = typeof amount === 'string' ? parseFloat(amount) : amount;

        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Cálculo de Nómina', href: '/admin/asistencia/calculo-nomina' },
    ];

    return (
        <>
            <Head title="Pre-Nómina y Horas Extra" />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Encabezado Estándar del Sistema */}
                <ModuleHeader
                    icon={<FileSpreadsheet className="h-6 w-6 text-white" />}
                    title="Pre-Nómina y Horas Extra"
                    description="Consolidación de horas ordinarias, extras dobles, extras triples, prima dominical y días festivos."
                    colorClassName="bg-emerald-600"
                >
                    <Button onClick={handleProcesar} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Procesar Horas del Período
                    </Button>
                </ModuleHeader>

                {/* Filtros Estándar + Conmutador Cuadrícula / Lista */}
                <FilterBar className="rounded-2xl">
                    <div className="flex flex-1 flex-wrap items-end gap-4">
                        <FilterField label="Fecha Inicio">
                            <Input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                className="rounded-xl"
                            />
                        </FilterField>

                        <FilterField label="Fecha Fin">
                            <Input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                className="rounded-xl"
                            />
                        </FilterField>

                        <div className="flex flex-wrap items-end gap-2">
                            <FilterField label="Empleado">
                                <Select value={empleadoId} onValueChange={setEmpleadoId}>
                                    <SelectTrigger className="w-[210px] rounded-xl">
                                        <SelectValue placeholder="Todos los empleados" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos los empleados</SelectItem>
                                        {empleados.map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id.toString()}>
                                                {emp.nombres} {emp.apellidos}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FilterField>

                            <Button onClick={handleFilter} variant="outline" className="rounded-xl">
                                Filtrar Período
                            </Button>
                        </div>

                        <div className="text-xs text-muted-foreground self-center">
                            * Regla de Horas Extra: Primeras 9h extra al 100% (dobles); excedentes al 200% (triples).
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end">
                        <ViewModeToggle
                            value={viewMode}
                            onChange={setViewMode}
                            activeColorClassName="text-emerald-600 dark:text-emerald-400"
                        />
                    </div>
                </FilterBar>

                {/* Tarjetas Estadísticas Estándar */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard
                        icon={<Users className="h-6 w-6" />}
                        title="EMPLEADOS"
                        value={stats.total_empleados}
                        colorClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    />
                    <StatCard
                        icon={<Clock className="h-6 w-6" />}
                        title="HORAS ORDINARIAS"
                        value={`${parseFloat(stats.total_horas_ordinarias.toString()).toFixed(1)} h`}
                        colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    />
                    <StatCard
                        icon={<TrendingUp className="h-6 w-6" />}
                        title="EXTRA DOBLES (+100%)"
                        value={`${parseFloat(stats.total_horas_dobles.toString()).toFixed(1)} h`}
                        colorClassName="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                    />
                    <StatCard
                        icon={<Sparkles className="h-6 w-6" />}
                        title="EXTRA TRIPLES (+200%)"
                        value={`${parseFloat(stats.total_horas_triples.toString()).toFixed(1)} h`}
                        colorClassName="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                    />
                    <StatCard
                        icon={<DollarSign className="h-6 w-6" />}
                        title="NÓMINA ESTIMADA"
                        value={formatCurrency(stats.monto_total_nomina)}
                        colorClassName="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
                    />
                </div>

                {/* Resultados: Cuadrícula o Lista */}
                {viewMode === 'grid' ? (
                    <div className="space-y-4">
                        {filteredResumenes.length === 0 ? (
                            <GridEmptyState
                                icon={<FileSpreadsheet className="h-6 w-6" />}
                                title="Sin registros de pre-nómina"
                                description='No hay datos procesados para el período seleccionado. Haz clic en "Procesar Horas del Período" para ejecutar el cálculo.'
                                hasActiveFilters={empleadoId !== 'todos'}
                                onResetFilters={() => setEmpleadoId('todos')}
                                ctaLabel="Procesar Horas del Período"
                                onCtaClick={handleProcesar}
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {filteredResumenes.map((r) => {
                                    const fullName = `${r.empleado.nombres} ${r.empleado.apellidos}`.trim();
                                    const sem = getSemaforoInfo(r);

                                    return (
                                        <div
                                            key={r.id}
                                            className="group relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card text-card-foreground shadow-xs hover:shadow-md hover:border-emerald-200/80 dark:hover:border-emerald-800/60 transition-all overflow-hidden flex flex-col justify-between"
                                        >
                                            <div className={cn('h-1.5 w-full bg-gradient-to-r', sem.stripClass)} />

                                            <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                                                <div className="space-y-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-start gap-3.5 min-w-0">
                                                            <EntityAvatar
                                                                name={fullName}
                                                                firstName={r.empleado.nombres}
                                                                lastName={r.empleado.apellidos}
                                                                seed={r.empleado.documento_identidad || fullName}
                                                                src={r.empleado.foto_empleado}
                                                                status={sem.avatarStatus}
                                                                size="lg"
                                                                shape="circle"
                                                            />
                                                            <div className="min-w-0">
                                                                <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                                                                    {fullName}
                                                                </h3>
                                                                <p className="text-xs font-mono text-muted-foreground truncate">
                                                                    Doc: {r.empleado.documento_identidad}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {r.empleado.departamento?.nombre || 'General'}
                                                                    {r.empleado.cargo?.nombre ? ` • ${r.empleado.cargo.nombre}` : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <Badge className={cn('text-[11px] px-2.5 py-0.5 border rounded-full', sem.badgeClass)}>
                                                            {sem.labelText}
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-[11px] rounded-full capitalize gap-1">
                                                            <Briefcase className="h-3 w-3 text-indigo-500" />
                                                            {r.empleado.turnoLaboral?.nombre || 'Estándar'} ({r.empleado.turnoLaboral?.tipo_jornada || 'diurna'})
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 p-3 text-xs">
                                                        <div>
                                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Salario Diario</span>
                                                            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                                                {formatCurrency(r.empleado.salario_diario || 0)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Hrs. Ordinarias</span>
                                                            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                                                {r.total_horas_ordinarias} h{' '}
                                                                <span className="text-[11px] font-normal text-muted-foreground">
                                                                    ({formatCurrency(r.monto_horas_ordinarias)})
                                                                </span>
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">HE Dobles (+100%)</span>
                                                            <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                                                                {r.total_horas_extra_dobles} h{' '}
                                                                <span className="text-[11px] font-normal opacity-80">
                                                                    ({formatCurrency(r.monto_horas_dobles)})
                                                                </span>
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">HE Triples (+200%)</span>
                                                            <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                                                                {r.total_horas_extra_triples} h{' '}
                                                                <span className="text-[11px] font-normal opacity-80">
                                                                    ({formatCurrency(r.monto_horas_triples)})
                                                                </span>
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Prima Dom.</span>
                                                            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                                                                {r.primas_dominicales_aplicadas} d ({formatCurrency(r.monto_primas_dominicales)})
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Festivos (+200%)</span>
                                                            <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                                                                {r.dias_festivos_trabajados} d ({formatCurrency(r.monto_festivos)})
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                                                    <span className="text-xs font-medium text-muted-foreground">Total a Pagar</span>
                                                    <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(r.monto_total_pagar)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <CardTitle className="text-base font-semibold">
                                Desglose de Asistencia y Remuneraciones por Empleado
                            </CardTitle>
                            <Badge variant="outline">
                                {filteredResumenes.length} Registros
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-y">
                                        <tr>
                                            <th className="px-4 py-3">Empleado</th>
                                            <th className="px-4 py-3">Turno / Jornada</th>
                                            <th className="px-4 py-3 text-center">Semáforo Semanal</th>
                                            <th className="px-4 py-3 text-right">Salario Diario</th>
                                            <th className="px-4 py-3 text-center">Hrs. Ordinarias</th>
                                            <th className="px-4 py-3 text-center">HE Dobles (+100%)</th>
                                            <th className="px-4 py-3 text-center">HE Triples (+200%)</th>
                                            <th className="px-4 py-3 text-center">Prima Dom. (25%)</th>
                                            <th className="px-4 py-3 text-center">Festivos (+200%)</th>
                                            <th className="px-4 py-3 text-right">Total a Pagar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredResumenes.length === 0 ? (
                                            <tr>
                                                <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                                                    No hay datos procesados para el período seleccionado. Haz clic en "Procesar Horas del Período" para ejecutar el cálculo.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredResumenes.map((r) => {
                                                const sem = getSemaforoInfo(r);

                                                return (
                                                    <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <EntityAvatar
                                                                    name={`${r.empleado.nombres} ${r.empleado.apellidos}`}
                                                                    firstName={r.empleado.nombres}
                                                                    lastName={r.empleado.apellidos}
                                                                    seed={r.empleado.documento_identidad}
                                                                    src={r.empleado.foto_empleado}
                                                                    status={sem.avatarStatus}
                                                                    size="sm"
                                                                    shape="circle"
                                                                />
                                                                <div>
                                                                    <div className="font-semibold">{r.empleado.nombres} {r.empleado.apellidos}</div>
                                                                    <div className="text-xs text-muted-foreground">Doc: {r.empleado.documento_identidad} • {r.empleado.departamento?.nombre || 'General'}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium">{r.empleado.turnoLaboral?.nombre || 'Estándar'}</div>
                                                            <Badge variant="secondary" className="text-[10px] capitalize">
                                                                Jornada {r.empleado.turnoLaboral?.tipo_jornada || 'diurna'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Badge className={`text-xs px-2.5 py-1 border ${sem.badgeClass}`}>
                                                                {sem.labelText}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-medium">
                                                            {formatCurrency(r.empleado.salario_diario || 0)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-mono font-medium">
                                                            {r.total_horas_ordinarias} h
                                                            <div className="text-[11px] text-muted-foreground">{formatCurrency(r.monto_horas_ordinarias)}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-mono font-medium text-amber-600 dark:text-amber-400">
                                                            {r.total_horas_extra_dobles} h
                                                            <div className="text-[11px] opacity-80">{formatCurrency(r.monto_horas_dobles)}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-mono font-medium text-rose-600 dark:text-rose-400">
                                                            {r.total_horas_extra_triples} h
                                                            <div className="text-[11px] opacity-80">{formatCurrency(r.monto_horas_triples)}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-mono">
                                                            <span className="font-medium">{r.primas_dominicales_aplicadas} días</span>
                                                            <div className="text-[11px] text-muted-foreground">{formatCurrency(r.monto_primas_dominicales)}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-mono">
                                                            <span className="font-medium text-emerald-600 dark:text-emerald-400">{r.dias_festivos_trabajados} días</span>
                                                            <div className="text-[11px] opacity-80">{formatCurrency(r.monto_festivos)}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                                                            {formatCurrency(r.monto_total_pagar)}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
