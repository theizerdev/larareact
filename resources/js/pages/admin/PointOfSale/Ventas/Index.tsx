import { Head, router } from '@inertiajs/react';
import { ShoppingCart, Receipt, CheckCircle, Eye, CreditCard, DollarSign, Calendar, User } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams, cn } from '@/lib/utils';
import type { Paginated } from '@/types/app';

interface SaleItem {
    id: number;
    nombre: string;
    concepto_tipo: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
}

interface Sale {
    id: number;
    codigo_ticket: string;
    cliente_nombre: string;
    metodo_pago: string;
    subtotal: number;
    impuesto: number;
    descuento: number;
    total: number;
    monto_recibido: number;
    cambio: number;
    estado: 'completada' | 'anulada';
    notas: string | null;
    user?: { name: string };
    items: SaleItem[];
    created_at: string;
}

interface Props {
    sales: Paginated<Sale>;
    currencySymbol?: string;
    filters: {
        search?: string;
        status?: string;
        perPage?: string;
    };
}

export default function Index({ sales, currencySymbol = '$', filters }: Props) {
    const { __ } = useTranslate();
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    // Filters
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
        { title: __('Historial de Ventas'), href: '/admin/ventas' },
    ];

    const columns: ColumnDef<Sale>[] = [
        {
            header: __('Ticket'),
            accessorKey: 'codigo_ticket',
            cell: (sale) => (
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                    {sale.codigo_ticket}
                </span>
            ),
        },
        {
            header: __('Cliente'),
            accessorKey: 'cliente_nombre',
            cell: (sale) => (
                <span className="font-medium text-sm">
                    {sale.cliente_nombre || 'Cliente General'}
                </span>
            ),
        },
        {
            header: __('Método de Pago'),
            accessorKey: 'metodo_pago',
            cell: (sale) => (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <CreditCard className="w-3 h-3 text-slate-500" />
                    {sale.metodo_pago.toUpperCase()}
                </span>
            ),
        },
        {
            header: __('Total Venta'),
            accessorKey: 'total',
            cell: (sale) => (
                <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {currencySymbol}{Number(sale.total || 0).toFixed(2)}
                </span>
            ),
        },
        {
            header: __('Cajero'),
            accessorKey: 'user.name',
            cell: (sale) => (
                <span className="text-xs text-muted-foreground">
                    {sale.user?.name || '-'}
                </span>
            ),
        },
        {
            header: __('Estado'),
            accessorKey: 'estado',
            cell: (sale) => (
                <span className={cn(
                    'text-xs font-medium px-2.5 py-0.5 rounded-full border',
                    sale.estado === 'completada'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900'
                )}>
                    {sale.estado === 'completada' ? __('Completada') : __('Anulada')}
                </span>
            ),
        },
        {
            header: __('Fecha y Hora'),
            accessorKey: 'created_at',
            cell: (sale) => (
                <span className="text-xs text-muted-foreground">
                    {new Date(sale.created_at).toLocaleString()}
                </span>
            ),
        },
        {
            header: __('Acciones'),
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (sale) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSale(sale)}
                >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    {__('Ver Ticket')}
                </Button>
            ),
        },
    ];

    const totalVentasMonto = sales.data.reduce((acc, s) => acc + (s.estado === 'completada' ? Number(s.total || 0) : 0), 0);

    return (
        <>
            <Head title={__('Historial de Ventas - POS')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Receipt className="h-6 w-6 text-white" />}
                    title={__('Historial de Ventas')}
                    description={__('Consulta y revisa todos los tickets de venta emitidos en el Punto de Venta.')}
                    colorClassName="bg-indigo-600"
                >
                    <Button onClick={() => router.get('/admin/ventas/terminal')}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {__('Ir a Terminal POS')}
                    </Button>
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard
                        icon={<Receipt className="h-6 w-6" />}
                        title={__('TOTAL REGISTROS')}
                        value={sales.total || 0}
                        colorClassName="bg-indigo-100 text-indigo-600"
                    />
                    <StatCard
                        icon={<CheckCircle className="h-6 w-6" />}
                        title={__('VENTAS EN ESTA PÁGINA')}
                        value={sales.data.length}
                        colorClassName="bg-blue-100 text-blue-600"
                    />
                    <StatCard
                        icon={<DollarSign className="h-6 w-6" />}
                        title={__('MONTO ACUMULADO (PÁG)')}
                        value={`${currencySymbol}${totalVentasMonto.toFixed(2)}`}
                        colorClassName="bg-emerald-100 text-emerald-600"
                    />
                </div>

                {/* Filtros */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Buscar')}>
                            <Input
                                placeholder={__('Buscar por N° ticket, cliente...')}
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
                                    <SelectItem value="completada">{__('Completada')}</SelectItem>
                                    <SelectItem value="anulada">{__('Anulada')}</SelectItem>
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
                    data={sales}
                />

                {/* Dialog Detail Ticket */}
                {selectedSale && (
                    <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center justify-between">
                                    <span>{__('Detalle de Ticket')}</span>
                                    <span className="font-mono text-sm text-blue-600 font-bold">{selectedSale.codigo_ticket}</span>
                                </DialogTitle>
                                <DialogDescription>
                                    {new Date(selectedSale.created_at).toLocaleString()} | {selectedSale.user?.name || ''}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3 py-2 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">{__('Cliente')}:</span>
                                    <span className="font-semibold">{selectedSale.cliente_nombre}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">{__('Método de Pago')}:</span>
                                    <span className="font-semibold uppercase">{selectedSale.metodo_pago}</span>
                                </div>

                                <div className="space-y-1.5 pt-1">
                                    <p className="font-bold text-xs uppercase text-muted-foreground">{__('Ítems Vendidos')}</p>
                                    <div className="divide-y max-h-48 overflow-y-auto pr-1">
                                        {selectedSale.items?.map((item) => (
                                            <div key={item.id} className="py-1.5 flex justify-between items-center text-xs">
                                                <div>
                                                    <span className="font-medium">{item.nombre}</span>
                                                    <span className="text-muted-foreground block">
                                                        {item.cantidad} x {currencySymbol}{Number(item.precio_unitario).toFixed(2)}
                                                    </span>
                                                </div>
                                                <span className="font-mono font-bold">
                                                    {currencySymbol}{Number(item.subtotal).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t pt-2 space-y-1 text-xs text-muted-foreground">
                                    <div className="flex justify-between">
                                        <span>{__('Subtotal')}:</span>
                                        <span className="font-mono font-semibold text-foreground">{currencySymbol}{Number(selectedSale.subtotal).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t">
                                        <span>{__('TOTAL')}:</span>
                                        <span className="font-mono text-emerald-600 dark:text-emerald-400">{currencySymbol}{Number(selectedSale.total).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedSale(null)}>
                                    {__('Cerrar')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </>
    );
}
