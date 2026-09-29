import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { ModuleHeader } from '@/components/module-header';
import { SelectorEmpresaNomina } from '@/components/nomina/selector-empresa-nomina';
import type { EmpresaElegible } from '@/components/nomina/selector-empresa-nomina';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertTriangle,
    CalendarClock,
    Download,
    FileSpreadsheet,
    Fingerprint,
    Link2,
    Lock,
    LockKeyhole,
    RefreshCw,
    Search,
    Users,
    UserX,
} from 'lucide-react';

interface ColumnaPrevia {
    mnemonico: string;
    descripcion: string;
    unidad: 'dias' | 'horas';
}

interface RenglonPrevio {
    empleado_id: number;
    codigo_empleado: string;
    nombre_empleado: string;
    valores: Record<string, number>;
}

interface OmitidoPrevio {
    empleado_id: number;
    nombre_empleado: string;
    motivo: string;
}

interface Previsualizacion {
    columnas?: ColumnaPrevia[];
    renglones?: RenglonPrevio[];
    omitidos?: OmitidoPrevio[];
    error?: string;
}

interface Exportacion {
    id: number;
    periodo_inicio: string;
    periodo_fin: string;
    numero_periodo: number | null;
    estado: 'generando' | 'generada' | 'descargada' | 'cerrada' | 'error';
    nombre_archivo: string | null;
    empleados_exportados: number;
    empleados_omitidos: number;
    columnas: string[] | null;
    mensaje_error: string | null;
    generada_at: string | null;
    generada_por?: { id: number; name: string } | null;
    cerrada_at: string | null;
    cerrada_por?: { id: number; name: string } | null;
}

interface PeriodoCerrado {
    id: number;
    periodo_inicio: string;
    periodo_fin: string;
    nombre_archivo: string | null;
    cerrada_at: string | null;
}

interface Configuracion {
    periodicidad: 'semanal' | 'quincenal';
    dia_inicio_semana: number;
}

interface TipoIncidencia {
    id: number;
    mnemonico: string;
    descripcion: string;
    unidad: 'dias' | 'horas';
    tipo_imss: string | null;
    es_derivada: boolean;
    activo: boolean;
}

interface RelojChecador {
    conectado: boolean;
    alimenta_nomina: boolean;
    ultima_sincronizacion: string | null;
    checadas_periodo: number;
    checadas_sin_vincular: number;
    codigos_sin_vincular: number;
    dias_por_importar: number;
    empleados_sin_checadas_total: number;
    empleados_sin_checadas: { id: number; nombre: string; vinculado_reloj: boolean }[];
}

interface Props {
    empresa: { id: number; razon_social: string };
    empresasElegibles: EmpresaElegible[];
    periodo: { desde: string; hasta: string };
    previsualizacion: Previsualizacion | null;
    exportaciones: Exportacion[];
    empleadosSinMapeo: number;
    incidenciasPendientes: number;
    relojChecador: RelojChecador | null;
    periodoCerrado: PeriodoCerrado | null;
    configuracion: Configuracion;
    catalogo: TipoIncidencia[];
    puedeExportar: boolean;
    puedeConfigurar: boolean;
    layoutConfirmado: boolean;
}

const ESTADO_BADGE: Record<Exportacion['estado'], string> = {
    generando: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    generada: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    descargada: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    cerrada: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
    error: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
};

const DIAS_SEMANA: { valor: number; nombre: string }[] = [
    { valor: 1, nombre: 'Lunes' },
    { valor: 2, nombre: 'Martes' },
    { valor: 3, nombre: 'Miércoles' },
    { valor: 4, nombre: 'Jueves' },
    { valor: 5, nombre: 'Viernes' },
    { valor: 6, nombre: 'Sábado' },
    { valor: 7, nombre: 'Domingo' },
];

export default function PrenominaContpaqi({
    empresa,
    empresasElegibles,
    periodo,
    previsualizacion,
    exportaciones,
    empleadosSinMapeo,
    incidenciasPendientes,
    relojChecador,
    periodoCerrado,
    configuracion,
    catalogo,
    puedeExportar,
    puedeConfigurar,
    layoutConfirmado,
}: Props) {
    const [desde, setDesde] = useState(periodo.desde);
    const [hasta, setHasta] = useState(periodo.hasta);
    const [sincronizando, setSincronizando] = useState(false);

    // Se sincroniza el período ya previsualizado, no lo que haya en los
    // inputs: el diagnóstico de la tarjeta corresponde a ese período.
    const sincronizarReloj = () => {
        router.post(
            '/admin/nomina/contpaqi/sincronizar-reloj',
            { desde: periodo.desde, hasta: periodo.hasta },
            {
                preserveScroll: true,
                onStart: () => setSincronizando(true),
                onFinish: () => setSincronizando(false),
            },
        );
    };

    const generarForm = useForm({
        desde: periodo.desde,
        hasta: periodo.hasta,
        numero_periodo: '',
        confirmar_pendientes: false,
    });

    const configForm = useForm({
        periodicidad: configuracion.periodicidad,
        dia_inicio_semana: String(configuracion.dia_inicio_semana),
    });

    const renglones = previsualizacion?.renglones ?? [];
    const omitidos = previsualizacion?.omitidos ?? [];
    const columnas = previsualizacion?.columnas ?? [];

    // Con el período cerrado el botón se apaga en vez de dejar que el
    // servidor rebote: la razón se explica en la tarjeta de arriba.
    const generarBloqueado = periodoCerrado !== null;

    const previsualizar = () => {
        router.get('/admin/nomina/contpaqi', { desde, hasta }, { preserveState: true, preserveScroll: true });
    };

    const generar = (confirmarPendientes = false) => {
        generarForm.transform((data) => ({ ...data, desde, hasta, confirmar_pendientes: confirmarPendientes }));
        generarForm.post('/admin/nomina/contpaqi/generar', { preserveScroll: true });
    };

    const cerrar = (e: Exportacion) => {
        const ok = window.confirm(
            `¿Cerrar el período del ${e.periodo_inicio} al ${e.periodo_fin}?\n\n` +
                'Confirma que este archivo es el que se importó en CONTPAQi y con el que se pagó. ' +
                'Ya no se podrán generar más archivos para esas fechas.',
        );
        if (!ok) return;
        router.patch(`/admin/nomina/contpaqi/${e.id}/cerrar`, {}, { preserveScroll: true });
    };

    const guardarConfiguracion = () => {
        configForm.put('/admin/nomina/contpaqi/configuracion', { preserveScroll: true });
    };

    // Agrupa los omitidos por motivo: "12 sin código de empleado" es
    // accionable, doce renglones sueltos no.
    const omitidosPorMotivo = omitidos.reduce<Record<string, number>>((acc, o) => {
        acc[o.motivo] = (acc[o.motivo] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <>
            <Head title="Prenómina CONTPAQi" />

            <div className="space-y-6 p-4 sm:p-6">
                <ModuleHeader
                    icon={<FileSpreadsheet className="h-6 w-6" />}
                    title="Prenómina para CONTPAQi Nóminas"
                    description={`${empresa.razon_social} · el archivo se importa con "Capturar movimientos desde Excel"`}
                    colorClassName="bg-teal-600"
                >
                    <SelectorEmpresaNomina empresaId={empresa.id} empresas={empresasElegibles} />
                    <Button variant="secondary" onClick={() => router.get('/admin/nomina/contpaqi/mapeos')}>
                        <Link2 className="mr-2 h-4 w-4" />
                        Mapeo de códigos
                    </Button>
                </ModuleHeader>

                {!layoutConfirmado && (
                    <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
                        <CardContent className="flex gap-3 p-4">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div className="space-y-1 text-sm">
                                <p className="font-semibold text-amber-900 dark:text-amber-200">
                                    El layout de columnas todavía no está verificado contra CONTPAQi.
                                </p>
                                <p className="text-amber-800 dark:text-amber-300">
                                    El archivo se genera con un orden de columnas supuesto. Para confirmarlo, exporta la
                                    &quot;Hoja de trabajo&quot; desde la prenómina de CONTPAQi y coteja el encabezado contra{' '}
                                    <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">config/contpaqi.php</code>.
                                    Prueba primero con un período de ensayo, no con una nómina real.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {empleadosSinMapeo > 0 && (
                    <Card className="border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40">
                        <CardContent className="flex items-center justify-between gap-3 p-4">
                            <div className="flex gap-3">
                                <UserX className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                                <div className="text-sm">
                                    <p className="font-semibold text-rose-900 dark:text-rose-200">
                                        {empleadosSinMapeo} empleado{empleadosSinMapeo === 1 ? '' : 's'} sin código de CONTPAQi.
                                    </p>
                                    <p className="text-rose-800 dark:text-rose-300">
                                        No saldrán en el archivo hasta que se les asigne su código.
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" onClick={() => router.get('/admin/nomina/contpaqi/mapeos')}>
                                Asignar
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {periodoCerrado && (
                    <Card className="border-violet-300 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/40">
                        <CardContent className="flex gap-3 p-4">
                            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" />
                            <div className="space-y-1 text-sm">
                                <p className="font-semibold text-violet-900 dark:text-violet-200">
                                    Este período ya está cerrado: la nómina se pagó con{' '}
                                    <span className="font-mono">{periodoCerrado.nombre_archivo}</span>.
                                </p>
                                <p className="text-violet-800 dark:text-violet-300">
                                    Cubre del {periodoCerrado.periodo_inicio} al {periodoCerrado.periodo_fin}. Puedes
                                    previsualizar y descargar, pero no generar otro archivo para esas fechas.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {incidenciasPendientes > 0 && !periodoCerrado && (
                    <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
                        <CardContent className="flex items-center justify-between gap-3 p-4">
                            <div className="flex gap-3">
                                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                <div className="text-sm">
                                    <p className="font-semibold text-amber-900 dark:text-amber-200">
                                        {incidenciasPendientes} incidencia{incidenciasPendientes === 1 ? '' : 's'} sin
                                        aprobar en este período.
                                    </p>
                                    <p className="text-amber-800 dark:text-amber-300">
                                        No saldrá{incidenciasPendientes === 1 ? '' : 'n'} en el archivo y el empleado
                                        aparecerá con faltas. Apruébalas o recházalas antes de generar.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    router.get('/admin/nomina/incidencias', {
                                        desde: periodo.desde,
                                        hasta: periodo.hasta,
                                        estado: 'pendiente',
                                    })
                                }
                            >
                                Revisar
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* ---------- Selección de período ---------- */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Período de nómina</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Del</label>
                            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Al</label>
                            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground"># de período en CONTPAQi</label>
                            <Input
                                type="number"
                                min={1}
                                placeholder="15"
                                value={generarForm.data.numero_periodo}
                                onChange={(e) => generarForm.setData('numero_periodo', e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={previsualizar}>
                                <Search className="mr-2 h-4 w-4" />
                                Previsualizar
                            </Button>
                            {puedeExportar && (
                                <Button
                                    onClick={() => generar()}
                                    disabled={generarForm.processing || renglones.length === 0 || generarBloqueado}
                                    title={generarBloqueado ? 'El período ya está cerrado' : undefined}
                                >
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Generar archivo
                                </Button>
                            )}
                        </div>
                    </CardContent>

                    {/*
                     * El servidor rebota el primer intento cuando hay pendientes.
                     * Aquí se explica y se ofrece seguir de todos modos, que es
                     * legítimo si la pendiente es un error que nadie aprobará.
                     */}
                    {generarForm.errors.confirmar_pendientes && (
                        <CardContent className="border-t pt-4">
                            <div className="flex flex-col gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-amber-900 dark:text-amber-200">
                                    {generarForm.errors.confirmar_pendientes}
                                </p>
                                <Button
                                    variant="outline"
                                    className="shrink-0"
                                    disabled={generarForm.processing}
                                    onClick={() => generar(true)}
                                >
                                    Generar de todos modos
                                </Button>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* ---------- Reloj checador ---------- */}
                {relojChecador && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                            <CardTitle className="text-base">
                                <Fingerprint className="mr-2 inline h-4 w-4" />
                                Checadas del reloj en el período
                            </CardTitle>
                            {puedeExportar && relojChecador.conectado && relojChecador.alimenta_nomina && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={sincronizarReloj}
                                    disabled={sincronizando || periodoCerrado !== null}
                                    title={periodoCerrado ? 'El período ya está cerrado' : undefined}
                                >
                                    <RefreshCw className={`mr-2 h-4 w-4 ${sincronizando ? 'animate-spin' : ''}`} />
                                    {sincronizando ? 'Sincronizando…' : 'Traer checadas del reloj'}
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            {!relojChecador.conectado ? (
                                <p className="text-muted-foreground">
                                    Esta empresa no tiene un reloj BioTime conectado. La prenómina sólo usa las checadas
                                    del kiosko y de control de acceso.
                                </p>
                            ) : !relojChecador.alimenta_nomina ? (
                                <p className="text-amber-700 dark:text-amber-300">
                                    El reloj está conectado pero sus checadas no alimentan la nómina
                                    (BIOTIME_ALIMENTAR_ASISTENCIA desactivado).
                                </p>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Última sincronización</p>
                                        <p className="font-medium">{relojChecador.ultima_sincronizacion ?? 'Nunca'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Checadas del período</p>
                                        <p className="font-medium">{relojChecador.checadas_periodo}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Días por recalcular</p>
                                        <p
                                            className={`font-medium ${relojChecador.dias_por_importar > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`}
                                        >
                                            {relojChecador.dias_por_importar}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Checadas sin empleado</p>
                                        <p
                                            className={`font-medium ${relojChecador.checadas_sin_vincular > 0 ? 'text-rose-600 dark:text-rose-400' : ''}`}
                                        >
                                            {relojChecador.checadas_sin_vincular}
                                            {relojChecador.codigos_sin_vincular > 0 &&
                                                ` (${relojChecador.codigos_sin_vincular} código${relojChecador.codigos_sin_vincular === 1 ? '' : 's'})`}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {relojChecador.conectado && relojChecador.checadas_sin_vincular > 0 && (
                                <div className="flex flex-col gap-2 rounded-md border border-rose-300 bg-rose-50 p-3 dark:border-rose-900 dark:bg-rose-950/40 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-rose-900 dark:text-rose-200">
                                        Hay personas checando en el reloj que no están vinculadas a un empleado de
                                        Shigoto. Sus horas no llegan a la nómina.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="shrink-0"
                                        onClick={() => router.get('/admin/biotime/empleados')}
                                    >
                                        Vincular
                                    </Button>
                                </div>
                            )}

                            {relojChecador.empleados_sin_checadas_total > 0 && (
                                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
                                    <p className="font-semibold text-amber-900 dark:text-amber-200">
                                        {relojChecador.empleados_sin_checadas_total} empleado
                                        {relojChecador.empleados_sin_checadas_total === 1 ? '' : 's'} de la nómina sin
                                        ninguna checada en el período.
                                    </p>
                                    <p className="mb-2 text-amber-800 dark:text-amber-300">
                                        Saldrán con faltas en cada día laborable que no cubra una incidencia aprobada.
                                    </p>
                                    <ul className="flex flex-wrap gap-1.5">
                                        {relojChecador.empleados_sin_checadas.map((e) => (
                                            <li key={e.id}>
                                                <Badge variant="outline" className="font-normal">
                                                    {e.nombre}
                                                    {relojChecador.conectado && !e.vinculado_reloj && (
                                                        <span className="ml-1 text-rose-600 dark:text-rose-400">
                                                            · sin vincular al reloj
                                                        </span>
                                                    )}
                                                </Badge>
                                            </li>
                                        ))}
                                        {relojChecador.empleados_sin_checadas_total >
                                            relojChecador.empleados_sin_checadas.length && (
                                            <li className="self-center text-xs text-amber-800 dark:text-amber-300">
                                                y{' '}
                                                {relojChecador.empleados_sin_checadas_total -
                                                    relojChecador.empleados_sin_checadas.length}{' '}
                                                más
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* ---------- Calendario de nómina ---------- */}
                {puedeConfigurar && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                <CalendarClock className="mr-2 inline h-4 w-4" />
                                Calendario de nómina de {empresa.razon_social}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Periodicidad</label>
                                <Select
                                    value={configForm.data.periodicidad}
                                    onValueChange={(v) =>
                                        configForm.setData('periodicidad', v as Configuracion['periodicidad'])
                                    }
                                >
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="semanal">Semanal</SelectItem>
                                        <SelectItem value="quincenal">Quincenal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {configForm.data.periodicidad === 'semanal' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        La semana empieza en
                                    </label>
                                    <Select
                                        value={configForm.data.dia_inicio_semana}
                                        onValueChange={(v) => configForm.setData('dia_inicio_semana', v)}
                                    >
                                        <SelectTrigger className="w-40">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DIAS_SEMANA.map((d) => (
                                                <SelectItem key={d.valor} value={String(d.valor)}>
                                                    {d.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <Button
                                variant="outline"
                                onClick={guardarConfiguracion}
                                disabled={configForm.processing}
                            >
                                Guardar calendario
                            </Button>

                            <p className="text-xs text-muted-foreground sm:ml-2 sm:max-w-md">
                                Manda el período que se propone al entrar y el corte del tope de horas extra dobles,
                                que la ley cuenta por semana.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {previsualizacion?.error && (
                    <Card className="border-rose-300 dark:border-rose-900">
                        <CardContent className="p-4 text-sm text-rose-700 dark:text-rose-300">
                            {previsualizacion.error}
                        </CardContent>
                    </Card>
                )}

                {previsualizacion && !previsualizacion.error && (
                    <>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <StatCard
                                icon={<Users className="h-5 w-5 text-white" />}
                                title="Empleados con movimientos"
                                value={renglones.length}
                                colorClassName="bg-teal-500"
                            />
                            <StatCard
                                icon={<UserX className="h-5 w-5 text-white" />}
                                title="Omitidos"
                                value={omitidos.length}
                                colorClassName="bg-amber-500"
                            />
                            <StatCard
                                icon={<FileSpreadsheet className="h-5 w-5 text-white" />}
                                title="Columnas de incidencia"
                                value={columnas.length}
                                colorClassName="bg-indigo-500"
                            />
                        </div>

                        {/* ---------- Tabla de previsualización ---------- */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Movimientos del {periodo.desde} al {periodo.hasta}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {renglones.length === 0 ? (
                                    <p className="py-6 text-center text-sm text-muted-foreground">
                                        No hay movimientos en este período.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-xs uppercase text-muted-foreground">
                                                    <th className="px-3 py-2 text-left">Código</th>
                                                    <th className="px-3 py-2 text-left">Empleado</th>
                                                    {columnas.map((c) => (
                                                        <th key={c.mnemonico} className="px-3 py-2 text-center" title={`${c.descripcion} (${c.unidad})`}>
                                                            {c.mnemonico}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {renglones.map((r) => (
                                                    <tr key={r.empleado_id} className="border-b last:border-0">
                                                        <td className="px-3 py-2 font-mono">{r.codigo_empleado}</td>
                                                        <td className="px-3 py-2">{r.nombre_empleado}</td>
                                                        {columnas.map((c) => (
                                                            <td key={c.mnemonico} className="px-3 py-2 text-center font-mono">
                                                                {r.valores[c.mnemonico] ?? ''}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {omitidos.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Quiénes quedan fuera y por qué</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(omitidosPorMotivo).map(([motivo, cuantos]) => (
                                            <Badge key={motivo} variant="secondary">
                                                {cuantos} · {motivo}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="max-h-64 overflow-y-auto rounded-md border">
                                        <table className="w-full text-sm">
                                            <tbody>
                                                {omitidos.map((o) => (
                                                    <tr key={o.empleado_id} className="border-b last:border-0">
                                                        <td className="px-3 py-2">{o.nombre_empleado}</td>
                                                        <td className="px-3 py-2 text-muted-foreground">{o.motivo}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

                {/* ---------- Histórico ---------- */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Exportaciones anteriores</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {exportaciones.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                Todavía no se ha generado ninguna prenómina.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-xs uppercase text-muted-foreground">
                                            <th className="px-3 py-2 text-left">Período</th>
                                            <th className="px-3 py-2 text-center">#</th>
                                            <th className="px-3 py-2 text-center">Estado</th>
                                            <th className="px-3 py-2 text-center">Exportados</th>
                                            <th className="px-3 py-2 text-center">Omitidos</th>
                                            <th className="px-3 py-2 text-left">Generó</th>
                                            <th className="px-3 py-2 text-right">Archivo</th>
                                            <th className="px-3 py-2 text-right">Cierre</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {exportaciones.map((e) => (
                                            <tr key={e.id} className="border-b last:border-0">
                                                <td className="px-3 py-2 font-mono text-xs">
                                                    {e.periodo_inicio} → {e.periodo_fin}
                                                </td>
                                                <td className="px-3 py-2 text-center">{e.numero_periodo ?? '—'}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[e.estado]}`}>
                                                        {e.estado}
                                                    </span>
                                                    {e.mensaje_error && (
                                                        <div className="mt-1 text-[11px] text-rose-600">{e.mensaje_error}</div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-center font-mono">{e.empleados_exportados}</td>
                                                <td className="px-3 py-2 text-center font-mono">{e.empleados_omitidos}</td>
                                                <td className="px-3 py-2 text-xs text-muted-foreground">
                                                    {e.generada_por?.name ?? '—'}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    {e.nombre_archivo && e.estado !== 'error' ? (
                                                        <a
                                                            className="inline-flex items-center gap-1 text-sm text-teal-600 hover:underline dark:text-teal-400"
                                                            href={`/admin/nomina/contpaqi/${e.id}/descargar`}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                            Descargar
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    {e.estado === 'cerrada' ? (
                                                        <span
                                                            className="inline-flex items-center gap-1 text-xs text-violet-700 dark:text-violet-300"
                                                            title={
                                                                e.cerrada_por
                                                                    ? `Cerrada por ${e.cerrada_por.name}${e.cerrada_at ? ` el ${e.cerrada_at}` : ''}`
                                                                    : undefined
                                                            }
                                                        >
                                                            <LockKeyhole className="h-3.5 w-3.5" />
                                                            Cerrada
                                                        </span>
                                                    ) : puedeExportar && e.nombre_archivo && e.estado !== 'error' ? (
                                                        <Button size="sm" variant="ghost" onClick={() => cerrar(e)}>
                                                            Cerrar período
                                                        </Button>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ---------- Catálogo de referencia ---------- */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Catálogo de incidencias de CONTPAQi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {catalogo.map((t) => (
                                <span
                                    key={t.id}
                                    title={`${t.descripcion} · ${t.unidad}${t.tipo_imss ? ` · IMSS: ${t.tipo_imss}` : ''}`}
                                    className={`rounded-md border px-2 py-1 text-xs ${
                                        t.activo
                                            ? 'border-border'
                                            : 'border-dashed opacity-50'
                                    }`}
                                >
                                    <span className="font-mono font-semibold">{t.mnemonico}</span>
                                    {t.es_derivada && (
                                        <span className="ml-1.5 text-[10px] uppercase text-teal-600 dark:text-teal-400">
                                            automático
                                        </span>
                                    )}
                                </span>
                            ))}
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                            Los marcados como <span className="font-medium">automático</span> los calcula la asistencia a
                            partir de los marcajes. Los demás se capturan en Incidencias.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
