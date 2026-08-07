import { Head, Link, router } from '@inertiajs/react';
import {
    Wrench,
    Search,
    Eye,
    Smartphone,
    User,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    Package,
    ArrowRight,
    Plus,
    UserCheck,
    Send,
    Sparkles,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess } from '@/utils/notifications';

interface Orden {
    id: number;
    numero_orden: string;
    cliente_nombre: string;
    cliente_telefono?: string;
    marca_nombre: string;
    modelo_nombre: string;
    imei_serie?: string;
    descripcion_falla: string;
    estado_orden: string;
    costo_estimado: number;
    saldo_restante: number;
    fecha_recepcion: string;
    fecha_prometida?: string;
}

interface Props {
    tecnico: {
        id: number;
        name: string;
        email: string;
    };
    counts: {
        en_diagnostico: number;
        en_reparacion: number;
        esperando_repuesto: number;
        reparado_mes: number;
        total_asignados: number;
    };
    misEquiposPendientes: Orden[];
    sinAsignar: Orden[];
    currencySymbol: string;
}

export default function DashboardTecnico({ tecnico, counts, misEquiposPendientes = [], sinAsignar = [], currencySymbol }: Props) {
    const { __ } = useTranslate();
    const [quickSearch, setQuickSearch] = useState('');

    const handleQuickSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickSearch.trim()) return;
        router.get('/admin/reparaciones', { search: quickSearch.trim() });
    };

    const tomarOrden = (ordenId: number) => {
        router.post(`/admin/reparaciones/${ordenId}/update-estado`, {
            tecnico_id: tecnico.id,
            notas_tecnicas: __('Orden tomada por el técnico asignado.'),
        }, {
            onSuccess: () => notifySuccess(__('Te has asignado esta orden correctamente.')),
        });
    };

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'recibido':
                return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 font-bold text-xs">🟡 {__('Recibido')}</Badge>;
            case 'en_diagnostico':
                return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300 font-bold text-xs">🔍 {__('En Diagnóstico')}</Badge>;
            case 'en_reparacion':
                return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300 font-bold text-xs">🛠️ {__('En Reparación')}</Badge>;
            case 'esperando_repuesto':
                return <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-300 font-bold text-xs">📦 {__('Esperando Repuesto')}</Badge>;
            case 'reparado':
                return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 font-bold text-xs">🟢 {__('Listo p/ Entrega')}</Badge>;
            default:
                return <Badge variant="outline">{st}</Badge>;
        }
    };

    const formatDate = (dateStr?: string): string => {
        if (!dateStr) return '';
        try {
            const cleanStr = String(dateStr).split('T')[0];
            const parts = cleanStr.split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
            return new Date(dateStr).toLocaleDateString();
        } catch {
            return dateStr || '';
        }
    };

    const breadcrumbs = [
        { title: __('Dashboard Técnico'), href: '/admin/dashboard' },
    ];

    return (
        <>
            <Head title={__('Dashboard Técnico de Taller')} />

            <div className="w-full space-y-6 pb-12">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* BANNER HERMANO DE BIENVENIDA AL TÉCNICO */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 text-white shadow-lg">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                                🛠️ {__('Panel de Taller & Servicio Técnico')}
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                                {__('¡Hola,')} {tecnico.name}! 👋
                            </h1>
                            <p className="text-xs text-purple-200/90 max-w-xl">
                                {__('Tienes')} <strong className="text-white font-bold">{counts.total_asignados} {__('equipos en trabajo activo')}</strong>. {__('Supervisa diagnósticos, solicita repuestos y registra avances.')}
                            </p>
                        </div>

                        {/* BÚSQUEDA RÁPIDA DE FOLIO / IMEI */}
                        <form onSubmit={handleQuickSearch} className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/20 backdrop-blur-md w-full md:w-80 shrink-0">
                            <Search className="w-4 h-4 text-purple-300 ml-2 shrink-0" />
                            <Input
                                value={quickSearch}
                                onChange={(e) => setQuickSearch(e.target.value)}
                                placeholder={__('Buscar Folio o IMEI...')}
                                className="bg-transparent border-0 text-xs text-white placeholder:text-purple-300/70 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                            />
                            <Button type="submit" size="sm" className="h-8 px-3 text-xs font-bold bg-purple-500 hover:bg-purple-600 text-white rounded-lg shrink-0">
                                {__('Ir')}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* 5 CARDS KPIS DE PRODUCTIVIDAD Y CARGA DE TRABAJO */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 shrink-0">
                                <Wrench className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">{__('En Reparación')}</span>
                                <h3 className="text-2xl font-black font-mono text-purple-700 dark:text-purple-300">{counts.en_reparacion}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 shrink-0">
                                <Search className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">{__('En Diagnóstico')}</span>
                                <h3 className="text-2xl font-black font-mono text-blue-700 dark:text-blue-300">{counts.en_diagnostico}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 shrink-0">
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">{__('Esperando Pieza')}</span>
                                <h3 className="text-2xl font-black font-mono text-orange-700 dark:text-orange-300">{counts.esperando_repuesto}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">{__('Listos este Mes')}</span>
                                <h3 className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{counts.reparado_mes}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">{__('Total Asignados')}</span>
                                <h3 className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">{counts.total_asignados}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* MIS EQUIPOS ASIGNADOS */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 overflow-hidden">
                    <CardHeader className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                            <Wrench className="w-4 h-4 text-purple-600" />
                            {__('Mis Equipos Asignados Activos')} ({misEquiposPendientes.length})
                        </CardTitle>

                        <Link href="/admin/reparaciones">
                            <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-purple-600 hover:text-purple-700">
                                {__('Ver Todas las Órdenes')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">{__('Folio / Fecha')}</th>
                                    <th className="px-4 py-3">{__('Cliente')}</th>
                                    <th className="px-4 py-3">{__('Equipo / Modelo')}</th>
                                    <th className="px-4 py-3">{__('Falla Reportada')}</th>
                                    <th className="px-4 py-3 text-center">{__('Estado')}</th>
                                    <th className="px-4 py-3 text-center">{__('Acción')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {misEquiposPendientes.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                                            {__('No tienes órdenes pendientes asignadas actualmente.')}
                                        </td>
                                    </tr>
                                ) : (
                                    misEquiposPendientes.map((o) => (
                                        <tr key={o.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-3">
                                                <span className="font-mono font-bold text-purple-700 dark:text-purple-400 block">{o.numero_orden}</span>
                                                <span className="text-[10px] text-slate-400 font-mono">📅 {formatDate(o.fecha_recepcion)}</span>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                                                {o.cliente_nombre}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                                                {o.marca_nombre} {o.modelo_nombre}
                                                {o.imei_serie && <span className="text-[10px] font-mono text-slate-400 block font-normal">IMEI: {o.imei_serie}</span>}
                                            </td>
                                            <td className="px-4 py-3 max-w-xs text-slate-600 dark:text-slate-300 truncate" title={o.descripcion_falla}>
                                                {o.descripcion_falla}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getStatusBadge(o.estado_orden)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Link href={`/admin/reparaciones/${o.id}`}>
                                                    <Button size="sm" className="h-7 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1">
                                                        <Eye className="w-3.5 h-3.5" />
                                                        {__('Trabajar')}
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* EQUIPOS SIN ASIGNAR EN TALLER */}
                {sinAsignar.length > 0 && (
                    <Card className="border-amber-200 dark:border-amber-900 shadow-xs bg-amber-50/30 dark:bg-slate-900 overflow-hidden">
                        <CardHeader className="p-4 border-b border-amber-200 dark:border-amber-900/50 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-900 dark:text-amber-300">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                {__('Equipos Recién Ingresados Sin Técnico Asignado')} ({sinAsignar.length})
                            </CardTitle>
                        </CardHeader>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-amber-100/50 dark:bg-slate-950 text-amber-900 dark:text-amber-200 uppercase text-[10px] font-bold border-b border-amber-200 dark:border-amber-900/50">
                                    <tr>
                                        <th className="px-4 py-3">{__('Folio / Fecha')}</th>
                                        <th className="px-4 py-3">{__('Cliente')}</th>
                                        <th className="px-4 py-3">{__('Equipo')}</th>
                                        <th className="px-4 py-3">{__('Falla')}</th>
                                        <th className="px-4 py-3 text-center">{__('Acción')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-100 dark:divide-slate-800">
                                    {sinAsignar.map((o) => (
                                        <tr key={o.id} className="hover:bg-amber-100/30 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-3 font-mono font-bold text-amber-900 dark:text-amber-200">{o.numero_orden}</td>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{o.cliente_nombre}</td>
                                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{o.marca_nombre} {o.modelo_nombre}</td>
                                            <td className="px-4 py-3 max-w-xs text-slate-600 dark:text-slate-300 truncate">{o.descripcion_falla}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Button size="sm" onClick={() => tomarOrden(o.id)} className="h-7 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1">
                                                    <UserCheck className="w-3.5 h-3.5" />
                                                    {__('Tomar Orden')}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </>
    );
}
