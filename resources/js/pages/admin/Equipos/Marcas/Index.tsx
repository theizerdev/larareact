import { Head, useForm, router } from '@inertiajs/react';
import { Tag, Plus, CheckCircle, XCircle, MoreVertical, Pencil, Trash2 } from 'lucide-react';
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
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams, cn } from '@/lib/utils';
import type { Paginated } from '@/types/app';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface Marca {
    id: number;
    nombre: string;
    slug: string;
    logo_url?: string;
    estado: boolean;
    familias_count?: number;
    modelos_count?: number;
}

interface Props {
    marcas: Paginated<Marca>;
    filters: {
        search?: string;
        status?: string;
        perPage?: string;
    };
}

export default function Index({ marcas, filters }: Props) {
    const { __ } = useTranslate();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingMarca, setEditingMarca] = useState<Marca | null>(null);

    // Filtros
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '10');

    // Debounce de filtros
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
        { title: __('Equipos'), href: '#' },
        { title: __('Marcas'), href: '/admin/marcas' },
    ];

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nombre: '',
        logo_url: '',
        estado: true,
    });

    const handleOpenCreate = () => {
        reset();
        setEditingMarca(null);
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (marca: Marca) => {
        setEditingMarca(marca);
        setData({
            nombre: marca.nombre,
            logo_url: marca.logo_url || '',
            estado: marca.estado,
        });
        setIsCreateOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMarca) {
            put(`/admin/marcas/${editingMarca.id}`, {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                    notifySuccess(__('Brand updated successfully.'));
                },
                onError: () => notifyError(__('There was an error updating the brand.')),
            });
        } else {
            post('/admin/marcas', {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                    notifySuccess(__('Brand created successfully.'));
                },
                onError: () => notifyError(__('There was an error creating the brand.')),
            });
        }
    };

    const handleDelete = (marca: Marca) => {
        if (confirm(__('Are you sure you want to delete this brand?'))) {
            router.delete(`/admin/marcas/${marca.id}`, {
                onSuccess: () => notifySuccess(__('Brand deleted successfully.')),
                onError: () => notifyError(__('Error deleting brand.')),
            });
        }
    };

    const columns: ColumnDef<Marca>[] = [
        {
            header: __('Marca'),
            accessorKey: 'nombre',
            className: 'font-medium',
            cell: (marca) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <p className="font-medium text-sm">{marca.nombre}</p>
                        <p className="text-xs text-muted-foreground">/{marca.slug}</p>
                    </div>
                </div>
            ),
        },
        {
            header: __('Familias'),
            accessorKey: 'familias_count',
            cell: (marca) => (
                <span className="inline-flex items-center rounded-md bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    {marca.familias_count || 0} familias
                </span>
            ),
        },
        {
            header: __('Modelos Total'),
            accessorKey: 'modelos_count',
            cell: (marca) => (
                <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {marca.modelos_count || 0} modelos
                </span>
            ),
        },
        {
            header: __('Estado'),
            stopRowClick: true,
            cell: (marca) => (
                <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full border',
                    marca.estado
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                )}>
                    {marca.estado ? __('Activa') : __('Inactiva')}
                </span>
            ),
        },
        {
            header: __('Acciones'),
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (marca) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(marca)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Editar')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(marca)} className="text-rose-500 hover:text-rose-700">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {__('Eliminar')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    // Cálculos de Stats
    const totalCount = marcas.total || 0;
    const activeCount = marcas.data.filter((m) => m.estado).length;
    const inactiveCount = marcas.data.filter((m) => !m.estado).length;

    return (
        <>
            <Head title={__('Marcas de Dispositivos')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Tag className="h-6 w-6 text-white" />}
                    title={__('Marcas de Dispositivos')}
                    description={__('Administra los fabricantes de dispositivos (Apple, Samsung, Xiaomi, etc.).')}
                    colorClassName="bg-purple-600"
                >
                    <Button onClick={handleOpenCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        {__('Nueva Marca')}
                    </Button>
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard
                        icon={<Tag className="h-6 w-6" />}
                        title={__('TOTAL MARCAS')}
                        value={totalCount}
                        colorClassName="bg-purple-100 text-purple-600"
                    />
                    <StatCard
                        icon={<CheckCircle className="h-6 w-6" />}
                        title={__('ACTIVAS')}
                        value={activeCount}
                        colorClassName="bg-green-100 text-green-600"
                    />
                    <StatCard
                        icon={<XCircle className="h-6 w-6" />}
                        title={__('INACTIVAS')}
                        value={inactiveCount}
                        colorClassName="bg-red-100 text-red-600"
                    />
                </div>

                {/* Filtros */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Buscar')}>
                            <Input
                                placeholder={__('Buscar marca...')}
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
                    data={marcas}
                />

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingMarca ? __('Editar Marca') : __('Nueva Marca')}</DialogTitle>
                            <DialogDescription>
                                {__('Ingrese el nombre del fabricante o marca comercial.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">{__('Nombre de la Marca')}</Label>
                                <Input
                                    id="nombre"
                                    value={data.nombre}
                                    onChange={(e) => setData('nombre', e.target.value)}
                                    placeholder="Ej: Apple, Samsung, Xiaomi"
                                    required
                                />
                                {errors.nombre && <p className="text-xs text-rose-500">{errors.nombre}</p>}
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <Label className="text-base">{__('Estado Activo')}</Label>
                                    <p className="text-xs text-muted-foreground">{__('Habilita esta marca en el catálogo.')}</p>
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
                                    {editingMarca ? __('Guardar Cambios') : __('Crear Marca')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
