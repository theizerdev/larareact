import React, { useState } from 'react';
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
import { Tag, Plus, CheckCircle, XCircle, Trash2, MoreVertical, Pencil, ToggleRight, ExternalLink } from 'lucide-react';
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

interface Marca {
    id: number;
    nombre: string;
    slug: string;
    descripcion?: string | null;
    imagen?: string | null;
    sitio_web?: string | null;
    activo: boolean;
}

interface MarcasPageProps {
    auth: Auth;
    marcas: Paginated<Marca>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
    };
    filters: {
        search?: string;
        status?: string;
        perPage?: string;
        sortBy?: string;
        sortDir?: string;
    };
}

export default function MarcasIndexPage({ auth, marcas, stats, filters }: MarcasPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Brands'), href: '/admin/marcas' },
    ];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMarca, setEditingMarca] = useState<Marca | null>(null);
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
        descripcion: '',
        sitio_web: '',
        activo: true,
        imagen: null as File | null,
    });

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .normalize('NFD') // Quitar acentos
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-') // Espacios a guiones
            .replace(/[^\w\-]+/g, '') // Quitar caracteres especiales
            .replace(/\-\-+/g, '-') // Reemplazar guiones múltiples
            .replace(/^-+/, '') // Quitar guiones iniciales
            .replace(/-+$/, ''); // Quitar guiones finales
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
        setEditingMarca(null);
        reset();
        setIsModalOpen(true);
    };

    const handleEditClick = (marca: Marca) => {
        setEditingMarca(marca);
        setData({
            nombre: marca.nombre,
            slug: marca.slug,
            descripcion: marca.descripcion || '',
            sitio_web: marca.sitio_web || '',
            activo: marca.activo,
            imagen: null, // Mantenemos null a menos que el usuario suba otro archivo
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingMarca) {
            // Usamos post con _method: 'put' porque PHP no procesa peticiones multipart (con archivos) sobre PUT
            router.post(`/admin/marcas/${editingMarca.id}`, {
                _method: 'put',
                nombre: data.nombre,
                slug: data.slug,
                descripcion: data.descripcion,
                sitio_web: data.sitio_web,
                activo: data.activo,
                imagen: data.imagen,
            }, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingMarca(null);
                    reset();
                },
            });
        } else {
            post('/admin/marcas', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleToggleActive = (marca: Marca) => {
        router.post(`/admin/marcas/${marca.id}`, {
            _method: 'put',
            nombre: marca.nombre,
            slug: marca.slug,
            descripcion: marca.descripcion || '',
            sitio_web: marca.sitio_web || '',
            activo: !marca.activo,
        }, {
            preserveScroll: true,
        });
    };

    const handleBulkDeleteClick = () => {
        setIsDeleteDialogOpen(true);
    };

    const handleBulkDeleteConfirm = () => {
        router.post('/admin/marcas/bulk-destroy', { ids: selectedIds }, {
            onSuccess: () => {
                setSelectedIds([]);
                setIsDeleteDialogOpen(false);
            },
            preserveScroll: true,
        });
    };

    const bulkActions = [
        {
            label: __('Delete selected'),
            icon: <Trash2 className="h-4 w-4" />,
            onClick: handleBulkDeleteClick,
            variant: 'destructive' as const,
        }
    ];

    const columns: ColumnDef<Marca>[] = [
        {
            header: __('Logo'),
            accessorKey: 'imagen',
            cell: (marca) => (
                <Avatar className="h-10 w-10 border bg-slate-50 dark:bg-slate-900 rounded-md">
                    <AvatarImage src={marca.imagen || undefined} alt={marca.nombre} className="object-contain" />
                    <AvatarFallback className="text-xs bg-sidebar-primary text-sidebar-primary-foreground font-semibold rounded-md">
                        {marca.nombre.substring(0, 2).toUpperCase()}
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
            header: __('Website'),
            accessorKey: 'sitio_web',
            hideOn: 'mobile',
            cell: (marca) => marca.sitio_web ? (
                <a
                    href={marca.sitio_web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline gap-1"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {marca.sitio_web}
                </a>
            ) : (
                <span className="text-muted-foreground text-xs">-</span>
            ),
        },
        {
            header: __('Status'),
            sortable: true,
            sortKey: 'activo',
            stopRowClick: true,
            cell: (marca) => (
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={marca.activo}
                        onCheckedChange={() => handleToggleActive(marca)}
                    />
                    <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full border",
                        marca.activo
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                            : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800"
                    )}>
                        {marca.activo ? __('Active') : __('Inactive')}
                    </span>
                </div>
            )
        },
        {
            header: __('Actions'),
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
                        <DropdownMenuItem onClick={() => handleEditClick(marca)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(marca)}>
                            <ToggleRight className="mr-2 h-4 w-4" />
                            {marca.activo ? __('Deactivate') : __('Activate')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    return (
        <>
            <Head title={__('Brands')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Tag className="h-6 w-6 text-white" />}
                    title={__('Brands')}
                    description={__('Manage ecommerce product brands and manufacturers.')}
                    colorClassName="bg-indigo-600"
                >
                    <Button onClick={handleCreateClick}>
                        <Plus className="mr-2 h-4 w-4" />
                        {__('New Brand')}
                    </Button>
                </ModuleHeader>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard
                        icon={<Tag className="h-6 w-6" />}
                        title={__('TOTAL BRANDS')}
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
                    data={marcas}
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
                    onRowClick={(marca) => handleEditClick(marca)}
                    bulkActions={bulkActions}
                    emptyState={{
                        title: __('No brands found'),
                        description: searchTerm || statusFilter
                            ? __('Try clearing your search filters or changing your query.')
                            : __('You have not registered any brands in the database yet.'),
                        ctaLabel: __('New Brand'),
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
                                {editingMarca ? __('Edit Brand') : __('Create Brand')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Define the brand name, description, website, and upload a logo.')}
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
                                <Label htmlFor="sitio_web">{__('Website')}</Label>
                                <Input
                                    id="sitio_web"
                                    type="url"
                                    placeholder="https://example.com"
                                    value={data.sitio_web}
                                    onChange={(e) => setData('sitio_web', e.target.value)}
                                />
                                {errors.sitio_web && <p className="text-xs text-destructive">{errors.sitio_web}</p>}
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
                                <Label htmlFor="imagen">{__('Brand Logo / Image')}</Label>
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
                                {editingMarca && editingMarca.imagen && !data.imagen && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">{__('Current logo:')}</span>
                                        <img src={editingMarca.imagen} className="h-8 w-auto object-contain border rounded p-0.5 bg-slate-50" />
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
                title={selectedIds.length === 1 ? __('Delete brand?') : __('Delete selected brands?')}
                description={
                    selectedIds.length === 1
                        ? __('Are you sure you want to delete :count brand permanently? This action cannot be undone.', { count: '1' })
                        : __('Are you sure you want to delete :count brands permanently? This action cannot be undone.', { count: String(selectedIds.length) })
                }
            />
        </>
    );
}
