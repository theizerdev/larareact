import { Head, useForm, router } from '@inertiajs/react';
import { Wrench, Plus, MoreVertical, Pencil, Trash2, Layers, Smartphone } from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
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

interface CategoriaItem {
    id: number;
    nombre: string;
}

interface ModeloItem {
    id: number;
    marca_id: number;
    categoria_id?: number | null;
    nombre_comercial: string;
    codigo_modelo?: string | null;
}

interface MarcaItem {
    id: number;
    nombre: string;
    modelos?: ModeloItem[];
}

interface Servicio {
    id: number;
    nombre: string;
    codigo: string | null;
    descripcion: string | null;
    precio: number;
    estado: boolean;
    categoria_id?: number | null;
    marca_id?: number | null;
    modelo_id?: number | null;
    categoria?: CategoriaItem | null;
    marca?: { id: number; nombre: string } | null;
    modelo?: { id: number; nombre_comercial: string; codigo_modelo?: string | null } | null;
}

interface Props {
    servicios: Paginated<Servicio>;
    categorias?: CategoriaItem[];
    marcas?: MarcaItem[];
    currencySymbol?: string;
    filters: {
        search?: string;
        status?: string;
        perPage?: string;
    };
}

export default function Index({ servicios, categorias = [], marcas = [], currencySymbol = '$', filters }: Props) {
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
        marca_id: '',
        modelo_id: '',
        nombre: '',
        precio: '',
        estado: true,
    });

    const selectedMarca = marcas.find((m) => String(m.id) === String(data.marca_id));
    const availableModelos = selectedMarca?.modelos || [];
    const filteredModelos = data.categoria_id
        ? availableModelos.filter((m) => !m.categoria_id || String(m.categoria_id) === String(data.categoria_id))
        : availableModelos;
    const finalModelos = filteredModelos.length > 0 ? filteredModelos : availableModelos;

    const handleOpenCreate = () => {
        reset();
        setData({
            categoria_id: '',
            marca_id: '',
            modelo_id: '',
            nombre: '',
            precio: '',
            estado: true,
        });
        setEditingServicio(null);
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (servicio: Servicio) => {
        setEditingServicio(servicio);
        setData({
            categoria_id: servicio.categoria_id ? String(servicio.categoria_id) : '',
            marca_id: servicio.marca_id ? String(servicio.marca_id) : '',
            modelo_id: servicio.modelo_id ? String(servicio.modelo_id) : '',
            nombre: servicio.nombre,
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
            header: __('Marca / Modelo'),
            cell: (servicio) => (
                <div className="flex flex-col gap-0.5">
                    {servicio.marca ? (
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Smartphone className="w-3 h-3 text-slate-500" />
                            {servicio.marca.nombre}
                        </span>
                    ) : (
                        <span className="text-xs text-slate-400 italic">{__('General')}</span>
                    )}
                    {servicio.modelo && (
                        <span className="text-[11px] text-muted-foreground">
                            {servicio.modelo.nombre_comercial} {servicio.modelo.codigo_modelo ? `(${servicio.modelo.codigo_modelo})` : ''}
                        </span>
                    )}
                </div>
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
            header: __('Descripción del Servicio'),
            accessorKey: 'nombre',
            className: 'font-medium',
            cell: (servicio) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{servicio.nombre}</p>
                        {servicio.descripcion && servicio.descripcion !== servicio.nombre && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">{servicio.descripcion}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: __('Precio'),
            accessorKey: 'precio',
            cell: (servicio) => (
                <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {currencySymbol}{Number(servicio.precio || 0).toFixed(2)}
                </span>
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

                {/* Filtros */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Buscar')}>
                            <Input
                                placeholder={__('Buscar por servicio, marca, modelo, código...')}
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
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editingServicio ? __('Editar Servicio') : __('Nuevo Servicio')}</DialogTitle>
                            <DialogDescription>
                                {__('Configure la jerarquía: Categoría > Marca > Modelo > Descripción > Precio.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            {/* 1. SELECCIÓN DE CATEGORÍA */}
                            <div className="space-y-1.5">
                                <Label htmlFor="categoria_id">{__('1. Categoría *')}</Label>
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

                            {/* 2. SELECCIÓN DE MARCA */}
                            <div className="space-y-1.5">
                                <Label htmlFor="marca_id">{__('2. Marca *')}</Label>
                                <Select
                                    value={data.marca_id}
                                    onValueChange={(val) => {
                                        setData((prev) => ({
                                            ...prev,
                                            marca_id: val,
                                            modelo_id: '',
                                        }));
                                    }}
                                >
                                    <SelectTrigger id="marca_id" className="w-full">
                                        <SelectValue placeholder={__('Seleccionar Marca...')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {marcas && marcas.length > 0 ? (
                                            marcas.map((m) => (
                                                <SelectItem key={m.id} value={String(m.id)}>
                                                    {m.nombre}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>
                                                {__('No hay marcas registradas')}
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                {errors.marca_id && <p className="text-xs text-rose-500">{errors.marca_id}</p>}
                            </div>

                            {/* 3. SELECCIÓN DE MODELO */}
                            <div className="space-y-1.5">
                                <Label htmlFor="modelo_id">{__('3. Modelo *')}</Label>
                                <Select
                                    value={data.modelo_id}
                                    onValueChange={(val) => setData('modelo_id', val)}
                                    disabled={!data.marca_id || finalModelos.length === 0}
                                >
                                    <SelectTrigger id="modelo_id" className="w-full">
                                        <SelectValue
                                            placeholder={
                                                !data.marca_id
                                                    ? __('Primero seleccione una marca...')
                                                    : finalModelos.length === 0
                                                    ? __('Sin modelos disponibles')
                                                    : __('Seleccionar Modelo...')
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {finalModelos.map((mod) => (
                                            <SelectItem key={mod.id} value={String(mod.id)}>
                                                {mod.nombre_comercial} {mod.codigo_modelo ? `(${mod.codigo_modelo})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.modelo_id && <p className="text-xs text-rose-500">{errors.modelo_id}</p>}
                            </div>

                            {/* 4. DESCRIPCIÓN DEL SERVICIO */}
                            <div className="space-y-1.5">
                                <Label htmlFor="nombre">{__('4. Descripción del Servicio *')}</Label>
                                <Input
                                    id="nombre"
                                    value={data.nombre}
                                    onChange={(e) => setData('nombre', e.target.value)}
                                    placeholder={__('Ej: Cambio de Pantalla OLED, Cambio de Batería, Mantenimiento')}
                                    required
                                />
                                {errors.nombre && <p className="text-xs text-rose-500">{errors.nombre}</p>}
                            </div>

                            {/* 5. PRECIO */}
                            <div className="space-y-1.5">
                                <Label htmlFor="precio">{__('5. Precio Base')} ({currencySymbol}) *</Label>
                                <Input
                                    id="precio"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.precio}
                                    onChange={(e) => setData('precio', e.target.value)}
                                    placeholder="0.00"
                                    required
                                />
                                {errors.precio && <p className="text-xs text-rose-500">{errors.precio}</p>}
                            </div>

                            {/* ESTADO */}
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <Label className="text-base">{__('Estado Activo')}</Label>
                                    <p className="text-xs text-muted-foreground">{__('Habilita este servicio para presupuestos y órdenes.')}</p>
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
