import { Head, useForm, router, usePage } from '@inertiajs/react';
import {
    Smartphone,
    Plus,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    AlertTriangle,
    ShieldAlert,
    Copy,
    Edit2,
    Trash2,
    Check,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { FilterBar } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { cleanParams, cn } from '@/lib/utils';
import type { Paginated } from '@/types/app';

interface Marca {
    id: number;
    nombre: string;
}

interface Modelo {
    id: number;
    marca_id: number;
    nombre: string;
    almacenamiento?: string;
    ram?: string;
    marca?: Marca;
}

interface Sucursal {
    id: number;
    nombre: string;
}

interface Equipo {
    id: number;
    sucursal_id: number;
    modelo_equipo_id: number;
    imei_1: string;
    imei_2?: string | null;
    serial?: string | null;
    color?: string | null;
    condicion: 'nuevo' | 'usado' | 'reacondicionado';
    costo_compra: string | number;
    precio_contado: string | number;
    precio_financiado: string | number;
    estado: 'disponible' | 'reservado' | 'vendido_credito' | 'vendido_contado' | 'bloqueado' | 'garantia';
    observaciones?: string | null;
    modelo?: Modelo;
    sucursal?: Sucursal;
}

interface Props {
    equipos: Paginated<Equipo>;
    stats: {
        total: number;
        disponibles: number;
        vendidos_credito: number;
        en_garantia: number;
    };
    marcas: Marca[];
    modelos: Modelo[];
    sucursales: Sucursal[];
    filters: {
        search?: string;
        estado?: string;
        sucursal_id?: string;
        marca_id?: string;
        perPage?: number;
    };
}

export default function InventarioIndex({
    equipos,
    stats,
    marcas,
    modelos,
    sucursales,
    filters,
}: Props) {
    const { regional_config } = usePage().props as any;
    const currency = regional_config?.currency_symbol || '$';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEquipo, setEditingEquipo] = useState<Equipo | null>(null);
    const [copiedImei, setCopiedImei] = useState<string | null>(null);

    // Formulario de filtros
    const [search, setSearch] = useState(filters.search || '');
    const [estadoFilter, setEstadoFilter] = useState(filters.estado || 'all');
    const [sucursalFilter, setSucursalFilter] = useState(filters.sucursal_id || 'all');
    const [marcaFilter, setMarcaFilter] = useState(filters.marca_id || 'all');

    // Formulario de crear / editar equipo
    const form = useForm({
        sucursal_id: '',
        modelo_equipo_id: '',
        imei_1: '',
        imei_2: '',
        serial: '',
        color: '',
        condicion: 'nuevo',
        costo_compra: '',
        precio_contado: '',
        precio_financiado: '',
        estado: 'disponible',
        observaciones: '',
    });

    const handleFilterChange = (overrideParams = {}) => {
        const params = {
            search: search || undefined,
            estado: estadoFilter !== 'all' ? estadoFilter : undefined,
            sucursal_id: sucursalFilter !== 'all' ? sucursalFilter : undefined,
            marca_id: marcaFilter !== 'all' ? marcaFilter : undefined,
            ...overrideParams,
        };
        router.get(window.location.pathname, cleanParams(params), { preserveState: true, replace: true });
    };

    const openCreateModal = () => {
        setEditingEquipo(null);
        form.reset();
        form.setData({
            sucursal_id: sucursales[0]?.id?.toString() || '',
            modelo_equipo_id: modelos[0]?.id?.toString() || '',
            imei_1: '',
            imei_2: '',
            serial: '',
            color: '',
            condicion: 'nuevo',
            costo_compra: '',
            precio_contado: '',
            precio_financiado: '',
            estado: 'disponible',
            observaciones: '',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (equipo: Equipo) => {
        setEditingEquipo(equipo);
        form.setData({
            sucursal_id: equipo.sucursal_id.toString(),
            modelo_equipo_id: equipo.modelo_equipo_id.toString(),
            imei_1: equipo.imei_1,
            imei_2: equipo.imei_2 || '',
            serial: equipo.serial || '',
            color: equipo.color || '',
            condicion: equipo.condicion,
            costo_compra: equipo.costo_compra.toString(),
            precio_contado: equipo.precio_contado.toString(),
            precio_financiado: equipo.precio_financiado.toString(),
            estado: equipo.estado,
            observaciones: equipo.observaciones || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingEquipo) {
            form.put(`/admin/inventario/equipos/${editingEquipo.id}`, {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            form.post('/admin/inventario/equipos', {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de eliminar este equipo del inventario?')) {
            router.delete(`/admin/inventario/equipos/${id}`);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedImei(text);
        setTimeout(() => setCopiedImei(null), 2000);
    };

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'disponible':
                return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">Disponible</Badge>;
            case 'vendido_credito':
                return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20">Vendido a Crédito</Badge>;
            case 'vendido_contado':
                return <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/20">Vendido de Contado</Badge>;
            case 'reservado':
                return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20">Reservado</Badge>;
            case 'bloqueado':
                return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20">Bloqueado (Mora)</Badge>;
            case 'garantia':
                return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20">En Garantía</Badge>;
            default:
                return <Badge variant="outline">{estado}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <Head title="Inventario de Teléfonos (IMEI)" />

            <Breadcrumbs
                breadcrumbs={[
                    { title: 'Dashboard', href: '/admin/dashboard' },
                    { title: 'Inventario de Equipos', href: '/admin/inventario/equipos' },
                ]}
            />

            {/* Header */}
            <ModuleHeader
                icon={<Smartphone className="size-6 sm:size-7" />}
                title="Inventario de Teléfonos por IMEI"
                description="Control individualizado de dispositivos móviles, trazabilidad por IMEI 1/2 y asignación a ventas financiadas."
                colorClassName="bg-slate-900 dark:bg-slate-800"
            >
                <Button onClick={openCreateModal} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                    <Plus className="size-4 mr-1.5" /> Registrar Equipo
                </Button>
            </ModuleHeader>

            {/* Métricas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Smartphone className="size-5 text-blue-600" />}
                    title="Total Equipos"
                    value={stats.total}
                    colorClassName="bg-blue-50 dark:bg-blue-950/40"
                />
                <StatCard
                    icon={<CheckCircle2 className="size-5 text-emerald-600" />}
                    title="Disponibles"
                    value={stats.disponibles}
                    colorClassName="bg-emerald-50 dark:bg-emerald-950/40"
                />
                <StatCard
                    icon={<Clock className="size-5 text-indigo-600" />}
                    title="En Financiamiento"
                    value={stats.vendidos_credito}
                    colorClassName="bg-indigo-50 dark:bg-indigo-950/40"
                />
                <StatCard
                    icon={<ShieldAlert className="size-5 text-amber-600" />}
                    title="En Garantía / Otros"
                    value={stats.en_garantia}
                    colorClassName="bg-amber-50 dark:bg-amber-950/40"
                />
            </div>

            {/* Filtros */}
            <FilterBar>
                <div className="flex flex-1 flex-wrap items-center gap-3">
                    <div className="relative min-w-[240px] flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por IMEI, serial o modelo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
                            className="pl-9 h-10"
                        />
                    </div>

                    <Select value={estadoFilter} onValueChange={(val) => { setEstadoFilter(val); handleFilterChange({ estado: val !== 'all' ? val : undefined }); }}>
                        <SelectTrigger className="w-[180px] h-10">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="disponible">Disponible</SelectItem>
                            <SelectItem value="vendido_credito">Vendido a Crédito</SelectItem>
                            <SelectItem value="vendido_contado">Vendido Contado</SelectItem>
                            <SelectItem value="reservado">Reservado</SelectItem>
                            <SelectItem value="bloqueado">Bloqueado</SelectItem>
                            <SelectItem value="garantia">Garantía</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sucursalFilter} onValueChange={(val) => { setSucursalFilter(val); handleFilterChange({ sucursal_id: val !== 'all' ? val : undefined }); }}>
                        <SelectTrigger className="w-[180px] h-10">
                            <SelectValue placeholder="Sucursal" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las tiendas</SelectItem>
                            {sucursales.map((s) => (
                                <SelectItem key={s.id} value={s.id.toString()}>{s.nombre}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="secondary" onClick={() => handleFilterChange()} className="h-10">
                        <Filter className="size-4 mr-1.5" /> Filtrar
                    </Button>
                </div>
            </FilterBar>

            {/* Tabla de Equipos */}
            <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-3.5">Dispositivo</th>
                                <th className="px-4 py-3.5">IMEI 1 / 2</th>
                                <th className="px-4 py-3.5">Sucursal</th>
                                <th className="px-4 py-3.5">Condición</th>
                                <th className="px-4 py-3.5">P. Contado</th>
                                <th className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100">P. Financiado</th>
                                <th className="px-4 py-3.5">Estado</th>
                                <th className="px-4 py-3.5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {equipos.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                        <Smartphone className="size-8 mx-auto text-slate-300 mb-2" />
                                        No se encontraron equipos registrados con los criterios seleccionados.
                                    </td>
                                </tr>
                            ) : (
                                equipos.data.map((eq) => (
                                    <tr key={eq.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                        <td className="px-4 py-3 font-medium">
                                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                {eq.modelo?.marca?.nombre} {eq.modelo?.nombre}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {eq.modelo?.almacenamiento} • {eq.color || 'Sin color'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                <span>{eq.imei_1}</span>
                                                <button
                                                    onClick={() => copyToClipboard(eq.imei_1)}
                                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                    title="Copiar IMEI"
                                                >
                                                    {copiedImei === eq.imei_1 ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                                                </button>
                                            </div>
                                            {eq.imei_2 && (
                                                <div className="text-[11px] font-mono text-slate-400">
                                                    IMEI 2: {eq.imei_2}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                                            {eq.sucursal?.nombre || 'General'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="capitalize text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                {eq.condicion}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                            {currency}{Number(eq.precio_contado).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                                            {currency}{Number(eq.precio_financiado).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getEstadoBadge(eq.estado)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditModal(eq)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Edit2 className="size-3.5" />
                                                </Button>
                                                {eq.estado !== 'vendido_credito' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(eq.id)}
                                                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal para Crear / Editar Equipo */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingEquipo ? 'Editar Equipo Móvil' : 'Registrar Equipo por IMEI'}</DialogTitle>
                        <DialogDescription>
                            Ingresa los números de identificación física del teléfono y sus parámetros comerciales.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Sucursal / Tienda *</Label>
                                <Select
                                    value={form.data.sucursal_id}
                                    onValueChange={(val) => form.setData('sucursal_id', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar tienda" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sucursales.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>{s.nombre}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Modelo del Teléfono *</Label>
                                <Select
                                    value={form.data.modelo_equipo_id}
                                    onValueChange={(val) => form.setData('modelo_equipo_id', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar modelo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {modelos.map((m) => (
                                            <SelectItem key={m.id} value={m.id.toString()}>
                                                {m.marca?.nombre} {m.nombre} ({m.almacenamiento})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>IMEI 1 (Principal) *</Label>
                                <Input
                                    required
                                    placeholder="Ej. 864234051234567"
                                    value={form.data.imei_1}
                                    onChange={(e) => form.setData('imei_1', e.target.value)}
                                    maxLength={18}
                                    className="font-mono"
                                />
                                {form.errors.imei_1 && <p className="text-xs text-rose-500">{form.errors.imei_1}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label>IMEI 2 (Secundario / Dual SIM)</Label>
                                <Input
                                    placeholder="Opcional"
                                    value={form.data.imei_2}
                                    onChange={(e) => form.setData('imei_2', e.target.value)}
                                    maxLength={18}
                                    className="font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label>Color</Label>
                                <Input
                                    placeholder="Ej. Negro, Azul"
                                    value={form.data.color}
                                    onChange={(e) => form.setData('color', e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Condición</Label>
                                <Select
                                    value={form.data.condicion}
                                    onValueChange={(val: any) => form.setData('condicion', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="nuevo">Nuevo</SelectItem>
                                        <SelectItem value="usado">Usado</SelectItem>
                                        <SelectItem value="reacondicionado">Reacondicionado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Costo de Compra ({currency})</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="0.00"
                                    value={form.data.costo_compra}
                                    onChange={(e) => form.setData('costo_compra', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <div className="space-y-1.5">
                                <Label>Precio de Contado ({currency}) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="Ej. 180.00"
                                    value={form.data.precio_contado}
                                    onChange={(e) => form.setData('precio_contado', e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="font-bold text-emerald-700 dark:text-emerald-400">
                                    Precio Financiado ({currency}) *
                                </Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="Ej. 220.00"
                                    value={form.data.precio_financiado}
                                    onChange={(e) => form.setData('precio_financiado', e.target.value)}
                                    className="font-bold text-emerald-700 dark:text-emerald-400"
                                />
                                <p className="text-[11px] text-slate-500">Monto base sobre el que se calculan las cuotas a crédito.</p>
                            </div>
                        </div>

                        {editingEquipo && (
                            <div className="space-y-1.5">
                                <Label>Estado del Equipo</Label>
                                <Select
                                    value={form.data.estado}
                                    onValueChange={(val: any) => form.setData('estado', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="disponible">Disponible</SelectItem>
                                        <SelectItem value="reservado">Reservado</SelectItem>
                                        <SelectItem value="vendido_credito">Vendido a Crédito</SelectItem>
                                        <SelectItem value="vendido_contado">Vendido de Contado</SelectItem>
                                        <SelectItem value="bloqueado">Bloqueado</SelectItem>
                                        <SelectItem value="garantia">Garantía</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label>Observaciones / Detalles</Label>
                            <Textarea
                                placeholder="Notas internas, número de factura de compra, etc."
                                value={form.data.observaciones}
                                onChange={(e) => form.setData('observaciones', e.target.value)}
                                rows={2}
                            />
                        </div>

                        <DialogFooter className="pt-3 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.processing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                {form.processing ? 'Guardando...' : 'Guardar Equipo'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

