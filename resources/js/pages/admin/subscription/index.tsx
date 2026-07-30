import { Head, useForm, usePage } from '@inertiajs/react';
import { CreditCard, CheckCircle2, Clock, ShieldAlert, Store, AlertTriangle, FileText, Upload, Calendar, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

    const [selectedCycle, setSelectedCycle] = useState<number>(12); // 12 meses por defecto para mayor ahorro
    const [extraSucursales, setExtraSucursales] = useState<number>(Math.max(1, empresa.sucursales_activas));

    const currentOption = opcionesPrecios[selectedCycle] || opcionesPrecios[12];
    
    // Cálculo dinámico según sucursales seleccionadas
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
        setExtraSucursales(count);
        setData('sucursales_contratadas', count);
    };

    const handleSubmitRenewal = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/monitoring/subscription/renew', {
            onSuccess: () => reset('referencia_pago', 'comprobante', 'notas'),
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Monitoring'), href: '#' },
        { title: __('Suscripción'), href: '/admin/monitoring/subscription' },
    ];

    return (
        <>
            <Head title={__('Gestión de Suscripción')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <CreditCard className="h-8 w-8 text-indigo-600" />
                            {__('Suscripción y Estado del Servicio')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {__('Consulta el estado de tu plan, días restantes, sucursales contratadas y renovaciones.')}
                        </p>
                    </div>
                </div>

                {/* Card de Estado de la Suscripción */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className={`shadow-sm md:col-span-2 border-l-4 ${
                        empresa.is_exempt 
                            ? 'border-l-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10'
                            : empresa.subscription_status === 'active'
                            ? 'border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
                            : empresa.subscription_status === 'trial'
                            ? 'border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10'
                            : 'border-l-red-500 bg-red-50/20 dark:bg-red-950/10'
                    }`}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        {empresa.razon_social}
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        {__('Plan Actual:')} <span className="font-semibold text-slate-900 dark:text-slate-100">{plan?.nombre || 'Plan Full'}</span>
                                    </CardDescription>
                                </div>
                                <Badge variant={
                                    empresa.is_exempt ? 'default' : 
                                    empresa.subscription_status === 'active' ? 'default' : 
                                    empresa.subscription_status === 'trial' ? 'outline' : 'destructive'
                                } className="text-sm px-3 py-1 font-semibold">
                                    {empresa.estado_legible}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-medium">{__('Estado')}</p>
                                    <p className="text-base font-bold capitalize mt-0.5">{empresa.subscription_status}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-medium">{__('Días Restantes')}</p>
                                    <p className="text-base font-bold mt-0.5 text-indigo-600 dark:text-indigo-400">
                                        {empresa.is_exempt ? '∞ Ilimitado' : `${empresa.dias_restantes} días`}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-medium">{__('Vencimiento')}</p>
                                    <p className="text-sm font-semibold mt-0.5">
                                        {empresa.is_exempt ? 'N/A' : (
                                            empresa.subscription_expires_at 
                                                ? new Date(empresa.subscription_expires_at).toLocaleDateString()
                                                : empresa.trial_ends_at 
                                                ? new Date(empresa.trial_ends_at).toLocaleDateString()
                                                : 'Sin fecha'
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Store className="h-4 w-4 text-slate-400" />
                                    <span>{__('Sucursales en uso:')} <strong>{empresa.sucursales_activas}</strong> / {empresa.max_sucursales} {__('contratadas')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Resumen Módulos Incluidos */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Zap className="h-4 w-4 text-amber-500" />
                                {__('Módulos Incluidos (Plan Full)')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-xs">
                                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    {__('Gestión de Ventas y Punto de Venta (POS)')}
                                </li>
                                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    {__('Control de Inventario y Movimientos')}
                                </li>
                                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    {__('Apertura y Cierre de Cajas Chica')}
                                </li>
                                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    {__('Clientes, Créditos y Políticas de Pago')}
                                </li>
                                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    {__('Catálogo de Servicios y Equipos')}
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Formulario de Renovación / Selección de Período */}
                {!empresa.is_exempt && (
                    <Card className="shadow-sm border-indigo-100 dark:border-indigo-950">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Calendar className="h-5 w-5 text-indigo-600" />
                                {__('Renovar o Extender Suscripción')}
                            </CardTitle>
                            <CardDescription>
                                {__('Selecciona la duración deseada y la cantidad de sucursales a mantener activas.')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmitRenewal} className="space-y-6">
                                {/* Selector de Duración */}
                                <div>
                                    <Label className="mb-3 block font-semibold">{__('1. Selecciona la Duración del Plan')}</Label>
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        {[3, 6, 12].map((meses) => {
                                            const opt = opcionesPrecios[meses];
                                            const isSelected = selectedCycle === meses;
                                            return (
                                                <div 
                                                    key={meses}
                                                    onClick={() => handleCycleChange(meses)}
                                                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all relative ${
                                                        isSelected 
                                                            ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm'
                                                            : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                                                    }`}
                                                >
                                                    {meses === 12 && (
                                                        <Badge className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px]">
                                                            {__('Ahorra 20%')}
                                                        </Badge>
                                                    )}
                                                    {meses === 6 && (
                                                        <Badge className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px]">
                                                            {__('Ahorra 10%')}
                                                        </Badge>
                                                    )}

                                                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{meses} {__('Meses')}</h3>
                                                    <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                                                        {currencySymbol}{opt?.subtotal_plan.toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        (~{currencySymbol}{opt?.precio_mensual_promedio.toFixed(2)} / {__('mes')})
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Selección de Sucursales Extra */}
                                <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
                                    <div>
                                        <Label htmlFor="sucursales" className="font-semibold">{__('2. Cantidad Total de Sucursales')}</Label>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            {__('El plan base incluye 1 sucursal. Cada sucursal extra suma +')}
                                            {currencySymbol}{plan?.precio_sucursal_extra_mensual.toFixed(2)}/{__('mes')}.
                                        </p>
                                        <Input 
                                            id="sucursales"
                                            type="number"
                                            min={1}
                                            max={20}
                                            value={extraSucursales}
                                            onChange={(e) => handleSucursalChange(parseInt(e.target.value) || 1)}
                                            className="w-full max-w-[200px]"
                                        />
                                    </div>

                                    {/* Resumen de Tarifas */}
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border flex flex-col justify-between">
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase">{__('Resumen de Inversión')}</p>
                                            <div className="text-xs space-y-1 mt-2">
                                                <div className="flex justify-between">
                                                    <span>Plan Full ({selectedCycle} {__('Meses')}):</span>
                                                    <span className="font-mono">{currencySymbol}{currentOption?.subtotal_plan.toFixed(2)}</span>
                                                </div>
                                                {sucursalesExtrasCount > 0 && (
                                                    <div className="flex justify-between text-indigo-600">
                                                        <span>{sucursalesExtrasCount} {__('Sucursal(es) Extra')}:</span>
                                                        <span className="font-mono">+{currencySymbol}{costoExtraSucursales.toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t mt-3 flex justify-between items-center">
                                            <span className="font-bold">{__('Total a Pagar:')}</span>
                                            <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                                                {currencySymbol}{precioFinalEstimado.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Datos del Pago */}
                                <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
                                    <div>
                                        <Label htmlFor="metodo_pago" className="font-semibold">{__('3. Método de Pago')}</Label>
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
                                        <Label htmlFor="referencia" className="font-semibold">{__('Nº Referencia de Pago')}</Label>
                                        <Input 
                                            id="referencia"
                                            placeholder={__('Ej: 987654321')}
                                            value={data.referencia_pago}
                                            onChange={(e) => setData('referencia_pago', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <Label htmlFor="comprobante" className="font-semibold">{__('Adjuntar Comprobante (Opcional)')}</Label>
                                        <Input 
                                            id="comprobante"
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => setData('comprobante', e.target.files?.[0] || null)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <Button type="submit" disabled={processing} className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700">
                                    <Upload className="h-4 w-4" />
                                    {__('Enviar Solicitud de Renovación')}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Historial de Pagos y Solicitudes */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>{__('Historial de Renovaciones y Solicitudes')}</CardTitle>
                        <CardDescription>{__('Registro de comprobantes enviados y estados de aprobación.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{__('Fecha')}</TableHead>
                                    <TableHead>{__('Duración')}</TableHead>
                                    <TableHead>{__('Sucursales')}</TableHead>
                                    <TableHead>{__('Monto')}</TableHead>
                                    <TableHead>{__('Método')}</TableHead>
                                    <TableHead>{__('Referencia')}</TableHead>
                                    <TableHead className="text-right">{__('Estado')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pagos.map((pago) => (
                                    <TableRow key={pago.id}>
                                        <TableCell className="text-xs font-mono">{new Date(pago.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-medium text-xs">{pago.ciclo_meses} {__('Meses')}</TableCell>
                                        <TableCell className="text-xs">{pago.sucursales_contratadas}</TableCell>
                                        <TableCell className="font-mono font-bold text-xs">{currencySymbol}{pago.monto.toFixed(2)}</TableCell>
                                        <TableCell className="capitalize text-xs">{pago.metodo_pago.replace('_', ' ')}</TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{pago.referencia_pago || '--'}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={
                                                pago.estado === 'approved' ? 'default' : 
                                                pago.estado === 'pending' ? 'outline' : 'destructive'
                                            }>
                                                {pago.estado === 'approved' ? __('Aprobado') : 
                                                 pago.estado === 'pending' ? __('Pendiente') : __('Rechazado')}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {pagos.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                                            {__('No se registran solicitudes de pago previas.')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
