import { Head, useForm, router } from '@inertiajs/react';
import { Layers, Plus, CheckCircle, XCircle, MoreVertical, Pencil, Trash2, Wrench, Smartphone, Search, Tag } from 'lucide-react';
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

interface ModeloItem {
    id: number;
    nombre_comercial: string;
    codigo_modelo?: string;
    marca?: { id: number; nombre: string };
}

interface ServicioItem {
    id: number;
    nombre: string;
    codigo?: string;
    precio: number;
    estado: boolean;
}

interface Categoria {
    id: number;
    nombre: string;
    slug: string;
    icono?: string;
    estado: boolean;
    modelos_count?: number;
    servicios_count?: number;
    modelos?: ModeloItem[];
    servicios?: ServicioItem[];
}

interface Props {
    categorias: Paginated<Categoria>;
    filters: {
        search?: string;
        status?: string;
        perPage?: string;
    };
    currencySymbol?: string;
}

export default function Index({ categorias, filters, currencySymbol = '$' }: Props) {
    const { __ } = useTranslate();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);

    // Modales de detalles (Modelos y Servicios)
    const [selectedModelosCategoria, setSelectedModelosCategoria] = useState<Categoria | null>(null);
    const [selectedServiciosCategoria, setSelectedServiciosCategoria] = useState<Categoria | null>(null);
    const [modelosSearchTerm, setModelosSearchTerm] = useState('');
    const [serviciosSearchTerm, setServiciosSearchTerm] = useState('');

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
        { title: __('Categorías'), href: '/admin/categorias' },
    ];

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nombre: '',
        icono: '',
        estado: true,
    });

    const handleOpenCreate = () => {
        reset();
        setEditingCategoria(null);
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (categoria: Categoria) => {
        setEditingCategoria(categoria);
        setData({
            nombre: categoria.nombre,
            icono: categoria.icono || '',
            estado: categoria.estado,
        });
        setIsCreateOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategoria) {
            put(`/admin/categorias/${editingCategoria.id}`, {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                    notifySuccess(__('Category updated successfully.'));
                },
                onError: () => notifyError(__('There was an error updating the category.')),
            });
        } else {
            post('/admin/categorias', {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                    notifySuccess(__('Category created successfully.'));
                },
                onError: () => notifyError(__('There was an error creating the category.')),
            });
        }
    };

    const handleDelete = (categoria: Categoria) => {
        if (confirm(__('Are you sure you want to delete this category?'))) {
            router.delete(`/admin/categorias/${categoria.id}`, {
                onSuccess: () => notifySuccess(__('Category deleted successfully.')),
                onError: () => notifyError(__('Error deleting category.')),
            });
        }
    };

    const columns: ColumnDef<Categoria>[] = [
        {
            header: __('Nombre'),
            accessorKey: 'nombre',
            className: 'font-medium',
            cell: (categoria) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="font-medium text-sm">{categoria.nombre}</p>
                        <p className="text-xs text-muted-foreground">/{categoria.slug}</p>
                    </div>
                </div>
            ),
        },
        {
            header: __('Modelos Asociados'),
            accessorKey: 'modelos_count',
            stopRowClick: true,
            cell: (categoria) => (
                <button
                    type="button"
                    onClick={() => {
                        setSelectedModelosCategoria(categoria);
                        setModelosSearchTerm('');
                    }}
                    className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    title={__('Ver modelos asociados')}
                >
                    <Smartphone className="w-3 h-3 mr-1 text-slate-500" />
                    {categoria.modelos_count || 0} modelos
                </button>
            ),
        },
        {
            header: __('Servicios Asociados'),
            accessorKey: 'servicios_count',
            stopRowClick: true,
            cell: (categoria) => (
                <button
                    type="button"
                    onClick={() => {
                        setSelectedServiciosCategoria(categoria);
                        setServiciosSearchTerm('');
                    }}
                    className="inline-flex items-center rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300 transition-colors cursor-pointer"
                    title={__('Ver servicios asociados')}
                >
                    <Wrench className="w-3 h-3 mr-1 text-purple-600" />
                    {categoria.servicios_count || 0} servicios
                </button>
            ),
        },
        {
            header: __('Estado'),
            stopRowClick: true,
            cell: (categoria) => (
                <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full border',
                    categoria.estado
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                )}>
                    {categoria.estado ? __('Activo') : __('Inactivo')}
                </span>
            ),
        },
        {
            header: __('Acciones'),
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (categoria) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(categoria)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Editar')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(categoria)} className="text-rose-500 hover:text-rose-700">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {__('Eliminar')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    // Cálculos de Stats
    const totalCount = categorias.total || 0;
    const activeCount = categorias.data.filter((c) => c.estado).length;
    const inactiveCount = categorias.data.filter((c) => !c.estado).length;

    return (
        <>
            <Head title={__('Categorías de Equipos')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Layers className="h-6 w-6 text-white" />}
                    title={__('Categorías de Equipos')}
                    description={__('Administra las categorías principales de dispositivos para el servicio técnico.')}
                    colorClassName="bg-emerald-600"
                >
                    <Button onClick={handleOpenCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        {__('Nueva Categoría')}
                    </Button>
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard
                        icon={<Layers className="h-6 w-6" />}
                        title={__('TOTAL CATEGORÍAS')}
                        value={totalCount}
                        colorClassName="bg-emerald-100 text-emerald-600"
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
                                placeholder={__('Buscar categoría...')}
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
                    data={categorias}
                />

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingCategoria ? __('Editar Categoría') : __('Nueva Categoría')}</DialogTitle>
                            <DialogDescription>
                                {__('Ingrese los datos de la categoría para organizar los dispositivos.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">{__('Nombre de la Categoría')}</Label>
                                <Input
                                    id="nombre"
                                    value={data.nombre}
                                    onChange={(e) => setData('nombre', e.target.value)}
                                    placeholder="Ej: Smartphone, Tablet"
                                    required
                                />
                                {errors.nombre && <p className="text-xs text-rose-500">{errors.nombre}</p>}
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <Label className="text-base">{__('Estado Activo')}</Label>
                                    <p className="text-xs text-muted-foreground">{__('Permite seleccionar esta categoría en modelos.')}</p>
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
                                    {editingCategoria ? __('Guardar Cambios') : __('Crear Categoría')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL VER MODELOS ASOCIADOS */}
                <Dialog open={!!selectedModelosCategoria} onOpenChange={(open) => !open && setSelectedModelosCategoria(null)}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                <Smartphone className="w-5 h-5 text-purple-600" />
                                {__('Modelos Asociados')} - {selectedModelosCategoria?.nombre}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {__('Lista de modelos de equipos vinculados a esta categoría.')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                            {/* Buscador interno */}
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                                <Input
                                    value={modelosSearchTerm}
                                    onChange={(e) => setModelosSearchTerm(e.target.value)}
                                    placeholder={__('Filtrar modelos por nombre, marca o código...')}
                                    className="text-xs pl-9 h-9"
                                />
                            </div>

                            {/* Lista de Modelos */}
                            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                                {selectedModelosCategoria?.modelos && selectedModelosCategoria.modelos.length > 0 ? (
                                    selectedModelosCategoria.modelos
                                        .filter((m) => {
                                            if (!modelosSearchTerm.trim()) return true;
                                            const term = modelosSearchTerm.toLowerCase();
                                            return (
                                                m.nombre_comercial.toLowerCase().includes(term) ||
                                                m.codigo_modelo?.toLowerCase().includes(term) ||
                                                m.marca?.nombre.toLowerCase().includes(term)
                                            );
                                        })
                                        .map((m) => (
                                            <div
                                                key={m.id}
                                                className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                                            >
                                                <div>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{m.nombre_comercial}</span>
                                                    {m.codigo_modelo && (
                                                        <span className="text-[10px] text-slate-400 font-mono">Cód: {m.codigo_modelo}</span>
                                                    )}
                                                </div>
                                                {m.marca && (
                                                    <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold text-[11px] flex items-center gap-1">
                                                        <Tag className="w-3 h-3 text-purple-600" />
                                                        {m.marca.nombre}
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                ) : (
                                    <p className="text-center text-xs text-slate-400 py-6">{__('No hay modelos asociados a esta categoría.')}</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" size="sm" onClick={() => setSelectedModelosCategoria(null)} className="text-xs">
                                {__('Cerrar')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* MODAL VER SERVICIOS ASOCIADOS */}
                <Dialog open={!!selectedServiciosCategoria} onOpenChange={(open) => !open && setSelectedServiciosCategoria(null)}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                <Wrench className="w-5 h-5 text-purple-600" />
                                {__('Servicios Asociados')} - {selectedServiciosCategoria?.nombre}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {__('Catálogo de servicios de reparación disponibles para esta categoría.')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                            {/* Buscador interno */}
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                                <Input
                                    value={serviciosSearchTerm}
                                    onChange={(e) => setServiciosSearchTerm(e.target.value)}
                                    placeholder={__('Filtrar servicios por nombre o código...')}
                                    className="text-xs pl-9 h-9"
                                />
                            </div>

                            {/* Lista de Servicios */}
                            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                                {selectedServiciosCategoria?.servicios && selectedServiciosCategoria.servicios.length > 0 ? (
                                    selectedServiciosCategoria.servicios
                                        .filter((s) => {
                                            if (!serviciosSearchTerm.trim()) return true;
                                            const term = serviciosSearchTerm.toLowerCase();
                                            return (
                                                s.nombre.toLowerCase().includes(term) ||
                                                s.codigo?.toLowerCase().includes(term)
                                            );
                                        })
                                        .map((s) => (
                                            <div
                                                key={s.id}
                                                className="p-3 bg-purple-50/40 dark:bg-purple-950/20 rounded-lg border border-purple-100 dark:border-purple-900/50 flex items-center justify-between text-xs"
                                            >
                                                <div className="space-y-0.5">
                                                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{s.nombre}</span>
                                                    {s.codigo && (
                                                        <span className="text-[10px] text-purple-700 dark:text-purple-300 font-mono">Cód: {s.codigo}</span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-xs">
                                                        {currencySymbol}{Number(s.precio).toFixed(2)}
                                                    </span>
                                                    <span className={cn(
                                                        'text-[10px] font-semibold px-1.5 py-0.2 rounded',
                                                        s.estado ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : 'text-slate-400 bg-slate-100'
                                                    )}>
                                                        {s.estado ? __('Activo') : __('Inactivo')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <p className="text-center text-xs text-slate-400 py-6">{__('No hay servicios asociados a esta categoría.')}</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" size="sm" onClick={() => setSelectedServiciosCategoria(null)} className="text-xs">
                                {__('Cerrar')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
