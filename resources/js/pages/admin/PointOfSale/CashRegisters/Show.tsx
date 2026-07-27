import { Head, useForm, router } from '@inertiajs/react';
import {
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    DollarSign,
    Plus,
    Lock,
    ArrowLeft,
    CreditCard,
    Building2,
    Smartphone,
    Tag,
    Layers,
    Receipt,
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
    concepto: string;
    metodo_pago: string;
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

interface GroupedAmount {
    inflow: number;
    outflow: number;
    net: number;
}

interface Summary {
    inflows: number;
    outflows: number;
    current_balance: number;
    currency_symbol?: string;
    by_payment_method?: Record<string, GroupedAmount>;
    by_concept?: Record<string, GroupedAmount>;
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
        concepto: 'venta',
        metodo_pago: 'efectivo',
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

    const formatConceptoLabel = (key: string) => {
        switch (key) {
            case 'venta': return __('Venta');
            case 'reparacion': return __('Reparación de Equipo');
            case 'compra': return __('Compra');
            case 'gasto': return __('Gasto Operacional');
            case 'ajuste': return __('Ajuste de Caja');
            default: return key.charAt(0).toUpperCase() + key.slice(1);
        }
    };

    const formatMetodoPagoLabel = (key: string) => {
        switch (key) {
            case 'efectivo': return __('Efectivo');
            case 'transferencia': return __('Transferencia Bancaria');
            case 'tarjeta': return __('Tarjeta Débito/Crédito');
            case 'pago_movil': return __('Pago Móvil');
            default: return key.charAt(0).toUpperCase() + key.slice(1);
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
            header: __('Concepto'),
            accessorKey: 'concepto',
            cell: (movement) => (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <Tag className="w-3 h-3 text-slate-500" />
                    {formatConceptoLabel(movement.concepto || 'otro')}
                </span>
            ),
        },
        {
            header: __('Método de Pago'),
            accessorKey: 'metodo_pago',
            cell: (movement) => (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30 text-xs font-medium text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                    <CreditCard className="w-3 h-3 text-blue-500" />
                    {formatMetodoPagoLabel(movement.metodo_pago || 'efectivo')}
                </span>
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

    const paymentMethodList = [
        { key: 'efectivo', label: __('Efectivo'), icon: Wallet },
        { key: 'transferencia', label: __('Transferencia Bancaria'), icon: Building2 },
        { key: 'tarjeta', label: __('Tarjeta Débito/Crédito'), icon: CreditCard },
        { key: 'pago_movil', label: __('Pago Móvil'), icon: Smartphone },
        { key: 'otro', label: __('Otros Métodos'), icon: Receipt },
    ];

    const conceptList = [
        { key: 'venta', label: __('Ventas'), icon: Tag },
        { key: 'reparacion', label: __('Reparación de Equipo'), icon: Layers },
        { key: 'compra', label: __('Compras'), icon: Receipt },
        { key: 'gasto', label: __('Gastos Operacionales'), icon: ArrowDownCircle },
        { key: 'ajuste', label: __('Ajustes de Caja'), icon: DollarSign },
        { key: 'otro', label: __('Otros Conceptos'), icon: Tag },
    ];

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

                {/* Totales Generales */}
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

                {/* Desgloses Agrupados (Listados 6 y 6) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Listado 1: Resumen por Método de Pago (6 cols) */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-200">
                                <CreditCard className="w-4 h-4 text-blue-600" />
                                {__('Resumen por Método de Pago')}
                            </div>
                            <span className="text-xs text-muted-foreground">{paymentMethodList.length} {__('métodos')}</span>
                        </div>
                        <div className="divide-y text-sm flex-1">
                            {paymentMethodList.map((pm) => {
                                const data = summary.by_payment_method?.[pm.key] || { inflow: 0, outflow: 0, net: 0 };
                                const IconComponent = pm.icon;
                                return (
                                    <div key={pm.key} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                                                <IconComponent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{pm.label}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="text-emerald-600">+{currencySymbol}{data.inflow.toFixed(2)}</span>
                                                    <span>•</span>
                                                    <span className="text-rose-600">-{currencySymbol}{data.outflow.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn('font-mono font-bold text-sm', data.net >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600')}>
                                            {currencySymbol}{data.net.toFixed(2)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Listado 2: Resumen por Concepto (6 cols) */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-200">
                                <Tag className="w-4 h-4 text-emerald-600" />
                                {__('Resumen por Concepto')}
                            </div>
                            <span className="text-xs text-muted-foreground">{conceptList.length} {__('conceptos')}</span>
                        </div>
                        <div className="divide-y text-sm flex-1">
                            {conceptList.map((c) => {
                                const data = summary.by_concept?.[c.key] || { inflow: 0, outflow: 0, net: 0 };
                                const IconComponent = c.icon;
                                return (
                                    <div key={c.key} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                                                <IconComponent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{c.label}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="text-emerald-600">+{currencySymbol}{data.inflow.toFixed(2)}</span>
                                                    <span>•</span>
                                                    <span className="text-rose-600">-{currencySymbol}{data.outflow.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn('font-mono font-bold text-sm', data.net >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600')}>
                                            {currencySymbol}{data.net.toFixed(2)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Tabla Completa de Transacciones (Detalle) */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold tracking-tight">{__('Historial Completo de Transacciones')}</h2>
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
                                {__('Registre una entrada o salida de dinero de la caja actual con su concepto y método de pago.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleMovementSubmit} className="space-y-4 py-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                            <SelectItem value="inflow">{__('Ingreso (+) Entrada')}</SelectItem>
                                            <SelectItem value="outflow">{__('Egreso (-) Salida')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && <p className="text-xs text-rose-500">{errors.type}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="concepto">{__('Concepto')}</Label>
                                    <Select
                                        value={data.concepto}
                                        onValueChange={(val: string) => setData('concepto', val)}
                                    >
                                        <SelectTrigger id="concepto">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="venta">{__('Venta')}</SelectItem>
                                            <SelectItem value="reparacion">{__('Reparación de Equipo')}</SelectItem>
                                            <SelectItem value="compra">{__('Compra')}</SelectItem>
                                            <SelectItem value="gasto">{__('Gasto Operacional')}</SelectItem>
                                            <SelectItem value="ajuste">{__('Ajuste de Caja')}</SelectItem>
                                            <SelectItem value="otro">{__('Otro')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.concepto && <p className="text-xs text-rose-500">{errors.concepto}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="metodo_pago">{__('Método de Pago')}</Label>
                                    <Select
                                        value={data.metodo_pago}
                                        onValueChange={(val: string) => setData('metodo_pago', val)}
                                    >
                                        <SelectTrigger id="metodo_pago">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="efectivo">{__('Efectivo')}</SelectItem>
                                            <SelectItem value="transferencia">{__('Transferencia Bancaria')}</SelectItem>
                                            <SelectItem value="tarjeta">{__('Tarjeta Débito/Crédito')}</SelectItem>
                                            <SelectItem value="pago_movil">{__('Pago Móvil')}</SelectItem>
                                            <SelectItem value="otro">{__('Otro')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.metodo_pago && <p className="text-xs text-rose-500">{errors.metodo_pago}</p>}
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
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">{__('Descripción / Motivo')}</Label>
                                <Textarea
                                    id="description"
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder={__('Ej: Pago de flete, venta de accesorio, cambio de pantalla...')}
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
