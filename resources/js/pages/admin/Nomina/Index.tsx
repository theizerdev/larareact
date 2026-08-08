import React, { useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Wallet, CalendarDays, Users, CircleDollarSign, Lock, CheckCircle2, Building2, Printer, FileText } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslate } from '@/hooks/use-translate';

interface Sucursal {
    id: number;
    nombre: string;
}

interface Role {
    id: number;
    name: string;
}

interface EligibleUser {
    id: number;
    name: string;
    email: string;
    sueldo_base: number;
    roles: Role[];
}

interface NominaDetalle {
    id: number;
    user_id: number;
    rol_nombre?: string | null;
    sueldo_base_snapshot: number;
    bonos: number;
    descuentos: number;
    comision_reparaciones: number;
    monto_pagado_reparaciones_periodo: number;
    reparaciones_reparadas_periodo: number;
    total_neto: number;
    estado_pago: 'pendiente' | 'pagado';
    fecha_pago?: string | null;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

interface Nomina {
    id: number;
    year: number;
    month: number;
    estado: 'borrador' | 'cerrada' | 'pagada';
    total_bruto: number;
    total_bonos: number;
    total_descuentos: number;
    total_comision_reparaciones: number;
    total_neto: number;
    fecha_cierre?: string | null;
    detalles: NominaDetalle[];
}

interface Props {
    sucursales: Sucursal[];
    selectedYear: number;
    selectedMonth: number;
    selectedFormatoPago: 'diaria' | 'semanal' | 'quincenal' | 'mensual';
    selectedFechaReferencia: string;
    periodoInicio: string;
    periodoFin: string;
    selectedSucursal: string;
    nomina: Nomina | null;
    eligibleUsers: EligibleUser[];
}

interface PageProps {
    auth?: {
        user?: {
            empresa?: {
                nombre?: string;
                nombre_comercial?: string;
                direccion?: string;
                logo?: string;
                logo_mini?: string;
            } | null;
        } | null;
    };
    currencySymbol?: string;
    name?: string;
}

export default function Index({
    sucursales,
    selectedYear,
    selectedMonth,
    selectedFormatoPago,
    selectedFechaReferencia,
    periodoInicio,
    periodoFin,
    selectedSucursal,
    nomina,
    eligibleUsers,
}: Props) {
    const { __ } = useTranslate();
    const { auth, currencySymbol = '$', name } = usePage<PageProps>().props;
    const empresa = auth?.user?.empresa;
    const logoEmpresa = empresa?.logo_mini || empresa?.logo || '/image/logo/2.png';
    const nombreEmpresa = empresa?.nombre_comercial || empresa?.nombre || name || 'Empresa';
    const direccionEmpresa = empresa?.direccion || __('Dirección no configurada');

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Nómina'), href: '/admin/nomina' },
    ];

    const formatoPagoLabels: Record<string, string> = {
        diaria: __('Diaria'),
        semanal: __('Semanal'),
        quincenal: __('Quincenal'),
        mensual: __('Mensual'),
    };

    const filterForm = useForm({
        year: selectedYear,
        month: selectedMonth,
        formato_pago: selectedFormatoPago,
        fecha_referencia: selectedFechaReferencia,
        sucursal_id: selectedSucursal,
    });

    const formatoPagoLabel = formatoPagoLabels[filterForm.data.formato_pago] || filterForm.data.formato_pago;
    const paidCount = nomina?.detalles.filter((d) => d.estado_pago === 'pagado').length ?? 0;
    const pendingCount = nomina?.detalles.filter((d) => d.estado_pago === 'pendiente').length ?? 0;
    const [selectedDetalle, setSelectedDetalle] = useState<NominaDetalle | null>(null);

    const formatMoney = (value: number) => {
        const amount = Number(value || 0);
        return `${currencySymbol} ${amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getPeriodPreview = () => {
        const ref = new Date(`${filterForm.data.fecha_referencia}T00:00:00`);
        if (Number.isNaN(ref.getTime())) {
            return { inicio: periodoInicio, fin: periodoFin };
        }

        const start = new Date(ref);
        const end = new Date(ref);

        if (filterForm.data.formato_pago === 'diaria') {
            // same day
        } else if (filterForm.data.formato_pago === 'semanal') {
            const day = ref.getDay();
            const diffToMonday = day === 0 ? -6 : 1 - day;
            start.setDate(ref.getDate() + diffToMonday);
            end.setDate(start.getDate() + 6);
        } else if (filterForm.data.formato_pago === 'quincenal') {
            if (ref.getDate() <= 15) {
                start.setDate(1);
                end.setDate(15);
            } else {
                start.setDate(16);
                end.setMonth(ref.getMonth() + 1, 0);
            }
        } else {
            start.setDate(1);
            end.setMonth(ref.getMonth() + 1, 0);
        }

        const toYmd = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        return { inicio: toYmd(start), fin: toYmd(end) };
    };

    const periodoPreview = getPeriodPreview();

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/nomina', {
            formato_pago: filterForm.data.formato_pago,
            fecha_referencia: filterForm.data.fecha_referencia,
            sucursal_id: filterForm.data.sucursal_id,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleGenerarNomina = () => {
        router.post('/admin/nomina/generar', {
            formato_pago: filterForm.data.formato_pago,
            fecha_referencia: filterForm.data.fecha_referencia,
            sucursal_id: filterForm.data.sucursal_id,
        });
    };

    const handleCerrarNomina = () => {
        if (!nomina) {
            return;
        }

        router.post(`/admin/nomina/${nomina.id}/cerrar`);
    };

    const updateDetalle = (detalle: NominaDetalle, field: 'bonos' | 'descuentos', value: string) => {
        router.put(`/admin/nomina/detalles/${detalle.id}`, {
            bonos: field === 'bonos' ? value : detalle.bonos,
            descuentos: field === 'descuentos' ? value : detalle.descuentos,
        }, {
            preserveScroll: true,
        });
    };

    const togglePago = (detalle: NominaDetalle) => {
        router.post(`/admin/nomina/detalles/${detalle.id}/pagar`, {}, {
            preserveScroll: true,
        });
    };

    const printReport = () => {
        window.print();
    };

    return (
        <>
            <Head title={__('Nómina')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Wallet className="h-6 w-6 text-white" />}
                    title={__('Nómina')}
                    description={__('Genera y cierra nómina mensual para empleados con sueldo base, excluyendo roles administrativos.')}
                    colorClassName="bg-emerald-600"
                />

                <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
                    <div>
                        <Label>{__('Formato de pago')}</Label>
                        <Select
                            value={String(filterForm.data.formato_pago)}
                            onValueChange={(v) => filterForm.setData('formato_pago', v as 'diaria' | 'semanal' | 'quincenal' | 'mensual')}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="diaria">{__('Diaria')}</SelectItem>
                                <SelectItem value="semanal">{__('Semanal')}</SelectItem>
                                <SelectItem value="quincenal">{__('Quincenal')}</SelectItem>
                                <SelectItem value="mensual">{__('Mensual')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>{__('Fecha de referencia')}</Label>
                        <Input
                            type="date"
                            value={filterForm.data.fecha_referencia}
                            onChange={(e) => filterForm.setData('fecha_referencia', e.target.value)}
                        />
                    </div>

                    <div>
                        <Label>{__('Sucursal')}</Label>
                        <Select
                            value={String(filterForm.data.sucursal_id)}
                            onValueChange={(v) => filterForm.setData('sucursal_id', v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{__('Todas')}</SelectItem>
                                {sucursales.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>{s.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end">
                        <Button type="submit" className="w-full">
                            <CalendarDays className="h-4 w-4 mr-2" />
                            {__('Consultar')}
                        </Button>
                    </div>
                </form>

                <Card className="border-emerald-200/70">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <img
                                    src={logoEmpresa}
                                    alt={__('Logo de la empresa')}
                                    className="h-14 w-14 rounded-lg object-cover border bg-white"
                                />
                                <div>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-emerald-600" />
                                        {nombreEmpresa}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{direccionEmpresa}</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {__('Formato')}: {formatoPagoLabel}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {__('Período')}: {periodoPreview.inicio} - {periodoPreview.fin}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 print:hidden">
                                {!nomina && (
                                    <Button onClick={handleGenerarNomina}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        {__('Generar Nómina')}
                                    </Button>
                                )}
                                {nomina?.estado === 'borrador' && (
                                    <Button variant="default" onClick={handleCerrarNomina}>
                                        <Lock className="h-4 w-4 mr-2" />
                                        {__('Cerrar Nómina')}
                                    </Button>
                                )}
                                <Button type="button" variant="outline" onClick={printReport}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    {__('Imprimir Reporte')}
                                </Button>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <Badge variant="secondary">{__('Estado')}: {nomina?.estado ?? __('Sin generar')}</Badge>
                            <Badge variant="secondary">{__('Elegibles')}: {eligibleUsers.length}</Badge>
                            <Badge variant="secondary">{__('Pagados')}: {paidCount}</Badge>
                            <Badge variant="secondary">{__('Pendientes')}: {pendingCount}</Badge>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                        icon={<Users className="h-5 w-5" />}
                        title={__('EMPLEADOS ELEGIBLES')}
                        value={eligibleUsers.length}
                        colorClassName="bg-blue-100 text-blue-700"
                    />
                    <StatCard
                        icon={<CircleDollarSign className="h-5 w-5" />}
                        title={__('TOTAL BRUTO')}
                        value={formatMoney(Number(nomina?.total_bruto ?? 0))}
                        colorClassName="bg-emerald-100 text-emerald-700"
                    />
                    <StatCard
                        icon={<CircleDollarSign className="h-5 w-5" />}
                        title={__('TOTAL DESCUENTOS')}
                        value={formatMoney(Number(nomina?.total_descuentos ?? 0))}
                        colorClassName="bg-rose-100 text-rose-700"
                    />
                    <StatCard
                        icon={<CircleDollarSign className="h-5 w-5" />}
                        title={__('COMISIÓN REPARACIONES')}
                        value={formatMoney(Number(nomina?.total_comision_reparaciones ?? 0))}
                        colorClassName="bg-amber-100 text-amber-700"
                    />
                    <StatCard
                        icon={<CircleDollarSign className="h-5 w-5" />}
                        title={__('TOTAL NETO')}
                        value={formatMoney(Number(nomina?.total_neto ?? 0))}
                        colorClassName="bg-violet-100 text-violet-700"
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{__('Resumen de Nómina')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!nomina && (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    {__('No existe una nómina generada para el período seleccionado.')}
                                </p>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="py-2 text-left">{__('Empleado elegible')}</th>
                                                <th className="py-2 text-left">{__('Email')}</th>
                                                <th className="py-2 text-left">{__('Rol')}</th>
                                                <th className="py-2 text-right">{__('Sueldo Base')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {eligibleUsers.map((employee) => (
                                                <tr key={employee.id} className="border-b">
                                                    <td className="py-2">{employee.name}</td>
                                                    <td className="py-2 text-muted-foreground">{employee.email}</td>
                                                    <td className="py-2">{employee.roles?.[0]?.name || '—'}</td>
                                                    <td className="py-2 text-right font-medium">{formatMoney(Number(employee.sueldo_base || 0))}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {nomina && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="py-2 text-left">{__('Empleado')}</th>
                                            <th className="py-2 text-left">{__('Rol')}</th>
                                            <th className="py-2 text-right">{__('Sueldo Base')}</th>
                                            <th className="py-2 text-right">{__('Bonos')}</th>
                                            <th className="py-2 text-right">{__('Descuentos')}</th>
                                            <th className="py-2 text-right">{__('Comisión Reparaciones')}</th>
                                            <th className="py-2 text-right">{__('Neto')}</th>
                                            <th className="py-2 text-center">{__('Pago')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {nomina.detalles.map((detalle) => (
                                            <tr
                                                key={detalle.id}
                                                className="border-b cursor-pointer hover:bg-muted/40 transition-colors"
                                                onClick={() => setSelectedDetalle(detalle)}
                                            >
                                                <td className="py-2">{detalle.user.name}</td>
                                                <td className="py-2">{detalle.rol_nombre || '—'}</td>
                                                <td className="py-2 text-right">{formatMoney(Number(detalle.sueldo_base_snapshot || 0))}</td>
                                                <td className="py-2">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        disabled={nomina.estado !== 'borrador'}
                                                        defaultValue={detalle.bonos}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onBlur={(e) => updateDetalle(detalle, 'bonos', e.target.value)}
                                                        className="text-right"
                                                    />
                                                </td>
                                                <td className="py-2">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        disabled={nomina.estado !== 'borrador'}
                                                        defaultValue={detalle.descuentos}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onBlur={(e) => updateDetalle(detalle, 'descuentos', e.target.value)}
                                                        className="text-right"
                                                    />
                                                </td>
                                                <td className="py-2 text-right">{formatMoney(Number(detalle.comision_reparaciones || 0))}</td>
                                                <td className="py-2 text-right font-medium">{formatMoney(Number(detalle.total_neto || 0))}</td>
                                                <td className="py-2 text-center">
                                                    <Button
                                                        size="sm"
                                                        variant={detalle.estado_pago === 'pagado' ? 'default' : 'outline'}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            togglePago(detalle);
                                                        }}
                                                        disabled={nomina.estado === 'borrador'}
                                                    >
                                                        {detalle.estado_pago === 'pagado' ? __('Pagado') : __('Pendiente')}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-muted/40 font-semibold">
                                            <td className="py-2" colSpan={2}>{__('Totales')}</td>
                                            <td className="py-2 text-right">{formatMoney(Number(nomina.total_bruto || 0))}</td>
                                            <td className="py-2 text-right">{formatMoney(Number(nomina.total_bonos || 0))}</td>
                                            <td className="py-2 text-right">{formatMoney(Number(nomina.total_descuentos || 0))}</td>
                                            <td className="py-2 text-right">{formatMoney(Number(nomina.total_comision_reparaciones || 0))}</td>
                                            <td className="py-2 text-right">{formatMoney(Number(nomina.total_neto || 0))}</td>
                                            <td className="py-2 text-center">
                                                {nomina.estado === 'pagada' ? (
                                                    <Badge className="bg-emerald-600 text-white">
                                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                                        {__('Pagada')}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">{__('Pendiente')}</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={!!selectedDetalle} onOpenChange={(open) => !open && setSelectedDetalle(null)}>
                    <DialogContent className="sm:max-w-[560px]">
                        <DialogHeader>
                            <DialogTitle>{__('Detalle a pagar del empleado')}</DialogTitle>
                            <DialogDescription>
                                {selectedDetalle?.user.name} - {selectedDetalle?.rol_nombre || __('Sin rol')}
                            </DialogDescription>
                        </DialogHeader>

                        {selectedDetalle && (
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-muted-foreground">{__('Sueldo base')}</span>
                                    <span className="font-medium">{formatMoney(Number(selectedDetalle.sueldo_base_snapshot || 0))}</span>
                                </div>
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-muted-foreground">{__('Bonificaciones')}</span>
                                    <span className="font-medium">{formatMoney(Number(selectedDetalle.bonos || 0))}</span>
                                </div>
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-muted-foreground">{__('Deducciones')}</span>
                                    <span className="font-medium">-{formatMoney(Number(selectedDetalle.descuentos || 0))}</span>
                                </div>
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-muted-foreground">{__('Comisión por reparaciones')}</span>
                                    <span className="font-medium">{formatMoney(Number(selectedDetalle.comision_reparaciones || 0))}</span>
                                </div>
                                <div className="flex items-center justify-between border-b pb-2 text-xs text-muted-foreground">
                                    <span>{__('Órdenes reparadas en período')}</span>
                                    <span className="font-medium text-foreground">{selectedDetalle.reparaciones_reparadas_periodo || 0}</span>
                                </div>
                                <div className="flex items-center justify-between border-b pb-2 text-xs text-muted-foreground">
                                    <span>{__('Total pagado por clientes (período)')}</span>
                                    <span className="font-medium text-foreground">{formatMoney(Number(selectedDetalle.monto_pagado_reparaciones_periodo || 0))}</span>
                                </div>

                                <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 flex items-center justify-between">
                                    <span className="font-semibold text-emerald-800">{__('Total neto a pagar')}</span>
                                    <span className="font-bold text-emerald-800">{formatMoney(Number(selectedDetalle.total_neto || 0))}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                    <div>{__('Estado de pago')}: {selectedDetalle.estado_pago}</div>
                                    <div>
                                        {__('Fecha de pago')}: {selectedDetalle.fecha_pago
                                            ? new Date(selectedDetalle.fecha_pago).toLocaleString('es-ES')
                                            : __('Pendiente')}
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
