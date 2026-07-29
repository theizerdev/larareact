import { Head, router, usePage } from '@inertiajs/react';
import {
    ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle2, CreditCard, DollarSign,
    Package, Wrench, User, AlertCircle, Building2, Smartphone, Receipt, Pause,
    Play, X, Wallet, Tag, Barcode, HelpCircle, Layers, FileText, ArrowRight, Eye, RefreshCw,
    Calculator, ArrowUpRight, ArrowDownLeft, Scale, Printer, Lock
} from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
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
    itemable_id: number | null;
    concepto_tipo: 'producto' | 'servicio';
    nombre: string;
    codigo: string;
    precio_unitario: number;
    cantidad: number;
    stock: number | null;
}

interface CashRegister { id: number; status: 'open' | 'closed'; opened_at?: string; }
interface RegisterSummary {
    id: number;
    opened_at: string;
    opening_amount: number;
    inflows: number;
    outflows: number;
    expected_balance: number;
    by_payment_method: Record<string, { inflow: number; outflow: number; net: number }>;
}

interface HeldSaleRecord { id: number; label: string | null; cliente_nombre: string; cart_data: CartItem[]; created_at: string; }
interface ClienteRecord { id: number; nombre: string; telefono: string | null; limite_credito: number; saldo_pendiente: number; }

interface PaymentLine { metodo_pago: string; monto: string; }

interface TicketTab {
    id: number;
    name: string;
    cart: CartItem[];
    clienteId: number | null;
    clienteNombre: string;
    esCredito: boolean;
    descuento: number;
}

interface Props {
    catalog: CatalogItem[];
    activeRegister: CashRegister | null;
    activeRegisterSummary: RegisterSummary | null;
    currencySymbol?: string;
    heldSales: HeldSaleRecord[];
    clientes: ClienteRecord[];
}

export default function Terminal({
    catalog,
    activeRegister,
    activeRegisterSummary,
    currencySymbol = '$',
    heldSales = [],
    clientes = [],
}: Props) {
    const { __ } = useTranslate();

    // Multi-Ticket Tabs (Eleventa Style)
    const [tickets, setTickets] = useState<TicketTab[]>([
        { id: 1, name: 'Ticket 1', cart: [], clienteId: null, clienteNombre: 'Cliente General', esCredito: false, descuento: 0 },
    ]);
    const [activeTicketId, setActiveTicketId] = useState<number>(1);

    // Active Ticket getter
    const activeTicket = useMemo(() => tickets.find((t) => t.id === activeTicketId) || tickets[0], [tickets, activeTicketId]);

    const updateActiveTicket = (updater: (prevTicket: TicketTab) => TicketTab) => {
        setTickets((prev) => prev.map((t) => (t.id === activeTicketId ? updater(t) : t)));
    };

    // Scanner / Direct Barcode Input
    const [barcodeInput, setBarcodeInput] = useState('');
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    // Search Modal (F10)
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchModalQuery, setSearchModalQuery] = useState('');
    const [searchTypeFilter, setSearchTypeFilter] = useState<'all' | 'producto' | 'servicio'>('all');

    // Payment modal (F12)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([{ metodo_pago: 'efectivo', monto: '' }]);
    const montoRef = useRef<HTMLInputElement>(null);

    // Price Verifier Modal (F9)
    const [isVerifierOpen, setIsVerifierOpen] = useState(false);
    const [verifierQuery, setVerifierQuery] = useState('');
    const [verifierItem, setVerifierItem] = useState<CatalogItem | null>(null);

    // Corte de Caja Modal (F8)
    const [isCorteOpen, setIsCorteOpen] = useState(false);
    const [countedAmountInput, setCountedAmountInput] = useState('');

    // Movement / Entradas y Salidas Modal (F7 / Movement)
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [movementForm, setMovementForm] = useState({
        type: 'outflow' as 'inflow' | 'outflow',
        concepto: 'Gasto Rápido',
        metodo_pago: 'efectivo',
        amount: '',
        description: '',
    });

    // Misc / Generic Article Modal (INS)
    const [isMiscModalOpen, setIsMiscModalOpen] = useState(false);
    const [miscForm, setMiscForm] = useState({ nombre: 'Artículo Varios', precio: '', cantidad: '1' });

    // Hold sale dialog (F5)
    const [isHoldOpen, setIsHoldOpen] = useState(false);
    const [holdLabel, setHoldLabel] = useState('');

    // Success receipt dialog
    const [completedSale, setCompletedSale] = useState<any | null>(null);

    // New client modal (F6)
    const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
    const [newCliente, setNewCliente] = useState({
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        limite_credito: 0,
    });

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Punto de Venta'), href: '#' },
        { title: __('Terminal POS'), href: '/admin/ventas/terminal' },
    ];

    // Focus barcode input on mount and keep focus
    useEffect(() => {
        barcodeInputRef.current?.focus();
    }, []);

    // Ticket Management
    const addTicketTab = () => {
        const nextId = tickets.length > 0 ? Math.max(...tickets.map((t) => t.id)) + 1 : 1;
        const newTicket: TicketTab = {
            id: nextId,
            name: `Ticket ${nextId}`,
            cart: [],
            clienteId: null,
            clienteNombre: 'Cliente General',
            esCredito: false,
            descuento: 0,
        };
        setTickets((prev) => [...prev, newTicket]);
        setActiveTicketId(nextId);
    };

    const closeTicketTab = (ticketId: number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (tickets.length <= 1) {
            updateActiveTicket((t) => ({ ...t, cart: [], clienteId: null, clienteNombre: 'Cliente General', esCredito: false, descuento: 0 }));
            return;
        }
        const filtered = tickets.filter((t) => t.id !== ticketId);
        setTickets(filtered);
        if (activeTicketId === ticketId) {
            setActiveTicketId(filtered[filtered.length - 1].id);
        }
    };

    // Add Item to Active Ticket Cart
    const addToCart = (item: CatalogItem) => {
        updateActiveTicket((ticket) => {
            const cartId = `${item.tipo}-${item.id}`;
            const idx = ticket.cart.findIndex((ci) => ci.id === cartId);

            if (idx > -1) {
                const updatedCart = [...ticket.cart];
                if (item.stock !== null && updatedCart[idx].cantidad >= item.stock) {
                    notifyError(__('No hay más stock disponible para este producto.'));
                    return ticket;
                }
                updatedCart[idx] = { ...updatedCart[idx], cantidad: updatedCart[idx].cantidad + 1 };
                return { ...ticket, cart: updatedCart };
            }

            if (item.stock !== null && item.stock <= 0) {
                notifyError(__('El producto no cuenta con stock disponible.'));
                return ticket;
            }

            return {
                ...ticket,
                cart: [
                    ...ticket.cart,
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
                ],
            };
        });
        notifySuccess(`${item.nombre} ${__('agregado')}`);
    };

    // Add Miscellaneous / Generic Article
    const handleAddMiscItem = (e: React.FormEvent) => {
        e.preventDefault();
        const price = parseFloat(miscForm.precio);
        const qty = parseInt(miscForm.cantidad) || 1;
        if (isNaN(price) || price <= 0) {
            notifyError(__('Ingrese un precio válido.'));
            return;
        }

        const miscId = `misc-${Date.now()}`;
        updateActiveTicket((ticket) => ({
            ...ticket,
            cart: [
                ...ticket.cart,
                {
                    id: miscId,
                    itemable_id: null,
                    concepto_tipo: 'producto',
                    nombre: miscForm.nombre || 'Artículo Varios',
                    codigo: 'VARIOS',
                    precio_unitario: price,
                    cantidad: qty,
                    stock: null,
                },
            ],
        }));

        setIsMiscModalOpen(false);
        setMiscForm({ nombre: 'Artículo Varios', precio: '', cantidad: '1' });
        notifySuccess(__('Artículo vario agregado al carrito.'));
    };

    // Barcode scanner submission
    const handleBarcodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcodeInput.trim()) return;

        const code = barcodeInput.trim().toLowerCase();
        const found = catalog.find((c) => (c.codigo || '').toLowerCase() === code || (c.nombre || '').toLowerCase() === code);

        if (found) {
            addToCart(found);
            setBarcodeInput('');
        } else {
            setSearchModalQuery(barcodeInput);
            setIsSearchModalOpen(true);
            setBarcodeInput('');
        }
    };

    // Cart inline quantity handlers
    const updateQuantity = (cartId: string, delta: number) => {
        updateActiveTicket((ticket) => ({
            ...ticket,
            cart: ticket.cart
                .map((ci) => {
                    if (ci.id !== cartId) return ci;
                    const newQty = ci.cantidad + delta;
                    if (ci.stock !== null && newQty > ci.stock) {
                        notifyError(__('Excede el stock disponible.'));
                        return ci;
                    }
                    return newQty > 0 ? { ...ci, cantidad: newQty } : ci;
                })
                .filter((ci) => ci.cantidad > 0),
        }));
    };

    const removeFromCart = (cartId: string) => {
        updateActiveTicket((ticket) => ({
            ...ticket,
            cart: ticket.cart.filter((ci) => ci.id !== cartId),
        }));
    };

    const clearActiveCart = () => {
        updateActiveTicket((ticket) => ({
            ...ticket,
            cart: [],
            clienteId: null,
            clienteNombre: 'Cliente General',
            esCredito: false,
            descuento: 0,
        }));
    };

    // Totals calculations
    const subtotal = activeTicket.cart.reduce((acc, item) => acc + item.precio_unitario * item.cantidad, 0);
    const total = Math.max(0, subtotal - activeTicket.descuento);
    const totalItemsCount = activeTicket.cart.reduce((acc, item) => acc + item.cantidad, 0);

    // Payment calculations
    const totalPaid = paymentLines.reduce((acc, pl) => acc + (parseFloat(pl.monto) || 0), 0);
    const remaining = Math.max(0, total - totalPaid);
    const cambio = activeTicket.esCredito ? 0 : Math.max(0, totalPaid - total);

    const addPaymentLine = () => setPaymentLines((prev) => [...prev, { metodo_pago: 'efectivo', monto: '' }]);
    const removePaymentLine = (idx: number) => setPaymentLines((prev) => prev.filter((_, i) => i !== idx));
    const updatePaymentLine = (idx: number, field: keyof PaymentLine, value: string) => {
        setPaymentLines((prev) => prev.map((pl, i) => (i === idx ? { ...pl, [field]: value } : pl)));
    };

    // Open Payment Modal
    const handleOpenPayment = useCallback(() => {
        if (!activeRegister) {
            notifyError(__('Debe tener una caja abierta para procesar ventas.'));
            return;
        }
        if (activeTicket.cart.length === 0) {
            notifyError(__('El carrito de compras está vacío.'));
            return;
        }
        setPaymentLines([{ metodo_pago: 'efectivo', monto: total.toFixed(2) }]);
        setIsPaymentModalOpen(true);
    }, [activeRegister, activeTicket.cart, total]);

    // Handle Complete Sale
    const handleCompleteSale = (e: React.FormEvent) => {
        e.preventDefault();
        const payments = paymentLines
            .filter((pl) => parseFloat(pl.monto) > 0)
            .map((pl) => ({ metodo_pago: pl.metodo_pago, monto: parseFloat(pl.monto) }));

        if (!activeTicket.esCredito && remaining > 0.01) {
            notifyError(__('El monto pagado no cubre el total de la venta.'));
            return;
        }

        const payload = {
            cliente_nombre: activeTicket.clienteNombre || 'Cliente General',
            cliente_id: activeTicket.clienteId,
            es_credito: activeTicket.esCredito,
            descuento: activeTicket.descuento,
            impuesto: 0,
            monto_recibido: totalPaid,
            payments,
            items: activeTicket.cart.map((ci) => ({
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
                clearActiveCart();
                notifySuccess(__('Venta completada exitosamente.'));
                const flashSale = (page.props as any).flash?.notification?.sale;
                if (flashSale) setCompletedSale(flashSale);
            },
            onError: () => notifyError(__('Ocurrió un error al procesar la venta.')),
        });
    };

    // Handle Cash Movement submission (Entrada / Salida)
    const handleMovementSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeRegister) return;
        const amt = parseFloat(movementForm.amount);
        if (isNaN(amt) || amt <= 0) {
            notifyError(__('Ingrese un monto válido.'));
            return;
        }

        router.post(`/admin/cajas/${activeRegister.id}/movements`, movementForm, {
            onSuccess: () => {
                setIsMovementModalOpen(false);
                setMovementForm({ type: 'outflow', concepto: 'Gasto Rápido', metodo_pago: 'efectivo', amount: '', description: '' });
                notifySuccess(__('Movimiento de dinero registrado.'));
                router.reload();
            },
            onError: () => notifyError(__('Error al registrar el movimiento.')),
        });
    };

    // Handle Corte de Caja (Cierre Z)
    const handleCorteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeRegister) return;

        const counted = countedAmountInput !== '' ? parseFloat(countedAmountInput) : null;

        router.post(
            `/admin/cajas/${activeRegister.id}/close`,
            { counted_amount: counted },
            {
                onSuccess: () => {
                    setIsCorteOpen(false);
                    notifySuccess(__('Corte de Caja realizado exitosamente. La caja ha sido cerrada.'));
                    router.reload();
                },
                onError: () => notifyError(__('Error al realizar el corte de caja.')),
            }
        );
    };

    // Keyboard Shortcuts (F12: Cobrar, F10: Buscar, F9: Verificador, F8: Corte, INS/F7: Art Vario, F6: Nuevo Cliente, F5: En Espera)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F12') {
                e.preventDefault();
                if (activeTicket.cart.length > 0 && activeRegister) {
                    handleOpenPayment();
                }
            } else if (e.key === 'F10') {
                e.preventDefault();
                setIsSearchModalOpen(true);
            } else if (e.key === 'F9') {
                e.preventDefault();
                setIsVerifierOpen(true);
            } else if (e.key === 'F8') {
                e.preventDefault();
                if (activeRegister) setIsCorteOpen(true);
            } else if (e.key === 'Insert') {
                e.preventDefault();
                setIsMiscModalOpen(true);
            } else if (e.key === 'F6') {
                e.preventDefault();
                setIsNewClientModalOpen(true);
            } else if (e.key === 'F5') {
                e.preventDefault();
                if (activeTicket.cart.length > 0) setIsHoldOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTicket.cart, activeRegister, handleOpenPayment]);

    // Client selection
    const handleSelectCliente = (clienteIdStr: string) => {
        if (clienteIdStr === '0') {
            updateActiveTicket((t) => ({ ...t, clienteId: null, clienteNombre: 'Cliente General', esCredito: false }));
            return;
        }
        const c = clientes.find((cl) => cl.id === parseInt(clienteIdStr));
        if (c) {
            updateActiveTicket((t) => ({ ...t, clienteId: c.id, clienteNombre: c.nombre }));
        }
    };

    // Search modal catalog filtering
    const searchModalCatalog = useMemo(() => {
        return catalog.filter((item) => {
            const matchesType = searchTypeFilter === 'all' || item.tipo === searchTypeFilter;
            const query = searchModalQuery.toLowerCase();
            const matchesSearch =
                (item.nombre || '').toLowerCase().includes(query) || (item.codigo || '').toLowerCase().includes(query);
            return matchesType && matchesSearch;
        });
    }, [catalog, searchTypeFilter, searchModalQuery]);

    // Price verifier lookup
    const handleVerifierSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifierQuery.trim()) return;
        const q = verifierQuery.trim().toLowerCase();
        const found = catalog.find((c) => (c.codigo || '').toLowerCase() === q || (c.nombre || '').toLowerCase().includes(q));
        setVerifierItem(found || null);
    };

    // New client registration
    const handleNewClienteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCliente.nombre.trim()) {
            notifyError(__('El nombre del cliente es obligatorio.'));
            return;
        }
        router.post(
            '/admin/clientes',
            { ...newCliente, estado: true },
            {
                onSuccess: () => {
                    setIsNewClientModalOpen(false);
                    setNewCliente({ nombre: '', telefono: '', email: '', direccion: '', limite_credito: 0 });
                    notifySuccess(__('Cliente registrado exitosamente.'));
                    router.reload();
                },
                onError: () => notifyError(__('Error al registrar el cliente.')),
            }
        );
    };

    // Hold / Resume sales
    const submitHoldSale = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            '/admin/ventas/hold',
            { label: holdLabel || null, cliente_nombre: activeTicket.clienteNombre, cart_data: activeTicket.cart },
            {
                onSuccess: () => {
                    setIsHoldOpen(false);
                    clearActiveCart();
                    setHoldLabel('');
                    notifySuccess(__('Venta puesta en espera.'));
                },
                onError: () => notifyError(__('Error al guardar la venta en espera.')),
            }
        );
    };

    const handleResumeSale = (heldSale: HeldSaleRecord) => {
        if (
            activeTicket.cart.length > 0 &&
            !confirm(__('Al retomar esta venta se reemplazará el carrito de este ticket. ¿Continuar?'))
        )
            return;

        updateActiveTicket((t) => ({
            ...t,
            cart: heldSale.cart_data || [],
            clienteNombre: heldSale.cliente_nombre || 'Cliente General',
        }));

        router.post(`/admin/ventas/resume/${heldSale.id}`, {}, {
            onSuccess: () => notifySuccess(__('Venta retomada.')),
        });
    };

    // Calculated difference for Corte de Caja
    const expectedBal = activeRegisterSummary?.expected_balance ?? 0;
    const countedBal = parseFloat(countedAmountInput) || 0;
    const diffBal = countedBal - expectedBal;

    return (
        <>
            <Head title={__('Terminal POS - Ventas')} />

            <div className="space-y-4">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Banner de Estado de Caja y Resumen Eleventa */}
                <div className="bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                                <ShoppingCart className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    {__('Terminal de Ventas POS')}
                                    {activeRegister ? (
                                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                            {__('Caja')} #{activeRegister.id} {__('Abierta')}
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive">
                                            <AlertCircle className="w-3.5 h-3.5 mr-1" />
                                            {__('Sin Caja Abierta')}
                                        </Badge>
                                    )}
                                </h1>
                                <p className="text-xs text-muted-foreground">
                                    {__('Sistema de Cobro de Alta Velocidad. Use atajos F1-F12 para operar.')}
                                </p>
                            </div>
                        </div>

                        {/* Botones de Atajos Rápidos Eleventa */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {/* BOTÓN F8 CORTE DE CAJA */}
                            {activeRegister && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 font-bold"
                                    onClick={() => setIsCorteOpen(true)}
                                >
                                    <Calculator className="w-3.5 h-3.5 text-amber-600" />
                                    <span>[F8]</span> {__('Corte de Caja')}
                                </Button>
                            )}

                            {/* BOTÓN ENTRADAS Y SALIDAS */}
                            {activeRegister && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs gap-1 bg-slate-50 dark:bg-slate-800"
                                    onClick={() => setIsMovementModalOpen(true)}
                                >
                                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                                    {__('Entrada/Salida')}
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs gap-1 bg-slate-50 dark:bg-slate-800"
                                onClick={() => setIsSearchModalOpen(true)}
                            >
                                <Search className="w-3.5 h-3.5 text-blue-500" />
                                <span className="font-bold">[F10]</span> {__('Buscar')}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs gap-1 bg-slate-50 dark:bg-slate-800"
                                onClick={() => setIsVerifierOpen(true)}
                            >
                                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="font-bold">[F9]</span> {__('Verificador')}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs gap-1 bg-slate-50 dark:bg-slate-800"
                                onClick={() => setIsMiscModalOpen(true)}
                            >
                                <Tag className="w-3.5 h-3.5 text-amber-500" />
                                <span className="font-bold">[INS]</span> {__('Art. Vario')}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs gap-1 bg-slate-50 dark:bg-slate-800"
                                onClick={() => setIsNewClientModalOpen(true)}
                            >
                                <User className="w-3.5 h-3.5 text-purple-500" />
                                <span className="font-bold">[F6]</span> {__('Cliente')}
                            </Button>

                            {activeTicket.cart.length > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs gap-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-200"
                                    onClick={() => setIsHoldOpen(true)}
                                >
                                    <Pause className="w-3.5 h-3.5" />
                                    <span className="font-bold">[F5]</span> {__('En Espera')}
                                </Button>
                            )}

                            <Button
                                type="button"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 px-4"
                                disabled={activeTicket.cart.length === 0 || !activeRegister}
                                onClick={handleOpenPayment}
                            >
                                <DollarSign className="w-4 h-4" />
                                <span className="font-extrabold">[F12]</span> {__('Cobrar')}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Banner Alerta Sin Caja */}
                {!activeRegister && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{__('Atención: No existe una caja abierta')}</AlertTitle>
                        <AlertDescription className="flex items-center justify-between">
                            <span>{__('Para procesar cobros e ingresar pagos debe realizar la apertura de su turno de caja.')}</span>
                            <Button size="sm" variant="outline" className="bg-white text-slate-900 font-bold" onClick={() => router.get('/admin/cajas')}>
                                {__('Aperturar Caja')}
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Bar de Ventas en Espera si existen */}
                {heldSales.length > 0 && (
                    <div className="rounded-xl border p-3 bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                            <Pause className="w-4 h-4" />
                            {__('Ventas Retenidas / En Espera')}:
                        </div>
                        <div className="flex flex-wrap gap-2 flex-1">
                            {heldSales.map((hs) => (
                                <div key={hs.id} className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg border px-3 py-1 text-xs shadow-sm">
                                    <span className="font-bold">{hs.label || `#${hs.id}`}</span>
                                    <span className="text-muted-foreground">({hs.cliente_nombre})</span>
                                    <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-emerald-600" onClick={() => handleResumeSale(hs)}>
                                        <Play className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===== PESTAÑAS DE TICKETS MÚLTIPLES (TICKET 1, TICKET 2, ETC.) ===== */}
                <div className="flex items-center justify-between border-b pb-2 gap-2 overflow-x-auto">
                    <div className="flex items-center gap-1.5">
                        {tickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                onClick={() => setActiveTicketId(ticket.id)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-t-lg text-xs font-bold cursor-pointer transition-all border border-b-0',
                                    activeTicketId === ticket.id
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                )}
                            >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>{ticket.name}</span>
                                {ticket.cart.length > 0 && (
                                    <Badge variant="secondary" className={cn("px-1.5 py-0 text-[10px]", activeTicketId === ticket.id ? "bg-white/20 text-white" : "")}>
                                        {ticket.cart.reduce((a, b) => a + b.cantidad, 0)}
                                    </Badge>
                                )}
                                {tickets.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={(e) => closeTicketTab(ticket.id, e)}
                                        className="ml-1 hover:text-rose-300 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <Button type="button" variant="outline" size="sm" onClick={addTicketTab} className="h-8 text-xs font-bold gap-1">
                        <Plus className="w-3.5 h-3.5" />
                        {__('Nuevo Ticket')}
                    </Button>
                </div>

                {/* ===== BARRA PRINCIPAL DE ESCÁNER Y BÚSQUEDA RÁPIDA ===== */}
                <form onSubmit={handleBarcodeSubmit} className="bg-white dark:bg-slate-900 border rounded-xl p-3 shadow-sm flex gap-3 items-center">
                    <div className="relative flex-1">
                        <Barcode className="absolute left-3.5 top-3 h-5 w-5 text-indigo-500" />
                        <Input
                            ref={barcodeInputRef}
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            placeholder={__('Código del Producto / Nombre / Escáner (ENTER para Agregar o F10 para Buscar)...')}
                            className="pl-11 h-11 text-base font-mono font-semibold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/60"
                        />
                    </div>
                    <Button type="submit" className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2">
                        <Plus className="w-4 h-4" />
                        {__('ENTER - Agregar Producto')}
                    </Button>
                </form>

                {/* ===== PANTALLA COMPLETA 100% ANCHO PARA EL CARRITO ELEVENTA ===== */}
                <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                    <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-sm">
                            <Receipt className="w-4 h-4 text-indigo-600" />
                            <span>{activeTicket.name} — {__('Detalle de Artículos')}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Indicador de Cliente Asignado */}
                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs">
                                <User className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{activeTicket.clienteNombre}</span>
                                {activeTicket.clienteId && (
                                    <button
                                        type="button"
                                        onClick={() => updateActiveTicket((t) => ({ ...t, clienteId: null, clienteNombre: 'Cliente General', esCredito: false }))}
                                        className="ml-1 text-muted-foreground hover:text-rose-500"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            {activeTicket.cart.length > 0 && (
                                <Button type="button" variant="ghost" size="sm" onClick={clearActiveCart} className="text-xs text-rose-500 hover:text-rose-700 h-8">
                                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                                    {__('Vaciar Ticket')}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* TABLA PRINCIPAL DE ELEMENTOS */}
                    <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[460px]">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-xs font-bold uppercase text-muted-foreground border-b sticky top-0">
                                <tr>
                                    <th className="py-3 px-6">{__('Código de Barras')}</th>
                                    <th className="py-3 px-6">{__('Descripción del Producto')}</th>
                                    <th className="py-3 px-6 text-right">{__('Precio Venta')}</th>
                                    <th className="py-3 px-6 text-center">{__('Cant.')}</th>
                                    <th className="py-3 px-6 text-right">{__('Importe')}</th>
                                    <th className="py-3 px-6 text-center">{__('Existencia')}</th>
                                    <th className="py-3 px-6 text-center">{__('Acción')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y font-medium text-slate-800 dark:text-slate-200">
                                {activeTicket.cart.length > 0 ? (
                                    activeTicket.cart.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-3.5 px-6 font-mono text-xs text-muted-foreground">{item.codigo}</td>
                                            <td className="py-3.5 px-6">
                                                <span className="font-bold text-base block text-slate-900 dark:text-slate-100">{item.nombre}</span>
                                                <span className="text-xs text-muted-foreground capitalize">{item.concepto_tipo}</span>
                                            </td>
                                            <td className="py-3.5 px-6 text-right font-mono font-bold text-base">{currencySymbol}{item.precio_unitario.toFixed(2)}</td>
                                            <td className="py-3.5 px-6">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}>
                                                        <Minus className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <span className="w-10 text-center font-mono font-bold text-base">{item.cantidad}</span>
                                                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)}>
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-6 text-right font-mono font-extrabold text-lg text-indigo-600 dark:text-indigo-400">
                                                {currencySymbol}{(item.precio_unitario * item.cantidad).toFixed(2)}
                                            </td>
                                            <td className="py-3.5 px-6 text-center font-mono text-xs">
                                                {item.stock !== null ? (
                                                    <Badge variant="outline" className={cn("text-xs font-bold px-2 py-0.5", item.stock > 5 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200")}>
                                                        {item.stock}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground font-bold">∞</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-6 text-center">
                                                <button type="button" onClick={() => removeFromCart(item.id)} className="text-rose-500 hover:text-rose-700 transition-colors p-1 rounded hover:bg-rose-50">
                                                    <Trash2 className="w-4 h-4 mx-auto" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center text-muted-foreground">
                                            <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-20" />
                                            <p className="font-bold text-lg text-slate-700 dark:text-slate-300">{__('Ticket Vacío')}</p>
                                            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                                                {__('Ingrese o escanee el código del producto arriba, presione [ENTER] o abra el buscador [F10] para agregar artículos.')}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* RESUMEN INFERIOR ESTILO ELEVENTA */}
                    <div className="p-4 border-t bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
                        <div className="space-y-1">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
                                {totalItemsCount} {__('Productos en la venta actual.')}
                            </span>
                            {activeTicket.descuento > 0 && (
                                <span className="text-xs text-emerald-600 font-semibold block">
                                    Descuento aplicado: -{currencySymbol}{activeTicket.descuento.toFixed(2)}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{__('Total a Pagar')}</span>
                                <span className="text-4xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                                    {currencySymbol}{total.toFixed(2)}
                                </span>
                            </div>

                            <Button
                                type="button"
                                className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-lg gap-2"
                                disabled={activeTicket.cart.length === 0 || !activeRegister}
                                onClick={handleOpenPayment}
                            >
                                <DollarSign className="w-6 h-6" />
                                [F12] {__('Cobrar')}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* MODAL CORTE DE CAJA (F8) ESTILO ELEVENTA */}
                <Dialog open={isCorteOpen} onOpenChange={setIsCorteOpen}>
                    <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-amber-600 text-lg">
                                <Calculator className="w-5 h-5" />
                                {__('Corte de Caja / Arqueo de Turno (F8)')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Revise los totales acumulados del turno actual y realice el arqueo para el cierre de caja.')}
                            </DialogDescription>
                        </DialogHeader>

                        {activeRegisterSummary ? (
                            <form onSubmit={handleCorteSubmit} className="space-y-4 py-2">
                                {/* Resumen Superior de Dinero */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800 border rounded-lg">
                                        <span className="text-xs text-muted-foreground font-semibold block">{__('Fondo Inicial')}</span>
                                        <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200">
                                            {currencySymbol}{activeRegisterSummary.opening_amount.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg">
                                        <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold block">{__('Total Ingresos (+)')}</span>
                                        <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                            +{currencySymbol}{activeRegisterSummary.inflows.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg">
                                        <span className="text-xs text-rose-700 dark:text-rose-400 font-semibold block">{__('Total Salidas (-)')}</span>
                                        <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                                            -{currencySymbol}{activeRegisterSummary.outflows.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Balance Esperado */}
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-xl text-center">
                                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                                        {__('Dinero Esperado en Efectivo / Cajón')}
                                    </span>
                                    <span className="text-3xl font-extrabold font-mono text-indigo-600 dark:text-indigo-300">
                                        {currencySymbol}{activeRegisterSummary.expected_balance.toFixed(2)}
                                    </span>
                                </div>

                                {/* Desglose por Formas de Pago */}
                                <div className="border rounded-lg p-3 space-y-2 bg-slate-50/50 dark:bg-slate-800/50">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                                        <CreditCard className="w-3.5 h-3.5" />
                                        {__('Desglose por Método de Pago')}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                                        {Object.entries(activeRegisterSummary.by_payment_method).map(([method, val]) => (
                                            <div key={method} className="flex justify-between p-2 bg-white dark:bg-slate-900 rounded border">
                                                <span className="capitalize">{method.replace('_', ' ')}:</span>
                                                <span className="font-mono font-bold text-emerald-600">{currencySymbol}{val.net.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Arqueo Físico (Efectivo Contado) */}
                                <div className="p-4 border rounded-xl space-y-3 bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                                    <div className="space-y-1">
                                        <Label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                            <Scale className="w-4 h-4 text-amber-600" />
                                            {__('Efectivo Real Contado en Cajón')}
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder={activeRegisterSummary.expected_balance.toFixed(2)}
                                            value={countedAmountInput}
                                            onChange={(e) => setCountedAmountInput(e.target.value)}
                                            className="font-mono text-xl font-bold bg-white dark:bg-slate-900"
                                        />
                                    </div>

                                    {countedAmountInput !== '' && (
                                        <div className={cn(
                                            "flex items-center justify-between p-2.5 rounded-lg font-bold text-xs font-mono",
                                            diffBal === 0
                                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                : diffBal > 0
                                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                                    : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                        )}>
                                            <span>
                                                {diffBal === 0 ? __('Cuadre Perfecto (0.00)') : diffBal > 0 ? __('Sobrante en Caja:') : __('Faltante en Caja:')}
                                            </span>
                                            <span>
                                                {diffBal > 0 ? '+' : ''}{currencySymbol}{diffBal.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className="gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsCorteOpen(false)}>
                                        {__('Cancelar')}
                                    </Button>
                                    <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2">
                                        <Lock className="w-4 h-4" />
                                        {__('Confirmar y Cerrar Caja (Corte Z)')}
                                    </Button>
                                </DialogFooter>
                            </form>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">
                                {__('Cargando resumen de caja...')}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* MODAL ENTRADA / SALIDA DE DINERO */}
                <Dialog open={isMovementModalOpen} onOpenChange={setIsMovementModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ArrowUpRight className="w-5 h-5 text-rose-500" />
                                {__('Registrar Entrada / Salida de Efectivo')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Registre retiros de dinero (gastos rápidos) o depósitos de efectivo en caja.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleMovementSubmit} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>{__('Tipo de Movimiento')}</Label>
                                <Select
                                    value={movementForm.type}
                                    onValueChange={(v: 'inflow' | 'outflow') => setMovementForm({ ...movementForm, type: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="outflow">{__('Salida / Retiro de Dinero (-)')}</SelectItem>
                                        <SelectItem value="inflow">{__('Entrada / Inyección de Dinero (+)')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>{__('Concepto')}</Label>
                                <Input
                                    value={movementForm.concepto}
                                    onChange={(e) => setMovementForm({ ...movementForm, concepto: e.target.value })}
                                    placeholder={__('Ej: Pago proveedor, Compra insumos, Ajuste...')}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{__('Monto')} ({currencySymbol})</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={movementForm.amount}
                                    onChange={(e) => setMovementForm({ ...movementForm, amount: e.target.value })}
                                    placeholder="0.00"
                                    className="font-mono text-lg font-bold"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{__('Notas u Observación')}</Label>
                                <Textarea
                                    value={movementForm.description}
                                    onChange={(e) => setMovementForm({ ...movementForm, description: e.target.value })}
                                    placeholder={__('Detalle opcional del movimiento...')}
                                    rows={2}
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsMovementModalOpen(false)}>
                                    {__('Cancelar')}
                                </Button>
                                <Button
                                    type="submit"
                                    className={cn(
                                        "font-bold text-white",
                                        movementForm.type === 'outflow' ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                                    )}
                                >
                                    {__('Registrar Movimiento')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL BUSCADOR DE PRODUCTOS (F10) */}
                <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
                    <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-blue-600">
                                <Search className="w-5 h-5" />
                                {__('Buscador de Productos y Servicios (F10)')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Busque en tiempo real por código o nombre para seleccionar e ingresar al ticket.')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2 flex-1 flex flex-col min-h-0">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={searchModalQuery}
                                        onChange={(e) => setSearchModalQuery(e.target.value)}
                                        placeholder={__('Escriba código o nombre...')}
                                        className="pl-9 font-semibold"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-1.5">
                                    <Button type="button" variant={searchTypeFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSearchTypeFilter('all')}>{__('Todos')}</Button>
                                    <Button type="button" variant={searchTypeFilter === 'producto' ? 'default' : 'outline'} size="sm" onClick={() => setSearchTypeFilter('producto')} className="gap-1"><Package className="w-3.5 h-3.5" />{__('Productos')}</Button>
                                    <Button type="button" variant={searchTypeFilter === 'servicio' ? 'default' : 'outline'} size="sm" onClick={() => setSearchTypeFilter('servicio')} className="gap-1"><Wrench className="w-3.5 h-3.5" />{__('Servicios')}</Button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto border rounded-lg divide-y max-h-[360px]">
                                {searchModalCatalog.length > 0 ? (
                                    searchModalCatalog.map((item) => (
                                        <div
                                            key={`${item.tipo}-${item.id}`}
                                            onClick={() => {
                                                addToCart(item);
                                                setIsSearchModalOpen(false);
                                                setSearchModalQuery('');
                                            }}
                                            className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between gap-4 group"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono text-xs font-bold text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                        {item.codigo}
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{item.tipo}</span>
                                                </div>
                                                <h4 className="font-bold text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {item.nombre}
                                                </h4>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-base block">
                                                    {currencySymbol}{item.precio.toFixed(2)}
                                                </span>
                                                {item.stock !== null && (
                                                    <span className="text-xs text-muted-foreground font-semibold">Stock: {item.stock}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center text-muted-foreground">
                                        <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        <p className="font-medium">{__('No se encontraron coincidencias.')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsSearchModalOpen(false)}>
                                {__('Cerrar')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* MODAL COBRAR (F12) */}
                <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-emerald-600">
                                <CreditCard className="w-5 h-5" />
                                {__('Completar Venta y Cobro')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Seleccione o combine métodos de pago para liquidar el ticket.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCompleteSale} className="space-y-4 py-2">
                            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-4 text-center">
                                <span className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">{__('TOTAL A COBRAR')}</span>
                                <p className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-300">{currencySymbol}{total.toFixed(2)}</p>
                            </div>

                            {/* Selector de Cliente */}
                            <div className="space-y-2">
                                <Label className="font-semibold">{__('Asignar Cliente')}</Label>
                                <Select value={String(activeTicket.clienteId || '0')} onValueChange={handleSelectCliente}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={__('Cliente General')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">{__('Cliente General')}</SelectItem>
                                        {clientes.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.nombre} {c.saldo_pendiente > 0 ? `· Deuda: ${currencySymbol}${c.saldo_pendiente.toFixed(2)}` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Venta a Crédito Toggle */}
                            <div className={cn(
                                "flex items-center justify-between rounded-lg border p-3 transition-colors",
                                activeTicket.esCredito ? "bg-amber-50 border-amber-300 dark:bg-amber-950/20" : "bg-slate-50 dark:bg-slate-900"
                            )}>
                                <div>
                                    <p className="text-sm font-semibold flex items-center gap-1.5">
                                        <Wallet className="w-4 h-4 text-amber-600" />
                                        {__('Venta a Crédito (Fiado)')}
                                    </p>
                                </div>
                                <label className={cn("relative inline-flex items-center cursor-pointer", !activeTicket.clienteId && "opacity-40 cursor-not-allowed")}>
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={activeTicket.esCredito}
                                        disabled={!activeTicket.clienteId}
                                        onChange={(e) => updateActiveTicket((t) => ({ ...t, esCredito: e.target.checked }))}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                </label>
                            </div>

                            {/* Líneas de Pago */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="font-semibold">{__('Formas de Pago')}</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addPaymentLine}>
                                        <Plus className="w-3 h-3 mr-1" />
                                        {__('Agregar')}
                                    </Button>
                                </div>
                                {paymentLines.map((pl, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <Select value={pl.metodo_pago} onValueChange={(v) => updatePaymentLine(idx, 'metodo_pago', v)}>
                                            <SelectTrigger className="w-[160px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="efectivo">{__('Efectivo')}</SelectItem>
                                                <SelectItem value="transferencia">{__('Transferencia')}</SelectItem>
                                                <SelectItem value="tarjeta">{__('Tarjeta')}</SelectItem>
                                                <SelectItem value="pago_movil">{__('Pago Móvil')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            ref={idx === 0 ? montoRef : undefined}
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            className="font-mono text-lg font-bold"
                                            value={pl.monto}
                                            onChange={(e) => updatePaymentLine(idx, 'monto', e.target.value)}
                                        />
                                        {paymentLines.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => removePaymentLine(idx)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Resumen Cambio / Faltante */}
                            <div className="rounded-lg border p-3 space-y-1 text-sm bg-slate-50 dark:bg-slate-900">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{__('Total Pagado')}:</span>
                                    <span className="font-mono font-bold">{currencySymbol}{totalPaid.toFixed(2)}</span>
                                </div>
                                {cambio > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-bold border-t pt-1">
                                        <span>{__('Cambio / Vuelto')}:</span>
                                        <span className="font-mono">{currencySymbol}{cambio.toFixed(2)}</span>
                                    </div>
                                )}
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

                {/* MODAL VERIFICADOR DE PRECIOS (F9) */}
                <Dialog open={isVerifierOpen} onOpenChange={setIsVerifierOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                {__('Verificador de Precios y Stock (F9)')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Consulte el precio y la existencia de cualquier artículo sin agregarlo al carrito.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleVerifierSearch} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>{__('Código o Nombre del Producto')}</Label>
                                <Input
                                    value={verifierQuery}
                                    onChange={(e) => setVerifierQuery(e.target.value)}
                                    placeholder={__('Escriba o escanee para consultar...')}
                                    autoFocus
                                />
                            </div>

                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                                {__('Consultar')}
                            </Button>

                            {verifierItem && (
                                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-4 text-center space-y-2">
                                    <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">{verifierItem.nombre}</h4>
                                    <p className="text-xs text-muted-foreground font-mono">SKU / Código: {verifierItem.codigo}</p>
                                    <p className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                                        {currencySymbol}{verifierItem.precio.toFixed(2)}
                                    </p>
                                    {verifierItem.stock !== null && (
                                        <Badge variant="outline" className="bg-white dark:bg-slate-800 font-bold">
                                            {__('Stock Disponible')}: {verifierItem.stock}
                                        </Badge>
                                    )}
                                </div>
                            )}

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsVerifierOpen(false)}>
                                    {__('Cerrar')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL ARTÍCULO VARIO / COMÚN (INS / F7) */}
                <Dialog open={isMiscModalOpen} onOpenChange={setIsMiscModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Tag className="w-5 h-5 text-amber-500" />
                                {__('Agregar Artículo Varios / Común')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Agregue un artículo rápido no registrado en inventario asignando su precio manualmente.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleAddMiscItem} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>{__('Descripción / Concepto')}</Label>
                                <Input
                                    value={miscForm.nombre}
                                    onChange={(e) => setMiscForm({ ...miscForm, nombre: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{__('Precio Venta')} ({currencySymbol})</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={miscForm.precio}
                                        onChange={(e) => setMiscForm({ ...miscForm, precio: e.target.value })}
                                        placeholder="0.00"
                                        className="font-mono text-lg font-bold"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>{__('Cantidad')}</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={miscForm.cantidad}
                                        onChange={(e) => setMiscForm({ ...miscForm, cantidad: e.target.value })}
                                        className="font-mono text-lg font-bold"
                                        required
                                    />
                                </div>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsMiscModalOpen(false)}>
                                    {__('Cancelar')}
                                </Button>
                                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                                    {__('Agregar al Ticket')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL NUEVO CLIENTE (F6) */}
                <Dialog open={isNewClientModalOpen} onOpenChange={setIsNewClientModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{__('Registrar Nuevo Cliente')}</DialogTitle>
                            <DialogDescription>{__('Complete la información del nuevo cliente.')}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleNewClienteSubmit} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="clientName">{__('Nombre Completo')}</Label>
                                <Input id="clientName" value={newCliente.nombre} onChange={(e) => setNewCliente({ ...newCliente, nombre: e.target.value })} autoFocus required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="clientPhone">{__('Teléfono')}</Label>
                                <Input id="clientPhone" value={newCliente.telefono} onChange={(e) => setNewCliente({ ...newCliente, telefono: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="clientEmail">{__('Correo Electrónico')}</Label>
                                <Input id="clientEmail" type="email" value={newCliente.email} onChange={(e) => setNewCliente({ ...newCliente, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="clientAddress">{__('Dirección')}</Label>
                                <Input id="clientAddress" value={newCliente.direccion} onChange={(e) => setNewCliente({ ...newCliente, direccion: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="clientCredit">{__('Límite de Crédito')} ({currencySymbol})</Label>
                                <Input id="clientCredit" type="number" min="0" value={newCliente.limite_credito} onChange={(e) => setNewCliente({ ...newCliente, limite_credito: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsNewClientModalOpen(false)}>{__('Cancelar')}</Button>
                                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">{__('Guardar Cliente')}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL VENTA EN ESPERA (F5) */}
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
                                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 font-bold">{__('Guardar en Espera')}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL TICKET EXITOSO / COMPLETED SALE */}
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
                            <div className="py-3 border-y space-y-2 text-sm text-left font-mono">
                                <div className="flex justify-between"><span className="text-muted-foreground">{__('Cliente')}:</span><span className="font-semibold">{completedSale.cliente_nombre}</span></div>
                                <div className="flex justify-between text-base font-bold"><span>{__('Total')}:</span><span className="text-emerald-600">{currencySymbol}{Number(completedSale.total).toFixed(2)}</span></div>
                            </div>
                            <DialogFooter className="flex flex-col sm:flex-row gap-2">
                                <Button variant="outline" className="w-full font-bold" onClick={() => window.print()}>{__('Imprimir Ticket')}</Button>
                                <Button className="w-full font-bold" onClick={() => setCompletedSale(null)}>{__('Nueva Venta')}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </>
    );
}