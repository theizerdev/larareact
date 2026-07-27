import { Head, useForm, router } from '@inertiajs/react';
import {
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    DollarSign,
    Plus,
    Lock,
    ArrowLeft,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface User {
    id: number;
    name: string;
    email: string;
}

interface CashMovement {
    id: number;
    cash_register_id: number;
    type: 'inflow' | 'outflow';
    amount: number;
    description: string | null;
    created_by: number;
    creator?: User;
    created_at: string;
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
    movements: CashMovement[];
}

interface Summary {
    inflows: number;
    outflows: number;
    current_balance: number;
    currency_symbol?: string;
}

interface Props {
    caja: CashRegister;
    summary: Summary;
}

export default function Show({ caja, summary }: Props) {
    const { __ } = useTranslate();
    const [isMovementOpen, setIsMovementOpen] = useState(false);
    const currencySymbol = summary.currency_symbol || '$';

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Punto de Venta'), href: '#' },
        { title: __('Flujo de Caja'), href: '/admin/cajas' },
        { title: `${__('Caja')} #${caja.id}`, href: `/admin/cajas/${caja.id}` },
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'inflow' as 'inflow' | 'outflow',
        amount: '',
        description: '',
    });

    const handleOpenMovement = () => {
        reset();
        setIsMovementOpen(true);
    };

    const handleMovementSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/cajas/${caja.id}/movement`, {
            onSuccess: () => {
                setIsMovementOpen(false);
                reset();
                notifySuccess(__('Movimiento registrado exitosamente.'));
            },
            onError: () => notifyError(__('Ocurrió un error al registrar el movimiento.')),
        });
    };

    const handleCloseRegister = () => {
        if (confirm(__('¿Está seguro de cerrar esta caja? Se calculará automáticamente el saldo final.'))) {
            router.post(`/admin/cajas/${caja.id}/close`, {}, {
                onSuccess: () => notifySuccess(__('Caja cerrada exitosamente.')),
                onError: () => notifyError(__('Ocurrió un error al cerrar la caja.')),
            });
        }
    };

    const columns: ColumnDef<CashMovement>[] = [
        {
            header: __('Tipo'),
            accessorKey: 'type',
            cell: (movement) => (
                <div className="flex items-center gap-2">
                    {movement.type === 'inflow' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900">
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                            {__('Ingreso')}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900">
                            <ArrowDownCircle className="w-3.5 h-3.5" />
                            {__('Egreso')}
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: __('Monto'),
            accessorKey: 'amount',
            cell: (movement) => (
                <span className={cn(
                    'font-mono font-bold text-sm',
                    movement.type === 'inflow' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                )}>
                    {movement.type === 'inflow' ? '+' : '-'}{currencySymbol}{Number(movement.amount || 0).toFixed(2)}
                </span>
            ),
        },
        {
            header: __('Descripción / Motivo'),
            accessorKey: 'description',
            cell: (movement) => (
                <span className="text-sm">
                    {movement.description || <span className="italic text-muted-foreground">{__('Sin descripción')}</span>}
                </span>
            ),
        },
        {
            header: __('Registrado Por'),
            accessorKey: 'creator.name',
            cell: (movement) => (
                <span className="text-sm font-medium">
                    {movement.creator?.name || `Usuario #${movement.created_by}`}
                </span>
            ),
        },
        {
            header: __('Fecha y Hora'),
            accessorKey: 'created_at',
            cell: (movement) => (
                <span className="text-xs text-muted-foreground">
                    {new Date(movement.created_at).toLocaleString()}
                </span>
            ),
        },
    ];

    const isOpen = caja.status === 'open';
    const finalBalance = isOpen
        ? Number(summary.current_balance || 0)
        : Number(caja.closing_amount !== null && caja.closing_amount !== undefined ? caja.closing_amount : summary.current_balance);

    return (
        <>
            <Head title={`${__('Detalle de Caja')} #${caja.id}`} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Wallet className="h-6 w-6 text-white" />}
                    title={`${__('Detalle de Caja')} #${caja.id}`}
                    description={`${__('Cajero')}: ${caja.user?.name || ''} | ${__('Apertura')}: ${new Date(caja.opened_at).toLocaleString()}`}
                    colorClassName={isOpen ? 'bg-emerald-600' : 'bg-slate-600'}
                >
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="bg-white text-slate-900 border-slate-200 hover:bg-slate-100 hover:text-slate-900 font-medium"
                            onClick={() => router.get('/admin/cajas')}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4 text-slate-900" />
                            {__('Volver a Cajas')}
                        </Button>

                        {isOpen && (
                            <>
                                <Button onClick={handleOpenMovement}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    {__('Registrar Movimiento')}
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleCloseRegister}
                                >
                                    <Lock className="mr-2 h-4 w-4" />
                                    {__('Cerrar Caja')}
                                </Button>
                            </>
                        )}
                    </div>
                </ModuleHeader>

                {/* Banner si la caja está cerrada */}
                {!isOpen && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800 p-4 flex items-center gap-3">
                        <Lock className="h-5 w-5 text-slate-500" />
                        <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {__('Esta caja se encuentra CERRADA')} ({caja.closed_at ? new Date(caja.closed_at).toLocaleString() : ''})
                            </p>
                            <p className="text-xs text-slate-500">
                                {__('Los movimientos registrados en esta sesión de caja son de solo lectura y no se pueden modificar.')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Summary Stat Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={<Wallet className="h-6 w-6" />}
                        title={__('MONTO INICIAL')}
                        value={`${currencySymbol}${Number(caja.opening_amount || 0).toFixed(2)}`}
                        colorClassName="bg-blue-100 text-blue-600"
                    />
                    <StatCard
                        icon={<ArrowUpCircle className="h-6 w-6" />}
                        title={__('TOTAL INGRESOS')}
                        value={`${currencySymbol}${Number(summary.inflows || 0).toFixed(2)}`}
                        colorClassName="bg-emerald-100 text-emerald-600"
                    />
                    <StatCard
                        icon={<ArrowDownCircle className="h-6 w-6" />}
                        title={__('TOTAL EGRESOS')}
                        value={`${currencySymbol}${Number(summary.outflows || 0).toFixed(2)}`}
                        colorClassName="bg-rose-100 text-rose-600"
                    />
                    <StatCard
                        icon={<DollarSign className="h-6 w-6" />}
                        title={isOpen ? __('SALDO ACTUAL') : __('SALDO FINAL DE CIERRE')}
                        value={`${currencySymbol}${finalBalance.toFixed(2)}`}
                        colorClassName={isOpen ? 'bg-amber-100 text-amber-600' : 'bg-purple-100 text-purple-600'}
                    />
                </div>

                {/* Tabla de Movimientos */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold tracking-tight">{__('Historial de Movimientos')}</h2>
                        <span className="text-xs text-muted-foreground">
                            {caja.movements?.length || 0} {__('movimientos registrados')}
                        </span>
                    </div>

                    <DataTable
                        columns={columns}
                        data={{
                            data: caja.movements || [],
                            total: caja.movements?.length || 0,
                            per_page: 100,
                            current_page: 1,
                            last_page: 1,
                            from: 1,
                            to: caja.movements?.length || 0,
                        }}
                    />
                </div>

                {/* Dialog registrar movimiento */}
                <Dialog open={isMovementOpen} onOpenChange={setIsMovementOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{__('Registrar Movimiento de Caja')}</DialogTitle>
                            <DialogDescription>
                                {__('Registre una entrada o salida de dinero de la caja actual.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleMovementSubmit} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="type">{__('Tipo de Movimiento')}</Label>
                                <Select
                                    value={data.type}
                                    onValueChange={(val: 'inflow' | 'outflow') => setData('type', val)}
                                >
                                    <SelectTrigger id="type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="inflow">{__('Ingreso (+) Entrada de dinero')}</SelectItem>
                                        <SelectItem value="outflow">{__('Egreso (-) Salida de dinero')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.type && <p className="text-xs text-rose-500">{errors.type}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">{__('Monto')} ({currencySymbol})</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    placeholder="Ej: 50.00"
                                    required
                                />
                                {errors.amount && <p className="text-xs text-rose-500">{errors.amount}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">{__('Descripción / Motivo')}</Label>
                                <Textarea
                                    id="description"
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder={__('Ej: Pago de flete, venta en efectivo, base para cambio...')}
                                />
                                {errors.description && <p className="text-xs text-rose-500">{errors.description}</p>}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsMovementOpen(false)}>
                                    {__('Cancelar')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {__('Guardar Movimiento')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
