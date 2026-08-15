import { Head, useForm } from '@inertiajs/react';
import { BookOpen, ChevronDown, ChevronRight, Plus, Search, Folder, FileText } from 'lucide-react';
import React, { useState } from 'react';
import { ModuleHeader } from '@/components/module-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumbs } from '@/components/breadcrumbs';

interface Cuenta {
    id: number;
    codigo: string;
    codigo_sat?: string;
    nombre: string;
    tipo: string;
    naturaleza: string;
    nivel: number;
    acepta_movimiento: boolean;
    activa: boolean;
    subcuentas?: Cuenta[];
}

interface Props {
    cuentas: Cuenta[];
}

export default function PlanCuentas({ cuentas }: Props) {
    const [search, setSearch] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [expandedIds, setExpandedIds] = useState<number[]>([1, 2, 3, 4, 5, 100, 200, 300, 400, 500, 600]);

    const { data, setData, post, processing, reset, errors } = useForm({
        codigo: '',
        codigo_sat: '',
        nombre: '',
        tipo: 'activo',
        naturaleza: 'deudora',
        padre_id: '',
        nivel: 4,
    });

    const toggleExpand = (id: number) => {
        setExpandedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleCreateCuenta = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/contabilidad/plan-cuentas', {
            onSuccess: () => {
                setOpenModal(false);
                reset();
            },
        });
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Contabilidad', href: '#' },
        { title: 'Catálogo de Cuentas (SAT México)', href: '/admin/contabilidad/plan-cuentas' },
    ];

    const getTipoBadge = (tipo: string) => {
        switch (tipo) {
            case 'activo': return <Badge className="bg-emerald-600 text-white font-mono text-[10px]">ACTIVO</Badge>;
            case 'pasivo': return <Badge className="bg-amber-600 text-white font-mono text-[10px]">PASIVO</Badge>;
            case 'patrimonio': return <Badge className="bg-purple-600 text-white font-mono text-[10px]">PATRIMONIO</Badge>;
            case 'ingreso': return <Badge className="bg-blue-600 text-white font-mono text-[10px]">INGRESO</Badge>;
            case 'gasto': return <Badge className="bg-rose-600 text-white font-mono text-[10px]">GASTO</Badge>;
            case 'costo': return <Badge className="bg-slate-700 text-white font-mono text-[10px]">COSTO</Badge>;
            default: return <Badge variant="outline">{tipo}</Badge>;
        }
    };

    const renderCuentaRow = (cuenta: Cuenta, depth = 0) => {
        const hasSub = cuenta.subcuentas && cuenta.subcuentas.length > 0;
        const isExpanded = expandedIds.includes(cuenta.id);

        if (search && !cuenta.nombre.toLowerCase().includes(search.toLowerCase()) && !cuenta.codigo.includes(search) && !(cuenta.codigo_sat && cuenta.codigo_sat.includes(search))) {
            return null;
        }

        return (
            <React.Fragment key={cuenta.id}>
                <div
                    className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-mono transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 ${
                        cuenta.nivel === 1 ? 'font-bold bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 mt-2' : ''
                    }`}
                    style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
                >
                    <div className="flex items-center gap-2">
                        {hasSub ? (
                            <button
                                type="button"
                                onClick={() => toggleExpand(cuenta.id)}
                                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                            >
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                        ) : (
                            <span className="w-4" />
                        )}
                        {cuenta.acepta_movimiento ? (
                            <FileText className="w-3.5 h-3.5 text-blue-500" />
                        ) : (
                            <Folder className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{cuenta.codigo}</span>
                        {cuenta.codigo_sat && (
                            <Badge variant="outline" className="text-[10px] font-mono text-slate-500 border-slate-300 dark:border-slate-700">
                                SAT: {cuenta.codigo_sat}
                            </Badge>
                        )}
                        <span className="font-sans font-medium text-slate-800 dark:text-slate-200">{cuenta.nombre}</span>
                    </div>

                    <div className="flex items-center gap-3 font-sans">
                        {getTipoBadge(cuenta.tipo)}
                        <span className="text-[11px] text-muted-foreground capitalize">{cuenta.naturaleza}</span>
                        {cuenta.acepta_movimiento ? (
                            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">Movible</Badge>
                        ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-400">Grupo</Badge>
                        )}
                    </div>
                </div>

                {hasSub && isExpanded && cuenta.subcuentas?.map((sub) => renderCuentaRow(sub, depth + 1))}
            </React.Fragment>
        );
    };

    return (
        <>
            <Head title="Catálogo de Cuentas (SAT México)" />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <ModuleHeader
                        title="Catálogo de Cuentas (SAT México)"
                        description="Estructura contable oficial con Código Agrupador del SAT para la contabilización automática."
                        icon={<BookOpen className="w-6 h-6" />}
                    />

                    <Dialog open={openModal} onOpenChange={setOpenModal}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 font-bold gap-2 text-xs">
                                <Plus className="w-4 h-4" />
                                Nueva Subcuenta
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Crear Subcuenta Contable</DialogTitle>
                            </DialogHeader>

                            <form onSubmit={handleCreateCuenta} className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-xs">Código Contable</Label>
                                    <Input
                                        placeholder="Ej: 1.1.01.03"
                                        value={data.codigo}
                                        onChange={(e) => setData('codigo', e.target.value)}
                                        required
                                    />
                                    {errors.codigo && <span className="text-xs text-red-500">{errors.codigo}</span>}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Nombre de la Cuenta</Label>
                                    <Input
                                        placeholder="Ej: Caja Chica Taller"
                                        value={data.nombre}
                                        onChange={(e) => setData('nombre', e.target.value)}
                                        required
                                    />
                                    {errors.nombre && <span className="text-xs text-red-500">{errors.nombre}</span>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Tipo de Cuenta</Label>
                                        <Select value={data.tipo} onValueChange={(val) => setData('tipo', val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="activo">Activo</SelectItem>
                                                <SelectItem value="pasivo">Pasivo</SelectItem>
                                                <SelectItem value="patrimonio">Patrimonio</SelectItem>
                                                <SelectItem value="ingreso">Ingreso</SelectItem>
                                                <SelectItem value="gasto">Gasto</SelectItem>
                                                <SelectItem value="costo">Costo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs">Naturaleza</Label>
                                        <Select value={data.naturaleza} onValueChange={(val) => setData('naturaleza', val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="deudora">Deudora (Debe)</SelectItem>
                                                <SelectItem value="acreedora">Acreedora (Haber)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={processing} className="bg-blue-600 font-bold">Guardar</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="p-4 border-b">
                        <div className="flex items-center justify-between gap-4">
                            <CardTitle className="text-base font-bold">Catálogo de Cuentas</CardTitle>
                            <div className="relative w-64">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar código o nombre..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8 h-8 text-xs"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 divide-y divide-slate-100 dark:divide-slate-800">
                        {cuentas.map((c) => renderCuentaRow(c))}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
