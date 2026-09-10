import { Head, useForm, router } from '@inertiajs/react';
import {
    Tag,
    Plus,
    Search,
    CheckCircle2,
    Edit2,
    Trash2,
    Smartphone,
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
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams } from '@/lib/utils';
import type { Paginated } from '@/types/app';

interface Marca {
    id: number;
    nombre: string;
    slug: string;
    logo?: string | null;
    activo: boolean;
    modelos_count?: number;
}

interface Props {
    marcas: Paginated<Marca>;
    stats: {
        total: number;
        activas: number;
    };
    filters: {
        search?: string;
        perPage?: number;
    };
}

export default function MarcasIndex({ marcas, stats, filters }: Props) {
    const { __ } = useTranslate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMarca, setEditingMarca] = useState<Marca | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const form = useForm({
        nombre: '',
        activo: true,
    });

    const handleSearch = () => {
        router.get(window.location.pathname, cleanParams({ search: search || undefined }), {
            preserveState: true,
            replace: true,
        });
    };

    const openCreateModal = () => {
        setEditingMarca(null);
        form.reset();
        form.setData({ nombre: '', activo: true });
        setIsModalOpen(true);
    };

    const openEditModal = (marca: Marca) => {
        setEditingMarca(marca);
        form.setData({
            nombre: marca.nombre,
            activo: marca.activo,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMarca) {
            form.put(`/admin/catalogo/marcas/${editingMarca.id}`, {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            form.post('/admin/catalogo/marcas', {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const toggleStatus = (id: number) => {
        router.patch(`/admin/catalogo/marcas/${id}/toggle-status`);
    };

    const handleDelete = (id: number) => {
        if (confirm(__('¿Estás seguro de eliminar esta marca?'))) {
            router.delete(`/admin/catalogo/marcas/${id}`);
        }
    };

    const columns: ColumnDef<Marca>[] = [
        {
            header: __('Nombre de la Marca'),
            accessorKey: 'nombre',
            sortable: true,
            cell: (m) => (
                <span className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    {m.nombre}
                </span>
            ),
        },
        {
            header: __('Slug / Código'),
            accessorKey: 'slug',
            sortable: true,
            cell: (m) => (
                <span className="font-mono text-xs text-slate-500">
                    {m.slug}
                </span>
            ),
        },
        {
            header: __('Modelos Registrados'),
            cell: (m) => (
                <Badge variant="outline" className="font-mono gap-1">
                    <Smartphone className="size-3" /> {m.modelos_count || 0} {__('modelos')}
                </Badge>
            ),
        },
        {
            header: __('Estado'),
            cell: (m) => (
                <button
                    onClick={() => toggleStatus(m.id)}
                    className="inline-flex items-center gap-1 text-xs cursor-pointer"
                    title={__('Cambiar estado')}
                >
                    {m.activo ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                            {__('Activa')}
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-slate-400">
                            {__('Inactiva')}
                        </Badge>
                    )}
                </button>
            ),
        },
        {
            header: __('Acciones'),
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
                    {(!m.modelos_count || m.modelos_count === 0) && (
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
            <Head title={__('Catálogo de Marcas')} />

            <Breadcrumbs
                breadcrumbs={[
                    { title: __('Dashboard'), href: '/admin/dashboard' },
                    { title: __('Marcas de Teléfonos'), href: '/admin/catalogo/marcas' },
                ]}
            />

            {/* Header */}
            <ModuleHeader
                icon={<Tag className="size-6 sm:size-7" />}
                title={__('Marcas de Dispositivos Móviles')}
                description={__('Catálogo de fabricantes autorizados y marcas de teléfonos para control de modelos e inventario.')}
                colorClassName="bg-slate-800 dark:bg-slate-900"
            >
                <Button onClick={openCreateModal} className="bg-white text-slate-900 hover:bg-slate-100 font-semibold">
                    <Plus className="size-4 mr-1.5" /> {__('Nueva Marca')}
                </Button>
            </ModuleHeader>

            {/* Métricas */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard
                    icon={<Tag className="size-5 text-blue-600" />}
                    title={__('Total Marcas')}
                    value={stats.total}
                    colorClassName="bg-blue-50 dark:bg-blue-950/40"
                />
                <StatCard
                    icon={<CheckCircle2 className="size-5 text-emerald-600" />}
                    title={__('Marcas Activas')}
                    value={stats.activas}
                    colorClassName="bg-emerald-50 dark:bg-emerald-950/40"
                />
            </div>

            {/* Filtros */}
            <FilterBar>
                <div className="flex flex-1 items-center gap-3">
                    <div className="relative min-w-[240px] flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input
                            placeholder={__('Buscar marca por nombre...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="pl-9 h-10"
                        />
                    </div>
                    <Button variant="secondary" onClick={handleSearch} className="h-10">
                        {__('Buscar')}
                    </Button>
                </div>
            </FilterBar>

            {/* DataTable Reutilizable */}
            <DataTable
                data={marcas}
                columns={columns}
                filters={filters as any}
                emptyMessage={__('No se encontraron marcas registradas.')}
            />

            {/* Modal Crear / Editar Marca */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-xl sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingMarca ? __('Editar Marca') : __('Nueva Marca de Teléfono')}</DialogTitle>
                        <DialogDescription>
                            {__('Ingresa el nombre comercial del fabricante para agrupar modelos.')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>{__('Nombre de la Marca')} *</Label>
                            <Input
                                required
                                placeholder={__('Ej. Samsung, Apple, Xiaomi, Motorola')}
                                value={form.data.nombre}
                                onChange={(e) => form.setData('nombre', e.target.value)}
                            />
                            {form.errors.nombre && <p className="text-xs text-rose-500">{form.errors.nombre}</p>}
                        </div>

                        <DialogFooter className="pt-3 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                {__('Cancelar')}
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? __('Guardando...') : __('Guardar Marca')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
