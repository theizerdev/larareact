import { Head, Link, router } from '@inertiajs/react';
import {
    Wrench,
    Plus,
    Search,
    Eye,
    Printer,
    Send,
    User,
    Smartphone,
    Calendar,
    CheckCircle2,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Filter,
    FileText,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams } from '@/lib/utils';

interface Orden {
    id: number;
    numero_orden: string;
    cliente_nombre: string;
    cliente_telefono?: string;
    tipo_dispositivo: string;
    marca_nombre: string;
    modelo_nombre: string;
    imei_serie?: string;
    descripcion_falla: string;
    estado_orden: string;
    costo_estimado: number;
    anticipo: number;
    saldo_restante: number;
    fecha_recepcion: string;
    fecha_prometida?: string;
    tecnico?: { name: string };
}

interface Props {
    ordenes: {
        data: Orden[];
        links: any[];
        total: number;
        current_page: number;
        last_page: number;
    };
    counts: Record<string, number>;
    tecnicos: { id: number; name: string }[];
    currencySymbol: string;
    filters: {
        search?: string;
        status?: string;
        tecnico_id?: string;
    };
}

export default function IndexReparaciones({ ordenes, counts, tecnicos, currencySymbol, filters }: Props) {
    const { __ } = useTranslate();

    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [tecnicoId, setTecnicoId] = useState(filters.tecnico_id || '');

    const handleFilter = () => {
        router.get(
            '/admin/reparaciones',
            cleanParams({
                search,
                status,
                tecnico_id: tecnicoId,
            }),
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        setTecnicoId('');
        router.get('/admin/reparaciones', {}, { preserveState: true, preserveScroll: true });
    };

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'recibido':
                return <Badge className="bg-slate-700 text-white font-bold">🟡 Recibido</Badge>;
            case 'en_diagnostico':
                return <Badge className="bg-blue-600 text-white font-bold">🔍 En Diagnóstico</Badge>;
            case 'presupuestado':
                return <Badge className="bg-indigo-600 text-white font-bold">💵 Presupuestado</Badge>;
            case 'en_reparacion':
                return <Badge className="bg-purple-600 text-white font-bold">🛠️ En Reparación</Badge>;
            case 'esperando_repuesto':
                return <Badge className="bg-amber-500 text-white font-bold">📦 Esperando Repuesto</Badge>;
            case 'reparado':
                return <Badge className="bg-emerald-600 text-white font-bold">🟢 Listo p/ Entrega</Badge>;
            case 'entregado':
                return <Badge className="bg-slate-900 text-white font-bold">✅ Entregado</Badge>;
            case 'cancelado':
                return <Badge className="bg-rose-600 text-white font-bold">❌ Sin Arreglo / Cancelado</Badge>;
            default:
                return <Badge variant="outline">{st}</Badge>;
        }
    };

    const sendWhatsApp = (o: Orden) => {
        if (!o.cliente_telefono) return;
        const cleanPhone = o.cliente_telefono.replace(/[^0-9]/g, '');
        const msg = encodeURIComponent(
            `Hola ${o.cliente_nombre}, le saludamos del Servicio Técnico. Su equipo ${o.marca_nombre} ${o.modelo_nombre} (Orden ${o.numero_orden}) se encuentra actualmente en estado: *${o.estado_orden.toUpperCase().replace('_', ' ')}*. Saldo pendiente: ${currencySymbol}${o.saldo_restante}.`
        );
        window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Servicio Técnico'), href: '/admin/reparaciones' },
    ];

    return (
        <>
            <Head title={__('Servicio Técnico & Reparaciones')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <ModuleHeader
                        title={__('Taller de Reparaciones & Servicio Técnico')}
                        description={__('Recepción de equipos, diagnóstico, inspección física, control de IMEI y seguimiento de taller.')}
                        icon={<Wrench className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
                    />
                    <Link href="/admin/reparaciones/create">
                        <Button className="h-9 gap-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm">
                            <Plus className="w-4 h-4" />
                            {__('Nueva Recepción de Equipo')}
                        </Button>
                    </Link>
                </div>

                {/* TARJETAS RESUMEN DE ESTADOS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    <div
                        onClick={() => { setStatus('recibido'); router.get('/admin/reparaciones', { status: 'recibido' }); }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl cursor-pointer hover:border-purple-400 transition-all shadow-sm"
                    >
                        <p className="text-[11px] font-bold text-slate-500">{__('Recibidos')}</p>
                        <p className="text-xl font-black text-slate-800 dark:text-slate-100">{counts['recibido'] || 0}</p>
                    </div>
                    <div
                        onClick={() => { setStatus('en_reparacion'); router.get('/admin/reparaciones', { status: 'en_reparacion' }); }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl cursor-pointer hover:border-purple-400 transition-all shadow-sm"
                    >
                        <p className="text-[11px] font-bold text-purple-600">{__('En Reparación')}</p>
                        <p className="text-xl font-black text-purple-700">{counts['en_reparacion'] || 0}</p>
                    </div>
                    <div
                        onClick={() => { setStatus('esperando_repuesto'); router.get('/admin/reparaciones', { status: 'esperando_repuesto' }); }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl cursor-pointer hover:border-amber-400 transition-all shadow-sm"
                    >
                        <p className="text-[11px] font-bold text-amber-600">{__('Esperando Repuesto')}</p>
                        <p className="text-xl font-black text-amber-700">{counts['esperando_repuesto'] || 0}</p>
                    </div>
                    <div
                        onClick={() => { setStatus('reparado'); router.get('/admin/reparaciones', { status: 'reparado' }); }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl cursor-pointer hover:border-emerald-400 transition-all shadow-sm"
                    >
                        <p className="text-[11px] font-bold text-emerald-600">{__('Listos p/ Entrega')}</p>
                        <p className="text-xl font-black text-emerald-700">{counts['reparado'] || 0}</p>
                    </div>
                    <div
                        onClick={() => { setStatus('entregado'); router.get('/admin/reparaciones', { status: 'entregado' }); }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl cursor-pointer hover:border-slate-400 transition-all shadow-sm"
                    >
                        <p className="text-[11px] font-bold text-slate-600">{__('Entregados')}</p>
                        <p className="text-xl font-black text-slate-800 dark:text-slate-100">{counts['entregado'] || 0}</p>
                    </div>
                    <div
                        onClick={handleReset}
                        className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 p-3 rounded-xl cursor-pointer text-center flex flex-col justify-center items-center shadow-sm"
                    >
                        <p className="text-xs font-bold text-purple-700 dark:text-purple-300">{__('Ver Todas')}</p>
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">{ordenes.total} {__('órdenes')}</p>
                    </div>
                </div>

                {/* FILTROS Y BÚSQUEDA */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="relative flex-1 w-full">
                                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={__('Buscar por Folio (REP-001042), Cliente, IMEI o Modelo...')}
                                    className="text-xs pl-9 h-9"
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                />
                            </div>

                            <div className="w-full sm:w-48">
                                <Select value={status} onValueChange={(val) => setStatus(val)}>
                                    <SelectTrigger className="text-xs h-9">
                                        <SelectValue placeholder={__('Todos los estados')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">{__('Todos los estados')}</SelectItem>
                                        <SelectItem value="recibido">🟡 Recibido</SelectItem>
                                        <SelectItem value="en_diagnostico">🔍 En Diagnóstico</SelectItem>
                                        <SelectItem value="en_reparacion">🛠️ En Reparación</SelectItem>
                                        <SelectItem value="esperando_repuesto">📦 Esperando Repuesto</SelectItem>
                                        <SelectItem value="reparado">🟢 Listo p/ Entrega</SelectItem>
                                        <SelectItem value="entregado">✅ Entregado</SelectItem>
                                        <SelectItem value="cancelado">❌ Sin Arreglo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button onClick={handleFilter} size="sm" className="h-9 px-4 text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                                <Filter className="w-3.5 h-3.5 mr-1" />
                                {__('Filtrar')}
                            </Button>
                            {(search || status || tecnicoId) && (
                                <Button onClick={handleReset} variant="outline" size="sm" className="h-9 text-xs">
                                    {__('Limpiar')}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* TABLA DE ÓRDENES */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">{__('Folio / Fecha')}</th>
                                    <th className="px-4 py-3">{__('Cliente')}</th>
                                    <th className="px-4 py-3">{__('Dispositivo / Modelo')}</th>
                                    <th className="px-4 py-3">{__('Falla Reportada')}</th>
                                    <th className="px-4 py-3 text-center">{__('Estado')}</th>
                                    <th className="px-4 py-3 text-right">{__('Presupuesto')}</th>
                                    <th className="px-4 py-3 text-right">{__('Saldo')}</th>
                                    <th className="px-4 py-3 text-center">{__('Acciones')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {ordenes.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                                            {__('No se encontraron órdenes de reparación registradas.')}
                                        </td>
                                    </tr>
                                ) : (
                                    ordenes.data.map((o) => (
                                        <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                                            <td className="px-4 py-3">
                                                <span className="font-bold font-mono text-purple-700 dark:text-purple-400">{o.numero_orden}</span>
                                                <span className="text-[10px] text-slate-400 block">{o.fecha_recepcion ? new Date(o.fecha_recepcion).toLocaleDateString() : ''}</span>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                                                {o.cliente_nombre}
                                                {o.cliente_telefono && <span className="text-[10px] text-slate-400 block">{o.cliente_telefono}</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-slate-800 dark:text-slate-200">{o.marca_nombre} {o.modelo_nombre}</span>
                                                {o.imei_serie && <span className="text-[10px] font-mono text-slate-400 block">IMEI: {o.imei_serie}</span>}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                                                {o.descripcion_falla}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getStatusBadge(o.estado_orden)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                                                {currencySymbol}{Number(o.costo_estimado).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                {currencySymbol}{Number(o.saldo_restante).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Link href={`/admin/reparaciones/${o.id}`}>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-600 hover:text-purple-600">
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </Link>
                                                    {o.cliente_telefono && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => sendWhatsApp(o)}
                                                            className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                                                            title={__('Notificar por WhatsApp')}
                                                        >
                                                            <Send className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {ordenes.links && ordenes.links.length > 3 && (
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                            <Pagination links={ordenes.links} />
                        </div>
                    )}
                </Card>
            </div>
        </>
    );
}
