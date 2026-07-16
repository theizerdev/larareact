import React, { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { Input } from '@/components/ui/input';
import { ModuleHeader } from '@/components/module-header';
import type { Auth } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/stat-card';
import { Paginated } from '@/types/app';
import { DataTable, ColumnDef } from '@/components/data-table';
import { cn, cleanParams } from '@/lib/utils';
import { useTranslate } from '@/hooks/use-translate';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderTree, Plus, CheckCircle, XCircle, Trash2, MoreVertical, Pencil, ToggleRight } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Label } from '@/components/ui/label';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Categoria {
    id: number;
    parent_id?: number | null;
    nombre: string;
    slug: string;
    descripcion?: string | null;
    imagen?: string | null;
    activo: boolean;
    parent?: {
        id: number;
        nombre: string;
    } | null;
}

interface ParentCategoryOption {
    id: number;
    nombre: string;
    parent_id?: number | null;
}

interface CategoriasPageProps {
    auth: Auth;
    categorias: Paginated<Categoria>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
    };
    parentCategories: ParentCategoryOption[];
    filters: {
        search?: string;
        status?: string;
        perPage?: string;
        sortBy?: string;
        sortDir?: string;
    };
}

export default function CategoriasIndexPage({
    auth,
    categorias,
    stats,
    parentCategories,
    filters,
}: CategoriasPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Categories'), href: '/admin/categorias' },
    ];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isTableLoading, setIsTableLoading] = useState(false);

    // Filtros locales
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '10');

    // Manejar carga de tabla
    React.useEffect(() => {
        const unbindStart = router.on('start', () => setIsTableLoading(true));
        const unbindFinish = router.on('finish', () => setIsTableLoading(false));
        return () => {
            unbindStart();
            unbindFinish();
        };
    }, []);

    // Debounce para filtros de búsqueda
    React.useEffect(() => {
        const timer = setTimeout(() => {
            router.get(window.location.pathname, cleanParams({
                search: searchTerm,
                status: statusFilter,
                perPage: perPageFilter,
                sortBy: filters.sortBy,
                sortDir: filters.sortDir
            }), { preserveState: true, preserveScroll: true });
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, perPageFilter]);

    // Formulario Inertia
    const { data, setData, post, processing, errors, reset } = useForm({
        nombre: '',
        slug: '',
        parent_id: '' as string | number,
        descripcion: '',
        activo: true,
        imagen: null as File | null,
    });

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

    const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nombreVal = e.target.value;
        setData((prev) => ({
            ...prev,
            nombre: nombreVal,
            slug: slugify(nombreVal),
        }));
    };

    const handleCreateClick = () => {
        setEditingCategoria(null);
        reset();
        setIsModalOpen(true);
    };

    const handleEditClick = (categoria: Categoria) => {
        setEditingCategoria(categoria);
        setData({
            nombre: categoria.nombre,
            slug: categoria.slug,
            parent_id: categoria.parent_id || '',
            descripcion: categoria.descripcion || '',
            activo: categoria.activo,
            imagen: null,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Convertir parent_id vacío a null o número
        const finalParentId = data.parent_id === '' ? '' : Number(data.parent_id);

        if (editingCategoria) {
            router.post(`/admin/categorias/${editingCategoria.id}`, {
                _method: 'put',
                nombre: data.nombre,
                slug: data.slug,
                parent_id: finalParentId,
                descripcion: data.descripcion,
                activo: data.activo,
                imagen: data.imagen,
            }, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingCategoria(null);
                    reset();
                },
            });
        } else {
            post('/admin/categorias', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleToggleActive = (categoria: Categoria) => {
        router.post(`/admin/categorias/${categoria.id}`, {
            _method: 'put',
            nombre: categoria.nombre,
            slug: categoria.slug,
            parent_id: categoria.parent_id || '',
            descripcion: categoria.descripcion || '',
            activo: !categoria.activo,
        }, {
            preserveScroll: true,
        });
    };

    const handleBulkDeleteClick = () => {
        setIsDeleteDialogOpen(true);
    };

    const handleBulkDeleteConfirm = () => {
        router.post('/admin/categorias/bulk-destroy', { ids: selectedIds }, {
            onSuccess: () => {
                setSelectedIds([]);
                setIsDeleteDialogOpen(false);
            },
            preserveScroll: true,
        });
    };

    // Filtrar la categoría actual para evitar dependencias circulares
    const availableParents = useMemo(() => {
        if (!editingCategoria) return parentCategories;
        return parentCategories.filter((pc) => pc.id !== editingCategoria.id);
    }, [parentCategories, editingCategoria]);

    const bulkActions = [
        {
            label: __('Delete selected'),
            icon: <Trash2 className="h-4 w-4" />,
            onClick: handleBulkDeleteClick,
            variant: 'destructive' as const,
        }
    ];

    const columns: ColumnDef<Categoria>[] = [
        {
            header: __('Image'),
            accessorKey: 'imagen',
            cell: (categoria) => (
                <Avatar className="h-10 w-10 border bg-slate-50 dark:bg-slate-900 rounded-md">
                    <AvatarImage src={categoria.imagen || undefined} alt={categoria.nombre} className="object-contain" />
                    <AvatarFallback className="text-xs bg-sidebar-primary text-sidebar-primary-foreground font-semibold rounded-md">
                        {categoria.nombre.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            ),
        },
        {
            header: __('Name'),
            accessorKey: 'nombre',
            className: 'font-medium',
            sortable: true,
        },
        {
            header: __('Slug'),
            accessorKey: 'slug',
            sortable: true,
            hideOn: 'mobile',
        },
        {
            header: __('Parent Category'),
            accessorKey: 'parent_id',
            sortable: true,
            cell: (categoria) => categoria.parent ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border">
                    {categoria.parent.nombre}
                </span>
            ) : (
                <span className="text-muted-foreground text-xs italic">{__('Principal')}</span>
            ),
        },
        {
            header: __('Status'),
            sortable: true,
            sortKey: 'activo',
            stopRowClick: true,
            cell: (categoria) => (
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={categoria.activo}
                        onCheckedChange={() => handleToggleActive(categoria)}
                    />
                    <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full border",
                        categoria.activo
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                            : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800"
                    )}>
                        {categoria.activo ? __('Active') : __('Inactive')}
                    </span>
                </div>
            )
        },
        {
            header: __('Actions'),
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
                        <DropdownMenuItem onClick={() => handleEditClick(categoria)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(categoria)}>
                            <ToggleRight className="mr-2 h-4 w-4" />
                            {categoria.activo ? __('Deactivate') : __('Activate')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    return (
        <>
            <Head title={__('Categories')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<FolderTree className="h-6 w-6 text-white" />}
                    title={__('Categories')}
                    description={__('Manage ecommerce catalog categories and hierarchy structure.')}
                    colorClassName="bg-indigo-600"
                >
                    <Button onClick={handleCreateClick}>
                        <Plus className="mr-2 h-4 w-4" />
                        {__('New Category')}
                    </Button>
                </ModuleHeader>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard
                        icon={<FolderTree className="h-6 w-6" />}
                        title={__('TOTAL CATEGORIES')}
                        value={stats.total}
                        colorClassName="bg-indigo-100 text-indigo-600"
                    />
                    <StatCard
                        icon={<CheckCircle className="h-6 w-6" />}
                        title={__('ACTIVE')}
                        value={stats.activos}
                        colorClassName="bg-green-100 text-green-600"
                    />
                    <StatCard
                        icon={<XCircle className="h-6 w-6" />}
                        title={__('INACTIVE')}
                        value={stats.inactivos}
                        colorClassName="bg-red-100 text-red-600"
                    />
                </div>

                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Search')}>
                            <Input
                                placeholder={__('Search by name...')}
                                className="w-full md:w-96"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>

                        <FilterField label={__('Status')}>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue placeholder={__('All')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('All')}</SelectItem>
                                    <SelectItem value="1">{__('Active')}</SelectItem>
                                    <SelectItem value="0">{__('Inactive')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={__('Show')}>
                            <Select value={perPageFilter} onValueChange={setPerPageFilter}>
                                <SelectTrigger className="w-full md:w-24">
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
                    data={categorias}
                    columns={columns}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    filters={{
                        search: searchTerm,
                        status: statusFilter,
                        perPage: perPageFilter,
                        sortBy: filters.sortBy,
                        sortDir: filters.sortDir,
                    }}
                    isLoading={isTableLoading}
                    onRowClick={(categoria) => handleEditClick(categoria)}
                    bulkActions={bulkActions}
                    emptyState={{
                        title: __('No categories found'),
                        description: searchTerm || statusFilter
                            ? __('Try clearing your search filters or changing your query.')
                            : __('You have not registered any categories in the database yet.'),
                        ctaLabel: __('New Category'),
                        onCtaClick: handleCreateClick,
                    }}
                />
            </div>

            {/* Ventana Modal para Crear / Editar */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>
                                {editingCategoria ? __('Edit Category') : __('Create Category')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Define the category name, parent category, description, and upload a thumbnail.')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nombre">{__('Name')}</Label>
                                    <Input
                                        id="nombre"
                                        value={data.nombre}
                                        onChange={handleNombreChange}
                                        required
                                    />
                                    {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slug">{__('Slug')}</Label>
                                    <Input
                                        id="slug"
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
                                        required
                                    />
                                    {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="parent_id">{__('Parent Category')}</Label>
                                <Select
                                    value={data.parent_id === '' ? 'principal' : String(data.parent_id)}
                                    onValueChange={(val) => setData('parent_id', val === 'principal' ? '' : val)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={__('Select parent category')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="principal">{__('Principal (None)')}</SelectItem>
                                        {availableParents.map((parent) => (
                                            <SelectItem key={parent.id} value={String(parent.id)}>
                                                {parent.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.parent_id && <p className="text-xs text-destructive">{errors.parent_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="descripcion">{__('Description')}</Label>
                                <Input
                                    id="descripcion"
                                    value={data.descripcion}
                                    onChange={(e) => setData('descripcion', e.target.value)}
                                />
                                {errors.descripcion && <p className="text-xs text-destructive">{errors.descripcion}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="imagen">{__('Category Image / Banner')}</Label>
                                <Input
                                    id="imagen"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setData('imagen', file);
                                    }}
                                />
                                {errors.imagen && <p className="text-xs text-destructive">{errors.imagen}</p>}
                                {editingCategoria && editingCategoria.imagen && !data.imagen && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">{__('Current image:')}</span>
                                        <img src={editingCategoria.imagen} className="h-8 w-auto object-contain border rounded p-0.5 bg-slate-50" />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <Switch
                                    id="activo"
                                    checked={data.activo}
                                    onCheckedChange={(checked) => setData('activo', checked)}
                                />
                                <Label htmlFor="activo">{__('Active')}</Label>
                            </div>
                        </div>

                        <DialogFooter className="mt-6 pt-6 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={processing}>
                                {__('Cancel')}
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? __('Saving...') : __('Save Changes')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Diálogo de Confirmación de Eliminación */}
            <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleBulkDeleteConfirm}
                isConfirming={processing}
                title={selectedIds.length === 1 ? __('Delete category?') : __('Delete selected categories?')}
                description={
                    selectedIds.length === 1
                        ? __('Are you sure you want to delete :count category permanently? This action cannot be undone.', { count: '1' })
                        : __('Are you sure you want to delete :count categories permanently? This action cannot be undone.', { count: String(selectedIds.length) })
                }
            />
        </>
    );
}
