import { Head, useForm, router } from '@inertiajs/react';
import { FolderTree, Plus, CheckCircle, XCircle, MoreVertical, Pencil, Trash2 } from 'lucide-react';
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

interface MarcaOption {
    id: number;
    nombre: string;
}

interface CategoriaOption {
    id: number;
    nombre: string;
}

interface Familia {
    id: number;
    marca_id: number;
    categoria_id?: number;
    nombre: string;
    descripcion?: string;
    estado: boolean;
    marca?: MarcaOption;
    categoria?: CategoriaOption;
    modelos_count?: number;
}

interface Props {
    familias: Paginated<Familia>;
    marcas: MarcaOption[];
    categorias: CategoriaOption[];
    filters: {
        search?: string;
        marca_id?: string;
        categoria_id?: string;
        status?: string;
        perPage?: string;
    };
}

export default function Index({ familias, marcas: marcasProp, categorias: categoriasProp, filters }: Props) {
    const { __ } = useTranslate();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingFamilia, setEditingFamilia] = useState<Familia | null>(null);

    // Estados dinámicos para Marcas y Categorías en caliente
    const [marcas, setMarcas] = useState<MarcaOption[]>(marcasProp);
    const [categorias, setCategorias] = useState<CategoriaOption[]>(categoriasProp);

    React.useEffect(() => { setMarcas(marcasProp); }, [marcasProp]);
    React.useEffect(() => { setCategorias(categoriasProp); }, [categoriasProp]);

    // Sub-modales de creación rápida
    const [isNewMarcaOpen, setIsNewMarcaOpen] = useState(false);
    const [newMarcaNombre, setNewMarcaNombre] = useState('');
    const [isSavingMarca, setIsSavingMarca] = useState(false);

    const [isNewCategoriaOpen, setIsNewCategoriaOpen] = useState(false);
    const [newCategoriaNombre, setNewCategoriaNombre] = useState('');
    const [isSavingCategoria, setIsSavingCategoria] = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [marcaFilter, setMarcaFilter] = useState(filters.marca_id || '');
    const [categoriaFilter, setCategoriaFilter] = useState(filters.categoria_id || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '10');

    // Debounce de filtros
    React.useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                window.location.pathname,
                cleanParams({
                    search: searchTerm,
                    marca_id: marcaFilter,
                    categoria_id: categoriaFilter,
                    status: statusFilter,
                    perPage: perPageFilter,
                }),
                { preserveState: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, marcaFilter, categoriaFilter, statusFilter, perPageFilter]);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Equipos'), href: '#' },
        { title: __('Familias'), href: '/admin/familias' },
    ];

    const { data, setData, post, put, processing, errors, reset } = useForm({
        marca_id: marcas[0]?.id ? String(marcas[0].id) : '',
        categoria_id: categorias[0]?.id ? String(categorias[0].id) : '',
        nombre: '',
        descripcion: '',
        estado: true,
    });

    const handleOpenCreate = () => {
        reset();
        if (marcas.length > 0) setData('marca_id', String(marcas[0].id));
        if (categorias.length > 0) setData('categoria_id', String(categorias[0].id));
        setEditingFamilia(null);
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (familia: Familia) => {
        setEditingFamilia(familia);
        setData({
            marca_id: String(familia.marca_id),
            categoria_id: familia.categoria_id ? String(familia.categoria_id) : '',
            nombre: familia.nombre,
            descripcion: familia.descripcion || '',
            estado: familia.estado,
        });
        setIsCreateOpen(true);
    };

    const handleQuickCreateMarca = (e: React.FormEvent) => {
        e.preventDefault();
        const nombreTarget = newMarcaNombre.trim();
        if (!nombreTarget) return;

        setIsSavingMarca(true);
        router.post(
            '/admin/marcas',
            { nombre: nombreTarget, estado: true },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    notifySuccess(__('Marca creada correctamente.'));
                    setIsNewMarcaOpen(false);
                    setNewMarcaNombre('');

                    const marcasUpdated = (page.props as any)?.marcas as MarcaOption[] || [];
                    const creada = marcasUpdated.find((m) => m.nombre.toLowerCase() === nombreTarget.toLowerCase())
                        || marcasUpdated[marcasUpdated.length - 1];
                    if (creada) {
                        setData('marca_id', String(creada.id));
                    }
                },
                onError: () => notifyError(__('Error al crear la marca.')),
                onFinish: () => setIsSavingMarca(false),
            }
        );
    };

    const handleQuickCreateCategoria = (e: React.FormEvent) => {
        e.preventDefault();
        const nombreTarget = newCategoriaNombre.trim();
        if (!nombreTarget) return;

        setIsSavingCategoria(true);
        router.post(
            '/admin/categorias',
            { nombre: nombreTarget, estado: true },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    notifySuccess(__('Categoría creada correctamente.'));
                    setIsNewCategoriaOpen(false);
                    setNewCategoriaNombre('');

                    const categoriasUpdated = (page.props as any)?.categorias as CategoriaOption[] || [];
                    const creada = categoriasUpdated.find((c) => c.nombre.toLowerCase() === nombreTarget.toLowerCase())
                        || categoriasUpdated[categoriasUpdated.length - 1];
                    if (creada) {
                        setData('categoria_id', String(creada.id));
                    }
                },
                onError: () => notifyError(__('Error al crear la categoría.')),
                onFinish: () => setIsSavingCategoria(false),
            }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingFamilia) {
            put(`/admin/familias/${editingFamilia.id}`, {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                    notifySuccess(__('Family updated successfully.'));
                },
                onError: () => notifyError(__('There was an error updating the family.')),
            });
        } else {
            post('/admin/familias', {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                    notifySuccess(__('Family created successfully.'));
                },
                onError: () => notifyError(__('There was an error creating the family.')),
            });
        }
    };

    const handleDelete = (familia: Familia) => {
        if (confirm(__('Are you sure you want to delete this family?'))) {
            router.delete(`/admin/familias/${familia.id}`, {
                onSuccess: () => notifySuccess(__('Family deleted successfully.')),
                onError: () => notifyError(__('Error deleting family.')),
            });
        }
    };

    const columns: ColumnDef<Familia>[] = [
        {
            header: __('Familia / Línea'),
            accessorKey: 'nombre',
            className: 'font-medium',
            cell: (familia) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <FolderTree className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="font-medium text-sm">{familia.nombre}</p>
                        {familia.descripcion && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{familia.descripcion}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: __('Marca'),
            accessorKey: 'marca.nombre',
            cell: (familia) => (
                <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    {familia.marca?.nombre || 'N/A'}
                </span>
            ),
        },
        {
            header: __('Categoría'),
            accessorKey: 'categoria.nombre',
            cell: (familia) => (
                <span className="text-sm text-muted-foreground">
                    {familia.categoria?.nombre || 'General'}
                </span>
            ),
        },
        {
            header: __('Modelos'),
            accessorKey: 'modelos_count',
            cell: (familia) => (
                <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {familia.modelos_count || 0} modelos
                </span>
            ),
        },
        {
            header: __('Estado'),
            stopRowClick: true,
            cell: (familia) => (
                <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full border',
                    familia.estado
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                )}>
                    {familia.estado ? __('Activa') : __('Inactiva')}
                </span>
            ),
        },
        {
            header: __('Acciones'),
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (familia) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(familia)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Editar')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(familia)} className="text-rose-500 hover:text-rose-700">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {__('Eliminar')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    // Stats
    const totalCount = familias.total || 0;
    const activeCount = familias.data.filter((f) => f.estado).length;
    const inactiveCount = familias.data.filter((f) => !f.estado).length;

    return (
        <>
            <Head title={__('Familias de Modelos')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<FolderTree className="h-6 w-6 text-white" />}
                    title={__('Familias de Modelos')}
                    description={__('Agrupa modelos por líneas comerciales (Ej: Galaxy Serie A, iPhone Serie 13, Redmi Note).')}
                    colorClassName="bg-blue-600"
                >
                    <Button onClick={handleOpenCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        {__('Nueva Familia')}
                    </Button>
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard
                        icon={<FolderTree className="h-6 w-6" />}
                        title={__('TOTAL FAMILIAS')}
                        value={totalCount}
                        colorClassName="bg-blue-100 text-blue-600"
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
                                placeholder={__('Buscar familia...')}
                                className="w-full md:w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Marca')}>
                            <Select value={marcaFilter} onValueChange={setMarcaFilter}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue placeholder={__('Todas las marcas')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('Todas las marcas')}</SelectItem>
                                    {marcas.map((m) => (
                                        <SelectItem key={m.id} value={String(m.id)}>
                                            {m.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>
                        <FilterField label={__('Estado')}>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-40">
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
                                <SelectTrigger className="w-full md:w-32">
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
                    data={familias}
                />

                {/* Modal de Crear / Editar Familia */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingFamilia ? __('Editar Familia') : __('Nueva Familia')}</DialogTitle>
                            <DialogDescription>
                                {__('Define una línea o familia de dispositivos asociada a una marca.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Sección Marca */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="marca_id">{__('Marca')}</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-1.5 text-xs text-purple-600 hover:text-purple-700 font-normal"
                                            onClick={() => {
                                                setIsNewMarcaOpen(!isNewMarcaOpen);
                                                setIsNewCategoriaOpen(false);
                                            }}
                                        >
                                            <Plus className="mr-1 h-3 w-3" />
                                            {isNewMarcaOpen ? __('Cancelar') : __('Nueva')}
                                        </Button>
                                    </div>

                                    {!isNewMarcaOpen ? (
                                        <Select
                                            value={data.marca_id}
                                            onValueChange={(val) => setData('marca_id', val)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={__('Seleccione una marca')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {marcas.map((m) => (
                                                    <SelectItem key={m.id} value={String(m.id)}>
                                                        {m.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Input
                                                value={newMarcaNombre}
                                                onChange={(e) => setNewMarcaNombre(e.target.value)}
                                                placeholder={__('Nombre marca...')}
                                                className="h-9 text-xs"
                                                autoFocus
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="h-9 px-2 bg-purple-600 hover:bg-purple-700 text-white text-xs"
                                                disabled={isSavingMarca || !newMarcaNombre.trim()}
                                                onClick={handleQuickCreateMarca}
                                            >
                                                {__('Guardar')}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Sección Categoría */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="categoria_id">{__('Categoría')}</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-normal"
                                            onClick={() => {
                                                setIsNewCategoriaOpen(!isNewCategoriaOpen);
                                                setIsNewMarcaOpen(false);
                                            }}
                                        >
                                            <Plus className="mr-1 h-3 w-3" />
                                            {isNewCategoriaOpen ? __('Cancelar') : __('Nueva')}
                                        </Button>
                                    </div>

                                    {!isNewCategoriaOpen ? (
                                        <Select
                                            value={data.categoria_id}
                                            onValueChange={(val) => setData('categoria_id', val)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={__('Seleccione una categoría')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categorias.map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>
                                                        {c.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Input
                                                value={newCategoriaNombre}
                                                onChange={(e) => setNewCategoriaNombre(e.target.value)}
                                                placeholder={__('Nombre categoría...')}
                                                className="h-9 text-xs"
                                                autoFocus
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="h-9 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                                disabled={isSavingCategoria || !newCategoriaNombre.trim()}
                                                onClick={handleQuickCreateCategoria}
                                            >
                                                {__('Guardar')}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nombre">{__('Nombre de la Familia')}</Label>
                                <Input
                                    id="nombre"
                                    value={data.nombre}
                                    onChange={(e) => setData('nombre', e.target.value)}
                                    placeholder="Ej: Galaxy Serie A, iPhone 14 Series"
                                    className="w-full"
                                    required
                                />
                                {errors.nombre && <p className="text-xs text-rose-500">{errors.nombre}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="descripcion">{__('Descripción (Opcional)')}</Label>
                                <Textarea
                                    id="descripcion"
                                    value={data.descripcion}
                                    onChange={(e) => setData('descripcion', e.target.value)}
                                    placeholder={__('Notas adicionales...')}
                                    className="w-full min-h-[80px]"
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <Label className="text-base">{__('Estado Activo')}</Label>
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
                                    {editingFamilia ? __('Guardar Cambios') : __('Crear Familia')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

