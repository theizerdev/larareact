import { Head, useForm, router } from '@inertiajs/react';
import {
    Cpu,
    Plus,
    Search,
    Filter,
    CheckCircle2,
    Edit2,
    Trash2,
    Smartphone,
    Layers,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { cleanParams } from '@/lib/utils';
import type { Paginated } from '@/types/app';

interface Marca {
    id: number;
    nombre: string;
}

interface Modelo {
    id: number;
    marca_id: number;
    nombre: string;
    almacenamiento?: string | null;
    ram?: string | null;
    procesador?: string | null;
    pantalla?: string | null;
    bateria?: string | null;
    descripcion?: string | null;
    activo: boolean;
    marca?: Marca;
    total_equipos?: number;
    disponibles_equipos?: number;
}

interface Props {
    modelos: Paginated<Modelo>;
    stats: {
        total: number;
        activos: number;
    };
    marcas: Marca[];
    filters: {
        search?: string;
        marca_id?: string;
        perPage?: number;
    };
}

export default function ModelosIndex({ modelos, stats, marcas, filters }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingModelo, setEditingModelo] = useState<Modelo | null>(null);

    const [search, setSearch] = useState(filters.search || '');
    const [marcaFilter, setMarcaFilter] = useState(filters.marca_id || 'all');

    const form = useForm({
        marca_id: '',
        nombre: '',
        almacenamiento: '128GB',
        ram: '8GB',
        procesador: '',
        pantalla: '',
        bateria: '5000mAh',
        descripcion: '',
        activo: true,
    });

    const handleFilterChange = (overrideParams = {}) => {
        const params = {
            search: search || undefined,
            marca_id: marcaFilter !== 'all' ? marcaFilter : undefined,
            ...overrideParams,
        };
        router.get(window.location.pathname, cleanParams(params), { preserveState: true, replace: true });
    };

    const openCreateModal = () => {
        setEditingModelo(null);
        form.reset();
        form.setData({
            marca_id: marcas[0]?.id?.toString() || '',
            nombre: '',
            almacenamiento: '128GB',
            ram: '8GB',
            procesador: '',
            pantalla: '',
            bateria: '5000mAh',
            descripcion: '',
            activo: true,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (modelo: Modelo) => {
        setEditingModelo(modelo);
        form.setData({
            marca_id: modelo.marca_id.toString(),
            nombre: modelo.nombre,
            almacenamiento: modelo.almacenamiento || '',
            ram: modelo.ram || '',
            procesador: modelo.procesador || '',
            pantalla: modelo.pantalla || '',
            bateria: modelo.bateria || '',
            descripcion: modelo.descripcion || '',
            activo: modelo.activo,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingModelo) {
            form.put(`/admin/catalogo/modelos/${editingModelo.id}`, {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            form.post('/admin/catalogo/modelos', {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const toggleStatus = (id: number) => {
        router.patch(`/admin/catalogo/modelos/${id}/toggle-status`);
    };

    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de eliminar este modelo?')) {
            router.delete(`/admin/catalogo/modelos/${id}`);
        }
    };

    const columns: ColumnDef<Modelo>[] = [
        {
            header: 'Marca & Modelo',
            accessorKey: 'nombre',
            sortable: true,
            cell: (m) => (
                <div className="font-medium">
                    <Badge variant="outline" className="text-[10px] uppercase mb-1">
                        {m.marca?.nombre}
                    </Badge>
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-base">
                        {m.nombre}
                    </div>
                </div>
            ),
        },
        {
            header: 'Memoria & Almacenamiento',
            cell: (m) => (
                <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {m.almacenamiento || 'N/D'}
                    </div>
                    <div className="text-xs text-slate-500">
                        RAM: {m.ram || 'N/D'}
                    </div>
                </div>
            ),
        },
        {
            header: 'Batería / Procesador',
            hideOn: 'mobile',
            cell: (m) => (
                <div className="text-xs text-slate-600 dark:text-slate-400">
                    <div>{m.bateria || 'Batería N/D'}</div>
                    <div>{m.procesador || 'Procesador N/D'}</div>
                </div>
            ),
        },
        {
            header: 'Stock en Tiendas',
            cell: (m) => (
                <div className="flex items-center gap-1.5 text-xs">
                    <Badge variant="secondary" className="font-mono">
                        {m.total_equipos || 0} total
                    </Badge>
                    <span className="text-emerald-600 font-semibold font-mono">
                        ({m.disponibles_equipos || 0} disp.)
                    </span>
                </div>
            ),
        },
        {
            header: 'Estado',
            cell: (m) => (
                <button
                    onClick={() => toggleStatus(m.id)}
                    className="inline-flex items-center gap-1 text-xs cursor-pointer"
                    title="Cambiar estado"
                >
                    {m.activo ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                            Activo
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-slate-400">
                            Inactivo
                        </Badge>
                    )}
                </button>
            ),
        },
        {
            header: 'Acciones',
            className: 'text-right',
            stopRowClick: true,
            cell: (m) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(m)}
                        className="h-8 w-8 p-0"
                    >
                        <Edit2 className="size-3.5" />
                    </Button>
                    {(!m.total_equipos || m.total_equipos === 0) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(m.id)}
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700"
                        >
                            <Trash2 className="size-3.5" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <Head title="Modelos de Teléfonos" />

            <Breadcrumbs
                breadcrumbs={[
                    { title: 'Dashboard', href: '/admin/dashboard' },
                    { title: 'Modelos de Teléfonos', href: '/admin/catalogo/modelos' },
                ]}
            />

            {/* Header */}
            <ModuleHeader
                icon={<Smartphone className="size-6 sm:size-7" />}
                title="Modelos de Teléfonos Móviles"
                description="Definición de especificaciones técnicas (capacidad, memoria RAM, procesador) de los equipos a comercializar."
                colorClassName="bg-indigo-700 dark:bg-indigo-800"
            >
                <Button onClick={openCreateModal} className="bg-white text-indigo-700 hover:bg-slate-100 font-semibold">
                    <Plus className="size-4 mr-1.5" /> Nuevo Modelo
                </Button>
            </ModuleHeader>

            {/* Métricas */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard
                    icon={<Layers className="size-5 text-indigo-600" />}
                    title="Total Modelos"
                    value={stats.total}
                    colorClassName="bg-indigo-50 dark:bg-indigo-950/40"
                />
                <StatCard
                    icon={<CheckCircle2 className="size-5 text-emerald-600" />}
                    title="Modelos Activos"
                    value={stats.activos}
                    colorClassName="bg-emerald-50 dark:bg-emerald-950/40"
                />
            </div>

            {/* Filtros */}
            <FilterBar>
                <div className="flex flex-1 flex-wrap items-center gap-3">
                    <div className="relative min-w-[240px] flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input
                            placeholder="Buscar modelo o especificación..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
                            className="pl-9 h-10"
                        />
                    </div>

                    <Select value={marcaFilter} onValueChange={(val) => { setMarcaFilter(val); handleFilterChange({ marca_id: val !== 'all' ? val : undefined }); }}>
                        <SelectTrigger className="w-full sm:w-[220px] md:w-[260px] h-10">
                            <SelectValue placeholder="Marca" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las marcas</SelectItem>
                            {marcas.map((m) => (
                                <SelectItem key={m.id} value={m.id.toString()}>{m.nombre}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="secondary" onClick={() => handleFilterChange()} className="h-10">
                        <Filter className="size-4 mr-1.5" /> Filtrar
                    </Button>
                </div>
            </FilterBar>

            {/* DataTable Reutilizable */}
            <DataTable
                data={modelos}
                columns={columns}
                filters={filters as any}
                emptyMessage="No se encontraron modelos registrados."
            />

            {/* Modal Crear / Editar Modelo */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-xl sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingModelo ? 'Editar Modelo de Teléfono' : 'Nuevo Modelo de Teléfono'}</DialogTitle>
                        <DialogDescription>
                            Registra las características técnicas del modelo para asociarlo a los IMEIs en inventario.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Marca del Teléfono *</Label>
                            <Select
                                value={form.data.marca_id}
                                onValueChange={(val) => form.setData('marca_id', val)}
                            >
                                <SelectTrigger className="w-full h-10">
                                    <SelectValue placeholder="Selecciona fabricante" />
                                </SelectTrigger>
                                <SelectContent>
                                    {marcas.map((m) => (
                                        <SelectItem key={m.id} value={m.id.toString()}>{m.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Nombre del Modelo *</Label>
                            <Input
                                required
                                placeholder="Ej. Galaxy A55 5G, Redmi Note 13, iPhone 15"
                                value={form.data.nombre}
                                onChange={(e) => form.setData('nombre', e.target.value)}
                            />
                            {form.errors.nombre && <p className="text-xs text-rose-500">{form.errors.nombre}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Almacenamiento (ROM)</Label>
                                <Input
                                    placeholder="Ej. 128GB, 256GB, 512GB"
                                    value={form.data.almacenamiento}
                                    onChange={(e) => form.setData('almacenamiento', e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Memoria RAM</Label>
                                <Input
                                    placeholder="Ej. 6GB, 8GB, 12GB"
                                    value={form.data.ram}
                                    onChange={(e) => form.setData('ram', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Batería</Label>
                                <Input
                                    placeholder="Ej. 5000 mAh"
                                    value={form.data.bateria}
                                    onChange={(e) => form.setData('bateria', e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Procesador</Label>
                                <Input
                                    placeholder="Ej. Snapdragon 7s Gen 2"
                                    value={form.data.procesador}
                                    onChange={(e) => form.setData('procesador', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Descripción / Notas</Label>
                            <Textarea
                                placeholder="Detalles de pantalla, cámaras o argumentos de venta..."
                                value={form.data.descripcion}
                                onChange={(e) => form.setData('descripcion', e.target.value)}
                                rows={2}
                            />
                        </div>

                        <DialogFooter className="pt-3 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.processing} className="bg-indigo-700 hover:bg-indigo-800 text-white">
                                {form.processing ? 'Guardando...' : 'Guardar Modelo'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
