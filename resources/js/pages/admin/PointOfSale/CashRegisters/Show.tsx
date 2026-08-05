import { Head, useForm, router, usePage } from '@inertiajs/react';
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
    Printer,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Calendar,
    User as UserIcon,
    Filter,
    Search,
    Coins,
    Scale
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    counted_amount: number | null;
    expected_amount: number | null;
    difference: number | null;
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
    const pageProps = usePage().props as any;
    const empresa = pageProps?.empresa;
    const [isMovementOpen, setIsMovementOpen] = useState(false);
    const [isCloseOpen, setIsCloseOpen] = useState(false);
    const [countedAmount, setCountedAmount] = useState('');
    const [countedUSDShow, setCountedUSDShow] = useState('');
    const [movementFilter, setMovementFilter] = useState<'all' | 'inflow' | 'outflow'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const currencySymbol = summary.currency_symbol || '$';
    const rateUSD = summary.valor_dolar || 20.0;

    const expectedAmount = summary.current_balance;
    const countedMXNNum = parseFloat(countedAmount) || 0;
    const countedUSDNum = parseFloat(countedUSDShow) || 0;
    const totalCountedCombined = countedMXNNum + (countedUSDNum * rateUSD);
    const diffShow = (countedAmount !== '' || countedUSDShow !== '') ? totalCountedCombined - expectedAmount : null;

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/dashboard' },
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

    const handleCloseRegister = () => setIsCloseOpen(true);

    const handleConfirmClose = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(`/admin/cajas/${caja.id}/close`,
            { counted_amount: countedAmount !== '' ? parseFloat(countedAmount) : null },
            {
                onSuccess: () => { setIsCloseOpen(false); notifySuccess(__('Caja cerrada exitosamente.')); },
                onError: () => notifyError(__('Ocurrió un error al cerrar la caja.')),
            }
        );
    };

    const handlePrint = () => {
        window.print();
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
            case 'efectivo': return __('Efectivo (MXN)');
            case 'dolar': return __('💵 Dólares (USD)');
            case 'transferencia': return __('Transferencia Bancaria');
            case 'tarjeta': return __('Tarjeta Débito/Crédito');
            case 'credito': return __('Venta a Crédito / Fiado');
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
                            <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-600" />
                            {__('Ingreso')}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900">
                            <ArrowDownCircle className="w-3.5 h-3.5 text-rose-600" />
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
            cell: (movement) => {
                const amt = Number(movement.amount || 0);
                const rate = summary.valor_dolar || 20.0;
                const isUSD = movement.metodo_pago === 'dolar';
                const amtUSD = rate > 0 ? amt / rate : 0;

                return (
                    <div className="flex flex-col gap-0.5">
                        <span className={cn(
                            'font-mono font-bold text-sm',
                            movement.type === 'inflow' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        )}>
                            {movement.type === 'inflow' ? '+' : '-'}{currencySymbol}{amt.toFixed(2)} MXN
                        </span>
                        {isUSD && (
                            <span className="font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900 w-fit">
                                💵 {movement.type === 'inflow' ? '+' : '-'}${amtUSD.toFixed(2)} USD
                            </span>
                        )}
                    </div>
                );
            },
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
    const currentUserId = pageProps.auth?.user?.id;
    const isSuperAdmin = Boolean(pageProps.auth?.user?.is_super_admin);
    const canClose = currentUserId === caja.user_id || isSuperAdmin;

    const finalBalance = isOpen
        ? Number(summary.current_balance || 0)
        : Number(caja.closing_amount !== null && caja.closing_amount !== undefined ? caja.closing_amount : summary.current_balance);

    const filteredMovements = useMemo(() => {
        let list = caja.movements || [];
        if (movementFilter !== 'all') {
            list = list.filter((m) => m.type === movementFilter);
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            list = list.filter(
                (m) =>
                    (m.description || '').toLowerCase().includes(query) ||
                    (m.concepto || '').toLowerCase().includes(query) ||
                    (m.metodo_pago || '').toLowerCase().includes(query) ||
                    (m.creator?.name || '').toLowerCase().includes(query)
            );
        }
        return list;
    }, [caja.movements, movementFilter, searchQuery]);

    const paymentMethodList = [
        { key: 'efectivo', label: __('Efectivo (MXN)'), icon: Wallet },
        { key: 'dolar', label: __('💵 Dólares (USD)'), icon: Coins },
        { key: 'transferencia', label: __('Transferencia Bancaria'), icon: Building2 },
        { key: 'tarjeta', label: __('Tarjeta Débito/Crédito'), icon: CreditCard },
        { key: 'credito', label: __('Venta a Crédito (Fiado)'), icon: Wallet },
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

            <div className="space-y-6 print:hidden">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Banner de Encabezado */}
                <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={() => router.get('/admin/cajas')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                        {__('Caja')} #{caja.id}
                                    </h1>
                                    {isOpen ? (
                                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                                            {__('EN CURSO / ABIERTA')}
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                            <Lock className="w-3 h-3 mr-1" />
                                            {__('CERRADA')}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                                        {caja.user?.name || __('Desconocido')}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(caja.opened_at).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" onClick={handlePrint} className="gap-2">
                                <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                {__('Imprimir Arqueo')}
                            </Button>

                            {isOpen && (
                                <>
                                    <Button onClick={handleOpenMovement} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2">
                                        <Plus className="w-4 h-4" />
                                        {__('Registrar Movimiento')}
                                    </Button>
                                    {canClose ? (
                                        <Button variant="destructive" onClick={handleCloseRegister} className="font-bold gap-2">
                                            <Lock className="w-4 h-4" />
                                            {__('Cerrar Caja')}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            disabled
                                            className="opacity-60 cursor-not-allowed font-medium gap-2 text-slate-500 border-slate-300 dark:border-slate-700"
                                            title={__('Solo el usuario que aperturó esta caja puede realizar el cierre')}
                                        >
                                            <Lock className="w-4 h-4 text-slate-400" />
                                            {__('Solo')} {caja.user?.name ? caja.user.name.split(' ')[0] : __('aperturador')} {__('puede cerrar')}
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Banner Informativo si la caja está abierta pero pertenece a otro usuario */}
                {isOpen && !canClose && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 text-amber-800 dark:text-amber-300 shadow-sm">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-1 text-sm">
                            <p className="font-bold">{__('Restricción de Cierre de Caja')}</p>
                            <p>
                                {__('Esta caja fue aperturada por')} <span className="font-semibold text-slate-900 dark:text-slate-100">{caja.user?.name || __('otro usuario')}</span> ({caja.user?.email || ''}). {__('Por políticas de control interno, únicamente el usuario que aperturó la caja puede realizar el cierre de la misma.')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Banner de Resultado de Arqueo en Cajas Cerradas */}
                {!isOpen && (
                    <div className="bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm space-y-3">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
                                <Lock className="w-4 h-4 text-slate-500" />
                                {__('Resultado del Arqueo y Cierre de Turno')}
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {caja.closed_at ? new Date(caja.closed_at).toLocaleString() : ''}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">
                                    {__('Esperado por Sistema')}
                                </span>
                                <span className="font-mono text-xl font-bold text-slate-800 dark:text-slate-200">
                                    {currencySymbol}{(caja.expected_amount !== null ? caja.expected_amount : summary.current_balance).toFixed(2)}
                                </span>
                            </div>

                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">
                                    {__('Físicamente Contado')}
                                </span>
                                <span className="font-mono text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                    {caja.counted_amount !== null ? `${currencySymbol}${caja.counted_amount.toFixed(2)}` : '—'}
                                </span>
                            </div>

                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">
                                    {__('Diferencia / Descuadre')}
                                </span>
                                {caja.difference !== null ? (
                                    <span
                                        className={cn(
                                            'font-mono text-xl font-extrabold flex items-center justify-center gap-1',
                                            caja.difference === 0
                                                ? 'text-emerald-600'
                                                : caja.difference > 0
                                                ? 'text-blue-600'
                                                : 'text-rose-600'
                                        )}
                                    >
                                        {caja.difference === 0 && <CheckCircle2 className="w-4 h-4" />}
                                        {caja.difference > 0 && <CheckCircle2 className="w-4 h-4" />}
                                        {caja.difference < 0 && <AlertTriangle className="w-4 h-4" />}
                                        {caja.difference > 0 ? '+' : ''}
                                        {currencySymbol}
                                        {caja.difference.toFixed(2)}
                                    </span>
                                ) : (
                                    <span className="text-sm text-muted-foreground">{__('Sin conteo físico')}</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Totales Generales KPI */}
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
                        title={isOpen ? __('SALDO ACTUAL EN CAJA') : __('SALDO FINAL DE CIERRE')}
                        value={`${currencySymbol}${finalBalance.toFixed(2)}`}
                        colorClassName={isOpen ? 'bg-amber-100 text-amber-600' : 'bg-purple-100 text-purple-600'}
                    />
                </div>

                {/* Organización con Tabs de Detalle y Desgloses */}
                <Tabs defaultValue="movimientos" className="w-full">
                    <TabsList className="grid grid-cols-3 w-full bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                        <TabsTrigger value="movimientos" className="flex items-center gap-1.5">
                            <Receipt className="w-4 h-4 text-indigo-500" />
                            {__('Movimientos')} ({caja.movements?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="metodos" className="flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-blue-500" />
                            {__('Métodos de Pago')}
                        </TabsTrigger>
                        <TabsTrigger value="conceptos" className="flex items-center gap-1.5">
                            <Tag className="w-4 h-4 text-emerald-500" />
                            {__('Conceptos')}
                        </TabsTrigger>
                    </TabsList>

                    {/* 1. MOVIEMIENTOS TAB */}
                    <TabsContent value="movimientos" className="mt-4 space-y-4">
                        <div className="bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <Select
                                    value={movementFilter}
                                    onValueChange={(v: 'all' | 'inflow' | 'outflow') => setMovementFilter(v)}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{__('Todos los Movimientos')}</SelectItem>
                                        <SelectItem value="inflow">{__('Solo Ingresos (+)')}</SelectItem>
                                        <SelectItem value="outflow">{__('Solo Egresos (-)')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={__('Buscar por concepto, motivo...')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <DataTable
                            columns={columns}
                            data={{
                                data: filteredMovements,
                                total: filteredMovements.length,
                                per_page: 100,
                                current_page: 1,
                                last_page: 1,
                                from: 1,
                                to: filteredMovements.length,
                            }}
                        />
                    </TabsContent>

                    {/* 2. MÉTODOS DE PAGO TAB */}
                    <TabsContent value="metodos" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paymentMethodList.map((pm) => {
                                const data = summary.by_payment_method?.[pm.key] || { inflow: 0, outflow: 0, net: 0 };
                                const IconComponent = pm.icon;
                                const totalMethodInflow = summary.inflows > 0 ? (data.inflow / summary.inflows) * 100 : 0;

                                return (
                                    <div
                                        key={pm.key}
                                        className="bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                    <IconComponent className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{pm.label}</h3>
                                                    <span className="text-xs text-muted-foreground font-mono">
                                                        {totalMethodInflow.toFixed(1)}% {__('del total de ingresos')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 border-t pt-3 text-sm">
                                            <div className="flex justify-between items-center text-emerald-600">
                                                <span className="text-xs text-muted-foreground">{__('Ingresos')}</span>
                                                <div className="text-right">
                                                    <span className="font-mono font-bold block">+{currencySymbol}{data.inflow.toFixed(2)} MXN</span>
                                                    {pm.key === 'dolar' && (
                                                        <span className="font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-300 block">
                                                            💵 +${(data.inflow / (summary.valor_dolar || 1)).toFixed(2)} USD
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-rose-600">
                                                <span className="text-xs text-muted-foreground">{__('Egresos')}</span>
                                                <span className="font-mono font-bold">-{currencySymbol}{data.outflow.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center font-bold text-slate-900 dark:text-slate-100 pt-1 border-t">
                                                <span>{__('Balance Neto')}</span>
                                                <div className="text-right">
                                                    <span className="font-mono text-base block">{currencySymbol}{data.net.toFixed(2)} MXN</span>
                                                    {pm.key === 'dolar' && (
                                                        <span className="font-mono text-xs text-emerald-700 dark:text-emerald-300 font-extrabold block">
                                                            💵 ${(data.net / (summary.valor_dolar || 1)).toFixed(2)} USD en físico
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all"
                                                style={{ width: `${Math.min(100, totalMethodInflow)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </TabsContent>

                    {/* 3. CONCEPTOS TAB */}
                    <TabsContent value="conceptos" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {conceptList.map((c) => {
                                const data = summary.by_concept?.[c.key] || { inflow: 0, outflow: 0, net: 0 };
                                const IconComponent = c.icon;

                                return (
                                    <div
                                        key={c.key}
                                        className="bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm space-y-4 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                    <IconComponent className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{c.label}</h3>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 border-t pt-3 text-sm">
                                            <div className="flex justify-between items-center text-emerald-600">
                                                <span className="text-xs text-muted-foreground">{__('Ingresos')}</span>
                                                <span className="font-mono font-bold">+{currencySymbol}{data.inflow.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-rose-600">
                                                <span className="text-xs text-muted-foreground">{__('Egresos')}</span>
                                                <span className="font-mono font-bold">-{currencySymbol}{data.outflow.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center font-bold text-slate-900 dark:text-slate-100 pt-1 border-t">
                                                <span>{__('Neto por Concepto')}</span>
                                                <span className="font-mono text-base">{currencySymbol}{data.net.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Dialog registrar movimiento */}
                <Dialog open={isMovementOpen} onOpenChange={setIsMovementOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Plus className="w-5 h-5 text-indigo-600" />
                                {__('Registrar Movimiento de Caja')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Registre un ingreso o egreso de efectivo/banco con su motivo correspondiente.')}
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
                                            <SelectItem value="efectivo">{__('Efectivo (MXN)')}</SelectItem>
                                            <SelectItem value="dolar">💵 {__('Dólares (USD)')}</SelectItem>
                                            <SelectItem value="transferencia">{__('Transferencia Bancaria')}</SelectItem>
                                            <SelectItem value="tarjeta">{__('Tarjeta Débito/Crédito')}</SelectItem>
                                            <SelectItem value="credito">{__('Venta a Crédito / Fiado')}</SelectItem>
                                            <SelectItem value="pago_movil">{__('Pago Móvil')}</SelectItem>
                                            <SelectItem value="otro">{__('Otro')}</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                        placeholder="0.00"
                                        className="font-mono text-lg font-bold"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">{__('Descripción / Motivo')}</Label>
                                <Textarea
                                    id="description"
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder={__('Ej: Pago de envío, cambio de repuesto, pago de servicio...')}
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsMovementOpen(false)}>
                                    {__('Cancelar')}
                                </Button>
                                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold" disabled={processing}>
                                    {__('Guardar Movimiento')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Dialog: Corte de Caja (Cierre) */}
                <Dialog open={isCloseOpen} onOpenChange={setIsCloseOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Lock className="w-5 h-5 text-rose-600" />
                                {__('Corte de Caja / Cierre de Turno')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Ingrese el dinero físicamente contado para comparar contra el saldo esperado.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleConfirmClose} className="space-y-5 py-2">
                            <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border p-4 space-y-3 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{__('Fondo Inicial (MXN)')}:</span>
                                    <span className="font-mono font-semibold">{currencySymbol}{(caja.opening_amount ?? 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-emerald-600">
                                    <span>{__('Total Ingresos')}:</span>
                                    <span className="font-mono font-semibold">+{currencySymbol}{(summary.inflows ?? 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-rose-600">
                                    <span>{__('Total Egresos')}:</span>
                                    <span className="font-mono font-semibold">-{currencySymbol}{(summary.outflows ?? 0).toFixed(2)}</span>
                                </div>
                                <div className="pt-2 border-t flex justify-between items-center font-bold">
                                    <span>{__('Esperado en Caja (MXN)')}:</span>
                                    <div className="text-right font-mono">
                                        <span className="text-lg block text-indigo-600 dark:text-indigo-400">{currencySymbol}{(expectedAmount ?? 0).toFixed(2)}</span>
                                        {summary.valor_dolar && summary.valor_dolar > 0 && (
                                            <span className="text-xs text-muted-foreground block">≈ ${((expectedAmount ?? 0) / summary.valor_dolar).toFixed(2)} USD</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Conteo Físico en Cajón (Pesos + Dólares) */}
                            <div className="space-y-3 border rounded-xl p-3.5 bg-amber-50/50 dark:bg-amber-950/30 border-amber-200">
                                <Label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-sm">
                                    <Scale className="w-4 h-4 text-amber-600" />
                                    {__('Conteo Físico en Cajón de Efectivo')}
                                </Label>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold">{__('Pesos ($ MXN)')}</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={countedAmount}
                                            onChange={(e) => setCountedAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="font-mono text-lg font-bold bg-white dark:bg-slate-900"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                            <Coins className="w-3 h-3" />
                                            {__('Dólares ($ USD)')}
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={countedUSDShow}
                                                onChange={(e) => setCountedUSDShow(e.target.value)}
                                                placeholder="0.00"
                                                className="font-mono text-lg font-bold bg-white dark:bg-slate-900 pr-10"
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground font-mono">USD</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {diffShow !== null && (
                                <div className={cn(
                                    'rounded-lg p-4 text-center border font-mono',
                                    diffShow === 0 ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20' :
                                    diffShow > 0 ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20' :
                                    'bg-rose-50 border-rose-200 dark:bg-rose-950/20'
                                )}>
                                    <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">
                                        {diffShow === 0 ? __('Sin Diferencia (Cuadrado)') : diffShow > 0 ? __('Sobrante en Caja') : __('Faltante en Caja')}
                                    </p>
                                    <p className={cn(
                                        'text-2xl font-extrabold font-mono',
                                        diffShow === 0 ? 'text-emerald-600' : diffShow > 0 ? 'text-blue-600' : 'text-rose-600'
                                    )}>
                                        {diffShow > 0 ? '+' : ''}{currencySymbol}{diffShow.toFixed(2)} MXN
                                    </p>
                                </div>
                            )}

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCloseOpen(false)}>
                                    {__('Cancelar')}
                                </Button>
                                <Button type="submit" variant="destructive" className="font-bold">
                                    <Lock className="w-4 h-4 mr-2" />
                                    {__('Confirmar Cierre de Caja')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* FORMATO TICKET DE IMPRESIÓN PARA TICKETERA POS (80MM / ARQUEO CORTE Z) */}
            <div id="printable-arqueo-ticket" className="hidden print:block text-black bg-white font-mono p-2 text-xs w-[80mm] max-w-[80mm] mx-auto">
                <style>{`
                    @media print {
                        body * {
                            visibility: hidden !important;
                        }
                        #printable-arqueo-ticket, #printable-arqueo-ticket * {
                            visibility: visible !important;
                        }
                        #printable-arqueo-ticket {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 80mm !important;
                            max-width: 80mm !important;
                            margin: 0 !important;
                            padding: 4mm !important;
                            background: white !important;
                            color: black !important;
                            font-family: 'Courier New', Courier, monospace, sans-serif !important;
                            font-size: 11px !important;
                        }
                        @page {
                            size: 80mm auto;
                            margin: 0;
                        }
                    }
                `}</style>

                {/* LOGO O ENCABEZADO DE EMPRESA */}
                <div className="text-center mb-1">
                    {empresa?.logo ? (
                        <img
                            src={empresa.logo}
                            alt={empresa.razon_social || 'Logo'}
                            className="h-10 max-w-[160px] mx-auto object-contain mb-1"
                        />
                    ) : (
                        <div className="font-black text-sm uppercase">{empresa?.razon_social || 'Servitec POS'}</div>
                    )}
                </div>

                {empresa?.razon_social && (
                    <div className="text-center font-bold text-[10px] uppercase">{empresa.razon_social}</div>
                )}
                {empresa?.documento && (
                    <div className="text-center text-[9px] font-mono">{empresa.documento}</div>
                )}
                <div className="text-center text-[9px] text-gray-700">
                    {empresa?.telefono ? `Tel: ${empresa.telefono}` : ''} {empresa?.email ? ` | ${empresa.email}` : ''}
                </div>
                {empresa?.direccion && (
                    <div className="text-center text-[8px] text-gray-600">{empresa.direccion}</div>
                )}

                <div className="border-b border-dashed border-black my-1"></div>
                <div className="text-center font-bold uppercase text-[11px] tracking-wider">
                    {caja.status === 'closed' ? __('COMPROBANTE DE CORTE Z') : __('ARQUEO PARCIAL DE CAJA')}
                </div>
                <div className="border-b border-dashed border-black my-1"></div>

                <div className="space-y-0.5 text-[10px]">
                    <div className="flex justify-between">
                        <span>CAJA #:</span>
                        <span className="font-bold">#{caja.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>CAJERO:</span>
                        <span>{caja.user?.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>APERTURA:</span>
                        <span>{new Date(caja.opened_at).toLocaleString()}</span>
                    </div>
                    {caja.closed_at && (
                        <div className="flex justify-between">
                            <span>CIERRE:</span>
                            <span>{new Date(caja.closed_at).toLocaleString()}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span>FECHA IMPRESIÓN:</span>
                        <span>{new Date().toLocaleString()}</span>
                    </div>
                </div>

                <div className="border-b border-dashed border-black my-1"></div>
                <div className="text-center font-bold text-[10px] uppercase">{__('RESUMEN DE FLUJO')}</div>
                <div className="border-b border-dashed border-black my-1"></div>

                <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between">
                        <span>Fondo Inicial:</span>
                        <span>{currencySymbol}{(caja.opening_amount ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Total Ingresos (+):</span>
                        <span>+{currencySymbol}{(summary.inflows ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Total Salidas (-):</span>
                        <span>-{currencySymbol}{(summary.outflows ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-dotted border-black pt-1">
                        <span>Dinero Esperado:</span>
                        <span>{currencySymbol}{(expectedAmount ?? 0).toFixed(2)}</span>
                    </div>
                </div>

                {/* DESGLOSE POR FORMA DE PAGO */}
                {summary.by_payment_method && Object.keys(summary.by_payment_method).length > 0 && (
                    <>
                        <div className="border-b border-dashed border-black my-1"></div>
                        <div className="text-center font-bold text-[10px] uppercase">{__('DESGLOSE FORMAS DE PAGO')}</div>
                        <div className="border-b border-dashed border-black my-1"></div>
                        <div className="space-y-1 text-[10px]">
                            {Object.entries(summary.by_payment_method).map(([method, val]) => (
                                <div key={method} className="flex justify-between">
                                    <span className="capitalize">{formatMetodoPagoLabel(method)}:</span>
                                    <span className="font-mono font-bold">{currencySymbol}{val.net.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* RESULTADO DEL ARQUEO DE CIERRE */}
                {caja.status === 'closed' && (
                    <>
                        <div className="border-b border-dashed border-black my-1"></div>
                        <div className="text-center font-bold text-[10px] uppercase">{__('RESULTADO DEL ARQUEO')}</div>
                        <div className="border-b border-dashed border-black my-1"></div>
                        <div className="space-y-1 text-[10px]">
                            <div className="flex justify-between">
                                <span>Esperado Sistema:</span>
                                <span>{currencySymbol}{(caja.expected_amount ?? expectedAmount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                                <span>Total Contado:</span>
                                <span>{currencySymbol}{(caja.counted_amount ?? 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                                <span>Diferencia:</span>
                                <span>
                                    {(caja.difference ?? 0) >= 0 ? '+' : ''}{currencySymbol}{(caja.difference ?? 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </>
                )}

                <div className="border-b border-dashed border-black my-2"></div>

                <div className="text-center text-[10px] space-y-4 pt-2">
                    <div>
                        <p>_____________________________________</p>
                        <p className="mt-1 font-bold">{__('Firma Cajero')}: {caja.user?.name}</p>
                    </div>
                    <p className="text-[9px] italic">{__('Comprobante generado desde Servitec POS')}</p>
                </div>
            </div>
        </>
    );
}
