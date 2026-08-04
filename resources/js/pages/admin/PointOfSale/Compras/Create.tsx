import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ShoppingBag,
    ArrowLeft,
    Plus,
    Trash2,
    Search,
    DollarSign,
    CreditCard,
    Building2,
    Calendar,
    FileText,
    CheckCircle2,
    Calculator,
    Tag,
    AlertCircle,
    Wallet,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface Proveedor {
    id: number;
    razon_social: string;
    nombre_comercial: string | null;
    rif_documento: string | null;
    telefono: string | null;
}

interface Producto {
    id: number;
    nombre: string;
    codigo: string;
    stock: number;
    costo_compra: number;
    precio_venta: number;
}

interface Sucursal {
    id: number;
    nombre: string;
}

interface SelectedItem {
    producto_id: number;
    nombre: string;
    codigo: string;
    stock_actual: number;
    cantidad: number;
    costo_unitario: number;
    impuesto_unitario: number;
    subtotal: number;
    total: number;
    update_sale_price: boolean;
    nuevo_precio_venta: number;
}

interface Props {
    proveedores: Proveedor[];
    productos: Producto[];
    sucursales: Sucursal[];
    activeRegister: any | null;
    currencySymbol: string;
    valorDolar: number;
}

export default function ComprasCreate({ proveedores, productos, sucursales, activeRegister, currencySymbol, valorDolar }: Props) {
    const { __ } = useTranslate();

    const [proveedorId, setProveedorId] = useState<string>('');
    const [sucursalId, setSucursalId] = useState<string>(sucursales[0]?.id?.toString() || '');
    const [numeroFactura, setNumeroFactura] = useState('');
    const [numeroControl, setNumeroControl] = useState('');
    const [tipoPago, setTipoPago] = useState<'contado' | 'credito'>('contado');
    const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
    const [fechaVencimiento, setFechaVencimiento] = useState('');
    const [descuento, setDescuento] = useState('');
    const [montoInicial, setMontoInicial] = useState('');
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [referenciaPago, setReferenciaPago] = useState('');
    const [pagarConCaja, setPagarConCaja] = useState(!!activeRegister);
    const [notas, setNotas] = useState('');

    const [productSearch, setProductSearch] = useState('');
    const [items, setItems] = useState<SelectedItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filtrar productos para el buscador
    const filteredProducts = useMemo(() => {
        if (!productSearch.trim()) return [];
        const term = productSearch.toLowerCase();
        return productos.filter(
            (p) => p.nombre.toLowerCase().includes(term) || p.codigo.toLowerCase().includes(term)
        ).slice(0, 10);
    }, [productSearch, productos]);

    const handleAddProduct = (prod: Producto) => {
        const existingIndex = items.findIndex((i) => i.producto_id === prod.id);
        if (existingIndex >= 0) {
            const updated = [...items];
            updated[existingIndex].cantidad += 1;
            updated[existingIndex].subtotal = updated[existingIndex].cantidad * updated[existingIndex].costo_unitario;
            updated[existingIndex].total = updated[existingIndex].subtotal + (updated[existingIndex].cantidad * updated[existingIndex].impuesto_unitario);
            setItems(updated);
        } else {
            const costo = prod.costo_compra || 0;
            const newItem: SelectedItem = {
                producto_id: prod.id,
                nombre: prod.nombre,
                codigo: prod.codigo,
                stock_actual: prod.stock,
                cantidad: 1,
                costo_unitario: costo,
                impuesto_unitario: 0,
                subtotal: costo,
                total: costo,
                update_sale_price: false,
                nuevo_precio_venta: prod.precio_venta || 0,
            };
            setItems([...items, newItem]);
        }
        setProductSearch('');
    };

    const handleItemChange = (index: number, field: keyof SelectedItem, value: any) => {
        const updated = [...items];
        const item = { ...updated[index], [field]: value };

        const cant = parseFloat(item.cantidad as any) || 0;
        const costo = parseFloat(item.costo_unitario as any) || 0;
        const imp = parseFloat(item.impuesto_unitario as any) || 0;

        item.subtotal = cant * costo;
        item.total = item.subtotal + (cant * imp);

        updated[index] = item;
        setItems(updated);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    // Cálculos globales
    const subtotalGlobal = useMemo(() => items.reduce((acc, i) => acc + i.subtotal, 0), [items]);
    const impuestoGlobal = useMemo(() => items.reduce((acc, i) => acc + (i.cantidad * i.impuesto_unitario), 0), [items]);
    const descuentoNum = parseFloat(descuento) || 0;
    const totalGlobal = useMemo(() => Math.max(0, (subtotalGlobal + impuestoGlobal) - descuentoNum), [subtotalGlobal, impuestoGlobal, descuentoNum]);

    const initialPayNum = tipoPago === 'contado' ? totalGlobal : (parseFloat(montoInicial) || 0);
    const saldoPendienteGlobal = Math.max(0, totalGlobal - initialPayNum);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!proveedorId) {
            notifyError(__('Seleccione un proveedor.'));
            return;
        }
        if (items.length === 0) {
            notifyError(__('Debe agregar al menos un producto a la compra.'));
            return;
        }

        setIsSubmitting(true);

        const payload = {
            proveedor_id: parseInt(proveedorId),
            sucursal_id: sucursalId ? parseInt(sucursalId) : null,
            numero_factura: numeroFactura,
            numero_control: numeroControl,
            tipo_pago: tipoPago,
            fecha_emision: fechaEmision,
            fecha_vencimiento: tipoPago === 'credito' ? fechaVencimiento : null,
            descuento: descuentoNum,
            monto_inicial_pagado: initialPayNum,
            metodo_pago: metodoPago,
            referencia_pago: referenciaPago,
            pagar_con_caja: pagarConCaja,
            notas: notas,
            items: items.map((i) => ({
                producto_id: i.producto_id,
                cantidad: i.cantidad,
                costo_unitario: i.costo_unitario,
                impuesto_unitario: i.impuesto_unitario,
                update_sale_price: i.update_sale_price,
                nuevo_precio_venta: i.nuevo_precio_venta,
            })),
        };

        router.post('/admin/compras', payload, {
            onSuccess: () => {
                notifySuccess(__('Compra registrada y stock actualizado en inventario.'));
            },
            onError: (errs) => {
                setIsSubmitting(false);
                notifyError(__('Revise los campos del formulario.'));
            },
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/dashboard' },
        { title: __('Compras'), href: '/admin/compras' },
        { title: __('Registrar Compra'), href: '/admin/compras/crear' },
    ];

    return (
        <>
            <Head title={__('Registrar Nueva Compra')} />

            <Breadcrumbs breadcrumbs={breadcrumbs} />

            <form onSubmit={handleSubmit} className="space-y-6">
                <ModuleHeader
                    title={__('Registrar Nueva Compra de Insumos')}
                    description={__('Ingrese la factura de mercancía para abastecer inventario y generar la orden de compra.')}
                    action={
                        <Link href="/admin/compras">
                            <Button variant="outline" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                {__('Volver al Historial')}
                            </Button>
                        </Link>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna Principal - Formulario e Ítems */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Cabecera de la Compra */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b pb-3">
                                <Building2 className="w-4 h-4 text-indigo-600" />
                                {__('Datos de Factura y Proveedor')}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="font-bold">{__('Proveedor')} *</Label>
                                    <Select value={proveedorId} onValueChange={setProveedorId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={__('Seleccionar Proveedor...')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {proveedores.map((p) => (
                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                    {p.razon_social} {p.rif_documento ? `(${p.rif_documento})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="font-bold">{__('Sucursal Destino')}</Label>
                                    <Select value={sucursalId} onValueChange={setSucursalId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={__('Seleccionar Sucursal...')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sucursales.map((s) => (
                                                <SelectItem key={s.id} value={s.id.toString()}>
                                                    {s.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>{__('Número de Factura')}</Label>
                                    <Input
                                        placeholder="Ej: F-90214"
                                        value={numeroFactura}
                                        onChange={(e) => setNumeroFactura(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>{__('Número de Control / Remisión')}</Label>
                                    <Input
                                        placeholder="Ej: CTRL-8821"
                                        value={numeroControl}
                                        onChange={(e) => setNumeroControl(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>{__('Fecha de Emisión')} *</Label>
                                    <Input
                                        type="date"
                                        value={fechaEmision}
                                        onChange={(e) => setFechaEmision(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>{__('Tipo de Pago')} *</Label>
                                    <Select value={tipoPago} onValueChange={(val: 'contado' | 'credito') => setTipoPago(val)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="contado">{__('De Contado (Pago Inmediato)')}</SelectItem>
                                            <SelectItem value="credito">{__('A Crédito (Cuenta por Pagar CxP)')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {tipoPago === 'credito' && (
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <Label className="text-rose-600 font-bold">{__('Fecha de Vencimiento del Crédito')}</Label>
                                        <Input
                                            type="date"
                                            value={fechaVencimiento}
                                            onChange={(e) => setFechaVencimiento(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Buscador de Productos e Ítems */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b pb-3">
                                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                                {__('Detalle de Productos e Insumos')}
                            </h3>

                            {/* Buscador Dinámico */}
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <Input
                                    placeholder={__('Escriba el nombre o código del producto para agregar...')}
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="pl-9"
                                />

                                {filteredProducts.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700 max-h-60 overflow-y-auto">
                                        {filteredProducts.map((prod) => (
                                            <div
                                                key={prod.id}
                                                onClick={() => handleAddProduct(prod)}
                                                className="p-3 hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center transition-colors"
                                            >
                                                <div>
                                                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{prod.nombre}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{prod.codigo} | Stock: {prod.stock}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-bold text-indigo-600">Costo: {currencySymbol}{prod.costo_compra.toFixed(2)}</div>
                                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                                                        + Agregar
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tabla de Productos Seleccionados */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b">
                                        <tr>
                                            <th className="p-3">{__('Producto')}</th>
                                            <th className="p-3 text-center w-20">{__('Cant.')}</th>
                                            <th className="p-3 text-right w-28">{__('Costo U.')}</th>
                                            <th className="p-3 text-right w-24">{__('IVA U.')}</th>
                                            <th className="p-3 text-right w-28">{__('Subtotal')}</th>
                                            <th className="p-3 text-center w-36">{__('Precio Venta')}</th>
                                            <th className="p-3 text-center w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {items.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-slate-400">
                                                    {__('No hay productos agregados. Utilice el buscador superior.')}
                                                </td>
                                            </tr>
                                        ) : (
                                            items.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                    <td className="p-3">
                                                        <div className="font-bold text-slate-900 dark:text-slate-100">{item.nombre}</div>
                                                        <div className="text-[10px] text-slate-500 font-mono">{item.codigo} | Actual: {item.stock_actual}</div>
                                                    </td>
                                                    <td className="p-3">
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            min="0.01"
                                                            value={item.cantidad}
                                                            onChange={(e) => handleItemChange(idx, 'cantidad', e.target.value)}
                                                            className="h-8 text-center text-xs p-1"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            min="0"
                                                            value={item.costo_unitario}
                                                            onChange={(e) => handleItemChange(idx, 'costo_unitario', e.target.value)}
                                                            className="h-8 text-right text-xs p-1 font-mono"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            min="0"
                                                            value={item.impuesto_unitario}
                                                            onChange={(e) => handleItemChange(idx, 'impuesto_unitario', e.target.value)}
                                                            className="h-8 text-right text-xs p-1 font-mono"
                                                        />
                                                    </td>
                                                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                                                        {currencySymbol}{item.subtotal.toFixed(2)}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`upd-${idx}`}
                                                                    checked={item.update_sale_price}
                                                                    onChange={(e) => handleItemChange(idx, 'update_sale_price', e.target.checked)}
                                                                    className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                                                                />
                                                                <label htmlFor={`upd-${idx}`} className="text-[10px] text-slate-600">
                                                                    {__('Actualizar')}
                                                                </label>
                                                            </div>
                                                            {item.update_sale_price && (
                                                                <Input
                                                                    type="number"
                                                                    step="any"
                                                                    min="0"
                                                                    value={item.nuevo_precio_venta}
                                                                    onChange={(e) => handleItemChange(idx, 'nuevo_precio_venta', e.target.value)}
                                                                    className="h-7 text-right text-xs p-1 font-mono bg-emerald-50 border-emerald-300"
                                                                />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRemoveItem(idx)}
                                                            className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <Label>{__('Notas u Observaciones de la Compra')}</Label>
                                <Textarea
                                    rows={2}
                                    placeholder={__('Escriba notas sobre la recepción de mercancía...')}
                                    value={notas}
                                    onChange={(e) => setNotas(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Columna Lateral - Resumen y Finanzas */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sticky top-6">
                            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b pb-3">
                                <Calculator className="w-4 h-4 text-indigo-600" />
                                {__('Resumen de Totales')}
                            </h3>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{__('Subtotal')}:</span>
                                    <span className="font-mono font-semibold">{currencySymbol}{subtotalGlobal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{__('Impuestos (IVA)')}:</span>
                                    <span className="font-mono font-semibold">+{currencySymbol}{impuestoGlobal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center gap-2 pt-1 border-t">
                                    <span className="text-slate-500">{__('Descuento Global')}:</span>
                                    <div className="w-28">
                                        <Input
                                            type="number"
                                            step="any"
                                            min="0"
                                            placeholder="0.00"
                                            value={descuento}
                                            onChange={(e) => setDescuento(e.target.value)}
                                            className="h-8 text-right font-mono text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t text-base font-bold">
                                    <span className="text-slate-900 dark:text-slate-100">{__('TOTAL COMPRA')}:</span>
                                    <span className="font-mono text-xl text-indigo-600 dark:text-indigo-400">
                                        {currencySymbol}{totalGlobal.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Opciones de Pago Inicial / Caja */}
                            <div className="border-t pt-4 space-y-3">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    {__('Configuración del Pago')}
                                </h4>

                                {tipoPago === 'credito' && (
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">{__('Monto Inicial Abonado')}</Label>
                                        <Input
                                            type="number"
                                            step="any"
                                            min="0"
                                            max={totalGlobal}
                                            placeholder="0.00"
                                            value={montoInicial}
                                            onChange={(e) => setMontoInicial(e.target.value)}
                                            className="font-mono text-sm"
                                        />
                                        <div className="flex justify-between text-xs text-rose-600 font-bold pt-1">
                                            <span>{__('Saldo Quedará en CxP')}:</span>
                                            <span>{currencySymbol}{saldoPendienteGlobal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}

                                {initialPayNum > 0 && (
                                    <div className="space-y-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">{__('Método de Pago')}</Label>
                                            <Select value={metodoPago} onValueChange={setMetodoPago}>
                                                <SelectTrigger className="h-8 text-xs">
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
                                            <Label className="text-xs">{__('Referencia de Pago')}</Label>
                                            <Input
                                                placeholder="Ej: Transf #9921"
                                                value={referenciaPago}
                                                onChange={(e) => setReferenciaPago(e.target.value)}
                                                className="h-8 text-xs font-mono"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 pt-1">
                                            <input
                                                type="checkbox"
                                                id="chk-caja"
                                                checked={pagarConCaja}
                                                onChange={(e) => setPagarConCaja(e.target.checked)}
                                                disabled={!activeRegister}
                                                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                            />
                                            <label htmlFor="chk-caja" className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                                {__('Registrar egreso en Caja Chica POS')}
                                            </label>
                                        </div>
                                        {!activeRegister && (
                                            <p className="text-[10px] text-amber-600 dark:text-amber-400">
                                                ⚠️ No hay caja abierta. El egreso no afectará turno POS.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting || items.length === 0 || !proveedorId}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 shadow-md gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                {__('Procesar y Guardar Compra')}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}
