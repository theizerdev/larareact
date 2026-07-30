import { Head, router, usePage } from '@inertiajs/react';
import { CreditCard, Check, X, Shield, Calendar, Store, Edit3 } from 'lucide-react';
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslate } from '@/hooks/use-translate';

interface EmpresaItem {
    id: number;
    razon_social: string;
    documento: string;
    email: string;
    telefono: string;
    subscription_status: string;
    trial_ends_at: string | null;
    subscription_expires_at: string | null;
    dias_restantes: number;
    estado_legible: string;
    is_exempt: boolean;
    max_sucursales: number;
    total_sucursales: number;
}

interface PagoPendiente {
    id: number;
    monto: number;
    ciclo_meses: number;
    sucursales_contratadas: number;
    metodo_pago: string;
    referencia_pago: string | null;
    comprobante_path: string | null;
    created_at: string;
    empresa?: { razon_social: string };
    user?: { name: string };
}

interface PageProps {
    empresas: EmpresaItem[];
    pagosPendientes: PagoPendiente[];
}

export default function SubscriptionManage({ empresas, pagosPendientes }: PageProps) {
    const { __ } = useTranslate();
    const { currencySymbol = '$' } = usePage().props as any;

    const [editingEmpresa, setEditingEmpresa] = useState<EmpresaItem | null>(null);
    const [editStatus, setEditStatus] = useState<string>('active');
    const [editFecha, setEditFecha] = useState<string>('');
    const [editSucursales, setEditSucursales] = useState<number>(1);

    const handleApprove = (pagoId: number) => {
        Swal.fire({
            title: __('¿Aprobar Pago y Activar Suscripción?'),
            text: __('Se activará o extenderá el plan de la empresa inmediatamente.'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: __('Sí, aprobar'),
            cancelButtonText: __('Cancelar'),
        }).then((res) => {
            if (res.isConfirmed) {
                router.post(`/admin/monitoring/subscription/approve/${pagoId}`);
            }
        });
    };

    const handleReject = (pagoId: number) => {
        Swal.fire({
            title: __('¿Rechazar Solicitud de Pago?'),
            text: __('Ingresa el motivo del rechazo:'),
            input: 'text',
            showCancelButton: true,
            confirmButtonText: __('Rechazar'),
            cancelButtonText: __('Cancelar'),
        }).then((res) => {
            if (res.isConfirmed && res.value) {
                router.post(`/admin/monitoring/subscription/reject/${pagoId}`, { notas: res.value });
            }
        });
    };

    const openEditDialog = (empresa: EmpresaItem) => {
        setEditingEmpresa(empresa);
        setEditStatus(empresa.subscription_status);
        const fechaActual = empresa.subscription_expires_at || empresa.trial_ends_at || new Date().toISOString().split('T')[0];
        setEditFecha(fechaActual.split('T')[0] || new Date().toISOString().split('T')[0]);
        setEditSucursales(empresa.max_sucursales);
    };

    const handleSaveEmpresa = () => {
        if (!editingEmpresa) return;

        router.post(`/admin/monitoring/subscription/update-empresa/${editingEmpresa.id}`, {
            subscription_status: editStatus,
            fecha_vencimiento: editFecha,
            max_sucursales: editSucursales,
        }, {
            onSuccess: () => setEditingEmpresa(null),
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Monitoring'), href: '#' },
        { title: __('Gestión Global Suscripciones'), href: '/admin/monitoring/subscription/manage' },
    ];

    return (
        <>
            <Head title={__('Gestión Global de Suscripciones (SaaS)')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Shield className="h-8 w-8 text-indigo-600" />
                            {__('Administración Global de Suscripciones')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {__('Aprobación de pagos de renovación, extensión de días de prueba y control de empresas SaaS.')}
                        </p>
                    </div>
                </div>

                {/* Pagos Pendientes de Aprobación */}
                <Card className="shadow-sm border-amber-200 dark:border-amber-950">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-amber-500" />
                            {__('Solicitudes de Pago Pendientes')} ({pagosPendientes.length})
                        </CardTitle>
                        <CardDescription>{__('Verifica los comprobantes recibidos para activar las empresas.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{__('Empresa')}</TableHead>
                                    <TableHead>{__('Usuario')}</TableHead>
                                    <TableHead>{__('Duración')}</TableHead>
                                    <TableHead>{__('Sucursales')}</TableHead>
                                    <TableHead>{__('Monto')}</TableHead>
                                    <TableHead>{__('Método / Ref')}</TableHead>
                                    <TableHead className="text-right">{__('Acción')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pagosPendientes.map((pago) => (
                                    <TableRow key={pago.id}>
                                        <TableCell className="font-semibold text-xs">{pago.empresa?.razon_social}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{pago.user?.name}</TableCell>
                                        <TableCell className="text-xs">{pago.ciclo_meses} {__('Meses')}</TableCell>
                                        <TableCell className="text-xs">{pago.sucursales_contratadas}</TableCell>
                                        <TableCell className="font-mono font-bold text-xs">{currencySymbol}{pago.monto.toFixed(2)}</TableCell>
                                        <TableCell className="text-xs">
                                            <span className="capitalize">{pago.metodo_pago.replace('_', ' ')}</span>
                                            {pago.referencia_pago && <span className="block font-mono text-[10px] text-muted-foreground">Ref: {pago.referencia_pago}</span>}
                                        </TableCell>
                                        <TableCell className="text-right flex justify-end gap-2">
                                            {pago.comprobante_path && (
                                                <a 
                                                    href={`/storage/${pago.comprobante_path}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="inline-flex items-center text-xs font-semibold text-blue-600 hover:underline mr-2"
                                                >
                                                    {__('Ver Comprobante')}
                                                </a>
                                            )}
                                            <Button size="sm" onClick={() => handleApprove(pago.id)} className="bg-emerald-600 hover:bg-emerald-700 h-8 gap-1">
                                                <Check className="h-3.5 w-3.5" />
                                                {__('Aprobar')}
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => handleReject(pago.id)} className="h-8 text-red-600 border-red-200 hover:bg-red-50 gap-1">
                                                <X className="h-3.5 w-3.5" />
                                                {__('Rechazar')}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {pagosPendientes.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                                            {__('No hay pagos pendientes de verificación.')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Listado Completo de Empresas y Estado */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>{__('Listado de Empresas Registradas y Estado de Suscripción')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{__('ID')}</TableHead>
                                    <TableHead>{__('Empresa')}</TableHead>
                                    <TableHead>{__('Estado Suscripción')}</TableHead>
                                    <TableHead>{__('Días Restantes')}</TableHead>
                                    <TableHead>{__('Sucursales')}</TableHead>
                                    <TableHead className="text-right">{__('Editar / Extender')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {empresas.map((emp) => (
                                    <TableRow key={emp.id}>
                                        <TableCell className="font-mono text-xs">{emp.id}</TableCell>
                                        <TableCell className="font-semibold text-xs">
                                            {emp.razon_social}
                                            {emp.is_exempt && <Badge variant="secondary" className="ml-2 text-[10px] bg-indigo-100 text-indigo-800">Owner Exento</Badge>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={emp.is_exempt ? 'default' : emp.subscription_status === 'active' ? 'default' : emp.subscription_status === 'trial' ? 'outline' : 'destructive'}>
                                                {emp.subscription_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-xs">
                                            {emp.is_exempt ? '∞' : `${emp.dias_restantes} días`}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {emp.total_sucursales} / {emp.max_sucursales} {__('Max')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {!emp.is_exempt && (
                                                <Button size="sm" variant="ghost" onClick={() => openEditDialog(emp)} className="h-8 gap-1 text-xs">
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                    {__('Ajustar Plan')}
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Editar Empresa */}
            <Dialog open={editingEmpresa !== null} onOpenChange={() => setEditingEmpresa(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{__('Ajustar Suscripción de')} {editingEmpresa?.razon_social}</DialogTitle>
                        <DialogDescription>{__('Modifica manualmente el estado, fecha de vencimiento o número de sucursales autorizadas.')}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div>
                            <Label>{__('Estado de Suscripción')}</Label>
                            <Select value={editStatus} onValueChange={setEditStatus}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="trial">{__('Prueba (Trial)')}</SelectItem>
                                    <SelectItem value="active">{__('Activo')}</SelectItem>
                                    <SelectItem value="expired">{__('Vencido')}</SelectItem>
                                    <SelectItem value="cancelled">{__('Cancelado')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>{__('Fecha de Vencimiento / Fin de Prueba')}</Label>
                            <Input 
                                type="date" 
                                value={editFecha} 
                                onChange={(e) => setEditFecha(e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label>{__('Límite de Sucursales Permitidas')}</Label>
                            <Input 
                                type="number" 
                                min={1} 
                                value={editSucursales} 
                                onChange={(e) => setEditSucursales(parseInt(e.target.value) || 1)}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingEmpresa(null)}>{__('Cancelar')}</Button>
                        <Button onClick={handleSaveEmpresa} className="bg-indigo-600 hover:bg-indigo-700">{__('Guardar Cambios')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
