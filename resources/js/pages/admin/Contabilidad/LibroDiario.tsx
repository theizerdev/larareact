import { Head, router } from '@inertiajs/react';
import { Calendar, FileCheck2, Filter, Receipt, Search, Eye } from 'lucide-react';
import React, { useState } from 'react';
import { ModuleHeader } from '@/components/module-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

interface Apunte {
    id: number;
    cuenta: {
        codigo: string;
        nombre: string;
    };
    debe: number;
    haber: number;
    debe_usd: number;
    haber_usd: number;
    referencia?: string;
}

interface Asiento {
    id: number;
    numero_asiento: string;
    fecha: string;
    glosa: string;
    tasa_cambio: number;
    estado: string;
    apuntes: Apunte[];
    user?: { name: string };
}

interface Props {
    asientos: {
        data: Asiento[];
        links: any[];
        total: number;
    };
    filters: {
        search?: string;
        from_date?: string;
        to_date?: string;
    };
}

export default function LibroDiario({ asientos, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedAsiento, setSelectedAsiento] = useState<Asiento | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/contabilidad/asientos', { search }, { preserveState: true });
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Contabilidad', href: '#' },
        { title: 'Libro Diario', href: '/admin/contabilidad/asientos' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Libro Diario - Asientos Contables" />

            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                <ModuleHeader
                    title="Libro Diario (Asientos Contables)"
                    description="Registro cronológico y automático de todas las operaciones comerciales por Partida Doble."
                    icon={FileCheck2}
                />

                <Card className="shadow-sm">
                    <CardHeader className="p-4 border-b">
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="relative w-full sm:w-80">
                                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar N° asiento o glosa..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs font-mono">
                                    Total Asientos: {asientos.total}
                                </Badge>
                            </div>
                        </form>
                    </CardHeader>

                    <CardContent className="p-0 divide-y">
                        {asientos.data.length > 0 ? (
                            asientos.data.map((asiento) => {
                                const totalDebe = asiento.apuntes?.reduce((acc, curr) => acc + Number(curr.debe), 0) || 0;
                                const totalHaber = asiento.apuntes?.reduce((acc, curr) => acc + Number(curr.haber), 0) || 0;

                                return (
                                    <div key={asiento.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-blue-600 font-mono font-bold text-xs">{asiento.numero_asiento}</Badge>
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    {new Date(asiento.fecha).toLocaleString()}
                                                </span>
                                                <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                                                    Tasa: ${Number(asiento.tasa_cambio).toFixed(2)}
                                                </Badge>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedAsiento(asiento)}
                                                className="h-7 text-xs font-bold gap-1 text-blue-600 hover:text-blue-700"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Ver Detalle
                                            </Button>
                                        </div>

                                        <p className="text-xs font-medium text-slate-900 dark:text-slate-100 mb-3">{asiento.glosa}</p>

                                        {/* Vista rápida de apuntes */}
                                        <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 space-y-1 font-mono text-[11px]">
                                            {asiento.apuntes?.map((apunte) => (
                                                <div key={apunte.id} className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-blue-600 font-bold">{apunte.cuenta?.codigo}</span>
                                                        <span className="text-slate-700 dark:text-slate-300 font-sans">{apunte.cuenta?.nombre}</span>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <span className={Number(apunte.debe) > 0 ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-400'}>
                                                            Debe: ${Number(apunte.debe).toFixed(2)}
                                                        </span>
                                                        <span className={Number(apunte.haber) > 0 ? 'font-bold text-emerald-600' : 'text-slate-400'}>
                                                            Haber: ${Number(apunte.haber).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-12 text-center text-xs text-muted-foreground">
                                <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                                No se encontraron asientos contables registrados.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Modal de Detalle de Asiento */}
                <Dialog open={!!selectedAsiento} onOpenChange={() => setSelectedAsiento(null)}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="font-mono flex items-center justify-between text-base">
                                <span>Asiento {selectedAsiento?.numero_asiento}</span>
                                <Badge className="bg-emerald-600">{selectedAsiento?.estado}</Badge>
                            </DialogTitle>
                        </DialogHeader>

                        {selectedAsiento && (
                            <div className="space-y-4 text-xs font-sans">
                                <div>
                                    <p className="text-muted-foreground">Concepto / Glosa:</p>
                                    <p className="font-bold text-slate-900 dark:text-slate-100">{selectedAsiento.glosa}</p>
                                </div>

                                <table className="w-full text-left font-mono border text-xs">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] uppercase font-bold">
                                        <tr>
                                            <th className="p-2 border">Código</th>
                                            <th className="p-2 border">Cuenta</th>
                                            <th className="p-2 border text-right">Debe ($)</th>
                                            <th className="p-2 border text-right">Haber ($)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedAsiento.apuntes?.map((a) => (
                                            <tr key={a.id} className="border-b">
                                                <td className="p-2 border text-blue-600 font-bold">{a.cuenta?.codigo}</td>
                                                <td className="p-2 border font-sans">{a.cuenta?.nombre}</td>
                                                <td className="p-2 border text-right font-bold">${Number(a.debe).toFixed(2)}</td>
                                                <td className="p-2 border text-right font-bold text-emerald-600">${Number(a.haber).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
