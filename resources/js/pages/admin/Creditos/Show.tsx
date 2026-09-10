import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    CreditCard,
    ArrowLeft,
    Smartphone,
    User,
    Calendar,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertTriangle,
    ShieldAlert,
    Receipt,
    ExternalLink,
    Phone,
    Printer,
    Check,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
import { useTranslate } from '@/hooks/use-translate';

interface Cuota {
    id: number;
    numero_cuota: number;
    fecha_vencimiento: string;
    monto_capital: string | number;
    monto_interes: string | number;
    monto_cuota: string | number;
    monto_mora: string | number;
    monto_pagado: string | number;
    saldo_cuota: string | number;
    fecha_pago?: string | null;
    metodo_pago?: string | null;
    referencia_pago?: string | null;
    estado: 'pendiente' | 'parcial' | 'pagada' | 'vencida';
    notas?: string | null;
}

interface Credito {
    id: number;
    codigo_credito: string;
    fecha_inicio: string;
    precio_equipo: string | number;
    monto_inicial: string | number;
    metodo_pago_inicial?: string | null;
    referencia_pago_inicial?: string | null;
    monto_financiado: string | number;
    porcentaje_interes: string | number;
    interes_total: string | number;
    total_credito: string | number;
    saldo_pendiente: string | number;
    estado: 'pendiente_aprobacion' | 'aprobado' | 'activo' | 'liquidado' | 'en_mora' | 'cancelado' | 'incobrable';
    notas?: string | null;
    cliente?: {
        id: number;
        nombres: string;
        apellidos: string;
        tipo_documento: string;
        numero_documento: string;
        telefono_principal: string;
        ciudad?: string | null;
        direccion?: string | null;
    };
    equipo?: {
        id: number;
        imei_1: string;
        imei_2?: string | null;
        serial?: string | null;
        color?: string | null;
        modelo?: {
            nombre: string;
            almacenamiento?: string;
            ram?: string;
            marca?: {
                nombre: string;
            };
        };
    };
    plan?: {
        id: number;
        nombre: string;
        frecuencia: string;
        numero_cuotas: number;
        dias_gracia: number;
    };
    sucursal?: {
        id: number;
        nombre: string;
    };
    vendedor?: {
        id: number;
        name: string;
    };
    cuotas?: Cuota[];
}

interface Props {
    credito: Credito;
}

export default function CreditoShow({ credito }: Props) {
    const { __, currentLocale } = useTranslate();
    const { regional_config } = usePage().props as any;
    const currency = regional_config?.currency_symbol || '$';

    const [payingCuota, setPayingCuota] = useState<Cuota | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const paymentForm = useForm({
        monto: '',
        metodo_pago: 'efectivo',
        referencia_pago: '',
        fecha_pago: new Date().toISOString().split('T')[0],
        notas: '',
    });

    const openPaymentModal = (cuota: Cuota) => {
        setPayingCuota(cuota);
        paymentForm.setData({
            monto: Number(cuota.saldo_cuota).toFixed(2),
            metodo_pago: 'efectivo',
            referencia_pago: '',
            fecha_pago: new Date().toISOString().split('T')[0],
            notas: '',
        });
        setIsPaymentModalOpen(true);
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!payingCuota) return;

        paymentForm.post(`/admin/cuotas/${payingCuota.id}/pagar`, {
            onSuccess: () => setIsPaymentModalOpen(false),
        });
    };

    const cuotas = credito.cuotas || [];
    const totalCobradoCuotas = cuotas.reduce((acc, c) => acc + Number(c.monto_pagado || 0), 0);
    const totalRecaudado = Number(credito.monto_inicial) + totalCobradoCuotas;

    const getCuotaBadge = (estado: string, fechaVencimiento: string) => {
        const dateOnly = fechaVencimiento ? fechaVencimiento.split('T')[0] : '';
        const vencida = estado !== 'pagada' && new Date(dateOnly + 'T23:59:59') < new Date();

        if (estado === 'pagada') {
            return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">{__('Pagada')}</Badge>;
        }
        if (vencida || estado === 'vencida') {
            return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20 font-bold">{__('Vencida')}</Badge>;
        }
        if (estado === 'parcial') {
            return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20">{__('Abono Parcial')}</Badge>;
        }
        return <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{__('Pendiente')}</Badge>;
    };

    const getEstadoCreditoBadge = (estado: string) => {
        switch (estado) {
            case 'activo':
                return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-bold text-sm px-3 py-1">{__('Crédito Activo')}</Badge>;
            case 'liquidado':
                return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20 font-bold text-sm px-3 py-1">{__('Liquidado / Pagado')}</Badge>;
            case 'en_mora':
                return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20 font-bold text-sm px-3 py-1">{__('En Mora')}</Badge>;
            default:
                return <Badge variant="outline" className="text-sm px-3 py-1">{estado}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <Head title={__('Expediente de Crédito: :codigo', { codigo: credito.codigo_credito })} />

            <Breadcrumbs
                breadcrumbs={[
                    { title: __('Dashboard'), href: '/admin/dashboard' },
                    { title: __('Ventas a Crédito'), href: '/admin/creditos' },
                    { title: credito.codigo_credito, href: `/admin/creditos/${credito.id}` },
                ]}
            />

            {/* Cabecera del Expediente */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-2xl font-black text-slate-900 dark:text-slate-100">
                            {credito.codigo_credito}
                        </span>
                        {getEstadoCreditoBadge(credito.estado)}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        {__('Originado el :fecha • Sucursal: :sucursal • Vendedor: :vendedor', {
                            fecha: formatDate(credito.fecha_inicio, 'medium', currentLocale),
                            sucursal: credito.sucursal?.nombre || __('Principal'),
                            vendedor: credito.vendedor?.name || __('Sistema'),
                        })}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/admin/creditos">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="size-4 mr-1" /> {__('Volver al Listado')}
                        </Button>
                    </Link>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.print()}
                        className="h-9 gap-1.5"
                    >
                        <Printer className="size-4" /> {__('Imprimir Contrato')}
                    </Button>
                </div>
            </div>

            {/* Tarjetas de Métricas del Crédito */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 uppercase">{__('Total Financiado')}</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                        {currency}{Number(credito.total_credito).toFixed(2)}
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">{__('Monto total en cuotas')}</span>
                </Card>

                <Card className="p-4 border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 uppercase">{__('Inicial Cobrada')}</span>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                        {currency}{Number(credito.monto_inicial).toFixed(2)}
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">{__('Pagado al retirar el equipo')}</span>
                </Card>

                <Card className="p-4 border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 uppercase">{__('Cobrado a la Fecha')}</span>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                        {currency}{totalRecaudado.toFixed(2)}
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">{__('Inicial + cuotas canceladas')}</span>
                </Card>

                <Card className="p-4 border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 uppercase">{__('Saldo Pendiente')}</span>
                    <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                        {currency}{Number(credito.saldo_pendiente).toFixed(2)}
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">{__('Por cobrar para liquidar')}</span>
                </Card>
            </div>

            {/* Ficha del Cliente y del Dispositivo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <User className="size-4 text-blue-600" /> {__('Titular del Crédito')}
                        </CardTitle>
                        <Link href={`/admin/clientes/${credito.cliente?.id}`} className="text-xs text-blue-600 hover:underline">
                            {__('Ver Perfil Completo')}
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">{__('Nombre Completo:')}</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                                {credito.cliente?.nombres} {credito.cliente?.apellidos}
                            </span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">{__('Documento de Identidad:')}</span>
                            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                {credito.cliente?.tipo_documento}-{credito.cliente?.numero_documento}
                            </span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">{__('WhatsApp / Contacto:')}</span>
                            <a
                                href={`https://wa.me/${credito.cliente?.telefono_principal.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-emerald-600 flex items-center gap-1 hover:underline"
                            >
                                {credito.cliente?.telefono_principal} <ExternalLink className="size-3" />
                            </a>
                        </div>
                        <div className="py-1.5">
                            <span className="text-slate-500 block mb-1">{__('Dirección:')}</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                                {credito.cliente?.direccion || __('No especificada')}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Smartphone className="size-4 text-emerald-600" /> {__('Dispositivo Adquirido')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">{__('Modelo:')}</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                                {credito.equipo?.modelo?.marca?.nombre} {credito.equipo?.modelo?.nombre}
                            </span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">{__('Especificaciones:')}</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                                {credito.equipo?.modelo?.almacenamiento} • {__('Color:')} {credito.equipo?.color || __('N/D')}
                            </span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">{__('IMEI 1 (Principal):')}</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                {credito.equipo?.imei_1}
                            </span>
                        </div>
                        {credito.equipo?.imei_2 && (
                            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500">{__('IMEI 2 (Secundario):')}</span>
                                <span className="font-mono text-slate-600 dark:text-slate-400">
                                    {credito.equipo?.imei_2}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between py-1.5">
                            <span className="text-slate-500">{__('Plan Asignado:')}</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400">
                                {credito.plan?.nombre} ({__(':count cuotas', { count: credito.plan?.numero_cuotas })})
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Cronograma de Amortización y Cobro de Cuotas */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Receipt className="size-4 text-purple-600" /> {__('Tabla de Amortización y Cronograma de Pagos')}
                        </CardTitle>
                        <p className="text-xs text-slate-500 mt-1">
                            {__('Monitoreo de vencimientos y recepción de pagos de cada cuota del crédito.')}
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3.5">{__('# Cuota')}</th>
                                    <th className="px-4 py-3.5">{__('Fecha Vencimiento')}</th>
                                    <th className="px-4 py-3.5">{__('Monto Cuota')}</th>
                                    <th className="px-4 py-3.5">{__('Monto Pagado')}</th>
                                    <th className="px-4 py-3.5 font-bold text-rose-600 dark:text-rose-400">{__('Saldo Pendiente')}</th>
                                    <th className="px-4 py-3.5">{__('Estado')}</th>
                                    <th className="px-4 py-3.5">{__('Fecha Pago / Ref')}</th>
                                    <th className="px-4 py-3.5 text-right">{__('Acción')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {cuotas.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                                            {__('Cuota #:numero', { numero: c.numero_cuota })}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                            {formatDate(c.fecha_vencimiento, 'short', currentLocale)}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                                            {currency}{Number(c.monto_cuota).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">
                                            {currency}{Number(c.monto_pagado).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 font-extrabold text-rose-600 dark:text-rose-400">
                                            {currency}{Number(c.saldo_cuota).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getCuotaBadge(c.estado, c.fecha_vencimiento)}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            {c.fecha_pago ? (
                                                <div>
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDate(c.fecha_pago, 'short', currentLocale)}</span>
                                                    <span className="text-[11px] block text-slate-400 uppercase">{c.metodo_pago} {c.referencia_pago && `• Ref: ${c.referencia_pago}`}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {c.estado !== 'pagada' ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() => openPaymentModal(c)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-8 text-xs gap-1"
                                                >
                                                    <DollarSign className="size-3.5" /> {__('Cobrar Cuota')}
                                                </Button>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                                                    <Check className="size-3.5" /> {__('Liquidada')}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Modal de Cobro de Cuota */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="max-w-xl sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {__('Registrar Pago: Cuota #:numero', { numero: payingCuota?.numero_cuota })}
                        </DialogTitle>
                        <DialogDescription>
                            {__('Registra el abono o cancelación total de la cuota correspondiente a :codigo.', {
                                codigo: credito.codigo_credito,
                            })}
                        </DialogDescription>
                    </DialogHeader>

                    {payingCuota && (
                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{__('Monto total de la cuota:')}</span>
                                    <span className="font-bold">{currency}{Number(payingCuota.monto_cuota).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{__('Saldo pendiente actual:')}</span>
                                    <span className="font-extrabold text-rose-600">{currency}{Number(payingCuota.saldo_cuota).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{__('Fecha límite de vencimiento:')}</span>
                                    <span className="font-semibold">{formatDate(payingCuota.fecha_vencimiento, 'medium', currentLocale)}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>{__('Monto a Cobrar (:currency) *', { currency })}</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={Number(payingCuota.saldo_cuota)}
                                    required
                                    value={paymentForm.data.monto}
                                    onChange={(e) => paymentForm.setData('monto', e.target.value)}
                                    className="font-black text-lg text-emerald-600"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>{__('Método de Pago *')}</Label>
                                    <Select
                                        value={paymentForm.data.metodo_pago}
                                        onValueChange={(val) => paymentForm.setData('metodo_pago', val)}
                                    >
                                        <SelectTrigger className="w-full h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="efectivo">{__('Efectivo')}</SelectItem>
                                            <SelectItem value="pago_movil">{__('Pago Móvil')}</SelectItem>
                                            <SelectItem value="transferencia">{__('Transferencia')}</SelectItem>
                                            <SelectItem value="tarjeta">{__('Tarjeta / Punto')}</SelectItem>
                                            <SelectItem value="zelle">{__('Zelle')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>{__('Fecha del Pago *')}</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={paymentForm.data.fecha_pago}
                                        onChange={(e) => paymentForm.setData('fecha_pago', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>{__('N° de Referencia / Comprobante')}</Label>
                                <Input
                                    placeholder={__('Ej. 12345678')}
                                    value={paymentForm.data.referencia_pago}
                                    onChange={(e) => paymentForm.setData('referencia_pago', e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>{__('Notas del Pago')}</Label>
                                <Textarea
                                    placeholder={__('Observaciones sobre el pago recibido...')}
                                    value={paymentForm.data.notas}
                                    onChange={(e) => paymentForm.setData('notas', e.target.value)}
                                    rows={2}
                                />
                            </div>

                            <DialogFooter className="pt-3 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                                    {__('Cancelar')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={paymentForm.processing}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                >
                                    {paymentForm.processing ? __('Registrando...') : __('Confirmar Cobro')}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

