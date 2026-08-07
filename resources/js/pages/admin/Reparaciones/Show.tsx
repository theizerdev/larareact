import { Head, useForm, router, Link } from '@inertiajs/react';
import {
    Wrench,
    Printer,
    Send,
    User,
    Smartphone,
    CheckCircle2,
    Clock,
    DollarSign,
    Lock,
    FileText,
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Check,
    AlertCircle,
    Package,
    ShieldCheck,
    History,
    Camera,
    Sparkles,
    Copy,
    Phone,
    Calendar,
    Layers,
    Activity,
    Eye,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { cn } from '@/lib/utils';

interface Item {
    id: number;
    servicio_id?: number;
    producto_id?: number;
    descripcion: string;
    cantidad: number;
    precio_costo: number;
    precio_venta: number;
    subtotal: number;
    producto?: { nombre: string; codigo: string };
    servicio?: { id: number; nombre: string; categoria?: { nombre: string } };
}

interface Foto {
    id: number;
    orden_id: number;
    angulo: string;
    url: string;
    descripcion?: string;
}

interface Historial {
    id: number;
    estado_anterior?: string;
    estado_nuevo: string;
    comentario?: string;
    created_at: string;
    user?: { name: string };
}

interface Orden {
    id: number;
    numero_orden: string;
    cliente_nombre: string;
    cliente_telefono?: string;
    tipo_dispositivo: string;
    marca_nombre: string;
    modelo_nombre: string;
    color?: string;
    imei_serie?: string;
    descripcion_falla: string;
    observaciones_fisicas?: string;
    estado_orden: string;
    costo_mano_obra: number;
    costo_repuestos: number;
    costo_estimado: number;
    anticipo: number;
    saldo_restante: number;
    garantia_dias: number;
    fecha_recepcion: string;
    fecha_prometida?: string;
    fecha_entrega?: string;
    tecnico?: { id: number; name: string };
    cliente?: { id: number; nombre: string; telefono?: string; email?: string };
    marca?: { id: number; nombre: string };
    modelo?: { id: number; nombre_comercial: string };
    items: Item[];
    historial: Historial[];
    fotos?: Foto[];
    evidencias_fotos?: Record<string, string>;
}

interface ProductoRepuesto {
    id: number;
    sku?: string;
    codigo_barras?: string;
    nombre_variante?: string;
    nombre?: string;
    precio_venta: number;
    stock: number;
    marca_id?: number;
    modelo_id?: number;
    condicion?: string;
    marca?: { id: number; nombre: string };
    modelo?: { id: number; nombre_comercial: string };
}

interface Props {
    orden: Orden;
    productosRepuestos: ProductoRepuesto[];
    tecnicos: { id: number; name: string }[];
    currencySymbol: string;
}

export default function ShowReparacion({ orden, productosRepuestos = [], tecnicos, currencySymbol }: Props) {
    const { __ } = useTranslate();
    const [activeTab, setActiveTab] = useState<'general' | 'fotos' | 'historial'>('general');
    const [previewPhoto, setPreviewPhoto] = useState<{ url: string; label: string } | null>(null);

    const formatNum = (val: any): string => {
        if (val === null || val === undefined || val === '') return '0.00';
        const num = parseFloat(val);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    const formatDate = (dateStr?: string): string => {
        if (!dateStr) return __('No especificada');
        try {
            const cleanStr = String(dateStr).replace(' ', 'T');
            const d = new Date(cleanStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return dateStr || __('No especificada');
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        notifySuccess(`${label} ${__('copiado al portapapeles.')}`);
    };

    // Separar items de servicios de los repuestos de inventario
    const serviciosItems = (orden.items || []).filter((i) => i.servicio_id || !i.producto_id);
    const repuestosItems = (orden.items || []).filter((i) => !!i.producto_id);

    const [openStatusModal, setOpenStatusModal] = useState(false);
    const [nuevoEstado, setNuevoEstado] = useState(orden.estado_orden);
    const [comentarioEstado, setComentarioEstado] = useState('');
    const [tecnicoAsignadoId, setTecnicoAsignadoId] = useState(orden.tecnico?.id ? String(orden.tecnico.id) : '');

    // Formulario de Repuesto
    const [selectedProductoId, setSelectedProductoId] = useState('');
    const [cantidadRepuesto, setCantidadRepuesto] = useState('1');
    const [isSubmittingItem, setIsSubmittingItem] = useState(false);

    // Repuestos agrupados por compatibilidad
    const repuestosCompatibles = productosRepuestos.filter(
        (p) => (orden.modelo_id && p.modelo_id === orden.modelo_id) || (orden.marca_id && p.marca_id === orden.marca_id)
    );
    const otrosRepuestos = productosRepuestos.filter(
        (p) => !((orden.modelo_id && p.modelo_id === orden.modelo_id) || (orden.marca_id && p.marca_id === orden.marca_id))
    );

    // Formulario Mano de Obra y Anticipo
    const [manoObraInput, setManoObraInput] = useState(String(orden.costo_mano_obra || 0));
    const [anticipoInput, setAnticipoInput] = useState(String(orden.anticipo || 0));

    const handleUpdateEstado = () => {
        router.post(
            `/admin/reparaciones/${orden.id}/estado`,
            {
                estado_orden: nuevoEstado,
                comentario: comentarioEstado,
                tecnico_id: tecnicoAsignadoId || null,
            },
            {
                onSuccess: () => {
                    setOpenStatusModal(false);
                    notifySuccess(__('Estado actualizado exitosamente.'));
                },
                onError: () => notifyError(__('Ocurrió un error al actualizar el estado.')),
            }
        );
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProductoId) return;

        setIsSubmittingItem(true);
        router.post(
            `/admin/reparaciones/${orden.id}/items`,
            {
                producto_id: selectedProductoId,
                cantidad: cantidadRepuesto,
            },
            {
                onSuccess: () => {
                    setSelectedProductoId('');
                    setCantidadRepuesto('1');
                    notifySuccess(__('Repuesto asignado correctamente.'));
                },
                onError: () => notifyError(__('Error al agregar repuesto.')),
                onFinish: () => setIsSubmittingItem(false),
            }
        );
    };

    const handleRemoveItem = (itemId: number) => {
        if (!confirm(__('¿Deseas remover este item de la orden?'))) return;
        router.delete(`/admin/reparaciones/${orden.id}/items/${itemId}`, {
            onSuccess: () => notifySuccess(__('Item removido correctamente.')),
            onError: () => notifyError(__('Error al remover item.')),
        });
    };

    const handleSaveCostos = () => {
        router.put(
            `/admin/reparaciones/${orden.id}`,
            {
                costo_mano_obra: manoObraInput,
                anticipo: anticipoInput,
            },
            {
                onSuccess: () => notifySuccess(__('Ajustes financieros guardados.')),
                onError: () => notifyError(__('Error al guardar ajustes financieros.')),
            }
        );
    };

    const sendWhatsApp = () => {
        const phone = orden.cliente?.telefono || orden.cliente_telefono;
        if (!phone) return;
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const clientName = orden.cliente?.nombre || orden.cliente_nombre;
        const deviceName = `${orden.marca?.nombre || orden.marca_nombre} ${orden.modelo?.nombre_comercial || orden.modelo_nombre}`;
        const msg = encodeURIComponent(
            `Hola *${clientName}*, le saludamos de Servicio Técnico.\nInformación sobre su orden *${orden.numero_orden}* (${deviceName}):\n\n📌 Estado actual: *${orden.estado_orden.toUpperCase().replace('_', ' ')}*\n💵 Presupuesto Total: *${currencySymbol}${formatNum(orden.costo_estimado)}*\n💳 Saldo Pendiente: *${currencySymbol}${formatNum(orden.saldo_restante)}*\n\nSi requiere asistencia adicional, no dude en responder a este mensaje.`
        );
        window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    };

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'recibido':
                return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold px-3 py-1 text-xs gap-1.5">🟡 {__('Recibido')}</Badge>;
            case 'en_diagnostico':
                return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 font-bold px-3 py-1 text-xs gap-1.5">🔍 {__('En Diagnóstico')}</Badge>;
            case 'presupuestado':
                return <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 font-bold px-3 py-1 text-xs gap-1.5">💵 {__('Presupuestado')}</Badge>;
            case 'en_reparacion':
                return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800 font-bold px-3 py-1 text-xs gap-1.5">🛠️ {__('En Reparación')}</Badge>;
            case 'esperando_repuesto':
                return <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800 font-bold px-3 py-1 text-xs gap-1.5">📦 {__('Esperando Repuesto')}</Badge>;
            case 'reparado':
                return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold px-3 py-1 text-xs gap-1.5">🟢 {__('Listo p/ Entrega')}</Badge>;
            case 'entregado':
                return <Badge className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold px-3 py-1 text-xs gap-1.5">✅ {__('Entregado & Finalizado')}</Badge>;
            case 'cancelado':
                return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-bold px-3 py-1 text-xs gap-1.5">❌ {__('Cancelado')}</Badge>;
            default:
                return <Badge variant="outline">{st}</Badge>;
        }
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Servicio Técnico'), href: '/admin/reparaciones' },
        { title: orden.numero_orden, href: '#' },
    ];

    const clienteNombreDisplay = orden.cliente?.nombre || orden.cliente_nombre || __('Cliente General');
    const clienteTelefonoDisplay = orden.cliente?.telefono || orden.cliente_telefono || 'N/A';
    const marcaNombreDisplay = orden.marca?.nombre || orden.marca_nombre || __('Dispositivo');
    const modeloNombreDisplay = orden.modelo?.nombre_comercial || orden.modelo_nombre || '';

    // Mapeo de fotos para la sección de evidencias
    const fotoSlots = [
        { key: 'frente', label: __('📱 Frente / Pantalla'), desc: __('Frontal & Cristal Display') },
        { key: 'trasero', label: __('🔄 Tapa Trasera'), desc: __('Carcasa & Cámaras') },
        { key: 'borde_sup', label: __('📐 Borde Superior / Izq.'), desc: __('Marco, Botones y Bisel') },
        { key: 'borde_inf', label: __('🔌 Borde Inferior / Der.'), desc: __('Puerto Carga & Altavoz') },
    ];

    return (
        <>
            <Head title={`Orden ${orden.numero_orden} - ${marcaNombreDisplay} ${modeloNombreDisplay}`} />

            <div className="w-full space-y-6 pb-16">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* HERO BAR PRINCIPAL CON ESTILO DASHBOARD PREMIUM */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-6 text-white shadow-xl border border-purple-900/40">
                    <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
                    <div className="absolute left-1/3 bottom-0 -mb-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        {/* FOLIO Y ESTADO */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 px-3 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
                                    {__('Ficha de Servicio Técnico')}
                                </span>
                                {getStatusBadge(orden.estado_orden)}
                            </div>

                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white flex items-center gap-3">
                                    {orden.numero_orden}
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(orden.numero_orden, __('Folio'))}
                                        title={__('Copiar Folio')}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        <Copy className="w-5 h-5" />
                                    </button>
                                </h1>
                            </div>

                            <p className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-purple-400" /> {formatDate(orden.fecha_recepcion)}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-purple-400" /> {__('Técnico:')} <strong className="text-purple-200">{orden.tecnico?.name || __('Sin Asignar')}</strong></span>
                            </p>
                        </div>

                        {/* BOTONES DE ACCIÓN RÁPIDA */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            <Link href="/admin/reparaciones">
                                <Button variant="outline" size="sm" className="h-10 text-xs bg-white/10 hover:bg-white/20 border-white/20 text-white gap-1.5 font-bold">
                                    <ArrowLeft className="w-4 h-4" />
                                    {__('Volver')}
                                </Button>
                            </Link>

                            {(orden.cliente?.telefono || orden.cliente_telefono) && (
                                <Button size="sm" onClick={sendWhatsApp} className="h-10 gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40">
                                    <Send className="w-4 h-4" />
                                    {__('WhatsApp')}
                                </Button>
                            )}

                            <Button size="sm" onClick={() => window.print()} variant="outline" className="h-10 gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 border-white/20 text-white">
                                <Printer className="w-4 h-4 text-blue-400" />
                                {__('Imprimir Ticket')}
                            </Button>

                            <Dialog open={openStatusModal} onOpenChange={setOpenStatusModal}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="h-10 gap-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/50">
                                        <Wrench className="w-4 h-4" />
                                        {__('Cambiar Estado')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                            <Wrench className="w-5 h-5 text-purple-600" />
                                            {__('Actualizar Estado de Reparación')}
                                        </DialogTitle>
                                    </DialogHeader>

                                    <div className="space-y-4 py-2">
                                        <div>
                                            <Label className="text-xs font-semibold">{__('Nuevo Estado *')}</Label>
                                            <Select value={nuevoEstado} onValueChange={(val) => setNuevoEstado(val)}>
                                                <SelectTrigger className="text-xs h-10 mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="recibido">🟡 Recibido</SelectItem>
                                                    <SelectItem value="en_diagnostico">🔍 En Diagnóstico</SelectItem>
                                                    <SelectItem value="presupuestado">💵 Presupuestado</SelectItem>
                                                    <SelectItem value="en_reparacion">🛠️ En Reparación</SelectItem>
                                                    <SelectItem value="esperando_repuesto">📦 Esperando Repuesto</SelectItem>
                                                    <SelectItem value="reparado">🟢 Listo p/ Entrega</SelectItem>
                                                    <SelectItem value="entregado">✅ Entregado & Finalizado</SelectItem>
                                                    <SelectItem value="cancelado">❌ Sin Arreglo / Cancelado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label className="text-xs font-semibold">{__('Técnico Asignado')}</Label>
                                            <Select value={tecnicoAsignadoId} onValueChange={(val) => setTecnicoAsignadoId(val)}>
                                                <SelectTrigger className="text-xs h-10 mt-1">
                                                    <SelectValue placeholder={__('Seleccionar técnico...')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {tecnicos.map((t) => (
                                                        <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                                                            🛠️ {t.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label className="text-xs font-semibold">{__('Comentario para la Línea de Tiempo')}</Label>
                                            <Textarea
                                                value={comentarioEstado}
                                                onChange={(e) => setComentarioEstado(e.target.value)}
                                                placeholder={__('ej: Pantalla reemplazada y probada. Equipo listo para entrega.')}
                                                rows={3}
                                                className="text-xs mt-1"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <Button variant="outline" size="sm" onClick={() => setOpenStatusModal(false)} className="h-8 text-xs">
                                            {__('Cancelar')}
                                        </Button>
                                        <Button size="sm" onClick={handleUpdateEstado} className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white">
                                            {__('Guardar Estado')}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                {/* 4 STRIPS METRICAS CLAVE DE LA ORDEN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* CLIENTE */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">{__('Cliente')}</span>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{clienteNombreDisplay}</h3>
                                <p className="text-xs font-mono text-purple-700 dark:text-purple-300 font-semibold">{clienteTelefonoDisplay}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* DISPOSITIVO */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">{__('Equipo / Modelo')}</span>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{marcaNombreDisplay} {modeloNombreDisplay}</h3>
                                <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1 truncate">
                                    IMEI: <strong className="text-slate-700 dark:text-slate-300">{orden.imei_serie || 'N/A'}</strong>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* DÍAS GARANTÍA / FECHA PROMETIDA */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">{__('Compromiso & Garantía')}</span>
                                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{orden.fecha_prometida || __('Sin fecha especificada')}</h3>
                                <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5" /> {orden.garantia_dias} {__('días de garantía')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SALDO PENDIENTE */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500 hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">{__('Saldo Restante a Cobrar')}</span>
                                <h3 className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                                    {currencySymbol}{formatNum(orden.saldo_restante)}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-mono">
                                    {__('Total:')} {currencySymbol}{formatNum(orden.costo_estimado)} | {__('Adelanto:')} {currencySymbol}{formatNum(orden.anticipo)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* BARRA NAVEGACIÓN TABBED MODERNA */}
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('general')}
                        className={cn(
                            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
                            activeTab === 'general'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                    >
                        <FileText className="w-4 h-4" />
                        {__('Resumen General')}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('repuestos')}
                        className={cn(
                            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
                            activeTab === 'repuestos'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                    >
                        <Package className="w-4 h-4" />
                        {__('Repuestos de Inventario')}
                        <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200">
                            {repuestosItems.length}
                        </Badge>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('fotos')}
                        className={cn(
                            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
                            activeTab === 'fotos'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                    >
                        <Camera className="w-4 h-4" />
                        {__('Evidencias Fotográficas')}
                        <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200">
                            {orden.fotos?.length || 0} / 4
                        </Badge>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('historial')}
                        className={cn(
                            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
                            activeTab === 'historial'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                    >
                        <History className="w-4 h-4" />
                        {__('Línea de Tiempo')}
                        <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200">
                            {orden.historial?.length || 0}
                        </Badge>
                    </button>
                </div>

                {/* CONTENIDO PRINCIPAL SEGÚN TAB SELECCIONADA */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* COLUMNA IZQUIERDA (2 ANCHOS) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* TAB 1: RESUMEN Y DIAGNÓSTICO */}
                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {/* CARD DETALLE DISPOSITIVO & FALLA */}
                                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                        <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-800 dark:text-slate-200">
                                            <span className="flex items-center gap-2">
                                                <Smartphone className="w-4 h-4 text-purple-600" />
                                                {__('Ficha Técnica del Equipo')}
                                            </span>
                                            <Badge variant="outline" className="font-mono text-[11px]">{orden.tipo_dispositivo || __('Smartphone')}</Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 space-y-5 text-xs">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            <div>
                                                <span className="text-slate-400 block text-[11px] font-medium">{__('Marca')}</span>
                                                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{marcaNombreDisplay}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[11px] font-medium">{__('Modelo')}</span>
                                                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{modeloNombreDisplay || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[11px] font-medium">{__('Color / Estética')}</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{orden.color || __('No especificado')}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[11px] font-medium">{__('IMEI / Serie')}</span>
                                                <span className="font-mono font-bold text-purple-700 dark:text-purple-400">{orden.imei_serie || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[11px] font-medium">{__('Fecha Prometida')}</span>
                                                <span className="font-medium text-slate-800 dark:text-slate-200">{orden.fecha_prometida || __('No especificada')}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[11px] font-medium">{__('Días Garantía')}</span>
                                                <span className="font-bold text-emerald-600">{orden.garantia_dias} {__('Días')}</span>
                                            </div>
                                        </div>

                                        {/* HERO FALLA REPORTADA */}
                                        <div className="p-4 bg-purple-50/70 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900 space-y-1.5">
                                            <span className="font-extrabold text-purple-900 dark:text-purple-200 block text-xs flex items-center gap-1.5">
                                                <AlertCircle className="w-4 h-4 text-purple-600" />
                                                {__('Falla Reportada por el Cliente:')}
                                            </span>
                                            <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed font-medium">
                                                {orden.descripcion_falla || __('Sin descripción especificada en la recepción.')}
                                            </p>
                                        </div>

                                        {orden.observaciones_fisicas && (
                                            <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 space-y-1 text-xs">
                                                <span className="font-bold block text-[11px]">{__('Observaciones Físicas de Recepción:')}</span>
                                                <p>{orden.observaciones_fisicas}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* TRABAJOS Y MANO DE OBRA ASIGNADA */}
                                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                        <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-800 dark:text-slate-200">
                                            <span className="flex items-center gap-2">
                                                <Wrench className="w-4 h-4 text-purple-600" />
                                                {__('Servicios de Mano de Obra Solicitados')}
                                            </span>
                                            <Badge variant="outline" className="font-mono text-purple-700 bg-purple-50 dark:bg-purple-950/50 font-bold border-purple-200">
                                                {serviciosItems.length} {serviciosItems.length === 1 ? __('Servicio') : __('Servicios')}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        {serviciosItems.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic text-center py-4">
                                                {__('No se han registrado conceptos específicos de mano de obra en la recepción.')}
                                            </p>
                                        ) : (
                                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {serviciosItems.map((item) => (
                                                    <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                                                        <div className="space-y-0.5">
                                                            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                                                                {item.descripcion}
                                                            </span>
                                                            {(item as any).servicio?.categoria?.nombre && (
                                                                <span className="text-[10px] text-slate-400 block font-medium pl-6">
                                                                    Categoría: {(item as any).servicio.categoria.nombre}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                                                            {currencySymbol}{formatNum(item.precio_venta)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* TAB 2: REPUESTOS CONSUMIDOS DE INVENTARIO */}
                        {activeTab === 'repuestos' && (
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-300">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                    <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-800 dark:text-slate-200">
                                        <span className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-purple-600" />
                                            {__('Repuestos Consumidos de Inventario')}
                                        </span>
                                        <span className="font-mono text-xs text-purple-600 font-bold">
                                            {currencySymbol}{formatNum(orden.costo_repuestos)}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    {/* FORMULARIO AGREGAR REPUESTO */}
                                    <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <div className="flex-1 w-full">
                                            <Select value={selectedProductoId} onValueChange={(val) => setSelectedProductoId(val)}>
                                                <SelectTrigger className="text-xs h-10 bg-white dark:bg-slate-900">
                                                    <SelectValue placeholder={__('Buscar repuesto en inventario...')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {repuestosCompatibles.length > 0 && (
                                                        <SelectGroup>
                                                            <SelectLabel className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-1 flex items-center gap-1">
                                                                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                                                {__('🎯 Compatibles con')} {marcaNombreDisplay} {modeloNombreDisplay} ({repuestosCompatibles.length})
                                                            </SelectLabel>
                                                            {repuestosCompatibles.map((p) => {
                                                                const nombreProd = p.nombre_variante || p.nombre || '';
                                                                const cod = p.sku || p.codigo_barras || '';
                                                                return (
                                                                    <SelectItem key={p.id} value={String(p.id)} className="text-xs font-bold text-purple-950 dark:text-purple-100">
                                                                        🎯 {nombreProd} {cod ? `(${cod})` : ''} - {currencySymbol}{Number(p.precio_venta).toFixed(2)} [Stock: {p.stock}]
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectGroup>
                                                    )}

                                                    <SelectGroup>
                                                        <SelectLabel className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1">
                                                            {__('📦 Todos los Repuestos de Inventario')} ({otrosRepuestos.length})
                                                        </SelectLabel>
                                                        {otrosRepuestos.map((p) => {
                                                            const nombreProd = p.nombre_variante || p.nombre || '';
                                                            const cod = p.sku || p.codigo_barras || '';
                                                            const marcaInfo = p.marca?.nombre ? `[${p.marca.nombre}] ` : '';
                                                            return (
                                                                <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                                                                    {marcaInfo}{nombreProd} {cod ? `(${cod})` : ''} - {currencySymbol}{Number(p.precio_venta).toFixed(2)} [Stock: {p.stock}]
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24">
                                            <Input
                                                type="number"
                                                min="1"
                                                value={cantidadRepuesto}
                                                onChange={(e) => setCantidadRepuesto(e.target.value)}
                                                placeholder="Cant"
                                                className="text-xs h-10 bg-white dark:bg-slate-900"
                                            />
                                        </div>
                                        <Button type="submit" disabled={isSubmittingItem || !selectedProductoId} size="sm" className="h-10 px-5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white">
                                            <Plus className="w-4 h-4 mr-1" />
                                            {__('Asignar Repuesto')}
                                        </Button>
                                    </form>

                                    {/* TABLA DE REPUESTOS */}
                                    <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
                                                <tr>
                                                    <th className="px-4 py-3">{__('Repuesto / Componente')}</th>
                                                    <th className="px-4 py-3 text-center">{__('Cantidad')}</th>
                                                    <th className="px-4 py-3 text-right">{__('Precio Venta')}</th>
                                                    <th className="px-4 py-3 text-right">{__('Subtotal')}</th>
                                                    <th className="px-3 py-3 text-center"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {repuestosItems.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-4 py-6 text-center text-slate-400 italic">
                                                            {__('No se han asignado repuestos adicionales a esta orden.')}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    repuestosItems.map((item) => (
                                                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{item.descripcion}</td>
                                                            <td className="px-4 py-3 text-center font-mono font-bold">{item.cantidad}</td>
                                                            <td className="px-4 py-3 text-right font-mono">{currencySymbol}{formatNum(item.precio_venta)}</td>
                                                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">{currencySymbol}{formatNum(item.subtotal)}</td>
                                                            <td className="px-3 py-3 text-center">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => handleRemoveItem(item.id)}
                                                                    className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* TAB 3: EVIDENCIAS FOTOGRÁFICAS */}
                        {activeTab === 'fotos' && (
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-300">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                    <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-800 dark:text-slate-200">
                                        <span className="flex items-center gap-2">
                                            <Camera className="w-4 h-4 text-purple-600" />
                                            {__('Evidencias Fotográficas de Recepción (4 Ángulos)')}
                                        </span>
                                        <Badge variant="outline" className="font-mono text-xs">
                                            {orden.fotos?.length || 0} / 4 {__('Capturadas')}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {fotoSlots.map((item) => {
                                            const fotoObj = orden.fotos?.find((f: any) => f.angulo === item.key);
                                            const imgUrl = fotoObj ? fotoObj.url : (orden.evidencias_fotos as any)?.[item.key];
                                            return (
                                                <div key={item.key} className="flex flex-col items-center p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-center gap-2 shadow-sm hover:border-purple-300 transition-colors">
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</span>
                                                    <span className="text-[10px] text-slate-400">{item.desc}</span>

                                                    {imgUrl ? (
                                                        <div
                                                            onClick={() => setPreviewPhoto({ url: imgUrl, label: item.label })}
                                                            className="w-full h-40 rounded-xl overflow-hidden border border-purple-200 dark:border-purple-900 block group relative cursor-pointer shadow-inner"
                                                        >
                                                            <img src={imgUrl} alt={item.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 backdrop-blur-[2px]">
                                                                <Eye className="w-4 h-4" />
                                                                {__('Ampliar')}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-40 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-900/40 gap-1">
                                                            <Camera className="w-6 h-6 text-slate-300" />
                                                            <span className="font-semibold text-[11px]">{__('Sin Fotografía')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* TAB 4: LÍNEA DE TIEMPO / HISTORIAL */}
                        {activeTab === 'historial' && (
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-300">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                        <History className="w-4 h-4 text-purple-600" />
                                        {__('Línea de Tiempo & Trazabilidad de Cambios')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5">
                                    <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                                        {orden.historial.map((h) => (
                                            <div key={h.id} className="relative pl-8 space-y-1">
                                                <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-purple-600 ring-4 ring-white dark:ring-slate-900 shadow-sm" />
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                        {getStatusBadge(h.estado_nuevo)}
                                                    </span>
                                                    <span className="text-slate-400 text-[11px] font-mono">{formatDate(h.created_at)}</span>
                                                </div>
                                                {h.user && (
                                                    <span className="text-[11px] font-semibold text-slate-500 block">
                                                        👤 {h.user.name}
                                                    </span>
                                                )}
                                                {h.comentario && (
                                                    <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mt-1.5 font-medium leading-relaxed">
                                                        "{h.comentario}"
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* COLUMNA DERECHA: RESUMEN FINANCIERO E HISTORIAL (1 ANCHO) */}
                    <div className="space-y-6">
                        {/* RESUMEN FINANCIERO Y CONTROL DE COSTOS */}
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                    <DollarSign className="w-4 h-4 text-emerald-600" />
                                    {__('Resumen Financiero')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-5 text-xs">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                        <span>{__('Costo del Servicio:')}</span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{currencySymbol}{formatNum(orden.costo_repuestos)}</span>
                                    </div>

                                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <Label className="text-[11px] font-semibold">{__('Costo Mano de Obra:')}</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={manoObraInput}
                                            onChange={(e) => setManoObraInput(e.target.value)}
                                            className="text-xs h-9 font-mono bg-white dark:bg-slate-950"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-semibold">{__('Anticipo / Adelanto:')}</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={anticipoInput}
                                            onChange={(e) => setAnticipoInput(e.target.value)}
                                            className="text-xs h-9 font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-slate-950"
                                        />
                                    </div>

                                    <Button onClick={handleSaveCostos} size="sm" variant="outline" className="w-full h-8 text-xs font-bold mt-2 border-purple-200 hover:bg-purple-50 text-purple-700 dark:border-purple-800 dark:text-purple-300">
                                        <Save className="w-3.5 h-3.5 mr-1" />
                                        {__('Guardar Ajustes de Costo')}
                                    </Button>
                                </div>

                                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                                    <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-slate-100">
                                        <span>{__('Total Presupuesto:')}</span>
                                        <span className="font-mono text-purple-700 dark:text-purple-400 text-lg font-black">{currencySymbol}{formatNum(orden.costo_estimado)}</span>
                                    </div>

                                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-300 space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-xs">{__('Saldo Restante a Cobrar:')}</span>
                                            <span className="font-mono font-black text-xl text-emerald-600 dark:text-emerald-400">{currencySymbol}{formatNum(orden.saldo_restante)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* HISTORIAL LATERAL RESUMIDO */}
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-800 dark:text-slate-200">
                                    <span className="flex items-center gap-2">
                                        <History className="w-4 h-4 text-purple-600" />
                                        {__('Historial Reciente')}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('historial')}
                                        className="text-[11px] font-bold text-purple-600 hover:text-purple-800"
                                    >
                                        {__('Ver todo')} →
                                    </button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 text-xs space-y-3">
                                {orden.historial.slice(0, 3).map((h) => (
                                    <div key={h.id} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-bold capitalize text-slate-800 dark:text-slate-200">{h.estado_nuevo.replace('_', ' ')}</span>
                                            <span className="text-[10px] text-slate-400">{formatDate(h.created_at)}</span>
                                        </div>
                                        {h.comentario && <p className="text-[11px] text-slate-500 italic truncate">"{h.comentario}"</p>}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* MODAL AMPLIACIÓN FOTO */}
                <Dialog open={!!previewPhoto} onOpenChange={(open) => { if (!open) setPreviewPhoto(null); }}>
                    <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-slate-950 text-white border-slate-800">
                        <DialogHeader className="p-4 bg-slate-900 border-b border-slate-800 flex flex-row items-center justify-between">
                            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-white">
                                <Camera className="w-5 h-5 text-purple-400" />
                                {previewPhoto?.label}
                            </DialogTitle>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setPreviewPhoto(null)} className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </Button>
                        </DialogHeader>
                        <div className="p-4 flex items-center justify-center bg-black min-h-[400px]">
                            {previewPhoto?.url && (
                                <img src={previewPhoto.url} alt={previewPhoto.label} className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl" />
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
