import { Head, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    CreditCard,
    Settings,
    Percent,
    ShieldAlert,
    Calendar,
    Bell,
    AlertOctagon,
    Users,
    CheckSquare,
    FileText,
    ShieldCheck,
    Save,
    History,
    DollarSign,
    Lock,
    CheckCircle2
} from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslate } from '@/hooks/use-translate';
import AppLayout from '@/layouts/app-layout';

interface PolicyData {
    id?: number;
    nombre: string;
    activo: boolean;
    plazo_defecto_dias: number;
    limite_defecto: number;
    permite_modificar_limite: boolean;
    dias_gracia: number;
    moneda: string;

    // Intereses
    interes_activado: boolean;
    interes_tipo: string;
    interes_calculo: string;
    interes_valor: number;
    interes_aplicar_despues_dias: number;
    interes_capitalizable: boolean;

    // Límites
    limite_accion_excedido: string;
    permite_exceder_limite: boolean;
    solicitar_autorizacion: boolean;
    mostrar_credito_disponible: boolean;

    // Formas de pago
    forma_pago_tipo: string;
    max_cuotas: number;
    pago_minimo_porcentaje: number;
    abono_minimo: number;

    // Vencimientos
    vencimiento_tipo: string;
    vencimiento_dias_despues: number;
    vencimiento_dia_mes: number | null;
    saltar_domingos: boolean;
    saltar_festivos: boolean;

    // Recordatorios
    recordatorio_dias_antes: number;
    recordatorio_en_vencimiento: boolean;
    recordatorio_dias_despues: number;
    canal_whatsapp: boolean;
    canal_email: boolean;
    canal_sms: boolean;

    // Penalizaciones
    penalizacion_tipo: string;
    penalizacion_valor: number;
    penalizacion_suspender_credito: boolean;
    penalizacion_bloquear_compras: boolean;

    // Reglas
    tipo_cliente_categoria: string;

    // Aprobaciones
    monto_requiere_autorizacion: number;
    rol_autorizador: string;

    // Documentos
    requiere_contrato: boolean;
    requiere_pagare: boolean;
    requiere_firma_digital: boolean;
    requiere_identificacion: boolean;
    requiere_comprobantes: boolean;

    // Seguridad
    permiso_crear_credito: boolean;
    permiso_modificar_plazo: boolean;
    permiso_cambiar_interes: boolean;
    permiso_cambiar_limite: boolean;
    permiso_eliminar_pagos: boolean;
    permiso_revertir_pagos: boolean;
    permiso_condonar_intereses: boolean;
}

interface CreditLog {
    id: number;
    user?: { name: string; email: string };
    accion: string;
    detalles: any;
    created_at: string;
}

interface Props {
    policy: PolicyData | null;
    logs: CreditLog[];
}

export default function CreditConfigIndex({ policy, logs = [] }: Props) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/dashboard' },
        { title: __('Configuración de Créditos'), href: '/admin/credit-config' },
    ];

    const defaultPolicy: PolicyData = {
        nombre: policy?.nombre || 'Configuración Principal',
        activo: policy?.activo ?? true,
        plazo_defecto_dias: policy?.plazo_defecto_dias ?? 30,
        limite_defecto: policy?.limite_defecto ?? 500,
        permite_modificar_limite: policy?.permite_modificar_limite ?? true,
        dias_gracia: policy?.dias_gracia ?? 0,
        moneda: policy?.moneda || 'USD',

        interes_activado: policy?.interes_activado ?? false,
        interes_tipo: policy?.interes_tipo || 'mensual',
        interes_calculo: policy?.interes_calculo || 'porcentual',
        interes_valor: policy?.interes_valor ?? 5,
        interes_aplicar_despues_dias: policy?.interes_aplicar_despues_dias ?? 5,
        interes_capitalizable: policy?.interes_capitalizable ?? false,

        limite_accion_excedido: policy?.limite_accion_excedido || 'bloquear',
        permite_exceder_limite: policy?.permite_exceder_limite ?? false,
        solicitar_autorizacion: policy?.solicitar_autorizacion ?? false,
        mostrar_credito_disponible: policy?.mostrar_credito_disponible ?? true,

        forma_pago_tipo: policy?.forma_pago_tipo || 'pago_unico',
        max_cuotas: policy?.max_cuotas ?? 1,
        pago_minimo_porcentaje: policy?.pago_minimo_porcentaje ?? 0,
        abono_minimo: policy?.abono_minimo ?? 0,

        vencimiento_tipo: policy?.vencimiento_tipo || 'dias_despues',
        vencimiento_dias_despues: policy?.vencimiento_dias_despues ?? 30,
        vencimiento_dia_mes: policy?.vencimiento_dia_mes ?? null,
        saltar_domingos: policy?.saltar_domingos ?? true,
        saltar_festivos: policy?.saltar_festivos ?? true,

        recordatorio_dias_antes: policy?.recordatorio_dias_antes ?? 3,
        recordatorio_en_vencimiento: policy?.recordatorio_en_vencimiento ?? true,
        recordatorio_dias_despues: policy?.recordatorio_dias_despues ?? 3,
        canal_whatsapp: policy?.canal_whatsapp ?? true,
        canal_email: policy?.canal_email ?? true,
        canal_sms: policy?.canal_sms ?? false,

        penalizacion_tipo: policy?.penalizacion_tipo || 'ninguna',
        penalizacion_valor: policy?.penalizacion_valor ?? 0,
        penalizacion_suspender_credito: policy?.penalizacion_suspender_credito ?? false,
        penalizacion_bloquear_compras: policy?.penalizacion_bloquear_compras ?? false,

        tipo_cliente_categoria: policy?.tipo_cliente_categoria || 'credito',

        monto_requiere_autorizacion: policy?.monto_requiere_autorizacion ?? 1000,
        rol_autorizador: policy?.rol_autorizador || 'admin',

        requiere_contrato: policy?.requiere_contrato ?? false,
        requiere_pagare: policy?.requiere_pagare ?? false,
        requiere_firma_digital: policy?.requiere_firma_digital ?? false,
        requiere_identificacion: policy?.requiere_identificacion ?? false,
        requiere_comprobantes: policy?.requiere_comprobantes ?? false,

        permiso_crear_credito: policy?.permiso_crear_credito ?? true,
        permiso_modificar_plazo: policy?.permiso_modificar_plazo ?? true,
        permiso_cambiar_interes: policy?.permiso_cambiar_interes ?? false,
        permiso_cambiar_limite: policy?.permiso_cambiar_limite ?? false,
        permiso_eliminar_pagos: policy?.permiso_eliminar_pagos ?? false,
        permiso_revertir_pagos: policy?.permiso_revertir_pagos ?? false,
        permiso_condonar_intereses: policy?.permiso_condonar_intereses ?? false,
    };

    const { data, setData, post, put, processing } = useForm<PolicyData>(defaultPolicy);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (policy?.id) {
            put(`/admin/credit-config/${policy.id}`);
        } else {
            post('/admin/credit-config');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={__('Configuración de Créditos')} />

            <div className="space-y-6">
                <ModuleHeader
                    icon={<CreditCard className="h-6 w-6 text-white" />}
                    title={__('Configuración de Créditos')}
                    description={__('Gestione reglas, límites, intereses, formas de pago, vencimientos y seguridad del sistema de crédito.')}
                    colorClassName="bg-indigo-600"
                />

                <form onSubmit={handleSubmit}>
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="flex flex-wrap h-auto p-1.5 bg-slate-100 dark:bg-slate-900 border rounded-lg gap-1">
                            <TabsTrigger value="general" className="flex items-center gap-1.5">
                                <Settings className="w-4 h-4" />
                                {__('General')}
                            </TabsTrigger>
                            <TabsTrigger value="intereses" className="flex items-center gap-1.5">
                                <Percent className="w-4 h-4" />
                                {__('Intereses')}
                            </TabsTrigger>
                            <TabsTrigger value="limites" className="flex items-center gap-1.5">
                                <ShieldAlert className="w-4 h-4" />
                                {__('Límites')}
                            </TabsTrigger>
                            <TabsTrigger value="formas_pago" className="flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4" />
                                {__('Formas de Pago')}
                            </TabsTrigger>
                            <TabsTrigger value="vencimientos" className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {__('Vencimientos')}
                            </TabsTrigger>
                            <TabsTrigger value="recordatorios" className="flex items-center gap-1.5">
                                <Bell className="w-4 h-4" />
                                {__('Recordatorios')}
                            </TabsTrigger>
                            <TabsTrigger value="penalizaciones" className="flex items-center gap-1.5">
                                <AlertOctagon className="w-4 h-4" />
                                {__('Penalizaciones')}
                            </TabsTrigger>
                            <TabsTrigger value="reglas" className="flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                {__('Reglas Cliente')}
                            </TabsTrigger>
                            <TabsTrigger value="aprobaciones" className="flex items-center gap-1.5">
                                <CheckSquare className="w-4 h-4" />
                                {__('Aprobaciones')}
                            </TabsTrigger>
                            <TabsTrigger value="documentos" className="flex items-center gap-1.5">
                                <FileText className="w-4 h-4" />
                                {__('Documentos')}
                            </TabsTrigger>
                            <TabsTrigger value="seguridad" className="flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4" />
                                {__('Seguridad')}
                            </TabsTrigger>
                            <TabsTrigger value="logs" className="flex items-center gap-1.5">
                                <History className="w-4 h-4" />
                                {__('Bitácora')}
                            </TabsTrigger>
                        </TabsList>

                        {/* 1. GENERAL */}
                        <TabsContent value="general" className="mt-4 p-6 bg-white dark:bg-slate-900 rounded-xl border shadow-sm space-y-6">
                            <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                                <Settings className="w-5 h-5 text-indigo-600" />
                                {__('Configuración General de Crédito')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                                    <div>
                                        <Label className="font-semibold text-base">{__('Activar Ventas a Crédito')}</Label>
                                        <p className="text-xs text-muted-foreground">{__('Habilita el módulo de crédito en el punto de venta.')}</p>
                                    </div>
                                    <Switch checked={data.activo} onCheckedChange={(val) => setData('activo', val)} />
                                </div>

                                <div className="space-y-2">
                                    <Label>{__('Plazo por Defecto (Días)')}</Label>
                                    <Select value={String(data.plazo_defecto_dias)} onValueChange={(val) => setData('plazo_defecto_dias', Number(val))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="7">7 {__('Días')}</SelectItem>
                                            <SelectItem value="15">15 {__('Días')}</SelectItem>
                                            <SelectItem value="30">30 {__('Días')}</SelectItem>
                                            <SelectItem value="45">45 {__('Días')}</SelectItem>
                                            <SelectItem value="60">60 {__('Días')}</SelectItem>
                                            <SelectItem value="90">90 {__('Días')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>{__('Límite de Crédito por Defecto')}</Label>
                                    <Input type="number" step="0.01" value={data.limite_defecto} onChange={(e) => setData('limite_defecto', parseFloat(e.target.value) || 0)} />
                                </div>

                                <div className="space-y-2">
                                    <Label>{__('Días de Gracia')}</Label>
                                    <Input type="number" min="0" value={data.dias_gracia} onChange={(e) => setData('dias_gracia', parseInt(e.target.value) || 0)} />
                                    <p className="text-xs text-muted-foreground">{__('Días adicionales sin mora tras el vencimiento.')}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>{__('Moneda de Crédito')}</Label>
                                    <Input value={data.moneda} onChange={(e) => setData('moneda', e.target.value)} />
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                                    <div>
                                        <Label className="font-semibold text-base">{__('Permitir Modificar Límite en POS')}</Label>
                                        <p className="text-xs text-muted-foreground">{__('Permite al cajero ajustar el límite al facturar.')}</p>
                                    </div>
                                    <Switch checked={data.permite_modificar_limite} onCheckedChange={(val) => setData('permite_modificar_limite', val)} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* 2. INTERESES */}
                        <TabsContent value="intereses" className="mt-4 p-6 bg-white dark:bg-slate-900 rounded-xl border shadow-sm space-y-6">
                            <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                                <Percent className="w-5 h-5 text-indigo-600" />
                                {__('Configuración de Intereses y Mora')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                                    <div>
                                        <Label className="font-semibold text-base">{__('Cobrar Intereses por Mora')}</Label>
                                        <p className="text-xs text-muted-foreground">{__('Aplica recargos a créditos vencidos.')}</p>
                                    </div>
                                    <Switch checked={data.interes_activado} onCheckedChange={(val) => setData('interes_activado', val)} />
                                </div>

                                <div className="space-y-2">
                                    <Label>{__('Tipo de Cálculo')}</Label>
                                    <Select value={data.interes_calculo} onValueChange={(val) => setData('interes_calculo', val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sin_interes">{__('Sin Intereses')}</SelectItem>
                                            <SelectItem value="fijo">{__('Interés Fijo')}</SelectItem>
                                            <SelectItem value="porcentual">{__('Interés Porcentual')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>{__('Frecuencia de Interés')}</Label>
                                    <Select value={data.interes_tipo} onValueChange={(val) => setData('interes_tipo', val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="diario">{__('Diario (% / día)')}</SelectItem>
                                            <SelectItem value="mensual">{__('Mensual (% / mes)')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>{__('Valor del Interés (% o Monto)')}</Label>
                                    <Input type="number" step="0.01" value={data.interes_valor} onChange={(e) => setData('interes_valor', parseFloat(e.target.value) || 0)} />
                                </div>

                                <div className="space-y-2">
                                    <Label>{__('Aplicar Interés Después de (Días de Atraso)')}</Label>
                                    <Input type="number" min="0" value={data.interes_aplicar_despues_dias} onChange={(e) => setData('interes_aplicar_despues_dias', parseInt(e.target.value) || 0)} />
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                                    <div>
                                        <Label className="font-semibold text-base">{__('Interés Capitalizable')}</Label>
                                        <p className="text-xs text-muted-foreground">{__('Suma el interés generado al capital adeudado.')}</p>
                                    </div>
                                    <Switch checked={data.interes_capitalizable} onCheckedChange={(val) => setData('interes_capitalizable', val)} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* 3. LÍMITES DE CRÉDITO */}
                        <TabsContent value="limites" className="mt-4 p-6 bg-white dark:bg-slate-900 rounded-xl border shadow-sm space-y-6">
                            <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                                {__('Gestión de Límites de Crédito')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>{__('Acción al Exceder el Límite')}</Label>
                                    <Select value={data.limite_accion_excedido} onValueChange={(val) => setData('limite_accion_excedido', val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bloquear">{__('Bloquear Venta')}</SelectItem>
                                            <SelectItem value="advertir">{__('Advertir Solamente')}</SelectItem>
                                            <SelectItem value="autorizacion">{__('Solicitar Autorización')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                                    <div>
                                        <Label className="font-semibold text-base">{__('Mostrar Crédito Disponible en POS')}</Label>
                                        <p className="text-xs text-muted-foreground">{__('Muestra saldo y crédito libre al seleccionar cliente.')}</p>
                                    </div>
                                    <Switch checked={data.mostrar_credito_disponible} onCheckedChange={(val) => setData('mostrar_credito_disponible', val)} />
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                                    <div>
                                        <Label className="font-semibold text-base">{__('Permite Exceder Límite con Clave')}</Label>
                                        <p className="text-xs text-muted-foreground">{__('Un supervisor puede autorizar excedentes.')}</p>
                                    </div>
                                    <Switch checked={data.permite_exceder_limite} onCheckedChange={(val) => setData('permite_exceder_limite', val)} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* 4. FORMAS DE PAGO */}
                        <TabsContent value="formas_pago" className="mt-4 p-6 bg-white dark:bg-slate-900 rounded-xl border shadow-sm space-y-6">
                            <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                                <DollarSign className="w-5 h-5 text-indigo-600" />
                                {__('Formas y Frecuencia de Pago')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>{__('Modalidad de Pago por Defecto')}</Label>
                                    <Select value={data.forma_pago_tipo} onValueChange={(val) => setData('forma_pago_tipo', val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pago_unico">{__('Pago Único al Vencimiento')}</SelectItem>
                                            <SelectItem value="cuotas_semanales">{__('Cuotas Semanales')}</SelectItem>
                                            <SelectItem value="quincenales">{__('Cuotas Quincenales')}</SelectItem>
                                            <SelectItem value="mensuales">{__('Cuotas Mensuales')}</SelectItem>
                                            <SelectItem value="personalizadas">{__('Plan Personalizado')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>{__('Número Máximo de Cuotas')}</Label>
                                    <Input type="number" min="1" value={data.max_cuotas} onChange={(e) => setData('max_cuotas', parseInt(e.target.value) || 1)} />
                                </div>

                                <div className="space-y-2">
                                    <Label>{__('Pago Inicial Mínimo (%)')}</Label>
                                    <Input type="number" step="0.01" value={data.pago_minimo_porcentaje} onChange={(e) => setData('pago_minimo_porcentaje', parseFloat(e.target.value) || 0)} />
                                </div>

                                <div className="space-y-2">
                                    <Label>{__('Abono Mínimo Aceptado')}</Label>
                                    <Input type="number" step="0.01" value={data.abono_minimo} onChange={(e) => setData('abono_minimo', parseFloat(e.target.value) || 0)} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* 5. VENCIMIENTOS */}
                        <TabsContent value="vencimientos" className="mt-4 p-6 bg-white dark:bg-slate-900 rounded-xl border shadow-sm space-y-6">
                            <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                                {__('Reglas de Vencimiento y Calendario')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>{__('Cálculo de Fecha de Vencimiento')}</Label>
                                    <Select value={data.vencimiento_tipo} onValueChange={(val) => setData('vencimiento_tipo', val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dias_despues">{__('X Días después de la compra')}</SelectItem>
                                            <SelectItem value="dia_especifico_mes">{__('Día específico del mes subsiguiente')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                                    <div>
                                        <Label className="font-semibold text-base">{__('Saltar Domingos')}</Label>
                                        <p className="text-xs text-muted-foreground">{__('Si vence domingo, traslada al lunes.')}</p>
                                    </div>
                                    <Switch checked={data.saltar_domingos} onCheckedChange={(val) => setData('saltar_domingos', val)} />
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                                    <div>
                                        <Label className="font-semibold text-base">{__('Saltar Festivos')}</Label>
                                        <p className="text-xs text-muted-foreground">{__('Ajusta vencimiento al siguiente día hábil.')}</p>
                                    </div>
                                    <Switch checked={data.saltar_festivos} onCheckedChange={(val) => setData('saltar_festivos', val)} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* 6. RECORDATORIOS */}
                        <TabsContent value="recordatorios" className="mt-4 p-6 bg-white dark:bg-slate-900 rounded-xl border shadow-sm space-y-6">
                            <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                                <Bell className="w-5 h-5 text-indigo-600" />
                                {__('Notificaciones y Recordatorios de Cobro')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>{__('Recordar Días Antes del Vencimiento')}</Label>
                                    <Input type="number" min="0" value={data.recordatorio_dias_antes} onChange={(e) => setData('recordatorio_dias_antes', parseInt(e.target.value) || 0)} />
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                                    <div>
                                        <Label className="font-semibold text-base">{__('Notificar el Día del Vencimiento')}</Label>
                                        <p className="text-xs text-muted-foreground">{__('Envía alerta automática el día límite.')}</p>
                                    </div>
                                    <Switch checked={data.recordatorio_en_vencimiento} onCheckedChange={(val) => setData('recordatorio_en_vencimiento', val)} />
                                </div>

                                <div className="space-y-4 col-span-2 border-t pt-4">
                                    <Label className="font-bold text-base">{__('Canales de Envío Habilitados')}</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="flex items-center justify-between p-3 border rounded-md">
                                            <span className="font-medium text-sm">{__('WhatsApp API')}</span>
                                            <Switch checked={data.canal_whatsapp} onCheckedChange={(val) => setData('canal_whatsapp', val)} />
                                        </div>
                                        <div className="flex items-center justify-between p-3 border rounded-md">
                                            <span className="font-medium text-sm">{__('Correo Electrónico')}</span>
                                            <Switch checked={data.canal_email} onCheckedChange={(val) => setData('canal_email', val)} />
                                        </div>
                                        <div className="flex items-center justify-between p-3 border rounded-md">
                                            <span className="font-medium text-sm">{__('SMS')}</span>
                                            <Switch checked={data.canal_sms} onCheckedChange={(val) => setData('canal_sms', val)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* 7. PENALIZACIONES */}
                        <TabsContent value="penalizaciones" className="mt-4 p-6 bg-white dark:bg-slate-900 rounded-xl border shadow-sm space-y-6">
                            <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                                <AlertOctagon className="w-5 h-5 text-indigo-600" />
                                {__('Penalizaciones por Incumplimiento')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>{__('Comisión Fija o Porcentual por Mora')}</Label>
                                    <Select value={data.penalizacion_tipo} onValueChange={(val) => setData('penalizacion_tipo', val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ninguna">{__('Sin Penalización Adicional')}</SelectItem>
                                            <SelectItem value="fija">{__('Monto Fijo Administrativo')}</SelectItem>
                                            <SelectItem value="porcentual">{__('% sobre Saldo Moroso')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>{__('Valor Penalización')}</Label>
                                    <Input type="number" step="0.01" value={data.penalizacion_valor} onChange={(e) => setData('penalizacion_valor', parseFloat(e.target.value) || 0)} />
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                                    <div>
                                        <Label className="font-semibold text-base">{__('Suspender Crédito Automáticamente')}</Label>
                                        <p className="text-xs text-muted-foreground">{__('Bloquea crédito al superar días de gracia.')}</p>
                                    </div>
                                    <Switch checked={data.penalizacion_suspender_credito} onCheckedChange={(val) => setData('penalizacion_suspender_credito', val)} />
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                                    <div>
                                        <Label className="font-semibold text-base">{__('Bloquear Nuevas Compras Contado')}</Label>
                                        <p className="text-xs text-muted-foreground">{__('Exige ponerse al día antes de comprar de nuevo.')}</p>
                                    </div>
                                    <Switch checked={data.penalizacion_bloquear_compras} onCheckedChange={(val) => setData('penalizacion_bloquear_compras', val)} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* 8. REGLAS CLIENTE */}
                        <TabsContent value="reglas" className="mt-4 p-6 bg-white dark:bg-slate-900 rounded-xl border shadow-sm space-y-6">
                            <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                                <Users className="w-5 h-5 text-indigo-600" />
                                {__('Categorías y Políticas por Tipo de Cliente')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>{__('Categoría de Cliente Principal')}</Label>
                                    <Select value={data.tipo_cliente_categoria} onValueChange={(val) => setData('tipo_cliente_categoria', val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="contado">{__('Cliente Contado (Sin crédito)')}</SelectItem>
                                            <SelectItem value="credito">{__('Cliente Crédito Estándar')}</SelectItem>
                                            <SelectItem value="vip">{__('Cliente VIP')}</SelectItem>
                                            <SelectItem value="distribuidor">{__('Distribuidor')}</SelectItem>
                                            <SelectItem value="mayorista">{__('Mayorista')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>

                        {/* 9. APROBACIONES */}
                        <TabsContent value="aprobaciones" className="mt-4 p-6 bg-white dark:bg-slate-900 rounded-xl border shadow-sm space-y-6">
                            <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                                <CheckSquare className="w-5 h-5 text-indigo-600" />
                                {__('Niveles de Autorización y Montos')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>{__('Ventas Mayores a Este Monto Requieren Autorización')}</Label>
                                    <Input type="number" step="0.01" value={data.monto_requiere_autorizacion} onChange={(e) => setData('monto_requiere_autorizacion', parseFloat(e.target.value) || 0)} />
                                </div>

                                <div className="space-y-2">
                                    <Label>{__('Rol mínimo que Autoriza Excedentes')}</Label>
                                    <Select value={data.rol_autorizador} onValueChange={(val) => setData('rol_autorizador', val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="supervisor">{__('Supervisor de Caja')}</SelectItem>
                                            <SelectItem value="gerente">{__('Gerente de Tienda')}</SelectItem>
                                            <SelectItem value="admin">{__('Administrador General')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>

                        {/* 10. DOCUMENTOS */}
                        <TabsContent value="documentos" className="mt-4 p-6 bg-white dark:bg-slate-900 rounded-xl border shadow-sm space-y-6">
                            <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                {__('Requisitos Documentales')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <span className="font-medium text-sm">{__('Contrato de Crédito Firmado')}</span>
                                    <Switch checked={data.requiere_contrato} onCheckedChange={(val) => setData('requiere_contrato', val)} />
                                </div>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <span className="font-medium text-sm">{__('Pagaré Adjunto')}</span>
                                    <Switch checked={data.requiere_pagare} onCheckedChange={(val) => setData('requiere_pagare', val)} />
                                </div>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <span className="font-medium text-sm">{__('Firma Digital')}</span>
                                    <Switch checked={data.requiere_firma_digital} onCheckedChange={(val) => setData('requiere_firma_digital', val)} />
                                </div>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <span className="font-medium text-sm">{__('Copia de Identificación')}</span>
                                    <Switch checked={data.requiere_identificacion} onCheckedChange={(val) => setData('requiere_identificacion', val)} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* 11. SEGURIDAD */}
                        <TabsContent value="seguridad" className="mt-4 p-6 bg-white dark:bg-slate-900 rounded-xl border shadow-sm space-y-6">
                            <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                {__('Matriz de Permisos Operativos')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-3 border rounded-md">
                                    <span className="text-sm font-medium">{__('Crear nuevos créditos')}</span>
                                    <Switch checked={data.permiso_crear_credito} onCheckedChange={(val) => setData('permiso_crear_credito', val)} />
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-md">
                                    <span className="text-sm font-medium">{__('Modificar plazos de pago')}</span>
                                    <Switch checked={data.permiso_modificar_plazo} onCheckedChange={(val) => setData('permiso_modificar_plazo', val)} />
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-md">
                                    <span className="text-sm font-medium">{__('Cambiar tasa de interés')}</span>
                                    <Switch checked={data.permiso_cambiar_interes} onCheckedChange={(val) => setData('permiso_cambiar_interes', val)} />
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-md">
                                    <span className="text-sm font-medium">{__('Cambiar límite de crédito')}</span>
                                    <Switch checked={data.permiso_cambiar_limite} onCheckedChange={(val) => setData('permiso_cambiar_limite', val)} />
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-md">
                                    <span className="text-sm font-medium">{__('Eliminar o anular pagos')}</span>
                                    <Switch checked={data.permiso_eliminar_pagos} onCheckedChange={(val) => setData('permiso_eliminar_pagos', val)} />
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-md">
                                    <span className="text-sm font-medium">{__('Condonar intereses de mora')}</span>
                                    <Switch checked={data.permiso_condonar_intereses} onCheckedChange={(val) => setData('permiso_condonar_intereses', val)} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* 12. LOGS / BITÁCORA */}
                        <TabsContent value="logs" className="mt-4 p-6 bg-white dark:bg-slate-900 rounded-xl border shadow-sm space-y-4">
                            <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                                <History className="w-5 h-5 text-indigo-600" />
                                {__('Bitácora de Cambios de Configuración')}
                            </h3>

                            {logs.length === 0 ? (
                                <p className="text-sm text-muted-foreground">{__('No hay registros en la bitácora aún.')}</p>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {logs.map((log) => (
                                        <div key={log.id} className="p-3 border rounded-md text-sm space-y-1 bg-slate-50 dark:bg-slate-800">
                                            <div className="flex justify-between font-semibold">
                                                <span>{log.user?.name || __('Sistema')}</span>
                                                <span className="text-xs text-muted-foreground">{log.created_at}</span>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-300">{log.accion}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    <div className="mt-6 flex justify-end">
                        <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8">
                            <Save className="mr-2 h-5 w-5" />
                            {processing ? __('Guardando...') : __('Guardar Configuración')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
