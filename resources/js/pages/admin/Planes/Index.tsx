import { Head, useForm, router } from '@inertiajs/react';
import {
    CalendarDays,
    Plus,
    CheckCircle2,
    Clock,
    Percent,
    Sliders,
    Edit2,
    Trash2,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Paginated } from '@/types/app';

interface Plan {
    id: number;
    nombre: string;
    descripcion?: string | null;
    frecuencia: 'semanal' | 'quincenal' | 'mensual';
    numero_cuotas: number;
    porcentaje_inicial_minimo: string | number;
    porcentaje_interes_total: string | number;
    dias_gracia: number;
    mora_diaria_porcentaje: string | number;
    activo: boolean;
    creditos_count?: number;
}

interface Props {
    planes: Paginated<Plan>;
    stats: {
        total: number;
        activos: number;
    };
    filters: {
        search?: string;
        frecuencia?: string;
        perPage?: number;
    };
}

export default function PlanesIndex({ planes, stats }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    const form = useForm({
        nombre: '',
        descripcion: '',
        frecuencia: 'quincenal',
        numero_cuotas: '4',
        porcentaje_inicial_minimo: '30.00',
        porcentaje_interes_total: '15.00',
        dias_gracia: '2',
        mora_diaria_porcentaje: '0.50',
        activo: true,
    });

    const openCreateModal = () => {
        setEditingPlan(null);
        form.reset();
        form.setData({
            nombre: '',
            descripcion: '',
            frecuencia: 'quincenal',
            numero_cuotas: '4',
            porcentaje_inicial_minimo: '30.00',
            porcentaje_interes_total: '15.00',
            dias_gracia: '2',
            mora_diaria_porcentaje: '0.50',
            activo: true,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (plan: Plan) => {
        setEditingPlan(plan);
        form.setData({
            nombre: plan.nombre,
            descripcion: plan.descripcion || '',
            frecuencia: plan.frecuencia,
            numero_cuotas: plan.numero_cuotas.toString(),
            porcentaje_inicial_minimo: plan.porcentaje_inicial_minimo.toString(),
            porcentaje_interes_total: plan.porcentaje_interes_total.toString(),
            dias_gracia: plan.dias_gracia.toString(),
            mora_diaria_porcentaje: plan.mora_diaria_porcentaje.toString(),
            activo: plan.activo,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPlan) {
            form.put(`/admin/planes-financiamiento/${editingPlan.id}`, {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            form.post('/admin/planes-financiamiento', {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const toggleStatus = (id: number) => {
        router.patch(`/admin/planes-financiamiento/${id}/toggle-status`);
    };

    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de eliminar este plan?')) {
            router.delete(`/admin/planes-financiamiento/${id}`);
        }
    };

    return (
        <div className="space-y-6">
            <Head title="Planes de Financiamiento" />

            <Breadcrumbs
                breadcrumbs={[
                    { title: 'Dashboard', href: '/admin/dashboard' },
                    { title: 'Planes de Financiamiento', href: '/admin/planes-financiamiento' },
                ]}
            />

            {/* Header */}
            <ModuleHeader
                icon={<CalendarDays className="size-6 sm:size-7" />}
                title="Planes de Financiamiento & Cuotas"
                description="Configuración de políticas de financiamiento, periodicidad, porcentaje de enganche inicial e intereses aplicables."
                colorClassName="bg-purple-700 dark:bg-purple-800"
            >
                <Button onClick={openCreateModal} className="bg-white text-purple-700 hover:bg-slate-100 font-semibold">
                    <Plus className="size-4 mr-1.5" /> Nuevo Plan
                </Button>
            </ModuleHeader>

            {/* Métricas */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard
                    icon={<Sliders className="size-5 text-purple-600" />}
                    title="Total de Planes"
                    value={stats.total}
                    colorClassName="bg-purple-50 dark:bg-purple-950/40"
                />
                <StatCard
                    icon={<CheckCircle2 className="size-5 text-emerald-600" />}
                    title="Planes Activos"
                    value={stats.activos}
                    colorClassName="bg-emerald-50 dark:bg-emerald-950/40"
                />
            </div>

            {/* Grid de Planes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {planes.data.map((p) => (
                    <Card key={p.id} className="flex flex-col justify-between border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
                        <div>
                            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                                <div>
                                    <Badge variant="outline" className="capitalize text-xs mb-2">
                                        Cobro {p.frecuencia}
                                    </Badge>
                                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                        {p.nombre}
                                    </CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleStatus(p.id)}
                                    className="h-8 w-8 p-0"
                                    title={p.activo ? 'Desactivar plan' : 'Activar plan'}
                                >
                                    {p.activo ? (
                                        <ToggleRight className="size-6 text-emerald-600" />
                                    ) : (
                                        <ToggleLeft className="size-6 text-slate-400" />
                                    )}
                                </Button>
                            </CardHeader>

                            <CardContent className="space-y-3 text-sm">
                                <p className="text-xs text-slate-500 min-h-[32px]">
                                    {p.descripcion || 'Sin descripción.'}
                                </p>

                                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Cantidad de Cuotas:</span>
                                        <span className="font-bold text-slate-900 dark:text-slate-100">
                                            {p.numero_cuotas} cuotas
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Inicial Mínima:</span>
                                        <span className="font-bold text-blue-600 dark:text-blue-400">
                                            {p.porcentaje_inicial_minimo}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Recargo / Interés:</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                            +{p.porcentaje_interes_total}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Días de Gracia:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                            {p.dias_gracia} días
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Mora Diaria:</span>
                                        <span className="font-medium text-rose-600">
                                            {p.mora_diaria_porcentaje}% / día
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </div>

                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                            <span>{p.creditos_count || 0} créditos generados</span>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditModal(p)}
                                    className="h-7 px-2 text-xs"
                                >
                                    <Edit2 className="size-3 mr-1" /> Editar
                                </Button>
                                {(!p.creditos_count || p.creditos_count === 0) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(p.id)}
                                        className="h-7 px-2 text-xs text-rose-500 hover:text-rose-700"
                                    >
                                        <Trash2 className="size-3 mr-1" /> Eliminar
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Modal para Crear / Editar Plan */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-xl sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? 'Editar Plan de Financiamiento' : 'Nuevo Plan de Financiamiento'}</DialogTitle>
                        <DialogDescription>
                            Define las cuotas, porcentaje de enganche y reglas de interés de este esquema comercial.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Nombre del Plan *</Label>
                            <Input
                                required
                                placeholder="Ej. Plan 4 Quincenas - 30% Inicial"
                                value={form.data.nombre}
                                onChange={(e) => form.setData('nombre', e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Descripción Breve</Label>
                            <Textarea
                                placeholder="Condiciones comerciales o detalles para el cliente..."
                                value={form.data.descripcion}
                                onChange={(e) => form.setData('descripcion', e.target.value)}
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Frecuencia de Pago *</Label>
                                <Select
                                    value={form.data.frecuencia}
                                    onValueChange={(val: any) => form.setData('frecuencia', val)}
                                >
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="semanal">Semanal</SelectItem>
                                        <SelectItem value="quincenal">Quincenal</SelectItem>
                                        <SelectItem value="mensual">Mensual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Número de Cuotas *</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="60"
                                    required
                                    value={form.data.numero_cuotas}
                                    onChange={(e) => form.setData('numero_cuotas', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <div className="space-y-1.5">
                                <Label className="text-blue-700 dark:text-blue-400 font-bold">% Inicial Mínima *</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="99"
                                        required
                                        value={form.data.porcentaje_inicial_minimo}
                                        onChange={(e) => form.setData('porcentaje_inicial_minimo', e.target.value)}
                                        className="pr-7 font-bold text-blue-700 dark:text-blue-400"
                                    />
                                    <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-emerald-700 dark:text-emerald-400 font-bold">% Interés Financiero *</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        required
                                        value={form.data.porcentaje_interes_total}
                                        onChange={(e) => form.setData('porcentaje_interes_total', e.target.value)}
                                        className="pr-7 font-bold text-emerald-700 dark:text-emerald-400"
                                    />
                                    <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Días de Gracia</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="30"
                                    required
                                    value={form.data.dias_gracia}
                                    onChange={(e) => form.setData('dias_gracia', e.target.value)}
                                />
                                <p className="text-[11px] text-slate-400">Días sin cobrar mora tras el vencimiento.</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label>% Mora Diaria</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="10"
                                    required
                                    value={form.data.mora_diaria_porcentaje}
                                    onChange={(e) => form.setData('mora_diaria_porcentaje', e.target.value)}
                                />
                                <p className="text-[11px] text-slate-400">Porcentaje diario sobre la cuota vencida.</p>
                            </div>
                        </div>

                        <DialogFooter className="pt-3 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.processing} className="bg-purple-700 hover:bg-purple-800 text-white">
                                {form.processing ? 'Guardando...' : 'Guardar Plan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

