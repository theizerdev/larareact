import { Head, useForm, router } from '@inertiajs/react';
import {
    Truck,
    Plus,
    CheckCircle,
    XCircle,
    MoreVertical,
    Pencil,
    Trash2,
    Phone,
    Mail,
    MapPin,
    Building2,
    FileText,
    Tag,
    User
} from 'lucide-react';
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

interface Proveedor {
    id: number;
    razon_social: string;
    nombre_comercial?: string | null;
    rif_documento?: string | null;
    contacto_nombre?: string | null;
    telefono?: string | null;
    email?: string | null;
    direccion?: string | null;
    categoria_insumos?: string | null;
    notas?: string | null;
    estado: boolean;
    created_at: string;
}

interface Props {
    proveedores: Paginated<Proveedor>;
    filters: {
        search?: string;
        status?: string;
        perPage?: string;
    };
}

export default function ProveedoresIndex({ proveedores, filters }: Props) {
    const { __ } = useTranslate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);

    // Filtros de búsqueda
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
        { title: __('Dashboard'), href: '/dashboard' },
        { title: __('Punto de Venta'), href: '#' },
        { title: __('Proveedores'), href: '/admin/proveedores' },
    ];

    const { data, setData, post, put, processing, errors, reset } = useForm({
        razon_social: '',
        nombre_comercial: '',
        rif_documento: '',
        contacto_nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        categoria_insumos: '',
        notas: '',
        estado: true,
    });

    const handleOpenCreate = () => {
        reset();
        setEditingProveedor(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (proveedor: Proveedor) => {
        setEditingProveedor(proveedor);
        setData({
            razon_social: proveedor.razon_social,
            nombre_comercial: proveedor.nombre_comercial || '',
            rif_documento: proveedor.rif_documento || '',
            contacto_nombre: proveedor.contacto_nombre || '',
            telefono: proveedor.telefono || '',
            email: proveedor.email || '',
            direccion: proveedor.direccion || '',
            categoria_insumos: proveedor.categoria_insumos || '',
            notas: proveedor.notas || '',
            estado: proveedor.estado,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProveedor) {
            put(`/admin/proveedores/${editingProveedor.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Proveedor actualizado exitosamente.'));
                },
                onError: () => notifyError(__('Ocurrió un error al actualizar el proveedor.')),
            });
        } else {
            post('/admin/proveedores', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Proveedor registrado exitosamente.'));
                },
                onError: () => notifyError(__('Ocurrió un error al registrar el proveedor.')),
            });
        }
    };

    const handleDelete = (proveedor: Proveedor) => {
        if (confirm(__('¿Está seguro de eliminar este proveedor?'))) {
            router.delete(`/admin/proveedores/${proveedor.id}`, {
                onSuccess: () => notifySuccess(__('Proveedor eliminado exitosamente.')),
                onError: () => notifyError(__('Ocurrió un error al eliminar el proveedor.')),
            });
        }
    };

    const columns: ColumnDef<Proveedor>[] = [
        {
            header: __('Proveedor / Razón Social'),
            accessorKey: 'razon_social',
            cell: (prov) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shrink-0">
                        <Truck className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{prov.razon_social}</p>
                        {prov.nombre_comercial && (
                            <p className="text-xs text-muted-foreground font-medium">{prov.nombre_comercial}</p>
                        )}
                        {prov.rif_documento && (
                            <span className="inline-block text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border mt-0.5">
                                {prov.rif_documento}
                            </span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: __('Contacto / Teléfono'),
            accessorKey: 'telefono',
            cell: (prov) => (
                <div className="space-y-0.5 text-xs">
                    {prov.contacto_nombre && (
                        <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <User className="w-3 h-3 text-muted-foreground shrink-0" />
                            {prov.contacto_nombre}
                        </p>
                    )}
                    {prov.telefono && (
                        <p className="font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                            {prov.telefono}
                        </p>
                    )}
                    {prov.email && (
                        <p className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 shrink-0" />
                            {prov.email}
                        </p>
                    )}
                </div>
            ),
        },
        {
            header: __('Categoría / Insumos'),
            accessorKey: 'categoria_insumos',
            cell: (prov) => (
                <div>
                    {prov.categoria_insumos ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-900">
                            <Tag className="w-3 h-3" />
                            {prov.categoria_insumos}
                        </span>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">—</span>
                    )}
                </div>
            ),
        },
        {
            header: __('Estado'),
            accessorKey: 'estado',
            cell: (prov) => (
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
                        prov.estado
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                    )}
                >
                    {prov.estado ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {prov.estado ? __('Activo') : __('Inactivo')}
                </span>
            ),
        },
        {
            header: __('Acciones'),
            accessorKey: 'id',
            cell: (prov) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(prov)}>
                            <Pencil className="mr-2 h-4 w-4 text-blue-500" />
                            {__('Editar Proveedor')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(prov)} className="text-rose-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {__('Eliminar')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const filterFields: FilterField[] = [
        {
            name: 'search',
            label: __('Buscar'),
            type: 'text',
            placeholder: __('Buscar por razón social, RIF, contacto...'),
        },
        {
            name: 'status',
            label: __('Estado'),
            type: 'select',
            options: [
                { label: __('Todos'), value: '' },
                { label: __('Activos'), value: 'active' },
                { label: __('Inactivos'), value: 'inactive' },
            ],
        },
    ];

    const activeCount = proveedores?.data ? proveedores.data.filter((p) => p.estado).length : 0;

    return (
        <div className="space-y-6">
            <Head title={__('Gestión de Proveedores')} />

            <Breadcrumbs breadcrumbs={breadcrumbs} />

            <ModuleHeader
                icon={<Truck className="h-6 w-6 text-white" />}
                title={__('Gestión de Proveedores')}
                description={__('Administre la red de distribuidores, marcas y proveedores de suministros e insumos.')}
                colorClassName="bg-blue-600"
            >
                <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    <Plus className="mr-2 h-4 w-4" />
                    {__('Nuevo Proveedor')}
                </Button>
            </ModuleHeader>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <StatCard
                    icon={<Truck className="h-6 w-6" />}
                    title={__('TOTAL PROVEEDORES')}
                    value={proveedores?.total || proveedores?.data?.length || 0}
                    colorClassName="bg-blue-100 text-blue-600"
                />
                <StatCard
                    icon={<CheckCircle className="h-6 w-6" />}
                    title={__('PROVEEDORES ACTIVOS')}
                    value={activeCount}
                    colorClassName="bg-emerald-100 text-emerald-600"
                />
                <StatCard
                    icon={<XCircle className="h-6 w-6" />}
                    title={__('INACTIVOS / DESHABILITADOS')}
                    value={(proveedores?.total || proveedores?.data?.length || 0) - activeCount}
                    colorClassName="bg-amber-100 text-amber-600"
                />
            </div>

            <div className="bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-sm space-y-4">
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Buscar')}>
                            <Input
                                placeholder={__('Buscar por razón social, RIF, contacto...')}
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
                                    <SelectItem value="active">{__('Activos')}</SelectItem>
                                    <SelectItem value="inactive">{__('Inactivos')}</SelectItem>
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
                    data={proveedores}
                />
            </div>

            {/* MODAL REGISTRO / EDICIÓN PROVEEDOR */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-blue-600">
                            <Truck className="w-5 h-5" />
                            {editingProveedor ? __('Editar Proveedor') : __('Registrar Nuevo Proveedor')}
                        </DialogTitle>
                        <DialogDescription>
                            {__('Complete la información corporativa, datos de contacto y rubro de suministro.')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1 sm:col-span-2">
                                <Label className="font-bold">{__('Razón Social / Firma')} *</Label>
                                <Input
                                    value={data.razon_social}
                                    onChange={(e) => setData('razon_social', e.target.value)}
                                    placeholder={__('Ej. Distribuidora Electrónica C.A.')}
                                    required
                                />
                                {errors.razon_social && <p className="text-xs text-rose-500">{errors.razon_social}</p>}
                            </div>

                            <div className="space-y-1">
                                <Label className="font-semibold">{__('Nombre Comercial')}</Label>
                                <Input
                                    value={data.nombre_comercial}
                                    onChange={(e) => setData('nombre_comercial', e.target.value)}
                                    placeholder={__('Ej. ElectroServitec')}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="font-semibold">{__('Documento Fiscal')}</Label>
                                <Input
                                    value={data.rif_documento}
                                    onChange={(e) => setData('rif_documento', e.target.value)}
                                    placeholder={__('Ej. J-12345678-9')}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="font-semibold">{__('Persona de Contacto')}</Label>
                                <Input
                                    value={data.contacto_nombre}
                                    onChange={(e) => setData('contacto_nombre', e.target.value)}
                                    placeholder={__('Ej. Ing. Carlos Mendoza')}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="font-semibold">{__('Teléfono de Contacto')}</Label>
                                <Input
                                    value={data.telefono}
                                    onChange={(e) => setData('telefono', e.target.value)}
                                    placeholder={__('Ej. +58 (414) 123-4567')}
                                />
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                                <Label className="font-semibold">{__('Correo Electrónico')}</Label>
                                <Input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder={__('ventas@distribuidora.com')}
                                />
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                                <Label className="font-semibold">{__('Categoría / Rubro de Insumos')}</Label>
                                <Input
                                    value={data.categoria_insumos}
                                    onChange={(e) => setData('categoria_insumos', e.target.value)}
                                    placeholder={__('Ej. Repuestos de Pantallas, Cables, Herramientas...')}
                                />
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                                <Label className="font-semibold">{__('Dirección Física')}</Label>
                                <Textarea
                                    value={data.direccion}
                                    onChange={(e) => setData('direccion', e.target.value)}
                                    placeholder={__('Dirección de depósitos o almacén principal...')}
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                                <Label className="font-semibold">{__('Notas Internas')}</Label>
                                <Textarea
                                    value={data.notas}
                                    onChange={(e) => setData('notas', e.target.value)}
                                    placeholder={__('Condiciones de crédito, días de entrega...')}
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-800">
                            <Label className="font-bold flex items-center gap-2">
                                {__('Estado del Proveedor')}
                            </Label>
                            <Switch
                                checked={data.estado}
                                onCheckedChange={(val) => setData('estado', val)}
                            />
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                {__('Cancelar')}
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700 font-bold">
                                {editingProveedor ? __('Guardar Cambios') : __('Registrar Proveedor')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
