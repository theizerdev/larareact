import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Sparkles,
    Plus,
    Edit,
    Trash2,
    Check,
    Tag,
    Clock,
    DollarSign,
    Building2,
    Users,
    Layers,
    Flame,
    Zap,
    TrendingDown,
    LayoutGrid,
    Table as TableIcon,
    ArrowRight,
    ShieldCheck,
} from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface Plan {
    id: number;
    nombre: string;
    descripcion: string | null;
    precio_regular_mensual: number;
    precio_promocional_mensual: number;
    tiene_promocion: boolean;
    meses_duracion_promocion: number;
    badge_promocion: string | null;
    destacado: boolean;
    orden: number;
    precio_3_meses: number;
    precio_6_meses: number;
    precio_12_meses: number;
    precio_sucursal_extra_mensual: number;
    sucursales_incluidas: number;
    modulos_incluidos: string[] | null;
    activo: boolean;
    subscriptions_count?: number;
}

interface PageProps {
    planes: Plan[];
    stats: {
        totalPlanes: number;
        planesActivos: number;
        planesConPromo: number;
        totalSuscripciones: number;
    };
    currencySymbol: string;
}

const MODULOS_DISPONIBLES = [
    { id: 'todos', label: 'Todos los Módulos (Acceso Completo)' },
    { id: 'pos', label: 'Punto de Venta (POS) & Terminal' },
    { id: 'inventario', label: 'Inventario, Productos & Variantes' },
    { id: 'reparaciones', label: 'Taller de Reparaciones & Equipos' },
    { id: 'contabilidad', label: 'Contabilidad, Libros & P&L' },
    { id: 'cfdi', label: 'Facturación Electrónica CFDI' },
    { id: 'nomina', label: 'Nómina & Gestión de Empleados' },
    { id: 'proveedores', label: 'Proveedores & Órdenes de Compra' },
    { id: 'creditos', label: 'Cuentas por Cobrar & Créditos' },
];

export default function PlanesIndex({ planes = [], stats, currencySymbol = '$' }: PageProps) {
    const { __ } = useTranslate();
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio_regular_mensual: 499,
        precio_promocional_mensual: 249,
        tiene_promocion: true,
        meses_duracion_promocion: 3,
        badge_promocion: '50% OFF Primer Trimestre',
        destacado: false,
        orden: 1,
        precio_3_meses: 747,
        precio_6_meses: 1494,
        precio_12_meses: 2388,
        precio_sucursal_extra_mensual: 20,
        sucursales_incluidas: 1,
        modulos_incluidos: ['todos'],
        activo: true,
    });

    const getCsrfToken = () => {
        return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
    };

    const handleOpenCreate = () => {
        setEditingPlan(null);
        setFormData({
            nombre: '',
            descripcion: '',
            precio_regular_mensual: 499,
            precio_promocional_mensual: 249,
            tiene_promocion: true,
            meses_duracion_promocion: 3,
            badge_promocion: '50% OFF Primer Trimestre',
            destacado: false,
            orden: planes.length + 1,
            precio_3_meses: 747,
            precio_6_meses: 1494,
            precio_12_meses: 2388,
            precio_sucursal_extra_mensual: 20,
            sucursales_incluidas: 1,
            modulos_incluidos: ['todos'],
            activo: true,
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData({
            nombre: plan.nombre,
            descripcion: plan.descripcion || '',
            precio_regular_mensual: Number(plan.precio_regular_mensual) || (Number(plan.precio_3_meses) > 0 ? Math.round(Number(plan.precio_3_meses) / 3) : 499),
            precio_promocional_mensual: Number(plan.precio_promocional_mensual) || (Number(plan.precio_3_meses) > 0 ? Math.round(Number(plan.precio_3_meses) / 3) : 249),
            tiene_promocion: Boolean(plan.tiene_promocion),
            meses_duracion_promocion: plan.meses_duracion_promocion || 3,
            badge_promocion: plan.badge_promocion || '',
            destacado: Boolean(plan.destacado),
            orden: plan.orden || 1,
            precio_3_meses: Number(plan.precio_3_meses) || 747,
            precio_6_meses: Number(plan.precio_6_meses) || 1494,
            precio_12_meses: Number(plan.precio_12_meses) || 2388,
            precio_sucursal_extra_mensual: Number(plan.precio_sucursal_extra_mensual) || 20,
            sucursales_incluidas: plan.sucursales_incluidas || 1,
            modulos_incluidos: plan.modulos_incluidos || ['todos'],
            activo: Boolean(plan.activo),
        });
        setIsModalOpen(true);
    };

    // Auto-calculador de precios en base al precio mensual
    const handlePrecioRegularChange = (val: number) => {
        setFormData((prev) => {
            const promo = prev.tiene_promocion ? prev.precio_promocional_mensual : val;
            return {
                ...prev,
                precio_regular_mensual: val,
                precio_3_meses: Math.round(promo * 3),
                precio_6_meses: Math.round(promo * 6),
                precio_12_meses: Math.round(promo * 12),
            };
        });
    };

    const handlePrecioPromoChange = (val: number) => {
        setFormData((prev) => ({
            ...prev,
            precio_promocional_mensual: val,
            precio_3_meses: Math.round(val * 3),
            precio_6_meses: Math.round(val * 6),
            precio_12_meses: Math.round(val * 12),
        }));
    };

    const handleToggleModulo = (modId: string) => {
        setFormData((prev) => {
            let current = prev.modulos_incluidos || [];
            if (modId === 'todos') {
                return { ...prev, modulos_incluidos: ['todos'] };
            }
            current = current.filter((m) => m !== 'todos');
            if (current.includes(modId)) {
                current = current.filter((m) => m !== modId);
            } else {
                current = [...current, modId];
            }
            if (current.length === 0) current = ['todos'];
            return { ...prev, modulos_incluidos: current };
        });
    };

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nombre.trim()) {
            notifyError(__('El nombre del plan es obligatorio.'));
            return;
        }

        setIsSubmitting(true);
        try {
            const url = editingPlan ? `/admin/planes/${editingPlan.id}` : '/admin/planes';
            const method = editingPlan ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (res.ok) {
                notifySuccess(data.message || __('Plan guardado correctamente.'));
                setIsModalOpen(false);
                router.reload({ preserveScroll: true });
            } else {
                notifyError(data.message || __('Error al guardar el plan.'));
            }
        } catch (err) {
            notifyError(__('Error en la conexión con el servidor.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickTogglePromo = async (planId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/admin/planes/${planId}/toggle-promo`, {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });
            if (res.ok) {
                notifySuccess(__('Promoción actualizada.'));
                router.reload({ preserveScroll: true });
            }
        } catch (err) {
            notifyError(__('Error al actualizar promoción.'));
        }
    };

    const handleQuickToggleStatus = async (planId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/admin/planes/${planId}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });
            if (res.ok) {
                notifySuccess(__('Estado del plan actualizado.'));
                router.reload({ preserveScroll: true });
            }
        } catch (err) {
            notifyError(__('Error al actualizar estado.'));
        }
    };

    const handleQuickToggleDestacado = async (planId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/admin/planes/${planId}/toggle-destacado`, {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });
            if (res.ok) {
                notifySuccess(__('Plan destacado actualizado.'));
                router.reload({ preserveScroll: true });
            }
        } catch (err) {
            notifyError(__('Error al actualizar destacado.'));
        }
    };

    const handleDeletePlan = (plan: Plan, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(__('¿Estás seguro de que deseas eliminar o desactivar este plan?'))) {
            return;
        }

        router.delete(`/admin/planes/${plan.id}`, {
            preserveScroll: true,
            onSuccess: () => notifySuccess(__('Plan procesado exitosamente.')),
            onError: () => notifyError(__('Error al eliminar el plan.')),
        });
    };

    // Cálculos de descuento en tiempo real para el modal
    const calcularPorcentajeDescuento = () => {
        const regular = Number(formData.precio_regular_mensual) || 0;
        const promo = Number(formData.precio_promocional_mensual) || 0;
        if (regular <= 0 || promo <= 0 || !formData.tiene_promocion) return 0;
        return Math.max(0, Math.round(((regular - promo) / regular) * 100));
    };

    const calcularAhorroTotalPromo = () => {
        const regular = Number(formData.precio_regular_mensual) || 0;
        const promo = Number(formData.precio_promocional_mensual) || 0;
        const meses = Number(formData.meses_duracion_promocion) || 3;
        if (regular <= 0 || promo <= 0 || !formData.tiene_promocion) return 0;
        return Math.max(0, (regular - promo) * meses);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: __('Dashboard'),
            href: '/admin/dashboard',
        },
        {
            title: __('Planes de Suscripción'),
            href: '/admin/planes',
        },
    ];

    return (
        <>
            <Head title={__('Planes & Precios - Metodología Promocional')} />

            <div className="space-y-6 pb-12">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header Principal */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-700/50">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" />
                                {__('Metodología Google / SaaS')}
                            </span>
                            <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                {__('Super Admin')}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            {__('Gestión de Planes & Tarifas Promocionales')}
                        </h1>
                        <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                            {__('Configura el costo real de tus planes, precios promocionales por tiempo limitado, duración de la oferta y transición automática a tarifa regular.')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Selector de vista */}
                        <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('cards')}
                                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                                    viewMode === 'cards'
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                                title={__('Vista en Tarjetas')}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                <span className="hidden sm:inline">{__('Tarjetas')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                                    viewMode === 'table'
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                                title={__('Vista en Tabla')}
                            >
                                <TableIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">{__('Tabla')}</span>
                            </button>
                        </div>

                        <Button
                            onClick={handleOpenCreate}
                            className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/30 font-semibold gap-2 transition-transform active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            {__('Nuevo Plan')}
                        </Button>
                    </div>
                </div>

                {/* Métricas / Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold text-lg">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{__('Total de Planes')}</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalPlanes}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold text-lg">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{__('Planes Activos')}</p>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.planesActivos}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center font-bold text-lg">
                            <Flame className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{__('Con Oferta Activa')}</p>
                            <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{stats.planesConPromo}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold text-lg">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{__('Empresas Suscritas')}</p>
                            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{stats.totalSuscripciones}</p>
                        </div>
                    </div>
                </div>

                {/* Banner Explicativo de la Metodología */}
                <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-800/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shrink-0">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                            <strong className="text-slate-900 dark:text-white block text-sm sm:text-base font-bold">
                                {__('¿Cómo opera la metodología de precios introductorios?')}
                            </strong>
                            {__('Al registrarse, el cliente abona la tarifa con descuento por el tiempo definido (ej. 3 o 6 meses). Al concluir ese periodo, el sistema pasa a cobrar de forma transparente el monto real configurado en "Precio Regular".')}
                        </div>
                    </div>
                </div>

                {/* Vista en Tarjetas */}
                {viewMode === 'cards' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {planes.map((plan) => {
                            const isFree = Number(plan.precio_regular_mensual) === 0 && Number(plan.precio_promocional_mensual) === 0 && Number(plan.precio_3_meses) === 0;
                            const precioReg = Number(plan.precio_regular_mensual) || (Number(plan.precio_3_meses) > 0 ? Math.round(Number(plan.precio_3_meses) / 3) : 0);
                            const precioPromo = Number(plan.precio_promocional_mensual) || precioReg;
                            const tienePromo = Boolean(plan.tiene_promocion) && precioPromo < precioReg && precioPromo > 0;
                            const porcentajeAhorro = precioReg > 0 ? Math.round(((precioReg - precioPromo) / precioReg) * 100) : 0;

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 hover:shadow-xl ${
                                        plan.destacado
                                            ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-lg'
                                            : 'border-slate-200 dark:border-slate-800 shadow-sm'
                                    } ${!plan.activo ? 'opacity-60 grayscale-[30%]' : ''}`}
                                >
                                    {/* Badge Superior Destacado */}
                                    {plan.destacado && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-extrabold uppercase tracking-wider py-0.5 px-3 rounded-full shadow-md flex items-center gap-1">
                                            <Flame className="w-3.5 h-3.5" />
                                            {__('Más Recomendado')}
                                        </div>
                                    )}

                                    {/* Cabecera de la Tarjeta */}
                                    <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <Badge variant={plan.activo ? 'default' : 'secondary'} className="text-[10px] font-semibold">
                                                {plan.activo ? __('Activo') : __('Inactivo')}
                                            </Badge>
                                            <span className="text-[11px] text-slate-400 font-mono">
                                                {__('Orden')} #{plan.orden || plan.id}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                            {plan.nombre}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px] line-clamp-2 leading-relaxed">
                                            {plan.descripcion || __('Plan de suscripción para empresas en FixSale.')}
                                        </p>
                                    </div>

                                    {/* Sección de Precios y Oferta */}
                                    <div className="p-5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                                        {isFree ? (
                                            <div>
                                                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                                    {__('Gratis')}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1 font-medium">
                                                    {__('Sin tarjeta de crédito requerida')}
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                {tienePromo && (
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-semibold text-slate-400 line-through">
                                                            {currencySymbol}{precioReg}
                                                        </span>
                                                        <span className="bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-red-500/20">
                                                            -{porcentajeAhorro}% OFF
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                                                        {currencySymbol}{tienePromo ? precioPromo : precioReg}
                                                    </span>
                                                    <span className="text-xs font-semibold text-slate-500">
                                                        {__('MXN / mes')}
                                                    </span>
                                                </div>

                                                {/* Leyenda Transparente */}
                                                {tienePromo ? (
                                                    <div className="mt-2.5 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg text-[11px] text-orange-800 dark:text-orange-300 leading-snug">
                                                        <div className="font-bold flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5 shrink-0" />
                                                            {plan.badge_promocion || `${porcentajeAhorro}% DTO por ${plan.meses_duracion_promocion || 3} meses`}
                                                        </div>
                                                        <span className="text-[10px] text-slate-600 dark:text-slate-400 block mt-0.5">
                                                            {__('Luego renovación normal a')} <strong>{currencySymbol}{precioReg} MXN/mes</strong>
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                                                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                                                        {__('Tarifa estándar de renovación')}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Características del Plan */}
                                    <div className="p-5 space-y-3 flex-1 text-xs text-slate-600 dark:text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span>
                                                <strong>{plan.sucursales_incluidas || 1}</strong> {__('Sucursal(es) incluida(s)')}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span>
                                                {__('Sucursal extra:')} <strong>{currencySymbol}{plan.precio_sucursal_extra_mensual || 20} MXN/mes</strong>
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span>
                                                <strong>{plan.subscriptions_count || 0}</strong> {__('empresas activas')}
                                            </span>
                                        </div>

                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <p className="text-[11px] font-bold text-slate-500 mb-1">{__('Ciclos de Facturación:')}</p>
                                            <div className="grid grid-cols-3 gap-1 text-[10px] text-center font-mono">
                                                <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded">
                                                    3M: {currencySymbol}{plan.precio_3_meses}
                                                </div>
                                                <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded">
                                                    6M: {currencySymbol}{plan.precio_6_meses}
                                                </div>
                                                <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded">
                                                    12M: {currencySymbol}{plan.precio_12_meses}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botones de Control y Switch Rápido */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl space-y-3">
                                        <div className="flex items-center justify-between text-xs font-medium">
                                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                                <Flame className={`w-3.5 h-3.5 ${plan.tiene_promocion ? 'text-orange-500' : 'text-slate-400'}`} />
                                                {__('Oferta Activa')}
                                            </span>
                                            <Switch
                                                checked={Boolean(plan.tiene_promocion)}
                                                onCheckedChange={(checked) => handleQuickTogglePromo(plan.id, { stopPropagation: () => {} } as any)}
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleOpenEdit(plan)}
                                                className="flex-1 text-xs gap-1"
                                            >
                                                <Edit className="w-3.5 h-3.5 text-blue-500" />
                                                {__('Editar')}
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => handleDeletePlan(plan, e)}
                                                className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-2"
                                                title={__('Eliminar / Desactivar')}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Vista en Tabla */}
                {viewMode === 'table' && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    <tr>
                                        <th className="py-3 px-4">{__('Orden')}</th>
                                        <th className="py-3 px-4">{__('Plan & Descripción')}</th>
                                        <th className="py-3 px-4">{__('Precio Regular')}</th>
                                        <th className="py-3 px-4">{__('Precio Promo')}</th>
                                        <th className="py-3 px-4">{__('Duración Promo')}</th>
                                        <th className="py-3 px-4">{__('Sucursales')}</th>
                                        <th className="py-3 px-4">{__('Empresas')}</th>
                                        <th className="py-3 px-4 text-center">{__('Promoción')}</th>
                                        <th className="py-3 px-4 text-center">{__('Estado')}</th>
                                        <th className="py-3 px-4 text-right">{__('Acciones')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm">
                                    {planes.map((plan) => (
                                        <tr key={plan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-3 px-4 font-mono font-bold text-slate-400">
                                                #{plan.orden || plan.id}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {plan.nombre}
                                                    </span>
                                                    {plan.destacado && (
                                                        <Badge className="bg-orange-500 text-white text-[9px] py-0 px-1.5">
                                                            {__('Recomendado')}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 line-clamp-1 max-w-xs">
                                                    {plan.descripcion || __('Sin descripción')}
                                                </p>
                                            </td>
                                            <td className="py-3 px-4 font-semibold text-slate-500">
                                                {currencySymbol}{plan.precio_regular_mensual || Math.round(plan.precio_3_meses / 3)} /mes
                                            </td>
                                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                                                {plan.tiene_promocion ? (
                                                    <span className="text-orange-600 dark:text-orange-400">
                                                        {currencySymbol}{plan.precio_promocional_mensual || Math.round(plan.precio_3_meses / 3)} /mes
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">{__('Sin promo')}</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                {plan.tiene_promocion ? (
                                                    <Badge variant="outline" className="text-xs font-semibold text-orange-600 border-orange-300">
                                                        {plan.meses_duracion_promocion || 3} {__('meses')}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                {plan.sucursales_incluidas || 1} {__('incluidas')}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="secondary" className="font-bold font-mono">
                                                    {plan.subscriptions_count || 0}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Switch
                                                    checked={Boolean(plan.tiene_promocion)}
                                                    onCheckedChange={(checked) => handleQuickTogglePromo(plan.id, { stopPropagation: () => {} } as any)}
                                                />
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Switch
                                                    checked={Boolean(plan.activo)}
                                                    onCheckedChange={(checked) => handleQuickToggleStatus(plan.id, { stopPropagation: () => {} } as any)}
                                                />
                                            </td>
                                            <td className="py-3 px-4 text-right space-x-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenEdit(plan)}
                                                    className="h-8 w-8 p-0"
                                                    title={__('Editar Plan')}
                                                >
                                                    <Edit className="w-4 h-4 text-blue-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => handleDeletePlan(plan, e)}
                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                    title={__('Eliminar Plan')}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Creación / Edición de Plan */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <Sparkles className="w-5 h-5 text-orange-500" />
                            {editingPlan ? __('Editar Plan de Suscripción') : __('Crear Nuevo Plan de Suscripción')}
                        </DialogTitle>
                        <DialogDescription>
                            {__('Configura los precios regulares, tarifas promocionales con duración por tiempo limitado y módulos incluidos.')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSavePlan} className="space-y-6 pt-2">
                        {/* 1. Datos Básicos */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2 space-y-1.5">
                                <Label htmlFor="plan_nombre" className="required font-semibold">{__('Nombre del Plan')}</Label>
                                <Input
                                    id="plan_nombre"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder="Ej: Plan Trimestral / Plan Crecimiento"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="plan_orden" className="font-semibold">{__('Orden de Aparición')}</Label>
                                <Input
                                    id="plan_orden"
                                    type="number"
                                    value={formData.orden}
                                    onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
                                    min="0"
                                />
                            </div>

                            <div className="sm:col-span-3 space-y-1.5">
                                <Label htmlFor="plan_descripcion" className="font-semibold">{__('Descripción Comercial')}</Label>
                                <Textarea
                                    id="plan_descripcion"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    placeholder={__('Describe el valor principal del plan para tus clientes...')}
                                    rows={2}
                                />
                            </div>
                        </div>

                        {/* 2. Sección de Metodología de Precios (Google / SaaS) */}
                        <div className="bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-slate-500/5 border border-orange-500/20 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-orange-500 text-white rounded-lg">
                                        <Flame className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                                            {__('Estrategia de Precio Promocional (Tiempo Limitado)')}
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            {__('Define una tarifa de oferta para nuevos clientes y el precio real al que renovarán.')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Label htmlFor="toggle_promo" className="text-xs font-semibold cursor-pointer">
                                        {formData.tiene_promocion ? __('Promoción Activada') : __('Sin Promoción')}
                                    </Label>
                                    <Switch
                                        id="toggle_promo"
                                        checked={formData.tiene_promocion}
                                        onCheckedChange={(checked) => setFormData({ ...formData, tiene_promocion: checked })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-orange-500/10">
                                <div className="space-y-1.5">
                                    <Label htmlFor="precio_regular" className="required text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {__('Precio Regular (Costo Real / Mes)')}
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">{currencySymbol}</span>
                                        <Input
                                            id="precio_regular"
                                            type="number"
                                            step="0.01"
                                            value={formData.precio_regular_mensual}
                                            onChange={(e) => handlePrecioRegularChange(parseFloat(e.target.value) || 0)}
                                            className="pl-7 font-bold"
                                            required
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-400 block">{__('Monto que pagará tras expirar la promo.')}</span>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="precio_promo" className="text-xs font-bold text-orange-600 dark:text-orange-400">
                                        {__('Precio Promocional (/ Mes)')}
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-xs text-orange-500 font-bold">{currencySymbol}</span>
                                        <Input
                                            id="precio_promo"
                                            type="number"
                                            step="0.01"
                                            disabled={!formData.tiene_promocion}
                                            value={formData.precio_promocional_mensual}
                                            onChange={(e) => handlePrecioPromoChange(parseFloat(e.target.value) || 0)}
                                            className="pl-7 font-black text-orange-600 border-orange-300 dark:border-orange-500/40"
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-400 block">{__('Monto que paga durante los primeros meses.')}</span>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="duracion_promo" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {__('Duración de la Oferta')}
                                    </Label>
                                    <select
                                        id="duracion_promo"
                                        disabled={!formData.tiene_promocion}
                                        value={formData.meses_duracion_promocion}
                                        onChange={(e) => setFormData({ ...formData, meses_duracion_promocion: parseInt(e.target.value) || 3 })}
                                        className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value={1}>{__('Por el 1er Mes')}</option>
                                        <option value={3}>{__('Por los primeros 3 Meses (Trimestre)')}</option>
                                        <option value={6}>{__('Por los primeros 6 Meses (Semestre)')}</option>
                                        <option value={12}>{__('Por el primer Año (12 Meses)')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="badge_promo" className="text-xs font-semibold">{__('Texto de la Etiqueta / Badge Promocional')}</Label>
                                <Input
                                    id="badge_promo"
                                    disabled={!formData.tiene_promocion}
                                    value={formData.badge_promocion}
                                    onChange={(e) => setFormData({ ...formData, badge_promocion: e.target.value })}
                                    placeholder="Ej: 50% OFF Primer Trimestre / Oferta de Lanzamiento"
                                    className="text-xs"
                                />
                            </div>

                            {/* Resumen dinámico del Ahorro */}
                            {formData.tiene_promocion && calcularPorcentajeDescuento() > 0 && (
                                <div className="p-3 bg-white dark:bg-slate-900 border border-orange-500/30 rounded-xl flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-orange-500 text-white font-bold">
                                            {calcularPorcentajeDescuento()}% {__('de Ahorro')}
                                        </Badge>
                                        <span className="text-slate-600 dark:text-slate-300">
                                            {__('El cliente ahorra')} <strong>{currencySymbol}{calcularAhorroTotalPromo()} MXN</strong> {__('en sus primeros')} {formData.meses_duracion_promocion} {__('meses')}.
                                        </span>
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {__('Luego:')} {currencySymbol}{formData.precio_regular_mensual}/mes
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* 3. Facturación por Ciclos y Sucursales */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                                <h5 className="text-xs font-bold uppercase text-slate-500">{__('Precios Totales Facturados por Ciclo')}</h5>
                                
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center justify-between gap-2">
                                        <Label htmlFor="precio_3m">{__('Cobro 3 Meses:')}</Label>
                                        <div className="w-32 relative">
                                            <span className="absolute left-2.5 top-2 text-xs text-slate-400">{currencySymbol}</span>
                                            <Input
                                                id="precio_3m"
                                                type="number"
                                                step="0.01"
                                                value={formData.precio_3_meses}
                                                onChange={(e) => setFormData({ ...formData, precio_3_meses: parseFloat(e.target.value) || 0 })}
                                                className="pl-6 h-8 text-xs font-semibold text-right"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                        <Label htmlFor="precio_6m">{__('Cobro 6 Meses:')}</Label>
                                        <div className="w-32 relative">
                                            <span className="absolute left-2.5 top-2 text-xs text-slate-400">{currencySymbol}</span>
                                            <Input
                                                id="precio_6m"
                                                type="number"
                                                step="0.01"
                                                value={formData.precio_6_meses}
                                                onChange={(e) => setFormData({ ...formData, precio_6_meses: parseFloat(e.target.value) || 0 })}
                                                className="pl-6 h-8 text-xs font-semibold text-right"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                        <Label htmlFor="precio_12m">{__('Cobro 12 Meses (Anual):')}</Label>
                                        <div className="w-32 relative">
                                            <span className="absolute left-2.5 top-2 text-xs text-slate-400">{currencySymbol}</span>
                                            <Input
                                                id="precio_12m"
                                                type="number"
                                                step="0.01"
                                                value={formData.precio_12_meses}
                                                onChange={(e) => setFormData({ ...formData, precio_12_meses: parseFloat(e.target.value) || 0 })}
                                                className="pl-6 h-8 text-xs font-semibold text-right"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                                <h5 className="text-xs font-bold uppercase text-slate-500">{__('Configuración de Sucursales')}</h5>

                                <div className="space-y-2 text-xs">
                                    <div className="space-y-1">
                                        <Label htmlFor="sucursales_incluidas">{__('Sucursales Incluidas en el Plan')}</Label>
                                        <Input
                                            id="sucursales_incluidas"
                                            type="number"
                                            min="1"
                                            value={formData.sucursales_incluidas}
                                            onChange={(e) => setFormData({ ...formData, sucursales_incluidas: parseInt(e.target.value) || 1 })}
                                            className="h-8 text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="precio_sucursal_extra">{__('Costo Sucursal Extra (Mensual)')}</Label>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-2 text-xs text-slate-400">{currencySymbol}</span>
                                            <Input
                                                id="precio_sucursal_extra"
                                                type="number"
                                                step="0.01"
                                                value={formData.precio_sucursal_extra_mensual}
                                                onChange={(e) => setFormData({ ...formData, precio_sucursal_extra_mensual: parseFloat(e.target.value) || 0 })}
                                                className="pl-6 h-8 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Módulos Incluidos */}
                        <div className="space-y-2">
                            <Label className="font-semibold text-xs">{__('Módulos Habilitados en este Plan')}</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/50">
                                {MODULOS_DISPONIBLES.map((mod) => {
                                    const isSelected = formData.modulos_incluidos?.includes(mod.id) || (formData.modulos_incluidos?.includes('todos') && mod.id !== 'todos');
                                    return (
                                        <button
                                            type="button"
                                            key={mod.id}
                                            onClick={() => handleToggleModulo(mod.id)}
                                            className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-left transition-colors ${
                                                isSelected || formData.modulos_incluidos?.includes(mod.id)
                                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                                    : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-transparent'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                                                isSelected || formData.modulos_incluidos?.includes(mod.id)
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'border-slate-300 dark:border-slate-700'
                                            }`}>
                                                {(isSelected || formData.modulos_incluidos?.includes(mod.id)) && <Check className="w-3 h-3" />}
                                            </div>
                                            <span>{mod.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 5. Switches de Estado */}
                        <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="plan_destacado"
                                        checked={formData.destacado}
                                        onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                                    />
                                    <Label htmlFor="plan_destacado" className="text-xs font-bold cursor-pointer flex items-center gap-1">
                                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                                        {__('Marcar como Más Recomendado')}
                                    </Label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="plan_activo"
                                        checked={formData.activo}
                                        onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                                    />
                                    <Label htmlFor="plan_activo" className="text-xs font-bold cursor-pointer">
                                        {__('Plan Activo')}
                                    </Label>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-2 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                disabled={isSubmitting}
                            >
                                {__('Cancelar')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                            >
                                {isSubmitting ? __('Guardando...') : (editingPlan ? __('Guardar Cambios') : __('Crear Plan'))}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
