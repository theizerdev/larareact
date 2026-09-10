import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CreditCard,
    ExternalLink,
    Mail,
    MapPin,
    Phone,
    Smartphone,
    UserCheck,
    Briefcase,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
} from 'lucide-react';
import React from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { useTranslate } from '@/hooks/use-translate';

interface Cuota {
    id: number;
    numero_cuota: number;
    fecha_vencimiento: string;
    monto_cuota: string | number;
    monto_pagado: string | number;
    saldo_cuota: string | number;
    estado: string;
}

interface Credito {
    id: number;
    codigo_credito: string;
    fecha_inicio: string;
    precio_equipo: string | number;
    monto_inicial: string | number;
    total_credito: string | number;
    saldo_pendiente: string | number;
    estado: string;
    equipo?: {
        imei_1: string;
        color?: string;
        modelo?: {
            nombre: string;
            almacenamiento?: string;
            marca?: {
                nombre: string;
            };
        };
    };
    plan?: {
        nombre: string;
        frecuencia: string;
        numero_cuotas: number;
    };
    cuotas?: Cuota[];
}

interface Cliente {
    id: number;
    nombres: string;
    apellidos: string;
    tipo_documento: string;
    numero_documento: string;
    email?: string | null;
    telefono_principal: string;
    telefono_secundario?: string | null;
    direccion?: string | null;
    ciudad?: string | null;
    empresa_trabajo?: string | null;
    cargo_trabajo?: string | null;
    ingreso_mensual?: string | number | null;
    dia_pago?: string | null;
    limite_credito: string | number;
    estado_crediticio: string;
    observaciones?: string | null;
    created_at: string;
    creditos?: Credito[];
}

interface Props {
    cliente: Cliente;
}

export default function ClienteShow({ cliente }: Props) {
    const { __, currentLocale } = useTranslate();
    const { regional_config } = usePage().props as any;
    const currency = regional_config?.currency_symbol || '$';

    const creditos = cliente.creditos || [];
    const totalFinanciado = creditos.reduce((acc, c) => acc + Number(c.total_credito || 0), 0);
    const saldoPendienteTotal = creditos.reduce((acc, c) => acc + Number(c.saldo_pendiente || 0), 0);
    const limiteDisponible = Math.max(0, Number(cliente.limite_credito) - saldoPendienteTotal);

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'activo':
                return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">{__('Activo')}</Badge>;
            case 'liquidado':
                return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20">{__('Liquidado / Pagado')}</Badge>;
            case 'en_mora':
                return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20">{__('En Mora')}</Badge>;
            default:
                return <Badge variant="outline">{estado}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <Head title={`${__('Expediente')}: ${cliente.nombres} ${cliente.apellidos}`} />

            <Breadcrumbs
                breadcrumbs={[
                    { title: __('Dashboard'), href: '/admin/dashboard' },
                    { title: __('Clientes'), href: '/admin/clientes' },
                    { title: `${cliente.nombres} ${cliente.apellidos}`, href: `/admin/clientes/${cliente.id}` },
                ]}
            />

            {/* Encabezado y Acciones */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-xl">
                        <UserCheck className="size-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                {cliente.nombres} {cliente.apellidos}
                            </h1>
                            <Badge variant="outline" className="font-mono text-xs">
                                {cliente.tipo_documento}-{cliente.numero_documento}
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {__('Cliente desde el :fecha', { fecha: formatDate(cliente.created_at, 'medium', currentLocale) })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/admin/clientes">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="size-4 mr-1" /> {__('Volver a Clientes')}
                        </Button>
                    </Link>
                    <Link href="/admin/creditos/nuevo">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                            <CreditCard className="size-4 mr-1" /> {__('Nueva Venta a Crédito')}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Tarjetas de Resumen Financiero del Cliente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 border-slate-200 dark:border-slate-800">
                    <div className="text-xs font-semibold text-slate-500 uppercase">{__('Límite de Crédito')}</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                        {currency}{Number(cliente.limite_credito).toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{__('Monto máximo financiable')}</div>
                </Card>

                <Card className="p-4 border-slate-200 dark:border-slate-800">
                    <div className="text-xs font-semibold text-slate-500 uppercase">{__('Deuda Actual Pendiente')}</div>
                    <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                        {currency}{saldoPendienteTotal.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{__('En cuotas activas por cobrar')}</div>
                </Card>

                <Card className="p-4 border-slate-200 dark:border-slate-800">
                    <div className="text-xs font-semibold text-slate-500 uppercase">{__('Crédito Disponible')}</div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                        {currency}{limiteDisponible.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{__('Capacidad para nuevos equipos')}</div>
                </Card>

                <Card className="p-4 border-slate-200 dark:border-slate-800">
                    <div className="text-xs font-semibold text-slate-500 uppercase">{__('Historial de Créditos')}</div>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                        {creditos.length}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{__('Contratos totales registrados')}</div>
                </Card>
            </div>

            {/* Información de Contacto y Laboral */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Phone className="size-4 text-blue-600" /> {__('Datos de Contacto y Ubicación')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">{__('Teléfono Principal:')}</span>
                            <a
                                href={`https://wa.me/${cliente.telefono_principal.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-emerald-600 flex items-center gap-1 hover:underline"
                            >
                                {cliente.telefono_principal} <ExternalLink className="size-3" />
                            </a>
                        </div>
                        {cliente.telefono_secundario && (
                            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500">{__('Teléfono Secundario:')}</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">{cliente.telefono_secundario}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">{__('Correo Electrónico:')}</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{cliente.email || __('No registrado')}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">{__('Ciudad / Residencia:')}</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{cliente.ciudad || __('No especificada')}</span>
                        </div>
                        <div className="py-1.5">
                            <span className="text-slate-500 block mb-1">{__('Dirección:')}</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 p-2 rounded block text-xs">
                                {cliente.direccion || __('Sin dirección registrada')}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Briefcase className="size-4 text-indigo-600" /> {__('Información Laboral & Scoring')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">{__('Empresa / Empleador:')}</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{cliente.empresa_trabajo || __('Particular')}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">{__('Cargo / Ocupación:')}</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{cliente.cargo_trabajo || __('No especificado')}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">{__('Ingreso Mensual Aprox:')}</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                                {cliente.ingreso_mensual ? `${currency}${Number(cliente.ingreso_mensual).toFixed(2)}` : __('No verificado')}
                            </span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">{__('Día / Frecuencia de Cobro:')}</span>
                            <span className="font-medium capitalize text-slate-800 dark:text-slate-200">{cliente.dia_pago ? __(cliente.dia_pago) : __('Quincenal')}</span>
                        </div>
                        <div className="py-1.5">
                            <span className="text-slate-500 block mb-1">{__('Observaciones Crediticias:')}</span>
                            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2 rounded">
                                {cliente.observaciones || __('Sin notas adicionales.')}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Listado de Créditos del Cliente */}
            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <CreditCard className="size-4 text-emerald-600" /> {__('Contratos y Créditos Adquiridos')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">{__('Código')}</th>
                                    <th className="px-4 py-3">{__('Dispositivo / IMEI')}</th>
                                    <th className="px-4 py-3">{__('Fecha Venta')}</th>
                                    <th className="px-4 py-3">{__('Plan')}</th>
                                    <th className="px-4 py-3">{__('Total Crédito')}</th>
                                    <th className="px-4 py-3">{__('Saldo Pendiente')}</th>
                                    <th className="px-4 py-3">{__('Estado')}</th>
                                    <th className="px-4 py-3 text-right">{__('Detalle')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {creditos.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">
                                            {__('Este cliente aún no tiene ventas a crédito registradas.')}
                                        </td>
                                    </tr>
                                ) : (
                                    creditos.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                                            <td className="px-4 py-3 font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                                                {c.codigo_credito}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                    {c.equipo?.modelo?.marca?.nombre} {c.equipo?.modelo?.nombre}
                                                </div>
                                                <div className="text-[11px] font-mono text-slate-500">
                                                    IMEI: {c.equipo?.imei_1}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                                                {formatDate(c.fecha_inicio, 'short', currentLocale)}
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                                    {c.plan?.nombre}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                                                {currency}{Number(c.total_credito).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-rose-600 dark:text-rose-400">
                                                {currency}{Number(c.saldo_pendiente).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {getEstadoBadge(c.estado)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link href={`/admin/creditos/${c.id}`}>
                                                    <Button variant="outline" size="sm" className="h-7 text-xs">
                                                        {__('Ver Contrato')}
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

