import { Head, useForm, usePage } from '@inertiajs/react';
import { ShieldAlert, CreditCard, Upload, CheckCircle2, Lock } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';

interface EmpresaInfo {
    id: number;
    razon_social: string;
    subscription_status: string;
    trial_ends_at: string | null;
    subscription_expires_at: string | null;
    max_sucursales: number;
    sucursales_activas: number;
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
}

interface PageProps {
    empresa: EmpresaInfo | null;
    plan: PlanInfo | null;
    opcionesPrecios: Record<number, { meses: number; total: number }>;
}

export default function SubscriptionExpired({ empresa, plan, opcionesPrecios }: PageProps) {
    const { __ } = useTranslate();
    const { currencySymbol = '$' } = usePage().props as any;

    const [selectedCycle, setSelectedCycle] = useState<number>(12);
    const [extraSucursales, setExtraSucursales] = useState<number>(Math.max(1, empresa?.sucursales_activas ?? 1));

    const currentOption = opcionesPrecios[selectedCycle] || opcionesPrecios[12];
    const sucursalesExtrasCount = Math.max(0, extraSucursales - (plan?.sucursales_incluidas ?? 1));
    const costoExtraSucursales = sucursalesExtrasCount * (plan?.precio_sucursal_extra_mensual ?? 10) * selectedCycle;
    const precioFinalEstimado = (currentOption?.total ?? 0) + costoExtraSucursales;

    const { data, setData, post, processing, errors } = useForm({
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
        post('/admin/monitoring/subscription/renew');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
            <Head title={__('Suscripción Vencida')} />

            <div className="max-w-3xl w-full space-y-6">
                {/* Header Alerta */}
                <div className="text-center space-y-3">
                    <div className="inline-flex p-3 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 mb-2">
                        <Lock className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                        {__('Período de Prueba o Suscripción Caducado')}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm">
                        {__('El acceso a los módulos operativos de')} <strong>{empresa?.razon_social}</strong> {__('ha sido pausado. Selecciona un plan de renovación para reactivar el servicio inmediatamente.')}
                    </p>
                </div>

                {/* Formulario de Renovación */}
                <Card className="shadow-lg border-red-200 dark:border-red-950">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-indigo-600" />
                            {__('Selecciona tu Plan de Renovación')}
                        </CardTitle>
                        <CardDescription>
                            {__('Tus datos y registros se encuentran resguardados de forma 100% segura.')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmitRenewal} className="space-y-6">
                            {/* Opciones de Período */}
                            <div className="grid gap-4 sm:grid-cols-3">
                                {[3, 6, 12].map((meses) => {
                                    const isSelected = selectedCycle === meses;
                                    const opt = opcionesPrecios[meses];
                                    return (
                                        <div
                                            key={meses}
                                            onClick={() => handleCycleChange(meses)}
                                            className={`cursor-pointer rounded-xl border-2 p-4 transition-all relative text-center ${
                                                isSelected
                                                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md'
                                                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                                            }`}
                                        >
                                            {meses === 12 && (
                                                <Badge className="absolute -top-3 right-3 bg-emerald-600 text-white text-[10px]">
                                                    {__('Ahorra 20%')}
                                                </Badge>
                                            )}
                                            <h3 className="font-bold text-lg">{meses} {__('Meses')}</h3>
                                            <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                                                {currencySymbol}{opt?.total.toFixed(2)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Sucursales */}
                            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
                                <div>
                                    <Label htmlFor="sucursales_exp">{__('Cantidad de Sucursales')}</Label>
                                    <Input
                                        id="sucursales_exp"
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={extraSucursales}
                                        onChange={(e) => handleSucursalChange(parseInt(e.target.value) || 1)}
                                        className="mt-1 max-w-[200px]"
                                    />
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg flex justify-between items-center">
                                    <span className="font-bold text-sm">{__('Monto Total:')}</span>
                                    <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                                        {currencySymbol}{precioFinalEstimado.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Método de pago */}
                            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
                                <div>
                                    <Label>{__('Método de Pago')}</Label>
                                    <Select value={data.metodo_pago} onValueChange={(v) => setData('metodo_pago', v)}>
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="transferencia">{__('Transferencia Bancaria')}</SelectItem>
                                            <SelectItem value="pago_movil">{__('Pago Móvil')}</SelectItem>
                                            <SelectItem value="zelle">{__('Zelle')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>{__('Nº Referencia')}</Label>
                                    <Input
                                        placeholder={__('Ej: 12345678')}
                                        value={data.referencia_pago}
                                        onChange={(e) => setData('referencia_pago', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <Label>{__('Comprobante (Opcional)')}</Label>
                                    <Input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => setData('comprobante', e.target.files?.[0] || null)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <Button type="submit" disabled={processing} className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 text-base font-bold gap-2">
                                <Upload className="h-5 w-5" />
                                {__('Enviar Reporte de Pago y Reactivar')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
