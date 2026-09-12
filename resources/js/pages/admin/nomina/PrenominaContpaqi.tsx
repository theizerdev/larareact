import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    AlertTriangle,
    Download,
    FileSpreadsheet,
    Link2,
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
    estado: 'generando' | 'generada' | 'descargada' | 'error';
    nombre_archivo: string | null;
    empleados_exportados: number;
    empleados_omitidos: number;
    columnas: string[] | null;
    mensaje_error: string | null;
    generada_at: string | null;
    generada_por?: { id: number; name: string } | null;
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

interface Props {
    empresa: { id: number; razon_social: string };
    periodo: { desde: string; hasta: string };
    previsualizacion: Previsualizacion | null;
    exportaciones: Exportacion[];
    empleadosSinMapeo: number;
    catalogo: TipoIncidencia[];
    puedeExportar: boolean;
    layoutConfirmado: boolean;
}

const ESTADO_BADGE: Record<Exportacion['estado'], string> = {
    generando: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    generada: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    descargada: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    error: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
};

export default function PrenominaContpaqi({
    empresa,
    periodo,
    previsualizacion,
    exportaciones,
    empleadosSinMapeo,
    catalogo,
    puedeExportar,
    layoutConfirmado,
}: Props) {
    const [desde, setDesde] = useState(periodo.desde);
    const [hasta, setHasta] = useState(periodo.hasta);

    const generarForm = useForm({ desde: periodo.desde, hasta: periodo.hasta, numero_periodo: '' });

    const renglones = previsualizacion?.renglones ?? [];
    const omitidos = previsualizacion?.omitidos ?? [];
    const columnas = previsualizacion?.columnas ?? [];

    const previsualizar = () => {
        router.get('/admin/nomina/contpaqi', { desde, hasta }, { preserveState: true, preserveScroll: true });
    };

    const generar = () => {
        generarForm.transform((data) => ({ ...data, desde, hasta }));
        generarForm.post('/admin/nomina/contpaqi/generar', { preserveScroll: true });
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
                                <Button onClick={generar} disabled={generarForm.processing || renglones.length === 0}>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Generar archivo
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

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
