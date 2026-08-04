import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Printer,
    Building2,
    Calendar,
    FileText,
    CheckCircle2,
    XCircle,
    ShoppingBag,
    CreditCard,
    Ban,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface Proveedor {
    id: number;
    razon_social: string;
    nombre_comercial: string | null;
    rif_documento: string | null;
    telefono: string | null;
    email: string | null;
    direccion: string | null;
}

interface CompraItem {
    id: number;
    cantidad: number;
    costo_unitario: number;
    impuesto_unitario: number;
    subtotal: number;
    total: number;
    producto?: {
        id: number;
        nombre: string;
        codigo_barras: string | null;
        sku: string | null;
    };
}

interface CompraPago {
    id: number;
    metodo_pago: string;
    monto: number;
    referencia: string | null;
    notas: string | null;
    created_at: string;
    user?: { name: string };
}

interface Compra {
    id: number;
    codigo_compra: string;
    numero_factura: string | null;
    numero_control: string | null;
    tipo_pago: 'contado' | 'credito';
    fecha_emision: string;
    fecha_vencimiento: string | null;
    status: 'completada' | 'anulada';
    subtotal: number;
    impuesto: number;
    descuento: number;
    total: number;
    monto_pagado: number;
    saldo_pendiente: number;
    notas: string | null;
    proveedor?: Proveedor;
    user?: { name: string };
    sucursal?: { nombre: string };
    items: CompraItem[];
    pagos: CompraPago[];
    created_at: string;
}

interface Props {
    compra: Compra;
    currencySymbol: string;
    empresa: any;
}

export default function ComprasShow({ compra, currencySymbol, empresa }: Props) {
    const { __ } = useTranslate();

    const handlePrint = () => {
        window.print();
    };

    const handleCancel = () => {
        if (!confirm(__('¿Está seguro de anular esta compra? Se revertirá el inventario de los productos.'))) {
            return;
        }
        router.post(`/admin/compras/${compra.id}/cancel`, {}, {
            onSuccess: () => notifySuccess(__('Compra anulada con éxito.')),
            onError: () => notifyError(__('Ocurrió un error al anular.')),
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/dashboard' },
        { title: __('Compras'), href: '/admin/compras' },
        { title: `Compra #${compra.codigo_compra}`, href: `/admin/compras/${compra.id}` },
    ];

    return (
        <>
            <Head title={`Compra ${compra.codigo_compra}`} />

            <Breadcrumbs breadcrumbs={breadcrumbs} />

            <div className="space-y-6 print:hidden">
                <ModuleHeader
                    title={`${__('Comprobante de Compra')} #${compra.codigo_compra}`}
                    description={`${__('Fecha de emisión')}: ${new Date(compra.fecha_emision).toLocaleDateString()}`}
                    action={
                        <div className="flex flex-wrap gap-2">
                            <Link href="/admin/compras">
                                <Button variant="outline" className="gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    {__('Volver')}
                                </Button>
                            </Link>
                            <Button variant="outline" onClick={handlePrint} className="gap-2">
                                <Printer className="w-4 h-4" />
                                {__('Imprimir')}
                            </Button>
                            {compra.status === 'completada' && (
                                <Button variant="destructive" onClick={handleCancel} className="gap-2 font-bold">
                                    <Ban className="w-4 h-4" />
                                    {__('Anular Compra')}
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* Resumen */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{__('TOTAL COMPRA')}</div>
                        <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                            {currencySymbol}{compra.total.toFixed(2)}
                        </div>
                        <div className="mt-2">
                            <Badge variant={compra.tipo_pago === 'contado' ? 'outline' : 'secondary'} className="uppercase">
                                {compra.tipo_pago}
                            </Badge>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{__('MONTO PAGADO')}</div>
                        <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                            {currencySymbol}{compra.monto_pagado.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500 mt-2">
                            {compra.pagos.length} {__('pago(s) registrado(s)')}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{__('SALDO PENDIENTE')}</div>
                        <div className={`text-2xl font-black font-mono mt-1 ${compra.saldo_pendiente > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                            {currencySymbol}{compra.saldo_pendiente.toFixed(2)}
                        </div>
                        {compra.saldo_pendiente > 0 && (
                            <div className="mt-2">
                                <Link href="/admin/cuentas-por-pagar">
                                    <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white h-7 text-xs font-bold">
                                        {__('Registrar Abono')}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Proveedor y Factura */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-2">{__('INFORMACIÓN DEL PROVEEDOR')}</h4>
                        <div className="font-bold text-base text-slate-900 dark:text-slate-100">{compra.proveedor?.razon_social}</div>
                        {compra.proveedor?.rif_documento && <div className="text-sm text-slate-500 font-mono">RIF/Doc: {compra.proveedor.rif_documento}</div>}
                        {compra.proveedor?.telefono && <div className="text-sm text-slate-500">Tel: {compra.proveedor.telefono}</div>}
                        {compra.proveedor?.direccion && <div className="text-xs text-slate-500 mt-1">{compra.proveedor.direccion}</div>}
                    </div>

                    <div className="md:border-l md:pl-6 space-y-1">
                        <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-2">{__('DETALLES DEL DOCUMENTO')}</h4>
                        <div className="text-sm flex justify-between">
                            <span className="text-slate-500">{__('Nº Factura')}:</span>
                            <span className="font-mono font-bold">{compra.numero_factura || 'N/A'}</span>
                        </div>
                        <div className="text-sm flex justify-between">
                            <span className="text-slate-500">{__('Nº Control')}:</span>
                            <span className="font-mono font-bold">{compra.numero_control || 'N/A'}</span>
                        </div>
                        <div className="text-sm flex justify-between">
                            <span className="text-slate-500">{__('Comprador/Cajero')}:</span>
                            <span className="font-semibold">{compra.user?.name || 'N/A'}</span>
                        </div>
                        <div className="text-sm flex justify-between">
                            <span className="text-slate-500">{__('Sucursal Destino')}:</span>
                            <span className="font-semibold">{compra.sucursal?.nombre || 'Principal'}</span>
                        </div>
                    </div>
                </div>

                {/* Tabla de Ítems */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b font-bold text-base text-slate-900 dark:text-slate-100">
                        {__('Productos e Insumos Ingresados')}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b">
                                <tr>
                                    <th className="p-4">#</th>
                                    <th className="p-4">{__('Producto / Insumo')}</th>
                                    <th className="p-4 text-center">{__('Cantidad')}</th>
                                    <th className="p-4 text-right">{__('Costo U.')}</th>
                                    <th className="p-4 text-right">{__('IVA U.')}</th>
                                    <th className="p-4 text-right">{__('Total')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {compra.items.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                        <td className="p-4 text-slate-400 font-mono">{idx + 1}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900 dark:text-slate-100">
                                                {item.producto?.nombre || `Producto #${item.id}`}
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono">
                                                {item.producto?.codigo_barras || item.producto?.sku}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-bold">{item.cantidad}</td>
                                        <td className="p-4 text-right font-mono">{currencySymbol}{item.costo_unitario.toFixed(2)}</td>
                                        <td className="p-4 text-right font-mono">{currencySymbol}{item.impuesto_unitario.toFixed(2)}</td>
                                        <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                                            {currencySymbol}{item.total.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Histórico de Pagos */}
                {compra.pagos.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b font-bold text-base text-slate-900 dark:text-slate-100">
                            {__('Historial de Pagos y Abonos')}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b">
                                    <tr>
                                        <th className="p-4">{__('Fecha')}</th>
                                        <th className="p-4">{__('Método de Pago')}</th>
                                        <th className="p-4">{__('Referencia')}</th>
                                        <th className="p-4">{__('Usuario')}</th>
                                        <th className="p-4 text-right">{__('Monto')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {compra.pagos.map((pago) => (
                                        <tr key={pago.id}>
                                            <td className="p-4 text-slate-500 text-xs">
                                                {new Date(pago.created_at).toLocaleString()}
                                            </td>
                                            <td className="p-4 font-semibold capitalize">{pago.metodo_pago}</td>
                                            <td className="p-4 font-mono text-xs text-slate-500">{pago.referencia || 'N/A'}</td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400">{pago.user?.name || 'N/A'}</td>
                                            <td className="p-4 text-right font-mono font-bold text-emerald-600">
                                                +{currencySymbol}{pago.monto.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* FORMATO TICKET DE IMPRESIÓN PARA COMPRAS */}
            <div id="printable-compra-ticket" className="hidden print:block text-black bg-white font-mono p-2 text-xs w-[80mm] max-w-[80mm] mx-auto">
                <style>{`
                    @media print {
                        body * {
                            visibility: hidden !important;
                        }
                        #printable-compra-ticket, #printable-compra-ticket * {
                            visibility: visible !important;
                        }
                        #printable-compra-ticket {
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

                <div className="text-center mb-1">
                    <div className="font-black text-sm uppercase">{empresa?.razon_social || 'Servitec POS'}</div>
                    <div className="text-[10px]">{empresa?.documento}</div>
                </div>

                <div className="border-b border-dashed border-black my-1"></div>
                <div className="text-center font-bold uppercase text-[11px]">COMPROBANTE DE COMPRA</div>
                <div className="border-b border-dashed border-black my-1"></div>

                <div className="space-y-0.5 text-[10px]">
                    <div>COMPRA #: {compra.codigo_compra}</div>
                    <div>FACTURA #: {compra.numero_factura || 'N/A'}</div>
                    <div>PROVEEDOR: {compra.proveedor?.razon_social}</div>
                    <div>FECHA: {new Date(compra.fecha_emision).toLocaleDateString()}</div>
                </div>

                <div className="border-b border-dashed border-black my-1"></div>

                <div className="space-y-1 text-[10px]">
                    {compra.items.map((item) => (
                        <div key={item.id} className="flex justify-between">
                            <span>{item.cantidad}x {item.producto?.nombre}</span>
                            <span className="font-bold">{currencySymbol}{item.total.toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className="border-b border-dashed border-black my-1"></div>

                <div className="space-y-0.5 text-[10px]">
                    <div className="flex justify-between font-bold text-[11px]">
                        <span>TOTAL COMPRA:</span>
                        <span>{currencySymbol}{compra.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>PAGADO:</span>
                        <span>{currencySymbol}{compra.monto_pagado.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                        <span>PENDIENTE:</span>
                        <span>{currencySymbol}{compra.saldo_pendiente.toFixed(2)}</span>
                    </div>
                </div>

                <div className="border-b border-dashed border-black my-2"></div>
                <div className="text-center text-[9px] italic">Recepción de Mercancía registrada</div>
            </div>
        </>
    );
}
