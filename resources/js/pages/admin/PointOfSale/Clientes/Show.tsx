import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    CreditCard,
    DollarSign,
    Receipt,
    Clock,
    CheckCircle2,
    User,
    Phone,
    MapPin,
    Mail,
    AlertCircle,
    Calendar,
    Plus,
    Wallet,
    ShieldAlert,
    History,
    CheckCircle,
    Pencil,
    FileText,
    TrendingDown,
    TrendingUp
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
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

interface Cliente {
    id: number;
    nombre: string;
    telefono: string | null;
    email: string | null;
    direccion: string | null;
    limite_credito: number;
    saldo_pendiente: number;
    estado?: boolean;
    sales: Sale[];
    credit_payments: CreditPayment[];
}

interface Sale {
    id: number;
    codigo_ticket: string;
    total: number;
    monto_recibido: number;
    saldo_credito: number;
    created_at: string;
    items: { id: number; nombre: string; cantidad: number; subtotal: number }[];
}

interface CreditPayment {
    id: number;
    sale_id: number;
    metodo_pago: string;
    monto: number;
    nota: string | null;
    created_at: string;
    receiver: { id: number; name: string };
}

interface Props {
    cliente: Cliente;
    currencySymbol?: string;
}

export default function Show({ cliente, currencySymbol = '$' }: Props) {
    const { __ } = useTranslate();
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isGeneralAbonoOpen, setIsGeneralAbonoOpen] = useState(false);

    const abonoForm = useForm({
        sale_id: '',
        metodo_pago: 'efectivo',
        monto: '',
        nota: '',
    });

    const openAbonoDialog = (sale: Sale) => {
        setSelectedSale(sale);
        abonoForm.setData({
            sale_id: String(sale.id),
            metodo_pago: 'efectivo',
            monto: String(sale.saldo_credito),
            nota: '',
        });
    };

    const handleQuickAmount = (pct: number) => {
        if (!selectedSale) return;
        const amount = (selectedSale.saldo_credito * pct).toFixed(2);
        abonoForm.setData('monto', amount);
    };

    const handleRegistrarAbono = (e: React.FormEvent) => {
        e.preventDefault();
        abonoForm.post(`/admin/clientes/${cliente.id}/abono`, {
            onSuccess: () => {
                setSelectedSale(null);
                setIsGeneralAbonoOpen(false);
                abonoForm.reset();
                notifySuccess(__('Abono registrado exitosamente.'));
            },
            onError: () => notifyError(__('Error al registrar el abono.')),
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/dashboard' },
        { title: __('Punto de Venta'), href: '#' },
        { title: __('Clientes'), href: '/admin/clientes' },
        { title: cliente.nombre, href: `/admin/clientes/${cliente.id}` },
    ];

    // Total abonado históricamente
    const totalAbonado = cliente.credit_payments.reduce((acc, p) => acc + Number(p.monto || 0), 0);
    const creditoDisponible = Math.max(0, cliente.limite_credito - cliente.saldo_pendiente);
    const usoCreditoPct = cliente.limite_credito > 0 
        ? Math.min(100, (cliente.saldo_pendiente / cliente.limite_credito) * 100) 
        : 0;

    // Movimientos combinados
    const history = [
        ...cliente.sales.map((s) => ({ type: 'sale', date: new Date(s.created_at).getTime(), data: s })),
        ...cliente.credit_payments.map((p) => ({ type: 'payment', date: new Date(p.created_at).getTime(), data: p })),
    ].sort((a, b) => b.date - a.date);

    const pendingSales = cliente.sales.filter((s) => Number(s.saldo_credito) > 0);

    return (
        <>
            <Head title={`${__('Estado de Cuenta')} - ${cliente.nombre}`} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Banner de Encabezado */}
                <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={() => router.get('/admin/clientes')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                                    {cliente.nombre.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{cliente.nombre}</h1>
                                        <Badge variant="outline" className="text-xs font-normal">
                                            #{cliente.id}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{__('Estado de Cuenta y Gestión de Crédito')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {pendingSales.length > 0 && (
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                    onClick={() => openAbonoDialog(pendingSales[0])}
                                >
                                    <DollarSign className="h-4 w-4 mr-1.5" />
                                    {__('Registrar Abono')}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stat Cards Resumen Financiero */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={<Wallet className="h-6 w-6" />}
                        title={__('LÍMITE DE CRÉDITO')}
                        value={`${currencySymbol}${cliente.limite_credito.toFixed(2)}`}
                        colorClassName="bg-indigo-100 text-indigo-600"
                    />
                    <StatCard
                        icon={<TrendingDown className="h-6 w-6" />}
                        title={__('SALDO PENDIENTE (DEUDA)')}
                        value={`${currencySymbol}${cliente.saldo_pendiente.toFixed(2)}`}
                        colorClassName={cliente.saldo_pendiente > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}
                    />
                    <StatCard
                        icon={<CheckCircle className="h-6 w-6" />}
                        title={__('CRÉDITO DISPONIBLE')}
                        value={`${currencySymbol}${creditoDisponible.toFixed(2)}`}
                        colorClassName="bg-emerald-100 text-emerald-600"
                    />
                    <StatCard
                        icon={<TrendingUp className="h-6 w-6" />}
                        title={__('TOTAL ABONADO HISTÓRICO')}
                        value={`${currencySymbol}${totalAbonado.toFixed(2)}`}
                        colorClassName="bg-blue-100 text-blue-600"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tarjeta de Información y Contacto */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm space-y-4">
                            <h3 className="text-base font-bold flex items-center gap-2 border-b pb-3 text-slate-900 dark:text-slate-100">
                                <User className="w-4 h-4 text-indigo-600" />
                                {__('Información del Cliente')}
                            </h3>

                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-xs text-muted-foreground block uppercase font-medium">{__('Nombre Completo')}</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{cliente.nombre}</span>
                                </div>

                                <div>
                                    <span className="text-xs text-muted-foreground block uppercase font-medium">{__('Teléfono')}</span>
                                    <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                                        {cliente.telefono || '—'}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-xs text-muted-foreground block uppercase font-medium">{__('Correo Electrónico')}</span>
                                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                        {cliente.email || '—'}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-xs text-muted-foreground block uppercase font-medium">{__('Dirección')}</span>
                                    <span className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                        {cliente.direccion || '—'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Barra de Uso de Crédito */}
                        <div className="bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm space-y-3">
                            <h3 className="text-sm font-bold flex items-center justify-between text-slate-900 dark:text-slate-100">
                                <span>{__('Uso de Línea de Crédito')}</span>
                                <span className="font-mono text-xs text-indigo-600 font-bold">{usoCreditoPct.toFixed(0)}%</span>
                            </h3>

                            <div className="w-full bg-slate-100 rounded-full h-3 dark:bg-slate-800 overflow-hidden">
                                <div
                                    className={cn(
                                        "h-3 rounded-full transition-all duration-500",
                                        usoCreditoPct > 90 ? "bg-rose-500" : usoCreditoPct > 70 ? "bg-amber-500" : "bg-emerald-500"
                                    )}
                                    style={{ width: `${usoCreditoPct}%` }}
                                ></div>
                            </div>

                            <div className="flex justify-between text-xs text-muted-foreground font-mono pt-1">
                                <span>Deuda: {currencySymbol}{cliente.saldo_pendiente.toFixed(2)}</span>
                                <span>Límite: {currencySymbol}{cliente.limite_credito.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Contenido Principal con Pestañas */}
                    <div className="lg:col-span-2 space-y-6">
                        <Tabs defaultValue="pendientes" className="w-full">
                            <TabsList className="grid grid-cols-3 w-full bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                                <TabsTrigger value="pendientes" className="flex items-center gap-1.5">
                                    <AlertCircle className="w-4 h-4 text-amber-500" />
                                    {__('Por Cobrar')} ({pendingSales.length})
                                </TabsTrigger>
                                <TabsTrigger value="abonos" className="flex items-center gap-1.5">
                                    <CreditCard className="w-4 h-4 text-emerald-500" />
                                    {__('Abonos')} ({cliente.credit_payments.length})
                                </TabsTrigger>
                                <TabsTrigger value="historial" className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-indigo-500" />
                                    {__('Movimientos')}
                                </TabsTrigger>
                            </TabsList>

                            {/* 1. CUENTAS POR COBRAR */}
                            <TabsContent value="pendientes" className="mt-4">
                                <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm">
                                    <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                                        <h3 className="font-bold text-sm flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-amber-500" />
                                            {__('Ventas a Crédito Pendientes de Pago')}
                                        </h3>
                                    </div>

                                    <div className="divide-y">
                                        {pendingSales.map((sale) => (
                                            <div key={sale.id} className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="font-mono bg-slate-100 dark:bg-slate-800 font-bold">
                                                            {sale.codigo_ticket}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(sale.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                                        {sale.items?.map((i) => `${i.cantidad}x ${i.nombre}`).join(', ') || __('Venta directa')}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-4 text-right">
                                                    <div>
                                                        <span className="text-xs text-muted-foreground block">{__('Saldo Pendiente')}</span>
                                                        <span className="font-mono font-bold text-base text-rose-600">
                                                            {currencySymbol}{Number(sale.saldo_credito).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                                        onClick={() => openAbonoDialog(sale)}
                                                    >
                                                        <DollarSign className="w-4 h-4 mr-1" />
                                                        {__('Abonar')}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}

                                        {pendingSales.length === 0 && (
                                            <div className="p-12 text-center text-muted-foreground space-y-2">
                                                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500/60" />
                                                <p className="font-medium text-slate-800 dark:text-slate-200">{__('¡Al día! El cliente no posee saldo pendiente.')}</p>
                                                <p className="text-xs text-muted-foreground">{__('Todas las ventas a crédito han sido completamente saldadas.')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* 2. HISTORIAL DE ABONOS */}
                            <TabsContent value="abonos" className="mt-4">
                                <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm">
                                    <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                                        <h3 className="font-bold text-sm flex items-center gap-2">
                                            <CreditCard className="w-4 h-4 text-emerald-500" />
                                            {__('Registro de Abonos Recibidos')}
                                        </h3>
                                    </div>

                                    <div className="divide-y">
                                        {cliente.credit_payments.map((payment) => (
                                            <div key={payment.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                        <CreditCard className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-sm capitalize">{payment.metodo_pago}</span>
                                                            <span className="text-xs text-muted-foreground">• {new Date(payment.created_at).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {__('Recibido por')}: <span className="font-medium">{payment.receiver?.name || __('Sistema')}</span>
                                                            {payment.nota && ` — "${payment.nota}"`}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <span className="font-mono font-bold text-emerald-600 text-base">
                                                        +{currencySymbol}{Number(payment.monto).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}

                                        {cliente.credit_payments.length === 0 && (
                                            <div className="p-10 text-center text-muted-foreground">
                                                <p className="text-sm">{__('No se han registrado abonos para este cliente todavía.')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* 3. TIMELINE MOVIMIENTOS COMBINADOS */}
                            <TabsContent value="historial" className="mt-4">
                                <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm">
                                    <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                                        <h3 className="font-bold text-sm flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-indigo-500" />
                                            {__('Historial Completo de Movimientos')}
                                        </h3>
                                    </div>

                                    <div className="divide-y">
                                        {history.map((entry, idx) => {
                                            if (entry.type === 'sale') {
                                                const sale = entry.data as Sale;
                                                return (
                                                    <div key={`s-${sale.id}-${idx}`} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                                                <Receipt className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-sm">{__('Venta a Crédito')} — <span className="font-mono">{sale.codigo_ticket}</span></p>
                                                                <p className="text-xs text-muted-foreground">{new Date(sale.created_at).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-mono font-bold text-rose-600">
                                                                +{currencySymbol}{Number(sale.total).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                const payment = entry.data as CreditPayment;
                                                return (
                                                    <div key={`p-${payment.id}-${idx}`} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                                <CreditCard className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-sm">{__('Abono Recibido')} ({payment.metodo_pago})</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {new Date(payment.created_at).toLocaleString()} • Recibido por {payment.receiver?.name}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-mono font-bold text-emerald-600">
                                                                -{currencySymbol}{Number(payment.monto).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        })}

                                        {history.length === 0 && (
                                            <div className="p-10 text-center text-muted-foreground">
                                                <p className="text-sm">{__('Sin historial de movimientos.')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                {/* Modal Registrar Abono */}
                <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                                {__('Registrar Abono a Crédito')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Ticket:')} <strong className="font-mono">{selectedSale?.codigo_ticket}</strong>
                                <br />
                                {__('Saldo pendiente en este ticket:')}{' '}
                                <span className="font-mono text-rose-600 font-bold">
                                    {currencySymbol}{selectedSale?.saldo_credito}
                                </span>
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleRegistrarAbono} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>{__('Método de Pago')}</Label>
                                <Select value={abonoForm.data.metodo_pago} onValueChange={(v) => abonoForm.setData('metodo_pago', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="efectivo">{__('Efectivo')}</SelectItem>
                                        <SelectItem value="transferencia">{__('Transferencia Bancaria')}</SelectItem>
                                        <SelectItem value="tarjeta">{__('Tarjeta de Débito/Crédito')}</SelectItem>
                                        <SelectItem value="pago_movil">{__('Pago Móvil')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>{__('Monto a Abonar')} ({currencySymbol})</Label>
                                    <div className="flex gap-1">
                                        <Button type="button" variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => handleQuickAmount(0.25)}>25%</Button>
                                        <Button type="button" variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => handleQuickAmount(0.5)}>50%</Button>
                                        <Button type="button" variant="ghost" size="sm" className="h-6 text-xs px-2 font-bold text-emerald-600" onClick={() => handleQuickAmount(1)}>100%</Button>
                                    </div>
                                </div>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={selectedSale?.saldo_credito}
                                    value={abonoForm.data.monto}
                                    onChange={(e) => abonoForm.setData('monto', e.target.value)}
                                    className="font-mono text-lg font-bold text-emerald-600"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{__('Notas / Referencia (Opcional)')}</Label>
                                <Textarea
                                    value={abonoForm.data.nota}
                                    onChange={(e) => abonoForm.setData('nota', e.target.value)}
                                    placeholder="Ej: Número de referencia de transferencia..."
                                    rows={2}
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setSelectedSale(null)}>
                                    {__('Cancelar')}
                                </Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" disabled={abonoForm.processing}>
                                    {abonoForm.processing ? __('Procesando...') : __('Confirmar Abono')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
