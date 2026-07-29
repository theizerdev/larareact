import { Head, useForm, router } from '@inertiajs/react';
import {
    Users,
    User,
    Plus,
    CheckCircle,
    XCircle,
    MoreVertical,
    Pencil,
    Trash2,
    Eye,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    DollarSign,
    Building
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

interface Cliente {
    id: number;
    nombre: string;
    telefono: string | null;
    email: string | null;
    direccion: string | null;
    limite_credito: number;
    saldo_pendiente: number;
    estado: boolean;
    created_at: string;
}

interface Props {
    clientes: Paginated<Cliente>;
    currencySymbol?: string;
    filters: {
        search?: string;
        status?: string;
        perPage?: string;
    };
}

export default function ClientesIndex({ clientes, currencySymbol = '$', filters }: Props) {
    const { __ } = useTranslate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

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
        { title: __('Clientes'), href: '/admin/clientes' },
    ];

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        limite_credito: '0',
        estado: true,
    });

    const handleOpenCreate = () => {
        reset();
        setEditingCliente(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (cliente: Cliente) => {
        setEditingCliente(cliente);
        setData({
            nombre: cliente.nombre,
            telefono: cliente.telefono || '',
            email: cliente.email || '',
            direccion: cliente.direccion || '',
            limite_credito: String(cliente.limite_credito || '0'),
            estado: cliente.estado,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCliente) {
            put(`/admin/clientes/${editingCliente.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Cliente actualizado exitosamente.'));
                },
                onError: () => notifyError(__('Ocurrió un error al actualizar el cliente.')),
            });
        } else {
            post('/admin/clientes', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Cliente registrado exitosamente.'));
                },
                onError: () => notifyError(__('Ocurrió un error al registrar el cliente.')),
            });
        }
    };

    const handleDelete = (cliente: Cliente) => {
        if (confirm(__('¿Está seguro de eliminar este cliente?'))) {
            router.delete(`/admin/clientes/${cliente.id}`, {
                onSuccess: () => notifySuccess(__('Cliente eliminado exitosamente.')),
                onError: () => notifyError(__('Ocurrió un error al eliminar el cliente.')),
            });
        }
    };

    const columns: ColumnDef<Cliente>[] = [
        {
            header: __('Cliente'),
            accessorKey: 'nombre',
            cell: (cliente) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                        {cliente.nombre.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{cliente.nombre}</p>
                        {cliente.direccion && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" /> {cliente.direccion}
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: __('Contacto'),
            cell: (cliente) => (
                <div className="space-y-1">
                    {cliente.telefono ? (
                        <p className="text-xs flex items-center gap-1.5 font-medium">
                            <Phone className="w-3.5 h-3.5 text-slate-400" /> {cliente.telefono}
                        </p>
                    ) : null}
                    {cliente.email ? (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" /> {cliente.email}
                        </p>
                    ) : null}
                    {!cliente.telefono && !cliente.email && (
                        <span className="text-xs text-muted-foreground">—</span>
                    )}
                </div>
            ),
        },
        {
            header: __('Límite de Crédito'),
            accessorKey: 'limite_credito',
            cell: (cliente) => (
                <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {currencySymbol}{Number(cliente.limite_credito || 0).toFixed(2)}
                </span>
            ),
        },
        {
            header: __('Saldo Pendiente'),
            accessorKey: 'saldo_pendiente',
            cell: (cliente) => (
                <span className={cn(
                    'font-mono text-sm font-bold',
                    (cliente.saldo_pendiente || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                )}>
                    {currencySymbol}{Number(cliente.saldo_pendiente || 0).toFixed(2)}
                </span>
            ),
        },
        {
            header: __('Estado'),
            stopRowClick: true,
            cell: (cliente) => (
                <span className={cn(
                    'text-xs font-medium px-2.5 py-0.5 rounded-full border',
                    cliente.estado
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                )}>
                    {cliente.estado ? __('Activo') : __('Inactivo')}
                </span>
            ),
        },
        {
            header: __('Acciones'),
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (cliente) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.get(`/admin/clientes/${cliente.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {__('Ver Detalle')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEdit(cliente)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Editar')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(cliente)} className="text-rose-500 hover:text-rose-700">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {__('Eliminar')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const totalCount = clientes?.total || clientes?.data?.length || 0;
    const items = clientes?.data || (Array.isArray(clientes) ? clientes : []);
    const activeCount = items.filter((c) => c.estado).length;
    const withDebtCount = items.filter((c) => (c.saldo_pendiente || 0) > 0).length;

    return (
        <>
            <Head title={__('Gestión de Clientes')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Users className="h-6 w-6 text-white" />}
                    title={__('Gestión de Clientes')}
                    description={__('Administre su catálogo de clientes, límites de crédito y estado de cuentas por cobrar.')}
                    colorClassName="bg-indigo-600"
                >
                    <Button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                        <Plus className="mr-2 h-4 w-4" />
                        {__('Nuevo Cliente')}
                    </Button>
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard
                        icon={<Users className="h-6 w-6" />}
                        title={__('TOTAL CLIENTES')}
                        value={totalCount}
                        colorClassName="bg-indigo-100 text-indigo-600"
                    />
                    <StatCard
                        icon={<CreditCard className="h-6 w-6" />}
                        title={__('CON SALDO PENDIENTE')}
                        value={withDebtCount}
                        colorClassName="bg-amber-100 text-amber-600"
                    />
                    <StatCard
                        icon={<CheckCircle className="h-6 w-6" />}
                        title={__('CLIENTES ACTIVOS')}
                        value={activeCount}
                        colorClassName="bg-emerald-100 text-emerald-600"
                    />
                </div>

                {/* Filtros */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Buscar')}>
                            <Input
                                placeholder={__('Buscar por nombre, teléfono, email...')}
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
                    data={clientes}
                />

                {/* Dialog Modal Crear / Editar Cliente */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editingCliente ? __('Editar Cliente') : __('Nuevo Cliente')}</DialogTitle>
                            <DialogDescription>
                                {__('Complete los datos del cliente para actualizar el catálogo del punto de venta.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">{__('Nombre del Cliente')}</Label>
                                <Input
                                    id="nombre"
                                    value={data.nombre}
                                    onChange={(e) => setData('nombre', e.target.value)}
                                    placeholder="Ej: Juan Pérez"
                                    required
                                />
                                {errors.nombre && <p className="text-xs text-rose-500">{errors.nombre}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="telefono">{__('Teléfono')}</Label>
                                    <Input
                                        id="telefono"
                                        value={data.telefono}
                                        onChange={(e) => setData('telefono', e.target.value)}
                                        placeholder="Ej: +503 7000-0000"
                                    />
                                    {errors.telefono && <p className="text-xs text-rose-500">{errors.telefono}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">{__('Email')}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="ejemplo@correo.com"
                                    />
                                    {errors.email && <p className="text-xs text-rose-500">{errors.email}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="limite_credito">{__('Límite de Crédito')} ({currencySymbol})</Label>
                                    <Input
                                        id="limite_credito"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.limite_credito}
                                        onChange={(e) => setData('limite_credito', e.target.value)}
                                        placeholder="0.00"
                                    />
                                    {errors.limite_credito && <p className="text-xs text-rose-500">{errors.limite_credito}</p>}
                                </div>

                                {editingCliente && (
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-800 self-end">
                                        <div>
                                            <Label className="font-semibold text-sm">{__('Cliente Activo')}</Label>
                                            <p className="text-xs text-muted-foreground">{__('Habilitado para ventas')}</p>
                                        </div>
                                        <Switch
                                            checked={data.estado}
                                            onCheckedChange={(val) => setData('estado', val)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="direccion">{__('Dirección / Ubicación')}</Label>
                                <Textarea
                                    id="direccion"
                                    value={data.direccion}
                                    onChange={(e) => setData('direccion', e.target.value)}
                                    placeholder="Dirección completa del cliente..."
                                    rows={3}
                                />
                                {errors.direccion && <p className="text-xs text-rose-500">{errors.direccion}</p>}
                            </div>

                            <DialogFooter className="pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={processing}
                                >
                                    {__('Cancelar')}
                                </Button>
                                <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                                    {processing ? __('Guardando...') : editingCliente ? __('Actualizar Cliente') : __('Guardar Cliente')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
