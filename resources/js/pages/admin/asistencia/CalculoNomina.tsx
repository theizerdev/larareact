import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { 
    DollarSign, 
    Clock, 
    FileSpreadsheet, 
    RefreshCw, 
    Users, 
    TrendingUp, 
    Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Empleado {
    id: number;
    nombres: string;
    apellidos: string;
    documento_identidad: string;
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

export default function CalculoNominaIndex({ resumenesSemanales, stats, filters }: Props) {
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

                {/* Filtros Estándar */}
                <FilterBar title="Filtros del Período">
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label="Fecha Inicio">
                            <Input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                            />
                        </FilterField>

                        <FilterField label="Fecha Fin">
                            <Input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                            />
                        </FilterField>

                        <div className="flex items-center gap-2">
                            <FilterField label="Empleado">
                                <Select value={empleadoId} onValueChange={setEmpleadoId}>
                                    <SelectTrigger className="w-[200px]">
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

                            <Button onClick={handleFilter} variant="outline">
                                Filtrar Período
                            </Button>
                        </div>

                        <div className="text-xs text-muted-foreground self-center">
                            * Regla de Horas Extra: Primeras 9h extra al 100% (dobles); excedentes al 200% (triples).
                        </div>
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

                {/* Tabla de Resultados Estándar */}
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
                                        filteredResumenes.map((r: any) => {
                                            const totalH = (parseFloat(r.total_horas_ordinarias || 0) + parseFloat(r.total_horas_extra_dobles || 0) + parseFloat(r.total_horas_extra_triples || 0));
                                            let semaforoBadgeClass = "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40";
                                            let semaforoText = `Verde (${totalH.toFixed(1)}h)`;

                                            if (totalH > 60) {
                                                semaforoBadgeClass = "bg-rose-950 text-rose-100 border-rose-600 animate-pulse font-black";
                                                semaforoText = `🚨 ¡EXPLOTACIÓN! (${totalH.toFixed(1)}h)`;
                                            } else if (totalH > 48) {
                                                semaforoBadgeClass = "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 font-bold";
                                                semaforoText = `Rojo (${totalH.toFixed(1)}h)`;
                                            } else if (totalH > 40) {
                                                semaforoBadgeClass = "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40";
                                                semaforoText = `Amarillo (${totalH.toFixed(1)}h)`;
                                            }

                                            return (
                                                <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold">{r.empleado.nombres} {r.empleado.apellidos}</div>
                                                        <div className="text-xs text-muted-foreground">Doc: {r.empleado.documento_identidad} • {r.empleado.departamento?.nombre || 'General'}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium">{r.empleado.turnoLaboral?.nombre || 'Estándar'}</div>
                                                        <Badge variant="secondary" className="text-[10px] capitalize">
                                                            Jornada {r.empleado.turnoLaboral?.tipo_jornada || 'diurna'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Badge className={`text-xs px-2.5 py-1 border ${semaforoBadgeClass}`}>
                                                            {r.semaforo?.label || semaforoText}
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
            </div>
        </>
    );
}
