import React, { useMemo, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { ModuleHeader } from '@/components/module-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CalendarDays, Check, Plus, Trash2, X } from 'lucide-react';

type Estado = 'borrador' | 'pendiente' | 'aprobada' | 'rechazada' | 'aplicada';

interface Tipo {
    id: number;
    mnemonico: string;
    descripcion: string;
    unidad: 'dias' | 'horas';
    tipo_imss: string | null;
}

interface EmpleadoLigero {
    id: number;
    nombres: string;
    apellidos: string;
}

interface Incidencia {
    id: number;
    fecha_inicio: string;
    fecha_fin: string;
    cantidad: string;
    estado: Estado;
    folio: string | null;
    motivo: string | null;
    empleado: EmpleadoLigero | null;
    tipo: Tipo | null;
    aprobada_por?: { id: number; name: string } | null;
}

interface Paginado<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
}

interface Props {
    incidencias: Paginado<Incidencia>;
    tipos: Tipo[];
    empleados: EmpleadoLigero[];
    filtros: { desde: string; hasta: string; estado: string | null; empleado_id: number | null };
    puedeAprobar: boolean;
}

const ESTADO_BADGE: Record<Estado, string> = {
    borrador: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    aprobada: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    rechazada: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    aplicada: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
};

/** Días naturales que cubre un rango, ambos extremos incluidos. */
function diasEntre(inicio: string, fin: string): number {
    if (!inicio || !fin) return 0;
    const ms = new Date(`${fin}T00:00:00`).getTime() - new Date(`${inicio}T00:00:00`).getTime();
    return ms < 0 ? 0 : Math.round(ms / 86_400_000) + 1;
}

export default function Incidencias({ incidencias, tipos, empleados, filtros, puedeAprobar }: Props) {
    const [desde, setDesde] = useState(filtros.desde);
    const [hasta, setHasta] = useState(filtros.hasta);
    const [estado, setEstado] = useState(filtros.estado ?? 'todos');

    const form = useForm({
        empleado_id: '',
        contpaqi_tipo_incidencia_id: '',
        fecha_inicio: '',
        fecha_fin: '',
        cantidad: '',
        folio: '',
        motivo: '',
    });

    const tipoElegido = useMemo(
        () => tipos.find((t) => String(t.id) === form.data.contpaqi_tipo_incidencia_id),
        [tipos, form.data.contpaqi_tipo_incidencia_id],
    );

    /*
     * Al elegir las fechas se propone la cantidad en días naturales, que es lo
     * correcto en la mayoría de los casos. Se propone, no se impone: un permiso
     * puede ser de medio día y una incapacidad puede cubrir menos días
     * laborables que naturales, así que el campo queda editable.
     */
    const proponerCantidad = (inicio: string, fin: string) => {
        if (tipoElegido?.unidad === 'horas') return;
        const dias = diasEntre(inicio, fin);
        if (dias > 0) form.setData('cantidad', String(dias));
    };

    const filtrar = () => {
        router.get(
            '/admin/nomina/incidencias',
            { desde, hasta, estado: estado === 'todos' ? undefined : estado },
            { preserveState: true, preserveScroll: true },
        );
    };

    const guardar = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/nomina/incidencias', {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    const accion = (id: number, verbo: 'aprobar' | 'rechazar') => {
        router.patch(`/admin/nomina/incidencias/${id}/${verbo}`, {}, { preserveScroll: true });
    };

    const eliminar = (id: number) => {
        router.delete(`/admin/nomina/incidencias/${id}`, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Incidencias de nómina" />

            <div className="space-y-6 p-4 sm:p-6">
                <ModuleHeader
                    icon={<CalendarDays className="h-6 w-6" />}
                    title="Incidencias de nómina"
                    description="Vacaciones, permisos, incapacidades y castigos: lo que los marcajes no pueden deducir solos"
                    colorClassName="bg-indigo-600"
                />

                {/* ---------- Captura ---------- */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            <Plus className="mr-2 inline h-4 w-4" />
                            Capturar incidencia
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={guardar} className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Empleado</label>
                                <Select
                                    value={form.data.empleado_id}
                                    onValueChange={(v) => form.setData('empleado_id', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {empleados.map((e) => (
                                            <SelectItem key={e.id} value={String(e.id)}>
                                                {e.nombres} {e.apellidos}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.empleado_id && (
                                    <p className="text-xs text-rose-600">{form.errors.empleado_id}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Tipo de incidencia</label>
                                <Select
                                    value={form.data.contpaqi_tipo_incidencia_id}
                                    onValueChange={(v) => form.setData('contpaqi_tipo_incidencia_id', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tipos.map((t) => (
                                            <SelectItem key={t.id} value={String(t.id)}>
                                                {t.mnemonico} · {t.descripcion}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.contpaqi_tipo_incidencia_id && (
                                    <p className="text-xs text-rose-600">{form.errors.contpaqi_tipo_incidencia_id}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Cantidad {tipoElegido ? `(${tipoElegido.unidad})` : ''}
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={form.data.cantidad}
                                    onChange={(e) => form.setData('cantidad', e.target.value)}
                                />
                                {form.errors.cantidad && <p className="text-xs text-rose-600">{form.errors.cantidad}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Del</label>
                                <Input
                                    type="date"
                                    value={form.data.fecha_inicio}
                                    onChange={(e) => {
                                        form.setData('fecha_inicio', e.target.value);
                                        proponerCantidad(e.target.value, form.data.fecha_fin);
                                    }}
                                />
                                {form.errors.fecha_inicio && (
                                    <p className="text-xs text-rose-600">{form.errors.fecha_inicio}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Al</label>
                                <Input
                                    type="date"
                                    value={form.data.fecha_fin}
                                    onChange={(e) => {
                                        form.setData('fecha_fin', e.target.value);
                                        proponerCantidad(form.data.fecha_inicio, e.target.value);
                                    }}
                                />
                                {form.errors.fecha_fin && <p className="text-xs text-rose-600">{form.errors.fecha_fin}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Folio (incapacidad IMSS, oficio…)
                                </label>
                                <Input
                                    value={form.data.folio}
                                    onChange={(e) => form.setData('folio', e.target.value)}
                                    placeholder="Opcional"
                                />
                            </div>

                            <div className="space-y-1 md:col-span-3">
                                <label className="text-xs font-medium text-muted-foreground">Motivo</label>
                                <Input
                                    value={form.data.motivo}
                                    onChange={(e) => form.setData('motivo', e.target.value)}
                                    placeholder="Opcional"
                                />
                            </div>

                            <div className="md:col-span-3">
                                <Button type="submit" disabled={form.processing}>
                                    Capturar
                                </Button>
                                <span className="ml-3 text-xs text-muted-foreground">
                                    Queda pendiente hasta que alguien con permiso la apruebe.
                                </span>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* ---------- Filtros ---------- */}
                <Card>
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Del</label>
                            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Al</label>
                            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Estado</label>
                            <Select value={estado} onValueChange={setEstado}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                    <SelectItem value="pendiente">Pendiente</SelectItem>
                                    <SelectItem value="aprobada">Aprobada</SelectItem>
                                    <SelectItem value="rechazada">Rechazada</SelectItem>
                                    <SelectItem value="aplicada">Aplicada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" onClick={filtrar}>
                            Filtrar
                        </Button>
                    </CardContent>
                </Card>

                {/* ---------- Listado ---------- */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">{incidencias.total} incidencias en el rango</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-xs uppercase text-muted-foreground">
                                        <th className="px-3 py-2 text-left">Empleado</th>
                                        <th className="px-3 py-2 text-left">Tipo</th>
                                        <th className="px-3 py-2 text-left">Período</th>
                                        <th className="px-3 py-2 text-center">Cantidad</th>
                                        <th className="px-3 py-2 text-left">Folio</th>
                                        <th className="px-3 py-2 text-center">Estado</th>
                                        <th className="px-3 py-2 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {incidencias.data.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-6 text-center text-muted-foreground">
                                                Sin incidencias en este rango.
                                            </td>
                                        </tr>
                                    )}
                                    {incidencias.data.map((i) => (
                                        <tr key={i.id} className="border-b last:border-0">
                                            <td className="px-3 py-2">
                                                {i.empleado ? `${i.empleado.nombres} ${i.empleado.apellidos}` : '—'}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="font-mono font-semibold">{i.tipo?.mnemonico}</span>
                                                <div className="text-xs text-muted-foreground">{i.tipo?.descripcion}</div>
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs">
                                                {i.fecha_inicio} → {i.fecha_fin}
                                            </td>
                                            <td className="px-3 py-2 text-center font-mono">
                                                {i.cantidad} {i.tipo?.unidad === 'horas' ? 'h' : 'd'}
                                            </td>
                                            <td className="px-3 py-2 text-xs text-muted-foreground">{i.folio ?? '—'}</td>
                                            <td className="px-3 py-2 text-center">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[i.estado]}`}>
                                                    {i.estado}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex justify-end gap-1">
                                                    {puedeAprobar && i.estado !== 'aplicada' && i.estado !== 'aprobada' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            title="Aprobar"
                                                            onClick={() => accion(i.id, 'aprobar')}
                                                        >
                                                            <Check className="h-4 w-4 text-emerald-600" />
                                                        </Button>
                                                    )}
                                                    {puedeAprobar && i.estado !== 'aplicada' && i.estado !== 'rechazada' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            title="Rechazar"
                                                            onClick={() => accion(i.id, 'rechazar')}
                                                        >
                                                            <X className="h-4 w-4 text-rose-600" />
                                                        </Button>
                                                    )}
                                                    {i.estado !== 'aplicada' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            title="Eliminar"
                                                            onClick={() => eliminar(i.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {incidencias.links.length > 3 && (
                            <div className="mt-4 flex flex-wrap gap-1">
                                {incidencias.links.map((l, idx) => (
                                    <Button
                                        key={idx}
                                        size="sm"
                                        variant={l.active ? 'default' : 'outline'}
                                        disabled={!l.url}
                                        onClick={() => l.url && router.get(l.url, {}, { preserveScroll: true })}
                                        dangerouslySetInnerHTML={{ __html: l.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
