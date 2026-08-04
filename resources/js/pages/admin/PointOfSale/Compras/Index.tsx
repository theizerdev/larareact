import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ShoppingBag,
    Plus,
    Search,
    Calendar,
    DollarSign,
    CreditCard,
    FileText,
    Truck,
    Building2,
    CheckCircle2,
    XCircle,
    Eye,
    AlertCircle,
    RefreshCw,
    Ban,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    nombre_comercial: string | null;
}

interface Compra {
    id: number;
    codigo_compra: string;
    numero_factura: string | null;
    numero_control: string | null;
    tipo_pago: 'contado' | 'credito';
    fecha_emision: string;
    status: 'completada' | 'anulada';
    subtotal: number;
    impuesto: number;
    descuento: number;
    total: number;
    monto_pagado: number;
    saldo_pendiente: number;
    proveedor?: Proveedor;
    user?: { id: number; name: string };
    sucursal?: { id: number; nombre: string };
    created_at: string;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    compras: PaginatedData<Compra>;
    proveedores: Proveedor[];
    filters: { search?: string; proveedor_id?: string; tipo_pago?: string; status?: string };
    stats: {
        total_compras: number;
        compras_mes: number;
        total_cxp_pendiente: number;
        cantidad_compras: number;
    };
    currencySymbol: string;
}

export default function ComprasIndex({ compras, proveedores, filters, stats, currencySymbol }: Props) {
    const { __ } = useTranslate();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedProveedor, setSelectedProveedor] = useState(filters.proveedor_id || 'all');
    const [selectedTipoPago, setSelectedTipoPago] = useState(filters.tipo_pago || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');

    const [cancelingCompra, setCancelingCompra] = useState<Compra | null>(null);

    const handleFilter = () => {
        router.get(
            '/admin/compras',
            {
                search,
                proveedor_id: selectedProveedor !== 'all' ? selectedProveedor : undefined,
                tipo_pago: selectedTipoPago !== 'all' ? selectedTipoPago : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setSelectedProveedor('all');
        setSelectedTipoPago('all');
        setSelectedStatus('all');
        router.get('/admin/compras');
    };

    const handleCancelSubmit = () => {
        if (!cancelingCompra) return;
        router.post(`/admin/compras/${cancelingCompra.id}/cancel`, {}, {
            onSuccess: () => {
                setCancelingCompra(null);
                notifySuccess(__('Compra anulada y stock revertido correctamente.'));
            },
            onError: () => notifyError(__('No se pudo anular la compra.')),
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/dashboard' },
        { title: __('Punto de Venta'), href: '#' },
        { title: __('Compras'), href: '/admin/compras' },
    ];

    return (
        <>
            <Head title={__('Historial de Compras')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<ShoppingBag className="h-6 w-6 text-white" />}
                    title={__('Gestión de Compras de Insumos y Stock')}
                    description={__('Controle el abastecimiento de mercancía, entradas a almacén y cuentas por pagar.')}
                    colorClassName="bg-indigo-600"
                >
                    <div className="flex flex-wrap gap-2">
                        <Link href="/admin/cuentas-por-pagar">
                            <Button variant="outline" className="gap-2 font-semibold text-slate-900 bg-white hover:bg-slate-100">
                                <CreditCard className="w-4 h-4 text-indigo-600" />
                                {__('Cuentas por Pagar (CxP)')}
                            </Button>
                        </Link>
                        <Link href="/admin/compras/crear">
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-sm">
                                <Plus className="w-4 h-4" />
                                {__('Nueva Compra')}
                            </Button>
                        </Link>
                    </div>
                </ModuleHeader>

                {/* StatCards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={<ShoppingBag className="w-6 h-6" />}
                        title={__('TOTAL COMPRAS HISTÓRICO')}
                        value={`${currencySymbol}${stats.total_compras.toFixed(2)}`}
                        colorClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                    />
                    <StatCard
                        icon={<Calendar className="w-6 h-6" />}
                        title={__('COMPRAS ESTE MES')}
                        value={`${currencySymbol}${stats.compras_mes.toFixed(2)}`}
                        colorClassName="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                    />
                    <StatCard
                        icon={<CreditCard className="w-6 h-6" />}
                        title={__('SALDO PENDIENTE CXP')}
                        value={`${currencySymbol}${stats.total_cxp_pendiente.toFixed(2)}`}
                        colorClassName="bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                    />
                    <StatCard
                        icon={<FileText className="w-6 h-6" />}
                        title={__('REGISTROS TOTALES')}
                        value={stats.cantidad_compras.toString()}
                        colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                    />
                </div>

                {/* Filtros */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <Input
                                placeholder={__('Buscar por código o factura...')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                            />
                        </div>

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

                        <Select value={selectedTipoPago} onValueChange={setSelectedTipoPago}>
                            <SelectTrigger>
                                <SelectValue placeholder={__('Tipo de Pago')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{__('Todos los Tipos')}</SelectItem>
                                <SelectItem value="contado">{__('Contado')}</SelectItem>
                                <SelectItem value="credito">{__('Crédito')}</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder={__('Estado')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{__('Todos los Estados')}</SelectItem>
                                <SelectItem value="completada">{__('Completada')}</SelectItem>
                                <SelectItem value="anulada">{__('Anulada')}</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex gap-2">
                            <Button onClick={handleFilter} className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium">
                                {__('Filtrar')}
                            </Button>
                            <Button variant="outline" onClick={handleReset} title={__('Limpiar Filtros')}>
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Tabla de Compras */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="p-4">{__('Código / Fecha')}</th>
                                    <th className="p-4">{__('Proveedor')}</th>
                                    <th className="p-4">{__('Factura / Control')}</th>
                                    <th className="p-4 text-center">{__('Tipo Pago')}</th>
                                    <th className="p-4 text-right">{__('Total')}</th>
                                    <th className="p-4 text-right">{__('Saldo Pend.')}</th>
                                    <th className="p-4 text-center">{__('Estado')}</th>
                                    <th className="p-4 text-center">{__('Acciones')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {compras.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-slate-500">
                                            {__('No se encontraron registros de compras.')}
                                        </td>
                                    </tr>
                                ) : (
                                    compras.data.map((compra) => (
                                        <tr key={compra.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="p-4">
                                                <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                    {compra.codigo_compra}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {new Date(compra.fecha_emision).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    {compra.proveedor?.razon_social || __('Sin Proveedor')}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {compra.sucursal?.nombre || __('Sucursal Principal')}
                                                </div>
                                            </td>
                                            <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                                                <div>Fact: {compra.numero_factura || 'N/A'}</div>
                                                <div>Ctrl: {compra.numero_control || 'N/A'}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <Badge variant={compra.tipo_pago === 'contado' ? 'outline' : 'secondary'} className="uppercase text-[10px]">
                                                    {compra.tipo_pago}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                                                {currencySymbol}{compra.total.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold">
                                                <span className={compra.saldo_pendiente > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}>
                                                    {currencySymbol}{compra.saldo_pendiente.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {compra.status === 'completada' ? (
                                                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        {__('Completada')}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive">
                                                        <XCircle className="w-3 h-3 mr-1" />
                                                        {__('Anulada')}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link href={`/admin/compras/${compra.id}`}>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={__('Ver Detalle')}>
                                                            <Eye className="w-4 h-4 text-indigo-600" />
                                                        </Button>
                                                    </Link>
                                                    {compra.status === 'completada' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                                            onClick={() => setCancelingCompra(compra)}
                                                            title={__('Anular Compra')}
                                                        >
                                                            <Ban className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal Confirmar Anulación */}
                <Dialog open={!!cancelingCompra} onOpenChange={() => setCancelingCompra(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-rose-600 flex items-center gap-2">
                                <Ban className="w-5 h-5" />
                                {__('Confirmar Anulación de Compra')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('¿Está seguro de anular la compra')} <strong>#{cancelingCompra?.codigo_compra}</strong>? {__('El stock ingresado a inventario será descalculado de forma automática.')}
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="mt-4">
                            <Button variant="outline" onClick={() => setCancelingCompra(null)}>
                                {__('Cancelar')}
                            </Button>
                            <Button variant="destructive" onClick={handleCancelSubmit}>
                                {__('Confirmar Anulación')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
