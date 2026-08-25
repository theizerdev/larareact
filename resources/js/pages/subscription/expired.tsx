import { Head, useForm, usePage } from '@inertiajs/react';
import { ShieldAlert, CreditCard, Upload, CheckCircle2, Lock, Zap, Plus, Minus } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';
import { PayPalButtonComponent } from '@/components/paypal-button';

interface EmpresaInfo {
    id: number;
    razon_social: string;
    subscription_status: string;
    trial_ends_at: string | null;
    subscription_expires_at: string | null;
    dias_restantes: number;
    estado_legible: string;
    is_exempt: boolean;
    billing_cycle?: string | null;
    max_sucursales: number;
    sucursales_activas: number;
}

interface PlanOption {
    meses: number;
    subtotal_plan: number;
    precio_mensual_promedio: number;
    total: number;
}

interface PlanInfo {
    id: number;
    nombre: string;
    descripcion: string;
    precio_regular_mensual?: number;
    precio_promocional_mensual?: number;
    tiene_promocion?: boolean;
    badge_promocion?: string | null;
    destacado?: boolean;
    precio_3_meses?: number;
    precio_6_meses?: number;
    precio_12_meses?: number;
    precio_sucursal_extra_mensual?: number;
    sucursales_incluidas?: number;
}

interface PaymentGatewayInfo {
    active: boolean;
    mode: string;
    client_id?: string;
    public_key?: string;
    publishable_key?: string;
}

interface PageProps {
    empresa: EmpresaInfo | null;
    plan: PlanInfo | null;
    planes?: PlanInfo[];
    opcionesPrecios: Record<number, PlanOption>;
    bcvRate?: number;
    paymentGateways?: {
        paypal: PaymentGatewayInfo;
        mercadopago: PaymentGatewayInfo;
        stripe: PaymentGatewayInfo;
    };
}

export default function SubscriptionExpired({ empresa, plan, planes = [], opcionesPrecios, bcvRate = 36.50, paymentGateways }: PageProps) {
    const { __ } = useTranslate();
    const pageProps = usePage().props as any;
    const { currencySymbol = '$', isVenezuela = false } = pageProps;

    const activePlanes = planes.length > 0 ? planes : (plan ? [plan] : []);
    const [selectedPlanId, setSelectedPlanId] = useState<number>(plan?.id || activePlanes[0]?.id || 1);
    const [selectedCycle] = useState<number>(1);
    const [extraSucursales, setExtraSucursales] = useState<number>(Math.max(1, empresa?.max_sucursales ?? 1, empresa?.sucursales_activas ?? 1));
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    const currentPlan = activePlanes.find(p => p.id === selectedPlanId) || plan || activePlanes[0];

    const getPlanMonthlyPrice = (p: PlanInfo | null) => {
        if (!p) return 149;
        if (p.tiene_promocion && Number(p.precio_promocional_mensual) > 0) {
            return Number(p.precio_promocional_mensual);
        }
        return Number(p.precio_regular_mensual) || Number(p.precio_3_meses) || 149;
    };

    const precioSucursalExtra = (currentPlan?.precio_sucursal_extra_mensual && currentPlan.precio_sucursal_extra_mensual > 0)
        ? currentPlan.precio_sucursal_extra_mensual
        : 84.72;
    const currentSubtotal = getPlanMonthlyPrice(currentPlan);
    const sucursalesExtrasCount = Math.max(0, extraSucursales - (currentPlan?.sucursales_incluidas ?? 1));
    const costoExtraSucursales = sucursalesExtrasCount * precioSucursalExtra;
    const precioFinalEstimado = currentSubtotal + costoExtraSucursales;

    const formatPrice = (usdAmount: number) => {
        if (isVenezuela) {
            const bsAmount = usdAmount * bcvRate;
            return `Bs. ${bsAmount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `$${usdAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        plan_id: selectedPlanId,
        ciclo_meses: 1,
        sucursales_contratadas: extraSucursales,
        metodo_pago: 'transferencia',
        referencia_pago: '',
        comprobante: null as File | null,
        notas: '',
    });

    const handlePlanChange = (planId: number) => {
        setSelectedPlanId(planId);
        setData('plan_id', planId);
    };

    const handleSucursalChange = (count: number) => {
        const val = Math.max(1, count);
        setExtraSucursales(val);
        setData('sucursales_contratadas', val);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('comprobante', file);
        if (file && file.type.startsWith('image/')) {
            setImagePreviewUrl(URL.createObjectURL(file));
        } else {
            setImagePreviewUrl(null);
        }
    };

    const handleSubmitRenewal = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/monitoring/subscription/renew', {
            onSuccess: () => {
                reset('referencia_pago', 'comprobante', 'notas');
                setImagePreviewUrl(null);
            },
        });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
            <Head title={__('Suscripción Vencida')} />

            {/* Header Alerta */}
            <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 mb-1">
                    <Lock className="h-8 w-8" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                    {__('Período de Prueba o Suscripción Caducado')}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm">
                    {__('El acceso a los módulos operativos de')} <strong>{empresa?.razon_social}</strong> {__('ha sido pausado. Selecciona un plan de renovación para reactivar el servicio inmediatamente.')}
                </p>
            </div>

            {/* Formulario de Renovación */}
            <Card className="shadow-md border-red-200 dark:border-red-950/60 overflow-hidden">
                <CardHeader className="pb-4 bg-muted/30 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        {__('Selecciona tu Plan de Renovación')}
                    </CardTitle>
                    <CardDescription className="text-xs">
                        {__('Tus datos y registros se encuentran resguardados de forma 100% segura.')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmitRenewal} className="space-y-6">
                        {/* 1. Selecciona el Plan Mensual */}
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" />
                                {__('1. Selecciona tu Plan de Renovación')}
                            </Label>
                            <div className="grid gap-6 sm:grid-cols-3">
                                {(activePlanes.length > 0 ? activePlanes.filter(p => !p.nombre.toLowerCase().includes('prueba') || p.id === selectedPlanId) : [currentPlan]).map((pItem) => {
                                    const isSelected = selectedPlanId === pItem.id;
                                    const regularMensual = Number(pItem.precio_regular_mensual) || Number(pItem.precio_3_meses) || 149;
                                    const promoMensual = Number(pItem.precio_promocional_mensual) || regularMensual;
                                    const tienePromo = Boolean(pItem.tiene_promocion) && promoMensual < regularMensual && promoMensual > 0;
                                    const precioMostrar = tienePromo ? promoMensual : regularMensual;
                                    const ahorro = regularMensual > 0 ? Math.round(((regularMensual - promoMensual) / regularMensual) * 100) : 0;

                                    return (
                                        <div
                                            key={pItem.id}
                                            onClick={() => handlePlanChange(pItem.id)}
                                            className={`cursor-pointer rounded-2xl border-2 p-5 transition-all relative flex flex-col justify-between ${isSelected
                                                    ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20 scale-[1.02]'
                                                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 bg-card'
                                                }`}
                                        >
                                            {pItem.destacado ? (
                                                <Badge className="absolute -top-3 right-4 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 shadow-sm">
                                                    {__('⭐ Más Popular')}
                                                </Badge>
                                            ) : tienePromo ? (
                                                <Badge className="absolute -top-3 right-4 bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 shadow-sm">
                                                    -{ahorro}% OFF
                                                </Badge>
                                            ) : null}

                                            <div className="space-y-2">
                                                <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{pItem.nombre}</span>
                                                <p className="text-xs text-muted-foreground min-h-[32px]">{pItem.descripcion || __('Acceso a la plataforma FixSale.')}</p>
                                                <div className="pt-2">
                                                    {tienePromo && (
                                                        <span className="text-xs text-muted-foreground line-through font-semibold block">
                                                            {formatPrice(regularMensual)} / {__('mes')}
                                                        </span>
                                                    )}
                                                    <h3 className="text-3xl font-black text-foreground">
                                                        {formatPrice(precioMostrar)} <span className="text-xs font-semibold text-muted-foreground">/ {__('mes')}</span>
                                                    </h3>
                                                    <p className="text-[11px] font-medium text-primary mt-0.5">
                                                        {__('Facturación Mensual Recurrente')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t space-y-2">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase">{__('Incluye:')}</span>
                                                <ul className="space-y-1.5 text-xs">
                                                    <li className="flex items-start gap-2 text-foreground font-medium">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                        <span className="leading-tight">{pItem.sucursales_incluidas || 1} {__('Sucursal(es) incluida(s)')}</span>
                                                    </li>
                                                    <li className="flex items-start gap-2 text-foreground font-medium">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                        <span className="leading-tight">{__('Sucursal extra: ')}{formatPrice(pItem.precio_sucursal_extra_mensual || 84.72)}/{__('mes')}</span>
                                                    </li>
                                                    <li className="flex items-start gap-2 text-foreground font-medium">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                        <span className="leading-tight">{__('Acceso a todos los módulos')}</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Sucursales & Resumen de Inversión */}
                        <div className="grid gap-6 md:grid-cols-2 pt-4 border-t">
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    {__('2. Cantidad de Sucursales a Contratar')}
                                </Label>
                                <div className="p-4 bg-muted/30 rounded-xl border space-y-3">
                                    <p className="text-xs text-muted-foreground">
                                        {__('El plan base incluye')} <strong>{currentPlan?.sucursales_incluidas ?? 1} {__('sucursal(es)')}</strong>. {__('Cada sucursal adicional suma +')}
                                        <strong className="text-primary font-bold">
                                            {formatPrice(precioSucursalExtra)}/{__('mes')}
                                        </strong>.
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleSucursalChange(extraSucursales - 1)}
                                            disabled={extraSucursales <= 1}
                                            className="h-10 w-10 rounded-lg"
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>

                                        <Input
                                            type="number"
                                            min={1}
                                            max={50}
                                            value={extraSucursales}
                                            onChange={(e) => handleSucursalChange(parseInt(e.target.value) || 1)}
                                            className="text-center font-bold text-lg h-10 w-24"
                                        />

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleSucursalChange(extraSucursales + 1)}
                                            className="h-10 w-10 rounded-lg"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>

                                        <span className="text-xs text-muted-foreground font-medium">
                                            {extraSucursales <= (currentPlan?.sucursales_incluidas ?? 1)
                                                ? `${currentPlan?.sucursales_incluidas ?? 1} ${__('Sucursal(es) Incluida(s)')}`
                                                : `+${sucursalesExtrasCount} ${__('sucursal(es) extra')}`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Resumen Card */}
                            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg flex flex-col justify-between relative overflow-hidden border border-slate-800">
                                <div className="space-y-3 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{__('Resumen de Inversión')}</span>
                                        <div className="flex items-center gap-2">
                                            {isVenezuela && (
                                                <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-300 bg-amber-500/10">
                                                    Tasa BCV: Bs. {bcvRate.toFixed(2)} / USD
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">
                                                {__('Cobro Mensual')}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 text-xs text-slate-300">
                                        <div className="flex justify-between">
                                            <span>{currentPlan?.nombre || __('Plan Mensual')} (1 {__('mes')}):</span>
                                            <span className="font-mono font-semibold">{formatPrice(currentSubtotal)}</span>
                                        </div>
                                        {sucursalesExtrasCount > 0 && (
                                            <div className="flex justify-between text-indigo-300">
                                                <span>{sucursalesExtrasCount} {__('Sucursal(es) Extra')}:</span>
                                                <span className="font-mono font-semibold">+{formatPrice(costoExtraSucursales)}</span>
                                            </div>
                                        )}
                                        {isVenezuela && (
                                            <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                                                <span>Equivalente en Dólares USD:</span>
                                                <span className="font-mono">${precioFinalEstimado.toFixed(2)} USD</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-800 mt-4 flex items-baseline justify-between relative z-10">
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium">
                                            {isVenezuela ? __('Total a Transferir (Bolívares):') : __('Total a Transferir:')}
                                        </p>
                                        <p className="text-3xl font-black font-mono text-emerald-400">
                                            {formatPrice(precioFinalEstimado)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Registro del Pago y Pasarelas Online */}
                        <div className="space-y-4 pt-4 border-t">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                {__('3. Registro del Pago y Comprobante')}
                            </Label>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="metodo_pago" className="text-xs font-semibold">{__('Método de Pago Utilizado')}</Label>
                                    <Select
                                        value={data.metodo_pago}
                                        onValueChange={(val) => setData('metodo_pago', val)}
                                    >
                                        <SelectTrigger id="metodo_pago" className="mt-1 h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="transferencia">{__('Transferencia Bancaria (Manual)')}</SelectItem>
                                            <SelectItem value="pago_movil">{__('Pago Móvil (Bolívares)')}</SelectItem>
                                            <SelectItem value="zelle">{__('Zelle / Transferencia USD')}</SelectItem>
                                            {paymentGateways?.paypal?.active && (
                                                <SelectItem value="paypal">💳 {__('PayPal (Checkout en línea)')}</SelectItem>
                                            )}
                                            {paymentGateways?.mercadopago?.active && (
                                                <SelectItem value="mercadopago">⚡ {__('Mercado Pago (Tarjeta / Dinero MP)')}</SelectItem>
                                            )}
                                            {paymentGateways?.stripe?.active && (
                                                <SelectItem value="stripe">🔒 {__('Stripe (Tarjeta de Crédito / Débito)')}</SelectItem>
                                            )}
                                            <SelectItem value="efectivo">{__('Efectivo / Depósito en Ventanilla')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="referencia" className="text-xs font-semibold">{__('Número de Referencia')}</Label>
                                    <Input
                                        id="referencia"
                                        placeholder={__('Ej: 987654321')}
                                        value={data.referencia_pago}
                                        onChange={(e) => setData('referencia_pago', e.target.value)}
                                        className="mt-1 h-10"
                                    />
                                </div>

                                {data.metodo_pago === 'paypal' && (
                                    <div className="sm:col-span-2 p-5 bg-amber-50/70 dark:bg-amber-950/20 text-slate-900 dark:text-slate-100 rounded-xl border border-amber-200 dark:border-amber-900/40 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                                <Zap className="h-4 w-4 text-amber-600" />
                                                {__('Checkout Directo con PayPal')}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-mono font-bold text-xs">
                                                    Total: ${precioFinalEstimado.toFixed(2)} USD
                                                </Badge>
                                                <Badge variant="outline" className="text-[10px] border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-950/40">
                                                    {__('Acreditación Instantánea')}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground leading-relaxed flex items-center justify-between border-t border-b border-amber-200/60 dark:border-amber-900/30 py-2 my-1">
                                            <span>{__('Plan Seleccionado:')} <strong className="text-slate-800 dark:text-slate-200">{currentPlan?.nombre || __('Plan Mensual')} ({extraSucursales} {extraSucursales === 1 ? __('sucursal') : __('sucursales')})</strong></span>
                                            <span className="font-bold font-mono text-amber-800 dark:text-amber-300 text-sm">${precioFinalEstimado.toFixed(2)} USD</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {__('Haz clic en el botón oficial de PayPal a continuación para procesar el cobro exacto de')} <strong>${precioFinalEstimado.toFixed(2)} USD</strong>.
                                        </p>

                                        {paymentGateways?.paypal?.client_id ? (
                                            <PayPalButtonComponent
                                                clientId={paymentGateways.paypal.client_id}
                                                selectedCycle={selectedCycle}
                                                extraSucursales={extraSucursales}
                                                __={__}
                                            />
                                        ) : (
                                            <div className="p-3 rounded bg-amber-500/20 text-amber-300 text-xs border border-amber-500/30">
                                                {__('Las credenciales de PayPal están en configuración. Puedes realizar tu pago por transferencia bancaria o contactar soporte.')}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {['mercadopago', 'stripe'].includes(data.metodo_pago) && (
                                    <div className="sm:col-span-2 p-3 bg-sky-50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-300 rounded-lg border border-sky-200 dark:border-sky-900 text-xs flex items-center gap-2">
                                        <Zap className="h-4 w-4 shrink-0 text-sky-600" />
                                        <span>{__('Has seleccionado una pasarela de pago en línea. Al enviar la solicitud, serás redirigido o se activará el checkout automático con acreditación instantánea.')}</span>
                                    </div>
                                )}

                                {data.metodo_pago !== 'paypal' && (
                                    <div className="sm:col-span-2">
                                        <Label htmlFor="comprobante" className="text-xs font-semibold">
                                            {['mercadopago', 'stripe'].includes(data.metodo_pago)
                                                ? __('Adjuntar Comprobante (Opcional para Pago Online)')
                                                : __('Adjuntar Captura / Comprobante (Imagen o PDF)')
                                            }
                                        </Label>
                                        <Input
                                            id="comprobante"
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={handleFileChange}
                                            className="mt-1 cursor-pointer h-10 pt-1.5"
                                        />
                                        {imagePreviewUrl && (
                                            <div className="mt-3 p-2 bg-muted rounded-lg border w-32 h-32 relative">
                                                <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover rounded" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {data.metodo_pago !== 'paypal' && (
                            <Button
                                type="submit"
                                disabled={processing}
                                size="lg"
                                className="w-full sm:w-auto gap-2 font-bold px-8 shadow-md h-11"
                            >
                                <Upload className="h-5 w-5" />
                                {processing ? __('Enviando...') : __('Enviar Solicitud de Renovación')}
                            </Button>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

import AdminLayout from '@/layouts/admin-layout';

SubscriptionExpired.layout = (page: React.ReactNode) => (
    <AdminLayout breadcrumbs={[{ title: 'Suscripción Vencida', href: '#' }]}>{page}</AdminLayout>
);
