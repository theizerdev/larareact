import { Head, useForm, router } from '@inertiajs/react';
import { Smartphone, Plus, CheckCircle, XCircle, MoreVertical, Pencil, Trash2 } from 'lucide-react';
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

interface Option {
    id: number;
    nombre: string;
    marca_id?: number;
}

interface Modelo {
    id: number;
    marca_id: number;
    familia_id: number;
    categoria_id: number;
    nombre_comercial: string;
    codigo_modelo?: string;
    imagen_url?: string;
    estado: boolean;
    marca?: Option;
    familia?: Option;
    categoria?: Option;
}

interface Props {
    modelos: Paginated<Modelo>;
    marcas: Option[];
    familias: Option[];
    categorias: Option[];
    filters: {
        search?: string;
        marca_id?: string;
        familia_id?: string;
        categoria_id?: string;
        status?: string;
        perPage?: string;
    };
}

export default function Index({ modelos, marcas: marcasProp, familias: familiasProp, categorias: categoriasProp, filters }: Props) {
    const { __ } = useTranslate();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingModelo, setEditingModelo] = useState<Modelo | null>(null);

    // Estados dinámicos para Marcas, Categorías y Familias en caliente
    const [marcas, setMarcas] = useState<Option[]>(marcasProp);
    const [familias, setFamilias] = useState<Option[]>(familiasProp);
    const [categorias, setCategorias] = useState<Option[]>(categoriasProp);

    React.useEffect(() => {
        const unique = Array.from(new Map(marcasProp.map(item => [item.id, item])).values());
        setMarcas(unique);
    }, [marcasProp]);

    React.useEffect(() => {
        const unique = Array.from(new Map(familiasProp.map(item => [item.id, item])).values());
        setFamilias(unique);
    }, [familiasProp]);

    React.useEffect(() => {
        const unique = Array.from(new Map(categoriasProp.map(item => [item.id, item])).values());
        setCategorias(unique);
    }, [categoriasProp]);

    // Sub-creaciones rápidas inline
    const [isNewMarcaOpen, setIsNewMarcaOpen] = useState(false);
    const [newMarcaNombre, setNewMarcaNombre] = useState('');
    const [isSavingMarca, setIsSavingMarca] = useState(false);

    const [isNewCategoriaOpen, setIsNewCategoriaOpen] = useState(false);
    const [newCategoriaNombre, setNewCategoriaNombre] = useState('');
    const [isSavingCategoria, setIsSavingCategoria] = useState(false);

    const [isNewFamiliaOpen, setIsNewFamiliaOpen] = useState(false);
    const [newFamiliaNombre, setNewFamiliaNombre] = useState('');
    const [isSavingFamilia, setIsSavingFamilia] = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [marcaFilter, setMarcaFilter] = useState(filters.marca_id || '');
    const [familiaFilter, setFamiliaFilter] = useState(filters.familia_id || '');
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
                    familia_id: familiaFilter,
                    categoria_id: categoriaFilter,
                    status: statusFilter,
                    perPage: perPageFilter,
                }),
                { preserveState: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, marcaFilter, familiaFilter, categoriaFilter, statusFilter, perPageFilter]);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Equipos'), href: '#' },
        { title: __('Modelos'), href: '/admin/modelos' },
    ];

    const { data, setData, post, put, processing, errors, reset } = useForm({
        marca_id: marcas[0]?.id ? String(marcas[0].id) : '',
        familia_id: familias[0]?.id ? String(familias[0].id) : '',
        categoria_id: categorias[0]?.id ? String(categorias[0].id) : '',
        nombre_comercial: '',
        codigo_modelo: '',
        estado: true,
    });

    const filteredFamilias = data.marca_id
        ? familias.filter((f) => String(f.marca_id) === String(data.marca_id))
        : familias;

    const handleOpenCreate = () => {
        reset();
        if (marcas.length > 0) setData('marca_id', String(marcas[0].id));
        if (familias.length > 0) setData('familia_id', String(familias[0].id));
        if (categorias.length > 0) setData('categoria_id', String(categorias[0].id));
        setEditingModelo(null);
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (modelo: Modelo) => {
        setEditingModelo(modelo);
        setData({
            marca_id: String(modelo.marca_id),
            familia_id: String(modelo.familia_id),
            categoria_id: String(modelo.categoria_id),
            nombre_comercial: modelo.nombre_comercial,
            codigo_modelo: modelo.codigo_modelo || '',
            estado: modelo.estado,
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

                    const marcasUpdated = (page.props as any)?.marcas as Option[] || [];
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

                    const categoriasUpdated = (page.props as any)?.categorias as Option[] || [];
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

    const handleQuickCreateFamilia = (e: React.FormEvent) => {
        e.preventDefault();
        const nombreTarget = newFamiliaNombre.trim();
        if (!nombreTarget || !data.marca_id) return;

        setIsSavingFamilia(true);
        router.post(
            '/admin/familias',
            {
                nombre: nombreTarget,
                marca_id: data.marca_id,
                categoria_id: data.categoria_id || null,
                estado: true,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    notifySuccess(__('Familia creada correctamente.'));
                    setIsNewFamiliaOpen(false);
                    setNewFamiliaNombre('');

                    const familiasUpdated = (page.props as any)?.familias as Option[] || [];
                    const creada = familiasUpdated.find((f) => f.nombre.toLowerCase() === nombreTarget.toLowerCase())
                        || familiasUpdated[familiasUpdated.length - 1];
                    if (creada) {
                        setData('familia_id', String(creada.id));
                    }
                },
                onError: () => notifyError(__('Error al crear la familia.')),
                onFinish: () => setIsSavingFamilia(false),
            }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingModelo) {
            put(`/admin/modelos/${editingModelo.id}`, {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                    notifySuccess(__('Model updated successfully.'));
                },
                onError: () => notifyError(__('There was an error updating the model.')),
            });
        } else {
            post('/admin/modelos', {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                    notifySuccess(__('Model created successfully.'));
                },
                onError: () => notifyError(__('There was an error creating the model.')),
            });
        }
    };

    const handleDelete = (modelo: Modelo) => {
        if (confirm(__('Are you sure you want to delete this model?'))) {
            router.delete(`/admin/modelos/${modelo.id}`, {
                onSuccess: () => notifySuccess(__('Model deleted successfully.')),
                onError: () => notifyError(__('Error deleting model.')),
            });
        }
    };

    const columns: ColumnDef<Modelo>[] = [
        {
            header: __('Modelo Comercial'),
            accessorKey: 'nombre_comercial',
            className: 'font-medium',
            cell: (modelo) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <p className="font-medium text-sm">{modelo.nombre_comercial}</p>
                        {modelo.codigo_modelo && (
                            <p className="text-xs text-muted-foreground font-mono">
                                Cod: {modelo.codigo_modelo}
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: __('Marca'),
            accessorKey: 'marca.nombre',
            cell: (modelo) => (
                <span className="inline-flex items-center rounded-md bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    {modelo.marca?.nombre || 'N/A'}
                </span>
            ),
        },
        {
            header: __('Familia'),
            accessorKey: 'familia.nombre',
            cell: (modelo) => (
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {modelo.familia?.nombre || 'N/A'}
                </span>
            ),
        },
        {
            header: __('Categoría'),
            accessorKey: 'categoria.nombre',
            cell: (modelo) => (
                <span className="text-sm text-muted-foreground">
                    {modelo.categoria?.nombre || 'General'}
                </span>
            ),
        },
        {
            header: __('Estado'),
            stopRowClick: true,
            cell: (modelo) => (
                <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full border',
                    modelo.estado
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                )}>
                    {modelo.estado ? __('Activo') : __('Inactivo')}
                </span>
            ),
        },
        {
            header: __('Acciones'),
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (modelo) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(modelo)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Editar')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(modelo)} className="text-rose-500 hover:text-rose-700">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {__('Eliminar')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    // Stats
    const totalCount = modelos.total || 0;
    const activeCount = modelos.data.filter((m) => m.estado).length;
    const inactiveCount = modelos.data.filter((m) => !m.estado).length;

    return (
        <>
            <Head title={__('Catálogo de Modelos')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Smartphone className="h-6 w-6 text-white" />}
                    title={__('Catálogo de Modelos')}
                    description={__('Registra y administra los modelos exactos para la recepción de soporte técnico.')}
                    colorClassName="bg-indigo-600"
                >
                    <Button onClick={handleOpenCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        {__('Nuevo Modelo')}
                    </Button>
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard
                        icon={<Smartphone className="h-6 w-6" />}
                        title={__('TOTAL MODELOS')}
                        value={totalCount}
                        colorClassName="bg-indigo-100 text-indigo-600"
                    />
                    <StatCard
                        icon={<CheckCircle className="h-6 w-6" />}
                        title={__('ACTIVIOS')}
                        value={activeCount}
                        colorClassName="bg-green-100 text-green-600"
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
                                placeholder={__('Buscar por modelo o código...')}
                                className="w-full md:w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Marca')}>
                            <Select value={marcaFilter} onValueChange={setMarcaFilter}>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue placeholder={__('Todas')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('Todas')}</SelectItem>
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
                                <SelectTrigger className="w-full md:w-36">
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
                    data={modelos}
                />

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingModelo ? __('Editar Modelo') : __('Nuevo Modelo')}</DialogTitle>
                            <DialogDescription>
                                {__('Ingrese los detalles del dispositivo para la recepción de servicios.')}
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
                                                setIsNewFamiliaOpen(false);
                                            }}
                                        >
                                            <Plus className="mr-1 h-3 w-3" />
                                            {isNewMarcaOpen ? __('Cancelar') : __('Nueva')}
                                        </Button>
                                    </div>

                                    {!isNewMarcaOpen ? (
                                        <Select
                                            value={data.marca_id}
                                            onValueChange={(val) => {
                                                setData('marca_id', val);
                                                const firstFam = familias.find((f) => String(f.marca_id) === val);
                                                if (firstFam) setData('familia_id', String(firstFam.id));
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={__('Seleccione marca')} />
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
                                                setIsNewFamiliaOpen(false);
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
                                                <SelectValue placeholder={__('Seleccione categoría')} />
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

                            {/* Sección Familia */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="familia_id">{__('Familia / Línea')}</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-1.5 text-xs text-blue-600 hover:text-blue-700 font-normal"
                                        onClick={() => {
                                            setIsNewFamiliaOpen(!isNewFamiliaOpen);
                                            setIsNewMarcaOpen(false);
                                            setIsNewCategoriaOpen(false);
                                        }}
                                    >
                                        <Plus className="mr-1 h-3 w-3" />
                                        {isNewFamiliaOpen ? __('Cancelar') : __('Nueva')}
                                    </Button>
                                </div>

                                {!isNewFamiliaOpen ? (
                                    <Select
                                        value={data.familia_id}
                                        onValueChange={(val) => setData('familia_id', val)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={__('Seleccione familia')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredFamilias.map((f) => (
                                                <SelectItem key={f.id} value={String(f.id)}>
                                                    {f.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="flex gap-2">
                                        <Input
                                            value={newFamiliaNombre}
                                            onChange={(e) => setNewFamiliaNombre(e.target.value)}
                                            placeholder={__('Nombre de familia/línea...')}
                                            className="h-9 text-xs"
                                            autoFocus
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="h-9 px-2 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                            disabled={isSavingFamilia || !newFamiliaNombre.trim()}
                                            onClick={handleQuickCreateFamilia}
                                        >
                                            {__('Guardar')}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nombre_comercial">{__('Nombre Comercial')}</Label>
                                    <Input
                                        id="nombre_comercial"
                                        value={data.nombre_comercial}
                                        onChange={(e) => setData('nombre_comercial', e.target.value)}
                                        placeholder="Ej: Galaxy A14 4G"
                                        className="w-full"
                                        required
                                    />
                                    {errors.nombre_comercial && (
                                        <p className="text-xs text-rose-500">{errors.nombre_comercial}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="codigo_modelo">{__('Código Técnico (Opcional)')}</Label>
                                    <Input
                                        id="codigo_modelo"
                                        value={data.codigo_modelo}
                                        onChange={(e) => setData('codigo_modelo', e.target.value)}
                                        placeholder="Ej: SM-A145F"
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <Label className="text-base">{__('Estado Activo')}</Label>
                                    <p className="text-xs text-muted-foreground">{__('Habilita este modelo en la recepción de equipos.')}</p>
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
                                    {editingModelo ? __('Guardar Cambios') : __('Crear Modelo')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

