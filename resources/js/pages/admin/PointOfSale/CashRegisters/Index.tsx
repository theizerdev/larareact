import { Head, useForm, router } from '@inertiajs/react';
import { Wallet, Plus, CheckCircle, XCircle, MoreVertical, Eye, Lock } from 'lucide-react';
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
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams, cn } from '@/lib/utils';
import type { Paginated } from '@/types/app';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface User {
    id: number;
    name: string;
    email: string;
}

interface CashRegister {
    id: number;
    user_id: number;
    user: User;
    opening_amount: number;
    closing_amount: number | null;
    opened_at: string;
    closed_at: string | null;
    status: 'open' | 'closed';
    movements_count?: number;
}

interface Props {
    cajas: Paginated<CashRegister>;
    activeRegister?: CashRegister | null;
    currencySymbol?: string;
    filters: {
        search?: string;
        status?: string;
        perPage?: string;
    };
}

export default function Index({ cajas, activeRegister, currencySymbol = '$', filters }: Props) {
    const { __ } = useTranslate();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

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
        { title: __('Flujo de Caja'), href: '/admin/cajas' },
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        opening_amount: '',
        valor_dolar: '20.00',
    });

    const handleOpenCreate = () => {
        reset();
        setIsCreateOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/cajas', {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
                notifySuccess(__('Caja aperturada exitosamente.'));
            },
            onError: () => notifyError(__('Ocurrió un error al abrir la caja.')),
        });
    };

    const handleCloseRegister = (caja: CashRegister) => {
        if (confirm(__('¿Está seguro de cerrar esta caja? Se calculará el saldo final.'))) {
            router.post(`/admin/cajas/${caja.id}/close`, {}, {
                onSuccess: () => notifySuccess(__('Caja cerrada exitosamente.')),
                onError: () => notifyError(__('Ocurrió un error al cerrar la caja.')),
            });
        }
    };

    const columns: ColumnDef<CashRegister>[] = [
        {
            header: __('Cajero / Usuario'),
            accessorKey: 'user.name',
            className: 'font-medium',
            cell: (caja) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="font-medium text-sm">{caja.user?.name || `Usuario #${caja.user_id}`}</p>
                        <p className="text-xs text-muted-foreground">{caja.user?.email}</p>
                    </div>
                </div>
            ),
        },
        {
            header: __('Monto Inicial'),
            accessorKey: 'opening_amount',
            cell: (caja) => (
                <span className="font-mono font-medium">
                    {currencySymbol}{Number(caja.opening_amount || 0).toFixed(2)}
                </span>
            ),
        },
        {
            header: __('Monto Final'),
            accessorKey: 'closing_amount',
            cell: (caja) => (
                <span className="font-mono font-medium">
                    {caja.closing_amount !== null && caja.closing_amount !== undefined
                        ? `${currencySymbol}${Number(caja.closing_amount).toFixed(2)}`
                        : '-'}
                </span>
            ),
        },
        {
            header: __('Estado'),
            stopRowClick: true,
            cell: (caja) => (
                <span className={cn(
                    'text-xs font-medium px-2.5 py-0.5 rounded-full border',
                    caja.status === 'open'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                )}>
                    {caja.status === 'open' ? __('Abierta') : __('Cerrada')}
                </span>
            ),
        },
        {
            header: __('Apertura'),
            accessorKey: 'opened_at',
            cell: (caja) => (
                <span className="text-xs text-muted-foreground">
                    {caja.opened_at ? new Date(caja.opened_at).toLocaleString() : '-'}
                </span>
            ),
        },
        {
            header: __('Cierre'),
            accessorKey: 'closed_at',
            cell: (caja) => (
                <span className="text-xs text-muted-foreground">
                    {caja.closed_at ? new Date(caja.closed_at).toLocaleString() : '-'}
                </span>
            ),
        },
        {
            header: __('Acciones'),
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (caja) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.get(`/admin/cajas/${caja.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {__('Ver Detalle')}
                        </DropdownMenuItem>
                        {caja.status === 'open' && (
                            <DropdownMenuItem
                                onClick={() => handleCloseRegister(caja)}
                                className="text-rose-500 hover:text-rose-700"
                            >
                                <Lock className="mr-2 h-4 w-4" />
                                {__('Cerrar Caja')}
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const totalCount = cajas.total || 0;
    const openCount = cajas.data.filter((c) => c.status === 'open').length;
    const closedCount = cajas.data.filter((c) => c.status === 'closed').length;

    return (
        <>
            <Head title={__('Flujo de Caja - Apertura y Cierre')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Wallet className="h-6 w-6 text-white" />}
                    title={__('Flujo de Caja')}
                    description={__('Gestión de aperturas, cierres y movimientos de dinero en caja.')}
                    colorClassName="bg-blue-600"
                >
                    {activeRegister ? (
                        <Button
                            variant="default"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => router.get(`/admin/cajas/${activeRegister.id}`)}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            {__('Ir a mi Caja Abierta')} ({currencySymbol}{Number(activeRegister.opening_amount || 0).toFixed(2)})
                        </Button>
                    ) : (
                        <Button onClick={handleOpenCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            {__('Aperturar Caja')}
                        </Button>
                    )}
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard
                        icon={<Wallet className="h-6 w-6" />}
                        title={__('TOTAL REGISTROS DE CAJA')}
                        value={totalCount}
                        colorClassName="bg-blue-100 text-blue-600"
                    />
                    <StatCard
                        icon={<CheckCircle className="h-6 w-6" />}
                        title={__('CAJAS ABIERTAS')}
                        value={openCount}
                        colorClassName="bg-emerald-100 text-emerald-600"
                    />
                    <StatCard
                        icon={<XCircle className="h-6 w-6" />}
                        title={__('CAJAS CERRADAS')}
                        value={closedCount}
                        colorClassName="bg-slate-100 text-slate-600"
                    />
                </div>

                {/* Filtros */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Buscar por Cajero')}>
                            <Input
                                placeholder={__('Buscar usuario...')}
                                className="w-full md:w-80"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Estado')}>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-44">
                                    <SelectValue placeholder={__('Todos')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('Todos')}</SelectItem>
                                    <SelectItem value="open">{__('Abiertas')}</SelectItem>
                                    <SelectItem value="closed">{__('Cerradas')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                        <FilterField label={__('Registros por página')}>
                            <Select value={perPageFilter} onValueChange={setPerPageFilter}>
                                <SelectTrigger className="w-full md:w-36">
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
                    data={cajas}
                />

                {/* Dialog Modal Aperturar Caja */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{__('Aperturar Caja')}</DialogTitle>
                            <DialogDescription>
                                {__('Ingrese el monto inicial en efectivo para iniciar la sesión de caja.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="opening_amount">{__('Monto Inicial')} ({currencySymbol})</Label>
                                <Input
                                    id="opening_amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.opening_amount}
                                    onChange={(e) => setData('opening_amount', e.target.value)}
                                    placeholder="Ej: 100.00"
                                    required
                                />
                                {errors.opening_amount && (
                                    <p className="text-xs text-rose-500">{errors.opening_amount}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="valor_dolar">{__('Valor del Dólar ($1 USD en MXN)')}</Label>
                                <Input
                                    id="valor_dolar"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={data.valor_dolar}
                                    onChange={(e) => setData('valor_dolar', e.target.value)}
                                    placeholder="Ej: 20.00"
                                    required
                                />
                                {errors.valor_dolar && (
                                    <p className="text-xs text-rose-500">{errors.valor_dolar}</p>
                                )}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    {__('Cancelar')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {__('Abrir Caja')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
