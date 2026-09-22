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
import { useTranslate } from '@/hooks/use-translate';

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
    const { __, currentLocale } = useTranslate();
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
        return new Intl.NumberFormat(currentLocale === 'ar' ? 'ar-u-nu-latn' : 'es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/dashboard' },
        { title: __('Cálculo de Nómina'), href: '/admin/asistencia/calculo-nomina' },
    ];

    return (
        <>
            <Head title={__('Pre-Nómina y Horas Extra')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Encabezado Estándar del Sistema */}
                <ModuleHeader
                    icon={<FileSpreadsheet className="h-6 w-6 text-white" />}
                    title={__('Pre-Nómina y Horas Extra')}
                    description={__('Consolidación de horas ordinarias, extras dobles, extras triples, prima dominical y días festivos.')}
                    colorClassName="bg-emerald-600"
                >
                    <Button onClick={handleProcesar} className="gap-2">
                        <RefreshCw className="h-4 w-4 rtl:rotate-180" />
                        {__('Procesar Horas del Período')}
                    </Button>
                </ModuleHeader>

                {/* Filtros Estándar */}
                <FilterBar title={__('Filtros del Período')}>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Fecha Inicio')}>
                            <Input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                            />
                        </FilterField>

                        <FilterField label={__('Fecha Fin')}>
                            <Input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                            />
                        </FilterField>

                        <div className="flex items-center gap-2">
                            <FilterField label={__('Empleado')}>
                                <Select value={empleadoId} onValueChange={setEmpleadoId}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder={__('Todos los empleados')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">{__('Todos los empleados')}</SelectItem>
                                        {empleados.map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id.toString()}>
                                                {emp.nombres} {emp.apellidos}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FilterField>

                            <Button onClick={handleFilter} variant="outline">
                                {__('Filtrar Período')}
                            </Button>
                        </div>

                        <div className="text-xs text-muted-foreground self-center">
                            {__('* Regla de Horas Extra: Primeras 9h extra al 100% (dobles); excedentes al 200% (triples).')}
                        </div>
                    </div>
                </FilterBar>

                {/* Tarjetas Estadísticas Estándar */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard
                        icon={<Users className="h-6 w-6" />}
                        title={__('EMPLEADOS')}
                        value={stats.total_empleados}
                        colorClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    />
                    <StatCard
                        icon={<Clock className="h-6 w-6" />}
                        title={__('HORAS ORDINARIAS')}
                        value={`${parseFloat(stats.total_horas_ordinarias.toString()).toFixed(1)} h`}
                        colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    />
                    <StatCard
                        icon={<TrendingUp className="h-6 w-6" />}
                        title={__('EXTRA DOBLES (+100%)')}
                        value={`${parseFloat(stats.total_horas_dobles.toString()).toFixed(1)} h`}
                        colorClassName="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                    />
                    <StatCard
                        icon={<Sparkles className="h-6 w-6" />}
                        title={__('EXTRA TRIPLES (+200%)')}
                        value={`${parseFloat(stats.total_horas_triples.toString()).toFixed(1)} h`}
                        colorClassName="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                    />
                    <StatCard
                        icon={<DollarSign className="h-6 w-6" />}
                        title={__('NÓMINA ESTIMADA')}
                        value={formatCurrency(stats.monto_total_nomina)}
                        colorClassName="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
                    />
                </div>

                {/* Tabla de Resultados Estándar */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-base font-semibold">
                            {__('Desglose de Asistencia y Remuneraciones por Empleado')}
                        </CardTitle>
                        <Badge variant="outline">
                            <span dir="ltr">{filteredResumenes.length}</span> {__('Registros')}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-y">
                                    <tr>
                                        <th className="px-4 py-3 text-left rtl:text-right">{__('Empleado')}</th>
                                        <th className="px-4 py-3 text-left rtl:text-right">{__('Turno / Jornada')}</th>
                                        <th className="px-4 py-3 text-center">{__('Semáforo Semanal')}</th>
                                        <th className="px-4 py-3 text-right rtl:text-left">{__('Salario Diario')}</th>
                                        <th className="px-4 py-3 text-center">{__('Hrs. Ordinarias')}</th>
                                        <th className="px-4 py-3 text-center">{__('HE Dobles (+100%)')}</th>
                                        <th className="px-4 py-3 text-center">{__('HE Triples (+200%)')}</th>
                                        <th className="px-4 py-3 text-center">{__('Prima Dom. (25%)')}</th>
                                        <th className="px-4 py-3 text-center">{__('Festivos (+200%)')}</th>
                                        <th className="px-4 py-3 text-right rtl:text-left">{__('Total a Pagar')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredResumenes.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                                                {__('No hay datos procesados para el período seleccionado. Haz clic en "Procesar Horas del Período" para ejecutar el cálculo.')}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredResumenes.map((r: any) => {
                                            const totalH = (parseFloat(r.total_horas_ordinarias || 0) + parseFloat(r.total_horas_extra_dobles || 0) + parseFloat(r.total_horas_extra_triples || 0));
                                            let semaforoBadgeClass = "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40";
                                            let semaforoText = `${__('Verde')} (${totalH.toFixed(1)}h)`;

                                            if (totalH > 60) {
                                                semaforoBadgeClass = "bg-rose-950 text-rose-100 border-rose-600 animate-pulse font-black";
                                                semaforoText = `🚨 ${__('¡EXPLOTACIÓN!')} (${totalH.toFixed(1)}h)`;
                                            } else if (totalH > 48) {
                                                semaforoBadgeClass = "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 font-bold";
                                                semaforoText = `${__('Rojo')} (${totalH.toFixed(1)}h)`;
                                            } else if (totalH > 40) {
                                                semaforoBadgeClass = "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40";
                                                semaforoText = `${__('Amarillo')} (${totalH.toFixed(1)}h)`;
                                            }

                                            return (
                                                <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                                                    <td className="px-4 py-3 text-left rtl:text-right">
                                                        <div className="font-semibold">{r.empleado.nombres} {r.empleado.apellidos}</div>
                                                        <div className="text-xs text-muted-foreground">{__('Doc:')} <span dir="ltr">{r.empleado.documento_identidad}</span> • {r.empleado.departamento?.nombre || __('General')}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-left rtl:text-right">
                                                        <div className="font-medium">{r.empleado.turnoLaboral?.nombre || __('Estándar')}</div>
                                                        <Badge variant="secondary" className="text-[10px] capitalize">
                                                            {__('Jornada')} {__(r.empleado.turnoLaboral?.tipo_jornada || 'diurna')}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Badge className={`text-xs px-2.5 py-1 border ${semaforoBadgeClass}`}>
                                                            {r.semaforo?.label ? __(r.semaforo.label) : semaforoText}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-right rtl:text-left font-mono font-medium">
                                                        <span dir="ltr">{formatCurrency(r.empleado.salario_diario || 0)}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-mono font-medium">
                                                        <span dir="ltr">{r.total_horas_ordinarias} h</span>
                                                        <div className="text-[11px] text-muted-foreground"><span dir="ltr">{formatCurrency(r.monto_horas_ordinarias)}</span></div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-mono font-medium text-amber-600 dark:text-amber-400">
                                                        <span dir="ltr">{r.total_horas_extra_dobles} h</span>
                                                        <div className="text-[11px] opacity-80"><span dir="ltr">{formatCurrency(r.monto_horas_dobles)}</span></div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-mono font-medium text-rose-600 dark:text-rose-400">
                                                        <span dir="ltr">{r.total_horas_extra_triples} h</span>
                                                        <div className="text-[11px] opacity-80"><span dir="ltr">{formatCurrency(r.monto_horas_triples)}</span></div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-mono">
                                                        <span className="font-medium"><span dir="ltr">{r.primas_dominicales_aplicadas}</span> {__('días')}</span>
                                                        <div className="text-[11px] text-muted-foreground"><span dir="ltr">{formatCurrency(r.monto_primas_dominicales)}</span></div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-mono">
                                                        <span className="font-medium text-emerald-600 dark:text-emerald-400"><span dir="ltr">{r.dias_festivos_trabajados}</span> {__('días')}</span>
                                                        <div className="text-[11px] opacity-80"><span dir="ltr">{formatCurrency(r.monto_festivos)}</span></div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                                                        <span dir="ltr">{formatCurrency(r.monto_total_pagar)}</span>
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
