import { Head, router, usePage } from '@inertiajs/react';
import {
    CreditCard,
    Check,
    X,
    Shield,
    Calendar,
    Store,
    Edit3,
    Search,
    Building2,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Eye,
    Sparkles,
    ExternalLink,
    Filter,
    Users,
    Gift,
    MessageSquare,
    Bell,
    Send
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    last_reminder_sent_at?: string | null;
    reminder_sent_count?: number;
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

interface SaaSStats {
    total_empresas: number;
    activas: number;
    trial: number;
    vencidas: number;
    exentas: number;
    pagos_pendientes: number;
}

interface PageProps {
    empresas: EmpresaItem[];
    pagosPendientes: PagoPendiente[];
    stats?: SaaSStats;
}

export default function SubscriptionManage({ empresas, pagosPendientes, stats }: PageProps) {
    const { __ } = useTranslate();
    const { currencySymbol = '$' } = usePage().props as any;

    const [search, setSearch] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);

    const [editingEmpresa, setEditingEmpresa] = useState<EmpresaItem | null>(null);
    const [editStatus, setEditStatus] = useState<string>('active');
    const [editFecha, setEditFecha] = useState<string>('');
    const [editSucursales, setEditSucursales] = useState<number>(1);

    // Filtrar empresas
    const filteredEmpresas = useMemo(() => {
        return empresas.filter((emp) => {
            const matchesSearch = 
                emp.razon_social.toLowerCase().includes(search.toLowerCase()) ||
                emp.documento?.toLowerCase().includes(search.toLowerCase()) ||
                emp.email?.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = 
                statusFilter === 'all' ||
                (statusFilter === 'exempt' && emp.is_exempt) ||
                (statusFilter === emp.subscription_status && !emp.is_exempt);

            return matchesSearch && matchesStatus;
        });
    }, [empresas, search, statusFilter]);

    const handleApprove = (pagoId: number) => {
        Swal.fire({
            title: __('¿Aprobar Pago y Activar Suscripción?'),
            text: __('Se extenderá el servicio de la empresa de forma inmediata.'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
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
            text: __('Ingresa el motivo del rechazo para notificar al cliente:'),
            input: 'text',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
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

    // Accesos rápidos para extender fecha en el Modal
    const setDateOffset = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        setEditFecha(d.toISOString().split('T')[0]);
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

    const handleSendReminder = (emp: EmpresaItem) => {
        Swal.fire({
            title: __('¿Enviar Recordatorio de Vencimiento?'),
            html: `
                <div class="text-left text-sm space-y-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <p>Se enviará un recordatorio automático vía WhatsApp a <b>${emp.razon_social}</b> (${emp.telefono || 'teléfono del admin'}).</p>
                    <div class="text-xs text-muted-foreground pt-1 border-t">
                        <p>⏳ <b>Días restantes:</b> ${emp.dias_restantes} días</p>
                        <p>📅 <b>Fecha de vencimiento:</b> ${emp.subscription_expires_at ? new Date(emp.subscription_expires_at).toLocaleDateString() : (emp.trial_ends_at ? new Date(emp.trial_ends_at).toLocaleDateString() : 'N/A')}</p>
                        ${emp.last_reminder_sent_at ? `<p class="text-amber-600">🔔 Último aviso: ${new Date(emp.last_reminder_sent_at).toLocaleString()}</p>` : ''}
                    </div>
                </div>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: __('📲 Sí, Enviar WhatsApp'),
            cancelButtonText: __('Cancelar'),
        }).then((res) => {
            if (res.isConfirmed) {
                router.post(`/admin/monitoring/subscription/notify/${emp.id}`);
            }
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Configuración'), href: '#' },
        { title: __('Gestión Suscripciones'), href: '/admin/monitoring/subscription/manage' },
    ];

    return (
        <>
            <Head title={__('Gestión Global de Suscripciones SaaS')} />
            <div className="space-y-8 pb-10">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header Principal SaaS Owner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 space-y-1">
                        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                            <Shield className="h-4 w-4" />
                            {__('SaaS Control Tower')}
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            {__('Gestión Global de Suscripciones')}
                        </h1>
                        <p className="text-slate-300 text-sm max-w-2xl">
                            {__('Control de empresas registradas, aprobación de transferencias y extensiones de vigencia del sistema.')}
                        </p>
                    </div>

                    {pagosPendientes.length > 0 && (
                        <div className="relative z-10">
                            <Badge className="bg-amber-500 text-slate-950 font-bold px-4 py-2 text-xs flex items-center gap-2 shadow-lg animate-bounce">
                                <Clock className="h-4 w-4" />
                                {pagosPendientes.length} {__('pago(s) pendiente(s) por revisar')}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* KPI Metrics Dashboard */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase">{__('Empresas')}</p>
                                <p className="text-2xl font-black">{stats?.total_empresas ?? empresas.length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase">{__('Activas')}</p>
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats?.activas ?? 0}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
                                <Gift className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase">{__('En Prueba')}</p>
                                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats?.trial ?? 0}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase">{__('Vencidas')}</p>
                                <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats?.vencidas ?? 0}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase">{__('Exentas (SaaS)')}</p>
                                <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{stats?.exentas ?? 0}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Pagos Pendientes de Aprobación */}
                <Card className="shadow-lg border-2 border-amber-200 dark:border-amber-950/60 overflow-hidden">
                    <CardHeader className="bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-900/40">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl shadow-md font-bold">
                                    <CreditCard className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        {__('Solicitudes de Pago por Verificar')}
                                        <Badge className="bg-amber-500 text-slate-950 text-xs">
                                            {pagosPendientes.length}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription>{__('Verifica las referencias y comprobantes para activar las empresas.')}</CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-900">
                                    <TableHead className="font-bold">{__('Empresa')}</TableHead>
                                    <TableHead className="font-bold">{__('Usuario Solicitante')}</TableHead>
                                    <TableHead className="font-bold">{__('Plan / Duración')}</TableHead>
                                    <TableHead className="font-bold">{__('Sucursales')}</TableHead>
                                    <TableHead className="font-bold">{__('Monto')}</TableHead>
                                    <TableHead className="font-bold">{__('Método / Referencia')}</TableHead>
                                    <TableHead className="font-bold text-center">{__('Comprobante')}</TableHead>
                                    <TableHead className="font-bold text-right">{__('Acciones')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pagosPendientes.map((pago) => (
                                    <TableRow key={pago.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60">
                                        <TableCell className="font-bold text-xs">{pago.empresa?.razon_social}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{pago.user?.name}</TableCell>
                                        <TableCell className="text-xs font-semibold">{pago.ciclo_meses} {__('Meses')}</TableCell>
                                        <TableCell className="text-xs font-medium">{pago.sucursales_contratadas}</TableCell>
                                        <TableCell className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                                            {currencySymbol}{pago.monto.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            <span className="capitalize font-medium block">{pago.metodo_pago.replace('_', ' ')}</span>
                                            {pago.referencia_pago && (
                                                <span className="font-mono text-[10px] text-muted-foreground">
                                                    Ref: {pago.referencia_pago}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {pago.comprobante_path ? (
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => setPreviewReceipt(`/storage/${pago.comprobante_path}`)}
                                                    className="h-7 text-xs gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    {__('Ver Captura')}
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">Sin comprobante</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => handleApprove(pago.id)} 
                                                    className="bg-emerald-600 hover:bg-emerald-700 h-8 gap-1 font-bold text-xs shadow-sm"
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                    {__('Aprobar')}
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    onClick={() => handleReject(pago.id)} 
                                                    className="h-8 text-rose-600 border-rose-200 hover:bg-rose-50 gap-1 text-xs"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                    {__('Rechazar')}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {pagosPendientes.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            {__('No hay solicitudes de pago pendientes de verificación.')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Listado Completo de Empresas y Control de Suscripción */}
                <Card className="shadow-md border border-slate-200/80 dark:border-slate-800">
                    <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg font-bold">{__('Directorio de Empresas Registradas')}</CardTitle>
                                <CardDescription>{__('Administra manualmente fechas de expiración, límites de sucursales o estados de cuenta.')}</CardDescription>
                            </div>

                            {/* Búsqueda y Filtros */}
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder={__('Buscar empresa, RIF...')}
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9 h-9 text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tabs de Filtro de Estado */}
                        <div className="pt-3">
                            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                                <TabsList className="grid grid-cols-5 w-full max-w-xl h-8">
                                    <TabsTrigger value="all" className="text-xs">{__('Todas')}</TabsTrigger>
                                    <TabsTrigger value="active" className="text-xs">{__('Activas')}</TabsTrigger>
                                    <TabsTrigger value="trial" className="text-xs">{__('Prueba')}</TabsTrigger>
                                    <TabsTrigger value="expired" className="text-xs">{__('Vencidas')}</TabsTrigger>
                                    <TabsTrigger value="exempt" className="text-xs">{__('Exentas')}</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-900">
                                    <TableHead className="w-12 font-bold">{__('ID')}</TableHead>
                                    <TableHead className="font-bold">{__('Empresa / Datos')}</TableHead>
                                    <TableHead className="font-bold">{__('Estado Suscripción')}</TableHead>
                                    <TableHead className="font-bold">{__('Días Restantes')}</TableHead>
                                    <TableHead className="font-bold">{__('Capacidad Sucursales')}</TableHead>
                                    <TableHead className="font-bold text-right">{__('Acción')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmpresas.map((emp) => (
                                    <TableRow key={emp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                                        <TableCell className="font-mono text-xs font-semibold">{emp.id}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{emp.razon_social}</span>
                                                {emp.is_exempt && (
                                                    <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold">
                                                        Owner SaaS
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">{emp.documento || emp.email || 'Sin documento'}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={
                                                    emp.is_exempt ? 'default' : 
                                                    emp.subscription_status === 'active' ? 'default' : 
                                                    emp.subscription_status === 'trial' ? 'outline' : 'destructive'
                                                }
                                                className={`text-xs font-semibold ${
                                                    emp.is_exempt ? 'bg-purple-600 text-white' :
                                                    emp.subscription_status === 'active' ? 'bg-emerald-600 text-white' :
                                                    emp.subscription_status === 'trial' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300' : ''
                                                }`}
                                            >
                                                {emp.is_exempt ? __('Exento') : emp.subscription_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-xs">
                                            {emp.is_exempt ? (
                                                <span className="text-purple-600 dark:text-purple-400">∞ {__('Ilimitado')}</span>
                                            ) : (
                                                <div className="space-y-0.5">
                                                    {emp.dias_restantes <= 0 ? (
                                                        <Badge variant="destructive" className="text-[11px] font-bold">
                                                            {__('Vencida (0 días)')}
                                                        </Badge>
                                                    ) : emp.dias_restantes <= 5 ? (
                                                        <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 text-[11px] font-bold gap-1">
                                                            <AlertTriangle className="h-3 w-3 text-rose-600" />
                                                            {emp.dias_restantes} {__('días restantes')}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                                                            {emp.dias_restantes} {__('días')}
                                                        </Badge>
                                                    )}
                                                    {emp.last_reminder_sent_at && (
                                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Bell className="h-2.5 w-2.5 text-amber-500" />
                                                            {__('Avisado:')} {new Date(emp.last_reminder_sent_at).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            <div className="flex items-center gap-2">
                                                <Store className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="font-semibold">{emp.total_sucursales} / {emp.max_sucursales} {__('Max')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {!emp.is_exempt && (
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        onClick={() => handleSendReminder(emp)} 
                                                        className="h-8 gap-1 text-xs font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950"
                                                        title={__('Enviar recordatorio de pago por WhatsApp')}
                                                    >
                                                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                                                        {__('Avisar WhatsApp')}
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        onClick={() => openEditDialog(emp)} 
                                                        className="h-8 gap-1.5 text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-600"
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5" />
                                                        {__('Ajustar Plan')}
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {filteredEmpresas.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            {__('No se encontraron empresas con los criterios seleccionados.')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Editar Empresa */}
            <Dialog open={editingEmpresa !== null} onOpenChange={() => setEditingEmpresa(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit3 className="h-5 w-5 text-indigo-600" />
                            {__('Ajustar Plan de')} {editingEmpresa?.razon_social}
                        </DialogTitle>
                        <DialogDescription>
                            {__('Modifica manualmente el estado del servicio, fecha de vigencia o límite de sucursales.')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Atajos de Extensión Rápida */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-muted-foreground uppercase">{__('Atajos de Extensión Rápida')}</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => { setEditStatus('trial'); setDateOffset(15); }}
                                    className="text-xs h-8"
                                >
                                    +15 {__('Días Prueba')}
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => { setEditStatus('active'); setDateOffset(30); }}
                                    className="text-xs h-8"
                                >
                                    +30 {__('Días Activo')}
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => { setEditStatus('active'); setDateOffset(365); }}
                                    className="text-xs h-8"
                                >
                                    +1 {__('Año Activo')}
                                </Button>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-semibold">{__('Estado de Suscripción')}</Label>
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
                            <Label className="text-xs font-semibold">{__('Fecha de Vencimiento / Fin de Prueba')}</Label>
                            <Input 
                                type="date" 
                                value={editFecha} 
                                onChange={(e) => setEditFecha(e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-semibold">{__('Límite de Sucursales Autorizadas')}</Label>
                            <Input 
                                type="number" 
                                min={1} 
                                max={100}
                                value={editSucursales} 
                                onChange={(e) => setEditSucursales(parseInt(e.target.value) || 1)}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingEmpresa(null)}>{__('Cancelar')}</Button>
                        <Button onClick={handleSaveEmpresa} className="bg-indigo-600 hover:bg-indigo-700 font-bold">{__('Guardar Cambios')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Lightbox Ver Comprobante */}
            <Dialog open={previewReceipt !== null} onOpenChange={() => setPreviewReceipt(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-indigo-600" />
                            {__('Comprobante de Pago Adjunto')}
                        </DialogTitle>
                    </DialogHeader>

                    {previewReceipt && (
                        <div className="p-2 border rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center max-h-[70vh] overflow-auto">
                            {previewReceipt.endsWith('.pdf') ? (
                                <iframe src={previewReceipt} className="w-full h-96 rounded" title="PDF Comprobante" />
                            ) : (
                                <img src={previewReceipt} alt="Comprobante" className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-md" />
                            )}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                        {previewReceipt && (
                            <a 
                                href={previewReceipt} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                {__('Abrir en ventana nueva')}
                            </a>
                        )}
                        <Button variant="outline" onClick={() => setPreviewReceipt(null)}>
                            {__('Cerrar')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
