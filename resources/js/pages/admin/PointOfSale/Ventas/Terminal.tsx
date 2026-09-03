import { Head, router, usePage } from '@inertiajs/react';
import {
    ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle2, CreditCard, DollarSign,
    Package, Wrench, User, AlertCircle, Building2, Smartphone, Receipt, Pause,
    Play, X, Wallet, Tag, Barcode, HelpCircle, Layers, FileText, ArrowRight, Eye, RefreshCw,
    Calculator, ArrowUpRight, ArrowDownLeft, Scale, Settings, Printer, Lock, Coins, Edit3, Landmark, Boxes, History
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
import { Switch } from '@/components/ui/switch';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { OpenCashRegisterModal } from '@/components/open-cash-register-modal';

interface CatalogItem {
    id: number;
    tipo: 'producto' | 'servicio' | 'reparacion';
    nombre: string;
    codigo: string;
    precio: number;
    stock: number | null;
    usa_inventario: boolean;
    categoria?: string;
    familia?: string;
    marca?: string;
    modelo?: string;
    cliente_nombre?: string;
    estado_orden?: string;
    saldo_restante?: number;
    costo_estimado?: number;
    anticipo?: number;
    dispositivo?: string;
}

interface TicketItem {
    id: number | string;
    itemable_id?: number | null;
    concepto_tipo?: 'producto' | 'servicio' | 'reparacion' | 'reparacion_anticipo' | 'reparacion_liquidacion';
    tipo?: 'producto' | 'servicio' | 'reparacion' | 'reparacion_anticipo' | 'reparacion_liquidacion';
    nombre: string;
    codigo: string;
    precio_unitario: number;
    precio?: number;
    cantidad: number;
    usa_inventario?: boolean;
    stock_disponible?: number;
    stock?: number | null;
}

interface CartItem {
    id: string;
    itemable_id: number | null;
    concepto_tipo: 'producto' | 'servicio' | 'reparacion';
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

interface HeldSaleRecord {
    id: number;
    codigo_held: string;
    cliente_nombre: string;
    created_at: string;
    payload: any;
}

interface ClienteRecord {
    id: number;
    nombre: string;
    documento: string;
    limite_credito: number;
    saldo_pendiente: number;
}

interface PaymentLine { metodo_pago: string; monto: string; }

interface TicketTab {
    id: number;
    name: string;
    cart: TicketItem[];
    clienteId: number | null;
    clienteNombre: string;
    esCredito: boolean;
    descuento: number;
}

interface EmpresaData {
    razon_social?: string;
    documento?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    logo?: string;
}

interface Props {
    catalog: CatalogItem[];
    activeRegister?: any | null;
    activeRegisterSummary?: any | null;
    currencySymbol?: string;
    valorDolar?: number;
    heldSales: HeldSaleRecord[];
    clientes: ClienteRecord[];
    empresa?: EmpresaData | null;
}

export default function Terminal({
    catalog,
    activeRegister,
    activeRegisterSummary,
    currencySymbol = '$',
    valorDolar = 20.0,
    heldSales = [],
    clientes = [],
    empresa,
}: Props) {
    const { __ } = useTranslate();
    const pageProps = usePage().props as any;
    const isVenezuela = Boolean(pageProps?.isVenezuela);
    const currencyCode = pageProps?.currencyCode || 'MXN';
    const currentUserId = pageProps?.auth?.user?.id;
    const userRoles: any[] = Array.isArray(pageProps?.auth?.user?.roles) ? pageProps.auth.user.roles : [];
    const isAdmin = Boolean(
        pageProps?.auth?.user?.is_super_admin ||
        pageProps?.auth?.user?.is_admin ||
        currentUserId === 1 ||
        userRoles.some((r: any) => {
            const name = typeof r === 'string' ? r : r?.name;
            return name && ['administrador', 'admin', 'super administrador', 'super-admin'].includes(name.toLowerCase());
        })
    );
    const canCloseActiveRegister = !activeRegister || activeRegister.user_id === currentUserId || isAdmin;

    const sharedEmpresa = pageProps?.empresa || pageProps?.auth?.user?.empresa;
    const rawLogo = empresa?.logo || sharedEmpresa?.logo || sharedEmpresa?.logo_mini;
    const cleanLogo = rawLogo ? (rawLogo.includes('/storage//storage/') ? rawLogo.replace('/storage//storage/', '/storage/') : rawLogo) : null;

    const currentEmpresa: EmpresaData = {
        razon_social: empresa?.razon_social || sharedEmpresa?.razon_social || sharedEmpresa?.nombre || sharedEmpresa?.nombre_comercial || 'FixSale',
        documento: empresa?.documento || sharedEmpresa?.documento,
        telefono: empresa?.telefono || sharedEmpresa?.telefono,
        email: empresa?.email || sharedEmpresa?.email,
        direccion: empresa?.direccion || sharedEmpresa?.direccion,
        logo: cleanLogo,
    };

    // Local catalog state to allow live stock updates
    const [localCatalog, setLocalCatalog] = useState<CatalogItem[]>(catalog);

    useEffect(() => {
        setLocalCatalog(catalog);
    }, [catalog]);

    useEffect(() => {
        const notif = pageProps?.notification || pageProps?.flash?.notification;
        if (notif?.message) {
            if (notif.type === 'error') {
                notifyError(notif.message);
            } else if (notif.type === 'success') {
                notifySuccess(notif.message);
            }
        }
    }, [pageProps?.notification, pageProps?.flash?.notification]);

    // Zero stock modal state
    const [isZeroStockModalOpen, setIsZeroStockModalOpen] = useState(false);
    const [zeroStockTargetItem, setZeroStockTargetItem] = useState<CatalogItem | null>(null);
    const [stockToAddInput, setStockToAddInput] = useState<string>('1');
    const [isUpdatingStock, setIsUpdatingStock] = useState(false);

    // Form ref for Payment Modal (for F11 shortcut submit)
    const paymentFormRef = useRef<HTMLFormElement>(null);

    // Ticket printer machine settings state
    const [hasTicketPrinter, setHasTicketPrinter] = useState<boolean>(() => {
        const saved = localStorage.getItem('pos_has_ticket_printer');
        return saved !== null ? saved === 'true' : true;
    });

    // Thermal Printer Configuration States (Paper Size, Auto Print, Selected Device, Custom Header & Footer)
    const [printerPaperSize, setPrinterPaperSize] = useState<'80mm' | '58mm'>(() => {
        return (localStorage.getItem('pos_printer_paper_size') as '80mm' | '58mm') || '80mm';
    });
    const [selectedPrinter, setSelectedPrinter] = useState<string>(() => {
        return localStorage.getItem('pos_selected_printer') || 'default';
    });
    const [detectedPrinters, setDetectedPrinters] = useState<string[]>([]);
    const [isDetectingPrinters, setIsDetectingPrinters] = useState<boolean>(false);
    const [autoPrintOnSale, setAutoPrintOnSale] = useState<boolean>(() => {
        const saved = localStorage.getItem('pos_auto_print_on_sale');
        return saved !== null ? saved === 'true' : true;
    });
    const [ticketHeaderMsg, setTicketHeaderMsg] = useState<string>(() => {
        return localStorage.getItem('pos_ticket_header_msg') || '';
    });
    const [ticketFooterMsg, setTicketFooterMsg] = useState<string>(() => {
        return localStorage.getItem('pos_ticket_footer_msg') || '¡GRACIAS POR SU COMPRA!';
    });
    const [isPrinterConfigOpen, setIsPrinterConfigOpen] = useState(false);

    // Detección de Impresoras del Sistema / Térmicas
    const detectPrinters = async () => {
        setIsDetectingPrinters(true);
        try {
            if ('queryLocalFonts' in window || (navigator as any).userAgentData) {
                // Notificar escaneo realizado
            }
            if ('getPrinters' in navigator) {
                const printers = await (navigator as any).getPrinters();
                const names = printers.map((p: any) => p.name || p.displayName).filter(Boolean);
                if (names.length > 0) {
                    setDetectedPrinters(Array.from(new Set(names)));
                    setIsDetectingPrinters(false);
                    notifySuccess(__('Impresoras locales detectadas correctamente.'));
                    return;
                }
            }
        } catch (e) {
            // Ignorar errores de permisos de navegador
        }

        // Si no hay API nativa del navegador, la impresión usa la impresora predeterminada o seleccionada en la ventana de impresión nativa del sistema OS/Móvil.
        setDetectedPrinters([]);
        setIsDetectingPrinters(false);
        notifySuccess(__('Escaneo finalizado. Se utilizará la impresora configurada en su sistema operativo/dispositivo.'));
    };

    useEffect(() => {
        if (isPrinterConfigOpen) {
            detectPrinters();
        }
    }, [isPrinterConfigOpen]);

    const toggleTicketPrinter = (enabled: boolean) => {
        setHasTicketPrinter(enabled);
        localStorage.setItem('pos_has_ticket_printer', String(enabled));
    };

    const handleSavePrinterConfig = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('pos_has_ticket_printer', String(hasTicketPrinter));
        localStorage.setItem('pos_printer_paper_size', printerPaperSize);
        localStorage.setItem('pos_selected_printer', selectedPrinter);
        localStorage.setItem('pos_auto_print_on_sale', String(autoPrintOnSale));
        localStorage.setItem('pos_ticket_header_msg', ticketHeaderMsg);
        localStorage.setItem('pos_ticket_footer_msg', ticketFooterMsg);
        setIsPrinterConfigOpen(false);
        notifySuccess(__('Configuración de máquina ticketera guardada exitosamente.'));
    };

    // Ultimas Ventas (F4) State & Fetch
    const [isRecentSalesOpen, setIsRecentSalesOpen] = useState(false);
    const [recentSales, setRecentSales] = useState<any[]>([]);
    const [isLoadingRecentSales, setIsLoadingRecentSales] = useState(false);

    // Modal de Opciones de Pago para Reparaciones (Anticipo / Liquidación)
    const [isReparacionPagoModalOpen, setIsReparacionPagoModalOpen] = useState(false);
    const [reparacionPagoModalItem, setReparacionPagoModalItem] = useState<CatalogItem | null>(null);
    const [customAnticipoInput, setCustomAnticipoInput] = useState<string>('');

    const fetchRecentSales = async () => {
        setIsLoadingRecentSales(true);
        try {
            const res = await fetch('/admin/ventas?perPage=10&format=json', {
                headers: { 'Accept': 'application/json' },
            });
            const data = await res.json();
            const rawSales =
                data?.props?.sales?.data ??
                data?.props?.sales ??
                data?.sales?.data ??
                data?.sales ??
                (Array.isArray(data) ? data : []);

            setRecentSales(Array.isArray(rawSales) ? rawSales : []);
        } catch (error) {
            console.error('Error fetching recent sales:', error);
        } finally {
            setIsLoadingRecentSales(false);
        }
    };

    const handleOpenRecentSales = () => {
        setIsRecentSalesOpen(true);
        fetchRecentSales();
    };

    // Valor del Dólar (Exchange Rate) Modal State
    const [isDolarModalOpen, setIsDolarModalOpen] = useState(false);
    const [dolarInput, setDolarInput] = useState(String(valorDolar));
    const [isSyncingBcv, setIsSyncingBcv] = useState(false);

    const handleSyncBcv = async () => {
        setIsSyncingBcv(true);
        try {
            const res = await fetch('/admin/cajas/bcv-rate', {
                headers: {
                    'Accept': 'application/json',
                },
            });
            const result = await res.json();
            if (res.ok && result.success && result.rate) {
                setDolarInput(String(result.rate));
                notifySuccess(`${__('Tasa del BCV obtenida exitosamente:')} ${result.rate} Bs.`);
            } else {
                notifyError(result.message || __('No se pudo obtener la tasa del BCV.'));
            }
        } catch (error) {
            notifyError(__('Error de conexión al consultar la tasa del BCV.'));
        } finally {
            setIsSyncingBcv(false);
        }
    };

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
    const [searchTypeFilter, setSearchTypeFilter] = useState<'all' | 'producto' | 'servicio' | 'reparacion'>('all');

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
    const [countedUSDInput, setCountedUSDInput] = useState('');

    // Calculated difference for Corte de Caja
    const expectedCashBal = activeRegisterSummary?.expected_cash_balance ?? activeRegisterSummary?.expected_balance ?? 0;
    const countedMXN = parseFloat(countedAmountInput) || 0;
    const countedUSD = parseFloat(countedUSDInput) || 0;
    const totalCountedCombinedMXN = countedMXN + (countedUSD * (valorDolar || 1));
    const diffBalCombined = totalCountedCombinedMXN - expectedCashBal;

    // Movement / Entradas y Salidas Modal
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

    // Handle Dollar Rate update submission
    const handleUpdateDolarRate = (e: React.FormEvent) => {
        e.preventDefault();
        const rate = parseFloat(dolarInput);
        if (isNaN(rate) || rate <= 0) {
            notifyError(__('Ingrese una tasa de cambio válida.'));
            return;
        }

        router.post(
            '/admin/ventas/valor-dolar',
            { valor_dolar: rate },
            {
                onSuccess: () => {
                    setIsDolarModalOpen(false);
                    notifySuccess(__('Valor del Dólar actualizado exitosamente.'));
                },
                onError: () => notifyError(__('Error al actualizar el valor del dólar.')),
            }
        );
    };

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

    // Web Audio POS Beep Sound
    const playScanBeep = useCallback(() => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const audioCtx = new AudioContext();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1850, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.08);
        } catch (e) {
            // Audio context not allowed or failed
        }
    }, []);

    // Add Item to Active Ticket Cart
    const addToCart = (item: CatalogItem) => {
        if (item.tipo === 'producto' && item.stock !== null && item.stock <= 0) {
            setZeroStockTargetItem(item);
            setStockToAddInput('1');
            setIsZeroStockModalOpen(true);
            return;
        }

        if (item.tipo === 'reparacion') {
            setReparacionPagoModalItem(item);
            setCustomAnticipoInput(String(item.saldo_restante || item.precio || 0));
            setIsReparacionPagoModalOpen(true);
            return;
        }

        playScanBeep();
        let shouldShowZeroStockModal = false;

        updateActiveTicket((ticket) => {
            const cartId = `${item.tipo}-${item.id}`;
            const idx = ticket.cart.findIndex((ci) => ci.id === cartId);

            if (idx > -1) {
                const updatedCart = [...ticket.cart];
                if (item.stock !== null && updatedCart[idx].cantidad >= item.stock) {
                    shouldShowZeroStockModal = true;
                    return ticket;
                }
                updatedCart[idx] = { ...updatedCart[idx], cantidad: updatedCart[idx].cantidad + 1 };
                return { ...ticket, cart: updatedCart };
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

        if (shouldShowZeroStockModal) {
            setZeroStockTargetItem(item);
            setStockToAddInput('1');
            setIsZeroStockModalOpen(true);
            return;
        }

        notifySuccess(`${item.nombre} ${__('agregado')}`);
    };

    const handleAddReparacionAnticipo = (monto: number) => {
        if (!reparacionPagoModalItem) return;
        if (monto <= 0) {
            notifyError(__('Ingresa un monto válido para el anticipo.'));
            return;
        }

        playScanBeep();
        const item = reparacionPagoModalItem;
        const cartId = `reparacion_anticipo-${item.id}-${Date.now()}`;

        updateActiveTicket((ticket) => ({
            ...ticket,
            clienteId: item.cliente_id ? item.cliente_id : ticket.clienteId,
            clienteNombre: (item.cliente_nombre && item.cliente_nombre !== 'Cliente General') ? item.cliente_nombre : ticket.clienteNombre,
            cart: [
                ...ticket.cart,
                {
                    id: cartId,
                    itemable_id: item.id,
                    concepto_tipo: 'reparacion_anticipo',
                    nombre: `Anticipo a Orden ${item.codigo} (${item.cliente_nombre || 'Cliente'})`,
                    codigo: item.codigo,
                    precio_unitario: monto,
                    cantidad: 1,
                    stock: null,
                },
            ],
        }));

        setIsReparacionPagoModalOpen(false);
        setReparacionPagoModalItem(null);
        notifySuccess(__('Anticipo añadido al carrito y cliente asociado a la venta.'));
    };

    const handleAddReparacionLiquidacion = () => {
        if (!reparacionPagoModalItem) return;
        playScanBeep();
        const item = reparacionPagoModalItem;
        const montoLiquidacion = item.saldo_restante || item.precio || 0;
        const cartId = `reparacion_liquidacion-${item.id}-${Date.now()}`;

        updateActiveTicket((ticket) => ({
            ...ticket,
            clienteId: item.cliente_id ? item.cliente_id : ticket.clienteId,
            clienteNombre: (item.cliente_nombre && item.cliente_nombre !== 'Cliente General') ? item.cliente_nombre : ticket.clienteNombre,
            cart: [
                ...ticket.cart,
                {
                    id: cartId,
                    itemable_id: item.id,
                    concepto_tipo: 'reparacion_liquidacion',
                    nombre: `Liquidación Final - Orden ${item.codigo} (${item.cliente_nombre || 'Cliente'})`,
                    codigo: item.codigo,
                    precio_unitario: montoLiquidacion,
                    cantidad: 1,
                    stock: null,
                },
            ],
        }));

        setIsReparacionPagoModalOpen(false);
        setReparacionPagoModalItem(null);
        notifySuccess(__('Liquidación final añadida al carrito del punto de venta.'));
    };

    // Confirm quick stock addition for product with zero stock
    const handleConfirmQuickStock = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!zeroStockTargetItem) return;

        const qtyToAdd = parseFloat(stockToAddInput);
        if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
            notifyError(__('Ingrese una cantidad de existencia válida mayor a cero.'));
            return;
        }

        setIsUpdatingStock(true);
        try {
            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch(`/admin/productos/${zeroStockTargetItem.id}/quick-stock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                },
                body: JSON.stringify({ cantidad: qtyToAdd }),
            });

            const result = await res.json();
            if (res.ok && result.success) {
                const newStock = Number(result.stock);

                // Update catalog item stock in state
                setLocalCatalog((prev) =>
                    prev.map((it) => (it.id === zeroStockTargetItem.id && it.tipo === 'producto' ? { ...it, stock: newStock } : it))
                );

                const updatedItem: CatalogItem = {
                    ...zeroStockTargetItem,
                    stock: newStock,
                };

                // Add to active ticket cart
                updateActiveTicket((ticket) => {
                    const cartId = `${updatedItem.tipo}-${updatedItem.id}`;
                    const idx = ticket.cart.findIndex((ci) => ci.id === cartId);

                    if (idx > -1) {
                        const updatedCart = [...ticket.cart];
                        updatedCart[idx] = {
                            ...updatedCart[idx],
                            cantidad: updatedCart[idx].cantidad + 1,
                            stock: newStock,
                        };
                        return { ...ticket, cart: updatedCart };
                    }

                    return {
                        ...ticket,
                        cart: [
                            ...ticket.cart,
                            {
                                id: cartId,
                                itemable_id: updatedItem.id,
                                concepto_tipo: updatedItem.tipo,
                                nombre: updatedItem.nombre,
                                codigo: updatedItem.codigo,
                                precio_unitario: updatedItem.precio,
                                cantidad: 1,
                                stock: newStock,
                            },
                        ],
                    };
                });

                playScanBeep();
                notifySuccess(`${updatedItem.nombre}: +${qtyToAdd} ${__('existencias añadidas y producto agregado al ticket.')}`);
                setIsZeroStockModalOpen(false);
                setZeroStockTargetItem(null);
            } else {
                notifyError(result.message || __('Error al actualizar el stock del producto.'));
            }
        } catch (error) {
            notifyError(__('Error de conexión al actualizar la existencia.'));
        } finally {
            setIsUpdatingStock(false);
        }
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

    // Predictive Live Search Results for Barcode Input
    const liveSearchResults = useMemo(() => {
        if (!barcodeInput.trim()) return [];
        const query = barcodeInput.trim().toLowerCase();
        return localCatalog.filter((item) =>
            (item.nombre || '').toLowerCase().includes(query) ||
            (item.codigo || '').toLowerCase().includes(query) ||
            (item.cliente_nombre || '').toLowerCase().includes(query) ||
            (item.dispositivo || '').toLowerCase().includes(query)
        ).slice(0, 8);
    }, [localCatalog, barcodeInput]);

    const [selectedIndex, setSelectedIndex] = useState<number>(-1);

    // Reset selected index when search input changes
    useEffect(() => {
        setSelectedIndex(-1);
    }, [barcodeInput]);

    // Handle Barcode Search KeyDown for Live Dropdown (Arrow Up / Down / Enter / Esc)
    const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (liveSearchResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev < liveSearchResults.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : liveSearchResults.length - 1));
        } else if (e.key === 'Enter') {
            if (selectedIndex >= 0 && liveSearchResults[selectedIndex]) {
                e.preventDefault();
                addToCart(liveSearchResults[selectedIndex]);
                setBarcodeInput('');
                setSelectedIndex(-1);
            }
        } else if (e.key === 'Escape') {
            setBarcodeInput('');
            setSelectedIndex(-1);
        }
    };

    // Barcode scanner submission
    const handleBarcodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcodeInput.trim()) return;

        if (selectedIndex >= 0 && liveSearchResults[selectedIndex]) {
            addToCart(liveSearchResults[selectedIndex]);
            setBarcodeInput('');
            setSelectedIndex(-1);
            return;
        }

        const code = barcodeInput.trim().toLowerCase();
        const found = localCatalog.find((c) => (c.codigo || '').toLowerCase() === code || (c.nombre || '').toLowerCase() === code);

        if (found) {
            addToCart(found);
            setBarcodeInput('');
        } else if (liveSearchResults.length > 0) {
            addToCart(liveSearchResults[0]);
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
    const totalUSD = valorDolar > 0 ? total / valorDolar : 0;
    const totalItemsCount = activeTicket.cart.reduce((acc, item) => acc + item.cantidad, 0);

    // Payment calculations (Automatic USD -> MXN conversion when paying in Dollars)
    const totalPaid = paymentLines.reduce((acc, pl) => {
        const val = parseFloat(pl.monto) || 0;
        if (pl.metodo_pago === 'dolar') {
            return acc + val * (valorDolar || 1);
        }
        return acc + val;
    }, 0);
    const remaining = Math.max(0, total - totalPaid);
    const cambio = activeTicket.esCredito ? 0 : Math.max(0, totalPaid - total);
    const cambioUSD = valorDolar > 0 ? cambio / valorDolar : 0;

    const addPaymentLine = () => setPaymentLines((prev) => [...prev, { metodo_pago: 'efectivo', monto: '' }]);
    const removePaymentLine = (idx: number) => setPaymentLines((prev) => prev.filter((_, i) => i !== idx));

    const updatePaymentLine = (idx: number, field: keyof PaymentLine, value: string) => {
        setPaymentLines((prev) =>
            prev.map((pl, i) => {
                if (i !== idx) return pl;

                if (field === 'metodo_pago') {
                    const oldMethod = pl.metodo_pago;
                    const newMethod = value;
                    let newMonto = pl.monto;

                    const currVal = parseFloat(pl.monto) || 0;
                    if (oldMethod !== 'dolar' && newMethod === 'dolar') {
                        // Converted from MXN to USD
                        newMonto = currVal > 0 && valorDolar > 0 ? (currVal / valorDolar).toFixed(2) : (total / (valorDolar || 1)).toFixed(2);
                    } else if (oldMethod === 'dolar' && newMethod !== 'dolar') {
                        // Converted from USD to MXN
                        newMonto = currVal > 0 && valorDolar > 0 ? (currVal * valorDolar).toFixed(2) : total.toFixed(2);
                    }

                    return { ...pl, metodo_pago: newMethod, monto: newMonto };
                }

                return { ...pl, [field]: value };
            })
        );
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
            .map((pl) => {
                const val = parseFloat(pl.monto);
                return {
                    metodo_pago: pl.metodo_pago,
                    monto: pl.metodo_pago === 'dolar' ? val * (valorDolar || 1) : val,
                };
            });

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
                notifySuccess(__('Venta completada exitosamente.'));
                const flashSale = (page.props as any).flash?.notification?.sale;
                const completedSaleData = flashSale || {
                    codigo_ticket: `VTA-${String(Math.floor(Math.random() * 900000) + 100000)}`,
                    cliente_nombre: payload.cliente_nombre,
                    created_at: new Date().toISOString(),
                    subtotal: total,
                    descuento: payload.descuento,
                    total: total,
                    metodo_pago: payments[0]?.metodo_pago || 'efectivo',
                    monto_recibido: totalPaid,
                    cambio: Math.max(0, totalPaid - total),
                    items: payload.items.map((it: any) => ({
                        ...it,
                        subtotal: (Number(it.cantidad) || 1) * (Number(it.precio_unitario) || 0),
                    })),
                    payments: payload.payments,
                };

                // Limpiar carrito e invocar inmediatamente la ventana modal del ticket de admin/ventas
                clearActiveCart();
                setCompletedSale(completedSaleData);

                if (hasTicketPrinter && autoPrintOnSale) {
                    setTimeout(() => {
                        window.print();
                    }, 300);
                }
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

        router.post(`/admin/cajas/${activeRegister.id}/movement`, movementForm, {
            preserveScroll: true,
            onSuccess: () => {
                setIsMovementModalOpen(false);
                setMovementForm({ type: 'outflow', concepto: 'Gasto Rápido', metodo_pago: 'efectivo', amount: '', description: '' });
                notifySuccess(__('Movimiento de dinero registrado.'));
                router.reload({ only: ['activeRegisterSummary', 'activeRegister'] });
            },
            onError: () => notifyError(__('Error al registrar el movimiento.')),
        });
    };

    // Handle Corte de Caja (Cierre Z)
    const handleCorteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeRegister) return;

        if (!canCloseActiveRegister) {
            notifyError(__('Solo el usuario que aperturó esta caja puede realizar el cierre.'));
            return;
        }

        const counted = (countedAmountInput !== '' || countedUSDInput !== '') ? totalCountedCombinedMXN : null;

        router.post(
            `/admin/cajas/${activeRegister.id}/close`,
            { counted_amount: counted },
            {
                onSuccess: (page) => {
                    setIsCorteOpen(false);
                    setCountedAmountInput('');
                    setCountedUSDInput('');
                    const notif = (page.props as any)?.notification || (page.props as any)?.flash?.notification;
                    if (notif?.message) {
                        if (notif.type === 'error') {
                            notifyError(notif.message);
                        } else {
                            notifySuccess(notif.message);
                        }
                    } else {
                        notifySuccess(__('Corte de Caja realizado exitosamente. La caja ha sido cerrada.'));
                    }
                },
                onError: () => notifyError(__('Error al realizar el corte de caja.')),
            }
        );
    };

    // Keyboard Shortcuts (F11/F12: Emitir Ticket y Cobrar, F10: Buscar, F9: Verificador, F8: Corte, INS: Art Vario, F6: Nuevo Cliente, F5: En Espera)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F11' || e.key === 'F12') {
                e.preventDefault();
                if (isPaymentModalOpen) {
                    paymentFormRef.current?.requestSubmit();
                } else if (activeTicket.cart.length > 0 && activeRegister) {
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
                if (activeRegister) {
                    if (!canCloseActiveRegister) {
                        notifyError(__('Solo el usuario que aperturó esta caja puede realizar el cierre.'));
                    } else {
                        setIsCorteOpen(true);
                    }
                }
            } else if (e.key === 'Insert') {
                e.preventDefault();
                setIsMiscModalOpen(true);
            } else if (e.key === 'F6') {
                e.preventDefault();
                setIsNewClientModalOpen(true);
            } else if (e.key === 'F5') {
                e.preventDefault();
                if (activeTicket.cart.length > 0) setIsHoldOpen(true);
            } else if (e.key === 'F4' || e.code === 'F4') {
                e.preventDefault();
                handleOpenRecentSales();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTicket.cart, activeRegister, handleOpenPayment, isPaymentModalOpen, handleOpenRecentSales]);

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
        return localCatalog.filter((item) => {
            const matchesType = searchTypeFilter === 'all' || item.tipo === searchTypeFilter;
            const query = searchModalQuery.toLowerCase();
            const matchesSearch =
                (item.nombre || '').toLowerCase().includes(query) ||
                (item.codigo || '').toLowerCase().includes(query) ||
                (item.cliente_nombre || '').toLowerCase().includes(query) ||
                (item.dispositivo || '').toLowerCase().includes(query);
            return matchesType && matchesSearch;
        });
    }, [localCatalog, searchTypeFilter, searchModalQuery]);

    // Price verifier lookup
    const handleVerifierSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifierQuery.trim()) return;
        const q = verifierQuery.trim().toLowerCase();
        const found = localCatalog.find((c) => (c.codigo || '').toLowerCase() === q || (c.nombre || '').toLowerCase().includes(q));
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

    return (
        <>
            <Head title={__('Terminal POS - Ventas')} />
            <OpenCashRegisterModal />

            <div className="space-y-2 flex flex-col flex-1 min-h-0 h-[calc(100vh-9.5rem)] lg:h-[calc(100vh-10.5rem)]">
                {/* BARRA SUPERIOR COMPACTA DE ACCIONES Y ATAJOS DEL POS */}
                <div className="bg-white dark:bg-slate-900 border rounded-xl px-3 py-2 shadow-sm flex flex-wrap items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                        {/* Status Badge de Caja */}
                        {activeRegister ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold px-2.5 py-1 text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                {__('Caja')} #{activeRegister.id} {__('Abierta')}
                            </Badge>
                        ) : (
                            <Badge variant="destructive" className="font-bold px-2.5 py-1 text-xs">
                                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                                {__('Sin Caja Abierta')}
                            </Badge>
                        )}

                        {/* MÓDULO VALOR DEL DÓLAR (CAMBIO USD) */}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-700 font-extrabold shadow-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all"
                            onClick={() => setIsDolarModalOpen(true)}
                        >
                            <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>$1 USD = ${valorDolar.toFixed(2)} MXN</span>
                            <Edit3 className="w-3 h-3 ml-0.5 opacity-70" />
                        </Button>

                        {/* MÓDULO CONFIGURACIÓN DE IMPRESORA TÉRMICA */}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-extrabold shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all"
                            onClick={() => setIsPrinterConfigOpen(true)}
                            title={__('Configuración de máquina ticketera térmica')}
                        >
                            <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>{hasTicketPrinter ? `Impresora (${printerPaperSize})` : __('Sin Impresora')}</span>
                            <Settings className="w-3 h-3 ml-0.5 opacity-70" />
                        </Button>
                    </div>

                    {/* Botones de Atajos Rápidos */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1 bg-slate-50 dark:bg-slate-800"
                            onClick={() => setIsSearchModalOpen(true)}
                        >
                            <Search className="w-3.5 h-3.5 text-blue-500" />
                            <span className="font-bold">[F10]</span> {__('Buscar')}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1 bg-slate-50 dark:bg-slate-800"
                            onClick={() => setIsVerifierOpen(true)}
                        >
                            <Eye className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="font-bold">[F9]</span> {__('Verificador')}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1 bg-slate-50 dark:bg-slate-800"
                            onClick={() => setIsMiscModalOpen(true)}
                        >
                            <Tag className="w-3.5 h-3.5 text-amber-500" />
                            <span className="font-bold">[INS]</span> {__('Art. Vario')}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1 bg-slate-50 dark:bg-slate-800"
                            onClick={() => setIsNewClientModalOpen(true)}
                        >
                            <User className="w-3.5 h-3.5 text-purple-500" />
                            <span className="font-bold">[F6]</span> {__('Cliente')}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200"
                            onClick={handleOpenRecentSales}
                        >
                            <History className="w-3.5 h-3.5 text-blue-600" />
                            <span className="font-bold">[F4]</span> {__('Últimas Ventas')}
                        </Button>

                        {activeRegister && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1 bg-slate-50 dark:bg-slate-800"
                                onClick={() => setIsMovementModalOpen(true)}
                            >
                                <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                                {__('Entrada/Salida')}
                            </Button>
                        )}

                        {activeRegister && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 font-bold"
                                onClick={() => setIsCorteOpen(true)}
                            >
                                <Calculator className="w-3.5 h-3.5 text-amber-600" />
                                <span>[F8]</span> {__('Corte de Caja')}
                            </Button>
                        )}

                        {activeTicket.cart.length > 0 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-200"
                                onClick={() => setIsHoldOpen(true)}
                            >
                                <Pause className="w-3.5 h-3.5" />
                                <span className="font-bold">[F5]</span> {__('En Espera')}
                            </Button>
                        )}

                        <Button
                            type="button"
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 px-3"
                            disabled={activeTicket.cart.length === 0 || !activeRegister}
                            onClick={handleOpenPayment}
                        >
                            <DollarSign className="w-4 h-4" />
                            <span className="font-extrabold">[F11]</span> {__('Emitir Ticket y Cobrar')}
                        </Button>
                    </div>
                </div>

                {/* Banner Alerta Sin Caja */}
                {!activeRegister && (
                    <Alert variant="destructive" className="py-2 shrink-0">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-xs font-bold">{__('Atención: No existe una caja abierta')}</AlertTitle>
                        <AlertDescription className="flex items-center justify-between text-xs">
                            <span>{__('Para procesar cobros e ingresar pagos debe realizar la apertura de su turno de caja.')}</span>
                            <Button size="sm" variant="outline" className="bg-white text-slate-900 font-bold h-7 text-xs" onClick={() => router.get('/admin/cajas')}>
                                {__('Aperturar Caja')}
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Bar de Ventas en Espera si existen */}
                {heldSales.length > 0 && (
                    <div className="rounded-xl border p-2 bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 flex items-center justify-between gap-4 shrink-0">
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
                <div className="flex items-center justify-between border-b pb-1 gap-2 overflow-x-auto shrink-0">
                    <div className="flex items-center gap-1.5">
                        {tickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                onClick={() => setActiveTicketId(ticket.id)}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-bold cursor-pointer transition-all border border-b-0',
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

                    <Button type="button" variant="outline" size="sm" onClick={addTicketTab} className="h-7 text-xs font-bold gap-1">
                        <Plus className="w-3.5 h-3.5" />
                        {__('Nuevo Ticket')}
                    </Button>
                </div>

                {/* ===== BARRA PRINCIPAL DE ESCÁNER Y BÚSQUEDA RÁPIDA PREDICITVA ===== */}
                <div className="relative shrink-0">
                    <form onSubmit={handleBarcodeSubmit} className="bg-white dark:bg-slate-900 border rounded-xl p-2 shadow-sm flex gap-2.5 items-center">
                        <div className="relative flex-1">
                            <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-indigo-500" />
                            <Input
                                ref={barcodeInputRef}
                                value={barcodeInput}
                                onChange={(e) => setBarcodeInput(e.target.value)}
                                onKeyDown={handleBarcodeKeyDown}
                                placeholder={__('Escriba código de barras, nombre de producto o escanee...')}
                                className="pl-9 h-9 text-sm font-mono font-semibold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/60"
                            />
                        </div>
                        <Button type="submit" className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 text-xs">
                            <Plus className="w-3.5 h-3.5" />
                            {__('ENTER - Agregar Producto')}
                        </Button>
                    </form>

                    {/* MENÚ DESPLEGABLE PREDICTIVO DE BÚSQUEDA MANUAL */}
                    {barcodeInput.trim().length > 0 && liveSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-900 border rounded-xl shadow-2xl overflow-hidden divide-y">
                            <div className="p-2 bg-slate-100/80 dark:bg-slate-800/80 text-xs font-bold text-muted-foreground flex justify-between items-center border-b">
                                <span>{__('Resultados Coincidentes')} ({liveSearchResults.length})</span>
                                <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                                    {__('Use teclas ↑ ↓ para navegar, ENTER o Clic para seleccionar')}
                                </span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto divide-y">
                                {liveSearchResults.map((item, idx) => (
                                    <div
                                        key={`${item.tipo}-${item.id}`}
                                        onClick={() => {
                                            addToCart(item);
                                            setBarcodeInput('');
                                            setSelectedIndex(-1);
                                        }}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                        className={cn(
                                            "p-3 flex items-center justify-between gap-4 cursor-pointer transition-colors",
                                            selectedIndex === idx
                                                ? "bg-indigo-50 dark:bg-indigo-950/70 border-l-4 border-l-indigo-600"
                                                : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                                                {item.tipo === 'producto' ? <Package className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{item.nombre}</span>
                                                    <span className="font-mono text-[11px] font-bold text-muted-foreground bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border">
                                                        {item.codigo}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="capitalize font-semibold">{item.tipo}</span>
                                                    {item.stock !== null && (
                                                        <span className={cn("font-bold font-mono", item.stock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500")}>
                                                            · Stock: {item.stock} {item.stock <= 0 ? '(Agotado)' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400 block">
                                                {currencySymbol}{item.precio.toFixed(2)}
                                            </span>
                                            {valorDolar > 0 && (
                                                <span className="font-mono text-xs text-muted-foreground font-bold block">
                                                    ≈ ${(item.precio / valorDolar).toFixed(2)} USD
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ===== PANTALLA COMPLETA DURA FLEXIBLE PARA EL CARRITO ELEVENTA ===== */}
                <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
                    <div className="p-2.5 border-b bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2 font-bold text-xs">
                            <Receipt className="w-4 h-4 text-indigo-600" />
                            <span>{activeTicket.name} — {__('Detalle de Artículos')}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Indicador de Cliente Asignado */}
                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-xs">
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
                                <Button type="button" variant="ghost" size="sm" onClick={clearActiveCart} className="text-xs text-rose-500 hover:text-rose-700 h-6 px-2">
                                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                                    {__('Vaciar Ticket')}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* TABLA PRINCIPAL DE ELEMENTOS QUE SE EXPANDE Y ADAPTA AL ALTO DE LA PANTALLA */}
                    <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-xs font-bold uppercase text-muted-foreground border-b sticky top-0 z-10">
                                <tr>
                                    <th className="py-2.5 px-5">{__('Código de Barras')}</th>
                                    <th className="py-2.5 px-5">{__('Descripción del Producto')}</th>
                                    <th className="py-2.5 px-5 text-right">{__('Precio Venta')}</th>
                                    <th className="py-2.5 px-5 text-center">{__('Cant.')}</th>
                                    <th className="py-2.5 px-5 text-right">{__('Importe')}</th>
                                    <th className="py-2.5 px-5 text-center">{__('Existencia')}</th>
                                    <th className="py-2.5 px-5 text-center">{__('Acción')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y font-medium text-slate-800 dark:text-slate-200">
                                {activeTicket.cart.length > 0 ? (
                                    activeTicket.cart.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-2.5 px-5 font-mono text-xs text-muted-foreground">{item.codigo}</td>
                                            <td className="py-2.5 px-5">
                                                <span className="font-bold text-sm block text-slate-900 dark:text-slate-100">{item.nombre}</span>
                                                <span className="text-[11px] text-muted-foreground capitalize">{item.concepto_tipo}</span>
                                            </td>
                                            <td className="py-2.5 px-5 text-right font-mono font-bold text-sm">{currencySymbol}{item.precio_unitario.toFixed(2)}</td>
                                            <td className="py-2.5 px-5">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, -1)}>
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="w-8 text-center font-mono font-bold text-sm">{item.cantidad}</span>
                                                    <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, 1)}>
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-5 text-right font-mono font-extrabold text-base text-indigo-600 dark:text-indigo-400">
                                                {currencySymbol}{(item.precio_unitario * item.cantidad).toFixed(2)}
                                            </td>
                                            <td className="py-2.5 px-5 text-center font-mono text-xs">
                                                {item.stock !== null ? (
                                                    <Badge variant="outline" className={cn("text-xs font-bold px-2 py-0.5", item.stock > 5 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200")}>
                                                        {item.stock}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground font-bold">∞</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-5 text-center">
                                                <button type="button" onClick={() => removeFromCart(item.id)} className="text-rose-500 hover:text-rose-700 transition-colors p-1 rounded hover:bg-rose-50">
                                                    <Trash2 className="w-4 h-4 mx-auto" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                            <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                            <p className="font-bold text-base text-slate-700 dark:text-slate-300">{__('Ticket Vacío')}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 max-w-sm mx-auto">
                                                {__('Ingrese o escanee el código del producto arriba, presione [ENTER] o abra el buscador [F10] para agregar artículos.')}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* RESUMEN INFERIOR CON CONVERSIÓN A DÓLARES */}
                    <div className="p-3 px-4 border-t bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                        <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                {totalItemsCount} {__('Productos en la venta actual.')}
                            </span>
                            {activeTicket.descuento > 0 && (
                                <span className="text-xs text-emerald-600 font-semibold block">
                                    Descuento aplicado: -{currencySymbol}{activeTicket.descuento.toFixed(2)}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    {isVenezuela ? __('Total a Pagar en Bolívares (Bs.)') : __('Total a Pagar')}
                                </span>
                                <div className="flex items-baseline justify-end gap-2">
                                    {isVenezuela ? (
                                        <>
                                            <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                                                Bs. {(total * valorDolar).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                            <span className="text-xs font-bold font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg border border-indigo-200">
                                                💵 ${total.toFixed(2)} USD
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                                                {currencySymbol}{total.toFixed(2)}
                                            </span>
                                            <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200">
                                                ≈ ${totalUSD.toFixed(2)} USD
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <Button
                                type="button"
                                className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md gap-2"
                                disabled={activeTicket.cart.length === 0 || !activeRegister}
                                onClick={handleOpenPayment}
                            >
                                <DollarSign className="w-4.5 h-4.5" />
                                [F11] {__('Emitir Ticket y Cobrar')}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* MODAL CONFIGURACIÓN DEL VALOR DEL DÓLAR (TASA DE CAMBIO) */}
                <Dialog open={isDolarModalOpen} onOpenChange={setIsDolarModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-emerald-600">
                                <Coins className="w-5 h-5" />
                                {__('Configurar Valor del Dólar (Tipo de Cambio)')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Establezca el precio del Dólar ($1 USD) para las ventas y cobros del día en su tienda.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleUpdateDolarRate} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="font-bold text-xs">{__('Valor del Dólar ($1 USD equivale a:)')}</Label>
                                    {isVenezuela && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleSyncBcv}
                                            disabled={isSyncingBcv}
                                            className="h-7 px-2.5 text-[11px] font-extrabold gap-1 text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 shrink-0"
                                        >
                                            <RefreshCw className={`w-3 h-3 ${isSyncingBcv ? 'animate-spin' : ''}`} />
                                            {isSyncingBcv ? __('Obteniendo...') : __('Sincronizar BCV')}
                                        </Button>
                                    )}
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-2.5 font-mono font-bold text-muted-foreground">$</span>
                                    <Input
                                        type="number"
                                        step="0.0001"
                                        min="0.01"
                                        value={dolarInput}
                                        onChange={(e) => setDolarInput(e.target.value)}
                                        className="pl-8 pr-14 font-mono text-xl font-bold"
                                        placeholder="0.00"
                                        autoFocus
                                        required
                                    />
                                    <span className="absolute right-3.5 top-3 text-xs font-bold text-muted-foreground">{currencyCode}</span>
                                </div>
                            </div>

                            {isVenezuela ? (
                                <div className="space-y-1">
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                        <Landmark className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span>{__('Obtiene directamente la tasa oficial publicada por el Banco Central de Venezuela (BCV).')}</span>
                                    </p>
                                    {Number(dolarInput) > 0 && (
                                        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-mono">
                                            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mb-0.5">
                                                {__('Fórmula de Conversión (USD ↔ Bs.):')}
                                            </p>
                                            <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                                $580.00 USD × {Number(dolarInput).toFixed(2)} = Bs. {(580 * Number(dolarInput)).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
                                    <p className="font-bold mb-0.5">{__('Ejemplo de Conversión:')}</p>
                                    <p>{__('Una venta de $200.00')} {currencyCode} {__('equivaldrá a')} <strong>${(200 / (parseFloat(dolarInput) || 1)).toFixed(2)} USD</strong>.</p>
                                </div>
                            )}

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsDolarModalOpen(false)}>
                                    {__('Cancelar')}
                                </Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white">
                                    {__('Guardar Valor del Dólar')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL CORTE DE CAJA (F8) ESTILO ELEVENTA */}
                <Dialog open={isCorteOpen} onOpenChange={setIsCorteOpen}>
                    <DialogContent className="max-w-4xl sm:max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="pr-8">
                            <div className="flex items-center justify-between gap-3">
                                <DialogTitle className="flex items-center gap-2 text-amber-600 text-lg">
                                    <Calculator className="w-5 h-5" />
                                    {__('Corte de Caja / Arqueo de Turno (F8)')}
                                </DialogTitle>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.print()}
                                    className="gap-1.5 h-8 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-400 dark:hover:bg-slate-800 transition-colors shadow-2xs"
                                >
                                    <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                    <span>{__('Imprimir')}</span>
                                </Button>
                            </div>
                            <DialogDescription>
                                {__('Revise los totales acumulados del turno actual y realice el arqueo para el cierre de caja.')}
                            </DialogDescription>
                        </DialogHeader>

                        {activeRegisterSummary ? (
                            <form onSubmit={handleCorteSubmit} className="space-y-4 py-2">
                                {/* Resumen Superior de Dinero */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800 border rounded-lg">
                                        <span className="text-xs text-muted-foreground font-semibold block">{__('Fondo Inicial (Efectivo)')}</span>
                                        <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200">
                                            {currencySymbol}{activeRegisterSummary.opening_amount.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg">
                                        <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold block">{__('Ventas Totales del Turno (+)')}</span>
                                        <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                            +{currencySymbol}{activeRegisterSummary.inflows.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg">
                                        <span className="text-xs text-rose-700 dark:text-rose-400 font-semibold block">{__('Total Salidas / Egresos (-)')}</span>
                                        <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                                            -{currencySymbol}{activeRegisterSummary.outflows.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                    {/* Columna Izquierda: Esperado y Desglose */}
                                    <div className="space-y-4">
                                        {/* Balance Esperado en Cajón Físico */}
                                        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-xl space-y-1.5 text-center">
                                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                                                {__('Dinero Esperado en Efectivo / Cajón')}
                                            </span>
                                            <span className="text-3xl font-extrabold font-mono text-indigo-600 dark:text-indigo-300 block">
                                                {currencySymbol}{expectedCashBal.toFixed(2)}
                                            </span>
                                            <span className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 font-mono block">
                                                {__('Fondo Inicial')} ({currencySymbol}{activeRegisterSummary.opening_amount.toFixed(2)}) + {__('Efectivo')} (+{currencySymbol}{(activeRegisterSummary.cash_inflows ?? (activeRegisterSummary.by_payment_method?.efectivo?.net ?? 0)).toFixed(2)}) - {__('Salidas')} (-{currencySymbol}{activeRegisterSummary.outflows.toFixed(2)})
                                            </span>
                                            {(activeRegisterSummary.electronic_inflows ?? 0) > 0 && (
                                                <div className="mt-2 pt-2 border-t border-indigo-200 dark:border-indigo-900 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5">
                                                    <CreditCard className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                    <span className="text-left">
                                                        {__('Ventas con Tarjeta / Transferencias')}: <strong className="text-slate-800 dark:text-slate-100 font-mono">+{currencySymbol}{(activeRegisterSummary.electronic_inflows ?? 0).toFixed(2)}</strong> ({__('Acreditadas en cuenta bancaria, no en cajón')})
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Desglose por Formas de Pago */}
                                        <div className="border rounded-xl p-3.5 space-y-2.5 bg-slate-50/70 dark:bg-slate-800/70">
                                            <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center justify-between">
                                                <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" />{__('Desglose por Forma de Pago')}</span>
                                                <span className="text-[11px] font-mono font-normal">Tasa: $1 USD = ${valorDolar.toFixed(2)} MXN</span>
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
                                                {Object.entries(activeRegisterSummary.by_payment_method).map(([method, val]) => {
                                                    const label = method === 'efectivo' ? __('Efectivo (MXN)') :
                                                        method === 'dolar' ? __('💵 Dólares (USD)') :
                                                            method === 'transferencia' ? __('Transferencia') :
                                                                method === 'tarjeta' ? __('Tarjeta (Débito/Crédito)') :
                                                                    method === 'credito' ? __('Venta a Crédito (Fiado)') :
                                                                        method.replace('_', ' ');
                                                    const netVal = val.net;
                                                    const usdVal = valorDolar > 0 ? netVal / valorDolar : 0;

                                                    return (
                                                        <div key={method} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border shadow-xs">
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{label}:</span>
                                                            <div className="text-right font-mono">
                                                                <span className="font-bold text-emerald-600 block">{currencySymbol}{netVal.toFixed(2)} MXN</span>
                                                                {method === 'dolar' && (
                                                                    <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 block">
                                                                        💵 ${usdVal.toFixed(2)} USD
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Columna Derecha: Arqueo Físico y Diferencias */}
                                    <div className="p-4 border rounded-xl space-y-4 bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
                                        <div className="flex items-center justify-between">
                                            <Label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-sm">
                                                <Scale className="w-4 h-4 text-amber-600" />
                                                {__('Conteo Físico en Cajón de Efectivo')}
                                            </Label>
                                            <span className="text-xs text-muted-foreground font-semibold">{__('Ingrese el dinero real contado')}</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold">{__('Efectivo Pesos ($ MXN)')}</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder={expectedCashBal.toFixed(2)}
                                                    value={countedAmountInput}
                                                    onChange={(e) => setCountedAmountInput(e.target.value)}
                                                    className="font-mono text-lg font-bold bg-white dark:bg-slate-900"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                                    <Coins className="w-3 h-3" />
                                                    {__('Efectivo Dólares ($ USD)')}
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="0.00"
                                                        value={countedUSDInput}
                                                        onChange={(e) => setCountedUSDInput(e.target.value)}
                                                        className="font-mono text-lg font-bold bg-white dark:bg-slate-900 pr-12"
                                                    />
                                                    <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground font-mono">USD</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Muestra Total Físico Combinado y Diferencia */}
                                        {(countedAmountInput !== '' || countedUSDInput !== '') && (
                                            <div className="space-y-2 pt-2 border-t border-amber-200 dark:border-amber-900">
                                                <div className="flex justify-between text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                                                    <span>{__('Total Físico en Cajón (MXN + USD):')}</span>
                                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                                        {currencySymbol}{totalCountedCombinedMXN.toFixed(2)} MXN
                                                    </span>
                                                </div>

                                                <div className={cn(
                                                    "flex items-center justify-between p-3 rounded-lg font-bold text-sm font-mono",
                                                    diffBalCombined === 0
                                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                        : diffBalCombined > 0
                                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                                            : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                                )}>
                                                    <span>
                                                        {diffBalCombined === 0 ? __('Cuadre Perfecto (0.00)') : diffBalCombined > 0 ? __('Sobrante en Caja:') : __('Faltante en Caja:')}
                                                    </span>
                                                    <span>
                                                        {diffBalCombined > 0 ? '+' : ''}{currencySymbol}{diffBalCombined.toFixed(2)} MXN
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                                    <Button type="button" variant={searchTypeFilter === 'reparacion' ? 'default' : 'outline'} size="sm" onClick={() => setSearchTypeFilter('reparacion')} className="gap-1"><Settings className="w-3.5 h-3.5" />{__('Reparaciones')}</Button>
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
                                                    <span className="text-xs text-muted-foreground font-semibold">{__('Stock')}: {item.stock}</span>
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

                {/* MODAL COBRAR (F12) CON CONVERSIÓN A DÓLARES */}
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

                        <form ref={paymentFormRef} onSubmit={handleCompleteSale} className="space-y-4 py-2">
                            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-4 text-center">
                                <span className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                                    {isVenezuela ? __('TOTAL A PAGAR EN BOLÍVARES (BS.)') : __('TOTAL A COBRAR')}
                                </span>
                                <p className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-300">
                                    {isVenezuela
                                        ? `Bs. ${(total * valorDolar).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : `${currencySymbol}${total.toFixed(2)}`}
                                </p>
                                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1 font-mono">
                                    {isVenezuela
                                        ? `💵 $${total.toFixed(2)} USD × Tasa ${valorDolar.toFixed(2)} Bs./USD`
                                        : `≈ $${totalUSD.toFixed(2)} USD (${__('Tasa:')} $${valorDolar.toFixed(2)} MXN)`}
                                </p>
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

                            {/* Botones de Pago Rápido Predefinidos */}
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground font-semibold">{__('Atajos de Cobro Rápido')}:</Label>
                                <div className="flex flex-wrap gap-1.5">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800"
                                        onClick={() => setPaymentLines([{ metodo_pago: 'efectivo', monto: (isVenezuela ? total * valorDolar : total).toFixed(2) }])}
                                    >
                                        {isVenezuela ? `Exacto Bs. (${(total * valorDolar).toFixed(2)})` : `Exacto ${currencyCode} ($${total.toFixed(2)})`}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                                        onClick={() => setPaymentLines([{ metodo_pago: 'dolar', monto: total.toFixed(2) }])}
                                    >
                                        💵 Exacto USD (${total.toFixed(2)})
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs font-mono font-bold"
                                        onClick={() => setPaymentLines([{ metodo_pago: 'dolar', monto: '20' }])}
                                    >
                                        $20 USD
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs font-mono font-bold"
                                        onClick={() => setPaymentLines([{ metodo_pago: 'dolar', monto: '50' }])}
                                    >
                                        $50 USD
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs font-mono font-bold"
                                        onClick={() => setPaymentLines([{ metodo_pago: 'dolar', monto: '100' }])}
                                    >
                                        $100 USD
                                    </Button>
                                </div>
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
                                {paymentLines.map((pl, idx) => {
                                    const numVal = parseFloat(pl.monto) || 0;
                                    const convMXN = pl.metodo_pago === 'dolar' ? numVal * (valorDolar || 1) : numVal;
                                    const convUSD = valorDolar > 0 ? (pl.metodo_pago === 'dolar' ? numVal : numVal / valorDolar) : 0;

                                    return (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Select value={pl.metodo_pago} onValueChange={(v) => updatePaymentLine(idx, 'metodo_pago', v)}>
                                                    <SelectTrigger className="w-[160px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="efectivo">{__('Efectivo (MXN)')}</SelectItem>
                                                        <SelectItem value="dolar">💵 {__('Dólares (USD)')}</SelectItem>
                                                        <SelectItem value="transferencia">{__('Transferencia')}</SelectItem>
                                                        <SelectItem value="tarjeta">{__('Tarjeta')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <div className="relative flex-1">
                                                    <Input
                                                        ref={idx === 0 ? montoRef : undefined}
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        placeholder={pl.metodo_pago === 'dolar' ? "0.00 USD" : "0.00 MXN"}
                                                        className="font-mono text-lg font-bold pr-12"
                                                        value={pl.monto}
                                                        onChange={(e) => updatePaymentLine(idx, 'monto', e.target.value)}
                                                    />
                                                    <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground font-mono">
                                                        {pl.metodo_pago === 'dolar' ? 'USD' : 'MXN'}
                                                    </span>
                                                </div>
                                                {paymentLines.length > 1 && (
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => removePaymentLine(idx)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Helper de Conversión en Tiempo Real */}
                                            {numVal > 0 && (
                                                <div className="text-[11px] text-right font-mono font-semibold text-muted-foreground pr-1">
                                                    {pl.metodo_pago === 'dolar' ? (
                                                        <span className="text-emerald-600 font-bold">
                                                            USD ${numVal.toFixed(2)} = ${convMXN.toFixed(2)} MXN
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            ${numVal.toFixed(2)} MXN ≈ ${convUSD.toFixed(2)} USD
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Resumen Cambio / Faltante */}
                            <div className="rounded-lg border p-3 space-y-1 text-sm bg-slate-50 dark:bg-slate-900">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{__('Total Abonado (en MXN)')}:</span>
                                    <span className="font-mono font-bold">{currencySymbol}{totalPaid.toFixed(2)}</span>
                                </div>
                                {remaining > 0.01 && !activeTicket.esCredito && (
                                    <div className="flex justify-between text-rose-600 font-bold border-t pt-1">
                                        <span>{__('Falta por Cobrar')}:</span>
                                        <span className="font-mono">{currencySymbol}{remaining.toFixed(2)}</span>
                                    </div>
                                )}
                                {cambio > 0 && (
                                    <div className="flex items-center justify-between text-emerald-600 font-bold border-t pt-1">
                                        <span>{__('Cambio / Vuelto a Entregar')}:</span>
                                        <div className="text-right">
                                            <span className="font-mono block text-base">{currencySymbol}{cambio.toFixed(2)} MXN</span>
                                            <span className="font-mono text-xs text-emerald-700 block">≈ ${cambioUSD.toFixed(2)} USD</span>
                                        </div>
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
                                    <p className="text-xs text-emerald-700 font-bold font-mono">
                                        ≈ ${(verifierItem.precio / (valorDolar || 1)).toFixed(2)} USD
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

                {/* MODAL INGRESO DE EXISTENCIA RÁPIDO PARA PRODUCTO EN CERO */}
                <Dialog open={isZeroStockModalOpen} onOpenChange={setIsZeroStockModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                                <Boxes className="w-5 h-5" />
                                {__('Producto Sin Existencia')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Este producto se encuentra actualmente en 0 existencias. Ingrese la cantidad disponible en tienda para agregarlo a la venta.')}
                            </DialogDescription>
                        </DialogHeader>

                        {zeroStockTargetItem && (
                            <form onSubmit={handleConfirmQuickStock} className="space-y-4 py-2">
                                <div className="p-3 rounded-lg border bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm text-foreground">{zeroStockTargetItem.nombre}</span>
                                        <Badge variant="outline" className="text-xs font-mono bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-300">
                                            Stock: {zeroStockTargetItem.stock}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                                        <span>SKU: {zeroStockTargetItem.codigo}</span>
                                        <span>•</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{currencySymbol}{zeroStockTargetItem.precio.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="quickStockQty" className="font-semibold text-xs">
                                        {__('Cantidad a Añadir al Inventario')}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="quickStockQty"
                                            type="number"
                                            step="1"
                                            min="1"
                                            value={stockToAddInput}
                                            onChange={(e) => setStockToAddInput(e.target.value)}
                                            className="font-mono text-lg font-bold h-11 pl-9 text-blue-600 dark:text-blue-400"
                                            placeholder="1"
                                            autoFocus
                                            required
                                        />
                                        <Plus className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground pointer-events-none" />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        {__('Esta cantidad se sumará al inventario (Kardex) y 1 unidad se colocará de inmediato en la venta actual.')}
                                    </p>
                                </div>

                                <DialogFooter className="pt-2 gap-2 sm:gap-0">
                                    <Button type="button" variant="outline" onClick={() => setIsZeroStockModalOpen(false)}>
                                        {__('Cancelar')}
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isUpdatingStock}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                                    >
                                        {isUpdatingStock ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4" />
                                        )}
                                        {__('Guardar Existencia y Vender')}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* MODAL TICKET EXITOSO / COMPLETED SALE CON VISTA PREVIA DEL TICKET */}
                {completedSale && (
                    <Dialog open={!!completedSale} onOpenChange={() => setCompletedSale(null)}>
                        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-center flex flex-col items-center gap-1.5">
                                    <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <span className="text-lg font-bold">{__('¡Venta Registrada Exitosamente!')}</span>
                                </DialogTitle>
                                <DialogDescription className="text-center font-mono font-bold text-sm text-foreground">
                                    {completedSale.codigo_ticket}
                                </DialogDescription>
                            </DialogHeader>

                            {/* VISTA PREVIA DEL TICKET (DISEÑO CORPORATIVO LARA-REACT POS) */}
                            <div className="space-y-3">
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Receipt className="w-4 h-4 text-blue-500" />
                                        {__('Comprobante de Venta')} ({printerPaperSize})
                                    </span>
                                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                        {completedSale.codigo_ticket}
                                    </span>
                                </div>

                                {/* TICKET CONTAINER WITH MATCHING DESIGN */}
                                <div className="border border-gray-300 dark:border-gray-700 bg-white text-slate-900 p-5 rounded-2xl font-sans text-xs shadow-md space-y-3">
                                    {/* LOGO & BUSINESS HEADER (IDENTICAL TO ADMIN/VENTAS) */}
                                    <div className="text-center space-y-1">
                                        <div className="flex items-center justify-center gap-2">
                                            {currentEmpresa.logo ? (
                                                <img
                                                    src={currentEmpresa.logo}
                                                    alt={currentEmpresa.razon_social || 'Logo Empresa'}
                                                    className="h-12 max-w-[180px] object-contain drop-shadow-sm"
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                                                        FS
                                                    </div>
                                                    <span className="text-2xl font-black tracking-tight text-slate-900">
                                                        Fix<span className="text-[#FF5722]">Sale</span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-sm font-bold text-slate-800 uppercase">
                                            {currentEmpresa.razon_social || 'Servitec POS & Servicios'}
                                        </div>
                                        {currentEmpresa.documento && (
                                            <div className="text-[11px] font-mono text-slate-600">
                                                {currentEmpresa.documento}
                                            </div>
                                        )}
                                        <div className="text-[11px] text-slate-500">
                                            {currentEmpresa.telefono ? `Tel: ${currentEmpresa.telefono}` : 'Tel: +58 (0414) 123-4567'}
                                            {currentEmpresa.email ? ` | ${currentEmpresa.email}` : ''}
                                        </div>
                                        {currentEmpresa.direccion && (
                                            <div className="text-[10px] text-slate-400 italic">
                                                {currentEmpresa.direccion}
                                            </div>
                                        )}
                                        {ticketHeaderMsg && (
                                            <div className="text-[11px] text-slate-600 font-semibold bg-slate-100 p-1 rounded mt-1">
                                                {ticketHeaderMsg}
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-b border-dashed border-gray-300 my-2"></div>

                                    {/* TITLE & TICKET METADATA */}
                                    <div className="text-center font-extrabold text-slate-800 text-sm tracking-wide uppercase">
                                        COMPROBANTE DE VENTA
                                    </div>

                                    <div className="grid grid-cols-2 text-[11px] gap-y-1 text-slate-600 bg-slate-50 p-2.5 rounded-lg font-mono">
                                        <div><strong>N° Ticket:</strong> {completedSale.codigo_ticket}</div>
                                        <div className="text-right"><strong>Fecha:</strong> {new Date(completedSale.created_at || Date.now()).toLocaleDateString()}</div>
                                        <div><strong>Cliente:</strong> {completedSale.cliente_nombre || 'Cliente General'}</div>
                                        <div className="text-right"><strong>Atendido por:</strong> {completedSale.user?.name || 'Cajero POS'}</div>
                                    </div>

                                    {/* ITEMS TABLE */}
                                    <div className="space-y-1 my-2">
                                        <div className="grid grid-cols-12 text-[10px] font-bold text-slate-500 uppercase bg-slate-100 p-1.5 rounded">
                                            <span className="col-span-1">#</span>
                                            <span className="col-span-5">CONCEPTO</span>
                                            <span className="col-span-2 text-center">CANT</span>
                                            <span className="col-span-2 text-right">P.U.</span>
                                            <span className="col-span-2 text-right">TOTAL</span>
                                        </div>
                                        {completedSale.items?.map((it: any, idx: number) => (
                                            <div key={idx} className="grid grid-cols-12 text-[11px] py-1.5 border-b border-gray-100 items-center">
                                                <span className="col-span-1 text-slate-400 font-mono text-[10px]">{idx + 1}</span>
                                                <span className="col-span-5 font-medium truncate text-slate-800">{it.nombre}</span>
                                                <span className="col-span-2 text-center font-mono text-slate-600">{it.cantidad} {it.cantidad > 1 ? 'pcs' : 'pc'}</span>
                                                <span className="col-span-2 text-right font-mono text-slate-600">${Number(it.precio_unitario).toFixed(2)}</span>
                                                <span className="col-span-2 text-right font-mono font-bold text-slate-900">${Number(it.subtotal ?? (it.cantidad * it.precio_unitario) ?? 0).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* SUMMARY TOTALS */}
                                    <div className="space-y-1 text-xs pt-1">
                                        <div className="flex justify-between text-slate-600">
                                            <span>Subtotal Items ({completedSale.items?.length || 0}):</span>
                                            <span className="font-mono font-medium">${Number(completedSale.subtotal || completedSale.total).toFixed(2)}</span>
                                        </div>
                                        {Number(completedSale.descuento || 0) > 0 && (
                                            <div className="flex justify-between text-rose-600 font-medium">
                                                <span>Descuento Aplicado:</span>
                                                <span className="font-mono">-${Number(completedSale.descuento).toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-base font-black border-t-2 border-slate-900 pt-1 text-slate-900">
                                            <span>TOTAL A PAGAR:</span>
                                            <span className="font-mono text-emerald-600">{currencySymbol}{Number(completedSale.total).toFixed(2)}</span>
                                        </div>
                                        {valorDolar > 0 && (
                                            <div className="flex justify-between text-xs font-semibold text-emerald-700 bg-emerald-50 p-1.5 rounded">
                                                <span>Equivalente en USD ($):</span>
                                                <span className="font-mono">${(Number(completedSale.total) / valorDolar).toFixed(2)} USD</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* PAYMENT SUMMARY BOX */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1 text-xs font-mono">
                                        <div className="flex justify-between text-slate-600 font-bold border-b border-slate-200 pb-1">
                                            <span>MONTO PAGADO</span>
                                            <span>SALDO / CAMBIO</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-sm text-slate-800 pt-0.5">
                                            <span>${Number(totalPaid || completedSale.total).toFixed(2)}</span>
                                            <span className="text-blue-600">${Number(completedSale.cambio || 0).toFixed(2)}</span>
                                        </div>
                                        {completedSale.payments && completedSale.payments.length > 0 && (
                                            <div className="pt-1 text-[10px] text-slate-500 border-t border-slate-200 mt-1">
                                                <span className="font-semibold text-slate-700">Forma de Pago: </span>
                                                {completedSale.payments.map((pm: any) => `${pm.metodo_pago.toUpperCase()}: $${Number(pm.monto).toFixed(2)}`).join(' | ')}
                                            </div>
                                        )}
                                    </div>

                                    {/* CÓDIGO QR PARA VALIDACIÓN */}
                                    <div className="pt-2 flex flex-col items-center justify-center space-y-1 border-t border-dashed border-gray-300">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`TICKET:${completedSale.codigo_ticket}|TOTAL:${completedSale.total}`)}`}
                                            alt="QR Ticket"
                                            className="h-20 w-20 object-contain p-1 bg-white border border-gray-200 rounded"
                                        />
                                        <span className="text-[9px] font-mono text-slate-500 font-bold">ESCANEAR PARA VALIDAR</span>
                                    </div>

                                    <div className="border-b border-dashed border-gray-300 my-2"></div>
                                    <div className="text-center text-xs font-bold text-slate-700 uppercase">
                                        {ticketFooterMsg}
                                    </div>
                                    <div className="text-center text-[10px] text-slate-400">
                                        ¡Gracias por preferir a Servitec!
                                    </div>
                                </div>

                                {/* Control rápido de ticketera */}
                                <div className="flex items-center justify-between p-3 rounded-lg border bg-background text-xs text-left">
                                    <div>
                                        <span className="font-bold text-foreground flex items-center gap-1.5">
                                            <Printer className="w-4 h-4 text-blue-500" />
                                            {__('Modo Impresora Ticketera Térmica')} ({printerPaperSize})
                                        </span>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            {hasTicketPrinter
                                                ? __('Impresión directa optimizada para ticketera.')
                                                : __('Ticketera desactivada. Se abre diálogo de impresión/PDF del sistema.')}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={hasTicketPrinter}
                                        onCheckedChange={toggleTicketPrinter}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                                <Button variant="outline" className="w-full font-bold gap-1.5" onClick={() => window.print()}>
                                    <Printer className="w-4 h-4 text-blue-600" />
                                    {hasTicketPrinter ? `${__('Imprimir Ticket')} (${printerPaperSize})` : __('Imprimir / Guardar PDF')}
                                </Button>
                                <Button className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCompletedSale(null)}>
                                    {__('Nueva Venta')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {/* MODAL ÚLTIMAS VENTAS (F4) */}
                <Dialog open={isRecentSalesOpen} onOpenChange={setIsRecentSalesOpen}>
                    <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-blue-600">
                                <History className="w-5 h-5" />
                                {__('Historial de Últimas Ventas (F4)')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Consulte las ventas recientes procesadas en el sistema para reimprimir tickets o revisar detalles.')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto border rounded-xl divide-y my-2">
                            {isLoadingRecentSales ? (
                                <div className="p-8 text-center text-xs text-muted-foreground">
                                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                                    {__('Cargando ventas recientes...')}
                                </div>
                            ) : recentSales.length > 0 ? (
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] uppercase font-bold text-slate-600 dark:text-slate-300">
                                        <tr>
                                            <th className="p-2.5">Ticket</th>
                                            <th className="p-2.5">Fecha</th>
                                            <th className="p-2.5">Cliente</th>
                                            <th className="p-2.5 text-right">Total</th>
                                            <th className="p-2.5 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y font-mono">
                                        {recentSales.map((sale) => (
                                            <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                                <td className="p-2.5 font-bold text-blue-600 dark:text-blue-400">{sale.codigo_ticket}</td>
                                                <td className="p-2.5 text-slate-500">{new Date(sale.created_at).toLocaleDateString()}</td>
                                                <td className="p-2.5 font-sans font-medium">{sale.cliente_nombre || 'Cliente General'}</td>
                                                <td className="p-2.5 text-right font-bold text-emerald-600 font-mono">${Number(sale.total).toFixed(2)}</td>
                                                <td className="p-2.5 text-center font-sans">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 text-xs font-bold gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                        onClick={() => {
                                                            setCompletedSale(sale);
                                                            setIsRecentSalesOpen(false);
                                                        }}
                                                    >
                                                        <Printer className="w-3.5 h-3.5" />
                                                        {__('Ver / Imprimir Ticket')}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-8 text-center text-xs text-muted-foreground">
                                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    {__('No se encontraron ventas recientes.')}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsRecentSalesOpen(false)}>
                                {__('Cerrar')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* MODAL DE CONFIGURACIÓN DE IMPRESORA TÉRMICA */}
                <Dialog open={isPrinterConfigOpen} onOpenChange={setIsPrinterConfigOpen}>
                    <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Printer className="w-5 h-5 text-blue-600 shrink-0" />
                                <span>{__('Configuración de Ticketera Térmica')}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm">
                                {__('Ajusta el comportamiento de impresión automática, ancho de papel y personalización de ticket.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSavePrinterConfig} className="space-y-4 py-1 text-xs sm:text-sm">
                            {/* Interruptor de Habilitar Impresora Térmica */}
                            <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 gap-3">
                                <div className="space-y-0.5 min-w-0">
                                    <Label className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                                        <Printer className="w-4 h-4 text-blue-500 shrink-0" />
                                        <span>{__('Habilitar Ticketera Térmica')}</span>
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground leading-tight">
                                        {__('Si está desactivado, usará el diálogo estándar de impresión del navegador.')}
                                    </p>
                                </div>
                                <Switch
                                    checked={hasTicketPrinter}
                                    onCheckedChange={setHasTicketPrinter}
                                />
                            </div>

                            {/* Detector y Selección de Impresoras del Sistema */}
                            <div className="space-y-2 p-3 rounded-xl border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                                        <Printer className="w-3.5 h-3.5 shrink-0" />
                                        <span>{__('Impresora Destino del Sistema')}</span>
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-[10px] px-2 text-blue-600 border-blue-200 bg-white dark:bg-slate-900 font-bold shrink-0"
                                        onClick={detectPrinters}
                                        disabled={isDetectingPrinters}
                                    >
                                        <RefreshCw className={cn("w-3 h-3 mr-1", isDetectingPrinters && "animate-spin")} />
                                        {isDetectingPrinters ? __('Escaneando...') : __('Buscar')}
                                    </Button>
                                </div>
                                <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
                                    <SelectTrigger className="w-full h-9 text-xs bg-white dark:bg-slate-900 font-medium">
                                        <SelectValue placeholder={__('Impresora Predeterminada del Sistema (Default)')} />
                                    </SelectTrigger>
                                    <SelectContent className="text-xs">
                                        <SelectItem value="default">{__('Impresora Predeterminada del Sistema (Default)')}</SelectItem>
                                        {detectedPrinters.map((printerName, i) => (
                                            <SelectItem key={i} value={printerName}>
                                                🖨️ {printerName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                    {__('Si no selecciona una específica, las facturas se enviarán a la impresora configurada por defecto en su dispositivo.')}
                                </p>
                            </div>

                            {/* Tamaño de Papel Térmico */}
                            <div className="space-y-2">
                                <Label className="text-xs sm:text-sm font-bold">{__('Ancho de Papel Térmico')}</Label>
                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                    <button
                                        type="button"
                                        className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all ${printerPaperSize === '80mm'
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 ring-2 ring-blue-500/20 font-bold'
                                            : 'border-gray-200 dark:border-gray-800 hover:bg-slate-50'
                                            }`}
                                        onClick={() => setPrinterPaperSize('80mm')}
                                    >
                                        <div className="text-xs sm:text-sm font-bold flex items-center justify-between">
                                            <span>80 mm</span>
                                            <span className="text-[10px] text-blue-600 font-semibold">(Estándar)</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                                            {__('Caja registradora estática.')}
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all ${printerPaperSize === '58mm'
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 ring-2 ring-blue-500/20 font-bold'
                                            : 'border-gray-200 dark:border-gray-800 hover:bg-slate-50'
                                            }`}
                                        onClick={() => setPrinterPaperSize('58mm')}
                                    >
                                        <div className="text-xs sm:text-sm font-bold flex items-center justify-between">
                                            <span>58 mm</span>
                                            <span className="text-[10px] text-emerald-600 font-semibold">(Portátil)</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                                            {__('Ticketera Bluetooth/Móvil.')}
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Impresión Automática al Cobrar */}
                            <div className="flex items-center justify-between p-3 rounded-xl border gap-3">
                                <div className="space-y-0.5 min-w-0">
                                    <Label className="text-xs sm:text-sm font-bold">
                                        {__('Impresión Automática al Cobrar')}
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground leading-tight">
                                        {__('Lanza el diálogo de impresión inmediatamente tras confirmar la venta.')}
                                    </p>
                                </div>
                                <Switch
                                    checked={autoPrintOnSale}
                                    onCheckedChange={setAutoPrintOnSale}
                                />
                            </div>

                            {/* Mensaje de Encabezado Personalizado */}
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">{__('Mensaje de Encabezado (Opcional)')}</Label>
                                <Input
                                    placeholder={__('Ej. Tel: (0414) 123-4567 | Horario: 8am - 6pm')}
                                    value={ticketHeaderMsg}
                                    onChange={(e) => setTicketHeaderMsg(e.target.value)}
                                    className="text-xs h-9"
                                />
                            </div>

                            {/* Mensaje de Pie de Página Personalizado */}
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">{__('Pie de Página / Agradecimiento')}</Label>
                                <Input
                                    placeholder={__('Ej. ¡GRACIAS POR SU COMPRA!')}
                                    value={ticketFooterMsg}
                                    onChange={(e) => setTicketFooterMsg(e.target.value)}
                                    className="text-xs h-9"
                                />
                            </div>

                            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsPrinterConfigOpen(false)}>
                                    {__('Cancelar')}
                                </Button>
                                <Button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 font-bold">
                                    {__('Guardar Configuración')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL SELECCIÓN TIPO PAGO REPARACIÓN (ANTICIPO O LIQUIDACIÓN) */}
                <Dialog open={isReparacionPagoModalOpen} onOpenChange={setIsReparacionPagoModalOpen}>
                    <DialogContent className="sm:max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl rounded-2xl">
                        <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
                            <DialogTitle className="text-base font-black flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                                <Wrench className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                {__('Cobro de Orden de Reparación:')} <span className="font-mono text-indigo-900 dark:text-indigo-200">{reparacionPagoModalItem?.codigo}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                {__('Seleccione la modalidad de pago para abonar o liquidar el saldo del servicio técnico.')}
                            </DialogDescription>
                        </DialogHeader>

                        {reparacionPagoModalItem && (
                            <div className="space-y-5 py-2 text-xs">
                                {/* CARD RESUMEN DE LA ORDEN */}
                                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-extrabold text-slate-900 dark:text-white text-sm">{reparacionPagoModalItem.nombre}</div>
                                            <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">📱 {reparacionPagoModalItem.dispositivo || __('Dispositivo en Taller')}</div>
                                        </div>
                                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold border-purple-300">
                                            {reparacionPagoModalItem.estado_orden === 'recibido' ? '1-RECIBIDO' :
                                             (reparacionPagoModalItem.estado_orden === 'en_diagnostico_presupuesto' || reparacionPagoModalItem.estado_orden === 'en_diagnostico') ? '2-EN DIAGNOSTICO' :
                                             (reparacionPagoModalItem.estado_orden === 'confirmacion_presupuesto' || reparacionPagoModalItem.estado_orden === 'presupuestado') ? '3-CONFIRMACION PRESUPUESTO' :
                                             (reparacionPagoModalItem.estado_orden === 'espera_refaccion' || reparacionPagoModalItem.estado_orden === 'esperando_repuesto') ? '4-ESPERA REFACCION' :
                                             reparacionPagoModalItem.estado_orden === 'en_reparacion' ? '5-EN REPARACION' :
                                             (reparacionPagoModalItem.estado_orden === 'listo_reparado' || reparacionPagoModalItem.estado_orden === 'reparado') ? '6-LISTO REPARADO' :
                                             (reparacionPagoModalItem.estado_orden === 'listo_sin_solucion' || reparacionPagoModalItem.estado_orden === 'cancelado') ? '7-SIN SOLUCION' :
                                             (reparacionPagoModalItem.estado_orden === 'entregado_finalizado' || reparacionPagoModalItem.estado_orden === 'entregado') ? '8-ENTREGADO FINALIZADO' :
                                             (reparacionPagoModalItem.estado_orden === 'reincidencia_garantia' || reparacionPagoModalItem.estado_orden === 'reincidencia') ? '8-REINCIDENCIA/GARANTIA' :
                                             reparacionPagoModalItem.estado_orden?.replace(/_/g, ' ').toUpperCase() || __('EN TALLER')}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-center font-mono">
                                        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase">{__('Costo Estimado')}</div>
                                            <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{currencySymbol}{Number(reparacionPagoModalItem.costo_estimado || 0).toFixed(2)}</div>
                                        </div>
                                        <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/40 shadow-sm">
                                            <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">{__('Total Anticipado')}</div>
                                            <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">{currencySymbol}{Number(reparacionPagoModalItem.anticipo || 0).toFixed(2)}</div>
                                        </div>
                                        <div className="bg-purple-50 dark:bg-purple-950/60 p-2.5 rounded-lg border border-purple-200 dark:border-purple-800/50 shadow-sm">
                                            <div className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">{__('Saldo Restante')}</div>
                                            <div className="text-base font-black text-purple-900 dark:text-purple-200">{currencySymbol}{Number(reparacionPagoModalItem.saldo_restante || 0).toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                                        {__('Selecciona la Modalidad de Pago *')}
                                    </Label>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* OPCIÓN A: ANTICIPO / ADELANTO */}
                                        <div className="bg-purple-50/50 dark:bg-slate-950 border-2 border-purple-200 dark:border-purple-900/60 p-4 rounded-xl space-y-3 hover:border-purple-400 transition-all flex flex-col justify-between shadow-sm">
                                            <div className="space-y-2">
                                                <div className="font-extrabold text-purple-900 dark:text-purple-300 text-sm flex items-center gap-1.5">
                                                    <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                    {__('Abono / Anticipo Parcial')}
                                                </div>
                                                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                                    {__('Ingresar un adelanto parcial a la orden de reparación.')}
                                                </p>

                                                <div className="space-y-1 pt-1">
                                                    <Label className="text-[11px] font-bold text-purple-900 dark:text-purple-300">{__('Monto del Adelanto:')}</Label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-2 text-xs font-mono font-bold text-purple-700">{currencySymbol}</span>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={customAnticipoInput}
                                                            onChange={(e) => setCustomAnticipoInput(e.target.value)}
                                                            className="h-9 pl-7 text-xs bg-white dark:bg-slate-900 border-purple-300 dark:border-slate-700 font-mono font-extrabold text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => handleAddReparacionAnticipo(parseFloat(customAnticipoInput) || 0)}
                                                className="w-full h-10 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md gap-1.5 mt-3"
                                            >
                                                <Plus className="w-4 h-4" />
                                                {__('Añadir Anticipo al Carrito')}
                                            </Button>
                                        </div>

                                        {/* OPCIÓN B: LIQUIDACIÓN FINAL */}
                                        <div className="bg-emerald-50/50 dark:bg-slate-950 border-2 border-emerald-200 dark:border-emerald-900/60 p-4 rounded-xl space-y-3 hover:border-emerald-400 transition-all flex flex-col justify-between shadow-sm">
                                            <div className="space-y-2">
                                                <div className="font-extrabold text-emerald-900 dark:text-emerald-400 text-sm flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                    {__('Liquidación Final de Saldo')}
                                                </div>
                                                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                                    {__('Cancelar el 100% del saldo pendiente y marcar equipo listo para entregar.')}
                                                </p>

                                                <div className="pt-2 border-t border-emerald-200/60 dark:border-slate-800">
                                                    <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">{__('Monto a Cancelar:')}</div>
                                                    <div className="text-2xl font-black text-emerald-800 dark:text-emerald-300 font-mono mt-0.5">
                                                        {currencySymbol}{Number(reparacionPagoModalItem.saldo_restante || reparacionPagoModalItem.precio || 0).toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={handleAddReparacionLiquidacion}
                                                className="w-full h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md gap-1.5 mt-3"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                {__('Liquidación Total')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* PLANTILLA DE IMPRESIÓN OFICIAL TÉRMICA (@media print) */}
                {completedSale && (
                    <div
                        id="printable-ticket-thermal"
                        className={`hidden print:block text-black bg-white font-mono p-2 text-xs mx-auto ${printerPaperSize === '58mm' ? 'w-[58mm] max-w-[58mm]' : 'w-[80mm] max-w-[80mm]'
                            }`}
                    >
                        <style>{`
                            @media print {
                                body * {
                                    visibility: hidden !important;
                                }
                                #printable-ticket-thermal, #printable-ticket-thermal * {
                                    visibility: visible !important;
                                }
                                #printable-ticket-thermal {
                                    position: absolute !important;
                                    left: 0 !important;
                                    top: 0 !important;
                                    width: ${printerPaperSize === '58mm' ? '58mm' : '80mm'} !important;
                                    max-width: ${printerPaperSize === '58mm' ? '58mm' : '80mm'} !important;
                                    margin: 0 !important;
                                    padding: ${printerPaperSize === '58mm' ? '2mm' : '4mm'} !important;
                                    background: white !important;
                                    color: black !important;
                                    font-family: Arial, sans-serif !important;
                                    font-size: ${printerPaperSize === '58mm' ? '9px' : '11px'} !important;
                                }
                                @page {
                                    size: ${printerPaperSize === '58mm' ? '58mm' : '80mm'} auto;
                                    margin: 0;
                                }
                            }
                        `}</style>
                        {/* LOGO DE LA EMPRESA O MARCA (IDENTICAL TO ADMIN/VENTAS) */}
                        <div className="text-center mb-1">
                            {currentEmpresa.logo ? (
                                <img
                                    src={currentEmpresa.logo}
                                    alt={currentEmpresa.razon_social || 'Logo'}
                                    className="h-10 max-w-[160px] mx-auto object-contain"
                                />
                            ) : (
                                <div className="font-black text-base uppercase">{currentEmpresa.razon_social || 'FixSale - Servitec POS'}</div>
                            )}
                        </div>

                        {currentEmpresa.razon_social && (
                            <div className="text-center font-bold text-xs uppercase">{currentEmpresa.razon_social}</div>
                        )}
                        {currentEmpresa.documento && (
                            <div className="text-center text-[9px] font-mono">{currentEmpresa.documento}</div>
                        )}
                        <div className="text-center text-[9px] text-gray-700">
                            {currentEmpresa.telefono ? `Tel: ${currentEmpresa.telefono}` : ''} {currentEmpresa.email ? `| ${currentEmpresa.email}` : ''}
                        </div>
                        {currentEmpresa.direccion && (
                            <div className="text-center text-[8px] text-gray-600">{currentEmpresa.direccion}</div>
                        )}
                        {ticketHeaderMsg && (
                            <div className="text-center text-[9px] text-gray-700 mt-0.5 font-medium">{ticketHeaderMsg}</div>
                        )}
                        <div className="border-b border-dashed border-black my-1"></div>
                        <div className="text-center font-bold uppercase text-[10px]">COMPROBANTE DE VENTA</div>
                        <div className="flex justify-between text-[10px] font-mono mt-1">
                            <span>TICKET: {completedSale.codigo_ticket}</span>
                            <span>{new Date(completedSale.created_at || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <div className="text-[10px]">CLIENTE: {completedSale.cliente_nombre || 'Cliente General'}</div>
                        <div className="text-[10px]">ATENDIÓ: {completedSale.user?.name || 'Cajero POS'}</div>
                        <div className="border-b border-dashed border-black my-1"></div>

                        {/* Encabezado Tabla */}
                        <div className="grid grid-cols-12 text-[10px] font-bold border-b border-black pb-0.5">
                            <span className="col-span-1">#</span>
                            <span className="col-span-5">DESCRIPCIÓN</span>
                            <span className="col-span-2 text-center">CANT</span>
                            <span className="col-span-2 text-right">P.U.</span>
                            <span className="col-span-2 text-right">TOTAL</span>
                        </div>

                        {/* Items */}
                        {completedSale.items?.map((it: any, idx: number) => (
                            <div key={idx} className="grid grid-cols-12 text-[10px] py-0.5 border-b border-dotted border-gray-400">
                                <span className="col-span-1">{idx + 1}</span>
                                <span className="col-span-5 truncate">{it.nombre}</span>
                                <span className="col-span-2 text-center">{it.cantidad}</span>
                                <span className="col-span-2 text-right">${Number(it.precio_unitario).toFixed(2)}</span>
                                <span className="col-span-2 text-right font-bold">${Number(it.subtotal ?? (it.cantidad * it.precio_unitario) ?? 0).toFixed(2)}</span>
                            </div>
                        ))}

                        <div className="border-b border-dashed border-black my-1"></div>

                        {/* Totales */}
                        <div className="space-y-0.5 text-[10px]">
                            <div className="flex justify-between">
                                <span>SUBTOTAL:</span>
                                <span>${Number(completedSale.subtotal || completedSale.total).toFixed(2)}</span>
                            </div>
                            {Number(completedSale.descuento || 0) > 0 && (
                                <div className="flex justify-between">
                                    <span>DESCUENTO:</span>
                                    <span>-${Number(completedSale.descuento).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xs font-bold border-t border-b border-black py-0.5">
                                <span>TOTAL A PAGAR:</span>
                                <span>{currencySymbol}{Number(completedSale.total).toFixed(2)}</span>
                            </div>
                            {valorDolar > 0 && (
                                <div className="flex justify-between text-[10px] text-gray-700 font-semibold">
                                    <span>EQ. USD ($):</span>
                                    <span>${(Number(completedSale.total) / valorDolar).toFixed(2)} USD</span>
                                </div>
                            )}
                        </div>

                        <div className="border-b border-dashed border-black my-1"></div>

                        {/* Métodos de Pago */}
                        <div className="text-[10px] space-y-0.5">
                            <div className="font-bold">PAGADO CON:</div>
                            {completedSale.payments?.map((pm: any, pidx: number) => (
                                <div key={pidx} className="flex justify-between">
                                    <span className="uppercase">{pm.metodo_pago}:</span>
                                    <span>${Number(pm.monto).toFixed(2)}</span>
                                </div>
                            ))}
                            {Number(completedSale.cambio || 0) > 0 && (
                                <div className="flex justify-between font-bold">
                                    <span>CAMBIO:</span>
                                    <span>${Number(completedSale.cambio).toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        <div className="border-b border-dashed border-black my-1"></div>

                        {/* CÓDIGO QR PARA VALIDACIÓN */}
                        <div className="text-center pt-1 pb-1 flex flex-col items-center">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`TICKET:${completedSale.codigo_ticket}|TOTAL:${completedSale.total}`)}`}
                                alt="QR Ticket"
                                className="h-16 w-16 object-contain"
                            />
                            <div className="text-[8px] font-mono text-gray-600 mt-0.5">ESCANEAR PARA VALIDAR</div>
                        </div>

                        <div className="border-b border-dashed border-black my-1"></div>
                        <div className="text-center text-[10px] font-bold uppercase">{ticketFooterMsg}</div>
                        <div className="text-center text-[9px] text-gray-600">Servitec POS - Formato {printerPaperSize}</div>
                    </div>
                )}

                {/* FORMATO TICKET DE IMPRESIÓN PARA TICKETERA POS (80MM / 58MM - ARQUEO / CORTE DE TURNO) */}
                {isCorteOpen && activeRegisterSummary && (
                    <div
                        id="printable-arqueo-ticket"
                        className={`hidden print:block text-black bg-white font-mono p-2 text-xs mx-auto ${
                            printerPaperSize === '58mm' ? 'w-[58mm] max-w-[58mm]' : 'w-[80mm] max-w-[80mm]'
                        }`}
                    >
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
                                    width: ${printerPaperSize === '58mm' ? '58mm' : '80mm'} !important;
                                    max-width: ${printerPaperSize === '58mm' ? '58mm' : '80mm'} !important;
                                    margin: 0 !important;
                                    padding: ${printerPaperSize === '58mm' ? '2mm' : '4mm'} !important;
                                    background: white !important;
                                    color: black !important;
                                    font-family: 'Courier New', Courier, monospace, sans-serif !important;
                                    font-size: ${printerPaperSize === '58mm' ? '9px' : '11px'} !important;
                                }
                                @page {
                                    size: ${printerPaperSize === '58mm' ? '58mm' : '80mm'} auto;
                                    margin: 0;
                                }
                            }
                        `}</style>

                        {/* LOGO O ENCABEZADO DE EMPRESA */}
                        <div className="text-center mb-1">
                            {currentEmpresa.logo ? (
                                <img
                                    src={currentEmpresa.logo}
                                    alt={currentEmpresa.razon_social || 'Logo'}
                                    className="h-10 max-w-[160px] mx-auto object-contain mb-1"
                                />
                            ) : (
                                <div className="font-black text-sm uppercase">{currentEmpresa.razon_social || 'FixSale - Servitec POS'}</div>
                            )}
                        </div>

                        {currentEmpresa.razon_social && (
                            <div className="text-center font-bold text-[10px] uppercase">{currentEmpresa.razon_social}</div>
                        )}
                        {currentEmpresa.documento && (
                            <div className="text-center text-[9px] font-mono">{currentEmpresa.documento}</div>
                        )}
                        <div className="text-center text-[9px] text-gray-700">
                            {currentEmpresa.telefono ? `Tel: ${currentEmpresa.telefono}` : ''} {currentEmpresa.email ? ` | ${currentEmpresa.email}` : ''}
                        </div>
                        {currentEmpresa.direccion && (
                            <div className="text-center text-[8px] text-gray-600">{currentEmpresa.direccion}</div>
                        )}

                        <div className="border-b border-dashed border-black my-1"></div>
                        <div className="text-center font-bold uppercase text-[11px] tracking-wider">
                            {__('ARQUEO / CORTE DE TURNO')}
                        </div>
                        <div className="border-b border-dashed border-black my-1"></div>

                        <div className="space-y-0.5 text-[10px]">
                            <div className="flex justify-between">
                                <span>CAJA #:</span>
                                <span className="font-bold">#{activeRegister?.id || 'POS'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>CAJERO:</span>
                                <span>{activeRegister?.user?.name || pageProps?.auth?.user?.name || 'Cajero POS'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>APERTURA:</span>
                                <span>{activeRegister?.opened_at ? new Date(activeRegister.opened_at).toLocaleString() : new Date().toLocaleString()}</span>
                            </div>
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
                                <span>{currencySymbol}{(activeRegisterSummary.opening_amount ?? activeRegister?.opening_amount ?? 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Ingresos (+):</span>
                                <span>+{currencySymbol}{(activeRegisterSummary.inflows ?? 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Salidas (-):</span>
                                <span>-{currencySymbol}{(activeRegisterSummary.outflows ?? 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold border-t border-dotted border-black pt-1">
                                <span>Dinero Esperado:</span>
                                <span>{currencySymbol}{expectedCashBal.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* DESGLOSE POR FORMA DE PAGO */}
                        {activeRegisterSummary.by_payment_method && Object.keys(activeRegisterSummary.by_payment_method).length > 0 && (
                            <>
                                <div className="border-b border-dashed border-black my-1"></div>
                                <div className="text-center font-bold text-[10px] uppercase">{__('DESGLOSE FORMAS DE PAGO')}</div>
                                <div className="border-b border-dashed border-black my-1"></div>
                                <div className="space-y-1 text-[10px]">
                                    {Object.entries(activeRegisterSummary.by_payment_method).map(([method, val]: any) => {
                                        const label = method === 'efectivo' ? __('Efectivo (MXN)') :
                                            method === 'dolar' ? __('💵 Dólares (USD)') :
                                                method === 'transferencia' ? __('Transferencia') :
                                                    method === 'tarjeta' ? __('Tarjeta Débito/Crédito') :
                                                        method === 'credito' ? __('Venta a Crédito (Fiado)') :
                                                            method.replace('_', ' ');
                                        const netVal = typeof val === 'object' && val !== null ? (val.net ?? 0) : Number(val ?? 0);
                                        return (
                                            <div key={method} className="flex justify-between">
                                                <span className="capitalize">{label}:</span>
                                                <span className="font-mono font-bold">{currencySymbol}{netVal.toFixed(2)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* RESULTADO DEL ARQUEO FÍSICO (SI SE HA INGRESADO CONTEO) */}
                        {(countedAmountInput !== '' || countedUSDInput !== '') && (
                            <>
                                <div className="border-b border-dashed border-black my-1"></div>
                                <div className="text-center font-bold text-[10px] uppercase">{__('RESULTADO DEL ARQUEO')}</div>
                                <div className="border-b border-dashed border-black my-1"></div>
                                <div className="space-y-1 text-[10px]">
                                    <div className="flex justify-between">
                                        <span>Esperado Cajón:</span>
                                        <span>{currencySymbol}{expectedCashBal.toFixed(2)}</span>
                                    </div>
                                    {countedAmountInput !== '' && (
                                        <div className="flex justify-between">
                                            <span>Conteo MXN:</span>
                                            <span>{currencySymbol}{countedMXN.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {countedUSDInput !== '' && (
                                        <div className="flex justify-between">
                                            <span>Conteo USD:</span>
                                            <span>${countedUSD.toFixed(2)} USD</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold border-t border-dotted border-black pt-0.5">
                                        <span>Total Físico Contado:</span>
                                        <span>{currencySymbol}{totalCountedCombinedMXN.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold">
                                        <span>Diferencia:</span>
                                        <span>
                                            {diffBalCombined === 0 ? '0.00 (Cuadre Perfecto)' : `${diffBalCombined > 0 ? '+' : ''}${currencySymbol}${diffBalCombined.toFixed(2)} (${diffBalCombined > 0 ? 'Sobrante' : 'Faltante'})`}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="border-b border-dashed border-black my-2"></div>

                        <div className="text-center text-[10px] space-y-4 pt-2">
                            <div>
                                <p>_____________________________________</p>
                                <p className="mt-1 font-bold">{__('Firma Cajero')}: {activeRegister?.user?.name || pageProps?.auth?.user?.name || 'Cajero'}</p>
                            </div>
                            <p className="text-[9px] italic">{__('Comprobante generado desde Servitec POS')}</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}