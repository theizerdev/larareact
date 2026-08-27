import { Head, useForm, router } from '@inertiajs/react';
import { Wrench, Plus, CheckCircle, XCircle, MoreVertical, Pencil, Trash2, Tag, Layers } from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams, cn } from '@/lib/utils';
import type { Paginated } from '@/types/app';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface CategoriaItem {
    id: number;
    nombre: string;
}

interface Servicio {
    id: number;
    nombre: string;
    codigo: string | null;
    descripcion: string | null;
    precio: number;
    estado: boolean;
    categoria_id?: number | null;
    categoria?: CategoriaItem | null;
}

interface Props {
    servicios: Paginated<Servicio>;
    categorias?: CategoriaItem[];
    currencySymbol?: string;
    filters: {
        search?: string;
        status?: string;
        perPage?: string;
    };
}

export default function Index({ servicios, categorias = [], currencySymbol = '$', filters }: Props) {
    const { __ } = useTranslate();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);

    // Filtros
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '10');

    React.useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                window.location.pathname,
                cleanParams({ search: searchTerm, status: statusFilter, perPage: perPageFilter }),
                { preserveState: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, perPageFilter]);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Punto de Venta'), href: '#' },
        { title: __('Servicios'), href: '/admin/servicios' },
    ];

    const { data, setData, post, put, processing, errors, reset } = useForm({
        categoria_id: '',
        nombre: '',
        codigo: '',
        descripcion: '',
        precio: '0.00',
        estado: true,
    });

    const handleOpenCreate = () => {
        reset();
        setData({
            categoria_id: '',
            nombre: '',
            codigo: '',
            descripcion: '',
            precio: '0.00',
            estado: true,
        });
        setEditingServicio(null);
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (servicio: Servicio) => {
        setEditingServicio(servicio);
        setData({
            categoria_id: servicio.categoria_id ? String(servicio.categoria_id) : '',
            nombre: servicio.nombre,
            codigo: servicio.codigo || '',
            descripcion: servicio.descripcion || '',
            precio: String(servicio.precio ?? '0.00'),
            estado: servicio.estado,
        });
        setIsCreateOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingServicio) {
            put(`/admin/servicios/${editingServicio.id}`, {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                    notifySuccess(__('Servicio actualizado exitosamente.'));
                },
                onError: () => notifyError(__('Ocurrió un error al actualizar el servicio.')),
            });
        } else {
            post('/admin/servicios', {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                    notifySuccess(__('Servicio creado exitosamente.'));
                },
                onError: () => notifyError(__('Ocurrió un error al crear el servicio.')),
            });
        }
    };

    const handleDelete = (servicio: Servicio) => {
        if (confirm(__('¿Está seguro de eliminar este servicio?'))) {
            router.delete(`/admin/servicios/${servicio.id}`, {
                onSuccess: () => notifySuccess(__('Servicio eliminado exitosamente.')),
                onError: () => notifyError(__('Error al eliminar el servicio.')),
            });
        }
    };

    const columns: ColumnDef<Servicio>[] = [
        {
            header: __('Categoría'),
            accessorKey: 'categoria',
            cell: (servicio) => (
                servicio.categoria ? (
                    <span className="inline-flex items-center rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                        <Layers className="w-3 h-3 mr-1 text-purple-600" />
                        {servicio.categoria.nombre}
                    </span>
                ) : (
                    <span className="text-xs text-slate-400 italic">{__('Sin categoría')}</span>
                )
            ),
        },
        {
            header: __('Código'),
            accessorKey: 'codigo',
            cell: (servicio) => (
                <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {servicio.codigo || '-'}
                </span>
            ),
        },
        {
            header: __('Nombre del Servicio'),
            accessorKey: 'nombre',
            className: 'font-medium',
            cell: (servicio) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <p className="font-medium text-sm">{servicio.nombre}</p>
                        {servicio.descripcion && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">{servicio.descripcion}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: __('Estado'),
            stopRowClick: true,
            cell: (servicio) => (
                <span className={cn(
                    'text-xs font-medium px-2.5 py-0.5 rounded-full border',
                    servicio.estado
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                )}>
                    {servicio.estado ? __('Activo') : __('Inactivo')}
                </span>
            ),
        },
        {
            header: __('Acciones'),
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (servicio) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(servicio)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Editar')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(servicio)} className="text-rose-500 hover:text-rose-700">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {__('Eliminar')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const totalCount = servicios.total || 0;
    const activeCount = servicios.data.filter((s) => s.estado).length;
    const inactiveCount = servicios.data.filter((s) => !s.estado).length;

    return (
        <>
            <Head title={__('Catálogo de Servicios POS')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Wrench className="h-6 w-6 text-white" />}
                    title={__('Catálogo de Servicios')}
                    description={__('Administra los servicios ofrecidos en el Punto de Venta (diagnósticos, reparaciones, mantenimientos).')}
                    colorClassName="bg-amber-600"
                >
                    <Button onClick={handleOpenCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        {__('Nuevo Servicio')}
                    </Button>
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard
                        icon={<Wrench className="h-6 w-6" />}
                        title={__('TOTAL SERVICIOS')}
                        value={totalCount}
                        colorClassName="bg-amber-100 text-amber-600"
                    />
                    <StatCard
                        icon={<CheckCircle className="h-6 w-6" />}
                        title={__('SERVICIOS ACTIVOS')}
                        value={activeCount}
                        colorClassName="bg-emerald-100 text-emerald-600"
                    />
                    <StatCard
                        icon={<XCircle className="h-6 w-6" />}
                        title={__('INACTIVOS')}
                        value={inactiveCount}
                        colorClassName="bg-red-100 text-red-600"
                    />
                </div>

                {/* Filtros */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Buscar')}>
                            <Input
                                placeholder={__('Buscar por servicio, código...')}
                                className="w-full md:w-96"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Estado')}>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue placeholder={__('Todos')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('Todos')}</SelectItem>
                                    <SelectItem value="1">{__('Activos')}</SelectItem>
                                    <SelectItem value="0">{__('Inactivos')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                        <FilterField label={__('Registros por página')}>
                            <Select value={perPageFilter} onValueChange={setPerPageFilter}>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                    </div>
                </FilterBar>

                <DataTable
                    columns={columns}
                    data={servicios}
                />

                {/* Dialog Modal Crear / Editar Servicio */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingServicio ? __('Editar Servicio') : __('Nuevo Servicio')}</DialogTitle>
                            <DialogDescription>
                                {__('Ingrese los detalles del servicio ofrecido en el punto de venta.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            {/* SELECCIÓN DE CATEGORÍA */}
                            <div className="space-y-2">
                                <Label htmlFor="categoria_id">{__('Categoría de Dispositivo / Servicio *')}</Label>
                                <Select
                                    value={data.categoria_id}
                                    onValueChange={(val) => setData('categoria_id', val)}
                                >
                                    <SelectTrigger id="categoria_id" className="w-full">
                                        <SelectValue placeholder={__('Seleccionar Categoría...')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categorias && categorias.length > 0 ? (
                                            categorias.map((cat) => (
                                                <SelectItem key={cat.id} value={String(cat.id)}>
                                                    {cat.nombre}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>
                                                {__('No hay categorías registradas')}
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                {errors.categoria_id && <p className="text-xs text-rose-500">{errors.categoria_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nombre">{__('Nombre del Servicio *')}</Label>
                                <Input
                                    id="nombre"
                                    value={data.nombre}
                                    onChange={(e) => setData('nombre', e.target.value)}
                                    placeholder={__('Ej: Mantenimiento General, Cambio de Batería')}
                                    required
                                />
                                {errors.nombre && <p className="text-xs text-rose-500">{errors.nombre}</p>}
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <Label className="text-base">{__('Estado Activo')}</Label>
                                    <p className="text-xs text-muted-foreground">{__('Permite ofertar este servicio en el POS.')}</p>
                                </div>
                                <Switch
                                    checked={data.estado}
                                    onCheckedChange={(checked) => setData('estado', checked)}
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    {__('Cancelar')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {editingServicio ? __('Guardar Cambios') : __('Crear Servicio')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
