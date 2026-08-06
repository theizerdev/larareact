import { Head, router } from '@inertiajs/react';
import { BookMarked, Filter, Search } from 'lucide-react';
import React, { useState } from 'react';
import { ModuleHeader } from '@/components/module-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

interface Cuenta {
    id: number;
    codigo: string;
    nombre: string;
}

interface Movimiento {
    id: number;
    debe: number;
    haber: number;
    referencia?: string;
    created_at: string;
    asiento?: {
        numero_asiento: string;
        glosa: string;
        fecha: string;
    };
}

interface Props {
    cuentasDisponibles: Cuenta[];
    cuentaSeleccionada?: Cuenta;
    movimientos?: {
        data: Movimiento[];
        links: any[];
        total: number;
    };
    filters: { cuenta_id?: string };
}

export default function LibroMayor({ cuentasDisponibles, cuentaSeleccionada, movimientos, filters }: Props) {
    const [selectedCuentaId, setSelectedCuentaId] = useState(filters.cuenta_id || '');

    const handleSelectCuenta = (val: string) => {
        setSelectedCuentaId(val);
        router.get('/admin/contabilidad/mayor', { cuenta_id: val }, { preserveState: true });
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Contabilidad', href: '#' },
        { title: 'Libro Mayor', href: '/admin/contabilidad/mayor' },
    ];

    const totalDebe = movimientos?.data?.reduce((acc, m) => acc + Number(m.debe), 0) || 0;
    const totalHaber = movimientos?.data?.reduce((acc, m) => acc + Number(m.haber), 0) || 0;
    const saldoNeto = totalDebe - totalHaber;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Libro Mayor Contable" />

            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                <ModuleHeader
                    title="Libro Mayor"
                    description="Consolidado de movimientos y saldos por cuenta contable."
                    icon={BookMarked}
                />

                <Card className="shadow-sm">
                    <CardHeader className="p-4 border-b">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="w-full sm:w-96 space-y-1">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Seleccionar Cuenta Contable:</label>
                                <Select value={selectedCuentaId} onValueChange={handleSelectCuenta}>
                                    <SelectTrigger className="h-9 text-xs font-mono">
                                        <SelectValue placeholder="-- Seleccione una cuenta --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cuentasDisponibles.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)} className="font-mono text-xs">
                                                {c.codigo} - {c.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {cuentaSeleccionada && (
                                <div className="flex items-center gap-4 text-xs font-mono">
                                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
                                        <span className="text-slate-500">Debe: </span>
                                        <span className="font-bold">${totalDebe.toFixed(2)}</span>
                                    </div>
                                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
                                        <span className="text-slate-500">Haber: </span>
                                        <span className="font-bold text-emerald-600">${totalHaber.toFixed(2)}</span>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded border border-blue-200">
                                        <span className="text-blue-600 font-bold">Saldo: </span>
                                        <span className="font-bold text-blue-700 dark:text-blue-300">${saldoNeto.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {cuentaSeleccionada && movimientos?.data ? (
                            <table className="w-full text-left text-xs font-mono">
                                <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-bold text-[11px] text-slate-600 dark:text-slate-300">
                                    <tr>
                                        <th className="p-3">Asiento</th>
                                        <th className="p-3">Fecha</th>
                                        <th className="p-3">Concepto / Glosa</th>
                                        <th className="p-3 text-right">Debe ($)</th>
                                        <th className="p-3 text-right">Haber ($)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {movimientos.data.map((m) => (
                                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="p-3 font-bold text-blue-600">{m.asiento?.numero_asiento}</td>
                                            <td className="p-3 text-slate-500">{m.asiento?.fecha ? new Date(m.asiento.fecha).toLocaleDateString() : '-'}</td>
                                            <td className="p-3 font-sans font-medium">{m.asiento?.glosa}</td>
                                            <td className="p-3 text-right font-bold">${Number(m.debe).toFixed(2)}</td>
                                            <td className="p-3 text-right font-bold text-emerald-600">${Number(m.haber).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-12 text-center text-xs text-muted-foreground">
                                Seleccione una cuenta contable arriba para visualizar su desglose de movimientos y saldo.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
