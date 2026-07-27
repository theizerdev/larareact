import { Head, useForm, router } from '@inertiajs/react';
import {
    ShoppingCart,
    Search,
    Plus,
    Minus,
    Trash2,
    CheckCircle2,
    CreditCard,
    DollarSign,
    Package,
    Wrench,
    Printer,
    User,
    AlertCircle,
    Building2,
    Smartphone,
    Receipt,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface CatalogItem {
    id: number;
    tipo: 'producto' | 'servicio';
    nombre: string;
    codigo: string;
    precio: number;
    stock: number | null;
}

interface CartItem {
    id: string; // unique cart item id (e.g. 'producto-1')
    itemable_id: number;
    concepto_tipo: 'producto' | 'servicio';
    nombre: string;
    codigo: string;
    precio_unitario: number;
    cantidad: number;
    stock: number | null;
}

interface CashRegister {
    id: number;
    status: 'open' | 'closed';
}

interface Props {
    catalog: CatalogItem[];
    activeRegister: CashRegister | null;
    currencySymbol?: string;
}

export default function Terminal({ catalog, activeRegister, currencySymbol = '$' }: Props) {
    const { __ } = useTranslate();

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'producto' | 'servicio'>('all');

    // Cart state
    const [cart, setCart] = useState<CartItem[]>([]);
    const [descuento, setDescuento] = useState<number>(0);
    const [impuesto, setImpuesto] = useState<number>(0);

    // Payment modal state
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [clienteNombre, setClienteNombre] = useState('Cliente General');
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [montoRecibido, setMontoRecibido] = useState<string>('');

    // Ticket Success Receipt dialog
    const [completedSale, setCompletedSale] = useState<any | null>(null);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Punto de Venta'), href: '#' },
        { title: __('Terminal POS'), href: '/admin/ventas/terminal' },
    ];

    // Filtered catalog
    const filteredCatalog = catalog.filter((item) => {
        const matchesType = typeFilter === 'all' || item.tipo === typeFilter;
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            (item.nombre || '').toLowerCase().includes(query) ||
            (item.codigo || '').toLowerCase().includes(query);
        return matchesType && matchesSearch;
    });

    // Cart operations
    const addToCart = (item: CatalogItem) => {
        const cartId = `${item.tipo}-${item.id}`;
        setCart((prevCart) => {
            const existingIndex = prevCart.findIndex((ci) => ci.id === cartId);
            if (existingIndex > -1) {
                const updated = [...prevCart];
                const currentQty = updated[existingIndex].cantidad;
                if (item.stock !== null && currentQty >= item.stock) {
                    notifyError(__('No hay más stock disponible para este producto.'));
                    return prevCart;
                }
                updated[existingIndex].cantidad += 1;
                return updated;
            } else {
                if (item.stock !== null && item.stock <= 0) {
                    notifyError(__('El producto no cuenta con stock disponible.'));
                    return prevCart;
                }
                return [
                    ...prevCart,
                    {
                        id: cartId,
                        itemable_id: item.id,
                        concepto_tipo: item.tipo,
                        nombre: item.nombre,
                        codigo: item.codigo,
                        precio_unitario: item.precio,
                        cantidad: 1,
                        stock: item.stock,
                    },
                ];
            }
        });
    };

    const updateQuantity = (cartId: string, delta: number) => {
        setCart((prevCart) =>
            prevCart
                .map((ci) => {
                    if (ci.id === cartId) {
                        const newQty = ci.cantidad + delta;
                        if (ci.stock !== null && newQty > ci.stock) {
                            notifyError(__('Excede el stock disponible.'));
                            return ci;
                        }
                        return newQty > 0 ? { ...ci, cantidad: newQty } : null;
                    }
                    return ci;
                })
                .filter(Boolean) as CartItem[]
        );
    };

    const removeFromCart = (cartId: string) => {
        setCart((prevCart) => prevCart.filter((ci) => ci.id !== cartId));
    };

    const clearCart = () => {
        setCart([]);
        setDescuento(0);
        setImpuesto(0);
    };

    // Calculation
    const subtotal = cart.reduce((acc, item) => acc + item.precio_unitario * item.cantidad, 0);
    const totalImpuesto = (subtotal * impuesto) / 100;
    const total = Math.max(0, subtotal + totalImpuesto - descuento);

    const numericMontoRecibido = parseFloat(montoRecibido) || total;
    const cambio = Math.max(0, numericMontoRecibido - total);

    const handleOpenPayment = () => {
        if (!activeRegister) {
            notifyError(__('Debe tener una caja abierta para procesar ventas.'));
            return;
        }
        if (cart.length === 0) {
            notifyError(__('El carrito de compras está vacío.'));
            return;
        }
        setMontoRecibido(total.toFixed(2));
        setIsPaymentModalOpen(true);
    };

    const handleCompleteSale = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            cliente_nombre: clienteNombre || 'Cliente General',
            metodo_pago: metodoPago,
            descuento: descuento,
            impuesto: totalImpuesto,
            monto_recibido: numericMontoRecibido,
            items: cart.map((ci) => ({
                itemable_id: ci.itemable_id,
                concepto_tipo: ci.concepto_tipo,
                nombre: ci.nombre,
                cantidad: ci.cantidad,
                precio_unitario: ci.precio_unitario,
            })),
        };

        router.post('/admin/ventas', payload, {
            onSuccess: (page) => {
                setIsPaymentModalOpen(false);
                clearCart();
                notifySuccess(__('Venta completada exitosamente.'));
                const flashSale = (page.props as any).flash?.notification?.sale;
                if (flashSale) {
                    setCompletedSale(flashSale);
                }
            },
            onError: () => notifyError(__('Ocurrió un error al procesar la venta.')),
        });
    };

    return (
        <>
            <Head title={__('Terminal POS - Ventas')} />

            <div className="space-y-4">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<ShoppingCart className="h-6 w-6 text-white" />}
                    title={__('Terminal de Cobro (POS)')}
                    description={__('Realiza ventas rápidas de productos y servicios con cálculo automático de cambio.')}
                    colorClassName="bg-blue-600"
                >
                    {activeRegister ? (
                        <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-white border border-emerald-400/30">
                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                            {__('Caja Abierta')} #{activeRegister.id}
                        </div>
                    ) : (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => router.get('/admin/cajas')}
                        >
                            <AlertCircle className="mr-1.5 h-4 w-4" />
                            {__('Aperturar Caja Requerida')}
                        </Button>
                    )}
                </ModuleHeader>

                {!activeRegister && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{__('Atención: No tiene una caja abierta')}</AlertTitle>
                        <AlertDescription className="flex items-center justify-between">
                            <span>{__('Para poder cobrar y registrar ingresos en el sistema debe aperturar su caja de turno.')}</span>
                            <Button size="sm" variant="outline" className="bg-white text-slate-900" onClick={() => router.get('/admin/cajas')}>
                                {__('Ir a Flujo de Caja')}
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Main POS Interface (Left Grid 7 cols + Right Cart 5 cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Catalog Section (7 cols) */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Search & Filter bar */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={__('Buscar producto o servicio por nombre o código...')}
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={typeFilter === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setTypeFilter('all')}
                                >
                                    {__('Todos')} ({catalog.length})
                                </Button>
                                <Button
                                    type="button"
                                    variant={typeFilter === 'producto' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setTypeFilter('producto')}
                                    className="gap-1"
                                >
                                    <Package className="w-3.5 h-3.5" />
                                    {__('Productos')}
                                </Button>
                                <Button
                                    type="button"
                                    variant={typeFilter === 'servicio' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setTypeFilter('servicio')}
                                    className="gap-1"
                                >
                                    <Wrench className="w-3.5 h-3.5" />
                                    {__('Servicios')}
                                </Button>
                            </div>
                        </div>

                        {/* Catalog Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                            {filteredCatalog.length > 0 ? (
                                filteredCatalog.map((item) => (
                                    <div
                                        key={`${item.tipo}-${item.id}`}
                                        onClick={() => addToCart(item)}
                                        className="group rounded-xl border bg-card p-3.5 text-card-foreground shadow-sm hover:shadow-md hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-1 mb-1.5">
                                                <span className={cn(
                                                    'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                                                    item.tipo === 'producto'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900'
                                                )}>
                                                    {item.tipo === 'producto' ? __('Producto') : __('Servicio')}
                                                </span>
                                                <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[90px]">
                                                    {item.codigo}
                                                </span>
                                            </div>

                                            <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                {item.nombre}
                                            </h4>
                                        </div>

                                        <div className="pt-3 mt-2 border-t flex items-center justify-between">
                                            <div>
                                                <span className="text-xs text-muted-foreground block">{__('Precio')}</span>
                                                <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                                    {currencySymbol}{item.precio.toFixed(2)}
                                                </span>
                                            </div>
                                            {item.stock !== null && (
                                                <span className={cn(
                                                    'text-[11px] font-medium px-2 py-0.5 rounded',
                                                    item.stock > 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-600' : 'bg-rose-100 text-rose-600'
                                                )}>
                                                    Stock: {item.stock}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center text-muted-foreground">
                                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm font-medium">{__('No se encontraron productos o servicios.')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cart / Ticket Panel (5 cols) */}
                    <div className="lg:col-span-5 rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col h-[calc(100vh-220px)]">
                        {/* Cart Header */}
                        <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-md">
                                <ShoppingCart className="w-5 h-5 text-blue-600" />
                                {__('Carrito de Venta')}
                                <span className="text-xs font-normal text-muted-foreground">({cart.length} {__('ítems')})</span>
                            </div>
                            {cart.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={clearCart} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50">
                                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                                    {__('Vaciar')}
                                </Button>
                            )}
                        </div>

                        {/* Cart Items List */}
                        <div className="flex-1 overflow-y-auto p-4 divide-y space-y-2">
                            {cart.length > 0 ? (
                                cart.map((item) => (
                                    <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate">{item.nombre}</p>
                                            <p className="text-xs text-muted-foreground font-mono">
                                                {currencySymbol}{item.precio_unitario.toFixed(2)} c/u
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => updateQuantity(item.id, -1)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>

                                            <span className="w-8 text-center font-mono font-bold text-sm">
                                                {item.cantidad}
                                            </span>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => updateQuantity(item.id, 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        <div className="text-right min-w-[70px]">
                                            <span className="font-mono font-bold text-sm block">
                                                {currencySymbol}{(item.precio_unitario * item.cantidad).toFixed(2)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-[11px] text-rose-500 hover:underline"
                                            >
                                                {__('Quitar')}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                                    <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="text-sm font-medium">{__('El carrito está vacío')}</p>
                                    <p className="text-xs text-muted-foreground max-w-xs mt-1">
                                        {__('Haz clic en un producto o servicio del catálogo para agregarlo al ticket.')}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Cart Summary Footer */}
                        <div className="p-4 border-t bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                            <div className="space-y-1.5 text-xs text-muted-foreground">
                                <div className="flex justify-between">
                                    <span>{__('Subtotal')}:</span>
                                    <span className="font-mono font-semibold text-foreground">{currencySymbol}{subtotal.toFixed(2)}</span>
                                </div>
                                {descuento > 0 && (
                                    <div className="flex justify-between text-rose-600">
                                        <span>{__('Descuento')}:</span>
                                        <span className="font-mono font-semibold">-{currencySymbol}{descuento.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 border-t flex items-center justify-between">
                                <div>
                                    <span className="text-xs uppercase tracking-wider text-muted-foreground block">{__('Total a Pagar')}</span>
                                    <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                                        {currencySymbol}{total.toFixed(2)}
                                    </span>
                                </div>

                                <Button
                                    size="lg"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
                                    disabled={cart.length === 0 || !activeRegister}
                                    onClick={handleOpenPayment}
                                >
                                    <DollarSign className="mr-2 h-5 w-5" />
                                    {__('Cobrar')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dialog Modal Cobro / Pago */}
                <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-emerald-600" />
                                {__('Completar Venta y Cobro')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Seleccione el método de pago e ingrese el dinero recibido del cliente.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCompleteSale} className="space-y-4 py-2">
                            {/* Total Banner */}
                            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-4 text-center">
                                <span className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">{__('TOTAL A COBRAR')}</span>
                                <p className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-300">
                                    {currencySymbol}{total.toFixed(2)}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cliente">{__('Nombre del Cliente')}</Label>
                                <Input
                                    id="cliente"
                                    value={clienteNombre}
                                    onChange={(e) => setClienteNombre(e.target.value)}
                                    placeholder="Ej: Cliente General, Juan Pérez..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="metodo_pago">{__('Método de Pago')}</Label>
                                <Select value={metodoPago} onValueChange={setMetodoPago}>
                                    <SelectTrigger id="metodo_pago">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="efectivo">{__('Efectivo')}</SelectItem>
                                        <SelectItem value="transferencia">{__('Transferencia Bancaria')}</SelectItem>
                                        <SelectItem value="tarjeta">{__('Tarjeta Débito/Crédito')}</SelectItem>
                                        <SelectItem value="pago_movil">{__('Pago Móvil')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="monto_recibido">{__('Monto Recibido')} ({currencySymbol})</Label>
                                    <Input
                                        id="monto_recibido"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={montoRecibido}
                                        onChange={(e) => setMontoRecibido(e.target.value)}
                                        className="font-mono font-bold"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>{__('Cambio / Vuelto')}</Label>
                                    <div className="h-10 rounded-md border bg-slate-50 dark:bg-slate-900 px-3 py-2 text-md font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                                        {currencySymbol}{cambio.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                                    {__('Cancelar')}
                                </Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                                    {__('Emitir Ticket y Cobrar')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Dialog Recibo / Ticket Emitido */}
                {completedSale && (
                    <Dialog open={!!completedSale} onOpenChange={() => setCompletedSale(null)}>
                        <DialogContent className="sm:max-w-sm text-center">
                            <DialogHeader>
                                <DialogTitle className="text-center flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                        <CheckCircle2 className="w-7 h-7" />
                                    </div>
                                    <span>{__('Venta Completada')}</span>
                                </DialogTitle>
                                <DialogDescription className="text-center font-mono font-bold text-foreground">
                                    {completedSale.codigo_ticket}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-3 border-y space-y-2 text-sm text-left">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{__('Cliente')}:</span>
                                    <span className="font-semibold">{completedSale.cliente_nombre}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{__('Método de Pago')}:</span>
                                    <span className="font-semibold capitalize">{completedSale.metodo_pago}</span>
                                </div>
                                <div className="flex justify-between text-base font-bold">
                                    <span>{__('Total Pagado')}:</span>
                                    <span className="text-emerald-600">{currencySymbol}{Number(completedSale.total).toFixed(2)}</span>
                                </div>
                                {Number(completedSale.cambio) > 0 && (
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{__('Cambio Entregado')}:</span>
                                        <span className="font-mono font-semibold">{currencySymbol}{Number(completedSale.cambio).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="flex flex-col sm:flex-row gap-2">
                                <Button variant="outline" className="w-full" onClick={() => window.print()}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    {__('Imprimir Ticket')}
                                </Button>
                                <Button className="w-full" onClick={() => setCompletedSale(null)}>
                                    {__('Aceptar y Nueva Venta')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </>
    );
}
