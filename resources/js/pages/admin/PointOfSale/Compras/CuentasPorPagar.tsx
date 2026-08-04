import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    CreditCard,
    ArrowLeft,
    Search,
    Calendar,
    DollarSign,
    Building2,
    CheckCircle2,
    AlertTriangle,
    Plus,
    RefreshCw,
    Wallet,
    FileText,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface Proveedor {
    id: number;
    razon_social: string;
}

interface Compra {
    id: number;
    codigo_compra: string;
    numero_factura: string | null;
    fecha_emision: string;
    fecha_vencimiento: string | null;
    total: number;
    monto_pagado: number;
    saldo_pendiente: number;
    proveedor?: Proveedor;
    user?: { name: string };
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    cuentas: PaginatedData<Compra>;
    proveedores: Proveedor[];
    activeRegister: any | null;
    filters: { search?: string; proveedor_id?: string };
    totalPendiente: number;
    currencySymbol: string;
}

export default function CuentasPorPagar({ cuentas, proveedores, activeRegister, filters, totalPendiente, currencySymbol }: Props) {
    const { __ } = useTranslate();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedProveedor, setSelectedProveedor] = useState(filters.proveedor_id || 'all');

    const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
    const [monto, setMonto] = useState('');
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [referencia, setReferencia] = useState('');
    const [pagarConCaja, setPagarConCaja] = useState(!!activeRegister);
    const [notas, setNotas] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFilter = () => {
        router.get(
            '/admin/cuentas-por-pagar',
            {
                search,
                proveedor_id: selectedProveedor !== 'all' ? selectedProveedor : undefined,
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setSelectedProveedor('all');
        router.get('/admin/cuentas-por-pagar');
    };

    const handleOpenPayment = (compra: Compra) => {
        setSelectedCompra(compra);
        setMonto(compra.saldo_pendiente.toString());
        setReferencia('');
        setNotas('');
        setPagarConCaja(!!activeRegister);
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCompra) return;

        const amtNum = parseFloat(monto);
        if (isNaN(amtNum) || amtNum <= 0 || amtNum > selectedCompra.saldo_pendiente) {
            notifyError(__('Ingrese un monto válido menor o igual al saldo pendiente.'));
            return;
        }

        setIsSubmitting(true);

        router.post(
            `/admin/compras/${selectedCompra.id}/pagos`,
            {
                monto: amtNum,
                metodo_pago: metodoPago,
                referencia,
                pagar_con_caja: pagarConCaja,
                notas,
            },
            {
                onSuccess: () => {
                    setIsSubmitting(false);
                    setSelectedCompra(null);
                    notifySuccess(__('Abono a cuenta por pagar registrado exitosamente.'));
                },
                onError: () => {
                    setIsSubmitting(false);
                    notifyError(__('Error al registrar el abono.'));
                },
            }
        );
    };

    const isOverdue = (dueDate: string | null) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/dashboard' },
        { title: __('Compras'), href: '/admin/compras' },
        { title: __('Cuentas por Pagar'), href: '/admin/cuentas-por-pagar' },
    ];

    return (
        <>
            <Head title={__('Cuentas por Pagar a Proveedores')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />
                <ModuleHeader
                    title={__('Cuentas por Pagar a Proveedores (CxP)')}
                    description={__('Gestione los créditos pendientes con proveedores y registre los abonos o liquidaciones.')}
                    action={
                        <Link href="/admin/compras">
                            <Button variant="outline" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                {__('Volver a Compras')}
                            </Button>
                        </Link>
                    }
                />

                {/* StatCard */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                        icon={<CreditCard className="w-6 h-6" />}
                        title={__('TOTAL DEUDA PENDIENTE CXP')}
                        value={`${currencySymbol}${totalPendiente.toFixed(2)}`}
                        colorClassName="bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                    />
                    <StatCard
                        icon={<FileText className="w-6 h-6" />}
                        title={__('FACTURAS PENDIENTES')}
                        value={cuentas.total.toString()}
                        colorClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                    />
                    <StatCard
                        icon={<Wallet className="w-6 h-6" />}
                        title={__('ESTADO DE CAJA CHICA')}
                        value={activeRegister ? __('Caja Abierta') : __('Caja Cerrada')}
                        colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                    />
                </div>

                {/* Filtros */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <Input
                            placeholder={__('Buscar compra o factura...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                            onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                        />
                    </div>

                    <div className="w-56">
                        <Select value={selectedProveedor} onValueChange={setSelectedProveedor}>
                            <SelectTrigger>
                                <SelectValue placeholder={__('Proveedor')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{__('Todos los Proveedores')}</SelectItem>
                                {proveedores.map((p) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        {p.razon_social}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={handleFilter} className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium">
                        {__('Filtrar')}
                    </Button>
                    <Button variant="outline" onClick={handleReset} title={__('Limpiar Filtros')}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>

                {/* Tabla de CxP */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b">
                                <tr>
                                    <th className="p-4">{__('Compra / Factura')}</th>
                                    <th className="p-4">{__('Proveedor')}</th>
                                    <th className="p-4">{__('Emisión / Vencimiento')}</th>
                                    <th className="p-4 text-right">{__('Total')}</th>
                                    <th className="p-4 text-right">{__('Abonado')}</th>
                                    <th className="p-4 text-right">{__('Saldo Pendiente')}</th>
                                    <th className="p-4 text-center">{__('Acción')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {cuentas.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500">
                                            {__('No hay cuentas por pagar pendientes.')}
                                        </td>
                                    </tr>
                                ) : (
                                    cuentas.data.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                            <td className="p-4">
                                                <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                    {c.codigo_compra}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    Factura: {c.numero_factura || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                                                {c.proveedor?.razon_social || __('Sin Proveedor')}
                                            </td>
                                            <td className="p-4 text-xs">
                                                <div>{new Date(c.fecha_emision).toLocaleDateString()}</div>
                                                {c.fecha_vencimiento && (
                                                    <div className="mt-1">
                                                        {isOverdue(c.fecha_vencimiento) ? (
                                                            <Badge variant="destructive" className="text-[9px]">
                                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                                {__('Vencida')}: {new Date(c.fecha_vencimiento).toLocaleDateString()}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-slate-500">
                                                                Vence: {new Date(c.fecha_vencimiento).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-right font-mono font-semibold">
                                                {currencySymbol}{c.total.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right font-mono text-emerald-600 font-semibold">
                                                {currencySymbol}{c.monto_pagado.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400 text-base">
                                                {currencySymbol}{c.saldo_pendiente.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <Button
                                                    onClick={() => handleOpenPayment(c)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs gap-1"
                                                >
                                                    <DollarSign className="w-3.5 h-3.5" />
                                                    {__('Abonar / Pagar')}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal Registrar Abono CxP */}
                <Dialog open={!!selectedCompra} onOpenChange={() => setSelectedCompra(null)}>
                    <DialogContent>
                        <form onSubmit={handlePaymentSubmit}>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-indigo-600">
                                    <CreditCard className="w-5 h-5" />
                                    {__('Registrar Abono a Proveedor')}
                                </DialogTitle>
                                <DialogDescription>
                                    Compra #{selectedCompra?.codigo_compra} - {selectedCompra?.proveedor?.razon_social}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex justify-between items-center">
                                    <span className="text-xs text-rose-700 dark:text-rose-300 font-bold uppercase">{__('Saldo Actual Pendiente')}:</span>
                                    <span className="text-lg font-bold font-mono text-rose-600">
                                        {currencySymbol}{selectedCompra?.saldo_pendiente.toFixed(2)}
                                    </span>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="font-bold">{__('Monto a Abonar')} *</Label>
                                    <Input
                                        type="number"
                                        step="any"
                                        min="0.01"
                                        max={selectedCompra?.saldo_pendiente}
                                        value={monto}
                                        onChange={(e) => setMonto(e.target.value)}
                                        className="font-mono text-lg font-bold text-emerald-600"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>{__('Método de Pago')}</Label>
                                    <Select value={metodoPago} onValueChange={setMetodoPago}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="efectivo">{__('Efectivo (MXN)')}</SelectItem>
                                            <SelectItem value="dolar">{__('💵 Dólares (USD)')}</SelectItem>
                                            <SelectItem value="transferencia">{__('Transferencia Bancaria')}</SelectItem>
                                            <SelectItem value="tarjeta">{__('Tarjeta Débito/Crédito')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>{__('Referencia o N° de Comprobante')}</Label>
                                    <Input
                                        placeholder="Ej: Transf #109283"
                                        value={referencia}
                                        onChange={(e) => setReferencia(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="chk-abono-caja"
                                        checked={pagarConCaja}
                                        onChange={(e) => setPagarConCaja(e.target.checked)}
                                        disabled={!activeRegister}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                    />
                                    <label htmlFor="chk-abono-caja" className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                        {__('Registrar egreso en Caja Chica POS activa')}
                                    </label>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>{__('Notas u Observaciones')}</Label>
                                    <Input
                                        placeholder="Detalles sobre el pago..."
                                        value={notas}
                                        onChange={(e) => setNotas(e.target.value)}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setSelectedCompra(null)}>
                                    {__('Cancelar')}
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                    {__('Confirmar Abono')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
