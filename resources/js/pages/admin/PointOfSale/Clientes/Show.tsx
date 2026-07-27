import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft, CreditCard, DollarSign, Receipt, Clock, CheckCircle2, User, Phone, MapPin, Mail, AlertCircle, Calendar, Plus, Wallet,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
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
import { notifySuccess, notifyError } from '@/utils/notifications';

interface Cliente {
    id: number;
    nombre: string;
    telefono: string | null;
    email: string | null;
    direccion: string | null;
    limite_credito: number;
    saldo_pendiente: number;
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
            monto: String(sale.saldo_credito), // suggest full remaining balance
            nota: '',
        });
    };

    const handleRegistrarAbono = (e: React.FormEvent) => {
        e.preventDefault();
        abonoForm.post(`/admin/clientes/${cliente.id}/abono`, {
            onSuccess: () => {
                setSelectedSale(null);
                abonoForm.reset();
                notifySuccess(__('Abono registrado exitosamente.'));
            },
            onError: () => notifyError(__('Error al registrar el abono.')),
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Punto de Venta'), href: '#' },
        { title: __('Clientes'), href: '/admin/clientes' },
        { title: cliente.nombre, href: `/admin/clientes/${cliente.id}` },
    ];

    // Combine and sort history
    const history = [
        ...cliente.sales.map(s => ({ type: 'sale', date: new Date(s.created_at).getTime(), data: s })),
        ...cliente.credit_payments.map(p => ({ type: 'payment', date: new Date(p.created_at).getTime(), data: p }))
    ].sort((a, b) => b.date - a.date);

    return (
        <>
            <Head title={`${__('Estado de Cuenta')} - ${cliente.nombre}`} />
            <div className="space-y-4">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="flex items-center gap-3 mb-6">
                    <Button variant="outline" size="icon" onClick={() => router.get('/admin/clientes')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold">{__('Estado de Cuenta')}</h2>
                        <p className="text-muted-foreground">{cliente.nombre}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Client Info */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 space-y-4">
                            <div className="flex items-center gap-3 pb-3 border-b">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{cliente.nombre}</h3>
                                    <span className="text-xs text-muted-foreground">{__('Cliente')} #{cliente.id}</span>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                {cliente.telefono && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {cliente.telefono}</div>}
                                {cliente.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {cliente.email}</div>}
                                {cliente.direccion && <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" /> {cliente.direccion}</div>}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4">
                            <h3 className="font-semibold flex items-center gap-2 mb-4"><Wallet className="h-4 w-4 text-emerald-600" /> {__('Resumen de Crédito')}</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <span className="text-xs text-muted-foreground block uppercase tracking-wider mb-1">{__('Saldo Pendiente (Deuda)')}</span>
                                    <span className={`text-3xl font-extrabold font-mono ${cliente.saldo_pendiente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {currencySymbol}{cliente.saldo_pendiente.toFixed(2)}
                                    </span>
                                </div>
                                <div className="pt-3 border-t">
                                    <span className="text-xs text-muted-foreground block uppercase tracking-wider mb-1">{__('Límite de Crédito')}</span>
                                    <span className="text-xl font-bold font-mono">{currencySymbol}{cliente.limite_credito.toFixed(2)}</span>
                                </div>
                                {cliente.limite_credito > 0 && (
                                    <div className="w-full bg-slate-100 rounded-full h-2.5 dark:bg-slate-800 mt-2">
                                        <div 
                                            className={`h-2.5 rounded-full ${cliente.saldo_pendiente > cliente.limite_credito * 0.8 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                            style={{ width: `${Math.min((cliente.saldo_pendiente / cliente.limite_credito) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pending Sales & History */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                            <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                                <h3 className="font-semibold flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-500" /> {__('Cuentas por Cobrar')}</h3>
                            </div>
                            <div className="divide-y">
                                {cliente.sales.filter(s => s.saldo_credito > 0).map(sale => (
                                    <div key={sale.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="font-mono">{sale.codigo_ticket}</Badge>
                                                <span className="text-xs text-muted-foreground flex items-center"><Calendar className="h-3 w-3 mr-1" /> {new Date(sale.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm mt-1 text-muted-foreground line-clamp-1">{sale.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}</p>
                                        </div>
                                        <div className="flex items-center gap-4 text-right">
                                            <div>
                                                <span className="text-xs text-muted-foreground block">{__('Deuda Ticket')}</span>
                                                <span className="font-mono font-bold text-rose-600">{currencySymbol}{Number(sale.saldo_credito).toFixed(2)}</span>
                                            </div>
                                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => openAbonoDialog(sale)}>
                                                <DollarSign className="h-4 w-4 mr-1" /> {__('Abonar')}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {cliente.sales.filter(s => s.saldo_credito > 0).length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500/50" />
                                        <p>{__('El cliente no tiene deudas pendientes.')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                            <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                                <h3 className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4" /> {__('Historial de Movimientos')}</h3>
                            </div>
                            <div className="divide-y">
                                {history.map((entry, idx) => {
                                    if (entry.type === 'sale') {
                                        const sale = entry.data as Sale;
                                        return (
                                            <div key={`s-${sale.id}`} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                                    <Receipt className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm">{__('Venta a Crédito')} - {sale.codigo_ticket}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(sale.created_at).toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-mono font-bold text-rose-600">+{currencySymbol}{Number(sale.total).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        const payment = entry.data as CreditPayment;
                                        return (
                                            <div key={`p-${payment.id}`} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                    <CreditCard className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm">{__('Abono Recibido')} ({payment.metodo_pago})</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(payment.created_at).toLocaleString()} • Recibido por {payment.receiver?.name}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-mono font-bold text-emerald-600">-{currencySymbol}{Number(payment.monto).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                                {history.length === 0 && (
                                    <div className="p-6 text-center text-muted-foreground">
                                        <p>{__('No hay movimientos registrados.')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Registrar Abono Modal */}
                <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{__('Registrar Abono')}</DialogTitle>
                            <DialogDescription>
                                {__('Ticket:')} <strong>{selectedSale?.codigo_ticket}</strong>
                                <br />
                                {__('Deuda actual de este ticket:')} <span className="font-mono text-rose-600 font-bold">{currencySymbol}{selectedSale?.saldo_credito}</span>
                            </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleRegistrarAbono} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>{__('Método de Pago')}</Label>
                                <Select value={abonoForm.data.metodo_pago} onValueChange={(v) => abonoForm.setData('metodo_pago', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="efectivo">{__('Efectivo')}</SelectItem>
                                        <SelectItem value="transferencia">{__('Transferencia')}</SelectItem>
                                        <SelectItem value="tarjeta">{__('Tarjeta')}</SelectItem>
                                        <SelectItem value="pago_movil">{__('Pago Móvil')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{__('Monto a Abonar')} ({currencySymbol})</Label>
                                <Input 
                                    type="number" step="0.01" min="0.01" max={selectedSale?.saldo_credito}
                                    value={abonoForm.data.monto} 
                                    onChange={(e) => abonoForm.setData('monto', e.target.value)} 
                                    className="font-mono text-lg"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{__('Notas / Referencia (Opcional)')}</Label>
                                <Textarea value={abonoForm.data.nota} onChange={(e) => abonoForm.setData('nota', e.target.value)} rows={2} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setSelectedSale(null)}>{__('Cancelar')}</Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={abonoForm.processing}>{__('Registrar Abono')}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
