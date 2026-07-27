import { Head, router, usePage } from '@inertiajs/react';
import {
    ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle2, CreditCard, DollarSign,
    Package, Wrench, User, AlertCircle, Building2, Smartphone, Receipt, Pause,
    Play, X, Wallet,
} from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
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
    id: string;
    itemable_id: number;
    concepto_tipo: 'producto' | 'servicio';
    nombre: string;
    codigo: string;
    precio_unitario: number;
    cantidad: number;
    stock: number | null;
}

interface CashRegister { id: number; status: 'open' | 'closed'; }
interface HeldSaleRecord { id: number; label: string | null; cliente_nombre: string; cart_data: CartItem[]; created_at: string; }
interface ClienteRecord { id: number; nombre: string; telefono: string | null; limite_credito: number; saldo_pendiente: number; }

interface PaymentLine { metodo_pago: string; monto: string; }

interface Props {
    catalog: CatalogItem[];
    activeRegister: CashRegister | null;
    currencySymbol?: string;
    heldSales: HeldSaleRecord[];
    clientes: ClienteRecord[];
}

export default function Terminal({ catalog, activeRegister, currencySymbol = '$', heldSales = [], clientes = [] }: Props) {
    const { __ } = useTranslate();

    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'producto' | 'servicio'>('all');

    const [cart, setCart] = useState<CartItem[]>([]);
    const [descuento, setDescuento] = useState<number>(0);

    // Payment modal
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [clienteNombre, setClienteNombre] = useState('Cliente General');
    const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
    const [esCredito, setEsCredito] = useState(false);
    const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([{ metodo_pago: 'efectivo', monto: '' }]);
    const montoRef = useRef<HTMLInputElement>(null);

    // Hold sale dialog
    const [isHoldOpen, setIsHoldOpen] = useState(false);
    const [holdLabel, setHoldLabel] = useState('');

    // Success receipt
    const [completedSale, setCompletedSale] = useState<any | null>(null);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Punto de Venta'), href: '#' },
        { title: __('Terminal POS'), href: '/admin/ventas/terminal' },
    ];

    // F12 shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F12') {
                e.preventDefault();
                if (cart.length > 0 && activeRegister) {
                    handleOpenPayment();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart, activeRegister]);

    // Focus monto field when payment modal opens
    useEffect(() => {
        if (isPaymentModalOpen && montoRef.current) {
            setTimeout(() => montoRef.current?.focus(), 100);
        }
    }, [isPaymentModalOpen]);

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
        setCart((prev) => {
            const idx = prev.findIndex((ci) => ci.id === cartId);
            if (idx > -1) {
                const updated = [...prev];
                if (item.stock !== null && updated[idx].cantidad >= item.stock) {
                    notifyError(__('No hay más stock disponible para este producto.'));
                    return prev;
                }
                updated[idx] = { ...updated[idx], cantidad: updated[idx].cantidad + 1 };
                return updated;
            }
            if (item.stock !== null && item.stock <= 0) {
                notifyError(__('El producto no cuenta con stock disponible.'));
                return prev;
            }
            return [...prev, {
                id: cartId, itemable_id: item.id, concepto_tipo: item.tipo,
                nombre: item.nombre, codigo: item.codigo, precio_unitario: item.precio,
                cantidad: 1, stock: item.stock,
            }];
        });
    };

    const updateQuantity = (cartId: string, delta: number) => {
        setCart((prev) => prev.map((ci) => {
            if (ci.id !== cartId) return ci;
            const newQty = ci.cantidad + delta;
            if (ci.stock !== null && newQty > ci.stock) { notifyError(__('Excede el stock disponible.')); return ci; }
            return newQty > 0 ? { ...ci, cantidad: newQty } : ci;
        }).filter((ci) => ci.cantidad > 0));
    };

    const removeFromCart = (cartId: string) => setCart((prev) => prev.filter((ci) => ci.id !== cartId));
    const clearCart = () => { setCart([]); setDescuento(0); setEsCredito(false); setSelectedClienteId(null); setClienteNombre('Cliente General'); };

    // Totals
    const subtotal = cart.reduce((acc, item) => acc + item.precio_unitario * item.cantidad, 0);
    const total = Math.max(0, subtotal - descuento);

    // Payment lines total
    const totalPaid = paymentLines.reduce((acc, pl) => acc + (parseFloat(pl.monto) || 0), 0);
    const remaining = Math.max(0, total - totalPaid);
    const cambio = esCredito ? 0 : Math.max(0, totalPaid - total);

    const addPaymentLine = () => setPaymentLines((prev) => [...prev, { metodo_pago: 'efectivo', monto: '' }]);
    const removePaymentLine = (idx: number) => setPaymentLines((prev) => prev.filter((_, i) => i !== idx));
    const updatePaymentLine = (idx: number, field: keyof PaymentLine, value: string) => {
        setPaymentLines((prev) => prev.map((pl, i) => i === idx ? { ...pl, [field]: value } : pl));
    };

    const handleOpenPayment = useCallback(() => {
        if (!activeRegister) { notifyError(__('Debe tener una caja abierta para procesar ventas.')); return; }
        if (cart.length === 0) { notifyError(__('El carrito de compras está vacío.')); return; }
        setPaymentLines([{ metodo_pago: 'efectivo', monto: total.toFixed(2) }]);
        setIsPaymentModalOpen(true);
    }, [activeRegister, cart, total]);

    const handleCompleteSale = (e: React.FormEvent) => {
        e.preventDefault();
        const payments = paymentLines.filter((pl) => parseFloat(pl.monto) > 0).map((pl) => ({
            metodo_pago: pl.metodo_pago, monto: parseFloat(pl.monto),
        }));

        if (!esCredito && remaining > 0.01) {
            notifyError(__('El monto pagado no cubre el total de la venta.'));
            return;
        }

        const payload = {
            cliente_nombre: clienteNombre || 'Cliente General',
            cliente_id: selectedClienteId,
            es_credito: esCredito,
            descuento, impuesto: 0, monto_recibido: totalPaid,
            payments,
            items: cart.map((ci) => ({
                itemable_id: ci.itemable_id, concepto_tipo: ci.concepto_tipo,
                nombre: ci.nombre, cantidad: ci.cantidad, precio_unitario: ci.precio_unitario,
            })),
        };

        router.post('/admin/ventas', payload, {
            onSuccess: (page) => {
                setIsPaymentModalOpen(false);
                clearCart();
                notifySuccess(__('Venta completada exitosamente.'));
                const flashSale = (page.props as any).flash?.notification?.sale;
                if (flashSale) setCompletedSale(flashSale);
            },
            onError: () => notifyError(__('Ocurrió un error al procesar la venta.')),
        });
    };

    // Held sales
    const handleHoldSale = () => {
        if (cart.length === 0) { notifyError(__('El carrito está vacío.')); return; }
        setIsHoldOpen(true);
    };

    const submitHoldSale = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/admin/ventas/hold', {
            label: holdLabel || null,
            cliente_nombre: clienteNombre,
            cart_data: cart,
        }, {
            onSuccess: () => { setIsHoldOpen(false); clearCart(); setHoldLabel(''); notifySuccess(__('Venta puesta en espera.')); },
            onError: () => notifyError(__('Error al guardar la venta en espera.')),
        });
    };

    const handleResumeSale = (heldSale: HeldSaleRecord) => {
        if (cart.length > 0 && !confirm(__('Al retomar esta venta se reemplazará el carrito actual. ¿Continuar?'))) return;
        setCart(heldSale.cart_data || []);
        setClienteNombre(heldSale.cliente_nombre || 'Cliente General');
        router.post(`/admin/ventas/resume/${heldSale.id}`, {}, {
            onSuccess: () => notifySuccess(__('Venta retomada.')),
        });
    };

    const handleDeleteHeld = (id: number) => {
        if (!confirm(__('¿Descartar esta venta en espera?'))) return;
        router.delete(`/admin/ventas/held/${id}`, {
            onSuccess: () => notifySuccess(__('Venta en espera descartada.')),
        });
    };

    // Client selection
    const handleSelectCliente = (clienteId: string) => {
        if (clienteId === '0') {
            setSelectedClienteId(null);
            setClienteNombre('Cliente General');
            return;
        }
        const c = clientes.find((cl) => cl.id === parseInt(clienteId));
        if (c) {
            setSelectedClienteId(c.id);
            setClienteNombre(c.nombre);
        }
    };

    return (
        <>
            <Head title={__('Terminal POS - Ventas')} />
            <div className="space-y-4">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<ShoppingCart className="h-6 w-6 text-white" />}
                    title={__('Terminal de Cobro (POS)')}
                    description={__('Realiza ventas rápidas de productos y servicios. Presiona F12 para cobrar.')}
                    colorClassName="bg-blue-600"
                >
                    <div className="flex items-center gap-2">
                        {heldSales.length > 0 && (
                            <Badge variant="secondary" className="bg-amber-500/20 text-white border-amber-400/30 text-xs">
                                <Pause className="w-3 h-3 mr-1" />
                                {heldSales.length} {__('en espera')}
                            </Badge>
                        )}
                        {activeRegister ? (
                            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-white border border-emerald-400/30">
                                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                {__('Caja')} #{activeRegister.id}
                            </div>
                        ) : (
                            <Button variant="destructive" size="sm" onClick={() => router.get('/admin/cajas')}>
                                <AlertCircle className="mr-1.5 h-4 w-4" />
                                {__('Aperturar Caja')}
                            </Button>
                        )}
                    </div>
                </ModuleHeader>

                {!activeRegister && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{__('Atención: No tiene una caja abierta')}</AlertTitle>
                        <AlertDescription className="flex items-center justify-between">
                            <span>{__('Para poder cobrar y registrar ingresos debe aperturar su caja de turno.')}</span>
                            <Button size="sm" variant="outline" className="bg-white text-slate-900" onClick={() => router.get('/admin/cajas')}>{__('Ir a Flujo de Caja')}</Button>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Held Sales Bar */}
                {heldSales.length > 0 && (
                    <div className="rounded-lg border p-3 bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900">
                        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                            <Pause className="w-4 h-4" />
                            {__('Ventas en Espera')}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {heldSales.map((hs) => (
                                <div key={hs.id} className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg border px-3 py-1.5 text-xs shadow-sm">
                                    <span className="font-semibold">{hs.label || `#${hs.id}`}</span>
                                    <span className="text-muted-foreground">({hs.cliente_nombre})</span>
                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-emerald-600" onClick={() => handleResumeSale(hs)}>
                                        <Play className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-rose-500" onClick={() => handleDeleteHeld(hs.id)}>
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main POS Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Catalog (7 cols) */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder={__('Buscar producto o servicio...')} className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant={typeFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter('all')}>{__('Todos')}</Button>
                                <Button type="button" variant={typeFilter === 'producto' ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter('producto')} className="gap-1"><Package className="w-3.5 h-3.5" />{__('Productos')}</Button>
                                <Button type="button" variant={typeFilter === 'servicio' ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter('servicio')} className="gap-1"><Wrench className="w-3.5 h-3.5" />{__('Servicios')}</Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                            {filteredCatalog.length > 0 ? filteredCatalog.map((item) => (
                                <div key={`${item.tipo}-${item.id}`} onClick={() => addToCart(item)}
                                    className="group rounded-xl border bg-card p-3.5 text-card-foreground shadow-sm hover:shadow-md hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between gap-1 mb-1.5">
                                            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                                                item.tipo === 'producto' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900'
                                                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900')}>
                                                {item.tipo === 'producto' ? __('Producto') : __('Servicio')}
                                            </span>
                                            <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[90px]">{item.codigo}</span>
                                        </div>
                                        <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">{item.nombre}</h4>
                                    </div>
                                    <div className="pt-3 mt-2 border-t flex items-center justify-between">
                                        <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">{currencySymbol}{item.precio.toFixed(2)}</span>
                                        {item.stock !== null && (
                                            <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded', item.stock > 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-600' : 'bg-rose-100 text-rose-600')}>
                                                Stock: {item.stock}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full py-12 text-center text-muted-foreground">
                                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm font-medium">{__('No se encontraron productos o servicios.')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cart (5 cols) */}
                    <div className="lg:col-span-5 rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col h-[calc(100vh-260px)]">
                        <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-md">
                                <ShoppingCart className="w-5 h-5 text-blue-600" />
                                {__('Carrito')}
                                <span className="text-xs font-normal text-muted-foreground">({cart.length})</span>
                            </div>
                            <div className="flex gap-1">
                                {cart.length > 0 && (
                                    <>
                                        <Button variant="ghost" size="sm" onClick={handleHoldSale} className="text-amber-600 hover:text-amber-700">
                                            <Pause className="w-3.5 h-3.5 mr-1" />{__('En Espera')}
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={clearCart} className="text-rose-500 hover:text-rose-700">
                                            <Trash2 className="w-3.5 h-3.5 mr-1" />{__('Vaciar')}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Client selector */}
                        <div className="px-4 py-2 border-b">
                            <Select value={String(selectedClienteId || '0')} onValueChange={handleSelectCliente}>
                                <SelectTrigger className="h-8 text-xs">
                                    <User className="w-3 h-3 mr-1 text-muted-foreground" />
                                    <SelectValue placeholder={__('Cliente General')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">{__('Cliente General')}</SelectItem>
                                    {clientes.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.nombre} {c.saldo_pendiente > 0 ? `(${__('Deuda')}: ${currencySymbol}${c.saldo_pendiente.toFixed(2)})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 divide-y space-y-2">
                            {cart.length > 0 ? cart.map((item) => (
                                <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate">{item.nombre}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{currencySymbol}{item.precio_unitario.toFixed(2)} c/u</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                                        <span className="w-8 text-center font-mono font-bold text-sm">{item.cantidad}</span>
                                        <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                                    </div>
                                    <div className="text-right min-w-[70px]">
                                        <span className="font-mono font-bold text-sm block">{currencySymbol}{(item.precio_unitario * item.cantidad).toFixed(2)}</span>
                                        <button type="button" onClick={() => removeFromCart(item.id)} className="text-[11px] text-rose-500 hover:underline">{__('Quitar')}</button>
                                    </div>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12">
                                    <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="text-sm font-medium">{__('El carrito está vacío')}</p>
                                    <p className="text-xs max-w-xs mt-1">{__('Haz clic en un producto o servicio del catálogo para agregarlo.')}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                            <div className="space-y-1.5 text-xs text-muted-foreground">
                                <div className="flex justify-between">
                                    <span>{__('Subtotal')}:</span>
                                    <span className="font-mono font-semibold text-foreground">{currencySymbol}{subtotal.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="pt-2 border-t flex items-center justify-between">
                                <div>
                                    <span className="text-xs uppercase tracking-wider text-muted-foreground block">{__('Total a Pagar')}</span>
                                    <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{currencySymbol}{total.toFixed(2)}</span>
                                </div>
                                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
                                    disabled={cart.length === 0 || !activeRegister} onClick={handleOpenPayment}>
                                    <DollarSign className="mr-2 h-5 w-5" />{__('Cobrar')} (F12)
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Modal (Multiple Payments) */}
                <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-emerald-600" />{__('Completar Venta y Cobro')}
                            </DialogTitle>
                            <DialogDescription>{__('Configure los métodos de pago. Puede combinar múltiples formas de pago en una sola venta.')}</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCompleteSale} className="space-y-4 py-2">
                            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-4 text-center">
                                <span className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">{__('TOTAL A COBRAR')}</span>
                                <p className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-300">{currencySymbol}{total.toFixed(2)}</p>
                            </div>

                            {/* Credit toggle */}
                            {selectedClienteId && (
                                <div className="flex items-center justify-between rounded-lg border p-3 bg-amber-50/50 dark:bg-amber-950/10">
                                    <div>
                                        <p className="text-sm font-semibold">{__('Venta a Crédito (Fiado)')}</p>
                                        <p className="text-xs text-muted-foreground">{__('El saldo pendiente se cargará a la cuenta del cliente.')}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={esCredito} onChange={(e) => setEsCredito(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                    </label>
                                </div>
                            )}

                            {/* Payment Lines */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="font-semibold">{__('Formas de Pago')}</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addPaymentLine}><Plus className="w-3 h-3 mr-1" />{__('Agregar')}</Button>
                                </div>
                                {paymentLines.map((pl, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <Select value={pl.metodo_pago} onValueChange={(v) => updatePaymentLine(idx, 'metodo_pago', v)}>
                                            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="efectivo">{__('Efectivo')}</SelectItem>
                                                <SelectItem value="transferencia">{__('Transferencia')}</SelectItem>
                                                <SelectItem value="tarjeta">{__('Tarjeta')}</SelectItem>
                                                <SelectItem value="pago_movil">{__('Pago Móvil')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input ref={idx === 0 ? montoRef : undefined} type="number" step="0.01" min="0" placeholder="0.00"
                                            className="font-mono" value={pl.monto} onChange={(e) => updatePaymentLine(idx, 'monto', e.target.value)} />
                                        {paymentLines.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => removePaymentLine(idx)}><X className="h-4 w-4" /></Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Payment summary */}
                            <div className="rounded-lg border p-3 space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{__('Total Pagado')}:</span>
                                    <span className="font-mono font-bold">{currencySymbol}{totalPaid.toFixed(2)}</span>
                                </div>
                                {remaining > 0.01 && !esCredito && (
                                    <div className="flex justify-between text-rose-600">
                                        <span>{__('Falta por cubrir')}:</span>
                                        <span className="font-mono font-bold">{currencySymbol}{remaining.toFixed(2)}</span>
                                    </div>
                                )}
                                {esCredito && remaining > 0.01 && (
                                    <div className="flex justify-between text-amber-600">
                                        <span>{__('A crédito')}:</span>
                                        <span className="font-mono font-bold">{currencySymbol}{remaining.toFixed(2)}</span>
                                    </div>
                                )}
                                {cambio > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-bold">
                                        <span>{__('Cambio / Vuelto')}:</span>
                                        <span className="font-mono">{currencySymbol}{cambio.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>{__('Cancelar')}</Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 font-bold">{__('Emitir Ticket y Cobrar')}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Hold Sale Dialog */}
                <Dialog open={isHoldOpen} onOpenChange={setIsHoldOpen}>
                    <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2"><Pause className="w-5 h-5 text-amber-600" />{__('Poner Venta en Espera')}</DialogTitle>
                            <DialogDescription>{__('Asigne un nombre para identificar esta venta en espera.')}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitHoldSale} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>{__('Etiqueta / Identificador')}</Label>
                                <Input value={holdLabel} onChange={(e) => setHoldLabel(e.target.value)} placeholder={__('Ej: Mesa 3, Cliente Juan, Pedido #5...')} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsHoldOpen(false)}>{__('Cancelar')}</Button>
                                <Button type="submit" className="bg-amber-600 hover:bg-amber-700">{__('Guardar en Espera')}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Success Receipt */}
                {completedSale && (
                    <Dialog open={!!completedSale} onOpenChange={() => setCompletedSale(null)}>
                        <DialogContent className="sm:max-w-sm text-center">
                            <DialogHeader>
                                <DialogTitle className="text-center flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-7 h-7" /></div>
                                    <span>{__('Venta Completada')}</span>
                                </DialogTitle>
                                <DialogDescription className="text-center font-mono font-bold text-foreground">{completedSale.codigo_ticket}</DialogDescription>
                            </DialogHeader>
                            <div className="py-3 border-y space-y-2 text-sm text-left">
                                <div className="flex justify-between"><span className="text-muted-foreground">{__('Cliente')}:</span><span className="font-semibold">{completedSale.cliente_nombre}</span></div>
                                <div className="flex justify-between text-base font-bold"><span>{__('Total')}:</span><span className="text-emerald-600">{currencySymbol}{Number(completedSale.total).toFixed(2)}</span></div>
                            </div>
                            <DialogFooter className="flex flex-col sm:flex-row gap-2">
                                <Button variant="outline" className="w-full" onClick={() => window.print()}>{__('Imprimir Ticket')}</Button>
                                <Button className="w-full" onClick={() => setCompletedSale(null)}>{__('Nueva Venta')}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </>
    );
}
