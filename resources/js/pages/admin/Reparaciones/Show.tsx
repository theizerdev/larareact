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
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface Item {
    id: number;
    descripcion: string;
    cantidad: number;
    precio_costo: number;
    precio_venta: number;
    subtotal: number;
    producto?: { nombre: string; codigo: string };
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
    contrasena_patron?: string;
    descripcion_falla: string;
    observaciones_fisicas?: string;
    inspeccion_fisica?: Record<string, { estado: string; obs: string }>;
    estado_equipo?: Record<string, string>;
    accesorios?: Record<string, boolean>;
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
    items: Item[];
    historial: Historial[];
}

interface ProductoRepuesto {
    id: number;
    codigo: string;
    nombre: string;
    precio_venta: number;
    stock: number;
}

interface Props {
    orden: Orden;
    productosRepuestos: ProductoRepuesto[];
    tecnicos: { id: number; name: string }[];
    currencySymbol: string;
}

export default function ShowReparacion({ orden, productosRepuestos, tecnicos, currencySymbol }: Props) {
    const { __ } = useTranslate();

    const [openStatusModal, setOpenStatusModal] = useState(false);
    const [nuevoEstado, setNuevoEstado] = useState(orden.estado_orden);
    const [comentarioEstado, setComentarioEstado] = useState('');
    const [tecnicoAsignadoId, setTecnicoAsignadoId] = useState(orden.tecnico?.id ? String(orden.tecnico.id) : '');

    // Formulario de Repuesto
    const [selectedProductoId, setSelectedProductoId] = useState('');
    const [cantidadRepuesto, setCantidadRepuesto] = useState('1');
    const [isSubmittingItem, setIsSubmittingItem] = useState(false);

    // Formulario Mano de Obra
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
        router.delete(`/admin/reparaciones/${orden.id}/items/${itemId}`, {
            onSuccess: () => notifySuccess(__('Repuesto eliminado.')),
        });
    };

    const handleSaveCostos = () => {
        router.post(
            `/admin/reparaciones/${orden.id}/costos`,
            {
                costo_mano_obra: manoObraInput,
                anticipo: anticipoInput,
            },
            {
                onSuccess: () => notifySuccess(__('Costos actualizados.')),
            }
        );
    };

    const sendWhatsApp = () => {
        if (!orden.cliente_telefono) return;
        const cleanPhone = orden.cliente_telefono.replace(/[^0-9]/g, '');
        const msg = encodeURIComponent(
            `Hola ${orden.cliente_nombre}, le informamos sobre su equipo ${orden.marca_nombre} ${orden.modelo_nombre} (Orden ${orden.numero_orden}):\nEstado actual: *${orden.estado_orden.toUpperCase().replace('_', ' ')}*\nPresupuesto Total: ${currencySymbol}${orden.costo_estimado}\nSaldo Restante: ${currencySymbol}${orden.saldo_restante}.`
        );
        window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    };

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'recibido': return <Badge className="bg-slate-700 text-white font-bold">🟡 Recibido</Badge>;
            case 'en_diagnostico': return <Badge className="bg-blue-600 text-white font-bold">🔍 En Diagnóstico</Badge>;
            case 'presupuestado': return <Badge className="bg-indigo-600 text-white font-bold">💵 Presupuestado</Badge>;
            case 'en_reparacion': return <Badge className="bg-purple-600 text-white font-bold">🛠️ En Reparación</Badge>;
            case 'esperando_repuesto': return <Badge className="bg-amber-500 text-white font-bold">📦 Esperando Repuesto</Badge>;
            case 'reparado': return <Badge className="bg-emerald-600 text-white font-bold">🟢 Listo p/ Entrega</Badge>;
            case 'entregado': return <Badge className="bg-slate-900 text-white font-bold">✅ Entregado</Badge>;
            case 'cancelado': return <Badge className="bg-rose-600 text-white font-bold">❌ Sin Arreglo / Cancelado</Badge>;
            default: return <Badge variant="outline">{st}</Badge>;
        }
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Servicio Técnico'), href: '/admin/reparaciones' },
        { title: orden.numero_orden, href: '#' },
    ];

    return (
        <>
            <Head title={`Ficha Técnica ${orden.numero_orden} - Servicio Técnico`} />

            <div className="space-y-6 max-w-6xl mx-auto pb-12">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                                {orden.numero_orden}
                            </h1>
                            {getStatusBadge(orden.estado_orden)}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {__('Recepción:')} {new Date(orden.fecha_recepcion).toLocaleString()} | {__('Técnico:')} <strong className="text-purple-700 dark:text-purple-400">{orden.tecnico?.name || __('Sin Asignar')}</strong>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link href="/admin/reparaciones">
                            <Button variant="outline" size="sm" className="h-9 text-xs">
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                {__('Volver')}
                            </Button>
                        </Link>

                        {orden.cliente_telefono && (
                            <Button size="sm" onClick={sendWhatsApp} className="h-9 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                                <Send className="w-4 h-4" />
                                {__('Notificar WhatsApp')}
                            </Button>
                        )}

                        <Button size="sm" onClick={() => window.print()} variant="outline" className="h-9 gap-1.5 text-xs font-bold">
                            <Printer className="w-4 h-4 text-blue-600" />
                            {__('Imprimir Ticket')}
                        </Button>

                        <Dialog open={openStatusModal} onOpenChange={setOpenStatusModal}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="h-9 gap-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm">
                                    <Wrench className="w-4 h-4" />
                                    {__('Cambiar Estado')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                        <Wrench className="w-5 h-5 text-purple-600" />
                                        {__('Cambiar Estado de la Reparación')}
                                    </DialogTitle>
                                </DialogHeader>

                                <div className="space-y-4 py-2">
                                    <div>
                                        <Label className="text-xs">{__('Nuevo Estado *')}</Label>
                                        <Select value={nuevoEstado} onValueChange={(val) => setNuevoEstado(val)}>
                                            <SelectTrigger className="text-xs h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="recibido">🟡 Recibido</SelectItem>
                                                <SelectItem value="en_diagnostico">🔍 En Diagnóstico</SelectItem>
                                                <SelectItem value="presupuestado">💵 Presupuestado</SelectItem>
                                                <SelectItem value="en_reparacion">🛠️ En Reparación</SelectItem>
                                                <SelectItem value="esperando_repuesto">📦 Esperando Repuesto</SelectItem>
                                                <SelectItem value="reparado">🟢 Listo p/ Entrega</SelectItem>
                                                <SelectItem value="entregado">✅ Entregado & Cobrado</SelectItem>
                                                <SelectItem value="cancelado">❌ Sin Arreglo / Cancelado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label className="text-xs">{__('Reasignar Técnico')}</Label>
                                        <Select value={tecnicoAsignadoId} onValueChange={(val) => setTecnicoAsignadoId(val)}>
                                            <SelectTrigger className="text-xs h-9">
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
                                        <Label className="text-xs">{__('Comentario u Observación')}</Label>
                                        <Textarea
                                            value={comentarioEstado}
                                            onChange={(e) => setComentarioEstado(e.target.value)}
                                            placeholder={__('ej: Se cambió la pantalla exitosamente. Pruebas superadas.')}
                                            rows={3}
                                            className="text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <Button variant="outline" size="sm" onClick={() => setOpenStatusModal(false)} className="h-8 text-xs">
                                        {__('Cancelar')}
                                    </Button>
                                    <Button size="sm" onClick={handleUpdateEstado} className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white">
                                        {__('Actualizar Estado')}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* COLUMNA IZQUIERDA: DATOS PRINCIPALES E INSPECCIÓN (2 COLUMNAS DE ANCHO) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* TARJETA DATOS CLIENTE & EQUIPO */}
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-800 dark:text-slate-200">
                                    <span className="flex items-center gap-2">
                                        <Smartphone className="w-4 h-4 text-purple-600" />
                                        {orden.marca_nombre} {orden.modelo_nombre}
                                    </span>
                                    <Badge variant="outline" className="font-mono text-[11px] capitalize">{orden.tipo_dispositivo}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4 text-xs">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">{__('Cliente')}</span>
                                        <span className="font-bold text-slate-900 dark:text-slate-100">{orden.cliente_nombre}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">{__('Teléfono')}</span>
                                        <span className="font-mono text-slate-800 dark:text-slate-200">{orden.cliente_telefono || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">{__('IMEI / Serie')}</span>
                                        <span className="font-mono font-bold text-purple-700 dark:text-purple-400">{orden.imei_serie || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">{__('PIN / Contraseña')}</span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{orden.contrasena_patron || 'Sin Clave'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">{__('Fecha Prometida')}</span>
                                        <span className="font-medium text-slate-800 dark:text-slate-200">{orden.fecha_prometida || 'No especificada'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">{__('Garantía')}</span>
                                        <span className="font-bold text-emerald-600">{orden.garantia_dias} {__('días')}</span>
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                                    <span className="font-bold text-purple-700 dark:text-purple-400 block">{__('Falla Reportada por el Cliente:')}</span>
                                    <p className="text-slate-700 dark:text-slate-300">{orden.descripcion_falla}</p>
                                </div>

                                {orden.observaciones_fisicas && (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 space-y-1">
                                        <span className="font-bold block text-[11px]">{__('Observaciones Físicas de Recepción:')}</span>
                                        <p>{orden.observaciones_fisicas}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* RESUMEN DE INSPECCIÓN FÍSICA & ESTADO */}
                        {orden.inspeccion_fisica && (
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                                        {__('Resultados de Inspección Física (12 Puntos)')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                                        {Object.entries(orden.inspeccion_fisica).map(([itemKey, val]) => (
                                            <div key={itemKey} className="p-2 rounded border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-0.5">
                                                <span className="font-medium text-slate-700 dark:text-slate-300 block truncate">{itemKey}</span>
                                                <div className="flex items-center gap-1">
                                                    {val.estado === 'bueno' && <Badge className="bg-emerald-600 text-[10px]">Bueno</Badge>}
                                                    {val.estado === 'malo' && <Badge className="bg-rose-600 text-[10px]">Malo</Badge>}
                                                    {val.estado === 'no_aplica' && <Badge variant="outline" className="text-[10px]">N/A</Badge>}
                                                </div>
                                                {val.obs && <span className="text-[10px] text-slate-400 italic block truncate">{val.obs}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* TABLA DE REPUESTOS CONSUMIDOS DE INVENTARIO */}
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-800 dark:text-slate-200">
                                    <span className="flex items-center gap-2">
                                        <Package className="w-4 h-4 text-purple-600" />
                                        {__('Repuestos Consumidos de Inventario')}
                                    </span>
                                    <span className="font-mono text-xs text-purple-600 font-bold">
                                        {currencySymbol}{Number(orden.costo_repuestos).toFixed(2)}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {/* Formulario rápido agregar repuesto */}
                                <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800">
                                    <div className="flex-1 w-full">
                                        <Select value={selectedProductoId} onValueChange={(val) => setSelectedProductoId(val)}>
                                            <SelectTrigger className="text-xs h-9 bg-white dark:bg-slate-900">
                                                <SelectValue placeholder={__('Buscar repuesto en inventario...')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {productosRepuestos.map((p) => (
                                                    <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                                                        {p.nombre} ({p.codigo}) - {currencySymbol}{p.precio_venta} [Stock: {p.stock}]
                                                    </SelectItem>
                                                ))}
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
                                            className="text-xs h-9 bg-white dark:bg-slate-900"
                                        />
                                    </div>
                                    <Button type="submit" disabled={isSubmittingItem || !selectedProductoId} size="sm" className="h-9 px-4 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white">
                                        <Plus className="w-3.5 h-3.5 mr-1" />
                                        {__('Asignar')}
                                    </Button>
                                </form>

                                {/* Listado de Repuestos */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-3 py-2">{__('Repuesto / Componente')}</th>
                                                <th className="px-3 py-2 text-center">{__('Cant')}</th>
                                                <th className="px-3 py-2 text-right">{__('P. Venta')}</th>
                                                <th className="px-3 py-2 text-right">{__('Subtotal')}</th>
                                                <th className="px-2 py-2 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {orden.items.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-3 py-4 text-center text-slate-400 italic">
                                                        {__('No se han asignado repuestos a esta orden.')}
                                                    </td>
                                                </tr>
                                            ) : (
                                                orden.items.map((item) => (
                                                    <tr key={item.id}>
                                                        <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{item.descripcion}</td>
                                                        <td className="px-3 py-2 text-center font-mono">{item.cantidad}</td>
                                                        <td className="px-3 py-2 text-right font-mono">{currencySymbol}{Number(item.precio_venta).toFixed(2)}</td>
                                                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900 dark:text-slate-100">{currencySymbol}{Number(item.subtotal).toFixed(2)}</td>
                                                        <td className="px-2 py-2 text-center">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => handleRemoveItem(item.id)}
                                                                className="h-6 w-6 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
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
                    </div>

                    {/* COLUMNA DERECHA: RESUMEN FINANCIERO Y LÍNEA DE TIEMPO (1 COLUMNA) */}
                    <div className="space-y-6">
                        {/* RESUMEN DE COSTOS */}
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                    <DollarSign className="w-4 h-4 text-emerald-600" />
                                    {__('Resumen Financiero')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4 text-xs">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                        <span>{__('Costo Repuestos:')}</span>
                                        <span className="font-mono font-bold">{currencySymbol}{Number(orden.costo_repuestos).toFixed(2)}</span>
                                    </div>

                                    <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                                        <Label className="text-[11px]">{__('Costo Mano de Obra:')}</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={manoObraInput}
                                            onChange={(e) => setManoObraInput(e.target.value)}
                                            className="text-xs h-8 font-mono"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[11px]">{__('Anticipo / Adelanto:')}</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={anticipoInput}
                                            onChange={(e) => setAnticipoInput(e.target.value)}
                                            className="text-xs h-8 font-mono text-emerald-600 font-bold"
                                        />
                                    </div>

                                    <Button onClick={handleSaveCostos} size="sm" variant="outline" className="w-full h-7 text-[11px] font-semibold mt-1">
                                        <Save className="w-3 h-3 mr-1" />
                                        {__('Guardar Ajustes de Costo')}
                                    </Button>
                                </div>

                                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                                    <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-slate-100">
                                        <span>{__('Total Presupuesto:')}</span>
                                        <span className="font-mono text-purple-700 dark:text-purple-400 text-base">{currencySymbol}{Number(orden.costo_estimado).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-300">
                                        <span className="font-bold text-xs">{__('Saldo Restante a Cobrar:')}</span>
                                        <span className="font-mono font-black text-base">{currencySymbol}{Number(orden.saldo_restante).toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* HISTORIAL / LÍNEA DE TIEMPO */}
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                    <History className="w-4 h-4 text-purple-600" />
                                    {__('Línea de Tiempo / Historial')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 text-xs">
                                <div className="space-y-4 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                                    {orden.historial.map((h) => (
                                        <div key={h.id} className="relative pl-7 space-y-0.5">
                                            <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-purple-600 border-2 border-white dark:border-slate-900" />
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="font-bold capitalize text-slate-900 dark:text-slate-100">{h.estado_nuevo.replace('_', ' ')}</span>
                                                <span className="text-slate-400 text-[10px]">{new Date(h.created_at).toLocaleString()}</span>
                                            </div>
                                            {h.user && <span className="text-[10px] text-slate-500 block">{h.user.name}</span>}
                                            {h.comentario && <p className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800 mt-1">{h.comentario}</p>}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
