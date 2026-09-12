import React, { useState } from 'react';
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
import { ArrowLeft, Link2, Save, Trash2 } from 'lucide-react';

interface EmpleadoLigero {
    id: number;
    nombres: string;
    apellidos: string;
    documento_identidad: string;
}

interface Mapeo {
    id: number;
    codigo_empleado: string;
    nombre_contpaqi: string | null;
    activo: boolean;
    notas: string | null;
    empleado: EmpleadoLigero | null;
}

interface Props {
    empresa: { id: number; razon_social: string };
    mapeos: Mapeo[];
    empleadosSinMapeo: EmpleadoLigero[];
}

export default function MapeoContpaqi({ empresa, mapeos, empleadosSinMapeo }: Props) {
    const [editando, setEditando] = useState<number | null>(null);
    const [codigoEditado, setCodigoEditado] = useState('');

    const form = useForm({ empleado_id: '', codigo_empleado: '', nombre_contpaqi: '', notas: '' });

    const guardar = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/nomina/contpaqi/mapeos', {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    const actualizar = (m: Mapeo) => {
        router.put(
            `/admin/nomina/contpaqi/mapeos/${m.id}`,
            { codigo_empleado: codigoEditado, nombre_contpaqi: m.nombre_contpaqi, activo: m.activo, notas: m.notas },
            { preserveScroll: true, onSuccess: () => setEditando(null) },
        );
    };

    const alternarActivo = (m: Mapeo) => {
        router.put(
            `/admin/nomina/contpaqi/mapeos/${m.id}`,
            { codigo_empleado: m.codigo_empleado, nombre_contpaqi: m.nombre_contpaqi, activo: !m.activo, notas: m.notas },
            { preserveScroll: true },
        );
    };

    return (
        <>
            <Head title="Mapeo de códigos CONTPAQi" />

            <div className="space-y-6 p-4 sm:p-6">
                <ModuleHeader
                    icon={<Link2 className="h-6 w-6" />}
                    title="Mapeo de códigos de empleado"
                    description={`${empresa.razon_social} · equivalencia entre Shigoto y el "Código empleado" de CONTPAQi`}
                    colorClassName="bg-teal-600"
                >
                    <Button variant="secondary" onClick={() => router.get('/admin/nomina/contpaqi')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a prenómina
                    </Button>
                </ModuleHeader>

                <Card>
                    <CardContent className="p-4 text-sm text-muted-foreground">
                        Un empleado sin código aquí <span className="font-medium text-foreground">no sale</span> en el
                        archivo de prenómina. Es deliberado: exportar un renglón con el código equivocado le carga las
                        horas a otra persona, y el error se descubre cuando la nómina ya se timbró.
                    </CardContent>
                </Card>

                {/* ---------- Alta ---------- */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Asignar código ({empleadosSinMapeo.length} empleado
                            {empleadosSinMapeo.length === 1 ? '' : 's'} sin asignar)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {empleadosSinMapeo.length === 0 ? (
                            <p className="py-4 text-center text-sm text-muted-foreground">
                                Todos los empleados activos tienen código asignado.
                            </p>
                        ) : (
                            <form onSubmit={guardar} className="grid gap-4 md:grid-cols-4">
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground">Empleado</label>
                                    <Select
                                        value={form.data.empleado_id}
                                        onValueChange={(v) => form.setData('empleado_id', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {empleadosSinMapeo.map((e) => (
                                                <SelectItem key={e.id} value={String(e.id)}>
                                                    {e.nombres} {e.apellidos} · {e.documento_identidad}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.empleado_id && (
                                        <p className="text-xs text-rose-600">{form.errors.empleado_id}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Código en CONTPAQi
                                    </label>
                                    <Input
                                        value={form.data.codigo_empleado}
                                        onChange={(e) => form.setData('codigo_empleado', e.target.value)}
                                        placeholder="180"
                                    />
                                    {form.errors.codigo_empleado && (
                                        <p className="text-xs text-rose-600">{form.errors.codigo_empleado}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Nombre en CONTPAQi
                                    </label>
                                    <Input
                                        value={form.data.nombre_contpaqi}
                                        onChange={(e) => form.setData('nombre_contpaqi', e.target.value)}
                                        placeholder="Opcional, para cotejar"
                                    />
                                </div>

                                <div className="md:col-span-4">
                                    <Button type="submit" disabled={form.processing}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Guardar mapeo
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* ---------- Listado ---------- */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">{mapeos.length} mapeos registrados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-xs uppercase text-muted-foreground">
                                        <th className="px-3 py-2 text-left">Código</th>
                                        <th className="px-3 py-2 text-left">Empleado en Shigoto</th>
                                        <th className="px-3 py-2 text-left">Nombre en CONTPAQi</th>
                                        <th className="px-3 py-2 text-center">Activo</th>
                                        <th className="px-3 py-2 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mapeos.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-6 text-center text-muted-foreground">
                                                Todavía no hay mapeos.
                                            </td>
                                        </tr>
                                    )}
                                    {mapeos.map((m) => (
                                        <tr key={m.id} className={`border-b last:border-0 ${m.activo ? '' : 'opacity-50'}`}>
                                            <td className="px-3 py-2">
                                                {editando === m.id ? (
                                                    <Input
                                                        className="h-8 w-28"
                                                        value={codigoEditado}
                                                        onChange={(e) => setCodigoEditado(e.target.value)}
                                                    />
                                                ) : (
                                                    <span className="font-mono font-semibold">{m.codigo_empleado}</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                {m.empleado
                                                    ? `${m.empleado.nombres} ${m.empleado.apellidos}`
                                                    : 'Empleado eliminado'}
                                            </td>
                                            <td className="px-3 py-2 text-muted-foreground">
                                                {m.nombre_contpaqi ?? '—'}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => alternarActivo(m)}
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        m.activo
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}
                                                >
                                                    {m.activo ? 'Activo' : 'Inactivo'}
                                                </button>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex justify-end gap-1">
                                                    {editando === m.id ? (
                                                        <>
                                                            <Button size="sm" onClick={() => actualizar(m)}>
                                                                Guardar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setEditando(null)}
                                                            >
                                                                Cancelar
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setEditando(m.id);
                                                                    setCodigoEditado(m.codigo_empleado);
                                                                }}
                                                            >
                                                                Editar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                title="Eliminar"
                                                                onClick={() =>
                                                                    router.delete(
                                                                        `/admin/nomina/contpaqi/mapeos/${m.id}`,
                                                                        { preserveScroll: true },
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
