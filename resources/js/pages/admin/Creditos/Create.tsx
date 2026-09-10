import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    CreditCard,
    ArrowLeft,
    Smartphone,
    User,
    Calendar,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    Receipt,
    Calculator,
    ShieldCheck,
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface Cliente {
    id: number;
    nombres: string;
    apellidos: string;
    tipo_documento: string;
    numero_documento: string;
    telefono_principal: string;
    limite_credito: string | number;
    estado_crediticio: string;
}

interface Equipo {
    id: number;
    imei_1: string;
    color?: string | null;
    precio_contado: string | number;
    precio_financiado: string | number;
    sucursal_id: number;
    modelo?: {
        nombre: string;
        almacenamiento?: string;
        ram?: string;
        marca?: {
            nombre: string;
        };
    };
    sucursal?: {
        nombre: string;
    };
}

interface Plan {
    id: number;
    nombre: string;
    frecuencia: 'semanal' | 'quincenal' | 'mensual';
    numero_cuotas: number;
    porcentaje_inicial_minimo: string | number;
    porcentaje_interes_total: string | number;
    dias_gracia: number;
}

interface Sucursal {
    id: number;
    nombre: string;
}

interface Props {
    clientes: Cliente[];
    equipos: Equipo[];
    planes: Plan[];
    sucursales: Sucursal[];
}

export default function CreditoCreate({ clientes, equipos, planes, sucursales }: Props) {
    const { regional_config } = usePage().props as any;
    const currency = regional_config?.currency_symbol || '$';

    const form = useForm({
        cliente_id: '',
        inventario_equipo_id: '',
        plan_financiamiento_id: '',
        sucursal_id: '',
        monto_inicial: '',
        metodo_pago_inicial: 'efectivo',
        referencia_pago_inicial: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        notas: '',
    });

    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    // Actualizar cliente seleccionado
    const handleClienteChange = (id: string) => {
        form.setData('cliente_id', id);
        const cl = clientes.find((c) => c.id.toString() === id) || null;
        setSelectedCliente(cl);
    };

    // Actualizar equipo seleccionado
    const handleEquipoChange = (id: string) => {
        form.setData('inventario_equipo_id', id);
        const eq = equipos.find((e) => e.id.toString() === id) || null;
        setSelectedEquipo(eq);
        if (eq) {
            form.setData((prev) => ({
                ...prev,
                inventario_equipo_id: id,
                sucursal_id: eq.sucursal_id.toString(),
            }));
        }
    };

    // Actualizar plan seleccionado y recalcular inicial por defecto
    const handlePlanChange = (id: string) => {
        const pl = planes.find((p) => p.id.toString() === id) || null;
        setSelectedPlan(pl);

        if (pl && selectedEquipo) {
            const precio = Number(selectedEquipo.precio_financiado);
            const minInicial = (precio * (Number(pl.porcentaje_inicial_minimo) / 100)).toFixed(2);
            form.setData((prev) => ({
                ...prev,
                plan_financiamiento_id: id,
                monto_inicial: minInicial,
            }));
        } else {
            form.setData('plan_financiamiento_id', id);
        }
    };

    type ProyeccionResult =
        | {
              valido: false;
              mensaje: string;
              minInicial: number;
              precio?: never;
              inicial?: never;
              montoFinanciado?: never;
              interesTotal?: never;
              totalCredito?: never;
              cuotas?: never;
          }
        | {
              valido: true;
              precio: number;
              inicial: number;
              minInicial: number;
              montoFinanciado: number;
              interesTotal: number;
              totalCredito: number;
              cuotas: Array<{ numero: number; fecha: string; monto: number }>;
              mensaje?: never;
          };

    // Cálculo y proyección instantánea en el frontend
    const proyeccion = useMemo<ProyeccionResult | null>(() => {
        if (!selectedEquipo || !selectedPlan || !form.data.monto_inicial) {
            return null;
        }

        const precio = Number(selectedEquipo.precio_financiado);
        const inicial = Number(form.data.monto_inicial);
        const minInicial = Number((precio * (Number(selectedPlan.porcentaje_inicial_minimo) / 100)).toFixed(2));

        if (inicial < minInicial || inicial >= precio) {
            return {
                valido: false,
                mensaje: `La inicial debe ser al menos de ${currency}${minInicial.toFixed(2)} (${selectedPlan.porcentaje_inicial_minimo}%) y menor al precio del equipo.`,
                minInicial,
            };
        }

        const montoFinanciado = Number((precio - inicial).toFixed(2));
        const interesTotal = Number((montoFinanciado * (Number(selectedPlan.porcentaje_interes_total) / 100)).toFixed(2));
        const totalCredito = Number((montoFinanciado + interesTotal).toFixed(2));
        const numCuotas = Number(selectedPlan.numero_cuotas);

        const baseCapital = Number((montoFinanciado / numCuotas).toFixed(2));
        const baseInteres = Number((interesTotal / numCuotas).toFixed(2));

        const cuotas = [];
        let acumCuota = 0;
        const startDate = form.data.fecha_inicio ? new Date(form.data.fecha_inicio + 'T00:00:00') : new Date();

        for (let i = 1; i <= numCuotas; i++) {
            const fechaVenc = new Date(startDate);
            if (selectedPlan.frecuencia === 'semanal') {
                fechaVenc.setDate(fechaVenc.getDate() + i * 7);
            } else if (selectedPlan.frecuencia === 'quincenal') {
                fechaVenc.setDate(fechaVenc.getDate() + i * 15);
            } else {
                fechaVenc.setMonth(fechaVenc.getMonth() + i);
            }

            let montoCuota = Number((baseCapital + baseInteres).toFixed(2));
            if (i === numCuotas) {
                montoCuota = Number((totalCredito - acumCuota).toFixed(2));
            } else {
                acumCuota += montoCuota;
            }

            cuotas.push({
                numero: i,
                fecha: fechaVenc.toISOString().split('T')[0],
                monto: montoCuota,
            });
        }

        return {
            valido: true,
            precio,
            inicial,
            minInicial,
            montoFinanciado,
            interesTotal,
            totalCredito,
            cuotas,
        };
    }, [selectedEquipo, selectedPlan, form.data.monto_inicial, form.data.fecha_inicio]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/creditos');
    };

    return (
        <div className="space-y-6">
            <Head title="Nueva Venta a Crédito" />

            <Breadcrumbs
                breadcrumbs={[
                    { title: 'Dashboard', href: '/admin/dashboard' },
                    { title: 'Ventas a Crédito', href: '/admin/creditos' },
                    { title: 'Nuevo Financiamiento', href: '/admin/creditos/nuevo' },
                ]}
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <CreditCard className="size-6 text-emerald-600" /> Originación de Venta a Crédito
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Selecciona el cliente, el dispositivo por IMEI y el plan de amortización deseado.
                    </p>
                </div>
                <Link href="/admin/creditos">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="size-4 mr-1" /> Volver al Listado
                    </Button>
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna Izquierda: Selección de Cliente y Equipo */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* 1. Selección de Cliente */}
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <User className="size-4 text-blue-600" /> 1. Cliente Titular del Crédito
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label>Buscar y Seleccionar Cliente *</Label>
                                    <Select value={form.data.cliente_id} onValueChange={handleClienteChange}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Selecciona un cliente registrado..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clientes.map((c) => (
                                                <SelectItem key={c.id} value={c.id.toString()}>
                                                    {c.nombres} {c.apellidos} ({c.tipo_documento}-{c.numero_documento}) • Telf: {c.telefono_principal}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.cliente_id && <p className="text-xs text-rose-500">{form.errors.cliente_id}</p>}
                                </div>

                                {selectedCliente && (
                                    <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200/50 dark:border-blue-900/50 flex flex-wrap justify-between items-center gap-3 text-xs">
                                        <div>
                                            <span className="text-slate-500 block">Límite de Crédito:</span>
                                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                                {currency}{Number(selectedCliente.limite_credito).toFixed(2)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">WhatsApp:</span>
                                            <span className="font-medium text-emerald-600 font-mono">
                                                {selectedCliente.telefono_principal}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Estado Crediticio:</span>
                                            <Badge className="bg-emerald-500/15 text-emerald-700 capitalize">
                                                {selectedCliente.estado_crediticio}
                                            </Badge>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 2. Selección del Dispositivo Móvil por IMEI */}
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Smartphone className="size-4 text-emerald-600" /> 2. Teléfono a Financiar (Inventario Disponible)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label>Seleccionar Teléfono Disponible (Filtrado por IMEI) *</Label>
                                    <Select value={form.data.inventario_equipo_id} onValueChange={handleEquipoChange}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Selecciona un equipo por marca, modelo o IMEI..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {equipos.length === 0 ? (
                                                <SelectItem value="none" disabled>No hay equipos disponibles en inventario</SelectItem>
                                            ) : (
                                                equipos.map((eq) => (
                                                    <SelectItem key={eq.id} value={eq.id.toString()}>
                                                        {eq.modelo?.marca?.nombre} {eq.modelo?.nombre} ({eq.modelo?.almacenamiento}) - IMEI: {eq.imei_1} - {currency}{Number(eq.precio_financiado).toFixed(2)}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.inventario_equipo_id && <p className="text-xs text-rose-500">{form.errors.inventario_equipo_id}</p>}
                                </div>

                                {selectedEquipo && (
                                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/50 dark:border-emerald-900/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                        <div>
                                            <span className="text-slate-500 block">Modelo:</span>
                                            <span className="font-bold text-slate-900 dark:text-slate-100">
                                                {selectedEquipo.modelo?.marca?.nombre} {selectedEquipo.modelo?.nombre}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">IMEI 1:</span>
                                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                                {selectedEquipo.imei_1}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Precio Contado:</span>
                                            <span className="text-slate-600 dark:text-slate-400 font-semibold">
                                                {currency}{Number(selectedEquipo.precio_contado).toFixed(2)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Precio Financiado:</span>
                                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                                                {currency}{Number(selectedEquipo.precio_financiado).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 3. Condiciones de Financiamiento & Pago Inicial */}
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Calculator className="size-4 text-purple-600" /> 3. Plan & Condiciones de Pago
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label>Plan de Financiamiento *</Label>
                                        <Select value={form.data.plan_financiamiento_id} onValueChange={handlePlanChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar plan..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {planes.map((p) => (
                                                    <SelectItem key={p.id} value={p.id.toString()}>
                                                        {p.nombre} ({p.numero_cuotas} cuotas {p.frecuencia}s)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.errors.plan_financiamiento_id && <p className="text-xs text-rose-500">{form.errors.plan_financiamiento_id}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>Fecha de Inicio del Contrato *</Label>
                                        <Input
                                            type="date"
                                            required
                                            value={form.data.fecha_inicio}
                                            onChange={(e) => form.setData('fecha_inicio', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                    <div className="space-y-1.5 sm:col-span-1">
                                        <Label className="font-bold text-emerald-700 dark:text-emerald-400">
                                            Monto Inicial Cobrado ({currency}) *
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            required
                                            placeholder="0.00"
                                            value={form.data.monto_inicial}
                                            onChange={(e) => form.setData('monto_inicial', e.target.value)}
                                            className="font-bold text-base"
                                        />
                                        {proyeccion && !proyeccion.valido && (
                                            <p className="text-[11px] text-rose-500 mt-1">{proyeccion.mensaje}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>Método de Pago de la Inicial</Label>
                                        <Select
                                            value={form.data.metodo_pago_inicial}
                                            onValueChange={(val) => form.setData('metodo_pago_inicial', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="efectivo">Efectivo ($ / Bs / Local)</SelectItem>
                                                <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                                                <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                                                <SelectItem value="tarjeta">Punto de Venta / Tarjeta</SelectItem>
                                                <SelectItem value="zelle">Zelle / Dólares Digitales</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>Referencia de Pago</Label>
                                        <Input
                                            placeholder="N° de comprobante / lote"
                                            value={form.data.referencia_pago_inicial}
                                            onChange={(e) => form.setData('referencia_pago_inicial', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Notas del Contrato (Opcional)</Label>
                                    <Textarea
                                        placeholder="Observaciones de entrega, referencias adicionales o convenios especiales..."
                                        value={form.data.notas}
                                        onChange={(e) => form.setData('notas', e.target.value)}
                                        rows={2}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Columna Derecha: Resumen Financiero y Tabla de Amortización Preliminar */}
                    <div className="space-y-6">
                        <Card className="border-slate-200 dark:border-slate-800 shadow-md sticky top-6">
                            <CardHeader className="bg-slate-900 text-white rounded-t-xl py-4">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Receipt className="size-4 text-emerald-400" /> Resumen de Liquidación
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                {proyeccion && proyeccion.valido ? (
                                    <>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between text-slate-500">
                                                <span>Precio del Equipo:</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                    {currency}{proyeccion.precio.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-slate-500">
                                                <span>Inicial Pagada:</span>
                                                <span className="font-semibold text-emerald-600">
                                                    - {currency}{proyeccion.inicial.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-slate-500">
                                                <span>Monto a Financiar (Base):</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                    {currency}{proyeccion.montoFinanciado.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-slate-500">
                                                <span>Interés Financiero ({selectedPlan?.porcentaje_interes_total}%):</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                    + {currency}{proyeccion.interesTotal.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                                <span className="font-extrabold text-slate-900 dark:text-slate-100">
                                                    Total a Pagar en Cuotas:
                                                </span>
                                                <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                                                    {currency}{proyeccion.totalCredito.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Calendario de Cuotas Preliminar */}
                                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center justify-between">
                                                <span>Calendario de {proyeccion.cuotas.length} Cuotas:</span>
                                                <span className="text-purple-600 capitalize font-medium">{selectedPlan?.frecuencia}</span>
                                            </div>
                                            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs">
                                                {proyeccion.cuotas.map((c) => (
                                                    <div
                                                        key={c.numero}
                                                        className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 font-mono"
                                                    >
                                                        <div>
                                                            <span className="font-bold text-slate-700 dark:text-slate-300">Cuota #{c.numero}</span>
                                                            <span className="text-[11px] text-slate-400 block font-sans">Vence: {c.fecha}</span>
                                                        </div>
                                                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm font-sans">
                                                            {currency}{c.monto.toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={form.processing}
                                            className="w-full py-6 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                                        >
                                            {form.processing ? 'Generando Venta...' : 'Completar Venta y Generar Contrato'}
                                        </Button>
                                    </>
                                ) : (
                                    <div className="py-8 text-center text-slate-400 space-y-2">
                                        <AlertCircle className="size-8 mx-auto text-slate-300" />
                                        <p className="text-xs">
                                            Completa la selección del cliente, teléfono y plan de cuotas para previsualizar la amortización.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
}

