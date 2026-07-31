import { Head, useForm, usePage } from '@inertiajs/react';
import {
    CreditCard,
    CheckCircle2,
    Clock,
    ShieldAlert,
    Store,
    AlertTriangle,
    Upload,
    Calendar,
    Zap,
    Sparkles,
    Building2,
    Eye,
    FileCheck,
    HelpCircle,
    ArrowRight,
    Plus,
    Minus,
    Receipt,
    ExternalLink,
    Check
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';

interface EmpresaInfo {
    id: number;
    razon_social: string;
    subscription_status: string;
    trial_ends_at: string | null;
    subscription_expires_at: string | null;
    dias_restantes: number;
    estado_legible: string;
    is_exempt: boolean;
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
    precio_3_meses: number;
    precio_6_meses: number;
    precio_12_meses: number;
    precio_sucursal_extra_mensual: number;
    sucursales_incluidas: number;
    modulos_incluidos: string[];
}

interface PagoItem {
    id: number;
    monto: number;
    ciclo_meses: number;
    sucursales_contratadas: number;
    metodo_pago: string;
    referencia_pago: string | null;
    comprobante_path: string | null;
    estado: string;
    created_at: string;
    user?: { name: string };
}

interface PageProps {
    empresa: EmpresaInfo;
    plan: PlanInfo | null;
    opcionesPrecios: Record<number, PlanOption>;
    pagos: PagoItem[];
}

export default function SubscriptionIndex({ empresa, plan, opcionesPrecios, pagos }: PageProps) {
    const { __ } = useTranslate();
    const { currencySymbol = '$' } = usePage().props as any;

    const [selectedCycle, setSelectedCycle] = useState<number>(12); // 12 meses por defecto para máximo descuento
    const [extraSucursales, setExtraSucursales] = useState<number>(Math.max(1, empresa.sucursales_activas));
    const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    const currentOption = opcionesPrecios[selectedCycle] || opcionesPrecios[12];
    
    // Cálculo dinámico de sucursales extras e inversión final
    const sucursalesExtrasCount = Math.max(0, extraSucursales - (plan?.sucursales_incluidas ?? 1));
    const costoExtraSucursales = sucursalesExtrasCount * (plan?.precio_sucursal_extra_mensual ?? 10) * selectedCycle;
    const precioFinalEstimado = (currentOption?.subtotal_plan ?? 0) + costoExtraSucursales;

    const { data, setData, post, processing, errors, reset } = useForm({
        ciclo_meses: selectedCycle,
        sucursales_contratadas: extraSucursales,
        metodo_pago: 'transferencia',
        referencia_pago: '',
        comprobante: null as File | null,
        notas: '',
    });

    const handleCycleChange = (cycle: number) => {
        setSelectedCycle(cycle);
        setData('ciclo_meses', cycle);
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

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Configuración'), href: '#' },
        { title: __('Suscripción'), href: '/admin/monitoring/subscription' },
    ];

    // Porcentaje de días restantes para la barra de progreso
    const maxDays = empresa.subscription_status === 'trial' ? 7 : 365;
    const progressPercent = Math.min(100, Math.max(0, (empresa.dias_restantes / maxDays) * 100));

    return (
        <>
            <Head title={__('Gestión de Suscripción')} />
            <div className="space-y-8 pb-10">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header Premium */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 space-y-1">
                        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                            <Sparkles className="h-4 w-4" />
                            {__('Plan SaaS Full Access')}
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            {__('Estado del Servicio y Suscripción')}
                        </h1>
                        <p className="text-slate-300 text-sm max-w-2xl">
                            {__('Administra tu plan empresarial, renovaciones, capacidad de sucursales e historial de comprobantes de pago.')}
                        </p>
                    </div>

                    <div className="relative z-10 flex items-center gap-3">
                        <Badge 
                            variant="outline" 
                            className={`px-4 py-2 text-xs font-bold gap-2 rounded-full backdrop-blur-md border ${
                                empresa.is_exempt 
                                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
                                    : empresa.subscription_status === 'active'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : empresa.subscription_status === 'trial'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}
                        >
                            <span className={`h-2 w-2 rounded-full animate-pulse ${
                                empresa.is_exempt ? 'bg-indigo-400' :
                                empresa.subscription_status === 'active' ? 'bg-emerald-400' :
                                empresa.subscription_status === 'trial' ? 'bg-amber-400' : 'bg-rose-400'
                            }`} />
                            {empresa.estado_legible}
                        </Badge>
                    </div>
                </div>

                {/* Grid de Estado & Características Incluidas */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Card de Estado Principal */}
                    <Card className="md:col-span-2 shadow-md border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
                        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 pb-4">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                <div>
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                        {empresa.razon_social}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {__('Plan Actual:')} <span className="font-semibold text-foreground">{plan?.nombre || 'Plan Full SaaS'}</span>
                                    </CardDescription>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-muted-foreground">{__('Capacidad Autorizada')}</span>
                                    <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                                        {empresa.sucursales_activas} / {empresa.max_sucursales} {__('Sucursal(es)')}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-3 bg-slate-100/60 dark:bg-slate-900 rounded-xl border">
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase">{__('Estado')}</p>
                                    <p className="text-base font-bold capitalize mt-1 text-slate-800 dark:text-slate-200">
                                        {empresa.is_exempt ? __('Exento (Owner)') : empresa.subscription_status}
                                    </p>
                                </div>
                                <div className="p-3 bg-slate-100/60 dark:bg-slate-900 rounded-xl border">
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase">{__('Días Restantes')}</p>
                                    <p className="text-base font-bold mt-1 text-indigo-600 dark:text-indigo-400">
                                        {empresa.is_exempt ? '∞' : `${empresa.dias_restantes} días`}
                                    </p>
                                </div>
                                <div className="p-3 bg-slate-100/60 dark:bg-slate-900 rounded-xl border">
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase">{__('Vencimiento')}</p>
                                    <p className="text-xs font-bold mt-1">
                                        {empresa.is_exempt ? __('Permanente') : (
                                            empresa.subscription_expires_at 
                                                ? new Date(empresa.subscription_expires_at).toLocaleDateString()
                                                : empresa.trial_ends_at 
                                                ? new Date(empresa.trial_ends_at).toLocaleDateString()
                                                : __('Indefinido')
                                        )}
                                    </p>
                                </div>
                                <div className="p-3 bg-slate-100/60 dark:bg-slate-900 rounded-xl border">
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase">{__('Sucursales en Uso')}</p>
                                    <p className="text-base font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                                        {empresa.sucursales_activas} {__('activas')}
                                    </p>
                                </div>
                            </div>

                            {/* Barra de Progreso de Días Restantes */}
                            {!empresa.is_exempt && (
                                <div className="space-y-1.5 pt-2">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-muted-foreground">{__('Vigencia del Período')}</span>
                                        <span className={empresa.dias_restantes <= 5 ? 'text-rose-500 font-bold' : 'text-indigo-600'}>
                                            {empresa.dias_restantes} {__('días restantes')}
                                        </span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-500 rounded-full ${
                                                empresa.dias_restantes <= 3 ? 'bg-rose-500' :
                                                empresa.dias_restantes <= 7 ? 'bg-amber-500' : 'bg-indigo-600'
                                            }`}
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Módulos Incluidos */}
                    <Card className="shadow-md border border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-br from-white via-indigo-50/20 to-white dark:from-slate-900 dark:to-slate-950">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                                <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                                {__('Módulos Incluidos (Plan Full)')}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {__('Todo el ecosistema de Servitec a tu disposición:')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2.5 text-xs">
                                {[
                                    __('Terminal de Venta POS & Tickets'),
                                    __('Control de Inventario y Kardex'),
                                    __('Cajas Chicas y Arqueos Diarios'),
                                    __('Gestión de Clientes y Créditos'),
                                    __('Ordenes de Servicios y Equipos'),
                                    __('Integración WhatsApp & Reportes'),
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                                        <span className="h-4 w-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Formulario de Renovación / Selección de Período */}
                {!empresa.is_exempt && (
                    <Card className="shadow-lg border-2 border-indigo-100 dark:border-indigo-900/60 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-indigo-900/10 border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
                                    <Calendar className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold">
                                        {__('Renovar o Ampliar Suscripción')}
                                    </CardTitle>
                                    <CardDescription>
                                        {__('Elige la duración de tu plan y ajusta las sucursales requeridas para tu negocio.')}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmitRenewal} className="space-y-8">
                                {/* 1. Duración del Plan */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        <span className="h-5 w-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                                        {__('Selecciona la Duración del Servicio')}
                                    </Label>
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        {[3, 6, 12].map((meses) => {
                                            const opt = opcionesPrecios[meses];
                                            const isSelected = selectedCycle === meses;
                                            return (
                                                <div 
                                                    key={meses}
                                                    onClick={() => handleCycleChange(meses)}
                                                    className={`cursor-pointer rounded-2xl border-2 p-5 transition-all relative flex flex-col justify-between ${
                                                        isSelected 
                                                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-md ring-2 ring-indigo-600/20'
                                                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                                                    }`}
                                                >
                                                    {meses === 12 && (
                                                        <Badge className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 shadow">
                                                            {__('🔥 Mejor Opción - 20% Dcto')}
                                                        </Badge>
                                                    )}
                                                    {meses === 6 && (
                                                        <Badge className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 shadow">
                                                            {__('Ahorra 10%')}
                                                        </Badge>
                                                    )}

                                                    <div>
                                                        <span className="text-xs font-semibold text-muted-foreground uppercase">{meses} {__('Meses de Acceso')}</span>
                                                        <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                                                            {currencySymbol}{opt?.subtotal_plan.toFixed(2)}
                                                        </h3>
                                                    </div>

                                                    <div className="mt-4 pt-3 border-t text-xs text-muted-foreground flex justify-between items-center">
                                                        <span>{__('Promedio mensual:')}</span>
                                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                                            {currencySymbol}{opt?.precio_mensual_promedio.toFixed(2)}/{__('mes')}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 2. Selección de Sucursales & Resumen Financiero */}
                                <div className="grid gap-6 md:grid-cols-2 pt-4 border-t">
                                    <div className="space-y-4">
                                        <Label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                            <span className="h-5 w-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                                            {__('Cantidad de Sucursales a Contratar')}
                                        </Label>
                                        
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border space-y-3">
                                            <p className="text-xs text-muted-foreground">
                                                {__('El plan base incluye 1 sucursal. Cada sucursal adicional suma +')}
                                                <strong className="text-indigo-600 dark:text-indigo-400">
                                                    {currencySymbol}{(plan?.precio_sucursal_extra_mensual ?? 10).toFixed(2)}/{__('mes')}
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
                                                    {extraSucursales === 1 ? __('1 Sucursal Incluida') : `${extraSucursales - 1} sucursal(es) extra`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Resumen de Tarifas Sticky Card */}
                                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">{__('Resumen de Inversión')}</span>
                                                <Badge variant="outline" className="text-[10px] border-indigo-400/30 text-indigo-300">
                                                    {selectedCycle} {__('Meses')}
                                                </Badge>
                                            </div>

                                            <div className="space-y-1.5 text-xs text-slate-300">
                                                <div className="flex justify-between">
                                                    <span>Plan Full ({selectedCycle} meses):</span>
                                                    <span className="font-mono font-semibold">{currencySymbol}{currentOption?.subtotal_plan.toFixed(2)}</span>
                                                </div>
                                                {sucursalesExtrasCount > 0 && (
                                                    <div className="flex justify-between text-indigo-300">
                                                        <span>{sucursalesExtrasCount} {__('Sucursal(es) Extra')}:</span>
                                                        <span className="font-mono font-semibold">+{currencySymbol}{costoExtraSucursales.toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-indigo-800/80 mt-4 flex items-baseline justify-between">
                                            <div>
                                                <p className="text-xs text-slate-400 font-medium">{__('Total a Transferir:')}</p>
                                                <p className="text-3xl font-black font-mono text-emerald-400">
                                                    {currencySymbol}{precioFinalEstimado.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Datos del Pago */}
                                <div className="space-y-4 pt-4 border-t">
                                    <Label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        <span className="h-5 w-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                                        {__('Registro del Pago y Comprobante')}
                                    </Label>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="metodo_pago" className="text-xs font-semibold">{__('Método de Pago Utilizado')}</Label>
                                            <Select 
                                                value={data.metodo_pago}
                                                onValueChange={(val) => setData('metodo_pago', val)}
                                            >
                                                <SelectTrigger id="metodo_pago" className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="transferencia">{__('Transferencia Bancaria')}</SelectItem>
                                                    <SelectItem value="pago_movil">{__('Pago Móvil')}</SelectItem>
                                                    <SelectItem value="zelle">{__('Zelle')}</SelectItem>
                                                    <SelectItem value="efectivo">{__('Efectivo / Depósito')}</SelectItem>
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
                                                className="mt-1"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <Label htmlFor="comprobante" className="text-xs font-semibold">{__('Adjuntar Captura / Comprobante (Imagen o PDF)')}</Label>
                                            <Input 
                                                id="comprobante"
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={handleFileChange}
                                                className="mt-1 cursor-pointer"
                                            />
                                            {imagePreviewUrl && (
                                                <div className="mt-3 p-2 bg-slate-100 dark:bg-slate-900 rounded-lg border w-32 h-32 relative">
                                                    <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover rounded" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    type="submit" 
                                    disabled={processing} 
                                    size="lg"
                                    className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-md"
                                >
                                    <Upload className="h-5 w-5" />
                                    {processing ? __('Enviando...') : __('Enviar Solicitud de Renovación')}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Historial de Pagos y Solicitudes */}
                <Card className="shadow-md border border-slate-200/80 dark:border-slate-800">
                    <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3">
                            <Receipt className="h-5 w-5 text-indigo-600" />
                            <div>
                                <CardTitle className="text-lg font-bold">{__('Historial de Renovaciones y Comprobantes')}</CardTitle>
                                <CardDescription>{__('Seguimiento de pagos enviados y su estado de aprobación.')}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-900">
                                    <TableHead className="font-bold">{__('Fecha')}</TableHead>
                                    <TableHead className="font-bold">{__('Duración')}</TableHead>
                                    <TableHead className="font-bold">{__('Sucursales')}</TableHead>
                                    <TableHead className="font-bold">{__('Monto Total')}</TableHead>
                                    <TableHead className="font-bold">{__('Método')}</TableHead>
                                    <TableHead className="font-bold">{__('Referencia')}</TableHead>
                                    <TableHead className="font-bold text-center">{__('Comprobante')}</TableHead>
                                    <TableHead className="font-bold text-right">{__('Estado')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pagos.map((pago) => (
                                    <TableRow key={pago.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                                        <TableCell className="text-xs font-mono font-medium">
                                            {new Date(pago.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="font-semibold text-xs">{pago.ciclo_meses} {__('Meses')}</TableCell>
                                        <TableCell className="text-xs font-medium">{pago.sucursales_contratadas}</TableCell>
                                        <TableCell className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                                            {currencySymbol}{pago.monto.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="capitalize text-xs font-medium">{pago.metodo_pago.replace('_', ' ')}</TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{pago.referencia_pago || '--'}</TableCell>
                                        <TableCell className="text-center">
                                            {pago.comprobante_path ? (
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    onClick={() => setPreviewReceipt(`/storage/${pago.comprobante_path}`)}
                                                    className="h-7 text-xs gap-1 text-indigo-600 hover:text-indigo-700"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    {__('Ver')}
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">--</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge 
                                                variant={
                                                    pago.estado === 'approved' ? 'default' : 
                                                    pago.estado === 'pending' ? 'outline' : 'destructive'
                                                }
                                                className={`text-xs font-semibold ${
                                                    pago.estado === 'approved' ? 'bg-emerald-600 text-white' :
                                                    pago.estado === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300' : ''
                                                }`}
                                            >
                                                {pago.estado === 'approved' ? __('Aprobado') : 
                                                 pago.estado === 'pending' ? __('Pendiente') : __('Rechazado')}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {pagos.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            {__('No se registran solicitudes de renovación anteriores.')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Lightbox Ver Comprobante */}
            <Dialog open={previewReceipt !== null} onOpenChange={() => setPreviewReceipt(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-indigo-600" />
                            {__('Comprobante de Pago Adjunto')}
                        </DialogTitle>
                    </DialogHeader>

                    {previewReceipt && (
                        <div className="p-2 border rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center max-h-[70vh] overflow-auto">
                            {previewReceipt.endsWith('.pdf') ? (
                                <iframe src={previewReceipt} className="w-full h-96 rounded" title="PDF Comprobante" />
                            ) : (
                                <img src={previewReceipt} alt="Comprobante" className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-md" />
                            )}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                        {previewReceipt && (
                            <a 
                                href={previewReceipt} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                {__('Abrir en ventana nueva')}
                            </a>
                        )}
                        <Button variant="outline" onClick={() => setPreviewReceipt(null)}>
                            {__('Cerrar')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
