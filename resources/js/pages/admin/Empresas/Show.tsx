import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Clock,
    Activity,
    Shield,
    Users,
    Store,
    Package,
    ShoppingCart,
    Wrench,
    CreditCard,
    Globe,
    Radio,
    Laptop,
    Smartphone,
    Monitor,
    ExternalLink,
    AlertCircle,
    Calendar,
    Phone,
    Mail,
    MapPin,
    DollarSign,
    CheckCircle,
    TrendingUp,
    FileText,
    History
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslate } from '@/hooks/use-translate';

interface PageProps {
    empresa: {
        id: number;
        razon_social: string;
        nombre_comercial?: string | null;
        documento: string;
        email?: string | null;
        telefono?: string | null;
        direccion?: string | null;
        representante_legal?: string | null;
        status: boolean;
        logo?: string | null;
        logo_mini?: string | null;
        subscription_status: string;
        pais?: {
            id: number;
            nombre: string;
            codigo_iso2?: string | null;
        } | null;
        created_at: string;
    };
    profile: {
        metrics: {
            empresa_id: number;
            is_online: boolean;
            online_users_count: number;
            total_users_count: number;
            activity_status: 'online' | 'active_today' | 'recent' | 'inactive' | 'never';
            activity_status_label: string;
            last_activity_at: string | null;
            last_activity_formatted: string;
            last_activity_for_humans: string;
            last_activity_type: string;
            sales_30d: number;
            amount_30d: number;
            total_sales: number;
            repairs_30d: number;
            total_repairs: number;
        };
        active_sessions: Array<{
            id: string;
            user_name: string;
            user_email: string;
            ip_address: string;
            os: string;
            browser: string;
            device: string;
            is_live: boolean;
            last_activity_formatted: string;
            last_activity_human: string;
        }>;
        stats: {
            productos: {
                total: number;
                con_stock: number;
                sin_stock: number;
            };
            clientes_total: number;
            sucursales_total: number;
            usuarios_total: number;
            cajas: {
                total: number;
                abiertas: number;
            };
            ventas: {
                total_count: number;
                total_monto: number;
                mes_count: number;
                mes_monto: number;
            };
            reparaciones: {
                total_count: number;
                mes_count: number;
                en_proceso: number;
                listas: number;
                entregadas: number;
            };
            actividades_total: number;
        };
        adoption: {
            score: number;
            health_level: string;
            completed_steps: number;
            total_steps: number;
            checklist: Array<{
                key: string;
                title: string;
                description: string;
                completed: boolean;
            }>;
        };
        sucursales: Array<{
            id: number;
            nombre: string;
            telefono?: string | null;
            direccion?: string | null;
            is_principal: boolean;
            status: boolean;
            users_count: number;
        }>;
        usuarios: Array<{
            id: number;
            name: string;
            email: string;
            telefono?: string | null;
            status: string | boolean;
            roles: string[];
            last_login_human: string;
            last_login_formatted?: string | null;
            created_at?: string | null;
        }>;
        ultimas_ventas: Array<{
            id: number;
            codigo_ticket: string;
            cliente_nombre: string;
            total: number;
            metodo_pago: string;
            estado: string;
            fecha?: string | null;
            fecha_human?: string | null;
        }>;
        ultimas_reparaciones: Array<{
            id: number;
            numero_orden: string;
            cliente_nombre: string;
            dispositivo: string;
            estado_orden: string;
            costo_estimado: number;
            fecha?: string | null;
            fecha_human?: string | null;
        }>;
        actividades_recientes: Array<{
            id: number;
            log_name: string;
            description: string;
            event?: string | null;
            subject_type?: string | null;
            causer_name: string;
            created_at_formatted?: string | null;
            created_at_human?: string | null;
        }>;
        subscription: {
            nombre_plan: string;
            estado: string;
            estado_legible: string;
            dias_restantes: number;
            fecha_vencimiento: string;
            is_exempt: boolean;
        };
        historial_pagos: Array<{
            id: number;
            monto: number;
            ciclo_meses: number;
            metodo_pago: string;
            referencia_pago?: string | null;
            comprobante_path?: string | null;
            estado: string;
            created_at?: string | null;
            aprobado_at?: string | null;
        }>;
    };
}

export default function EmpresaShow({ empresa, profile }: PageProps) {
    const { __ } = useTranslate();
    const [activeTab, setActiveTab] = useState<string>('resumen');

    const breadcrumbs = [
        { title: __('Companies'), href: '/admin/empresas' },
        { title: empresa.razon_social, href: '#' },
    ];

    const {
        metrics = {
            is_online: false,
            online_users_count: 0,
            activity_status: 'never',
            activity_status_label: 'Sin actividad',
            last_activity_for_humans: 'Sin registro',
            last_activity_formatted: '—',
            last_activity_type: 'Ninguno',
            sales_30d: 0,
            amount_30d: 0,
            total_sales: 0,
            repairs_30d: 0,
            total_repairs: 0,
        },
        stats = {
            productos: { total: 0, con_stock: 0, sin_stock: 0 },
            clientes_total: 0,
            sucursales_total: 0,
            usuarios_total: 0,
            cajas: { total: 0, abiertas: 0 },
            ventas: { total_count: 0, total_monto: 0, mes_count: 0, mes_monto: 0 },
            reparaciones: { total_count: 0, mes_count: 0, en_proceso: 0, listas: 0, entregadas: 0 },
            actividades_total: 0,
        },
        adoption = { score: 0, health_level: '', completed_steps: 0, total_steps: 0, checklist: [] },
        active_sessions = [],
        sucursales = [],
        usuarios = [],
        ultimas_ventas = [],
        ultimas_reparaciones = [],
        actividades_recientes = [],
        subscription = { nombre_plan: '', estado: '', estado_legible: '', dias_restantes: 0, fecha_vencimiento: '', is_exempt: false },
        historial_pagos = [],
    } = profile || {};

    const getActivityBadge = () => {
        if (metrics.is_online) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 shadow-sm animate-pulse">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    {__('En línea ahora')} ({metrics.online_users_count} {metrics.online_users_count === 1 ? __('usuario') : __('usuarios')})
                </span>
            );
        }

        switch (metrics.activity_status) {
            case 'active_today':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {__('Activo hoy')}
                    </span>
                );
            case 'recent':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        {metrics.activity_status_label}
                    </span>
                );
            case 'inactive':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                        {metrics.activity_status_label}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800">
                        <History className="w-3.5 h-3.5 text-slate-400" />
                        {__('Sin actividad registrada')}
                    </span>
                );
        }
    };

    return (
        <>
            <Head title={`${__('Detalle de Empresa')} - ${empresa.razon_social}`} />

            <div className="space-y-6 pb-12">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Botón Volver y Acciones de Cabecera */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Link
                        href="/admin/empresas"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        {__('Volver al listado de Empresas')}
                    </Link>

                    <div className="flex items-center gap-2">
                        <Link
                            href={`/monitoring/activities?empresa_id=${empresa.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-all shadow-sm"
                        >
                            <Activity className="w-3.5 h-3.5 text-indigo-500" />
                            {__('Ver Auditoría Completa')}
                            <ExternalLink className="w-3 h-3 text-muted-foreground ml-0.5" />
                        </Link>
                        <Link
                            href="/monitoring/sessions"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-all shadow-sm"
                        >
                            <Radio className="w-3.5 h-3.5 text-emerald-500" />
                            {__('Monitoreo en Vivo')}
                            <ExternalLink className="w-3 h-3 text-muted-foreground ml-0.5" />
                        </Link>
                    </div>
                </div>

                {/* Header Principal de la Empresa */}
                <Card className="overflow-hidden border border-border/80 shadow-sm bg-gradient-to-br from-card via-card to-muted/20">
                    <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <Avatar className="w-16 h-16 rounded-xl border-2 border-border shadow-sm bg-muted">
                                    <AvatarImage src={empresa.logo || empresa.logo_mini || ''} alt={empresa.razon_social} className="object-cover" />
                                    <AvatarFallback className="rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-lg">
                                        <Building2 className="w-8 h-8" />
                                    </AvatarFallback>
                                </Avatar>

                                <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                                            {empresa.razon_social}
                                        </h1>
                                        {empresa.nombre_comercial && (
                                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800">
                                                {empresa.nombre_comercial}
                                            </span>
                                        )}
                                        {getActivityBadge()}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground">
                                        <span className="font-mono font-medium text-foreground">
                                            {__('Documento')}: {empresa.documento}
                                        </span>
                                        {empresa.pais && (
                                            <span className="flex items-center gap-1">
                                                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                                                {empresa.pais.nombre}
                                            </span>
                                        )}
                                        {empresa.telefono && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                                {empresa.telefono}
                                            </span>
                                        )}
                                        {empresa.email && (
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                                                {empresa.email}
                                            </span>
                                        )}
                                    </div>

                                    {empresa.direccion && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                                            {empresa.direccion}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Estado de Suscripción & Exención */}
                            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2 p-3 rounded-xl bg-muted/40 border border-border/60">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">{__('Plan SaaS')}:</span>
                                    <Badge className="bg-indigo-600 text-white font-bold text-xs">
                                        {subscription.nombre_plan}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">{__('Vigencia')}:</span>
                                    <Badge
                                        variant="outline"
                                        className={
                                            subscription.is_exempt
                                                ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30 font-bold'
                                                : subscription.estado === 'active'
                                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold'
                                                    : subscription.estado === 'trial'
                                                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 font-bold'
                                                        : 'bg-rose-500/10 text-rose-600 border-rose-500/30 font-bold'
                                        }
                                    >
                                        {subscription.estado_legible}
                                    </Badge>
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                    {__('Vence')}: <strong className="font-mono text-foreground">{subscription.fecha_vencimiento}</strong>
                                </span>
                            </div>
                        </div>

                        {/* Barra de Diagnóstico de Salud / Onboarding */}
                        <div className="mt-6 pt-5 border-t border-border/60">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold text-foreground">
                                        {__('Nivel de Adopción de la Plataforma (Onboarding Health)')}
                                    </span>
                                    <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0">
                                        {adoption.health_level}
                                    </Badge>
                                </div>
                                <span className="text-xs font-mono font-bold text-primary">
                                    {adoption.score}% ({adoption.completed_steps}/{adoption.total_steps} {__('hitos completados')})
                                </span>
                            </div>
                            <Progress value={adoption.score} className="h-2 rounded-full" />

                            {/* Checklist horizontal de hitos */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-3.5">
                                {adoption.checklist.map((item) => (
                                    <div
                                        key={item.key}
                                        title={item.description}
                                        className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[11px] transition-colors ${item.completed
                                                ? 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                                                : 'bg-muted/40 text-muted-foreground border-border/50 opacity-60'
                                            }`}
                                    >
                                        {item.completed ? (
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                        ) : (
                                            <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 flex-shrink-0" />
                                        )}
                                        <span className="truncate font-medium">{item.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 6 Tarjetas de Estadísticas Clave de Negocio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* Ventas */}
                    <Card className="border border-border/70 shadow-sm hover:shadow transition-shadow">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="text-xs font-semibold uppercase tracking-wider">{__('Ventas')}:</span>
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <ShoppingCart className="w-4 h-4" />
                                </div>
                            </div>
                            <div>
                                <p className="text-xl font-black text-foreground font-mono">{stats.ventas.total_count}</p>
                                <p className="text-[11px] text-muted-foreground font-mono">
                                    ${stats.ventas.total_monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {__('facturado')}
                                </p>
                            </div>
                            <div className="pt-1.5 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
                                <span>{__('Últimos 30d')}:</span>
                                <strong className="font-mono text-emerald-600 dark:text-emerald-400">{stats.ventas.mes_count} ventas</strong>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reparaciones / Taller */}
                    <Card className="border border-border/70 shadow-sm hover:shadow transition-shadow">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="text-xs font-semibold uppercase tracking-wider">{__('Taller / O.S.')}:</span>
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <Wrench className="w-4 h-4" />
                                </div>
                            </div>
                            <div>
                                <p className="text-xl font-black text-foreground font-mono">{stats.reparaciones.total_count}</p>
                                <p className="text-[11px] text-muted-foreground">
                                    {stats.reparaciones.en_proceso} {__('en taller')}
                                </p>
                            </div>
                            <div className="pt-1.5 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
                                <span>{__('Últimos 30d')}:</span>
                                <strong className="font-mono text-blue-600 dark:text-blue-400">{stats.reparaciones.mes_count} órdenes</strong>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Productos / Inventario */}
                    <Card className="border border-border/70 shadow-sm hover:shadow transition-shadow">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="text-xs font-semibold uppercase tracking-wider">{__('Catálogo')}:</span>
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                    <Package className="w-4 h-4" />
                                </div>
                            </div>
                            <div>
                                <p className="text-xl font-black text-foreground font-mono">{stats.productos.total}</p>
                                <p className="text-[11px] text-muted-foreground">
                                    {stats.productos.con_stock} {__('con existencias')}
                                </p>
                            </div>
                            <div className="pt-1.5 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
                                <span>{__('Sin stock')}:</span>
                                <strong className="font-mono text-rose-500">{stats.productos.sin_stock}</strong>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Clientes */}
                    <Card className="border border-border/70 shadow-sm hover:shadow transition-shadow">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="text-xs font-semibold uppercase tracking-wider">{__('Clientes')}:</span>
                                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                    <Users className="w-4 h-4" />
                                </div>
                            </div>
                            <div>
                                <p className="text-xl font-black text-foreground font-mono">{stats.clientes_total}</p>
                                <p className="text-[11px] text-muted-foreground">{__('cartera registrada')}</p>
                            </div>
                            <div className="pt-1.5 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
                                <span>{__('Cajas registradas')}:</span>
                                <strong className="font-mono text-foreground">{stats.cajas.total}</strong>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sucursales */}
                    <Card className="border border-border/70 shadow-sm hover:shadow transition-shadow">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="text-xs font-semibold uppercase tracking-wider">{__('Sucursales')}:</span>
                                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <Store className="w-4 h-4" />
                                </div>
                            </div>
                            <div>
                                <p className="text-xl font-black text-foreground font-mono">{stats.sucursales_total}</p>
                                <p className="text-[11px] text-muted-foreground">{__('sedes operativas')}</p>
                            </div>
                            <div className="pt-1.5 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
                                <span>{__('Cajas abiertas')}:</span>
                                <strong className={`font-mono ${stats.cajas.abiertas > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                    {stats.cajas.abiertas} {__('activas')}
                                </strong>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Usuarios & En Línea */}
                    <Card className="border border-border/70 shadow-sm hover:shadow transition-shadow">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="text-xs font-semibold uppercase tracking-wider">{__('Empleados')}:</span>
                                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                                    <Radio className="w-4 h-4" />
                                </div>
                            </div>
                            <div>
                                <p className="text-xl font-black text-foreground font-mono">{stats.usuarios_total}</p>
                                <p className="text-[11px] text-muted-foreground">{__('usuarios del equipo')}</p>
                            </div>
                            <div className="pt-1.5 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
                                <span>{__('Conectados ahora')}:</span>
                                <strong className={`font-mono ${metrics.online_users_count > 0 ? 'text-emerald-500 font-bold' : 'text-muted-foreground'}`}>
                                    {metrics.online_users_count} en vivo
                                </strong>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs de Detalle */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="bg-muted p-1 rounded-xl border flex flex-wrap gap-1 h-auto">
                        <TabsTrigger value="resumen" className="text-xs font-semibold gap-1.5 py-2 px-3">
                            <Activity className="w-3.5 h-3.5" />
                            {__('Telemetría & Conexión en Vivo')}
                        </TabsTrigger>
                        <TabsTrigger value="movimientos" className="text-xs font-semibold gap-1.5 py-2 px-3">
                            <History className="w-3.5 h-3.5" />
                            {__('Feed de Movimientos (Auditoría)')}
                            <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">
                                {actividades_recientes.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="operaciones" className="text-xs font-semibold gap-1.5 py-2 px-3">
                            <ShoppingCart className="w-3.5 h-3.5" />
                            {__('Ventas & Taller')}
                        </TabsTrigger>
                        <TabsTrigger value="equipo" className="text-xs font-semibold gap-1.5 py-2 px-3">
                            <Users className="w-3.5 h-3.5" />
                            {__('Usuarios & Sucursales')}
                        </TabsTrigger>
                        <TabsTrigger value="pagos" className="text-xs font-semibold gap-1.5 py-2 px-3">
                            <CreditCard className="w-3.5 h-3.5" />
                            {__('Suscripción & Pagos')}
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Telemetría & Conectividad en Vivo */}
                    <TabsContent value="resumen" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Tarjeta de Último Acceso Registrado */}
                            <Card className="border shadow-sm lg:col-span-1">
                                <CardHeader className="pb-3 border-b bg-muted/20">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-primary" />
                                        {__('Última Interacción Registrada')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    <div className="p-3.5 rounded-xl bg-muted/40 border space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">{__('Tipo de evento')}:</span>
                                            <Badge variant="outline" className="font-semibold text-xs">
                                                {metrics.last_activity_type}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">{__('Fecha y hora')}:</span>
                                            <span className="text-xs font-mono font-bold text-foreground">
                                                {metrics.last_activity_formatted}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">{__('Tiempo transcurrido')}:</span>
                                            <strong className="text-xs font-bold text-primary">
                                                {metrics.last_activity_for_humans}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-center justify-between py-1.5 border-b">
                                            <span className="text-muted-foreground">{__('Total actividades en auditoría')}:</span>
                                            <span className="font-mono font-bold">{stats.actividades_total}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 border-b">
                                            <span className="text-muted-foreground">{__('Cajas abiertas ahora')}:</span>
                                            <span className="font-mono font-bold">{stats.cajas.abiertas} de {stats.cajas.total}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1.5">
                                            <span className="text-muted-foreground">{__('Ventas últimos 30 días')}:</span>
                                            <span className="font-mono font-bold">{metrics.sales_30d} (${Number(metrics.amount_30d || 0).toFixed(2)})</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Sesiones HTTP Activas / Recientes */}
                            <Card className="border shadow-sm lg:col-span-2 overflow-hidden">
                                <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <Radio className="w-4 h-4 text-emerald-500" />
                                            {__('Sesiones Web y Dispositivos Conectados')}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {__('Usuarios que han interactuado con la plataforma en las últimas 24 horas')}
                                        </CardDescription>
                                    </div>
                                    {metrics.online_users_count > 0 && (
                                        <Badge className="bg-emerald-600 text-white font-bold text-xs animate-pulse">
                                            {metrics.online_users_count} {__('en línea')}
                                        </Badge>
                                    )}
                                </CardHeader>
                                <CardContent className="p-0">
                                    {active_sessions.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/40 text-xs">
                                                    <TableHead>{__('Usuario')}</TableHead>
                                                    <TableHead>{__('Dispositivo / OS')}</TableHead>
                                                    <TableHead>{__('IP')}</TableHead>
                                                    <TableHead className="text-right">{__('Última actividad')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {active_sessions.map((session) => (
                                                    <TableRow key={session.id} className="hover:bg-muted/40">
                                                        <TableCell className="py-2.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="relative flex h-2 w-2">
                                                                    {session.is_live && (
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                    )}
                                                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${session.is_live ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                                                                </span>
                                                                <div>
                                                                    <p className="font-bold text-xs text-foreground">{session.user_name}</p>
                                                                    <p className="text-[11px] text-muted-foreground">{session.user_email}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-2.5 text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-1.5">
                                                                {session.device === 'Mobile' ? (
                                                                    <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                                                                ) : (
                                                                    <Laptop className="w-3.5 h-3.5 text-slate-500" />
                                                                )}
                                                                <span>{session.os} • {session.browser}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-2.5 font-mono text-xs text-muted-foreground">
                                                            {session.ip_address}
                                                        </TableCell>
                                                        <TableCell className="py-2.5 text-right">
                                                            <span className={`text-xs font-medium ${session.is_live ? 'text-emerald-600 font-bold' : 'text-muted-foreground'}`}>
                                                                {session.last_activity_human}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground text-xs">
                                            <Radio className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                                            <p>{__('No hay sesiones web registradas en las últimas 24 horas.')}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Tab 2: Feed de Movimientos (Auditoría Reciente) */}
                    <TabsContent value="movimientos" className="space-y-4">
                        <Card className="border shadow-sm overflow-hidden">
                            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <History className="w-4 h-4 text-primary" />
                                        {__('Historial de Actividades Recientes de la Empresa')}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {__('Eventos de ventas, productos, reparaciones, aperturas de caja e ingresos de usuarios')}
                                    </CardDescription>
                                </div>
                                <Link
                                    href={`/monitoring/activities?empresa_id=${empresa.id}`}
                                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:underline"
                                >
                                    {__('Filtrar todas en Auditoría')}
                                    <ExternalLink className="w-3 h-3" />
                                </Link>
                            </CardHeader>
                            <CardContent className="p-0">
                                {actividades_recientes.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/40 text-xs">
                                                <TableHead>{__('Módulo')}</TableHead>
                                                <TableHead>{__('Descripción del Movimiento')}</TableHead>
                                                <TableHead>{__('Usuario')}</TableHead>
                                                <TableHead className="text-right">{__('Fecha / Hora')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {actividades_recientes.map((act) => (
                                                <TableRow key={act.id} className="hover:bg-muted/40">
                                                    <TableCell className="py-2.5">
                                                        <Badge variant="outline" className="text-[11px] font-semibold uppercase font-mono">
                                                            {act.log_name || 'general'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-2.5 text-xs font-medium text-foreground">
                                                        {act.description}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 text-xs text-muted-foreground">
                                                        {act.causer_name}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 text-right font-mono text-xs text-muted-foreground">
                                                        <span>{act.created_at_human}</span>
                                                        <span className="block text-[10px] text-muted-foreground/70">{act.created_at_formatted}</span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="p-10 text-center text-muted-foreground text-xs">
                                        <Activity className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                                        <p>{__('Esta empresa aún no tiene registros de actividad en la base de datos.')}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab 3: Ventas & Taller */}
                    <TabsContent value="operaciones" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Panel Ventas */}
                            <Card className="border shadow-sm overflow-hidden">
                                <CardHeader className="pb-3 border-b bg-emerald-500/5 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <ShoppingCart className="w-4 h-4 text-emerald-600" />
                                            {__('Últimas Ventas Registradas (POS)')}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {__('Total histórico')}: {stats.ventas.total_count} {__('tickets')}
                                        </CardDescription>
                                    </div>
                                    <Badge className="bg-emerald-600 text-white font-mono text-xs">
                                        ${Number(stats?.ventas?.total_monto || 0).toFixed(2)}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {ultimas_ventas.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/40 text-xs">
                                                    <TableHead>{__('Ticket / Cliente')}</TableHead>
                                                    <TableHead>{__('Método')}</TableHead>
                                                    <TableHead className="text-right">{__('Total')}</TableHead>
                                                    <TableHead className="text-right">{__('Fecha')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {ultimas_ventas.map((v) => (
                                                    <TableRow key={v.id} className="hover:bg-muted/40">
                                                        <TableCell className="py-2.5">
                                                            <p className="font-bold text-xs font-mono">{v.codigo_ticket}</p>
                                                            <p className="text-[11px] text-muted-foreground">{v.cliente_nombre}</p>
                                                        </TableCell>
                                                        <TableCell className="py-2.5 text-xs text-muted-foreground">
                                                            {v.metodo_pago}
                                                        </TableCell>
                                                        <TableCell className="py-2.5 text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                                                            ${Number(v.total || 0).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="py-2.5 text-right text-xs text-muted-foreground font-mono">
                                                            {v.fecha_human}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground text-xs">
                                            <ShoppingCart className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                                            <p>{__('No hay ventas registradas todavía.')}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Panel Taller */}
                            <Card className="border shadow-sm overflow-hidden">
                                <CardHeader className="pb-3 border-b bg-blue-500/5 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <Wrench className="w-4 h-4 text-blue-600" />
                                            {__('Últimas Órdenes de Reparación')}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {__('Total histórico')}: {stats.reparaciones.total_count} {__('órdenes')}
                                        </CardDescription>
                                    </div>
                                    <Badge className="bg-blue-600 text-white font-mono text-xs">
                                        {stats.reparaciones.en_proceso} {__('en taller')}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {ultimas_reparaciones.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/40 text-xs">
                                                    <TableHead>{__('Orden / Dispositivo')}</TableHead>
                                                    <TableHead>{__('Cliente')}</TableHead>
                                                    <TableHead>{__('Estado')}</TableHead>
                                                    <TableHead className="text-right">{__('Fecha')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {ultimas_reparaciones.map((r) => (
                                                    <TableRow key={r.id} className="hover:bg-muted/40">
                                                        <TableCell className="py-2.5">
                                                            <p className="font-bold text-xs font-mono">{r.numero_orden}</p>
                                                            <p className="text-[11px] text-muted-foreground">{r.dispositivo || 'Dispositivo'}</p>
                                                        </TableCell>
                                                        <TableCell className="py-2.5 text-xs text-foreground">
                                                            {r.cliente_nombre}
                                                        </TableCell>
                                                        <TableCell className="py-2.5">
                                                            <Badge variant="outline" className="text-[10px] font-semibold">
                                                                {r.estado_orden}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="py-2.5 text-right text-xs text-muted-foreground font-mono">
                                                            {r.fecha_human}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground text-xs">
                                            <Wrench className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                                            <p>{__('No hay órdenes de reparación registradas todavía.')}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Tab 4: Usuarios & Sucursales */}
                    <TabsContent value="equipo" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Usuarios */}
                            <Card className="border shadow-sm overflow-hidden">
                                <CardHeader className="pb-3 border-b bg-muted/20">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Users className="w-4 h-4 text-primary" />
                                        {__('Usuarios de la Empresa')} ({usuarios.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/40 text-xs">
                                                <TableHead>{__('Nombre / Email')}</TableHead>
                                                <TableHead>{__('Roles')}</TableHead>
                                                <TableHead className="text-right">{__('Última Sesión')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {usuarios.map((u) => (
                                                <TableRow key={u.id} className="hover:bg-muted/40">
                                                    <TableCell className="py-2.5">
                                                        <p className="font-bold text-xs">{u.name}</p>
                                                        <p className="text-[11px] text-muted-foreground">{u.email}</p>
                                                    </TableCell>
                                                    <TableCell className="py-2.5">
                                                        <div className="flex flex-wrap gap-1">
                                                            {u.roles.map((rol) => (
                                                                <Badge key={rol} variant="secondary" className="text-[10px] px-1.5 py-0">
                                                                    {rol}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-2.5 text-right font-mono text-xs text-muted-foreground">
                                                        {u.last_login_human}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* Sucursales */}
                            <Card className="border shadow-sm overflow-hidden">
                                <CardHeader className="pb-3 border-b bg-muted/20">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Store className="w-4 h-4 text-primary" />
                                        {__('Sucursales Registradas')} ({sucursales.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/40 text-xs">
                                                <TableHead>{__('Nombre / Dirección')}</TableHead>
                                                <TableHead>{__('Teléfono')}</TableHead>
                                                <TableHead className="text-right">{__('Usuarios')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sucursales.map((s) => (
                                                <TableRow key={s.id} className="hover:bg-muted/40">
                                                    <TableCell className="py-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-xs">{s.nombre}</p>
                                                            {s.is_principal && (
                                                                <Badge className="bg-indigo-600 text-[10px] text-white px-1.5 py-0">
                                                                    {__('Principal')}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {s.direccion && (
                                                            <p className="text-[11px] text-muted-foreground truncate max-w-xs">{s.direccion}</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 text-xs text-muted-foreground font-mono">
                                                        {s.telefono || '—'}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 text-right font-mono text-xs">
                                                        {s.users_count}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Tab 5: Suscripción & Facturación */}
                    <TabsContent value="pagos" className="space-y-4">
                        <Card className="border shadow-sm overflow-hidden">
                            <CardHeader className="pb-3 border-b bg-muted/20">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-primary" />
                                    {__('Historial de Renovaciones y Pagos')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {historial_pagos.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/40 text-xs">
                                                <TableHead>{__('Fecha')}</TableHead>
                                                <TableHead>{__('Monto')}</TableHead>
                                                <TableHead>{__('Ciclo')}</TableHead>
                                                <TableHead>{__('Método / Referencia')}</TableHead>
                                                <TableHead className="text-right">{__('Estado')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {historial_pagos.map((pago) => (
                                                <TableRow key={pago.id} className="hover:bg-muted/40">
                                                    <TableCell className="py-2.5 font-mono text-xs">
                                                        {pago.created_at}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 font-mono font-bold text-xs text-primary">
                                                        ${Number(pago.monto || 0).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 text-xs">
                                                        {pago.ciclo_meses} {__('mes(es)')}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 text-xs">
                                                        <span className="font-medium">{pago.metodo_pago}</span>
                                                        {pago.referencia_pago && (
                                                            <span className="block text-[11px] font-mono text-muted-foreground">
                                                                Ref: {pago.referencia_pago}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 text-right">
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] font-bold ${pago.estado === 'approved'
                                                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                                                    : pago.estado === 'pending'
                                                                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                                                        : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                                                                }`}
                                                        >
                                                            {pago.estado}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground text-xs">
                                        <CreditCard className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                                        <p>{__('No hay registros de pagos de suscripción para esta empresa.')}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
